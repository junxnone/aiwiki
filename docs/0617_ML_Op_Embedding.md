---
Title | ML Op Embedding
-- | --
Created @ | `2026-11-10T09:50:19Z`
Updated @| `2026-11-10T09:50:19Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/617)

---
# ML Op Embedding

Embedding 是把离散的整数 ID（词、字符、类别、商品、用户等）映射成稠密连续向量的算子。它本质上是对一张 `[num_embeddings, embedding_dim]` 的可学习权重表做按行查找（lookup），在 ONNX 中对应 `Gather`。NLP、推荐系统、LLM 都以 Embedding 作为模型入口：LLM 的 token embedding 表常有数亿参数，推荐模型的 embedding 表甚至可达 TB 级，是内存和通信的主要瓶颈。本文介绍 Embedding 的数学定义、shape、PyTorch 用法、与 one-hot MatMul 的等价关系、EmbeddingBag、与[位置编码](0213_ML_Attention_PE)的关系，以及大词表、稀疏梯度、量化与哈希嵌入等实现议题。

## 目的

- 神经网络只能处理连续数值，而 token ID 是无序的离散符号；直接把 ID 当数值输入没有意义（ID 100 并不"大于" ID 99）。
- one-hot 编码维度等于词表大小 $V$（如 32000 或 150000），且各类别之间正交，无法表达语义相似性。
- Embedding 把每个 ID 映射到低维稠密向量 $d \ll V$，向量通过训练学到相似性，例如语义相近的词距离更近。
- 同时它也是参数压缩手段：$V\times d$ 参数对应 $V$ 维 one-hot 后接的 Linear。

## 数学定义

设嵌入表 $E\in\mathbb{R}^{V\times d}$，输入 ID $i\in\{0,\dots,V-1\}$：

$$\mathrm{Embedding}(i) = E_{i,:} = e_i^\top E$$

其中 $e_i\in\{0,1\}^V$ 为 one-hot 向量。对一批 ID 张量 $I\in\mathbb{Z}^{*}$：

$$Y_{*,:} = E[I_{*},\ :],\quad Y\in\mathbb{R}^{*\times d}$$

### one-hot MatMul 等价

$$Y = \mathrm{OneHot}(I)\,E,\quad \mathrm{OneHot}(I)\in\{0,1\}^{N\times V}$$

数学上完全等价，但 one-hot 乘法的计算量为 $2NVd$，而查表只需拷贝 $Nd$ 个元素，且 one-hot 矩阵本身要占 $NV$ 内存。

### 反向传播

令 $G_n = \partial L/\partial Y_n\in\mathbb{R}^d$，则

$$\frac{\partial L}{\partial E_{v,:}} = \sum_{n:\,I_n=v} G_n$$

即对被使用的行做 scatter-add；未出现的行梯度为 0。同一 ID 多次出现时梯度累加。因此梯度天然是稀疏的：一个 batch 最多涉及 $N$ 行，$N\ll V$。

### EmbeddingBag

对一个"袋"（变长 ID 序列）做查表后直接归约：

$$y_b = \mathrm{reduce}_{i\in \mathrm{bag}_b}\ w_i\,E_{i,:},\quad \mathrm{reduce}\in\{\mathrm{sum},\mathrm{mean},\mathrm{max}\}$$

其中 $w_i$ 为可选的 per_sample_weights（仅 sum 模式支持）。它等价于 `Embedding` 后接 sum/mean/max 池化（参见 [Pooling](0268_ML_Op_Pooling)），但不会物化 `[total_ids, d]` 中间张量，省显存与访存。

## 输入输出 shape 与参数

### torch.nn.Embedding

- `num_embeddings`：词表大小 $V$。
- `embedding_dim`：向量维度 $d$。
- `padding_idx`：该 ID 的向量固定为 0（初始化时置零），且梯度不更新。
- `max_norm` / `norm_type`：查表时若向量范数超过 `max_norm` 则就地重新归一化（会修改权重，注意副作用）。
- `scale_grad_by_freq`：按 batch 内 ID 出现频率的倒数缩放梯度。
- `sparse`：为 True 时权重梯度为 `torch.sparse` 张量。
- 输入：任意 shape 的 `LongTensor`（或 IntTensor）`[*]`；输出：`[*, d]`。
- 初始化：默认 $\mathcal{N}(0,1)$。

### torch.nn.EmbeddingBag

- 输入可为 2D `[B, L]`（等长袋），或 1D `input` 加 `offsets`（每个袋的起点，变长）。
- 输出：`[B, d]`；`mode` 取 `sum`、`mean`（默认）、`max`。
- 支持 `per_sample_weights`、`padding_idx`、`include_last_offset`。

### ONNX

- `Gather(data=E, indices=I, axis=0)`：输出 shape 为 `I.shape + [d]`。
- 越界索引在 ONNX 中行为未定义（部分运行时报错，部分读到脏数据），负数索引在较新的 opset 中允许，语义为从末尾计数。
- ONNX 没有原生 EmbeddingBag 算子（标准 opset 下），PyTorch 导出时通常拆成 Gather + ReduceSum 等，或使用 contrib op（待核实）。

## 典型用法

```python
import torch
import torch.nn as nn

