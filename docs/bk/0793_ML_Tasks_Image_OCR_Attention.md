-----

| Title     | ML Tasks Image OCR Attention                          |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-25T16:29:35Z`                                |
| Updated @ | `2026-11-25T16:29:35Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/793) |

-----

# Attention

Attention 识别是 [OCR](0200_ML_Tasks_Image_OCR) 识别阶段里和 CTC 并列的另一条路线（总览中的
Seq2Seq）：用编码器把文字图像编码成一组特征向量，解码器像机器翻译一样**逐字符自回归生成**，每一步通过注意力机制决定"现在该看图像的哪个位置"。它不需要
[CTC](0189_ML_Tasks_Image_OCR_CTC) 的"空白符 +
折叠"规则，输出的是下一个字符，因此能天然利用已经生成的前文（相当于隐式语言模型），代价是解码是串行的、更慢，并且遇到对不齐时容易出现"注意力漂移"。代表工作有
RARE（2016）和 ASTER（2018）。

## 基本结构

下图展示 Attention 识别器的通用结构，并标出一次解码循环中的数据流：

``` mermaid
flowchart LR
    I[文字图像] --> E["编码器<br/>CNN + BiLSTM"]
    E --> H["特征序列 h_1 … h_T"]
    H --> A["注意力<br/>算权重 α_t,i 与上下文 c_t"]
    S["解码器状态 s_(t-1)"] --> A
    A --> C["上下文向量 c_t"]
    C --> D["解码器 RNN<br/>输入 [y_(t-1); c_t]"]
    D --> Y["输出字符 y_t"]
    D --> S
    Y -->|作为下一步输入| D
```

图中：

  - **编码器**：CNN 提取特征并沿宽度方向切成序列，再用 BiLSTM 加上下文，得到 $h\_1, \\dots, h\_T$，和
    [CRNN](0196_ML_Tasks_Image_OCR_CRNN) 的前半部分相同。
  - **注意力**：每个解码步用当前解码器状态 $s\_{t-1}$ 与每个 $h\_i$ 打分，softmax 得到权重
    $\\alpha\_{t,i}$，再加权求和得到上下文向量 $c\_t$——"这一步该读图像的哪个位置"。
  - **解码器 RNN**：把上一步输出字符 $y\_{t-1}$ 和上下文向量 $c\_t$ 拼起来作为输入，更新状态 $s\_t$
    并输出当前字符 $y\_t$。
  - 右侧回路表示自回归：每步的输出又作为下一步输入，直到输出结束符 `<EOS>`。
  - 关键结论：解码长度由结束符决定，不要求和特征序列等长，也不需要空白符。

## 注意力公式

$$ e\_{t,i} = v^{\\top} \\tanh\!\\left(W s\_{t-1} + V h\_i + b\\right)
$$

$$ \\alpha\_{t,i} =
\\frac{\\exp(e\_{t,i})}{\\sum\_{j=1}^{T}\\exp(e\_{t,j})}, \\qquad c\_t =
\\sum\_{i=1}^{T} \\alpha\_{t,i}, h\_i $$

$$ s\_t = \\mathrm{RNN}\!\\left(s\_{t-1}, \[,y\_{t-1};,c\_t,\]\\right),
\\qquad P(y\_t) = \\mathrm{softmax}(W\_o s\_t + b\_o) $$

其中：

  - $t$：解码步下标，$i, j \\in \[1, T\]$：编码器输出序列的位置下标，$T$ 为特征序列长度
  - $h\_i$：编码器在位置 $i$ 的特征向量
  - $s\_{t-1}, s\_t$：解码器上一步、当前步的隐藏状态
  - $e\_{t,i}$：解码第 $t$ 步时，对位置 $i$ 的"相关度"打分
  - $v, W, V, b$：可学习参数，$\\tanh$ 把解码状态和图像特征映射到同一空间后做比较（加性注意力）
  - $\\alpha\_{t,i}$：softmax 归一化后的注意力权重，$\\sum\_i \\alpha\_{t,i} =
    1$；在理想情况下，会随字符一个接一个地从左向右移动
  - $c\_t$：以 $\\alpha\_{t,i}$ 为权重的特征加权和，即这一步"看到"的内容
  - $y\_{t-1}$：上一步输出字符（训练时用真值，即 teacher forcing）；$\[\\cdot;\\cdot\]$
    表示向量拼接
  - $W\_o, b\_o$：输出层参数，$P(y\_t)$ 是字符集上的概率分布

训练用逐字符的交叉熵损失 $-\\sum\_t \\ln P(y\_t^*)$，其中 $y\_t^*$ 是第 $t$ 个真值字符。

## 代表方法

**RARE**（2016）：Robust text recognizer with Automatic
REctification。由两部分组成：

  - **空间变换网络（STN）+ TPS**：先预测一组基准点，用薄板样条（Thin-Plate
    Spline，TPS）变换把弯曲、透视变形的文字"拉直"成规整的水平文字；
  - **序列识别网络（SRN）**：编码器用 BiGRU，解码器是带注意力的 GRU。

整个过程可微，不需要额外的矫正标注，只用识别损失端到端训练。

**ASTER**（2018）：Attentional Scene Text Recognizer with Flexible
Rectification，沿用"矫正 + 识别"的思路并做了升级：

  - 矫正网络仍用 TPS，但更灵活，对更严重的变形有效；
  - 编码器换成 ResNet + BiLSTM；
  - 解码器是**双向**的：同时训练从左到右和从右到左两个注意力解码器，推理时取置信度更高的一个，缓解单向解码的偏差。

## 与 CTC 的对比

| 方面    | CTC（如 CRNN）  | Attention（如 ASTER）  |
| ----- | ------------ | ------------------- |
| 解码方式  | 逐帧并行输出，再折叠   | 逐字符自回归              |
| 对齐    | 隐式，由路径求和处理   | 显式，注意力权重            |
| 上下文依赖 | 条件独立，弱       | 利用已生成字符，强           |
| 速度    | 快            | 较慢（串行解码）            |
| 典型问题  | 要求足够的帧数、尖峰现象 | 注意力漂移、长文本易错位、可能"脑补" |

表中第一列是比较维度，后两列分别是两种方案的表现；总体上 CTC 更快、更稳，Attention 精度上限更高。PP-OCRv5
把两者结合：训练时用基于注意力的 GTC-NRTR 分支指导 CTC 分支，推理只保留 CTC 分支。

## 局限

  - 解码串行，难以像 CTC 那样大批量并行；
  - 注意力对齐在长文本或图像质量差时容易失效（重复字符、漏字符）；
  - 之后的趋势是用 Transformer 替换 RNN（如
    [TrOCR](0780_ML_Tasks_Image_OCR_TrOCR)、[SVTR](0779_ML_Tasks_Image_OCR_SVTR)），或直接走
    OCR-free 路线。

## Reference

  - [paper - 2016 - Robust Scene Text Recognition with Automatic
    Rectification (RARE)](https://arxiv.org/abs/1603.03915)
  - [paper - 2018 - ASTER: An Attentional Scene Text Recognizer with
    Flexible
    Rectification](https://ieeexplore.ieee.org/document/8395027)
  - [paper - 2015 - Neural Machine Translation by Jointly Learning to
    Align and Translate](https://arxiv.org/abs/1409.0473)
  - [paper - 2019 - What Is Wrong With Scene Text Recognition Model
    Comparisons? Dataset and Model
    Analysis](https://arxiv.org/pdf/1904.01906v4.pdf)
  - [bgshih/aster - Github](https://github.com/bgshih/aster)
