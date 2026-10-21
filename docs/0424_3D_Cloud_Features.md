---
Title | 3D Cloud Features
-- | --
Created @ | `2023-06-17T15:37:42Z`
Updated @| `2026-10-21T05:40:00Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/424)

---
# 3D Cloud Features 点云特征描述子

> 点云特征描述子用一个（通常定长的）向量/直方图概括某个点（或整个物体）的几何形状，是点云配准（Registration）、识别、分割等任务的基础输入。本文按"关键点检测 / 局部特征描述 / 全局特征描述"三类梳理，并对比各描述子的计算复杂度。

## 三类任务：关键点检测 / 局部特征描述 / 全局特征描述

- **关键点检测（Keypoint Detection）**：从稠密点云中挑出一小部分"有代表性"的点，减少后续计算量——代表方法 [ISS](0302_3D_Cloud_Features_ISS)、[NARF](0586_3D_Cloud_Features_NARF)、[Harris 3D](0588_3D_Cloud_Features_Harris)。
- **局部特征描述（Local Feature Description）**：给定一个点（可以是关键点，也可以是普通点），计算一个向量描述它周围的局部几何形状，用于配准时的对应点匹配——代表方法 [PFH](0298_3D_Cloud_Features_PFH)、[FPFH](0299_3D_Cloud_Features_FPFH)、[RIFT](0584_3D_Cloud_Features_RIFT)、[RSD](0585_3D_Cloud_Features_RSD)、[3DSC](0587_3D_Cloud_Features_3DSC)。
- **全局特征描述（Global Feature Description）**：不描述单个点，而是用一个向量描述"整个物体/点云簇"的形状，用于物体识别和粗略姿态估计——代表方法 [VFH](0582_3D_Cloud_Features_VFH)、[CVFH](0583_3D_Cloud_Features_CVFH)。

[曲率](0304_3D_Cloud_Features_Curvature) 本身既是最基础的局部几何量，也是 ISS/Harris 3D 关键点检测、PFH/FPFH 计算法向量时共同依赖的基础构件。

## 对比

| 名称 | 类型 | 核心思路 | 复杂度 | 输出 |
|---|---|---|---|---|
| [曲率](0304_3D_Cloud_Features_Curvature) | 基础几何量 | 主曲率 $k_1,k_2$ 描述曲面弯曲程度 | 给定邻域协方差矩阵后 O(1) | 标量（或 $k_1,k_2$ 两个值） |
| [PFH](0298_3D_Cloud_Features_PFH) | 局部描述 | 邻域内所有点两两配对，统计法向量角度差异的联合直方图 | $O(k^2)$（k 为邻域点数） | 125 维向量 |
| [FPFH](0299_3D_Cloud_Features_FPFH) | 局部描述 | 只计算查询点与邻域点的简化直方图（SPFH），再加权累加邻域 SPFH 近似 PFH | $O(nk)$ | 33 维向量 |
| [RIFT](0584_3D_Cloud_Features_RIFT) | 局部描述 | 唯一依赖强度信息，按距离环+梯度方向分箱统计强度梯度直方图 | 单点 $O(k)$ | 默认 32 维向量 |
| [RSD](0585_3D_Cloud_Features_RSD) | 局部描述 | 用点对几何关系反解局部表面的最小/最大半径 | $O(k^2)$（遍历邻域点对） | 2 维（$r_{min}, r_{max}$） |
| [3DSC](0587_3D_Cloud_Features_3DSC) | 局部描述 | 球形区域按径向/仰角/方位角分箱，统计邻域点空间密度分布 | 依赖分箱数与邻域大小 | 分箱直方图（维度由分箱数决定） |
| [VFH](0582_3D_Cloud_Features_VFH) | 全局描述 | FPFH 思路 + 视点方向分量，描述整个物体簇 | 与物体簇点数相关，一个簇一次计算 | 308 维向量 |
| [CVFH](0583_3D_Cloud_Features_CVFH) | 全局描述 | 先按平滑区域分割物体，再对每个区域单独算 VFH，抗遮挡 | 比 VFH 多一次区域生长 | N 个 308 维向量（N=区域数） |
| [ISS](0302_3D_Cloud_Features_ISS) | 关键点检测 | 邻域协方差矩阵特征值比值筛选"显著"点 | 依赖邻域搜索，整体约 $O(n \log n)$ | 关键点掩码（布尔），不是描述向量 |
| [NARF](0586_3D_Cloud_Features_NARF) | 关键点检测+描述 | 深度图上寻找"表面稳定+邻近有物体边界"的点 | 依赖深度图分辨率和邻域大小 | 关键点 + 边界形状描述向量 |
| [Harris 3D](0588_3D_Cloud_Features_Harris) | 关键点检测 | 对法向量变化构造类似结构张量的矩阵，特征值组合算角点响应值 | 依赖邻域法向量估计+特征值分解 | 关键点掩码（布尔） |

**PFH → FPFH 的取舍**：FPFH 是 PFH 的工程化简化版——牺牲一部分精度（不再穷举邻域内所有点对，只计算查询点和邻域点的关系，再加权近似），换取从 $O(k^2)$ 降到 $O(nk)$ 的速度提升，是 PCL 等库里配准流程的默认实用选择。

**VFH → CVFH 的取舍**：CVFH 用"一个物体对应 N 个局部区域直方图"替代 VFH"一个物体对应一个全局直方图"，换取对部分遮挡的鲁棒性，代价是需要维护和匹配更多直方图。

## Reference
- [3D](0076_3D)
- [3D Cloud](0423_3D_Cloud)

