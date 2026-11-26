-----

| Title     | LM Infer KVCache                                      |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T15:37:25Z`                                |
| Updated @ | `2026-11-26T15:42:35Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/838) |

-----

# KVCache

KV Cache 的系统管理：分页分配、抢占与换出、offload 到 CPU/SSD、跨请求和跨实例共享、淘汰与压缩。KV Cache
的大小公式见 [Basics](/0834_LM_Infer_Basics)，KV 的量化方法见 [KV
量化](/0708_MO_Quantization_KVCache)。

## 为什么要专门管理

  - 大小：每 token 的 KV 为 $2Ln\_{kv}d\_hb$ 字节，Llama 3 8B 为 $128$
    KB/token；并发和上下文一长，KV 就超过权重，成为限制并发数的主要因素
  - 动态：每个请求的长度事先不知道，在生成过程中不断增长，结束时整块释放
  - 可复用：相同的前缀 (系统提示词、多轮对话历史、文档) 算出来的 KV 完全相同，可以共享

管理 KV Cache 就像操作系统管理内存：分配、回收、换出、共享，目标是用有限的显存服务尽可能多的 token。

## 分层存储

下图是 KV Cache 可以存放的位置，从上到下容量增大、速度降低：

``` mermaid
flowchart TB
    G[GPU 显存 HBM<br>数十 GB, TB/s 级] <-->|换出/换入 PCIe 数十 GB/s| C[CPU 内存<br>数百 GB]
    C <-->|NVMe 数 GB/s| S[本地 SSD<br>TB 级]
    C <-->|网络 RDMA| R[远端存储 / 其他实例<br>共享 KV]
```

图中：

  - 正在参与计算的请求，其 KV 必须在 GPU 显存里；暂时不运行的请求 (被抢占的、多轮对话中等待用户下一句的) 可以换到 CPU
    内存或 SSD
  - 远端存储或其他实例的 KV 可以通过网络取回，用于跨实例复用前缀或 PD 分离，见
    [Parallel](/0836_LM_Infer_Parallel)
  - 是否值得换出，取决于「传回来的时间」与「重新计算 (prefill) 的时间」哪个短，见下文的估算

## 分页分配

  - 把 KV 显存划成固定大小的块 (如 $16$ 个 token 一块)，请求按需申请块，用块表记录逻辑位置到物理块的映射，这就是
    PagedAttention，见 [Optimization](/0835_LM_Infer_Optimization)
  - 块的引用计数：多个请求共享同一前缀时指向相同的物理块；某个请求要修改 (追加) 时才复制 (写时复制)
  - 块大小的权衡：块越小碎片越少，但块表越大、注意力 kernel 访问越分散

## 抢占：显存不够时怎么办

当新的 token 需要块而显存已满时，调度器要选择一些请求让出显存：

| 方式              | 做法                         | 恢复代价           |
| --------------- | -------------------------- | -------------- |
| 换出 (swap)       | 把被抢占请求的 KV 拷到 CPU 内存，之后再拷回 | PCIe 传输时间      |
| 重计算 (recompute) | 直接丢弃 KV，恢复时重新 prefill      | 一次 prefill 的计算 |

表中：两种方式的选择取决于下面的比较。vLLM 的 V1 引擎默认采用重计算
`[待核实]`；被抢占的请求会出现明显的延迟抖动，所以监控里要关注抢占次数，见
[Ops](/0846_LM_Deploy_Ops)。

$$
t\_{swap}=\\frac{n\\cdot\\text{KV}*{token}}{\\text{BW}*{pcie}},\\qquad
t\_{recompute}\\approx\\frac{2N\\cdot n}{\\text{FLOPs}\_{eff}} $$

其中：

  - $n$：被抢占请求的 token 数；$\\text{KV}*{token}$：每 token 的 KV
    字节数；$\\text{BW}*{pcie}$：GPU 与 CPU 之间的有效带宽 (PCIe 5.0 x16 约
    $50$ GB/s 量级)
  - $N$：参数量；$\\text{FLOPs}\_{eff}$：GPU 的有效算力
  - 例：Llama 3
    8B，$n=4000$：$t\_{swap}=4000\\times131072/50\\times10^9\\approx10$
    ms；$t\_{recompute}\\approx2\\times8\\times10^9\\times4000/(10^{14})\\approx0.64$
    s。对这个模型换出明显更快；但对 GQA 更激进、上下文更短的模型，或 PCIe 被其他流量占满时，结论可能相反

## Offload 与跨请求复用

  - 前缀缓存 (prefix caching)：把算过的前缀块保留下来，新请求命中时跳过对应的 prefill，见
    [Optimization](/0835_LM_Infer_Optimization)；显存不够放所有前缀时，按 LRU 淘汰
  - 分层缓存：把从 GPU 淘汰的前缀块落到 CPU 内存或 SSD，而不是直接丢掉；命中时再取回。对多轮对话、Agent
    (反复带着同一段长上下文调用) 和 RAG 中的热门文档收益很大
  - 跨实例共享：LMCache、Mooncake 等系统把 KV 存在独立的缓存层，多个推理实例共享，配合按前缀亲和的路由，见
    [Service](/0845_LM_Deploy_Service) 与
    [Gateway](/0851_LM_Deploy_Gateway)
  - 判断是否值得：取回的时间 (按上面的 $t\_{swap}$ 公式，用对应介质的带宽) 要明显小于重新 prefill 的时间

## 压缩与淘汰

| 方法                | 思路                          | 风险                                                    |
| ----------------- | --------------------------- | ----------------------------------------------------- |
| 结构层面：GQA、MQA、MLA  | 模型本身产生更少的 KV                | 需要训练时决定，见 [Architecture](/0823_LM_Train_Architecture) |
| 量化                | KV 存为 FP8/INT8/INT4         | 低比特时精度下降，见 [KV 量化](/0708_MO_Quantization_KVCache)     |
| 淘汰 (H2O、SnapKV 等) | 只保留注意力得分高的 token            | 被丢弃的信息无法找回，长文档问答可能出错                                  |
| StreamingLLM      | 只保留开头的若干「注意力汇聚」token 和最近的窗口 | 适合流式对话，不适合需要回看全部内容的任务                                 |

表中：结构和量化是「每个 token 变小」，淘汰是「token 变少」；后者节省最多但风险最大，上线前要用长上下文评测验证，见
[LongContext](/0829_LM_Train_LongContext)。

## Reference

  - [Efficient Memory Management for Large Language Model Serving with
    PagedAttention](https://arxiv.org/abs/2309.06180)
  - [Mooncake: A KVCache-centric Disaggregated Architecture for LLM
    Serving](https://arxiv.org/abs/2407.00079)
  - [LMCache](https://github.com/LMCache/LMCache)
  - [H2O: Heavy-Hitter Oracle for Efficient Generative Inference of
    Large Language Models](https://arxiv.org/abs/2306.14048)
  - [SnapKV: LLM Knows What You are Looking for Before
    Generation](https://arxiv.org/abs/2404.14469)
  - [Efficient Streaming Language Models with Attention
    Sinks](https://arxiv.org/abs/2309.17453)
