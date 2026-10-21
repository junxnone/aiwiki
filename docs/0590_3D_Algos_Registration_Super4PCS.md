---
Title | 3D Algos Registration Super4PCS
-- | --
Created @ | `2026-10-21T06:25:34Z`
Updated @| `2026-10-21T06:25:34Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/590)

---
# Super4PCS

Super4PCS 是对 3D Algos Registration 4PCS 的工程化加速版本——4PCS 本身的算法思路（共面四点+仿射不变比例）没有变化，Super4PCS 解决的是 4PCS 两个主要性能瓶颈：候选点对提取和非刚性候选的剔除，把算法的渐进复杂度从 $O(n^2)$ 降到 $O(n)$。

## 核心改进：智能索引（Smart Indexing）

4PCS 最耗时的两步是：
1. 在目标点云里搜索和基准集对角线长度匹配的候选点对；
2. 对大量候选四点组逐一验证是否满足刚体变换约束，剔除不满足的候选（4PCS 原始实现里这一步会产生大量"看起来距离匹配、但实际不满足刚体约束"的冗余候选，浪费计算）。

Super4PCS 用**3D 网格空间索引**结构组织目标点云，把"搜索距离匹配的候选点对"从暴力枚举变成索引查询，同时在索引阶段就提前过滤掉几何上不可能满足刚体约束的候选组合，避免后续逐一验证的浪费——这两处改进共同把复杂度从平方级降到线性级。

## 优点

- 和 4PCS 效果基本一致（同样不依赖特征描述子、适用任意初始姿态），但速度大幅提升，适合更大规模的点云；
- 作为开源实现广泛流传，是很多后续工作（如 Dynamic 4PCS、K-4PCS、Generalized 4PCS）的基础参照。

## 缺点

- 仍然继承了 4PCS 对噪声敏感、需要预估重叠率的问题（只是解决了速度瓶颈，没有解决算法本身的鲁棒性局限）；
- 索引结构在极稀疏或分布极不均匀的点云上，加速效果会打折扣。

## 衍生工作

针对 4PCS/Super4PCS 仍然存在的局限，后续还有几个方向的改进：**K-4PCS**（先提取关键点再做 4PCS，减少参与计算的点数）、**Generalized 4PCS**（把基准集从要求共面放宽到任意四点）、**Dynamic 4PCS**（每轮迭代自动估计重叠率，不需要人工预设）——这些工作本仓库暂未单独展开。

## Reference
- Mellado, N., Aiger, D., Mitra, N.J. Super 4PCS: Fast Global Pointcloud Registration via Smart Indexing, Symposium on Geometry Processing (SGP) 2014
- [3D Algos Registration](0235_3D_Algos_Registration)

