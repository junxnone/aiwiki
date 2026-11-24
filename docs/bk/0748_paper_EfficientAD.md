-----

| Title     | paper EfficientAD                                     |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:35Z`                                |
| Updated @ | `2026-11-24T08:14:35Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/748) |

-----

# EfficientAD 毫秒级异常检测

  - **EfficientAD**：Accurate Visual Anomaly Detection at
    Millisecond-Level Latencies，论文
    [arXiv 2303.14535](https://arxiv.org/pdf/2303.14535.pdf)
  - 类型：Segmentation
  - 思路：**蒸馏的教师网络 + 学生网络 +
    自编码器**：学生与教师的差异检测**局部异常**，学生与自编码器的差异检测**全局（逻辑）异常**；整体非常轻量，延迟可到毫秒级
  - 属于师生类方法，对比 [STFPM](/0324_paper_STFPM)、[Reverse
    Distillation](/0749_paper_ReverseDistillation)

## 原理

下图是 EfficientAD 的结构：

``` mermaid
graph TD
    X["输入图像"] --> T["教师 PDN<br/>从大模型蒸馏的小型特征提取网络"]
    X --> S["学生网络"]
    X --> AE["自编码器"]
    T --> D1["教师特征"]
    S --> D2["学生特征"]
    AE --> D3["自编码器重构特征"]
    D1 --> L1["局部异常图<br/>教师与学生的差异"]
    D2 --> L1
    D2 --> L2["全局异常图<br/>学生与自编码器的差异"]
    D3 --> L2
    L1 --> F["融合得到最终异常图"]
    L2 --> F
```

图中：

  - **教师**是一个小的特征提取网络（PDN，Patch Description
    Network），由大型预训练网络**蒸馏**而来，推理极快；
  - **学生**学习在正常图像上输出与教师相同的特征；为了避免学生在异常区域也模仿教师，训练损失中**使用 ImageNet
    图像**作为额外约束（让学生在非训练域图像上不要太好地模仿）
  - **自编码器**学习预测学生的输出，它只能重构正常的全局结构，所以**逻辑上的全局异常**（如零件缺失、位置错误）会造成学生与自编码器之间的差异
  - 两种差异图融合得到最终的异常图；两种异常检测的互补使 EfficientAD 同时处理局部与逻辑异常

损失（student-teacher 部分使用难样本挖掘）：

$$ \\mathcal{L}*{ST} = \\mathcal{L}*{hard} +
\\frac{1}{C}\\sum\_{c=1}^{C}\\big\\lVert S(P)\_{c}\\big\\rVert\_F^2 $$

其中：

  - $\\mathcal{L}\_{hard}$：难特征损失，只对学生与教师差异最大的前一部分（如 99.9%
    分位以上）位置计算均方误差，使学生专注于最难模仿的区域；
  - $S(P)\_c$：学生对 ImageNet 图像 $P$ 的第 $c$ 个输出通道的特征图，$C$
    为通道数，$\\lVert\\cdot\\rVert\_F$ 为 Frobenius 范数；第二项是对学生在
    ImageNet 图像上输出的惩罚，使学生在与训练域无关的图像上输出变小，防止学生泛化到异常区域
  - 图像级异常分数取融合异常图的最大值

## 特点

| Name        | 说明                                                             |
| ----------- | -------------------------------------------------------------- |
| 延迟          | 论文标题强调毫秒级延迟，在 GPU 上推理非常快                                       |
| 局部+全局       | 师生差异看局部异常，自编码器看全局/逻辑异常，互补                                      |
| 需要 ImageNet | 训练损失需要使用 ImageNet 图像作为惩罚                                       |
| 批大小         | anomalib 中要求训练 batch size 为 1（命令里 `--data.train_batch_size 1`） |
| 模型尺寸        | 提供 EfficientAd-S（小）和 EfficientAd-M（中）两种规格                      |

表中是 EfficientAD 的特点：它是现有方法中对速度和精度同时要求较高的方案。

## 使用与评估

``` bash
anomalib train --model EfficientAd --data anomalib.data.MVTecAD --data.category <category> --data.train_batch_size 1
```

anomalib README 中的结果（MVTec AD 15 类平均，seed 42）：

| Model         | Image AUROC | Image F1 |
| ------------- | ----------- | -------- |
| EfficientAd-S | 0.982       | 0.970    |
| EfficientAd-M | 0.975       | 0.966    |

表中 EfficientAd-S 的图像级 AUROC（0.982）与
[PatchCore](/0535_paper_PatchCore)（0.980）相当，而延迟更低；小模型反而略好于中模型，说明在
MVTec AD 上更大的模型并不总是有益。指标含义见 [Anomaly Detection
Metrics](/0711_ML_Metrics_Anomaly)。

## 优缺点

  - **优点**：速度极快；同时覆盖局部和逻辑异常；精度在轻量方法里领先
  - **缺点**：训练需要 ImageNet 作为额外数据，batch size 固定为 1；蒸馏教师需要先准备；在 anomalib
    里实现和调参较复杂

## Reference

  - [EfficientAD: Accurate Visual Anomaly Detection at Millisecond-Level
    Latencies](https://arxiv.org/pdf/2303.14535.pdf)
  - [anomalib -
    EfficientAd](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/efficient_ad)
