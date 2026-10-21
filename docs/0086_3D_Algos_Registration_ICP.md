---
Title | 3D Algos Registration ICP
-- | --
Created @ | `2021-04-29T03:20:49Z`
Updated @| `2026-10-21T06:31:03Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/86)

---
# ICP 精配准

- ICP - `Iterative Closest Point`
- 最近邻法估计 Scene 中点对应的Model 点
- 通过最小二乘法构建目标函数，进行迭代优化
- ANN - Approximate Nearest Neighbor
- [[SVD]]
- [RANSAC](/RANSAC)

分类 | Description
-- | --
point-to-point | 原始 ICP 算法
point-to-plane | 计算源点到目标点所在面的距离
plane-to-plane | 计算面到面的距离
GICP | Generalized ICP (Point-to-Point/Point-to-Plane/Plane-to-Plane)，详细概率推导见 [GICP](0296_3D_Algos_Registration_ICP_GICP)
NICP | Normal Iterative Closest Point(法向量&局部曲率), 论文中效果比 GICP 好
point-to-line
MBICP

## 问题推导：point-to-point

Name | 公式
-- | --
Source 点云 | $P_{s} = \left\{ p_{s}^{1},p_{s}^{2},...,p_{s}^{n}\right\}$
Target 点云 | $P_{t} = \left\{ p_{t}^{1},p_{t}^{2},...,p_{t}^{n}\right\}$
两组点可以通过旋转平移变换 | $P_{t} = RP_{s} + T$
最小化目标函数 | $R^*, T^* = \underset{R,T}{argmin} \frac{1}{\left\| P_{s}\right\|}\sum_{i=1}^{\left\| P_{s}\right\|} \left\| p_{t}^i - (R\cdot p_{s}^i + T)\right\|^2$

## point-to-plane ICP：为什么收敛更快

point-to-point 最小化的是对应点之间的直线距离，point-to-plane 换成最小化源点到目标点所在**切平面**的距离：

$$R^*, T^* = \underset{R,T}{\arg\min}\sum_{i=1}^{n} \left( (R\cdot p_s^i + T - p_t^i)\cdot n_t^i \right)^2$$

其中 $n_t^i$ 是目标点 $p_t^i$ 的法向量（估计方法见 [曲率](0304_3D_Cloud_Features_Curvature) 一文里提到的 PCA 法向量估计）。直观理解：point-to-point 要求两点严格重合，哪怕点在目标表面上"沿切平面方向"有偏移也会被计入误差；point-to-plane 只惩罚**垂直于表面**方向的偏移，允许点在表面内"打滑"对齐，这对光滑表面（比如一块平面、一段圆柱面）的收敛明显更快，是实践中比原始 point-to-point 更常用的变种。

## Pipeline
- 1 滤波移除离群点
- 2 初始化变换 $R_{0}/T_{0}$
- 3 应用变换[$R_{0}/T_{0}$ 或 $R_{k-1}/T_{k-1}$]，求最近点
- 4 剔除不合理点对
- 5 加权求 Loss
- 6 最小化 Loss, 求最优变换$R_{k}/T_{k}$
- 重复 `3-6`

### 求解最优变换
- 利用 [[SVD]] 求解 V U
- $\bar p_{s}, \bar p_{t}$ : 源点云 与目标点云 质心
- 令 $\hat p_s^i = p_s^i - \bar p_s$, $\hat p_t^i = p_t^i - \bar p_t$
- 令 $H = \sum_{i=1}^{|P_s|} {\hat p_s^i} {\hat p_t^i}^T$
- 则 $R^{\ast} = V U^T $
- $ T^{\ast} = \bar p_t - R^{\ast} \bar p_s$

## UseCase

![upvoglEXX2](https://user-images.githubusercontent.com/2216970/117272623-f4771a00-ae8d-11eb-9808-28699cf10014.gif)

## ICP 在配准流程里的位置

ICP 本质是局部优化算法——**初始位姿差太大时容易收敛到错误的局部最优**，实践中通常不会直接对两份姿态差异很大的点云跑 ICP，而是先用 [PPF](0085_3D_Algos_Registration_PPF)、[NDT](0295_3D_Algos_Registration_NDT) 或 [SAC-IA](0300_3D_Algos_Registration_SACIA) 等粗配准方法求出一个大致正确的初始变换，再用 ICP（或其推广版本 [GICP](0296_3D_Algos_Registration_ICP_GICP)）做精细调整。完整的两阶段配准+融合流程见 [点云拼接](0286_3D_Cloud_Merge)，不同粗/精配准方法的分类全貌见 [Registration 配准](0235_3D_Algos_Registration)。

## Reference
- 1992 **ICP** A method for registration of 3-D shapes [[paper](https://graphics.stanford.edu/courses/cs164-09-spring/Handouts/paper_icp.pdf)]
- [迭代最近点（Iterative Closest Point, ICP）算法介绍](https://zhuanlan.zhihu.com/p/35893884)
- [【点云精配准】Iterative Closest Point（ICP）](https://zhuanlan.zhihu.com/p/107218828)
- [pcl-learning](https://github.com/HuangCongQing/pcl-learning)
- [三维点云配准 -- ICP 算法](https://yilingui.xyz/2019/11/20/191120_point_cloud_registration_icp/)
- [ICP、Point-to-plane ICP、GICP以及VGICP方法介绍](https://blog.csdn.net/xuershuai/article/details/117507754)
- [三维点云课程---ICP Point-to-Point](https://blog.csdn.net/qq_45369294/article/details/121143844)
- [三维点云课程---ICP (Point-to-Plane)](https://blog.csdn.net/qq_45369294/article/details/121150122)
- [3D Algos Registration GICP](0296_3D_Algos_Registration_ICP_GICP)
- [3D Algos Registration SACIA](0300_3D_Algos_Registration_SACIA)
- [3D Cloud Merge](0286_3D_Cloud_Merge)
- [3D Algos Registration](0235_3D_Algos_Registration)

