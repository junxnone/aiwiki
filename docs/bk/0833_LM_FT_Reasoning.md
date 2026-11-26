-----

| Title     | LM FT Reasoning                                       |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T15:36:22Z`                                |
| Updated @ | `2026-11-26T15:42:24Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/833) |

-----

# Reasoning

推理能力训练：用强化学习让模型学会长链思考 (以 DeepSeek-R1 为代表)，GRPO 算法，可验证奖励，蒸馏推理能力，以及推理时计算
(test-time compute) 的扩展。SFT、RLHF、DPO 等对齐方法见 [对齐](/0568_LM_FT_Alignment)。

## 背景

  - 传统的对齐 (SFT + RLHF) 主要让模型「听话、礼貌」，奖励来自人类偏好模型
  - 数学、代码等任务有客观的对错，可以用规则自动判断答案是否正确 (可验证奖励)，不需要训练奖励模型
  - DeepSeek-R1-Zero
    表明：只用可验证奖励对基础模型做大规模强化学习，模型会自发产生更长的思考过程、反思和自我纠错，推理能力显著提升

## 训练流程

下图是 DeepSeek-R1 的多阶段流程 (简化)：

``` mermaid
flowchart LR
    B[基础模型] --> C[冷启动 SFT<br>少量长思维链数据]
    C --> R1[推理强化学习<br>GRPO + 可验证奖励]
    R1 --> S[拒绝采样生成数据<br>+ 通用 SFT 数据]
    S --> F[再次 SFT]
    F --> R2[全场景强化学习<br>推理 + 偏好对齐]
    R2 --> M[推理模型]
    M --> D[蒸馏到小模型<br>SFT]
```

图中：

  - 冷启动 SFT 用少量人工整理的长思维链数据，让输出格式规范、可读，避免 R1-Zero 中出现的语言混杂问题
  - 推理强化学习是核心，用 GRPO 和规则奖励 (答案正确性、格式) 训练
  - 之后用模型自己生成、经过筛选的数据再做一轮 SFT，再做覆盖通用场景的强化学习，兼顾推理和日常对话
  - 最后把大模型的推理轨迹作为 SFT 数据蒸馏给小模型，见 [蒸馏](/0697_MO_KD_LLM_BlackBox)

## GRPO

GRPO (Group Relative Policy Optimization) 去掉了 PPO 中的价值网络
(critic)，用同一问题的一组回答的相对得分作为优势：

$$ \\hat
A\_i=\\frac{r\_i-\\mathrm{mean}(r\_1,\\dots,r\_G)}{\\mathrm{std}(r\_1,\\dots,r\_G)}
$$

$$ \\mathcal J(\\theta)=\\mathbb
E\\Bigl\[\\frac1G\\sum\_{i=1}^{G}\\min\\Bigl(\\rho\_i\\hat A\_i,\\
\\mathrm{clip}(\\rho\_i,1-\\varepsilon,1+\\varepsilon)\\hat
A\_i\\Bigr)\\Bigr\]-\\beta,\\mathbb
D\_{KL}\\bigl(\\pi\_\\theta,|,\\pi\_{ref}\\bigr),\\qquad
\\rho\_i=\\frac{\\pi\_\\theta(o\_i\\mid
q)}{\\pi\_{\\theta\_{old}}(o\_i\\mid q)} $$

其中：

  - $q$：一个问题；$o\_1,\\dots,o\_G$：对同一问题采样的 $G$ 个回答 (如 $G=16$)；$r\_i$：第 $i$
    个回答的奖励
  - $\\hat A\_i$：优势，即该回答比同组平均好多少 (标准化后)；比平均好的回答被强化，差的被抑制，不需要单独训练价值网络
  - $\\rho\_i$：新旧策略对该回答的概率比 (实际按 token 计算)；$\\mathrm{clip}$ 与 PPO
    相同，限制每次更新的幅度，$\\varepsilon$ 常取 $0.2$
  - $\\beta,\\mathbb D\_{KL}$：防止策略偏离参考模型 $\\pi\_{ref}$ 太远；$\\beta$ 为系数
  - 好处：省掉与策略模型同样大的价值网络，显存和计算大幅减少；代价是每个问题要采样多个回答

## 可验证奖励

| 任务     | 奖励的判断方式                                      |
| ------ | -------------------------------------------- |
| 数学     | 抽取最终答案 (如 `\boxed{}` 中的内容)，与标准答案比对 (数值或符号等价) |
| 代码     | 在沙箱中运行测试用例，全部通过为 $1$                         |
| 格式     | 思考过程放在指定的标签内 (如 `<think>...</think>`)        |
| 逻辑题、谜题 | 用程序验证解是否满足约束                                 |

表中：规则奖励的好处是不会被「刷分」(奖励模型的 reward hacking
问题)，但只适用于答案可以自动判定的任务；开放式写作等仍需要偏好模型，见
[对齐](/0568_LM_FT_Alignment)。

## 推理时计算

推理能力也可以通过在推理阶段多花计算来提升：

| 方法                      | 做法              | 代价                          |
| ----------------------- | --------------- | --------------------------- |
| 长思维链                    | 模型先输出很长的思考再给答案  | 输出 token 数成倍增加，TPOT 和成本随之增加 |
| 自一致性 (self-consistency) | 采样 $n$ 个答案取多数票  | $n$ 倍计算                     |
| best-of-$n$ + 验证器       | 用奖励模型或程序挑选最好的答案 | $n$ 倍计算 + 验证开销              |
| 树搜索                     | 对中间步骤展开搜索       | 计算量最大                       |

表中：这些方法让「推理时的计算量」成为与模型大小并列的扩展维度；部署推理模型时要按更长的输出估算资源，输出长度从几百 token
增加到数千甚至上万 token，见
[Sizing](/0844_LM_Deploy_Sizing)。投机解码对这类长输出的场景收益明显，见
[Speculative](/0837_LM_Infer_Speculative)。

## 实践

  - 工具：TRL 提供 `GRPOTrainer`；veRL、OpenRLHF 支持大规模分布式的 RL 训练，其中采样 (rollout)
    阶段通常用 vLLM/SGLang 加速，见 [Frameworks](/0842_LM_Deploy_Frameworks)
  - RL 训练的大部分时间花在采样上，推理效率直接决定训练速度
  - 小模型直接做 RL 的效果往往不如从大推理模型蒸馏 (DeepSeek-R1 论文的结论)，资源有限时优先考虑蒸馏

## Reference

  - [DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via
    Reinforcement Learning](https://arxiv.org/abs/2501.12948)
  - [DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open
    Language Models (GRPO)](https://arxiv.org/abs/2402.03300)
  - [Proximal Policy Optimization
    Algorithms](https://arxiv.org/abs/1707.06347)
  - [Self-Consistency Improves Chain of Thought Reasoning in Language
    Models](https://arxiv.org/abs/2203.11171)
  - [Scaling LLM Test-Time Compute Optimally can be More Effective than
    Scaling Model Parameters](https://arxiv.org/abs/2408.03314)
  - [TRL: GRPO
    Trainer](https://huggingface.co/docs/trl/main/en/grpo_trainer)
