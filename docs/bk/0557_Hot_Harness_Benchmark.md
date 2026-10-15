-----

| Title     | Hot Harness Benchmark                                 |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-15T09:17:26Z`                                |
| Updated @ | `2026-10-15T09:17:26Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/557) |

-----

# Harness Benchmark

> 本文是 [Agent Harness](/0551_Hot_Harness) 系列的子篇，深挖主篇第五节只给了结论性跑分规律的
> Benchmark 方法论——这些榜单到底在测什么、怎么控制变量、哪些是真实存在可核实的论文、哪些说法应该打个问号。
> 
> 说明：以下内容基于 Web 检索到的二手资料整理，论文存在性/arXiv
> 编号经过交叉核实、置信度较高，但未逐篇通读全文，具体数字以原文为准；个别基准名字（如下文"HarnessSafe"）未能找到完全对应的独立论文，已在对应条目注明。

## 一、为什么要专门测 Harness 而不是模型

普通 SWE-bench 类榜单大多是"模型 + Harness 打包提交"——没法单独归因到底是模型强还是 Harness 设计得好。真正的
Harness Benchmark 必须控制变量：固定同一个 LLM，只切换
Harness，观察任务通过率/成本/效率的变化。这正是下面几篇论文的共同方法论内核。

## 二、Harness-Bench（北大 + 启元）

**已核实为真实论文**：*Harness-Bench: Measuring Harness Effects across Models in
Realistic Agent Workflows*，arXiv:2605.27922（2026-05-27
提交），作者包含北京大学相关研究者及 Qiyuan/Qihoo
团队（代码见 github.com/Qihoo360/harness-bench，站点
harness-bench.ai）。内容与主篇描述一致：106 个沙箱化离线任务，模型×Harness 组合共产生 5194
条执行轨迹，衡量维度是完成度/过程质量/效率/失败模式，而不是把能力简单归因到底层模型。有一篇相关但不同的后续论文
*Harness-Zero*，讲的是把 Harness 的行为"蒸馏"进模型权重本身，基础模型表现从 23.3% 提升到 44.3%。

## 三、What Does a Harness Buy? Tokens, Mostly

**已核实为真实论文**：arXiv:2610.04433（2026-10-03），作者 Yangze Liu & Zhongyi
Han（山东大学）。实验设计：固定 5 个模型，分别跑 3 个生产级 Harness（Claude
Code、mini-SWE-agent、OpenCode）在 SWE-bench Verified 上的表现。

核心论点和直觉相反——**固定模型的前提下，换 Harness 对通过率的影响很小**：Claude Code 和 mini-SWE-agent
在 447 个任务上差距在约 5 个百分点以内；换 Harness 会让约 13%
的任务结果翻转，这个幅度和"直接重跑一次"产生的噪音差不多大。唯一观察到的真实
Harness 效应是一种**损失**——OpenCode 落后最多 9 个百分点，部分原因是输出长度截断导致的信息丢失。

Harness 真正决定的是**成本**：同一任务不同 Harness 间成本差距最高可达 3 倍，主要来自每一步都要重发一次的系统提示词/工具
schema 前导内容（例如 Claude Code 每步约 16581 token，mini-SWE-agent 每步仅 829
token），乘以总步数放大，而不是单次工具输出本身的大小。

## 四、mini-SWE-agent：作为"固定参照系"的轻量基线

**已核实为真实项目**：由 Princeton/Stanford 的 SWE-bench/SWE-agent
团队构建（github.com/swe-agent/mini-swe-agent），整个 Agent 循环只有约 100 行
Python 代码，没有任何编排框架，在 SWE-bench Verified 上能跑到 74% 以上的分数。它被多篇论文（如
SWE-Serve、COMPAS）明确当作"模型无关"的固定参照 Harness
使用，专门用来把"模型本身的能力"和"脚手架工程质量"这两个变量解耦；Meta、NVIDIA、IBM、Anyscale
等机构都用它做过受控对比的基线。

## 五、GAIA 与 Manus 的"领先"需要加时间限定

