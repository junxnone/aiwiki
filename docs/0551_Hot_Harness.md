---
Title | Hot Harness
-- | --
Created @ | `2026-10-15T08:14:23Z`
Updated @| `2026-10-15T09:22:59Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/551)

---
# Agent Harness

> 本文基于 Agent Harness 相关概念、架构、发展历史、主流实现、评测基准对话整理，清晰定义 Agent Harness、拆解架构、梳理演进路线、对比主流实现，并说明评测方式与选型思路，供工程与研究侧参考。
>
> 核心共识：**模型 ≠ Agent；Agent = LLM Model + Harness + Tools/执行环境**。Harness 是包裹大模型、实现 Agent 闭环运行的独立运行时脚手架，也是当下 Agent Engineering 的核心研究对象。

## 一、术语定义与起源

### 1. 定义

Agent Harness（智能体运行夹具/运行时）：在大模型之外，负责驱动 Agent 任务闭环的整套系统层，承担循环调度、上下文管理、工具路由、权限管控、状态持久、结果校验、失败恢复等能力。模型仅负责推理与决策，不具备自主执行、循环控制、持久化能力。

区分两类 Harness：

- **Eval Harness（评测 Harness）**：起源更早，用于批量跑 Benchmark、对模型打分，典型如 `lm-evaluation-harness`、OpenCompass、HELM；

- **Agent Harness（运行时 Harness，本文核心）**：驱动 Agent 完成真实任务、工具调用、长周期执行，2025 年由 Anthropic 正式将其确立为一等工程概念。

术语源头：Harness 最早来自软件工程的 Test Harness（测试夹具）；2021 年被 LLM 评测社区沿用；2022 年 ReAct 论文奠定 Agent 循环理论，但当时社区普遍称之为 `scaffold`（脚手架）；2025 年 Anthropic 博客 *Effective harnesses for long-running agents* 正式把长任务 Agent 运行层命名为 Agent Harness，术语开始出圈；2026 年“Harness Engineering”成为独立方向。

### 2. 关键边界澄清

- **LLM**：大脑，只负责 `reasons → decides`（推理、输出决策/工具调用指令），本身无状态、无法直接读写本地文件、执行 Shell；

- **Harness**：Agent 的骨架与控制系统；

- **SDK / Agent 框架（LangGraph、ADK、AutoGen）**：用来自建 Harness 的开发库，不是 Harness 本身；

- **UI 层（Claude Code VSCode 插件）**：只是交互入口，不实现 Agent 循环，不属于 Harness 本体；

- **MCP / A2A**：Harness 生态的通信标准，MCP 用于 Harness 和工具互通，A2A 用于 Agent 之间互通。

## 二、标准 Harness 架构（LangChain 经典解剖图）

整套 Harness 由五大模块构成，全部在模型外围，共同组成闭环：

1. **Context Injection 上下文注入**：组装送入模型的输入——系统提示词、会话记忆、技能定义、历史对话。Harness 统一管理上下文打包逻辑。

2. **Control 控制层（调度核心）**：

    - Compaction：上下文压缩、摘要，解决长任务上下文溢出、失忆；

    - Orchestration：任务拆分、子 Agent 调度、Agent 交接；

    - Ralph loops：主循环控制、最大轮次限制、失败重试、终止条件判断。

3. **Action 动作执行**：接收模型输出的工具调用指令，由 Harness 执行——Bash 命令、自定义工具、MCP 服务调用；执行结果回写上下文，进入下一轮思考。

4. **Persist 持久化**：负责状态落地——文件系统读写、Git、进度文件。模型是无状态的，所有任务产物、进度都由 Harness 持久保存。

5. **Observe & Verify 观测校验**：对执行结果做验证——测试用例执行、日志解析、浏览器截图、断言判断；校验结果回流上下文，让模型感知动作成败。

闭环流程：上下文注入 → 模型推理决策 → Harness 执行动作 → Harness 持久化产物 → Harness 校验结果 → 结果回填上下文，循环直到任务完成或终止。

```markmap
# Harness 五大模块

- Context Injection 上下文注入
  - 系统提示词
  - 会话记忆
  - 技能定义
  - 历史对话
- Control 控制层
  - Compaction 上下文压缩
  - Orchestration 任务编排/子Agent调度
  - Ralph loops 主循环控制
- Action 动作执行
  - Bash / 自定义工具
  - MCP 服务调用
- Persist 持久化
  - 文件系统读写 / Git
  - 进度文件
- Observe & Verify 观测校验
  - 测试用例执行
  - 日志解析
  - 断言判断
