-----

| Title     | paper AdaBLDM cn                                      |
| --------- | ----------------------------------------------------- |
| Created @ | `2025-05-08T07:10:33Z`                                |
| Updated @ | `2025-05-08T07:10:33Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/515) |

-----

# AdaBLDM 译文

> 一种通过具有在线自适应功能的混合潜在扩散模型进行工业缺陷生成的新方法

Hanxi Li1,2,†, Zhengxun Zhang1,2,†, Hao Chen2, ⋆, Lin Wu Senior Member,
IEEE3, ⋆, Bo Li4, Deyin Liu5, and Mingwen Wang1 1Jiangxi Normal
University, Jiangxi, China 2Zhejiang University, Zhejiang, China
3Department of Computer Science, Swansea University, SA1 8EN, United
Kingdom 4Northwestern Polytechnical University, Shannxi, China
5Zhengzhou University, Henan, China †These authors contributed equally
to this work ⋆Corresponding author

## 摘要

要有效应对工业异常检测（AD）所面临的挑战，需要充足的有缺陷样本，但在工业环境中，样本稀缺这一限制因素常常阻碍了这一需求的满足。本文介绍了一种新颖的算法，旨在扩充有缺陷样本，从而提升异常检测的性能。所提出的方法对混合潜在扩散模型进行定制，以生成缺陷样本，采用扩散模型在潜在空间中生成有缺陷样本。由
“三值图”
掩码和文本提示控制的特征编辑过程对生成的样本进行优化。图像生成推理过程分为三个阶段：自由扩散阶段、编辑扩散阶段和在线解码器自适应阶段。这种复杂的推理策略生成了具有多样模式变化的高质量合成缺陷样本，基于扩充后的训练集，显著提高了异常检测的准确率。具体而言，在广泛认可的MVTec
AD数据集上，所提出的方法分别将基于扩充数据的异常检测的最先进（SOTA）性能在异常检测指标AP、IAP和IAP90上提升了1.5%、1.9%和3.1%。这项工作的实现代码可在GitHub仓库
<https://github.com/GrandpaXun242/AdaBLDM.git> 获取。

**关键词——异常检测，混合潜在扩散模型，在线自适应。**

## 1 引言

在实际的制造工作流程中，获取有缺陷的样本比获取无缺陷的样本要困难得多。因此，最近提出的大多数用于工业缺陷检测的算法，如文献\[1\]至\[10\]中的算法，都将该问题视为异常检测（AD）问题，这是机器学习领域中一个公认的具有挑战性的问题\[11,12\]。在这些工业异常检测算法中，假定所有无异常样本，无论是完整图像还是图像补丁，都属于单一分布，同时将有缺陷的样本识别为“离群值”。选择采用异常检测方法进行工业缺陷检测的策略原因很明显：在训练阶段无需有缺陷的样本，这使得这些基于异常检测的算法本质上与实际制造场景相适配。

然而，实现这种兼容性是以数据分布极不平衡为代价的，在大多数判别算法的情境中，这种特征是不可接受的。因此，一些研究人员建议使用传统方法\[1,3,5\]生成人工缺陷模式，以助力后续的判别学习过程。最近，最先进的（SOTA）算法\[13-15\]表明，在训练阶段纳入一些真实的异常样本，若将这些样本与合成样本相结合，可显著提升异常检测的准确性。例如，一些开创性的研究\[16,17\]证明了使用更复杂的方法生成这些“栩栩如生”的缺陷所带来的益处。图1的前两行展示了两种不同类型的缺陷生成情况。

![Image](media/cbcbd2a2f537325077a4b92dc1d804a7cd1f17f3.png)

> \[\!NOTE\] 图1. 三种缺陷生成风格的图示。从上到下分别为：传统方法、基于生成对抗网络（GAN）的算法以及所提出的方法。
