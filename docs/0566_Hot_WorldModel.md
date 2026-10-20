---
Title | Hot WorldModel
-- | --
Created @ | `2026-10-20T03:03:40Z`
Updated @| `2026-10-20T03:03:40Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/566)

---
# 世界模型（World Model）

> 本文梳理"世界模型"研究与产业现状：定义与两条技术路线、发展历史、核心架构、主要机构/项目现状、分类框架、应用领域、Yann LeCun 掀起的"LLM 是死胡同"之争，以及目前的局限与争议，截至 2026 年 10 月。

## 一、什么是世界模型，两条技术路线

世界模型（World Model）是一个能学习"环境如何随时间/动作演变"的内部表示的系统——给定当前状态和一个动作，它能预测下一个状态会是什么，从而让智能体不用在真实世界里试错，就能在"脑内"提前想象、规划、评估后果。和语言模型"预测下一个 token"不同，世界模型要预测的是物理世界的动态、因果和结构。这个概念在认知科学里能追溯到 Kenneth Craik 1943 年《The Nature of Explanation》提出的"心智模型"，但现代机器学习意义上的"世界模型"始于 2018 年。

研究路线上明显分裂成两派：

- **生成式/像素空间路线**：直接在像素空间里逐帧"画出"未来，把生成的视频本身当作模拟器——代表是 OpenAI Sora、DeepMind Genie 系列、Decart Oasis、Wayve GAIA；
- **隐空间/预测式路线**：不还原每一个像素，只在抽象的表示空间里预测"接下来会怎样"——代表是 Yann LeCun 提出的 JEPA 系列、Hafner 等人的 Dreamer 系列。

两条路线的分野有一个标志性时刻：**2024 年 2 月，Sora 和 Genie（第一代）在同一个月发布**，世界模型第一次从学术圈溢出到大众视野，也让"到底该在像素空间还是表示空间里预测"这个争论彻底公开化。

## 二、发展历史

| 时间 | 事件 |
|---|---|
| 1943 | Kenneth Craik《The Nature of Explanation》提出"心智模型"，是世界模型概念在认知科学里的源头 |
| 2018-03 | Ha & Schmidhuber《World Models》：Vision（V，编码观测）+ Memory（M，RNN 预测未来隐状态）+ Controller（C，在"脑内"想象的世界里学策略）三件套，CarRacing 基准上是第一个越过常规求解阈值的控制器 |
| 2019 | PlaNet 提出 RSSM（Recurrent State-Space Model，确定性+随机性隐状态并存），解决多步隐空间预测一致性问题，成为 Dreamer 系列的基础组件 |
| 2019-2020 | DreamerV1《Dream to Control》：完全在"想象"出的轨迹里学策略和价值函数 |
| 2020 | DreamerV2《Mastering Atari with Discrete World Models》：离散隐变量 + KL 平衡，首个在 Atari 上"玩"过人类水平的基于想象训练的智能体 |
| 2022 | IRIS：用 Transformer 做隐空间动力学建模的早期尝试 |
| 2022-06 | Yann LeCun《A Path Towards Autonomous Machine Intelligence》（立场论文）首次提出 JEPA（Joint Embedding Predictive Architecture）——核心主张是预测应该发生在抽象表示空间，而不是重建原始像素/token |
| 2023 | I-JEPA（Assran et al., Meta, CVPR 2023）：JEPA 架构首个落地的图像版本，从单个上下文块预测目标图像块的表示 |
| 2023 | GAIA-1（Wayve）：面向自动驾驶的生成式世界模型，用视频/文本/动作的 token 序列建模驾驶场景 |
| 2023 | DreamerV3《Mastering diverse control tasks through world models》：symlog 缩放、统一超参，首个不用专门调参就能跨 150+ 种任务工作的世界模型架构 |
| 2024-02 | **DeepMind Genie（第一代）与 OpenAI Sora 同月发布**——前者从无标注网络视频学会生成可交互的 2D 平台游戏环境，后者发布《Video generation models as world simulators》技术报告，正式把"视频生成模型是不是世界模型"这个问题摆上台面 |
| 2024 | V-JEPA（Bardes et al., Meta）：JEPA 架构的视频版本，预测被遮挡/未来的隐空间 patch |
| 2024-10 | Oasis（Decart + Etched）：可实时游玩的 Minecraft 风格世界模型，约 20fps，用带标注的键鼠动作数据训练，是"可玩"世界模型的标志性产品 |
| 2024-12 | Genie 2（DeepMind）：从 2D 平台游戏扩展到多样化的可交互 3D 环境，限量研究预览 |
| 2025-01/03 | NVIDIA Cosmos 世界基础模型发布（GTC 2025）：Predict / Transfer / Reason 三大模型族，定位是面向机器人/自动驾驶的开放基础设施，而非消费级产品 |
| 2025-02 | Microsoft WHAM/Muse（与 Ninja Theory 合作）发表于 *Nature*：16 亿参数自回归 Transformer，用 Xbox《Bleeding Edge》的带标注手柄数据训练，约 1 帧/秒，非实时 |
| 2025-03 | GAIA-2（Wayve）：支持多视角、可控的自动驾驶生成式世界模型，解决 GAIA-1 可控性不足的问题 |
| 2025-04 | Microsoft WHAMM：用 MaskGIT 并行解码把生成速度提到 10+ fps 实时级别，仅用一周的 *Quake II* 数据训练 |
| 2025 | DreamerV4《Training Agents Inside of Scalable World Models》：用 Transformer 替换 RSSM，转向离线设定，支持高保真视频预测和长时程复杂任务 |
| 2025 | V-JEPA 2（Meta）：在 100 万+ 小时视频上预训练，再用不到 62 小时机器人数据后训练出 V-JEPA2-AC，把"看懂物体怎么运动"扩展到"知道动作会导致什么后果" |
| 2025-08-05 | Genie 3（DeepMind）：首个支持**实时交互**的 Genie，720p/24fps，分钟级记忆一致性，纯自回归、不依赖 NeRF/高斯泼溅等显式 3D 表示，新增"Promptable World Events"（文本指令实时改变世界） |
| 2025-11-12 | World Labs（Fei-Fei Li）的 Marble 正式上线：和 Genie 路线相反，不追求"实时生成视频流"，而是用 3D 高斯泼溅生成**持久、可下载、可导出到 Vision Pro/Quest 3** 的 3D 世界 |
| 2025-11-18/19 | Yann LeCun 宣布离开 Meta（任职 12 年），批评 Meta AI 团队"完全被 LLM 洗脑"（"completely LLM-pilled"） |
| 2025-12 | LeCun 创立 AMI Labs（Advanced Machine Intelligence），Alexandre LeBrun（Nabla 联合创始人）任 CEO |
| 2026-02 | Waymo 采用 Genie 3 构建专门的自动驾驶仿真系统 "Waymo World Model" |
| 2026-03-10 | AMI Labs 公开亮相，完成 10.3 亿美元种子轮（欧洲历史最大种子轮，投前估值 35 亿美元），同期发布 LeWorldModel——端到端从原始像素训练、双损失项、不依赖人工设计启发式规则 |
| 2026-04 | World Labs 发布 Marble 1.1 / 1.1 Plus，以及面向手机端的开源 3D 高斯泼溅渲染引擎 Spark 2.0 |
| 2026-06 | NVIDIA 发布 Cosmos 3：用 Mixture-of-Transformers 把此前独立的物理推理、世界模拟、动作生成三者融合为一个模型，可处理/生成文本、图像、视频、音频、动作序列 |

这条脉络大致是：**认知科学的"心智模型"概念（1943）→ 用显式 V/M/C 三件套在隐空间里"做梦"学控制（2018）→ RSSM + Dreamer 系列把隐空间世界模型变成通用强化学习范式（2019-2023）→ LeCun 提出 JEPA，正式把"预测空间该是像素还是表示"立为理论问题（2022）→ Genie/Sora 同月发布，生成式路线出圈，世界模型从实验室走向产品（2024-02）→ 自动驾驶（GAIA）、游戏（Oasis/Muse）、机器人（V-JEPA 2）、消费级实时交互（Genie 3）、持久 3D 场景（Marble）、工业基础设施（Cosmos）五个方向同时开花（2024-2026）→ LeCun 出走 Meta 单独融资 10 亿美元押注纯世界模型路线，把这场技术路线之争推向行业关注的顶点（2025-11 至今）**。

## 三、核心架构

### JEPA：能量模型 + 隐空间预测

JEPA 的核心主张：与其让模型学会重建/生成原始输入（像素、token），不如让它学会预测**输入的抽象表示**。架构上用一个能量函数（Energy Function）衡量"上下文表示"和"预测出的目标表示"之间的兼容程度，训练时只需要自监督信号，不需要人工标注或手工设计的数据增强。LeCun 强调这**不是生成式 AI**——JEPA 从不尝试还原像素细节，这被认为是它比生成式路线更"经济"的原因：真实世界里大量像素级细节（树叶怎么摆动、噪点纹理）对完成任务毫无意义，强迫模型生成这些细节是算力浪费，还可能让模型学到错误的捷径。JEPA 家族已经从图像（I-JEPA）、视频（V-JEPA/V-JEPA 2）扩展到音频、点云、图、时间序列等多个模态。

### Dreamer 系列：RSSM + 在"想象"里训练

Dreamer 系列走的是另一条隐空间路线，但目标是强化学习而非纯粹的表示学习：用 RSSM 学一个紧凑的隐空间动力学模型，智能体完全在这个模型"想象"出的轨迹里训练策略和价值函数，只有少量真实环境交互用来持续修正世界模型本身。DreamerV3 证明了这套范式能不经专门调参就跨 150+ 种异构任务工作；DreamerV4 进一步把 RSSM 换成 Transformer，转向离线训练，能处理更长时程、更高保真度的任务。

### 生成式路径：自回归逐帧 vs 持久 3D 场景

生成式路线内部又分成两种产品形态：

- **自回归逐帧渲染**（Genie 3、Oasis、Sora）：一次生成一帧，以之前生成的内容为条件继续生成下一帧，世界"活"在不断滚动的视频流里，离开当前画面的内容未必会被准确记住；
- **持久 3D 场景生成**（World Labs Marble）：用 3D 高斯泼溅（Gaussian Splatting）一次性生成一个完整的、可以反复进入、物体位置固定不变的 3D 场景——代价是失去了 Genie 那种"实时响应任意动作"的灵活性，换来空间一致性。

## 四、主要机构与项目现状

| 机构/项目 | 技术路线 | 代表性产品/论文 | 定位 |
|---|---|---|---|
| Google DeepMind | 生成式，自回归逐帧 | Genie 1/2/3、Dreamer 系列（V3/V4） | 消费级实时交互世界 + 通用强化学习研究 |
| Meta FAIR → AMI Labs（LeCun） | 隐空间预测式（JEPA） | I-JEPA、V-JEPA/V-JEPA 2、LeWorldModel | 押注纯预测式架构，明确拒绝"生成式 AI"标签 |
| World Labs（Fei-Fei Li） | 生成式，持久 3D | Marble、Spark 2.0 | 可导出、可编辑的持久 3D 空间生成工具 |
| NVIDIA | 生成式 + 推理，工业基础设施 | Cosmos（Predict/Transfer/Reason）→ Cosmos 3 | 面向机器人/自动驾驶的开放世界基础模型平台 |
| Wayve | 生成式，自动驾驶专用 | GAIA-1 → GAIA-2 | 自动驾驶仿真与规划 |
| Decart + Etched | 生成式，可玩游戏 | Oasis | 实时可玩的生成式游戏世界 |
| Microsoft + Ninja Theory | 生成式，游戏 | WHAM/Muse（*Nature*）→ WHAMM | 游戏内容生成/游戏设计辅助工具 |
| OpenAI | 生成式，视频 | Sora / Sora 2 | 视频生成，附带"世界模拟器"叙事 |

## 五、分类框架：渲染器 / 模拟器 / 基础设施

业内逐渐收敛出一套功能性分类，而不是单纯按"生成式 vs 预测式"二分：

- **渲染器（Renderer）**：只负责产出"观测"——给人眼看的像素，如 Genie 3、Sora 2，强调视觉可信度和实时响应；
- **模拟器（Simulator）**：产出持久、可编辑的环境状态，如 World Labs Marble，强调空间一致性和可复用性，代价是不追求逐帧实时生成；
- **基础设施（Infrastructure）**：不直接面向终端场景，而是提供数据管线、分词器、预训练模型等"搭积木"的工具，如 NVIDIA Cosmos，服务对象是下游要自己训练具体机器人/自动驾驶模型的团队。

三者分别代表了同一个"世界模型"概念落地成产品时的三种不同商业选择，而不是技术优劣的高下之分。

## 六、应用领域

- **机器人/具身智能**：V-JEPA 2-AC 用不到 62 小时的机器人数据，把一个纯视觉预测模型改造成能指导动作规划的世界模型；NVIDIA Cosmos 为 1X、Agility Robotics、Figure AI 等人形机器人公司提供合成数据与仿真基础设施；
- **自动驾驶**：Wayve GAIA 系列、Waymo 基于 Genie 3 构建的专用仿真系统，核心价值是生成真实世界里很难采集到的长尾危险场景，用于训练和回归测试；
- **游戏与交互式内容生成**：Oasis、Microsoft WHAM/WHAMM 探索"游戏本身由模型实时生成"而不是"预先编程"的新内容形态，目前仍主要停留在原型/研究阶段；
- **纯视频生成的"涌现"世界理解**：Sora/Sora 2 这类文生视频模型，虽然目标是生成内容而非做规划，但被观察到具备一定程度的隐式物理常识（如前面提到的"画家笔触保持连续性"的例子），这也是"Sora 算不算世界模型"这场争论的由来。

## 七、Yann LeCun 与"LLM 是死胡同"之争

LeCun 离开 Meta 并创立 AMI Labs，核心主张是：当前以 LLM、下一词预测为核心的路线，走不到他定义的"Level 4/5 AI"（具备人类乃至超人类水平的推理能力、可靠的真实世界行动能力、真正的理解），**但这不代表 LLM 对所有任务都没用**——只是认为它不是通往更高级别智能的正确路径。他的替代方案以 JEPA 为核心，强调"预测抽象表示而不是生成像素/token"，并明确表示这不属于生成式 AI 的范畴。

这个判断目前仍有明显争议：以 o3、Claude Opus 为代表的推理模型展示出链式思维（Chain of Thought）确实能产生有实际价值的规划和因果推理能力，被不少研究者认为是对"LLM 是死胡同"这一论断的有力反驳——这场争论目前没有定论，更像是行业资源配置层面的路线分歧，而不是已经被证伪或证实的科学结论。

## 八、局限与争议

- **长时程误差累积**：自回归世界模型把自己上一步的预测当作下一步的输入，微小误差会在长 rollout 里指数级放大——某评测发现所有被测系统在"过渡平滑度"和"生成一致性"两项指标上都没有超过 65%，说明这是目前几乎所有自回归世界模型的共性短板；
- **物理 grounding 瓶颈**：大多数评测只能在简化的虚拟物理引擎里进行，世界模型完全可能学会利用"非因果的捷径"在虚拟评测里刷分，但这些捷径在真实物理世界里并不成立，而切换到真实物理平台做验证又要在"真实性"和"实验可控性"之间做痛苦的取舍；
- **评测体系碎片化**：不同基准覆盖的交互模式、物理现象、动作空间都不一样，WorldRoamBench 等新基准发现一个有意思的张力——"轨迹得分高不代表逐帧正确""视觉质量高不代表动作跟随好""严格遵守物理规律的模型反而可能在动作跟随上表现更差"，说明"生成质量""动作可控性""物理合理性"这三者目前还没能被同时优化好；
- **评测者本身的局限**：不少基准用视觉语言模型（VLM）来给生成结果的物理合理性打分，但这些 VLM 自己对物理关系的理解就很有限（某模型在物理类问题上只有 64.6% 准确率，同一模型在物体识别类问题上能到 88.4%），意味着"用 AI 评测 AI 懂不懂物理"这件事本身的可靠性也要打个问号；
- **"生成式视频是不是世界模型"仍无共识**：Sora 这类模型在大多数情况下能生成物理上说得过去的画面，但在刚体物理、多步因果链条、分布外场景上仍会明显失真，这场关于"视觉上像"和"真正理解物理"之间差距的争论至今没有定论；
- **当前共识**：业内普遍认同"世界模型"是通往更通用、更可靠智能体的重要方向之一，DreamerV3/V4、Genie 3、NVIDIA Cosmos、V-JEPA 2 等都是真实可用的阶段性成果，但没有一个系统能被称为"完整、通用的物理世界模型"——这仍然是一个高度活跃、路线未定、资本和研究资源同时在加速涌入的前沿领域（仅 2026 上半年，世界模型相关初创公司就获得了超过 30 亿美元投资）。

## Reference
- Ha, D. & Schmidhuber, J. (2018). World Models. [arXiv:1803.10122](https://arxiv.org/abs/1803.10122)
- LeCun, Y. (2022). A Path Towards Autonomous Machine Intelligence. [OpenReview](https://openreview.net/pdf?id=BZ5a1r-kVsf)
- Hafner, D. et al. (2023). Mastering Diverse Control Tasks Through World Models (DreamerV3). [arXiv](https://arxiv.org/abs/2301.04104)
- OpenAI (2024). Video generation models as world simulators (Sora). [OpenAI 技术报告](https://openai.com/research/video-generation-models-as-world-simulators)
- Genie 3: A new frontier for world models - Google DeepMind 官方博客. [链接](https://deepmind.google/blog/genie-3-a-new-frontier-for-world-models/)
- GAIA-2: A Controllable Multi-View Generative World Model for Autonomous Driving. [arXiv:2503.20523](https://arxiv.org/pdf/2503.20523)
- Wang, X. et al. Is Sora a World Simulator? A Comprehensive Survey on General World Models and Beyond. [arXiv:2405.03520](https://arxiv.org/abs/2405.03520)
- A Definition and Roadmap for World Models. [arXiv:2607.06401](https://arxiv.org/pdf/2607.06401)
- WorldRoamBench: An Open-World Benchmark for Long-Horizon Stability of Interactive World Models. [arXiv:2606.31672](https://arxiv.org/pdf/2606.31672)
- World Models: A Comprehensive Survey of Architectures, Methodologies, Reasoning Paradigms, and Applications. [arXiv:2606.00133](https://arxiv.org/pdf/2606.00133)
- NVIDIA Announces Major Release of Cosmos World Foundation Models. [NVIDIA 官方新闻](https://nvidianews.nvidia.com/news/nvidia-announces-major-release-of-cosmos-world-foundation-models-and-physical-ai-data-tools)
- Yann LeCun Launches AMI Labs to Build AI World Models. [builtin.com](https://builtin.com/articles/ami-labs-yann-lecun)
- World model (artificial intelligence) - Wikipedia. [链接](https://en.wikipedia.org/wiki/World_model_(artificial_intelligence))
- Genie (AI model) - Wikipedia. [链接](https://en.wikipedia.org/wiki/Genie_(AI_model))

