-----

| Title     | LM Deploy Format                                      |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T15:38:37Z`                                |
| Updated @ | `2026-11-26T15:43:05Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/843) |

-----

# Format

大模型的模型格式与转换：safetensors、GGUF、ONNX、OpenVINO IR 的特点，Hugging Face
模型转到目标框架的流程，以及 chat template、分词器和量化格式的一致性检查。

## 一个模型由什么组成

一个可部署的模型目录通常包含：

| 文件                                         | 内容                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| `config.json`                              | 结构配置 (层数、隐藏维度、头数、词表大小等)                                                        |
| `*.safetensors` (分片)                       | 权重                                                                             |
| `tokenizer.json` / `tokenizer_config.json` | 分词器与 chat template，见 [Tokenizer](/0822_LM_Train_Tokenizer)                     |
| `generation_config.json`                   | 默认的生成参数 (temperature、top-p、eos 等)，见 [LLM Parameters](/0502_LM_LLMs_Parameters) |

表中：缺少任何一项都可能导致推理结果异常，特别是分词器和 chat template，它们必须与训练时的一致。

## 常见格式

| 格式                   | 来源           | 特点                              | 使用方                 |
| -------------------- | ------------ | ------------------------------- | ------------------- |
| safetensors          | Hugging Face | 只存张量，不能执行代码，安全；支持内存映射，加载快       | HF、vLLM、SGLang、TGI  |
| PyTorch `.bin`/`.pt` | PyTorch      | 基于 pickle，加载时可能执行任意代码，不安全       | 老模型                 |
| GGUF                 | llama.cpp    | 单文件，包含权重、分词器和元数据，量化类型丰富         | llama.cpp、Ollama    |
| ONNX                 | ONNX         | 计算图 + 权重，跨框架                    | ONNX Runtime 等      |
| OpenVINO IR          | Intel        | `.xml` (图) + `.bin` (权重)，支持权重压缩 | OpenVINO GenAI、OVMS |
| TensorRT engine      | NVIDIA       | 针对具体 GPU 编译的二进制，不可跨 GPU 型号      | TensorRT-LLM        |

表中：下载来源不明的 `.bin`/`.pt` 文件有安全风险，优先使用 safetensors；TensorRT engine 与 GPU
型号和版本绑定，换卡需重新编译。

## 转换流程

下图是从 Hugging Face 模型出发，转换到不同推理框架的路径：

``` mermaid
flowchart LR
    HF[Hugging Face 模型<br>safetensors] --> V[vLLM / SGLang<br>直接加载]
    HF --> G[convert_hf_to_gguf.py] --> GQ[llama-quantize<br>Q4_K_M 等] --> L[llama.cpp / Ollama]
    HF --> O[optimum-cli export openvino<br>--weight-format int4] --> OV[OpenVINO GenAI]
    HF --> T[trtllm-build] --> TR[TensorRT-LLM]
    HF --> Q[AutoAWQ / GPTQ] --> V
```

图中：

  - vLLM、SGLang 可以直接加载 Hugging Face 格式，量化格式 (AWQ/GPTQ) 也以 HF 目录形式提供
  - llama.cpp 要先转成 GGUF，再选择量化类型；OpenVINO 通过 `optimum-cli` 导出为 IR
    并可同时压缩权重；TensorRT-LLM 需要编译 engine

命令示例：

    # GGUF
    python convert_hf_to_gguf.py ./Llama-3.1-8B-Instruct --outfile model-f16.gguf
    llama-quantize model-f16.gguf model-Q4_K_M.gguf Q4_K_M
    
    # OpenVINO IR (INT4 权重压缩)
    optimum-cli export openvino --model meta-llama/Llama-3.1-8B-Instruct --weight-format int4 ov_model/

  - 参数随版本变化，以官方文档为准；OpenVINO 的完整流程见 [OpenVINO](/0848_LM_Deploy_OpenVINO)

## 量化格式

| 格式              | 方法                  | 说明                                                    |
| --------------- | ------------------- | ----------------------------------------------------- |
| GPTQ            | 逐层二阶误差补偿            | 需要校准数据，4-bit 常见                                       |
| AWQ             | 保护重要通道的激活感知量化       | 速度和精度好，4-bit 常见                                       |
| GGUF Q4\_K\_M 等 | 分块 (super-block) 量化 | llama.cpp 专用，Q 后的数字是位宽，K 表示 k-quant 分块方案，`_M` 为中等混合精度 |
| FP8             | 8-bit 浮点            | 新一代 GPU 支持，精度损失小                                      |
| NNCF INT4/INT8  | 权重压缩                | OpenVINO 配套                                           |

表中：原理见 [LLM Weight](/0706_MO_Quantization_LLM_Weight)，位格式见
[DataType](/0700_MO_Quantization_DataType)；选择时要同时考虑目标框架是否支持，例如 GGUF 只能用于
llama.cpp 系。

## 一致性检查清单

  - chat template：用部署框架实际渲染一遍提示词，与训练/参考实现逐字符对比；常见的错误是缺少 system
    提示、多余的空格或换行、缺少 `add_generation_prompt`
  - 特殊 token：BOS/EOS/PAD 的 ID 和停止词设置是否一致，否则会出现不停止生成或提前停止
  - 精度回归：转换或量化后，用固定的小评测集比较困惑度和关键任务指标，见 [Eval](/0827_LM_Train_Eval)
  - 数值对齐：用同一个输入比较转换前后的 logits，最大差异应在预期范围内 (BF16 约 $10^{-2}$ 量级，量化后更大)
    `[经验]`
  - 上下文长度：`max_position_embeddings`、RoPE 缩放配置在转换后保持一致

## Reference

  - [safetensors](https://github.com/huggingface/safetensors)
  - [GGUF
    specification](https://github.com/ggml-org/ggml/blob/master/docs/gguf.md)
  - [optimum-intel](https://github.com/huggingface/optimum-intel)
  - [Hugging Face: Chat
    templates](https://huggingface.co/docs/transformers/chat_templating)
  - [OpenVINO Model Preparation](https://docs.openvino.ai/)
