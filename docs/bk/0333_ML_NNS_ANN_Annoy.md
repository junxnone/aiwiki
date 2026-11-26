-----

| Title     | ML NNS ANN Annoy                                      |
| --------- | ----------------------------------------------------- |
| Created @ | `2021-08-18T03:23:33Z`                                |
| Updated @ | `2026-11-26T09:28:13Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/333) |

-----

# Annoy

  - Annoy - `Approximate Nearest Neighbors Oh Yeah`
  - Spotify 开源的近似最近邻库，C++ 实现，带 Python 绑定
  - 用**随机投影树森林**做索引，索引可保存为文件并用内存映射（mmap）共享，适合「构建一次、多进程查询」
  - 所属背景见 [ML NNS ANN](https://github.com/junxnone/aiwiki/issues/103)

## 原理

``` mermaid
flowchart LR
    P[高维向量集合] --> S[随机选两个点 取它们的中垂超平面分割空间]
    S --> R[递归分割 直到叶子节点点数很少]
    R --> T[得到一棵树]
    T --> F[重复多次 构成森林]
    F --> Q[查询: 在每棵树里走到叶子 合并候选 精确排序]
```

图中：

  - 每棵树：反复随机选两个点，用它们的中垂面把当前点集分成两半，直到叶子里只剩少量点
  - 森林：构建多棵这样的随机树，每棵的分割都不同
  - 查询：把查询点在每棵树中送到叶子，合并所有叶子里的候选点，再用真实距离排序取最近的 $k$ 个
  - 关键结论：树越多，漏掉真实近邻的概率越小，但索引越大、查询越慢

## 距离

支持 `angular`、`euclidean`、`manhattan`、`hamming`、`dot`。angular 距离由余弦相似度导出：

$$ d\_{angular}(u,v)=\\sqrt{2\\left(1-\\frac{u\\cdot v}{\\lVert
u\\rVert,\\lVert v\\rVert}\\right)} $$

其中：

  - $u,v$：两个向量；$u\\cdot v$：内积；$\\lVert\\cdot\\rVert$：向量的模
  - $\\frac{u\\cdot v}{\\lVert u\\rVert\\lVert
    v\\rVert}$：余弦相似度；$d\_{angular}$ 即归一化向量之间的欧氏距离

## 使用

``` python
from annoy import AnnoyIndex

f = 128                                  # 向量维度
index = AnnoyIndex(f, 'angular')         # 距离度量
for i, vec in enumerate(vectors):
    index.add_item(i, vec)               # 添加向量
index.build(10)                          # 构建 10 棵树
index.save('test.ann')                   # 保存索引（之后可 mmap 加载）

index.load('test.ann')
ids = index.get_nns_by_vector(query, 5)  # 查询最近的 5 个
```

其中：

  - `add_item(i, vec)`：加入第 $i$ 个向量；`build(n_trees)`：构建 `n_trees`
    棵树，构建后不能再添加
  - `get_nns_by_vector(query, k, search_k=-1)`：返回最近的 $k$ 个索引；`search_k`
    控制检查的节点数，默认约为 `n_trees * k`

## 关键参数

| 参数         | 作用        | 取值影响             |
| ---------- | --------- | ---------------- |
| `n_trees`  | 树的数量（构建时） | 越大精度越高，索引越大，构建越慢 |
| `search_k` | 查询时检查的节点数 | 越大精度越高，查询越慢      |

表中：对比结论：两个参数都是精度与速度（内存）的折中。

## 与其他近似最近邻对比

| 方法                                                     | 索引结构                  | 特点               |
| ------------------------------------------------------ | --------------------- | ---------------- |
| Annoy                                                  | 随机投影树森林               | 内存映射，索引只读，轻量     |
| [HNSW](https://github.com/junxnone/aiwiki/issues/334)  | 分层近邻图                 | 召回高、查询快，内存占用较大   |
| [FLANN](https://github.com/junxnone/aiwiki/issues/122) | kd 树 / k-means 树，自动配置 | 通用，OpenCV、PCL 使用 |

## Reference

  - [Annoy - GitHub](https://github.com/spotify/annoy)
