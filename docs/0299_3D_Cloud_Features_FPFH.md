---
Title | 3D Cloud Features FPFH
-- | --
Created @ | `2022-03-14T06:33:33Z`
Updated @| `2026-10-21T05:18:52Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/299)

---
# FPFH  

- FPFH  - `Fast Point Feature Histogram` - 快速 PFH
- 基于 [[PFH]] 
- SPFH - `Simplified Point Feature Histogram` - 简化 PFH 
  - 只计算查询点与邻域点特征 (不计算邻域间点间特征)
- 算法复杂度 $O(nk)$
- 角度区间分割默认分割 11 份, 不进行穷举[$33 = 11 + 11 + 11$] ==> `pcl::FPFHSignature33` ==> `(float[33])`

## FPFH
- 加权重计算 ==>    $FPFH(p) = SPFH(p)+\frac{1}{k}\sum_{i=1}^{k}\frac{1}{w_k}SPFH(p_k)$
- $SPFH(p)$ : 查询点 $p$ 的 SPFH
- $SPFH(p_k)$ : 近邻点 $p_k$ 的 SPFH
- $k$: 查询点 $p$ 有 k 个近邻点
- $\frac{1}{w_k}$: 查询点 $p$ 与近邻点 $p_k$ 的距离

![image](https://user-images.githubusercontent.com/2216970/158344329-9eb7b5fd-4938-4923-bd82-3adebeddb352.png)


### PFH vs FPFH


PFH 点对特征值计算 | FPFH 加权计算
-- | --
![image](https://user-images.githubusercontent.com/2216970/158348645-881ebbf6-b31d-4d48-9da8-4ef6cf33e713.png) | ![image](https://user-images.githubusercontent.com/2216970/158348708-7bccf4ea-2579-4613-a04f-917c5667b67c.png)

## 为什么 FPFH 比 PFH 快：计算量怎么省下来的

PFH 要穷举邻域内**所有点对**（$k(k+1)/2$ 个），每个点对都要计算一次 $(\alpha,\phi,\theta)$，复杂度 $O(k^2)$；FPFH 把这件事拆成两步：

1. **SPFH**：每个点只计算自己和邻域点之间的关系（不是邻域内部互相配对），单点复杂度降到 $O(k)$；
2. **加权累加**：查询点最终的 FPFH，用自己的 SPFH 加上邻域内所有点的 SPFH 按距离加权平均——这一步用一次额外的加权求和，**近似恢复**了 PFH 原本靠穷举点对才能捕捉到的"邻域内部结构"信息。

这样全点云算一遍的总复杂度从 PFH 的 $O(nk^2)$ 降到 FPFH 的 $O(nk)$，代价是精度上的近似（不是精确等价于 PFH），但实践中这个近似通常够用。

## UseCase：SAC-IA 粗配准

FPFH 最主要的实际用途，是作为 **SAC-IA（Sample Consensus Initial Alignment）** 粗配准算法的输入特征（FPFH 原始论文本身也是围绕配准场景提出的）：

1. 对源点云和目标点云分别计算每个点的 FPFH 特征；
2. 在 FPFH 特征空间里，用采样一致性策略（思路类似 RANSAC）寻找两份点云之间特征相似的点对，作为候选对应点；
3. 根据候选对应点，估计出一个初始的旋转平移矩阵（见 [旋转矩阵](0234_3D_Cloud_RM)）；
4. 这个初始矩阵作为后续 **点到面 ICP** 精配准的起点，避免 ICP 因为初始位姿相差太大陷入错误的局部最优。

完整的两阶段配准流程（粗配准+精配准）详见 [点云拼接](0286_3D_Cloud_Merge)。和 [PFH](0298_3D_Cloud_Features_PFH) 一样，FPFH 同样建立在局部坐标系上，具备姿态（旋转/平移）无关性，这也是它能跨点云找对应点的前提。


## Reference
- [三维点云课程---FPFH特征点描述](https://blog.csdn.net/qq_45369294/article/details/121125386)
- [Fast Point Feature Histograms (FPFH) for 3D registration](https://www.cvl.iis.u-tokyo.ac.jp/class2016/2016w/papers/6.3DdataProcessing/Rusu_FPFH_ICRA2009.pdf)
- [3D Cloud Merge](0286_3D_Cloud_Merge)


