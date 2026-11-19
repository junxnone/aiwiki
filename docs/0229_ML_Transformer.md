---
Title | ML Transformer
-- | --
Created @ | `2021-02-23T07:18:26Z`
Updated @| `2026-11-19T03:32:34Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/229)

---
# Transformer

Transformer 是 Google 在 2017 年论文 *Attention Is All You Need* 中提出的序列建模架构。它完全抛弃 RNN / CNN，仅依靠 **Self-Attention** 建模序列内任意两个位置的依赖，天然支持并行训练，已成为 NLP、CV、语音、时序等领域的基础架构（BERT、GPT、ViT 等均基于它）。

## 整体结构

原始 Transformer 为 Encoder-Decoder 结构：

- **Encoder**：N 层堆叠，每层 = Multi-Head Self-Attention + Feed-Forward Network（FFN），每个子层外包 Residual 连接和 LayerNorm。
- **Decoder**：N 层堆叠，每层 = Masked Multi-Head Self-Attention + Cross-Attention（Q 来自 Decoder，K/V 来自 Encoder 输出）+ FFN。
- **输入**：Token Embedding + Positional Encoding。
- **输出**：Linear + Softmax 预测下一个 token。

| 类型 | 结构 | 代表模型 | 典型任务 |
|---|---|---|---|
| Encoder-only | 双向 Self-Attention | BERT, ViT | 分类、检索、理解 |
| Decoder-only | Causal Self-Attention | GPT 系列, LLaMA | 文本生成 |
| Encoder-Decoder | Encoder + Decoder | T5, BART, DETR | 翻译、摘要 |

原论文（base 模型）超参：

| 符号 | 含义 | 取值 |
|---|---|---|
| $N$ | Encoder / Decoder 层数 | 6 |
| $d_{model}$ | 隐层维度 | 512 |
| $h$ | Attention head 数 | 8 |
| $d_k = d_v$ | 每个 head 的维度，$d_{model}/h$ | 64 |
| $d_{ff}$ | FFN 中间层维度 | 2048 |

## 核心组件

### Self-Attention 与 Q/K/V

输入序列表示 $X \in \mathbb{R}^{n \times d_{model}}$，通过三个可学习矩阵线性投影得到 Query、Key、Value：

$$
Q = XW^Q,\quad K = XW^K,\quad V = XW^V
$$

- **Self-Attention**：$Q, K, V$ 都来自同一序列 $X$。
- **Cross-Attention**：$Q$ 来自 Decoder，$K, V$ 来自 Encoder 输出，用于让解码器读取源序列信息。

### Scaled Dot-Product Attention

$d_k$ 为 key 的维度：

$$
\mathrm{Attention}(Q, K, V) = \mathrm{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V
$$

缩放的原因：假设 $q, k$ 各分量独立、均值为 0、方差为 1，则 $q \cdot k$ 的方差为 $d_k$。$d_k$ 较大时点积的幅值很大，softmax 会进入梯度极小的饱和区；除以 $\sqrt{d_k}$ 把方差拉回 1。

### Causal Mask

Decoder 的自注意力需要禁止看到未来位置，在 softmax 前加上掩码 $M$：

$$
\mathrm{softmax}\left(\frac{QK^\top}{\sqrt{d_k}} + M\right)V,\quad
M_{ij} = \begin{cases} 0 & j \le i \ -\infty & j > i \end{cases}
$$

这样训练时可以一次并行计算所有位置的下一个 token 预测（Teacher Forcing）。

### Multi-Head Attention

将输入投影到 $h$ 个子空间并行计算 attention，再拼接：

$$
\mathrm{MultiHead}(Q,K,V) = \mathrm{Concat}(\mathrm{head}_1,\dots,\mathrm{head}_h)W^O,\quad
\mathrm{head}_i = \mathrm{Attention}(QW_i^Q, KW_i^K, VW_i^V)
$$

不同的 head 可以关注不同类型的关系（如句法、位置、语义）。

### Feed-Forward Network

对每个位置独立作用的两层 MLP，原文使用 ReLU：

$$
\mathrm{FFN}(x) = \max(0,\, xW_1 + b_1)W_2 + b_2
$$

现代模型常把 ReLU 换成 GELU，或使用门控的 SwiGLU。

### Positional Encoding

Self-Attention 本身对顺序不敏感，需要显式注入位置信息。原文使用正弦编码：

$$
PE_{(pos,2i)} = \sin\left(\frac{pos}{10000^{2i/d_{model}}}\right),\quad
PE_{(pos,2i+1)} = \cos\left(\frac{pos}{10000^{2i/d_{model}}}\right)
$$

后续常见方案：可学习位置编码、相对位置编码、RoPE、ALiBi。

### Residual + LayerNorm

原文采用 Post-LN，现代大模型多用 Pre-LN，训练更稳定：

$$
\text{Post-LN: } y = \mathrm{LayerNorm}\big(x + \mathrm{Sublayer}(x)\big)
$$

$$
\text{Pre-LN: } y = x + \mathrm{Sublayer}\big(\mathrm{LayerNorm}(x)\big)
$$

### 参数量估算

每层 Attention 的 $W^Q, W^K, W^V, W^O$ 共 $4d_{model}^2$ 个参数；FFN 取 $d_{ff} = 4d_{model}$ 时为 $2 \cdot d_{model} \cdot 4d_{model} = 8d_{model}^2$。因此每个 Transformer 层约 $12\,d_{model}^2$ 个参数（不含 Embedding 与偏置）。

## 最小代码示例

```python
import math
import torch

