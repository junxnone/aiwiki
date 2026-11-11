---
Title | Datasets Image2D Classification ImageNet
-- | --
Created @ | `2019-01-17T07:02:03Z`
Updated @| `2026-11-11T09:36:30Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/31)

---
# ImageNet

ImageNet 是按 WordNet 名词层级（synset）组织的大规模图像数据库，由斯坦福大学李飞飞（Fei-Fei Li）团队等发布（CVPR 2009），是推动深度学习兴起的标志性数据集。每年的 ILSVRC（ImageNet Large Scale Visual Recognition Challenge，2010–2017）使用其 1000 类子集，AlexNet（2012）即在此取得突破。所属分类汇总见 [Classification](0028_Datasets_Image2D_Classification)。

## 版本与规模

版本 | 说明 | 规模
-- | -- | --
ImageNet-1k（ILSVRC-2012） | 竞赛使用的 1000 类子集，[类别列表](http://www.image-net.org/challenges/LSVRC/2017/browse-synsets) | 约 128 万训练图（每类约 732–1300 张）、5 万验证图（每类 50）、10 万测试图（无公开标签）、1000 类（待核实）
ImageNet-21k | 完整版，2 万余个子类（synset） | 约 1,400 万张图像、21,841 类（待核实）
ImageNet-22k | 部分论文对完整版的称呼，与 21k 的区分以所引论文为准 | 约 1,400 万张（待核实）

> 原文把 21k 与 22k 并列为不同子类集合；二者通常指完整 ImageNet 的不同清理/版本，具体请以所引论文为准。ILSVRC 另提供目标定位/检测标注（本站未展开）。

图像尺寸不固定，平均约 400×350；训练常 resize/crop 到 224×224。ILSVRC-2012 训练集压缩包约 138 GB（待核实）。

## 下载与许可

需到官网注册并同意使用条款（仅限非商业研究/教育用途），ImageNet 不拥有图像版权：<https://www.image-net.org/>。Kaggle 亦提供 ILSVRC 竞赛版下载。

## 目录结构与加载

常见整理方式（每类一个以 synset id 命名的文件夹）：

```
train/
  n01440764/ xxx.JPEG ...
  n01443537/ ...
val/
  n01440764/ ...   # 官方验证集是平铺的，需用标签文件整理到类目录
```

```python
import torchvision.transforms as T
from torchvision.datasets import ImageFolder   # 或 datasets.ImageNet(root, split="train")

tf = T.Compose([T.RandomResizedCrop(224), T.RandomHorizontalFlip(), T.ToTensor(),
                T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])])
train = ImageFolder("imagenet/train", transform=tf)
```

`torchvision.datasets.ImageNet` 需要事先手动下载好 ILSVRC2012 的 tar 包与 devkit。

## 评测与基线

- 指标：Top-1 / Top-5 准确率（或错误率）。
- 常见基线（单模型 Top-1，约值，待核实）：AlexNet 约 56–57%，ResNet-50 约 76%（torchvision 新权重约 80%），后续 ViT / ConvNeXt 等可达 85% 以上。

## 常见坑

- 数据极大，训练 IO 常是瓶颈，可用 LMDB / WebDataset / DALI。
- 官方验证集不分文件夹，需要 devkit 的标签映射。
- 少数训练图是 CMYK 或 PNG 伪装的 JPEG，读取时统一 convert("RGB")。
- 类别顺序按 synset id 排序，不要自行打乱。
- ImageNet-1k 标签存在噪声，ImageNet-ReaL、ImageNet-V2 等是常用的重标注/复现测试集。

## 相关

- [Classification 汇总](0028_Datasets_Image2D_Classification)、[CIFAR](0032_Datasets_Image2D_Classification_Cifar)、[MNIST](0030_Datasets_Image2D_Classification_mnist)
- 总入口：[Datasets Image2D](0018_Datasets_Image2D)

## Reference
- [ImageNet Websit](http://www.image-net.org/index)
- 2009  ImageNet: A Large-Scale Hierarchical Image Database`@CVPR` [[Paper](http://www.image-net.org/static_files/papers/imagenet_cvpr09.pdf)] 
- 2014 ImageNet Large Scale Visual Recognition Challenge [[Paper](https://arxiv.org/abs/1409.0575)]

