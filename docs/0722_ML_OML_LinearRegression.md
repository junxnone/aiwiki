---
Title | ML OML LinearRegression
-- | --
Created @ | `2026-11-24T03:39:12Z`
Updated @| `2026-11-24T03:39:12Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/722)

---
# Linear Regression 线性回归

- 用特征的**线性组合**预测一个连续值，是最基础的回归模型，也是理解正则化、梯度下降、逻辑回归和神经网络的起点
- 属于 [传统机器学习](/0367_ML_OML)；评估指标见 [Regression Metrics](/0710_ML_Metrics_Regression)

## 模型

$$
\hat{y} = w^\top x + b = \sum_{j=1}^{d} w_j x_j + b
$$

其中：

- $x \in \mathbb{R}^d$：输入特征向量，$d$ 为特征维度；$\hat{y}$：模型预测值
- $w \in \mathbb{R}^d$：权重，$w_j$ 表示特征 $x_j$ 每增加一个单位，预测值变化多少；$b$：偏置（截距）
- 把偏置并入权重（给 $x$ 增加一维常数 1）后可简写为 $\hat{y} = w^\top x$

## 最小二乘

- 训练目标：最小化预测值与真值的平方误差之和（均方误差 MSE）

$$
J(w) = \frac{1}{N}\sum_{i=1}^{N}\big(y_i - w^\top x_i\big)^2 = \frac{1}{N}\lVert y - Xw \rVert^2
$$

其中：

- $N$：样本数；$x_i$、$y_i$：第 $i$ 个样本的特征和真值
- $X \in \mathbb{R}^{N \times d}$：把所有样本按行堆叠的设计矩阵；$y \in \mathbb{R}^N$：真值向量
- $J(w)$ 是关于 $w$ 的凸二次函数，只有一个全局最小值

### 解析解（正规方程）

- 令 $\nabla_w J = 0$ 得到：

$$
w^* = (X^\top X)^{-1} X^\top y
$$

其中：

- $X^\top X \in \mathbb{R}^{d \times d}$：特征的协方差（未中心化）矩阵；$(X^\top X)^{-1}$ 是它的逆
- 要求 $X^\top X$ 可逆，即特征之间**不能线性相关**（多重共线性）且 $N \ge d$；否则要用伪逆或正则化
- 计算复杂度约 $O(d^3 + N d^2)$，特征维度很大时代价高，此时用梯度下降

### 梯度下降

$$
w \leftarrow w - \eta\,\nabla_w J(w), \qquad \nabla_w J(w) = -\frac{2}{N}X^\top (y - Xw)
$$

其中：$\eta > 0$ 为学习率，太大发散、太小收敛慢；$\nabla_w J$ 为 MSE 对 $w$ 的梯度。由于 $J$ 是凸函数，只要学习率合适一定收敛到全局最优。**特征要先标准化**，否则不同量纲的特征会使损失面呈狭长的椭圆，收敛很慢。

## 正则化

Name | 目标函数 | 特点
-- | -- | --
Ridge (L2) | $J(w) + \lambda \lVert w \rVert_2^2$ | 权重整体收缩，缓解多重共线性，有解析解 $w=(X^\top X + \lambda I)^{-1}X^\top y$
Lasso (L1) | $J(w) + \lambda \lVert w \rVert_1$ | 产生**稀疏**权重，同时做特征选择，无解析解
Elastic Net | $J(w) + \lambda_1 \lVert w \rVert_1 + \lambda_2 \lVert w \rVert_2^2$ | 综合两者，特征强相关时更稳定

其中：$\lambda \ge 0$ 为正则强度（$\lambda_1$、$\lambda_2$ 分别对应 L1、L2），越大模型越简单；$\lVert w \rVert_1 = \sum_j \lvert w_j \rvert$，$\lVert w \rVert_2^2 = \sum_j w_j^2$；$I$ 为单位矩阵。表中三种方法都是在最小二乘的基础上加一项对权重大小的惩罚来对抗过拟合，见 [Regularization](/0252_ML_Op_Regularization)。

## 多项式回归

- 线性回归的「线性」指对**参数**线性，不是对特征线性
- 对特征做非线性变换后再做线性回归，就能拟合曲线，如 $\hat{y} = w_0 + w_1 x + w_2 x^2 + w_3 x^3$
- 多项式次数越高越容易过拟合，需要配合正则化和 [Cross Validation](/0249_ML_Metrics_CrossValidation) 选择

## 基本假设

- 特征与目标之间线性关系
- 样本独立，误差零均值、方差恒定（同方差）、近似服从正态分布
- 特征之间不存在严重的多重共线性
- 假设不成立时模型仍能训练，但系数的统计解释（显著性检验、置信区间）不可靠；对预测任务而言，更多是看验证集指标

## 优缺点

- **优点**
  - 简单、训练快、可解释（权重的大小和符号有直接含义）
  - 有解析解，无局部最优问题
  - 可作为所有回归任务的基线
- **缺点**
  - 只能拟合线性关系，需要人工做特征变换
  - 对离群点敏感（平方误差会放大大误差，可改用 Huber 损失）
  - 特征强相关时系数不稳定

## Code
```python
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler, PolynomialFeatures

lr = LinearRegression().fit(X_train, y_train)
print(lr.coef_, lr.intercept_)

# 多项式回归 + Ridge, 注意先扩展特征再标准化
model = make_pipeline(PolynomialFeatures(degree=3), StandardScaler(), Ridge(alpha=1.0)).fit(X_train, y_train)
```

## Reference
- [scikit-learn - Linear Models](https://scikit-learn.org/stable/modules/linear_model.html)
- [The Elements of Statistical Learning](https://hastie.su.domains/ElemStatLearn/)

