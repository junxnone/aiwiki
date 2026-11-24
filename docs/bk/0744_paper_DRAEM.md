-----

| Title     | paper DRAEM                                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:26Z`                                |
| Updated @ | `2026-11-24T08:14:26Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/744) |

-----

# DRAEM 判别式重构嵌入

  - **DRÆM**：A discriminatively trained reconstruction embedding for
    surface anomaly detection，论文
    [arXiv 2108.07610](https://arxiv.org/pdf/2108.07610v2.pdf)（ICCV
    2021）
  - 类型：Segmentation
  - 思路：用**模拟的异常图像**训练：把正常图像叠加 Perlin
    噪声掩码截取的外部纹理，生成「合成异常」，让**重构子网络**把它还原成正常图像，让**判别子网络**根据「合成异常
    + 重构图」预测出异常掩码
  - 与纯重构方法（如 [GANomaly](/0743_paper_GANomaly)）的区别：DRAEM
    用监督信号（合成的异常掩码）训练判别子网络，而不是直接用重构误差当分数
  - 合成异常的思路在 [Anomaly Synthesis](/0517_ML_Tasks_Image_Anomaly_Synthesis)
    中有更多讨论

## 原理

下图是 DRAEM 的训练流程：

``` mermaid
graph LR
    N["正常图像"] --> S["叠加 Perlin 噪声掩码<br/>外部纹理 得到合成异常图"]
    S --> R["重构子网络<br/>自编码器"]
    R --> C["重构图 + 合成异常图<br/>沿通道拼接"]
    S --> C
    C --> DD["判别子网络<br/>U-Net 输出异常图"]
    N --> LR1["重构损失<br/>L2 + SSIM"]
    R --> LR1
    DD --> LF["Focal Loss<br/>与合成掩码对比"]
```

图中：

  - 先对**正常图像**用 Perlin
    噪声生成随机形状的掩码，把外部纹理（来自无关数据集）贴到掩码区域，得到「合成异常图」和对应的**真值掩码**
  - **重构子网络**（自编码器）的输入是合成异常图，训练目标是还原原始的正常图像，使它具备「修复异常」的能力
  - **判别子网络**的输入是合成异常图与重构图在**通道维度拼接**的结果，输出每个像素是否异常的异常图，用合成掩码做监督
  - 推理时没有真实掩码：重构子网络尝试修复，判别子网络根据「原图与修复图的差异」判断异常

损失函数：

$$ \\mathcal{L} = \\mathcal{L}*{rec}(I, \\hat{I}) +
\\mathcal{L}*{seg}(M, \\hat{M}), \\qquad \\mathcal{L}\_{rec} = \\lVert I
- \\hat{I} \\rVert\_2^2 + \\lambda\\big(1 - SSIM(I, \\hat{I})\\big) $$

其中：

  - $I$：原始正常图像；$\\hat{I}$：重构子网络输出；$M$：合成异常的真值掩码；$\\hat{M}$：判别子网络预测的异常图
  - $\\mathcal{L}\_{rec}$：重构损失，由 L2 损失和结构相似度损失 $1 - SSIM$ 组成，$\\lambda$
    为权重，SSIM 的定义见 [Image Generation
    Metrics](/0718_ML_Metrics_Generation)
  - $\\mathcal{L}\_{seg}$：判别子网络的损失，使用 **Focal
    Loss**，用于解决异常像素占比极小（极度不均衡）的问题，见
    [Focal Loss](/0284_ML_Arch_Func_LossFunction_FocalLoss)

## 特点

| Name    | 说明                            |
| ------- | ----------------------------- |
| 合成异常    | 异常样本由正常样本合成，不需要真实缺陷标注         |
| 判别式     | 判别子网络直接输出异常图，不需要手工选重构误差阈值     |
| 纹理类缺陷强  | 对表面缺陷（划痕、斑点等）效果好              |
| 逻辑类异常弱  | 合成的是局部纹理异常，对零件缺失、数量错误等逻辑异常不适用 |
| 需要外部纹理库 | 需要无关的纹理数据集（如 DTD）             |

表中是 DRAEM 的特点：它把无监督问题变成了有合成标签的监督问题，是后续一系列合成异常方法（见 [Anomaly
Synthesis](/0517_ML_Tasks_Image_Anomaly_Synthesis)）的基础。

## 使用

``` bash
anomalib train --model Draem --data MVTecAD --data.category <category>
```

anomalib README 中该模型的 benchmark 部分为 TODO，暂无官方数值，评估指标见 [Anomaly Detection
Metrics](/0711_ML_Metrics_Anomaly)。论文在 MVTec AD 上报告了很强的结果，具体数值请参见原论文。

## 优缺点

  - **优点**：合成异常监督；输出像素级异常图；表面缺陷检测能力强
  - **缺点**：合成异常与真实缺陷的分布有差异；对逻辑异常无效；对外部纹理和 Perlin 参数较敏感；训练代价高于特征类方法

## Reference

  - [DRÆM – A discriminatively trained reconstruction embedding for
    surface anomaly detection](https://arxiv.org/pdf/2108.07610v2.pdf)
  - [anomalib -
    Draem](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/draem)
