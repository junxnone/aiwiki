---
Title | 3D Algos Registration ICP GICP
-- | --
Created @ | `2022-03-10T08:59:04Z`
Updated @| `2026-10-21T06:31:09Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/296)

---
# GICP - Generalized ICP

GICP 把 [ICP](0086_3D_Algos_Registration_ICP) 的 point-to-point 和 point-to-plane 两种变体统一进一个概率框架里——通过给每个点关联一个协方差矩阵，让算法能根据协方差的设置自动退化成其中任意一种，也能表达介于两者之间的新形式（plane-to-plane）。

## 概率框架

- 假设源点云和目标点云上的对应点各自服从高斯分布：$a_i \sim \mathcal{N}(\hat a_i, C_i^A)$，$b_i \sim \mathcal{N}(\hat b_i, C_i^B)$；
- 若真实变换 $T$ 能让残差为零（$\hat b_i - T\hat a_i = 0$），根据高斯分布的可加性，残差 $d_i = b_i - Ta_i$ 服从：$d_i \sim \mathcal{N}(0,\ C_i^B + TC_i^AT^T)$；
- 据此，GICP 的目标函数是对残差做极大似然估计：
  $$T^* = \underset{T}{\arg\min}\sum_i d_i^T (C_i^B + TC_i^AT^T)^{-1} d_i$$

## 为什么能统一 point-to-point / point-to-plane

- 令 $C_i^B = I$、$C_i^A = 0$：目标函数退化为标准欧氏距离平方和，就是原始的 **point-to-point** ICP；
- 令目标点的协方差矩阵沿法向量方向特征值趋近于 0（表示"这个方向上位置几乎确定"）、其余方向特征值较大（表示"平面内位置不确定"）：目标函数逼近 **point-to-plane** ICP 的投影距离；
- 如果源点云和目标点云两边都设置成这种"接近退化的平面型"协方差（而不是只处理目标点云一侧），得到的是 **plane-to-plane** 配准——同时考虑两份点云各自局部表面的平面性，比单边的 point-to-plane 更对称、理论上更合理。

## 协方差矩阵怎么来：局部表面形状

实践中，每个点的协方差矩阵由该点局部邻域的几何分布估计得到——和[曲率](0304_3D_Cloud_Features_Curvature)、[PFH](0298_3D_Cloud_Features_PFH)法向量估计用的是同一套 PCA 协方差矩阵思路：

- 把协方差矩阵的特征值正则化替换成 $(1, 1, \epsilon)$（$\epsilon$ 是一个很小的数）：表示该点所在的局部区域更像一个**平面**；
- 不同的特征值组合 $(a,\epsilon,\epsilon)$ / $(a,b,\epsilon)$ / $(a,b,c)$ 分别对应线/面/球这几种局部形状——这个思路和 [RSD](0585_3D_Cloud_Features_RSD) 用半径区分平面/边缘/球面是同一个几何直觉，只是服务对象不同（RSD 用于点云分割，这里用于配准误差度量）。

## 和标准 ICP 的关系

GICP 不是一种全新的配准算法，而是标准 ICP 的一种**推广**——仍然需要先用最近邻搜索建立对应点对（继承 ICP 的迭代最近点框架），只是把"怎么衡量一对对应点的误差"从固定的欧氏距离/投影距离，换成了可以按局部几何形状自适应调整的协方差加权距离，因此通常被认为是 ICP 变种里精度和鲁棒性更好的版本之一。

## Reference
- Segal, A., Haehnel, D., Thrun, S. Generalized-ICP, Robotics: Science and Systems (RSS) 2009
- [3D Algos Registration ICP](0086_3D_Algos_Registration_ICP)
- [3D Cloud Features Curvature](0304_3D_Cloud_Features_Curvature)
- [3D Cloud Features RSD](0585_3D_Cloud_Features_RSD)
- [3D Algos Registration](0235_3D_Algos_Registration)

