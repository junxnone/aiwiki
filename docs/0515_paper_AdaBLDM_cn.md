---
Title | paper AdaBLDM cn
-- | --
Created @ | `2025-05-08T07:10:33Z`
Updated @| `2025-05-12T02:57:38Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/515)

---

# AdaBLDM 译文

> 一种通过具有在线自适应功能的混合潜在扩散模型进行工业缺陷生成的新方法

Hanxi Li1,2,†, Zhengxun Zhang1,2,†, Hao Chen2, ⋆, Lin Wu Senior Member, IEEE3, ⋆, Bo Li4, Deyin Liu5, and
Mingwen Wang1
1Jiangxi Normal University, Jiangxi, China
2Zhejiang University, Zhejiang, China
3Department of Computer Science, Swansea University, SA1 8EN, United Kingdom
4Northwestern Polytechnical University, Shannxi, China
5Zhengzhou University, Henan, China
†These authors contributed equally to this work
⋆Corresponding author



## 摘要

要有效应对工业异常检测（AD）所面临的挑战，需要充足的有缺陷样本，但在工业环境中，样本稀缺这一限制因素常常阻碍了这一需求的满足。本文介绍了一种新颖的算法，旨在扩充有缺陷样本，从而提升异常检测的性能。所提出的方法对混合潜在扩散模型进行定制，以生成缺陷样本，采用扩散模型在潜在空间中生成有缺陷样本。由 “三值图” 掩码和文本提示控制的特征编辑过程对生成的样本进行优化。图像生成推理过程分为三个阶段：自由扩散阶段、编辑扩散阶段和在线解码器自适应阶段。这种复杂的推理策略生成了具有多样模式变化的高质量合成缺陷样本，基于扩充后的训练集，显著提高了异常检测的准确率。具体而言，在广泛认可的MVTec AD数据集上，所提出的方法分别将基于扩充数据的异常检测的最先进（SOTA）性能在异常检测指标AP、IAP和IAP90上提升了1.5%、1.9%和3.1%。这项工作的实现代码可在GitHub仓库 https://github.com/GrandpaXun242/AdaBLDM.git 获取。 

**关键词——异常检测，混合潜在扩散模型，在线自适应。** 

## 1 引言

在实际的制造工作流程中，获取有缺陷的样本比获取无缺陷的样本要困难得多。因此，最近提出的大多数用于工业缺陷检测的算法，如文献[1]至[10]中的算法，都将该问题视为异常检测（AD）问题，这是机器学习领域中一个公认的具有挑战性的问题[11,12]。在这些工业异常检测算法中，假定所有无异常样本，无论是完整图像还是图像补丁，都属于单一分布，同时将有缺陷的样本识别为“离群值”。选择采用异常检测方法进行工业缺陷检测的策略原因很明显：在训练阶段无需有缺陷的样本，这使得这些基于异常检测的算法本质上与实际制造场景相适配。 

然而，实现这种兼容性是以数据分布极不平衡为代价的，在大多数判别算法的情境中，这种特征是不可接受的。因此，一些研究人员建议使用传统方法[1,3,5]生成人工缺陷模式，以助力后续的判别学习过程。最近，最先进的（SOTA）算法[13-15]表明，在训练阶段纳入一些真实的异常样本，若将这些样本与合成样本相结合，可显著提升异常检测的准确性。例如，一些开创性的研究[16,17]证明了使用更复杂的方法生成这些“栩栩如生”的缺陷所带来的益处。图1的前两行展示了两种不同类型的缺陷生成情况。 

![Image](https://github.com/user-attachments/assets/8679f5bb-76c4-49b2-b6d4-44fe1f28d28e)

> [!NOTE]
> 图1. 三种缺陷生成风格的图示。从上到下分别为：传统方法、基于生成对抗网络（GAN）的算法以及所提出的方法。 

在本文中，我们提议将前沿的人工智能生成算法，即扩散概率模型（DPM）[18]，融入到缺陷生成领域。具体而言，我们利用混合潜在扩散模型[19]-[21]来构建我们的框架。为了改进有缺陷样本的生成，我们通过三个模块对混合潜在扩散模型（BLDM）[21]进行创新。首先，我们设计了一种新颖的 “缺陷三值图”，用于在生成的图像上描绘目标物体掩码和缺陷区域，并将其作为一种新的控制信息形式，与稳定扩散模型中的文本提示一起使用。其次，为确保生成样本的真实性，在潜在空间和像素空间中，将一个级联的 “编辑” 阶段引入到混合潜在扩散模型中。最后，提出一种创新性的图像编码器在线自适应方法，以提升生成图像的质量。因此，经过定制的混合潜在扩散模型算法（本文中称为AdaBLDM）能够生成具有模式变化的更高质量的有缺陷样本。图1的第三行简要展示了所提出的基于混合潜在扩散模型的方法。总之，本文的贡献主要有以下三个方面，概述如下。 

- 据我们所知，这是首次将扩散模型应用于工业缺陷生成任务。与最先进的方法相比，混合潜在扩散模型（BLDM）具有生成稳定性、高图像质量和内容可控等优点，这些优点有助于实现更好的缺陷生成器。
- 为了使混合潜在扩散模型算法适用于缺陷生成场景，我们分别在控制信息、预热阶段和在线自适应方面对其进行了调整。经过努力，我们提出了名为AdaBLDM的算法，与现有最先进的方法生成的合成样本相比，该算法生成的有缺陷样本有了显著改进。 
- 利用我们所提出的方法生成的缺陷样本，我们在MVTec AD数据集[22]上取得了新的最先进（SOTA）的性能。具体而言，所提出的AdaBLDM算法在异常检测指标AP、IAP和IAP90上，分别比当前最优方法DeSTseg[6]高出1.5%、1.9%和3.1%。 

本文的其余部分安排如下。在第二节中，我们将讨论文献中的相关工作。第三节将详细介绍所提出的方法。第四节将阐述实验结果和消融研究。我们将在第五节对本文进行总结。 

## 2 相关工作

### A. 合成缺陷生成

由于有缺陷样本的稀缺性，生成合成有缺陷样本已成为研究人员获得令人满意性能的常用方法（文献[1]至[3]、[5]、[6]、[23]）。一种类似于数据增强的简单方法是通过在正常图像上“粘贴”异常像素来模拟缺陷。例如，文献[1]、[24]、[25]中的方法从正常图像中随机裁剪区域，并将它们粘贴到“错误”的位置，以此作为人工缺陷。“裁剪与粘贴”（Crop&Paste）[26]和“伪缺陷生成网络”（PRN）[27]从真实的有缺陷图像中裁剪缺陷区域，并将它们粘贴到无缺陷图像上。尽管这些算法与标准的单类异常检测方法相比，实现了更好的异常检测性能，但它们无法创建新的缺陷模式，因此很可能会导致过拟合问题。为了增加异常的多样性，“深度残差自动编码器异常模型”（DRAEM）[3]、“缺陷分割Transformer模型”（DeSTseg）[6]、“多尺度特征融合语义分割模型”（MegSeg）[5]和“重合成检测”（ReSynthDetect）[28]采用额外的数据集，并结合柏林噪声来制造缺陷。然而，在这些情况下，所制造的缺陷分布与真实缺陷分布不同，因此无法保证性能提升。 

受基于生成对抗网络（GAN）的算法[29]-[31]和基于扩散模型的算法[32]等强大的人工智能生成内容（AIGC）方法的启发，一些研究尝试致力于生成看起来更自然的模拟缺陷。具体来说，基于生成对抗网络的钢表面缺陷检测方法（SDGAN）[30]使用两个生成器来切换样本图像的有缺陷和无缺陷状态。因此，SDGAN[30]能够生成包含有缺陷和无缺陷图像的高质量、多样化的钢表面数据集。与SDGAN[30]类似，缺陷生成对抗网络（Defect-GAN）[33]将无缺陷图像转换为有缺陷图像，以增强缺陷分类器的学习过程。然而，上述两种基于生成对抗网络的生成算法无法生成精确符合要求的缺陷区域。尽管它们能够提高缺陷分类的性能，但无法提升在许多实际应用中至关重要的缺陷分割精度。 

最近，文献[16]和[17]提出生成合成的有缺陷图像以及相应的像素级标签。具体而言，深度条件生成对抗网络（DCDGANc）算法[16]设计了一种新颖的基于生成对抗网络的方法来模拟真实缺陷，该方法可以通过一种改进的泊松融合算法与无缺陷图像进行融合。同时，文献[17]引入了基于风格生成对抗网络第二版（StyleGANv2）[34]的缺陷特征生成对抗网络（DFMGAN），利用所提出的缺陷感知残差块来生成有缺陷的图像和缺陷掩码。尽管上述两种基于生成对抗网络的方法能够生成带有缺陷的高质量图像，但它们在生成与图像上的缺陷像素严格对齐的缺陷区域方面存在不足。这种不对齐归因于特定于图像的生成方法与异常检测的具有挑战性的场景之间的差异，因此会严重误导异常检测中的缺陷分割模型。相比之下，在本文中，我们提出了一种基于扩散模型的新颖缺陷生成方法。我们通过一系列新颖的改进，利用这种通用算法来生成多样、逼真且可精确控制的有缺陷图像样本。 

### B. 用于图像编辑的扩散概率模型

在过去几年里，研究人员提出了各种实现高质量图像生成的方法。现成的工具包括生成对抗网络（GANs）[35]、变分自动编码器（VAEs）[36]、基于流的算法[37]以及扩散概率模型（DPMs）[18]、[38]-[40]。具体来说，扩散概率模型展示出了合成图像更高的质量以及令人印象深刻的训练稳定性。相应地，基于扩散概率模型的方法，如稳定扩散模型（Stability AI）[19]、DALL-E2（OpenAI）[41]和Imagen（谷歌）[42]，在内容生成任务中取得了最先进的性能。 

基于扩散概率模型（DPM）的方法在图像编辑领域也发挥着重要作用。特别是潜在扩散模型 [19] 在低维潜在空间中进行图像生成或编辑，因此能够实现更高的效率；重绘模型（RePaint） [43] 充分利用预训练的去噪扩散概率模型（DDPM） [39]，在反向扩散阶段通过对给定像素进行采样来执行图像编辑；深度卷积人脸模型（DCFace） [44] 使用两个特征编码器来控制扩散模型，以方便进行人脸图像编辑；[45] 提出 “控制网络（ControlNet）” 来控制现有的扩散模型，以实现更好的可控合成；[20]、[21] 通过在像素空间或特征空间中进行修改来实现图像编辑；[46] 提出 “双循环扩散” 来生成无偏差的掩码以指导图像编辑。尽管这些方法在一般的图像编辑任务中展现出了最先进（SOTA）的性能，但由于反向扩散过程本质上具有模糊性，它们很难生成在像素级别精确对齐的图像区域。这种困扰可能会降低异常检测中的分割能力。 

在本文中，我们对前沿的混合潜在扩散模型（BLDM）[21]进行了定制，以生成精确对齐的合成区域，用于工业缺陷检测和定位。需要注意的是，这项工作使用扩散模型来生成合成图像或图像区域，这与为一般编辑任务所提出的开创性工作[18]、[47]类似。我们的方法与那些使用扩散概率模型（DPM）直接在测试图像上预测异常区域的算法[48]-[51]无关。 


## 3 所提出的方法

### A. 任务定义和预备知识

遵循异常检测的常规设置，一个无异常（正常）样本集 $x_{OK}=\{x_{OK}^{i} \in \mathbb{R}^{H_{x} \times W_{x} \times 3}, i = 1,2, \ldots, N_{OK}\}$ 可用于训练。此外，正如在第一节中所介绍的，一些有缺陷（异常）样本 $x_{NG}=\{x_{NG}^{i} \in \mathbb{R}^{H_{x} \times W_{x} \times 3} | i = 1,2, \ldots, N_{NG}\}$ 以及相应的异常掩码 $M_{NG}=\{M_{NG}^{i} \in \mathbb{B}^{H_{x} \times W_{x}} | i = 1,2, \ldots, N_{NG}\}$ 被作为缺陷生成的 “种子”，并且通常 $N_{NG} \ll N_{OK}$ 。所提出方法的目标是生成一些带有合成缺陷区域的训练样本，即

${x_{OK}, x_{NG}, M_{NG}} \stackrel{Defect \ Generator}{\to} {X_{NG}^{ *}, M_{NG}^{ *}}, (1)$

其中 $X_{NG}^{* }=\{x_{NG}^{* i} \in \mathbb{R}^{H_x \times W_x \times 3} | i = 1,2, \ldots, N_{NG}^{* }\}$ 且 $M_{NG}^{* }=\{M_{NG}^{* i} \in \mathbb{B}^{H_x \times W_x} | i = 1,2, \ldots, N_{NG}^{* }\}$ 分别包含所获得的合成样本和相应的缺陷掩码。此外，通常我们设置 $N_{NG}^{*} \gg N_{NG}$ 以确保生成的样本具有高度的模式变化。 

在本文中，我们提议使用扩散模型来生成合成样本。对于扩散模型[18, 38]而言，将生成目标视为无噪声变量 $x_0$ 是很常见的，并且将“正向扩散过程”定义如下：

 $$\large \begin{aligned} 
& q\left(x_{t} | x_{t-1}\right)=\mathcal{N}\left(x_{t} ; \sqrt{1-\beta_{t}} x_{t-1}, \beta_{t} I\right) \\ 
& q\left(x_{1: T} | x_{0}\right)=\prod_{t=1}^{T} q\left(x_{t} | x_{t-1}\right), 
\end{aligned}$$ 

其中 ${\beta_{t} \in(0,1)}_{t = 1}^{T}$ 表示预定义的方差调度， $I$ 是单位矩阵。当 $T$ 足够大时，扩散过程可以将一张正常图像转换为随机噪声 $x_T$ 。相反，“反向扩散过程”定义为：
 
$$\large \begin{aligned} 
& p_{\theta}\left(x_{t-1} | x_{t}\right)=\mathcal{N}\left(x_{t-1} ; \mu_{\theta}\left(x_{t}, t\right), \sum_{\theta}\left(x_{t}, t\right)\right) \\ 
& p_{\theta}\left(x_{0: T}\right)=p\left(x_{T}\right) \prod_{t=1}^{T} p_{\theta}\left(x_{t-1} | x_{t}\right), 
\end{aligned}$$ 

其中 $\mu_{\theta}(\cdot)$ 和 $\sum_{\theta}(\cdot)$ 是两个未知函数，通常用深度模型来近似表示。在测试阶段，给定不同的随机高斯噪声样本 $x_{T}^{\bar{i}}$ ， $i = 1, \ldots, N_{t s t}$ ，人们可以从与训练样本相同的域中获得高质量且多样的样本 $x_{0}^{i}$ ，对于所有的 $i$ （通常是RGB图像）。与上述扩散过程类似，我们也可以基于一个在样本集 $x_{OK}$ 和 $x_{NG}$ 上已经学习得很好的扩散模型，在 $x_{NG}^{*}$ 中生成逼真的异常图像。 


### B. 潜在扩散模型与跨模态提示 

#### 1) 带有控制信息的潜在扩散模型：

在本文中，受其值得称赞的优点的启发[19]，我们采用潜在扩散模型（LDM）作为我们方法的主干。顾名思义，潜在扩散模型的正向和反向扩散过程都是在低维潜在空间中进行的。给定一个输入图像 $x \in \mathbb{R}^{H_x \times W_x \times 3}$ ，通过编码器函数 $\Omega(\cdot)$ 可得到其对应的潜在特征 $z \in \mathbb{R}^{H_z \times W_z \times C_z}$ ，即 $z = \Omega(x)$ ，同时也可以通过解码操作从 $z$ 恢复出图像 $x$ ，即 $x = \Phi(z)$ 。基于潜在特征 $z$ 以及公式(3)的一些简化，潜在空间中的反向条件概率被修正为：
 $\large p_{\theta}(z_{t - 1} | z_t, t, C) = \mathcal{N}\left(z_{t - 1}; \frac{1}{\sqrt{\alpha_t}}\left(z_t - \frac{1 - \alpha_t}{\sqrt{1 - \overline{\alpha}_t}}\right), \sigma_tI\right)T, (4)$

$T=\epsilon_{\theta}(z_t, t, C)$

其中 $\epsilon_{\theta}(\cdot)$ 表示待训练的 $\theta$ 参数化深度模型； $C$ 表示输入到潜在扩散模型中用于稳定生成过程的控制提示信息[19]； $\alpha_t$ 、 $\overline{\alpha}_t$ 和 $\sigma_t$ 是在每个第 $t$ 步都可以通过确定性方式计算得到的参数。在我们的方法中，我们提议生成跨模态控制特征，以提高合成缺陷的质量。 

#### 2) 语言提示：

作为一个有效的模块，语言提示被引入来控制和稳定扩散模型的生成过程[19, 21]。在这项工作中，语言提示\(y\)是通过在以下模板句子中指定关键词来获得的：
$\large y := "\{obj\}, a \{obj\} \text{ with a } \{def\}", \quad (5)$
其中，关键词\(obj\)和\(def\)分别表示当前对象的类别（如图2中的胶囊）和缺陷类型（比如胶囊上的黑色污染物）。可以看出，这种模板设计很直接，因此提示很容易获得。然后，句子 $y$ 由CLIP模型[52]的参数冻结的文本编码器 $\tau(\cdot): \mathbb{R}^{d_y} \to \mathbb{R}^{d_{lang}}$ 进行处理。特别地，如图2所示，语言控制信息被输入到生成模型 $\epsilon_{\theta}(\cdot)$ 中，并且生成过程是由[19]中提出的KQ-V注意力机制来控制的。 

#### 3) 缺陷三值图提示：

回想一下，在实际的异常检测任务中，无缺陷样本在数量和模式变化方面通常较为充足。因此，我们提议基于无缺陷原型来生成有缺陷样本，而非从零开始生成。简而言之，设计了一个“三值图” $\Gamma \in \mathbb{R}^{H_{x} \times W_{x}}$ 来指定生成对象和缺陷的期望位置，如图2所示。为了获得合适的三值图，我们首先使用[14]中提出的方法，在随机选择的无缺陷图像 $x_{OK}$ 上估计前景区域，并将前景掩码保存为 $F \in \mathbb{B}^{H_{x} \times W_{x}}$ ，其中 $F(x, y)=1$ 表示坐标 $[x, y]$ 处为前景像素。其次，基于从集合 $M_{NG}$ 中随机选择的真实异常掩码创建一个合成缺陷掩码。形式上，新异常掩码的生成过程表示为：

$`\mathcal{M}_{NG} \stackrel{rand. i}{\to} M_{NG}^i \stackrel{rand. affine}{\to} M_{NG}^A \stackrel{fit F}{\to} M_{NG}^{* }, (6)`$

其中 $M_{NG}^{i}$ 、 $M_{NG}^{A}$ 、 $M_{NG}^{*} \in \mathbb{B}^{H_{x} \times W_{x}}$ ；“rand.  $i$ ”指随机索引选择；“rand. affine”表示随机仿射变换，而“fit  $F$ ”表示调整 $M_{NG}^{A}$ 的位置和比例，使调整后的掩码完全处于由 $F$ 定义的前景区域内。最后， $\Gamma$ 上每个像素的值定义如下：

$$\Gamma(x, y)= 
\begin{cases} & 1 & \text{ If } M_{N G}^{*}(x, y)=1, \\    
&0.5 & \text{ If } F(x, y)=1 \\ 
&0 & \text{else.} 
\end{cases}$$

如图2所示，在提出的AdaBLDM算法中，首先通过一个卷积块对控制三值图 $\Gamma$ 进行嵌入操作，得到 $\zeta(\Gamma) \in \mathbb{R}^{H_z \times W_z \times C_z}$  。

然后将嵌入特征输入到编码器网络 $\hat{\epsilon}_{tri} (\cdot)$ 中，该编码器网络与 $`\epsilon_{\theta}(\cdot)`$ 的去噪编码器结构相同且初始参数一致，不过原有的“空间注意力”模块被替换为对嵌入的三值图特征进行的自注意力处理过程。

之后，从  $\hat{\epsilon}_{\text{tri}}(\cdot)$  不同层提取的深度特征通过按元素相加的方式注入到 $`{\epsilon}_{\theta}(\cdot)`$  的去噪解码器的相应层中(见图2).

![Image](https://github.com/user-attachments/assets/68dcdf52-87d1-498c-b669-0a2255a446b8)

> [!NOTE]
> 图2. 所提出的基于混合潜在扩散模型（BLDM）的方法的网络结构，用于在图像上生成缺陷区域。可以看到，除了噪声输入外，该模型由一个文本提示和一个三值图控制，这个三值图指示了对象和缺陷的位置。 

### C. 损失函数和训练方案

给定跨模态控制特征 ${\tau(y), \zeta(\Gamma)}$，所提出模型的学习目标定义为：

$`L_{L D M}:=\mathbb{E}_{z_t, \mathcal{C}, \epsilon \sim \mathcal{N}(0,1), t}\left[\left\| \epsilon-\epsilon_{\theta}\left(z_t, t, \tau(y), \hat{\epsilon}_{t r i}(\zeta(\Gamma))\right)\right\| _2^2\right], \quad(8)`$

其中 $\epsilon_{\theta}(\cdot)$ 表示去噪模型， $\hat{\epsilon}_{tri}$ 表示潜在三值图特征的编码器。在这项工作中，所涉及的模块采用不同的训练方案进行学习，具体如下所述。


- $\epsilon_{\theta}(\cdot)$ 是通过使用领域数据集（例如，在MVTec AD[22]数据集上进行实验时，使用该数据集中所有子类别的所有训练图像）进行预训练的。在为每个子类别进行模型学习期间，我们保持 $\epsilon_{\theta}(\cdot)$ 的参数冻结。
- 三值图特征编码器 $\hat{\epsilon}_{tri }(\cdot)$ 由原始潜在扩散模型（LDM）[19]的相应参数进行初始化，然后基于真实的有缺陷样本针对每个子类别进行微调。 
- 用于三值图嵌入的卷积块 $\zeta(\cdot)$ 仅基于真实的异常样本从零开始学习。 
- 对于图像编码器 $\Omega(\cdot)$ 和解码器 $\Phi(\cdot)$ ，我们按照文献[19]来部署变分自编码器（VQ-VAE）算法[53]的相应模块，这些模块在训练过程中是固定的。 
- 文本编码器 $\tau(\cdot)$ 是从CLIP模型中获取的，并且在训练过程中保持参数冻结状态。 


### D. 结合内容编辑的多阶段去噪 


在本文中，我们提出在推理阶段通过调整混合潜在扩散（BLD）[20]的编辑方案来进行特征编辑，以生成缺陷。 

首先，给定一个无缺陷图像 $x_{OK}$ 和一个三值图 $\Gamma$ ，按照第三节B3中介绍的方法计算相应的缺陷掩码 $M_{NG}^{*}$ 。然后，执行带有内容编辑的多阶段去噪算法，该算法的工作流程如算法1所示，其中 $\odot$ 表示按元素相乘， $\neg$ 表示对二值图进行按元素的逻辑 “非” 运算。 

如图3所示，在去噪阶段，该流程包含三个阶段。在第一阶段，使用 $T_{1}$ 步来执行传统的去噪操作[19, 38, 39]，且不进行内容编辑。第二阶段花费 $T_{2}$ 步，在膨胀后的缺陷掩码 $M_{NG}^{*}$ 的引导下，将输入特征 $z_{t}$ 与无缺陷图像 $x_{OK}$ 的特征进行融合。在第三阶段，执行本文提出的一种新的内容融合方法。具体来说，融合操作在像素空间中进行，然后将融合后的图像重新映射回潜在空间以进行去噪。图像编码器 $\Omega(\cdot)$ 和解码器 $\Phi(\cdot)$ 协同使用，以便在两个空间之间切换信息。 

![Image](https://github.com/user-attachments/assets/d79b39cc-1048-4603-92db-e1b6ae17a7fc)

![Image](https://github.com/user-attachments/assets/691bcd5e-4559-4d7e-aa10-a15f13b4279d)
> [!NOTE]
> 图3. 所提出的AdaBLDM算法的推理方案。可以看出，整个过程主要可分为四个阶段，即无需编辑的纯去噪阶段、潜在编辑阶段、图像编辑阶段以及解码器自适应阶段。 


### E. 在线解码器自适应 

考虑到合成的有缺陷样本的图像质量会受到图像解码器 $\Phi(\cdot)$ 的显著影响，我们提议针对每个生成的样本对解码器进行微调。一旦从算法1中获得了混合的潜在特征 $z_{NG}^{* } \in \mathbb{R}^{H_{z}^{*} ×W_{z} ×C_{z}}$ ，并且给定了缺陷掩码 $\mathbb{B}^{H_{x} ×W_{x}}$ 以及源图像 $x_{OK} \in \mathbb{R}^{H_{x} ×W_{x} ×3}$  ，我们可以通过执行如算法2中所述的在线更新算法来微调解码器模型 $\Phi(\cdot)$ 。这表明在线自适应策略促使解码器 $\Phi(\cdot)$ 生成与无缺陷图像 $x_{OK}$ 相符的无缺陷像素，同时在原始解码器的引导下输出有缺陷像素。保守比率 $\lambda_{con}$ 平衡这两个目标。在本文的实验中，我们证明了这个在线更新的解码器能够为异常检测（AD）训练生成更逼真的样本，从而实现更高的异常检测性能。 

![Image](https://github.com/user-attachments/assets/a27a4428-13f9-4d41-9754-5b1c1da72d8c)

> [!NOTE]
> “Online Decoder Adaptation（在线解码器自适应）”的算法，其目的是通过调整解码器，优化包含异常信息的混合潜在特征生成的图像，使其更接近无缺陷图像，具体步骤如下：
>  1. **输入与初始化**：
      - **输入数据**：算法接收混合潜在特征 $`z^{* }_{NG}`$ 、无缺陷图像 $`x^{OK}`$ 、最大迭代步数 $`T_{ft}`$ 、保守比率 $\lambda_{con}$ 、异常掩码 $`M^{* }_{NG}`$ 以及解码器 $`\varPhi(\cdot)`$ 作为输入。
      - **初始操作**：首先，使用当前解码器 $\varPhi(\cdot)$ 对混合潜在特征 $z^{* }_{NG}$ 进行解码，得到初始的待优化图像 $`x^{* }_{NG}`$  。同时，对异常掩码 $`M^{* }_{NG}`$ 取反，得到 $`\overline{M}^{* }_{NG}`$ ，用于后续计算。
>  2. **迭代优化过程**：
      - **循环条件**：设置一个循环，从 $t = 1$ 开始，当 $t \leq T_{ft}$ 时持续进行迭代。在每次迭代中：
      - **计算损失项**：
        - 使用当前解码器对混合潜在特征 $z^{* }_{NG}$ 再次解码，得到临时图像 $\widetilde{x}$  。
        - 计算 $L_{i}$ ，它衡量了临时图像 $\widetilde{x}$ 与无缺陷图像 $x^{OK}$ 在非异常区域（由 $\overline{M}^{* }_{NG}$ 标识）的差异，通过对每个像素位置 $(i, j)$ 的差值平方进行加权求和得到。
        - 计算 $L_{d}$ ，它衡量了临时图像 $\widetilde{x}$ 与当前优化后的图像 $`x^{* }_{NG}`$ 在异常区域（由 $`M^{* }_{NG}`$ 标识）的差异，同样是对像素位置差值平方进行加权求和。
      - **更新解码器**：利用AdamW优化器，结合 $L_i$ 和 $L_d$ （ $L_d$ 乘以保守比率 $\lambda_{con}$ 后与 $L_i$ 相加）来更新解码器 $\varPhi(\cdot)$  ，使得解码器朝着减小这两个损失的方向优化。
      - **迭代计数**：将迭代步数 $t$ 增加1 。
>  3. **输出结果**：
      - 当迭代结束（ $t > T_{ft}$ ）后，再次使用优化后的解码器 $\varPhi(\cdot)$ 对混合潜在特征 $z^{* }_{NG}$ 进行解码，得到最终优化后的图像 $`x^{* }_{NG}`$  。
      - 最后返回优化后的图像 $x^{* }_{NG}$  。
>  总体而言，该算法通过迭代地调整解码器，不断优化生成图像，在异常区域和非异常区域分别参考不同的对比标准，从而实现对包含异常的图像的优化，以达到更好的视觉效果或满足特定任务需求。 

### F. 实现细节

在本文中，按照DeSTseg [6] 的设置，将所有图像调整为256×256的尺寸，DeSTseg是本文采用的一种先进的异常检测算法，用于评估生成样本的有效性。通过这种方式，我们设定 $H_{x}=W_{x}=256$  且 $H_{z}=W_{z}=32$  。在本文中，为了实现高效的去噪操作，潜在特征通道数 $C_{z}$  为4。至于三值图提示，通过使用[14]中提出的前景估计方法来估计对象区域，并基于为数据集中每个子类别随机选择的10个真实缺陷样本获得异常掩码。第三节B3中提到的仿射变换矩阵由随机旋转角度 $\gamma \in[0^{\circ}, 360^{\circ}]$  和随机缩放因子 $s \in[0.85,1.15]$  确定。对于纹理子类别（例如木质或织物表面）上的异常检测任务，除了有缺陷的像素外，所有像素都被视为前景。 

我们采用了AdamW优化器[54]来更新模型参数，默认学习率为 $1\times10^{-5}$  ，并且默认的贝塔值分别设置为0.9和0.999。在训练过程中，模型有10%的概率会接收到空文本提示。在推理阶段，我们采用了DDIM[39]采样方法，其中正常去噪步骤的 $T_{1}=50$ ，潜在混合步骤的 $T_{2}=30$ ，像素混合步骤的 $T_{3}=5$ 。在在线解码器自适应阶段， $T_{ft}=200$ ，保守比率 $\lambda_{con}=100$ ，以避免过度拟合到无异常区域。除了学习率设置为 $1×10^{-4}$ 之外，在线自适应所使用的优化器与离线学习时的优化器相同。 

> [!NOTE]
> **DDIM** ： （Denoising Diffusion Implicit Model，去噪扩散隐式模型 ）核心思想是对传统的扩散模型进行改进，旨在在不显著降低生成图像质量的前提下，加快推理。在传统的扩散模型中，生成样本是通过从高斯噪声逐步去噪来实现的。而 DDIM 通过引入一个可学习的噪声预测机制，允许在去噪步骤中跳过一些中间步骤，从而加快了采样速度。DDIM 定义了一个确定性的采样过程，在给定初始噪声和一些模型参数的情况下，能够按照一定的规则逐步恢复出原始的图像（或其他数据）。它通过对扩散过程中的噪声进行精确建模和控制，使得在生成样本时可以灵活地调整采样步数和噪声水平，从而在生成质量和生成速度之间找到一个较好的平衡。

## 4 实验

### A. 实验设置

#### 1) 评估方法

在本节中，我们切实且广泛地评估了所提出的生成缺陷样本的方法。在大多数人工智能生成内容（AIGC）应用中，无论是以定量还是定性的方式衡量，所生成图像的外观质量都是评估生成算法的最重要标准。然而，在缺陷样本生成的场景中，我们认为更重要的衡量标准是对异常检测准确率的提升。因此，基于扩充后的数据集学习了一种最先进的异常检测算法，即DeSTseg [6]，并且相应的性能提升（如果有的话）直接反映了合成样本的有效性。此外，经典的支持向量机（SVM）[55] 也被用作对DeSTseg的补充。具体来说，对支持向量机模型进行训练，将像素分类为正常和异常，通过这种方式，得到了一种简单的异常检测/定位方法。先进的（DeSTseg）和简单的（SVM）异常检测算法相结合，提高了实验的全面性，进而增强了实验的可靠性。 


#### 2）竞争对手

我们将我们的缺陷生成算法与包括深度特征匹配（DFM）[17] 以及基于星型生成对抗网络（StarGAN）[56] 或风格生成对抗网络第二代（StyleGANv2）[34] 算法构建的深度条件生成对抗网络（DCDGANc）[16] 进行比较。然而，根据我们的实验，由于深度条件生成对抗网络（DCDGANc）中原始的风格生成对抗网络第二代（StyleGANv2）很容易导致训练崩溃，在这项工作中，使用风格生成对抗网络第二代自适应版本（StyleGANv2-Ada）[57] 来替代风格生成对抗网络第二代（StyleGANv2），以确保训练的稳定性。此外，还对同样以粘贴方式生成合成缺陷的原始DeSTseg算法的结果进行了比较。所比较方法的训练样本与自适应混合潜在扩散模型（AdaBLDM）的训练样本严格相同。 

#### 3）数据集

为了进行更具通用性的研究，我们在三个知名数据集上开展比较工作，分别是MVTEC-AD [22]（涵盖15个类别中的7个子类别）、BTAD [58]（完整数据集）以及下文将介绍的KSDD2 [59]。 

- **MVTec AD** [22]是一个开放数据集，包含十种常见的物体类别和五种纹理类别，每个物体/纹理类别最多有八种缺陷类别。所有图像都配有显示缺陷区域的像素级掩码。在可用的缺陷类别中，我们选择包含超过10张缺陷图像的类别作为模型的训练数据集。具体来说，我们从测试集中为每个缺陷类别随机选择10张缺陷图像，并从训练集中选取所有无缺陷图像，用于模型训练和缺陷数据生成。由于时间限制，在MVTec AD数据集中，我们专注于使用2个物体类别（榛子和胶囊）和5个纹理类别的数据来评估我们的模型。
- **BTAD** [58] 包含来自三类具有不同本体和表面缺陷的现实工业产品的2540张图像。在评估异常检测（AD）算法时，它通常被视为MVTec AD数据集的补充数据集。与MVTec AD数据集的处理方式一致，我们同样选择了10个缺陷数据实例以及无缺陷数据，用于生成和训练模型。  
- **KSDD2** [59] 包含在解决实际工业问题时获取的3000多张图像。该数据集仅包含一个类别，重点关注表面缺陷。对于模型训练和数据生成，我们仅使用训练集中的缺陷数据和无缺陷数据。 

据我们所知，本文所进行的实验在子类别方面，无论是从数量还是多样性来看，都比当前文献中的任何其他实验涵盖得更多。 

#### 4）异常检测与定位的评估指标

- **Pixel-AUC** 是指像素层面上接收者操作特征曲线（ROC曲线）下的面积。它是最常用的异常检测（AD）评估方法，不过当存在严重的类别不均衡情况时，它无法反映出算法之间真实的性能差异。 
- **PRO**（异常像素召回率，Probability of Recall for Outlier pixels）[60] 专注于异常像素，并平等对待每个异常区域的异常检测性能。因此，PRO 指标对于在大多数异常检测基准测试中常见的类别不均衡情况更为稳健。 
- **AP** [61]指标作为语义分割的一种传统指标，在近期提出的异常检测算法中经常被采用。它从像素层面反映了异常检测的性能。 
- **IAP** 实例平均精度[6] 关注实例召回率，是一个更直接的指标。  
- **IAP90** 对于那些要求极高召回率的应用，在召回率为 $k\%$ 时的精度也会被计算，记为IAP@k 。在我们的实验中，我们参照文献[6]将 $k$ 设为 $90$（即IAP90）。 

#### 5）生成质量的评估指标
遵循图像生成算法的传统评估方式，我们在此也对与生成图像质量相关的分数进行比较。具体而言，比较中涉及到核起始距离（KID）[62] 以及学习感知图像块相似度（LPIPS）[63]。简而言之，前一个指标反映了生成内容的真实性，而后一个指标则表明了生成内容的多样性。 

#### 6）所涉及的异常检测模型的训练设置
在我们的实验中，使用最简单的异常检测方法和一种复杂的异常检测方法来评估生成的样本。从一个极端情况来看，基于支持向量机（SVM）的异常检测算法极其简单，因此能够在图像块级别上直接反映生成图像的原始质量。具体来说，采用基于径向基函数（RBF）核的支持向量机模型作为图像块分类器。通过PatchCore算法[4]提取图像块特征，如果相应的图像块是正常的，则为每个768维的特征分配正标签，而对异常的图像块特征分配负标签。在每次试验中，从合成的有缺陷图像中随机采样100张图像，然后提取5000个正样本图像块特征和5000个负样本图像块特征来训练支持向量机模型。每个子类别上的最终性能是通过对10次采用相同的设置的随机试验的结果求平均值来计算的。 此外，还报告了仅使用真实缺陷数据训练的支持向量机模型的性能。至于参数设置，默认情况下，径向基函数核的γ设置为 $1×10^{-4}$，而正则化参数C设置为1。 

参考DeSTseg [6]（该方法采用判别模型，通过将异常区域与重建的无缺陷对应区域进行比较来检测异常区域），在训练之前，我们首先使用AdaBLDM生成5000个有缺陷样本，然后使用DeSTseg的数据增强方法生成另外5000个有缺陷样本。我们将AdaBLDM生成的有缺陷样本存储在 $D_{gen}$ 中，并将DeSTseg增强的样本存储在 $D_{raw}$ 中。然后，按照5 : 4 : 1的比例从无缺陷样本、 $D_{raw}$ 和 $D_{gen}$ 中采样训练数据。请注意，根据DeSTseg的方法，作为合成数据生成种子的真实有缺陷样本不能用于训练，因为这些样本的无异常版本是未知的。对于每个子类别，对DeSTseg进行10000次迭代学习，并且我们从一个数据集中为所有子类别选取具有唯一迭代次数的DeSTseg模型。 

### B. 定量结果

#### 1）在MVTec AD数据集上的结果
我们首先在知名的MVTec AD数据集上对基于支持向量机（SVM）的异常检测进行比较，并在表IV-B1中报告结果。从表中可以看出，基于AdaBLDM生成的样本，支持向量机（SVM）始终能达到最佳的准确率。真实样本的性能次之，而通过比较最先进的生成算法所得到的样本，其性能比上述两种（AdaBLDM生成的样本和真实样本）都要差。 

另一方面，表IV-B1展示了基于MVTec AD数据集的DeSTseg的异常检测性能。如表所示，所提出的方法在所有五项异常检测指标上均排名第一。具体而言，由AdaBLDM生成的合成样本在像素级曲线下面积（Pixel-AUC）、异常像素召回率（PRO）、平均精度（AP）、实例平均精度（IAP）和IAP90上带来的性能提升分别为1.00%、1.98%、6.68%、6.35%和7.93%。这些显著的提升证明了所提出方法的有效性。 

#### 2）在BTAD和KSDD2数据集上的结果
同样地，我们根据所提出的方法与其他生成算法在另外两个知名的异常检测（AD）数据集上的异常检测性能进行了比较。通过DeSTseg得到的准确率分别总结在表IV-B2（针对BTAD [58] 数据集）和表IV-B2（针对KSDD2 [59] 数据集）中。从这两个表中可以再次看出，所提出的方法具有显著的优越性。由AdaBLDM模拟出的人工缺陷在两个数据集上的所有相关异常检测指标方面都带来了最佳性能。 

#### 3）图像质量
表IV-B3展示了对比的生成算法在图像质量方面的得分。从表中可以看出，所提出的方法在大多数子类别（网格和木材类别除外）以及整体比较中，都取得了最佳的核起始距离（KID）性能。这与表IV-B1中所报告的异常检测性能相符，因为KID指标反映了生成图像的“真实性”。 

相比之下，有趣的是，与其他生成算法相比，我们的方法得出的学习感知图像块相似度（LPIPS）分数较低。 
需要回顾的是，无论是去噪阶段的编辑过程，还是在线解码器的自适应过程，都能防止生成的图像与源图像以及预期的缺陷有过大差异。从这个角度来看，从传统意义上讲，生成图像多样性较差可能是所提出算法的一个缺点，但这也意味着生成过程能得到更好的控制，这对AD 模型的后续训练阶段是有益的。 

### C. 定性结果

为了让读者对所提出的图像生成算法有更直接的印象，我们在此通过比较方法在图4中展示了生成的缺陷。可以看出，所提出的方法，无论是否有在线自适应阶段，与其他方法相比，都能生成明显更逼真的图像。特别是，只有我们的方法能够在榛子子类别上生成“裂纹”缺陷。相反，直接特征匹配（DFM）算法虽然在某些情况下能够生成质量良好的合成缺陷样本，但在其他一些情况下可能无法成功生成。 

我们进一步在细粒度细节方面与现有方法进行比较，实验结果如图5所示。如图5所示，所提出的方法在生成具有特定类别和位置的缺陷区域时，控制得更好。此外，在BTAD和KSDD2数据集上生成的带有合成缺陷的图像如图6所示。可以看出，除了MVTec AD数据集之外，AdaBLDM在这两个不同数据集上生成的图像质量也保持得较好。 

最后，作为对表IV-B1的定性补充，图7展示了由DeSTseg算法预测的异常热图。我们可以看到，高质量的模拟合成数据有利于配备了AdaBLDM的算法，该算法能够输出具有竞争力的用于异常检测和定位的热图。 

![Image](https://github.com/user-attachments/assets/d030867b-d895-4f1b-83e7-0f76f8ab55c1)
> [!NOTE]
> 图4. MVTec AD数据集中的真实缺陷样本和合成缺陷样本。从上到下依次是：带有真实缺陷的样本；使用DCDGANc-StarGAN生成的样本；使用DCDGANc-StyleGAN生成的样本；使用直接特征匹配（DFM）生成的样本以及使用我们的方法生成的样本。 

![Image](https://github.com/user-attachments/assets/4f1b621c-b0f3-4900-b98b-467346800673)
> [!NOTE]
>图5展示了在MVTec AD数据集的榛子子类别上，关于生成质量的细粒度比较。不同的生成算法模拟了不同种类的缺陷，并且可以在更详细的层面上对它们的性能进行比较。 


![Image](https://github.com/user-attachments/assets/17d03c5d-dc21-4c1e-811e-7d96b2639a6f)
> [!NOTE]
> 图6. AdaBLDM在BTAD和KSDDV2数据集上的生成输出结果。 

### D. 消融研究

在本节中，我们系统地评估了我们方法中各个组件的贡献。我们进行了以下实验： 

#### 利用领域知识进行预训练 
如在第三节C部分所介绍的那样，去噪模型 $\epsilon_{\theta}(\cdot)$ 是在领域数据上进行预训练的。如果移除这个模块，AdaBLDM将依赖于来自LAION-5B数据集[65]的先验知识，而该数据集与工业异常检测领域的相关性可能并不高。需要注意的是，为了保证比较的公平性，预训练过程与当前的子类别是严格相互独立的。 


#### 图像编辑

与传统的混合潜在扩散模型不同，我们提议在潜在空间和像素空间中都进行意图编辑（参见算法1）。如果移除这个模块，编辑操作将仅在潜在空间中进行。 

#### 在线解码器自适应

在线解码器自适应已在算法2中介绍。如果缺少此模块，就会得到一个固定的图像解码器。 

消融实验结果总结在表VI中。很明显，随着上述每个模块被添加到算法中，相应的异常检测（AD）性能稳步提升。特别是，总性能提升在平均精度（AP）上为9.78%，在实例平均精度（IAP）上为14.46%，在IAP90上为13.98%。 

![Image](https://github.com/user-attachments/assets/547a519c-43ee-4fe4-b312-6bd0922b59a0)

## 五、结论与未来工作

在本文中，我们提出了一种先进的方法，用于生成逼真的有缺陷样本，以用于工业异常检测和定位。受扩散模型的启发，我们对混合潜在扩散模型（BLDM）进行定制，使其能很好地适用于这一特定任务。所提出的算法，称为AdaBLDM（自适应混合潜在扩散模型），与现有的基于传统“剪切粘贴”方案或生成对抗网络（GANs）的方法相比，能够生成更好的合成样本。通过将AdaBLDM应用于异常检测的数据增强中，由于对像素级对齐的有缺陷区域进行了良好控制，我们实现了异常检测（AD）方面的先进性能。在未来，我们将通过引入更精细的控制信号（例如描述所需缺陷的形状、大小等细节的语言提示）来探索生成高质量的合成缺陷样本。未来工作的另一个有吸引力的方向是加快扩散模型的去噪过程，以便在有限的时间预算内生成更多的缺陷样本，这在大多数实际场景中是一个关键约束。 


![Image](https://github.com/user-attachments/assets/b9afda4a-d81d-401f-8bce-71576988f43b)

> [!NOTE]
> 表一 MVTec AD数据集上支持向量机（SVM）的异常检测与定位性能，像素级曲线下面积（PIXEL-AUC）、PRO、平均精度（AP）、实例平均精度（IAP）、IAP90，最佳数值和次佳数值分别以红色和蓝色显示。  

![Image](https://github.com/user-attachments/assets/730f9b14-788e-491d-b666-52a682a4111d)

> [!NOTE]
> 表二 MVTec AD数据集上DeSTseg的异常检测与定位性能，像素级曲线下面积（PIXEL-AUC）、PRO、平均精度（AP）、实例平均精度（IAP）、IAP90，最佳数值和次佳数值分别以红色和蓝色显示。  

![Image](https://github.com/user-attachments/assets/124393ff-2cda-4378-863c-bc3e89f036e4)

> [!NOTE]
> 表三 在BTAD数据集上DeSTseg的异常检测与定位性能，像素级曲线下面积（PIXEL-AUC）、PRO、平均精度（AP）、实例平均精度（IAP）、IAP90，最佳数值和次佳数值分别以红色和蓝色显示。   

![Image](https://github.com/user-attachments/assets/219aac24-048e-45cf-9f7c-6e13fdbcff34)

> [!NOTE]
> 表四 在KSDD2数据集上DeSTseg的异常检测与定位性能，像素级曲线下面积（PIXEL-AUC）、PRO、平均精度（AP）、实例平均精度（IAP）、IAP90，最佳数值和次佳数值分别以红色和蓝色显示。   

![Image](https://github.com/user-attachments/assets/7c65b299-f38d-46bb-8546-22e065cc348c)

> [!NOTE]
> 表五 对于MVTec AD，在表五中生成图像的 $KID×103@5K$ 和LPIPS@5K指标下，最佳数值和次佳数值分别以红色和蓝色显示。    
