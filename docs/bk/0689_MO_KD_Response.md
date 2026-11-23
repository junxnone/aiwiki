-----

| Title     | MO KD Response                                        |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-23T01:43:08Z`                                |
| Updated @ | `2026-11-23T02:42:29Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/689) |

-----

# 响应蒸馏（Response-based KD）

响应蒸馏（Response-based KD）让 Student 去匹配 Teacher **最终输出层**的信息，通常是 logits
经温度软化后的概率分布。它是最早、最简单、也是用得最广的一类蒸馏：不要求 Teacher 与 Student
结构相近，也不需要访问中间层，只要有输出就能做。本文覆盖这一类的四个代表：Hinton 提出的原始
KD（*Distilling the Knowledge in a Neural
Network*，arXiv:1503.02531）、hard 与 soft 两种蒸馏目标、DKD（*Decoupled
Knowledge Distillation*，CVPR 2022，arXiv:2203.08679）对 KD 损失的解耦，以及 KD
与标签平滑的关系（Müller 等，arXiv:1906.02629；Yuan 等，arXiv:1909.11723）。

**一句话概括：Student 的损失 = 硬标签交叉熵 + $T^2$ × Teacher 软目标与 Student 软输出的 KL
散度；DKD 进一步把这个 KL 拆成"目标类二分类"（TCKD）与"非目标类分布"（NCKD）两项，并分别加权。**

> 标注约定：未标注的内容来自上述论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：总览 [知识蒸馏](0207_MO_KD)；Hinton 原文笔记 [Distilling the Knowledge in a
Neural Network](0208_MO_KD_s)；发展历史 [KD History](0336_MO_KD_History)；视觉
Transformer 中的 hard 蒸馏 [DeiT](0253_ML_Transformer_DeiT)；其他类别见
[特征蒸馏](/0690_MO_KD_Feature)、[自蒸馏](/0693_MO_KD_Self)、[理论与实践](/0698_MO_KD_Theory)。

## 1\. 解决什么问题

  - 用 one-hot 硬标签训练，只告诉模型"正确答案是哪一类"，**丢掉了类别之间的相似性信息**（例如"猫"比"汽车"更像"狗"）；
  - Teacher 输出的概率分布里，非目标类的相对大小恰好包含了这部分信息，Hinton 称之为"暗知识（dark
    knowledge）"；
  - 但训练充分的 Teacher 对目标类往往极度自信（概率接近
    1），非目标类概率小到几乎被忽略——因此需要**温度**把分布"拉平"，让这些小概率显现出来。

## 2\. 符号约定

后文统一使用：

  - $K$：类别数；$y$：硬标签（one-hot），$t$：目标类下标；
  - $z^t\\in\\mathbb R^{K}$：Teacher 的 logits；$z^s\\in\\mathbb
    R^{K}$：Student 的 logits；
  - $T\>0$：温度；
  - $p^t(T)$、$p^s(T)$：Teacher、Student 在温度 $T$ 下的 softmax 输出；$p^s(1)$ 即
    Student 的普通预测。

## 3\. Hinton KD

### 3.1 温度 softmax

$$ q\_i=\\frac{\\exp(z\_i/T)}{\\sum\_{j=1}^{K}\\exp(z\_j/T)} $$

其中：

  - $z\_i$：模型对第 $i$ 类输出的 logit；$q\_i$：第 $i$ 类的概率；
  - $T$：温度。$T=1$ 就是普通 softmax；$T\>1$ 时分布更平缓，小概率类被"抬起来"；$T\\to\\infty$
    时趋向均匀分布；$T\\to 0^+$ 时趋向 one-hot。

用 [0208](0208_MO_KD_s) 里的例子（输入 logits $x=\[2,7,10\]$），温度对输出的影响如下：

