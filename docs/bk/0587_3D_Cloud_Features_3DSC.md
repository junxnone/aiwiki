-----

| Title     | 3D Cloud Features 3DSC                                |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-21T05:35:56Z`                                |
| Updated @ | `2026-10-21T05:35:56Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/587) |

-----

# 3DSC - 3D Shape Context

  - 3D Shape Context 是 2D 图像领域经典的 **Shape Context**
    描述子向三维点云的直接扩展——核心思路是用一个以查询点为中心的**球形区域**，按空间位置分箱统计邻域点的密度分布，用这个分布直方图描述局部几何形状。

## 算法原理

1.  以查询点 $p$ 为球心，建立一个局部球形支撑区域（Support Region），**北极方向对齐该点的法向量**
    $n$（这一步保证描述子对表面朝向保持一致，类似 PFH 用法向量构造局部坐标系的思路）；
2.  把这个球形区域按三个维度分箱：
      - **径向距离**（Radial，通常用对数刻度分箱，让描述子对近处的几何细节更敏感，远处分辨率自然降低）；
      - **仰角**（Elevation，相对北极方向的夹角）；
      - **方位角**（Azimuth，绕北极轴的旋转角度）；
3.  统计落在每个分箱区域内的邻域点数量（通常还要按分箱区域的体积做归一化，避免径向外层分箱体积大、点数天然多的偏差），得到最终的三维分箱直方图，展平成一个向量作为描述子。

## 和 PFH 的区别

[PFH](0298_3D_Cloud_Features_PFH)
统计的是"邻域内点对之间法向量角度差异"，刻画的是表面法向量变化模式；3DSC
统计的是"邻域内点的空间位置密度分布"，刻画的是点在三维空间中的几何分布形状——两者都是局部描述子，但 PFH 更关注表面朝向变化，3DSC
更关注点的空间占据/密度模式，对噪声和点云密度不均匀更敏感（因为直接统计点数而不是法向量关系）。

## UseCase

3DSC 是点云局部描述子领域较早期（2004 年）的经典工作，常作为后续很多局部描述子设计（包括 PFH
系列思路上部分借鉴了"用邻域点分布统计做描述"这个基本框架）的对比基线，在物体识别和局部配准场景中使用，但由于分箱直方图对点云密度变化较敏感，实践中逐渐被
PFH/FPFH 等基于法向量关系、对密度变化更鲁棒的描述子取代。

## Reference

  - Frome, A., Huber, D., Kolluri, R., Bülow, T., Malik, J. Recognizing
    Objects in Range Data Using Regional Point Descriptors, ECCV 2004
  - [3D Cloud Features PFH](0298_3D_Cloud_Features_PFH)
  - [3D Cloud Features](0424_3D_Cloud_Features)
