-----

| Title     | Hot Harness Orchestration                             |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-15T09:17:20Z`                                |
| Updated @ | `2026-10-15T09:17:20Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/554) |

-----

# Harness Orchestration

> 本文是 [Agent Harness](/0551_Hot_Harness) 系列的子篇，展开讲 Harness 五大模块中 Control
> 层的 Orchestration（编排）部分：单 Agent 内部怎么循环推理，多个 Agent 之间怎么协作。主篇只提了一句
> ReAct，Manus/OpenClaw/AgentScope 的编排差异也只在表格里各占一句，这里系统性铺开。

## 一、单 Agent 推理循环范式

| 范式                         | 机制                                                | 特点/适用场景                                                     |
| -------------------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| **ReAct**（Reason+Act，2022） | Thought → Action → Observation 紧耦合单步循环，边想边做       | 2026 年仍是交互式/工具调用场景的默认起点；弱点是"短视"，只规划一步，复杂任务容易走弯路             |
| **Plan-and-Execute**       | 强模型先把任务拆成 DAG 子任务计划，弱/快模型逐步执行，失败则由 replanner 重新规划 | 成本效率高（1 次强模型规划 + N 次廉价执行），可审计性好（执行前可检查整个计划，这是 ReAct 没有的检查点） |
| **Reflexion**              | 执行后自我批判 + 写入记忆，再重试                                | 能显著提升通过率（如把 HumanEval 从 80% 提到 91%），代价是每次重试都是完整一轮，成本高       |
| **Tree-of-Thought**        | 把推理当成搜索问题，并行探索多条路径                                | 成本和延迟都最高，只用于复杂推理/创造性/约束满足类任务                                |

**关键结论**：这些范式在 2026 年生产系统里是**组合**使用而非互斥。典型编码类 Harness 是 Plan-and-Execute
做外层规划 + 每一步用 ReAct 执行 + 收尾用 Reflection 校验，形成多层的 span tree。"大多数生产 Harness
用某种 ReAct 变体"这个说法仍基本成立，但纯 ReAct 已较少见，通常被包进外层 Plan/Reflect 循环里。

## 二、多 Agent 编排模式

  - **Orchestrator-Worker（编排者-工人）**：中心编排者把任务拆解、委派给各个专长 Worker（Worker
    之间互不通信，只向编排者汇报），编排者再综合结果。Anthropic 自家的多 Agent
    研究系统、Manus、Claude Code 的子 Agent 机制都用这个模式。
  - **Agent Handoff（移交）**：没有中心协调器，Agent 通过工具调用把控制权整体"移交"给另一个
    Agent，上下文随移交传递。源自 OpenAI Swarm（2024，实验性）→ Agents
    SDK（2025，生产级）的核心抽象，常见于客服分诊场景（先分诊，再路由给账单/技术支持 Agent）。实践建议限制移交跳数（如
    ≤5 跳）防止无限委派。
  - **Blackboard / 共享状态**：源自经典 AI 的 Hearsay-II 系统，多个 Agent
    读写同一份共享数据结构，不需要点对点直接协调（MetaGPT、bMAS
    等用此模式）。缺点是执行路径是"机会式触发"，事后很难追踪为什么某个 Agent 在某一刻动了手。
  - **Debate / Consensus（辩论/共识）**：多个 Agent 各自给出答案，互相质疑辩论，最后投票或仲裁收敛。2025
    年一项研究发现：辩论过程本身对最终结果提升有限，**多数投票才是主要的收益来源**；而且小模型（8B
    级）用投票比强制达成共识效果更好（避免趋同谄媚），大模型（30B+）反而是共识比投票更好。

## 三、Manus 的编排架构

中心"执行者/编排者"把目标拆给专长子 Agent：浏览器 Agent、代码 Agent、数据 Agent、文件
Agent，各自并行工作后汇总。底层**混用多个模型**——用 Claude 3.5 Sonnet
做主推理，阿里 Qwen 微调版做成本优化/特定子任务，外加约 29 个外部工具（含开源的 Browser
Use）。整体运行在云端虚拟机环境里，支持异步执行（用户可以断线，任务在后台继续跑），并通过"Manus's
computer"侧栏把执行步骤展示出来，提供一定的透明度。公开资料没有披露"具体按什么规则给子任务选哪个模型"的路由算法细节，只知道是按任务类型做分工。

