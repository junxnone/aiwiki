---
Title | RL Robot Transform
-- | --
Created @ | `2026-11-25T16:14:36Z`
Updated @| `2026-11-25T16:14:36Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/766)

---
# Transform

用齐次变换描述刚体在不同坐标系之间的位置与姿态变换，并简要介绍 $SE(3)$ 与李代数。所属总览见 [RL Robot](https://github.com/junxnone/aiwiki/issues/458)，旋转部分见 RL Robot Rotation。

## 坐标系与位姿

位姿（pose）= 姿态 + 位置。一个刚体的位姿用「刚体固连坐标系相对参考坐标系」来表示。

```mermaid
flowchart LR
    W[世界系 W] -- T_WB --> B[基座系 B]
    B -- T_BE --> E[末端系 E]
    E -- T_EC --> C[相机系 C]
```

图中：

- 节点：坐标系，$W$ 世界、$B$ 机器人基座、$E$ 末端执行器、$C$ 相机
- 箭头及标签：$T_{AB}$ 表示坐标系 $B$ 相对 $A$ 的位姿
- 关键结论：任意两个坐标系之间的变换可由链上各段变换连乘得到，例如 $T_{WC}=T_{WB}T_{BE}T_{EC}$

## 齐次变换矩阵

$$
T=\begin{bmatrix}R & p\ 0 & 1\end{bmatrix}\in SE(3)
$$

其中：

- $R\in SO(3)$：姿态，$3\times3$ 旋转矩阵
- $p\in\mathbb{R}^3$：位置，坐标系原点在参考系中的坐标
- 最后一行 $[0\ 0\ 0\ 1]$：补全齐次形式，使旋转加平移能用一次矩阵乘法完成

对点的作用（齐次坐标 $\tilde{x}=[x,y,z,1]^\top$）：

$$
\tilde{x}'=T\tilde{x}\iff x'=Rx+p
$$

其中：

- $x$：点在原坐标系下的坐标；$x'$：变换后的坐标
- 含义：先旋转 $R$，再平移 $p$

复合与求逆：

$$
T_{AC}=T_{AB}T_{BC},\qquad T^{-1}=\begin{bmatrix}R^{\top} & -R^{\top}p\ 0 & 1\end{bmatrix}
$$

其中：

- $T_{AB}$：$B$ 系相对 $A$ 系的位姿；下标相邻项相消，便于检查连乘顺序
- $R^{\top}$：因 $R$ 正交，逆等于转置，求逆不需要通用矩阵求逆
- 变换不满足交换律：$T_{AB}T_{BC}\neq T_{BC}T_{AB}$

## 主动变换与被动变换

- **被动**：同一个点，换一个坐标系来描述，坐标值变了，点本身不动
- **主动**：在同一坐标系内，把点移动到新位置
- 数学上都是矩阵乘法，只是解读不同；推导时先明确是哪一种，是避免左乘/右乘出错的最大关键

## 李群与李代数

$SO(3)$、$SE(3)$ 是李群：连续、光滑，但乘法下封闭、不对加法封闭（两个旋转矩阵相加不是旋转矩阵），所以不能直接对它们做普通的求导和优化。李代数是群在单位元处的切空间，是一个向量空间，可以加减、求导。

| 群 | 李代数 | 向量形式 | 维数 |
| --- | --- | --- | --- |
| $SO(3)$ | $\mathfrak{so}(3)$ | 旋转向量 $\phi=\theta\hat{\omega}\in\mathbb{R}^3$ | 3 |
| $SE(3)$ | $\mathfrak{se}(3)$ | 位姿向量 $\xi=(\rho,\phi)\in\mathbb{R}^6$ | 6 |

表中：

- $\phi$：旋转向量，方向为转轴，模长为转角
- $\rho$：与平移相关的 3 维分量；$\xi$：6 维位姿向量
- 维数与自由度一致，所以李代数是位姿的最小参数化

指数映射（李代数 → 李群）：

$$
R=\exp([\phi]_\times)=I+\frac{\sin\theta}{\theta}[\phi]_\times+\frac{1-\cos\theta}{\theta^2}[\phi]_\times^2,\quad \theta=\lVert\phi\rVert
$$

其中：

- $[\phi]_\times$：由 $\phi$ 构成的反对称矩阵
- $\theta$：旋转角；该式即 Rodrigues 公式的另一种写法
- 对数映射 $\log$ 是其逆，把 $R$ 变回 $\phi$

应用：位姿优化（如 SLAM、手眼标定）在李代数上用小增量 $\exp(\delta\xi)\,T$ 更新，避免对旋转矩阵加约束。

## Reference

- [入门机器人需要的基础知识](https://zhuanlan.zhihu.com/p/655770237)

