---
Title | Tools anomalib
-- | --
Created @ | `2022-11-30T08:23:26Z`
Updated @| `2026-11-24T08:15:35Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/321)

---
# anomalib

Anomalib 是由 Intel 开源、专注于 视觉异常检测（Visual Anomaly Detection） 的 Python 深度学习库，核心面向工业质检、缺陷检测等场景，主打 无监督 / 半监督学习——只需要正常样本即可训练，无需大量缺陷标注。

**内置 30 多种 SOTA 算法，直接可用：**

  - 经典：PatchCore、PaDiM、GANomaly、FastFlow、DFM、STFPM
  - 最新：UniNet、Dinomaly、Draem、Reverse Distillation

全部基于 PyTorch Lightning，代码简洁、易二次开发

**全流程工具链**

  - 配置驱动：YAML 配置文件，一键改模型 / 数据 / 参数
  - 命令行工具：anomalib train / test / infer 直接运行
  - 可视化：自动生成异常热力图、对比图
  - 评估：AUROC、F1、精确率 / 召回率、像素级指标，见 [Anomaly Detection Metrics](/0711_ML_Metrics_Anomaly)
  - 部署：导出 TorchScript / ONNX / OpenVINO，支持边缘加速

**模块化、易扩展**

  - backbone、采样、损失、后处理均可插拔；支持自定义数据集、自定义模型。

## 支持的模型

以下是 anomalib 主分支 `src/anomalib/models/` 目录下的模型（截至最新 release `lib/v2.7.1`，共 33 个图像模型和 2 个视频模型）。「类型」按其工作原理归类，`Segmentation` 表示同时输出像素级异常图，`Classification` 表示只做图像级判定（依据各模型 README）：

### 特征嵌入 / 记忆库

Model | 类型 | 说明 | 文章
-- | -- | -- | --
PaDiM | Segmentation | 对每个 Patch 位置拟合高斯分布，马氏距离评分 | [PaDiM](/0322_paper_PaDiM)
PatchCore | Segmentation | 中层 Patch 特征记忆库 + coreset + 最近邻 | [PatchCore](/0535_paper_PatchCore)
MH-PatchCore | Segmentation | 马氏距离 + PCA 白化的 PatchCore | [MHPatchCore](/0759_paper_MHPatchCore)
CFA | Segmentation | 耦合超球面的特征适配 + 记忆库 | [CFA](/0750_paper_CFA)
DFM | Classification | 深度特征 + PCA + 类条件高斯 | [DFM](/0740_paper_DFM)
DFKDE | Classification | 深度特征 + PCA + 核密度估计 | [DFKDE](/0741_paper_DFKDE)
FRE | Segmentation | 深度特征 + 线性自编码器的重构误差 | [FRE](/0742_paper_FRE)

### 归一化流

Model | 类型 | 说明 | 文章
-- | -- | -- | --
CFlow | Segmentation | 条件归一化流，位置编码作条件 | [CFlow](/0735_paper_CFlow)
FastFlow | Segmentation | 二维归一化流，卷积耦合层 | [FastFlow](/0736_paper_FastFlow)
CS-Flow | Segmentation | 跨尺度联合的全卷积流 | [CSFlow](/0737_paper_CSFlow)
U-Flow | Segmentation | U 形流 + 无监督阈值 | [UFlow](/0738_paper_UFlow)
PatchFlow | Segmentation | 邻域感知 Patch 特征 + 流 + 适配器 | [PatchFlow](/0739_paper_PatchFlow)

### 师生 / 知识蒸馏

Model | 类型 | 说明 | 文章
-- | -- | -- | --
STFPM | Segmentation | 师生特征金字塔匹配 | [STFPM](/0324_paper_STFPM)
Reverse Distillation | Segmentation | 编码器教师 + 解码器学生的反向蒸馏 | [ReverseDistillation](/0749_paper_ReverseDistillation)
EfficientAD | Segmentation | 蒸馏教师 + 学生 + 自编码器，毫秒级延迟 | [EfficientAD](/0748_paper_EfficientAD)
UniNet | Classification and Segmentation | 对比学习师生 + 注意力瓶颈 | [UniNet](/0751_paper_UniNet)
L2BT | Segmentation | 浅层 MLP 学生模仿冻结 ViT 的自注意力映射 | [L2BT](/0752_paper_L2BT)

### 重构 / 生成 / 合成异常

Model | 类型 | 说明 | 文章
-- | -- | -- | --
GANomaly | Classification | 编码器-解码器-编码器 + GAN | [GANomaly](/0743_paper_GANomaly)
DRAEM | Segmentation | 合成异常 + 重构子网 + 判别子网 | [DRAEM](/0744_paper_DRAEM)
DSR | Segmentation | 量化特征空间中合成异常，双子空间重投影 | [DSR](/0745_paper_DSR)
GLASS | Segmentation | 梯度上升的全局 + 局部异常合成 | [GLASS](/0746_paper_GLASS)
SuperSimpleNet | Segmentation | 特征级合成异常的判别式模型 | [SuperSimpleNet](/0747_paper_SuperSimpleNet)

### 基于视觉基础模型 / 视觉语言模型

Model | 类型 | 说明 | 文章
-- | -- | -- | --
WinCLIP | Segmentation | CLIP + 文本提示 + 滑动窗口，零样本/少样本 | [WinCLIP](/0468_paper_WinCLIP)
Dinomaly | Segmentation | DINOv2 编码器 + 噪声瓶颈 + 线性注意力解码器 | [Dinomaly](/0753_paper_Dinomaly)
INP-Former | Segmentation | 单图内固有正常原型 | [INPFormer](/0754_paper_INPFormer)
GeneralAD | Segmentation | ViT Patch 特征上的伪异常 + 注意力判别器 | [GeneralAD](/0755_paper_GeneralAD)
AnomalyDINO | 记忆库（无 README） | DINOv2-Small + kNN，少样本 | [AnomalyDINO](/0756_paper_AnomalyDINO)
RAD | Segmentation | 免训练的多级检索 + 位置感知 Patch 匹配 | [RAD](/0757_paper_RAD)
SuperADD | Segmentation | DINOv3 多层特征 + 记忆库，免训练 | [SuperADD](/0758_paper_SuperADD)
FoundAD | Segmentation | 冻结 DINOv2/v3 + 流形投影器，少样本 | [FoundAD](/0760_paper_FoundAD)
AnomalyVFM | Segmentation | FLUX 合成数据训练的零样本检测器 | [AnomalyVFM](/0761_paper_AnomalyVFM)
CFM | Segmentation | RGB 与 3D 点云的跨模态特征映射（多模态） | [CFM](/0762_paper_CFM)
VLM-AD | 无 README | GPT / Llama / Mistral 等 VLM 提示做判断 | [VLMAD](/0763_paper_VLMAD)

### 视频模型

Model | 说明 | 文章
-- | -- | --
AI-VAD | 目标检测 + 速度/姿态/外观属性的视频异常检测 | [AIVAD](/0764_paper_AIVAD)
FUVAS | 时空特征低秩分解的少样本视频异常分割 | [FUVAS](/0765_paper_FUVAS)

图像模型也能用于视频，只需要把视频数据集转成逐帧图像（`clip_length_in_frames=1`）。

表中每一行是一个模型：「类型」来自各模型 README，「文章」列链接到 wiki 里对应的介绍。上面按原理分组，同一组内的模型思路接近，换模型时可以先在同组内比较。

## 在 MVTec AD 上的参考结果

以下数值来自 anomalib 各模型 README（MVTec AD 15 类平均，多数为 seed 42，不同模型的训练设置不完全相同，仅作粗略参考）：

Model | Backbone | Image AUROC | Pixel AUROC
-- | -- | -- | --
Dinomaly | DINOv2 | 0.997 | 0.984
Reverse Distillation | Wide ResNet-50 | 0.985 | 0.969
EfficientAD-S | - | 0.982 | -
PatchCore | Wide ResNet-50 | 0.980 | 0.980
GLASS | Wide ResNet-50 | 0.972 | 0.965
FastFlow | Wide ResNet-50 | 0.963 | 0.979
CFlow | Wide ResNet-50 | 0.962 | 0.971
CFA | Wide ResNet-50 | 0.956 | 0.983
UniNet | - | 0.956 | 0.976
PaDiM | Wide ResNet-50 | 0.950 | 0.979
FRE | Wide ResNet-50 | 0.947 | -
DFM | Wide ResNet-50 | 0.943 | -
STFPM | ResNet-18 | 0.893 | 0.951
DFKDE | Wide ResNet-50 | 0.774 | -
GANomaly | - | 0.421 | -

表中按 Image AUROC 从高到低排列；`-` 表示 README 中没有对应的数值。Image AUROC 已接近饱和（多个方法在 0.95~0.99），像素级指标与图像级指标不一定同序。Dinomaly 在 anomalib 基准中图像级最高；GANomaly 的 0.421 低于随机水平，说明在该数据集和默认设置下它基本没有区分能力。各模型的设置和 benchmark 条件（如输入大小、训练轮数、早停）并不完全一致，所以只适合粗略比较；指标含义见 [Anomaly Detection Metrics](/0711_ML_Metrics_Anomaly)。

## 选择建议

Scenario | 推荐
-- | --
快速基线 | [PatchCore](/0535_paper_PatchCore)（无需训练、精度高）
对延迟要求高 | [EfficientAD](/0748_paper_EfficientAD)、[FastFlow](/0736_paper_FastFlow)
追求最高图像级精度 | [Dinomaly](/0753_paper_Dinomaly)、[Reverse Distillation](/0749_paper_ReverseDistillation)
只有极少正常样本 | [WinCLIP](/0468_paper_WinCLIP)、[AnomalyDINO](/0756_paper_AnomalyDINO)、[FoundAD](/0760_paper_FoundAD)
完全没有目标域数据（零样本） | [WinCLIP](/0468_paper_WinCLIP)、[AnomalyVFM](/0761_paper_AnomalyVFM)
有 RGB + 3D 数据 | [CFM](/0762_paper_CFM)
逻辑性异常（数量、位置错误） | [EfficientAD](/0748_paper_EfficientAD)（自编码器分支）、[VLM-AD](/0763_paper_VLMAD)
视频 | [AI-VAD](/0764_paper_AIVAD)、[FUVAS](/0765_paper_FUVAS)

表中按使用场景给出入口，选择时仍要在自己的数据上用 AUROC、AUPRO 与固定阈值下的指标验证，评估方法见 [Anomaly Detection Metrics](/0711_ML_Metrics_Anomaly)。

## Reference

- [Github](https://github.com/openvinotoolkit/anomalib)
- [anomalib models](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models)

