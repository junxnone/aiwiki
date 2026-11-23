---
Title | MO Quantization Tools
-- | --
Created @ | `2026-11-23T02:24:32Z`
Updated @| `2026-11-23T02:24:32Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/709)

---
# Tools

前面几篇讲的是算法，这一篇把它们落到**工具**上：想把一个模型量化并部署，有哪些常用的库、各自擅长什么、和哪些推理框架/硬件配套。本文只依据各项目官方 README / 文档中**明确写出**的内容整理（拉取时间：2026-11），没有核实到的位置一律标 `[待核实]`；工具迭代很快，实际使用请以官方文档为准。覆盖的工具：OpenVINO NNCF、PyTorch AO（torchao）、NVIDIA Model Optimizer（ModelOpt）、bitsandbytes、llama.cpp（GGUF）、vLLM 支持的量化格式（含 LLM Compressor、AutoAWQ、GPTQModel 等）。

**一句话概括：按"目标部署环境"选工具——OpenVINO 生态用 NNCF；PyTorch 原生与端侧（ExecuTorch）用 torchao；NVIDIA GPU 的 FP8/NVFP4 用 ModelOpt；QLoRA 微调与 8 bit 推理用 bitsandbytes；CPU/本地用 llama.cpp 的 GGUF；服务端高吞吐推理用 vLLM，并从它支持的格式（AWQ、GPTQ、FP8、compressed-tensors 等）反推要量化成什么格式。**

> 标注约定：未标注的内容来自各项目官方 README / 文档；`[解读]` 是整理时的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：总览 [量化](0312_MO_Quantization)；OpenVINO 的量化工具 [OpenVINO NNCF](0451_Tools_OV_NNCF)、[NNCF Training-time Optimization](0562_Tools_OV_NNCF_TTOP)、[模型精度](0450_x_Model_Precision)；模型优化总览 [模型性能优化技术](0471_MO)；算法篇 [基础原理](/0699_MO_Quantization_Basics)、[PTQ](/0702_MO_Quantization_PTQ)、[QAT](/0703_MO_Quantization_QAT)、[LLM 权重量化](/0706_MO_Quantization_LLM_Weight)、[LLM WA](/0707_MO_Quantization_LLM_WA)、[KV Cache](/0708_MO_Quantization_KVCache)；系列中的 [量化历史](/0688_MO_Quantization_History)。

## 1. 解决什么问题

- 算法论文多、实现分散；落地时要同时考虑：模型来自哪个框架（PyTorch/ONNX/OpenVINO/HF）、要部署到什么硬件（Intel CPU/GPU、NVIDIA GPU、手机、CPU）、用什么推理引擎；
- 同一个量化算法（如 GPTQ、AWQ）在不同工具里有各自的实现和导出格式，推理引擎只支持其中一部分；
- 本文给出"工具 × 能力 × 目标硬件"的对照，帮助从部署端反推方案。

## 2. 各工具概览

### 2.1 OpenVINO NNCF

NNCF（Neural Network Compression Framework）为 OpenVINO 优化神经网络推理，提供训练后与训练时两类压缩算法，支持 PyTorch、TorchFX、ONNX 与 OpenVINO 模型。官方 README 的算法支持表：

| 压缩算法 | OpenVINO | PyTorch | TorchFX | ONNX |
|---|---|---|---|---|
| 训练后量化（PTQ） | 支持 | 支持 | 实验性 | 支持 |
| 权重压缩（Weights Compression） | 支持 | 支持 | 实验性 | 支持 |
| 激活稀疏化 | 不支持 | 实验性 | 不支持 | 不支持 |

训练时压缩（仅 PyTorch）：量化感知训练（QAT）、带 LoRA 与 NLS 的仅权重 QAT、剪枝。README 称 NNCF PTQ 是应用 8 bit 量化最简单的方式，只需要模型与约 300 个样本的校准数据集，OpenVINO 是首选后端；用法是 `quantized_model = nncf.quantize(model, calibration_dataset)`；若 PTQ 不满足质量要求，可以对量化后的 PyTorch 模型再微调（QAT）。训练时算法的变化（旧版配置式 API 的移除等）见本站 [OpenVINO NNCF](0451_Tools_OV_NNCF)。

### 2.2 PyTorch AO（torchao）

torchao 提供 PyTorch 原生的量化、稀疏与低精度训练工具。README 列出的能力与数据点：

- 量化 API：`quantize_(model, config)`，例如 `Int4WeightOnlyConfig(group_size=32, ...)`、`Float8DynamicActivationFloat8WeightConfig(granularity=PerRow())`、`Int8WeightOnlyConfig`、`Int8DynamicActivationIntxWeightConfig` 等；
- 训练后量化：Llama-3-8B 的 int4 量化推理 1.89 倍加速、显存减少 58%；
- 量化感知训练（QAT）：`QATConfig(base_config, step="prepare")` 再 `step="convert"`；README 称在 Gemma3-4B 上用 QAT 可恢复 67% 的量化精度损失，QAT 已集成到 Unsloth、Axolotl 等微调框架；
- 低精度训练：float8 训练（Llama-3.1-70B 预训练快 1.5 倍）、MXFP8 训练、以及 8 bit/4 bit/FP8 的优化器（`AdamW8bit` 等）；
- 其他：2:4 半结构化稀疏、与 vLLM 集成的量化模型、与 ExecuTorch 配合部署到手机端（README 示例：int8 激活 + int4 权重量化的 Qwen3-4B 在 iPhone 15 Pro 上运行）。

### 2.3 NVIDIA Model Optimizer（ModelOpt）

NVIDIA Model Optimizer（原 TensorRT Model Optimizer）是一个包含多种模型优化技术的库，README 列出：量化、剪枝、神经架构搜索（NAS）、蒸馏、投机解码（speculative decoding）和稀疏化。输入可以是 Hugging Face、PyTorch 或 ONNX 模型；生成的量化 checkpoint 可部署到 SGLang、TensorRT-LLM、vLLM 等推理框架。README 中的量化相关内容：训练后量化（PTQ，宣称把模型体积压缩 2～4 倍）、QAT 与 QAD（量化感知蒸馏）、FP8 与 NVFP4 格式（NVFP4 支持自 2025 年 1 月起加入）、AutoQuantize（快速自动混合精度分配）等；README 的新闻列表里还有 NVFP4 W4A4 的 PTQ + QAD 教程等。具体算法与支持矩阵见其"Support Matrix" `[待核实：详细支持哪些模型与格式未逐项读取]`。

### 2.4 bitsandbytes

bitsandbytes 通过 k-bit 量化让大语言模型更易使用，提供三个主要功能：8 bit 优化器（块级量化，以很小的显存代价保持 32 位性能）、**LLM.int8()**（8 bit 量化推理，显存减半且无性能退化，基于向量级量化 + 离群值的混合精度分解）、**QLoRA 4 bit 量化**（把模型量化到 4 bit 并插入一小组可训练的 LoRA 权重）。算子包括 `Linear8bitLt`、`Linear4bit` 与 `bitsandbytes.optim`。它已集成到 Hugging Face Transformers、Diffusers 与 PEFT。硬件方面，README 的支持表显示 Linux x86-64 的 CPU（最低 AVX2）与 NVIDIA GPU（SM60 以上，推荐 SM75 以上）都支持三项功能；其他平台见官方表格。算法背景见 [LLM WA](/0707_MO_Quantization_LLM_WA) 与 [数据类型](/0700_MO_Quantization_DataType)。

### 2.5 llama.cpp 与 GGUF

llama.cpp 的 `llama-quantize` 工具把 GGUF 格式的输入模型（通常是 F32 或 BF16 这类高精度格式）转换成量化格式。流程是：①用 `convert_hf_to_gguf.py` 把原始模型转成 GGUF；②用 `llama-quantize` 量化，例如 `llama-quantize input.gguf output-Q4_K_M.gguf Q4_K_M`。关键选项（README 列出）：

- `--imatrix file`：用重要性矩阵（importance matrix）数据优化量化，可减少精度损失；
- `--include-weights` / `--exclude-weights`：指定哪些张量使用重要性矩阵；
- `--output-tensor-type`、`--token-embedding-type`、`--tensor-type`：为输出张量、词嵌入或按正则匹配的张量单独指定量化类型；
- `--prune-layers`：剪掉指定层；`--leave-output-tensor`、`--pure` 等。

多模态模型需要另外量化投影器文件（`--mmproj`）。README 里用 Q4_K_M 作示例；Hugging Face 上的 GGUF-my-repo 空间可以免安装生成量化模型。GGUF 是**文件格式**，格式细节见 [LLM 权重量化](/0706_MO_Quantization_LLM_Weight)。

### 2.6 vLLM 支持的量化格式

vLLM 文档建议用 **LLM Compressor** 对模型做量化（支持 FP8、INT8、INT4 等量化格式），并列出了支持的量化方案：AutoAWQ、BitsAndBytes、GPTQModel、Intel Neural Compressor、LLM Compressor（FP8 W8A8、INT4 W4A16、INT8 W4A8、INT8 W8A8）、NVIDIA Model Optimizer、AMD Quark、TorchAO、GGUF 等。文档中的"实现 × 硬件"兼容性表（节选；✅ 表示支持，❌ 表示不支持）：

| 实现 | Volta | Turing | Ampere | Ada | Hopper | AMD GPU | Intel GPU | x86 CPU | Arm CPU |
|---|---|---|---|---|---|---|---|---|---|
| AWQ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| GPTQ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Marlin（GPTQ/AWQ/FP8/FP4） | ❌ | ✅* | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| llm-compressor INT8（W8A8） | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| llm-compressor INT8（W4A8） | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| llm-compressor FP8（W8A8） | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| bitsandbytes | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| GGUF | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

表中：

- 第一列是 vLLM 中的量化实现，后面各列是硬件平台（Volta=SM 7.0、Turing=SM 7.5、Ampere=SM 8.0/8.6、Ada=SM 8.9、Hopper=SM 9.0），单元格表示该实现在该平台是否被支持；星号表示 Turing 不支持 Marlin 的 MXFP4；
- 从表可以直接读出选型约束：例如 FP8 W8A8 需要 Ada 及以上（或 AMD GPU）；AWQ、GPTQ 覆盖面广；GGUF 在 NVIDIA 各代与 AMD GPU 上可用；
- 表是文档节选，完整内容与最新状态请查 vLLM 官方文档（量化方式、NVFP4 的 compressed-tensors 检查点等也在迅速变化）。

## 3. 能力对照

| 工具 | 主要定位 | PTQ | QAT / 微调 | 典型格式 | 主要目标 |
|---|---|---|---|---|---|
| NNCF | OpenVINO 模型压缩 | 8 bit PTQ、权重压缩 | QAT、LoRA+NLS 的仅权重 QAT、剪枝 | OpenVINO IR / ONNX | Intel CPU/GPU 等（OpenVINO 运行时） |
| torchao | PyTorch 原生量化/稀疏/低精度训练 | int4/int8/float8 等 | QAT；float8/MXFP8 训练 | PyTorch 张量子类 | PyTorch 服务端、ExecuTorch 端侧 |
| ModelOpt | NVIDIA 多技术优化库 | FP8、NVFP4 等 | QAT、QAD | 量化 checkpoint（TensorRT-LLM/vLLM/SGLang） | NVIDIA GPU |
| bitsandbytes | k-bit 量化库 | LLM.int8() | QLoRA（4 bit 微调）；8 bit 优化器 | 与 HF 集成 | NVIDIA GPU / x86 CPU 等 |
| llama.cpp | 本地推理与 GGUF 量化 | Q2_K～Q8_0 等 | — | GGUF | CPU 与多种本地后端 |
| vLLM | 服务端推理引擎 | 推荐用 LLM Compressor | — | AWQ/GPTQ/FP8/compressed-tensors/GGUF 等 | NVIDIA/AMD/Intel GPU、CPU |

表中：

- 第一列是工具，第二列是定位，第三、四列是是否做 PTQ 与 QAT/微调，第五列是产出的格式，第六列是主要的目标硬件；
- "—"表示该工具不提供对应功能（vLLM 是推理引擎，主要负责加载与运行量化模型）；
- 表中内容均来自上文各工具 README 中明确写出的描述；Q2_K～Q8_0 的位宽范围取自本站 [量化](0312_MO_Quantization) 的描述，llama.cpp README 本身只用 Q4_K_M、Q5_K_M、Q3_K_M、Q8_0 作示例 `[待核实]`。

## 4. 选型流程

下图是从目标部署环境反推量化方案的决策流程。

```
训练好的 FP32/BF16 模型
   │
   ├─ 部署在 OpenVINO（Intel CPU/GPU/NPU）？ ── 是 ─► NNCF：PTQ（8 bit）/ 权重压缩 → 精度不够再 QAT
   │
   ├─ 部署在 NVIDIA GPU 的高吞吐服务？ ───────── 是 ─► ModelOpt（FP8/NVFP4）或 LLM Compressor / AWQ / GPTQ
   │                                                   → 在 vLLM / TensorRT-LLM / SGLang 里加载
   │
   ├─ 本地 CPU / 笔记本 / 边缘？ ─────────────── 是 ─► llama.cpp：转 GGUF → llama-quantize（可带 imatrix）
   │
   ├─ 手机端（PyTorch 生态）？ ───────────────── 是 ─► torchao 量化 + ExecuTorch
   │
   └─ 想在单卡上微调大模型？ ─────────────────── 是 ─► bitsandbytes QLoRA（4 bit NF4）
