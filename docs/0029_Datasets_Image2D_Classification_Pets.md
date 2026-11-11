---
Title | Datasets Image2D Classification Pets
-- | --
Created @ | `2019-01-24T20:39:23Z`
Updated @| `2026-11-11T09:36:26Z`
Labels | `index`
Edit @| [here](https://github.com/junxnone/aiwiki/issues/29)

---
# Oxford-IIIT Pets

Oxford-IIIT Pet Dataset 由英国牛津大学视觉几何组（Visual Geometry Group, VGG）与印度 IIIT Hyderabad 合作收集整理，论文为 Parkhi 等人 "Cats and Dogs"（CVPR 2012）。它是一个细粒度宠物品种分类数据集，同时提供头部框和像素级前景分割标注，常用于分类、迁移学习、检测与分割的小规模实验。所属分类汇总见 [Classification](0028_Datasets_Image2D_Classification)。

## 规模统计

项目 | 数值
-- | --
类别数 | 37（12 种猫 + 25 种狗）
每类图像数 | 约 200 张
总图像数 | 约 7,349 张（待核实）
图像尺寸 | 不固定，各图大小、姿态、光照差异较大
标注 | 品种+物种标签、头部 ROI 框（PASCAL VOC 格式 XML）、trimap 分割
官方划分 | trainval.txt / test.txt（也可自行随机划分）

![image](https://user-images.githubusercontent.com/2216970/51708550-21a5b280-205f-11e9-8ed9-53a57697c308.png)

## 下载与许可

```
wget http://www.robots.ox.ac.uk/~vgg/data/pets/data/images.tar.gz
wget http://www.robots.ox.ac.uk/~vgg/data/pets/data/annotations.tar.gz
```

许可方面：官网标注为 Creative Commons Attribution-ShareAlike 4.0（待核实），图像来自 Flickr/Google/Catster/Dogster 等，使用前请查看官网说明。

## 目录结构与标注格式

```
images/         全部 jpg 图像
annotations/
  trimaps/      每张图的 trimap 标注（png）
                像素值 1: 前景  2: 背景  3: 未分类（边界）
  xmls/         头部边界框，PASCAL VOC 格式（部分图像没有 xml）
  list.txt      全部图像列表
  trainval.txt  论文使用的划分，
  test.txt      也鼓励自行随机划分
```

list.txt 每行格式为 `Image CLASS-ID SPECIES BREED-ID`：

- CLASS-ID：1–37 的类别 id
- SPECIES：1 = Cat，2 = Dog
- BREED-ID：猫品种 1–12，狗品种 1–25（原文把两者写反，已修正）
- 文件名首字母大写为猫，小写为狗

![image](https://user-images.githubusercontent.com/2216970/51707690-cb377480-205c-11e9-8ed9-53a57697c308.png)

```
             (a)                          (b)                        (c)
```

- (a) 品种名；
- (b) 动物头部的紧致包围框（ROI）；
- (c) 像素级前景-背景分割（Trimap）。

示例：

```
german_shorthaired_9 15 2 9
 |                    | | |— BREED ID
 |                    | |— SPECIES: 1:Cat 2:Dog
 |                    |— CLASS ID
 |— 图像名（小写开头 → 狗）
```
> 德国短毛指示犬（German Shorthaired Pointer）

解析 list.txt 示例：

```python
rows = [l.split() for l in open("annotations/list.txt") if not l.startswith("#")]
for name, cid, species, breed in rows[:3]:
    print(name, int(cid) - 1, "cat" if species == "1" else "dog")
```

## PyTorch / torchvision 加载

```python
from torchvision.datasets import OxfordIIITPet

# target_types: "category"（37 类）/ "binary-category"（猫/狗）/ "segmentation"
ds = OxfordIIITPet(root="data", split="trainval",
                   target_types="category", download=True)
img, label = ds[0]
```

## 评测与基线

- 分类：Top-1 准确率；在 ImageNet 预训练模型上微调通常可达 90% 以上（待核实具体数值）。
- 分割：mIoU / 前景像素准确率；检测：头部框 AP（需自行选择模型与协议）。

## 常见坑

- 少数图像不是标准 RGB（如灰度、RGBA）或缺少 xml 标注，读取时需统一转换为 RGB 并做缺失判断。
- 类别 id 从 1 开始，训练时需减 1。
- 猫狗判断依赖文件名首字母大小写，不要对文件名做 lower() 后再判断。
- trimap 为 1/2/3，需要映射为 0/1/2 才能用于交叉熵。

## 相关

- [Classification 汇总](0028_Datasets_Image2D_Classification)、[CIFAR](0032_Datasets_Image2D_Classification_Cifar)、[ImageNet](0031_Datasets_Image2D_Classification_ImageNet)
- 纹理/细粒度：[DTD](0481_Datasets_Image2D_DTD)
- 总入口：[Datasets Image2D](0018_Datasets_Image2D)

## Reference
- [dataset](http://www.robots.ox.ac.uk/~vgg/data/pets/)
- [convert to tfrecord python script](https://github.com/tensorflow/models/blob/master/research/object_detection/dataset_tools/create_pet_tf_record.py)

