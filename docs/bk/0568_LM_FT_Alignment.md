-----

| Title     | LM FT Alignment                                       |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-20T07:02:22Z`                                |
| Updated @ | `2026-10-20T08:19:14Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/568) |

-----

# 大模型对齐训练：SFT / RLHF / DPO

> 本文是 [大模型微调总览](0410_LM_FT)
> 的深入篇。总览页聚焦"用什么方式更新参数"（全参数/PEFT），本文聚焦另一个正交的维度——"用什么数据和目标函数训练"，覆盖目前对话类大模型训练流程里最核心的三个阶段性技术：SFT、RLHF、DPO。两个维度可以自由组合，比如可以用
> LoRA 做 SFT，也可以全参数做 SFT。

## 为什么预训练之后还需要这几步

预训练得到的基座模型只学会了"续写文本"，并不天然知道怎么按用户意图回应指令、也不知道什么样的回答是"更好"的。从基座模型到可用的对话助手，典型流程是：

    预训练基座模型 → SFT（学会按指令格式回应） → RLHF 或 DPO（学会对齐人类偏好）

SFT 解决"形式"问题（怎么像一个助手一样说话），RLHF/DPO
解决"质量/偏好"问题（在能说话的基础上，哪种说法更好、更安全、更有用）。微调完之后怎么验证这几步训练是否真的有效，见
[微调效果评估](0574_LM_FT_Evaluation)。

## SFT（Supervised Fine-Tuning，监督微调）

用"指令-回答"这样的数据对（人工撰写或更强模型生成），让预训练模型学会按指令格式组织回应——训练方式就是标准的语言模型下一词预测损失，只是训练数据从"互联网文本"换成了"指令-回答对"：

    L_SFT = -E[log P(response | instruction)]

SFT 本身只是一个训练目标/数据组织方式，可以用全参数微调实现，也可以用 [LoRA](0406_LM_FT_LoRA) 等任意 PEFT
方法实现——两者是正交的维度。SFT 是目前几乎所有对话类大模型训练流程里的标准第一步。

### 指令数据从哪来

高质量的"指令-回答"数据是 SFT 效果的决定性因素，几个关键工作：

  - **Self-Instruct**（Wang et al.
    2022）：用一个已有的（能力较弱的）语言模型自己"引导"生成大量指令数据——从一小批人工写的种子指令出发，让模型自己生成新指令、再生成对应回答，大幅降低了人工标注指令数据的成本；
  - **Alpaca**（Taori et al. 2023）：用 Self-Instruct 方法，调用
    `text-davinci-003` 生成了 5.2 万条指令-回答数据，拿这批数据微调 LLaMA-7B
    之后，效果就能接近生成这批数据的 `text-davinci-003`
    本身——证明了"用强模型生成数据去蒸馏训练弱模型"这条路径的可行性，成本比全靠人工标注低得多；
  - **FLAN**（Wei et al. 2021）：思路不同于 Self-Instruct 的"生成式"构造，而是把大量已有的 NLP
    任务数据集（分类、翻译、摘要等）统一改写成指令格式，证明了在足够多样的任务上做指令微调，能让模型在**完全没见过的新任务**上也具备不错的零样本泛化能力。

## RLHF（Reinforcement Learning from Human Feedback）

RLHF 在 SFT 之后进行，分两步：

1.  **训练奖励模型（Reward Model）**：收集人类对同一个 prompt
    的多个模型回答的偏好排序，训练一个模型来预测"人类会更喜欢哪个回答"，输出一个标量分数；
2.  **用强化学习优化策略模型**：把 SFT 后的模型当作初始策略，用强化学习算法（最常见是
    PPO）让它朝着奖励模型打分更高的方向继续优化，同时加一个
    KL 散度惩罚项，防止策略模型为了刷高奖励分数而偏离原始语言分布太远（出现"奖励黑客"）。

RLHF 最早在 OpenAI 的 InstructGPT（Ouyang et al. 2022）里被系统性验证：一个只有 13 亿参数、经过
RLHF 训练的模型，在人类评估中的偏好度超过了未对齐的 1750 亿参数
GPT-3，证明了"对齐训练"本身能带来不亚于"扩大模型规模"的收益。RLHF
的主要痛点是流程复杂——需要额外训练并维护一个奖励模型，PPO
本身对超参数敏感、训练不稳定，整个流程涉及四个模型同时参与（策略模型、参考模型、奖励模型、价值模型），工程实现和调参成本都不低。

### PPO 本身在做什么

