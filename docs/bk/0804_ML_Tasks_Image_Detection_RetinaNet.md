-----

| Title     | ML Tasks Image Detection RetinaNet                    |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T01:29:10Z`                                |
| Updated @ | `2026-11-26T01:29:10Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/804) |

-----

# RetinaNet

RetinaNet (Focal Loss for Dense Object Detection，ICCV 2017)：提出 Focal
Loss 解决单阶段检测中前景背景极度不平衡的问题，使单阶段检测器第一次在精度上追平并超过两阶段检测器。

## 要解决的问题

  - 单阶段检测器在特征图上密集地放置 anchor，一张图有成千上万个候选，其中绝大多数是容易分类的背景
  - 这些简单负样本数量巨大，虽然每个损失很小，累计起来仍压倒少数的难样本，使训练被背景主导
  - 两阶段方法靠候选区域把负样本过滤到约 $1\\sim2$ 千，再按固定比例采样；单阶段的 [SSD](@@SSD@@)
    用难负样本挖掘；RetinaNet 改为直接修改损失函数

## Focal Loss

在二分类交叉熵 $\\mathrm{CE}(p\_t)=-\\log p\_t$ 上增加一个调制因子：

$$ \\mathrm{FL}(p\_t)=-\\alpha\_t,(1-p\_t)^{\\gamma}\\log(p\_t),\\qquad
p\_t=\\begin{cases}p\&y=1\\1-p&\\text{otherwise}\\end{cases} $$

其中：

  - $p$：模型预测的该类概率；$y\\in{0,1}$：真实标签；$p\_t$：模型对真实类别的预测概率，越接近 $1$ 说明分类越容易
  - $\\gamma\\ge0$：聚焦参数，论文取 $2$；$(1-p\_t)^\\gamma$ 对容易的样本 ($p\_t\\to1$)
    把损失压到接近 $0$：例如 $p\_t=0.9$ 时损失降为原来的 $1/100$，$p\_t=0.968$ 时降为
    $1/1000$，而难样本 ($p\_t$ 小) 几乎不受影响
  - $\\alpha\_t$：类别平衡因子，论文取 $\\alpha=0.25$ (给正样本)；与 $\\gamma$
    配合，$\\gamma=2$ 时 $\\alpha=0.25$ 效果最好，正样本反而取更小的权重，因为 $\\gamma$
    已经压低了大量负样本
  - $\\gamma=0,\\alpha\_t=1$ 时就是普通交叉熵；更多讨论见
    [FocalLoss](/0284_ML_Arch_Func_LossFunction_FocalLoss)

## 结构

``` mermaid
flowchart LR
    I[图像] --> R[ResNet backbone]
    R --> F[FPN P3~P7]
    F --> C[分类子网<br>4x conv3x3 256 + conv K·A]
    F --> B[回归子网<br>4x conv3x3 256 + conv 4A]
    C --> O[每个位置 A 个 anchor 的类别]
    B --> O2[每个位置 A 个 anchor 的框偏移]
```

图中：

  - backbone + [FPN](@@FPN@@) 产生 $P\_3\\sim P\_7$ 五层特征 (步长
    $8\\sim128$)，检测头在所有层之间共享权重
  - 两个并行的全卷积子网：分类子网输出每个位置、每个 anchor 的 $K$ 类概率 (sigmoid)，回归子网输出 $4$ 个框偏移
    (类别无关)；$A=9$ 为每个位置的 anchor 数 ($3$ 种尺度 ${2^0,2^{1/3},2^{2/3}}$ × $3$
    种长宽比 ${1{:}2,1{:}1,2{:}1}$)，anchor 面积为 $32^2\\sim512^2$
  - 匹配：与真实框 $\\mathrm{IoU}\\ge0.5$ 为正样本，$\<0.4$ 为负样本，$\[0.4,0.5)$ 忽略
  - 总损失是所有 anchor 的 Focal Loss 之和，再除以正样本 anchor 数 (不是总数)，因为大多数 anchor
    的损失已被压得很小

初始化的细节：分类层的偏置初始化为 $b=-\\log\\frac{1-\\pi}{\\pi}$，$\\pi=0.01$，使训练开始时所有
anchor 预测为前景的概率约为 $0.01$，避免大量背景样本在一开始就产生巨大的损失而使训练不稳定。

## 效果

| 模型                                                              | backbone   | COCO AP `[待核实]` | 速度            |
| --------------------------------------------------------------- | ---------- | --------------- | ------------- |
| [Faster R-CNN](/0059_ML_Tasks_Image_Detection_FasterRCNN) + FPN | ResNet-101 | 36.2            | 较慢            |
| [SSD](@@SSD@@) 513                                              | ResNet-101 | 31.2            | 快             |
| RetinaNet-101-800                                               | ResNet-101 | 39.1            | 与两阶段相当的单张推理时间 |

表中：RetinaNet 在 COCO 上超过了当时最好的两阶段方法，同时比它们更简洁；Focal Loss 单独就能使 AP 提高约
$\\gt 3$ 个点，这说明单阶段检测落后的主要原因确实是样本不平衡，而不是结构。

## 影响

  - Focal Loss 成为解决类别不平衡的通用方法，被广泛用于检测、分割和分类
  - 此后的单阶段检测器 (FCOS、[YOLO](/0053_ML_Tasks_Image_Detection_YOLO) 的后续版本)
    在标签分配和 anchor-free 方向继续改进
  - 与 DETR 类检测器的区别：RetinaNet 仍需要 anchor、NMS 和人工设计的匹配规则，见
    [DETR](/0165_paper_DETR)

## Reference

  - [Focal Loss for Dense Object
    Detection](https://arxiv.org/abs/1708.02002)
  - [Feature Pyramid Networks for Object
    Detection](https://arxiv.org/abs/1612.03144)
