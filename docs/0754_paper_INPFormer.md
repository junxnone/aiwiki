---
Title | paper INPFormer
-- | --
Created @ | `2026-11-24T08:14:49Z`
Updated @| `2026-11-24T08:14:49Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/754)

---
# INPFormer 单图内固有正常原型

- **INP-Former**：Exploring Intrinsic Normal Prototypes within a Single Image for Universal Anomaly Detection，CVPR 2025，论文 [arXiv 2503.02424](https://arxiv.org/pdf/2503.02424)，官方代码 [luow23/INP-Former](https://github.com/luow23/INP-Former)
- 类型：Segmentation
- 思路：不依赖训练集保存的正常原型，而是直接从**每张测试图像自身**提取**固有正常原型 (Intrinsic Normal Prototypes, INPs)**，再用这些原型约束解码器
- 与 [Dinomaly](/0753_paper_Dinomaly) 同属基于冻结 ViT 的编码器-解码器重构方法

## 原理

下图是 INP-Former 的结构：

```mermaid
graph LR
    X["输入图像"] --> E["冻结 ViT 编码器<br/>Patch 特征"]
    E --> I["INP 提取器<br/>可学习的查询令牌 + 交叉注意力"]
    I --> P["每张图的少量 INPs"]
    P --> B["瓶颈融合"]
    B --> D["INP 引导解码器<br/>INPs 作为 key 和 value"]
    D --> R["重构特征 与 编码器特征比较<br/>得到异常图"]
```

图中：

- 编码器是冻结的预训练 Vision Transformer，输出每个 Patch 的特征
- **INP 提取器**用一组可学习的查询令牌，通过交叉注意力把整张图的特征聚合成**少量原型**（INPs）。因为异常通常只占图像的一小部分，所以从图像内部聚合得到的原型主要代表这张图里的**正常模式**
- INPs 经瓶颈融合后，送入**INP 引导解码器**：解码器用 INPs 作为注意力的 key 和 value，使输出受限于正常模式，因而无法还原异常区域
- 解码重构与编码特征的差异给出异常分数和异常图

交叉注意力提取原型：

$$
\text{INP} = \text{softmax}\Big(\frac{Q K^\top}{\sqrt{d}}\Big)V, \qquad Q = W_Q\, q,\quad K = W_K\, F,\quad V = W_V\, F
$$

其中：

- $F \in \mathbb{R}^{N \times d}$：编码器输出的 $N$ 个 Patch 特征；$q \in \mathbb{R}^{M \times d}$：$M$ 个可学习的查询令牌（$M \ll N$）；$W_Q, W_K, W_V$：线性投影矩阵
- $QK^\top / \sqrt{d}$：查询与 Patch 的相似度，$d$ 为特征维度；softmax 后得到每个查询对各 Patch 的权重，再对 $V$ 加权求和，得到 $M$ 个原型 INPs
- 所以每张图得到的是**该图自己的**少量原型，而不是训练集中保存的全局原型库

## 特点

Name | 说明
-- | --
单图原型 | 原型来自测试图像本身，不需要跨图的记忆库，对「图内部」的正常模式更贴合
通用 | 论文定位于 universal anomaly detection，可用于多类别、多种数据集
编码器冻结 | 只训练 INP 提取器、瓶颈和解码器
README | anomalib README 目前只给出描述和使用命令，没有给出 benchmark 数值

表中是 INP-Former 的特点：它的差异化在于「原型来自单张图本身」。

## 使用

```bash
anomalib train --model InpFormer --data MVTecAD --data.category <category>
```

README 中没有 benchmark 数值，请参考论文。评估指标见 [Anomaly Detection Metrics](/0711_ML_Metrics_Anomaly)。

## 优缺点

- **优点**：原型自适应每张图；无需跨图记忆库；基于强大的预训练 ViT
- **缺点**：如果一张图中大面积异常，图内原型也可能混入异常模式；依赖大型 ViT；anomalib 中暂无官方基准

## Reference
- [Exploring Intrinsic Normal Prototypes within a Single Image for Universal Anomaly Detection](https://arxiv.org/pdf/2503.02424)
- [official code](https://github.com/luow23/INP-Former)
- [anomalib - InpFormer](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/inp_former)

