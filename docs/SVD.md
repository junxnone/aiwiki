---
Title | SVD
-- | --
Create Date | `2018-09-03T22:49:40Z`
Update Date | `2022-03-14T03:06:05Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/297)

---
# Reference
- [奇异值分解（SVD）](https://zhuanlan.zhihu.com/p/29846048)
- [线性代数之——SVD 分解](https://zhuanlan.zhihu.com/p/93474729)

## Brief
- SVD - `Singular Value Decomposition` - 奇异值分解
- 特征分解

### 特征值 & 特征向量 & 特征分解

定义 | Description
-- | --
$A$ | n x n 维矩阵
$Ax = \lambda x$ | 特征向量和特征值关系
$x$ | n 维向量
$\lambda$ | 矩阵 A 的 一个 **特征值**
$x$ | 矩阵 A 的 特征值 $\lambda$ 对应的 **特征向量**
$\left\{ \lambda_{1} \leq  \lambda_{2} \leq ... \leq  \lambda_{n} \right\}$ | n 个特征值
$ \omega_{1},   \omega_{2},...,  \omega_{n}  $ | n 个特征值对应的特征向量
$\Sigma$ | n个特征值为主对角线的 n x n 矩阵
$W$ | n 个特征向量组成的 n x n 矩阵
$A = W\Sigma W^{-1}$ | 矩阵 A 的 特征分解表示
$A = W\Sigma W^{T}$ | W 的 n 个特征向量标准化 $\omega_{i}^T\omega_{i}=1$, 即 $W^TW =I$, $W^T=W^{-1}$


## SVD 分解
- 不要求分解矩阵为 **方阵**


定义 | Description
-- | --
$A$ | m x n 矩阵
$A=U\Sigma V^T$ | A 的 SVD 分解
$U$ |  m x m 矩阵 $U^TU=I$
$\Sigma$ | m x n 矩阵 除主对角线外全是 0, 主对角线上的每个元素都称为奇异值
$V$ | n x n 矩阵 $V^TV=I$
$(A^TA)v_{i}=\lambda_{i}v_{i}$ | n x n 矩阵 $A^TA$ 的特征分解, 特征向量组成 V
$(AA^T)u_{i}=\lambda_{i}u_{i}$ | m x m 矩阵 $AA^T$ 的特征分解, 特征向量组成 U
$\Sigma$ | $A=U\Sigma V^T  \Rightarrow  AV=U\Sigma V^TV \Rightarrow  AV=U\Sigma \Rightarrow  Av_{i} = \sigma_{i}u_{i} \Rightarrow  \sigma_{i} = Av_{i}/u_{i}$



$A=U\Sigma V^T \Rightarrow A^T=V\Sigma U^T$
$\Rightarrow A^TA = V\Sigma U^T U \Sigma V^T = V\Sigma^2V^T$
$\Rightarrow AA^T= U\Sigma V^T V\Sigma U^T = U\Sigma^2 U^T$
$\Rightarrow \sigma_{i} = \sqrt{\lambda_{i}} $
