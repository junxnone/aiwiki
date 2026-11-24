-----

| Title     | ML OML DBSCAN                                         |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T03:39:37Z`                                |
| Updated @ | `2026-11-24T05:37:46Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/730) |

-----

# DBSCAN 密度聚类

  - **DBSCAN** - `Density-Based Spatial Clustering of Applications with
    Noise`：基于**密度**的聚类，把「由密集区域连成的一片」作为一个簇，稀疏区域的点视为噪声
  - 不需要指定簇的个数，能发现**任意形状**的簇，并且自带**噪声/异常点**识别
  - 属于 [传统机器学习](/0367_ML_OML) 的无监督学习；对比基于中心的
    [K-Means](/0729_ML_OML_KMeans)

## 核心概念

DBSCAN 有两个参数：邻域半径 $\\varepsilon$ 和最少点数 `minPts`。

$$ N\_\\varepsilon(p) = {, q \\in D \\mid \\operatorname{dist}(p, q)
\\le \\varepsilon ,} $$

其中：

  - $D$：数据集；$p,
    q$：数据点；$\\operatorname{dist}(\\cdot,\\cdot)$：距离度量（默认欧氏距离）
  - $\\varepsilon$：邻域半径；$N\_\\varepsilon(p)$：点 $p$ 的
    $\\varepsilon$-邻域，即与 $p$ 距离不超过 $\\varepsilon$ 的所有点（含 $p$
    自身）
  - `minPts`：成为密集区域所需的最少点数

| Type         | 定义                                                           |
| ------------ | ------------------------------------------------------------ |
| 核心点 (Core)   | $\\lvert N\_\\varepsilon(p) \\rvert \\ge$ `minPts`，处在密集区域的内部 |
| 边界点 (Border) | 自己不是核心点，但落在某个核心点的 $\\varepsilon$-邻域内                         |
| 噪声点 (Noise)  | 既不是核心点也不是边界点，标记为 $-1$                                        |

表中三类点是 DBSCAN 的基础。另有两个关系：

  - **直接密度可达**：$q$ 在核心点 $p$ 的 $\\varepsilon$-邻域内
  - **密度可达**：存在一条核心点链 $p\_1 \\to p\_2 \\to \\dots \\to
    q$，每一步都是直接密度可达；同一个簇内的点由密度可达关系连接

## 算法

下图是 DBSCAN 的流程：

``` mermaid
graph TD
    A("任取一个未访问的点 p") --> B{"p 的 ε 邻域内<br/>点数 ≥ minPts?"}
    B -->|"否"| C("暂时标记为噪声")
    B -->|"是"| D("新建一个簇<br/>p 为核心点")
    D --> E("把邻域内的点加入队列")
    E --> F("依次扩展:<br/>遇到核心点则合并其邻域")
    F --> G("队列为空 该簇完成")
    C --> H{"还有未访问的点?"}
    G --> H
    H -->|"是"| A
    H -->|"否"| I("输出簇和噪声")
```

图中：

  - 从一个点出发，看它的邻域是否足够密：不够密先标记为噪声（之后若被别的簇的核心点覆盖，会被改为边界点）
  - 足够密则以它为种子建立新簇，把邻域内的点放进队列，逐个扩展；扩展到的点如果也是核心点，就把它的邻域继续并入队列，直到簇不能再扩大
  - 没有簇数这个参数：簇的个数由数据的密度结构自然决定

## 参数选择

  - **minPts**：经验值 $\\ge d + 1$（$d$ 为特征维度），常取
    $2d$；数据噪声大、数据量大时取更大值；二维数据常用
    4\~5
  - **$\\varepsilon$**：用 **K 距离图**选取——计算每个点到第 `minPts`-1
    近邻的距离，从大到小排序画图，选曲线「拐点」处的距离；$\\varepsilon$
    太小则大部分点成为噪声，太大则不同簇被合并
  - 特征需要标准化，使用的距离度量要与数据匹配

## 与 K-Means 对比

| Name    | K-Means     | DBSCAN                            |
| ------- | ----------- | --------------------------------- |
| 簇数      | 需要指定 $K$    | 不需要，由密度自动确定                       |
| 簇形状     | 凸的球形        | 任意形状                              |
| 噪声处理    | 没有，所有点都被分到簇 | 自动识别噪声点                           |
| 参数      | $K$         | $\\varepsilon$、`minPts`           |
| 密度差异大的簇 | 可处理（以中心划分）  | 效果差，单一 $\\varepsilon$ 无法兼顾        |
| 复杂度     | $O(NKt)$    | $O(N\\log N)$（使用空间索引），最坏 $O(N^2)$ |
| 结果稳定性   | 依赖初始化       | 对遍历顺序基本稳定（边界点归属可能不同）              |

表中对比了两个算法的主要差别：数据中有噪声、簇形状不规则时用 DBSCAN；簇大致是球形、要求每个点都有簇、规模很大时用 K-Means。

## 局限与改进

  - 簇之间密度差异较大时，一个 $\\varepsilon$ 无法同时适合所有簇：**OPTICS**
    输出可达距离图，**HDBSCAN** 对不同 $\\varepsilon$
    层次化聚类并稳定选择簇，对参数更不敏感
  - 高维数据中距离失效（维度灾难），需要先降维（见 [PCA](/0731_ML_OML_PCA)）
  - 对大规模数据需要空间索引（KD-Tree、Ball Tree）加速邻域查询

## UseCase

  - 空间数据聚类（地理位置、GPS 轨迹热点）
  - 异常点检测：噪声点就是异常，与 [Isolation Forest](/0733_ML_OML_IsolationForest)
    是互补的方案
  - 图像中的点云分割（如激光雷达地面分割后对障碍物聚类）

## Code

``` python
from sklearn.cluster import DBSCAN
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler
import numpy as np

Xs = StandardScaler().fit_transform(X)
min_pts = 5

# K 距离图: 每个点到第 min_pts 近邻的距离 (含自身), 画图找拐点定 eps
dist, _ = NearestNeighbors(n_neighbors=min_pts).fit(Xs).kneighbors(Xs)
kdist = np.sort(dist[:, -1])[::-1]

labels = DBSCAN(eps=0.5, min_samples=min_pts).fit_predict(Xs)       # 标签 -1 表示噪声
print(len(set(labels)) - (1 if -1 in labels else 0), (labels == -1).sum())   # 簇数, 噪声点数
```

## Reference

  - [A Density-Based Algorithm for Discovering Clusters in Large Spatial
    Databases with
    Noise](https://www.aaai.org/Papers/KDD/1996/KDD96-037.pdf)
  - [scikit-learn -
    DBSCAN](https://scikit-learn.org/stable/modules/clustering.html#dbscan)
  - [HDBSCAN](https://hdbscan.readthedocs.io/)
