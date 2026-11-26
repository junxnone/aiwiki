-----

| Title     | LM Deploy Frameworks                                  |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T15:38:24Z`                                |
| Updated @ | `2026-11-26T15:43:03Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/842) |

-----

# Frameworks

大模型推理框架对比：vLLM、SGLang、TGI、TensorRT-LLM、llama.cpp、Ollama、OpenVINO GenAI
的定位、特点和选型方法。

## 框架做什么

推理框架在模型权重和用户请求之间，负责：加载模型、管理 KV Cache、调度批处理、执行优化后的算子、暴露
API。[Optimization](/0835_LM_Infer_Optimization) 里的技术大多以框架的形式提供给用户。

下图按目标硬件和使用场景把框架分类：

``` mermaid
flowchart TD
    A[选择框架] --> B{目标硬件?}
    B -->|NVIDIA GPU 服务器| C{追求?}
    C -->|通用/高并发/易用| V[vLLM / SGLang]
    C -->|极致性能| T[TensorRT-LLM]
    B -->|CPU / 边缘 / 笔记本| L{需要?}
    L -->|生态广/GGUF| LC[llama.cpp / Ollama]
    L -->|Intel CPU/GPU/NPU| OV[OpenVINO GenAI]
    B -->|多种硬件| M[vLLM 多后端 / ONNX Runtime]
```

图中：

  - 服务器 GPU 场景下，通用高并发选 vLLM 或 SGLang，追求极致性能且接受 NVIDIA 绑定选
    TensorRT-LLM；TGI 已进入维护模式，新项目不建议再选
  - CPU、笔记本和边缘设备选 llama.cpp 或 Ollama；Intel 平台选 OpenVINO GenAI，见
    [OpenVINO](/0848_LM_Deploy_OpenVINO)
  - 需要跨多种硬件时，选支持多后端的框架

## 对比

| 框架             | 主要硬件                    | 核心特点                                                 | 模型格式                        | 适合                |
| -------------- | ----------------------- | ---------------------------------------------------- | --------------------------- | ----------------- |
| vLLM           | NVIDIA、AMD、Intel GPU 等  | PagedAttention、continuous batching、OpenAI 兼容服务、量化支持广 | HF (safetensors)、GPTQ/AWQ 等 | 通用在线服务，首选         |
| SGLang         | NVIDIA、AMD              | RadixAttention 前缀缓存、结构化输出、编程接口                       | HF                          | 重复前缀多、结构化输出、Agent |
| TGI            | NVIDIA 等                | Hugging Face 官方；已进入维护模式，只接受小修复，官方推荐改用 vLLM、SGLang    | HF                          | 存量系统              |
| TensorRT-LLM   | NVIDIA                  | 内核深度优化，FP8/INT4，性能最高                                 | 需编译成 TensorRT engine        | 固定模型、极致性能         |
| llama.cpp      | CPU、Metal、CUDA、Vulkan   | C/C++ 实现、依赖少、量化类型丰富                                  | GGUF                        | 本地、边缘、CPU         |
| Ollama         | CPU、Metal、CUDA 等        | 一条命令拉取并运行模型；早期基于 llama.cpp，后来对部分模型引入了自己的引擎 `[待核实]`   | GGUF                        | 个人/开发测试           |
| OpenVINO GenAI | Intel CPU、集成/独立 GPU、NPU | 针对 Intel 优化，NNCF 压缩                                  | OpenVINO IR                 | Intel 平台部署        |
| LMDeploy       | NVIDIA                  | TurboMind 引擎，量化与服务                                   | HF                          | 国产模型常用            |

表中：`模型格式` 的差异决定了转换流程，见
[Format](/0843_LM_Deploy_Format)。支持的具体硬件、量化类型和模型会随版本变化，选型时以官方文档为准
`[待核实]`。

## 功能矩阵

| 功能                     | vLLM | SGLang             | TensorRT-LLM           | llama.cpp      | OpenVINO GenAI            |
| ---------------------- | ---- | ------------------ | ---------------------- | -------------- | ------------------------- |
| Continuous batching    | ✓    | ✓                  | ✓ (in-flight batching) | 部分 (多 slot 并行) | ✓ (ContinuousBatching 后端) |
| PagedAttention / 分页 KV | ✓    | ✓                  | ✓                      | \-             | ✓                         |
| 前缀缓存                   | ✓    | ✓ (RadixAttention) | ✓ (KV reuse)           | 部分 (slot 复用)   | ✓                         |
| 投机解码                   | ✓    | ✓                  | ✓                      | ✓ (draft 模型)   | ✓ (draft 模型)              |
| 多 LoRA                 | ✓    | ✓                  | ✓                      | ✓ (adapter)    | ✓ (adapter)               |
| 结构化输出                  | ✓    | ✓                  | ✓                      | ✓ (GBNF 语法)    | ✓                         |
| 多模态 (VLM)              | ✓    | ✓                  | ✓                      | ✓              | ✓ (VLMPipeline)           |
| 张量并行                   | ✓    | ✓                  | ✓                      | 部分             | 部分                        |

