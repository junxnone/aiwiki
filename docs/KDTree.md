---
Title | KDTree
-- | --
Create Date | `2021-10-16T04:16:58Z`
Update Date | `2021-10-16T04:16:58Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/104)

---
# Reference
- [详解KDTree](https://blog.csdn.net/silangquan/article/details/41483689)
- [k-d tree - wikipedia](https://en.wikipedia.org/wiki/K-d_tree)

# Brief
- KD - `k-dimensional`
  - [BSTree](https://github.com/junxnone/tech-io/issues/989) - `Binary Sort Tree/Binary Search Tree`
  - 1970s 由 Jon Bentley 提出
- 分割 K 维数据空间的数据结构
- **用途**: 搜索感兴趣数据 
  - 搜索最近邻点
    - 搜索半径 R 内的点
    - 搜索最近的 N 个点
- **构建 Pipeline**
  - 选取方差较大的轴作为分割轴顺序 - (`x->y->z`)
  - 取分割轴的中位数为根节点
- **搜索 Pipeline**



![nn_kdtree](https://user-images.githubusercontent.com/2216970/119446732-7d80c300-bd61-11eb-988a-b6e04438c644.gif)

## 复杂度

Steps | 复杂度
-- | --
构建 | O(log<sup>2</sup> n)
插入 | O(log n)
删除 | O(log n)
查询 | O(n<sup>1-1/k</sup> + k)<br> k - 搜索的点数


## Libraries
- [FLANN](https://github.com/junxnone/tech-io/issues/991)
- [nanoflann](https://github.com/junxnone/tech-io/issues/1026)
- [libkdtree++](https://github.com/nvmd/libkdtree)
- [OpenCV - FLANN](https://docs.opencv.org/4.0.0/dc/de2/classcv_1_1FlannBasedMatcher.html)
- [ANN ~2010](http://www.cs.umd.edu/~mount/ANN/)
- [fastann ~2009](https://github.com/philbinj/fastann)

# UseCase
- 三维点云中点的检索

K = 2 | ![image](https://user-images.githubusercontent.com/2216970/119448597-24665e80-bd64-11eb-8a95-a91e750312fe.png) | ![image](https://user-images.githubusercontent.com/2216970/119445738-da7b7980-bd5f-11eb-86d9-375e9afe9e79.png) 
-- | -- | --
K=3 | ![image](https://user-images.githubusercontent.com/2216970/119309254-a4c38b80-bca0-11eb-9986-dfd0058edf96.png) | ![image](https://user-images.githubusercontent.com/2216970/119445591-a1dba000-bd5f-11eb-8cd6-ec4c8f892065.png)


