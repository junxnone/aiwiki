-----

| Title     | ML OML PCA                                            |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T03:39:39Z`                                |
| Updated @ | `2026-11-24T05:37:48Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/731) |

-----

# PCA 主成分分析

  - **PCA** - `Principal Component
    Analysis`：最经典的**线性降维**方法，找到一组相互正交的方向（主成分），使数据投影到这些方向后**方差最大**，保留尽可能多的信息
  - 用途：降维、去噪、去相关、可视化（降到 2D/3D）、压缩，常作为
    [K-Means](/0729_ML_OML_KMeans)、[KNN](/0724_ML_OML_KNN)、[SVM](/0115_ML_OML_SVM)
    等算法的预处理
  - 属于 [传统机器学习](/0367_ML_OML) 的无监督学习；非线性降维见 [t-SNE](/0732_ML_OML_tSNE)

## 直观

下图说明 PCA 的两种等价理解：

``` mermaid
graph LR
    D("原始数据 d 维") --> C("中心化 减去均值")
    C --> V("协方差矩阵 Σ")
    V --> E("特征分解<br/>特征值 λ 与特征向量 u")
    E --> S("取最大的 k 个特征值对应的特征向量")
    S --> P("投影到 k 维: z = Uᵀ x")
```

图中：

  - 先对每个特征减去均值（**中心化**），使数据以原点为中心

  - 计算协方差矩阵，对它做特征分解，特征向量是主成分的方向，特征值是数据在该方向上的方差

  - 保留最大的 $k$ 个特征值对应的方向，把数据投影上去，得到 $k$ 维表示

  - **最大方差视角**：投影后方差越大，数据点越分散，保留的信息越多

  - **最小重构误差视角**：用 $k$ 个主成分重构原数据，使重构误差（样本到子空间距离的平方和）最小；两个视角得到的是同一组解

## 数学推导

$$ \\Sigma = \\frac{1}{N}\\sum\_{i=1}^{N}(x\_i - \\bar{x})(x\_i -
\\bar{x})^\\top, \\qquad \\Sigma,u\_j = \\lambda\_j,u\_j $$

其中：

  - $x\_i \\in \\mathbb{R}^d$：第 $i$ 个样本；$N$：样本数；$\\bar{x}$：所有样本的均值向量

  - $\\Sigma \\in \\mathbb{R}^{d \\times
    d}$：协方差矩阵，对角线是各特征的方差，非对角线是特征间的协方差

  - $u\_j$：协方差矩阵的第 $j$ 个特征向量（单位向量），即第 $j$ 个**主成分**方向，不同的 $u\_j$
    相互正交；$\\lambda\_j$：对应的特征值，等于数据投影到 $u\_j$ 方向后的方差，按从大到小排列
    $\\lambda\_1 \\ge \\lambda\_2 \\ge \\dots \\ge \\lambda\_d \\ge 0$

  - 为什么是特征向量：投影到单位向量 $u$ 后的方差为 $u^\\top\\Sigma u$，在约束 $u^\\top u = 1$
    下最大化，用拉格朗日乘子法得到 $\\Sigma u = \\lambda u$，最大方差就是最大特征值
    $\\lambda\_1$，对应的特征向量是第一主成分；之后在与已选方向正交的条件下依次选取

降维和重构：

$$ z\_i = U\_k^\\top (x\_i - \\bar{x}), \\qquad \\hat{x}\_i = U\_k z\_i
+ \\bar{x} $$

其中：

  - $U\_k = \[u\_1, \\dots, u\_k\] \\in \\mathbb{R}^{d \\times k}$：前 $k$
    个主成分组成的投影矩阵；$z\_i \\in \\mathbb{R}^k$：降维后的低维表示
  - $\\hat{x}\_i$：用低维表示重构回原空间的结果；$x\_i - \\hat{x}\_i$ 为信息损失

## 如何选 k

$$ \\text{Explained Variance Ratio}(k) =
\\frac{\\sum\_{j=1}^{k}\\lambda\_j}{\\sum\_{j=1}^{d}\\lambda\_j} $$

其中：分子是前 $k$ 个主成分的方差之和，分母是全部方差之和；比值表示前 $k$ 个主成分**保留了多少比例的总方差**。

  - 常用做法：选最小的 $k$ 使累计解释方差比例 $\\ge 90% \\sim 99%$（scikit-learn 中
    `PCA(n_components=0.95)`）
  - 或者画**碎石图 (Scree plot)**：特征值随序号变化的曲线，选拐点
  - 降维是为了后续任务，也可以直接用下游任务的验证指标（交叉验证）选择 $k$

## 实现：SVD

  - 实际中不直接对 $\\Sigma$ 做特征分解，而是对中心化后的数据矩阵 $X$ 做 **SVD**：

$$ X = U,S,V^\\top $$

其中：$X \\in \\mathbb{R}^{N \\times d}$ 为中心化的数据矩阵；$V$ 的列是主成分方向（即 $\\Sigma$
的特征向量），奇异值 $s\_j$ 与特征值的关系为 $\\lambda\_j = s\_j^2 / N$；数值更稳定，且可使用截断/随机
SVD 在大规模数据上只算前 $k$ 个成分。

## 注意事项

  - **必须中心化**；各特征量纲不同时要先**标准化**，否则方差大的特征主导主成分
  - PCA 只考虑**线性**关系和**方差**，方差大不等于对分类有用（有监督降维可用 LDA）
  - 降维后各维度失去原来的物理含义，可解释性下降；可查看主成分的载荷（$u\_j$ 的各分量）了解每个原始特征的贡献
  - 对离群点敏感（方差被拉大），可先做鲁棒处理
  - 降维用到的均值和投影矩阵必须在**训练集上拟合**，再应用到测试集，防止数据泄漏

## 与相关方法的对比

| Name                              | 类型       | 特点                           |
| --------------------------------- | -------- | ---------------------------- |
| PCA                               | 线性，无监督   | 最大化方差，快，可逆                   |
| LDA                               | 线性，有监督   | 最大化类间距离、最小化类内距离，降到至多 $C-1$ 维 |
| Kernel PCA                        | 非线性      | 核方法映射后再做 PCA                 |
| [t-SNE](/0732_ML_OML_tSNE) / UMAP | 非线性，无监督  | 保持局部邻域结构，用于可视化，不可用于一般的特征降维   |
| Autoencoder                       | 非线性，神经网络 | 线性激活的自编码器等价于 PCA             |

表中对比了常用的降维方法：需要**可逆、可解释、速度快**用 PCA；只为了二维可视化簇结构用
t-SNE/UMAP；有标签并希望分类更容易分开用 LDA。

## UseCase

  - 数据可视化：把高维特征降到 2D/3D 观察结构
  - 去噪：丢弃方差很小的成分（通常是噪声）再重构
  - 加速与防止维度灾难：先降维再做 KNN、聚类、SVM
  - 人脸识别 Eigenfaces：把人脸图像做 PCA，主成分就是「特征脸」

## Code

``` python
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline

pca = make_pipeline(StandardScaler(), PCA(n_components=0.95, svd_solver='full')).fit(X_train)
Z_train = pca.transform(X_train)
Z_test = pca.transform(X_test)                                  # 用训练集的均值和投影矩阵
p = pca.named_steps['pca']
print(p.n_components_, p.explained_variance_ratio_.cumsum())    # 保留的成分数和累计解释方差
```

## Reference

  - [scikit-learn - Decomposing signals in components
    (PCA)](https://scikit-learn.org/stable/modules/decomposition.html#pca)
  - [A Tutorial on Principal Component
    Analysis](https://arxiv.org/abs/1404.1100)
