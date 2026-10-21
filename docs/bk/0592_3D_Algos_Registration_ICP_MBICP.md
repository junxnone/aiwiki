-----

| Title     | 3D Algos Registration ICP MBICP                       |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-21T06:25:39Z`                                |
| Updated @ | `2026-10-21T06:25:39Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/592) |

-----

# MBICP - Metric-Based ICP

MBICP 是针对标准 [ICP](0086_3D_Algos_Registration_ICP) 的一个改进——标准 ICP
用纯粹的点到点欧氏距离做最近邻匹配和误差度量，**当两份点云初始朝向（旋转）差异较大时容易匹配错、收敛到局部最优**；MBICP
把旋转误差显式地纳入距离度量本身，提升大初始角度误差下的收敛能力。

## 核心思路：统一的度量距离

MBICP
定义了一个同时包含平移和旋转分量的"度量距离"，用来衡量两个位姿（而不仅仅是两个点）之间的差异——在计算最近邻对应、以及构建优化目标函数时，都用这个统一的度量距离代替纯粹的欧氏点距离，并通过一个权重参数控制旋转误差在总体距离里的比重。这样做的效果是：即使当前姿态估计的平移部分已经很接近，但旋转角度偏差较大，算法依然能感知到这部分误差并继续优化，而不会被"点距离很近"的假象误导提前收敛。

## 优点

  - 相比标准 point-to-point ICP，对**较大初始旋转误差**的场景收敛更稳定、更准确；
  - 仍然是经典的最近邻迭代框架，容易在已有 ICP 实现基础上改造。

## 缺点

  - 依赖两份点云**较高的重叠度**假设，重叠度不足时表现会下降；
  - 收敛速度上不如后续提出的 3D Algos Registration ICP PLICP（点到线度量，闭式解、二次收敛）——MBICP
    主要解决的是"大旋转误差下别收敛错"的鲁棒性问题，不是收敛速度问题。

## 使用场景

MBICP 最初是为移动机器人的**2D
激光扫描匹配**场景设计的——机器人底盘运动时里程计误差会累积，相邻两帧激光扫描之间的旋转误差可能较大，MBICP
这种显式处理旋转误差的度量方式在这类场景下比标准 ICP 更稳健。

## Reference

  - Minguez, J., Lamiraux, F., Montesano, L. Metric-Based Scan Matching
    Algorithms for Mobile Robot Displacement Estimation, IEEE
    Transactions on Robotics, 2006
  - [3D Algos Registration ICP](0086_3D_Algos_Registration_ICP)
  - [3D Algos Registration](0235_3D_Algos_Registration)
