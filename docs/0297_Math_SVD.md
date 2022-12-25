---
Title | Math SVD
-- | --
Created @ | `2018-09-03T22:49:40Z`
Last Modify @| `2022-12-25T03:32:23Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/297)

---
## Reference
- [奇异值分解（SVD）](https://zhuanlan.zhihu.com/p/29846048)
- [线性代数之——SVD 分解](https://zhuanlan.zhihu.com/p/93474729)
- [Least-Squares Rigid Motion Using SVD.pdf](https://github.com/junxnone/aiwiki/files/8299458/svd_rot.pdf)
- [Singular Value Decomposition (SVD) tutorial](http://web.mit.edu/be.400/www/SVD/Singular_Value_Decomposition.htm)
- [通过奇异值分解（SVD）求解透视变换单应性矩阵](https://blog.csdn.net/sinat_28309919/article/details/80134985)
- [点云配准之SVD解法的由来](https://zhuanlan.zhihu.com/p/265530941)
- [基于SVD求解 3D-3D 点对匹配](https://zhuanlan.zhihu.com/p/111322916)



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


### UV 推导

- $A=U\Sigma V^T \Rightarrow A^T=V\Sigma U^T$  
- $\Rightarrow A^TA = V\Sigma U^T U \Sigma V^T = V\Sigma^2V^T$  : 特征向量为 V 矩阵
- $\Rightarrow AA^T= U\Sigma V^T V\Sigma U^T = U\Sigma^2 U^T$  : 特征向量为 U 矩阵  
- $\Rightarrow \sigma_{i} = \sqrt{\lambda_{i}} $  : 特征值和奇异值关系

## Examples

### 特征值和特征向量计算

Steps | Calc
-- | --
A 的定义，计算 $A^T$ |  $A = \begin{bmatrix}  0 & 1 \\  1 & 1 \\  1 & 0 \\ \end{bmatrix}$    $A^T = \begin{bmatrix} 0 & 1 & 1 \\ 1 & 1 & 0 \\ \end{bmatrix}$
计算 $A^TA$ 与 $AA^T$ | $A^TA=\begin{bmatrix} 2 & 1 \\ 1 & 2 \\ \end{bmatrix} $  $AA^T= \begin{bmatrix} 1 & 1 & 0 \\ 1 & 2 & 1 \\ 0 & 1 & 1 \\ \end{bmatrix}$
计算特征值$A^TA$ $\lambda$ | $(A-\lambda I)x=0 \Rightarrow \begin{vmatrix} 2-\lambda & 1 \\ 1 & 2-\lambda \\ \end{vmatrix} = 0 \Rightarrow (2-\lambda)^2 - 1=0 \Rightarrow \lambda_{1}=3, \lambda_{2}=1$ 
计算$A^TA$ 特征向量 |$\lambda_{1}=3$, $\begin{bmatrix}  2 & 1 \\  1 & 2 \\ \end{bmatrix}x=3x$ $\Rightarrow \begin{bmatrix}  2 & 1 \\  1 & 2 \end{bmatrix}\begin{bmatrix} a_{1} \\ a_{2} \end{bmatrix}=\begin{bmatrix} 3a_{1} \\ 3a_{2} \end{bmatrix}$  <br>$\Rightarrow 2a_{1} + a_{2} = 3a_{1}, a_{1} + 2a_{2} = 3a_{2}$ <br>$\Rightarrow a_{1} - a_{2}=0$  <br> $\Rightarrow v_{2} = \begin{bmatrix} \frac{1}{\sqrt{2}} \\ \frac{1}{\sqrt{2}} \end{bmatrix}$
↑ | $\lambda_{2}=1$, $\begin{bmatrix}  2 & 1 \\  1 & 2 \\ \end{bmatrix}x=1x$ $\Rightarrow \begin{bmatrix}  2 & 1 \\  1 & 2 \end{bmatrix}\begin{bmatrix} a_{1} \\ a_{2} \end{bmatrix}=\begin{bmatrix} a_{1} \\ a_{2} \end{bmatrix}$  <br>$\Rightarrow 2a_{1} + a_{2} = a_{1}, a_{1} + 2a_{2} = a_{2}$ <br>$\Rightarrow a_{1} + a_{2}=0$  <br> $\Rightarrow v_{1} = \begin{bmatrix} -\frac{1}{\sqrt{2}} \\ \frac{1}{\sqrt{2}} \end{bmatrix}$ 

> 特征向量标准化
> $w^Tw=1 $    
> $\Rightarrow \begin{bmatrix} a_{1} & a_{2} \\ \end{bmatrix} \begin{bmatrix} a_{1} \\ a_{2} \end{bmatrix} = 1$    
>  $\Rightarrow a_{1}^2 + a_{2}^2 = 1$    

### 求解点云旋转矩阵
- 点云 $P \left\{ p_i\right\}$ 与 点云 $Q \left\{ q_i\right\}$
- 1 计算两个点云质心 $p = \frac{1}{n}\sum_{i=1}^{n}p_i$  $q = \frac{1}{n}\sum_{i=1}^{n}q_i$
- 2 计算各点相对于质心的位移向量 $v_i^q =q_i -q$  $v_i^p =p_i -p$
- 3 利用质心位移向量，计算H矩阵 $H=\sum_{i=1}^{n}$
- 4 对H矩阵进行SVD分解 $H=UAV^T$
- 5 基于矩阵 U 和 V ，计算旋转矩阵 $R=UV$
- 6 验证结果: $det(R)=1$ 则 R 有效, $det(R)=-1$ 则 算法失效 ？？
- 7 计算点云间的位移 $T=q-Rp$