表中：✓ 表示官方已支持，「部分」表示支持方式或范围有限，`-` 表示没有该机制。各框架迭代很快，表中是截至 2026
年的概况，具体模型和硬件组合是否可用要查当前版本的文档 `[待核实]`。功能原理见
[Optimization](/0835_LM_Infer_Optimization)，多 LoRA 见 [Multi-LoRA
Serving](/0572_LM_FT_MultiLoRAServing)，结构化输出见
[StructuredOutput](/0840_LM_Infer_StructuredOutput)。

## 选型要考虑的因素

  - 硬件：NVIDIA 服务器优先 vLLM/SGLang；Intel/AMD 或 CPU 优先对应的原生框架
  - 负载：高并发的在线服务看吞吐和 goodput (continuous
    batching、前缀缓存)；单用户本地使用看单请求速度和安装便利
  - 模型：新模型架构的支持速度因框架而异，vLLM/llama.cpp 社区最活跃
  - 功能：结构化输出 (JSON)、函数调用、多 LoRA ([Multi-LoRA
    Serving](/0572_LM_FT_MultiLoRAServing))、投机解码、多模态
  - 量化：支持的量化格式 (GPTQ、AWQ、FP8、GGUF 的 Q4\_K\_M 等)，见
    [量化](/0312_MO_Quantization)
  - 运维：是否提供指标 (Prometheus)、是否易于容器化，见 [Ops](/0846_LM_Deploy_Ops)

## 快速上手示例

vLLM (OpenAI 兼容服务)：

    pip install vllm
    vllm serve meta-llama/Llama-3.1-8B-Instruct --port 8000 --max-model-len 8192

llama.cpp：

    llama-cli -m model-Q4_K_M.gguf -p "你好" -n 128
    llama-server -m model-Q4_K_M.gguf --port 8080     # OpenAI 兼容服务

Ollama：

    ollama run llama3.1

  - 以上命令的参数会随版本变化，以各自文档为准
  - 服务化与 API 见 [Service](/0845_LM_Deploy_Service)；资源估算见
    [Sizing](/0844_LM_Deploy_Sizing)

## 性能对比的注意事项

  - 对比必须使用相同的模型、精度、硬件、输入输出长度和并发；同一框架不同版本差距也可能很大
  - 同时报告 TTFT、TPOT 和吞吐，而不是单一指标，见 [Basics](/0834_LM_Infer_Basics)
  - 上线前用自己的真实流量分布做压测，不要直接采用厂商的基准数字

vLLM 自带的在线压测 (对已经启动的服务发请求)：

    vllm bench serve --backend vllm --model meta-llama/Llama-3.1-8B-Instruct \
      --endpoint /v1/completions --dataset-name sharegpt \
      --dataset-path ShareGPT_V3_unfiltered_cleaned_split.json --num-prompts 200

  - 输出 TTFT、TPOT、ITL (inter-token latency) 的均值与分位数，以及请求吞吐和 token 吞吐
  - 官方文档推荐用 GuideLLM 做更灵活的生产压测；OpenVINO 侧用 `llm_bench`，见
    [OpenVINO](/0848_LM_Deploy_OpenVINO)
  - 压测方法论 (负载模型、并发扫描、怎样读结果) 见 [Benchmark](/0849_LM_Deploy_Benchmark)

## 本站相关

  - 框架清单见 [大模型相关工具](/0497_LM_Tools)；RAG 部署工具见
    [OPEA](/0501_LM_Tools_OPEA)

## Reference

  - [vLLM Documentation](https://docs.vllm.ai/)
  - [SGLang](https://github.com/sgl-project/sglang)
  - [Text Generation Inference (maintenance
    mode)](https://github.com/huggingface/text-generation-inference)
  - [vLLM: Benchmark
    CLI](https://docs.vllm.ai/en/latest/benchmarking/cli.html)
  - [GuideLLM](https://github.com/vllm-project/guidellm)
  - [TensorRT-LLM](https://github.com/NVIDIA/TensorRT-LLM)
  - [llama.cpp](https://github.com/ggml-org/llama.cpp)
  - [OpenVINO GenAI](https://github.com/openvinotoolkit/openvino.genai)
