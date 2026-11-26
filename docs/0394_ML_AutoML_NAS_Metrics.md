---
Title | ML AutoML NAS Metrics
-- | --
Created @ | `2020-07-17T02:37:41Z`
Updated @| `2026-11-26T09:28:22Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/394)

---
# NAS Metrics

NAS（神经网络结构搜索）的评价包括：搜到的结构好不好（精度）、搜索花了多少代价（效率）、搜索时的评估方式靠不靠谱（排序相关性）。

- Accuracy
- Efficiency
  - GPU Days = N X D =  `Number of GPUs` X `Number of days`
- Kendall Tau metric

## Accuracy

搜到的结构经过完整训练后，在测试集上的最终精度（如 CIFAR-10 的错误率、ImageNet 的 Top-1）。通常还同时报告参数量和 FLOPs，以便比较精度与计算代价。

## Efficiency

$$
\text{GPU Days}=N\times D
$$

其中：

- $N$：使用的 GPU 数量（Number of GPUs）
- $D$：搜索所用天数（Number of days）
- 含义：把搜索消耗折算成「单卡运行多少天」，便于比较不同方法的搜索成本；数值越小越高效

## Kendall Tau metric

NAS 搜索中常用代理评估（如共享权重、少量 epoch 训练）来快速给候选结构打分。Kendall Tau 衡量**代理评估的排序**与**完整训练的真实排序**是否一致：

$$
\tau=\frac{N_C-N_D}{\binom{n}{2}}=\frac{N_C-N_D}{n(n-1)/2}
$$

其中：

- $n$：参与比较的结构数量；$\binom{n}{2}$：结构两两配对的总对数
- $N_C$：concordant 对数，即两个排序中大小关系一致的配对数
- $N_D$：discordant 对数，即两个排序中大小关系相反的配对数
- $\tau\in[-1,1]$：越接近 1，代理评估越可靠

Kendall Tau metric | ![image](https://user-images.githubusercontent.com/2216970/87631033-21283c80-c769-11ea-9d92-e5bfa15cb4c5.png)
-- | --
NC | concordant
ND | discordant
τ = 1 |  两个 `rankings` 一致, 算法在搜索和评估阶段都表现比较好
τ = -1 | 两个 `rankings` 完全相反, 算法搜索表现好, 但是评估阶段差
τ = 0 | 两个 `rankings` 不相关, 类似随机搜索

表中：

- 右上角图为原文档附带的示意图，对应上面的排序一致性
- 对比结论：$\tau$ 越高，说明搜索阶段选出的「好结构」在完整训练后也确实好；$\tau\approx0$ 说明代理评估没有信息量，和随机搜索无异

## 小结

| 指标 | 衡量什么 | 越…越好 |
| --- | --- | --- |
| Accuracy | 搜索结果的最终质量 | 越高 |
| GPU Days | 搜索成本 | 越低 |
| Kendall $\tau$ | 代理评估与真实性能的一致性 | 越接近 1 |

表中：完整的 NAS 评价要同时给出这三类指标。搜索空间的设计见 [Search Space](https://github.com/junxnone/aiwiki/issues/392)。

