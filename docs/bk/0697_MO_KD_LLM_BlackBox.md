-----

| Title     | MO KD LLM BlackBox                                    |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-23T01:57:04Z`                                |
| Updated @ | `2026-11-23T01:57:04Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/697) |

-----

# LLM BlackBox

"黑盒"蒸馏指**只能拿到 Teacher 生成的文本**，拿不到 logits 或中间层。这正是调用闭源大模型
API（GPT-4、Claude
等）时的现实：没有概率分布，只有输出的文本。此时蒸馏就退化成"让强模型产生训练数据，再对弱模型做监督微调（SFT）"，也常被称为**数据蒸馏**或**合成数据蒸馏**。本文覆盖这条路线的几个代表：Self-Instruct（*Self-Instruct:
Aligning Language Models with Self-Generated Instructions*，ACL
2023，arXiv:2212.10560）及其衍生的 Alpaca 路线；Distilling
Step-by-Step（*Distilling Step-by-Step\! Outperforming Larger Language
Models with Less Training Data and Smaller Model
Sizes*，arXiv:2305.02301）；以及把大推理模型的长链式思考（CoT）蒸馏到小模型的 DeepSeek-R1
蒸馏（*DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via
Reinforcement Learning*，arXiv:2501.12948）。

**一句话概括：黑盒蒸馏的损失就是普通的 SFT 损失 $-\\sum\_t\\log
p\_\\theta(y\_t|x,y\_{\<t})$，区别全在数据：用强模型生成指令、答案、推理过程（rationale / 长
CoT），经过过滤后作为小模型的监督信号。**

> 标注约定：未标注的内容来自上述论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：总览 [知识蒸馏](0207_MO_KD)；发展历史 [KD History](0336_MO_KD_History)；白盒蒸馏
[LLM 白盒蒸馏](/0696_MO_KD_LLM_WhiteBox)；Alpaca 等指令微调背景 [LM FT
Alignment](0568_LM_FT_Alignment)；DeepSeek 相关 [Hot
DeepSeek](0496_Hot_DeepSeek)；理论与实践 [蒸馏理论与实践](/XXXX_MO_KD_Theory)。

## 1\. 解决什么问题

  - 最强的模型常常是闭源 API，**拿不到 logits**，白盒蒸馏用不上；
  - 人工标注指令数据成本高、数量和多样性有限；
  - 小模型要学的不只是"答案"，还有"为什么这样答"，尤其在推理任务上；
  - 目标：以低成本把大模型的能力（指令遵循、推理）转移给小模型。

## 2\. 符号约定

  - $x$：输入（指令/问题）；$y$：目标回复；$r$：推理过程（rationale）或长链式思考；
  - $p\_\\theta(\\cdot|x)$：待训练的小模型（Student）；$\\mathcal D$：由强模型生成的训练数据集；
  - $\\mathcal L\_{SFT}$：标准的监督微调（逐 token 交叉熵）损失。

黑盒蒸馏的基本损失就是对教师生成数据的 SFT：

$$ \\mathcal L\_{SFT}(\\theta)=-,\\mathbb E\_{(x,y)\\sim\\mathcal
D}\\sum\_{t=1}^{|y|}\\log p\_\\theta(y\_t,|,x,,y\_{\<t}) $$

其中：$(x,y)$ 是教师生成数据集中的一条样本，$y\_{\<t}$ 是已生成的前缀，求和对回复的每个 token 进行；它与前文
Seq-KD 的第三步完全相同：在教师生成的序列上训练学生。

## 3\. Self-Instruct 与 Alpaca：指令数据蒸馏

Self-Instruct 的目标是提高预训练语言模型的指令遵循能力，同时**只用极少的人工标注**：用模型自己的生成来自举出指令数据。

