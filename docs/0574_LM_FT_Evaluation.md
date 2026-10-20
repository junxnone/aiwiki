---
Title | LM FT Evaluation
-- | --
Created @ | `2026-10-20T08:08:48Z`
Updated @| `2026-10-20T08:08:48Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/574)

---
# 微调效果评估

> 本文是 [大模型微调总览](0410_LM_FT) 的深入篇。前面各篇都在讲"怎么微调"，本页讲"微调完怎么知道效果好不好"——对话类模型的"好"很难用传统的单一准确率指标衡量，目前业内主流做法是**用更强的模型当裁判**。

## 为什么不能只看传统 NLP 指标

像 BLEU、ROUGE 这类基于 n-gram 重叠度的指标，衡量的是生成文本和参考答案在字面上有多像，但对话类任务里"好的回答"往往有很多种合理的表达方式，字面不像不代表质量差；人工评测虽然质量高，但成本高、速度慢、难以规模化、评测标准还容易因人而异、难以复现。这两类方法的局限催生了目前的主流方案：**LLM-as-a-Judge**——用一个能力更强的模型（通常是 GPT-4 级别）来给待评测模型的回答打分或做偏好判断。

## AlpacaEval

AlpacaEval（Li et al. 2023）选取 805 条能代表典型用户交互场景的指令，让待评测模型和一个参考模型（最初是 `text-davinci-003`）分别生成回答，再用 GPT-4 级别的裁判模型判断哪个回答更好，统计**胜率（Win Rate）**作为最终分数。优点是全自动、成本低、能快速跑完；局限是题目相对简单（比如"澳大利亚的首都是什么"这类事实性问题占比不低），裁判模型本身也存在**长度偏好**——容易给更长的回答打高分，不一定代表回答质量真的更好。后续的 **AlpacaEval 2.0** 针对这个问题引入了长度控制（Length-Controlled）的胜率计算方式，缓解单纯"堆字数"刷分的问题。

## MT-Bench

MT-Bench（Zheng et al. 2023）用 80 道覆盖写作、角色扮演、信息抽取、推理、数学、代码、STEM、人文八大类的**多轮对话**题目，同样用 GPT-4 级别的裁判模型打分（1-10 分）。相比 AlpacaEval 的单轮问答，MT-Bench 专门设计了多轮对话场景，能额外考察模型在多轮交互中保持上下文一致性的能力；局限是题目数量更少（只有 80 道），覆盖面和统计显著性都有限。这篇论文同时提出了 **Chatbot Arena**——让真实用户对两个匿名模型的回答投票，用类似 Elo 等级分的机制排名，是目前被广泛引用的"LLM-as-a-Judge"方法论的奠基工作之一。

## 怎么选

| 场景 | 推荐 |
|---|---|
| 快速验证一次微调迭代是否有提升，跑分要快 | AlpacaEval（2.0，长度控制版本） |
| 需要考察多轮对话、不同能力维度（代码/数学/写作等）的细分表现 | MT-Bench |
| 要和其他公开模型做横向对比、看社区公认的排名 | Chatbot Arena（需要真实用户投票数据，不是自动化离线评测） |
| 评测结果要写进论文/报告，需要同时报告多个基准互相印证 | AlpacaEval 2.0 + MT-Bench 搭配使用是目前最常见的组合 |

## 局限

- **裁判模型的偏见**：无论是长度偏好，还是对特定表达风格/语气的偏好，裁判模型的判断本身不是绝对客观的标准，只是相对更省成本的代理指标；
- **测试集污染风险**：如果训练数据里混入了和评测集高度相似的内容，分数会虚高，不能完全反映真实能力；
- **这些基准主要衡量"指令跟随/综合对话质量"**，不能替代针对具体下游任务（如专业领域问答、代码生成通过率）的专项评测——微调完一个专业领域模型，最终还是要在真实业务数据上验证效果，通用基准的分数只能作为一个参考信号。

## Reference
- Li, X. et al. (2023). AlpacaEval: An Automatic Evaluator of Instruction-following Models. [GitHub](https://github.com/tatsu-lab/alpaca_eval)
- Dubois, Y. et al. (2024). Length-Controlled AlpacaEval: A Simple Way to Debias Automatic Evaluators. [arXiv:2404.04475](https://arxiv.org/abs/2404.04475)
- Zheng, L. et al. (2023). Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena. [arXiv:2306.05685](https://arxiv.org/abs/2306.05685)
- [大模型微调总览](0410_LM_FT)
- [大模型对齐训练：SFT/RLHF/DPO](0568_LM_FT_Alignment)

