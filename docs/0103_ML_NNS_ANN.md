---
Title | ML NNS ANN
-- | --
Created @ | `2021-08-18T03:39:23Z`
Updated @| `2026-11-26T10:23:56Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/103)

---
# Approximate Nearest Neighbor 近似最近邻

- ANN - `Approximate Nearest Neighbor`
- **近似最近邻算法** - 通过牺牲精度来换取时间和空间的方式从大量样本中获取最近邻

精确最近邻在高维、大规模数据上接近线性扫描，代价太高；ANN 允许少量错误，换来数量级的加速。问题定义见 [Nearest Neighbor Search](https://github.com/junxnone/aiwiki/issues/102)。

## 评价：召回率与速度

$$
\text{Recall@}k=\frac{\lvert\,\text{ANN}_k\cap \text{Exact}_k\,\rvert}{k}
$$

其中：

- $\text{ANN}_k$：近似算法返回的前 $k$ 个近邻；$\text{Exact}_k$：精确搜索得到的真实前 $k$ 个近邻
- $\lvert\cdot\cap\cdot\rvert$：两个集合的交集大小；Recall@$k$ 越接近 1，说明近似结果越接近精确结果
- 评价 ANN 通常画「召回率 - 每秒查询数（QPS）」曲线，见 [ann-benchmarks](https://github.com/erikbern/ann-benchmarks)

## Algos

- [KDTree](https://github.com/junxnone/aiwiki/issues/122)
- LSH - `Locality Sensitive Hashing`
  - QALSH - `Query-Aware LSH`
  - SRS
- Encoding-Based Space Partitioning Methods
  - SGH - `Scalable Graph Hashing`
  - AGH - `Anchor Graph Hashing`
  - NSH - `Neighbor-Sensitive Hashing`
  - SH - `Selective Hashing`
  - OPQ - `Optimal Product Quantization`
  - NAPP - `Neighborhood APProximation index`
- Tree-Based Space Partitioning Methods
  - FLANN
  - [Annoy](https://github.com/junxnone/aiwiki/issues/333)
  - VP-Tree
- Neighborhood-Based Methods
  - SW - `Small World Graph`
  - [HNSW](https://github.com/junxnone/aiwiki/issues/334)
  - RCT - `Rank Cover Tree`
  - KGraph
  - DPG - `Diversified Proximity Graph`
  - NSG - `Navigating Spreading-out Graph`
- IVFPQ

| 类别 | 思想 | 代表 |
| --- | --- | --- |
| 哈希 | 相近的点以高概率映射到同一个桶 | LSH |
| 编码 / 量化 | 把向量压缩成短码，在码上计算距离 | OPQ、IVFPQ |
| 树 | 递归划分空间，查询时只访问少数分支 | FLANN、Annoy、VP-Tree |
| 图 | 把点连成近邻图，沿图贪心搜索 | HNSW、NSG |

表中：对比结论：召回率要求高、内存充足时图方法最常用；内存紧张时用量化压缩；需要轻量只读索引时可选 Annoy。

## Distance

- Angular
- Euclidean
- Jaccard

| 距离 | 定义 | 适用 |
| --- | --- | --- |
| Euclidean | $\lVert u-v\rVert_2$ | 一般向量 |
| Angular | 由余弦相似度导出 $\sqrt{2(1-\cos\theta)}$ | 文本、嵌入向量（只关心方向） |
| Jaccard | $1-\frac{\lvert A\cap B\rvert}{\lvert A\cup B\rvert}$ | 集合，如词集合 |

表中：$u,v$ 为向量，$\theta$ 为夹角，$A,B$ 为集合。

## Reference

- [ann-benchmarks](https://github.com/erikbern/ann-benchmarks)
- 2018 [Approximate Nearest Neighbor Search in High Dimensions](https://arxiv.org/pdf/1806.09823.pdf) [[ppt](http://people.csail.mit.edu/indyk/icm18.pdf)]

