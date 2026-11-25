-----

| Title     | ML Tasks Image Detection YOLO                        |
| --------- | ---------------------------------------------------- |
| Created @ | `2018-12-09T09:33:49Z`                               |
| Updated @ | `2026-11-25T16:51:28Z`                               |
| Labels    | \`\`                                                 |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/53) |

-----

# YOLO 系列

  - **YOLO** - `You Only Look Once`

<!-- end list -->

``` mermaid

graph TD
    O(YOLO家谱)--> |Joseph Redmon| V1(2015 YOLOv1)
    V1 --> V2(2016 YOLOv2)
    V2 --> V3(2018 YOLOv3)
    V3 --> |Alexey Bochkovskiy| V4(2020 YOLOv4)
    V3 --> |百度| PP(2020 PP-YOLO)
    V3 --> |旷世| VX(2021 YOLOX)
    V4 --> V7(2022 YOLOv7)
    V4 --> |Ultralytics LLC| V5(2021 YOLOv5)
    V5 --> V8(2022 YOLOv8)
    V4 --> |美团| V6(2022 YOLOv6)
    V5 --> V6
    V4 --> |ChienYaoWang| VR(2021 YOLOR)

```

## Papers

  - 2015 **YOLO V1** You Only Look Once: Unified, Real-Time Object
    Detection \[[paper](https://arxiv.org/pdf/1506.02640.pdf)\]
    \[[netscope](http://ethereon.github.io/netscope/#/gist/96209c6940e02b17c34009f6c3fee75e)\]
    \[[Code](https://pjreddie.com/darknet/yolo/)\] \[[Code2 -
    AlexeyAB](https://github.com/AlexeyAB/darknet)\]
    \[[docs](https://pjreddie.com/darknet/yolov1/)\]
  - 2016 **YOLO V2** YOLO9000: Better, Faster, Stronger
    \[[paper](https://arxiv.org/pdf/1612.08242.pdf)\]
    \[[netscope](http://ethereon.github.io/netscope/#/gist/8826fef24ed0b5086affdb6e65db26b7)\]
    \[[Code](https://pjreddie.com/darknet/yolo/)\]
    \[[docs](https://pjreddie.com/darknet/yolov2/)\]
    \[[YOLO 9000](https://pjreddie.com/publications/yolo9000/)\]
  - 2018 **YOLOv3** An Incremental Improvement
    \[[paper](https://pjreddie.com/media/files/papers/YOLOv3.pdf)\]
    **\[[YOLOv3
    netscope](http://ethereon.github.io/netscope/#/gist/a9badc1fd4eefb7463c99e33d046af9e)\]**
    \[[Code](https://pjreddie.com/darknet/yolo/)\]
    [docs](https://pjreddie.com/darknet/yolo/)
    \[[docs](https://pjreddie.com/darknet/yolo/)\]
  - 2020 **PP-YOLO** PP-YOLO: An Effective and Efficient Implementation
    of Object Detector \[[paper](https://arxiv.org/abs/2007.12099)\]
  - 2021 **YOLOv4** YOLOv4: Optimal Speed and Accuracy of Object
    Detection \[[paper](https://arxiv.org/abs/2004.10934)\]
  - 2021 **YOLOR** You Only Learn One Representation: Unified Network
    for Multiple Tasks \[[paper](https://arxiv.org/abs/2105.04206)\]
  - 2021 **YOLOX** YOLOX: Exceeding YOLO Series in 2021
    \[[paper](https://arxiv.org/abs/2107.08430)\]
  - 2022 **YOLOv6** YOLOv6: A Single-Stage Object Detection Framework
    for Industrial Applications
    \[[paper](https://arxiv.org/abs/2209.02976)\]
  - 2022 **YOLOv7** YOLOv7: Trainable bag-of-freebies sets new
    state-of-the-art for real-time object detectors
    \[[paper](https://arxiv.org/abs/2207.02696)\]

## 提升变化

### YOLOv1

  - 定位问题 --\> 回归问题

### YOLOv2

  - Darknet19
  - BN Layers
  - 高分辨率分类器
  - 使用聚类获取 Anchor Box
  - 特征融合
  - 多尺度训练
  - 分类检测数据集联合训练

### YOLOv3

  - Darknet53
  - FPN

### YOLOv4

  - CSPDarkNet53
  - CutMix & Mosaic
  - Mish

## 版本对比

| 版本                                               | 年份         | Backbone          | 输出尺度            | 关键改进                        |
| ------------------------------------------------ | ---------- | ----------------- | --------------- | --------------------------- |
| [YOLOv1](/0054_ML_Tasks_Image_Detection_YOLO_V1) | 2015       | 24 conv + 2 fc    | $7\\times7$ 单尺度 | 检测变成回归问题，实时                 |
| [YOLOv2](/0055_ML_Tasks_Image_Detection_YOLO_V2) | 2016       | Darknet-19        | $13\\times13$   | BN、anchor + 聚类、直接位置预测、多尺度训练 |
| [YOLOv3](/0056_ML_Tasks_Image_Detection_YOLO_V3) | 2018       | Darknet-53 (残差)   | 3 个尺度           | FPN 式多尺度、逻辑回归分类             |
| [YOLOv4](https://arxiv.org/abs/2004.10934)       | 2020       | CSPDarknet53      | 3 个尺度           | Mosaic、CIoU、Mish、SPP/PAN    |
| [YOLOv5](/0379_ML_Tasks_Image_Detection_YOLO_V5) | 2020       | CSPDarknet + SPPF | 3 个尺度           | 工程化，n/s/m/l/x 多规格           |
| [YOLOv6/7/8/X](https://arxiv.org/abs/2209.02976) | 2021\~2022 | 各异                | 各异              | 重参数化、解耦头、anchor-free 等      |

表中：`输出尺度` 指预测层使用的特征图个数，多尺度预测使小目标检测更好；每一代都在上一代基础上叠加 backbone、neck、head
和训练技巧的改进。

## 一个共同的预测框架

$$ \\text{输出张量}\\in\\mathbb R^{S\\times S\\times\\bigl\[B,(5+C)\\bigr\]}
$$

其中：

  - $S\\times S$：特征图 (网格) 大小，每个网格位置负责预测落在其中的物体
  - $B$：每个位置预测的框数 (V1 为 $2$，V2 为 $5$，V3 为 $3$)
  - $5$：每个框的 $(x,y,w,h,\\text{objectness})$，objectness 是该框含有物体的置信度
  - $C$：类别数 (VOC 为 $20$，COCO 为 $80$)
  - YOLOv1 的类别概率是每个网格一组 (所以是 $B\\cdot5+C$)，从 V2 起改为每个框一组 (即上式)

## 速度与精度

| 模型                       | 数据集      | mAP / AP            | 速度 `[待核实]` |
| ------------------------ | -------- | ------------------- | ---------- |
| YOLOv1                   | VOC07+12 | mAP 63.4            | 45 FPS     |
| YOLOv2 ($416\\times416$) | VOC07+12 | mAP 76.8            | 67 FPS     |
| YOLOv3 ($608\\times608$) | COCO     | AP 33.0 / AP50 57.9 | 约 20 FPS   |

表中：数据来自各篇论文，运行平台 (Titan X 等) 与评估协议不同，不能互相严格比较；`mAP` 是 IoU 阈值 $0.5$
下的平均精度，COCO 的 `AP` 是对 IoU $0.5\\sim0.95$ 取平均，数值天然更低。

## 通用的改进点

  - 损失：从 MSE 到 IoU 系列 (GIoU/DIoU/CIoU)，让损失直接对应评估指标；CIoU 公式见 [YOLO
    V5](/0379_ML_Tasks_Image_Detection_YOLO_V5)
  - 多尺度：FPN/PAN，在不同分辨率的特征图上分别检测大、小目标
  - 训练技巧：Mosaic 等数据增强、EMA、余弦学习率、自动 anchor
  - 部署：[Quantization](/0312_MO_Quantization) 可以把 YOLO 压缩到 INT8 在 CPU/GPU
    上加速

总览与检测基础概念见 [Detection](/0152_ML_Tasks_Image_Detection)。
