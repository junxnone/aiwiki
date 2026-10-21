---
Title | 3D Cloud SOR
-- | --
Created @ | `2022-02-08T02:03:37Z`
Updated @| `2026-10-21T05:21:45Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/287)

---
# 离群点移除

- StatisticalOutlierRemoval: 统计分布
- ConditionalRemoval
- RadiusOutlierRemoval

## 离群点从哪来

点云里的离群点通常不是随机噪声，而是有明确物理成因，了解成因有助于选对去噪方法：

- **传感器测量噪声**：激光雷达/深度相机本身的测距误差，在远距离或低反射率表面上更明显；
- **反光/透明/吸光表面**：镜面、玻璃、黑色哑光材质会让光学/激光传感器产生错误的测距值，形成明显偏离真实表面的离群点；
- **深度相机边缘效应（"飞点" Flying Pixels）**：物体边缘处，相邻像素的深度值可能一个属于前景一个属于背景，插值/融合后产生悬浮在前景和背景之间的虚假点云，是结构光/ToF 相机的常见伪影。

## StatisticalOutlierRemoval

- 统计每个点的邻域内 K 个近邻点到该点的距离/平均距离
- 所有点到临近点的平均距离计算分布/均值/标准差
- 若平均距离在标准范围之外，作为离群点被移除
- **Input**
  - **MeanK** 求取平均距离的 K个近邻点
  - **StddevMulThresh** 标准差系数 - `stddev_mult`,  距离阈值为 `mean + stddev_mult * stddev` (大于此值的点被移除)

![image](https://user-images.githubusercontent.com/2216970/182543575-66dd27f0-f0ec-4051-acc4-0bea24c4c6ed.png)

![image](https://user-images.githubusercontent.com/2216970/182552737-a1f425ba-48b1-4c2b-aa81-352969a800c3.png)

## RadiusOutlierRemoval

- 若点半径 R 内的邻域内近邻点小于 K , 则会被移除
- **Input**
  - **R** 搜索近邻点半径
  - **K** 移除阈值, 近邻点个数小于K 则移除该点


![image](https://user-images.githubusercontent.com/2216970/182801932-1ff2a7de-750e-4806-8da5-ffc338b0113a.png)


## ConditionalRemoval

- 移除不符合指定条件的点

## 三种方法怎么选

| 方法 | 判定依据 | 计算开销 | 适用场景 |
|---|---|---|---|
| **StatisticalOutlierRemoval** | 全局统计分布（均值+标准差），自适应阈值 | 需要 KNN 近邻搜索（通常用 KD-tree 加速），比 RadiusOutlierRemoval 稍重 | 噪声强度未知/不均匀的场景，不需要手动调距离阈值，是最常用的通用去噪方法 |
| **RadiusOutlierRemoval** | 固定半径内近邻点数量 | 需要半径范围搜索，复杂度与 SOR 接近 | 已经大致知道点云密度、离群点明显比正常区域稀疏的场景，参数（R、K）比 SOR 更直观但需要手动根据点云密度调整 |
| **ConditionalRemoval** | 用户自定义条件（如某坐标轴范围、强度值范围等） | 最轻，不需要近邻搜索 | 已知离群点有明确的属性特征（比如超出某个坐标范围、反射强度异常），可以直接按条件过滤，比如常见的 PassThrough 直通滤波就是它的一种简单特例 |

## 和降采样的顺序

离群点移除通常放在[降采样](0285_3D_Cloud_Sampling)**之前**：如果先降采样（比如用 VoxelGrid 取体素质心），离群点会被平均进周围体素的质心里，污染正常点的坐标；先去噪、再降采样，才能保证降采样时参与平均计算的都是"干净"的点。

