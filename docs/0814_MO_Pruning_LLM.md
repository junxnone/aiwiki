---
Title | MO Pruning LLM
-- | --
Created @ | `2026-11-26T14:35:33Z`
Updated @| `2026-11-26T14:36:03Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/814)

---
# LLM 剪枝

大语言模型的参数量巨大，重训练代价极高，所以 LLM 剪枝的特点是：**只用少量校准数据、不做（或只做很轻的）重训练**，逐层完成。系列总览见 [剪枝](https://github.com/junxnone/aiwiki/issues/808)，评分原理见 [重要性准则](https://github.com/junxnone/aiwiki/issues/810)。

## 逐层剪枝问题

对每一层，目标是保证剪枝后该层的**输出**尽量不变：

$$
\min_{\hat{W}}\ \big\lVert WX-\hat{W}X\big\rVert_2^{2}\quad\text{s.t.}\quad\hat{W}\ \text{满足稀疏约束}
$$

其中：

- $W$：该层原始权重；$\hat{W}$：剪枝后的权重；$X$：校准数据经过前面各层后，输入到该层的激活
- $\lVert\cdot\rVert_2^2$：输出差异的平方范数，这是各层「局部」的重构误差
- 稀疏约束：如非结构化 50%、2:4（见 [N:M 稀疏](https://github.com/junxnone/aiwiki/issues/813)）
- 这种逐层重构只需要少量前向，不需要端到端的梯度

## SparseGPT

基于 OBS（见 [重要性准则](https://github.com/junxnone/aiwiki/issues/810)）的一次性剪枝：

- 对每层按列逐个处理：选定要剪的权重后，用 Hessian 的逆把误差**补偿到同一行尚未处理的权重上**，使输出尽量不变
- Hessian 由校准数据的激活得到：

$$
H=2XX^{\top}+\lambda I
$$

其中：$X$ 为该层的输入激活；$XX^{\top}$ 是输入的二阶统计；$\lambda I$ 为阻尼项，保证矩阵可逆。

- 特点：精度高，可达到 50% 以上的非结构化稀疏，也支持 N:M；缺点是需要求 Hessian 的逆，计算和显存比幅度剪枝大得多

## Wanda

Wanda（Pruning by Weights and activations）：用「权重幅度 × 输入激活范数」打分：

$$
S_{ij}=\lvert W_{ij}\rvert\cdot\lVert X_j\rVert_2
$$

其中：

- $W_{ij}$：第 $i$ 个输出、第 $j$ 个输入对应的权重；$X_j$：校准数据中第 $j$ 个输入特征在所有 token 上的取值；$\lVert X_j\rVert_2$ 为其 $L_2$ 范数
- 含义：同样大的权重，如果对应的输入特征幅度更大，对输出的影响就更大，所以不应该剪
- 在**每个输出神经元内部**比较并剪掉得分最低的那部分（逐输出分组比较），而不是整层统一阈值
- 不需要梯度、不更新权重，比 SparseGPT 快得多，效果相当

## 结构化 LLM 剪枝

| 方法 | 做法 | 恢复 |
| --- | --- | --- |
| LLM-Pruner | 构建依赖图，成组移除耦合的结构（如头、通道） | 用 LoRA 短时微调恢复 |
| Sheared-LLaMA | 把模型剪成目标形状（层、头、隐维度），再用少量数据继续预训练 | 继续预训练，并动态调整各领域数据比例 |
| SliceGPT | 对隐状态做正交变换后截断部分维度 | 理论上保持输出不变的变换 |
| 层剪枝（如 ShortGPT） | 按「层对表示变化的贡献」移除冗余层 | 常配合少量微调 |

表中：

- 结构化方法得到的是真正更小的稠密模型，不依赖稀疏硬件，但精度损失更大，通常要一定的恢复训练
- 对比结论：非结构化（SparseGPT、Wanda）压缩率高但依赖稀疏硬件；结构化直接加速但需要恢复

## 对比

| 方法 | 类型 | 需要的数据 | 重训练 |
| --- | --- | --- | --- |
| 幅度剪枝 | 非结构化 | 无 | 通常不行（LLM 上精度掉得多） |
| Wanda | 非结构化 / N:M | 少量校准数据 | 不需要 |
| SparseGPT | 非结构化 / N:M | 少量校准数据 | 不需要 |
| LLM-Pruner | 结构化 | 少量数据 | 轻量 LoRA |
| Sheared-LLaMA | 结构化 | 一定量预训练数据 | 需要继续预训练 |

表中：对比结论：只有少量数据、希望最省事用 Wanda；追求更高精度用 SparseGPT；要真实加速且能接受一定训练成本用结构化方法。

## 与量化组合

LLM 部署中常先剪枝再量化：稀疏化降低计算量，量化降低显存带宽（见 [LLM 权重量化](https://github.com/junxnone/aiwiki/issues/706)）。两者同时使用时注意：稀疏模式要保证量化后的计算内核仍能利用稀疏。

## 要点

- 在 held-out 数据和下游任务上评估，不能只看困惑度（perplexity）
- 非结构化稀疏若没有专用内核，只能节省存储，不能加速推理（见 [基础原理](https://github.com/junxnone/aiwiki/issues/809)）

