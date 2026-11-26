-----

| Title     | LM Deploy Sizing                                      |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T15:38:49Z`                                |
| Updated @ | `2026-11-26T15:38:49Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/844) |

-----

# Sizing

大模型部署的资源规划：权重、KV Cache 和开销的显存估算，吞吐与延迟估算，并发容量，以及硬件选型的方法。所有结论都配可计算的公式和示例。

## 显存估算

推理时的显存由三部分组成：

$$ M\_{total}\\approx\\underbrace{N\\cdot
b\_w}*{\\text{权重}}+\\underbrace{B\\cdot
S\\cdot\\text{KV}*{token}}*{\\text{KV
Cache}}+\\underbrace{M*{act}+M\_{buf}}\_{\\text{激活与缓冲}} $$

其中：

  - $N$：参数量；$b\_w$：每个权重的字节数：BF16/FP16 为 $2$，FP8/INT8 为 $1$，INT4 约 $0.5$
    (含缩放因子实际约 $0.55\\sim0.6$)
  - $B$：同时服务的序列数 (并发)；$S$：序列的平均最大长度 (提示词 + 输出)；$\\text{KV}\_{token}$：每
    token 的 KV 字节数，公式见 [Basics](@@IBAS@@)
  - $M\_{act}+M\_{buf}$：激活、CUDA 上下文、框架缓冲，推理时占比较小，保守按总量的 $10%\\sim20%$ 预留
  - 框架会预先划出一定比例的显存 (如 vLLM 的 `--gpu-memory-utilization 0.9`) 作为 KV Cache
    池，剩余的才是可用于并发的空间

## 示例：Llama 3 8B

假设显存 24 GB，BF16 部署：

  - 权重：$8.03\\times10^9\\times2\\approx16.1$ GB
  - 可用于 KV 的显存：$24\\times0.9-16.1-\\text{开销}\\approx4$ GB (保守)
  - $\\text{KV}\_{token}=128$ KB (GQA，见 [Basics](@@IBAS@@))，所以可容纳 token
    总数 $\\approx4\\times10^9/131072\\approx30{,}000$
  - 平均每个请求 $2000$ token (提示 + 输出) 时，最多约 $15$ 个并发；若改 INT4 权重 (约 $4.7$
    GB)，KV 可用显存增加到约 $15$ GB，并发约 $55$

下表对比不同精度下 8B 模型的显存：

| 精度       | 权重      | 在 24 GB 卡上剩余给 KV 的空间 (约) | 约可容纳 token 数 |
| -------- | ------- | ------------------------ | ------------ |
| BF16     | 16.1 GB | 4 GB                     | 3 万          |
| INT8/FP8 | 8.0 GB  | 12 GB                    | 9 万          |
| INT4     | 4.7 GB  | 15 GB                    | 11 万         |

表中：剩余空间按 $24\\times0.9=21.6$ GB 再减去权重和约 $1.5$ GB 的开销估算，token 数 $=$ 空间
$/128\\text{ KB}$。量化带来的价值不止是放得下模型，更是腾出显存给 KV 以提高并发，见
[量化](/0312_MO_Quantization)。

## 吞吐与延迟估算

$$ \\text{TPOT}\\approx\\frac{N\\cdot b\_w+B\\cdot
S\\cdot\\text{KV}*{token}}{\\text{BW}*{mem}\\cdot\\eta},\\qquad
\\text{吞吐}\\approx\\frac{B}{\\text{TPOT}} $$

其中：

  - 分子是每个 decode 步要读的总字节数 (权重读一次，所有序列的 KV
    都要读)；$\\text{BW}\_{mem}$：显存带宽；$\\eta$：带宽利用率，实际一般为
    $0.6\\sim0.8$ `[经验]`
  - $B$：batch (并发)；系统吞吐是每步产出 $B$ 个 token 除以步时间
  - 例：8B BF16、$B=16$、$S=2000$、带宽 $1$ TB/s、$\\eta=0.7$：读取字节
    $\\approx16.1+16\\times2000\\times131072/10^9\\approx16.1+4.2=20.3$
    GB，TPOT $\\approx20.3/700\\approx29$ ms，吞吐
    $\\approx16/0.029\\approx550$ tokens/s
  - Prefill 的时间约为 $\\dfrac{2N\\cdot
    n\_{prompt}}{\\text{FLOPs}*{peak}\\cdot\\text{MFU}}$，$n*{prompt}$
    为提示词 token 数；例：$2000$ token 提示、$8\\times10^9$ 参数，算力 $100$
    TFLOPs 有效：$\\approx0.32$ s，即 TTFT 约 $0.3$ s

