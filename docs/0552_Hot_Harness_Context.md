---
Title | Hot Harness Context
-- | --
Created @ | `2026-10-15T09:17:16Z`
Updated @| `2026-10-15T09:17:16Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/552)

---
# Harness Context Engineering

> 本文是 [Agent Harness](/0551_Hot_Harness) 系列的子篇，聚焦 Harness 五大模块中 Context Injection（上下文注入）与 Control 层里 Compaction（压缩）部分的具体实现——即长任务执行过程中，Harness 如何管理送进模型的上下文、何时压缩、压缩后留什么。Harness 的整体定义、五大模块总览、主流产品对比见主篇，这里不重复。

## 一、为什么需要专门的上下文管理

- 上下文窗口有限，长任务会不断把工具输出、文件内容、历史对话塞进去，迟早触顶；
- 即使没触顶也会出问题：**Context Rot**（Chroma，2025）发现模型准确率在远低于窗口上限时就已开始下降，尤其当上下文里混入语义相似但不相关的干扰信息时更明显；**Lost in the Middle**（Liu et al.）发现模型对上下文中段信息的利用率呈 U 形下降，在多个模型家族上复现；
- 因此 2025-2026 年行业把这块拆成三个相关但独立的学科方向：**Context Engineering**（怎么组装送入模型的内容）、**Memory Engineering**（怎么跨会话持久化）、**Harness Engineering**（怎么把前两者工程化进运行时）。

## 二、各家 Harness 的压缩/记忆机制

### Claude Code：Auto-Compact + 记忆文件

- 窗口逼近阈值时自动触发压缩（原生 1M 上下文模型约 967K，Sonnet/Opus 无扩展上下文则约 200K），阈值可通过 `autoCompactWindow` 配置；也可手动 `/compact [focus]`、`/clear`、`/rewind`；
- 2026-10（v2.1.299）新增"空闲压缩"：超过 200K token 的会话空闲约 54 分钟后，会抢在 1 小时缓存过期前提前压缩；
- 压缩后，根目录 `CLAUDE.md` 与自动记忆会重新注入，最近访问的 5 个文件会重新读取；但嵌套/路径作用域的 `CLAUDE.md` 和大部分历史会丢失，直到被重新读取；
- 用户可在 `CLAUDE.md` 里写一段"Compact Instructions"，或直接 `/compact focus on X`，引导压缩时该保留什么。

### Codex CLI：结构化会话记忆 + 服务端摘要

- 压缩分层：优先尝试用结构化的会话记忆（任务状态、编辑历史）直接替代，不够时才调用专用的 `/v1/responses/compact` 端点做"总结替换"，返回的是加密 blob 而非可读文本；
- 自动触发阈值 = 有效窗口 − 13K token；
- 2026-09（v0.153.4）新增 "history and notes" 机制和 `new_context` 工具：可以开一个全新上下文窗口、同时带上此前保存的笔记，减少对有损摘要的依赖；
- 持久记忆分两层：用户手写的静态 `AGENTS.md` + Codex 自动生成并写入的 `~/.codex/memories/`。

### Gemini CLI / Antigravity：Shadow Git Checkpoint

- 开启 checkpointing 后，会在 `~/.gemini/history/<project_hash>` 建一个"影子 git 仓库"（覆盖 `GIT_DIR`/`GIT_WORK_TREE`），把项目文件快照和对话历史、待处理的工具调用一起存进 `~/.gemini/tmp/<project_hash>/checkpoints`，支持 `/restore`；
- 该机制出现过几类问题：误把真实 `.git` 目录纳入快照导致磁盘膨胀、`/restore` 失效、在非 git 目录下静默失败；
- Google 正把 Gemini CLI 并入 **Antigravity** 平台，新增持久历史、长期记忆、知识库、轨迹追踪；但据用户反馈，Antigravity 里子 Agent 默认几乎拿不到编排者积累的上下文，只通过安装目录里的计划文件共享极少信息——这是刻意的强隔离设计，而非缺陷。

### Manus：以文件系统为外部共享内存

- 设计哲学是"通过通信共享信息，而不是共享内存"（借用 Go 并发哲学的说法）：各子任务默认用隔离的上下文，只有真正需要全量轨迹时（比如调试）才共享，因为 fork 上下文会打破 KV-cache 复用；
- 刻意不按角色常驻拆分多个 Agent，而是少量功能性 Agent + 一个通用执行者；
- 文件系统被当作外部化的共享记忆，支持"可恢复压缩"——可以从上下文里丢掉一个网页的全文，只保留它的 URL/路径，需要时再读回来；
- 规划状态的演进：早期用一个不断被重写的 `todo.md`（据其工程博客估算约浪费 30% token），后来改成一个专门的 Planner "agent-as-a-tool"；
- 提炼出五个支柱：offloading（卸载）、reduction（精简）、retrieval（检索回补）、isolation（隔离）、caching（缓存复用）。

## 三、跨厂商通用的技术手段

- 滑动窗口（只留最近 N 轮）+ 工具输出清理；
- 持续/增量摘要，而非等触顶才整体摘要一次；
- Scratchpad（上下文之外的工作笔记区）；
- 子 Agent 隔离：用全新上下文窗口跑子任务，保护主 Agent 的上下文不被污染，子 Agent 只把最终结果返回给主 Agent（Claude Code 的 Task/Agent 工具即此模式，且不支持再嵌套子 Agent）；
- 分层记忆：MemGPT / Letta 提出的"操作系统式"虚拟上下文管理——主上下文相当于内存（RAM），外部存储相当于磁盘（Disk），通过工具调用分页读写；
- 跨会话记忆：检索增强（RAG）+ 按"近因度/重要性/相关性"打分召回（类似 Generative Agents 的记忆排序方法）。

## 四、值得追的术语/论文

| 名称 | 一句话 |
|---|---|
| Lost in the Middle（Liu et al.） | 模型对上下文中段信息的利用率呈 U 形下降，在多个模型家族上复现 |
| Context Rot（Chroma, 2025） | 准确率在上下文远未填满前就已开始下降，和"硬性溢出"是两回事，相似但无关的干扰信息会加剧该现象 |
| MemGPT / Letta（Packer et al.） | 操作系统式虚拟上下文管理：主上下文=RAM，外部上下文=Disk，按需分页 |
| Found in the Middle | 从 RoPE 位置编码角度解释"中段遗忘"的机制成因 |

## Reference
- [Claude Code Compaction 原理](https://okhlopkov.com/claude-code-compaction-explained/)
- [Claude Code Sub-agents 文档](https://code.claude.com/docs/en/sub-agents)
- [Codex CLI / Claude Code / opencode 上下文压缩对比](https://codex.danielvaughan.com/2026/04/14/context-compaction-deep-dive-codex-cli-claude-code-opencode/)
- [Codex CLI 记忆机制](https://mem0.ai/blog/how-memory-works-in-codex-cli)
- [Gemini CLI Checkpointing 文档](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/checkpointing.md)
- [Manus: Context Engineering for AI Agents](https://medium.com/@peakji/context-engineering-for-ai-agents-lessons-from-building-manus-71883f0a67f2)
- [Context Window Management for Long-running Agents](https://machinelearningmastery.com/context-window-management-for-long-running-agents-strategies-and-tradeoffs/)
- [Context Rot（Chroma 技术报告）](https://www.tinyfish.ai/blog/context-rot)

