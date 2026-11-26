-----

| Title     | LM Infer Parallel                                     |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T15:37:00Z`                                |
| Updated @ | `2026-11-26T15:37:00Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/836) |

-----

# Parallel

大模型推理的并行：什么时候需要多卡，张量并行、流水线并行、专家并行怎样用于推理，PD 分离 (prefill/decode
分开部署)，以及通信开销的估算。训练侧的并行原理见 [Distributed](@@TDIST@@)。

## 什么时候需要多卡

模型权重加 KV Cache 超过单卡显存，或单卡速度达不到延迟目标时，需要多卡。可以用显存估算快速判断：

$$ \\text{需要显存}\\approx N\\cdot b\_w+\\text{KV}\_{total}+\\text{开销}\\
(\\approx10%\\sim20%) $$

其中：

  - $N$：参数量；$b\_w$：每参数的字节数 (BF16 为 $2$，INT4 约 $0.5$)
  - $\\text{KV}\_{total}$：所有并发序列的 KV Cache，公式见 [Basics](@@IBAS@@)
  - 开销：激活、通信缓冲、CUDA 上下文等

例：70B 模型 BF16 权重 $140$ GB，单张 80 GB 的卡放不下，至少需要 $2$ 张；INT4 量化后约
$35\\sim40$ GB，一张卡可放下，详见 [Sizing](@@DSIZ@@)。

## 并行方式

``` mermaid
flowchart LR
    R[请求] --> TP[张量并行 TP<br>每层切到多卡<br>每层 2 次 all-reduce]
    R --> PP[流水线并行 PP<br>层分到不同卡<br>只传激活]
    R --> EP[专家并行 EP<br>MoE 专家分到不同卡<br>all-to-all]
    R --> DP[数据并行/副本<br>多份完整模型<br>各自处理不同请求]
```

图中：四种方式切分的对象不同，通信特点不同：张量并行通信最频繁，流水线并行通信量小但有气泡，专家并行用 all-to-all 把 token
路由到专家所在卡，数据并行 (多副本) 不需要卡间通信，只用来提升并发。

| 方式       | 切分     | 对延迟             | 对吞吐   | 通信要求            |
| -------- | ------ | --------------- | ----- | --------------- |
| 张量并行 TP  | 层内矩阵   | 降低 (每卡读的权重变少)   | 提高    | 高：需要 NVLink 级带宽 |
| 流水线并行 PP | 按层     | 基本不降低 (串行经过各阶段) | 提高    | 低：可跨节点          |
| 专家并行 EP  | MoE 专家 | 视路由而定           | 提高    | 中：all-to-all    |
| 副本 (DP)  | 整个模型   | 不变              | 近线性提高 | 无               |

表中：延迟优先选张量并行，因为 decode 受带宽限制，$t$ 卡 TP 使每卡读的权重降为 $1/t$，TPOT 近似降为 $1/t$
(再加上通信)；仅为放下模型而又不追求延迟时可用流水线并行；吞吐优先则多开副本。

## 张量并行的延迟估算

$$ \\text{TPOT}*{TP}\\approx\\frac{W/t}{\\text{BW}*{mem}}+L\\cdot2\\cdot
t\_{allreduce} $$

其中：

  - $W$：权重字节数 (第一项，每卡只读 $W/t$)；$t$：TP 度；$\\text{BW}\_{mem}$：单卡显存带宽
  - 第二项是通信：每层 $2$ 次 all-reduce (注意力和 FFN 各一次)，$L$ 为层数，$t\_{allreduce}$
    为单次 all-reduce 的时间 (decode 时数据量很小，主要是延迟，NVLink 下约 $10\\
    \\mu\\text{s}$ 量级 `[经验]`)
  - 例：$70$B BF16 在 $4$ 卡 TP：$W/t=35$ GB，每卡带宽 $2$ TB/s，第一项约 $17.5$
    ms；$L=80$，$160$ 次 all-reduce 每次约 $15\\ \\mu\\text{s}$，第二项约 $2.4$
    ms，合计约 $20$ ms/token
  - 因此 TP 度不是越大越好：超过一个 NVLink 域 (如 8 卡) 或卡数太多时，通信时间会抵消带宽收益

## PD 分离

Prefill 是算力密集、decode 是带宽密集，混在一起会互相干扰 (prefill 拖慢 decode 的 TPOT，decode
占着显存限制 prefill)。PD 分离 (Prefill-Decode Disaggregation) 把二者部署到不同的实例：

