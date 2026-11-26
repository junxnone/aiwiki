-----

| Title     | ML Tasks Image Classification DenseNet                |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T01:28:13Z`                                |
| Updated @ | `2026-11-26T01:30:05Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/799) |

-----

# DenseNet

DenseNet (Densely Connected Convolutional Networks，CVPR 2017
最佳论文)：每一层都与前面所有层直接相连，通过特征拼接实现特征复用，用更少的参数得到不错的精度。

## 稠密连接

下图以一个 4 层的稠密块说明连接方式，对比
[ResNet](/0051_ML_Tasks_Image_Classification_ResNet) 的「相加」，DenseNet
是「拼接」：

``` mermaid
flowchart LR
    x0[x0] --> H1[H1] --> x1[x1]
    x0 --> H2
    x1 --> H2[H2] --> x2[x2]
    x0 --> H3
    x1 --> H3
    x2 --> H3[H3] --> x3[x3]
    x0 --> H4
    x1 --> H4
    x2 --> H4
    x3 --> H4[H4] --> x4[x4]
```

图中：

  - $x\_0$ 是块的输入，$H\_l$ 是第 $l$ 层的运算 (BN-ReLU-Conv)，$x\_l$ 是它的输出
  - 每个 $H\_l$ 的输入是前面所有层输出的拼接，所以第 $l$ 层有 $l$ 条输入连接；$L$ 层的块共有 $L(L+1)/2$
    条连接，而不是传统网络的 $L$ 条

$$ x\_l=H\_l\\bigl(\[x\_0,x\_1,\\dots,x\_{l-1}\]\\bigr),\\qquad
C\_l=C\_0+k,(l-1) $$

其中：

  - $\[\\cdot\]$：在通道维拼接；$H\_l$：BN → ReLU → $3\\times3$ 卷积的复合函数，输出 $k$
    个通道
  - $k$：增长率 (growth rate)，每层新增的通道数，DenseNet 取很小的值 (如
    $12$、$32$)，因为每层都能直接访问前面所有的特征，不需要每层产生很多通道
  - $C\_0$：块输入的通道数；$C\_l$：第 $l$ 层的输入通道数，随层数线性增长
  - 好处：梯度可以直接传到浅层 (缓解梯度消失)，特征被复用而不是重复学习，参数更少

## 结构组成

  - Bottleneck ($\\text{DenseNet-B}$)：每个 $3\\times3$ 卷积前加 $1\\times1$
    卷积，把输入压缩到 $4k$ 个通道，降低计算量
  - Transition 层：块与块之间用 BN + $1\\times1$ 卷积 + $2\\times2$
    平均池化，把通道数乘以压缩系数 $\\theta$
    ($\\theta=0.5$，称 DenseNet-C，两者都用则为 DenseNet-BC)，并缩小特征图
  - 块内特征图尺寸不变 (这样才能拼接)，块间通过 Transition 下采样

| 模型           | 各稠密块的层数          | 增长率 $k$ | 参数量      | ImageNet top-1 (torchvision 参考) `[待核实]` |
| ------------ | ---------------- | ------- | -------- | --------------------------------------- |
| DenseNet-121 | $\[6,12,24,16\]$ | 32      | 约 8.0 M  | 约 74.4%                                 |
| DenseNet-169 | $\[6,12,32,32\]$ | 32      | 约 14.1 M | 约 75.6%                                 |
| DenseNet-201 | $\[6,12,48,32\]$ | 32      | 约 20.0 M | 约 76.9%                                 |

表中：121 的层数 = 首个卷积 + 末尾全连接 + 各块的 $2\\times$层数 (bottleneck 里有两个卷积) 之和再加
Transition 层数 ($1+(6+12+24+16)\\times2+3+1=121$)。参数量只有同精度
[ResNet](/0051_ML_Tasks_Image_Classification_ResNet)
的约三分之一到二分之一，但计算量并不低。

## 与 ResNet 的对比

| 维度   | ResNet       | DenseNet                      |
| ---- | ------------ | ----------------------------- |
| 连接方式 | 相加 $x+F(x)$  | 拼接 $\[x\_0,\\dots,x\_{l-1}\]$ |
| 特征复用 | 隐式 (信息被相加混合) | 显式 (所有旧特征都保留)                 |
| 参数量  | 较多           | 较少                            |
| 显存   | 较低           | 较高 (拼接产生大量中间特征)，需要共享内存的实现缓解   |

表中：DenseNet 参数少但训练时显存占用高，因为每层的拼接特征都要保存用于反向传播；实际部署时稠密连接的访存开销也使推理速度未必快。

## 小结

  - 特征复用的思路影响了后来的很多网络 (如检测里的 PAN、分割里的 UNet++)；稠密连接在医学分割等小数据任务上表现不错
  - 轻量化与效率更优的设计见
    [MobileNet](/0045_ML_Tasks_Image_Classification_MobileNet)、[EfficientNet](/0801_ML_Tasks_Image_Classification_EfficientNet)

## Reference

  - [Densely Connected Convolutional Networks - Huang et al.,
    CVPR 2017](https://arxiv.org/abs/1608.06993)
  - [Memory-Efficient Implementation of
    DenseNets](https://arxiv.org/abs/1707.06990)
