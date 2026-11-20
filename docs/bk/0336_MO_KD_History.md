-----

| Title     | MO KD History                                         |
| --------- | ----------------------------------------------------- |
| Created @ | `2021-04-12T06:23:02Z`                                |
| Updated @ | `2026-11-20T09:44:23Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/336) |

-----

# 知识蒸馏发展历史

> 知识蒸馏（Knowledge Distillation，KD）的发展时间线。正文按
> [timelinemd](https://github.com/junxnone/jstools/tree/main/timelinemd)
> 格式书写，可用 [timelinemd
> 在线工具](https://junxnone.github.io/jstools/timelinemd/?md=https://raw.githubusercontent.com/junxnone/aiwiki/main/docs/0336_MO_KD_History.md)
> 以交互式时间轴查看（页面顶部会多出同步脚本自动生成的 Title/Created/Updated
> 表格，不影响下方时间轴解析）。日期除特别说明外均为
> arXiv 首次提交日期（已通过 arXiv API 核对）。总览见 [知识蒸馏](0207_MO_KD)，Hinton 原文笔记见
> [Distilling the Knowledge in a Neural Network](0208_MO_KD_s)。
> 
> 按"学什么 / 怎么训"给条目归类（分类含义见 [知识蒸馏 - Trend](0207_MO_KD)）：
> 
> | 分类              | 含义                                     | 代表条目                                                            |
> | --------------- | -------------------------------------- | --------------------------------------------------------------- |
> | response-based  | 匹配 Teacher 最终输出（软化 logits）             | Model Compression、KD、Seq-KD、DKD、DistilBERT、TinyBERT、DeepSeek-R1 |
> | feature-based   | 匹配中间层激活 / 特征图                          | FitNets、AT、ReviewKD、FGD                                         |
> | relation-based  | 匹配样本 / 层之间的相对关系                        | RKD、CRD                                                         |
> | online / self   | Teacher 与 Student 同时训练，或模型自己兼任 Teacher | DML、BAN、BYOT、GKD                                                |
> | data-free       | 没有原始训练数据时的蒸馏                           | DAFL、DeepInversion                                              |
> | theory / survey | 理论分析或综述                                | TAKD、Survey、Scaling Laws                                        |
> 

> 表中：第一列是分类标签，第二列说明该类蒸馏匹配的对象，第三列列出下方时间线中属于该类的代表条目；一个工作可能同时涉及多类，这里只放最典型的一类。

## 经典奠基

### 2006-08 Model Compression {point}

Bucilă、Caruana、Niculescu-Mizil 在 KDD 2006 提出用大模型（集成）标注的数据训练小模型，是"用
Teacher 输出训练 Student"思路的早期来源。无 arXiv 版本，月份依据 KDD 2006 会期，待核实。

### 2014-12-19 FitNets

用 Teacher 隐藏层的"提示（hint）"训练更瘦更深的
Student，是特征蒸馏的起点。[arXiv:1412.6550](https://arxiv.org/abs/1412.6550)

### 2015-03-09 Hinton KD

*Distilling the Knowledge in a Neural Network*：温度 softmax 产生软目标，Student
同时学习软目标与硬标签。[arXiv:1503.02531](https://arxiv.org/abs/1503.02531)。笔记见
[0208](0208_MO_KD_s)。

### 2016-06-25 Seq-KD

*Sequence-Level Knowledge Distillation*：把蒸馏从词级推进到整句序列级，是后续 LLM
蒸馏的先声。[arXiv:1606.07947](https://arxiv.org/abs/1606.07947)

### 2016-12-12 Attention Transfer

*Paying More Attention to Attention*：让 Student 匹配 Teacher
的空间注意力图。[arXiv:1612.03928](https://arxiv.org/abs/1612.03928)

## 互学习、自蒸馏与关系蒸馏

### 2017-06-01 DML

*Deep Mutual Learning*：多个对等网络同时训练、互相蒸馏，不再需要预训练好的固定
Teacher。[arXiv:1706.00384](https://arxiv.org/abs/1706.00384)

### 2018-05-12 BAN

*Born Again Neural Networks*：同架构的 Student 一代代向上一代学习，Student 常能超过
Teacher。[arXiv:1805.04770](https://arxiv.org/abs/1805.04770)

### 2019-02-09 TAKD

*Improved Knowledge Distillation via Teacher Assistant*：指出 Teacher 与
Student
容量差距过大会削弱蒸馏效果，引入中间规模的助教模型。[arXiv:1902.03393](https://arxiv.org/abs/1902.03393)

### 2019-04-10 RKD

*Relational Knowledge
Distillation*：匹配样本之间的距离与角度关系，而非单个样本的输出。[arXiv:1904.05068](https://arxiv.org/abs/1904.05068)

### 2019-05-17 BYOT

*Be Your Own
Teacher*：浅层分类器向最深层学习的自蒸馏。[arXiv:1905.08094](https://arxiv.org/abs/1905.08094)

### 2019-10-23 CRD

*Contrastive Representation
Distillation*：用对比学习目标做表示蒸馏。[arXiv:1910.10699](https://arxiv.org/abs/1910.10699)

### 2020-06-09 KD Survey

*Knowledge Distillation: A
Survey*：系统梳理知识类型、训练方案与师生结构。[arXiv:2006.05525](https://arxiv.org/abs/2006.05525)

## 无数据、检测与视觉 Transformer

### 2019-04-02 DAFL

*Data-Free Learning of Student
Networks*：用生成器合成样本，在没有原始数据的情况下蒸馏。[arXiv:1904.01186](https://arxiv.org/abs/1904.01186)

### 2019-12-18 DeepInversion

*Dreaming to Distill*：从 Teacher 的 BN
统计量反演出合成图像，用于无数据蒸馏。[arXiv:1912.08795](https://arxiv.org/abs/1912.08795)

### 2020-12-23 DeiT

*Training data-efficient image transformers & distillation through
attention*：引入 distillation token，用卷积网络做 Teacher 训练视觉
Transformer。[arXiv:2012.12877](https://arxiv.org/abs/2012.12877)。笔记见
[DeiT](0253_ML_Transformer_DeiT)。

### 2021-04-19 ReviewKD

*Distilling Knowledge via Knowledge
Review*：跨层的特征回顾与融合。[arXiv:2104.09044](https://arxiv.org/abs/2104.09044)

### 2021-11-23 FGD

*Focal and Global Knowledge Distillation for
Detectors*：针对检测任务，分离前景与背景并加入全局关系蒸馏。[arXiv:2111.11837](https://arxiv.org/abs/2111.11837)

### 2022-03-16 DKD

*Decoupled Knowledge Distillation*：把 KD
损失拆成目标类（TCKD）与非目标类（NCKD）两部分分别加权。[arXiv:2203.08679](https://arxiv.org/abs/2203.08679)

## 语言模型时代

### 2019-09-23 TinyBERT

*TinyBERT: Distilling BERT for Natural Language Understanding*：对
embedding、注意力、隐状态与预测层做逐层蒸馏。[arXiv:1909.10351](https://arxiv.org/abs/1909.10351)

### 2019-10-02 DistilBERT

*DistilBERT, a distilled version of BERT*：预训练阶段蒸馏，得到更小更快的
BERT。[arXiv:1910.01108](https://arxiv.org/abs/1910.01108)

### 2020-02-25 MiniLM

*MiniLM: Deep Self-Attention Distillation*：蒸馏最后一层的自注意力分布与 value
关系。[arXiv:2002.10957](https://arxiv.org/abs/2002.10957)

### 2022-12-20 Self-Instruct

*Self-Instruct*：用模型自己生成指令数据来对齐，是后来 Alpaca
等"用强模型生成数据蒸馏弱模型"路线的基础。[arXiv:2212.10560](https://arxiv.org/abs/2212.10560)

### 2023-05-03 Distilling Step-by-Step

*Distilling Step-by-Step\!*：把 LLM
生成的推理过程（rationale）作为额外监督来训练小模型。[arXiv:2305.02301](https://arxiv.org/abs/2305.02301)

### 2023-06-14 MiniLLM

*MiniLLM*：用反向 KL 与 on-policy
采样蒸馏生成式大模型。[arXiv:2306.08543](https://arxiv.org/abs/2306.08543)

### 2023-06-23 GKD

*On-Policy Distillation of Language Models*：Student 在自己生成的序列上接受 Teacher
打分，缓解训练与推理的分布不一致。[arXiv:2306.13649](https://arxiv.org/abs/2306.13649)

### 2024-02-06 DistiLLM

*DistiLLM*：skew KL 与自适应的离策略数据使用，使 LLM
蒸馏更高效。[arXiv:2402.03898](https://arxiv.org/abs/2402.03898)

### 2025-01-22 DeepSeek-R1 蒸馏

*DeepSeek-R1*：把 R1 的推理能力以 SFT 方式蒸馏进 Qwen、Llama
系列的稠密小模型，论文结论是对小模型直接蒸馏优于直接做强化学习。[arXiv:2501.12948](https://arxiv.org/abs/2501.12948)

### 2025-02-12 Distillation Scaling Laws

*Distillation Scaling Laws*：研究蒸馏效果如何随 Teacher 与 Student
的算力分配变化，并指出存在容量差距。[arXiv:2502.08606](https://arxiv.org/abs/2502.08606)
