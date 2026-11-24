-----

| Title     | paper Dinomaly                                        |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:47Z`                                |
| Updated @ | `2026-11-24T09:21:20Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/753) |

-----

# Dinomaly 基于 ViT 的特征重构

  - **Dinomaly**：The Less Is More Philosophy in Multi-Class Unsupervised
    Anomaly Detection，CVPR 2025，论文
    [arXiv 2405.14325](https://arxiv.org/abs/2405.14325)，官方代码
    [guojiajeremy/Dinomaly](https://github.com/guojiajeremy/Dinomaly)
  - 类型：Segmentation
  - 问题：近期的一类设置是用**一个统一模型处理多类别图像**（multi-class UAD,
    MUAD），但它的检测性能仍**远落后于**「每类单独训练」的 SOTA
    模型。Dinomaly 要弥合这个差距
  - 核心思想：一个**极简**的、基于重构的异常检测框架，**只用纯 Transformer（注意力 +
    MLP）**，不依赖复杂设计、额外模块或特殊技巧。论文发现对多类异常检测有四个简单而关键的组件：①可扩展的**基础
    Transformer**（提取通用且有判别力的特征）；②**噪声瓶颈**（直接用原有的 Dropout
    完成加噪）；③**线性注意力**（天然不能聚焦）；④**宽松重构**（不强制逐层、逐点重构）
  - 论文结果：在 MVTec AD、VisA、Real-IAD 上的图像级 AUROC 分别为
    **99.6%、98.7%、89.3%**，不仅超过多类 SOTA，也达到了「每类单独训练」的最好记录

## 框架

Dinomaly 由编码器、瓶颈和重构解码器组成：

``` mermaid
graph LR
    X["输入图像"] --> E["编码器<br/>预训练 ViT 共 12 层 DINOv2-Register ViT-Base/14"]
    E --> B["噪声瓶颈 Bottleneck<br/>简单 MLP 收集编码器 8 个中间层特征 并带 Dropout"]
    B --> D["重构解码器<br/>8 个 Transformer 层 线性注意力"]
    E --> L["编码器特征分成 2 组<br/>与解码器特征的余弦相似度"]
    D --> L
    L --> A["重构差的位置为异常<br/>逐点余弦距离的均值为异常图"]
```

图中：

  - **编码器**：不失一般性，用有 12 个 Transformer 层的预训练 ViT，提取不同语义尺度的特征图；论文默认使用
    **DINOv2-Register 预训练的
    ViT-Base/14**（兼顾检测性能与计算效率；论文还系统分析了预训练策略、模型大小、输入分辨率对
    UAD 的缩放行为）
  - **瓶颈**：一个简单的 MLP（前馈网络，FFN），收集编码器 **8 个中间层**的特征表示
  - **解码器**：与编码器类似，由 **8 个 Transformer
    层**组成。训练时，解码器学习重构编码器的中间层特征，目标是**最大化特征图之间的余弦相似度**；推理时，解码器应当能重构特征图的正常区域，却无法重构异常区域（因为它从未见过）
  - 只训练瓶颈 MLP 和解码器，编码器冻结

## 四个关键组件

### ① 基础 Transformer

在无监督设置里缺少监督，多数先进方法依赖预训练网络提取有判别力的特征。近期工作已初步发现，自监督模型的鲁棒、通用特征优于特定于领域的
ImageNet 特征。基础模型（MoCov3、DINO、MAE、SimMIM、BEiT、iBOT、DINOv2
等）产生适用于图像级和像素级任务的通用特征。论文在 UAD 里对基础 ViT
做了缩放行为的系统分析（预训练方式、模型大小、输入分辨率）。

### ② 噪声瓶颈 (Noisy Bottleneck)

此前研究把多类 UAD 性能下降归因于「恒等映射」现象，论文将其重新定义为「**过度泛化**
(over-generalization)」问题：泛化能力是神经网络的优点，但在利用神经网络「认知特性」的无监督异常检测里并不希望如此。多类设置下图像和模式多样性增加，解码器可能把重构能力泛化到没见过的异常样本上，导致用重构误差检测异常失败。

直接的方案是把「重构」改成「**恢复**」：在输入图像或编码器特征上加扰动作为伪异常，仍让解码器恢复无异常的图像或特征（类似去噪），但这些方法使用启发式、手工设计的异常生成策略，不一定通用。Dinomaly
改用简单优雅的 **Dropout**：在 MLP 瓶颈中**随机丢弃神经元激活**。这里 Dropout
的作用不是缓解过拟合，而是作为扰动正常表示的**伪特征异常**，类似去噪自编码器，不引入任何专门模块，就使解码器无论测试图像是否含异常，都倾向于恢复正常特征。论文默认
Dropout 率为 0.2，在多样性强的 Real-IAD 上增加到 0.4。

### ③ 非聚焦线性注意力 (Unfocused Linear Attention)

Softmax 注意力让模型关注输入序列的不同部分：给定 $X \\in \\mathbb{R}^{N \\times d}$，$Q =
XW^Q$，$K = XW^K$，$V = XW^V$，输出为 $\\text{Softmax}(QK^\\top /
\\sqrt{d})V$。论文指出，在多类 UAD
里无论卷积还是注意力，都可能因为**过度集中在对应的输入位置**而形成恒等映射（卷积核退化为只有中心为
1 的核，注意力图退化为单位矩阵）。

论文的解决办法是利用一类无 Softmax 的注意力，即**线性注意力**，它「不聚焦」的特性反而有利：

$$ \\text{LA}(Q, K, V) = \\big(\\phi(Q)\\phi(K^\\top)\\big)V =
\\phi(Q)\\big(\\phi(K^\\top)V\\big) $$

其中：$\\phi(\\cdot)$ 是逐元素的非线性映射（代替 Softmax）；先算 $\\phi(K^\\top)V$ 再左乘
$\\phi(Q)$，计算复杂度从 $\\mathcal{O}(N^2 d)$ 降到 $\\mathcal{O}(N d^2)$（$N$
是序列长度、$d$ 是特征维度）。线性注意力表达能力受限，在监督任务里是缺点，但这里正好被利用：论文训练了分别用 Softmax
注意力和线性注意力做解码器空间混合器的两个变体并可视化注意力图，发现 Softmax
注意力会聚焦到对应位置，而线性注意力的注意力**分散到整幅图像**，降低了解码器把异常区域信息「原样转发」的可能，同时也更高效。

### ④ 宽松重构 (Loose Reconstruction)

  - **宽松约束 (Loose Constraint)**：以往的重构/蒸馏类方法按层蒸馏（如 ResNet
    三个阶段最后一层，或只用解码器最后一层）。按知识蒸馏的直觉，提供更多逐层监督能让学生（解码器）更好地模仿教师，**但这对用「编码器与解码器差异」检测异常的
    UAD 有害**，这也表现为恒等映射。借助柱状 Transformer
    各层自上而下的一致性，论文提出\*\*把感兴趣的多层特征图相加成一个整体（一组）\*\*来重构，放松逐层约束，让解码器有更多自由度，行为与编码器更不一样。anomalib
    与论文默认使用 **2 组**（如低语义组和高语义组）
  - **宽松损失 (Loose
    Loss)**：同样放松逐点重构损失，丢弃部分点。借用**难例挖掘的全局余弦损失**：训练中把已经恢复得很好（余弦距离小）的特征点的梯度**缩小**

$$ \\mathcal{L}*{global\\text{-}hm} =
\\mathcal{D}*{cos}\\big(\\mathcal{F}(f\_E),\\
\\mathcal{F}(\\hat{f}*D)\\big), \\qquad \\hat{f}*D(h,w) = \\begin{cases}
\\text{sg}\\big(f\_D(h,w)\\big)*{0.1} & \\text{if }
\\mathcal{D}*{cos}(f\_D, f\_E) \< k%\_{batch} \\ f\_D(h,w) &
\\text{otherwise} \\end{cases} $$

$$ \\mathcal{D}\_{cos}(a, b) = 1 - \\frac{a^\\top b}{\\lVert a \\rVert\\
\\lVert b \\rVert} $$

其中：

  - $f\_E$、$f\_D$：编码器和解码器（分组后）的特征图；$\\mathcal{F}(\\cdot)$：展平操作；$\\mathcal{D}\_{cos}$：余弦距离；$f\_D(h,w)$：位置
    $(h,w)$ 的特征点
  - $\\text{sg}(\\cdot)*{0.1}$：把梯度**缩小为原来的十分之一**（论文脚注说明完全停止梯度偶尔会造成优化不稳定）；$k%*{batch}$
    表示在一个 batch 内选出余弦距离**较小的 $k%$** 的特征点做梯度缩小
  - 总损失是所有编码器-解码器特征对的 $\\mathcal{L}\_{global\\text{-}hm}$ 的平均
  - 推理时，异常图是**逐点余弦距离的均值**

## 实验

  - **数据集**：MVTec AD（15 类，3629 张训练图，测试 1725 张）、VisA（12 类，8659
    张正常训练图）、Real-IAD（30 类，所有视角，36465 张正常训练图，测试 114585
    张）；指标共 7 个：图像级 AUROC、AP、F1-max；像素级 AUROC、AP、F1-max、AUPRO（见
    [Anomaly Detection Metrics](/0711_ML_Metrics_Anomaly)）；数据集结果取各类平均
  - **训练**：默认配置下训练 10000 / 10000 / 50000 次迭代（MVTec AD / VisA /
    Real-IAD），论文还给出训练时间翻倍的 Dinomaly↑ 版本；编码器 DINOv2-R
    ViT-Base/14，Noisy Bottleneck 的 Dropout 率默认 0.2（Real-IAD 为 0.4）
  - **与类别分离方法比较**（论文 Table 2，传统「每类单独训练」的设置）：Dinomaly（MUAD，即一个统一模型）在
    MVTec AD 上 I-AUROC **99.6**、P-AUROC **98.4**、P-AUPRO **94.8**
  - 消融（4.4 节）：对预训练的 ViT 基础模型，Dinomaly
    对骨干的选择很鲁棒（DeiT、MAE、D-iGPT、MoCov3、DINO、iBOT、DINOv2、DINOv2-R
    都能用，但 DINOv2 系列更好）；模型大小、输入分辨率的缩放也有研究

**anomalib 复现的结果**（README，MVTec AD 15 类平均，seed 42，`max_steps=5000`，batch
size 16）：

| Metric      | 平均值   |
| ----------- | ----- |
| Image AUROC | 0.997 |
| Image F1    | 0.987 |
| Pixel AUROC | 0.984 |
| Pixel F1    | 0.670 |

表中 Image AUROC 0.997 是 anomalib 基准里最高的图像级结果，与论文报告的 99.6% 相当；Pixel F1 为
0.670，说明像素级定位仍有空间。对比 [PatchCore](/0535_paper_PatchCore)（0.980）和 [Reverse
Distillation](/0749_paper_ReverseDistillation)（0.985）高出不少。

## 特点与局限

  - **优点**：框架极简（只有 Attention 和
    MLP）；四个组件各自针对「过度泛化/恒等映射」问题；多类统一模型也能接近甚至超过每类单独训练的方法；图像级精度极高
  - **局限**：依赖 DINOv2 这类大型 ViT 作编码器，显存和推理开销大于小型 CNN 方法；论文中的 Real-IAD
    精度（89.3%）远低于 MVTec AD（99.6%），说明复杂数据集上仍有难度；「宽松重构」的分组数、难例比例 $k%$
    等是需要调的超参数

## Reference

  - [Dinomaly: The Less Is More Philosophy in Multi-Class Unsupervised
    Anomaly Detection](https://arxiv.org/abs/2405.14325)
  - [official code](https://github.com/guojiajeremy/Dinomaly)
  - [anomalib -
    Dinomaly](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/dinomaly)
