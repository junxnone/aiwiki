-----

| Title     | paper CFlow                                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:06Z`                                |
| Updated @ | `2026-11-24T08:14:06Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/735) |

-----

# CFlow 条件归一化流异常检测

  - **CFLOW-AD**：Real-Time Unsupervised Anomaly Detection with
    Localization via Conditional Normalizing Flows，论文
    [arXiv 2107.12571](https://arxiv.org/pdf/2107.12571v1.pdf)（WACV
    2022）
  - 类型：Segmentation（图像级分数和像素级异常图）
  - 思路：用**归一化流**对「正常特征的概率密度」建模，推理时概率密度低的位置就是异常；加入**位置编码作为条件**，使流能区分不同空间位置
  - 属于 [anomalib](/0321_Tools_anomalib) 中的归一化流类模型，同类还有
    [FastFlow](/0736_paper_FastFlow)、[CS-Flow](/0737_paper_CSFlow)、[U-Flow](/0738_paper_UFlow)、[PatchFlow](/0739_paper_PatchFlow)

## 归一化流基础

归一化流 (Normalizing Flow) 学习一个**可逆变换** $f$，把复杂的特征分布 $p\_X$ 映射成简单的高斯分布
$p\_Z$，从而可以精确计算任何样本的似然：

$$ \\log p\_X(x) = \\log p\_Z\\big(f(x)\\big) + \\log\\left\\lvert \\det
\\frac{\\partial f(x)}{\\partial x} \\right\\rvert $$

其中：

  - $x$：输入特征向量；$f$：可逆变换（由多层耦合层组成）；$z = f(x)$：变换后的隐变量，目标是服从标准高斯分布
    $\\mathcal{N}(0, I)$
  - $p\_Z(z)$：高斯分布下的概率密度；$\\frac{\\partial f(x)}{\\partial x}$：$f$
    的雅可比矩阵，$\\det$ 为行列式，$\\log\\lvert\\det\\rvert$
    是体积变化项，用耦合层设计使它容易计算
  - 训练目标是在**正常样本**上最大化 $\\log p\_X(x)$；推理时，正常样本似然高，异常样本似然低

## 原理

下图是 CFLOW-AD 的结构：

``` mermaid
graph TD
    X["输入图像"] --> E["预训练编码器<br/>多尺度特征金字塔"]
    E --> F1["尺度 1 特征"]
    E --> F2["尺度 2 特征"]
    E --> F3["尺度 3 特征"]
    PE["位置编码 c"] --> D1["条件流解码器 1"]
    PE --> D2["条件流解码器 2"]
    PE --> D3["条件流解码器 3"]
    F1 --> D1
    F2 --> D2
    F3 --> D3
    D1 --> L["各尺度对数似然<br/>上采样后相加"]
    D2 --> L
    D3 --> L
    L --> A["Anomaly Map"]
```

图中：

  - 编码器是预训练的分类网络（如 Wide ResNet-50），**不训练**，用池化得到多个尺度的特征，兼顾局部和全局语义
  - 每个尺度配一个条件归一化流解码器，把特征分布转换成高斯分布；二维正弦-余弦**位置编码** $c$
    作为条件输入，使同一个特征在不同位置可以有不同的概率密度
  - 各尺度估计的似然被上采样到输入尺寸并相加，得到异常图：似然越低，异常分数越高

条件流的似然：

$$ \\log p(x \\mid c) = \\log p\_Z\\big(z\\big) + \\log\\left\\lvert
\\det \\frac{\\partial z}{\\partial x} \\right\\rvert, \\qquad z =
f\_\\theta(x;, c) $$

其中：$c$ 为位置编码（条件）；$f\_\\theta$ 为带参数 $\\theta$ 的条件可逆变换，参数由神经网络依据 $c$
生成；其余符号同上。

## 特点

| Name | 说明                                                              |
| ---- | --------------------------------------------------------------- |
| 只训练流 | 编码器冻结，只训练条件流解码器，训练代价小于端到端网络                                     |
| 位置条件 | 同一特征在不同位置的概率不同，能处理有位置先验的产品                                      |
| 多尺度  | 同时检测大小不同的缺陷                                                     |
| 推理速度 | 论文标题强调 Real-Time；无需像 [PatchCore](/0535_paper_PatchCore) 那样存储记忆库 |

表中是 CFLOW-AD 的特点：它把「记忆库检索」换成「概率密度估计」，推理时只做前向。

## 使用与评估

``` bash
anomalib train --model Cflow --data MVTecAD --data.category <category>
```

anomalib README 中的结果（MVTec AD 15 类平均，seed 42）：

| Backbone       | Image AUROC | Pixel AUROC | Image F1 |
| -------------- | ----------- | ----------- | -------- |
| Wide ResNet-50 | 0.962       | 0.971       | 0.944    |

表中是该配置下的整体结果，指标含义见 [Anomaly Detection
Metrics](/0711_ML_Metrics_Anomaly)。整体精度高于 [PaDiM](/0322_paper_PaDiM) 和
[STFPM](/0324_paper_STFPM)，略低于 [PatchCore](/0535_paper_PatchCore)。

## 优缺点

  - **优点**：有明确的概率解释；多尺度；训练和推理速度较快；对位置有建模
  - **缺点**：流模型训练对超参数和数值稳定性较敏感；每个尺度一个解码器，结构较复杂；依赖预训练骨干的特征质量

## Reference

  - [CFLOW-AD: Real-Time Unsupervised Anomaly Detection with
    Localization via Conditional Normalizing
    Flows](https://arxiv.org/pdf/2107.12571v1.pdf)
  - [official code](https://github.com/gudovskiy/cflow-ad)
  - [anomalib -
    Cflow](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/cflow)
