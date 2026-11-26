-----

| Title     | LM Train Architecture                                 |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T15:34:14Z`                                |
| Updated @ | `2026-11-26T15:42:03Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/823) |

-----

# Architecture

现代大语言模型 (decoder-only Transformer) 的结构：一个 block
里有什么，RoPE、GQA、RMSNorm、SwiGLU、MoE 各自的作用，以及参数量与计算量怎样计算。

## 整体结构

下图是类 Llama 的 decoder-only 模型的结构，重复 $L$ 个 block：

``` mermaid
flowchart TB
    T[token IDs] --> E[Embedding V x d]
    E --> B1
    subgraph B1[Transformer Block x L]
        N1[RMSNorm] --> A[自注意力 GQA + RoPE] --> R1((+))
        N2[RMSNorm] --> M[FFN SwiGLU] --> R2((+))
        R1 --> N2
    end
    B1 --> NF[RMSNorm]
    NF --> H[LM Head d x V]
    H --> P[softmax → 下一个 token 概率]
```

图中：

  - 输入 token 先查嵌入表得到向量，经 $L$ 个相同结构的 block，每个 block
    由「注意力子层」和「前馈子层」组成，各自有残差连接
    (`+`)
  - 采用 pre-norm：每个子层之前先做归一化 (RMSNorm)，使深层网络训练更稳定
  - 最后经 LM Head 投影到词表大小并 softmax，得到下一个 token 的概率分布
  - decoder-only 用因果掩码 (每个位置只看自己和之前的位置)，因此可以用 next-token 预测训练，也可以逐 token
    生成，基础见 [Transformer](/0229_ML_Transformer)

## 关键组件

### 自注意力

$$
\\mathrm{Attn}(Q,K,V)=\\mathrm{softmax}\!\\left(\\frac{QK^\\top}{\\sqrt{d\_h}}+M\\right)V
$$

其中：

  - $Q,K,V$：由输入线性投影得到的查询、键、值，每个头的维度为 $d\_h$；$QK^\\top$ 的 $(i,j)$ 项衡量位置
    $i$ 对位置 $j$ 的关注程度
  - $\\sqrt{d\_h}$：缩放因子，防止点积过大使 softmax 饱和；$M$：因果掩码，$j\>i$ 处为
    $-\\infty$，使位置 $i$ 看不到未来
  - 计算量随序列长度 $S$ 平方增长 ($O(S^2d)$)，这是长上下文的主要开销，优化见
    [Efficiency](/0826_LM_Train_Efficiency)

### RoPE

旋转位置编码把位置信息以「旋转」的方式乘进 $Q,K$：把向量按相邻两维分组，第 $m$ 个位置、第 $i$ 组的旋转角为：

$$ \\theta\_{m,i}=m\\cdot\\omega\_i,\\qquad \\omega\_i=10000^{-2i/d\_h}
$$

其中：

  - $m$：token 在序列中的位置；$i$：维度分组编号 ($i=0,\\dots,d\_h/2-1$)；$d\_h$：头维度
  - $\\omega\_i$：第 $i$ 组的旋转频率，$i$ 越大频率越低，低频分量负责编码远距离的位置
  - 每组的两维 $(x\_{2i},x\_{2i+1})$ 按角度 $\\theta\_{m,i}$ 旋转；位置 $m$ 的 query
    与位置 $n$ 的 key 的内积只依赖相对距离 $m-n$，所以注意力天然感知相对位置
  - 上下文窗口的外推可以通过调整 $\\omega\_i$ (如 PI、NTK、YaRN) 实现，见
    [LongContext](/0829_LM_Train_LongContext)

### GQA

  - MHA (多头注意力)：每个头都有自己的 $K,V$；MQA：所有头共享一组 $K,V$；GQA
    (分组查询注意力)：$n\_{head}$ 个 Q 头分成 $n\_{kv}$ 组，每组共享一组
    $K,V$
  - 目的：减小推理时的 KV Cache，因为 Cache 大小正比于 $n\_{kv}$，见 [Infer
    Basics](/0834_LM_Infer_Basics)；例：Llama 3 8B 用
    $n\_{head}=32,n\_{kv}=8$，KV Cache 只有 MHA 的 $1/4$

