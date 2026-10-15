---
Title | Hot Harness Sandbox
-- | --
Created @ | `2026-10-15T09:17:22Z`
Updated @| `2026-10-15T09:17:22Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/555)

---
# Harness Sandbox

> 本文是 [Agent Harness](/0551_Hot_Harness) 系列的子篇，展开讲各家 Harness 的执行沙箱与权限模型——主篇只有"Claude Code 工具契约固定""Codex CLI 安全校验严格""Gemini CLI 多种沙箱技术"这类一句话结论，以及 HarnessSafe/HarnessRisk 两个基准名字，这里把沙箱技术本身、权限模型、真实安全事件和防护建议讲透。

## 一、各家 Harness 的沙箱实现

- **Claude Code**：双层模型。应用层是权限规则（allow/ask/deny，按此优先级评估），每次工具调用（含 Bash/MCP/WebFetch）都要过一遍；Bash 执行还有 OS 层沙箱——macOS 用 Seatbelt，Linux/WSL2 用 bubblewrap（配 socat 做网络中转），**Windows 和纯 Linux 目前还没有原生沙箱**，这两个平台只能靠 allow/deny 名单兜底。默认对整个文件系统可读（除非显式拉黑路径，`~/.ssh`、`~/.aws` 默认并不在拉黑名单里，需要自己配置）。2026-07 新增 `sandbox.network.strictAllowlist`，不在白名单里的域名会被静默拒绝，而不是弹窗询问。
- **OpenAI Codex CLI**：沙箱模式和审批策略是两个独立维度。沙箱模式有 `read-only`、`workspace-write`（可写工作区和 `/tmp`，默认关网络，需要显式开启）、`danger-full-access`；审批策略有 `on-request`（默认，只在沙箱会拦截时才询问）、`never`（CI/无人值守场景）、`untrusted`。落地机制：macOS 用 Seatbelt，Linux 用 bubblewrap+seccomp（是否仍用 Landlock 各资料说法不一），Windows 有未提权/提权两种原生沙箱变体，WSL2 行为等同 Linux、WSL1 不支持。`--yolo` 参数会同时关掉沙箱和审批。
- **Gemini CLI**：通过 `GEMINI_SANDBOX` 环境变量或 `settings.json` 可选五种沙箱后端——macOS Seatbelt（`sandbox-exec`）、Docker/Podman 容器、Windows 原生沙箱、gVisor/runsc、Linux 下实验性的 LXC/LXD。macOS Seatbelt 有六档预设 profile（默认 `permissive-open` 到最严格的 `strict-proxied`），控制读写和网络范围，可通过 `.gemini/sandbox-macos-<name>.sb` 自定义。注意它沙箱化的是**整个 CLI 进程**，而不只是 shell 命令。
- **Google Antigravity CLI**：改用更轻量的原生隔离原语而非容器/VM——Linux 用 nsjail、macOS 用 sandbox-exec、Windows 用 AppContainer，启动开销接近零；默认拦截 `~/.ssh`/`.env`，网络限制在白名单域名内。**但默认是关闭的**（`enableTerminalSandbox: false`），且不同平台下的默认状态说法在文档里不一致。安全公司 Pillar Security 发现了真实的绕过案例：有个被归类为"原生工具"的 `find_by_name` 会在 Secure Mode 评估生效之前就执行；更普遍的一类问题是 Cursor/Codex/Gemini CLI/Antigravity 共有的模式——Agent 先写一个文件，再由一个"受信主机工具"去执行它，整个沙箱边界就被绕过了。
- **Manus**：每个任务独立起一个临时的 microVM（基于 Firecracker，通过 E2B 实现），不是容器，每个任务有独立内核，启动延迟约 150ms，提供完整的 Linux 环境（文件系统、终端、真实的非 headless Chromium）。会话隔离机制防止跨用户互相访问。

## 二、隔离技术分类与权衡

| 隔离级别 | 启动开销 | 隔离强度 | 主要风险 |
|---|---|---|---|
| 仅权限弹窗（无 OS 沙箱） | 最低，几乎为零 | 最弱 | 完全依赖策略逻辑本身写得对不对 |
| OS 层（seccomp/Landlock/Seatbelt/nsjail） | 接近零 | 和主机共享内核，强度取决于系统调用/路径策略 | 容易被"受信工具绕过"类模式攻破 |
| 容器（Docker/Podman） | 秒级 | 更强的进程隔离，跨平台 | 仍共享内核，存在命名空间逃逸风险 |
| gVisor（用户态内核） | 中等 | 比容器更强，不用付出整台 VM 的代价 | 兼容性/性能有一定折损 |
| MicroVM / 每任务一 VM（Firecracker/E2B，Manus） | 最高，但 Firecracker 可压到约 150ms | 最强（独立内核） | 基础设施成本最高 |

## 三、权限/工具契约模型

默认姿态从"宽松优先"到"保守优先"都有：Claude Code 默认文件读权限较宽、通过 allow-list 逐步放开；Codex 默认关网络、`workspace-write` 是默认写入范围，更偏保守。所有家都遵循 deny > ask > allow 的优先级，并区分读/写/网络三种授权维度。人工审批介入点也不一样：Codex 的 `on-request` 只在沙箱会拦截的边界上才打断；Claude Code 允许管理员对特定规则强制设为 `ask`；Antigravity 的 Secure Mode 则存在"被归类为原生工具就能绕过"的已知缺口。

## 四、HarnessSafe / HarnessRisk 两类安全基准

2026 年有两篇独立的 arXiv 论文对应这两个基准名字：

- **HarnessRisk**：按生命周期划分，覆盖配置（Configuration）、能力扩展（Capability Extension）、运行时操作（Runtime Operation）、状态持久化（State Persistence）、动作控制（Action Control）、事故恢复（Incident Recovery）六个阶段共 128 个案例。在 3 个 Harness × 6 个模型的组合上，攻击成功率从 12.6% 到 80.9% 不等，**配置阶段是最脆弱的环节**。
- **HarnessSafe**：聚焦持久化相关风险（记忆/Skill/MCP/子 Agent），共 328 个案例，用一套 7 档（N0-N5b）的追踪评分衡量"危险操作被遏制到了哪一步"；发现遏制效果强烈取决于具体的 Harness × 模型组合，而不只是任务本身的难度。

## 五、真实世界安全事件（2025-2026）

- `postmark-mcp`：一个恶意 MCP Server，前 15 个版本干净，之后悄悄加入数据外泄逻辑；
- CVE-2025-6514（`mcp-remote`，CVSS 9.6）：通过不受信的 MCP Server 实现远程代码执行；
- CVE-2026-22708（Cursor）：连 `git branch` 这类白名单命令都能被投毒携带攻击载荷；
- CVE-2025-59532（Codex CLI）：目录控制缺陷导致的沙箱逃逸；
- CVE-2025-53773（GitHub Copilot）：通过 prompt injection 实现远程代码执行；
- CVE-2025-54135（Cursor）：间接注入自动写入恶意的 `.cursor/mcp.json`；
- GitHub MCP "Toxic Agent Flow"：藏在 issue 里的指令通过 PR 流程外泄私有仓库数据；
- "Rules File Backdoor"：藏在 AI IDE 规则文件里的隐藏指令；
- CVE-2025-49596（MCP Inspector）：DNS 重绑定导致的远程代码执行。

## 六、2026 年的最佳实践共识

动态最小权限（按任务范围临时授予，而非静态常开）、每个 Agent 有独立身份且对应一个可追责的人类负责人、沙箱执行 + 网络出站默认拒绝（白名单制）、每次工具调用都过策略引擎、人工审批只保留给写入/发送/删除/花钱这类高风险动作（避免"审批疲劳"——过度频繁弹窗反而让人无脑点同意）、完整的审计日志 + 可回滚能力。这些建议分别来自 Microsoft（"Least privilege for AI agents"）、OWASP Agent Security Cheat Sheet、澳大利亚 ASD 的 agentic-AI-harness 指南、ISACA 2026 年度建议等多个独立信息源，方向高度一致。

## Reference
- [Claude Code Sandboxing 文档](https://code.claude.com/docs/en/sandboxing)
- [Claude Code Permissions 文档](https://code.claude.com/docs/en/permissions)
- [Codex CLI Sandbox & Approval Policies](https://deepwiki.com/openai/codex/2.4-sandbox-and-approval-policies)
- [Gemini CLI Sandbox 配置文档](https://google-gemini.github.io/gemini-cli/docs/get-started/configuration.html)
- [Google Antigravity 沙箱逃逸报道](https://cyberscoop.com/google-antigravity-pillar-security-agent-sandbox-escape-remote-code-execution/)
- [Manus Sandbox 架构博客](https://manus.im/blog/manus-sandbox)
- [HarnessRisk 论文](https://arxiv.org/abs/2608.17597)
- [HarnessSafe 论文](https://arxiv.org/abs/2608.06984)
- [Sysdig: Prompt Injection 防护指南](https://www.sysdig.com/learn-cloud-native/prompt-injection)

