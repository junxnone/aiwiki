-----

| Title     | LM Infer Basics                                       |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T15:36:35Z`                                |
| Updated @ | `2026-11-26T15:42:26Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/834) |

-----

# Basics

大模型推理的基本原理：为什么 decode 受显存带宽限制，KV Cache 占多少显存，延迟和吞吐指标怎么定义，以及它们之间的关系。

## 算术强度与 Roofline

一个运算受算力还是带宽限制，取决于它的算术强度 (每读写 1 字节做多少次浮点运算)：

$$ I=\\frac{\\text{FLOPs}}{\\text{Bytes}},\\qquad
I\_{ridge}=\\frac{\\text{FLOPs}*{peak}}{\\text{BW}*{mem}},\\qquad
\\text{性能}\\le\\min\\bigl(\\text{FLOPs}*{peak},\\
I\\cdot\\text{BW}*{mem}\\bigr) $$

其中：

  - $I$：算术强度，单位
    FLOP/Byte；$\\text{FLOPs}*{peak}$：硬件峰值算力；$\\text{BW}*{mem}$：显存带宽
  - $I\_{ridge}$：「屋脊点」，$I\<I\_{ridge}$ 时受带宽限制
    (memory-bound)，$I\>I\_{ridge}$ 时受算力限制 (compute-bound)
  - 例：A100 (BF16 $312$ TFLOPs，显存带宽约 $2$ TB/s，$I\_{ridge}\\approx156$
    FLOP/Byte)；$H100$ 约 $295$ `[待核实]`

Decode 阶段，batch 为 $B$ 时：每步每个参数读一次 ($2$ 字节 BF16)，做 $2B$ 次浮点运算，算术强度约为：

$$ I\_{decode}\\approx\\frac{2BN}{2N}=B\\ \\text{FLOP/Byte} $$

其中：

  - $N$：参数量；分子 $2BN$ 是 $B$ 个序列各做一次前向的 FLOPs，分母 $2N$ 是读一遍 BF16 权重的字节数
    (权重只读一次，被 batch 内所有序列共享)
  - $B=1$ 时只有 $1$ FLOP/Byte，远低于屋脊点
    ($\\sim150$)，算力基本闲置，速度完全由读权重的带宽决定；要提高利用率，必须增大
    batch (同时服务更多请求)
  - Prefill 一次处理 $n$ 个 token，强度约为 $n$，所以长提示词的 prefill 是 compute-bound

**decode 的临界 batch**：令 $I\_{decode}=I\_{ridge}$，仅计权重时临界 batch 约为
$B^\\ast\\approx I\_{ridge}$ (A100 BF16 约 $156$，H100 约 $295$)；低于它时，增大
batch 几乎不增加每步时间，吞吐近似线性增长；超过它后进入 compute-bound，每步时间随 batch 线性增加，吞吐不再增长。计入
KV Cache 后，每个序列还要额外读自己的 KV，分母变为 $2N+B\\cdot
S\\cdot\\text{KV}\_{token}$，强度上不去：

$$ I\_{decode}\\approx\\frac{2BN}{2N+B,S,\\text{KV}*{token}}\\
\\xrightarrow{B\\to\\infty}\\ \\frac{2N}{S,\\text{KV}*{token}} $$

其中：

  - $S$：序列长度；$\\text{KV}\_{token}$：每 token 的 KV 字节数 (见下一节)
  - $B\\to\\infty$ 时强度趋于上限
    $\\frac{2N}{S,\\text{KV}\_{token}}$，只由模型和序列长度决定

例：Llama 3
8B、$S=8192$：$\\frac{2\\times8\\times10^9}{8192\\times131072}\\approx15$，即长上下文下
decode 的强度最多约 $15$，无论 batch 多大都是
memory-bound，这正是长上下文推理昂贵的原因。注意力部分本身的强度只有
$O(1)$，见 [Attention](/0839_LM_Infer_Attention)。

## 单请求速度上限

$$ \\text{TPOT}\\ge\\frac{\\text{权重字节数}+\\text{KV
字节数}}{\\text{BW}*{mem}},\\qquad
\\text{tokens/s}\\le\\frac{\\text{BW}*{mem}}{\\text{权重字节数}}\\ (\\text{忽略
KV}) $$

