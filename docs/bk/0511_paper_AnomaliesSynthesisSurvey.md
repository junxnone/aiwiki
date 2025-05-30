-----

| Title     | paper AnomaliesSynthesisSurvey                        |
| --------- | ----------------------------------------------------- |
| Created @ | `2025-04-11T07:39:36Z`                                |
| Updated @ | `2025-04-16T02:37:21Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/511) |

-----

# A Survey on Industrial Anomalies Synthesis

Xichen Xu1∗ , Yanshu Wang1∗ , Yawen Huang2∗ , Jiaqi Liu3 , Xiaoning Lei4
Guoyang Xie3,4† , Guannan Jiang4,† , Zhichao Lu3 1Shanghai Jiao Tong
University 2Jarvis Research Center, Tencent Youtu Lab 3City University
of Hong Kong 4Department of Intelligent Manufacturing, CATL

## 摘要

本文全面回顾了异常合成的方法。现有的相关研究综述聚焦于有限的技术，缺乏对该领域的整体认识，也没有梳理出不同方法之间的联系。相比之下，我们的研究提供了一个统一的综述，涵盖了大约40种具有代表性的方法，这些方法涉及**手工合成、基于分布假设的合成、基于生成模型（GM）的合成以及基于视觉语言模型（VLM）的合成**。我们引入了首个工业异常合成（IAS）分类法。先前的研究缺乏正式的分类，或者使用的分类方法过于简单，这阻碍了对方法进行系统性的比较以及对发展趋势的识别。我们的分类法提供了一个细粒度的框架，该框架反映了方法上的进展以及实际应用意义，为未来的研究奠定了基础。此外，我们还探索了跨模态合成和大规模视觉语言模型。之前的相关综述在异常合成方面忽视了多模态数据和视觉语言模型，这限制了人们对其优势的理解。我们的综述分析了它们的整合方式、优势、面临的挑战以及前景，为通过多模态学习推动工业异常合成的发展提供了一个路线图。更多相关资源可访问
<https://github.com/M-3LAB/awesome-anomaly-synthesis> 获取。

## 1\. 引言

图像异常检测在制造业中起着至关重要的作用，主要侧重于识别产品的异常情况，从而确保产品质量。在实际应用中，图像异常检测系统通常需要大量高质量的已标注异常样本用于训练。然而，获取高质量的已标注异常样本会产生极高的成本。其困难总结如下：

1.  低缺陷率是一项根本性挑战。在大规模制造场景中，合格产品的比例远远超过异常产品的比例。
2.  需要专门设备，这大幅增加了成本。许多工业异常情况，诸如微观裂纹、细微划痕或隐藏的污染物等，都需要通过高精度仪器（如高倍显微镜和X射线检测系统）来进行检测。这些高精度设备增加了技术基础设施方面的投资。
3.  对异常样本进行标注需要具备领域专业知识并进行细致的分析，这导致标注过程耗时很长。准确的标注需要熟练的专业人员，而这类人员数量有限，这就增加了人力成本。此外，某些异常情况需要使用先进的成像技术进行多模态验证，这进一步加重了时间和资源负担。

为了解决这些局限性，已经开发出了各种图像异常合成算法来生成异常样本，旨在缓解真实异常样本的稀缺问题，并提高下游的检测性能。然而，现有的异常合成算法无法满足工业制造的需求。所面临的挑战如下：

1.  异常分布的有限采样
    针对特定异常类型的异常样本数量有限，这相当于从潜在的异常分布中进行了稀疏采样，无法捕捉到全部的变异性。这种限制迫使算法不得不提高其复杂程度，以满足对多样性的要求。
2.  真实异常情况的合成
    实际中的异常情况极为复杂（例如，裂纹、划痕、污染物、穿孔等），并且与背景纹理相比，存在很大的分布差异。不同异常类型的出现概率各不相同，这给建模过程增添了极大的复杂性。这可能会导致合成的异常情况无法准确呈现现实世界中异常情况的真实特征，进而出现特征缺失或特征不真实的情况。
3.  多模态信息未得到充分利用
    尽管多模态线索（例如用于异常合成的文本提示）越来越多，但如何有效地整合这些信息以合成逼真的异常模式，仍然是一个有待解决的难题。

因此，对当前的工业异常合成（IAS）进行系统分析和全面回顾已势在必行。如图1所示，近年来发表的关于异常检测的论文数量大幅激增，这凸显了工业界和学术界对该领域日益增长的关注。相应地，关于异常合成的研究也显著增多，这反映出人们愈发认识到它在缓解真实异常样本稀缺问题方面的重要性。尽管呈现出这种上升趋势，但现有的异常合成方法仍面临着一些根本性的挑战，这些挑战阻碍了它们在工业制造中的实际应用。通过批判性地审视这些挑战，我们不仅能够明确当前研究的优势与局限，还能为未来的算法开发制定清晰的指导方针。这样的分析将为推进异常合成技术的发展，并优化其在现实场景中的适用性提供基础性的见解。

![Image](media/10f747b856e5996cbcac1bf6de4f871344dfdc1d.png)

> \! 图1：(a)
> 2019年至2024年与异常检测和异常合成相关的论文数量趋势。异常检测领域的论文发表数量呈现出稳定增长的态势，而近年来异常合成受到了越来越多的关注，尤其是在2024年出现了显著的激增。(b)
> 关于异常检测和异常合成的综述性论文对比。尽管存在大量关于异常检测的综述，但异常合成仍是一个新兴领域，截至目前还没有专门针对它的综述。我们的研究首次填补了这一空白。数据来源为<https://github.com/M-3LAB/awesome-industrial-anomaly-detection>
> 。

**与现有综述的对比**：因此，我们提出了一项全面的综述，它不仅弥补了现有研究的不足，还为工业异常合成（IAS）的系统分析建立了一个全新的框架。尽管已有一些综述对工业异常合成进行了简要讨论，但它们存在一些具体的局限性，如表1所示，这些局限性也可归类如下：

1.  合成方法的涵盖范围有限。现有的综述往往将其范围局限于特定的合成方法，无法从整体上对该领域进行全面的阐述。例如，陈等人强调了数据增强策略，但却忽视了更先进的合成方法在生成更具判别性的缺陷表征方面的潜力。同样地，夏等人专注于基于生成对抗网络（GAN）的模型在异常检测和合成方面的性能，却没有探索其他新兴生成范式的潜力。这种碎片化的视角限制了人们对于不同方法在应对实际挑战时如何相互补充的理解。
2.  缺乏专门的分类体系：现有的与异常相关的综述主要聚焦于异常检测，常常把异常合成当作一个次要方面，且没有进行系统的分类。例如，刘等人将异常检测方法宽泛地分为有监督和无监督两类，这无法体现出异常合成方法的多样性。据我们所知，我们的综述是首部专门对工业异常合成（IAS）方法进行系统分类的研究。通过填补这一空白，我们引入了一个专门为异常合成量身定制的结构化分类法，为理解和比较不同的合成方法提供了更全面的基础。
3.  对跨模态合成的重视不足。尽管现有研究认识到利用多种模态的重要性，但许多综述论文并未深入探究诸如大规模视觉语言模型（VLM）这类新兴技术是如何革新异常合成领域的。曹等人提出使用视觉语言模型进行跨模态异常合成。然而，目前迫切需要对其适用性和当前存在的局限性进行系统分析，而这方面的缺失阻碍了人们探索先进方法如何与工业实际需求相契合。

|                          | Liu et al. | Chen et al. | Xia et al. | Cao et al. | Our       |
| ------------------------ | ---------- | ----------- | ---------- | ---------- | --------- |
| Perspective              | Detection  | Detection   | Detection  | Detection  | Synthesis |
| Number of IAS Categories | 2          | 0           | 4          | 4          | 10        |
| Multimodal Interaction   | ✗          | ✗           | ✗          | ✗          | ✓         |

> \! 表1：先前的综述与我们的综述的对比。

**贡献**：这篇综述性论文的主要贡献可总结如下：

1.  我们的综述对异常合成进行了统一且系统的回顾，涵盖了不同范式下近40种具有代表性的方法。通过探究手工合成、基于分布假设的合成、基于生成模型（GM）的合成以及基于视觉语言模型（VLM）的合成，我们给出了一个全面的概述，囊括了该领域现有的全部技术范畴。
2.  我们提出了首个专门针对工业异常合成（IAS）的分类体系，提供了一个结构化且精细的分类框架，该框架反映了方法上的进步以及实际应用意义，从而为工业异常合成领域未来的研究与创新奠定了基础。
3.  这项工作深入研究了在异常合成中多模态线索与大规模视觉语言模型（VLM）的整合，探讨了其潜在的益处、面临的挑战以及未来的机遇。我们的探究为利用多模态学习提供了一个全面的框架，提高了异常合成在工业应用中的有效性。

**文章结构**：本文的其余部分结构如下：第2节介绍了工业异常合成（IAS）的系统分类体系，引入了关键范式及其方法上的差异。第3节至第6节对工业异常合成的四大主要类别进行了深入分析，研究了它们的理论基础、实施策略和实际应用。具体而言，这些章节涵盖了手工合成、基于分布假设的合成、基于生成模型（GM）的合成，以及最近新兴的基于视觉语言模型（VLM）的合成。最后，第7节和第8节总结了本次综述的关键要点，批判性地评估了当前方法的局限性，并概述了有望推动工业异常合成领域发展的未来研究方向。

## 2\. 工业异常合成（IAS）的分类体系

![Image](media/0bc76f82d7e99c176be17e65101c2d8fd406f89a.png)

> \! 图2：图像异常合成（IAS）的分类体系

工业异常合成的分类体系：在图2中，我们展示了工业异常合成（IAS）的详细分类体系。我们将工业异常合成分为四大主要范式：**手工合成、基于分布假设的合成、基于生成模型（GM）的合成以及基于视觉语言模型（VLM）的合成**。就异常合成方法和适用场景而言，每种范式都有其独特的特点。此外，图3展示了这四种范式的内部结构和实施细节，全面呈现了不同方法下的异常合成过程。

**手工合成的定义**：手工合成依赖于人工设计的规则来模拟异常情况，通常无需进行训练，适用于对真实性要求不高且对缺陷多样性要求也不苛刻的可控环境。**自包含**(Self-contained)合成通过裁剪或重新排列等操作来处理原始图像，以模拟纹理错位或颜色变化，从而合成异常区域。**依赖外部数据的合成**(External-dependent)则利用外部数据（例如纹理库）来独立于原始图像合成异常情况，确保异常部分不受原始图像内容的限制。**基于图像修复的合成**(Inpainting-based)通过掩蔽技术去除局部区域，通过添加噪声或黑色斑块来破坏结构的连续性，进而生成异常情况。

**基于分布假设的合成的定义**：基于分布假设的合成依赖于对正常数据分布进行统计建模，并通过可控的扰动来合成异常情况，通常是通过调整正常样本的特征空间来实现。**基于先验的合成**(Prior-dependent)利用预先定义的几何假设（例如，流形或超球面结构）在特征空间中定义正常数据的分布，通过应用可控的偏差，以确保合成的特征层面的异常处于正常分布的边界或之外。相比之下，**数据驱动的合成**(Data-driven)利用数据的内在统计特性，在潜在空间中提取特征，并通过扰动或自适应策略来合成异常情况，从而增强所生成样本的多样性和真实性。

**基于生成模型（GM）的合成的定义**：近年来，生成对抗网络（GAN）和扩散方法等深度生成模型（GM）领域的技术进步，使得能够进行逼真的异常合成。基于生成模型的合成可分为全图合成、全图转换和局部异常合成三类。**全图合成**(Full-image
synthesis)学习异常数据的分布，并构建从随机噪声到异常样本的映射关系。**全图转换**(Full-image
translation)运用域转换技术，将正常图像映射为异常图像，在保留图像整体结构的同时注入异常元素。**局部异常合成**(Local
anomalies synthesis)则是用学到的局部异常来替换正常图像的特定区域，并确保异常区域与背景之间实现平滑过渡。

**基于视觉语言模型（VLM）的合成的定义**：基于视觉语言模型的合成利用拥有数十亿参数的大规模预训练视觉语言模型，借助广泛的预训练知识和整合的多模态线索来合成高质量的异常样本。**单阶段合成**可直接生成逼真的、具备上下文感知能力且细节丰富的异常样本。它运用提示工程或轻量级微调的方式，以实现计算高效的异常合成。相比之下，**多阶段合成**采用一套完整的流程，对全局和局部特征进行优化完善——将合成的异常数据与掩码合成或其他多步骤优化技术相结合——以此提升合成样本的逼真度、多样性，并使其更符合下游任务的需求。

## 3\. 手工合成

### 自包含合成

**自包含合成**是手工合成的一个重要子集。它通过直接操作图像区域来实现，比如裁剪、重新排列或扰动图像的某些部分，从而合成完全源自原始图像的新异常情况。例如，李等人和施吕特等人提出随机裁剪矩形图像块，然后将它们粘贴回正常图像中。此外，吕等人使用贝塞尔曲线来定义异常的形状，并在显著性模型的指导下采用基于
“切割粘贴”
的增强方法来合成异常区域。而且，裴等人从同一物体上提取图像块，应用各种增强操作（如几何变换、颜色扭曲），然后使用掩码引导策略将它们粘贴回物体上，从而提高了下游异常检测的性能。

**优势与劣势**。自包含合成仅从现有图像特征中生成异常情况，因此提供了一种直接且经济高效的方法。通过直接对图像内的区域进行操作（如裁剪或重新排列），它保留了原始的结构和纹理环境，从而增强了模型对细微异常的敏感度。然而，由于这些异常完全源自现有的图像特征，它能够模拟的异常范围和复杂程度在本质上是有限的。这可能会导致其捕捉现实世界中各类异常变化的能力下降，当面对更复杂或多样的异常情况时，可能会影响下游模型的性能。

### 依赖外部数据的合成

**依赖外部数据的合成**是一种通过融入来自外部数据（如纹理库）的纹理来合成异常情况的方法。与自包含合成方法不同，它将外部区域覆盖或混合到原本无异常的图像上。例如，扎夫尔塔尼克等人和张等人利用柏林噪声生成二值异常掩码，使得干净的背景能够与外部纹理相结合，从而生成异常样本。同样地，杨等人通过将异常的位置限定在前景来改进这一过程，这进一步缩小了合成异常与真实异常之间的差距。

**优势与劣势**。依赖外部数据的合成能够借助外部数据生成更为多样的异常模式。它可以生成具有独特分布的异常情况，而仅依靠图像本身的内在内容可能很难复制出这样的异常，因此有可能提升检测模型的鲁棒性。然而，将外部纹理与原始内容无缝整合可能会很困难，常常会导致不一致性或出现视觉瑕疵，尤其是在对高保真度的异常合成至关重要的情况下。

### 基于图像修复的合成

**基于图像修复的合成**是手工合成中的一个特殊类别，它通过有选择地遮盖原始图像的区域来合成异常情况，破坏图像的视觉连贯性（皮尔尼和柴）。与粘贴自包含内容或融入外部纹理的方法不同，基于图像修复的合成专注于引入缺失或被遮挡的区域，通常是通过将区域涂黑或填充噪声来实现。这种从完整图像到不完整图像的转变在基于重建的下游异常检测中特别有效。例如，中西等人、扎夫尔塔尼克等人以及李等人通过遮盖随机区域，然后利用背景信息对其进行重建来合成异常样本。相比之下，罗等人开发了一种自适应掩码生成器，它有选择地隐藏异常区域，同时保留周围的正常背景，从而实现了更具结构性且考虑上下文信息的合成。此外，曹等人和田等人在被遮盖的区域内引入了随机噪声。

**优势与劣势**。基于图像修复的合成是一种简单直接的方法，该方法通过用黑色斑块或噪声替换图像的某些区域来模拟异常情况。它能有效地评估基于重建的检测模型的性能。然而，所生成的异常往往过于简单，可能缺乏现实世界中异常所具有的复杂性和细微特征。

## 4\. 基于分布假设的合成

### 基于先验的合成

**基于先验的合成**是基于分布假设的合成中的一种核心方法，它利用了一种先验几何假设。该方法假定正常数据的潜在空间映射在一个已定义的区域内，通常是一个流形或超球面，而异常数据则落在这个边界之外。通过对正常特征分布进行建模，并应用可控的扰动，合成的异常数据处于这些边界上或超出这些边界，从而有效地模拟真实的异常特征，并提高下游任务的性能。

例如，陈等人将正常特征限制在一个紧凑的空间内，并通过梯度上升和截断投影来引导合成过程，以增强多样性。同样地，陈等人沿径向生成异常数据，以优化决策边界；而申等人则利用流形假设和高斯环带来扰动特征，并计算恢复误差以进行定位。此外，瑙德和拉文将正常数据嵌入非欧几里得空间，并沿着测地线路径进行扰动，从而合成异常数据。

**优点与缺点**。基于先验的合成利用了从正常样本中得出的潜在假设，从而实现可控的扰动，提升了诸如分类或检测等下游任务的效果。在已定义的潜在空间（例如，流形或超球面）内对正常数据进行建模，有助于实现这些扰动。然而，由于大多数方法是在特征层面合成异常数据，它们缺乏用于精确异常分割的空间细节。此外，依赖于预先定义的潜在分布可能会限制捕捉复杂空间异常的能力，进而降低了该方法更广泛的适用性。

### 数据驱动的合成

**数据驱动的合成**是基于分布假设模型中一种行之有效的方法，它通过直接操控正常数据的潜在表征来合成异常情况。这种方法并非依赖于明确的先验假设，而是使用诸如自动编码器之类的模型提取潜在特征，然后引入可控的扰动，比如高斯噪声或其他适应数据的约束条件，以此来合成异常情况。这种灵活的策略利用了数据的内在统计特性，生成的异常情况能够紧密反映异常特征的分布。

近期的研究进展探索了多种方法，以增强数据驱动合成的灵活性和真实性。刘等人和尤等人分别提出了SimpleNet和UniAD，它们通过向提取的特征中添加噪声来直接在特征层面合成异常情况，以此模拟异常特征。然后，SimpleNet中的扰动特征和原始特征会由一个判别器进行评估，以确保合成的异常情况既独特又合理。在此基础上，罗利赫等人提出了SuperSimpleNet，该模型将噪声限制在特定区域，并采用了一种新的分割头，提供了一种更具针对性的异常合成策略。此外，扎夫尔塔尼克等人开发了DSR（双子空间重投影网络），这是一种训练码本的网络，它通过从该码本中采样来替换正常特征中掩码区域的内容，从而合成异常特征。

**优点与缺点**。数据驱动的合成方法通过直接学习正常样本的潜在表征，避免了明确的分布假设。通过神经网络将正常数据映射到潜在空间，并应用扰动，它能够合成出各种类似于现实世界中的异常特征。然而，其有效性依赖于潜在空间的质量，因为训练不佳的模型可能会产生不真实的异常情况。此外，如果不能准确估计正常分布，所生成的异常情况可能会导致决策边界并非最优。

## 5\. 基于生成模型（GM）的合成

### 全图合成

**全图合成**是基于生成模型（GM）的模型中的一种基础方法，被广泛用于直接合成工业异常情况。它利用生成对抗网络（GAN）和扩散模型等生成模型，构建一种独特的映射关系，将高斯噪声转化为异常样本，从而有效地逼近真实异常情况的分布。通过针对不同类型的异常训练不同的模型，就有可能生成种类繁多且与实际异常情况非常接近的高质量数据。

刘等人建立了多阶段生成对抗网络，将纹理生成和背景 -
异常融合解耦，有效地对异常区域和上下文连贯性进行了建模。为了解决数据稀缺的问题，杜等人开发了条件生成对抗网络（Con-GAN），该模型具有共享数据增强和基于超球面的损失函数，它既能同时防止过拟合，又能提高异常的多样性。

段等人还提出了一种两阶段生成对抗网络，即深度特征匹配生成对抗网络（DFMGAN），它包含两个过程：首先对正常样本进行初始学习，然后使用异常样本进行后续微调。

对于复杂异常情况的合成，杨等人创新性地将用于全局结构建模的大感受野与补丁级别的细化机制相结合，实现了宏观上下文和微观细节的协同整合。

**优点与不足**。全图合成虽然能有效地提升异常样本的质量，但其性能在很大程度上取决于训练数据的可获取性和多样性。异常样本数量有限往往会导致出现伪影或不真实的缺陷，从而限制了其实际应用。此外，由于这些模型生成的是完整的图像，而不是直接对正常样本进行修改，它们难以保留精细的结构细节和上下文的一致性。

### 全图转换

**全图转换**是基于生成模型（GM）的模型中的一种关键方法，它通过诸如循环生成对抗网络（CycleGAN）\[朱等人\]和图像到图像生成对抗网络（Pix2PixGAN）\[伊索拉等人\]等域转换技术对正常图像进行变换，从而合成异常情况。全图转换学习正常域和异常域之间的映射关系，在保留结构完整性的同时引入有针对性的修改（例如划痕、污渍）。如今，它是工业异常合成（IAS）的一种非常有效的策略。

最近的研究进展通过提高合成异常的保真度和可控性，显著改进了全图转换。文等人在他们的异常检测流程中扩展了循环生成对抗网络，取得了优异的性能。牛等人提出了基于循环生成对抗网络的框架——半监督域生成对抗网络（SDGAN），该框架纳入了额外的判别器来优化转换过程。通过专注于对异常样本的分布进行建模，半监督域生成对抗网络提高了合成异常的真实感。

此外，张等人引入了缺陷生成对抗网络（Defect-GAN），该网络明确地对污损和修复过程都进行了建模，而不是随意地合成异常。另外，它利用空间分布图来保留正常背景的外观，确保生成图像的结构一致性。

**优点与缺点**。全图转换在将异常情况无缝融入正常情境方面表现出色。然而，它对异常类型和空间分布的控制能力有限。全图转换的固有特性使得精确规定异常出现的位置和方式颇具难度，这可能会降低其在需要进行细粒度异常定位的场景中的适用性。

### 局部异常合成

**局部异常合成**是基于生成模型（GM）的模型中的一种有针对性的方法，旨在通过有选择地修改图像的特定区域来生成局部异常。局部异常合成通常包括通过标注去除图像的部分区域，然后利用生成模型在被屏蔽的区域内合成类似异常的纹理。通过专注于局部变换，它能够创建出可控且多样的异常模式，例如划痕、孔洞或表面不平整等，这些都与现实世界中的异常情况非常相似。

最近的研究进展通过使掩码与合成的异常区域对齐，以及提高合成缺陷与其周围环境之间的空间一致性，来增强局部异常合成的效果。张等人通过放大异常与正常模式之间的差异来增强逼真异常的合成效果。他们提出的RealNet在反向扩散过程中对去噪扩散的方差进行扰动，以合成全局异常图。魏等人在异常区域构建伪正常背景，以突出异常的分布情况。魏等人开发了深度卷积对偶生成对抗网络（DCDGAN），该网络仅在异常纹理上训练模型，并将这些纹理与不同的背景相融合，实现了多类别且多样化的异常合成。

**优点与缺点**。局部异常合成在合成可控的异常样本方面表现出色，使其适用于有针对性的异常合成。将异常限制在特定区域，解决了合成背景对下游任务的影响问题，这是基于生成模型的方法中常见的一个问题。然而，它难以保持纹理与背景之间的连贯性。此外，它依赖于掩码注释来定义异常区域，这使得获取高质量的注释既耗费成本又耗费人力，从而限制了其在大规模工业应用中的可扩展性。

## 6\. 基于视觉语言模型（VLM）的合成

### 单阶段合成

**单阶段合成**利用拥有数十亿参数的预训练视觉语言模型（VLM），借助它们丰富的特征表示和多模态信息。它能合成逼真的异常情况，并在很少调整或无需调整的情况下生成具有上下文感知能力、高度细节化的异常样本。通过利用来自各种模态的丰富线索，单阶段合成在计算效率和领域特定性之间取得了平衡，使其成为工业应用中颇具吸引力的解决方案。

孙等人引入了一种基于“稳定扩散”（Stable
Diffusion）的免训练异常合成方法，该方法最大限度地使异常区域与异常描述保持一致。胡等人从不同模态生成嵌入，并在扩散过程中动态调整它们。这种策略能够创建富含多模态信息的异常情况，从而实现更高的保真度和多样性。此外，江等人提出了CAGEN，它使用掩码注释和文本提示对ControlNet进行微调，以便对合成的异常位置和类型进行精确控制。另外，何等人对跨模态语义特征进行了建模，以实现对生成的异常特征的细粒度控制。

**优点与缺点**。单阶段合成利用多样化的多模态线索来合成逼真的异常纹理。通过同时借助视觉和文本模态，它能有效捕捉详细信息，实现更精准的异常合成，并且可以通过修改提示词进行细粒度控制。然而，一个显著的局限性在于，合成的异常区域往往无法与掩码标注精确对齐，这可能会对下游异常分割任务的准确性产生不利影响。这种对齐误差还会导致异常数据与标注之间不一致，降低其在工业应用中的可靠性。

### 多阶段合成

**多阶段合成**是一种先进的视觉语言模型（VLM）技术，它为异常合成提供了一套全面的流程。该技术集成了多个过程，包括异常合成和精确掩码生成。通过迭代优化全局上下文和局部异常区域，它提高了合成异常的真实性、多样性和上下文一致性，同时能更好地满足下游任务的要求。这套完整的流程增强了工业系统的可用性和可靠性。

近期的研究在这一领域做出了显著贡献。金等人提出了一种双分支视觉语言模型，其中一个分支捕捉全局上下文，另一个分支针对异常区域，并且该模型利用预训练的分割模型来生成高质量的掩码。石等人将文本引导融入全局信息和局部合成中，引入了一种新颖的掩码算法，该算法改进了小尺度异常的合成，并能够对强度和方向进行精确控制。戴等人引入了SeaS，这是一种少样本学习方法，它利用不均衡的异常提示将异常属性与特定的标记绑定，同时对齐正常图像特征以保持真实性，该方法还能生成准确的掩码注释。最后，胡等人开发了AnomalyDiffusion，该模型结合了文本和位置信息以实现精确的异常定位，并采用文本反转来学习掩码嵌入。

**优点与缺点**。多阶段合成整合了顺序训练和精确的异常掩码生成，以优化异常合成过程。它能够捕捉全局上下文和局部细节，提高了合成异常的逼真度和多样性。先进的掩码生成技术使得能够在指定位置进行异常合成，这进一步贴合了工业需求。然而，其复杂性和高昂的计算成本限制了它在资源受限环境下的可扩展性。尽管如此，对于特定工业场景中那些需要逼真且具有上下文感知能力的异常情况的应用而言，多阶段合成仍然至关重要。

## 7\. 未来发展方向

**增强异常多样性**。在工业异常合成（IAS）领域，对异常分布的有限覆盖范围依旧是一个关键瓶颈。现有的方法常常依赖于数量有限的真实异常样本，这就导致在合成的异常情况中出现过拟合现象，并且合成的异常缺乏足够的多样性。一种可行的方法是运用基于自监督学习和主动学习的自适应异常合成技术。例如，具备不确定性感知能力的模型可以通过识别那些代表性不足的异常区域，并对合成过程进行动态调整，从而为合成工作提供指导。此外，采用从粗略到精细的方法，即先生成结构，再对细节进行优化，能够提升异常的多样性。而且，构建规模更大、种类更丰富的数据集对于实现更好的泛化能力而言，仍然至关重要。

**异常属性的可控合成**。工业图像中的异常情况呈现出显著的复杂性，包括形状、纹理和分布的变化。现有的方法往往难以处理这些变化，导致生成不真实或过于简化的异常。为了改善这种情况，未来的工业异常合成（IAS）研究需要聚焦于跨类别一致性建模，利用先进的网络架构（如大规模模型）来学习不同异常类型之间的共同特征和独特特征。此外，应采用可控合成技术，以便能够精确调整异常属性，如异常类型和位置。例如，将局部异常合成与先进的分割模型相结合，有助于对异常属性进行精细调整，确保其与背景完美融合，并提高合成样本的真实性。

**推进多模态异常合成**。尽管诸如文本描述、红外图像和 X
射线扫描等互补模态的数据越来越容易获取，但将它们整合到工业异常合成（IAS）中在很大程度上仍有待探索。未来的进展应着重于开发跨模态对齐策略，利用视觉语言模型（VLM）和多模态变换器来建立不同模态之间的语义关联，从而实现更丰富的异常合成。此外，纳入对比学习技术可以改进跨模态特征学习，确保生成的异常与现实世界中的异常之间有更好的对应关系。还可以探索多源数据融合技术，利用不同模态的互补优势来增强合成异常的鲁棒性。将强化学习集成到多模态合成流程中，能够实现自适应的异常生成，根据异常特征和工业需求动态优化合成策略。

## 8\. 结论

在本次综述中，我们探究了工业图像异常合成（IAS）领域的最新进展。首先，我们确定了该领域的三大关键挑战：

❶ 异常分布的采样有限； ❷ 难以合成逼真的异常情况； ❸ 多模态信息未得到充分利用。

为了解决这些问题，我们提供了工业图像异常合成的重要背景知识，并介绍了其核心方法。然后，我们对现有的工业图像异常合成方法进行了全面回顾，将它们分为手工制作合成、基于分布假设的合成、基于生成模型的合成以及基于视觉语言模型的合成这几类。最后，我们讨论了未来有前景的研究方向，例如增强异常的多样性、实现异常属性的可控合成，以及充分利用多模态信息。我们相信，攻克这些挑战将显著提升工业图像异常合成的有效性。
