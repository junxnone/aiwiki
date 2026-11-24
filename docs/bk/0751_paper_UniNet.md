-----

| Title     | paper UniNet                                          |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:42Z`                                |
| Updated @ | `2026-11-24T09:21:24Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/751) |

-----

# UniNet 统一对比学习框架

  - **UniNet**：A Contrastive Learning-guided Unified Framework with
    Feature Selection for Anomaly Detection，CVPR 2025（作者 Shun Wei、Jielin
    Jiang、Xiaolong Xu；没有 arXiv 版本，[CVF
    论文](https://openaccess.thecvf.com/content/CVPR2025/papers/Wei_UniNet_A_Contrastive_Learning-guided_Unified_Framework_with_Feature_Selection_for_CVPR_2025_paper.pdf)），官方代码
    [pangdatangtt/UniNet](https://github.com/pangdatangtt/UniNet)
  - 类型：Classification and Segmentation（图像级检测和像素级分割）
  - 动机：多数异常检测方法为特定领域（如工业场景）设计，应用到其他领域时性能很差，根源是**不同领域的特征差异**。UniNet
    希望给出一个**通用的统一框架**
  - 核心思想：基于 **ReContrast** 的「教师-学生 + 瓶颈」框架，提出三点创新：①**领域相关特征选择
    (DFS)**：引导学生利用领域先验从教师特征中选择有代表性的特征并还原；②**相似度对比损失**（加强同类特征的相关性）和**间隔损失
    (margin loss)**（强制拉开异常与正常相似度之间的距离）；③**加权决策机制**，动态计算异常分数
  - 论文在 **12 个数据集**（工业缺陷、医学影像、视频监控）上超过现有方法；同时支持无监督和有监督设置，强调**多类别**异常检测
  - 师生类方法，对比 [STFPM](/0324_paper_STFPM)、[Reverse
    Distillation](/0749_paper_ReverseDistillation)、[EfficientAD](/0748_paper_EfficientAD)

## 前置：ReContrast

UniNet 以 ReContrast 为原型：由一个**预训练教师**、一个**瓶颈**和一个**可学习的学生**组成，通过类似对比学习
(CL) 的做法把整个框架优化到目标领域。ReContrast
首先提出**全局余弦距离**，更好地保持特征点之间的全局一致性、避免训练不稳定；之后优化预训练教师使其适配目标领域，但这会导致模式坍塌，所以借鉴自监督
CL
引入**停止梯度**，并增加一个**冻结的教师**，避免「恒等捷径」（没有对比对）：两个教师从同一张图产生两个视图，即目标领域视图和源领域视图，类似
CL 范式的图像增强。

$$ L\_g = \\sum\_{i=1}^{n} d\\big(F\_T^i, F\_S^i\\big) =
\\sum\_{i=1}^{n}\\Big(1 - \\frac{\\mathcal{F}(F\_T^i) \\cdot
\\mathcal{F}(F\_S^i)}{\\lVert \\mathcal{F}(F\_T^i) \\rVert\\ \\lVert
\\mathcal{F}(F\_S^i) \\rVert}\\Big) $$

其中：

  - $F\_T^i, F\_S^i \\in \\mathbb{R}^{C\_i \\times H\_i \\times
    W\_i}$：教师、学生第 $i$ 层的输出，$C\_i, H\_i, W\_i$ 为通道数、高、宽；$n$：层数
  - $\\mathcal{F}(\\cdot)$：把 $C \\times H \\times W$
    的特征展平成一个向量；$d(\\cdot,\\cdot)$：余弦距离。把整层特征展平后计算**一个**余弦距离，叫「全局」余弦距离，区别于逐位置计算
  - 加入停止梯度时，对教师特征使用 $\\text{SG}(\\cdot)$ 算子（不回传梯度）：$L\_g = \\sum\_i
    d\\big(\\text{SG}(F\_T^i),\\ F\_S^i\\big)$

## 原理

UniNet 的整体框架由「一对教师、一个瓶颈、一个学生」组成，包括四个关键部件：MEM、DFS、相似度对比损失 $L\_{SC}$ 和间隔损失
$L\_M$：

``` mermaid
graph TD
    X["输入图像"] --> T1["冻结教师 目标视图"]
    X --> T2["可学习教师 源领域视图 带停止梯度"]
    T2 --> B["瓶颈 含 MEM 多尺度嵌入模块"]
    B --> S["学生模型"]
    T1 --> DFS["DFS 领域相关特征选择<br/>用教师特征产生权重 引导学生选择特征"]
    DFS --> S
    S --> LOSS["损失: L_KD + L_SC + L_M<br/>有监督时再加 L_S"]
    T1 --> LOSS
    S --> W["推理: 加权决策机制<br/>2n 张异常图 动态确定分数"]
```

图中：

  - **MEM（Multi-Scale Embedding Module，多尺度嵌入模块）**
    位于瓶颈内。动机：此前的方法常用一组小卷积核以控制计算量，难以捕捉特征间的上下文关系；而近期研究表明适当使用少量**大卷积核**对视觉任务有益。设计：把输入沿通道维分成两部分，分别用
    $k \\times k$（$k$ 取 3 或 7）卷积捕获**全局**和**局部**信息（卷积 + BN + ReLU，再一个卷积 +
    BN），然后拼接，用 $1\\times1$ 卷积和 BN 压缩通道，最后在 ReLU
    前加残差连接。由于使用大卷积核会增加参数量和推理时间，论文用**重参数化**把大核卷积层和
    BN 层等价转换为小核卷积（7×7 等效为 3×3），降低计算开销

$$ W\_R = \\frac{\\gamma}{\\sqrt{\\sigma^2 + \\epsilon}} \\cdot W,
\\qquad b\_R = b - \\frac{\\mu\\gamma}{\\sqrt{\\sigma^2 + \\epsilon}} $$

其中 $W$ 是小核卷积层的权重；$W\_R$、$b\_R$
是重参数化后等价卷积层的权重和偏置；$\\mu$、$\\sigma^2$、$\\gamma$、$b$
是 BN 层的均值、方差、权重（缩放）和偏置；$\\epsilon$ 是防止除零的小常数。这里是标准的「卷积与 BN 融合」。

  - **DFS（Domain-Related Feature Selection，领域相关特征选择）**：此前的 ReContrast
    虽然迁移能力强，但对目标领域相关特征的捕捉不足，会丢失关键信息。DFS
    让学生**只学习目标领域的代表性信息**，而不是教师的全部信息。用教师特征生成一个权重
    $w\_i$，控制从教师选取多少代表信息：

$$ w\_i = \\frac{\\exp\\big(\\tilde{F}*T^i -
\\delta\\big)}{\\sum*{j=1}^{H\_i W\_i}\\exp\\big(\\tilde{F}\_T^i(:, j) -
\\delta\\big)}, \\quad \\delta = \\max(\\tilde{F}*T^i), \\qquad F\_g^i =
\\frac{1}{H\_i W\_i}\\sum*{h,w}F\_T^i(:, h, w) $$

$$ \\big(F\_S^i\\big)*P = F\_S^i \\odot \\big{(w\_i)*R \\odot (\\alpha +
F\_g^i)\\big}, \\qquad L*{KD} = \\sum*{i=1}^{n}
d\\big(\\text{SG}(F\_T^i),\\ (F\_S^i)\_P\\big) $$

其中：

  - $\\tilde{F}\_T^i \\in \\mathbb{R}^{C\_i \\times H\_i
    W\_i}$：展平后的教师特征；$w\_i \\in \\mathbb{R}^{C\_i
    \\times H\_i W\_i}$：沿空间位置的 softmax 权重，$\\delta$ 取特征最大值做数值稳定（减去最大值不影响
    softmax）

  - $F\_g^i \\in \\mathbb{R}^{C\_i \\times 1 \\times
    1}$：教师特征的**全局信息**（全局平均池化）。为了不只依赖局部信息，把全局信息融合进权重，实现权重交互，提高感知能力；$(w\_i)\_R$
    是 reshape 回 $C\_i \\times H\_i \\times W\_i$ 的权重

  - $\\alpha$：可学习参数，灵活控制领域相关特征选择的程度（论文原文中该符号在文本里丢失，这里用 $\\alpha$
    表示）；$(F\_S^i)\_P$：学生在权重作用下选出的领域相关特征；$\\odot$：逐元素相乘

  - $L\_{KD}$：最小化教师（停止梯度）与学生的领域相关特征之间的距离，使学生有效地学到先验知识

  - **相似度对比损失与间隔损失**：多数无监督方法由于缺乏异常样本，**很难建立类别边界**；即使用一些异常样本训练，对未见过的异常也难以区分。UniNet
    先用**相似度对比损失**增强正常特征之间的相关性，使其紧密聚集，这自然会与异常特征拉开距离；再用**间隔损失**强制二者相似度之间有更大的分离，进一步提高区分力。先计算学生与教师输出之间的相似度矩阵：

$$ m\_i = \\frac{(F\_S^i)*P \\cdot (F\_T^i)^\\top}{\\lVert (F\_S^i)*P
\\rVert\\ \\lVert F\_T^i \\rVert \\cdot T}, \\qquad \\bar{m}*i =
\\text{softmax}(m\_i), \\qquad L*{SC} =
-\\frac{1}{n}\\sum*{i=1}^{n}\\sum*{j=1}^{N\_1}\\log\\big(\\text{diag}(\\bar{m}\_i)\_j
+ \\epsilon\\big) $$

其中：

  - $m\_i$：学生-教师特征的相似度矩阵（展平后为 $H\_i W\_i \\times C\_i$
    的形式相乘），$T$：温度参数，控制相似度的分布（论文取 $T =
    2$）；$\\bar{m}\_i$：沿最后一维做 softmax 后的归一化相似度矩阵
  - $\\text{diag}(\\bar{m}\_i)$：对角元素，就是**同一位置学生-教师对**的相似度；$N\_1$：正常样本数（$N\_1
    \\le N$，$N$ 为样本总数）；$\\epsilon$：防止对数无穷的小常数
  - $L\_{SC}$：最大化正常样本的对角相似度（取负对数），加强正常特征对内部的关系
  - **间隔损失 $L\_M$**：在 $L\_{SC}$
    之后进一步改善可分性：它要求正常特征有更高的相似度（对角相似度低于某个边界会被惩罚），当有异常样本参与训练（有监督设置）时，还约束异常特征的相似度低于某个范围，提高可区分性；边界由超参数控制。论文原文中这个式子的符号在文本中缺失，这里只给出文字描述。**训练总损失**：

$$ L\_U = L\_{KD} + (1 - \\lambda) L\_{SC} + L\_M $$

其中 $\\lambda$ 是平衡超参数；**有监督设置**下再加入针对任务的监督项 $L = L\_U +
\\sum\_{i=1}^{n-1}L\_S\\big(\\varphi(F\_S^i), l\\big)$，$L\_S$ 是二元交叉熵或
Dice 损失，$\\varphi$ 是展平或上采样操作，$l$ 是标签或真值掩码。

  - **加权决策机制（推理）**：此前方法常用固定的 Top-K（如 K=3%）异常图数值来算图像分数，无法保证稳健。UniNet
    对每个样本动态计算图像级分数：由一对教师和一个学生，每层可由余弦距离得到**两张**异常图，共 $2n$
    张；取每张异常图的最大值得到 $2n$ 个「低相似度」值，经 Softmax 变成概率分布 $N$；$N$
    中高于均值的值组成集合 $P$，用来动态计算权重 $v\_w$（有上下限超参数）；再把 $2n$
    张异常图上采样并累加，得到最终像素级异常图
    $M\_{AS}$；最后**自适应地选取 $M\_{AS}$ 中最大的 $v\_w$
    比例**的值取平均作为图像级分数。分割任务直接用 $M\_{AS}$

## 实现细节

| Name | 设置                                                            |
| ---- | ------------------------------------------------------------- |
| 骨干   | WideResNet50（学生与教师）                                           |
| 优化器  | AdamW；可学习学生学习率 $5\\times10^{-3}$，教师学习率 $10^{-6}$；batch size 8 |
| 输入   | 256×256；MVTec 3D-AD 只使用 RGB 数据训练                              |
| 超参数  | $n=3$、$T=2$ 以及其余四个超参数分别为 1、0.7、0.01、0.03（论文按符号顺序列出）           |
| 评估指标 | 检测：图像级 AUROC、AP（医学：F1、ACC）；分割：像素级 AUROC、PRO（医学：DSC、mIoU）      |

表中是论文设置：UniNet 有 3 层（$n=3$）、温度 $T=2$。

## 实验结果

  - **数据集（12 个）**：工业：MVTec AD、BTAD、MVTec
    3D-AD（无监督），VAD（有监督）；医学：APTOS、OCT2017、ISIC2018（无监督），Kvasir、CVC-ClinicDB、CVC-ColonDB（有监督）；视频监控：Ped2（无监督）
  - 以 ReContrast 为基线对比。**工业无监督结果**（论文 Table 1）：

| Dataset     | I-AUROC   | P-AUROC | PRO   |
| ----------- | --------- | ------- | ----- |
| MVTec AD    | **99.90** | 98.81   | 96.00 |
| BTAD        | **97.73** | 97.70   | \-    |
| MVTec 3D-AD | **95.76** | \-      | 95.55 |

表中是 UniNet 在三个工业无监督数据集上的结果。在 MVTec AD 上，UniNet 在多项指标上最优，仅像素级 AUROC 比
RealNet 低 0.22%；在 MVTec 3D-AD 上图像级 AUROC 比基线 ReContrast（88.63）高出约 7
个点。表中 `-` 表示该项在论文表格里的值未在此引用。

  - **消融实验**（论文 5.3 节）：MEM 提供更丰富的上下文；加入 DFS 获得领域相关信息，提升性能；只用 $L\_{SC}$
    的效果低于 $L\_{SC}$ 与 $L\_M$
    同时使用，因为有些正常特征的相似度不够高；加权决策机制对检测性能贡献显著，相比固定取最大的
    3% 的做法，在 MVTec 3D-AD 上提升 **0.86%**。t-SNE 可视化显示：没有 $L\_{SC}$ 和 $L\_M$
    时无监督设置难以改善类别边界，加入后正常特征更紧、相似度更高；有监督设置下异常特征被排斥，能区分未见过的异常

**anomalib 复现的结果**（README，MVTec AD 平均）：Image AUROC 0.956，Pixel AUROC
0.976，Image F1 0.957。数值低于论文报告的 99.90 / 98.81，其中图像级差距较大；对比 [Reverse
Distillation](/0749_paper_ReverseDistillation)（0.985）和
[EfficientAD](/0748_paper_EfficientAD)（0.982）也偏低。anomalib 的参数
`student_backbone`、`teacher_backbone` 默认 `wide_resnet50_2`，`temperature`
默认 0.1，与论文中的 $T=2$ 不同，复现时需要注意。指标含义见 [Anomaly Detection
Metrics](/0711_ML_Metrics_Anomaly)。

## 特点与局限

  - **优点**：跨领域（工业、医学、视频）的统一框架；DFS
    让学生聚焦领域相关特征；相似度对比损失和间隔损失建立更清晰的正常/异常边界；动态的加权决策取代固定
    Top-K；无监督和有监督都支持；论文中多个数据集精度领先
  - **局限**：结构和超参数多；论文里部分损失细节需要对照原文和官方代码；anomalib
    复现的图像级精度明显低于论文；有监督设置需要像素级或图像级标注

## Reference

  - [UniNet: A Contrastive Learning-guided Unified Framework with
    Feature Selection for Anomaly Detection
    (CVPR 2025)](https://openaccess.thecvf.com/content/CVPR2025/papers/Wei_UniNet_A_Contrastive_Learning-guided_Unified_Framework_with_Feature_Selection_for_CVPR_2025_paper.pdf)
  - [official code](https://github.com/pangdatangtt/UniNet)
  - [anomalib -
    UniNet](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/uninet)
