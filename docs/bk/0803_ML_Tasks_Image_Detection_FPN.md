-----

| Title     | ML Tasks Image Detection FPN                          |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T01:28:59Z`                                |
| Updated @ | `2026-11-26T01:28:59Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/803) |

-----

# FPN

FPN (Feature Pyramid Networks，CVPR
2017)：在卷积网络自带的多层特征上，增加自顶向下的通路和横向连接，使每一层都同时具有高分辨率和强语义，用于解决检测中的多尺度问题。

## 要解决的问题

  - 浅层特征分辨率高、细节好，但语义弱；深层特征语义强，但分辨率低，小目标几乎消失
  - 常见方案：对图像做多尺度缩放 (图像金字塔，慢)；只用最深层 ([Faster
    R-CNN](/0059_ML_Tasks_Image_Detection_FasterRCNN)，小目标差)；直接用各层特征
    ([SSD](@@SSD@@)，浅层语义弱)
  - FPN：把深层的强语义「传」回浅层，且几乎不增加计算量

## 结构

``` mermaid
flowchart TB
    C2[C2 stride 4] --> L2[1x1 conv 256]
    C3[C3 stride 8] --> L3[1x1 conv 256]
    C4[C4 stride 16] --> L4[1x1 conv 256]
    C5[C5 stride 32] --> L5[1x1 conv 256]
    L5 --> P5[3x3 conv → P5]
    L5 -->|上采样 x2| A4((+))
    L4 --> A4
    A4 --> P4[3x3 conv → P4]
    A4 -->|上采样 x2| A3((+))
    L3 --> A3
    A3 --> P3[3x3 conv → P3]
    A3 -->|上采样 x2| A2((+))
    L2 --> A2
    A2 --> P2[3x3 conv → P2]
    P5 -->|stride 2 池化| P6[P6]
```

图中：

  - 左边的 $C\_2\\sim C\_5$ 是 backbone (如
    [ResNet](/0051_ML_Tasks_Image_Classification_ResNet)) 各阶段的输出，步长
    $4,8,16,32$；先用 $1\\times1$ 卷积统一成 $256$ 通道 (横向连接)
  - 自顶向下：从最深的 $C\_5$ 开始，每次上采样 $2$ 倍 (最近邻) 与下一层的横向特征逐点相加，把深层语义传给浅层
  - 相加后再接 $3\\times3$ 卷积，消除上采样产生的混叠，得到 $P\_2\\sim P\_5$；$P\_6$ 由 $P\_5$
    下采样得到，只给 RPN 使用
  - 与 [UNet](/0161_ML_Tasks_Image_Segmentation_UNet) 的区别：FPN
    在每一级都输出预测，而不是只在最后一级预测；融合方式是相加而不是拼接

$$
P\_l=\\mathrm{Conv}*{3\\times3}\\bigl(\\mathrm{Conv}*{1\\times1}(C\_l)+\\mathrm{Up}*{2\\times}(P*{l+1})\\bigr)
$$

其中：$C\_l$ 是 backbone 第 $l$ 阶段的特征；$P\_l$
是输出的金字塔特征；$\\mathrm{Up}\_{2\\times}$ 是 $2$
倍上采样；$P\_5$ 只有横向项。所有 $P\_l$ 通道数都是 $256$，因此检测头可以在所有层之间共享参数。

## 在检测中的使用

  - 在 RPN 中：每一层 $P\_l$ 使用不同大小的 anchor (如 $32^2,64^2,128^2,256^2,512^2$
    分别对应 $P\_2\\sim P\_6$)，每层 $3$ 种长宽比
  - 在 RoI 池化中：根据 RoI 大小选择从哪一层取特征：

$$ k=\\left\\lfloor k\_0+\\log\_2\\frac{\\sqrt{wh}}{224}\\right\\rfloor
$$

其中：$w,h$ 为 RoI 的宽高；$k\_0=4$，对应 $224\\times224$ 的 RoI 使用 $P\_4$；RoI
越小，$k$ 越小，用分辨率越高的特征。ImageNet 预训练常用 $224$ 的输入，所以以 $224$ 为参考尺寸。

## 效果

  - 论文中 Faster R-CNN + FPN (ResNet-101) 在 COCO 上 AP 约 $36.2$，比不用 FPN
    的版本明显提高，尤其是小目标的 $\\mathrm{AP}\_S$ `[待核实]`
  - 之后几乎所有检测、实例分割 ([Mask
    R-CNN](/0163_ML_Tasks_Image_Segmentation_MaskRCNN)) 网络都使用 FPN
    或其变体：PANet (再加一条自底向上的通路)、BiFPN (带权重的双向融合)，[YOLO
    V3](/0056_ML_Tasks_Image_Detection_YOLO_V3) 和 [YOLO
    V5](/0379_ML_Tasks_Image_Detection_YOLO_V5) 的 neck 也是同类思想

## Reference

  - [Feature Pyramid Networks for Object
    Detection](https://arxiv.org/abs/1612.03144)
  - [Path Aggregation Network (PANet)](https://arxiv.org/abs/1803.01534)
  - [EfficientDet (BiFPN)](https://arxiv.org/abs/1911.09070)