```

## 三、Harness 部署形态：本地 Harness / 云端托管 Harness

Harness 本身没有固定部署位置，同一套 Harness 设计，可以本地部署，也可以托管在云端；模型位置和 Harness 位置可以独立组合：

|部署模式|说明|典型代表|
|---|---|---|
|本地 Harness + 云端模型（最主流）|Agent 调度循环、沙箱、文件访问跑在本机进程；仅 LLM 推理请求走厂商 API；可直接访问本机代码、Shell、本地 MCP|Claude Code CLI、Codex CLI、Google Antigravity CLI、Aider、Hermes Agent|
|云端托管 Harness + 云端模型|Harness Runtime + 隔离沙箱全部运行在厂商服务器；Agent 在远程环境执行，本机只提交任务|Claude Managed Agents、OpenAI Agents API、Gemini Deep Research、AWS Bedrock AgentCore、Manus|
|本地 Harness + 本地模型|Harness 在本机进程，模型通过 Ollama / vLLM 本地推理，全程不出网|LangGraph 自建 Harness + Qwen / Llama 本地部署|

> 重要区分：VSCode 上的 Claude Code 插件只是 UI 层，Harness 本体是本地启动的 `claude` CLI 进程。

## 四、主流 Harness 一览

分类：厂商原生 Harness、开源通用 Harness、编排网关型 Harness。

|Harness|归属|类型|核心定位|关键特点|
|---|---|---|---|---|
|Claude Code CLI|Anthropic|厂商原生本地 Harness|代码优先结对编程|工具契约固定（Read/Edit/Bash），上下文压缩成熟，Token 效率高；编码稳定，但对开放式探索任务约束较强|
|Claude Managed Agents|Anthropic|云端托管 Harness|长周期云端 Agent|云端持久沙箱、长会话托管，无需本机在线|
|OpenAI Codex CLI|OpenAI|厂商原生本地 Harness|Coding Agent|安全校验严格，策略保守，重构场景容易卡住|
|OpenAI Agents API|OpenAI|云端托管 Harness|通用托管智能体|配套 MCP、会话管理、托管沙箱|
|Google Antigravity CLI（原 Gemini CLI）|Google|厂商原生本地 Harness|终端编码 Agent|2026-06-18 起取代 Gemini CLI 作为消费侧默认入口，闭源；Gemini CLI 本体保留给企业/API 用户，仍开源（Apache-2.0）；百万级 token 上下文是主要卖点|
|Manus|Monica（现 Tencent 系独立运营）|云端托管 Harness|通用自主 Agent|中心编排器 + 多个专职子 Agent 并行（网页浏览、数据分析、代码执行等），按子任务动态选模型；per-task 沙箱 VM 隔离；GAIA Level 2/3 基准长期领先，定位是"通才"而非编码专精|
|Hermes Agent|Nous Research|开源通用 Harness|长周期通用自动化|开放循环，自带复盘、Skill 自进化能力，适合后台持续任务；默认安全护栏宽松，容易 Token 爆炸|
|OpenClaw|OpenClaw 社区|网关编排型 Harness|多通道、多 Agent 调度|对接 Telegram / Discord 等消息入口；可把 Claude Code、Hermes 作为后端 Runtime；编码能力不是强项|
|OpenHands|开源社区|开源编码 Harness|可定制化编码 Agent|高度可二次开发，默认策略朴素，长任务容易失忆|
|mini-SWE-agent|学术基线|轻量基线 Harness|干净 ReAct 实验基准|约束极少，探索型科研任务表现强；缺少快照、高级压缩，稳定性差|
|Aider|社区开源|轻量编码 Harness|极简本地结对编码|轻量、上手简单，生态成熟|
|AgentScope / Qwen-Agent|阿里|开源 Harness 框架|多智能体、国产模型适配|分布式调度，适配 Qwen 系列|
|LangGraph|LangChain|Harness 开发框架|自定义 Harness 底座|状态图、断点、人机介入，工业界自建 Harness 首选底座|

## 五、Harness Benchmark：评测思路与跑分规律

### 1. 核心评测原则

普通 SWE-bench 榜单大多是「模型 + Harness 打包提交」，无法单独评估 Harness；真正的 Harness Benchmark 必须控制变量：固定同一个 LLM，切换不同 Harness。

核心结论：**同一个模型，更换 Harness，任务通过率差距可达 20~35 个百分点；弱模型搭配优质 Harness，甚至可以超过强模型搭配劣质 Harness。**

### 2. 主流 Harness 评测基准

1. **Harness-Bench（北大 + 启元，2026）**：目前专门面向 Harness 的权威基准，106 个真实工作流任务；指标包含 Pass@1、Token 消耗、成本、步骤冗余、上下文压缩效率、MCP 稳定性；

2. **What Does a Harness Buy? Tokens, Mostly**：聚焦 Token 开销、上下文压缩收益；证明 Harness 带来巨大成本差异；

3. **HarnessSafe / HarnessRisk**：安全专项基准，评估沙箱隔离、权限逃逸风险；Codex CLI、Claude Code 安全得分靠前，Hermes 默认安全约束偏弱；

4. **Claw-SWE-Bench**：面向多通道通用 Agent 的编码基准；

5. **SWE-bench Verified**：两种用法——打包提交（模型 + Harness）；或锁定 mini-SWE-agent 作为统一基线，单独测模型能力；

6. **GAIA**：面向通用（非纯编码）自主任务的基准，覆盖网页操作、工具使用、多步推理；Manus 这类多 Agent 编排型 Harness 在 Level 2/3 上领先其他通才型 Agent，是 Harness 架构差异（多子 Agent 并行 + 动态选模型）而非单一模型能力的体现。

### 3. 场景化跑分规律（同模型前提下）

- 编码场景：Claude Code、Codex CLI 综合稳定，Token 效率优秀；

- 开放式科研、自由探索任务：mini-SWE-agent 经常反超厂商原生 Harness（厂商 Harness 的强工具契约限制探索）；

- 长时间后台自动化、持续迭代任务：Hermes Agent 优势明显；

- 多平台机器人、多 Agent 协同：OpenClaw 更合适；

- 通用非编码自主任务（网页操作、研究、数据分析）：Manus 的多子 Agent 编排架构通常领先单 Agent 工具契约型 Harness；

- 安全敏感场景：Codex CLI > Claude Code > OpenHands > Hermes。

> 重要坑点：榜单结论高度依赖任务域，不存在全局第一；Harness 迭代速度极快，跑分版本漂移明显；很多评测不披露 Token 成本，高通过率 Harness 可能上线成本不可接受。

## 六、发展历史时间线

1. **2021：Eval Harness 诞生**
EleutherAI 发布 lm-evaluation-harness，Harness 一词进入 LLM 领域，此时仅用于评测打分，和 Agent 执行无关。

2. **2022：理论奠基**
ReAct 论文提出「思考→行动→观察」的 Agent 循环范式，是所有 Agent Harness 的内核；同期 LangChain、AutoGPT 出现，大家裸写 Agent 循环，称呼为 scaffold。

3. **2023 下半年 – 2024 上半年：组件化萌芽**
OpenAI Assistants API（首个托管 Agent Runtime）、Devin 发布，沙箱、持久工作区、会话层等 Harness 核心组件被重视；Cursor、Windsurf 等 IDE Agent 出现，本地 Harness 路线成型。

4. **2024 年末 – 2025：Harness 概念正式定型**
Anthropic 发布 Claude Code，并发布长任务 Harness 专题博客，正式定义 Agent Harness；Hermes、OpenClaw、DeepSeek Harness 陆续开源；Google 发布开源的 Gemini CLI（2025-06）；Monica 发布 Manus（2025-03），多 Agent 编排型通用 Harness 路线出圈；行业认知转变：Agent 瓶颈不在模型，而在 Harness。

5. **2026 至今：标准化与工程化，部分产品线迭代**
MCP 成为工具互通标准，Harness Engineering 成为独立方向；专门针对 Harness 的 Benchmark 集中出现；本地 Harness、云端托管 Harness 两条路线并行成熟；Google 以闭源的 Antigravity CLI（6月）取代 Gemini CLI 面向消费端的定位；Manus 历经 Meta 收购意向（2025-12）、监管层面的中国业务调整（2026-04）后，于 2026-09 由 Tencent 系投资方主导独立运营。

## 七、选型指南

|需求场景|推荐选择|理由|
|---|---|---|
|本地 IDE 结对编程、项目重构|Claude Code CLI / Codex CLI|编码稳定性、Token 效率、Git 集成均衡|
|超长上下文、Google 生态内编码|Google Antigravity CLI（或企业版 Gemini CLI）|百万级 token 上下文，深度绑定 Gemini/Vertex AI|
|长时间后台自动化、任务自迭代、非编码通用任务|Hermes Agent|复盘闭环、技能沉淀，适合长期运行|
|通用自主任务（研究、数据分析、网页操作），不要求本机常驻|Manus|多子 Agent 编排 + 云端沙箱，GAIA 通才基准领先|
|多 IM 机器人、多 Agent 编排、统一入口网关|OpenClaw|多渠道接入，可以复用其他成熟 Harness 作为后端|
|学术对照实验、干净基线、自由探索|mini-SWE-agent|约束少，排除 Harness 策略干扰|
|自研定制 Agent、业务深度改造|LangGraph / AgentScope|灵活可控，完全自主定义 Harness 逻辑|
|云端长期任务，不想本机持续开机|Claude Managed Agents / Bedrock AgentCore|厂商托管沙箱，持久运行|

## 八、总结

Agent Harness 是当前 Agent 落地的核心层，承担模型之外所有闭环控制、环境交互、状态管理工作。它分为本地、云端两种部署形态，不同 Harness 有明确的场景偏向，不存在万能最优方案。

模型能力是上限，但 Harness 决定了 Agent 能不能稳定、低成本、安全地触达这个上限；在做 Agent 评测时，必须区分「测模型」和「测 Harness」，控制变量才具备参考意义。随着 MCP 等协议标准化，Harness 生态会进一步解耦：同一套 Harness 可以插拔不同模型、不同工具。