## 四、Anthropic 的 Orchestrator-Worker 研究系统

Lead Researcher（用 Opus）先分析查询、制定检索策略，并把策略写入外部记忆（应对 200K
上下文迟早会被截断的风险），再派生出多个 Subagent（用
Sonnet），各自拥有独立上下文和工具并行检索，完成后向 Lead 汇报，由 Lead 决定是否要追加更多子 Agent；另设一个
Citation Agent 专门负责校对引用的准确性。

内部评测显示该架构比单个 Opus 自己做高出约 90.2%，但代价是约 15 倍的 token 消耗。Anthropic
也明确说明：这个模式**不适合**需要紧密共享上下文、强依赖关系的任务（比如编码、调试），只适合可以干净并行拆分的研究类任务。

该模式已经被 Claude Code 自己的 subagent/agent team 机制采用；2026 年进一步演化出"Dynamic
Workflows"——Lead Agent 用 JS
脚本（`agent()`/`parallel()`/`pipeline()`）编排数十到数百个子
Agent，把"协调逻辑"和"执行逻辑"分离，让编排规模可以扩展而不会把协调者自己的上下文撑爆。

## 五、框架层面怎么建模编排

  - **LangGraph**：用 `StateGraph` 建模——每个 Agent 是图里的一个节点，共享的 `state`
    对象充当消息总线；Supervisor 节点（一个 LLM + 结构化输出）决定 `next` 该路由到哪个
    Worker，Worker 做完后回到 Supervisor，直到返回 `FINISH`。官方
    `langgraph-supervisor` 库直接封装了这套模式；0.3+ 版本引入 Command API 取代手写条件边；另有
    `langgraph-swarm` 支持去中心化的点对点 handoff 拓扑作为补充。
  - **AgentScope**：公开资料里关于其分布式调度（消息路由 +
    分布式部署）的细节相对较少，这里先标注为待补充，后续如有更明确的一手资料再回来完善。

## 六、多 Agent 的已知失败模式

  - **MAST 分类研究**（Cemri et al.）分析了 1600+ 条执行轨迹：79%
    的失败源于任务规格/协调问题，而不是底层模型能力不足；没有验证机制的协调系统，错误会被放大约
    17 倍；即使有验证瓶颈的中心化架构，也会放大约 4.4 倍。
  - **SILO-Bench**：Agent 数量 k=2 时已经损失 15-49% 的单 Agent 性能，k=50 时性能退化达
    80-100%——说明这是协调本身的失败，而不是任务变难了。
  - **SWE-bench / Terminal-Bench** 上的实测：中心化多 Agent 架构比单 Agent 反而差
    2%\~19.2 个百分点（工具调用不多时，编排开销不划算）。
  - **成本**：多 Agent 的 token 开销常见是单 Agent 的 4-6 倍（极端案例达 +515%），协调延迟会随
    Agent 数量近似二次方增长。
  - 这些研究的结论趋同：多 Agent
    架构只在"任务可干净并行拆分、读多写少、编排路径确定"的场景里值得，像编码/调试这类强依赖关系的任务，通常单
    Agent 反而更优——这也是为什么 Anthropic 自己明确建议不要把 Orchestrator-Worker
    模式用在编码场景上。

## Reference

  - [The 4 Single-Agent
    Patterns](https://theaiengineer.substack.com/p/the-4-single-agent-patterns)
  - [OpenAI Swarm](https://github.com/openai/swarm)
  - [Anthropic：How we built our multi-agent research
    system](https://theaiengineer.substack.com/p/how-anthropic-built-multi-agent-deep)
  - [Claude Code Dynamic Workflows
    文档](https://code.claude.com/docs/en/workflows)
  - [多 Agent 辩论与投票对比研究](https://arxiv.org/pdf/2508.17536)
  - [Why Multi-Agent Systems
    Fail](https://galileo.ai/blog/why-multi-agent-systems-fail)
  - [MAST 多 Agent 失败分类研究](https://arxiv.org/pdf/2605.03310)
  - [SILO-Bench](https://arxiv.org/pdf/2603.01045)
