-----

| Title         | 3D Algos Registration ICP                            |
| ------------- | ---------------------------------------------------- |
| Created @     | `2021-04-29T03:20:49Z`                               |
| Last Modify @ | `2022-12-25T03:44:53Z`                               |
| Labels        | \`\`                                                 |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/86) |

-----

# ICP 精配准

## Reference

  - 1992 **ICP** A method for registration of 3-D shapes
    \[[paper](https://graphics.stanford.edu/courses/cs164-09-spring/Handouts/paper_icp.pdf)\]
  - [迭代最近点（Iterative Closest Point,
    ICP）算法介绍](https://zhuanlan.zhihu.com/p/35893884)
  - [【点云精配准】Iterative Closest
    Point（ICP）](https://zhuanlan.zhihu.com/p/107218828)
  - [pcl-learning](https://github.com/HuangCongQing/pcl-learning)
  - [三维点云配准 -- ICP
    算法](https://yilingui.xyz/2019/11/20/191120_point_cloud_registration_icp/)
  - [ICP、Point-to-plane
    ICP、GICP以及VGICP方法介绍](https://blog.csdn.net/xuershuai/article/details/117507754)
  - [三维点云课程---ICP
    Point-to-Point](https://blog.csdn.net/qq_45369294/article/details/121143844)
  - [三维点云课程---ICP
    (Point-to-Plane)](https://blog.csdn.net/qq_45369294/article/details/121150122)

## Brief

  - ICP - `Iterative Closest Point`
  - 最近邻法估计 Scene 中点对应的Model 点
  - 通过最小二乘法构建目标函数，进行迭代优化
  - ANN - Approximate Nearest Neighbor
  - \[\[SVD\]\]
  - [RANSAC](/RANSAC)

| 分类             | Description                                                    |
| -------------- | -------------------------------------------------------------- |
| point-to-point | 原始 ICP 算法                                                      |
| point-to-plane | 计算源点到目标点所在面的距离                                                 |
| plane-to-plane | 计算面到面的距离                                                       |
| GICP           | Generalized ICP (Point-to-Point/Point-to-Plane/Plane-to-Plane) |
| NICP           | Normal Iterative Closest Point(法向量&局部曲率), 论文中效果比 GICP 好        |
| point-to-line  |                                                                |
| MBICP          |                                                                |

## 问题推导

| Name          | 公式                                                                                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source 点云     | $P\_{s} = \\left{ p\_{s}^{1},p\_{s}^{2},...,p\_{s}^{n}\\right}$                                                                                                 |
| Target 点云     | $P\_{t} = \\left{ p\_{t}^{1},p\_{t}^{2},...,p\_{t}^{n}\\right}$                                                                                                 |
| 两组点可以通过旋转平移变换 | $P\_{t} = RP\_{s} + T$                                                                                                                                          |
| 最小化目标函数       | $R^*, T^* = \\underset{R,T}{argmin} \\frac{1}{\\left| P\_{s}\\right|}\\sum\_{i=1}^{\\left| P\_{s}\\right|} \\left| p\_{t}^i - (R\\cdot p\_{s}^i + T)\\right|^2$ |

## Pipeline

  - 1 滤波移除离群点
  - 2 初始化变换 $R\_{0}/T\_{0}$
  - 3 应用变换\[$R\_{0}/T\_{0}$ 或 $R\_{k-1}/T\_{k-1}$\]，求最近点
  - 4 剔除不合理点对
  - 5 加权求 Loss
  - 6 最小化 Loss, 求最优变换$R\_{k}/T\_{k}$
  - 重复 `3-6`

### 求解最优变换

  - 利用 \[\[SVD\]\] 求解 V U
  - $\\bar p\_{s}, \\bar p\_{t}$ : 源点云 与目标点云 质心
  - 令 $\\hat p\_s^i = p\_s^i - \\bar p\_s$, $\\hat p\_t^i = p\_t^i -
    \\bar p\_t$
  - 令 $H = \\sum\_{i=1}^{|P\_s|} {\\hat p\_s^i} {\\hat p\_t^i}^T$
  - 则 $R^{\\ast} = V U^T $
  - $ T^{\\ast} = \\bar p\_t - R^{\\ast} \\bar p\_s$

## UseCase

![upvoglEXX2](media/db38cd914ace2571a74e5dfaf0f7044abe4fa3e7.gif)
