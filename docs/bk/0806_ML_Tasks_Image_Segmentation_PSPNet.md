-----

| Title     | ML Tasks Image Segmentation PSPNet                    |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T01:29:33Z`                                |
| Updated @ | `2026-11-26T01:29:33Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/806) |

-----

# PSPNet

PSPNet (Pyramid Scene Parsing Network，CVPR 2017)：在语义分割中引入金字塔池化模块
(PPM)，聚合不同区域尺度的全局上下文，减少把相似物体、相邻类别误分的错误。获得 ImageNet Scene Parsing
Challenge 2016 冠军。

## 要解决的问题

  - [FCN](/0160_ML_Tasks_Image_Segmentation_FCN)
    一类的网络感受野有限，缺少对整个场景的理解，容易出现：
      - 上下文关系错误：如把水面上的船认成汽车
      - 相似类别混淆：如 `field` 和 `grass`，`building` 和 `skyscraper`
      - 不显眼的小物体被忽略
  - 需要在特征里加入全局和多区域的上下文信息

## 金字塔池化模块

``` mermaid
flowchart LR
    F[backbone 特征<br>H x W x C] --> P1[池化到 1x1<br>全局]
    F --> P2[池化到 2x2]
    F --> P3[池化到 3x3]
    F --> P4[池化到 6x6]
    P1 --> C1[1x1 conv → C/4] --> U1[双线性上采样]
    P2 --> C2[1x1 conv → C/4] --> U2[双线性上采样]
    P3 --> C3[1x1 conv → C/4] --> U3[双线性上采样]
    P4 --> C4[1x1 conv → C/4] --> U4[双线性上采样]
    F --> CAT[concat]
    U1 --> CAT
    U2 --> CAT
    U3 --> CAT
    U4 --> CAT
    CAT --> O[卷积 → 逐像素分类]
```

图中：

  - 把 backbone 输出的特征图用 $4$ 种大小的自适应池化得到
    $1\\times1$、$2\\times2$、$3\\times3$、$6\\times6$ 的特征：$1\\times1$
    是整图的全局信息，其余是不同粗细的子区域信息 (论文中的 bin 大小)
  - 每路用 $1\\times1$ 卷积把通道降为 $C/N$ ($N=4$
    为金字塔层数)，以保持总通道数不变并降低计算量；再上采样回原特征图大小
  - 4 路上下文特征与原特征在通道维拼接，既有局部细节又有多尺度的全局上下文，后面接卷积和逐像素分类
  - 与 [Deeplab](/0162_ML_Tasks_Image_Segmentation_Deeplab) 的 ASPP
    的区别：ASPP 用不同空洞率的卷积 (不同的感受野大小)，PPM 用不同大小的池化
    (不同的区域范围)；二者都是为了多尺度上下文

## 网络与训练

  - backbone：带空洞卷积的 [ResNet](/0051_ML_Tasks_Image_Classification_ResNet)
    (输出步长 $8$)，在 PPM 之后接卷积输出分类图并上采样到原图大小
  - 辅助损失：在 backbone 中间层 (res4b22) 加一个辅助分类分支，总损失为：

$$ L=L\_{main}+\\lambda,L\_{aux},\\qquad \\lambda=0.4 $$

其中：$L\_{main}$ 是主输出的逐像素交叉熵；$L\_{aux}$ 是辅助分支的交叉熵；$\\lambda$
是辅助损失的权重。辅助损失帮助优化深层网络，推理时丢弃，与 [Inception
V1](/0048_ML_Tasks_Image_Classification_Inception_V1) 中的辅助分类器作用类似。

  - 学习率：poly 策略
    $lr=lr\_{base}\\cdot\\left(1-\\frac{iter}{max\_iter}\\right)^{0.9}$，随迭代平滑衰减

## 结果

| 数据集                  | 指标           | 结果 `[待核实]`      |
| -------------------- | ------------ | --------------- |
| PASCAL VOC 2012 test | mIoU         | 82.6 (COCO 预训练) |
| Cityscapes test      | mIoU         | 80.2            |
| ADE20K val           | mIoU / 像素准确率 | 44.4 / 81.0     |

表中：mIoU 的定义见 [Segmentation](/0159_ML_Tasks_Image_Segmentation)；数字来自论文，不同
backbone 和训练设置下有差别。

## 小结

  - 贡献：简单有效的全局上下文聚合模块，成为后续分割网络的标准组件之一 (如 UPerNet、PSANet)
  - 局限：池化固定的 bin 大小，对输入尺寸变化不够灵活；计算量随输出步长减小而增大，实时应用常选其轻量版本或更高效的结构

## Reference

  - [Pyramid Scene Parsing Network](https://arxiv.org/abs/1612.01105)
  - [Spatial Pyramid Pooling in Deep Convolutional Networks
    (SPP-net)](https://arxiv.org/abs/1406.4729)
