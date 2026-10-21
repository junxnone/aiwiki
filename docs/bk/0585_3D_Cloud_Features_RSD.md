-----

| Title     | 3D Cloud Features RSD                                 |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-21T05:35:53Z`                                |
| Updated @ | `2026-10-21T05:35:53Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/585) |

-----

# RSD - Radius-based Surface Descriptor

  - RSD 不像 PFH/FPFH 那样输出一个高维直方图，而是直接估计查询点邻域的**局部表面半径**（最小半径
    $r\_{min}$、最大半径
    $r\_{max}$）——用两个数值就能描述局部表面"有多弯、怎么弯"，思路比曲率更进一步，直接给出一个可解释的几何量（半径），而不只是一个抽象的弯曲程度数值。

## 算法原理

  - 对查询点邻域内的每一对点，假设局部表面是一小段球面的一部分，根据两点间的距离和法向量夹角，反解出能同时满足这对点几何关系的**球面半径**；
  - 对邻域内所有点对重复这个计算，统计出半径估计值的分布，取**最小半径**和**最大半径**作为该点的 RSD 描述；
  - 两个半径值能直接反映局部表面类型：
      - $r\_{min} \\approx r\_{max} \\approx \\infty$（半径很大）：局部接近**平面**；
      - $r\_{min} \\approx r\_{max}$ 且数值有限：局部接近**球面**；
      - $r\_{min}$ 远小于 $r\_{max}$：局部接近**圆柱面/边缘**（一个方向弯曲剧烈、另一个方向几乎不弯）。

## 和曲率的关系

RSD 和 [曲率](0304_3D_Cloud_Features_Curvature)
都是刻画局部表面弯曲程度的几何量，但表达方式不同：曲率给出的是一个抽象的弯曲程度数值（$\\sigma$
或 $k\_1,k\_2$），RSD
直接给出"如果这块表面是球/柱面，半径大概是多少"这种更具体、更易解释的物理量——在需要直接按表面类型（平面/边缘/圆柱/球面）分类的场景下，RSD
比单纯的曲率数值更直接可用。

## UseCase：点云分割

RSD
最主要的实际用途是**点云分割**——根据每个点的最小/最大半径，可以直接把点云划分成平面区域、边缘区域、圆柱/球面区域等不同的几何基元（Geometric
Primitive），是早期基于几何基元的点云场景理解/物体分割方法的常用特征，也有对应的全局版本 GRSD（Global
RSD），用于描述整个物体簇的形状基元组成。

## Reference

  - Marton, Z.C. et al. General 3D Modelling of Novel Objects from a
    Single View（RSD 提出论文背景）
  - [PCL RSDEstimation
    文档](https://pointclouds.org/documentation/group__features.html)
  - [3D Cloud Features Curvature](0304_3D_Cloud_Features_Curvature)
  - [3D Cloud Features](0424_3D_Cloud_Features)
