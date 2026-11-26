---
Title | 3D Algos
-- | --
Created @ | `2023-06-17T15:33:41Z`
Updated @| `2026-11-26T10:15:13Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/422)

---
# 3D 算法
- 配准
- 重建
- ...

## 配准（Registration）

把不同视角或时刻得到的点云对齐到同一坐标系，求刚体变换 =(R,t)$：

$$
\hat{T}=\arg\min_{R,t}\sum_{i}\big\lVert R\,p_i+t-q_i\big\rVert^2
$$

其中：

- $p_i$：源点云中的点；$q_i$：目标点云中与之对应的点
- $R$：旋转矩阵；$t$：平移向量；$\hat{T}$：使对应点之间的距离平方和最小的变换

| 类别 | 方法 | 文章 |
| --- | --- | --- |
| 精配准 | ICP 及变体（GICP、PLICP、NICP、MBICP） | [ICP](https://github.com/junxnone/aiwiki/issues/86)、[GICP](https://github.com/junxnone/aiwiki/issues/296)、[PLICP](https://github.com/junxnone/aiwiki/issues/593)、[NICP](https://github.com/junxnone/aiwiki/issues/594)、[MBICP](https://github.com/junxnone/aiwiki/issues/592) |
| 精配准 | NDT | [NDT](https://github.com/junxnone/aiwiki/issues/295) |
| 粗配准 | PPF、4PCS、Super4PCS、FGR、SAC-IA、RANSAC | [PPF](https://github.com/junxnone/aiwiki/issues/85)、[4PCS](https://github.com/junxnone/aiwiki/issues/589)、[FGR](https://github.com/junxnone/aiwiki/issues/591)、[SACIA](https://github.com/junxnone/aiwiki/issues/300)、[RANSAC](https://github.com/junxnone/aiwiki/issues/595) |
| 评价 | 配准指标 | [Registration Metrics](https://github.com/junxnone/aiwiki/issues/236) |

表中：

- **粗配准**：无初值时给出大致对齐，对初始位置不敏感；**精配准**：在较好初值上迭代收敛到高精度
- 对比结论：通常先粗配准、再精配准；总览见 [Registration](https://github.com/junxnone/aiwiki/issues/235)

## 重建（Reconstruction）

- 总览：[3D 重建](https://github.com/junxnone/aiwiki/issues/305)
- 实时稠密重建：[KinectFusion](https://github.com/junxnone/aiwiki/issues/306)
- 表面网格化：[GreedyProjectionTriangulation](https://github.com/junxnone/aiwiki/issues/399)

