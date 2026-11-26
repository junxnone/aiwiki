-----

| Title     | ML NNS                                                |
| --------- | ----------------------------------------------------- |
| Created @ | `2021-08-20T02:38:42Z`                                |
| Updated @ | `2026-11-26T10:24:09Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/102) |

-----

# Nearest Neighbor Search 最近邻搜索

  - NNS - `Nearest Neighbor Search`
  - **问题** : `M` 空间内的点集 `S` 和点 `q`，查找 `S` 中离 `q` 最近的点
      - 1973 **post-office problem** `分配一个地址到最近的邮局`
  - **精确搜索**
      - 线性搜索 - 遍历数据集
      - 空间分割 - [KDTree](https://github.com/junxnone/aiwiki/issues/122)
  - 近似搜索 - [ANN](https://github.com/junxnone/aiwiki/issues/103)

形式化：

$$ NN(q)=\\arg\\min\_{p\\in S}\\ d(q,p),\\qquad kNN(q)=\\text{距离
}q\\text{ 最近的 }k\\text{ 个 }p\\in S $$

其中：

  - $S$：度量空间 $M$ 中的点集；$q$：查询点；$d(\\cdot,\\cdot)$：距离函数（欧氏距离、余弦距离等）
  - $NN(q)$：最近邻；$kNN(q)$：$k$ 个最近邻
  - 暴力线性搜索对 $n$ 个点、$d$ 维的复杂度为 $O(nd)$

## 精确搜索 vs 近似搜索

| Method   | Description                                                | Algos                 | 应用      |
| -------- | ---------------------------------------------------------- | --------------------- | ------- |
| 精确搜索     | \- 低维度数据 `d < 20` <br>- 穷举搜索数据距离，列出最小距离数据<br>- 数据量大时，搜索效率低 | KD-Tree/R-Tree/M-Tree | 3D点云配准  |
| 近似搜索 ANN | \- 高维度                                                     | 聚类/LSH/PQ             | CBIR/翻译 |

表中：

  - **Description**：适用的维度和特点；**Algos**：常用算法；**应用**：典型场景
  - 对比结论：低维（如 3D 点云）用 KD-Tree 等精确方法；高维（如图像特征）用近似方法，见
    [nanoflann](https://github.com/junxnone/aiwiki/issues/123)、[HNSW](https://github.com/junxnone/aiwiki/issues/334)

## 应用

  - KNN - 预测数据分类
  - 文档/网页 检索
  - 位置检索
  - CBIR

KNN 分类：对一个查询点，找到 $k$ 个最近邻，用多数投票得到类别：

$$ \\hat{y}(q)=\\arg\\max\_{c}\\sum\_{p\\in
kNN(q)}\\mathbb{1}\\big\[y\_p=c\\big\] $$

其中：$y\_p$ 为近邻 $p$ 的类别；$\\mathbb{1}\[\\cdot\]$ 为指示函数（条件成立为 1，否则为
0）；$\\hat{y}(q)$ 为预测的类别。

## Reference

  - [NNS -
    Wikipedia](https://en.wikipedia.org/wiki/Nearest_neighbor_search)
  - [A Survey on Nearest Neighbor Search
    Methods](https://github.com/junxnone/tech-io/files/7065577/10.1.1.673.6266.pdf)
  - [Survey of Nearest Neighbor
    Techniques](https://arxiv.org/abs/1007.0085)
  - [NNS Benchmark](https://github.com/DBAIWangGroup/nns_benchmark)
  - [最近邻搜索 (Nearest Neighbor
    Search)](https://leovan.me/cn/2020/08/nearest-neighbor-search/)
  - [最近邻检索（Nearest Neighbor
    Search）的简单综述](https://blog.csdn.net/lovego123/article/details/67638789)
