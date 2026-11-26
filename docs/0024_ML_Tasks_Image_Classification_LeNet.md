---
Title | ML Tasks Image Classification LeNet
-- | --
Created @ | `2019-06-11T12:59:17Z`
Updated @| `2026-11-26T03:29:32Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/24)

---
# LeNet

- LeNet诞生于1998年, 第一个卷积神经网络
- 包含卷积/池化/全连接等Layers
  - 卷积核用 5x5
  - 池化使用 2x2

**解决的问题**
- 感知机全连接网络参数多, 卷积网络可以有效降低参数量
  - 图像数据量较大，单个像素输入独立神经元中，需要很大的网络结构，训练参数过多
- 图像的形变，形变引起的图像特征位置变化的问题
- 卷积网络引入**局部感受野**使图像局部关联
- **共享权值** - 卷积层中神经元对应权值共享
- **池化** - 图像信息压缩可以减少计算量

## Arch

![image](https://user-images.githubusercontent.com/2216970/59274688-6e47fe00-8c8d-11e9-8160-c69e2acce7b3.png)

Layer Name | Input | Operation | Output(Feature Map) | Comment
-- | -- | -- | -- | --
Input | 32x32x1 |
卷积 | 32x32x1 | 5x5x6 kernel | C1`@28x28x6` | 
池化 | 28x28x6 | 2x2 | S2`@14x14x6` | 
卷积 | 14x14x6 | 5x5x16 | C3`@10x10x16`
池化 | 10x10x16 | 2x2 | S4`@5x5x16`
卷积 | 5x5x16 | 5x5x120 | C5 `@1x1x120`
全连接 | 1x1x120 | 84 | F6`@1x1x84`
全连接 | 1x1x84 | 10 | Output`@1x1x10`

## 参数量&计算量计算

```
----------------------------------------------------------------
        Layer (type)               Output Shape         Param #
================================================================
            Conv2d-1            [-1, 6, 28, 28]             156
              ReLU-2            [-1, 6, 28, 28]               0
         MaxPool2d-3            [-1, 6, 14, 14]               0
                C1-4            [-1, 6, 14, 14]               0
            Conv2d-5           [-1, 16, 10, 10]           2,416
              ReLU-6           [-1, 16, 10, 10]               0
         MaxPool2d-7             [-1, 16, 5, 5]               0
                C2-8             [-1, 16, 5, 5]               0
            Conv2d-9           [-1, 16, 10, 10]           2,416
             ReLU-10           [-1, 16, 10, 10]               0
        MaxPool2d-11             [-1, 16, 5, 5]               0
               C2-12             [-1, 16, 5, 5]               0
           Conv2d-13            [-1, 120, 1, 1]          48,120
             ReLU-14            [-1, 120, 1, 1]               0
               C3-15            [-1, 120, 1, 1]               0
           Linear-16                   [-1, 84]          10,164
             ReLU-17                   [-1, 84]               0
               F4-18                   [-1, 84]               0
           Linear-19                   [-1, 10]             850
       LogSoftmax-20                   [-1, 10]               0
               F5-21                   [-1, 10]               0
