---
Title | 3D Tools PCL Downsampling
-- | --
Created @ | `2021-05-11T03:54:21Z`
Updated @| `2026-11-26T09:13:38Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/82)

---
# Downsampling

点云下采样：在尽量保留形状特征的前提下减少点的数量，降低后续配准、分割、重建等算法的计算量，并让点密度更均匀。

## 方法

- Voxel Grid Downsampling
- Farthest Point Sampling
- Normal Space Sampling
- Uniform Sampling
- Random Sampling

| 方法 | 做法 | 特点 |
| --- | --- | --- |
| Voxel Grid | 划分体素栅格，每个体素用一个点代表 | 点密度均匀，最常用，速度快 |
| Farthest Point Sampling | 迭代选取距离已选点最远的点 | 覆盖均匀，常用于深度学习，计算较慢 |
| Normal Space Sampling | 按法向量分布采样 | 保留不同朝向的几何特征，适合配准 |
| Uniform Sampling | 按固定间隔或半径均匀选点 | 简单 |
| Random Sampling | 随机选取 | 最快，但可能丢失细节 |

表中：对比结论：追求均匀和速度选 Voxel Grid；需要保证覆盖和特征时用 FPS 或 Normal Space Sampling。

## Voxel Grid Downsampling

- 创建 3D 栅格
- 每个栅格内的所有点的重心作为采样点
- 栅格越大，下采样倍率越大

点 $p$ 所在体素的编号和该体素的代表点：

$$
\mathrm{idx}(p)=\left\lfloor\frac{p}{l}\right\rfloor,\qquad \bar{p}_v=\frac{1}{|V|}\sum_{p_i\in V}p_i
$$

其中：

- $p=(x,y,z)$：点的坐标；$l$：体素边长（PCL 的 `leaf size`）；$\lfloor\cdot\rfloor$：向下取整
- $V$：落在同一体素内的点集；$|V|$：其中点的个数
- $\bar{p}_v$：该体素内所有点的重心，作为这个体素的采样点
- 体素越大，每个体素内点越多，输出点越少

## Farthest Point Sampling

$$
p_{k+1}=\arg\max_{p\in P}\ \min_{q\in S_k}\ \lVert p-q\rVert
$$

其中：

- $P$：原始点集；$S_k$：已选出的 $k$ 个点
- $\min_{q\in S_k}\lVert p-q\rVert$：点 $p$ 到已选点集的最近距离
- 每次选使该距离最大的点，使采样点尽量分散；常从随机点开始，重复到所需个数

## UseCase
### Voxel Grid Downsampling

- a pcl::VoxelGrid filter is created with a leaf size of 1cm
```
#include <pcl/filters/voxel_grid.h>

  pcl::VoxelGrid<pcl::PCLPointCloud2> sor;
  sor.setInputCloud (cloud);
  sor.setLeafSize (0.01f, 0.01f, 0.01f);
  sor.filter (*cloud_filtered);

```

其中 `setLeafSize` 设置体素在 x、y、z 三个方向的边长（单位与点云一致，这里 0.01 即 1 cm）。

## Reference
- [Downsampling a PointCloud using a VoxelGrid filter](https://pcl.readthedocs.io/projects/tutorials/en/latest/voxel_grid.html#voxelgrid) [[code](https://github.com/PointCloudLibrary/pcl/blob/master/doc/tutorials/content/sources/voxel_grid/voxel_grid.cpp)]