### 3.1 流程

    175 个人工种子任务（每个 1 条指令 + 1 个实例）
       │  ① 指令生成：从任务池抽样几条作示例，让 LM 生成新指令
       ▼
       ② 分类任务识别：判断新指令是否为分类任务（决定后续生成方式）
       ▼
       ③ 实例生成：为每条指令生成输入与输出
       ▼
       ④ 过滤与后处理：与已有指令的 ROUGE-L 相似度 < 0.7 才加入任务池；去掉含"图片/图表"等 LM 无法处理的关键词的指令；去掉重复或无效实例
       ▼
    新指令加入任务池 → 回到 ①（迭代）
       ▼
    用生成的数据微调原模型

图中：

  - 种子任务是唯一的人工数据，其余都由语言模型生成；
  - 分类任务与非分类任务采用不同的实例生成方式（论文用少样本提示判断）；
  - 过滤用 ROUGE-L 相似度保证新指令与已有指令有足够差异，鼓励多样性；
  - 这是一个迭代自举的过程，任务池不断变大。

论文在 GPT-3（原始预训练模型）上跑这一流程，生成约 5.2 万条指令（过滤后共 52,445 条）、约 8.2 万个实例（82,439
个），用它们微调原模型（对照其基础版 text-davinci-001
的设置）。论文分析了生成指令的"动词-名词"结构与多样性，以及与种子任务的
ROUGE-L 重叠分布，说明生成的任务与种子任务重叠较少。

### 3.2 与蒸馏的关系：Alpaca

Self-Instruct 严格说是"模型自己教自己"的自举。之后斯坦福的 Alpaca（Taori 等，2023）把它用到蒸馏上：用
Self-Instruct 方法调用更强的 `text-davinci-003` 生成了 5.2 万条指令-回答数据，微调
LLaMA-7B，效果能接近生成数据的 `text-davinci-003`（见 [LM FT
Alignment](0568_LM_FT_Alignment)），证明了"用强模型生成数据去蒸馏训练弱模型"的可行性，成本比全靠人工标注低得多。

这类数据蒸馏的"教师"并不一定是白盒；只需要它的输出文本，所以是典型的黑盒蒸馏 `[解读]`。

## 4\. Distilling Step-by-Step：把推理过程当监督

传统的任务蒸馏把 LLM 当作"噪声标签的来源"，只用它预测的标签 $\\hat y$ 训练小模型，需要大量未标注数据。Distilling
step-by-step 把视角改为：LLM 是**能推理的智能体**，可以写出支持标签的自然语言解释（rationale）。

### 4.1 两步流程

1.  **抽取 rationale**：对未标注数据集中的每个 $x\_i$，用少样本思维链（CoT）提示让 LLM 同时生成标签和
    rationale。提示由若干三元组 $(x\_p,r\_p,y\_p)$（示例输入、人工写的
    rationale、标签）组成，再附上新输入 $x\_i$；
2.  **多任务训练小模型**：不把 rationale 当额外输入（那样部署时仍需要 LLM 先生成
    rationale），而是让小模型**同时预测标签并生成 rationale**。

### 4.2 损失

标准微调/蒸馏的标签损失：

$$ \\mathcal L\_{label}=\\frac1N\\sum\_{i=1}^{N}\\ell\\big(f(x\_i),\\hat
y\_i\\big) $$

其中：$f$ 是小模型，$\\ell$ 是预测 token 与目标 token 之间的交叉熵；$\\hat y\_i$ 在标准微调中是人工标签
$y\_i$，在蒸馏中是 LLM 预测的标签（论文对符号做了重载）。加入 rationale 生成损失：

$$ \\mathcal L=\\mathcal L\_{label}+\\lambda,\\mathcal
L\_{rationale},\\qquad \\mathcal
L\_{rationale}=\\frac1N\\sum\_{i=1}^{N}\\ell\\big(f(x\_i),\\hat
r\_i\\big) $$

