---
Title | FPFH
-- | --
Create Date | `2022-03-14T06:33:33Z`
Update Date | `2022-03-15T08:34:12Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/299)

---
## Reference
- [三维点云课程---FPFH特征点描述](https://blog.csdn.net/qq_45369294/article/details/121125386)

## Brief
- FPFH  - `Fast Point Feature Histogram` - 快速 PFH
- 基于 [[PFH]] 
- SPFH - `Simplified Point Feature Histogram` - 简化 PFH 
  - 只计算查询点与邻域点特征 (不计算邻域间点间特征)
- 算法复杂度 $O(nk)$
- 角度区间分割默认分割 11 份, 不进行穷举[$33 = 11 + 11 + 11$] ==> `pcl::FPFHSignature33`