其中：

  - 每生成一个 token 都要把全部权重 (和 KV Cache) 从显存读一遍，所以时间下界是总字节数除以带宽
  - 例：Llama 3 8B BF16 权重 $16$ GB，显存带宽 $1$ TB/s (如一张消费级
    GPU)：$\\text{tokens/s}\\le1000/16\\approx62$；4-bit 量化后权重约 $4.5$
    GB，上限提高到约 $220$ tokens/s，这就是量化 (见 [量化](/0312_MO_Quantization)) 能加速
    decode 的原因：减少读取的字节数

## KV Cache

自注意力需要之前所有 token 的 $K,V$。缓存它们可避免重复计算，但每个 token 都要存一份：

$$ \\text{KV}*{token}=2\\cdot L\\cdot n*{kv}\\cdot d\_h\\cdot b,\\qquad
\\text{KV}*{total}=\\text{KV}*{token}\\cdot S\\cdot B $$

其中：

  - $2$：K 和 V 两份；$L$：层数；$n\_{kv}$：KV 头数 (GQA
    时小于注意力头数)；$d\_h$：头维度；$b$：每个元素的字节数
    (BF16 为 $2$)
  - $S$：序列长度 (提示词 + 已生成)；$B$：同时服务的序列数 (并发)
  - 例：Llama 2 7B
    ($L=32,n\_{kv}=32,d\_h=128$)：$2\\times32\\times32\\times128\\times2=524{,}288$
    字节 $=0.5$ MB/token，$S=4096$ 时单序列 $2$ GB；Llama 3 8B
    ($n\_{kv}=8$)：$128$ KB/token，$S=8192$ 时约 $1$ GB；Llama 2 70B
    ($L=80,n\_{kv}=8$)：$320$ KB/token
  - 结论：并发和上下文一长，KV Cache 往往比权重还大，成为并发上限的主要因素；GQA、KV 量化 (见
    [KVCache](/0708_MO_Quantization_KVCache)) 和 PagedAttention (见
    [Optimization](/0835_LM_Infer_Optimization)) 都是为了缓解它

## 延迟与吞吐指标

下图展示一次请求的时间线，标出各指标的位置：

``` mermaid
gantt
    title 一次请求的时间线
    dateFormat X
    axisFormat %s
    section 排队
    等待调度 queue :a, 0, 2
    section 首 token
    prefill (TTFT) :b, 2, 6
    section 生成
    decode token 2 :c1, 6, 7
    decode token 3 :c2, 7, 8
    decode token 4 :c3, 8, 9
```

图中：

  - 横轴是时间，每个条是一个阶段：先排队，再 prefill (直到产生第一个 token 为止)，之后每个 decode 步产生一个
    token
  - 排队 + prefill 的总时间是首 token 延迟 TTFT；之后相邻 token 的间隔是 TPOT

$$ \\text{端到端延迟}=\\text{TTFT}+(n\_{out}-1)\\cdot\\text{TPOT},\\qquad
\\text{吞吐}=\\frac{\\text{总输出 token 数}}{\\text{总时间}} $$

其中：

  - TTFT (Time To First Token)：首 token 延迟，影响「响应快不快」，受提示词长度和排队影响
  - TPOT (Time Per Output Token)：每个输出 token 的间隔，决定「打字速度」，人阅读约 $5\\sim8$
    tokens/s 即够用 `[经验]`
  - $n\_{out}$：输出 token 数；吞吐指标：tokens/s (系统整体) 和 req/s
  - 延迟与吞吐此消彼长：增大 batch 提高系统吞吐，但每个请求的 TPOT 会变大；服务要在 SLO (如 TTFT $\<1$
    s，TPOT $\<50$ ms) 内最大化吞吐，也叫 goodput

指标定义和测量方法的补充见 [LLM Metrics](/0503_LM_LLMs_Metrics)。

## 小结

  - Decode 受带宽限制 → 量化、增大 batch、投机解码有效
  - KV Cache 随并发和长度增长 → GQA、PagedAttention、KV 量化有效
  - Prefill 受算力限制 → chunked prefill、前缀缓存、更强算力有效
  - 具体技术见 [Optimization](/0835_LM_Infer_Optimization)，总览见
    [Infer](/0819_LM_Infer)

## Reference

  - [Roofline: An Insightful Visual Performance
    Model](https://dl.acm.org/doi/10.1145/1498765.1498785)
  - [LLM Inference Performance Engineering: Best Practices -
    Databricks](https://www.databricks.com/blog/llm-inference-performance-engineering-best-practices)
  - [Efficiently Scaling Transformer
    Inference](https://arxiv.org/abs/2211.05102)
  - [Llama 2 / Llama 3 model
    cards](https://github.com/meta-llama/llama3)
