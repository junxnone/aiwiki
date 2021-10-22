---
Title | Nearest Neighbor Search
-- | --
Create Date | `2021-08-20T02:38:42Z`
Update Date | `2021-10-22T16:49:49Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/102)

---
# Reference
- [NNS - Wikipedia](https://en.wikipedia.org/wiki/Nearest_neighbor_search)
- [A Survey on Nearest Neighbor Search Methods](https://github.com/junxnone/tech-io/files/7065577/10.1.1.673.6266.pdf)
- [Survey of Nearest Neighbor Techniques](https://arxiv.org/abs/1007.0085)
- [NNS Benchmark](https://github.com/DBAIWangGroup/nns_benchmark)
- [最近邻搜索 (Nearest Neighbor Search)](https://leovan.me/cn/2020/08/nearest-neighbor-search/)
- [最近邻检索（Nearest Neighbor Search）的简单综述](https://blog.csdn.net/lovego123/article/details/67638789)


# Brief
- NNS - `Nearest Neighbor Search`
- **问题** : `M` 空间内的点集 `S` 和点 `q`，查找 `S` 中离 `q` 最近的点
  - 1973 **post-office problem** `分配一个地址到最近的邮局`
- **精确搜索**
  - 线性搜索 - 遍历数据集
  - 空间分割 - [KDTree](/KDTree)
- 近似搜索 - [ANN](/Approximate_Nearest_Neighbor)


## 精确搜索 vs 近似搜索

Method | Description | Algos | 应用
-- | -- | --
精确搜索 | - 低维度数据  `d < 20` <br>- 穷举搜索数据距离，列出最小距离数据<br>- 数据量大时，搜索效率低 | KD-Tree/R-Tree/M-Tree | 3D点云配准
近似搜索 ANN | - 高维度 | 聚类/LSH/PQ | CBIR/翻译


## 应用
- KNN - 预测数据分类
- 文档/网页 检索
- 位置检索
- CBIR

# Trend

# History

