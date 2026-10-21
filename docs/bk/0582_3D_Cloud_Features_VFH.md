-----

| Title     | 3D Cloud Features VFH                                 |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-21T05:35:47Z`                                |
| Updated @ | `2026-10-21T05:35:47Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/582) |

-----

# VFH - Viewpoint Feature Histogram

  - VFH 是**全局描述子**——用一个直方图描述整个点云簇（通常是分割出来的单个物体），而不是像 PFH/FPFH
    那样描述某一个点的局部邻域。
  - 建立在 [FPFH](0299_3D_Cloud_Features_FPFH) 之上，但反过来加入视点方向信息——FPFH
    刻意设计成姿态无关，适合局部配准；VFH 面向物体识别+姿态估计场景，反而需要显式保留姿态信息。

## 组成：两部分直方图拼接

1.  **视点方向分量**：物体簇上每个点的法向量，与"传感器→该点"方向之间的夹角统计直方图——本质上是对整个物体簇算一遍类似 FPFH
    的角度统计，只是参考方向换成了视点方向，而不是邻域内部点对的相对关系；
2.  **形状分布分量（SDC，Shape Distribution
    Component）**：物体簇内所有点到质心的距离直方图，描述物体的整体尺度/形状轮廓。

两部分拼接后输出 **308 维**向量（`pcl::VFHSignature308`）。

## 局限：对遮挡敏感

VFH
的两个分量都依赖对"整个物体簇"的全局统计（质心位置、整体法向量分布）——如果物体被部分遮挡、点云缺失一大块，算出来的质心会发生明显偏移，导致整个描述子失真。这是
VFH 最大的弱点，后续的 Clustered VFH（CVFH）就是为了解决这个问题被提出的。

## UseCase

典型使用流程：先把场景点云做分割（Segmentation），把每个独立物体切成一个簇，对每个簇单独计算一个 VFH
描述子，再拿这个描述子去数据库里做最近邻检索，同时匹配出"这是什么物体"以及"大致是什么姿态"——是物体识别+粗略
6DOF 姿态估计的常用全局描述子，常见于机器人抓取流水线里"先识别再精确定位"的第一步。

## Reference

  - Rusu, R.B., Bradski, G., Thibaux, R., Hsu, J. Fast 3D Recognition
    and Pose Using the Viewpoint Feature Histogram, IROS 2010
  - [3D Cloud Features FPFH](0299_3D_Cloud_Features_FPFH)
  - [3D Cloud Features](0424_3D_Cloud_Features)
