-----

| Title     | ML Tasks Image OCR TrOCR                              |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-25T16:23:55Z`                                |
| Updated @ | `2026-11-25T16:23:55Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/780) |

-----

# TrOCR

TrOCR（Transformer-based Optical Character Recognition with Pre-trained
Models，Microsoft，2021，AAAI 2023）是把 Transformer
预训练范式系统引入文字识别的工作：**编码器**用预训练的图像
Transformer（ViT 类，如 BEiT / DeiT），**解码器**用预训练的文本 Transformer（RoBERTa /
MiniLM），端到端地把文字行图像转成文字序列。与 [CRNN](0196_ML_Tasks_Image_OCR_CRNN) 的"CNN +
RNN + CTC"相比，它没有 CNN 和 RNN，也不依赖 CTC，输出是自回归生成的子词（wordpiece / BPE）序列。总览见
[OCR](0200_ML_Tasks_Image_OCR)。

## 结构

下图展示 TrOCR 如何把一张文字行图像变成文字序列：

``` mermaid
flowchart LR
    I["文字行图像<br/>缩放到 384 × 384"] --> P["切成 16×16 patch<br/>+ 位置编码"]
    P --> E["图像 Transformer 编码器<br/>(BEiT / DeiT 初始化)"]
    E --> X["编码特征序列"]
    X -->|Cross-Attention| D["文本 Transformer 解码器<br/>(RoBERTa / MiniLM 初始化)"]
    D --> O["逐 token 自回归输出文本"]
    O -->|上一步输出作为输入| D
```

图中：

  - **输入**：已经切出来的单行文字图像（检测需要另外完成），缩放为固定大小，切成 $16 \\times 16$ 的
    patch，加上位置编码送入编码器。
  - **编码器**：标准的 ViT 结构，输出每个 patch 对应的特征向量；用自监督预训练的图像模型（BEiT）或有监督预训练的
    DeiT 初始化，提供对图像的先验。
  - **解码器**：标准 Transformer
    解码器，每一层有自注意力（看已生成的文字）和**交叉注意力**（看编码器的图像特征），用预训练语言模型初始化，带入语言先验（拼写、词汇搭配）。
  - **自回归回路**：右侧的反馈箭头表示每个时间步把上一步输出的 token 作为输入，直到输出结束符。
  - 关键结论：图像特征由编码器提供，语言知识由解码器提供，二者各自预训练，再联合微调。

## 训练

  - **两阶段预训练**：先用大规模合成的印刷体、手写体文字行图像（数亿级）预训练，学会基础读字能力；再用较小的真实数据（如 SROIE
    收据、IAM 手写）做针对性的中间预训练和微调。
  - 论文给出 Small / Base / Large 三个规模，参数量大致分别为 6 千万、3 亿多、5
    亿多级别；规模越大，精度越高，推理也越慢。

## 特点与局限

  - 优点：充分利用预训练的视觉和语言模型，对印刷体、手写体都有很强的效果；解码阶段天然带有语言模型，能利用上下文纠正形近字。
  - 局限：
      - 自回归解码比 CTC 的并行解码慢；
      - 仍然是**行级**识别，需要先用检测器（如
        [EAST](0193_ML_Tasks_Image_OCR_EAST)）切出文字行，整页文档不能直接输入；
      - 解码器带语言先验，遇到乱序字符串、编号等"没有语言规律"的文本时可能被先验带偏（把不认识的字"脑补"成常见词）。
  - 更进一步的 OCR-free 方向是把检测也省掉，见 Donut。

## Reference

  - [paper - 2021 - TrOCR: Transformer-based Optical Character
    Recognition with Pre-trained
    Models](https://arxiv.org/abs/2109.10282)
  - [microsoft/unilm/trocr -
    Github](https://github.com/microsoft/unilm/tree/master/trocr)
  - [Hugging Face -
    TrOCR](https://huggingface.co/docs/transformers/model_doc/trocr)
