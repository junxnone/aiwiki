---
Title | UNet
-- | --
Create Date | `2018-12-26T18:37:24Z`
Update Date | `2022-01-19T07:51:48Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/161)

---
## Reference

- [官方实现Github - caffe](https://github.com/lmb-freiburg/Unet-Segmentation)
- [Github repo - keras - zhixuhao](https://github.com/zhixuhao/unet)
- [image-segmentation-keras](https://github.com/divamgupta/image-segmentation-keras)
- [U-Net: Convolutional Networks for Biomedical Image Segmentation](https://lmb.informatik.uni-freiburg.de/people/ronneber/u-net/)
- [isbi_challenge](http://brainiac2.mit.edu/isbi_challenge/)
- [Intel unet](https://github.com/IntelAI/unet/tree/master/single-node)
- [paper -U-Net: Convolutional Networks for Biomedical Image Segmentation ](https://arxiv.org/pdf/1505.04597.pdf) - - [**Download**](https://github.com/junxnone/tech-io/files/3895234/U-Net.Convolutional.Networks.for.Biomedical.Image.Segmentation.pdf)
- [unet网络结构说明及keras实现详解](https://blog.csdn.net/weixin_38193906/article/details/83787569)
- [unet - keras - intelAI](https://github.com/IntelAI/unet)
- [U-Net - Convolutional Networks for Biomedical Image Segmentation论文翻译——中英文对照](http://noahsnail.com/2019/05/13/2019-05-13-U-Net-Convolutional%20Networks%20for%20Biomedical%20Image%20Segmentation%E8%AE%BA%E6%96%87%E7%BF%BB%E8%AF%91%E2%80%94%E2%80%94%E4%B8%AD%E8%8B%B1%E6%96%87%E5%AF%B9%E7%85%A7/)
- [Implementation of U-Net architecture using Pytorch.](https://github.com/jakeoung/Unet_pytorch)
- [用U-Net做Auto-Encoder图像重建](https://zhuanlan.zhihu.com/p/47125912)
- [UNet-family](https://github.com/ShawnBIT/UNet-family)

## Brief
- unet 网络用于图像分割任务
- 基于 FCN , 扩大了网络框架，使其能够使用很少的训练图像就得到很 精确的分割结果。

---
- 上采样部分有大量的特征通道，允许网络将上下文信息传播到具有更高分辨率的层
- 网络没有任何全连接层，仅使用每个卷积的有效部分，即分割映射仅包含在输入图像中可获得完整上下文的像素。该策略允许通过重叠图像区策略无缝分割任意大小的图像
- 使用弹性变形( elastic deformations)来进行数据增强
- 使用加权损失，其中接触单元之间的分离背景标签在损失函数中获得较大的权重。

![image](https://user-images.githubusercontent.com/2216970/69695757-62a3a300-1118-11ea-8951-0c63a3da4a26.png)
![image](https://user-images.githubusercontent.com/2216970/69695772-73ecaf80-1118-11ea-89f2-4a61468e2ee8.png)
## 网络结构
![image](https://user-images.githubusercontent.com/2216970/69695723-50296980-1118-11ea-8a29-f3f9174aff65.png)
- part1 - 下采样，池化, 不同的卷积，学习深层次的特征
- part2 - 上采样, 反卷积, 恢复原图大小 
- 最后会使用 `sigmoid` 或 `softmax` 来实现二分类或多分类
- 输出为一张像素级的概率图或者概率矩阵


## MobileNet-UNet
- MobileNet 最为backbone产生feature map
- UNet  UpSampling 部分 + `sigmoid` 或 `softmax` 来实现二分类或多分类


## Vanilla-Unet - 即 原版Unet

> 看到 [divamgupta/image-segmentation-keras](https://github.com/divamgupta/image-segmentation-keras/blob/master/keras_segmentation/models/basic_models.py) 中使用了vanilla_encoder, 然后查到一个英文梗：
> - vanilla 的原意是香草，而香草口味的冰淇淋被吐槽和原味没什么区别，所以香草就有了原汁原味的意思

## UNet vs FCN
- U-Net采用了与FCN不同的特征融合方式
  - FCN 中 Pool4/Pool3 中的feature map 是通过逐点相加(Add)的方式进行特征融合的
  - U-Net使用Concat Layer将特征在channel维度拼接在一起，形成更“厚”的特征

## Image Augmentation
- 3 x 3 grid smooth deformations
  - random displacement vectors
  - Gaussian distribution
  - bicubic interpolation 方法计算位移

## Test Result
![image](https://user-images.githubusercontent.com/2216970/70588732-a7473800-1c08-11ea-9b49-8c714e7c2336.png)

