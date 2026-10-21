---
Title | 3D Cloud Features CVFH
-- | --
Created @ | `2026-10-21T05:35:49Z`
Updated @| `2026-10-21T05:39:01Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/583)

---
# CVFH - Clustered Viewpoint Feature Histogram

- CVFH 是对 [VFH](0582_3D_Cloud_Features_VFH) 的改进——核心思路是不再对整个物体簇算一个全局 VFH，而是先把物体表面切成若干个**平滑区域（Smooth Region）**，每个区域单独算一个 VFH，解决 VFH 对部分遮挡/点云缺失敏感的问题。

## 算法流程

1. **去除高曲率点**：先用 [曲率](0304_3D_Cloud_Features_Curvature) 估计，剔除曲率过高的点（这些点通常是物体边缘/棱角，容易因为遮挡/噪声变化）；
2. **区域生长（Region Growing）**：在剩下的低曲率点上做区域生长聚类，把表面切分成 N 个不相交的平滑区域；
3. **逐区域计算 VFH**：每个平滑区域独立当作一个"小物体"，各自计算一份 VFH 直方图；
4. 一个物体最终对应 N 个 VFH 直方图（N 由区域生长结果决定，不是固定值），而不是 VFH 的单个全局直方图。

## 为什么能解决遮挡问题

VFH 失真的根本原因是"全局质心被遮挡影响偏移"——CVFH 把全局统计拆成了多个局部的平滑区域统计，即使物体被部分遮挡，**只要遮挡没有覆盖某个平滑区域的全部点，那个区域对应的 VFH 依然是可靠的**，不会被其他区域的缺失拖累。代价是需要维护和匹配多个直方图而不是一个，计算量和存储量都有所增加。

## 后续改进：OUR-CVFH

OUR-CVFH（Oriented, Unique and Repeatable CVFH）进一步引入了一个可重复、唯一的参考坐标系（基于类似 [PFH](0298_3D_Cloud_Features_PFH) 的 Darboux 坐标系构造思路），让描述子不仅能识别物体类别，还能更精确地估计物体的旋转姿态，描述子维度也从 VFH 的 308 维调整为 303 维。

## UseCase

和 VFH 一样用于物体识别+姿态估计，更适合实际机器人/工业场景里"物体经常被周围其他物体部分遮挡"的情况——分割出来的物体簇通常都不是完整可见的，这正是 CVFH 相对 VFH 的优势场景。

## Reference
- Aldoma, A. et al. CAD-Model Recognition and 6DOF Pose Estimation Using 3D Cues（CVFH 提出论文，ICCV Workshops 2011）
- Aldoma, A., Tombari, F., Rusu, R.B., Vincze, M. OUR-CVFH: Oriented, Unique and Repeatable Clustered Viewpoint Feature Histogram for Object Recognition and 6DOF Pose Estimation, LNCS 2012（后续改进版）
- [3D Cloud Features VFH](0582_3D_Cloud_Features_VFH)
- [3D Cloud Features](0424_3D_Cloud_Features)


