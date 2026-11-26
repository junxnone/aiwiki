---
Title | ML Arch HP
-- | --
Created @ | `2023-02-02T09:12:37Z`
Updated @| `2026-11-26T08:33:41Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/368)

---
# Hyperparameter 超参数

- batch size
- LR
- Optimizer parameters
- ...

超参数是**训练前人为设定**、不通过梯度下降学习的参数；与之相对，权重、偏置等是训练中学出来的参数。

## 常见超参数

| 类别 | 例子 | 影响 |
| --- | --- | --- |
| 数据 | batch size、数据增强强度 | 梯度噪声、泛化 |
| 优化 | 学习率 LR、动量、权重衰减、优化器类型 | 收敛速度与稳定性 |
| 学习率调度 | 衰减方式、warmup 步数（见 [AnnealingLR](https://github.com/junxnone/aiwiki/issues/372)、[CLR](https://github.com/junxnone/aiwiki/issues/266)） | 后期收敛与跳出局部极小 |
| 模型结构 | 层数、宽度、卷积核大小、dropout 比例 | 容量与过拟合 |
| 训练流程 | epoch 数、早停（Early Stopping）条件 | 训练时长与过拟合 |

表中：

- **warmup**：训练初期用较小学习率逐步升到目标值，避免一开始不稳定
- **权重衰减**：对权重的 L2 正则，限制模型复杂度
- 对比结论：学习率通常是最敏感的超参数，应最先调

## Batch Size

- 大多数超参数的最佳值对Batch Size敏感, 因此, 更改 Batch Size 通常需要重新开始调整过程。
- 尽量最开始选择合适的 Batch Size, 否则后期调整，需要调整其他超参，费时费力。

增大 batch size 时，常用线性缩放规则同步调整学习率：

$$
\eta' = k\,\eta,\qquad B' = k\,B
$$

其中：

- $B$、$B'$：原来和新的 batch size；$k$：batch size 放大的倍数
- $\eta$、$\eta'$：原来和新的学习率
- 直觉：batch 变大使梯度更准、噪声更小，可以用更大的步长；该规则在 $k$ 很大时不再适用，需要配合 warmup

## 调参方法

| 方法 | 做法 | 特点 |
| --- | --- | --- |
| 手动调参 | 凭经验逐个尝试 | 灵活，依赖经验 |
| 网格搜索 | 在每个超参数的候选值上做全组合（见 [GridSearch](https://github.com/junxnone/aiwiki/issues/205)） | 简单，组合爆炸 |
| 随机搜索 | 在范围内随机采样（见 [RandomSearch](https://github.com/junxnone/aiwiki/issues/204)） | 同样预算下通常比网格搜索更有效 |
| 贝叶斯优化 | 用代理模型指导下一次尝试（见 [BO](https://github.com/junxnone/aiwiki/issues/22)） | 试验次数少，适合昂贵的训练 |
| 学习率范围测试 | 快速扫描学习率（见 [学习率选择](https://github.com/junxnone/aiwiki/issues/263)） | 快速确定学习率量级 |

表中：

- **代理模型**：用来近似「超参数 → 验证效果」关系的模型，如高斯过程
- 对比结论：预算有限时先随机搜索，训练代价高时再考虑贝叶斯优化

## 调参建议

- 用验证集（而不是测试集）评估超参数，避免对测试集过拟合
- 学习率、batch size 常按对数尺度（如 $10^{-4},10^{-3},10^{-2}$）搜索
- 每次只改一个或少数几个变量，并记录实验配置，保证可复现

