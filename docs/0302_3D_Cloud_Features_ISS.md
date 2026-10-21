---
Title | 3D Cloud Features ISS
-- | --
Created @ | `2022-03-23T03:30:18Z`
Updated @| `2026-10-21T05:10:56Z`
Labels | `index`
Edit @| [here](https://github.com/junxnone/aiwiki/issues/302)

---
# ISS KeyPoint

## Reference
- 2007 ISS [Intrinsic Shape Signatures A Shape Descriptor For 3D Object Recognition.pdf](https://github.com/junxnone/aiwiki/files/8329473/IntrinsicShapeSignaturesAShapeDescriptorFor3DObjectRecognition.pdf)
- [ISS关键点提取](https://zhuanlan.zhihu.com/p/353832643)
- [曲率](0304_3D_Cloud_Features_Curvature)
- [Features 总览](0424_3D_Cloud_Features)

## Brief
- ISS KeyPoint - `Intrinsic Shape Signatures`
- 目标：从稠密点云中挑出局部几何"显著"的点作为关键点，减少后续配准/识别的计算量，同时尽量不丢失有代表性的几何信息。

## 算法原理

1. 对每个点 $p$，以半径 $r$ 搜索邻域点集合，计算加权协方差矩阵 $\mathrm{cov}(p)$（权重通常取邻域点密度的倒数，避免密集区域主导结果）；
2. 对协方差矩阵做特征值分解，得到三个特征值 $\lambda_1 \geq \lambda_2 \geq \lambda_3 \geq 0$，分别对应局部形状在三个主方向上的"散布程度"；
3. 判定是否为候选关键点，需要同时满足两个比值阈值条件：
   - $\lambda_2 / \lambda_1 < \epsilon_{21}$
   - $\lambda_3 / \lambda_2 < \epsilon_{32}$

   直观理解：如果三个特征值大小接近（比值接近 1），说明该点局部形状在各个方向上都"差不多"（比如一块平面或者球面上的点），没有显著的方向性，不是好的关键点；只有当特征值依次明显衰减（$\lambda_1 \gg \lambda_2 \gg \lambda_3$）时，说明局部形状有清晰的主方向（比如边缘、角点），才会通过筛选；
4. 对通过阈值筛选的候选点，用最小特征值 $\lambda_3$ 作为"显著性"（saliency）分数，在邻域内做非极大值抑制，保留局部显著性最高的点作为最终关键点。

## 和曲率的关系

ISS 的协方差矩阵特征值分解和 [曲率](0304_3D_Cloud_Features_Curvature) 的计算都依赖对点的局部邻域做二阶统计——本质上都是在回答"这块曲面有多弯、往哪个方向弯"，只是曲率直接刻画几何弯曲程度这个数值，而 ISS 用特征值比值间接衡量"方向显著性"，服务于关键点筛选而不是直接输出一个几何量。