## 并发容量规划

步骤：

1.  确定流量：峰值 QPS $\\lambda$，平均输入 $n\_{in}$、输出 $n\_{out}$ token 数
2.  估算每请求时长 $T\_{req}\\approx\\text{TTFT}+n\_{out}\\cdot\\text{TPOT}$
3.  由 Little 定律得到并发数：$B=\\lambda\\cdot T\_{req}$
4.  检查 $B$ 个并发的 KV 显存是否放得下，否则增加卡数或压缩 KV
5.  检查 TPOT 是否仍满足 SLO (并发增大使 TPOT 增大)，否则增加副本

$$ B=\\lambda\\cdot T\_{req} $$

其中：

  - $\\lambda$：请求到达率 (req/s)
  - $T\_{req}$：单个请求从到达到结束的时间 (s)
  - $B$：系统中同时在处理的请求数，这个关系称为 Little 定律，与到达分布无关

例：$\\lambda=5$ req/s，$n\_{out}=300$，TPOT $=30$ ms，TTFT $=0.3$
s：$T\_{req}=0.3+300\\times0.03=9.3$ s，$B=46.5\\approx47$
个并发；这个数量超过上面单卡 8B BF16 的 $15$ 个并发，需要
$3\\sim4$ 张卡的副本，或改用 INT4。

## 示例：70B 模型

以 Llama 3.1 70B
($L=80$，$n\_{kv}=8$，$d\_h=128$，$\\text{KV}\_{token}=2\\times80\\times8\\times128\\times2=320$
KB) 部署在 80 GB、带宽 $2$ TB/s 的 GPU 上，每个请求平均 $2000$ token：

| 方案            | 权重                | 卡数 | KV 可用空间 (约)               | 可容纳 token | 并发 (约) | TPOT 下界 (约)     |
| ------------- | ----------------- | -- | ------------------------- | --------- | ------ | --------------- |
| BF16，TP=2     | $141$ GB          | 2  | $144-141-3\\approx0$ GB   | \-        | 放不下    | \-              |
| BF16，TP=4     | $141$ GB          | 4  | $288-141-6\\approx141$ GB | $43$ 万    | $215$  | $\\approx25$ ms |
| FP8，TP=2      | $70.5$ GB         | 2  | $144-70.5-4\\approx70$ GB | $21$ 万    | $106$  | $\\approx25$ ms |
| INT4 (AWQ)，单卡 | $\\approx38.5$ GB | 1  | $72-38.5-2\\approx31$ GB  | $9.5$ 万   | $47$   | $\\approx28$ ms |

表中：`KV 可用空间` = 卡数 × $80\\times0.9$ GB − 权重 − 开销；`可容纳 token` = 空间 $/320$
KB；`并发` = token 数 $/2000$；`TPOT 下界` 只计权重读取：每卡要读的权重字节数除以 $2\\
\\text{TB/s}\\times0.7$ 的有效带宽，未计 KV 读取和张量并行的通信 (通信估算见
[Parallel](@@IPAR@@))。BF16 用 2 卡时权重占满显存，KV 没有空间，所以 70B BF16 至少要 4 卡；INT4
单卡就能跑，但并发和速度都受限。具体选哪种要结合精度要求：INT4 是否满足质量要用评测回归确认，见 [Eval](@@TEVAL@@)。

## 示例：CPU 部署

CPU 推理同样由内存带宽决定 decode 速度：

$$ \\text{BW}*{mem}=n*{ch}\\times f\\times8\\ \\text{字节},\\qquad
\\text{tokens/s}\\le\\frac{\\eta\\cdot\\text{BW}\_{mem}}{N\\cdot b\_w}
$$

