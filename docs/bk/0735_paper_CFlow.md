-----

| Title     | paper CFlow                                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:06Z`                                |
| Updated @ | `2026-11-24T09:22:02Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/735) |

-----

# CFlow 条件归一化流异常检测

  - **CFLOW-AD**：Real-Time Unsupervised Anomaly Detection with
    Localization via Conditional Normalizing Flows，论文
    [arXiv 2107.12571](https://arxiv.org/abs/2107.12571)（WACV 2022）
  - 类型：Segmentation（图像级分数和像素级异常图）
  - 动机：当时的 SOTA 里，SPADE 要在测试时对训练特征库做 kNN（慢、占内存），PaDiM
    要保存每个位置的协方差逆矩阵（内存大）。CFLOW-AD
    用**条件归一化流**估计特征的**精确似然**，解码器参数小、全卷积、推理快
  - 核心思想：用**归一化流**对「正常特征的概率密度」建模，推理时似然低的位置就是异常；**位置编码作为条件**，使流能区分不同空间位置
  - 属于 [anomalib](/0321_Tools_anomalib) 中的归一化流类模型，同类还有
    [FastFlow](/0736_paper_FastFlow)、[CS-Flow](/0737_paper_CSFlow)、[U-Flow](/0738_paper_UFlow)、[PatchFlow](/0739_paper_PatchFlow)

## 为什么用流：从马氏距离到归一化流

论文先分析了 PaDiM 一类方法的基础假设：

  - 分类 CNN 常用 L2 权重衰减训练，这相当于给参数、也给中间特征向量隐含了**多元高斯 (MVG)
    先验**，所以可以用均值和协方差拟合特征，用**马氏距离**评分（PaDiM
    的做法，见 [PaDiM](/0322_paper_PaDiM)）
  - 但马氏距离只适用于 MVG 分布；如果特征并不服从高斯分布（例如使用 L1 正则会得到拉普拉斯先验，或者没有明确先验），这个假设就不成立
  - **归一化流**则可以对任意分布 $p\_Z$ 估计**精确似然**，不依赖 MVG 假设

归一化流学习一个**可逆变换** $g$，把简单的基分布 $p\_U$（标准高斯）变到复杂的特征分布，似然由变量替换公式给出：

$$ \\log \\hat{p}\_Z(z, \\theta) = \\log p\_U(u) + \\log\\left\\lvert
\\det J \\right\\rvert, \\qquad u = g^{-1}(z, \\theta),\\quad J =
\\nabla\_z g^{-1}(z, \\theta) $$

其中：

  - $z$：编码器提取的特征向量；$u \\sim \\mathcal{N}(0,
    I)$：流变换后的隐变量；$g$：由多层耦合层组成的可逆变换，参数为
    $\\theta$
  - $J$：$g^{-1}$ 对 $z$ 的雅可比矩阵，$\\log\\lvert\\det J\\rvert$
    是变换引起的体积变化项；耦合层的设计使它很容易计算（RealNVP
    中是对角项之和）
  - 论文证明：若目标分布是 MVG，则流的训练损失可以写成 $\\frac{M^2(z) - \\lVert u \\rVert^2}{2}
    + \\log\\frac{\\lvert\\det J\\rvert}{\\det\\Sigma^{-1/2}}$
    的形式（$M(z)$ 为马氏距离），所以马氏距离方法是流框架在高斯假设下的特例

## 原理

下图是 CFLOW-AD 的结构：

``` mermaid
graph TD
    X["输入图像"] --> E["预训练编码器<br/>特征金字塔池化 取多个尺度"]
    E --> F1["尺度 1 特征向量"]
    E --> F2["尺度 2 特征向量"]
    E --> F3["尺度 3 特征向量"]
    PE["二维正弦余弦位置编码 c"] --> D1["条件流解码器 1"]
    PE --> D2["条件流解码器 2"]
    PE --> D3["条件流解码器 3"]
    F1 --> D1
    F2 --> D2
    F3 --> D3
    D1 --> L["各尺度对数似然转为概率<br/>双线性上采样后聚合"]
    D2 --> L
    D3 --> L
    L --> A["Anomaly Map"]
```

图中：

  - **编码器**是 ImageNet 预训练的 CNN（论文测试 ResNet-18、Wide
    ResNet-50、MobileNetV3L），**不训练**。通过多尺度特征金字塔池化，取多个层的特征图，每个位置的特征向量为
    $z^k\_i \\in \\mathbb{R}^{D\_k}$；用多尺度是因为 CNN
    的有效感受野没有严格边界，而异常的大小和形状各异
  - 每个尺度配一个**条件流解码器** $g\_k$。位置条件向量 $c^k\_i \\in \\mathbb{R}^{C\_k}$
    由二维正弦-余弦位置编码生成，每个空间位置唯一；通过把耦合层内部的中间向量与 $c$ 拼接，把无条件流扩展成条件流
  - 每个耦合层由一个 $(D\_k + C\_k) \\times (D\_k + C\_k)$ 的全连接层、softplus
    激活和输出向量置换组成；论文所有实验固定 $C\_k = 128$，因为 $C\_k \\ll
    D\_k$，条件不会增加多少参数
  - 解码器沿特征向量滑动、参数共享，所以是平移等变的全卷积式结构，推理可以并行

训练目标是最大化似然，等价于最小化：

$$ \\mathcal{L}(\\theta) \\approx
\\frac{1}{N}\\sum\_{i=1}^{N}\\Big\[\\frac{\\lVert u\_i \\rVert\_2^2}{2}
- \\log\\left\\lvert \\det J\_i \\right\\rvert\\Big\] + \\text{const},
\\quad u\_i = g^{-1}(z\_i, c\_i, \\theta) $$

推理时：

$$ \\log \\hat{p}*Z(z\_i, c\_i, \\hat\\theta) = -\\frac{\\lVert u\_i
\\rVert\_2^2 + D\\log(2\\pi)}{2} + \\log\\left\\lvert\\det
J\_i\\right\\rvert, \\qquad S = \\max\\Big(\\sum*{k} P\_k\\Big) -
\\sum\_{k} P\_k $$

其中：

  - $N$：训练样本（特征向量）个数；$c\_i$：位置条件；$D$：特征维度；$\\lVert u\_i
    \\rVert^2/2$：隐变量偏离标准高斯的程度
  - 第一个式子是 $-\\lVert u \\rVert^2/2$ 对应的高斯对数密度加上体积项，即该特征的**对数似然**，对每个尺度
    $k$ 计算
  - $P\_k$：把第 $k$ 个尺度的对数似然取指数得到**概率** $p^k\_i = e^{\\log\\hat{p}}$，归一化到
    $\[0, 1\]$，再双线性上采样到输入分辨率 $H \\times W$ 得到的概率图
  - $S$：最终的异常分数图。把各尺度概率图相加，再用「最大值减去该和」翻转，使概率越低（越不正常）的位置分数越高

## 实验设置与结果

  - **数据集**：MVTec AD（15 类，训练 3629 张，测试 1725 张，每类单独训练）和 STC（监控视频，274515
    训练帧、42883 测试帧，13 个场景）
  - **训练设置**：Adam，学习率 2e-4，100 个 epoch，batch size 32，余弦学习率退火（2 个 epoch
    预热）；所有模型使用相同的超参数；基于 PyTorch 和 FrEIA 库实现；MVTec 上每个实验跑四次取均值
  - **评估指标**：定位使用 AUROC 和 AUPRO（AUROC 偏向大面积异常，AUPRO 让大小异常同等重要，见 [Anomaly
    Detection Metrics](/0711_ML_Metrics_Anomaly)），图像级只报告 AUROC

MVTec AD 上的对比（论文 Table 4，CFLOW-AD 使用 Wide ResNet-50 编码器）：

| Model    | 检测 AUROC  | 定位 AUROC  | 定位 AUPRO  |
| -------- | --------- | --------- | --------- |
| SPADE    | 85.5      | 96.0      | 91.7      |
| PaDiM    | 97.9      | 97.5      | 92.1      |
| CutPaste | 97.1      | 96.0      | \-        |
| CFLOW-AD | **98.26** | **98.62** | **94.60** |

表中每一行是一个方法，`-` 表示论文未给出。CFLOW-AD 在检测 AUROC、定位 AUROC 和 AUPRO 三项上都超过当时的
PaDiM 和 SPADE。

**消融实验**（MVTec，定位 AUROC，论文 Table 2）：

| Name        | 结论                                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
| 耦合层数        | 从 4 层增加到 8 层平均提升 0.15%                                                                                          |
| 特征尺度        | 使用 3 个尺度（layer 1、2、3）比只用 2 个（layer 2、3）提升 1.4%，layer 1 的特征图更大（$32 \\times 32$），空间信息更精确                          |
| 条件流 vs 无条件流 | 条件流（CFLOW）平均比无条件流（UFLOW）好 0.5%，说明位置先验有效                                                                         |
| 输入分辨率       | 最优分辨率因类别而异：宏观物体类（cable、pill）适合较小的 256×256（对应更大的有效感受野），多数类别 512×512 更好，transistor 类缩小到 128×128 反而更高。论文最终按类别选择分辨率 |

**速度**（论文 Table 6）：CFLOW-AD 的 ResNet-18 版本在 256×256 / 512×512 输入下推理速度约为
34 / 12 fps；相比 PaDiM 需要存储每个位置的协方差逆矩阵，CFLOW-AD 只需保存很小的解码器参数。STC
视频数据集上，论文报告 CFLOW-AD 的检测和定位 AUROC 也高于 PaDiM 和 SPADE。

anomalib 复现的结果（README，MVTec AD 15 类平均，seed 42，Wide ResNet-50）：Image
AUROC 0.962，Pixel AUROC 0.971，Image F1 0.944，整体高于
[PaDiM](/0322_paper_PaDiM) 和 [STFPM](/0324_paper_STFPM)，略低于
[PatchCore](/0535_paper_PatchCore)。

## 复杂度对比

| Model    | 训练阶段                               | 测试阶段    | 内存                                         |
| -------- | ---------------------------------- | ------- | ------------------------------------------ |
| SPADE    | 保存训练特征库 $\\mathbb{G}$              | 对库做 kNN | 编码器 + 特征库                                  |
| PaDiM    | 每个位置的协方差逆 $\\Sigma^{-1}\_i$        | 马氏距离    | 编码器 + $H\_k W\_k$ 个 $D\_k \\times D\_k$ 矩阵 |
| CFLOW-AD | 训练流解码器（损失 $\\mathcal{L}(\\theta)$） | 推理对数似然  | 编码器 + 解码器参数 $\\theta$                      |

表中三种方法使用相同的编码器，区别在于后处理：SPADE 存特征库、PaDiM 存大矩阵，CFLOW-AD
存训练好的小解码器，而且推理时是全卷积的，所以更快、更省内存。

## 特点与局限

  - **优点**：有精确的概率解释；多尺度；位置条件；推理快；解码器小
  - **局限**：流模型训练对超参数和数值稳定性较敏感；每个尺度一个解码器，结构较复杂；效果依赖预训练编码器的特征质量；最优输入分辨率因类别而异

## Reference

  - [CFLOW-AD: Real-Time Unsupervised Anomaly Detection with
    Localization via Conditional Normalizing
    Flows](https://arxiv.org/abs/2107.12571)
  - [official code](https://github.com/gudovskiy/cflow-ad)
  - [anomalib -
    Cflow](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/cflow)
