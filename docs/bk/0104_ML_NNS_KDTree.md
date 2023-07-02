-----

| Title         | ML NNS KDTree                                         |
| ------------- | ----------------------------------------------------- |
| Created @     | `2021-05-24T06:32:35Z`                                |
| Last Modify @ | `2022-12-23T15:09:34Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/104) |

-----

# KDTree

## Reference

  - [详解KDTree](https://blog.csdn.net/silangquan/article/details/41483689)
  - [k-d tree - wikipedia](https://en.wikipedia.org/wiki/K-d_tree)

## Brief

  - KD - `k-dimensional`
      - [BSTree](https://github.com/junxnone/aiwiki/issues/332) -
        `Binary Sort Tree/Binary Search Tree`
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

![nn\_kdtree](media/6f7d81c8d6bcd5350206d1440633dc70f580db0a.gif)

## 复杂度

| Steps | 复杂度                                    |
| ----- | -------------------------------------- |
| 构建    | O(log<sup>2</sup> n)                   |
| 插入    | O(log n)                               |
| 删除    | O(log n)                               |
| 查询    | O(n<sup>1-1/k</sup> + k)<br> k - 搜索的点数 |

## Libraries

  - [FLANN](/FLANN)
  - [nanoflann](/nanoflann)
  - [libkdtree++](https://github.com/nvmd/libkdtree)
  - [OpenCV -
    FLANN](https://docs.opencv.org/4.0.0/dc/de2/classcv_1_1FlannBasedMatcher.html)
  - [ANN \~2010](http://www.cs.umd.edu/~mount/ANN/)
  - [fastann \~2009](https://github.com/philbinj/fastann)

## UseCase

  - 三维点云中点的检索

| K = 2 | ![image](media/f9f44a86ecb18d5ce738ec7d6b89c33013a42d3c.png) | ![image](media/3bbdf25667942ee23bb31cf7e6c3887dab35e3c5.png) |
| ----- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| K=3   | ![image](media/983cd40d8ad32eeddcc19b6f179a1fe813ce08f1.png) | ![image](media/812addd166dfff62d0b69acb2a1cfcca7831bdb7.png) |
