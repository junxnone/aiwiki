---
Title | ML Metrics Clustering
-- | --
Created @ | `2026-11-24T01:04:05Z`
Updated @| `2026-11-24T01:04:05Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/719)

---
# Clustering

- 聚类是无监督任务，评估分两种情况：
  - **外部指标 (External)**：有真值标签（如拿分类数据集检验聚类效果），把聚类结果与标签比较
  - **内部指标 (Internal)**：没有标签，只根据数据本身衡量「簇内紧、簇间远」
- 聚类编号没有含义（簇 0/1 与类别 0/1 不对应），因此外部指标都是**对标签置换不变**的
- 总览见 [Metrics](/0138_ML_Metrics)，样本间距离的选择见 [Pairwise](/0139_ML_Metrics_Pairwise)

## External Metrics

Name | Description | 取值
-- | -- | --
ARI | 调整兰德指数，对随机聚类校正后的成对一致性 | $[-1, 1]$，1 完全一致，0 随机
NMI | 归一化互信息，聚类与标签共享的信息量 | $[0, 1]$，1 完全一致
Homogeneity | 每个簇只包含一个类别的程度（类似 Precision） | $[0, 1]$
Completeness | 同一类别全部分到同一簇的程度（类似 Recall） | $[0, 1]$
V-measure | Homogeneity 和 Completeness 的调和平均，等于 NMI（算术平均） | $[0, 1]$
Purity | 每个簇中占多数的类别的样本数之和占总数的比例 | $(0, 1]$，簇数多时会虚高
FMI | Fowlkes-Mallows 指数，成对 Precision 和 Recall 的几何平均 | $[0, 1]$

表中所有指标越大越好。Purity 在簇数很多（极端情况每个样本一个簇）时趋于 1，不适合比较不同簇数；ARI、NMI 更常用。

### ARI

$$
ARI = \frac{RI - \mathbb{E}[RI]}{\max(RI) - \mathbb{E}[RI]}, \qquad RI = \frac{a + b}{\binom{n}{2}}
$$

其中：

- $n$：样本数；$\binom{n}{2}$：所有样本对的数量
- $a$：在真值中属于同一类、在聚类中也属于同一簇的样本对数；$b$：在真值中属于不同类、在聚类中也属于不同簇的样本对数；$RI$ 即 Rand Index，一致的样本对比例
- $\mathbb{E}[RI]$：随机聚类下 RI 的期望，减去它后随机结果的 ARI 约为 0，因此可以比较不同簇数

### NMI

$$
NMI(U, V) = \frac{2\, I(U; V)}{H(U) + H(V)}
$$

其中：

- $U$：真值标签，$V$：聚类结果；$H(\cdot)$：熵，衡量分布的不确定性
- $I(U; V)$：互信息，表示知道聚类结果后能减少多少关于真值标签的不确定性
- 分母用两者熵的算术平均归一化，使取值落在 $[0, 1]$（sklearn 默认）；不同论文使用的归一化方式可能不同（几何平均、min、max）

## Internal Metrics

Name | Formula | Description
-- | -- | --
Silhouette | $s = \frac{b - a}{\max(a, b)}$ | 轮廓系数，每个样本的簇内凝聚与簇间分离，取值 $[-1, 1]$，越大越好
Davies-Bouldin | $\frac{1}{k}\sum_{i}\max_{j \ne i}\frac{s_i + s_j}{d_{ij}}$ | 簇内散度与簇间距离之比的平均，越小越好
Calinski-Harabasz | $\frac{\text{tr}(B_k)/(k-1)}{\text{tr}(W_k)/(n-k)}$ | 簇间离散度与簇内离散度之比，越大越好

其中：

- Silhouette 中 $a$：样本到**同簇**其他样本的平均距离；$b$：样本到**最近的其他簇**所有样本的平均距离；整体取所有样本的平均
- $s \to 1$ 说明样本离自己的簇近、离其他簇远；$s \approx 0$ 说明在簇边界；$s < 0$ 说明可能被分错了簇
- Davies-Bouldin 中 $k$：簇数，$s_i$：第 $i$ 簇内样本到簇中心的平均距离，$d_{ij}$：两个簇中心的距离
- Calinski-Harabasz 中 $B_k$、$W_k$：簇间和簇内的离散矩阵，$n$：样本数，$k$：簇数

## 注意

- 内部指标偏好**凸的球形簇**（K-Means 类），对 DBSCAN 这类任意形状的簇会给出偏低的分数，不能直接比较不同算法
- 内部指标常用于**选择簇数 $k$**：画出 $k$ 与指标的曲线，选取最大（Silhouette）或拐点（肘部法）
- DBSCAN 等算法有噪声点（标签 -1），计算外部指标时要明确噪声点是单独一类还是排除
- 特征需要先标准化，距离度量要与数据匹配（余弦、欧氏）
- 深度特征聚类（如无监督表征评估）常用 ACC（用匈牙利算法匹配簇与类别后的准确率）、NMI、ARI 三项一起报告

## Code
```python
from sklearn.metrics import (adjusted_rand_score, normalized_mutual_info_score, homogeneity_completeness_v_measure,
                             silhouette_score, davies_bouldin_score, calinski_harabasz_score)
import numpy as np
from scipy.optimize import linear_sum_assignment

ari = adjusted_rand_score(y_true, y_pred)
nmi = normalized_mutual_info_score(y_true, y_pred)
sil = silhouette_score(X, y_pred)                 # 内部指标, 不需要 y_true

def cluster_acc(y_true, y_pred):
    # 匈牙利算法匹配簇与类别后的准确率
    k = max(y_pred.max(), y_true.max()) + 1
    w = np.zeros((k, k), dtype=int)
    for t, p in zip(y_true, y_pred):
        w[p, t] += 1
    r, c = linear_sum_assignment(-w)
    return w[r, c].sum() / len(y_true)
```

## Reference
- [Clustering performance evaluation - scikit-learn](https://scikit-learn.org/stable/modules/clustering.html#clustering-performance-evaluation)
- [Comparing partitions](https://link.springer.com/article/10.1007/BF01908075) - ARI

