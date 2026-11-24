-----

| Title     | paper SuperSimpleNet                                  |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:33Z`                                |
| Updated @ | `2026-11-24T09:21:35Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/747) |

-----

# SuperSimpleNet 统一监督与无监督的缺陷检测

  - **SuperSimpleNet**：Unifying Unsupervised and Supervised Learning for
    Fast and Reliable Surface Defect Detection，ICPR 2024，论文
    [arXiv 2408.03143](https://arxiv.org/abs/2408.03143)；扩展版发表于 JIMS
    2025：[No Label Left
    Behind](https://link.springer.com/article/10.1007/s10845-025-02680-8)；官方代码
    [blaz-r/SuperSimpleNet](https://github.com/blaz-r/SuperSimpleNet)
  - 类型：Segmentation
  - 动机：工业界需要的缺陷检测模型要同时满足**高性能、训练稳定一致、推理快**，并且能**用上全部可用的训练数据**（既能只用正常图像，也能利用少量带标注的异常图像）。现有方法往往只满足其中一部分
  - 核心思想：在 SimpleNet 的基础上改进的**判别式**模型，增强了训练一致性、推理时间和检测性能；在**特征空间**里用二值化
    Perlin 掩码生成合成异常；新增**分类头**；既能无监督（只用正常图）也能利用带标签的异常图。anomalib
    目前只支持无监督设置
  - 论文结果：无监督 MVTec AD 图像级 AUROC **98.4%**、VisA **93.4%**；有监督 SensumSODF
    **97.8%** AUROC、KSDD2 **97.4%** $AP\_{det}$；推理时间 **9.3 ms**，吞吐 **268
    张/秒**

## 原理

SuperSimpleNet 由特征提取器、特征适配器、特征空间异常生成和分割-检测模块组成：

``` mermaid
graph LR
    X["输入图像"] --> F["特征提取器<br/>WideResNet50 的第 2 3 层 + 上采样 + 3x3 平均池化"]
    F --> A["特征适配器<br/>线性层 得到 A"]
    A --> G["特征空间异常生成 仅训练时<br/>Perlin 掩码区域加高斯噪声 得到 P"]
    G --> S["分割头 D_seg<br/>输出异常掩码 M_o"]
    S --> C["分类头 D_cls<br/>拼接 M_o 与特征 5x5 卷积 池化 线性层 得到分数 s"]
    G --> C
```

图中：

  - **特征提取器**：沿用 SimpleNet 的设计，用 ImageNet 预训练的 WideResNet50，取第 2、3
    层特征。ResNet
    输出分辨率较低，限制了对小异常的检测和分割精度，所以在拼接前加入了新的**上采样策略**：layer
    3 放大 4 倍，layer 2 放大 2 倍，使两层大小相同才能拼接；之后与 SimpleNet 一样用 $3\\times3$
    的局部平均池化汇聚邻域上下文
  - **特征适配器**：一个简单的线性层，输出适配后的特征 $\\mathcal{A}$，把预训练特征进一步调整到异常检测任务
  - **特征空间异常生成**（训练时）：先对 Perlin 噪声图 $M\_p$ 阈值化得到二值掩码 $M\_t$，把真实异常区域
    $M\_{gt}$ 从中去除得到 $M\_a$（无监督时 $M\_{gt}$ 为空）；在 $M\_a$
    限定的区域内给适配特征加上高斯噪声，得到扰动特征
    $\\mathcal{P}$。和原 SimpleNet 的不同点：为了训练更稳定，仍保留特征的副本，但**噪声同时加在原特征和副本上**
  - **分割头 $D\_{seg}$**（沿用 SimpleNet）输出异常掩码 $M\_o$；**分类头
    $D\_{cls}$**（新增）由一个 $5\\times5$ 卷积块和一个线性层组成，输入是 $M\_o$
    与特征的拼接，卷积块输出和 $M\_o$ 各做平均池化和最大池化后合并，经线性层输出图像级分数
    $s$。分类头让模型理解图像的全局语义，减少误报，也更容易检出小区域内的明显变化

特征空间中的合成异常：

$$ \\mathcal{P} = \\mathcal{A} + M\_a \\odot \\epsilon, \\qquad
\\epsilon \\sim \\mathcal{N}(\\mu, \\sigma^2) $$

其中：$\\mathcal{A}$ 是适配后的特征图；$M\_a$ 是由 Perlin
噪声阈值化后去掉真实异常区域得到的二值掩码；$\\epsilon$
是高斯噪声，论文取 $\\sigma = 0.015$（与 SimpleNet 一致）；$\\odot$
为逐元素相乘；$\\mathcal{P}$ 是扰动后的特征，用作分割头和分类头的训练输入。Perlin
噪声二值化阈值对 VisA、KSDD2、SensumSODF 为 0.6（产生较细较小的异常），对异常较大的
MVTec AD 为 0.2；合成异常加到 **50%** 的图像上。

**有监督设置**：直接用真实掩码 $M\_{gt}$
替换合成掩码并不合适，因为训练集里的缺陷往往不能覆盖所有可能的缺陷类型，所以在保留合成异常的同时，**只在无缺陷区域**加噪声，最终掩码
$M$ 是真实标注和合成异常的混合。

**损失函数**：

$$ l\_{i,j} = \\begin{cases} \\max\\big(0,\\ th -
D\_{seg}(P\_{i,j})\\big) & M\[i,j\] = 1 \\ \\max\\big(0,\\ th +
D\_{seg}(P\_{i,j})\\big) & \\text{otherwise} \\end{cases}, \\quad
\\mathcal{L}*{seg} = \\mathcal{L}*{1t} + \\mathcal{L}*{foc}, \\quad
\\mathcal{L} = \\mathcal{L}*{seg} + \\mathcal{L}\_{cls} $$

其中：

  - $l\_{i,j}$：**截断 $L\_1$ 损失**在位置 $(i,j)$ 的值，$th$ 是防止过拟合的截断项，论文取
    0.5；掩码为 1（异常）的位置要求分割头输出大于 $th$，否则要求输出小于
    $-th$；$\\mathcal{L}\_{1t}$ 是对预测掩码中所有元素的平均
  - $\\mathcal{L}*{foc}$：**Focal Loss**（见 [Focal
    Loss](/0284_ML_Arch_Func_LossFunction_FocalLoss)），在不均衡数据下更稳定；分割损失
    $\\mathcal{L}*{seg}$ 同时使用截断 $L\_1$ 和 Focal Loss；分类损失
    $\\mathcal{L}\_{cls}$ 只用 Focal Loss
  - 分割目标是异常掩码 $M$（合成和真实异常区域）；分类目标 $y$ 由 $M$ 导出：图像含异常（合成或真实）则为 1，否则为 0

**推理**：跳过异常生成。分割头输出 $M\_o$，插值到输入大小并用 $\\sigma = 4$
的高斯滤波得到最终异常图；图像分数是分类头输出的
$s$。

## 实现细节

| Name  | 设置                                                                                        |
| ----- | ----------------------------------------------------------------------------------------- |
| 训练    | 300 个 epoch，batch size 32，AdamW；适配器学习率 $10^{-4}$，分割头和分类头 $2\\times10^{-4}$，权重衰减 $10^{-5}$ |
| 学习率调度 | 在 240 和 270 个 epoch 后乘以 0.4                                                               |
| 稳定训练  | 无监督设置：停止分类头到分割头的梯度；有监督设置：梯度裁剪到范数 1                                                        |
| 输入    | MVTec AD、VisA：256×256，不做中心裁剪；KSDD2：232×640；SensumSODF：capsule 192×320，softgel 144×144     |
| 评估    | 取最后一个 epoch 的模型；SuperSimpleNet 与 SimpleNet 报告 5 个随机种子的平均值和标准差                             |

表中是论文的设置。anomalib 的说明与此一致：建议训练 300 个 epoch、batch size
32，以便在随机生成异常的情况下稳定训练；验证过的骨干是使用
torchvision V1 权重的 WideResNet50（权重名以 `.tv_` 结尾，而不是 `tv2`）。ICPR 版与 JIMS
版的差别只在 `adapt_cls_features`：ICPR 版为 True（分类头特征经过适配），JIMS 版为
False（anomalib 默认）。

## 实验结果

  - **评估指标**：SensumSODF、MVTec AD、VisA 的图像级用 AUROC，像素级用
    **AUPRO**（近年来这三个数据集的像素级评估不再用像素 AUROC）；KSDD2 用
    $AP\_{det}$ 和 $AP\_{loc}$（见 [Anomaly Detection
    Metrics](/0711_ML_Metrics_Anomaly)）
  - **有监督**：SensumSODF（胶囊和软胶囊两类，3 折交叉验证）上图像检测平均 AUROC **97.8%**，比此前最佳高
    0.9 个百分点，**错误率降低 29%**；KSDD2 上 $AP\_{det}$
    **97.4%**。作者推测这是因为分类头可以从真实与合成异常中学到更多全局信息
  - **无监督**：MVTec AD 检测平均 AUROC **98.4%**（AUPRO 平均 92.3%），VisA 检测 AUROC
    **93.4%**
  - **速度**：推理时间 **9.3 ms**（NVIDIA Tesla 系列 GPU），吞吐 **268 images/s**，同时保持
    SOTA 精度
  - **稳定性**：多次随机种子的结果波动小，论文强调这是工业应用要求的「训练一致性」

**anomalib 复现的结果**（README，300 epoch，seed 0，默认参数，batch size 32）：

| Version | AUROC | AUPRO |
| ------- | ----- | ----- |
| ICPR    | 0.980 | 0.914 |
| JIMS    | 0.975 | 0.916 |

表中是 MVTec AD 的平均值：与论文的 98.4% 接近。ICPR 版 AUROC 稍高，JIMS 版 AUPRO 稍高。

## 特点与局限

  - **优点**：结构简单、速度快（9.3 ms）；无监督和有监督统一，可以利用少量带标注异常；训练一致性好；分类头减少误报
  - **局限**（论文 6
    节）：无监督设置下**多物体类别**表现较差；**强依赖骨干**，高斯噪声的幅度需要针对每个骨干调整，若骨干提取不到有意义的特征则性能下降；作者计划后续扩展到弱监督和混合监督设置

## Reference

  - [SuperSimpleNet: Unifying Unsupervised and Supervised Learning for
    Fast and Reliable Surface Defect
    Detection](https://arxiv.org/abs/2408.03143)
  - [No Label Left Behind: A Unified Surface Defect Detection Model for
    all Supervision
    Regimes](https://link.springer.com/article/10.1007/s10845-025-02680-8)
  - [official code](https://github.com/blaz-r/SuperSimpleNet)
  - [anomalib -
    Supersimplenet](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/supersimplenet)
