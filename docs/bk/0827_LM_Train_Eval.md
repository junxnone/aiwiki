-----

| Title     | LM Train Eval                                         |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T15:35:05Z`                                |
| Updated @ | `2026-11-26T15:42:12Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/827) |

-----

# Eval

大模型评测：困惑度、基准测试、pass@k、LLM-as-judge、人工评估，以及评测中常见的污染和偏差问题。微调相关的评测方法见 [FT
Evaluation](/0574_LM_FT_Evaluation)。

## 评测分层

下图把评测按「离模型多近」分成几层，说明各层回答的问题：

``` mermaid
flowchart TB
    A[内在指标<br>困惑度 PPL] --> B[能力基准<br>MMLU / GSM8K / HumanEval]
    B --> C[偏好评估<br>LLM-as-judge / Arena]
    C --> D[任务/业务评估<br>自建测试集 + 人工]
    D --> E[线上指标<br>用户反馈/A-B]
```

图中：

  - 从上到下越来越接近真实使用：困惑度只反映语言建模质量；基准测试衡量具体能力；偏好评估衡量回答是否讨人喜欢；业务评估和线上指标决定模型能否上线
  - 每一层都可能与真实效果脱节，所以需要多层结合，不能只看单一分数

## 困惑度

$$ \\mathrm{PPL}=\\exp\!\\Bigl(-\\frac1T\\sum\_{t=1}^{T}\\log
p\_\\theta(x\_t\\mid x\_{\<t})\\Bigr) $$

其中：

  - $T$：评测文本的 token 数；$p\_\\theta(x\_t\\mid x\_{\<t})$：模型对第 $t$ 个 token
    的预测概率
  - PPL 越低越好，可以理解为模型平均在多少个等可能的候选里犹豫
  - 只适合比较使用同一分词器的模型：不同分词器的 token 粒度不同，数值不可比；跨分词器比较时用每字节比特数 (bits per
    byte)
  - 压缩后的模型 (量化等) 常用 PPL 的变化衡量精度损失，见 [量化](/0312_MO_Quantization)

## 能力基准

| 基准                  | 测什么          | 形式            |
| ------------------- | ------------ | ------------- |
| MMLU                | 57 个学科的知识与理解 | 选择题，常用 5-shot |
| GSM8K、MATH          | 数学推理         | 开放生成，对比最终答案   |
| HumanEval、MBPP      | 代码生成         | 运行单元测试        |
| C-Eval、CMMLU        | 中文知识         | 选择题           |
| IFEval              | 指令遵循         | 可程序化验证的约束     |
| MT-Bench、AlpacaEval | 对话质量         | 由强模型打分        |

表中：`形式` 决定了怎么算分。选择题用准确率，代码用 pass@k，开放问答可用精确匹配或由模型判分。基准的分数受提示格式、few-shot
数量、解码参数影响很大，对比不同模型时必须用同一套评测设置。

代码生成的 pass@k：对每道题生成 $n$ 个样本，其中 $c$ 个通过测试：

$$ \\text{pass@}k=\\mathbb
E\_{\\text{题目}}\\left\[1-\\frac{\\binom{n-c}{k}}{\\binom{n}{k}}\\right\]
$$

其中：

  - $n$：每题生成的总样本数；$c$：其中通过全部测试的样本数；$k$：允许的尝试次数
  - $\\binom{n-c}{k}/\\binom{n}{k}$：随机取 $k$ 个样本全部失败的概率，用 $1$
    减去即「至少一个成功」的概率；比直接取 $k$ 个样本的结果方差更小
  - 期望对所有题目取平均；$k=1$ 就是单次成功率

## LLM-as-judge

  - 用强模型 (如 GPT-4 级) 对两个回答比较或打分，成本低、可扩展，与人类评价的一致率较高 (论文中约 $80%$ 以上
    `[待核实]`)
  - 已知偏差：位置偏差 (偏爱第一个回答)、长度偏差 (偏爱更长的回答)、自我偏好
    (偏爱同系列模型)；应对：交换位置各评一次、固定评分标准、用多个评审模型
  - 人类偏好的在线评测 (如 Chatbot Arena) 用 Elo 评分：

$$ P(A\\succ B)=\\frac{1}{1+10^{(R\_B-R\_A)/400}} $$

其中：

  - $R\_A,R\_B$：两个模型的 Elo 评分；$P(A\\succ B)$：$A$ 的回答被偏好的概率
  - 评分差 $400$ 对应胜率约 $91%$，评分差 $100$ 对应约 $64%$
  - 评分由大量人类两两比较拟合得到 (Chatbot Arena 实际用 Bradley-Terry
    模型拟合)，对「讨喜程度」的反映较好，对事实正确性的反映较弱

## 评测污染

  - 污染 (contamination)：评测集的内容 (题目或答案) 出现在训练语料里，分数虚高，不代表真实能力
  - 检测：对评测题与训练集做 $n$-gram (如 13-gram) 重叠匹配；训练前就应从语料中剔除，见
    [Data](/0821_LM_Train_Data)
  - 缓解：使用训练截止日期之后新出的题目 (如 LiveCodeBench)，自建私有测试集，评测集不公开答案

## 业务评估

  - 构造自己的测试集：从真实用户请求里抽样，覆盖典型场景和边界情况，写明期望的回答要点
  - 打分：规则 (关键词/格式/JSON 合法性)、模型打分、人工抽检相结合
  - 用作回归测试：每次更换模型、量化、升级推理框架后都跑一遍，防止悄悄变差，见 [Ops](/0846_LM_Deploy_Ops)

## 工具

  - lm-evaluation-harness：覆盖大量学术基准，支持 Hugging Face、vLLM 等后端
  - OpenCompass、lighteval、HELM：综合评测平台
  - 推理速度等工程指标见 [LLM Metrics](/0503_LM_LLMs_Metrics)

## Reference

  - [Measuring Massive Multitask Language Understanding
    (MMLU)](https://arxiv.org/abs/2009.03300)
  - [Evaluating Large Language Models Trained on Code (HumanEval,
    pass@k)](https://arxiv.org/abs/2107.03374)
  - [Judging LLM-as-a-Judge with MT-Bench and Chatbot
    Arena](https://arxiv.org/abs/2306.05685)
  - [lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness)
