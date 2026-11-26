-----

| Title     | LM Infer Attention                                    |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T15:37:47Z`                                |
| Updated @ | `2026-11-26T15:37:47Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/839) |

-----

# Attention

推理中的注意力计算：prefill 与 decode
阶段的注意力有什么不同，FlashAttention、FlashDecoding、分页注意力
kernel 怎样优化它，以及 GQA、MLA 对推理的影响。训练侧的 FlashAttention 原理见
[Efficiency](@@TEFF@@)。

## 两个阶段的差别

| 阶段      | query 长度    | 注意力的形状                          | 瓶颈                       |
| ------- | ----------- | ------------------------------- | ------------------------ |
| prefill | $n$ (整段提示词) | $n\\times n$ 的因果注意力             | 计算 (矩阵乘法)，长提示词时 $O(n^2)$ |
| decode  | $1$         | $1\\times S$，对整个 KV Cache 做一次加权 | 读取 KV Cache 的带宽          |

表中：$n$ 是提示词长度，$S$ 是当前上下文长度。prefill 的注意力和训练相似，可以直接用 FlashAttention；decode
的注意力每步只有一个 query，但要把全部 $S$ 个 token 的 K、V 从显存读一遍，算术强度极低。

decode 注意力的算术强度：

$$
I\_{attn}=\\frac{4,S,d\_h,n\_{head}}{2,S,d\_h,n\_{kv},b}=\\frac{2,n\_{head}}{n\_{kv},b}
$$

其中：

  - 分子：每个头对 $S$ 个位置做一次 $QK$ 点积和一次 $V$ 加权，每次 $d\_h$ 维乘加，共约
    $4Sd\_hn\_{head}$ FLOPs
  - 分母：读 $S$ 个位置的 K 和 V，共 $2Sd\_hn\_{kv}b$ 字节，$b$ 为每元素字节数
  - 结果与 $S$ 无关，只取决于「多少个 query 头共享一组 KV」：MHA ($n\_{head}=n\_{kv}$，BF16)
    只有 $1$ FLOP/Byte，GQA 8 倍共享时约 $8$，远低于 GPU 的屋脊点 ($\\sim150$)
  - 所以 decode 注意力永远是 memory-bound：GQA/MQA/MLA 让同一份 KV 服务更多 query
    头，同时提高了强度、减少了读取量；KV 量化减小 $b$ 也有同样的效果

## 主要 kernel

``` mermaid
flowchart LR
    A[注意力 kernel] --> P[Prefill]
    A --> D[Decode]
    P --> P1[FlashAttention 2/3<br>分块 + 在线 softmax]
    P --> P2[Chunked prefill<br>与分页 KV 结合]
    D --> D1[PagedAttention kernel<br>按块表读 KV]
    D --> D2[FlashDecoding<br>沿 KV 长度切分并行]
    D --> D3[FlashInfer 等通用库<br>多种布局与批处理]
```

图中：

  - prefill 侧主要用 FlashAttention 系列，并要支持从分页的 KV 块读写 (配合 chunked prefill
    和前缀缓存)
  - decode 侧要解决两个问题：KV 不连续 (分页) 和并行度不足 (只有一个 query)
  - FlashInfer 这类库把多种 kernel 和 KV 布局统一起来，被 vLLM、SGLang 等框架使用

### FlashDecoding

decode 时只有 $1$ 个 query，按「batch × 头数」划分的并行任务太少，长上下文时 GPU
的大部分计算单元闲置。FlashDecoding 再沿 KV 的长度方向切成 $P$
段并行计算，最后合并：

$$
o=\\frac{\\sum\_{p=1}^{P}e^{m\_p-m},\\ell\_p,o\_p}{\\sum\_{p=1}^{P}e^{m\_p-m},\\ell\_p},\\qquad
m=\\max\_pm\_p $$

其中：

  - $o\_p$：第 $p$ 段 KV 上算出的局部注意力输出 (已在段内归一化)
  - $m\_p$：第 $p$ 段内注意力 logits 的最大值；$\\ell\_p$：第 $p$ 段内 $\\sum
    e^{s-m\_p}$ (局部的 softmax 分母)
  - $m$：全局最大值；用 $e^{m\_p-m}$ 把各段的局部结果调整到同一个尺度后加权合并，结果与一次性计算完全一致
  - 这和 FlashAttention 中的在线 softmax 是同一个技巧，只是并行的维度换成了 KV
    长度；论文报告长上下文下注意力可加速数倍 `[待核实]`

## GQA 与 MLA 对推理的影响

| 结构  | KV 读取量                       | 推理 kernel 的特点                                    |
| --- | ---------------------------- | ------------------------------------------------ |
| MHA | $2n\_{head}d\_h$ / token / 层 | 每个头读自己的 KV                                       |
| GQA | $2n\_{kv}d\_h$               | 一组 query 头共享一份 KV，kernel 应一次读入、多头复用              |
| MLA | $d\_c+d\_h^R$ (压缩潜在向量)       | 可以把升维矩阵吸收进 query 和输出投影，直接在压缩空间里算注意力，需要专门的 kernel |

表中：参数与例子见 [Architecture](@@TARCH@@)。MLA 把 KV
压得最小，但计算方式与普通注意力不同，推理框架需要专门实现才能拿到收益。

## 长上下文

  - 上下文越长，decode 时注意力读取的 KV 越多，在 TPOT 中的占比越大；$S$ 达到数万时，注意力可能超过读权重的时间
  - 应对：GQA/MLA、KV 量化、FlashDecoding，以及在多卡之间按序列切分 KV，见 [KVCache
    管理](@@IKV@@) 与 [Parallel](@@IPAR@@)
  - 稀疏注意力 (滑动窗口、局部 + 全局) 从结构上限制每个 token 关注的范围，需要模型训练时就采用

## Reference

  - [FlashAttention-2: Faster Attention with Better Parallelism and Work
    Partitioning](https://arxiv.org/abs/2307.08691)
  - [FlashAttention-3: Fast and Accurate Attention with Asynchrony and
    Low-precision](https://arxiv.org/abs/2407.08608)
  - [Flash-Decoding for long-context
    inference](https://pytorch.org/blog/flash-decoding/)
  - [FlashInfer: Efficient and Customizable Attention Engine for LLM
    Inference Serving](https://arxiv.org/abs/2501.01005)
  - [DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-Experts
    Language Model (MLA)](https://arxiv.org/abs/2405.04434)
