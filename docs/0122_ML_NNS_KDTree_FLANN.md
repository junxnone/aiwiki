---
Title | ML NNS KDTree FLANN
-- | --
Created @ | `2021-05-25T02:53:26Z`
Updated @| `2026-11-26T09:28:32Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/122)

---
# FLANN

- FLANN - Fast Library for Approximate Nearest Neighbors
- 用于在高维空间中搜索最近邻
  - **最近邻搜索问题**: `在度量空间X给定一组点P=p1,p2,…,pn,  查询点q属于X, 在P中找到距离q最近的点的问题`
- Support Languages - C++/C/MATLAB/Python/Ruby
- OpenMP support
- [Flann Install](https://github.com/junxnone/aiwiki/issues/128)
- [Flann UseCase](https://github.com/junxnone/aiwiki/issues/130)
- [Flann Source Code](Flann_Source_Code)
- [Code Analysis](https://github.com/junxnone/flann/issues/1)

最近邻搜索的形式化定义：

$$
NN(q)=\arg\min_{p\in P}\ d(q,p)
$$

其中：

- $P=\{p_1,\dots,p_n\}$：度量空间 $X$ 中的点集；$q\in X$：查询点
- $d(\cdot,\cdot)$：距离函数（如欧氏距离）；$NN(q)$：$P$ 中离 $q$ 最近的点
- 高维时精确搜索接近线性扫描，所以改为近似搜索：允许以少量精度换取很大的速度提升

## 核心算法

| 算法 | 思想 | 适合 |
| --- | --- | --- |
| 随机 kd 树森林（randomized kd-trees） | 多棵 kd 树，每棵随机选分割维度（取方差最大的几个维度之一），并行回溯搜索 | 中高维、特征如 SIFT |
| 分层 k-means 树（hierarchical k-means tree） | 递归地用 k-means 聚类，形成树 | 数据分布聚簇明显 |
| 自动配置（Autotuned） | 根据数据和需求自动选择算法和参数 | 不想手动调参 |

表中：对比结论：FLANN 的特色是自动选择算法与参数，使用者只需指定目标精度。

### 自动配置的代价函数

$$
\text{cost}=\frac{s+w_b\,b}{\min(s+w_b\,b)}+w_m\,m
$$

其中：

- $s$：搜索时间；$b$：索引构建时间；$m$：内存占用比（相对数据本身）
- $w_b$：构建时间的权重；$w_m$：内存的权重；分母 $\min(\cdot)$ 是各候选配置中该项的最小值，用于归一化
- 含义：在搜索速度、构建时间和内存之间折中，选出代价最小的算法和参数

## 使用

```cpp
#include <flann/flann.hpp>

flann::Matrix<float> dataset(data_ptr, n, dim);   // n 个 dim 维点
flann::Matrix<float> query(q_ptr, 1, dim);
flann::Matrix<int> indices(new int[k], 1, k);
flann::Matrix<float> dists(new float[k], 1, k);

flann::Index<flann::L2<float>> index(dataset, flann::KDTreeIndexParams(4));  // 4 棵 kd 树
index.buildIndex();
index.knnSearch(query, indices, dists, k, flann::SearchParams(128));        // checks=128
```

其中：

- `KDTreeIndexParams(4)`：使用 4 棵随机 kd 树；`L2<float>`：欧氏距离
- `SearchParams(128)`：`checks`，搜索时最多检查的叶子节点数，越大越准越慢
- `indices`、`dists`：返回最近 $k$ 个点的下标及距离

## 相关

- 其他近似最近邻：[Annoy](https://github.com/junxnone/aiwiki/issues/333)、[HNSW](https://github.com/junxnone/aiwiki/issues/334)；轻量的 kd 树库见 [nanoflann](https://github.com/junxnone/aiwiki/issues/123)
- OpenCV 和 PCL 的近邻搜索内部基于 FLANN

## Reference
- [Github code](https://github.com/flann-lib/flann)
- [Docs - manual.tex](https://github.com/flann-lib/flann/blob/master/doc/manual.tex) [[在线 tex 浏览器](http://texviewer.herokuapp.com/)] [[flann_docs.pdf](https://github.com/junxnone/aiwiki/files/7399990/flann_docs.pdf)]
- 2009 [Fast Approximate Nearest Neighbors with Automatic Algorithm Configuration](https://www.cs.ubc.ca/~lowe/papers/09muja.pdf)