```

图中：

- 从上到下依次判断目标部署环境，每个分支给出主要使用的工具与格式；
- 箭头右侧是推荐的做法，括号内是位宽/格式；各分支并不互斥（例如服务端可同时试 AWQ 与 FP8）；
- 第一步建议总是先看目标推理引擎支持的量化格式（见上面 vLLM 的表），再选择能导出该格式的工具 `[经验]`。

## 5. 总结 [解读]

- **先选部署端，再选工具**：量化格式必须被推理引擎支持，否则再好的量化精度也无法落地；
- 训练后量化优先，精度不够再上 QAT（见 [QAT](/0703_MO_Quantization_QAT)）；LLM 场景默认 INT4（AWQ/GPTQ）或 FP8，本地 CPU 默认 GGUF 的 Q4_K_M；
- 工具链变化很快（例如 NNCF 的训练时算法、ModelOpt 的格式支持、vLLM 的内核后端都在持续更新），本文只作入口索引。

## Reference

- OpenVINO NNCF. https://github.com/openvinotoolkit/nncf （README）
- PyTorch AO（torchao）. https://github.com/pytorch/ao （README）
- NVIDIA Model Optimizer. https://github.com/NVIDIA/TensorRT-Model-Optimizer （README；文档站点 https://nvidia.github.io/Model-Optimizer）
- bitsandbytes. https://github.com/bitsandbytes-foundation/bitsandbytes （README）
- llama.cpp 的 quantize 工具. https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/README.md
- vLLM Quantization. https://github.com/vllm-project/vllm/blob/main/docs/features/quantization/README.md

