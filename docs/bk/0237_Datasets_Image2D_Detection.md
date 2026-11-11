-----

| Title     | Datasets Image2D Detection                            |
| --------- | ----------------------------------------------------- |
| Created @ | `2019-12-18T02:28:41Z`                                |
| Updated @ | `2026-11-11T09:37:00Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/237) |

-----

# Image Object Detection Datasets

目标检测数据集汇总：给出图像中每个目标的类别与边界框（部分数据集还含实例分割、关键点）。本文按用途整理常用数据集，并链接到本站已有的子页。框格式转换见
[BBox Format](0488_Datasets_Image2D_Detection_BBox)；总入口见 [Datasets
Image2D](0018_Datasets_Image2D)。

> 规模数字来自论文摘要或官网；标"（待核实）"的为未逐项核对的数字，使用前请以官方页面为准。

## 通用检测基准

| 数据集            | 描述                                                | 简单统计                                                                                   | 链接                                                                                                                                                           |
| -------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| MS COCO        | 日常复杂场景，检测/实例分割/关键点/字幕，当前最通用的检测基准，AP@\[.5:.95\] 评测 | 论文称 91 类物体、32.8 万张图像、250 万标注实例；检测任务用 80 类；2017 划分约 118k train / 5k val / 41k test（待核实） | [本站](0247_Datasets_Image2D_COCO)、[官网](http://cocodataset.org/#home)                                                                                          |
| Pascal VOC     | 经典检测/分割基准，2005–2012 年挑战赛，mAP@0.5 评测               | 20 类；VOC07+12 常合用训练（具体张数待核实）                                                           | [本站](0092_Datasets_Image2D_PascalVOC)、[官网](http://host.robots.ox.ac.uk/pascal/VOC/index.html)、[镜像](https://pjreddie.com/projects/pascal-voc-dataset-mirror/) |
| Open Images V4 | 谷歌大规模数据集，分类 + 检测 + 视觉关系                           | 约 920 万张图像，框标注涵盖 600 类（其余数字待核实）                                                        | [官网](https://storage.googleapis.com/openimages/web/index.html)                                                                                               |
| ImageNet       | 以分类著称，ILSVRC 另含检测/定位子任务                           | 见分类页                                                                                   | [本站](0031_Datasets_Image2D_Classification_ImageNet)、[官网](http://image-net.org/)                                                                              |

## 垂直场景检测

| 数据集          | 描述                      | 简单统计                   | 链接                                                                                                                                         |
| ------------ | ----------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| BIT-Vehicle  | 北理工车辆数据集，车辆检测 + 6 类车型分类 | 9,850 张图像              | [本站](0246_Datasets_Image2D_Detection_BITVehicle)、[官网](http://iitlab.bit.edu.cn/mcislab/vehicledb/)、[百度网盘](http://pan.baidu.com/s/1jGIGz9G) |
| UA-DETRAC    | 交通监控车辆检测与跟踪             | （待核实）                  | [官网](http://detrac-db.rit.albany.edu/)                                                                                                     |
| CPPE-5       | 医用个人防护装备细粒度检测           | 1,029 张图像、5 类、4,698 个框 | [本站](0489_Datasets_Image2D_Detection_CPPE5)、[官网](https://sites.google.com/view/cppe5)                                                      |
| 商品识别 RPC（旷视） | 零售结账商品识别数据集             | （待核实）                  | [Kaggle](https://www.kaggle.com/diyer22/retail-product-checkout-dataset)                                                                   |
| SVHN         | 街景门牌号，数字识别/检测           | （待核实）                  | [官网](http://ufldl.stanford.edu/housenumbers/)                                                                                              |

## 其他相关数据集

  - [Oxford VGG
    数据集主页](http://www.robots.ox.ac.uk/~vgg/data/)、[Oxford-IIIT
    Pets](http://www.robots.ox.ac.uk/~vgg/data/pets/)（宠物分类 + 头部框 + 分割，见
    [Pets](0029_Datasets_Image2D_Classification_Pets)）
  - [BraTS
    子集（脑肿瘤分割）](https://drive.google.com/file/d/1A2IU8Sgea1h3fYLpYtFb2v7NYdMjvEhU/view)
  - [服饰属性标签识别（天池）](https://tianchi.aliyun.com/competition/entrance/231671/information)

## 相关页面

  - [Edge Detection
    边缘检测](0098_Datasets_Image2D_EdgeDetection)、[Face](0238_Datasets_Image2D_Face)、[OCR](0240_Datasets_Image2D_OCR)、[Segmentation](0097_Datasets_Image2D_Segmentation)、[KeyPoint](0248_Datasets_Image2D_KeyPoint)

## 选择建议

  - 通用算法对比、论文复现：COCO（首选）；轻量/教学：Pascal VOC。
  - 需要超大类别/预训练：Open Images。
  - 特定行业：车辆选 BIT-Vehicle / UA-DETRAC，防护装备选 CPPE-5，零售选 RPC。
  - 不同数据集框格式不同（VOC 为 xyxy，COCO 为 xywh，YOLO 为归一化中心点），转换见 [BBox
    Format](0488_Datasets_Image2D_Detection_BBox)。

## Reference

  - [Dataset —— Department of Engineering Science, University of
    Oxford](http://www.robots.ox.ac.uk/~vgg/data/)
      - [Oxford-IIIT Pets
        dataset](http://www.robots.ox.ac.uk/~vgg/data/pets/)
  - [MSCOCO —— Microsoft](http://cocodataset.org/#home)
  - [Pascal VOC
    Dataset](http://host.robots.ox.ac.uk/pascal/VOC/index.html)
      - [Pascal VOC Dataset
        Mirror](https://pjreddie.com/projects/pascal-voc-dataset-mirror/)
  - [BitVehicle](http://iitlab.bit.edu.cn/mcislab/vehicledb/)
    [BaiduPan](http://pan.baidu.com/s/1jGIGz9G)
  - [SVHN - The Street View House
    Numbers](http://ufldl.stanford.edu/housenumbers/)
  - [ImageNet](http://image-net.org/)
  - [商品识别数据集 -
    旷视科技](https://www.kaggle.com/diyer22/retail-product-checkout-dataset)
  - [brain tumor segmentation (BraTS)
    subset](https://drive.google.com/file/d/1A2IU8Sgea1h3fYLpYtFb2v7NYdMjvEhU/view)
  - [Attributes Reconition of Apparel-Challenge the Baseline -
    服饰属性标签识别](https://tianchi.aliyun.com/competition/entrance/231671/information)
  - [UA-DETRAC](http://detrac-db.rit.albany.edu/)
  - [Open Images Dataset
    V4](https://storage.googleapis.com/openimages/web/index.html)
