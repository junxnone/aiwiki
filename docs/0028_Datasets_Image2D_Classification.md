---
Title | Datasets Image2D Classification
-- | --
Created @ | `2019-12-18T02:26:54Z`
Updated @| `2026-11-11T09:36:23Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/28)

---
# 图像分类数据集

图像分类（Image Classification）是最基础的视觉任务：给定一张图，输出其类别标签。本文是分类数据集汇总页，按「数据集 | 描述 | 简单统计 | 链接」整理，并给出选择建议。总入口见 [Datasets Image2D](0018_Datasets_Image2D)。

> 规模数字来自论文或官网常识；标"（待核实）"的为未逐项核对的数字，使用前请以官方页面为准。

## 分类数据集一览

数据集 | 描述 | 简单统计 | 链接
-- | -- | -- | --
MNIST | 手写数字灰度图，入门级 "Hello World" 数据集 | 7 万张 28×28 灰度图、10 类（6 万训练 / 1 万测试） | [本站 MNIST](0030_Datasets_Image2D_Classification_mnist)
Fashion-MNIST | Zalando 服饰图，格式与 MNIST 完全一致，难度更高 | 7 万张 28×28 灰度图、10 类（6 万训练 / 1 万测试） | [官方](https://github.com/zalandoresearch/fashion-mnist#get-the-data)
CIFAR-10/100 | 小尺寸彩色物体图，算法快速验证的标准基准 | 6 万张 32×32 彩色图；CIFAR-10 为 10 类（5 万训练 / 1 万测试），CIFAR-100 为 100 类（每类 500 训练 / 100 测试） | [本站 CIFAR](0032_Datasets_Image2D_Classification_Cifar)
Oxford-IIIT Pets | 猫狗品种细粒度分类，另含头部框与前景分割 trimap | 37 类，每类约 200 张，共约 7,349 张（待核实） | [本站 Pets](0029_Datasets_Image2D_Classification_Pets)、[官方](http://www.robots.ox.ac.uk/~vgg/data/pets/)
ImageNet | 大规模分类基准，ILSVRC 使用其 1000 类子集 | ILSVRC-2012：约 128 万训练图、5 万验证图、10 万测试图、1000 类（待核实）；ImageNet-21k 约 1,400 万张、2 万余类（待核实） | [本站 ImageNet](0031_Datasets_Image2D_Classification_ImageNet)
DTD | 纹理描述数据集，47 类纹理 | 详见专文 | [本站 DTD](0481_Datasets_Image2D_DTD)

> COCO、Pascal VOC、BitVehicle 本质上是检测/分割数据集，不属于分类基准，分别见 [COCO](0247_Datasets_Image2D_COCO)、[PascalVOC](0092_Datasets_Image2D_PascalVOC)、[BITVehicle](0246_Datasets_Image2D_Detection_BITVehicle)，以及 [Detection](0237_Datasets_Image2D_Detection)、[Segmentation](0097_Datasets_Image2D_Segmentation)。

## 选择建议

- 验证代码流程、教学演示：MNIST（几分钟训完，CPU 即可）。
- 想要比 MNIST 更有区分度但同样轻量：Fashion-MNIST。
- 验证新结构/新训练技巧的小规模基准：CIFAR-10/100。
- 细粒度分类、迁移学习、多任务（分类+检测+分割）小样本实验：Oxford-IIIT Pets。
- 预训练、与论文结果对齐、正式评测：ImageNet-1k（ILSVRC-2012）。
- 纹理识别：DTD。

## 相关页面

- [Datasets Image2D](0018_Datasets_Image2D)
- [Detection](0237_Datasets_Image2D_Detection)、[Segmentation](0097_Datasets_Image2D_Segmentation)、[Retrieval](0241_Datasets_Image2D_Retrieval)

## Reference

- [Fashion-MNIST](https://github.com/zalandoresearch/fashion-mnist#get-the-data)
- [Dataset —— Department of Engineering Science, University of Oxford](http://www.robots.ox.ac.uk/~vgg/data/)
  - [Oxford-IIIT Pets dataset](http://www.robots.ox.ac.uk/~vgg/data/pets/)
- [MSCOCO —— Microsoft](http://cocodataset.org/#home)
- [Pascal VOC Dataset](http://host.robots.ox.ac.uk/pascal/VOC/index.html)
  - [Pascal VOC Dataset Mirror](https://pjreddie.com/projects/pascal-voc-dataset-mirror/)
- [BitVehicle](http://iitlab.bit.edu.cn/mcislab/vehicledb/)（[BaiduPan](http://pan.baidu.com/s/1jGIGz9G)）

