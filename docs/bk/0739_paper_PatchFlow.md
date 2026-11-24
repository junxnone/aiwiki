-----

| Title     | paper PatchFlow                                       |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:15Z`                                |
| Updated @ | `2026-11-24T09:21:54Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/739) |

-----

# PatchFlow 基于补丁特征的归一化流

  - **PatchFlow**：Leveraging a Flow-Based Model with Patch Features，论文
    [arXiv 2602.05238](https://arxiv.org/abs/2602.05238)（论文为 AAAI
    Workshop AI2ASE 2024 的预印本，非存档论文集）
  - 类型：Segmentation
  - 动机：压铸 (die casting)
    件的表面缺陷影响质量控制，需要在**没有缺陷样本**的情况下做自动检测。通用预训练特征与工业图像的分布存在差距
  - 核心贡献：把 [PatchCore](/0535_paper_PatchCore) 式的**局部邻域感知 Patch
    特征**与**归一化流**结合，并加入一个**特征适配器**缩小预训练特征与工业图像的差距；与之前把**整图特征**映射为正态分布的流方法不同，PatchFlow
    直接对**每个 Patch 的特征**做映射，所以定位更直接
  - 归一化流基础见 [CFlow](/0735_paper_CFlow)；同类流模型还有
    [FastFlow](/0736_paper_FastFlow)、[CS-Flow](/0737_paper_CSFlow)、[U-Flow](/0738_paper_UFlow)

## 原理

PatchFlow 由四个部分组成：

``` mermaid
graph LR
    X["输入图像<br/>3 个尺度"] --> E["特征提取器<br/>EfficientNet-B5 冻结 多层级"]
    E --> P["特征聚合<br/>Patcher 局部邻域聚合 + Fuser 多层级融合"]
    P --> A["特征适配器<br/>单个全连接层 降维并缓解分布差异"]
    A --> F["归一化流<br/>RealNVP 耦合层 瓶颈结构"]
    F --> Z["标准正态隐变量 z<br/>上采样得到 Anomaly Map"]
```

图中：

  - **特征提取器** $\\mathcal{E}$：ImageNet
    预训练、训练和测试时都固定。不只用最后一层，而是用**多个层级**的特征，兼顾全局抽象信息和局部细节：$y\_i^j
    = \[\\mathcal{E}(x\_i)\]^j$ 表示图像 $i$ 在第 $j$ 个层级的特征
  - **特征聚合** $\\mathcal{P}$（不引入新的可训练参数）：包括 patcher 和 fuser。patcher
    对每个层级的每个位置，在其邻域内聚合特征（与 PatchCore 的做法一致）；fuser
    把深层特征插值到与浅层相同的大小后拼接，得到多层级的局部感知特征
  - **特征适配器**
    $\\mathcal{A}$：工业数据的分布与特征提取器预训练的数据不同，用**单个全连接层**把特征映射到适配后的特征，同时降维
  - **归一化流** $\\mathcal{F}$：把适配后的每个 Patch 特征映射到标准正态分布

聚合部分的定义（Patch 邻域与融合）：

$$ N\_s^{(h,w)} = {(a, b) \\mid a \\in \[h - \\lfloor s/2 \\rfloor, h +
\\lfloor s/2 \\rfloor\],\\ b \\in \[w - \\lfloor s/2 \\rfloor, w +
\\lfloor s/2 \\rfloor\]} $$

$$ p\_i^{j}\\big(N\_s^{(h,w)}\\big) = \\text{Agg}\\big(y\_i^j(a, b)
\\mid (a, b) \\in N\_s^{(h,w)}\\big), \\qquad f\_{i,s}(h, w) \\in
\\mathbb{R}^{C\_f},\\ \\ C\_f = \\sum\_j c^j $$

其中：

  - $(h, w)$：特征图上的位置；$s$：邻域尺寸（奇数）；$N\_s^{(h,w)}$：以 $(h,w)$
    为中心的方形邻域；$y\_i^j(a,b) \\in \\mathbb{R}^{c^j}$：图像
    $i$ 第 $j$ 层在位置 $(a,b)$ 的特征向量，$c^j$ 是该层通道数
  - $\\text{Agg}$：聚合函数（如平均池化）；$p\_i^j$：层级 $j$ 的局部邻域感知 Patch 特征
  - $f\_{i,s}(h,w)$：把各层级的 $p\_i^j$ 插值到相同大小后沿通道拼接得到的融合特征，其通道数 $C\_f =
    \\sum\_j c^j$ 是各层通道数之和
  - 此外还使用**多个尺度**（论文用 3 个）：每个尺度走同样的流程，得到相同大小的 Patch 特征，再拼接成多尺度多层级特征
    $f^{3}\_{i,s}(h,w) \\in \\mathbb{R}^{3 \\times C\_f}$

**目标函数**是最小化真实特征分布与流估计分布之间的 KL 散度：

$$ \\mathcal{L}(\\theta) =
\\frac{1}{D}\\sum\_{i=1}^{D}\\Big\[\\frac{\\lVert N(y\_i)
\\rVert\_2^2}{2} - \\log\\left\\lvert \\det\\frac{\\partial
N(y\_i)}{\\partial y\_i^\\top}\\right\\rvert\\Big\] + c $$

其中 $D$ 是训练样本（Patch 特征）个数，$N$ 是流变换，$N(y\_i)$ 是隐变量；$\\frac{\\lVert
N(y\_i)\\rVert^2}{2}$ 是标准正态分布的负对数密度，$\\log\\lvert\\det\\rvert$
是体积变化项，$c$ 是与参数 $\\theta$
无关的常数，反向传播时不影响更新。这是归一化流的标准最大似然目标（见
[CFlow](/0735_paper_CFlow)）。

**耦合块的瓶颈结构**：流的每个双射块沿用 RealNVP 的耦合层，但内部网络采用**带瓶颈的结构**（论文用三层卷积核为 1
的网络，瓶颈维度固定为 128），在保持映射能力的同时降低参数量和 FLOPs，使网络可以更深。

**异常图与分数**：隐变量 $z \\in \\mathbb{R}^{C\_g \\times H\_g \\times W\_g}$
的每个元素都编码了空间信息，偏离正态分布的位置同时说明了异常和它的位置。把它们经简单的线性变换并**双线性插值**到输入大小，得到异常图；**图像分数取异常图的最大值**。

## 实现细节与实验

| Name   | 设置                                                                             |
| ------ | ------------------------------------------------------------------------------ |
| 输入     | 缩放到 768×768；**不使用任何数据增强或归一化**                                                  |
| 特征提取   | EfficientNet-B5 的第 12、19、35 个 block，形成 3 尺度金字塔，特征 $1488 \\times 96 \\times 96$ |
| 适配器    | 降维到 $768 \\times 96 \\times 96$                                                |
| 流的瓶颈维度 | 128                                                                            |
| 计算量    | 总 FLOPs 为 $1.25 \\times 10^{10}$，在单块 RTX 2080 Ti 上约 **2.7 FPS**                |

表中是论文的实现配置：论文的输入很大（768），推理速度只有 2.7 FPS，并不快。

  - **数据集**：MVTec AD、VisA，以及一个私有的**压铸阀体**数据集（缺陷用在阀体表面放钉子来合成）
  - **MVTec AD**：与 DRÆM、CutPaste、CFlow-AD、CS-Flow、PaDiM、PatchCore
    对比，PatchFlow 的图像级 AUROC 达到 **99.28%**，把 PatchCore 的错误率从 0.9%
    降到 0.72%，**错误率降低 20%**
  - **VisA**：图像级 AUROC **96.48%**，相比 SOTA 错误率降低 28.2%
  - **压铸阀体私有数据**：34 个正常样本全部判对，36 个异常样本中 3 个被判为正常，准确率 95.71%，F1 为
    95.77%，训练不需要任何异常样本

**消融实验**（MVTec AD，图像级 AUROC）：

| Flow 步数   | 1         | 2     | 3     | 4     | 5     |
| --------- | --------- | ----- | ----- | ----- | ----- |
| AUROC (%) | **99.28** | 98.89 | 98.73 | 98.57 | 98.48 |

| 尺度数       | 3         | 2     | 1     |
| --------- | --------- | ----- | ----- |
| AUROC (%) | **99.28** | 98.84 | 97.78 |

上表是两个消融结果：流的步数从 1 增加到 5，性能反而**单调下降**，所以论文用 1 步；尺度金字塔用 3
个尺度最好，尺度越多，越能通过观察更大范围的场景获得更抽象、更泛化的信息。

## anomalib 实现

anomalib 的 PatchFlow 实现（README）使用冻结骨干（**EfficientNet 或
DINOv2**），经局部平均池化和上采样融合多分辨率特征，用 $1\\times1$
卷积调整通道维度，再送入**单个**归一化流做密度估计。README 中没有给出 benchmark
数值。论文本身的评估指标为图像级 AUROC 和像素级指标，含义见 [Anomaly Detection
Metrics](/0711_ML_Metrics_Anomaly)。

## 特点与局限

  - **优点**：Patch 级流模型，定位直接；适配器缓解预训练特征的领域偏差；瓶颈耦合降低计算量；单个流结构简单；MVTec AD
    图像级 AUROC 高
  - **局限**：论文输入大（768）、速度只有约 2.7 FPS；论文为 workshop 预印本，评测范围有限（主要是 MVTec
    AD、VisA 和一个私有数据集）；消融显示更多流步数反而更差，对设置敏感

## Reference

  - [PatchFlow: Leveraging a Flow-Based Model with Patch
    Features](https://arxiv.org/abs/2602.05238)
  - [anomalib -
    Patchflow](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/patchflow)
