---
Title | 3D Tools PCL Surface triangulation
-- | --
Created @ | `2023-03-28T13:19:47Z`
Updated @| `2023-03-30T13:31:17Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/399)

---
# GreedyProjectionTriangulation

- 对原始点云进行快速三角化的算法
- 选取一个样本三角片作为初始曲面，不断扩张曲面边界，最后形成一张完整的三角网格曲面
  - 将三维点通过法线投影到某一平面
  - 对投影得到的点云作平面内的三角化(基于Delaunay法则的空间区域增长算法)
  - 根据平面内三位点的拓扑连接关系获得一个三角网格曲面模型
- 需要表面光滑且密度变化均匀(滤波/平滑处理)


## 基于Delaunay法则的空间区域增长算法
- 选取一个初始三角面片，不断的向外扩张最后形成一个完整的三角网格曲面
- **Delaunay 三角剖分**: 所有三角形的外接圆均满足空圆性质的三角剖分
  - 最大化最小角
  - 唯一性（任意四点不能共圆）
- **空圆性质(特性)**: 即一个三角形（或边）的外接圆范围内（边界除外），不包含点集P中的任何顶点
- **Delaunay边**: 满足空圆特性的边
- Lawson算法
- Bowyer-Watson算法

## Reference

- [Fast triangulation of unordered point clouds](https://pcl.readthedocs.io/projects/tutorials/en/latest/greedy_projection.html)
- [On fast surface reconstruction methods for large and noisy point clouds](https://github.com/junxnone/aiwiki/files/11089792/marton09icra.pdf)