emb = nn.Embedding(num_embeddings=32000, embedding_dim=768, padding_idx=0)
ids = torch.tensor([[1, 5, 5, 0], [7, 2, 0, 0]])   # [B=2, T=4]
x = emb(ids)                                       # [2, 4, 768]
assert (x[0, 3] == 0).all()                        # padding 行为 0

# 与 one-hot matmul 等价
oh = torch.nn.functional.one_hot(ids, 32000).float()   # [2,4,32000]
x2 = oh @ emb.weight
assert torch.allclose(x, x2, atol=1e-6)

# EmbeddingBag：变长袋
bag = nn.EmbeddingBag(1000, 16, mode='sum')
flat = torch.tensor([1, 2, 4, 5, 4, 3, 2, 9])
offsets = torch.tensor([0, 4])       # 两个袋: flat[0:4], flat[4:8]
out = bag(flat, offsets)             # [2, 16]

# 稀疏梯度需要配合支持稀疏的优化器
emb_sparse = nn.Embedding(1_000_000, 64, sparse=True)
opt = torch.optim.SparseAdam(emb_sparse.parameters(), lr=1e-3)

# 输出层与 Embedding 共享权重 (weight tying)
head = nn.Linear(768, 32000, bias=False)
head.weight = emb.weight
```

LLM 入口典型结构：`token_emb(ids)`，再加上位置信息（若使用可学习/正弦位置编码）或由 RoPE 在 attention 内部施加。

## 实现方式

### 1. 查表（gather）

- 前向：对每个 $n$，把 $E[I_n,:]$ 拷贝到输出的第 $n$ 行，是纯访存算子，几乎无 FLOPs。
- 访存特征：每行 $d$ 个元素是连续的，因此行内访问合并（coalesced）；行之间是随机访问，缓存命中取决于 ID 分布。自然语言的词频服从 Zipf 分布，高频词的行常驻缓存。
- CPU 实现用 `memcpy` 或向量化拷贝；GPU 实现中每个 warp / block 处理一行或多行，沿 $d$ 维并行。
- 推荐模型里 $d$ 小（如 16–128）而 $N$ 与表数量很大，性能受内存延迟与带宽制约，常需要预取、批量合并多表查询（如 FBGEMM 的 TableBatchedEmbedding 思路）。

### 2. one-hot MatMul

- 优点：只依赖 GEMM，在 TPU 等矩阵单元强而 gather 弱的硬件上有时更快；便于在某些不支持 Gather 的加速器或加密计算（如同态加密、MPC）下表达。
- 缺点：FLOPs 为 $2NVd$、内存为 $NV$，$V$ 大时完全不可行。通常仅在 $V$ 很小（几十到几百）时使用。
- 另一种折中：对词表分块，按块做 one-hot MatMul，并对不在本块的 ID 置零后求和（张量并行下的做法，见下）。

### 3. 反向与稀疏更新

- Dense 梯度：梯度张量与 $E$ 同尺寸 $V\times d$，对 $V=10^6$、$d=128$、FP32 约 512 MB，每步都要清零、reduce、更新。
- Sparse 梯度（`sparse=True`）：只保存 `(indices, values)`，更新代价与 batch 内 ID 数成正比。限制：
  - 只能搭配支持稀疏的优化器（`SGD`、`SparseAdam`、`Adagrad`）；`Adam`、`AdamW` 不支持稀疏梯度。
  - 不能与 `max_norm` 之外的某些功能或 DDP 的部分模式完美配合；多卡下稀疏梯度需用 all-gather 等方式聚合。
  - `SparseAdam` 只更新出现过的行的动量，语义与 dense Adam 不同（lazy Adam）。
- 稠密反向在 GPU 上通常用 atomicAdd 或先排序再分段归约（避免原子操作的非确定性与冲突）。因此 Embedding 反向往往是不确定性（non-deterministic）的来源，`torch.use_deterministic_algorithms(True)` 会切换到较慢的确定性实现。

### 4. 大词表与并行

- 词表大（LLM 动辄 10 万以上）时，Embedding 与输出层 logits 的 `[T, V]` 计算和显存都很可观（logits 的 softmax / cross entropy 更甚，见 [Softmax](0335_ML_Op_AF_Softmax)、[Loss Function](0281_ML_Arch_Func_LossFunction)）。
- 张量并行（如 Megatron-LM 的 VocabParallelEmbedding）：按词表维度切分 $E$ 到各卡，每卡只查属于本分片的 ID，其余置零，最后 all-reduce 求和。
- 推荐系统用模型并行 + 数据并行混合：embedding 表按表或按行切分，通过 all-to-all 交换查询结果。
- 参数服务器、CPU/SSD 上的冷热分层存储、缓存热门行是超大表的常见方案。
- Weight tying：输入 Embedding 与输出 Linear 共享权重，省去 $Vd$ 参数。

### 5. 量化、压缩与哈希嵌入

- INT8 / INT4 行量化：每行存一个 scale（和可选 zero point / bias），查表时再反量化。推理时 embedding 表常常是模型最大的单个权重，量化收益大。PyTorch 提供 `quantized.EmbeddingBag`（字节量化、4-bit 版本等），FBGEMM 有对应 kernel。
- 因为查表是访存算子，量化主要节省显存与带宽，不改变算术强度。
- 哈希嵌入（hashing trick）：用哈希函数把大量 ID 映射到较小的表 $E\in\mathbb{R}^{m\times d}$，$h(i)=\mathrm{hash}(i)\bmod m$，会发生冲突；可用多个哈希函数并组合向量（如 Hash Embedding、Compositional Embedding 的 quotient-remainder 技巧）降低冲突影响。
- 低秩分解：$E = AB$，$A\in\mathbb{R}^{V\times r}$，$B\in\mathbb{R}^{r\times d}$（如 ALBERT 的 factorized embedding）。
- 子词（BPE / WordPiece / SentencePiece）则从源头减小 $V$，用更长的序列换更小的表。
- 混合维度：高频 ID 使用大 $d$，低频 ID 使用小 $d$，再投影到统一维度。

## 与位置编码的关系

- Transformer 的 self-attention 对 token 顺序不敏感，需要额外注入位置信息，详见[位置编码](0213_ML_Attention_PE)。
- 可学习绝对位置编码本身就是一个 Embedding：`nn.Embedding(max_len, d)`，以位置索引 $0,\dots,T-1$ 为输入，然后与 token embedding 逐元素相加：

$$x_t = E_{\mathrm{tok}}[w_t] + E_{\mathrm{pos}}[t]$$

- 正弦位置编码是固定函数，不是可学习的查表（但可预先算好存成表并用 Gather 取出）。
- RoPE / ALiBi 等不在输入处加 embedding，而是在 [Attention](0210_ML_Attention) 内对 Q/K 旋转或加偏置。
- BERT 还有 segment embedding（句子 A/B），三者相加后做 [LayerNorm](0615_ML_Op_Norm_LayerNorm) 和 [Dropout](0258_ML_Op_Dropout)。
- 位置 embedding 的 `max_len` 限制了序列长度上限，超过需插值或外推方法。

## 复杂度与访存

| 项目 | Embedding 查表 | one-hot MatMul |
| --- | --- | --- |
| FLOPs | 约 0 | $2NVd$ |
| 读取 | $N\cdot d$ 元素（加 $N$ 个索引） | $NV+Vd$ |
| 写出 | $N\cdot d$ | $N\cdot d$ |
| 额外显存 | 无 | $NV$ |
| 反向 | scatter-add，$O(Nd)$ | GEMM，$O(NVd)$ |

- 参数量 $Vd$（例：$V=32000,d=4096$，约 1.3 亿参数）。
- 纯 memory-bound；性能指标应看有效带宽而非 FLOPs。

## 常见坑

1. **索引越界**：ID $\ge V$ 在 CPU 上抛 `IndexError`，CUDA 上触发难以定位的 device-side assert；词表扩展（加 special tokens）后要同步 `resize_token_embeddings`。
2. **dtype**：索引必须为整型（int32/int64），float 会报错；ONNX 的 indices 支持 int32/int64。
3. **`padding_idx` 的语义**：只是不更新该行并初始化为 0，不会自动 mask；attention 中仍需 attention mask。若手动改写了权重，padding 行可能变非 0。
4. **`max_norm` 副作用**：查表过程会原地修改权重张量，可能引发 autograd 的 in-place 错误，也使多卡不一致。
5. **稀疏梯度与优化器、梯度裁剪、混合精度不兼容**：`clip_grad_norm_` 对稀疏梯度支持有限，`AdamW` 直接报错。
6. **weight decay**：对 embedding 做 L2/weight decay 会让低频词向量被不成比例地压缩（因其更新少而衰减对所有行都生效，视优化器实现而定），常选择对 embedding 不做衰减。
7. **共享权重与初始化**：tying 后输出层 logits 的尺度受 embedding 初始化影响，常需要缩放（如乘 $\sqrt{d}$ 或调整初始化方差）。
8. **确定性**：GPU 反向使用原子加，导致训练复现不一致。
9. **ONNX / 推理引擎**：动态 shape 的 Gather、负索引、`padding_idx` 在导出时被忽略（推理时该行已为 0，一般无影响）；EmbeddingBag 的 offsets 变长在静态图后端支持不完整。
10. **FP16 训练**：embedding 表巨大，常以 FP32 master weights 维护；INT8 查表要保证 scale 的存放与对齐。
11. **导出大词表模型**：Embedding 与 lm_head 在文件中是两份还是一份（tied），影响模型体积；量化时两者分别处理策略可能不同。

## 与其他 OP 的关系

- [Linear](0612_ML_Op_Linear)：Embedding 等价于无 bias Linear 作用于 one-hot 输入；输出层 Linear 与 Embedding 经常共享权重。
- [Attention](0210_ML_Attention) / [MHA](0500_ML_Attention_MHA)：token + 位置 embedding 作为 Attention 堆栈的输入。
- [位置编码](0213_ML_Attention_PE)：可学习位置编码即 Embedding，其他形式见专文。
- [Shape](0621_ML_Op_Shape)：Gather 属于索引类算子，与 GatherElements、Slice、IndexSelect、Scatter 相邻。
- [Pooling](0268_ML_Op_Pooling)：EmbeddingBag 等价于 Embedding 后接 sum/mean/max pooling。
- [Recurrent](0618_ML_Op_Recurrent)：RNN 语言模型的输入层同样是 Embedding。
- [Norm](0613_ML_Op_Norm)、[Elementwise](0620_ML_Op_Elementwise)：embedding 输出常经缩放（$\sqrt d$）、相加、Norm 再进入主干。
- [Resize](0619_ML_Op_Resize)：位置 embedding 在视觉 Transformer 中常需对表做插值（二维 resize）以适配不同分辨率。
- [Softmax](0335_ML_Op_AF_Softmax)、[Loss Function](0281_ML_Arch_Func_LossFunction)：大词表输出层的 softmax 是另一瓶颈，可用 sampled softmax / adaptive softmax 缓解。
- 更多算子见 [ML Op 总览](0366_ML_Op)。

## Reference

- [PyTorch: torch.nn.Embedding](https://pytorch.org/docs/stable/generated/torch.nn.Embedding.html)
- [PyTorch: torch.nn.EmbeddingBag](https://pytorch.org/docs/stable/generated/torch.nn.EmbeddingBag.html)
- [PyTorch: torch.nn.functional.one_hot](https://pytorch.org/docs/stable/generated/torch.nn.functional.one_hot.html)
- [ONNX Operators: Gather](https://onnx.ai/onnx/operators/onnx__Gather.html)
- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- [Efficient Estimation of Word Representations in Vector Space (word2vec)](https://arxiv.org/abs/1301.3781)
- [Using the Output Embedding to Improve Language Models (weight tying)](https://arxiv.org/abs/1608.05859)
- [Megatron-LM](https://arxiv.org/abs/1909.08053)
- [Deep Learning Recommendation Model for Personalization and Recommendation Systems (DLRM)](https://arxiv.org/abs/1906.00091)
- [ALBERT](https://arxiv.org/abs/1909.11942)
- [Compositional Embeddings Using Complementary Partitions](https://arxiv.org/abs/1909.02107)
- [Hash Embeddings for Efficient Word Representations](https://arxiv.org/abs/1709.03933)

