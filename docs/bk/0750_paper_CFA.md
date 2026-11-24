-----

| Title     | paper CFA                                             |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:40Z`                                |
| Updated @ | `2026-11-24T08:14:40Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/750) |

-----

# CFA 耦合超球面特征适配

  - **CFA**：Coupled-hypersphere-based Feature Adaptation for
    Target-Oriented Anomaly Localization，论文
    [arXiv 2206.04325](https://arxiv.org/abs/2206.04325)，官方代码
    [sungwool/cfa\_for\_anomaly\_localization](https://github.com/sungwool/cfa_for_anomaly_localization)
  - 类型：Segmentation
  - 思路：用**可学习的 Patch 描述符**把预训练 CNN
    的特征适配到目标数据集，并使用与数据集大小无关的**可扩展记忆库**；通过迁移学习提高正常特征的密度，使异常特征更容易区分
  - 属于特征记忆库类方法，对比 [PatchCore](/0535_paper_PatchCore)（直接使用预训练特征）

## 原理

下图是 CFA 的结构（依据 anomalib README 描述绘制）：

``` mermaid
graph LR
    A["正常图像"] --> B["预训练 CNN<br/>提取特征"]
    B --> C["Patch 描述符<br/>可学习 适配到目标数据集"]
    C --> D["记忆库<br/>大小与数据集无关"]
    C --> E["耦合超球面损失<br/>拉近特征与记忆库中的最近项"]
    D --> E
    T["测试图像"] --> F["同样提取并适配特征"]
    F --> G["与记忆库最近距离<br/>作为异常分数"]
    D --> G
```

图中：

  - 预训练 CNN 提取的特征是通用的，对具体的产品不一定最优；**Patch
    描述符**是一个可学习的网络，把特征映射到「目标导向」的特征空间
  - 训练时用**耦合超球面**的损失约束：让每个特征向量靠近记忆库中最近的几个特征（形成一个超球面），同时与远处的特征保持距离，使**正常特征更紧凑**
  - 记忆库的大小由超参数固定，不随数据集增大而增大，所以比 [PatchCore](/0535_paper_PatchCore) 更容易扩展
  - 测试时，特征与记忆库的距离越大越异常

损失函数的核心形式（概念性表示）：

$$ \\mathcal{L}*{att} =
\\frac{1}{TK}\\sum*{t=1}^{T}\\sum\_{k=1}^{K}\\max\\Big(0,\\
D\\big(\\phi(p\_t), c\_t^{k}\\big) - r^2\\Big), \\qquad
\\mathcal{L}*{rep} =
\\frac{1}{TJ}\\sum*{t=1}^{T}\\sum\_{j=K+1}^{K+J}\\max\\Big(0,\\ r^2 -
D\\big(\\phi(p\_t), c\_t^{j}\\big) - \\alpha\\Big) $$

其中：

  - $\\phi(p\_t)$：Patch 描述符输出的第 $t$ 个 Patch 的适配特征；$c\_t^k$：记忆库中离它第 $k$
    近的条目；$D(\\cdot,\\cdot)$：距离（欧氏距离平方）
  - $\\mathcal{L}\_{att}$：吸引项，让特征落进以最近的 $K$ 个记忆项为中心、半径为 $r$ 的超球面内；$r$
    为超球面半径
  - $\\mathcal{L}\_{rep}$：排斥项，让特征与更远的 $J$ 个记忆项保持距离，$\\alpha$
    为间隔参数；两项合在一起使正常特征的分布「紧凑」且互相区分
  - 这里的形式是对论文损失的概括性说明，具体细节（如两个超球面的耦合方式）请以论文和官方代码为准

## 特点

| Name    | 说明                                                                        |
| ------- | ------------------------------------------------------------------------- |
| 目标导向适配  | 预训练特征在目标数据集上被进一步适配，增强对该产品的判别力                                             |
| 记忆库大小固定 | 与数据集大小解耦，内存可控                                                             |
| 需训练     | 比 [PatchCore](/0535_paper_PatchCore) 多一个训练阶段（Patch 描述符），训练时间更长            |
| 早停      | anomalib README 说明基准结果使用了 early stopping（patience 5），增大 patience 可能得到更高指标 |

表中是 CFA 的特点：它用「训练」换取更适合目标数据集的特征，同时保持记忆库规模可控。

## 使用与评估

``` bash
anomalib train --model Cfa --data MVTecAD --data.category <category>
```

anomalib README 中的结果（MVTec AD 15 类平均，seed 42）：

| Metric      | ResNet-18 | Wide ResNet-50 |
| ----------- | --------- | -------------- |
| Image AUROC | 0.930     | 0.956          |
| Image F1    | 0.946     | 0.962          |
| Pixel AUROC | 0.979     | 0.983          |
| Pixel AUPRO | 0.917     | 0.924          |
| Pixel F1    | 0.574     | 0.598          |

表中包含图像级和像素级共 5 项指标，Wide ResNet-50 全面优于 ResNet-18；像素级 AUROC（0.983）略高于
[PatchCore](/0535_paper_PatchCore)（0.980），图像级 AUROC（0.956）低于
PatchCore（0.980）。AUPRO 的含义见 [Anomaly Detection
Metrics](/0711_ML_Metrics_Anomaly)。

## 优缺点

  - **优点**：像素级定位精度高；特征适配到目标数据集；记忆库大小可控
  - **缺点**：需要训练；图像级精度不及 PatchCore；超参数（超球面半径、记忆库大小）较多

## Reference

  - [CFA: Coupled-hypersphere-based Feature Adaptation for
    Target-Oriented Anomaly
    Localization](https://arxiv.org/abs/2206.04325)
  - [official
    code](https://github.com/sungwool/cfa_for_anomaly_localization)
  - [anomalib -
    Cfa](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/cfa)
