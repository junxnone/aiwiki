---
Title | Hot Harness Skills
-- | --
Created @ | `2026-10-15T09:17:18Z`
Updated @| `2026-10-15T09:17:18Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/553)

---
# Harness Skills

> 本文是 [Agent Harness](/0551_Hot_Harness) 系列的子篇，专讲 Harness 里的 **Skill** 系统——一种和 Tool/MCP、系统提示词都不同的"第三种"上下文注入方式。主篇架构图把"技能定义"列为 Context Injection 的四项之一，本文展开讲它具体是什么、怎么加载、和 Tool 的边界在哪、生态现状与风险。

## 一、Skill 是什么

一个 Skill 是一个文件夹：核心是一个 `SKILL.md`（YAML frontmatter + Markdown 正文），可选携带 `/scripts`、`/references`、`/assets` 子目录。frontmatter 只强制要求两个字段：`name`（≤64 字符）和 `description`（≤1024 字符）——`description` 就是模型据以判断"这个技能现在用不用得上"的触发条件。

这套机制 2025-10 由 Anthropic 随 Claude 发布，2025-12-18 被正式定义为开放规范。

## 二、加载机制：三级渐进式披露（Progressive Disclosure）

| 层级 | 内容 | 时机 | 典型开销 |
|---|---|---|---|
| L1 | 所有已安装 Skill 的 `name` + `description` | 启动时预加载进系统提示词 | 约 100 token/个 |
| L2 | 完整 `SKILL.md` 正文（建议 <5K token / <500 行） | 模型判断某 Skill 与当前任务相关时，按需读取 | 数百到数千 token |
| L3 | 捆绑的脚本/参考文档 | 真正执行时才拉取；脚本直接执行，只有**输出**进入上下文 | 理论上不设上限 |

这个设计的核心动机：Skill 库可以很大，但只要触发条件设计得好，大部分 token 开销只在真正用到时才发生——这也是它和"写进系统提示词的固定指令"最大的区别。

## 三、Skill vs Tool/MCP vs 系统提示词

可以理解为"Claude 知道什么"和"Claude 能碰到什么"的区别：

- **Tool / MCP**：面向外部系统的、schema 严格定义的 API 调用，解决的是**连接问题**（能不能调用到）；
- **Skill**：程序性知识——一份教模型"怎么正确使用工具/完成某类工作流"的 Markdown 操作手册（可附代码），按需懒加载，解决的是**方法问题**（知不知道怎么用好）；
- **系统提示词里的固定指令**：常驻、不可按需取消加载，无论当前任务用不用得上都要消耗上下文。

Anthropic 官方文档明确两者是互补关系：MCP 提供"触达能力"，Skill 提供"使用方法"，真实工作流通常两者都要用到。

## 四、生态与市场现状

没有唯一官方的"应用商店"——Anthropic 自己维护一个较小的 `claude-plugins-official` 市场（默认接入）；真正的生态分布在第三方目录（SkillsMP、tonsofskills.com、skills.sh 等），这些站点自称收录数十万甚至上百万 Skill，但这类数字多为自我报告，很多内容农场站点刷量，建议谨慎看待。社区里相对公认有分量的是 **Superpowers**（obra/superpowers）技能包。多数 Skill 遵循 Apache-2.0 等开放协议免费使用，也有少量付费高级 Skill。

**跨厂商采纳**：Agent Skills 开放规范发布 48 小时内被 OpenAI（Codex CLI、ChatGPT）、Microsoft（VS Code/Copilot）采纳；Gemini CLI 在 v0.23.0（2026-01）加入实验支持；Cursor v2.4（2026-01）跟进；到 2026-03，agentskills.io 统计已有 32 家采纳方（含 JetBrains、Sourcegraph、Block/Goose、Mistral、字节等）。各家约定的技能目录路径不同：Codex 用 `.agents/skills`，Gemini 用 `.gemini/skills`，Cursor 用 `.cursor/skills/<name>/SKILL.md`。

需要注意区分：Gemini CLI 更早期的 **Extension** 是一个更大的打包容器（MCP + hooks + commands + subagents + skills 都能塞进去），Skill 只是 Extension 里的一个组成部分，不是替代关系；另外 Gemini CLI 本体正被 **Antigravity CLI** 取代（详见主篇），Skills/Hooks/Subagents 能力会保留迁移过去。**Manus** 也采纳了同一套开放规范，强调 Skill 可组合链式调用成工作流。**OpenClaw** 则是另一层——它的"harness"插件是可插拔的执行引擎（Codex harness、Copilot SDK harness、ACP backend 等），和基于 SKILL.md 的 Skill 是不同维度的概念，但可以承载/调用它们；其安全组件 ClawKeeper 会基于 Skill 做策略拦截。

## 五、设计模式与常见坑

- **发现成本（Discovery Cost）**：Skill 库变大后，把全部 L1 摘要都塞进上下文变得不现实，衍生出专门的检索层（如 SkillRet）先从大库里筛出相关候选，再做 L2 加载；
- **版本管理不成熟**：目前业界普遍没有标准化的 Skill 版本机制，多是团队手搓 `/v1/`、`/v2/` 目录区分；
- **组合调用**：有研究提出 Progressive Skill Activation（渐进激活）、Skill-Execution Authority Separation（技能定义与执行权限分离）、Verifiable Skill Contract（可验证的技能契约）、Runtime Skill-BOM（运行时技能物料清单）等模式，支持 Skill 之间串行/并行/条件组合调用；
- **安全风险是目前最突出的问题**：
  - Snyk 的 "ToxicSkills" 研究发现抽样的 Skill 里 36.8% 存在安全缺陷（硬编码密钥、不安全处理等）；
  - Skill 里捆绑的脚本在模型"看到"指令之前就已经执行，使得传统的 prompt injection 防护完全失效（Datadog Security Labs）；
  - 在一项 OpenClaw 相关评测里，恶意 `SKILL.md` 是所有注入向量里攻击成功率最高的（平均 69.4%）；
  - ClawHub 在 2026-02 遭遇过一次协同式恶意 Skill 投毒事件（30+ 个恶意 Skill）。

## 六、Skill 系统有效性的实证研究

- **SkillsBench**（86 任务、11 领域、7308 条轨迹）是目前被引用最多的实证研究：装 2-3 个相关 Skill 收益最大（+18.6 个百分点）；装 ≥4 个 Skill 后收益骤降到 +5.9 个百分点（认知负担/指令冲突）；Skill 长度和效果也不是单调关系——"详细"或"精简"风格的 Skill 效果最好（分别 +18.8/+17.1），而"面面俱到"的 Skill 反而拖累表现（-2.9）。注意：这是单篇非同行评审研究，结论有待复现验证；
- **FinSkillBench** 发现自动生成（而非人工策划并测试过）的 Skill 在 97.7% 的任务里都会被加载，但很少真正提升准确率——"写了一份操作说明"不等于"这份说明是对的、有效的"；
- 其他相关命名基准：**SkillRet**（检索效果）、**SkillSafetyBench**（安全性）、**SoK: Agentic Skills**（综述与分类）。

## Reference
- [Claude Agent Skills 官方文档](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [SKILL.md 结构详解](https://atlan.com/know/ai-agent/ai-agent-skills/skill-md-file-explained/)
- [Claude Skills 深度解析](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/)
- [Claude Skills vs MCP](https://intuitionlabs.ai/articles/claude-skills-vs-mcp)
- [Agent Skills 开放标准跨厂商采纳](https://codex.danielvaughan.com/2026/05/05/agent-skills-open-standard-portable-skills-codex-cli-cross-agent/)
- [Gemini CLI Skills 文档](https://geminicli.com/docs/cli/skills/)
- [Harnessing Agent Skills（架构模式论文）](https://arxiv.org/pdf/2606.20631)
- [Snyk: ToxicSkills](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/)
- [Datadog: 动态上下文带来的供应链风险](https://securitylabs.datadoghq.com/articles/malicious-skills-supply-chain-risks-in-coding-agents-with-dynamic-context/)

