-----

| Title     | ML Op Pooling SPP                                     |
| --------- | ----------------------------------------------------- |
| Created @ | `2019-11-30T13:11:02Z`                                |
| Updated @ | `2023-01-31T06:48:22Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/365) |

-----

# Spatial Pyramid Pooling - 空间金字塔池化

针对卷积神经网络重复运算问题，2015年微软研究院的何恺明等提出一种SPP-Net算法，通过在卷积层和全连接层之间加入空间金字塔池化结构（Spatial
Pyramid Pooling）代替R-CNN算法在输入卷积神经网络前对各个候选区域进行剪裁、缩放操作使其图像子块尺寸一致的做法。

  - 解决了卷积神经网络对图像重复特征提取的问题
  - 避免了R-CNN算法对图像区域剪裁、缩放操作导致的图像物体剪裁不全以及形状扭曲等问题
  - Deeplab v2 的ASPP 就是基于SPP

## Reference

  - [paper - Spatial Pyramid Pooling in Deep Convolutional Networks for
    Visual Recognition](https://arxiv.org/pdf/1406.4729.pdf)
  - [Github repo](https://github.com/ShaoqingRen/SPP_net)
  - [目标检测（四）——SPP-Net](https://blog.csdn.net/qq_35451572/article/details/80273222)
  - [目标检测：SPP-net](https://blog.csdn.net/tinyzhao/article/details/53717136)
  - [深度学习笔记（一）空间金字塔池化阅读笔记](https://blog.csdn.net/liyaohhh/article/details/50614380)
  - [SPP-net原理介绍](https://x-algo.cn/index.php/2017/01/13/1587/)

## Brief

### R-CNN vs SPPNet

![image](media/b167240db98a148ddfdfbe9fc5940f5ad02eb429.png)
![image](media/1323008f2590511325f0272a6867502014d37b16.png)

## Spatial Pyramid Pooling

![image](media/21da2b5fbc194c0fad53e4a1a6d976a84f6d3bc8.png)