================================================================
Total params: 64,122
Trainable params: 64,122
Non-trainable params: 0
----------------------------------------------------------------
Input size (MB): 0.00
Forward/backward pass size (MB): 0.16
Params size (MB): 0.24
Estimated Total Size (MB): 0.40
----------------------------------------------------------------
```
> params calcluate by [torchsummary](https://github.com/sksq96/pytorch-summary)
```
+input = torch.randn(1, 1, 32, 32)
+macs, params = thop.profile(net, inputs=(input, ))
```
```
macs is 664544.0, params is 64122.0
```
> Flops calculate by [thop](https://github.com/Lyken17/pytorch-OpCounter/)


## 后续发展

![image](https://user-images.githubusercontent.com/2216970/59273651-4a83b880-8c8b-11e9-9386-e4222f87000a.png)



## 输出尺寸与参数量公式

卷积和池化层输出尺寸：

$$
W_{out}=\left\lfloor\frac{W_{in}-K+2P}{S}\right\rfloor+1
$$

其中：

- $W_{in},W_{out}$：输入、输出特征图的边长 (宽/高同理)
- $K$：卷积核或池化窗口边长，LeNet 中卷积为 $5$，池化为 $2$
- $P$：补零圈数 (padding)，LeNet 中为 $0$；$S$：步长 (stride)，卷积为 $1$，池化为 $2$
- $\lfloor\cdot\rfloor$：向下取整

例：$32\to(32-5)/1+1=28$（C1），池化 $28\to(28-2)/2+1=14$（S2）。

卷积层、全连接层的参数量与乘加次数 (MACs)：

$$
\text{Params}_{conv}=(K_hK_wC_{in}+1)\,C_{out},\qquad
\text{MACs}_{conv}=H_{out}W_{out}\,K_hK_wC_{in}C_{out}
$$

$$
\text{Params}_{fc}=(N_{in}+1)\,N_{out}
$$

其中：

- $K_h,K_w$：卷积核高、宽；$C_{in},C_{out}$：输入、输出通道数
- $+1$：每个输出通道（神经元）一个偏置
- $H_{out},W_{out}$：输出特征图尺寸；每个输出位置、每个输出通道要做 $K_hK_wC_{in}$ 次乘加
- $N_{in},N_{out}$：全连接层输入、输出神经元数

## 逐层计算与核对

层 | 参数量计算 | 参数量 | MACs 计算 | MACs
-- | -- | -- | -- | --
C1 卷积 | $(5\times5\times1+1)\times6$ | 156 | $28\times28\times25\times6$ | 117,600
S2 池化 | 无参数 | 0 | - | -
C3 卷积 | $(5\times5\times6+1)\times16$ | 2,416 | $10\times10\times150\times16$ | 240,000
S4 池化 | 无参数 | 0 | - | -
C5 卷积 | $(5\times5\times16+1)\times120$ | 48,120 | $1\times1\times400\times120$ | 48,000
F6 全连接 | $(120+1)\times84$ | 10,164 | $120\times84$ | 10,080
Output 全连接 | $(84+1)\times10$ | 850 | $84\times10$ | 840
合计 | | **61,706** | | **416,520**

表中：每一行把上面的公式代入该层的尺寸；池化层只做下采样，没有可学习参数。这里 C3 采用的是和后续网络一致的全连接通道连接 (每个输出通道连到全部 6 个输入通道)，原论文的 C3 为减少参数使用部分连接表，参数更少 (约 1,516)。

> 注意：上面 torchsummary 输出里 `Conv2d-9` 与 `Conv2d-5` 是同一尺寸的重复层，使 `Total params` 被多算了一次 2,416，得到 64,122；扣除后为 $64{,}122-2{,}416=61{,}706$，与逐层计算一致。thop 的 `macs=664,544` 同样包含了这个重复卷积 (多出 240,000)，并含有激活和池化等的少量统计。

## 设计要点

- 局部感受野：每个神经元只看输入的一小块区域，参数从全连接的 $32\times32\times\cdots$ 降为 $5\times5$ 的核
- 权值共享：同一个卷积核在整张图上滑动，C1 只有 $156$ 个参数就能提取 6 张特征图；同一特征在不同位置都能被检测，对平移更稳健
- 池化：下采样降低分辨率，一方面减少计算，另一方面让特征对小的位移和形变不敏感
- 整体趋势：越深的层，空间尺寸越小 ($32\to28\to14\to10\to5\to1$)，通道数越多 ($1\to6\to16\to120$)，这一「尺寸减半、通道翻倍」的模式在后续 [AlexNet](/0027_ML_Tasks_Image_Classification_AlexNet)、[VGGNet](/0146_ML_Tasks_Image_Classification_VGGNet) 中延续

## 最小实现

```python
import torch.nn as nn
lenet = nn.Sequential(
    nn.Conv2d(1, 6, 5), nn.ReLU(), nn.MaxPool2d(2),        # C1, S2: 32 -> 28 -> 14
    nn.Conv2d(6, 16, 5), nn.ReLU(), nn.MaxPool2d(2),       # C3, S4: 14 -> 10 -> 5
    nn.Conv2d(16, 120, 5), nn.ReLU(), nn.Flatten(),        # C5: 5 -> 1
    nn.Linear(120, 84), nn.ReLU(), nn.Linear(84, 10))      # F6, Output
```

- 原论文使用 tanh/sigmoid 激活和平均池化，现代实现多用 ReLU 和最大池化，结构不变
- 总参数 $61{,}706$，约 $0.24\text{ MB}$ (float32)，在 MNIST 上可达到约 99% 的准确率 `[经验]`

## Reference
- 1998 **LeNet** Gradient-Based Learning Applied to Document Recognition [[paper](http://yann.lecun.com/exdb/publis/pdf/lecun-01a.pdf)] [[code](https://github.com/junxnone/LeNet-5/blob/master/lenet.py#L5-L74)]
- [卷积神经网络之LeNet](https://www.cnblogs.com/wangguchangqing/p/10329402.html)
- [卷积神经网络-进化史-从LeNet到AlexNet](https://zhuanlan.zhihu.com/p/21562756)
- [神经网络的发展历史](https://blog.csdn.net/qq_30460949/article/details/100101983)

