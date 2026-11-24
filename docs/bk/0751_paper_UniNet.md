-----

| Title     | paper UniNet                                          |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:42Z`                                |
| Updated @ | `2026-11-24T08:14:42Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/751) |

-----

# UniNet 统一对比学习框架

  - **UniNet**：Unified Contrastive Learning Framework for Anomaly
    Detection，CVPR 2025
  - 类型：Classification and Segmentation（图像级分类和像素级分割）
  - 思路：基于对比学习的师生架构，加入**注意力瓶颈**和**领域相关特征选择**，面向多个领域，同时支持有监督和无监督异常检测，强调**多类别**异常检测
  - 师生类方法，对比 [STFPM](/0324_paper_STFPM)、[Reverse
    Distillation](/0749_paper_ReverseDistillation)、[EfficientAD](/0748_paper_EfficientAD)

## 原理

下图是 UniNet 的组成（依据 anomalib README 的描述）：

``` mermaid
graph TD
    X["输入图像"] --> T["教师网络<br/>预训练骨干 提供正常样本的参考特征"]
    X --> S["学生网络<br/>解码器 学习重构正常模式"]
    T --> B["注意力瓶颈<br/>聚焦相关特征"]
    B --> S
    T --> FS["领域相关特征选择<br/>自适应选择特征"]
    FS --> L["对比损失<br/>温度控制的学生与教师特征相似度"]
    S --> L
    L --> W["推理: 加权决策机制<br/>融合多尺度特征得到最终异常分数"]
```

图中：

  - **教师网络**：预训练骨干，为正常样本提供参考特征；**学生网络**：解码器，学习重构正常模式
  - **注意力瓶颈**：帮助模型聚焦在相关特征上；**领域相关特征选择**：针对不同领域自适应选择特征
  - **对比损失**：用带温度的相似度，让学生特征在正常样本上靠近教师，同时被训练为区分异常模式
  - 推理时用**加权决策机制**融合多尺度特征，得到最终的异常分数

对比损失的一般形式（温度控制）：

$$ \\mathcal{L} = -\\log\\frac{\\exp\\big(\\text{sim}(f\_S,
f\_T)/\\tau\\big)}{\\exp\\big(\\text{sim}(f\_S, f\_T)/\\tau\\big) +
\\sum\_{j}\\exp\\big(\\text{sim}(f\_S, f\_T^{-}{}\_{j})/\\tau\\big)} $$

其中：

  - $f\_S$：学生特征；$f\_T$：对应的教师特征（正样本）；$f\_{T}^{-}{}\_{j}$：作为负样本的教师特征；$\\text{sim}(\\cdot,\\cdot)$：余弦相似度
  - $\\tau$：温度，anomalib 默认 0.1；温度越小，相似度的差异被放大得越明显，对难负样本更敏感
  - 这里的公式是对「温度控制的对比损失」的一般性写法，UniNet 论文中的具体形式请参考原文

## 特点与参数

| Name                  | 说明                        |
| --------------------- | ------------------------- |
| 多类别                   | 面向多类别（统一）异常检测，一个模型处理多个类别  |
| 有监督/无监督               | 同一框架支持两种设置                |
| 注意力瓶颈                 | 聚焦相关特征                    |
| 参数：`student_backbone` | 学生骨干，默认 `wide_resnet50_2` |
| 参数：`teacher_backbone` | 教师骨干，默认 `wide_resnet50_2` |
| 参数：`temperature`      | 对比损失温度，默认 0.1             |

表中前四行是 UniNet 的特点，后三行是 anomalib 里的主要参数，默认骨干都是 Wide ResNet-50。

## 使用与评估

``` bash
anomalib train --model UniNet --data MVTecAD --data.category <category>
```

anomalib README 中该模型的 MVTec AD 结果（按 README 表格第一个数据行，对应 `Avg` 列）：Image
AUROC 0.956，Pixel AUROC 0.976，Image F1 0.957。其中图像级指标低于 [Reverse
Distillation](/0749_paper_ReverseDistillation) 和
[EfficientAD](/0748_paper_EfficientAD)，像素级指标较高；指标含义见 [Anomaly Detection
Metrics](/0711_ML_Metrics_Anomaly)。

## 优缺点

  - **优点**：CVPR 2025 的新方法；多类别统一；同时支持有监督和无监督；多尺度加权决策
  - **缺点**：结构和参数较多；README 中没有展开损失与瓶颈的细节，复现需要参考论文和官方代码；在 anomalib
    单类别基准上并未超越其他最新方法

## Reference

  - UniNet: Unified Contrastive Learning Framework for Anomaly Detection
    (CVPR 2025)
  - [anomalib -
    UniNet](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/uninet)
