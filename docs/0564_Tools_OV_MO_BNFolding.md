---
Title | Tools OV MO BNFolding
-- | --
Created @ | `2026-10-20T01:40:56Z`
Updated @| `2026-11-26T08:14:42Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/564)

---
# OpenVINO BatchNorm 折叠（BN Folding）

> 本文是 OpenVINO Model Optimizer / 模型转换总览的深入篇，专门展开 **BatchNorm 折叠**——卷积网络部署优化里最基础、也是后续 [OpenVINO 算子融合](0563_Tools_OV_MO_Fusion) 的前置步骤。

## BatchNorm 在推理时到底在算什么

训练阶段，BatchNorm（BN）会动态统计每个 mini-batch 的均值 $\mu_{batch}$ 和方差 $\sigma^2_{batch}$ 来做归一化；但**推理阶段不存在"batch 统计"这回事**——推理时用的是训练过程中累积下来的**滑动平均**均值 $\mu$、方差 $\sigma^2$，加上训练好的缩放参数 $\gamma$、偏移参数 $\beta$，四个都是**固定常量**，不会再变化。推理时 BN 对每个通道做的计算就是一个线性变换：

$$
y = \gamma \cdot \frac{x - \mu}{\sqrt{\sigma^2 + \epsilon}} + \beta
$$

其中：

- $x$：BN 的输入（某通道上的一个激活值）；$y$：输出
- $\mu$、$\sigma^2$：该通道训练时累积的滑动平均均值与方差，推理时为常量
- $\gamma$、$\beta$：可学习的缩放与偏移参数，推理时为常量
- $\epsilon$：防止除零的小常数（常见 $10^{-5}$）

注意这个公式里，对给定的某一层，$\gamma$、$\mu$、$\sigma^2$、$\beta$、$\epsilon$ 都已经是训练完定下来的常数——所以整个 BN 操作本质上就是一个逐通道的线性函数：

$$
y = a x + b,\qquad a=\frac{\gamma}{\sqrt{\sigma^2+\epsilon}},\quad b=\beta-\frac{\gamma\mu}{\sqrt{\sigma^2+\epsilon}}
$$

其中：

- $a$：等效的逐通道缩放系数；$b$：等效的逐通道偏置

## 为什么能折叠进前一层 Conv

BN 几乎总是跟在 Conv 后面：$y = \mathrm{BN}(\mathrm{Conv}(x))$。而 Conv 本身也是线性运算（卷积 + 偏置）：$\mathrm{Conv}(x) = W * x + b_{conv}$。两个线性变换复合之后，数学上仍然是一个线性变换，可以合并成一组新的 $W'$、$b'$：

$$
W' = W \cdot \frac{\gamma}{\sqrt{\sigma^2 + \epsilon}},\qquad
b' = (b_{conv} - \mu)\cdot\frac{\gamma}{\sqrt{\sigma^2 + \epsilon}} + \beta
$$

其中：

- $W$：原卷积核权重；$W'$：折叠后的卷积核，按输出通道缩放（每个输出通道乘各自的 $a$）
- $b_{conv}$：原卷积偏置；$b'$：折叠后的新偏置
- $*$：卷积运算；$\mu,\sigma^2,\gamma,\beta,\epsilon$：同上

折叠之后，$\mathrm{BN}(\mathrm{Conv}(x))$ 和 $\mathrm{Conv}'(x) = W' * x + b'$ 在数值上完全等价（浮点舍入误差可忽略）——**这是一次无损变换**，不是近似，因为用到的全部是推理时已经固定不变的常量，纯粹是代数上的合并，不涉及任何精度牺牲。

## 折叠带来的好处

- **少一个独立算子**：BN 被合并进 Conv 的权重/偏置之后，计算图里不再有单独的 BatchNorm 节点，直接减少了一次算子调用、一次中间结果的读写；
- **为后续融合铺路**：折叠后图里只剩 `Conv → Activation`，这正是 [OpenVINO 算子融合](0563_Tools_OV_MO_Fusion) 里最经典的 Conv+Activation 融合场景——如果不先把 BN 折叠掉，Conv 和 Activation 中间还隔着一个 BN，没法直接融合；
- **减小模型体积和内存占用**：BN 自己的四个参数（$\gamma$、$\beta$、$\mu$、$\sigma^2$）折叠后不再需要单独存储，直接被吸收进了 Conv 的权重里。

## 什么时候不能直接折叠

- BN 后面紧跟着的不是固定推理用的统计量，而是训练模式下的 BN（比如量化感知训练过程中的 BatchNormalization，还在动态更新统计量）——这种情况下 BN 不是纯常量变换，不能直接折叠，必须等训练/校准完成、BN 进入推理模式（`eval()`/固定统计量）之后才能做；
- Conv 和 BN 之间插了一个**非线性**操作（比如中间有激活函数）——线性变换的复合前提被打破，这种拓扑结构下 BN 没法直接吸收进前一层 Conv，只能保留为独立算子。

## Reference
- Ioffe, S. & Szegedy, C. (2015). Batch Normalization: Accelerating Deep Network Training by Reducing Internal Covariate Shift. [arXiv:1502.03167](https://arxiv.org/abs/1502.03167)
- [OpenVINO 算子融合](0563_Tools_OV_MO_Fusion)
- [OpenVINO Model Optimizer 总览](0181_Tools_OV_MO)


