---
Title | ML NNS KDTree nanoflann
-- | --
Created @ | `2021-08-05T16:16:46Z`
Updated @| `2026-11-26T10:24:04Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/123)

---
# nanoflann

nanoflann 是 FLANN 中 kd 树部分的精简重写：C++11 的**纯头文件**库，专门为低维点集（如点云）做快速的最近邻和半径搜索。与 [FLANN](https://github.com/junxnone/aiwiki/issues/122) 的关系见下表。

- 基于 FLANN
- 相对 [Original FLANN](https://github.com/junxnone/tech-io/issues/991) 50% 性能提升
- C++11
- header-only - `include/nanoflann.hpp`
- Content
  - Building KD-trees
  - Querying closest neighbors
    - KnnSearch() - **最近的 N 个点**
    - RadiusSearch() - **半径 R 内的点**
    - radiusSearchCustomCallback()

### Pipeline
- 1 Define kd-tree Adaptor
  - 1.1 Set Input
- 2 Search
  - 2.1 knnSearch()
  - 2.2 radiusSearch()
- 3 Outputs
  - 3.1 N 
  - 3.2 index
  - 3.3 distance

### Adaptors
- KDTreeSingleIndexAdaptor
- KDTreeSingleIndexDynamicAdaptor_
- KDTreeSingleIndexDynamicAdaptor
- KDTreeEigenMatrixAdaptor

### Distance Metrics

![image](https://user-images.githubusercontent.com/2216970/142561441-8baab9c9-5bc2-4460-a5a8-896528c03d8f.png)

Type | Distance | Description
-- | -- | --
R^N Euclidean spaces | L1 | Manhattan
x+ | L2 | squared Euclidean norm, favoring SSE2 optimization
x+ | L2_Simple | squared Euclidean norm, for low-dimensionality data sets like point clouds
SO(2) 2D rotational group | metric_SO2 | Absolute angular diference
SO(3) 3D rotational group | metric_SO3 | Inner product between quaternions


## 使用示例

```cpp
#include <nanoflann.hpp>

// 1 定义点集适配器（需提供 kdtree_get_point_count / kdtree_get_pt / kdtree_get_bbox）
struct PointCloud {
    std::vector<std::array<double, 3>> pts;
    size_t kdtree_get_point_count() const { return pts.size(); }
    double kdtree_get_pt(const size_t i, const size_t dim) const { return pts[i][dim]; }
    template <class BBOX> bool kdtree_get_bbox(BBOX&) const { return false; }
};

using KDTree = nanoflann::KDTreeSingleIndexAdaptor<
    nanoflann::L2_Simple_Adaptor<double, PointCloud>, PointCloud, 3>;

PointCloud cloud;                         // 填充点
KDTree index(3, cloud, nanoflann::KDTreeSingleIndexAdaptorParams(10));  // max leaf = 10

// 2 搜索：最近的 N 个点
const size_t N = 5;
std::vector<size_t> ret_index(N);
std::vector<double> out_dist_sqr(N);
double query[3] = {0, 0, 0};
index.knnSearch(query, N, &ret_index[0], &out_dist_sqr[0]);
```

其中：

- `KDTreeSingleIndexAdaptor<Distance, DataSource, DIM>`：kd 树类型，`DIM` 为点的维度（3 表示 3D 点云）
- `L2_Simple_Adaptor`：平方欧氏距离，适合低维点云；注意返回的是距离的**平方**
- `max leaf`（`10`）：叶节点最多的点数，影响建树和查询的速度
- `knnSearch` 返回最近 $N$ 个点的下标和距离；半径搜索见 `radiusSearch`（半径参数也是距离的平方）

## 与 FLANN 对比

| 对比项 | FLANN | nanoflann |
| --- | --- | --- |
| 形式 | 需要编译链接 | 纯头文件，包含即可用 |
| 支持的结构 | kd 树森林、k-means 树等，含自动配置 | 只有 kd 树 |
| 适合维度 | 中高维，通过近似搜索加速 | 低维（如 2D/3D 点云），精确搜索 |
| 性能 | 通用 | 对低维数据更快（文档称相对 FLANN 约有 50% 提升） |

表中：对比结论：点云这类低维数据用 nanoflann 更轻量；高维特征（如 SIFT）用 FLANN 的近似搜索。

## Reference
- [nanoflann - Github](https://github.com/jlblancoc/nanoflann)
- [Docs](http://jlblancoc.github.io/nanoflann/)


