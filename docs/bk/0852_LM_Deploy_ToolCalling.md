-----

| Title     | LM Deploy ToolCalling                                 |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T15:40:30Z`                                |
| Updated @ | `2026-11-26T15:43:27Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/852) |

-----

# ToolCalling

工具调用 (function calling) 的服务端实现：模型怎样「调用」函数，一次多轮的交互流程，chat template
与解析器，并行调用，以及与 MCP 的关系和安全注意事项。接口格式见
[Service](/0845_LM_Deploy_Service)。

## 交互流程

模型本身不会执行任何函数，它只是按约定的格式输出「想调用哪个函数、参数是什么」，由应用程序执行后把结果交回：

``` mermaid
sequenceDiagram
    participant App as 应用
    participant LLM as 推理服务
    participant Tool as 工具/接口
    App->>LLM: messages + tools (函数名与参数 schema)
    LLM-->>App: tool_calls 调用 get_weather, 参数 city=北京
    App->>Tool: 调用 get_weather("北京")
    Tool-->>App: 返回 temp=3, weather=晴
    App->>LLM: 追加 role=tool 的结果消息
    LLM-->>App: 最终回答: 北京今天晴, 3 度
```

图中：

  - 第一次请求里，应用在 `tools` 中声明可用的函数及其参数的 JSON schema；模型判断需要调用时，返回
    `tool_calls` 而不是普通文本
  - 应用真正执行函数 (查数据库、调接口)，把结果作为 `role: tool` 的消息追加到对话里，再请求一次
  - 模型根据工具结果生成最终回答；复杂任务中这个循环可能重复多次，这就是 Agent 的基本形态

## 服务端要做什么

| 步骤      | 说明                                                                         |
| ------- | -------------------------------------------------------------------------- |
| 渲染      | 用模型对应的 chat template 把 `tools` 的描述写进提示词；不同模型系列的写法不同                        |
| 生成      | 模型按训练时学到的格式输出调用 (如特殊标记包裹的 JSON)                                            |
| 解析      | 从输出中识别并提取工具调用，转换成 OpenAI 格式的 `tool_calls`                                  |
| 约束 (可选) | 用约束解码保证参数一定符合 schema，见 [StructuredOutput](/0840_LM_Infer_StructuredOutput) |
| 流式      | 流式输出时要边生成边判断是否进入了工具调用段，增量地返回参数                                             |

表中：渲染和解析必须与模型训练时的格式一致，这也是为什么 vLLM 要用 `--tool-call-parser` 按模型系列指定解析器，见
[Service](/0845_LM_Deploy_Service)；用错模板或解析器时，模型可能把调用当成普通文本输出。

## 质量与可靠性

  - 并行调用：模型在一次回复中给出多个相互独立的调用 (如同时查三个城市)，应用可以并发执行，减少往返次数
  - `tool_choice`：`auto` (模型决定)、`required` (必须调用某个工具)、指定函数名
    (强制调用该函数)、`none` (不调用)
  - 工具描述要清楚：函数名、参数含义、取值范围写清楚，模型选错工具或填错参数大多与描述不清有关
  - 工具数量：一次提供过多工具会占用大量上下文并降低选择准确率，可以先用检索选出相关的少数几个工具
  - 评测：用固定的测试集统计「是否选对工具」「参数是否正确」「是否在不该调用时调用」，纳入评估回归，见
    [Ops](/0846_LM_Deploy_Ops)

## 与 MCP 的关系

  - MCP (Model Context Protocol) 是一个把工具、资源和提示词以统一协议暴露给模型应用的标准，见
    [MCP](/0556_Hot_Harness_MCP)
  - 分工：MCP 解决「工具从哪里来、怎样被发现和调用」(应用与工具之间)，函数调用 API 解决「模型怎样表达要调用」(应用与模型之间)
  - 典型链路：应用从 MCP 服务器获取工具列表 → 转换成 `tools` 交给推理服务 → 模型返回 `tool_calls` →
    应用通过 MCP 调用对应的工具

## 安全

  - 模型的输出会变成真实操作，提示注入 (尤其是工具返回的外部内容里藏的指令) 可能诱导模型执行危险调用，见
    [Safety](/0847_LM_Deploy_Safety)
  - 做法：参数校验 (类型、范围、白名单)；最小权限
    (工具只能访问必要的数据)；对写操作、支付、删除等高风险调用要求人工确认；记录所有调用以便审计
  - 代码执行类工具必须放在沙箱中运行

## Reference

  - [OpenAI: Function
    calling](https://platform.openai.com/docs/guides/function-calling)
  - [vLLM: Tool
    Calling](https://docs.vllm.ai/en/latest/features/tool_calling.html)
  - [Model Context Protocol](https://modelcontextprotocol.io/)
  - [Toolformer: Language Models Can Teach Themselves to Use
    Tools](https://arxiv.org/abs/2302.04761)
  - [Berkeley Function Calling
    Leaderboard](https://gorilla.cs.berkeley.edu/leaderboard.html)
