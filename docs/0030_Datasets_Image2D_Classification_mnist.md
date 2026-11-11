---
Title | Datasets Image2D Classification mnist
-- | --
Created @ | `2019-01-18T18:36:57Z`
Updated @| `2026-11-11T09:36:28Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/30)

---
# MNIST

MNIST（Modified NIST）是 Yann LeCun 等人基于美国国家标准与技术研究所（NIST）的手写数字库 SD-1 / SD-3 重新混合、归一化得到的手写数字数据集。训练集来自约 250 位书写者，其中一部分是高中学生，一部分是人口普查局（Census Bureau）工作人员；测试集的书写者与训练集互不重叠。它是深度学习最经典的入门数据集。所属分类汇总见 [Classification](0028_Datasets_Image2D_Classification)。

## 规模统计

项目 | 数值
-- | --
图像数 | 70,000（训练 60,000 + 测试 10,000）
类别数 | 10（数字 0–9）
分辨率 | 28×28，单通道灰度，uint8
文件大小 | 训练图 9.9 MB（解压 47 MB）、测试图 1.6 MB（解压 7.8 MB）

## 样例

<img width="300px" src="https://user-images.githubusercontent.com/2216970/51413058-95037c00-1ba8-11e9-9153-c5f0764f8e42.png">
<img width="300px" src="https://user-images.githubusercontent.com/2216970/179348954-f84fb28d-8784-4421-8e3a-f87481fdd1db.png">

## 下载

Datasets | Description | Images
-- | -- | --
[train-images-idx3-ubyte.gz](https://github.com/junxnone/junxnone.github.io/files/2774597/train-images-idx3-ubyte.gz) | Training images (9.9 MB, 解压后 47 MB) | 60000
[train-labels-idx1-ubyte.gz](https://github.com/junxnone/junxnone.github.io/files/2774598/train-labels-idx1-ubyte.gz) | Training labels (29 KB, 解压后 60 KB) | 60000
[t10k-images-idx3-ubyte.gz](https://github.com/junxnone/junxnone.github.io/files/2774599/train-images-idx3-ubyte.gz) | Test images (1.6 MB, 解压后 7.8 MB) | 10000
[t10k-labels-idx1-ubyte.gz](https://github.com/junxnone/junxnone.github.io/files/2774601/t10k-labels-idx1-ubyte.gz) | Test labels (5 KB, 解压后 10 KB) | 10000

> 原文第三行文件名误写为 train-images-idx3-ubyte.gz，已更正为 t10k-images-idx3-ubyte.gz（链接 URL 保持原样）。官方站点 yann.lecun.com/exdb/mnist 有时无法访问，可改用 torchvision 自带镜像下载。许可：官方未明确声明，通常按 CC BY-SA 3.0 使用（待核实）。

## 文件格式（IDX）

- 数据保存在二进制文件中，所有整数为 MSB first（大端，高位在前）。
- 图像宽高为 28×28。

TRAINING SET LABEL FILE (train-labels-idx1-ubyte):
```
[offset] [type]          [value]          [description] 
0000     32 bit integer  0x00000801(2049) magic number (MSB first) 
0004     32 bit integer  60000            number of items 
0008     unsigned byte   ??               label 
0009     unsigned byte   ??               label 
........ 
xxxx     unsigned byte   ??               label
The labels values are 0 to 9.
```
TRAINING SET IMAGE FILE (train-images-idx3-ubyte):
```
[offset] [type]          [value]          [description] 
0000     32 bit integer  0x00000803(2051) magic number 
0004     32 bit integer  60000            number of images 
0008     32 bit integer  28               number of rows 
0012     32 bit integer  28               number of columns 
0016     unsigned byte   ??               pixel 
0017     unsigned byte   ??               pixel 
........ 
xxxx     unsigned byte   ??               pixel
```
像素取值 0–255，0 为背景，255 为前景（笔画）。

## 解析与加载代码

```python
import gzip, numpy as np

def load_images(path):
    with gzip.open(path, "rb") as f:
        data = np.frombuffer(f.read(), np.uint8, offset=16)
    return data.reshape(-1, 28, 28)

def load_labels(path):
    with gzip.open(path, "rb") as f:
        return np.frombuffer(f.read(), np.uint8, offset=8)
```

torchvision：

```python
from torchvision import datasets, transforms
tf = transforms.Compose([transforms.ToTensor(),
                         transforms.Normalize((0.1307,), (0.3081,))])
train = datasets.MNIST("data", train=True, download=True, transform=tf)
test = datasets.MNIST("data", train=False, transform=tf)
```

## 评测与基线

- 指标：分类准确率 / 错误率。
- 基线：线性分类器错误率约 7–8%，普通 CNN 可达 99% 以上，最好的集成模型错误率约 0.2% 以下（待核实）。

## 常见坑

- 单通道，输入 CNN 时需加通道维 (N,1,28,28)；预训练 RGB 模型需复制为 3 通道并 resize。
- 均值 0.1307 / 标准差 0.3081 是常用归一化参数。
- 数据集已非常"饱和"，不适合评判新方法的真实泛化能力，建议配合 Fashion-MNIST 或 CIFAR。

## 相关

- [Classification 汇总](0028_Datasets_Image2D_Classification)、[CIFAR](0032_Datasets_Image2D_Classification_Cifar)、[ImageNet](0031_Datasets_Image2D_Classification_ImageNet)
- 衍生：[Fashion-MNIST](https://github.com/zalandoresearch/fashion-mnist)
- 总入口：[Datasets Image2D](0018_Datasets_Image2D)

## Reference
- [mnist dataset](http://yann.lecun.com/exdb/mnist/)
- [Image Classification on MNIST - paperswithcode](https://paperswithcode.com/sota/image-classification-on-mnist?metric=Accuracy)