def attention(q, k, v, mask=None):
    # q, k, v: (batch, heads, seq_len, d_k)
    d_k = q.size(-1)
    scores = q @ k.transpose(-2, -1) / math.sqrt(d_k)   # (batch, heads, n, n)
    if mask is not None:
        scores = scores.masked_fill(mask == 0, float("-inf"))
    weights = torch.softmax(scores, dim=-1)
    return weights @ v                                   # (batch, heads, n, d_k)

# causal mask: 下三角为 1
n = 8
mask = torch.tril(torch.ones(n, n))
```

## 训练与推理

- **训练**：Adam 优化器配合 warmup 学习率调度（先线性增大后按 $step^{-0.5}$ 衰减），并使用 Dropout 和 Label Smoothing 正则。
- **Teacher Forcing**：训练时 Decoder 输入为真实的目标序列（右移一位），配合 Causal Mask 并行计算所有位置的损失。
- **自回归推理**：推理时只能逐 token 生成，每一步把已生成的 token 追加到输入。
- **KV Cache**：已生成 token 的 $K, V$ 在后续步骤中不变，缓存后每步只需为新 token 计算 $Q, K, V$，把重复计算从 $O(n^2)$ 次降到每步 $O(n)$，代价是显存随序列长度线性增长。

## 复杂度与特点

设序列长度为 $n$，隐层维度为 $d$，卷积核大小为 $k$：

| 模型 | 每层复杂度 | 最大路径长度 |
|---|---|---|
| Self-Attention | $O(n^2 d)$ | $O(1)$ |
| RNN | $O(n d^2)$ | $O(n)$ |
| CNN | $O(k n d^2)$ | $O(n/k)$；使用 dilated 卷积时为 $O(\log_k n)$ |

- 优点：并行度高；长距离依赖路径短；扩展性好（Scaling Law）。
- 缺点：Attention 的 $O(n^2)$ 时间/显存开销限制长序列；缺少归纳偏置，需要大量数据。

## 相关文章

- [History](https://junxnone.github.io/wht/tech/transformer/) [[edit](https://github.com/junxnone/wht/issues/9)]
- [Transformer Efficient Attention](/Transformer_Efficient_Attention)
  - [Linformer](/Linformer)
  - [Performer]
- [Vision](/Transformer_Vision)
  - Classification
    - [ViT](/ViT)
    - [T2T-ViT](/T2T_ViT)
    - [DeiT](/DeiT)
    - [Bottleneck Transformers](/Bottleneck_Transformers)
  - Detection
    - [DETR]()

## Trend

- 优化复杂度：Efficient Attention（稀疏、线性、低秩）、FlashAttention、KV Cache、MQA/GQA
- 扩展 Tasks：从 NLP 扩展到 CV、语音、多模态、时序、强化学习
- 可视化：Attention Map、注意力头分析与可解释性

## Reference
- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- [Awesome Visual-Transformer](https://github.com/dk-liang/Awesome-Visual-Transformer)
- [How Transformers work in deep learning and NLP: an intuitive introduction](https://theaisummer.com/transformer/)
- [The Transformer Family](https://lilianweng.github.io/lil-log/2020/04/07/the-transformer-family.html)
- [各种Transformer模型总结与比较](https://blog.csdn.net/zephyr_wang/article/details/113758523)
  - [Summary of the models](https://huggingface.co/transformers/model_summary.html)

