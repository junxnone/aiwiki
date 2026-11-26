---
Title | 3D Tools PCL
-- | --
Created @ | `2021-04-28T07:43:42Z`
Updated @| `2026-11-26T10:21:15Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/77)

---
# Point Cloud Library

PCL 是开源的点云处理库（C++），包含滤波、特征、配准、分割、重建、可视化等模块，广泛用于机器人和三维视觉。

- [PCL Code Analysis](https://github.com/junxnone/pcl/issues/1)
- **Algos**
  - [PPF](https://github.com/junxnone/aiwiki/issues/83)
  - [ICP](https://github.com/junxnone/aiwiki/issues/86)
- 依赖
  - Boost
  - Eigen
  - FLANN
  - VTK
  - CUDA
  - OpenNI
  - Qhull
  - 加速依赖: OpenMP/GPU/CUDA

![image](https://user-images.githubusercontent.com/2216970/124412106-5bc32480-dd80-11eb-82de-1aea7847f8ac.png)

图中：该图为原文档附带的 PCL 模块或结构示意图。

## 依赖的作用

| 依赖 | 作用 |
| --- | --- |
| Boost | 基础工具库（智能指针、线程等） |
| Eigen | 矩阵与线性代数，见 [Eigen](https://github.com/junxnone/aiwiki/issues/303) |
| FLANN | 近邻搜索，见 [FLANN](https://github.com/junxnone/aiwiki/issues/122) |
| VTK | 可视化 |
| CUDA | GPU 加速的部分模块 |
| OpenNI | 读取深度相机数据 |
| Qhull | 凸包计算 |

表中：对比结论：核心功能必须有 Boost、Eigen、FLANN；可视化、深度相机和 GPU 加速是可选项。

## 主要模块与文章

| 模块 | 说明 | 文章 |
| --- | --- | --- |
| IO | 点云文件读写 | [PCD](https://github.com/junxnone/aiwiki/issues/400)、[PLY](https://github.com/junxnone/aiwiki/issues/401) |
| Filters | 滤波与下采样 | [Downsampling](https://github.com/junxnone/aiwiki/issues/82) |
| Segmentation | 分割（如 RANSAC 拟合） | [SAC](https://github.com/junxnone/aiwiki/issues/314) |
| Registration | 配准 | [ICP](https://github.com/junxnone/aiwiki/issues/86)、[PPF](https://github.com/junxnone/aiwiki/issues/83) |
| Surface | 表面重建 | [GreedyProjectionTriangulation](https://github.com/junxnone/aiwiki/issues/399) |
| Range Image / Bbox | 深度图与包围盒 | [RangeImage](https://github.com/junxnone/aiwiki/issues/84)、[AABB OBB](https://github.com/junxnone/aiwiki/issues/315) |
| 安装 | 编译与安装 | [Linux](https://github.com/junxnone/aiwiki/issues/79)、[Windows](https://github.com/junxnone/aiwiki/issues/78)、[Install](https://github.com/junxnone/aiwiki/issues/337) |

表中：对比结论：按「读入 → 滤波 → 分割 / 配准 → 重建」的流程查阅对应文章。

## Reference
- PCL Documents [[Doxygen](https://pointclouds.org/)]  [[readthedocs](https://pcl.readthedocs.io/projects/tutorials/en/latest/index.html)]
- [Github](https://github.com/PointCloudLibrary)
- [[机器视觉]PCL学习笔记](https://xgyopen.github.io/2018/12/24/2018-12-24-imv-pcl-book/)
- [PCL(Point Cloud Library)学习指南&资料推荐](https://www.yuque.com/huangzhongqing/pcl/rdk5k8) [[Github](https://github.com/HuangCongQing/pcl-learning)]
- [pclpy](https://github.com/davidcaron/pclpy)
- [黑马机器人 | PCL-3D点云](http://robot.czxy.com/docs/pcl/)
- [PCL点云处理算法汇总（C++长期更新版）](https://www.whcsrl.com/blog/8616#_PCLVTK_357)

