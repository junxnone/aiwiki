-----

| Title     | ML Metrics Pairwise                                   |
| --------- | ----------------------------------------------------- |
| Created @ | `2021-11-21T16:27:48Z`                                |
| Updated @ | `2026-11-24T02:49:41Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/139) |

-----

# Pairwise Metrics 成对相似度与距离

  - Pairwise Metrics 衡量**两个样本（向量）之间**的相似度或距离，而不是模型预测的好坏
  - 应用：Retrieval / Face Recognition / Metric Learning
    的特征比对，聚类（KMeans/DBSCAN），KNN，SVM 核函数，异常检测中的特征距离
  - 两类概念要区分：
      - **距离 (Distance)**：值越小越相似，如 Euclidean、Manhattan
      - **相似度 / 核函数 (Similarity / Kernel)**：值越大越相似，如 Cosine
        similarity、RBF kernel

下图说明了两类度量的关系和选择：

``` mermaid
graph LR
    P(Pairwise Metrics) --> D(距离 Distance)
    P --> S(相似度 Similarity)
    P --> K(核函数 Kernel)
    D --> D1(Euclidean / Manhattan / Chebyshev / Minkowski)
    D --> D2(Mahalanobis / Hamming)
    S --> S1(Cosine similarity / Jaccard)
    K --> K1(Linear / Polynomial / Sigmoid)
    K --> K2(RBF / Laplacian / Chi-squared)
```

图中：

  - 距离类度量值越小越相似；相似度和核函数值越大越相似
  - 核函数可以看作在高维特征空间中的内积，是 SVM、核 PCA、高斯过程的基础
  - 在 Retrieval 中，特征 L2 归一化后 Cosine similarity 与 Euclidean 距离单调等价

## Kernel & Similarity

| Pairwise Metrics   | Formula                                                                                              | Description                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Cosine similarity  | $k(x, y) = \\frac{x y^\\top}{|x| |y|}$                                                               | 向量夹角的余弦，只看方向不看长度，取值 $\[-1, 1\]$，人脸识别/文本检索最常用 |
| Linear kernel      | $k(x, y) = x^\\top y$                                                                                | 向量内积，特征已 L2 归一化时等于 Cosine similarity         |
| Polynomial kernel  | $k(x, y) = (\\gamma x^\\top y +c\_0)^d$                                                              | 在内积基础上做 $d$ 次多项式，能表达特征间的交互项                  |
| Sigmoid kernel     | $k(x, y) = \\tanh(\\gamma x^\\top y +c\_0)$                                                          | 形式类似两层神经网络，不一定半正定                            |
| RBF kernel         | $k(x, y) = \\exp( -\\gamma | x-y |^2)$                                                               | 高斯核，随欧氏距离指数衰减，取值 $(0, 1\]$                   |
| Laplacian kernel   | $k(x, y) = \\exp( -\\gamma | x-y |\_1)$                                                              | 把 RBF 中的 L2 距离换成 L1 距离，对异常值更稳健               |
| Chi-squared kernel | $k(x, y) = \\exp \\left (-\\gamma \\sum\_i \\frac{(x\[i\] - y\[i\]) ^ 2}{x\[i\] + y\[i\]} \\right )$ | 用于直方图特征（如 BoW、颜色直方图），要求特征非负                  |

其中：

  - $x, y$：两个待比较的特征向量，维度相同；$x^\\top y$ 为内积，$|x|$ 为 L2 范数，$|x-y|\_1$ 为 L1
    距离，$x\[i\]$ 为第 $i$ 维分量
  - $\\gamma$：正的尺度参数，$\\gamma$ 越大，核函数随距离衰减越快（相似的范围越小）
  - $c\_0$：偏置常数；$d$：多项式的次数

## Distance

| Pairwise Metrics | Formula                                                                     | Description                                                                  |
| ---------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Euclidean (L2)   | $d(x, y) = \\sqrt{\\sum\_i (x\[i\] - y\[i\])^2}$                            | 直线距离，最常用，对尺度敏感，需先做特征归一化                                                      |
| Manhattan (L1)   | $d(x, y) = \\sum\_i \\lvert x\[i\] - y\[i\] \\rvert$                        | 各维绝对差之和，高维稀疏时比 L2 更稳健                                                        |
| Chebyshev (L∞)   | $d(x, y) = \\max\_i \\lvert x\[i\] - y\[i\] \\rvert$                        | 各维差的最大值                                                                      |
| Minkowski        | $d(x, y) = \\left(\\sum\_i \\lvert x\[i\] - y\[i\] \\rvert^p\\right)^{1/p}$ | $p=1$ 为 Manhattan，$p=2$ 为 Euclidean                                          |
| Mahalanobis      | $d(x, y) = \\sqrt{(x-y)^\\top \\Sigma^{-1} (x-y)}$                          | 考虑特征间相关性和各维方差，异常检测中常用                                                        |
| Hamming          | $d(x, y) = \\frac{1}{n}\\sum\_i 1(x\[i\] \\neq y\[i\])$                     | 不同取值位置的占比，用于二值哈希/类别特征                                                        |
| Jaccard          | $J(A, B) = \\frac{\\lvert A \\cap B \\rvert}{\\lvert A \\cup B \\rvert}$    | 集合交并比，$1 - J$ 为 Jaccard 距离；与检测中的 [IoU](/0383_ML_Metrics_Detection_IoU) 是同一公式 |

其中：

  - $p$：Minkowski 距离的阶数，$p \\to \\infty$ 即 Chebyshev 距离
  - $\\Sigma$：数据的协方差矩阵，$\\Sigma^{-1}$ 为其逆；$\\Sigma = I$ 时 Mahalanobis
    退化为 Euclidean
  - $n$：向量维度；$1(\\cdot)$：指示函数；$A, B$：两个集合，$\\lvert\\cdot\\rvert$ 为集合元素个数

## 选择建议

  - 特征是深度网络 embedding：优先 Cosine similarity（或归一化后用 Euclidean），训练 loss
    用什么度量，检索时就应保持一致
  - 特征量纲不一致：先标准化再用 Euclidean，或用 Mahalanobis
  - 特征是直方图/非负分布：Chi-squared 或 Hellinger 核
  - 二值哈希码：Hamming
  - 作为 SVM 核函数：先试 RBF，数据线性可分时用 Linear

## Code

``` python
from sklearn.metrics.pairwise import cosine_similarity, rbf_kernel, euclidean_distances, pairwise_distances

S = cosine_similarity(X, Y)               # (n_x, n_y) 相似度矩阵
D = pairwise_distances(X, Y, metric='cityblock')   # Manhattan
K = rbf_kernel(X, Y, gamma=0.5)
```

## Reference

  - [Pairwise metrics -
    scikit-learn](https://scikit-learn.org/stable/modules/metrics.html#pairwise-metrics-affinities-and-kernels)
  - [sklearn.metrics.pairwise\_distances](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.pairwise_distances.html)
