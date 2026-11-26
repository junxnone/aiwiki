-----

| Title     | LM LLMs Metrics                                       |
| --------- | ----------------------------------------------------- |
| Created @ | `2025-02-08T07:57:07Z`                                |
| Updated @ | `2026-11-26T08:28:53Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/503) |

-----

# LLMs Metrics

  - LLMs 存在的问题
      - 内存占用高
      - 计算资源未充分利用
      - 高延迟
      - 难以处理长文本

## 推理的两个阶段

``` mermaid
flowchart LR
    P[Prefill 并行处理整个输入 Prompt] --> K[生成 KV Cache 和第一个 token]
    K --> D[Decode 每步生成一个 token 并追加 KV Cache]
    D --> D
    D --> E[遇到结束符 输出完成]
```

图中：

  - **Prefill（预填充）**：一次性并行处理整个输入，计算量大、算力受限（compute-bound），决定首 token 延迟
  - **Decode（解码）**：每步只生成一个 token，需要反复读取全部权重和 KV
    Cache，带宽受限（memory-bound），决定后续生成速度
  - **KV Cache**：缓存每层历史 token 的 Key 和 Value，避免重复计算
  - 循环箭头表示解码逐 token 自回归，直到结束
  - 关键结论：两个阶段的瓶颈不同，所以指标和优化手段也不同

## 推理速度

  - **TTFT** - Time To First Token
  - **TPOT** - Time Per Output Token
  - **Latency** = **TTFT** + **TPOT** \* (the number of tokens to be
    generated)
  - **Throughput** - The number of output tokens per second

用公式表示：

$$ \\text{Latency}=\\text{TTFT}+\\text{TPOT}\\times N\_{out},\\qquad
\\text{Throughput}=\\frac{N\_{tokens}}{T\_{total}} $$

其中：

  - $\\text{TTFT}$：从发出请求到收到第一个 token 的时间，主要受 Prefill 和排队影响
  - $\\text{TPOT}$：之后每个输出 token 的平均时间，主要受 Decode 速度影响
  - $N\_{out}$：需要生成的输出 token 数；$\\text{Latency}$：该请求的端到端延迟
  - $N\_{tokens}$：时间窗口内系统生成的总输出 token 数；$T\_{total}$：窗口时长
  - $\\text{Throughput}$：吞吐量，单位 tokens/s，通常指整个服务（多请求）的总输出速度

### 常见指标

| 指标          | 含义                    | 关注点          |
| ----------- | --------------------- | ------------ |
| TTFT        | 首 token 时间            | 交互体验，输入越长越明显 |
| TPOT / ITL  | 每 token 时间 / token 间隔 | 流式输出的流畅度     |
| E2E Latency | 请求端到端时间               | 总体响应速度       |
| Throughput  | 每秒输出 token 数          | 服务容量与成本      |
| Goodput     | 满足延迟目标（SLO）的有效吞吐      | 真实可用容量       |
| QPS / RPS   | 每秒处理请求数               | 并发能力         |

表中：

  - **ITL**：Inter-Token Latency，相邻两个输出 token 的间隔；**SLO**：Service Level
    Objective，服务目标
  - 对比结论：低延迟（TTFT/TPOT）与高吞吐常常此消彼长，批量越大吞吐越高但单请求延迟变大

-----

  - Output length dominates overall response latency
  - Input length is not significant for performance but important for
    hardware requirements
  - Overall latency scales sub-linearly with model size

## 显存：KV Cache 的大小

$$ M\_{KV}=2\\times n\_{layer}\\times n\_{kv}\\times d\_{head}\\times
L\\times B\\times b $$

其中：

  - 系数 2：Key 和 Value 各一份
  - $n\_{layer}$：Transformer 层数；$n\_{kv}$：KV 头数（使用 GQA 时小于 Query 头数）
  - $d\_{head}$：每个头的维度；$L$：序列长度（输入加输出）
  - $B$：并发的序列数（batch size）；$b$：每个数值的字节数（FP16 为 2）
  - 含义：KV Cache 随序列长度和并发数线性增长，是长文本和高并发时显存的主要瓶颈

## 常见优化

| 手段                  | 解决的问题                    |
| ------------------- | ------------------------ |
| Continuous Batching | 请求随到随进、随完随出，提高 GPU 利用率   |
| PagedAttention      | 分页管理 KV Cache，减少显存碎片     |
| FlashAttention      | 减少 Attention 的显存读写，加速长序列 |
| 量化（INT8 / INT4）     | 降低权重显存占用和带宽需求            |
| 投机解码                | 用小模型先草拟、大模型并行验证，降低 TPOT  |
| GQA / MQA           | 减少 KV 头数，降低 KV Cache     |

表中：

  - **GQA / MQA**：分组查询 / 多查询注意力，多个 Query 头共享一组 Key/Value
  - 对比结论：针对内存占用（量化、PagedAttention）、计算利用率（Continuous
    Batching）、延迟（投机解码）、长文本（FlashAttention、GQA）分别对症

## Reference

  - [LLM推理速度飙升23倍！Continuous
    Batching：解锁LLM潜力！](https://cloud.tencent.com/developer/article/2350466)
  - [LLM Inference Performance Engineering: Best
    Practices](https://www.databricks.com/blog/llm-inference-performance-engineering-best-practices)
