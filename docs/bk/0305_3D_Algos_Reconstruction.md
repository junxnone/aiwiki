-----

| Title     | 3D Algos Reconstruction                               |
| --------- | ----------------------------------------------------- |
| Created @ | `2022-04-01T06:28:06Z`                                |
| Updated @ | `2026-11-26T09:16:38Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/305) |

-----

# 3D 重建

  - 3D Reconstrution - 三维重建
  - 由图像、深度图或点云恢复场景/物体的三维几何
  - [KinectFusion](https://github.com/junxnone/aiwiki/issues/306)
  - Kintinuous
  - ElasticFusion
  - ElasticReconstruction
  - InfiniTAM
  - DynamicFusion
  - BundleFusion

## 基本流程

``` mermaid
flowchart LR
    A[数据采集 RGB-D 激光 图像] --> B[相机位姿估计 / 配准]
    B --> C[数据融合]
    C --> D[表面提取 网格化]
    D --> E[纹理映射]
```

图中：

  - 数据采集：深度相机、激光雷达或多视角图像
  - 位姿估计 / 配准：确定每一帧相对于全局的位置，常用 ICP 或特征匹配
  - 融合：把多帧数据合并到统一的模型（体素、面元、点云）
  - 表面提取：得到三角网格（如
    [GreedyProjectionTriangulation](https://github.com/junxnone/aiwiki/issues/399)）
  - 关键结论：位姿越准，重建越清晰；误差累积（漂移）是主要难题

## 三维表示

| 表示         | 特点                | 代表            |
| ---------- | ----------------- | ------------- |
| 体素 / TSDF  | 规则栅格，易融合，内存随体积增长  | KinectFusion  |
| 面元（surfel） | 带朝向的小圆片，内存按场景大小增长 | ElasticFusion |
| 点云         | 无序点集，灵活           | 配准、SLAM       |
| 网格         | 三角面片，适合渲染         | 表面重建结果        |

表中：对比结论：体素便于融合，面元和点云适合大场景，网格是最终输出形式。

## 代表方法

| 方法                    | 特点                              |
| --------------------- | ------------------------------- |
| KinectFusion          | 实时、TSDF 体素、小场景                  |
| Kintinuous            | 把 KinectFusion 扩展到大场景，体素体积随相机移动 |
| ElasticFusion         | 基于面元，支持回环检测后弹性形变修正              |
| ElasticReconstruction | 离线方法，分段重建后全局优化，精度高              |
| InfiniTAM             | 用哈希体素表示，高效，可在轻量设备上运行            |
| DynamicFusion         | 支持非刚性、动态场景                      |
| BundleFusion          | 实时全局一致的重建，带全局位姿优化               |

表中：

  - **回环检测**：识别相机回到曾经到过的位置，用于修正累计误差
  - 对比结论：从 KinectFusion 出发，后续方法分别扩展到大场景、全局一致、动态物体和轻量部署

## Reference

  - [三维重建 3D reconstruction
    有哪些实用算法？](https://www.zhihu.com/question/29885222)
