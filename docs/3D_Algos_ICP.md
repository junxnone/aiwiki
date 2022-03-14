---
Title | 3D Algos ICP
-- | --
Create Date | `2021-04-29T03:20:49Z`
Update Date | `2022-03-14T06:02:48Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/86)

---
## Reference
- 1992 **ICP** A method for registration of 3-D shapes [[paper](https://graphics.stanford.edu/courses/cs164-09-spring/Handouts/paper_icp.pdf)]
- [迭代最近点（Iterative Closest Point, ICP）算法介绍](https://zhuanlan.zhihu.com/p/35893884)
- [【点云精配准】Iterative Closest Point（ICP）](https://zhuanlan.zhihu.com/p/107218828)
- [pcl-learning](https://github.com/HuangCongQing/pcl-learning)
- [三维点云配准 -- ICP 算法](https://yilingui.xyz/2019/11/20/191120_point_cloud_registration_icp/)
- [ICP、Point-to-plane ICP、GICP以及VGICP方法介绍](https://blog.csdn.net/xuershuai/article/details/117507754)

## Brief
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
GICP | Generalized ICP (Point-to-Point/Point-to-Plane/Plane-to-Plane)
NICP | Normal Iterative Closest Point(法向量&局部曲率), 论文中效果比 GICP 好
point-to-line
MBICP

## 问题推导

Name | 公式
-- | --
Source 点云 | $P_{s} = \left\{ p_{s}^{1},p_{s}^{2},...,p_{s}^{n}\right\}$
Target 点云 | $P_{t} = \left\{ p_{t}^{1},p_{t}^{2},...,p_{t}^{n}\right\}$
两组点可以通过旋转平移变换 | $P_{t} = RP_{s} + T$
最小化目标函数 | $R^*, T^* = \underset{R,T}{argmin} \frac{1}{\left\| P_{s}\right\|}\sum_{i=1}^{\left\| P_{s}\right\|} \left\| p_{t}^i - (R\cdot p_{s}^i + T)\right\|^2$

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
- $ T^{\ast} = \bar p_t - R^{\ast} \bar p_s$

## UseCase

![upvoglEXX2](https://user-images.githubusercontent.com/2216970/117272623-f4771a00-ae8d-11eb-9808-28699cf10014.gif)

