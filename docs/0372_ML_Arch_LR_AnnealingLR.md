---
Title | ML Arch LR AnnealingLR
-- | --
Created @ | `2023-02-03T03:08:43Z`
Updated @| `2026-11-26T08:33:50Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/372)

---
# AnnealingLR 退火学习率

退火（annealing）指学习率随训练进行逐渐减小，借鉴模拟退火：前期用大学习率快速探索，后期用小学习率精细收敛。余弦退火让学习率沿余弦曲线平滑下降。

## CosineAnnealingLR

$$
\eta_t=\eta_{min}+\frac{1}{2}\left(\eta_{max}-\eta_{min}\right)\left(1+\cos\left(\frac{T_{cur}}{T_{max}}\pi\right)\right)
$$

其中：

- $\eta_t$：当前的学习率；$\eta_{max}$：初始（最大）学习率；$\eta_{min}$：最小学习率
- $T_{cur}$：当前已经过的 epoch（或 step）数
- $T_{max}$：一个余弦半周期的长度，到 $T_{cur}=T_{max}$ 时学习率降到 $\eta_{min}$
- 形状：开始下降慢、中段快、末段又变慢，末期学习率很小，有利于稳定收敛

PyTorch 中对应 `CosineAnnealingLR(optimizer, T_max, eta_min)`，其中 `T_max`、`eta_min` 即上面的 $T_{max}$、$\eta_{min}$。

![image](https://user-images.githubusercontent.com/2216970/216503342-6aaf60cf-ba72-435f-9317-22259ba778f0.png)

![image](https://user-images.githubusercontent.com/2216970/216503541-dc6a4e9a-cb2b-4e5c-aaa2-3037344663bf.png)

图中：上面两张图为原文档附带的余弦退火示意图，对应上面公式，学习率随迭代沿余弦曲线下降。

## CosineAnnealingWarmRestarts

在余弦退火的基础上，每个周期结束后把学习率「重启」回最大值，再重新下降（SGDR，Stochastic Gradient Descent with Warm Restarts）：

$$
\eta_t=\eta_{min}+\frac{1}{2}\left(\eta_{max}-\eta_{min}\right)\left(1+\cos\left(\frac{T_{cur}}{T_i}\pi\right)\right),\qquad T_i = T_0\cdot T_{mult}^{\,i}
$$

其中：

- $T_i$：第 $i$ 个周期的长度；$T_0$：第一个周期的长度
- $T_{mult}$：周期长度的放大倍数，大于 1 时后面的周期越来越长
- $T_{cur}$：自上次重启以来经过的 epoch / step 数，每次重启归零
- 作用：重启时较大的学习率帮助跳出当前局部极小，并可保存每个周期末的模型做快照集成

PyTorch 中对应 `CosineAnnealingWarmRestarts(optimizer, T_0, T_mult, eta_min)`。

![image](https://user-images.githubusercontent.com/2216970/216503260-404f0dc8-18f8-4c4e-83c6-9851a6b91ea2.png)
![image](https://user-images.githubusercontent.com/2216970/216503572-384cccbe-e9d4-4079-9e81-e00e707956dd.png)

图中：上面两张图为原文档附带的带重启余弦退火示意图，对应上面公式，学习率每个周期内按余弦下降，周期结束时回升到最大值；若 $T_{mult}>1$，后续周期逐渐变长。

## 对比

| 方法 | 学习率曲线 | 特点 |
| --- | --- | --- |
| CosineAnnealingLR | 单周期单调下降 | 简单稳定，最常用 |
| CosineAnnealingWarmRestarts | 多周期锯齿 | 能跳出局部极小，支持快照集成 |
| [CLR 周期学习率](https://github.com/junxnone/aiwiki/issues/266) | 在上下限间周期往复 | 无需精细衰减，配合 LR Finder |

表中：

- 对比结论：训练预算固定时用余弦退火；希望多次探索时用带重启的版本

## Reference
- [CosineAnnealingLR - Pytorch](https://pytorch.org/docs/stable/generated/torch.optim.lr_scheduler.CosineAnnealingLR.html#cosineannealinglr)
- [CosineAnnealingWarmRestarts - Pytorch](https://pytorch.org/docs/stable/generated/torch.optim.lr_scheduler.CosineAnnealingWarmRestarts.html#torch.optim.lr_scheduler.CosineAnnealingWarmRestarts)
- 2016 [SGDR: Stochastic Gradient Descent with Warm Restarts](https://arxiv.org/abs/1608.03983)

