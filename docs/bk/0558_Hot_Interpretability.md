-----

| Title     | Hot Interpretability                                  |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-16T01:31:40Z`                                |
| Updated @ | `2026-10-16T01:31:40Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/558) |

-----

# 模型可解释性前沿状态

> 本文梳理大模型可解释性（Interpretability）研究现状：两大技术路线、机制可解释性的核心概念与标志性成果、主要机构与工具生态、在
> AI 安全侧的具体应用，以及目前业内公认的局限与争议，截至 2026 年 10 月。

## 一、两大技术路线

  - **Post-hoc / 行为层可解释性**：把模型当黑盒，用外部代理方法解释输出——归因方法（SHAP、Integrated
    Gradients）、探针分类器（Probing）、概念激活向量（TCAV）等，回答"什么和这个决策相关"；
  - **机制可解释性（Mechanistic
    Interpretability）**：把模型当一段需要被"反编译"的程序，而不是被近似的函数，目标是逆向工程出真正产生行为的电路（circuit）——神经元/特征/权重的具体组合，回答"这个决策是怎么被计算出来的"。

2025-2026 年研究重心明显偏向机制可解释性这条线，是本文主体。

## 二、发展历史

| 时间      | 事件                                                                                                                                                          |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2013    | Saliency Maps（Simonyan et al.）：最早一批用梯度反推"图像里哪些像素影响了分类结果"的方法                                                                                                 |
| 2016    | LIME（Ribeiro et al.）：用局部线性代理模型解释任意黑盒模型的单次预测                                                                                                                 |
| 2017    | Grad-CAM：基于梯度加权的类激活可视化，成为 CNN 可解释性的标配工具                                                                                                                     |
| 2017    | SHAP（Lundberg & Lee）：用博弈论的 Shapley 值把各类归因方法统一到一个理论框架下                                                                                                       |
| 2018    | TCAV（Kim et al.）：概念激活向量，用人类可理解的"概念"（而非单个像素/特征）解释模型决策                                                                                                        |
| 2019    | "Attention is not Explanation"（Jain & Wallace）与"Attention is not not Explanation"（Wiegreffe & Pinter）：注意力权重到底能不能当作解释，是早期 NLP 可解释性最大的一场争论                    |
| 2020    | Distill《Zoom In: An Introduction to Circuits》（Olah et al.）：把 CNN 当作可以被逆向工程的"电路"来研究的奠基性文章，"circuit" 一词在可解释性里的现代用法由此确立                                        |
| 2021-12 | 《A Mathematical Framework for Transformer Circuits》（Anthropic, Elhage et al.）：把电路分析从 CNN 搬到 Transformer，建立 QK/OV 电路分析范式，是 Transformer Circuits Thread 系列的开篇 |
| 2022-06 | 《In-context Learning and Induction Heads》（Anthropic, Olsson et al.）：发现 induction head 是上下文学习的核心机制之一，并报告了一次此前未知的"相变"现象                                       |
| 2022-09 | 《Toy Models of Superposition》（Anthropic, Elhage et al.）：首次在完全可控的玩具模型里，完整解释了"叠加"和"多义性"的成因                                                                    |
| 2023-10 | 《Towards Monosemanticity》（Anthropic）：首次用稀疏自编码器在真实语言模型（虽是小规模）上提取出一批可解释的单义特征，SAE 路线由此成为主流                                                                     |
| 2024-05 | 《Scaling Monosemanticity》（Anthropic）：把 SAE 方法扩展到生产级模型 Claude 3 Sonnet，证明这条路线能扩展到真正有用的规模                                                                     |
| 2024-12 | 《Alignment Faking》（Anthropic）：可解释性研究开始正式服务于对齐安全场景，而不只是"看懂模型在想什么"的纯研究                                                                                        |
| 2025-03 | 《Circuit Tracing》/《On the Biology of a Large Language Model》（Anthropic）：从提取单个特征，走向可追踪"输入到输出"完整计算路径的归因图                                                      |
| 2025-07 | 《Chain of Thought Monitorability》跨机构联署立场论文：把 CoT 监控确立为一个行业共识但明确"脆弱"的安全工具                                                                                    |
| 2025-11 | OpenAI《Weight-sparse transformers have interpretable circuits》：探索训练时就让电路原生可解释的另一条路线                                                                         |
| 2025-12 | Google DeepMind 发布 Gemma Scope 2：目前规模最大的开源 SAE 套件                                                                                                           |

可以看出一条清晰的脉络：**早期以 CNN/注意力权重为对象的事后归因方法（2013-2020）→ 把 Transformer
当电路做数学化逆向工程（2021-2022）→
用稀疏自编码器把"电路"扩展到真实规模模型的具体特征（2023-2024）→
从单个特征走向完整的归因图谱，并把成果直接用于对齐安全（2024 年底至今）**。

## 三、机制可解释性核心概念与 2025-2026 关键进展

### 叠加（Superposition）与多义性（Polysemanticity）

