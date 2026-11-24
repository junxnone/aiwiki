-----

| Title     | ML OML tSNE                                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T03:39:40Z`                                |
| Updated @ | `2026-11-24T05:37:50Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/732) |

-----

# t-SNE 非线性降维

  - **t-SNE** - `t-distributed Stochastic Neighbor Embedding`：把高维数据映射到
    2D/3D，使**高维空间里相近的点在低维空间里也相近**，主要用于**可视化**
  - 非线性降维，擅长展示数据的簇结构，常用来看 embedding / 特征的分布（如检查分类网络的特征是否可分）
  - 属于 [传统机器学习](/0367_ML_OML) 的无监督学习；线性降维见 [PCA](/0731_ML_OML_PCA)

## 原理

下图是 t-SNE 的思路：

``` mermaid
graph LR
    H("高维数据 X") --> P("用高斯分布计算<br/>点对相似度 P")
    L("低维初始点 Y<br/>随机或 PCA 初始化") --> Q("用 t 分布计算<br/>点对相似度 Q")
    P --> K("最小化 KL 散度 P 与 Q")
    Q --> K
    K --> G("梯度下降更新 Y")
    G --> Q
```

图中：

  - 在高维空间，用高斯分布把「点 $j$ 是点 $i$ 的邻居的概率」定义成相似度 $P$
  - 在低维空间随机放置初始点 $Y$，用**重尾的 t 分布**定义相似度 $Q$
  - 通过梯度下降调整低维点的位置，使 $Q$ 尽可能接近 $P$（最小化 KL 散度），收敛后的 $Y$ 就是可视化结果

高维相似度：

$$ p\_{j \\mid i} = \\frac{\\exp\\big(-\\lVert x\_i - x\_j \\rVert^2 /
2\\sigma\_i^2\\big)}{\\sum\_{k \\ne i}\\exp\\big(-\\lVert x\_i - x\_k
\\rVert^2 / 2\\sigma\_i^2\\big)}, \\qquad p\_{ij} = \\frac{p\_{j \\mid
i} + p\_{i \\mid j}}{2N} $$

其中：

  - $x\_i, x\_j$：高维空间中的两个点；$N$：样本数；$p\_{j \\mid i}$：以点 $i$ 为中心的高斯分布下，选中点
    $j$ 作为邻居的条件概率
  - $\\sigma\_i$：以点 $i$ 为中心的高斯带宽，对每个点分别用二分搜索确定，使该点的分布**困惑度
    (Perplexity)** 等于设定值：密集区域 $\\sigma\_i$ 小，稀疏区域 $\\sigma\_i$ 大
  - $p\_{ij}$：对称化之后的联合概率，保证每个点至少有一定的影响力

低维相似度（Student t 分布，自由度 1）：

$$ q\_{ij} = \\frac{\\big(1 + \\lVert y\_i - y\_j
\\rVert^2\\big)^{-1}}{\\sum\_{k \\ne l}\\big(1 + \\lVert y\_k - y\_l
\\rVert^2\\big)^{-1}} $$

其中：$y\_i, y\_j$：低维空间中对应的点（要优化的变量）；分母对所有点对归一化。t
分布比高斯分布**尾部更重**：中等距离的点在低维里可以被推得更远，从而缓解「拥挤问题」（高维中的许多近邻点无法在低维中保持距离），使簇之间分得更开。

目标函数：

$$ C = KL(P ,\\Vert, Q) = \\sum\_{i}\\sum\_{j \\ne
i}p\_{ij}\\ln\\frac{p\_{ij}}{q\_{ij}} $$

其中：$KL(P \\Vert Q)$ 衡量两个分布的差异，**不对称**：高维里相近（$p\_{ij}$
大）而低维里分得远（$q\_{ij}$ 小）的惩罚很大，反之惩罚较小，所以 t-SNE
重点保**局部结构**，不保证全局距离。

## 关键参数

| Parameter             | 含义                 | 建议                              |
| --------------------- | ------------------ | ------------------------------- |
| `perplexity`          | 困惑度，可理解为每个点「有效邻居数」 | 5\~50，常用 30；数据量大时取大一些；必须小于样本数   |
| `learning_rate`       | 学习率                | `auto` 或 10\~1000；太小聚成一团，太大点散成球 |
| `n_iter` / `max_iter` | 迭代次数               | 至少 1000，直到 KL 不再下降              |
| `init`                | 初始化                | 推荐 `pca`，比随机初始化更稳定，且保留更多全局结构    |
| `early_exaggeration`  | 早期放大 $P$ 的倍数       | 默认 12，使簇在早期更紧凑                  |

表中参数对结果影响很大，尤其是 `perplexity`：值太小会把本不是簇的数据看成很多小簇，值太大则簇之间混在一起。

## 如何正确解读

  - **簇内的形状、簇的大小、簇之间的距离都没有意义**：t-SNE 会拉伸或压缩密度不同的簇，大小不能用来比较密度
  - **簇之间的距离不可信**：看到两个簇离得近或远，不能说原空间中也是这样
  - 同一份数据换随机种子/困惑度，图可能不同；应该多试几个 `perplexity` 并观察结论是否稳定
  - 随机噪声也可能被画成「簇」
  - 不适合用于**聚类前的预处理**或普通的特征降维：它没有显式的映射函数，**不能直接用于新样本**（scikit-learn 的
    `TSNE` 没有 `transform`），并且不保证全局结构

## 与 PCA、UMAP 对比

| Name | PCA            | t-SNE                                 | UMAP            |
| ---- | -------------- | ------------------------------------- | --------------- |
| 类型   | 线性             | 非线性                                   | 非线性             |
| 保持   | 全局方差           | 局部邻域                                  | 局部邻域，同时较好保持全局结构 |
| 速度   | 很快             | 慢，$O(N^2)$ 或 Barnes-Hut $O(N\\log N)$ | 比 t-SNE 快得多     |
| 新样本  | 可以 `transform` | 不行                                    | 可以 `transform`  |
| 用途   | 降维、去噪、预处理      | 可视化                                   | 可视化 + 一般降维      |

表中说明了三者的取舍：大数据先用 PCA 降到 30\~50 维，再用 t-SNE 可视化，既加速又去噪，是常用组合；追求速度和全局结构时用
UMAP。

## Code

``` python
from sklearn.manifold import TSNE
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt

Xp = PCA(n_components=50).fit_transform(X)          # 先用 PCA 降到 50 维, 加速并去噪
Y = TSNE(n_components=2, perplexity=30, init='pca', learning_rate='auto', random_state=0).fit_transform(Xp)
plt.scatter(Y[:, 0], Y[:, 1], c=labels, s=5, cmap='tab10')      # 用类别着色检查簇结构
```

## Reference

  - [Visualizing Data using
    t-SNE](https://www.jmlr.org/papers/volume9/vandermaaten08a/vandermaaten08a.pdf)
  - [How to Use t-SNE Effectively -
    Distill](https://distill.pub/2016/misread-tsne/)
  - [scikit-learn -
    t-SNE](https://scikit-learn.org/stable/modules/manifold.html#t-sne)