其中：

  - $\\hat r\_i$：LLM 为样本 $i$ 生成的 rationale；$\\mathcal L\_{rationale}$
    让小模型学会生成中间推理步骤，从而有助于预测标签；
  - $\\lambda$：平衡系数（论文的多任务形式中两项权重相等的写法以原文为准 `[待核实]`）；
  - 实现上给输入加**任务前缀**：`[label]` 时输出 $\\hat y\_i$，`[rationale]` 时输出 $\\hat
    r\_i$（沿用 T5 的做法）；
  - **推理时不需要 rationale**，因此部署时不需要 LLM，也不必先生成推理过程。

### 4.3 实验结论

  - 设置：LLM 为 540B 的 PaLM，小模型为 T5；在
    e-SNLI、ANLI（自然语言推理）、CQA（常识问答）、SVAMP（算术应用题）4
    个基准上评测；
  - 与标准微调、标准任务蒸馏相比，在 4 个基准上平均用少于 50% 的训练样本即可达到更好的效果（最多可减少 85% 以上）；
  - 用比 LLM 小 500 倍以上的模型就能超过 LLM；论文称一个 11B 的 T5 超过了 540B 的 PaLM；
  - 只有未标注数据时，小模型也能与 LLM 持平或更好；
  - 当小模型不及 LLM 时，step-by-step 能比标准蒸馏更有效地利用额外的未标注数据。

## 5\. 推理蒸馏：DeepSeek-R1 蒸馏

DeepSeek-R1 论文在主体（R1-Zero、R1 的强化学习）之外，还把 R1
的推理能力**蒸馏到开源的稠密小模型**，这是目前关注度最高的一次推理蒸馏实践。

### 5.1 做法

  - **数据**：用 DeepSeek-R1 生成约 **80 万条**监督样本，分两类：
      - **推理数据**：精心整理的推理类提示，对第一阶段 RL 检查点做**拒绝采样**得到推理轨迹；其中一部分用生成式奖励模型（让
        DeepSeek-V3 对真值和预测做判断）来评判；
      - **非推理数据**：写作、事实问答、自我认知、翻译等，沿用 DeepSeek-V3 的流水线和部分 SFT
        数据，也包含软件工程类数据；对某些非推理任务，会调用 DeepSeek-V3
        先生成一段可能的思维链再回答；
  - **训练**：只做 SFT，**不含 RL 阶段**；对相应基础模型微调 2–3 个 epoch，使用余弦衰减的学习率；论文说明不加
    RL 是为了展示蒸馏本身的效果，RL 阶段留给社区探索；
  - **学生**：Qwen2.5 与 Llama 系列的稠密模型，共 6 个：DeepSeek-R1-Distill-Qwen-1.5B /
    7B / 14B / 32B、DeepSeek-R1-Distill-Llama-8B / 70B（对应基础模型见论文 Table
    6，如
    Qwen2.5-Math-1.5B、Qwen2.5-Math-7B、Qwen2.5-14B、Qwen2.5-32B、Llama-3.1-8B、Llama-3.3-70B-Instruct）。

训练目标就是上面的 SFT 损失，其中 $y$ 是 R1 生成的**含长 CoT 的回复**（$y=(r,\\text{answer})$）。

### 5.2 蒸馏 vs 直接强化学习

论文在 Qwen2.5-32B 上做了对照：对该基础模型做超过 1 万步的大规模 RL（得到 Qwen2.5-32B-Zero）与用 R1
蒸馏得到的 DeepSeek-R1-Distill-Qwen-32B 比较：

| 模型                               | AIME 2024 pass@1 | AIME 2024 cons@64 | MATH pass@1 | GPQA Diamond pass@1 | LiveCodeBench pass@1 |
| -------------------------------- | ---------------- | ----------------- | ----------- | ------------------- | -------------------- |
| QwQ-32B-Preview                  | 50.0             | 60.0              | 90.6        | 54.5                | 41.9                 |
| Qwen2.5-32B-Zero（RL）             | 47.0             | 60.0              | 91.6        | 55.0                | 40.2                 |
| DeepSeek-R1-Distill-Qwen-32B（蒸馏） | 72.6             | 83.3              | 94.3        | 62.1                | 57.2                 |

