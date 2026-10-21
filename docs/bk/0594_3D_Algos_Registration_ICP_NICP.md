-----

| Title     | 3D Algos Registration ICP NICP                        |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-21T06:25:44Z`                                |
| Updated @ | `2026-10-21T06:25:44Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/594) |

-----

# NICP - Normal Iterative Closest Point

NICP 把标准 ICP 里"只用三维坐标做最近邻匹配和误差度量"的做法，扩展成**同时使用点的三维坐标、法向量、局部曲率**——把每个点从一个
3 维坐标扩展成一个包含坐标+法向量的**6 维**描述，用 6 维空间上的马氏距离（Mahalanobis
Distance）做最近邻匹配和误差度量，论文报告在多个场景下精度和鲁棒性优于
[GICP](0296_3D_Algos_Registration_ICP_GICP) 和
[NDT](0295_3D_Algos_Registration_NDT)。

## 核心思路

1.  对点云中每个点，估计法向量和局部曲率（见 [曲率](0304_3D_Cloud_Features_Curvature) 一文的 PCA
    方法）；
2.  把每个点的描述从单纯的三维坐标 $(x,y,z)$ 扩展成坐标+法向量的 6 维向量；
3.  寻找对应点时，不只看坐标距离，还要求法向量和曲率"兼容"（方向相近、曲率接近）——曲率在这里相当于一个额外的"数据关联"筛选信号，帮助排除坐标距离相近但实际上几何特征明显不同的错误候选；
4.  最终的优化目标是对应点对之间 6 维向量差异的马氏距离之和，而不是单纯的 3 维坐标距离。

## 实现要点

为了保证这套更复杂的匹配逻辑能跑得够快（论文强调可以在普通笔记本上在线运行），NICP
在工程实现上做了几个加速：用\*\*积分图像（Integral
Image）\*\*加速每个点邻域协方差矩阵（用于估计法向量/曲率）的计算；把点云投影到一张以当前变换估计为视点的 range
image（深度图）上，用固定的索引图加速对应点查找，减少内存访问开销。

## 优点

  - 比单纯用坐标的 ICP、只用协方差近似的 GICP 多了法向量+曲率这层额外信息，数据关联更准确，对初始误差较大的场景更鲁棒；
  - 论文报告在若干基准场景下优于 GICP 和 NDT（比如能正确重建一条走廊，而 GICP/NDT
    在该场景下重建出了一条"缩短"的走廊）；
  - 有开源实现，工程上可直接复用。

## 缺点

  - 计算量比标准 point-to-point/point-to-plane ICP 更大——每个点都要先估计法向量和曲率，再做 6
    维马氏距离优化；
  - 效果依赖法向量/曲率估计的质量，在稀疏或噪声较大的点云上，这些局部几何统计量本身估计不准，会反过来影响数据关联和配准精度；
  - 和其他 ICP 变种一样，本质仍是局部优化算法，不能保证全局最优，仍然需要一个较合理的初始变换（见 [Registration
    配准](0235_3D_Algos_Registration)）。

## Reference

  - Serafin, J., Grisetti, G. NICP: Dense Normal Based Point Cloud
    Registration, IROS 2015
  - [3D Cloud Features Curvature](0304_3D_Cloud_Features_Curvature)
  - [3D Algos Registration ICP](0086_3D_Algos_Registration_ICP)
  - [3D Algos Registration GICP](0296_3D_Algos_Registration_ICP_GICP)
  - [3D Algos Registration NDT](0295_3D_Algos_Registration_NDT)
  - [3D Algos Registration](0235_3D_Algos_Registration)
