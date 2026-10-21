---
Title | 3D Cloud Sampling
-- | --
Created @ | `2022-02-09T02:28:30Z`
Updated @| `2026-10-21T05:10:54Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/285)

---
# 降采样 (Point Cloud Downsampling)

点云降采样：在尽量保留几何/拓扑信息的前提下减少点的数量，常用于配准、实时处理前的预处理步骤，降低后续计算量。

## 常见方法

| 方法 | 原理 | 特点 |
|---|---|---|
| **体素网格滤波（VoxelGrid）** | 把空间划分成规则体素网格，每个非空体素内的点用质心/重心代表 | 最常用，速度快，下采样后点分布接近均匀，但会丢失体素内的局部细节 |
| **随机采样（Random Sampling）** | 随机挑选固定比例/数量的点 | 实现最简单，但不保证采样后点的空间分布均匀，可能丢失稀疏区域的几何信息 |
| **均匀采样（Uniform Sampling）** | 思路与 VoxelGrid 类似，基于半径邻域去重而不是网格划分 | 效果与 VoxelGrid 接近 |
| **最远点采样（Farthest Point Sampling, FPS）** | 每次迭代挑选离当前已选点集最远的点，保证采样点尽量覆盖全局、分布均匀 | 迭代式计算，开销比体素网格大，但采样质量更好，是 [3D 深度学习技术综述](0233_3D_DL) 里 PointNet++ Set Abstraction 层的标准做法 |
| **法向空间采样（Normal-Space Sampling）** | 按法向量方向分桶，保证每个方向都采样到足够的点 | 本文引用论文（Geometrically Stable Sampling）的思路，目的是让采样后的点云在 ICP 配准时约束更充分、收敛更稳定，而不是单纯追求几何上均匀分布 |

## 怎么选

- **配准前预处理**：优先 VoxelGrid（速度快）；对配准稳定性要求高时，可以考虑法向空间采样。
- **深度学习输入预处理**（如点云分类/分割网络要求固定输入点数）：优先 FPS，因为它能保证采样后的点集覆盖全局几何，不会因为随机性丢失关键区域。

## Reference
- [Geometrically Stable Sampling for the ICP Algorithm](https://graphics.stanford.edu/papers/stabicp/)
- [3D 深度学习技术综述](0233_3D_DL)
- [3D Cloud](0423_3D_Cloud)