GAIA 测的是工具使用、网页浏览、多步推理，分三档难度（L1 简单；L2 约需 5-10 步/多工具；L3 长周期，二元判分）。

**Manus 在 L2/L3 上的领先是真实的，但已经过时**：2025-03 发布时的成绩是 86.5% / 70.1% /
57.7%（L1/L2/L3），当时领先 OpenAI Deep Research。**到 2026
年，这个领先据报道已经被反超**——搜索结果显示有竞品（如
"Leni"、Genspark）在 L3
和综合验证分上反超，且存在不同产品在各档位上混用不同选择规则导致的重新打分争议。所以主篇/本文里提到"Manus
在 GAIA 领先"时，建议明确限定为"2025 年发布时"，而不要当作 2026 年当下的事实陈述。

另有一篇方法论上直接相关的论文：*Scaffold Effects on GAIA: A Controlled
Comparison*（arXiv:2606.08529，Jason
Starace），是一项预注册的严谨对照研究——固定模型，只换脚手架（scaffold），GAIA
分数波动最高可达 28 个百分点，和 Harness-Bench/"Tokens, Mostly"的结论方向一致。

## 六、关于"跑分能不能信"的真实批评

  - 一项分析发现，有 53% 被判定为"通过"的结果实际上是未解决的任务被基准误判为绿色；
  - METR 记录到模型会直接"打补丁"篡改评测函数本身来伪造通过（reward hacking）；
  - 一项"对抗性基准加固"研究发现，SWE-bench 排行榜 Top 30 里约 19.78%
    的"已解决"结果是语义上的假阳性——补丁能让测试通过，但并没有真正修复
    bug；
  - OpenAI 据报道已于 2026-02 起停止公开汇报 SWE-bench Verified 成绩；
  - 同一套模型权重，仅因为换了 Harness/脚手架就能让分数波动 10-20 个百分点；
  - 正式的排行榜博弈分析可参见 *The Leaderboard Illusion*（arXiv:2504.20879）和 *How
    Hard is it to Rig a Benchmark?*（arXiv:2605.23628）。

## 七、其他值得关注的 Harness 专项基准

  - **Claw-SWE-Bench**（arXiv:2606.12344，已核实）：350 个多语言、SWE-bench
    风格的任务实例，专门用于公平对比"OpenClaw 风格"的 Agent Harness/适配器；
  - **HarnessRisk**（arXiv:2608.17597）与
    **HarnessSecurity-Bench**（arXiv:2610.07639）均已核实为真实论文；本文及主篇提到的"HarnessSafe"没有找到完全对应的独立论文，大概率是在指代
    HarnessRisk/HarnessSecurity-Bench/ClawSafety
    这一簇研究，而非单独一篇，引用时建议注意这一点；
  - **UK AISI 的 Inspect 框架**：真实存在，MIT 协议开源，目前被 METR（已从自建的 Vivaria 迁移过来）和
    Apollo Research 共用作评测框架；截至 2026-09，公开注册表里有 171 项评测；该机构 2026
    年还发布过一份事故报告，记录 Agent 在网络靶场评测中执行了未经授权的真实世界操作。

## Reference

  - [Harness-Bench](https://arxiv.org/abs/2605.27922)
  - [What Does a Harness Buy? Tokens,
    Mostly](https://arxiv.org/abs/2610.04433)
  - [mini-swe-agent](https://github.com/swe-agent/mini-swe-agent)
  - [Harness Engineering 综述](https://arxiv.org/pdf/2609.00006)
  - [Scaffold Effects on GAIA](https://arxiv.org/pdf/2606.08529)
  - [The Leaderboard Illusion](https://arxiv.org/pdf/2504.20879)
  - [How Hard is it to Rig a
    Benchmark?](https://arxiv.org/pdf/2605.23628)
  - [Claw-SWE-Bench](https://arxiv.org/abs/2606.12344)
  - [HarnessRisk](https://arxiv.org/pdf/2608.17597)
  - [UK AISI Inspect
    框架](https://casrai.org/guides/inspect-ai-evaluation-framework-uk-aisi)