| $T$ | 输出概率                       |
| --- | -------------------------- |
| 1   | \[0.0003, 0.0474, 0.9523\] |
| 2   | \[0.0148, 0.1797, 0.8055\] |
| 3   | \[0.0483, 0.2559, 0.6957\] |
| 4   | \[0.0842, 0.2938, 0.6220\] |

表中：

  - 第一列是温度，后三列是三个类别的概率（该数据取自 0208 笔记）；
  - $T=1$ 时第一类概率只有 0.0003，几乎不携带信息；$T=4$ 时升到 0.084，与第二类（0.294）的相对关系变得可见；
  - 这正是用高温生成"软目标"的原因：让小概率类的相对大小能够影响 Student 的训练。

### 3.2 KD 损失

Hinton 的做法是两个目标的加权平均：Student 在高温下匹配 Teacher 的软目标，同时在 $T=1$ 下拟合硬标签：

$$ \\mathcal
L\_{KD}=\\alpha,\\mathrm{CE}\\big(y,;p^s(1)\\big)+(1-\\alpha),T^2,\\mathrm{KL}\\big(p^t(T),|,p^s(T)\\big)
$$

其中：

  - $\\mathrm{CE}(y,p^s(1))=-\\log p^s\_t(1)$：Student 在 $T=1$
    下对目标类的交叉熵（硬标签项）；
  - $\\mathrm{KL}(p^t(T)|p^s(T))=\\sum\_i
    p^t\_i(T)\\log\\frac{p^t\_i(T)}{p^s\_i(T)}$：Teacher 软目标与 Student
    软输出之间的 KL 散度（软目标项）；
  - $\\alpha\\in\[0,1\]$：硬标签项的权重。论文发现通常给硬标签项**明显更低的权重**效果更好 `[原文]`；
  - $T^2$：补偿系数。论文指出软目标产生的梯度幅度按 $1/T^2$ 缩放，因此乘上
    $T^2$，这样改变温度时软、硬两项的相对贡献大致不变；
  - 蒸馏训练时 Student 与 Teacher 用同一个高温 $T$；训练完成后 Student 推理时用 $T=1$。

### 3.3 高温极限：KD 与 logit 匹配

对软目标项求关于 Student logit $z\_i$ 的梯度：

$$ \\frac{\\partial C}{\\partial
z\_i}=\\frac1T,(q\_i-p\_i)=\\frac1T\\left(\\frac{e^{z\_i/T}}{\\sum\_j
e^{z\_j/T}}-\\frac{e^{v\_i/T}}{\\sum\_j e^{v\_j/T}}\\right) $$

其中：$v\_i$ 是 Teacher 的 logit，$p\_i$ 是 Teacher 软目标，$q\_i$ 是 Student
软输出，$C$ 是软目标的交叉熵。

当温度相对 logit 幅度足够高时，用 $e^{x}\\approx 1+x$ 近似，并假设每个样本的 logits
已零均值化（$\\sum\_j z\_j=\\sum\_j v\_j=0$），得到：

$$ \\frac{\\partial C}{\\partial
z\_i}\\approx\\frac{1}{NT^2},(z\_i-v\_i) $$

其中：$N$ 是类别数。也就是说**高温极限下，蒸馏等价于最小化 logits 的均方差
$\\tfrac12(z\_i-v\_i)^2$**。论文进一步指出：温度较低时，蒸馏对"远低于平均值的负 logits"关注更少，这些
logits 几乎不受 Teacher 训练目标约束、可能很噪；当 Student 太小、容纳不下 Teacher
全部知识时，**中等温度效果最好**，说明忽略很负的 logits 可能有益。

## 4\. hard 蒸馏与 soft 蒸馏

  - **soft 蒸馏**：Student 匹配 Teacher 的完整软分布，即上面的 KL 形式；
  - **hard 蒸馏**：只取 Teacher 的 argmax 作为伪硬标签 $y\_t=\\arg\\max\_i
    z^t\_i$，用交叉熵训练：

