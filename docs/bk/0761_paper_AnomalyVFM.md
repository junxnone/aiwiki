-----

| Title     | paper AnomalyVFM                                      |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:15:04Z`                                |
| Updated @ | `2026-11-24T08:15:04Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/761) |

-----

# AnomalyVFM 把视觉基础模型变成零样本异常检测器

  - **AnomalyVFM**：Transforming Vision Foundation Models into Zero-Shot
    Anomaly Detectors，CVPR 2026，论文
    [arXiv 2601.20524](https://arxiv.org/abs/2601.20524)，官方代码
    [MaticFuc/AnomalyVFM](https://github.com/MaticFuc/AnomalyVFM)
  - 类型：Segmentation
  - 思路：在预训练的**视觉基础模型 (VFM)** 上构建**零样本**异常检测器：先用 **FLUX**
    生成**合成图像**，再在这些合成数据上训练，模型直接预测**异常分数**和**异常掩码**
  - 与 [WinCLIP](/0468_paper_WinCLIP)（用 CLIP 和文本提示零样本）的路线不同：AnomalyVFM
    用合成数据训练，使 VFM 学会「异常」这个概念
  - anomalib 实现支持零样本设置

## 原理

``` mermaid
graph LR
    G["FLUX 生成合成图像<br/>含正常与异常"] --> T["在合成数据上训练<br/>VFM 上的异常检测头"]
    T --> M["AnomalyVFM 模型"]
    I["任意目标域图像<br/>无需该域训练数据"] --> M
    M --> O["直接预测异常分数<br/>与异常掩码"]
```

图中：

  - 训练阶段**不使用目标域的数据**：先用文生图模型 FLUX 合成含缺陷的图像及对应掩码，在这些合成数据上训练建立在 VFM
    之上的检测器
  - 推理阶段直接对任意新类别、新数据集的图像预测异常分数和掩码，所以是**零样本**
  - anomalib README 说明，其 Architecture 小节仍沿用了 SuperSimpleNet
    的文字（`adapt_cls_features`、ICPR / JIMS 的区别），这是 README
    的复制遗留，AnomalyVFM 本身的结构请参考论文

## 使用与评估

``` bash
anomalib test --model AnomalyVFM --data MVTecAD --data.category <category>
```

  - 零样本模型不需要训练，直接 `test`
  - README 在 MVTec AD
    上给出了该实现的结果表（本实现得到的数值），VisA、Real-IAD、MPDD、BTAD、KSDD、KSDD2、DAGM、DTD
    等其他数据集的结果请参考论文或官方代码；评估指标见 [Anomaly Detection
    Metrics](/0711_ML_Metrics_Anomaly)
  - 因为这类零样本方法在新领域上的表现取决于合成数据与目标缺陷的相似程度，评估时要说明数据集和类别

## 特点

| Name   | 说明                          |
| ------ | --------------------------- |
| 零样本    | 目标域不需要正常样本，也不需要缺陷样本         |
| 合成训练数据 | 用 FLUX 生成图像训练，数据量与多样性可以大幅扩充 |
| VFM 特征 | 基础模型提供通用特征，减少对工业数据的依赖       |
| 输出     | 同时输出异常分数和异常掩码               |

表中是 AnomalyVFM 的特点：用「生成式合成数据 + 视觉基础模型」代替「CLIP + 提示词」，是零样本异常检测的另一条路线。

## 优缺点

  - **优点**：零样本，部署成本低；同时输出分数与掩码；利用 VFM 的通用特征
  - **缺点**：效果取决于合成数据的质量和多样性；对与合成分布差异大的真实缺陷可能不足；2026 年的新工作，缺少更多独立评测

## Reference

  - [AnomalyVFM — Transforming Vision Foundation Models into Zero-Shot
    Anomaly Detectors](https://arxiv.org/abs/2601.20524)
  - [official code](https://github.com/MaticFuc/AnomalyVFM)
  - [anomalib -
    AnomalyVFM](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/anomalyvfm)
