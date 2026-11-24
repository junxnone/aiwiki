-----

| Title     | paper CSFlow                                          |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:11Z`                                |
| Updated @ | `2026-11-24T08:14:11Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/737) |

-----

# CSFlow 跨尺度流异常检测

  - **CS-Flow**：Fully Convolutional Cross-Scale-Flows for Image-based
    Defect Detection，论文
    [arXiv 2110.02855](https://arxiv.org/pdf/2110.02855.pdf)（WACV 2022）
  - 类型：Segmentation
  - 核心思想：通过**多尺度**提取特征，并用**全卷积的归一化流**联合处理各尺度，使全局和局部上下文互相补充
  - 归一化流基础见 [CFlow](/0735_paper_CFlow)；同类还有
    [FastFlow](/0736_paper_FastFlow)

## 原理

下图是 CS-Flow 的结构：

``` mermaid
graph TD
    X["输入图像"] --> E["预训练 EfficientNet<br/>提取三个尺度的特征"]
    E --> Y1["尺度 1"]
    E --> Y2["尺度 2"]
    E --> Y3["尺度 3"]
    Y1 --> C["跨尺度耦合块<br/>多个块堆叠 各尺度联合变换"]
    Y2 --> C
    Y3 --> C
    C --> Z["各尺度隐变量 z"]
    Z --> A["每个位置计算 z 的 L2 范数平方<br/>作为异常分数"]
```

图中：

  - 图像经预训练骨干得到三个尺度的特征图，三个尺度被**同时**送进同一个流模型（而不是像
    [CFlow](/0735_paper_CFlow) 每个尺度一个独立流）
  - 流由多个跨尺度耦合块组成，块内各尺度的信息通过跨尺度卷积相互交换
  - 每个尺度最终得到隐变量 $z$，正常样本的 $z$ 接近标准高斯，范数小；异常位置的 $z$ 范数大

耦合块把输入张量沿通道切成两部分，类似 RealNVP，各自计算缩放和平移参数：

$$ y\_{out,2} = y\_{in,2} \\odot e^{\\gamma\_1 s\_1(y\_{in,1}) +
\\gamma\_1 t\_1(y\_{in,1})}, \\qquad y\_{out,1} = y\_{in,1} \\odot
e^{\\gamma\_2 s\_2(y\_{out,2}) + \\gamma\_2 t\_2(y\_{out,2})} $$

其中：

  - $y\_{in,1}, y\_{in,2}$：块输入沿通道切开的两部分；$y\_{out,1}, y\_{out,2}$：块输出
  - $s\_1, t\_1$ 和 $s\_2, t\_2$：由子网络 $r\_1$、$r\_2$
    输出的缩放和平移项；子网络内部有**跨尺度卷积**，把各尺度的信息融合
  - $\\gamma\_1, \\gamma\_2$：每个块里可学习的参数，调节变换的幅度；$\\odot$ 为逐元素相乘

异常分数：

$$ s^{(s)}(i, j) = \\big\\lVert z^{(s)}\_{i,j} \\big\\rVert\_2^2 $$

其中：$s$ 为尺度编号；$z^{(s)}\_{i,j}$ 为最后一个耦合块在尺度 $s$、位置 $(i, j)$ 的输出（隐变量），沿通道维取
L2 范数的平方。范数越大，说明该位置越偏离标准高斯，即越异常。

## 特点

| Name  | 说明                               |
| ----- | -------------------------------- |
| 联合多尺度 | 一个流同时处理三个尺度，全局与局部信息直接融合          |
| 全卷积   | 可处理不同大小的输入图像                     |
| 高分辨率  | 论文使用较大的输入（如 768），小缺陷检测更好         |
| 依赖骨干  | anomalib 使用 EfficientNet-B5 提取特征 |

表中是 CS-Flow 的特点，它靠联合处理多尺度来增强对不同大小缺陷的检测，不过需要较高的分辨率和较大的显存。

## 使用与评估

``` bash
anomalib train --model Csflow --data MVTecAD --data.category <category>
```

anomalib README 中的结果（MVTec AD 15 类平均，seed 42，骨干为 EfficientNet-B5）：

| Input size | Image AUROC | Pixel AUROC | Image F1 | Pixel F1 |
| ---------- | ----------- | ----------- | -------- | -------- |
| 768        | 0.987       | 0.921       | 0.985    | 0.33     |
| 256        | 0.972       | 0.845       | \-       | 0.231    |

表中两行分别是 768 和 256 的输入大小：768 时精度明显更高，尤其是像素级 AUROC；README 说明 768
的结果使用了三个尺度的异常图融合，这与论文只用最大尺度不同，作者初步实验显示三个尺度融合更好。256
的结果用于与 anomalib 中其他算法公平对比。可以看到输入越小，小缺陷的定位越差。

## 优缺点

  - **优点**：多尺度联合建模；图像级精度高；全卷积、输入大小灵活
  - **缺点**：高分辨率输入时显存和计算量大；像素级 F1 偏低；流模型实现和调试较复杂

## Reference

  - [Fully Convolutional Cross-Scale-Flows for Image-based Defect
    Detection](https://arxiv.org/pdf/2110.02855.pdf)
  - [official code](https://github.com/marco-rudolph/cs-flow)
  - [anomalib -
    Csflow](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/csflow)
