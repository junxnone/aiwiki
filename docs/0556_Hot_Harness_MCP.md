---
Title | Hot Harness MCP
-- | --
Created @ | `2026-10-15T09:17:24Z`
Updated @| `2026-10-15T09:17:24Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/556)

---
# Harness MCP

> 本文是 [Agent Harness](/0551_Hot_Harness) 系列的子篇，展开讲 MCP（Model Context Protocol）和 A2A（Agent2Agent）两个协议——主篇只有一句"MCP 用于 Harness 和工具互通，A2A 用于 Agent 之间互通"，这里把架构、版本演进、生态规模、两者实际关系和已知风险讲清楚。
>
> 以下部分细节（如治理实体的具体成立时间）来自二手行业报道而非官方一手公告，标注处请自行核实后再引用。

## 一、MCP 架构

**Host - Client - Server 三层模型**：Host（如 Claude Code、Claude Desktop）内置一个或多个 MCP Client，每个 Client 与一个 MCP Server 保持 1:1 连接。Server 侧暴露五类能力：

- **Tools**：模型可调用的函数，有副作用；
- **Resources**：只读上下文数据，如文件、数据库记录；
- **Prompts**：预定义的提示词模板；
- **Sampling**：反向能力——Server 可以请求 Client 侧的 LLM 帮它做一次补全；
- **Roots**：Client 向 Server 声明自己可访问的文件系统/URI 边界。

**传输层**：`stdio`（本地进程）、"HTTP+SSE"（2024-11 版方案，已废弃）、**Streamable HTTP**（2025-03 起的远程传输标准，单一 endpoint 同时支持 POST 请求和可选的 SSE 流式响应）。

**治理**：Anthropic 于 2024-11-25 开源规范，据多篇 2026 年行业报道，已于 2025-12-09 捐赠给 Linux Foundation 新设立的 Agentic AI Foundation（AAIF），由 Anthropic、Block、OpenAI 共同发起，Platinum 会员包括 AWS、Google、Microsoft、Cloudflare、Bloomberg；Microsoft/GitHub 2025-05 加入技术指导委员会。

## 二、版本演进与生态规模

| 版本 | 时间 | 主要变化 |
|---|---|---|
| 首版 | 2024-11-25 | 初始规范发布 |
| - | 2025-03-26 | 引入 Streamable HTTP |
| - | 2025-06-18 | 结构化工具输出、elicitation、把 Server 定位为 OAuth Resource Server、移除 JSON-RPC batching |
| - | 2025-11-25 | OIDC Discovery、工具/资源 icon 元数据、区分工具执行错误与协议错误 |
| Release Candidate | 2026-07-28 | 协议层去状态化，移除 session 概念，改用 `_meta` 字段携带版本/身份信息 |

生态规模（不同统计口径差异较大，仅供量级参考）：官方 MCP Registry 在 2026-10 中旬约 4.3 万个 Server；Smithery 目录约 2 万个；另有报道称 SDK 月下载量约 9700 万次；约 64% 的已注册 Server 是远程 HTTP 类型。

## 三、A2A 协议

由 **Google 于 2025-04-09 发布**，首批 50+ 发布伙伴，同年晚些时候同样捐赠给 Linux Foundation 下的 Agentic AI Foundation（与 MCP 同属一个基金会托管）。**v1.0 正式版于 2026-03-12 发布**（新增 JWS 签名的 Agent Card），v1.0.1 于 5 月跟进。

核心概念：

- **Agent Card**（`/.well-known/agent-card.json`）：声明一个 Agent 支持哪些 Skill、MIME 类型、传输方式、安全方案，用于能力发现；
- **Task 对象**：8 种生命周期状态——`submitted` / `working` / `input_required` / `auth_required` / `completed` / `failed` / `canceled` / `rejected`；
- **Message / Part / Artifact**：消息与产出物的载体，支持 JSON-RPC 2.0 / gRPC / HTTP+JSON 三种传输绑定。

截至 2026-04，据报道有 150+ 支持组织、2.2 万+ GitHub star，Microsoft Foundry、AWS Bedrock AgentCore、Salesforce Agentforce 都有生产部署，但规模仍明显小于 MCP。

## 四、MCP 和 A2A 的实际关系

业界共识的分工是"MCP 管垂直方向（Agent → 工具），A2A 管水平方向（Agent → Agent）"，但**实际落地中 A2A 并没有成为主流**。关键证据：Claude Code / Claude Agent SDK 到 2026 年仍未原生支持 A2A，它的多 Agent 协作用的是自家的 subagent-as-tool（Agent 工具，单层委派、不可递归）以及更重的 "Agent Teams"（点对点 mailbox + 共享任务列表，但 token 消耗是单 Agent 的 4-7 倍）；Codex CLI 同样没有原生实现 A2A。两边目前都只能通过"MCP bridge server"把 A2A 端点包装成 MCP 工具来间接互通。也就是说，行业实际更倾向于在 MCP 之上自建厂商专属的 Agent 协作模式（参见 [Harness Orchestration](/0551_Hot_Harness)），而不是采用跨厂商的 A2A 标准。

## 五、MCP 的批评与局限

**安全**：OWASP 已把"Tool Poisoning"（MCP03）列为 MCP 专属威胁分类，2025-04 由 Invariant Labs 首次记录，变体包括描述注入、schema 注入、输出注入、Unicode 隐写。2026 年重大事件包括 OX Security 披露的一个影响 Python/TypeScript/Java/Rust 四语言实现、涉及 1.5 亿+ 下载量的供应链漏洞，以及 "SANDWORM_MODE" npm 蠕虫活动（19 个恶意包）。MCPTox 基准测试显示主流 Agent 对工具投毒的成功率超过 60%，而且**模型能力越强、越"听话"反而越容易中招**（该测试里 Claude 3.7 Sonnet 的抗性反而最好）。此外还存在"rug pull"问题——工具描述在被批准之后才悄悄更新为恶意版本。

**鉴权**：MCP 长期缺乏内建认证标准，2025-06-18 版本开始把 Server 定位为 OAuth Resource Server 并要求 RFC 8707 Resource Indicator，2025-11-25 加入 OIDC Discovery；原生 OAuth 2.0 支持仍是技术指导委员会的在研项目。

**N×M 问题**：MCP 本来是为了解决工具和模型之间的 N×M 集成问题，但代价是引入了新问题——每个 Server 都是一个潜在攻击面，而且 Registry 质量参差不齐（约 79% 的已注册 Server 近 90 天没有更新）。

## 六、其他/替代标准

目前没有看到真正和 MCP 竞争的对手协议。OpenAI 自己的 function calling 被普遍认为是和 MCP **互补而非竞争**的关系——function calling 解决"要不要调用工具"，MCP 解决"怎么连接到工具"；OpenAI 已在 2025 年 3-9 月陆续在 Agents SDK、Responses API、Realtime API、ChatGPT Developer Mode 里采纳了 MCP。2026 年业界对"协议分层"的共识是：MCP（工具层）+ A2A/ACP（Agent 协作层）+ OASF（身份）+ OAuth 2.1/DCR（鉴权）+ OpenTelemetry GenAI（可观测性）——没有单一协议能通吃所有层级。

## Reference
- [MCP 官方规范](https://modelcontextprotocol.io/specification/2025-11-25/changelog)
- [MCP 2026-07-28 Release Candidate](https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/)
- [MCP Registry 生态数据](https://medium.com/@amareswer/the-mcp-registry-by-the-numbers-f3bdf3ac4849)
- [A2A 协议 2026 采纳现状](https://www.glukhov.org/ai-systems/comparisons/a2a-protocol-2026-adoption/)
- [Turing Post：A2A 2026](https://www.turingpost.com/p/a2a)
- [Codex vs Claude Code 多 Agent 协作对比](https://codex.danielvaughan.com/2026/04/09/codex-vs-claude-code-multi-agent/)
- [Practical DevSecOps：MCP 安全漏洞 2026](https://www.practical-devsecops.com/mcp-security-vulnerabilities/)
- [MCP Tool Poisoning 2026 现状](https://itecsonline.com/post/mcp-tool-poisoning-enterprise-ai-agent-security-2026)
- [AI Agent Frameworks 2026（协议分层综述）](https://www.tldl.io/blog/ai-agent-frameworks-openai-anthropic-mcp-2026)