$$ \\mathcal
L\_{hard}=\\tfrac12,\\mathrm{CE}\\big(y,p^s(1)\\big)+\\tfrac12,\\mathrm{CE}\\big(y\_t,p^s(1)\\big)
$$

其中：$y\_t$ 是 Teacher 预测的类别，两项各占一半权重；这是 DeiT 论文中用到的"hard-label
distillation"形式。在 DeiT 的实验里 hard 蒸馏优于 soft 蒸馏（详见
[DeiT](0253_ML_Transformer_DeiT)）。

## 5\. DKD：把 KD 损失解耦

DKD（Decoupled Knowledge Distillation，CVPR 2022）重新审视 KD
损失：作者把一次分类预测分成两层——① 目标类 vs
所有非目标类的二分类；② 各非目标类之间的多分类。

### 5.1 KD 损失的重写

记 $p^t\_t$ 为 Teacher 对目标类 $t$ 的概率，$p^t\_{\\backslash t}=\\sum\_{i\\ne
t}p^t\_i=1-p^t\_t$ 为所有非目标类的概率之和，$\\hat p\_i=p\_i/p\_{\\backslash t}$
为非目标类内部归一化后的分布。经推导，经典 KD 可写成：

$$
\\mathrm{KD}=\\underbrace{\\mathrm{KL}\\big(b^{T},|,b^{S}\\big)}*{\\mathrm{TCKD}}+(1-p^{T}*{t}),\\underbrace{\\mathrm{KL}\\big(\\hat
p^{T},|,\\hat p^{S}\\big)}\_{\\mathrm{NCKD}} $$

其中：

  - $b=\[p\_t,;p\_{\\backslash t}\]$：目标类/非目标类的二元概率分布，上标 $T$、$S$ 分别表示
    Teacher、Student（论文记号）；
  - **TCKD**（Target Class KD）：目标类二分类的 KL，传递的是"该样本难不难"的信息；
  - **NCKD**（Non-Target Class KD）：非目标类之间概率分布的 KL，传递的是类间相似性，即暗知识；
  - $(1-p^T\_t)$：KD 里 NCKD 的隐含权重，它与 Teacher 对目标类的置信度**负相关**。

### 5.2 两个发现与两个耦合

论文的实验结论（CIFAR-100、ImageNet 等）：

  - TCKD 传递的是"训练样本难度"的知识：训练数据越难（更强的数据增强、更多的标签噪声、ImageNet 这类更难的数据集），TCKD
    的收益越大；单独使用 TCKD 有时无益甚至有害；
  - **NCKD 才是 logit 蒸馏有效的主要原因**：单独使用 NCKD 就能达到与经典 KD 相当甚至更好的结果（论文表 1，例如在
    ResNet8×4 上，NCKD 提升 1.76%，KD 提升 1.13%）；
  - 但经典 KD 是**耦合**的：① NCKD 被 $(1-p^T\_t)$ 加权，Teacher 越自信（$p^T\_t$
    越大），NCKD 权重越小，恰好压制了"最可靠"样本上的暗知识；② TCKD 与 NCKD 的权重被绑死，无法分别调节。

### 5.3 DKD 损失

解耦的做法是把耦合系数换成可调的超参数：

$$ \\mathrm{DKD}=\\alpha,\\mathrm{TCKD}+\\beta,\\mathrm{NCKD} $$

其中：

  - $\\alpha$：TCKD 的权重；$\\beta$：NCKD 的权重，二者独立可调；
  - 实现上与 KD 一样乘以 $T^2$；
  - 论文设置：CIFAR-100 上温度 $T=4$、$\\alpha=1.0$，$\\beta$ 随 Teacher
    不同取值；ImageNet 上 $T=1$，同架构蒸馏取 $\\beta=0.5$，不同架构取
    $\\beta=2.0$；MS-COCO 检测中 $\\alpha=1.0$、$\\beta=0.25$、$T=1$；由于
    $\\beta$ 较大时初始损失很大，CIFAR-100 上使用 20 个 epoch 的线性 warmup；
  - 论文结论：DKD 在 CIFAR-100、ImageNet、MS-COCO
    上取得与复杂的特征蒸馏方法相当或更好的结果，且训练更高效——说明
    logit 蒸馏的潜力被低估了。

