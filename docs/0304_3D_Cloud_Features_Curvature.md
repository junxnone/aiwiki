---
Title | 3D Cloud Features Curvature
-- | --
Created @ | `2022-04-01T02:04:36Z`
Updated @| `2026-10-21T05:18:05Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/304)

---
# 3D Cloud Curvature 点云曲率


Name | Description
-- | --
法曲率(Normal curvature) | 曲面在一点沿不同方向的曲率
主曲率 (Principal Curvatures) | 法曲率中的最大值 $k_1$ 和最小值 $k_2$
平均曲率(Mean Curvature) | 曲率在空间中的弯曲程度 $H=\frac{k_1+k_2}{2}$
高斯曲率(Gaussian Curvature) | 内在弯曲程度 $K = k_1\times k_2$

## 曲面分类：根据高斯/平均曲率的符号

给定一点的高斯曲率 $K$ 和平均曲率 $H$，可以把该点处的局部曲面形状分成四类：

| $K$ | $H$ | 曲面类型 | 直观形状 |
|---|---|---|---|
| $K > 0$ | $H \neq 0$ | 椭圆点（Elliptic） | 局部像球面的凸起或凹陷——两个主曲率同号 |
| $K < 0$ | — | 双曲点（Hyperbolic） | 鞍点——两个主曲率异号，一个方向往上弯一个方向往下弯 |
| $K = 0$ | $H \neq 0$ | 抛物点（Parabolic） | 局部像柱面——一个主曲率为 0 |
| $K = 0$ | $H = 0$ | 平面点（Planar） | 局部是平面——两个主曲率都为 0 |

## 点云里曲率是怎么实际算出来的

上面的定义来自连续曲面的微分几何，但点云是离散采样的点集，没有现成的解析曲面方程可以直接求导——实践中（如 PCL）用 **PCA（主成分分析）** 近似：

1. 对查询点 $p$ 取局部邻域点集合，计算这些邻域点的协方差矩阵；
2. 对协方差矩阵做特征值分解，得到三个特征值 $\lambda_0 \leq \lambda_1 \leq \lambda_2$ 及对应特征向量；
3. **最小特征值 $\lambda_0$ 对应的特征向量，就是该点的法向量估计**（邻域点在这个方向上"散布"最小，也就是最接近垂直于局部切平面的方向）；
4. **曲率近似值（表面变化率，Surface Variation）**：
   $$\sigma = \frac{\lambda_0}{\lambda_0 + \lambda_1 + \lambda_2}$$
   $\sigma$ 越接近 0，说明邻域点几乎共面（局部平坦）；$\sigma$ 越大，说明邻域点在法向量方向上也有明显散布，局部弯曲程度越高。

这个 $\sigma$ 是一种**近似**，并不是严格意义上微分几何定义的主曲率/高斯曲率/平均曲率——它本质上是对"法向量变化剧烈程度"的一个数值化代理指标，好处是只需要一次 PCA 就能同时拿到法向量和曲率估计，计算成本低，在 PCL 等库的法向量估计接口（如 `computePointNormal`）里是和法向量一起作为副产品直接输出的。

## 和 PFH / ISS 的关系

- [PFH](0298_3D_Cloud_Features_PFH) 需要的法向量，和这里曲率近似值来自**同一次 PCA 协方差矩阵特征值分解**——法向量是最小特征值对应的特征向量，曲率近似值是最小特征值归一化后的结果，两者是同一次计算的两个输出。
- [ISS](0302_3D_Cloud_Features_ISS) 同样基于邻域协方差矩阵的特征值分解，但关注点不同：曲率用归一化的最小特征值衡量"弯曲程度"这个数值本身；ISS 用三个特征值之间的**比值**（$\lambda_2/\lambda_1$、$\lambda_3/\lambda_2$）衡量局部形状在三个方向上"散布程度"是否有显著差异，服务于关键点筛选而不是输出一个曲率数值——同样的协方差矩阵特征值分解，被两种不同的下游任务用出了两种不同的解读方式。



## Reference
- [法曲率、主曲率、高斯曲率、平均曲率](https://zhuanlan.zhihu.com/p/149584374)
- [Principal curvatures - MIT](http://web.mit.edu/hyperbook/Patrikalakis-Maekawa-Cho/node30.html)
- [Principal curvatures - Wolfram MathWorld](https://mathworld.wolfram.com/PrincipalCurvatures.html)
- [Gaussian Curvature](https://mathworld.wolfram.com/GaussianCurvature.html)
- [Mean Curvature](https://mathworld.wolfram.com/MeanCurvature.html)
- [3D Cloud Features PFH](0298_3D_Cloud_Features_PFH)
- [3D Cloud Features ISS](0302_3D_Cloud_Features_ISS)