PPO（Proximal Policy Optimization，Schulman et al. 2017）是强化学习里的通用算法，不是
RLHF
专属，核心思路是：策略每次更新的幅度不能太大，用一个"裁剪（clip）"过的目标函数限制新旧策略之间的差异，避免某一步更新过猛导致策略崩坏——在
RLHF 的场景里，"策略"就是语言模型本身，模型生成一个回答、奖励模型给这个回答打分，PPO 根据这个分数（以及和参考模型的 KL
散度惩罚）调整模型参数，让它更倾向于生成高分回答，同时不要和原始模型差太远。

### 奖励黑客（Reward Hacking）

奖励模型终究只是对"人类偏好"的一个近似，策略模型在强化学习优化过程中，经常会找到一些能骗过奖励模型打高分、但实际质量并不好的"捷径"——比如回答变得啰嗦冗长（如果奖励模型隐含偏好更长的回答）、用一些奖励模型喜欢但读起来别扭的套话。前面提到的
KL 散度惩罚是最基础的缓解手段，但不是万能的，奖励黑客目前仍是 RLHF 类方法里一个持续存在的挑战，评测时也要留意这一点（参考
[微调效果评估](0574_LM_FT_Evaluation) 里裁判模型自身存在的类似偏好问题）。

### Constitutional AI 和 RLAIF：用 AI 反馈替代人类反馈

RLHF 最大的瓶颈之一是人工标注偏好数据的成本和速度。Constitutional AI（Bai et al.
2022，Anthropic）提出用一套写好的原则（"宪法"）替代人类评估员：让模型根据这些原则自己批评、修改自己的输出，再根据原则对不同回答做偏好判断，生成的偏好数据可以直接拿去训练奖励模型——这个用
AI（而不是人类）生成偏好标签的思路被称为 **RLAIF**（Reinforcement Learning from AI
Feedback）。后续研究（Lee et al. 2024）发现，在摘要、有用对话等任务上，人类评估员对 RLHF 和 RLAIF
训练出的模型没有表现出统计显著的偏好差异；在无害性这个维度上，RLAIF 训练出的模型甚至获得了更高的人类评分——证明了用 AI
反馈部分替代人类反馈是可行的，核心价值在于把人工标注这个瓶颈环节的成本和速度问题解决掉。

## DPO（Direct Preference Optimization）

DPO（Rafailov et al. 2023）的核心洞察是：RLHF 里"训练奖励模型 + PPO
强化学习"这整套流程，在数学上可以等价地化简成一个**直接在偏好数据对上做监督学习**的损失函数，完全不需要显式训练奖励模型，也不需要跑强化学习采样。给定一个
prompt `x`、一个更好的回答 `y_w` 和一个更差的回答 `y_l`，DPO 的损失函数是：

    L_DPO = -E[log σ(β log(π_θ(y_w|x)/π_ref(y_w|x)) - β log(π_θ(y_l|x)/π_ref(y_l|x)))]

其中 `π_θ` 是正在训练的策略模型，`π_ref` 是训练开始前的参考模型（通常就是 SFT 之后的模型，训练中保持冻结），`σ` 是
sigmoid 函数，`β`
控制偏离参考模型的惩罚力度。直观理解：这个损失函数在直接拉大"模型给更好回答的相对概率"和"给更差回答的相对概率"之间的差距，不需要额外的奖励模型来告诉它"好"和"差"量化差多少，偏好数据本身的排序关系就是全部监督信号。

DPO 相比 RLHF
的优势：实现简单（本质是一个分类损失，用标准的监督学习训练流程就能跑）、训练更稳定、不需要额外维护奖励模型和价值模型、超参数更少更容易调——这也是
DPO 发布后迅速成为 RLHF 之外最主流对齐训练方法的原因。代价是 DPO
在数学推导上假设了偏好数据能被一个隐式的奖励模型完美解释，在数据噪声较大或者偏好标注不一致的场景下，RLHF
搭配一个显式训练、可以单独检验和调试的奖励模型有时仍然更有优势。

### DPO 之后的变种家族

DPO 发布后，针对它的各种假设/局限，社区很快提出了一批后续工作：