### MLA

MLA (Multi-head Latent Attention，DeepSeek-V2 提出) 不减少头数，而是把 K、V
压缩到一个低维的潜在向量里，只缓存这个向量：

$$ \\mathbf c\_t^{KV}=W^{DKV}\\mathbf h\_t,\\qquad \\mathbf
k\_t=W^{UK}\\mathbf c\_t^{KV},\\quad \\mathbf v\_t=W^{UV}\\mathbf
c\_t^{KV} $$

其中：

  - $\\mathbf h\_t\\in\\mathbb R^{d}$：第 $t$ 个 token
    的隐藏状态；$W^{DKV}\\in\\mathbb R^{d\_c\\times
    d}$：降维投影；$\\mathbf c\_t^{KV}\\in\\mathbb
    R^{d\_c}$：压缩后的潜在向量，$d\_c$ 远小于 $n\_{head}d\_h$
  - $W^{UK},W^{UV}$：把潜在向量还原成各个头的 K、V 的升维投影；推理时可以把 $W^{UK}$ 吸收进 query
    的投影、$W^{UV}$ 吸收进输出投影，因此不需要真的把 K、V 展开
  - KV Cache 只存 $\\mathbf c\_t^{KV}$ (外加一个单独的、带 RoPE 的小 key 分量)，每 token
    每层约 $d\_c+d\_h^R$ 个数；DeepSeek-V2 中 $d\_c=512$、$d\_h^R=64$，而 MHA 需要
    $2\\times128\\times128=32768$ 个，约缩小到 $1/57$ `[待核实]`

| 方式                           | 每 token 每层缓存的元素数  | 例 ($n\_{head}=32$，$d\_h=128$) |
| ---------------------------- | ----------------- | ----------------------------- |
| MHA                          | $2,n\_{head}d\_h$ | $8192$                        |
| GQA ($n\_{kv}=8$)            | $2,n\_{kv}d\_h$   | $2048$                        |
| MQA                          | $2,d\_h$          | $256$                         |
| MLA ($d\_c=512$，$d\_h^R=64$) | $d\_c+d\_h^R$     | $576$                         |

表中：缓存越小，同样显存能放下的并发和上下文越多；GQA/MQA 靠共享 K、V 节省，MLA 靠低秩压缩节省，并且论文报告其效果不低于
MHA。DeepSeek 相关见 [DeepSeek](/0496_Hot_DeepSeek)。

### RMSNorm 与 SwiGLU

$$
\\mathrm{RMSNorm}(x)=\\frac{x}{\\sqrt{\\frac1d\\sum\_ix\_i^2+\\epsilon}}\\odot
g,\\qquad \\mathrm{FFN}(x)=\\bigl(\\mathrm{Swish}(xW\_1)\\odot
xW\_3\\bigr)W\_2 $$

其中：

  - RMSNorm：只按均方根缩放，不减均值，比 LayerNorm 少一项运算；$g$ 是可学习的缩放，$\\epsilon$ 防止除零
  - SwiGLU：$\\mathrm{Swish}(z)=z,\\sigma(z)$，用门控 ($\\odot$ 逐元素乘)
    控制信息流；有三个矩阵 $W\_1,W\_3\\in\\mathbb R^{d\\times
    d\_{ff}}$、$W\_2\\in\\mathbb R^{d\_{ff}\\times d}$，所以 $d\_{ff}$ 常取约
    $\\frac83d$ 以使参数量与普通 FFN 相当

### MoE

  - 混合专家 (MoE)：把 FFN 换成 $E$ 个并行的专家，路由器为每个 token 选出 top-$k$ 个专家 (如
    $k=2$)，只激活这几个
  - 好处：总参数量大 (知识容量大)，但每个 token 的计算量只相当于激活的参数；例：Mixtral 8x7B 总参数约
    $46.7\\text{B}$，每 token 激活约 $12.9\\text{B}$
  - 代价：显存仍需放下全部专家；负载不均衡需要辅助损失；部署时需要专家并行，见 [Infer
    Parallel](/0836_LM_Infer_Parallel)

## 参数量与计算量

