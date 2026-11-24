-----

| Title     | paper CFA                                             |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:40Z`                                |
| Updated @ | `2026-11-24T09:21:27Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/750) |

-----

# CFA 耦合超球面特征适配

  - **CFA**：Coupled-hypersphere-based Feature Adaptation for
    Target-Oriented Anomaly Localization，论文
    [arXiv 2206.04325](https://arxiv.org/abs/2206.04325)，官方代码
    [sungwool/cfa\_for\_anomaly\_localization](https://github.com/sungwool/cfa_for_anomaly_localization)
  - 类型：Segmentation
  - 动机：此前基于记忆库的方法（SPADE、PaDiM、[PatchCore](/0535_paper_PatchCore)）直接使用在
    ImageNet 上预训练的 CNN 提取特征，**不适配目标数据集**。但工业图像与 ImageNet 分布不同，预训练 CNN
    提取的特征是「有偏的、不适配的」特征，会**高估异常特征的正常性**。PatchCore
    只用中层特征缓解偏差，没有从根本上解决。另外，记忆库大小通常随目标数据集增大，既增加推理时间，也可能因为存了大量「不适配」特征而高估异常的正常性
  - 核心思想：用**可学习的 Patch 描述符 (patch descriptor)**
    通过迁移学习把特征**适配到目标数据集**，使正常特征聚集得更紧；并用一个**与数据集大小无关的可扩展记忆库**；用「**耦合超球面**」的对比监督训练
  - 论文结果：MVTec AD 上检测 AUROC **99.5%**、定位 AUROC **98.5%**；论文还指出预训练 CNN
    的偏置特征的负面影响，强调适配到目标数据集的重要性

## 原理

``` mermaid
graph LR
    A["正常图像"] --> B["预训练 CNN<br/>取 C2 C3 C4 多尺度特征 插值后拼接 得到 F"]
    B --> P["Patch 特征 p_t 维度 D"]
    P --> PD["Patch 描述符 phi<br/>1x1 CoordConv 把 p_t 映射为目标导向特征"]
    PD --> M["记忆库 C<br/>初始化用 K-means 之后用 EMA 更新 压缩"]
    PD --> LOSS["耦合超球面损失 L_CFA = L_att + L_rep<br/>吸引最近的 K 个 排斥第 K+1 到 K+J 个"]
    M --> LOSS
    T["测试图像"] --> PD2["同样提取并适配特征"]
    PD2 --> S["与记忆库最近邻匹配<br/>用带确定性的打分函数得到异常图"]
    M --> S
```

图中：

  - **多尺度 Patch 特征**：预训练 CNN 在不同深度的特征图分辨率不同，插值到相同分辨率后拼接，得到 $\\mathcal{F}
    \\in \\mathbb{R}^{D \\times H \\times W}$；$H, W$ 是最大特征图的高宽，$D$
    是所选特征图维度之和。每个位置有预先确定的感受野，因此 $p\_t \\in \\mathbb{R}^D$
    可以看作该位置的语义信息
  - **Patch 描述符 $\\phi(\\cdot): \\mathbb{R}^D \\to
    \\mathbb{R}^{D'}$**：带可学习参数的辅助网络，把 $p\_t$ 转换成目标导向的特征
    $\\phi(p\_t)$。论文用 $1 \\times 1$ 的 **CoordConv** 层，参数用 He 初始化
  - **记忆库 $\\mathcal{C}$**：存放正常训练集适配后的特征，仅在初始化阶段建立，之后在训练中用 EMA 更新
  - **训练**：用记忆库中的特征 $c \\in \\mathcal{C}$
    为中心形成**相互叠加的超球面**（即「耦合超球面」），对适配后的特征做对比监督
  - **测试**：把测试图像的 $p\_t$ 与记忆库中最近邻 $c\_t$ 匹配，生成表示异常程度的热力图，再经打分函数得到定位用的分数图

**耦合超球面损失**：为了让正常特征聚得更紧，先找到 $\\phi(p\_t)$ 在 $\\mathcal{C}$ 中的第 $k$ 近邻
$c\_t^k$，监督 $\\phi$ 把 $p\_t$ 嵌入到以 $c\_t^k$ 为中心、半径为 $r$
的超球面内部（吸引项）；但同时属于多个超球面的模糊特征仍会高估异常的正常性，所以再用**难负样本**（$K+j$
近邻 $c\_t^j$）做对比监督，让这些超球面把 $p\_t$ 排斥开（排斥项）：

$$ \\mathcal{L}*{att} =
\\frac{1}{TK}\\sum*{t=1}^{T}\\sum\_{k=1}^{K}\\max\\big{0,\\
\\mathcal{D}\\big(\\phi(p\_t), c\_t^k\\big) - r^2\\big}, \\qquad
\\mathcal{L}*{rep} =
\\frac{1}{TJ}\\sum*{t=1}^{T}\\sum\_{j=1}^{J}\\max\\big{0,\\ r^2 -
\\mathcal{D}\\big(\\phi(p\_t), c\_t^j\\big) - \\alpha\\big} $$

$$ \\mathcal{L}*{CFA} = \\mathcal{L}*{att} + \\mathcal{L}\_{rep} $$

其中：

  - $T = h \\times w$：单个样本得到的 Patch 特征数；$p\_t$：第 $t$ 个 Patch
    特征；$\\phi(p\_t)$：适配后的特征；$\\mathcal{D}(\\cdot,
    \\cdot)$：距离度量，论文用欧氏距离
  - $K$：与 $\\phi(p\_t)$ 匹配的最近邻个数（吸引项使用）；$J$：难负样本个数；$c\_t^k$ 是第 $k$
    近邻，$c\_t^j$ 是第 $K + j$ 近邻
  - $r$：超球面半径（论文设为 $10^{-5}$）；$\\alpha$：平衡 $\\mathcal{L}*{att}$ 与
    $\\mathcal{L}*{rep}$ 的超参数（论文设为 $10^{-1}$）；论文中 $K = J = 3$
  - $\\mathcal{L}*{att}$：距离超出 $r$ 才产生惩罚，把特征拉近到最近的 $K$
    个记忆项的超球面内；$\\mathcal{L}*{rep}$：当特征离更远的记忆项太近（距离的差小于
    $r^2 - \\alpha$）时给予惩罚，使特征可被区分
  - 当 $c^j\_t$ 与 $c^k\_t$ 距离比 $r$ 更近时，$\\mathcal{L}\_{CFA}$ 直接基于耦合超球面监督
    $p\_t$，使 $c\_t^k$ 所在超球面密度更高

**记忆库压缩**（与数据集大小无关）：先对训练集**第一个**正常样本适配后的特征做 **K-means** 聚类，得到初始记忆库
$\\mathcal{C}*0$；之后对第 $i$ 个正常样本，在 $\\mathcal{C}*{i-1}$ 中找最近的 Patch 特征集合
$\\mathcal{C}\_i^{NN}$，再用指数滑动平均 (EMA) 更新：

$$ \\mathcal{C}*i = (1 - \\beta),\\mathcal{C}*{i-1} +
\\beta,\\mathcal{C}\_i^{NN} $$

其中 $\\beta$ 是 EMA 参数；对训练集中每个正常样本重复上述过程，最终得到的 $\\mathcal{C}$
保存了代表整个训练集的核心正常特征。这使建模过程的空间复杂度为
$\\mathcal{O}(HWD')$，记忆库为 $\\mathcal{O}(\\gamma (HW)D')$（$\\gamma$
为压缩率，即 $T$ 与聚类中心数之比），**不随训练集大小 $\\lvert\\mathcal{X}\\rvert$
增长**；而 SPADE 的建模复杂度为 $\\mathcal{O}(\\lvert\\mathcal{X}\\rvert
HWD)$，PaDiM 为 $\\mathcal{O}(\\lvert\\mathcal{X}\\rvert
HWD^2)$，PatchCore 为 $\\mathcal{O}(\\lvert\\mathcal{X}\\rvert HWD')$。

**打分函数**：朴素的异常分数是到最近记忆项的距离：

$$ \\mathcal{S}\_t = \\min\_k \\mathcal{D}\\big(\\phi(p\_t),
c\_t^k\\big), \\qquad \\mathcal{A}\_t =
\\frac{e^{-\\mathcal{S}*t}}{\\sum*{k=1}^{K}
e^{-\\mathcal{D}(\\phi(p\_t), c\_t^k)}}\\cdot \\mathcal{S}\_t $$

其中：$\\mathcal{S}\_t$ 是 $\\phi(p\_t)$
到最近记忆项的最小距离；由于正常特征连续分布、簇与簇之间没有清晰的边界，一个正常特征可能落在若干记忆项之间，距离反而很大，只用距离会**低估正常特征的正常性**。所以论文用
**softmin** 衡量最近记忆项相对其他记忆项「近了多少」，称为**确定性 (certainty)**，$\\mathcal{A}\_t$
是用确定性对距离加权后的最终分数，匹配越清晰（确定性越高）的位置，分数越能反映真实的异常程度。

## 实现与结果

| Name | 设置                                                                                               |
| ---- | ------------------------------------------------------------------------------------------------ |
| 特征   | ImageNet 预训练 CNN 的 ${C\_2, C\_3, C\_4}$，分辨率为输入的 1/4、1/8、1/16；EfficientNet 因通道数少，每个尺度用多个特征图       |
| 预处理  | 缩放到 256×256，中心裁剪 224×224；另用 RD-MVTec AD（含未对齐样本）                                                  |
| 优化   | AdamW（amsgrad），学习率 $10^{-3}$，无调度器，权重衰减 $5\\times10^{-4}$，batch size 4，训练 30 个 epoch（每个子类约 10 分钟） |
| 硬件   | Quadro RTX 5000 GPU；Xeon E5-2650 v4 CPU（测吞吐）                                                     |

表中是论文的实验设置：Patch 描述符只训练 30 个 epoch，训练代价不大。

  - **主结果**（MVTec AD，WRN50-2）：纹理类和物体类的图像级 AUROC 都达到 SOTA；论文的
    CFA++（用裁剪图像和仅缩放图像的结果集成）比此前 SOTA 的 PatchCore 的 I-AUROC
    高 **0.4%**；摘要给出整体检测 AUROC **99.5%**、定位 AUROC **98.5%**

**消融实验**：特征适配的作用（论文 Table 5，MVTec AD，I-AUROC / P-AUROC）：

| Backbone | 不适配（只用预训练特征） | 只用 $\\mathcal{L}\_{att}$ | $\\mathcal{L}*{att} + \\mathcal{L}*{rep}$ |
| -------- | ------------ | ------------------------ | ----------------------------------------- |
| ResNet18 | 83.7 / 92.4  | 97.8 / 97.8              | **98.9 / 98.1**                           |
| WRN50-2  | 85.9 / 94.0  | 99.1 / 98.3              | **99.5 / 98.5**                           |

表中说明：只用预训练的有偏特征效果很差；仅加吸引项 $\\mathcal{L}*{att}$ 就显著提升（ResNet18 的 I-AUROC
和 P-AUROC 分别提高 14.1% 和 5.4%，WRN50-2 分别提高 13.2% 和 4.3%）；再加排斥项
$\\mathcal{L}*{rep}$ 又进一步提升（ResNet18 提升 1.1% 和 0.3%，WRN50-2 提升 0.4% 和
0.2%）。

**记忆库进一步压缩与吞吐**（论文 Table 6，WRN50-2，P-AUROC）：不压缩时 98.45%、吞吐 48；把特征维度和
Patch 数各压缩到 1/2、1/4、1/8 时，P-AUROC 为 98.44% / 98.44% / 98.36%，吞吐提高到
93（1.9 倍）/ 132（2.8 倍）/ 172（3.6 倍）。论文指出，即使把记忆库的激活量减少约 99.9%，CFA
的性能也几乎不下降；记忆库轻量带来吞吐提升。吞吐包含预训练 CNN 和 Patch 描述符的前向时间。

**对未对齐样本的鲁棒性**：RD-MVTec AD 与 MVTec AD 的样本相同但**未对齐**，通常性能更低（SPADE 的
I-AUROC 下降了 9%），而 CFA++ 的 I-AUROC 只下降 0.8%，说明 CFA
对未对齐样本很稳健。在这个数据集上，CFA++ 的 I-AUROC 比
SPADE 和 PaDiM 分别高 11.5% 和 6.6%，P-AUPRO 比 PaDiM 高 10.1%。

**anomalib 复现的结果**（README，MVTec AD 15 类平均，seed 42，使用了 early
stopping，patience 5）：

| Metric      | ResNet-18 | Wide ResNet-50 |
| ----------- | --------- | -------------- |
| Image AUROC | 0.930     | 0.956          |
| Image F1    | 0.946     | 0.962          |
| Pixel AUROC | 0.979     | 0.983          |
| Pixel AUPRO | 0.917     | 0.924          |
| Pixel F1    | 0.574     | 0.598          |

表中 Wide ResNet-50 全面优于 ResNet-18；anomalib 的图像级 AUROC（0.956）低于论文的
99.5%，README 说明增大 early stopping 的 patience 有可能得到更高的指标。指标含义见 [Anomaly
Detection Metrics](/0711_ML_Metrics_Anomaly)。

## 特点与局限

  - **优点**：适配目标数据集，缓解预训练特征的偏置；记忆库大小与数据集无关，推理更快；耦合超球面的对比监督使正常特征更紧凑、更易与异常区分；带确定性的打分函数更合理；论文中精度达到
    SOTA
  - **局限**：需要训练 Patch 描述符，比 [PatchCore](/0535_paper_PatchCore)
    多一个训练阶段；超参数较多（$r$、$\\alpha$、$K$、$J$、压缩率、EMA
    参数）；anomalib 复现的图像级精度低于论文

## Reference

  - [CFA: Coupled-hypersphere-based Feature Adaptation for
    Target-Oriented Anomaly
    Localization](https://arxiv.org/abs/2206.04325)
  - [official
    code](https://github.com/sungwool/cfa_for_anomaly_localization)
  - [anomalib -
    Cfa](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/cfa)