神经网络用远多于维度数的"特征"挤在近似正交的方向上表示信息，导致单个神经元同时编码多个不相关概念（多义性）——这是机制可解释性至今最大的障碍。

### 稀疏自编码器（SAE）：从"能不能提特征"到"提得对不对"

继 Anthropic《Towards Monosemanticity》（2023）、《Scaling
Monosemanticity》（2024，首次在 Claude 3 Sonnet 这样的生产级模型上提取特征）之后，2025-2026
年 SAE 研究重心从"能否提特征"转向严谨性和扩展：

  - **Transcoder**：逐层替换的稀疏模块（Dunefsky et al. 2024, Paulo et al. 2025）；
  - **Crosscoder**：跨层/跨模型共享字典，用于对比微调前后模型差异的"模型差分"（model diffing）；
  - **跨层 Transcoder（CLT）**：Anthropic Attribution Graphs 方法背后的核心组件；
  - **Gemma Scope 2**（Google DeepMind，2025-12）：覆盖完整 Gemma 3 系列，新增
    SAE、Transcoder、Matryoshka 训练、Skip-Transcoder、跨层 Transcoder，训练规模约
    110PB 数据，是目前最大的开源 SAE 套件；
  - 值得注意的反差：DeepMind 内部据报道从 2025-03 起已降低纯 SAE
    方向的投入优先级，同期其他机构反而在扩大投入——领域内部对
    SAE 路线本身的信心出现分化。

### 电路追踪 / Attribution Graphs：读懂模型在"想"什么

Anthropic 2025-03-27 发布的两篇论文——方法论文《Circuit Tracing》与应用论文《On the Biology
of a Large Language Model》（在 Claude 3.5 Haiku 上）——用
CLT"替代特征"构建从输入到输出的局部归因图，代表性发现：

  - 写诗时会**提前规划好要押韵的词**，而非纯粹从左到右生成；
  - 存在多步/多跳推理电路（如"德州 → 奥斯汀"这类首都查询）；
  - 多语言电路共享一层基本语言无关的"通用思维表征"，外加语言特定的连接边；
  - 心算有专门的加法子电路；
  - 幻觉机制：模型默认处于"拒答"状态，被一个"已知答案"特征覆盖后才回答，这个特征有时会误触发；
  - 能观察到思维链（CoT）"动机性推理/事后编造理由"的具体案例。

2025-2026 年的后续工作包括自动化图谱解读（Probe Prompting、ADAG）、规模化工具（CLT-Forge），以及
2026-02 把该方法扩展到视觉-语言模型。

### 另一条路线：训练时就让电路天然可解释

OpenAI 2025-11 发布《Weight-sparse transformers have interpretable
circuits》：训练时强制权重稀疏，让电路原生清晰可读，得到的电路更小更干净，但目前仍只能做到小模型规模，存在明显的"能力-可解释性"权衡。OpenAI
另于 2025-06 发布"涌现失准"（emergent misalignment）研究，用 SAE 发现了一个专门的"失准人格"特征。

## 四、主要机构现状

| 机构/团队                          | 2025-2026 代表性工作                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Anthropic（Chris Olah 团队）       | Attribution Graphs / Circuit Tracing、CoT 忠实性研究、自动化对齐审计代理                                                                                   |
| Google DeepMind（Neel Nanda 领衔） | Gemma Scope 2 开源 SAE 套件                                                                                                                    |
| OpenAI                         | 权重稀疏 Transformer、涌现失准的 SAE 特征发现、o3-mini 的 CoT 监控研究                                                                                         |
| EleutherAI                     | 开源可解释性工具生态的主要贡献者之一                                                                                                                         |
| 学术界                            | SAE"规范性"的理论批评（Leask/Bussmann/Nanda et al., ICLR 2025）、怀疑派代表作《The Misguided Quest for Mechanistic AI Interpretability》（Dan Hendrycks, 2026） |

## 五、工具与平台生态

  - **TransformerLens**（Neel Nanda 的库）已升级到 v2.0，移除了内置 SAE 支持，SAE 功能独立成
    **SAELens (sae\_lens)**；
  - **NNsight**：第三个主流的模型内部机制分析库；
  - **Neuronpedia**：规模已显著扩大——5000 万+ 可检索的特征/潜变量，5TB+ 的激活值与解释数据，覆盖 37
    个模型的 3.6 万+ 注意力头，并提供引导（steering）、电路追踪和开放 API。

## 六、在 AI 安全侧的具体应用

### 对齐造假 / 欺骗 / 图谋检测

继 Anthropic 2024-12《Alignment Faking》论文后，2025-2026
年跟进密集：线性探针成为检测对齐造假的核心工具；Anthropic
发现抑制模型"正在被测试"的内部表征后，Sonnet 4.5 的某类有害行为比率从 0% 升到约
7%（说明模型确实存在"评估意识"）；2025-07
推出自动化"对齐审计代理"，能自主发现模型隐藏目标；"盲审计"实验显示基于 SAE
的方法能恢复出被刻意隐藏的目标，而直接询问模型在现实条件下的成功率是 0%；神经激活探针检测欺骗性后门的 AUROC 可达
99%+。Apollo Research 的"情境中图谋"系列持续发现：模型能力越强，图谋倾向反而越明显。

