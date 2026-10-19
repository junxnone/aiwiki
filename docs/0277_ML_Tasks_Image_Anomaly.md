---
Title | ML Tasks Image Anomaly
-- | --
Created @ | `2019-04-08T07:06:13Z`
Updated @| `2026-10-19T02:08:08Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/277)

---
# Image Anomaly Detection

- 产品缺陷检测/不正常行为检测/医学图像检测

## 存在的问题
- **泛化性差**：传统异常检测方法通常是 "一对一" 模式，即针对每个类别或产品单独训练模型，这严重限制了模型的泛化能力——2022 年后出现的**统一多类模型**（见下文"统一多类与零样本"）正是专门针对这个问题
- 异常数据样本稀缺
  - 异常生成方法的有限多样性，具体的合成方法分类见 [异常缺陷生成](0517_ML_Tasks_Image_Anomaly_Synthesis)
- **无监督异常检测问题**: 模型存在尾部与噪声的权衡，如果模型对像素噪声具有鲁棒性，那么它在尾部类样本上的性能会下降，反之亦然。

## 算法分类与代表方法

工业图像异常检测的算法可以分成以下几大类（多数综述采用的分类方式）：

### 1. 重构式（Reconstruction-based）
对图像做重构（编码再解码），正常区域重构误差小，异常区域因为模型没见过、重构不好而误差大，误差图就是异常定位图。
- **AutoEncoder / GAN**：最经典的思路，用正常样本训练重构网络
- **[DRAEM](https://arxiv.org/abs/2108.07610)**：在重构的基础上引入 Perlin 噪声合成的伪异常样本训练一个判别子网络，直接输出像素级异常图，重构式+合成式的结合

### 2. 特征嵌入式 - 记忆库/度量学习（Memory-bank based）
用预训练 CNN 提取正常样本的 Patch 级特征，建立一个"正常特征库"，推理时计算测试特征到这个库的距离/概率作为异常分数。
- **SPADE**：最早期的记忆库方法之一，用 K 近邻直接在全部正常特征上做检索
- **[PaDiM](0322_paper_PaDiM)**：给每个 Patch 位置拟合一个多元高斯分布，用马氏距离算异常分数
- **PatchCore**（CVPR 2022）：用贪婪核心集（Coreset）算法对海量 Patch 特征做采样压缩，在精度（MVTec-AD 上约 99.6% Image AUROC）和推理速度之间取得了很好的平衡，是这一类里最具代表性、至今仍常被当作强基线的方法；其增量更新改造见 [PatchCore 持续学习](0537_ML_IL_PatchCore)
- **DFM（Deep Feature Modeling）**：ResNet 特征 → PCA 降维 + 类条件高斯密度估计，只做图像级判断（不做像素级定位）
- **DFKDE（Deep Feature Kernel Density Estimation）**：和 DFM 用同样的特征提取，但用核密度估计（KDE）代替参数化高斯来算异常分数

### 3. 特征嵌入式 - 归一化流（Normalizing Flow based）
用可逆的归一化流（Normalizing Flow）直接对"正常特征的分布"建模，测试特征在这个分布下的似然越低，异常分数越高。
- **CFLOW-AD**、**FastFlow**：这一类的代表方法，相比记忆库方法不需要存储大量特征，推理速度更快

### 4. 特征嵌入式 - 知识蒸馏（Teacher-Student / Knowledge Distillation based）
用一个在正常图像（或 ImageNet）上预训练好的教师网络和一个学生网络，只用正常样本训练学生去拟合教师的多尺度特征；异常样本上教师学生的特征差异会变大，这个差异就是异常分数。
- **[STFPM](0324_paper_STFPM)**（Student-Teacher Feature Pyramid Matching）：这一类的经典代表
- **Reverse Distillation**：反过来用学生重建教师的特征（而非直接模仿），缓解学生"偷懒"过拟合正常样本的问题

### 5. 零/少样本 VLM 驱动（Zero/Few-shot, VLM-based）
用 CLIP 等视觉-语言基础模型的跨模态对齐能力，不需要（或只需要极少）针对目标产品的训练数据就能判断异常——是解决"一对一泛化性差"问题的另一条路线。
- **WinCLIP**：最早把 CLIP 用于零样本工业异常检测的代表工作之一
- **AnomalyCLIP**：学习与具体物体类别无关的文本提示（prompt），让 CLIP 能跨任意物体类别泛化正常/异常的语义，不需要为每个类别单独设计提示词
- **AdaCLIP**（ECCV 2024）：静态+动态可学习提示的混合方案，在 AnomalyCLIP 基础上进一步提升泛化能力
- **AnomalyGPT**：首个把大型视觉语言模型（类 MiniGPT-4）接入异常检测的工作，支持输出异常图，还支持多轮对话和少样本上下文学习
- **InCTRL**（CVPR 2024）：少样本通用异常检测，只用几张正常图像做 Prompt 做残差学习
- **[MuSc](https://github.com/xrli-U/MuSc)**（Mutual Scoring，ICLR 2024）：完全零样本/零训练——通过在待测试的一批无标注图像之间互相检索相似 Patch 来打分，正常 Patch 在其他测试图里容易找到相似的，异常 Patch 找不到，不需要任何提示词或训练数据

## 统一多类与零样本：解决"一对一"泛化问题的新进展

- **UniAD**（NeurIPS 2022）：用一个统一的重构式 Transformer 同时处理 MVTec-AD 全部类别，解决了朴素重构模型在多类别训练下容易学到"恒等捷径"（直接复制输入当重构）而失去异常检测能力的问题，是"单模型打多个产品类别"这个方向最早、也最常被引用的工作；
- **Dinomaly**（CVPR 2025）：基于 DINOv2 预训练特征的极简多类重构框架，是第一批在多类别设定下精度能媲美"单类别专用模型"的方法（MVTec-AD 统一设定下约 99.9% Image AUROC），后续 Dinomaly2（2025-10）进一步扩展到多视角/3D/少样本场景，已合并进 [anomalib](https://github.com/openvinotoolkit/anomalib) v2.1。

## 数据集
- **[MVTec](0323_ML_Tasks_Image_Anomaly_MVTec)**：最经典的工业异常检测基准，5 种纹理 + 10 种物体，训练集只有正常样本
- **VisA**、**BTAD**、**MPDD**：MVTec 之后陆续提出的补充数据集，覆盖更多产品类型/场景
- **Real-IAD**（CVPR 2024）：目前规模最大的多视角工业异常数据集之一，30 个类别、15.1 万张图像
- **IM-IAD**：统一基准评测框架，在同一套评测协议下重新评估了 19 种算法在 MVTec AD/MVTec LOCO-AD/MPDD/BTAD/VisA/MTD/DAGM 共 7 个数据集上的表现，适合横向对比不同算法

## 应用
- 缺陷检测
- 医学图像异常检测
- 工业危害检测
- 落地到实际产线时，相机选型、打光、成像质量评估等工程细节见 [算法落地实践](0521_ML_Tasks_Image_Anomaly_Pipeline)

## Tools
- [anomalib](https://github.com/openvinotoolkit/anomalib)：Intel 开源的异常检测算法库，PaDiM/STFPM/DFM/DFKDE/DRAEM/PatchCore/Dinomaly 等本页提到的大部分方法都已集成

## Reference

- [awesome anomaly detection](https://github.com/hoya012/awesome-anomaly-detection)
- [斯坦福NG机器学习课程：Anomaly Detection笔记](https://www.cnblogs.com/mfrbuaa/p/5219885.html)
- [anomaly-detection-resources](https://github.com/yzhao062/anomaly-detection-resources) 
- [基于异常检测算法的图片异常检测](https://zhuanlan.zhihu.com/p/45266398)
- [异常检测概览——孤立森林 效果是最好的](https://www.cnblogs.com/bonelee/p/7776711.html)
- [iForest （Isolation Forest）孤立森林 异常检测 入门篇](https://www.jianshu.com/p/5af3c66e0410)
- [半监督”异常检测方法GANomaly](https://zhuanlan.zhihu.com/p/47832951) 
- [IM-IAD：工业制造中的工业图像异常检测基准](https://blog.csdn.net/m0_63828250/article/details/136891730)
- [awesome-industrial-anomaly-detection](https://github.com/M-3LAB/awesome-industrial-anomaly-detection)
- [Deep Industrial Image Anomaly Detection: A Survey](https://link.springer.com/article/10.1007/s11633-023-1459-z)
- [A survey on industrial image anomaly detection: methods, benchmarks and rethinks (2025-12)](https://www.sciencedirect.com/science/article/abs/pii/S0263224125017361)
- [PatchCore: Towards Total Recall in Industrial Anomaly Detection](https://arxiv.org/abs/2106.08265)
- [MuSc: Zero-Shot Industrial Anomaly Classification and Segmentation with Mutual Scoring](https://github.com/xrli-U/MuSc)

