-----

| Title     | Datasets Image2D Segmentation                        |
| --------- | ---------------------------------------------------- |
| Created @ | `2019-03-10T14:23:31Z`                               |
| Updated @ | `2026-11-11T09:36:55Z`                               |
| Labels    | \`\`                                                 |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/97) |

-----

# Segmentation 分割数据集

图像分割任务分为语义分割（每个像素一个类别）、实例分割（区分同类不同个体）和全景分割（二者结合）。本文按类整理常用分割数据集，给出描述、简单统计和链接，总入口见
[Datasets Image2D](0018_Datasets_Image2D)，相关任务见
[Detection](0237_Datasets_Image2D_Detection)、[Edge
Detection](0098_Datasets_Image2D_EdgeDetection)。

> 规模数字来自官网/论文，标"（待核实）"的为凭记忆给出、未逐项核对的数字，使用前请以官方页面为准。

## 一、本站已有专题页

| 数据集                       | 描述                                   | 简单统计                                                     | 链接                                                                                                                      |
| ------------------------- | ------------------------------------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| CamVid                    | 剑桥驾驶场景视频的逐像素语义标注，自动驾驶分割的经典小型基准       | 701 帧标注图像，32 类（常用 11 类子集）                                | [CamVid](0088_Datasets_Image2D_Segmentation_CamVid)                                                                     |
| TACO                      | 野外垃圾（树林/马路/海滩）实例分割，COCO 格式标注，持续众包增长  | 1500 张图，4784 个标注，60 类/28 个超类（2020.04 统计）                 | [TACO](0089_Datasets_Image2D_Segmentation_TACO)                                                                         |
| Balloon                   | Mask R-CNN 官方教程用的气球小数据集，适合快速验证实例分割流程 | 61 train / 13 val，VIA 多边形标注                              | [Balloon](0090_Datasets_Image2D_Segmentation_Balloon)                                                                   |
| Mapping Challenge crowdAI | 航拍/卫星影像建筑物实例分割（单类 building），COCO 格式  | 280,741 train / 60,317 val / 60,697 test                 | [MCC](0091_Datasets_Image2D_Segmentation_MCC)                                                                           |
| Cityscapes                | 欧洲 50 城街景，精细+粗标注，自动驾驶分割主流基准          | 5000 精细标注 + 20000 粗标注，30 类（19 类参与评测）                     | [Cityscapes](0093_Datasets_Image2D_Segmentation_Cityscapes)                                                             |
| LVIS                      | 基于 COCO 图像的长尾实例分割，1000+ 类            | 约 160k 图像，1203 类（待核实）                                    | [LVIS](0094_Datasets_Image2D_Segmentation_LVIS)                                                                         |
| DAGM                      | 工业表面纹理缺陷弱监督分割                        | 10 个子集（待核实）                                              | [DAGM](0095_Datasets_Image2D_Segmentation_DAGM)                                                                         |
| CHAOS                     | 腹部 CT/MR 医学器官分割挑战                    | 待核实                                                      | [CHAOS](0096_Datasets_Image2D_Segmentation_CHAOS)                                                                       |
| Pascal VOC                | 经典检测/分割基准，20 类 + 背景                  | VOC2012 分割：train 1464 / val 1449（待核实），常配 SBD 扩充到 10582 张 | [PascalVOC](0092_Datasets_Image2D_PascalVOC)　[Dataset Mirror](https://pjreddie.com/projects/pascal-voc-dataset-mirror/) |
| MS COCO                   | 检测/实例/全景分割/关键点通用大基准                  | 约 118k train / 5k val 图，80 个 thing 类                     | [COCO](0247_Datasets_Image2D_COCO)　[官网](http://cocodataset.org/#home)                                                   |

## 二、其他外部数据集

| 数据集                            | 描述                               | 简单统计                | 链接                                                                             |
| ------------------------------ | -------------------------------- | ------------------- | ------------------------------------------------------------------------------ |
| Medical Segmentation Decathlon | 10 个任务的通用 3D 医学图像分割基准            | 10 个任务（待核实具体病例数）    | [官网](http://medicaldecathlon.com/)                                             |
| 2018 Data Science Bowl         | Kaggle 细胞核实例分割（医学/生物显微图像）        | 待核实                 | [Kaggle](https://www.kaggle.com/c/data-science-bowl-2018/overview/description) |
| Penn-Fudan Pedestrian          | 行人检测与分割小数据集，torchvision 实例分割教程所用 | 170 张图，345 个行人（待核实） | [页面](https://www.cis.upenn.edu/~jshi/ped_html/)                                |
| KITTI segmentation             | KITTI 的语义/实例分割子基准（街景）            | 待核实                 | [KITTI](http://www.cvlibs.net/datasets/kitti/)                                 |

## 选择建议

  - 入门/跑通流程：Balloon（几十张图）、Penn-Fudan，几分钟可完成微调。
  - 自动驾驶语义分割：Cityscapes 为主，CamVid 做小规模/视频实验。
  - 通用实例分割：COCO；长尾场景用 LVIS。
  - 遥感建筑物：Mapping Challenge；垃圾/环保：TACO。
  - 工业缺陷：DAGM（更多见
    [Defect](0245_Datasets_Image2D_Defect)）；医学：CHAOS、MSD、DSB2018。

## 常见坑

  - 标注格式不统一：COCO（RLE/多边形 JSON）、VOC（调色板 PNG）、VIA（多边形 JSON）、CamVid（RGB
    颜色码），需转换为统一的 mask。
  - 语义分割 mask 的 ignore/void 标签（如 VOC 的 255、Cityscapes 的 255）评测时必须忽略。
  - 评测指标不同：语义分割用 mIoU，实例分割用 mask AP，全景分割用 PQ。

## Reference

  - [Summary of the semantic segmentation
    datasets](https://github.com/zhixuanli/segmentation-paper-reading-notes/blob/master/others/Summary%20of%20the%20semantic%20segmentation%20datasets.md)
