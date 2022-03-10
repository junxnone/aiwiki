---
Title | 3D Algos ICP
-- | --
Create Date | `2021-04-29T03:20:49Z`
Update Date | `2022-03-10T09:24:05Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/86)

---
## Reference
- 1992 **ICP** A method for registration of 3-D shapes [[paper](https://graphics.stanford.edu/courses/cs164-09-spring/Handouts/paper_icp.pdf)]
- [迭代最近点（Iterative Closest Point, ICP）算法介绍](https://zhuanlan.zhihu.com/p/35893884)
- [【点云精配准】Iterative Closest Point（ICP）](https://zhuanlan.zhihu.com/p/107218828)
- [pcl-learning](https://github.com/HuangCongQing/pcl-learning)

## Brief
- ICP - `Iterative Closest Point`
- 最近邻法估计 Scene 中点对应的Model 点
- 通过最小二乘法构建目标函数，进行迭代优化
- ANN - Approximate Nearest Neighbor
- SVD
- [RANSAC](/RANSAC)

分类 | Description
-- | --
point-to-point | 原始 ICP 算法
point-to-plane | 计算源点到目标点所在面的距离
plane-to-plane | 计算面到面的距离
GICP | Generalized ICP 
NICP | Normal Iterative Closest Point
point-to-line
MBICP

## 问题推导

Name | 公式
-- | --
Source 点云 | $P_{s} = \left\{ p_{s}^{1},p_{s}^{2},...,p_{s}^{n}\right\}$
Target 点云 | $P_{t} = \left\{ p_{t}^{1},p_{t}^{2},...,p_{t}^{n}\right\}$
两组点可以通过旋转平移变换 | $P_{t} = RP_{s} + T$
最小化目标函数 | $R^*, T^* = \underset{R,T}{argmin} \frac{1}{\left| P_{s}\right|}\sum_{i=1}^{\left| P_{s}\right|} \left\| p_{t}^i - (R\cdot p_{s}^i + T)\right\|^2$



## UseCase

![upvoglEXX2](https://user-images.githubusercontent.com/2216970/117272623-f4771a00-ae8d-11eb-9808-28699cf10014.gif)

