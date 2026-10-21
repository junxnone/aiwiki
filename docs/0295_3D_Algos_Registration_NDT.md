---
Title | 3D Algos Registration NDT
-- | --
Created @ | `2022-03-09T07:44:46Z`
Updated @| `2026-10-21T06:31:07Z`
Labels | `index`
Edit @| [here](https://github.com/junxnone/aiwiki/issues/295)

---
# NDT Normal Distributions Transform 正态分布变换

NDT 和 [ICP](0086_3D_Algos_Registration_ICP)/[GICP](0296_3D_Algos_Registration_ICP_GICP) 的根本区别在于：**NDT 完全不需要建立点对点的对应关系**——不像 ICP 那样每次迭代都要做最近邻搜索找对应点，NDT 把参考点云转换成一个连续可微的概率密度表示，直接在这个密度场上做优化，省掉了 ICP 里最耗时的最近邻搜索步骤。

## Pipeline

1. **空间网格化**：把参考（目标）点云所在空间划分成规则的三维体素网格；
2. **逐体素建模**：对每个非空体素，用落在该体素内的点计算一个多维正态分布的参数——均值向量 $\mu$ 和协方差矩阵 $\Sigma$（PDF，Probability Density Function）；
3. 所有体素的正态分布叠加起来，构成一个**分段连续、处处可微**的概率密度函数，描述"空间中任意一点落在参考点云表面附近的概率有多大"；
4. 配准时，把待配准（源）点云的每个点代入这个概率密度函数，所有点的概率密度之和就是当前变换下的"匹配得分"（Score）；
5. 用**牛顿法（Newton's Method）**对变换参数求导、迭代优化，让匹配得分最大化，收敛后得到最终变换——不需要像 ICP 那样每次迭代重新搜索最近邻对应点。

## 为什么在 SLAM 场景里很受欢迎

- **省掉最近邻搜索**：ICP 每次迭代最耗时的部分就是最近邻搜索，NDT 用概率密度直接评估匹配程度，省掉这一步，在大规模激光雷达点云上收敛更快；
- **地图表示更紧凑**：一旦构建出每个体素的正态分布参数，原始点云数据本身就不再需要保留，这份"分布地图"比原始点云更省存储，适合 SLAM 里长期维护一张大范围地图的场景；
- **对点云密度变化更鲁棒**：ICP 的最近邻搜索对点云密度分布敏感（密度不均会让最近邻关系出现偏差），NDT 只关心每个体素内点的统计分布，天然对密度不均匀有一定免疫力。

## 发展历史

NDT 最早由 Biber 和 Straßer 于 2003 年提出，用于**2D** 激光扫描匹配；Magnusson 在博士论文（2009，Örebro University，《The Three-Dimensional Normal-Distributions Transform》）里把这套方法系统性地扩展到 **3D**，并进一步应用到地图构建、回环检测（Loop Detection）等 SLAM 子任务上，是 NDT 在三维/机器人领域被广泛采用的关键工作。

2D | 3D
-- | --
![image](https://user-images.githubusercontent.com/2216970/157405744-ca8eb880-dd76-4db9-8a51-cfc247a0f9f2.png) | ![image](https://user-images.githubusercontent.com/2216970/157409574-d14dafff-ce5f-4c47-b113-5a7e967680a9.png)

## Reference
- [The Normal Distributions Transform: A New Approach to Laser Scan Matching](https://www.researchgate.net/publication/4045903_The_Normal_Distributions_Transform_A_New_Approach_to_Laser_Scan_Matching)
- [3D-NDT-匹配算法](http://epsilonjohn.club/2020/03/06/Autoware.ai/3D-NDT-%E5%8C%B9%E9%85%8D%E7%AE%97%E6%B3%95/)
- [The Three-Dimensional Normal-Distributions Transform --- an Efficient Representation for Registration, Surface Analysis, and Loop Detection](https://www.researchgate.net/publication/229213868_The_Three-Dimensional_Normal-Distributions_Transform_---_an_Efficient_Representation_for_Registration_Surface_Analysis_and_Loop_Detection)
- [NDT（Normal Distributions Transform）算法原理与公式推导 ](https://www.cnblogs.com/21207-iHome/p/8039741.html)
- [NDT方法在SLAM中的应用 ](https://www.cnblogs.com/yhlx125/p/5749770.html)
- [3D Algos Registration ICP](0086_3D_Algos_Registration_ICP)
- [3D Algos Registration](0235_3D_Algos_Registration)

