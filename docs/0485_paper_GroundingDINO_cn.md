---
Title | paper GroundingDINO cn
-- | --
Created @ | `2024-10-15T10:27:35Z`
Updated @| `2024-10-15T10:27:35Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/485)

---
# Grounding DINO

Shilong Liu1,2⋆, Zhaoyang Zeng2, Tianhe Ren2, Feng Li2, 3, Hao Zhang2, 3, Jie Yang2, 4, Qing Jiang2, 6Chunyuan $Li^{5}$ , Jianwei Yang5, Hang $Su^{1}$ , Jun Zhu1⋆⋆, Lei Zhang2⋆⋆.

1 Dept. of Comp. Sci. and Tech., BNRist Center, State Key Lab for Intell. Tech. & Sys., Institute for AI, Tsinghua-Bosch Joint Center for ML, Tsinghua University 2 International Digital Economy Academy (IDEA) 3 The Hong Kong University of Science and Technology 4 The Chinese University of Hong Kong (Shenzhen) 5 Microsoft Research, Redmond 6 South China University of Technology

liusl20@mails.tsinghua.edu.cn, leizhang@idea.edu.cn

![image](https://github.com/user-attachments/assets/44a5eb41-ce65-4276-b211-4f5f963d599b)

图 1：
(a) 封闭集目标检测要求模型检测预定义类别的目标。
(b) 我们在新目标和标准的指代表达理解（REC）基准上评估模型，以测试模型对具有属性的新目标的泛化能力。
(c) 我们通过结合 Grounding DINO 和 Stable Diffusion [41] 展示了一个图像编辑应用程序。彩色观看效果最佳。

**摘要**。在本文中，我们开发了一种开放集对象检测器，称为 Grounding DINO，它将基于 Transformer 的检测器 DINO 与基于文本的预训练相结合，可以通过人类输入（如类别名称或指示表达式）检测任意对象。开放集对象检测的关键解决方案是将语言引入封闭集检测器以实现开放集概念泛化。为了有效地融合语言和视觉模态，我们在概念上将封闭集检测器分为三个阶段，并提出了一种紧密融合的解决方案，其中包括特征增强器、语言引导的查询选择以及用于模态融合的跨模态解码器。我们首先在大规模数据集上对 Grounding DINO 进行预训练，包括目标检测数据、基础数据和字幕数据，并在开放集目标检测和指称目标检测基准上评估模型。Grounding DINO 在所有三种设置下表现都非常出色，包括在 COCO、LVIS、ODinW 和 $RefCOCO/+/g$ 上的基准。Grounding DINO 在 COCO 零样本 检测基准上达到 52.5 的平均精度。它在 ODinW 零样本基准上以平均 26.1 的平均精度创造了新纪录。我们在 https://github.com/IDEA-Research/GroundingDINO 上发布了一些检查点和推理代码。

关键词：目标检测·图像接地·多模态学习
