-----

| Title     | 3D Cloud Features Harris                              |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-21T05:35:58Z`                                |
| Updated @ | `2026-10-21T05:35:58Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/588) |

-----

# Harris 3D 关键点

  - Harris 3D 是经典 2D 图像 **Harris 角点检测算子**向三维点云/网格的扩展——2D Harris
    检测的是图像灰度在各方向上变化都剧烈的"角点"，Harris 3D
    检测的是曲面上法向量/曲率在各方向上变化都剧烈的"三维角点"。

## 算法原理

1.  对查询点取局部邻域，估计邻域内各点的法向量（见 [曲率](0304_3D_Cloud_Features_Curvature)
    一文里提到的 PCA 法向量估计方法）；
2.  构造一个类似 2D Harris 算子里"结构张量（Structure
    Tensor）"的矩阵，但统计对象从图像灰度梯度换成了曲面法向量的变化——本质上是在衡量"沿不同方向移动时，表面法向量变化有多剧烈"；
3.  对这个张量矩阵做特征值分解，仿照 2D Harris
    的响应函数公式，用特征值组合算出一个"角点响应值"：响应值高，说明该点在所有方向上法向量变化都很剧烈（角点特征明显）；如果只有一个方向变化剧烈（比如直线边缘），响应值会被抑制，不会被误判为角点；
4.  对响应值做阈值筛选+非极大值抑制，保留局部响应值最高的点作为最终的 Harris 3D 关键点。

## 和 ISS 的区别

[ISS](0302_3D_Cloud_Features_ISS) 和 Harris 3D
都是基于邻域统计量的特征值分析来判断关键点，但统计对象和判据不同：ISS
直接对邻域点的**空间坐标协方差矩阵**做特征值分解，用特征值比值判断"局部形状是否有显著主方向"；Harris 3D
对邻域的**法向量变化**构造类似结构张量的矩阵，判断"表面朝向在各方向上是否都剧烈变化"——ISS
关注点的空间分布形状，Harris 3D 关注表面法向量的局部变化模式，是从不同角度定义"什么是一个好的关键点"。

## UseCase

Harris 3D 和 NARF 是点云/网格关键点检测里两种互补思路（具体对比见 3D Cloud Features NARF
一文）：Harris 3D
更适合检测曲面上曲率变化剧烈的"角点"类关键点，常用于三维物体识别、局部配准前的关键点提取阶段，减少后续特征描述（PFH/FPFH
等）需要处理的点数。

## Reference

  - Sipiran, I., Bustos, B. Harris 3D: A Robust Extension of the Harris
    Operator for Interest Point Detection on 3D Meshes
  - [3D Cloud Features Curvature](0304_3D_Cloud_Features_Curvature)
  - [3D Cloud Features ISS](0302_3D_Cloud_Features_ISS)
  - [3D Cloud Features](0424_3D_Cloud_Features)
