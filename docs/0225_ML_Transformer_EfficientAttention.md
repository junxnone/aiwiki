---
Title | ML Transformer EfficientAttention
-- | --
Created @ | `2021-02-23T02:47:17Z`
Updated @| `2026-11-19T09:38:48Z`
Labels | `index`
Edit @| [here](https://github.com/junxnone/aiwiki/issues/225)

---
# Efficient Attention

标准 Self-Attention 的时间和显存开销为 $`O(n^2)`$（$`n`$ 为序列长度），是 Transformer 处理长序列的主要瓶颈。Efficient Attention（Efficient Transformer）要解决的问题：

- 减小内存占用
- 减少计算量
- 增加长序列数据的处理能力

## Dense Attention & Sparse Attention

- **Dense Attention**：标准做法，每个 token 与所有 token 计算注意力，得到完整的 $`n \times n`$ 矩阵
- **Sparse Attention**：每个 token 只关注一部分位置，注意力矩阵是稀疏的
- 另一类思路不限制关注位置，而是用**低秩 / 核函数近似**避免显式构造 $`n \times n`$ 矩阵

## 分类

参考综述 *Efficient Transformers: A Survey* 的划分：

类别 | 思路 | 代表模型
-- | -- | --
Fixed / Combination of Patterns | 按固定模式（局部窗口、跨步、全局 token）限制关注范围 | Sparse Transformer, Longformer, Big Bird
Learnable Patterns | 根据内容学习/聚类出关注范围 | Reformer (LSH), Routing Transformer, Sinkhorn Transformer
Low-Rank / Down-sampling | 压缩 $`K, V`$ 的序列维度 | [Linformer](/0224_ML_Transformer_Linformer), Nyströmformer
Kernel / Linear Attention | 用核函数特征映射改变计算顺序，先算 $`K^\top V`$ | Linear Transformers, Performer
Memory | 引入额外的全局记忆 token | Set Transformer, Compressive Transformer

## 代表模型

Name | Description | Complexity
-- | -- | --
Sparse Transformer | 固定的跨步 + 局部稀疏模式 | $`O(n\sqrt{n})`$
Reformer | LSH 将相近的 query/key 分到同一桶内，只在桶内计算；同时使用可逆残差层省显存 | $`O(n\log n)`$
Longformer | 滑动窗口局部注意力 + 少量任务相关的全局 token | $`O(n)`$
[Linformer](/0224_ML_Transformer_Linformer) | 用可学习投影把 $`K, V`$ 从 $`n`$ 压缩到 $`k`$，基于注意力矩阵低秩假设 | $`O(n)`$
Performer | FAVOR+：用正交随机特征无偏近似 softmax 核，无需构造注意力矩阵 | $`O(n)`$
Linear Transformers | 把 softmax 换成核特征映射 $`\phi`$，$`\phi(Q)(\phi(K)^\top V)`$，因果形式可写成 RNN | $`O(n)`$
Big Bird | 滑动窗口 + 全局 token + 随机注意力的组合，理论上保持表达能力 | $`O(n)`$

Linear Attention 的核心是矩阵乘法结合律：

$$
\mathrm{softmax}(QK^\top)V \;\to\; \phi(Q)\big(\phi(K)^\top V\big)
$$

符号说明：$`Q, K, V \in \mathbb{R}^{n\times d}`$；$`\phi`$ 是逐行作用的特征映射（如 $`\phi(x)=\mathrm{elu}(x)+1`$），用来近似 softmax 核 $`\exp(q^\top k)`$，使 $`\exp(q^\top k) \approx \phi(q)^\top\phi(k)`$；式中省略了行归一化项（分母）。

- 左边 $`(QK^\top)V`$：先算 $`n\times n`$ 的矩阵，代价 $`O(n^2 d)`$，显存 $`O(n^2)`$
- 右边 $`\phi(Q)\big(\phi(K)^\top V\big)`$：先算 $`\phi(K)^\top V`$，形状为 $`d\times d`$（对 $`n`$ 个位置求和），代价 $`O(n d^2)`$，再用 $`\phi(Q)`$ 左乘，同样是 $`O(nd^2)`$；全程没有出现 $`n\times n`$ 矩阵
- 因此当 $`n \gg d`$ 时，复杂度从 $`O(n^2d)`$ 降为 $`O(nd^2)`$，对 $`n`$ 线性
- softmax 因为有逐行指数和归一化，无法这样交换乘法顺序，这就是要换成可分解核 $`\phi`$ 的原因

## 精确但更快：FlashAttention

上述方法多数是**近似**注意力。FlashAttention 不改变计算结果，而是通过分块（tiling）和重计算减少 GPU 显存（HBM）读写，实现 IO-aware 的精确注意力，已成为现代训练/推理的默认实现。

## Reference
- [Efficient Attention](https://github.com/Separius/awesome-fast-attention)
- 2020-09 Efficient Transformers: A Survey [[Paper](https://arxiv.org/abs/2009.06732)] [[Note](https://github.com/junxnone/tech-io/issues/934)]
- [Transformers大家族——Efficient Transformers: A Survey](https://zhuanlan.zhihu.com/p/263031249)
- 2022-05 FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness [[Paper](https://arxiv.org/abs/2205.14135)]

