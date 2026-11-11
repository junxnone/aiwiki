---
Title | Datasets Image2D Classification Cifar
-- | --
Created @ | `2018-08-29T09:54:48Z`
Updated @| `2026-11-11T09:36:32Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/32)

---
# CIFAR

CIFAR-10 / CIFAR-100 是 [80 Million Tiny Images](http://groups.csail.mit.edu/vision/TinyImages/) 的带标签子集，由 Alex Krizhevsky、Vinod Nair、Geoffrey Hinton 收集标注，名称来自资助机构加拿大高级研究所（Canadian Institute for Advanced Research, CIFAR）。是小规模彩色图像分类最常用的基准。所属分类汇总见 [Classification](0028_Datasets_Image2D_Classification)。

## 规模统计

项目 | CIFAR-10 | CIFAR-100
-- | -- | --
图像数 | 60,000 | 60,000
分辨率 | 32×32 RGB | 32×32 RGB
类别数 | 10 | 100 细类（fine）/ 20 超类（coarse）
每类图像 | 6,000 | 600
划分 | 50,000 训练 + 10,000 测试 | 每类 500 训练 + 100 测试
Python 版压缩包 | 约 163 MB（待核实） | 约 161 MB（待核实）

CIFAR-10 的 10 类：airplane、automobile、bird、cat、deer、dog、frog、horse、ship、truck；类别互斥（automobile 为轿车类，truck 为大卡车，不含 pickup）。

## CIFAR-10 样例

![image](https://user-images.githubusercontent.com/2216970/71060657-07a61e80-21a1-11ea-993f-994add906177.png)

## CIFAR-100 超类与子类

20 个超类细分为 100 个子类（统计见上表）；标签中 `fine` 指子类，`coarse` 指父类，各超类下的子类如下：

Superclass | Classes
-- | --
aquatic mammals | beaver, dolphin, otter, seal, whale
fish | aquarium fish, flatfish, ray, shark, trout
flowers | orchids, poppies, roses, sunflowers, tulips
food containers | bottles, bowls, cans, cups, plates
fruit and vegetables | apples, mushrooms, oranges, pears, sweet peppers
household electrical devices | clock, computer keyboard, lamp, telephone, television
household furniture | bed, chair, couch, table, wardrobe
insects | bee, beetle, butterfly, caterpillar, cockroach
large carnivores | bear, leopard, lion, tiger, wolf
large man-made outdoor things | bridge, castle, house, road, skyscraper
large natural outdoor scenes | cloud, forest, mountain, plain, sea
large omnivores and herbivores | camel, cattle, chimpanzee, elephant, kangaroo
medium-sized mammals | fox, porcupine, possum, raccoon, skunk
non-insect invertebrates | crab, lobster, snail, spider, worm
people | baby, boy, girl, man, woman
reptiles | crocodile, dinosaur, lizard, snake, turtle
small mammals | hamster, mouse, rabbit, shrew, squirrel
trees | maple, oak, palm, pine, willow
vehicles 1 | bicycle, bus, motorcycle, pickup truck, train
vehicles 2 | lawn-mower, rocket, streetcar, tank, tractor

## 目录结构与解析

Python 版（pickle）：

```
cifar-10-batches-py/
  data_batch_1 ... data_batch_5   # 各 10,000 张
  test_batch
  batches.meta                    # label_names
cifar-100-python/
  train, test, meta               # 键：data, fine_labels, coarse_labels
```

```python
import pickle, numpy as np
with open("cifar-10-batches-py/data_batch_1", "rb") as f:
    d = pickle.load(f, encoding="bytes")
X = d[b"data"].reshape(-1, 3, 32, 32).transpose(0, 2, 3, 1)  # N,H,W,C
y = d[b"labels"]
```

data 为 uint8 的 N×3072 数组，按 R(1024)、G(1024)、B(1024) 行优先排列。

torchvision：

```python
from torchvision import datasets, transforms
tf = transforms.Compose([transforms.ToTensor(),
     transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2470, 0.2435, 0.2616))])
train = datasets.CIFAR10("data", train=True, download=True, transform=tf)
train100 = datasets.CIFAR100("data", train=True, download=True, transform=tf)
```

## 下载与许可

官网 <http://www.cs.toronto.edu/~kriz/cifar.html> 提供 Python / Matlab / Binary 三种版本；官方要求引用技术报告 "Learning Multiple Layers of Features from Tiny Images"（2009）；未声明开源许可，用于研究。

## 评测与基线

- 指标：Top-1 准确率（错误率）。
- 常见水平（约值，待核实）：简单 CNN 约 75–80%；ResNet 系列在 CIFAR-10 约 93–95%；配合强数据增强/预训练的新模型 CIFAR-10 可到 99% 左右，CIFAR-100 通常低 5–15 个点。

## 常见坑

- 使用 tensorflow keras api `tensorflow.keras.datasets.cifar10.load_data()` 下载数据集时特别慢：手动下载数据集，并复制为 `~/.keras/datasets/cifar-10-batches-py.tar.gz`。
- Python 版 pickle 的键是 bytes（b"data"、b"labels"），需 `encoding="bytes"`。
- 展平顺序是通道优先（CHW），直接 reshape 成 32×32×3 会花屏。
- 图像仅 32×32，直接喂 ImageNet 预训练模型需 resize 到 224。
- 测试集中存在少量重复/近重复图像（待核实），严格评测可参考 CIFAR-10.1 等复现测试集。

## 相关

- [Classification 汇总](0028_Datasets_Image2D_Classification)、[MNIST](0030_Datasets_Image2D_Classification_mnist)、[ImageNet](0031_Datasets_Image2D_Classification_ImageNet)
- 总入口：[Datasets Image2D](0018_Datasets_Image2D)

## Reference
- [CIFAR Dataset](http://www.cs.toronto.edu/~kriz/cifar.html)
  - [cifar10 in github - YoongiKim](https://github.com/YoongiKim/CIFAR-10-images)
- keras classification sample code
  - [cifar10_cnn.py](https://github.com/keras-team/keras/blob/master/examples/cifar10_cnn.py)
  - [cifar10_cnn_tfaugment2d.py](https://github.com/keras-team/keras/blob/master/examples/cifar10_cnn_tfaugment2d.py)
- [pytorch tutorial cifar10 classification](https://pytorch.apachecn.org/docs/1.2/beginner/blitz/cifar10_tutorial.html)
  - [pytorch colab notebook](https://colab.research.google.com/github/pytorch/tutorials/blob/gh-pages/_downloads/cifar10_tutorial.ipynb)

