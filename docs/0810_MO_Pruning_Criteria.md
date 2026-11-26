---
Title | MO Pruning Criteria
-- | --
Created @ | `2026-11-26T14:35:18Z`
Updated @| `2026-11-26T14:35:54Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/810)

---
# 重要性准则

剪枝要回答一个问题：**去掉哪些参数，对损失影响最小？** 重要性准则（saliency）就是给每个参数或结构打分，得分低的先剪。系列总览见 [剪枝](https://github.com/junxnone/aiwiki/issues/808)，基础概念见 [基础原理](https://github.com/junxnone/aiwiki/issues/809)。

## 从损失变化出发

去掉参数 $w_i$（置零）引起的损失变化，在当前点做泰勒展开：

$$
\Delta\mathcal{L}_i=\mathcal{L}(w_i=0)-\mathcal{L}(w_i)\approx-g_iw_i+\frac{1}{2}h_{ii}w_i^2+\cdots
$$

其中：

- $w_i$：第 $i$ 个参数；$g_i=\partial\mathcal{L}/\partial w_i$：梯度；$h_{ii}$：Hessian 矩阵的对角元素（二阶导）
- 一阶项 $g_iw_i$ 反映「沿梯度方向移动」的影响；二阶项反映曲率
- 各种准则的差别，就在于保留展开式的哪几项，以及如何近似它们

## 常见准则

| 准则 | 评分 $S_i$ | 需要 | 特点 |
| --- | --- | --- | --- |
| 幅度（Magnitude） | $\lvert w_i\rvert$ | 仅权重 | 最简单，至今是强基线 |
| 范数（L1 / L2，结构化） | $\lVert W_{k}\rVert_p$ | 权重 | 对滤波器 $k$ 整体打分，用于通道剪枝 |
| BN 缩放因子 | $\lvert\gamma_c\rvert$ | 训练时对 $\gamma$ 加 L1 | Network Slimming，用 BN 的 $\gamma$ 代表通道重要性 |
| 一阶泰勒 | $\lvert g_iw_i\rvert$ 或 $(g_iw_i)^2$ | 梯度 | 衡量对损失的一阶影响 |
| 二阶（OBD） | $\tfrac12h_{ii}w_i^2$ | Hessian 对角 | 考虑曲率，计算量更大 |
| 二阶（OBS） | $\dfrac{w_i^2}{2\,[H^{-1}]_{ii}}$ | Hessian 逆 | 精度最高，并给出对其余权重的补偿 |
| 连接敏感度（SNIP） | $\dfrac{\lvert g_iw_i\rvert}{\sum_k\lvert g_kw_k\rvert}$ | 一批数据的梯度 | 训练前剪枝，见 [剪枝流程](https://github.com/junxnone/aiwiki/issues/811) |
| 移动剪枝（Movement） | $-w_i\,g_i$（累积） | 微调期间的梯度 | 剪「在微调中朝 0 移动」的权重，适合迁移学习 |

表中：

- $S_i$ 越小越先被剪；$H$ 为完整 Hessian，$[H^{-1}]_{ii}$ 为其逆矩阵的第 $i$ 个对角元素
- 对比结论：精度从低到高、计算量从小到大大致是 幅度 < 一阶泰勒 < OBD < OBS

## 幅度剪枝

$$
M_i=\begin{cases}0 & \lvert w_i\rvert\le\tau\1 & \lvert w_i\rvert>\tau\end{cases}
$$

其中：$\tau$ 是阈值，通常由目标稀疏度 $s$ 决定：取所有（层内或全局）权重绝对值的第 $s$ 分位数。

- **层内（layer-wise）**：每层各自剪到同样的稀疏度，简单但忽略了各层重要性差异
- **全局（global）**：所有层放在一起排序，整体剪掉绝对值最小的 $s$ 比例，会自动让不重要的层剪得更多，但要注意权重尺度在层间的差异

## 结构化的范数准则

对卷积层第 $k$ 个滤波器 $W_k\in\mathbb{R}^{C_{in}\times K\times K}$：

$$
S_k=\lVert W_k\rVert_1=\sum_{c,i,j}\lvert W_k[c,i,j]\rvert
$$

其中：$C_{in}$ 为输入通道数，$K$ 为卷积核大小；$S_k$ 是该滤波器所有权重绝对值之和。范数小的滤波器输出幅度小，通常对后续影响也小，整体移除，见 [结构化剪枝](https://github.com/junxnone/aiwiki/issues/812)。

## 二阶方法：OBD 与 OBS

用二次近似损失，去掉权重 $w_q$ 并调整其余权重 $\delta w$ 的最优解（OBS）为：

$$
\delta w=-\frac{w_q}{[H^{-1}]_{qq}}\,H^{-1}e_q,\qquad L_q=\frac{w_q^2}{2\,[H^{-1}]_{qq}}
$$

其中：

- $e_q$：第 $q$ 个位置为 1 的单位向量；$H^{-1}$：Hessian 的逆
- $\delta w$：剪掉 $w_q$ 后，对其余权重的**补偿调整**，使损失增加最小
- $L_q$：剪掉 $w_q$ 引起的最小损失增量，用作评分
- OBD 是 OBS 的简化：只用 Hessian 的对角元素，忽略权重之间的相互作用
- 现代 LLM 剪枝（SparseGPT）的理论基础就是 OBS 的逐层近似，见 [LLM 剪枝](https://github.com/junxnone/aiwiki/issues/814)

## 选择建议

- 只想要一个快速可用的基线：幅度剪枝（全局或层内）
- 结构化通道剪枝：滤波器 L1 范数，或带 BN 稀疏正则的 Network Slimming
- 有少量数据且要求更高精度：泰勒或二阶方法
- LLM：Wanda、SparseGPT（见 [LLM 剪枝](https://github.com/junxnone/aiwiki/issues/814)）