| 方法                              | 针对 DPO 的改进点                                                                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **IPO**（Azar et al. 2023）       | DPO 假设偏好可以被一个隐式的逐点奖励模型解释，这个假设在偏好数据较确定（比如同一对回答反复比较结果一致）时容易过拟合；IPO 从理论上推导出一个更通用的目标函数，不依赖这个假设，用一个恒等函数代替 DPO 里的 sigmoid，缓解过拟合          |
| **KTO**（Ethayarajh et al. 2024） | DPO 需要成对的偏好数据（哪个比哪个好）；KTO 借鉴行为经济学的前景理论，只需要**不成对**的"好/不好"二元标注（类似点赞/点踩），数据收集门槛更低，论文报告在 13B/30B 规模上单独使用 KTO 效果优于单独使用 DPO              |
| **ORPO**（Hong et al. 2024）      | DPO 需要一个额外的参考模型 `π_ref`，带来额外的显存和计算开销；ORPO 把一个基于几率比（odds ratio）的偏好惩罚项直接加进标准 SFT 损失里，不需要参考模型、不需要独立的对齐训练阶段，SFT 和偏好对齐一步做完              |
| **SimPO**（Meng et al. 2024）     | 同样去掉参考模型，但做法不同：用"序列的平均对数概率"直接作为奖励（不需要参考模型做基准），让奖励的计算方式和推理时实际生成文本的方式保持一致；论文报告在 AlpacaEval 2 上比 DPO 最高领先 6.4 分，比 ORPO 等其他无参考模型方法效果更好 |

这些变种的共同动机可以归纳为两类：一类是放松 DPO
的理论假设（IPO）或数据格式要求（KTO），另一类是去掉参考模型以节省工程开销（ORPO、SimPO）。目前社区里
DPO 仍是最广泛使用的基线，具体选哪个变种更多取决于数据格式是否现成（有没有成对偏好数据）和工程资源限制（能不能承受额外的参考模型开销）。

## 怎么选

| 场景                                          | 推荐                                             |
| ------------------------------------------- | ---------------------------------------------- |
| 只需要模型学会按指令格式回应，还没涉及"偏好优化"                   | SFT（数据可以用 Self-Instruct/Alpaca 方式低成本构造）        |
| 已经积累了高质量的人类偏好排序数据，追求工程实现简单、训练稳定             | DPO                                            |
| 需要一个独立、可检验的奖励信号（比如要分别优化多个目标，或奖励函数本身要被复用/审计） | RLHF，人工标注成本高时可以结合 Constitutional AI/RLAIF 降低成本 |
| 资源/工程能力有限，想用最少的新增基础设施做对齐                    | ORPO/SimPO（不需要额外的参考模型和奖励模型）                    |
| 只有不成对的"好/不好"标注，没有严格的 A/B 比较数据               | KTO                                            |

## Reference

  - Ouyang, L. et al. (2022). Training language models to follow
    instructions with human feedback (InstructGPT).
    [arXiv:2203.02155](https://arxiv.org/abs/2203.02155)
  - Schulman, J. et al. (2017). Proximal Policy Optimization Algorithms.
    [arXiv:1707.06347](https://arxiv.org/abs/1707.06347)
  - Bai, Y. et al. (2022). Constitutional AI: Harmlessness from AI
    Feedback. [arXiv:2212.08073](https://arxiv.org/abs/2212.08073)
  - Rafailov, R. et al. (2023). Direct Preference Optimization: Your
    Language Model is Secretly a Reward Model.
    [arXiv:2305.18290](https://arxiv.org/abs/2305.18290)
  - Azar, M. et al. (2023). A General Theoretical Paradigm to Understand
    Learning from Human Preferences (IPO).
    [arXiv:2310.12036](https://arxiv.org/abs/2310.12036)
  - Ethayarajh, K. et al. (2024). KTO: Model Alignment as Prospect
    Theoretic Optimization.
    [arXiv:2402.01306](https://arxiv.org/abs/2402.01306)
  - Hong, J. et al. (2024). ORPO: Monolithic Preference Optimization
    without Reference Model.
    [arXiv:2403.07691](https://arxiv.org/abs/2403.07691)
  - Meng, Y. et al. (2024). SimPO: Simple Preference Optimization with a
    Reference-Free Reward.
    [arXiv:2405.14734](https://arxiv.org/abs/2405.14734)
  - Wang, Y. et al. (2022). Self-Instruct: Aligning Language Model with
    Self Generated Instructions.
    [arXiv:2212.10560](https://arxiv.org/abs/2212.10560)
  - Taori, R. et al. (2023). Stanford Alpaca: An Instruction-following
    LLaMA model. [GitHub](https://github.com/tatsu-lab/stanford_alpaca)
  - Wei, J. et al. (2021). Finetuned Language Models Are Zero-Shot
    Learners (FLAN).
    [arXiv:2109.01652](https://arxiv.org/abs/2109.01652)
  - [TRL - Transformer Reinforcement Learning (Hugging
    Face)](https://github.com/huggingface/trl)
  - [大模型微调总览](0410_LM_FT)
