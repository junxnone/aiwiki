---
Title | ML PreP DataAug AutoAugment
-- | --
Created @ | `2020-07-10T05:17:03Z`
Updated @| `2026-11-26T08:33:55Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/256)

---
# AutoAugment

AutoAugment 把「如何做数据增强」当作一个搜索问题：用自动搜索从数据中学习最优的增强策略，而不是人工设计。

## 搜索方法
- Bayesian Optimization
- CycleSR
- PBA
- RL

## 增强策略的搜索空间

一个**策略（policy）**由若干个**子策略（sub-policy）**组成，训练时每个 batch 随机选一个子策略，依次应用其中的两个操作。每个操作有两个参数：

| 元素 | 含义 | 取值 |
| --- | --- | --- |
| 操作（operation） | 如 ShearX、Rotate、Color、Equalize、Posterize 等 | 论文用 16 种 |
| 概率 $p$ | 该操作被执行的概率 | 离散成 11 档 |
| 幅度 $m$ | 操作的强度，如旋转角度 | 离散成 10 档 |

表中：

- 每个子策略包含两个「（操作，$p$，$m$）」；论文的最终策略由 5 个子策略组成
- 对比结论：搜索空间是离散的，可以用强化学习等方法搜索

## 搜索过程

```mermaid
flowchart LR
    C[控制器 RNN] -- 采样 --> P[增强策略]
    P --> T[用该策略训练子网络]
    T --> A[验证集准确率 R]
    A -- 奖励 --> C
```

图中：

- 控制器（一个 RNN）每轮采样一个增强策略
- 用该策略训练一个小的子模型，在验证集上得到准确率，作为奖励
- 用奖励更新控制器（论文用 PPO），使它倾向于采样更好的策略
- 关键结论：每次评估一个策略都要训练一个网络，所以搜索代价很高

控制器的优化目标：

$$
J(\theta)=\mathbb{E}_{P\sim\pi_\theta}\left[R(P)\right]
$$

其中：

- $\theta$：控制器参数；$\pi_\theta$：控制器给出的策略分布
- $P$：一个采样出的增强策略；$R(P)$：用 $P$ 训练出的子网络在验证集上的准确率（奖励）
- $\mathbb{E}$：对采样的策略取期望，即希望平均奖励最大

## 后续改进

| 方法 | 改进点 |
| --- | --- |
| Fast AutoAugment | 用密度匹配替代反复训练，搜索大幅加速 |
| PBA | 基于种群的增强，学习的是随训练变化的增强调度 |
| DeepAugment | 对增强策略做超参数式的搜索 |
| RandAugment | 去掉搜索，只调两个超参数（操作数 N、幅度 M） |

表中：

- 对比结论：AutoAugment 效果好但搜索昂贵，后续工作的主要方向是降低搜索成本

## Bayesian Optimization

![image](https://user-images.githubusercontent.com/2216970/87517142-0f835e00-c6b1-11ea-84eb-2886c407ba75.png)

图中：该图为原文档附带的贝叶斯优化相关示意图，对应上文「搜索方法」中的 Bayesian Optimization；贝叶斯优化的基础见 [ML AutoML HPO BO](https://github.com/junxnone/aiwiki/issues/22)。

## Reference

- [paper - 2018 - AutoAugment: Learning Augmentation Policies from Data](https://arxiv.org/abs/1805.09501) 
- [PBA](https://github.com/huawei-noah/vega/blob/master/docs/cn/algorithms/pba.md)
- [AutoAugment](https://github.com/DeepVoltaire/AutoAugment)
- [Fast AutoAugment](https://github.com/kakaobrain/fast-autoaugment)
- [DeepAugment](https://github.com/barisozmen/deepaugment)
- [DeepAugment slides](https://docs.google.com/presentation/d/1_010gIxxEVjhtZLwCHPOGGuwtAgfSIcQbCVqDSaa2x0/edit?usp=sharing)