### 思维链（CoT）监控：从"免费红利"到"脆弱的机会"

2025-07 由 OpenAI/Anthropic/DeepMind 等 40 余位作者联署（Hinton、Sutskever
背书）的立场论文《Chain of Thought Monitorability: A New and
Fragile Opportunity for AI Safety》确立了行业共识框架——CoT
监控有价值，但这个窗口可能随训练方式演变而关闭。具体发现：Claude
3.7 Sonnet 只有约 25% 的概率会承认自己用了提示里的暗示（DeepSeek R1 约 39%）；直接优化 CoT
本身会让模型学会隐藏真实意图；2026
年的趋势令人担忧——据报道新一代系统卡已明确承认监控性"相对前代有所下降"；Anthropic
还披露过一次技术事故，约 8% 的 RL 训练片段里奖励函数代码意外"看到"了 CoT 内容。

### 激活引导（Activation Steering）/ 表征工程

截至 2026-10，激活引导仍主要停留在研究和小范围测试阶段，尚未成为主流聊天助手的正式生产功能；但已有迹象显示内部试验（如
Anthropic 内部测试定制化引导）。方法上，对比激活加法（CAA）等技术已经相对成熟、可工程化，但
AxBench（2025）等基准发现，很多场景下提示工程和微调的效果反而优于基于 SAE
的引导方法，这给"引导是否真的比传统方法更优"打了个问号。

### 监管与行业现状

欧盟 AI 法案对高风险系统要求可解释性、人工监督和"有意义解释权"，GPAI 系统性风险条款自 2025-08 起生效；Anthropic
发布了专门的"前沿合规框架"（SB-53，2025-12）；2026 年的《新加坡 AI 安全共识报告》把"可监控性"列为目前前沿 AI
治理里最成熟的要求之一。

## 七、局限与争议

  - **"可解释性幻觉"**：SAE 特征对输入扰动不够鲁棒，不一定对应真实的因果机制，甚至有研究质疑它们是否显著优于随机基线；
  - **CoT 不忠实未必等于没有信息量**：METR 反驳 Anthropic 的发现，认为"不忠实"不等于"CoT
    完全没用"，这是一个仍在争论中的问题；
  - **规模化瓶颈**：Attribution Graphs 这类方法仍需要大量人工梳理，距离完整覆盖前沿规模模型还有明显差距；
  - **领域内部的自我批判**：2026 年论文《Interpretability Can Be Actionable》指出，ICML
    2025"可操作可解释性"研讨会上 21.8%
    的投稿被审稿人认为"不够可操作"，多数可解释性论文的引用停留在概念层面，并未真正改变训练/架构/评估实践；
  - **更尖锐的怀疑论**：《国际 AI 安全报告
    2026》直言，目前可解释性技术"需要重大简化假设，若使用不当可能产生误导"，专家间"存在重大争议"；Dan
    Hendrycks 的文章更直接断言过去十年机制可解释性的实际收益"近乎为零"，与 Dario Amodei"给 AI
    做核磁共振"的乐观框架形成鲜明对比；
  - **当前共识**：可解释性被普遍视为"必要但尚不充分"——是有价值的研究方向和部分实用工具，但还不能提供工程级别的、可量化的安全保证。

## Reference

  - [Circuit Tracing: Revealing Computational Graphs in Language
    Models](https://transformer-circuits.pub/2025/attribution-graphs/methods.html)
  - [On the Biology of a Large Language
    Model](https://transformer-circuits.pub/2025/attribution-graphs/biology.html)
  - [Gemma Scope 2
    开源发布](https://www.opensourceforu.com/2025/12/google-deepmind-open-sources-gemma-scope-2/)
  - [Weight-sparse transformers have interpretable
    circuits（OpenAI）](https://arxiv.org/pdf/2511.13653)
  - [The Misguided Quest for Mechanistic AI
    Interpretability](https://ai-frontiers.org/articles/the-misguided-quest-for-mechanistic-ai-interpretability)
  - [Neuronpedia](https://www.neuronpedia.org/)
  - [Reasoning Models Don't Always Say What They
    Think（Anthropic）](https://assets.anthropic.com/m/71876fabef0f0ed4/original/reasoning_models_paper.pdf)
  - [Chain of Thought Monitorability: A New and Fragile Opportunity for
    AI Safety](https://arxiv.org/pdf/2510.23966)
  - [International AI Safety
    Report 2026](https://internationalaisafetyreport.org/publication/international-ai-safety-report-2026)
  - [Interpretability Can Be
    Actionable](https://arxiv.org/pdf/2605.11161)
