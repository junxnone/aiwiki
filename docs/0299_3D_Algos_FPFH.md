---
Title | 3D Algos FPFH
-- | --
Created @ | `2022-03-14T06:33:33Z`
Last Modify @| `2022-12-25T03:26:43Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/299)

---
## Reference
- [三维点云课程---FPFH特征点描述](https://blog.csdn.net/qq_45369294/article/details/121125386)
- [Fast Point Feature Histograms (FPFH) for 3D registration](https://www.cvl.iis.u-tokyo.ac.jp/class2016/2016w/papers/6.3DdataProcessing/Rusu_FPFH_ICRA2009.pdf)


## Brief
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

