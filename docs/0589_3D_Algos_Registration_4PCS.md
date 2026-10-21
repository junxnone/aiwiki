---
Title | 3D Algos Registration 4PCS
-- | --
Created @ | `2026-10-21T06:25:31Z`
Updated @| `2026-10-21T06:25:31Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/589)

---
# 4PCS - 4-Point Congruent Sets

4PCS 把 RANSAC 式随机采样的最小子集从 3 个点扩展到**4 个共面点**，并利用仿射不变的"距离比例"关系大幅加速了寻找对应四点组的过程，是较早一批不依赖特征描述子、纯几何穷举搜索类全局配准算法的代表。

## 算法原理

1. 在源点云 $P$ 中随机选取一组**共面的 4 个点**作为基准集 $B = \{a,b,c,d\}$；
2. 这 4 个共面点里，两条对角线的交点把每条对角线分成两段，这两段长度的比例在**仿射变换下保持不变**（刚体变换是仿射变换的子集，所以旋转平移也不会改变这个比例）；
3. 利用这个不变比例关系，在目标点云 $Q$ 中高效搜索所有"距离比例匹配"的候选四点组（不需要逐一穷举所有四点组合，大幅缩小候选范围）；
4. 对每个候选四点组，验证能否通过一个刚体变换和基准集 $B$ 对齐，计算配准误差（如 LCP 重叠度，详见 [Registration Metrics](0236_3D_Algos_Registration_Metrics)）；
5. 重复 1-4 多轮，保留整体配准误差最小（LCP 最高）的那次变换作为最终结果。

## 优点

- 完全不需要特征描述子（不像 SAC-IA 依赖 FPFH），只用几何共面关系就能做全局配准；
- 对任意初始姿态都适用，不需要预先给定粗略的初始变换；
- 对部分重叠、一定程度的噪声有较好的鲁棒性（共面四点组作为整体验证单元，比单个点更抗噪声干扰）。

## 缺点

- **时间复杂度为 $O(n^2)$**：在源点云里给定基准集后，到目标点云里搜索满足特定距离的候选点对这一步，以及后续大量候选四点组的验证，都带来平方级的计算开销，大规模点云上效率明显下降；
- 对噪声较大的点云，找到真正共面的候选四点组更加困难，计算时间进一步增加；
- 需要预估两份点云的重叠率作为参数，重叠率设置不准确会影响效率和效果（后续 Dynamic 4PCS 等变种尝试解决这个问题）。

## 和其他方法的关系

4PCS 的 $O(n^2)$ 复杂度瓶颈直接催生了后续的 3D Algos Registration Super4PCS（用空间索引把复杂度降到线性）；思路上 4PCS 和 RANSAC 是同一类"随机采样+一致性验证"框架，区别只在于最小子集的选取方式（4 个共面点+比例不变量 vs 纯随机 3 点），详见 3D Algos Registration RANSAC。

## Reference
- Aiger, D., Mitra, N.J., Cohen-Or, D. 4-Points Congruent Sets for Robust Pairwise Surface Registration, ACM TOG 2008
- [3D Algos Registration Metrics](0236_3D_Algos_Registration_Metrics)
- [3D Algos Registration](0235_3D_Algos_Registration)

