-----

| Title     | LM VLM GLIP                                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2024-04-09T06:55:23Z`                                |
| Updated @ | `2026-11-26T08:28:40Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/463) |

-----

# GLIP

  - CLIP =\> GLIP(Grounded Language-Image Pre-training)
  - `Phrase Grounding` 识别短语和图像中目标更细粒度的关系的任务 [Phrase Grounding -
    paperwithcode](https://paperswithcode.com/task/phrase-grounding)
      - `Grounding Task` 将文本描述与视觉信息（如图片）相关联的任务

## 核心思想

CLIP（见 [paper
CLIP](https://github.com/junxnone/aiwiki/issues/448)）把整张图和整句话对齐，粒度是**图像级**；GLIP
把**目标检测**重新定义为 **phrase
grounding**，把「区域」和「短语中的词」对齐，粒度到**区域-词级**。这样检测和定位任务就能和大规模图文数据一起预训练，并能用文字提示做零样本检测。

## 检测如何变成 grounding

传统检测器对每个区域做固定类别的分类；GLIP 用区域特征与文本特征的相似度取代分类器：

$$ S\_{ground} = O,P^{\\top},\\qquad O =
\\text{Enc}\_I(\\text{Img}),\\quad P = \\text{Enc}\_L(\\text{Prompt}) $$

其中：

  - $O\\in\\mathbb{R}^{N\\times d}$：$N$ 个候选区域的视觉特征，$d$ 为特征维度
  - $P\\in\\mathbb{R}^{M\\times d}$：文本 Prompt 中 $M$ 个词（token）的特征
  - $S\_{ground}\\in\\mathbb{R}^{N\\times M}$：每个区域与每个词的对齐得分，替代传统分类器的
    logits
  - $\\text{Enc}\_I$：图像编码器；$\\text{Enc}\_L$：文本编码器
  - 检测任务的 Prompt 把类别名拼成一句话，如 "person. bicycle. car."，从而与 grounding 统一

## 结构

``` mermaid
flowchart LR
    I[图像] --> IE[图像编码器]
    T[文本 Prompt] --> TE[文本编码器]
    IE --> F[深度融合 跨模态注意力]
    TE --> F
    F --> O[区域特征 O]
    F --> P[词特征 P]
    O --> S[对齐得分 O P^T]
    P --> S
    S --> B[框 + 对应短语]
```

图中：

  - 图像和文本分别编码，再通过多层**深度融合**（跨模态注意力）互相更新特征
  - 融合后的区域特征 $O$ 与词特征 $P$ 做点积得到对齐得分，每个框关联到文本中的某个词
  - 关键结论：深度融合让文本提示参与视觉特征学习，比只在最后一步对齐的方式效果更好

## 训练数据

| 数据类型         | 来源                | 作用                  |
| ------------ | ----------------- | ------------------- |
| 检测数据         | COCO、Objects365 等 | 提供框与类别，类别名拼成 Prompt |
| Grounding 数据 | 带短语-框标注的数据        | 提供人工标注的短语-区域对应      |
| 图文对（伪标注）     | 大规模网络图文，用教师模型生成框  | 扩大语义覆盖面，让模型见到更多概念   |

表中：

  - **伪标注**：用已有模型自动生成的标签，成本低但含噪声
  - 对比结论：数据规模和语义覆盖是 GLIP 具备零样本和开放词汇能力的关键

## 后续与对比

  - GLIPv2：把定位和理解任务进一步统一
  - Grounding DINO：将类 DINO 检测器与文本融合，开放词汇检测的常用方案
  - 与 SAM（见 [LM VLM
    SAM](https://github.com/junxnone/aiwiki/issues/414)）组合：先用文字检测出框，再用
    SAM 分割出掩码

## Reference

  - 2021 [Grounded Language-Image
    Pre-training](https://arxiv.org/abs/2112.03857)
