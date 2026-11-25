---
Title | ML Tasks Image OCR FOTS
-- | --
Created @ | `2020-05-28T03:28:39Z`
Updated @| `2026-11-25T16:19:49Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/195)

---
# FOTS

FOTS（Fast Oriented Text Spotting，2018）是较早的**检测 + 识别联合训练**的端到端文字识别网络。两个子任务共享同一套卷积特征，用一个叫 RoIRotate 的算子把检测出的任意方向文本区域变换成固定高度的水平特征，直接送进识别分支，整个网络可以一起训练。相比"先训检测、再裁图训识别"的两阶段方案，它共享计算更快（论文称在 ICDAR2015 上可达约 22 fps），而且识别的梯度可以回传给共享特征，帮助检测学到对识别更友好的表示。

## Arch

![image](https://user-images.githubusercontent.com/2216970/83095775-a894f000-a0d6-11ea-8525-378691b03378.png)

上图是 FOTS 的整体结构，数据流自左向右：共享卷积产生特征，检测分支预测文本框，RoIRotate 按框裁剪并摆正特征，识别分支输出文字，下面分模块说明。

## Shared Conv

骨干为 ResNet-50，并采用与 [EAST](0193_ML_Tasks_Image_OCR_EAST) 类似的自顶向下特征融合（上采样 + 与浅层拼接），输出 1/4 输入分辨率的共享特征图。检测和识别都在这一份特征上做，因此额外的识别开销很小。

## Text Detection Branch

沿用 EAST 的思路：在共享特征上再接卷积，输出 score map（每个像素是否为文本）和 RBOX 几何（到四条边的距离 + 旋转角），经阈值和 NMS 得到旋转的文本框。

## RoI Rotate

核心算子。把检测框（带旋转角的四边形）对应的特征区域，通过仿射变换变成**高度固定、宽度按比例缩放**的轴对齐特征块：

- 保持宽高比，高度固定（论文取 8），宽度随文本长度变化，因此长短文本都不被拉伸变形；
- 变换是可微的（双线性插值），识别分支的梯度可以穿过它回到共享特征；
- 训练时用**真值框**做变换（避免早期检测不准导致训练不稳定），推理时用检测分支输出的框。

## Text Recognition Branch

和 [CRNN](0196_ML_Tasks_Image_OCR_CRNN) 同类的识别头：若干卷积层（只压缩高度）→ BiLSTM → 全连接 → [CTC](0189_ML_Tasks_Image_OCR_CTC) 解码，输出每个文本块的字符序列。

## 损失

$$
L = L_{\mathrm{detect}} + \lambda_{\mathrm{recog}} L_{\mathrm{recog}}
$$

其中：

- $L_{\mathrm{detect}}$：检测损失，和 EAST 同样由分类损失加框回归损失组成
- $L_{\mathrm{recog}}$：识别损失，即 CTC 损失
- $\lambda_{\mathrm{recog}}$：平衡两者的权重，论文取 1

## 训练与局限

- 训练需要同时有文本框和文本内容标注；通常先在 SynthText 合成数据上预训练，再在 ICDAR 等真实数据上微调。
- 检测分支沿用 EAST，对弯曲文本表达能力有限；后续 Mask TextSpotter、CharNet、TextScanner 等工作针对任意形状文本做了改进。

## Reference

- [paper - 2018 - FOTS: Fast Oriented Text Spotting with a Unified Network](https://arxiv.org/pdf/1801.01671v2.pdf)
- [【论文笔记】端到端文本检测与识别——FOTS](https://blog.csdn.net/u013063099/article/details/89236368)
- [FOTS Pytorch Implementation](https://github.com/jiangxiluning/FOTS.PyTorch)