``` mermaid
flowchart LR
    Q[请求] --> P[Prefill 实例<br>算力型 GPU]
    P -->|传输 KV Cache| D[Decode 实例<br>带宽/显存型 GPU]
    D --> O[流式输出]
```

图中：

  - Prefill 实例处理提示词，算出 KV Cache 后通过高速网络传给 decode 实例，decode 实例负责逐 token
    生成
  - 两类实例可以按各自的瓶颈独立扩缩容和选择硬件，TTFT 和 TPOT 的 SLO 都更容易满足；代价是需要传输 KV Cache (数百
    MB 到数 GB)，对网络带宽有要求
  - 代表工作：DistServe、Splitwise；一些框架 (vLLM、SGLang) 已提供实验性支持 `[待核实]`

## 专家并行与长上下文

  - MoE 推理：专家总参数大但每 token 只激活少数，权重分布在多卡，用 EP 把 token 路由到专家所在卡
    (all-to-all)；负载不均会造成某些卡成为瓶颈，需要专家复制或负载均衡

专家并行每个 MoE 层有两次 all-to-all：dispatch (把 token 的隐藏状态发给选中的专家) 和 combine
(把专家的输出发回原卡)。每 token 的通信量约为：

$$ V\_{token}\\approx2\\cdot k\\cdot d\\cdot
b\\cdot\\frac{E\_p-1}{E\_p}\\ \\ \\text{字节/层} $$

其中：

  - $k$：每个 token 激活的专家数 (top-$k$)；$d$：隐藏维度；$b$：每个元素的字节数 (BF16 为 $2$，用
    FP8 dispatch 时为 $1$)
  - $2$：dispatch 与 combine 各一次；$E\_p$：专家并行的卡数，$\\frac{E\_p-1}{E\_p}$
    是需要发到别的卡的比例 (假设路由均匀)
  - 例：Mixtral 8x7B ($d=4096$，$k=2$，BF16，$E\_p=8$)：每 token 每层约 $28$
    KB，$32$ 层约 $0.9$ MB；一个 decode 步若有 $64$ 个 token，约 $57$ MB，在 NVLink
    ($\\sim300$ GB/s) 上约 $0.2$ ms，跨节点 $50$ GB/s 的网络上约 $1.1$ ms，所以 EP
    尽量放在节点内，跨节点时要与计算重叠

负载不均衡的代价：

$$ t\_{layer}\\propto\\max\_e n\_e,\\qquad \\text{不均衡系数}=\\frac{\\max\_e
n\_e}{\\bar n} $$

其中：

  - $n\_e$：分配到专家 $e$ 的 token 数；$\\bar n$：各专家的平均 token 数
  - 所有卡要等最忙的那个专家算完，所以一层的耗时由 $\\max\_e n\_e$ 决定；不均衡系数为 $2$ 时，等效吞吐约减半

应对：训练时加负载均衡损失 (见 [MoE](@@TMOE@@))，推理时把热门专家复制到多张卡 (冗余专家)，或按统计的负载重新放置专家。

  - 长上下文：KV Cache 巨大，可沿序列维度切分 (上下文并行/ring attention)，把 KV 分布到多卡，见
    [Distributed](@@TDIST@@)

## 实践

  - vLLM：`--tensor-parallel-size 4`、`--pipeline-parallel-size 2`；TensorRT-LLM、SGLang
    也有对应参数，见 [Frameworks](@@DFW@@)
  - 优先把 TP 放在同一节点内；跨节点用 PP 或副本
  - 多卡通信库：NCCL、oneCCL；检查 NVLink/PCIe 拓扑，PCIe 带宽低会使 TP 收益大打折扣

## Reference

  - [Megatron-LM: Training Multi-Billion Parameter Language Models Using
    Model Parallelism](https://arxiv.org/abs/1909.08053)
  - [DistServe: Disaggregating Prefill and Decoding for
    Goodput-optimized LLM Serving](https://arxiv.org/abs/2401.09670)
  - [Splitwise: Efficient Generative LLM Inference Using Phase
    Splitting](https://arxiv.org/abs/2311.18677)
  - [DeepSpeed-MoE: Advancing Mixture-of-Experts Inference and
    Training](https://arxiv.org/abs/2201.05596)
  - [vLLM: Distributed Inference and
    Serving](https://docs.vllm.ai/en/latest/serving/distributed_serving.html)