对隐藏维度 $d$、层数 $L$、FFN 维度 $d\_{ff}$、词表 $V$、GQA 的 $d\_{kv}=n\_{kv}d\_h$：

$$ N\\approx L\\Bigl\[\\underbrace{2d^2+2d,d\_{kv}}*{\\text{Attn:
}Q,O,K,V}+\\underbrace{3d,d*{ff}}\_{\\text{SwiGLU}}\\Bigr\]+2Vd $$

其中：

  - 注意力的 $Q$ 和输出投影 $O$ 各 $d\\times d$，$K,V$ 各 $d\\times d\_{kv}$；SwiGLU
    有三个 $d\\times d\_{ff}$ 的矩阵；最后的 $2Vd$ 是输入嵌入和输出头 (不共享时)
  - 忽略了归一化的 $O(Ld)$ 小项

| 模型         | $d$  | $L$ | $d\_{ff}$ | $n\_{head}/n\_{kv}$ | $V$    | 计算结果                    |
| ---------- | ---- | --- | --------- | ------------------- | ------ | ----------------------- |
| Llama 2 7B | 4096 | 32  | 11008     | 32/32               | 32000  | $\\approx6.74\\text{B}$ |
| Llama 3 8B | 4096 | 32  | 14336     | 32/8                | 128256 | $\\approx8.03\\text{B}$ |

表中：代入公式：Llama 2 7B：每层
$4\\cdot4096^2+3\\cdot4096\\cdot11008\\approx202.4\\text{M}$，$\\times32\\approx6.48\\text{B}$，加嵌入
$2\\cdot32000\\cdot4096\\approx0.26\\text{B}$，共 $6.74\\text{B}$；Llama 3
8B：每层约 $218.1\\text{M}$，$\\times32\\approx6.98\\text{B}$，加嵌入约
$1.05\\text{B}$，共 $8.03\\text{B}$，与官方一致。可见大词表使嵌入占比明显增大。

## 每 token 的计算量

$$ C\_{fwd}\\approx2N\_{\\text{非嵌入}}+2,L,S,d,\\qquad
C\_{train}\\approx3,C\_{fwd} $$

其中：

  - $N\_{\\text{非嵌入}}$：不含嵌入层的参数量；每个权重在矩阵乘法里参与一次乘法和一次加法，所以是 $2$
    FLOPs/参数；输入嵌入只是查表，不计算
  - $2LSd$：注意力的 $QK^\\top$ 与「得分乘 $V$」两步，对每个 token 要与上下文的 $S$ 个位置各做一次 $d$
    维点积 (按 Kaplan 等人的计法，因果掩码使平均只算一半，故系数为 $2$ 而不是 $4$)；它与参数量无关，只随上下文长度增长
  - $C\_{train}$：反向传播约是前向的 $2$ 倍，所以训练每 token 约 $3C\_{fwd}\\approx6N$，即
    [Pretrain](/0824_LM_Train_Pretrain) 里 $C\\approx6ND$ 的来源
  - 注意力项什么时候不能忽略：比较 $2LSd$ 与 $2N\\approx24Ld^2$ (标准结构每层约 $12d^2$
    参数)，比值约为 $\\frac{S}{12d}$；例：Llama 3 8B
    ($d=4096$)，$S=4096$ 时注意力只占约 $8%$，$S=128\\text{K}$ 时注意力的计算量约是参数部分的
    $2.6$ 倍，这就是长上下文训练和 prefill 昂贵的原因，见
    [LongContext](/0829_LM_Train_LongContext)

## Reference

  - [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
  - [RoFormer: Enhanced Transformer with Rotary Position
    Embedding](https://arxiv.org/abs/2104.09864)
  - [GQA: Training Generalized Multi-Query Transformer Models from
    Multi-Head Checkpoints](https://arxiv.org/abs/2305.13245)
  - [GLU Variants Improve Transformer](https://arxiv.org/abs/2002.05202)
  - [Root Mean Square Layer
    Normalization](https://arxiv.org/abs/1910.07467)
  - [Mixtral of Experts](https://arxiv.org/abs/2401.04088)
  - [The Llama 3 Herd of Models](https://arxiv.org/abs/2407.21783)
