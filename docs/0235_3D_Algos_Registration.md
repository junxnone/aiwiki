---
Title | 3D Algos Registration
-- | --
Created @ | `2021-04-29T07:34:54Z`
Updated @| `2026-10-21T06:31:23Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/235)

---
# Registration 配准

点云配准：求解一个变换（通常是旋转+平移，见[旋转矩阵](0234_3D_Cloud_RM)），把两份点云（或点云与模型）对齐到同一坐标系，是点云拼接、三维重建、物体识别/位姿估计等任务的核心基础问题。完整的"降采样→特征描述→配准→融合"流程串联见 [点云拼接](0286_3D_Cloud_Merge)，本文聚焦配准算法本身的分类和原理。

- 配准问题分类
  - 不同重叠度 (Full Overlap & Partial Overlap)
    - 完全重叠: 仿品与原品对比/建造件与模型对比
    - 部分重叠: 不同视角扫描对象进行三维重建
  - 全局 & 局部 (Global & Local)
    - 全局: 位姿差别较大 (`Coarse Global Registeration`) - 粗配准
    - 局部: 位姿相近 (`Fine Local Registeration`) - 精配准
  - 成对 & 多对 (Pairwise & Multiple)
    - 配准两片点云
    - 配准多片点云 (三维重建)

## Algos

★ 标注为常用/主流方法（PCL 等库自带实现、教程高频出现）；年份为原始论文发表年份，按时间排序。

### Coarse Global Registeration 粗配准

| 年份 | 方法 | 特点 | 用途 |
|---|---|---|---|
| 1981 | [RANSAC](0595_3D_Algos_Registration_RANSAC) | 通用的随机采样一致性框架，不是专为点云设计，穷举搜索类方法大多建立在它的思路上 | 需要从含大量误匹配的候选对应中鲁棒估计模型参数的场景，点云配准是其应用之一 |
| 2008 | [4PCS](0589_3D_Algos_Registration_4PCS)（4-Point Congruent Set） | 利用仿射不变的四点共面比例关系做穷举搜索，不需要特征描述子 | 完全无初始位姿假设、点云噪声较大的全局配准 |
| ★2010 | [PPF](0085_3D_Algos_Registration_PPF)（Point Pair Feature） | 基于点对距离+法向量夹角的 Hash 投票，对遮挡/噪声鲁棒 | 工业 6D 位姿估计（如无序抓取），仅用点对几何信息不依赖特征描述子 |
| 2014 | [Super4PCS](0590_3D_Algos_Registration_Super4PCS) | 用 3D 网格索引加速 4PCS 的点对搜索，大幅降低复杂度 | 大规模点云的全局配准，是 4PCS 的工程化加速版 |
| 2016 | [FGR](0591_3D_Algos_Registration_FGR)（Fast Global Registration） | 基于 FPFH 特征匹配+鲁棒优化（无需 RANSAC 式迭代采样），速度快 | 对速度要求高、但仍想利用特征描述子的全局配准场景 |
| ★2003/2009 | [NDT](0295_3D_Algos_Registration_NDT)（Normal Distribution Transform） | 把点云转成概率密度场，无需显式对应点搜索；2003 年提出于 2D，2009 年系统扩展到 3D | SLAM 场景下的大规模激光雷达扫描匹配 |
| ★2009 | [SAC-IA](0300_3D_Algos_Registration_SACIA)（Sample Consensus Initial Aligment） | 基于 FPFH 特征的采样一致性，PCL 默认粗配准方案之一 | 需要特征描述子辅助、点云有一定遮挡/重叠度的粗配准 |
| 资料有限 | AO（基于 SHOT 描述子） | 本仓库暂未单独展开，待扩展 | — |
| 资料有限 | ICL（基于线特征） | 本仓库暂未单独展开，待扩展 | — |

### Fine Local Registeration 精配准

| 年份 | 方法 | 特点 | 用途 |
|---|---|---|---|
| ★1992 | [ICP](0086_3D_Algos_Registration_ICP)（point-to-point，Besl & McKay） | 最早的 ICP 形式，直接最小化对应点欧氏距离 | 初始位姿已经比较接近、点云噪声不大的通用精配准 |
| ★1992 | [point-to-plane ICP](0086_3D_Algos_Registration_ICP)（Chen & Medioni） | 最小化点到目标表面切平面的距离，光滑表面收敛明显更快 | 实践中最常用的 ICP 变种，光滑/结构化表面场景优先选择 |
| 2006 | [MBICP](0592_3D_Algos_Registration_ICP_MBICP)（Metric-Based ICP） | 显式把旋转误差计入距离度量，改善大初始角度误差下的收敛性 | 移动机器人 2D 激光扫描匹配，初始朝向误差较大的场景 |
| 2008 | [PLICP](0593_3D_Algos_Registration_ICP_PLICP)（point-to-line ICP，Censi） | 用点到线的距离度量，闭式解、收敛快且是二次收敛 | 2D 激光扫描匹配，比 point-to-point/MBICP 精度更高但对超大初始误差鲁棒性稍弱 |
| ★2009 | [GICP](0296_3D_Algos_Registration_ICP_GICP)（Generalized ICP） | 概率框架统一 point-to-point/point-to-plane/plane-to-plane | 对精度和鲁棒性要求都较高的通用精配准，PCL/现代点云库常用默认选项之一 |
| 2015 | [NICP](0594_3D_Algos_Registration_ICP_NICP)（Normal Iterative Closest Point） | 同时利用法向量和局部曲率构建稠密优化目标，论文报告效果优于 GICP | 需要更高精度、能接受更高计算开销的稠密点云配准场景 |

## 粗配准 + 精配准：标准两阶段流程

ICP 等精配准算法本质是局部优化，**初始位姿差太大容易收敛到错误的局部最优**——实践标准流程是先用粗配准（PPF/NDT/SAC-IA 任选其一）求出一个大致正确的初始变换，再用精配准（ICP/GICP）迭代微调。完整的"粗配准→精配准→融合"全流程见 [点云拼接](0286_3D_Cloud_Merge)。

## 评价指标

配准结果（无论粗配准还是精配准）怎么量化好坏，见 [Registration Metrics](0236_3D_Algos_Registration_Metrics)。

## History

![image](https://user-images.githubusercontent.com/2216970/153119106-67ae2cec-8a9d-4d1d-84bd-04c4bf4c9d34.png)

## Reference
- Besl, P., McKay, N. A Method for Registration of 3-D Shapes, IEEE TPAMI 1992（[PDF](https://github.com/junxnone/tech-io/files/6397002/A.method.for.registration.of.3-D.shapes.pdf)）
- Chen, Y., Medioni, G. Object Modelling by Registration of Multiple Range Images, 1992（point-to-plane ICP 提出论文）
- Aiger, D., Mitra, N.J., Cohen-Or, D. 4-Points Congruent Sets for Robust Pairwise Surface Registration, ACM TOG 2008
- Mellado, N., Aiger, D., Mitra, N.J. Super 4PCS: Fast Global Pointcloud Registration via Smart Indexing, SGP 2014
- Zhou, Q.Y., Park, J., Koltun, V. Fast Global Registration, ECCV 2016
- Minguez, J., Lamiraux, F., Montesano, L. Metric-Based Scan Matching Algorithms for Mobile Robot Displacement Estimation, IEEE T-RO 2006（MBICP）
- Censi, A. An ICP Variant Using a Point-to-Line Metric, ICRA 2008
- Serafin, J., Grisetti, G. NICP: Dense Normal Based Point Cloud Registration, IROS 2015
- [awesome-image-registration](https://github.com/Awesome-Image-Registration-Organization/awesome-image-registration)
- [awesome-point-cloud-registration](https://github.com/XuyangBai/awesome-point-cloud-registration)
- 2020.03  A comprehensive survey on point cloud registration  [[Paper](https://arxiv.org/abs/2103.02690v2)] [[Code]()]
  - [最新点云配准综述：A comprehensive survey on point cloud registration](https://zhuanlan.zhihu.com/p/355578871)
- [Registration Blogs - xiaoxiong](https://littlebearsama.github.io/categories/Registration/)
- [《GAMES203：三维重建和理解》2 配准（Registration）](https://zhuanlan.zhihu.com/p/462813029)
- [点云配准各种方法总结[不定时更新]](https://blog.csdn.net/Ha_ku/article/details/79755623)
- [3D Cloud RM](0234_3D_Cloud_RM)
- [3D Cloud Merge](0286_3D_Cloud_Merge)
- [3D Algos Registration Metrics](0236_3D_Algos_Registration_Metrics)
- [3D Algos Registration RANSAC](0595_3D_Algos_Registration_RANSAC)
- [3D Algos Registration 4PCS](0589_3D_Algos_Registration_4PCS)
- [3D Algos Registration Super4PCS](0590_3D_Algos_Registration_Super4PCS)
- [3D Algos Registration FGR](0591_3D_Algos_Registration_FGR)
- [3D Algos Registration ICP MBICP](0592_3D_Algos_Registration_ICP_MBICP)
- [3D Algos Registration ICP PLICP](0593_3D_Algos_Registration_ICP_PLICP)
- [3D Algos Registration ICP NICP](0594_3D_Algos_Registration_ICP_NICP)