其中：

  - $n\_{ch}$：每路 CPU 的内存通道数；$f$：内存的传输速率 (MT/s)；$8$：每通道 $64$ bit 即 $8$ 字节
  - $\\eta$：实际可达的带宽比例，CPU 上一般 $0.6\\sim0.8$ `[经验]`；$N\\cdot b\_w$：权重字节数
  - 两路服务器跨 NUMA 访问会降低有效带宽，通常每个推理进程绑定在一个 NUMA 节点上

| 配置              | 理论带宽 (单路)                               | 8B INT4 ($4.7$ GB) | 8B BF16 ($16$ GB) |
| --------------- | --------------------------------------- | ------------------ | ----------------- |
| 8 通道 DDR5-4800  | $8\\times4800\\times8\\approx307$ GB/s  | $\\le46$ tokens/s  | $\\le13$ tokens/s |
| 12 通道 DDR5-6400 | $12\\times6400\\times8\\approx614$ GB/s | $\\le91$ tokens/s  | $\\le27$ tokens/s |

表中：tokens/s 是单请求 decode 的上限，按 $\\eta=0.7$ 计算；作为对比，同样的 8B INT4 在 $2$ TB/s
的 GPU 上上限约 $300$ tokens/s。CPU 的优势是内存容量 (数百 GB 到 TB)
和成本，适合小并发、低成本或数据不能出机房的场景；prefill
依赖 AMX 等矩阵加速指令，长提示词的 TTFT 会明显高于 GPU。CPU 调优见 [CPU](@@ICPU@@)，Intel 平台的部署见
[OpenVINO](@@DOV@@)。

## 硬件选型

| 硬件类型                   | 显存/带宽特点                                      | 适合                    |
| ---------------------- | -------------------------------------------- | --------------------- |
| 数据中心 GPU (A100/H100 等) | 40~~80 GB HBM，带宽 2~~3+ TB/s                  | 大模型、高并发               |
| 消费级 GPU                | 16~~24 GB，带宽约 0.5~~1 TB/s                    | 7B\~14B 量化模型、开发测试     |
| 服务器 CPU (Xeon)         | 内存容量大但带宽低 (单路约 $0.3\\sim0.6$ TB/s 理论峰值，见上一节) | 小批量、成本敏感、量化模型         |
| Intel GPU / NPU        | 视型号                                          | 见 [OpenVINO](@@DOV@@) |

表中：decode 速度主要由带宽决定，因此 CPU 的 tokens/s 上限远低于 HBM 显卡；但 CPU
内存容量大，可以放下很大的模型和
KV。选型时先用显存公式确认放得下，再用带宽公式估算速度。

## 成本

$$ \\text{每百万 token 成本}=\\frac{P\_{hour}\\cdot
n\_{gpu}}{\\text{吞吐}\\cdot3600\\cdot u}\\times10^6 $$

其中：

  - $P\_{hour}$：每张卡每小时的费用 (租用价，或购置成本按使用年限折算到每小时再加电费)；$n\_{gpu}$：卡数

  - 吞吐：系统的输出 tokens/s (满载时)；$3600$：换算为每小时；$u$：平均利用率，流量有峰谷时远低于 $1$

  - 例：单卡每小时 $2，吞吐 $550$ tokens/s (见上文 8B 示例)，利用率
    $50%$：$\\frac{2}{550\\times3600\\times0.5}\\times10^6\\approx2.0$
    美元/百万 token；把吞吐翻倍或利用率提高到 $100%$ 都能把成本减半

  - 提高吞吐 (更大 batch、量化、投机解码) 是降低成本最直接的手段

  - 使用率：流量有峰谷，用自动扩缩容 (见 [Service](@@DSVC@@)) 避免长期闲置

## Reference

  - [Efficient Memory Management for Large Language Model Serving with
    PagedAttention](https://arxiv.org/abs/2309.06180)
  - [LLM Inference Performance Engineering: Best Practices -
    Databricks](https://www.databricks.com/blog/llm-inference-performance-engineering-best-practices)
  - [Transformer Inference Arithmetic -
    kipply](https://kipp.ly/transformer-inference-arithmetic/)
  - [Little's law -
    Wikipedia](https://en.wikipedia.org/wiki/Little%27s_law)
