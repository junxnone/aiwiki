---
Title | 3D Algos Registration SACIA
-- | --
Created @ | `2022-03-16T10:15:58Z`
Updated @| `2026-10-21T06:31:11Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/300)

---
# SAC-IA

SAC-IA（Sample Consensus Initial Alignment，采样一致性初始配准）是基于 [FPFH](0299_3D_Cloud_Features_FPFH) 特征的粗配准（Coarse Registration）算法，思路类似 RANSAC：通过随机采样+一致性验证，从大量可能有误的特征匹配里找出一个合理的初始变换矩阵，解决"两份点云初始姿态差异很大时，直接用 [ICP](0086_3D_Algos_Registration_ICP) 容易陷入错误局部最优"这个问题。

## Pipeline

1. 分别计算源点云 $P_s$ 和目标点云 $Q_t$ 的 [FPFH](0299_3D_Cloud_Features_FPFH) 特征；
2. 在源点云中随机选取 n（n≥3，实践中常取 3-4 个）个采样点，采样时要求这些点之间保持一定的最小距离——避免选到彼此离得太近、局部几何高度相似的点，否则求解出的变换矩阵会在几何上退化（比如三点近似共线时无法唯一确定旋转）；
3. 对每个采样点，在目标点云的 FPFH 特征空间里搜索 FPFH 向量最相似的候选对应点（通常用 k-d 树在特征空间里做最近邻搜索，而不是在三维坐标空间里搜索）；
4. 用这 n 对候选对应点，通过 SVD 分解（具体推导见 [ICP](0086_3D_Algos_Registration_ICP) 里的最优变换求解部分）计算出一个候选的旋转平移矩阵；
5. 用这个候选变换把源点云的其余采样点变换到目标坐标系，统计变换后点和目标点云的误差（比如落在误差阈值内的点对数量，或总体误差大小），作为这组候选变换的"打分"；
6. 重复 2-5 若干次，取打分最好（误差最小/一致点对最多）的那次候选变换，作为最终的粗配准结果。

## 为什么要用"一致性采样"而不是直接匹配所有点

FPFH 特征匹配天然存在大量误匹配（特征相似不代表就是真实对应点，尤其是对称或局部几何重复的物体），如果直接用所有匹配点对一次性求解变换，少量误匹配就足以让最小二乘解严重偏离。SAC-IA 借鉴 RANSAC 的核心思想：**每次只用一小组随机采样的匹配去求解一个假设变换，用整体数据验证这个假设的好坏，重复多次后保留最优假设**，用这种方式对误匹配有天然的容忍度，不需要提前知道哪些匹配是错的。

## 和精配准的衔接

SAC-IA 只负责求出一个"大致正确"的初始变换，精度通常不足以直接使用。实践中的标准流程是 SAC-IA 粗配准之后，再用 [ICP](0086_3D_Algos_Registration_ICP)（或其变种 [GICP](0296_3D_Algos_Registration_ICP_GICP)）做精配准迭代优化，这个两阶段流程在 [点云拼接](0286_3D_Cloud_Merge) 一文里有完整串联说明。

## Reference
- Rusu, R.B. et al. Fast Point Feature Histograms (FPFH) for 3D Registration, ICRA 2009
- [RANSAC & MLESAC & SAC-IA](https://littlebearsama.github.io/2020/04/11/Registration/0.SAC-IA/)
- [3D Cloud Features FPFH](0299_3D_Cloud_Features_FPFH)
- [3D Algos Registration ICP](0086_3D_Algos_Registration_ICP)
- [3D Cloud Merge](0286_3D_Cloud_Merge)
- [3D Algos Registration](0235_3D_Algos_Registration)