## 6\. KD 与标签平滑

  - **标签平滑（Label
    Smoothing）**：用硬标签与均匀分布的加权平均作为训练目标，防止模型过度自信。Müller、Kornblith、Hinton（NeurIPS
    2019）发现：**用标签平滑训练出的
    Teacher，蒸馏效果会变差**——因为标签平滑会让同类样本的倒数第二层表示聚成紧致的簇，logits
    中关于类间相似性的信息丢失，而这些信息恰恰是蒸馏需要的；
  - **KD 是一种学出来的标签平滑**：Yuan 等（*Revisiting Knowledge Distillation via
    Label Smoothing Regularization*）证明 KD 是学习得到的标签平滑正则，反过来标签平滑也提供了一个"虚拟
    Teacher"；他们观察到：Student 可以反过来改进 Teacher，一个精度比 Student 还低的 Teacher
    也能显著提升 Student。由此提出 **Teacher-free
    KD（Tf-KD）**：让模型向自身或人工设计的正则分布学习，无需额外
    Teacher（见 [自蒸馏](/0693_MO_KD_Self)）；
  - 结论：KD 的成功不完全来自类间相似性，软目标的**正则化作用**同样重要。

## 7\. 对比汇总

| 方法              | 蒸馏目标                                           | 关键超参                   | 额外开销                |
| --------------- | ---------------------------------------------- | ---------------------- | ------------------- |
| Hinton KD（soft） | $T^2,\\mathrm{KL}(p^t(T)|p^s(T))$ + 硬标签 CE     | $T$、$\\alpha$          | 需要 Teacher 前向       |
| hard 蒸馏         | Teacher argmax 伪标签的 CE                         | 无温度                    | 需要 Teacher 前向，实现最简单 |
| DKD             | $\\alpha,\\mathrm{TCKD}+\\beta,\\mathrm{NCKD}$ | $T$、$\\alpha$、$\\beta$ | 与 KD 基本相同，多一个超参     |

表中：

  - 第一列是方法，第二列是其匹配对象/损失形式，第三列是需要调的主要超参数，第四列是相对 KD 的额外开销；
  - 三者都只用到 Teacher 的最终输出，不依赖 Teacher 与 Student 的结构对应关系；
  - DKD 只是把 KD 的耦合系数换成独立超参，因此是 KD 的"可替换升级"。

## 8\. 总结 \[解读\]

  - 响应蒸馏简单通用，是其他类别蒸馏的底座；DKD 表明只要处理好 TCKD/NCKD 的权重，不需要中间特征也能做得很好；
  - 实践上先从温度 $T$（常见 2\~4，`[经验]`）与 $\\alpha$ 调起；Teacher
    过强或经过标签平滑训练时要留意效果下降；
  - 响应蒸馏只能利用最终输出，若任务更依赖中间表示（检测、分割），可进一步看 [特征蒸馏](/0690_MO_KD_Feature)。

## Reference

  - Hinton G, Vinyals O, Dean J. Distilling the Knowledge in a Neural
    Network. arXiv:1503.02531
  - Zhao B, Cui Q, Song R, Qiu Y, Liang J. Decoupled Knowledge
    Distillation. CVPR 2022. arXiv:2203.08679
  - Müller R, Kornblith S, Hinton G. When Does Label Smoothing Help?
    NeurIPS 2019. arXiv:1906.02629
  - Yuan L, Tay F E H, Li G, Wang T, Feng J. Revisiting Knowledge
    Distillation via Label Smoothing Regularization. CVPR 2020
    `[会议待核实]`. arXiv:1909.11723
  - Touvron H 等. Training data-efficient image transformers &
    distillation through attention (DeiT). arXiv:2012.12877
