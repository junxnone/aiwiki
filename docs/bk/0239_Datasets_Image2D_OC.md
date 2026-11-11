-----

| Title     | Datasets Image2D OC                                   |
| --------- | ----------------------------------------------------- |
| Created @ | `2020-09-10T01:49:17Z`                                |
| Updated @ | `2026-11-11T09:37:04Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/239) |

-----

# Object Counting 计数数据集

计数任务分三类：人群计数（Crowd
Counting，常用密度图回归）、通用物体计数（密集目标检测/计数）、细胞计数。本文整理常用数据集并保留原有全部链接。检测类背景见
[Object Detection](0237_Datasets_Image2D_Detection)，总入口见 [Datasets
Image2D](0018_Datasets_Image2D)。

> 规模数字多数来自官网/论文，标"（待核实）"的为凭记忆给出、未逐项核对。

## 一、Crowd Counting 人群计数

| 数据集                                                                       | 描述                               | 简单统计                                          |
| ------------------------------------------------------------------------- | -------------------------------- | --------------------------------------------- |
| [NWPU-Crowd](https://crowdbenchmark.com/nwpucrowdloc.html)                | 规模大、场景多样的人群计数/定位基准，测试集标签不公开、在线评测 | 5,109 张图，约 213 万个标注头部                         |
| [Mall](http://personal.ie.cuhk.edu.hk/~ccloy/downloads_mall_dataset.html) | 商场监控视频，固定视角                      | 2,000 帧，约 6.2 万行人标注（待核实）                      |
| [GCC](https://gjy3035.github.io/GCC-CL/)                                  | GTA5 合成的人群数据集，用于合成到真实的域适应        | 15,212 张图，约 762 万人（待核实）                       |
| UCSD                                                                      | 行人天桥监控视频，低分辨率灰度                  | 2,000 帧（158x238），约 4.99 万行人（待核实）              |
| UCF CC 50                                                                 | 极密集人群，图像少、密度高，通常 5 折交叉验证         | 50 张图，63,974 人（待核实）                           |
| WorldExpo                                                                 | WorldExpo'10 上海世博会监控             | 3,980 帧，108 个场景，约 20 万人（待核实）                  |
| ShanghaiTech Part A                                                       | 网络图片，密集                          | 482 张图（300 训练 / 182 测试）                       |
| ShanghaiTech Part B                                                       | 上海街头拍摄，相对稀疏                      | 716 张图（400 训练 / 316 测试）；两部分合计 1,198 张、约 33 万人 |

## 二、Object Counting 物体计数

| 数据集                                                         | 描述                         | 简单统计                                                       |
| ----------------------------------------------------------- | -------------------------- | ---------------------------------------------------------- |
| [SKU-110K](https://github.com/eg4000/SKU110K_CVPR19)        | 零售货架密集商品检测                 | 11,762 张图（train/val/test 约 8,233/588/2,941），约 173 万个框（待核实） |
| [CARPK & PUCPR+](https://lafi.github.io/LPN/)               | 无人机俯拍停车场车辆计数；PUCPR+ 为固定摄像头 | CARPK 1,448 张图、约 8.98 万辆车；PUCPR+ 约 125 张图（待核实）             |
| [RebarCounting](https://github.com/andohuman/RebarCounting) | 钢筋截面计数                     | （待核实）                                                      |
| [Pesteh-Set](https://github.com/mr7495/Pesteh-Set)          | 不同类型开心果的图像数据集，用于分类与计数      | （待核实）                                                      |

## 三、Cells 细胞计数

| 数据集                                                                                                                                                     | 描述                          | 简单统计          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------- |
| [BCCD](https://github.com/Shenggan/BCCD_Dataset)                                                                                                        | 血细胞（红/白细胞、血小板）检测与计数，VOC 格式  | 约 364 张图（待核实） |
| [VGG Cells](http://www.robots.ox.ac.uk/~vgg/research/counting/index_org.html)（[GitHub](https://github.com/ieee8023/countception/blob/master/cells.zip)） | 合成荧光显微细胞图，密度估计论文所用          | 200 张图（待核实）   |
| [MBM Cells](https://github.com/ieee8023/countception/blob/master/MBM_data.zip)                                                                          | 人骨髓细胞（Modified Bone Marrow） | 约 44 张图（待核实）  |
| [Adipocyte Cells](https://github.com/ieee8023/countception/blob/master/adipocyte_data.zip)                                                              | 脂肪细胞显微图                     | 约 100 张图（待核实） |

## 选择建议

  - 人群计数：主基准用 ShanghaiTech A/B、UCF-QNRF、NWPU-Crowd；极端密度看 UCF CC
    50；缺少真实数据可用 GCC 做合成预训练。
  - 密集物体：零售用 SKU-110K，车辆用 CARPK/PUCPR+。
  - 评测指标通常为 MAE 和 MSE（RMSE）。
  - 数据量小的数据集（UCF CC 50、细胞类）结果方差大，建议交叉验证并报告多次均值。

## Reference

  - [Awesome Crowd Counting -
    datasets](https://github.com/gjy3035/Awesome-Crowd-Counting/blob/master/src/Datasets.md)
  - [kaggle - counting
    dataset](https://www.kaggle.com/search?q=counting+in%3Adatasets)
