-----

| Title     | MO KD History                                         |
| --------- | ----------------------------------------------------- |
| Created @ | `2021-04-12T06:23:02Z`                                |
| Updated @ | `2026-10-18T09:36:17Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/336) |

-----

# KD History

## History

**Pattern**

    - 2020-05 **[Name]** paper_full_name [[Paper](paperlink)] [[Code](codelink)] [[Note](notelink)] #tags

  - 2006-08 **\[Model Compression\]** Model Compression
    \[[Paper](http://www.cs.cornell.edu/~caruana/compression.kdd06.pdf)\]
    \[[Code](codelink)\] \[[Note](notelink)\] \#response-based
  - 2014-12 **\[FitNets\]** FitNets: Hints for Thin Deep Nets
    \[[Paper](https://arxiv.org/abs/1412.6550)\] \[[Code](codelink)\]
    \[[Note](notelink)\] \#feature-based
  - 2015-03 **\[KD\]** Distilling the Knowledge in a Neural Network
    \[[Paper](https://arxiv.org/abs/1503.02531)\] \[[Code](codelink)\]
    \[[Note](https://github.com/junxnone/tech-io/issues/967)\]
    \#response-based
  - 2016-06 **\[Seq-KD\]** Sequence-Level Knowledge Distillation
    \[[Paper](https://arxiv.org/abs/1606.07947)\] \[[Code](codelink)\]
    \[[Note](notelink)\] \#response-based \#seq2seq
  - 2016-12 **\[AT\]** Paying More Attention to Attention (Attention
    Transfer) \[[Paper](https://arxiv.org/abs/1612.03928)\]
    \[[Code](codelink)\] \[[Note](notelink)\] \#feature-based
  - 2017-06 **\[DML\]** Deep Mutual Learning
    \[[Paper](https://arxiv.org/abs/1706.00384)\] \[[Code](codelink)\]
    \[[Note](notelink)\] \#online
  - 2018-05 **\[BAN\]** Born-Again Neural Networks
    \[[Paper](https://arxiv.org/abs/1805.04770)\] \[[Code](codelink)\]
    \[[Note](notelink)\] \#self-distillation
  - 2019-04 **\[RKD\]** Relational Knowledge Distillation
    \[[Paper](https://arxiv.org/abs/1904.05068)\] \[[Code](codelink)\]
    \[[Note](notelink)\] \#relation-based
  - 2019-09 **\[TinyBERT\]** TinyBERT: Distilling BERT for Natural
    Language Understanding \[[Paper](https://arxiv.org/abs/1909.10351)\]
    \[[Code](codelink)\] \[[Note](notelink)\] \#response-based \#nlp
  - 2019-10 **\[DistilBERT\]** DistilBERT, a distilled version of BERT
    \[[Paper](https://arxiv.org/abs/1910.01108)\] \[[Code](codelink)\]
    \[[Note](notelink)\] \#response-based \#nlp
  - 2020-06 **\[Survey\]** Knowledge Distillation: A Survey
    \[[Paper](https://arxiv.org/abs/2006.05525)\] \[[Code](codelink)\]
    \[[Note](notelink)\] \#survey
  - 2023-06 **\[GKD\]** On-Policy Distillation of Language Models:
    Learning from Self-Generated Mistakes
    \[[Paper](https://arxiv.org/abs/2306.13649)\] \[[Code](codelink)\]
    \[[Note](notelink)\] \#online \#llm
  - 2025-01 **\[DeepSeek-R1\]** DeepSeek-R1: Incentivizing Reasoning
    Capability in LLMs via RL
    \[[Paper](https://arxiv.org/abs/2501.12948)\] \[[Code](codelink)\]
    \[[Note](notelink)\] \#response-based \#llm
  - 2025-02 **\[Scaling Laws\]** Distillation Scaling Laws
    \[[Paper](https://arxiv.org/abs/2502.08606)\] \[[Code](codelink)\]
    \[[Note](notelink)\] \#theory \#llm

> 2021-2023
> 这段时间以对比学习/图结构等增量式变体为主，没有找到一篇公认的里程碑式工作，这里不强行补一条——等后续有更明确的共识节点再补充。

## Sub-Domain

按"学什么"（对应 [知识蒸馏 - Trend](0207_MO_KD) 的分类）给上面的条目归个类，方便按类型查找：

| 分类                  | 含义                         | 代表条目                                                        |
| ------------------- | -------------------------- | ----------------------------------------------------------- |
| \#response-based    | 匹配 Teacher 最终输出（软化 logits） | Model Compression、KD、Seq-KD、TinyBERT、DistilBERT、DeepSeek-R1 |
| \#feature-based     | 匹配中间层激活/特征图                | FitNets、AT                                                  |
| \#relation-based    | 匹配样本/层之间的相对关系              | RKD                                                         |
| \#online            | Teacher/Student 同时训练、互相指导  | DML、GKD                                                     |
| \#self-distillation | 模型自己兼任 Teacher 和 Student   | BAN                                                         |
| \#theory / \#survey | 理论分析或综述，不提出新方法             | Survey、Scaling Laws                                         |
