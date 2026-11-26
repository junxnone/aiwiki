-----

| Title     | LM Deploy                                             |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T15:33:34Z`                                |
| Updated @ | `2026-11-26T15:41:53Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/820) |

-----

# Deploy

大模型部署与运维的总览：从选择推理框架、转换模型格式、估算资源，到服务化、监控和安全的完整流程，以及每一步需要回答的问题。

## 部署流程

下图是把一个模型部署成线上服务时的决策顺序：

``` mermaid
flowchart TD
    A[确定需求<br>模型/延迟/并发/成本] --> B[估算资源<br>Sizing]
    B --> C{需要压缩?}
    C -->|是| D[量化/蒸馏]
    C -->|否| E[选择推理框架]
    D --> E
    E --> F[转换模型格式<br>Format]
    F --> G[服务化<br>API/网关/扩缩容]
    G --> H[监控与评估回归<br>Ops]
    H --> I[安全与合规<br>Safety]
    H -.容量不足.-> B
```

图中：

  - 从需求出发先估算资源：模型多大、要多少并发、延迟目标是多少，决定用什么硬件、要不要压缩
  - 压缩后选择推理框架并转换格式，再封装成服务；上线后通过监控发现容量不足时回到估算环节
  - 安全与合规贯穿服务设计，并非最后才考虑

## 本系列文章

| 文章                                         | 回答的问题                                 |
| ------------------------------------------ | ------------------------------------- |
| [Frameworks](/0842_LM_Deploy_Frameworks)   | vLLM、SGLang、llama.cpp、OpenVINO 等怎样选   |
| [Format](/0843_LM_Deploy_Format)           | safetensors、GGUF、OpenVINO IR 等格式与转换流程 |
| [Sizing](/0844_LM_Deploy_Sizing)           | 需要多少显存、多少张卡，能支撑多少并发                   |
| [Service](/0845_LM_Deploy_Service)         | OpenAI 兼容 API、网关、扩缩容、Kubernetes       |
| [Ops](/0846_LM_Deploy_Ops)                 | 监控指标、日志、灰度、评估回归                       |
| [Safety](/0847_LM_Deploy_Safety)           | prompt injection、护栏、隐私与许可证            |
| [OpenVINO](/0848_LM_Deploy_OpenVINO)       | Intel 平台落地的完整命令示例                     |
| [Benchmark](/0849_LM_Deploy_Benchmark)     | 压测方法论：负载模型、并发扫描、容量与副本数                |
| [Kubernetes](/0850_LM_Deploy_Kubernetes)   | GPU 调度、权重缓存与冷启动、扩缩容、部署方案              |
| [Gateway](/0851_LM_Deploy_Gateway)         | 统一接口、级联路由、语义缓存、容灾                     |
| [ToolCalling](/0852_LM_Deploy_ToolCalling) | 函数调用的服务端实现、与 MCP 的关系、安全               |
| [MultiModal](/0853_LM_Deploy_MultiModal)   | VLM 部署：图像 token、视觉编码开销、资源估算           |
| [Edge](/0854_LM_Deploy_Edge)               | 端侧部署：AI PC、手机，模型选择与设备分工               |

表中：Frameworks、Format、Sizing 回答「能不能跑」，Service、Ops、Safety
回答「能不能稳定地跑」，OpenVINO 给出 Intel 平台的实操路径；Benchmark
到 Edge 六篇是对压测、编排、网关、工具调用、多模态和端侧等专题的展开。

## 常见部署形态

| 形态     | 典型硬件             | 特点                | 推荐框架                     |
| ------ | ---------------- | ----------------- | ------------------------ |
| 单机单卡   | 一张 GPU           | 最简单，适合 7B\~13B 量级 | vLLM、llama.cpp           |
| 单机多卡   | 多张 GPU           | 张量并行，适合 30B\~70B  | vLLM、TensorRT-LLM        |
| CPU/边缘 | 服务器 CPU、集成显卡、NPU | 低成本、延迟较高，需要量化     | llama.cpp、OpenVINO GenAI |
| 多机集群   | 多节点 GPU          | 超大模型、高并发，需要调度     | vLLM + Kubernetes、PD 分离  |

表中：`推荐框架` 是常见选择，不是唯一选择，具体对比见 [Frameworks](/0842_LM_Deploy_Frameworks)。

## 与其他文章

  - 推理性能原理：[Infer](/0819_LM_Infer)；压缩：[量化](/0312_MO_Quantization)
  - 多个 LoRA 共用同一基础模型：[Multi-LoRA Serving](/0572_LM_FT_MultiLoRAServing)
  - 检索增强：[RAG](/0461_LM_RAG)，部署工具 [OPEA](/0501_LM_Tools_OPEA)
  - 全流程：[Lifecycle](/0817_LM_Lifecycle)

## Reference

  - [vLLM Documentation](https://docs.vllm.ai/)
  - [OpenVINO GenAI](https://github.com/openvinotoolkit/openvino.genai)
  - [llama.cpp](https://github.com/ggml-org/llama.cpp)
