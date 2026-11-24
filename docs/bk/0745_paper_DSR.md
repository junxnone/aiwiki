-----

| Title     | paper DSR                                             |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:29Z`                                |
| Updated @ | `2026-11-24T08:14:29Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/745) |

-----

# DSR 双子空间重投影

  - **DSR**：A Dual Subspace Re-Projection Network for Surface Anomaly
    Detection，论文
    [ECCV 2022](https://link.springer.com/chapter/10.1007/978-3-031-19821-2_31)
  - 类型：Segmentation
  - 思路：在**量化特征空间**里合成异常：一个自编码器（一个编码器、两个解码器）加上异常检测模块；在 ImageNet 上学习一个**码本
    (codebook)**，用它对图像编码，同时在特征层面采样「近分布」的异常，不依赖外部数据集
  - 与 [DRAEM](/0744_paper_DRAEM) 的区别：DRAEM 在图像层面合成异常，DSR 在**特征层面**合成异常

## 原理

README 描述 DSR 的训练分三个阶段：

``` mermaid
graph TD
    P1["阶段 1: 在 ImageNet 上预训练<br/>编码器 通用物体解码器 码本"] --> P2["阶段 2: 用码本在量化特征上生成异常<br/>训练特定物体解码器和异常检测模块"]
    P2 --> P3["阶段 3: 在图像级模拟污渍上<br/>训练上采样模块 得到更稳健的异常图"]
```

图中：

  - **阶段 1**：在 ImageNet 上预训练编码器、「通用物体解码器」以及码本；码本把连续特征量化成离散的码字，代表常见的特征模式
  - **阶段 2**：在量化后的特征上，通过替换或扰动码字，在**特征层面**生成接近正常分布的异常，用来训练特定物体的解码器和异常检测模块
  - **阶段 3**：在图像层面叠加模拟的污渍，训练上采样模块，使最终输出的异常图更稳健

推理时，输入图像被编码并量化，分别由两个解码器重投影到两个子空间（「通用物体」子空间和「目标物体」子空间），异常检测模块比较重投影结果，得到异常图。

向量量化的基本形式：

$$ z\_q = \\underset{e\_k \\in \\mathcal{E}}{\\arg\\min}\\ \\lVert z\_e
- e\_k \\rVert\_2 $$

其中：

  - $z\_e$：编码器输出的某个位置的连续特征向量；$\\mathcal{E} = {e\_1, \\dots, e\_K}$：码本，包含
    $K$ 个可学习的码字向量
  - $z\_q$：量化后的特征，即码本中离 $z\_e$ 最近的码字；用码字代替连续特征，使特征空间离散可采样
  - 特征层面生成异常的方式是：用与最近码字相近的**其他码字**替换，得到「看起来像正常特征但不一样」的近分布异常

## 特点

| Name    | 说明                                                 |
| ------- | -------------------------------------------------- |
| 特征级异常合成 | 不依赖外部纹理数据集，避免合成异常与真实缺陷差异过大                         |
| 双子空间    | 同时在「通用物体」和「目标物体」两个子空间重投影，增强对异常的敏感                  |
| 码本      | 离散的码字使异常采样变得可控                                     |
| 训练复杂    | 三个阶段，训练过程比 [PatchCore](/0535_paper_PatchCore) 复杂得多 |

表中是 DSR 的特点：它的创新在于异常合成放在特征层面，但代价是训练流程复杂。

## 使用

``` bash
anomalib train --model Dsr --data MVTecAD --data.category <category>
```

anomalib README 中说明该算法的基准结果尚未提供。评估指标见 [Anomaly Detection
Metrics](/0711_ML_Metrics_Anomaly)，论文数值请参考原文。

## 优缺点

  - **优点**：特征级合成异常，更贴近正常分布；不依赖外部数据；输出像素级异常图
  - **缺点**：三阶段训练复杂；需要在 ImageNet 上预训练码本；anomalib 里暂无官方基准

## Reference

  - [DSR – A Dual Subspace Re-Projection Network for Surface Anomaly
    Detection](https://link.springer.com/chapter/10.1007/978-3-031-19821-2_31)
  - [anomalib -
    Dsr](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/dsr)
