---
Title | 3D Algos Registration Metrics
-- | --
Created @ | `2021-05-13T03:05:30Z`
Updated @| `2026-10-21T06:30:58Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/236)

---
# Registration Metrics 配准评价指标

配准结果的好坏可以从两个角度量化：**有没有真值变换矩阵可比较**（仿真数据/标定场景）用变换误差直接评价；**没有真值**（只有两份点云本身）则只能用配准后两份点云的重合/接近程度间接评价。下面按这两类梳理。

## 重叠度类：LCP (Largest Common Pointset)

- 重叠度 = 重合点占所有点数量的比例
- **重合点**：变换后源点云中的某点 $p$，若在目标点云中存在一点 $q$ 满足 $\|p - q\| < \tau$（$\tau$ 为容差阈值），则 $p$ 被判定为"重合点"
- LCP 直接反映"配准后两份点云实际对上了多少"，是没有真值变换矩阵时最直观的评价方式

## 距离类：Chamfer Distance / Hausdorff Distance

- **Chamfer Distance（倒角距离）**：双向最近邻距离的平均
  $$CD(P,Q) = \frac{1}{|P|}\sum_{p \in P}\min_{q \in Q}\|p-q\|^2 + \frac{1}{|Q|}\sum_{q \in Q}\min_{p \in P}\|q-p\|^2$$
  衡量两份点云整体的接近程度，取平均使得它对少量离群点/局部配准失败不敏感，适合作为日常监控配准质量的整体指标。
- **Hausdorff Distance（豪斯多夫距离）**：取最坏情况下的最近邻距离
  $$H(P,Q) = \max\left(\max_{p \in P}\min_{q \in Q}\|p-q\|,\ \max_{q \in Q}\min_{p \in P}\|q-p\|\right)$$
  衡量"配准结果里最差的那个点偏差有多大"，对离群点/局部配准失败非常敏感——Chamfer Distance 取平均可能把局部失败"平均掉"看不出来，Hausdorff Distance 不会，更适合排查配准是否在某个区域彻底失败。

## 变换误差类：R & T 旋转平移矩阵误差（需要真值变换矩阵）

- **RMSE**：和 [ICP](0086_3D_Algos_Registration_ICP) 的优化目标函数形式一致
  $$RMSE = \sqrt{\frac{1}{N}\sum_{i=1}^{N}\left\|p_t^i - (Rp_s^i + T)\right\|^2}$$
  区别是作为评价指标时，通常用收敛后的最终变换计算，而不是优化过程中的中间值。
- **MSE / MAE**：均方误差/平均绝对误差，分别从旋转 $R$ 和平移 $T$ 两部分统计：
  - **各向异性（anisotropic）**：分别统计欧拉角（roll/pitch/yaw）或 x/y/z 各个分量各自的误差，能看出误差集中在哪个方向/轴上；
  - **各向同性（isotropic）**：把旋转误差汇总成一个标量（如总旋转角度误差）、平移误差汇总成一个标量（如平移向量模长误差），更适合不同算法之间做整体对比。

## 怎么选

- **有真值变换矩阵**（仿真数据集/有标定设备）：优先用 R & T 误差，直接、准确；
- **没有真值**（只有两份待配准点云本身）：用 LCP/Chamfer/Hausdorff 衡量配准后的重合程度——日常监控整体质量用 Chamfer（平均、稳定），排查局部是否配准失败用 Hausdorff（最坏情况、敏感）。

## Reference
- 2020.03 A Benchmark for Point Clouds Registration Algorithms [[Paper](https://arxiv.org/abs/2003.12841)] [[Code](https://github.com/iralabdisco/point_clouds_registration_benchmark)]
- [点云配准中常用的评价指标](https://blog.csdn.net/cfan927/article/details/113929241)
- [3D Algos Registration ICP](0086_3D_Algos_Registration_ICP)
- [3D Algos Registration](0235_3D_Algos_Registration)

