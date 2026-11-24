-----

| Title     | paper UFlow                                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:13Z`                                |
| Updated @ | `2026-11-24T09:21:56Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/738) |

-----

# UFlow U 形流与无监督阈值

  - **U-Flow**：A U-shaped Normalizing Flow for Anomaly Detection with
    Unsupervised Threshold，论文
    [arXiv 2211.12353](https://arxiv.org/abs/2211.12353)，官方代码
    [mtailanian/uflow](https://www.github.com/mtailanian/uflow)
  - 类型：Segmentation
  - 动机：大多数工业异常检测方法只输出异常图并用 AUROC 评估，**不提供检测阈值**，或者用「在测试集上最大化某个指标」的
    oracle 阈值，这在实际中不可行。U-Flow 的目标是同时做好异常图和**无监督的自动分割**
  - 核心贡献（四个阶段）：①用 **MS-CaiT** 多尺度 Transformer 提取特征；②设计 **U
    形归一化流**，让各尺度的隐变量相互独立；③用基于似然的**异常分数图**；④用 **a
    contrario** 统计框架得到自动阈值和分割结果
  - 归一化流基础见 [CFlow](/0735_paper_CFlow)；同类流模型见
    [FastFlow](/0736_paper_FastFlow)、[CS-Flow](/0737_paper_CSFlow)

## 原理

``` mermaid
graph TD
    X["输入图像"] --> E["阶段 1: MS-CaiT<br/>多个尺度的预训练 CaiT Transformer"]
    E --> U["阶段 2: U 形归一化流<br/>唯一训练的部分 可逆"]
    U --> Z["各尺度相互独立的高斯嵌入 z"]
    Z --> A["阶段 3: 异常分数图<br/>基于似然"]
    Z --> N["阶段 4: a contrario 分割<br/>水平集树 + NFA"]
    N --> S["无监督阈值 log NFA 不大于 0<br/>得到分割掩码"]
```

图中：

  - **阶段 1 特征提取**：MS-CaiT 把预训练的图像
    Transformer（CaiT）放在**不同的图像尺度**上使用并组合，论文所有结果使用相同配置，输入大小为
    448×448 和 224×224 两个尺度。ViT/CaiT 本来只输出单一特征图，MS-CaiT
    通过多尺度得到更丰富的多尺度表示；代码对特征提取器是无关的，也可以换成
    ResNet 等
  - **阶段 2 U 形归一化流**：只有这一阶段被训练。把 U-Net
    的编码-解码思想用到流上：特征提取器相当于编码器，归一化流相当于解码器。流由多个**流阶段**（每个对应一个尺度）组成，从最粗的尺度开始：该阶段输出的通道**一半直接作为整个网络的输出**，另一半**上采样后与下一个尺度的输入拼接**继续往下，全程可逆（使用
    split 和可逆上采样）
  - 每个流阶段由若干 **Glow 块**构成：仿射耦合层 + $1\\times1$ 卷积置换 +
    ActNorm；耦合层内部的小网络是「卷积-ReLU-卷积」，卷积核在
    $1\\times1$ 与 $3\\times3$ 之间交替；论文用 2 个流阶段、每个阶段 4 个流步骤
  - 因为一次性优化整个计算图，流为**不同尺度之间**也生成了相互独立的嵌入，这是其他流方法所不具备的

U 形流得到 $L$ 个尺度的白噪声嵌入，每个元素在正常图像下满足：

$$ z^{l}\_{ijk} \\sim \\mathcal{N}(0, 1), \\quad 1 \\le i \\le H\_l,\\ 1
\\le j \\le W\_l,\\ 1 \\le k \\le C\_l $$

其中 $l$ 是尺度编号，$(i, j)$ 是空间位置，$k$ 是通道，$H\_l, W\_l, C\_l$
是该尺度嵌入张量的高、宽和通道数；论文强调这些元素对任意位置、通道和尺度**两两相互独立**。

## 阶段 3：基于似然的异常分数

由于嵌入相互独立，联合似然就是各标准正态边缘分布的乘积。对每个像素 $(i,j)$ 定义异常分数：

$$ AS(i, j) = 1 -
\\frac{1}{L}\\sum\_{l=1}^{L}\\exp\\Big(-\\frac{1}{2C\_l}\\sum\_{k=1}^{C\_l}\\big(\\tilde{z}^{l}\_{ijk}\\big)^2\\Big)
$$

其中：

  - $\\tilde{z}^l\_{ijk}$：把 $z^l\_{ijk}$ 双线性上采样到输入分辨率 $H\\times W$
    后的值；$L$：尺度数；$C\_l$：该尺度的通道数
  - 内层 $\\frac{1}{2C\_l}\\sum\_k
    \\tilde{z}^2$：对通道取**平均**而不是求和。论文说明原因：求和会得到接近浮点误差的极小值，而且各尺度通道数
    $C\_l$ 不同，求和会使各尺度对总分的影响不均衡；取平均后分数不再是严格的似然，但数值稳定、各尺度均衡
  - 外层 $\\exp(\\cdot)$ 把值映射到 $(0,1\]$，再对尺度取平均，最后用 $1-$ 翻转，使异常处分数更高

## 阶段 4：a contrario 自动阈值

**a contrario**
框架是一种多重假设检验方法，基于「**非偶然性原则**」：因为我们通常不知道异常长什么样，所以只对**正常性**建模，定义零假设
$\\mathcal{H}\_0$（背景模型）；把「在 $\\mathcal{H}\_0$
下极不可能发生的结构」判为异常。可解释的检测阈值由**误报数
NFA** 控制：

$$ \\text{NFA}(E) = N\_T \\cdot \\Pr\_{\\mathcal{H}\_0}(E) $$

其中：

  - $E$：一个待检验的事件（图像中的一块连通区域）；$N\_T$：被检验的事件总数；$\\Pr\_{\\mathcal{H}\_0}(E)$：在正常模型下出现这个事件的概率（PFA，误报概率）
  - $\\text{NFA}(E)$ 是在所有检验中，该事件仅靠背景模型就能产生的**期望次数**。若 $\\text{NFA} \\le
    \\varepsilon$，称该事件是 $\\varepsilon$-meaningful，$\\varepsilon$
    就是在**无异常图像上期望的误检数上界**
  - 标准阈值取 $\\text{NFA} \\le 1$，即 $\\log \\text{NFA} \\le
    0$，理论上平均每张图允许一个误报；这个阈值可以按应用需求调整

**如何选择要检验的区域**：异常的大小和形状任意，检验所有连通区域在计算上不可行。论文用异常图的**水平集**来产生候选：

$$ \\mathcal{L}*\\lambda = {(i, j) \\mid u(i, j) \\ge \\lambda}, \\qquad
u(i, j) = \\sum*{k=1}^{C} \\big(z\_{ijk}\\big)^2 $$

  - 各个水平集的**连通分量**按包含关系天然形成一棵**树**（阈值 $\\lambda$ 越高，连通分量越小）；每个尺度单独建一棵树
  - 零假设下 $z\_{ijk} \\sim \\mathcal{N}(0,1)$ 独立同分布，所以 $u(i,j)$ 服从自由度为 $C$
    的**卡方分布**。一个连通分量 $\\mathcal{L}\_{\\lambda,c}$ 的 PFA 等于其所有像素同时不小于
    $\\lambda$ 的概率：

$$ \\text{PFA}(\\mathcal{L}*{\\lambda,c}) = \\big(1 -
\\text{CDF}*{\\chi^2(C)}(\\lambda)\\big)^{\\lvert\\mathcal{L}\_{\\lambda,c}\\rvert}
$$

其中 $\\lvert\\mathcal{L}\_{\\lambda,c}\\rvert$
是该区域的像素数。这个量自然地平衡了「区域越大」与「最小像素值
$\\lambda$ 越低」，有利于准确勾勒异常区域。实际用 **Chernoff 界**近似卡方分布的尾概率，得到：

$$ \\log\_{10}\\text{PFA}(\\mathcal{L}*{\\lambda,c}) =
\\lvert\\mathcal{L}*{\\lambda,c}\\rvert,\\frac{C\_l}{2\\ln 10}\\Big(1 +
\\ln\\frac{\\lambda}{C\_l} - \\frac{\\lambda}{C\_l}\\Big) $$

  - 之后对树反复执行两个过程直到收敛：**PFA Prune**（在一条嵌套分支中只保留 $\\log\\text{PFA}$
    最小、即最显著的区域）和 **PFA
    Merge**（若后继节点比所有叶子都显著，就合并叶子，只保留后继）；最终的叶子就是检测区域，得到每个尺度的
    $\\log\\text{PFA}$ 热图
  - 多尺度融合：把各尺度热图上采样到输入大小，每个像素取最小值：$\\log\\text{PFA}(i,j) = \\min\_l
    {\\uparrow(\\log\\text{PFA}^l)(i,j)}$
  - 检验总数 $N\_T$：考虑 4-连通的所有区域（polyomino），$r$ 个像素的 polyomino 个数约为
    $\\alpha\\beta^r/r$（$\\alpha = 0.316915$，$\\beta = 4.062570$），所以
    $N\_T = \\sum\_l H\_l W\_l \\sum\_{r=1}^{H\_l
    W\_l}\\alpha\\beta^r/r$
  - 最终：$\\log\\text{NFA}(i,j) = \\log N\_T + \\log\\text{PFA}(i,j)$，对其以
    0 为阈值得到分割掩码

## 实验结果

  - **数据集**：MVTec AD（15 类）、BeanTech (BTAD)、LGG-MRI（脑瘤）、ShanghaiTech
    Campus（监控）；指标：像素级 AUROC、AUPRO、分割用的 mIoU（对每张图的 IoU
    取平均，避免大面积区域权重过大）、以及图像级 AUROC
  - **公平性说明**：FastFlow、CFlow、CS-Flow 没有公开的训练好的模型，论文重新训练，并反复训练直到 AUROC
    与原论文报告相当；FastFlow 和 CFlow 对每个类别使用不同的超参数（甚至改变流步骤数和图像分辨率），而
    U-Flow 对所有类别使用**同一个**架构
  - **异常图**：U-Flow 在 MVTec AD 上的平均像素级 AUROC
    **优于所有之前的方法**（论文摘要：**98.74%**）；AUPRO
    在流模型中排第一、总体第二
  - **分割（mIoU）**：自动阈值 $\\log\\text{NFA} \\le 0$ **明显优于**其他流方法，包括它们使用
    oracle 阈值的结果。自动阈值与 oracle 阈值的结果非常接近，说明统计推导和跨尺度独立性是成立的
  - **阈值鲁棒性**：允许每张图 1 个误报（$\\log\\text{NFA} \\le 0$）时平均 mIoU 为
    **0.541**；允许每百万张图 1 个误报（$\\log\\text{NFA} \\le -6$）时 mIoU 为
    **0.540**，几乎不变；mIoU 随阈值变化的曲线在一个很宽的范围内几乎平坦，所以这个策略在实践中近乎**无参数**
  - **经验误报率**：在 467 张无异常的测试图中，6 张出现检测，其中 4 张实际上是真实但未标注的异常，只有 2 张是真正的误报
  - **复杂度**：论文用 PyTorch Lightning、FrEIA 和 timm 实现，在 RTX 2080 Ti
    上训练；每个尺度只用 4 个流步骤，所以在相同特征提取器下，可训练参数比 FastFlow 和
    CFlow 少

**消融实验**：

| Name    | 结论                                                                                             |
| ------- | ---------------------------------------------------------------------------------------------- |
| U 形结构   | 相比各阶段并行、最后把各尺度异常图取平均的结构，U 形结构更好地整合多尺度信息，AUROC 更高                                               |
| MS-CaiT | 在多个尺度上使用图像 Transformer 比单个 Transformer 显著提高了结果；MS-CaiT 也远优于 ResNet 变体和 MViT2 这类多尺度 Transformer |

表中是论文第 5 节的两个消融结论：U 形设计和 MS-CaiT 都是性能提升的来源。

**anomalib 复现的结果**（README）：按默认配置复现，各类别像素级 AUROC 在 96.7%\~99.5% 之间（如
carpet 99.45、leather 99.41、transistor 96.70），与论文结果非常接近。论文的特征提取器输入大小为
448×448，而 anomalib 基准使用 256×256 比较，所以数值可能与论文不同；anomalib
默认在训练时由异常图计算阈值，NFA 阈值的代码在
`uflow/anomaly_map.py` 中。指标含义见 [Anomaly Detection
Metrics](/0711_ML_Metrics_Anomaly)。

## 特点与局限

  - **优点**：像素级精度高；给出有统计含义的**自动阈值**，不依赖异常样本，对阈值选择鲁棒；同一架构适用于所有类别；参数比
    FastFlow、CFlow 少
  - **局限**：依赖 Transformer 特征提取器，输入分辨率高、计算量较大；NFA
    的建树与剪枝增加了后处理开销；统计推导依赖「正常图像下嵌入服从独立标准正态」这一假设

## Reference

  - [U-Flow: A U-shaped Normalizing Flow for Anomaly Detection with
    Unsupervised Threshold](https://arxiv.org/abs/2211.12353)
  - [official code](https://www.github.com/mtailanian/uflow)
  - [anomalib -
    Uflow](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/uflow)
