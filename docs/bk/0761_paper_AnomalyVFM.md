-----

| Title     | paper AnomalyVFM                                      |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:15:04Z`                                |
| Updated @ | `2026-11-24T09:21:01Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/761) |

-----

# AnomalyVFM 把视觉基础模型变成零样本异常检测器

  - **AnomalyVFM**：Transforming Vision Foundation Models into Zero-Shot
    Anomaly Detectors，CVPR 2026，论文
    [arXiv 2601.20524](https://arxiv.org/abs/2601.20524)，官方代码
    [MaticFuc/AnomalyVFM](https://github.com/MaticFuc/AnomalyVFM)
  - 类型：Segmentation，**零样本**
  - 问题：零样本异常检测要求在**没有任何领域内训练图像**的情况下检测并定位异常。近期方法借助视觉-语言模型（如 CLIP，见
    [WinCLIP](/0468_paper_WinCLIP)）迁移高层概念知识，而**纯视觉基础模型 (VFM)**（如
    DINOv2）的方法落后。论文认为差距来自两个实际问题：①现有辅助异常检测数据集**多样性有限**；②对 VFM
    的**适配策略过浅**
  - 核心思想：一个通用有效的框架，能把**任意**预训练 VFM
    变成强大的零样本异常检测器。方法由两部分组成：①**三阶段的合成数据集生成方案**；②**参数高效的适配机制**，使用**低秩特征适配器
    (LoRA)** 和**置信度加权的像素损失**
  - 论文结果：以 RADIO 为骨干，在 9 个不同的工业数据集上平均图像级 AUROC 达 **94.1%**，比之前的方法高 **3.3
    个百分点**

## 方法一：三阶段合成数据集生成

训练数据需要「带/不带异常的真实感物体图像」，且每张异常图要有像素级标注。流程分三步：①生成初始（无异常）物体图像；②在物体上用**修复
(inpainting)** 生成逼真的缺陷；③用「**异常图像特征减去正常图像特征**」得到异常分割图，并据此过滤生成失败的样本。

``` mermaid
graph LR
    P["无异常提示词 p<br/>物体 与 纹理背景 由 LLM 生成清单"] --> I["FLUX 生成无异常图 I"]
    I --> FG["IS-Net 提取前景掩码 M_fg<br/>在前景随机采样异常位置 得到矩形 R"]
    FG --> INP["用 RePaint 方式在 R 内修复<br/>异常提示词 p_a 含 Anomaly 描述 得到异常图 I_a"]
    INP --> F["DINOv2 提取 I 与 I_a 的特征<br/>余弦距离图 M_d"]
    I --> F
    F --> M["阈值化得到掩码 M<br/>最大距离 D 不超过阈值则过滤掉"]
```

图中：

  - **无异常图生成**：用文本条件的图像生成模型 $G$（默认**流匹配模型 FLUX**）按提示词 $p$ 生成：$I =
    G(p)$。提示词模板为「A close-up photo of \[Object\] for industrial
    visual inspection. Top-down view. Centered. \[Texture\]
    background.」，其中 \[Object\] 和 \[Texture\] 来自由 LLM（GPT-4o）生成的包含
    **100 种物体、50 种背景**的列表
  - **异常图生成**：先用预训练的显著性物体分割网络 IS-Net 提取前景掩码 $M\_{fg}$；在前景里随机取一个正像素 $(x,
    y)$ 作为异常矩形 $R$ 的中心，宽高在给定范围内均匀采样：

$$ w \\sim \\text{U}(w\_{min}, w\_{max}), \\qquad h \\sim
\\text{U}(h\_{min}, h\_{max}) $$

然后用带异常描述的提示词 $p\_a$（「A close-up photo of a \[Anomaly\] \[Object\]
...」，\[Anomaly\] 如 cracked、damaged、smudged、rotten，同样由 GPT-4o
按物体生成）在区域 $R$ 内生成异常，其余区域保持 $I$
不变；不使用专门的修复模型，而是利用扩散/流匹配迭代生成的特性，采用
**RePaint** 方法。

  - **数据集过滤**：图像生成模型对提示词的遵循不完美，有些生成图根本没有异常。过滤做法：用 DINOv2 提取 $I$ 和 $I\_a$
    的特征 $f$、$f\_a$，用余弦距离得到距离图 $M\_d$，它的最大值作为距离分数 $D$；按阈值 $T$ 二值化得到最终掩码
    $M$；只有 $D$ 超过阈值 $T$ 时才接受该样本。原因：如果异常生成没有遵循提示词，区域 $R$
    里会生成一块无异常的物体区域，更接近正常外观分布，所以 $f$ 与
    $f\_a$ 的距离较小，由此可检出失败样本
  - 最终得到三元组：无异常图 $I$、异常图 $I\_a$、异常掩码 $M$

## 方法二：参数高效的适配

此前用 VFM 做零样本异常检测只是在上面接一个简单 MLP 来产生异常掩码，没有调整内部表示，也没有设计解码器和损失。AnomalyVFM
做了三件事：

  - **特征适配模块 + 解码器**：输入图像 $I$ 进预训练骨干 $F$，在每个 Transformer 块的注意力机制里，往**查询
    (Q)、值 (V)、输出投影**层注入 **aLoRA/LoRA** 块（默认秩 64）。骨干最后一块提取的特征 $f$ 重排为
    $f\_r$，输入一个小的卷积解码器上采样（两个连续的上采样块，每块由卷积、GroupNorm、ReLU
    和双线性上采样构成），最后一个卷积层同时输出**异常分割图
    $M\_o$**和**置信度图 $c$**；骨干的 \[CLS\] token 输入一个线性层，预测**图像级异常分数 $A\_o$**
  - **置信度加权损失**：适配模块、解码器和异常分数预测器**联合训练**。图像级损失 $\\mathcal{L}\_{img}$ 用
    Focal Loss；分割基础损失是 $L\_1$ 加 Focal：

$$ \\mathcal{L}*{base} = \\mathcal{L}*1(M\_o, M*{GT}) +
\\beta,\\mathcal{L}*{focal}(M\_o, M\_{GT}), \\qquad \\mathcal{L}*{seg} =
\\mathcal{L}*{base}(M\_o, M\_{GT}) \\cdot C - \\alpha \\log C, \\qquad C
= 1 + \\exp(c) $$

$$ \\mathcal{L} = \\mathcal{L}*{seg} + \\mathcal{L}*{img} $$

其中：

  - $M\_o$：预测的异常分割图，$M\_{GT}$：真值掩码（由合成流程产生）；$\\beta = 5$ 是 Focal 项的权重
  - $c$：解码器预测的**置信度图**，$C = 1 + \\exp(c)$ 把它变成大于 1
    的权重；$\\mathcal{L}\_{base} \\cdot
    C$：置信度高的像素损失权重大；$-\\alpha\\log
    C$：防止所有像素都把置信度调成最大（否则只会降低所有损失权重）的正则项，$\\alpha =
    0.1$；这类似 3D 重建方法里的做法。作用是缓解合成流程里**不准确的标签**以及真值掩码的歧义带来的噪声
  - 推理时图像直接过模型，直接输出异常分割图 $M\_o$ 和图像级分数 $A\_o$

## 实现细节与实验

| Name | 设置                                                                                                                                            |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 生成模型 | FLUX；异常矩形的宽高范围 $(w\_{min}, w\_{max}) = (h\_{min}, h\_{max}) = (50, 350)$（生成图尺寸 1024×1024）；过滤阈值 $T = 0.3$；共生成 **10000** 张合成图像                  |
| 训练   | 在合成数据上训练 500 次迭代，batch size 32，AdamW，学习率 $10^{-4}$；LoRA 秩 64                                                                                  |
| 骨干   | 多数实验用 RADIOv2.5 ViT-L（patch 16）；RADIO 在多分辨率上训练，输入缩放到 768×768；也测试了 DINOv2、DINOv3                                                               |
| 数据集  | 9 个工业数据集：MVTec AD、VisA、BTAD、MPDD、Real-IAD、KSDD、KSDD2、DAGM、DTD-Synthetic；9 个医学数据集：HeadCT、BrainMRI、BR35H、ISIC、ClinicDB、ColonDB、Kvasir、Endo、TN3K |
| 指标   | 与 AdaCLIP 一致：图像级用 AUROC 和 F1-max，像素级用 AUROC 和 F1-max（见 [Anomaly Detection Metrics](/0711_ML_Metrics_Anomaly)）                                 |

表中是论文设置。对比的零样本方法通常在辅助数据上训练（如评估 MVTec AD 时在 VisA 测试集上训练），而 AnomalyVFM
的训练数据完全是合成的。

  - **通用性**（Table 1）：在 DINOv2、DINOv3、RADIO 三种 VFM 上，比较「训练数据（MVTec/VisA
    测试集 vs 合成数据）」与「适配策略（只训练简单解码器 vs 论文的适配）」四种组合，都取得显著提升，说明框架对骨干通用
  - **工业零样本**（Table 2）：显著优于 SOTA：图像级 AUROC 比次优的 Bayes-PFL 高 **3.3
    个百分点**，图像级 F1-max 略有提升；在 MVTec AD、VisA、Real-IAD
    上提升显著，接近全样本方法；像素级 AUROC 提升 0.9 个百分点，像素级 F1-max
    略逊于 AdaCLIP（它的像素 AUROC 更低）
  - **医学零样本**（Table 3）：虽然没有用任何医学数据微调，检测有竞争力，定位提升（像素级 AUROC 高 1.2 个百分点）
  - **少样本**：在 AnomalyVFM 上对少量正常样本微调（无额外技巧），即可得到与少样本 SOTA
    相当的性能，说明它可以作为未来少样本、全样本模型的骨干

**消融**（9 个工业数据集，Table 5）：

| Name   | 变化                       | 结果                                                            |
| ------ | ------------------------ | ------------------------------------------------------------- |
| 图像生成模型 | FLUX 换成 QWEN-Image / WAN | 图像级 AUROC 轻微下降 0.1 / 0.4 个百分点，像素级下降 0.5 / 2.1，说明流水线对生成模型的选择鲁棒 |
| 数据集过滤  | 去掉过滤                     | 图像级 AUROC 下降 3.8，像素级下降 **14.6**，说明生成模型对提示词的遵循问题以及干净数据的必要性     |
| 异常位置   | 前景掩码设为整张图（异常可能出现在背景）     | 图像级 AUROC 下降 1.4，像素级下降 5.8，说明要智能地选择修复位置                       |
| 置信度损失  | 去掉                       | 图像级下降 0.6，像素级下降 2.0                                           |
| 适配器结构  | LoRA 换成 AdaLN / VPT      | 图像级下降 0.7 / 1.0，像素级下降 2.9 / 0.5，仍显著高于 SOTA，说明框架对适配方法鲁棒        |

表中结论：过滤和位置选择是数据质量的关键，置信度损失和 LoRA 各自带来额外提升。

  - **速度与规模**（Table 6，A100，EfficientAD 协议）：推理时间 Bayes-PFL 208.5
    ms、AdaCLIP 82.4 ms，**AnomalyVFM 20.5 ms**；训练在单张 A100 上约 2 小时；共
    **345.8M** 参数，其中 **35.4M** 可训练
  - **局限**：目前瓶颈在**图像生成阶段**（A100 上约一天），而模型训练只需约两小时

## anomalib 实现

anomalib 实现的是零样本设置：不需要训练，直接对目标数据 `test`；README 在 MVTec AD
上给出了该实现得到的结果表（其中 README 的 Architecture
小节误沿用了 SuperSimpleNet 的文字，AnomalyVFM
本身的结构请以论文为准）。其他数据集（VisA、Real-IAD、MPDD、BTAD、KSDD、KSDD2、DAGM、DTD
等）的结果请参考论文或官方代码。

## 特点与局限

  - **优点**：零样本，目标域不需要任何正常或缺陷样本；合成数据可大规模、多样地生成；LoRA
    加置信度损失，参数高效且对噪声标签鲁棒；推理快（20.5
    ms）；框架与骨干无关
  - **局限**：合成数据的生成成本高（约一天）；效果取决于合成缺陷的真实感与多样性；论文提出未来方向包括提升缺陷真实感、结合深度基础模型做零样本
    RGBD 异常检测

## Reference

  - [AnomalyVFM — Transforming Vision Foundation Models into Zero-Shot
    Anomaly Detectors](https://arxiv.org/abs/2601.20524)
  - [official code](https://github.com/MaticFuc/AnomalyVFM)
  - [anomalib -
    AnomalyVFM](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/anomalyvfm)