表中：

  - 第一列是模型，后五列是论文 Table 16 的基准结果（AIME 2024 同时报告 pass@1 与 64 次投票
    cons@64，其余为 pass@1）；
  - 大规模 RL 的 32B 模型与 QwQ-32B-Preview 相当，而蒸馏模型在所有基准上都显著更好；
  - 论文的两条结论：①把更强模型蒸馏进小模型效果很好，而小模型靠本文规模的大规模 RL
    要付出巨大算力，甚至可能达不到蒸馏的效果；②蒸馏经济有效，但要突破人类智能的边界，仍可能需要更强的基础模型与更大规模的
    RL。

此外论文还指出：从高质量教师输出蒸馏得到的模型，持续优于直接用人类生成数据训练的模型；仅 1.5B
参数的蒸馏模型在数学基准上就超过了不具备推理的强基线（如
GPT-4o、Claude-3.5-Sonnet），且性能随学生参数量增大而逐步提高。

## 6\. 白盒与黑盒对比

| 维度            | 白盒蒸馏                 | 黑盒蒸馏                                 |
| ------------- | -------------------- | ------------------------------------ |
| Teacher 提供的信号 | logits / 概率分布，甚至中间层  | 只有生成的文本                              |
| 损失            | KL、JSD 等散度           | SFT 交叉熵（可加 rationale 等多任务项）          |
| 信息量           | 每个 token 有完整分布，信息更密  | 每个 token 只有一个采样结果，信息更稀疏              |
| 典型场景          | 开源 Teacher、自家模型之间的压缩 | 调用闭源 API、获取推理轨迹                      |
| 成本与风险         | 需要访问并多次前向 Teacher    | 需要生成大量数据；还要注意所用 API 的使用条款与许可证 `[经验]` |

表中：

  - 第一列是比较维度，第二、三列分别是白盒与黑盒蒸馏在该维度的情况；
  - 黑盒蒸馏用 SFT 即可，实现简单，但因信号稀疏，通常依靠"更多、更好的数据"（过滤、拒绝采样、人工校验）来弥补；
  - 两者并不矛盾：推理蒸馏之后还可以接 RL（论文指出这可能进一步提升）。

## 7\. 总结 \[解读\]

  - 黑盒蒸馏的核心杠杆在**数据**：指令的多样性、答案的质量、推理过程的完整性，以及过滤与拒绝采样；
  - 把"推理过程"一起蒸馏是这条路线的关键升级：从 Distilling step-by-step 的 rationale 到 R1 的长
    CoT，小模型学到的不只是答案；
  - 局限：蒸馏的上限受限于 Teacher；DeepSeek 论文也指出，要超越 Teacher 的能力边界，仍需要更强的基础模型和
    RL；使用闭源模型生成数据时要关注许可条款。

## Reference

  - Wang Y, Kordi Y, Mishra S, Liu A, Smith N A, Khashabi D, Hajishirzi
    H. Self-Instruct: Aligning Language Models with Self-Generated
    Instructions. ACL 2023. arXiv:2212.10560
  - Taori R 等. Stanford Alpaca: An Instruction-following LLaMA Model.
    2023. `[链接未核实]`
  - Hsieh C-Y, Li C-L, Yeh C-K, Nakhost H, Fujii Y, Ratner A, Krishna R,
    Lee C-Y, Pfister T. Distilling Step-by-Step\! Outperforming Larger
    Language Models with Less Training Data and Smaller Model Sizes.
    Findings of ACL 2023. arXiv:2305.02301
  - DeepSeek-AI. DeepSeek-R1: Incentivizing Reasoning Capability in LLMs
    via Reinforcement Learning. arXiv:2501.12948
