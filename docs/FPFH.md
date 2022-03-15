---
Title | FPFH
-- | --
Create Date | `2022-03-14T06:33:33Z`
Update Date | `2022-03-15T09:13:18Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/299)

---
## Reference
- [三维点云课程---FPFH特征点描述](https://blog.csdn.net/qq_45369294/article/details/121125386)
- [[Fast Point Feature Histograms (FPFH) for 3D registration](https://www.cvl.iis.u-tokyo.ac.jp/class2016/2016w/papers/6.3DdataProcessing/Rusu_FPFH_ICRA2009.pdf)


## Brief
- FPFH  - `Fast Point Feature Histogram` - 快速 PFH
- 基于 [[PFH]] 
- SPFH - `Simplified Point Feature Histogram` - 简化 PFH 
  - 只计算查询点与邻域点特征 (不计算邻域间点间特征)
- 算法复杂度 $O(nk)$
- 角度区间分割默认分割 11 份, 不进行穷举[$33 = 11 + 11 + 11$] ==> `pcl::FPFHSignature33`

## FPFH
- 加权重计算 SPFH: $FPFH(P) = SPF(p)+\frac{1}{k}\sum_{i=1}^{k}\frac{1}{w_k}SPF(p_k)$

![image](https://user-images.githubusercontent.com/2216970/158344329-9eb7b5fd-4938-4923-bd82-3adebeddb352.png)



