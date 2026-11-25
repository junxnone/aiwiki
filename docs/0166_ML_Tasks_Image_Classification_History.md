---
Title | ML Tasks Image Classification History
-- | --
Created @ | `2021-07-05T06:05:05Z`
Updated @| `2026-11-25T16:51:24Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/166)

---
## History

分类网络演进的时间线，每一项给出论文和本站笔记。

**Pattern**
```
- 2020-05 **[Name]** paper_full_name [[Paper](paperlink)] [[Code](codelink)] [[Note](notelink)] #tags
```

- 1998 **[LeNet]** Gradient-Based Learning Applied to Document Recognition [[Paper](http://yann.lecun.com/exdb/publis/pdf/lecun-01a.pdf)] [[Note](/0024_ML_Tasks_Image_Classification_LeNet)] #cnn
- 2012 **[AlexNet]** ImageNet Classification with Deep Convolutional Neural Networks [[Paper](http://www.cs.toronto.edu/~fritz/absps/imagenet.pdf)] [[Note](/0027_ML_Tasks_Image_Classification_AlexNet)] #deep
- 2014 **[VGG]** Very Deep Convolutional Networks for Large-Scale Image Recognition [[Paper](https://arxiv.org/abs/1409.1556)] [[Note](/0146_ML_Tasks_Image_Classification_VGGNet)] #deep
- 2014 **[GoogLeNet - Inception]** Going deeper with convolutions [[Paper](https://arxiv.org/pdf/1409.4842v1.pdf)] [[Note](/0048_ML_Tasks_Image_Classification_Inception_V1)] #multi-scale
- 2015 **[Inception V2/V3]** Rethinking the Inception Architecture for Computer Vision [[Paper](https://arxiv.org/abs/1512.00567)] [[Note](/0046_ML_Tasks_Image_Classification_Inception_V2V3)] #factorization
- 2015 **[ResNet]** Deep Residual Learning for Image Recognition [[Paper](https://arxiv.org/abs/1512.03385)] [[Note](/0051_ML_Tasks_Image_Classification_ResNet)] #residual
- 2016 **[Inception V4 / Inception-ResNet]** Inception-v4, Inception-ResNet and the Impact of Residual Connections on Learning [[Paper](https://arxiv.org/abs/1602.07261)] [[Note](/0047_ML_Tasks_Image_Classification_Inception_V4)] #residual
- 2016 **[Xception]** Xception: Deep Learning with Depthwise Separable Convolutions [[Paper](https://arxiv.org/abs/1610.02357)] [[Note](/0050_ML_Tasks_Image_Classification_Xception)] #separable
- 2017 **[MobileNet V1]** MobileNets: Efficient Convolutional Neural Networks for Mobile Vision Applications [[Paper](https://arxiv.org/abs/1704.04861)] [[Note](/0042_ML_Tasks_Image_Classification_MobileNet_V1)] #lightweight
- 2017 **[SENet]** Squeeze-and-Excitation Networks [[Paper](https://arxiv.org/abs/1709.01507)] #attention
- 2018 **[MobileNet V2]** MobileNetV2: Inverted Residuals and Linear Bottlenecks [[Paper](https://arxiv.org/abs/1801.04381)] [[Note](/0043_ML_Tasks_Image_Classification_MobileNet_V2)] #lightweight
- 2019 **[MobileNet V3]** Searching for MobileNetV3 [[Paper](https://arxiv.org/abs/1905.02244)] [[Note](/0044_ML_Tasks_Image_Classification_MobileNet_V3)] #nas

## 各阶段的主要问题

阶段 | 代表 | 要解决的问题 | 方案
-- | -- | -- | --
卷积网络起步 | LeNet | 全连接参数太多，对平移敏感 | 局部连接、权值共享、池化
深度学习兴起 | AlexNet | 大数据上训练大网络 | ReLU、Dropout、GPU
更深更宽 | VGG、Inception | 如何有效利用参数和计算 | 小卷积堆叠；多尺度并行 + $1\times1$ 降维
训练极深网络 | ResNet | 网络变深后退化 | 残差连接
轻量化 | Xception、MobileNet | 手机端的算力限制 | 深度可分离卷积、倒残差、NAS

表中：每一行是一个阶段，`要解决的问题` 是该阶段的瓶颈，`方案` 是代表性的做法。可以对照 [Classification](/0061_ML_Tasks_Image_Classification) 里的演进图阅读。

## Sub-Domain

- 所有分类网络的总览：[Classification](/0061_ML_Tasks_Image_Classification)

