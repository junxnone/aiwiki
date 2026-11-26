-----

| Title     | 3D Tools PCL SAC                                      |
| --------- | ----------------------------------------------------- |
| Created @ | `2022-09-19T03:21:31Z`                                |
| Updated @ | `2026-11-26T09:13:35Z`                                |
| Labels    | `index`                                               |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/314) |

-----

# SAC

SAC（Sample Consensus，随机采样一致性）是 PCL 中一类基于 RANSAC
思想的**模型拟合**方法：在含有大量离群点的点云中，鲁棒地估计平面、直线、圆、球、圆柱等几何模型，常用于去除地面、检测直线和圆。

## 基本流程（RANSAC）

``` mermaid
flowchart LR
    A[随机取最少数量的点] --> B[拟合模型]
    B --> C[统计距模型小于阈值的点 即内点]
    C --> D{内点数最多?}
    D -- 是 --> E[记录当前最优模型]
    D -- 否 --> A
    E --> A
    A -.达到迭代次数.-> F[用最优模型的内点重新拟合]
```

图中：

  - 每次随机取拟合模型所需的最少点（平面 3 个点，直线 2 个点，圆 3 个点）
  - 用这些点拟合模型，统计与模型距离小于阈值的内点数量
  - 重复多次，保留内点最多的模型，最后可用其内点再精细拟合
  - 关键结论：只要有足够比例的内点，反复随机采样总能碰到一组「全是内点」的样本

所需迭代次数：

$$ k=\\frac{\\ln(1-p)}{\\ln\\left(1-w^{n}\\right)} $$

其中：

  - $k$：需要的迭代次数；$p$：希望至少一次采样全为内点的置信概率（如 0.99）
  - $w$：内点占全部点的比例；$n$：拟合模型所需的最少点数
  - $w^n$：一次采样全是内点的概率；内点比例越低、模型所需点数越多，需要的迭代次数越大

## PCL 中支持的模型

| 模型  | 常量                  | 用途         |
| --- | ------------------- | ---------- |
| 平面  | `SACMODEL_PLANE`    | 提取地面、桌面、墙面 |
| 直线  | `SACMODEL_LINE`     | 检测直线边缘     |
| 二维圆 | `SACMODEL_CIRCLE2D` | 检测圆形轮廓     |
| 三维圆 | `SACMODEL_CIRCLE3D` | 检测三维圆      |
| 球   | `SACMODEL_SPHERE`   | 检测球形物体     |
| 圆柱  | `SACMODEL_CYLINDER` | 检测管道、柱子    |

表中：

  - 常量用于设置 `SACSegmentation` 的模型类型
  - 对比结论：模型越复杂（如圆柱需要法线信息），所需最少点数越多、对噪声越敏感

## 示例：平面分割

``` cpp
#include <pcl/segmentation/sac_segmentation.h>

pcl::ModelCoefficients::Ptr coefficients(new pcl::ModelCoefficients);
pcl::PointIndices::Ptr inliers(new pcl::PointIndices);

pcl::SACSegmentation<pcl::PointXYZ> seg;
seg.setOptimizeCoefficients(true);          // 用内点重新精细拟合
seg.setModelType(pcl::SACMODEL_PLANE);      // 拟合平面
seg.setMethodType(pcl::SAC_RANSAC);         // 使用 RANSAC
seg.setDistanceThreshold(0.01);             // 内点距离阈值（米）
seg.setInputCloud(cloud);
seg.segment(*inliers, *coefficients);       // inliers 是内点索引，coefficients 是模型系数
```

其中：

  - `setDistanceThreshold`：点到模型的距离阈值，决定哪些点算内点；应根据传感器噪声选取
  - `coefficients`：平面方程 $ax+by+cz+d=0$ 的系数 $(a,b,c,d)$
  - `inliers`：属于该平面的点的索引

## 注意

  - 阈值太小会漏掉真实内点，太大会把离群点算入
  - 点云中有多个同类模型时，需要提取一个后移除内点，再重复拟合
  - 变体：MSAC、LMEDS、PROSAC 等，评分或采样策略不同

## Reference

  - [PCL之圆形检测和直线检测](https://blog.csdn.net/kissgoodbye2012/article/details/124361044)
