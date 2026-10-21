-----

| Title     | 3D Cloud Features RIFT                                |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-21T05:35:51Z`                                |
| Updated @ | `2026-10-21T05:35:51Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/584) |

-----

# RIFT - Rotation Invariant Feature Transform

  - RIFT 是点云局部描述子家族里**唯一依赖强度（intensity）信息**的描述子——需要点除了几何坐标外还带有强度/灰度值（可以从
    RGB 颜色换算得到），和纯几何的 PFH/FPFH 不同。
  - 借鉴 2D 图像里 SIFT 类描述子的思路（Lazebnik 等人的旋转不变纹理描述工作），把"强度梯度统计"的做法迁移到 3D
    点云上。

## 算法原理

1.  以查询点为中心、给定半径画一个圆形邻域（patch），按照设定的\*\*距离分箱数（Distance Bins，默认 4
    份）\*\*把这个圆形邻域切成若干个同心环；
2.  对邻域内每个点，计算它的强度梯度方向和梯度大小；
3.  **旋转不变性的关键一步**：不直接记录梯度的绝对方向，而是记录梯度方向和"邻域中心指向该点"这个方向之间的**相对夹角**——这样整个邻域旋转时，相对夹角不变，描述子自然具有旋转不变性；
4.  把每个点的梯度大小，按照"落在哪个距离环"和"相对梯度角度落在哪个角度区间（**梯度分箱数，Gradient Bins，默认 8
    份**）"累加进对应的直方图格子；
5.  最终输出 **距离分箱数 × 梯度分箱数** 维的直方图，默认参数下是 $4 \\times 8 = 32$
    维（`pcl::Histogram<32>`）。

## 和 PFH/FPFH 的本质区别

PFH/FPFH 完全基于**几何**（法向量角度差异），不需要颜色/强度信息，适用于任何点云；RIFT 依赖**强度梯度**，本质上是把 2D
图像特征提取的思路搬到点云上，更适合"几何相似但纹理/颜色不同"需要被区分的场景（比如同一形状但表面印刷图案不同的物体）。两者可以结合使用，分别捕捉几何和外观两种互补信息。

## UseCase

RIFT
常和几何描述子配合使用，用于需要同时利用几何形状和表面纹理信息做区分的物体识别场景，纯几何描述子（PFH/FPFH/VFH）区分不开的相似形状物体，可能在强度/纹理层面有明显差异，这时候
RIFT 能提供额外的判别信息。

## Reference

  - Lazebnik, S., Schmid, C., Ponce, J. A Sparse Texture Representation
    Using Affine-Invariant Regions（2D RIFT 思路来源）
  - [PCL RIFTEstimation
    文档](https://pointclouds.org/documentation/classpcl_1_1_r_i_f_t_estimation.html)
  - [3D Cloud Features](0424_3D_Cloud_Features)
