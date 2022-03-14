---
Title | SVD
-- | --
Create Date | `2018-09-03T22:49:40Z`
Update Date | `2022-03-14T02:09:25Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/297)

---
# Reference
- [奇异值分解（SVD）](https://zhuanlan.zhihu.com/p/29846048)
- [线性代数之——SVD 分解](https://zhuanlan.zhihu.com/p/93474729)

## Brief
- SVD - `Singular Value Decomposition` - 奇异值分解


### 特征值 & 特征向量

定义 | Description
-- | --
$Ax = \lambda x$ | n x n 矩阵
$x$ | n 维向量
$\lambda$ | 矩阵 A 的 一个 **特征值**
$x$ | 矩阵 A 的 特征值 $\lambda$ 对应的 **特征向量**
$\left\{ \lambda_{1} \leq  \lambda_{2} \leq ... \leq  \lambda_{n} \right\}$ | n 个特征值
$ \omega_{1},   \omega_{2},...,  \omega_{n}  $ | n 个特征值对应的特征向量
$\sum$ | n个特征值为主对角线的 n x n 矩阵
$W$ | n 个特征向量组成的 n x n 矩阵
$A = W\sumW^{-1}$ | 矩阵 A 的 特征分解表示
$A = W\sumW^{T}$ | W 的 n 个特征向量标准化 $\omega_{i}^T\omega_{i}=1$, 即 $W^TW =I$, $W^T=W^{-1}$

