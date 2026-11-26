-----

| Title     | LM Deploy Edge                                        |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T15:40:55Z`                                |
| Updated @ | `2026-11-26T15:43:31Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/854) |

-----

# Edge

端侧部署：在 AI PC、手机、嵌入式设备上运行大模型，受哪些约束，怎样选模型和量化，CPU、GPU、NPU 怎样分工，以及常用的运行时。

## 端侧的约束

| 约束    | 典型情况                                    | 影响                   |
| ----- | --------------------------------------- | -------------------- |
| 内存容量  | 8\~32 GB，且与系统和其他应用共享                    | 决定能跑多大的模型            |
| 内存带宽  | 约 $50\\sim150$ GB/s (LPDDR5/5X) `[待核实]` | 决定 decode 速度         |
| 功耗与发热 | 电池供电，持续高负载会降频                           | 长时间生成速度下降            |
| 算力    | 集成显卡、NPU 的算力有限                          | 决定 prefill 速度 (TTFT) |
| 存储与下载 | 模型文件需要下载和存储                             | 模型体积直接影响体验           |

表中：端侧和服务器一样是「带宽决定 decode」，但带宽只有服务器的几分之一到十几分之一，所以模型必须小、必须量化。

## 能跑多大、多快

$$ \\text{tokens/s}\\le\\frac{\\eta\\cdot\\text{BW}}{N\\cdot
b\_w},\\qquad M\\approx N\\cdot b\_w+\\text{KV}+\\text{运行时开销} $$

其中：

  - $N$：参数量；$b\_w$：每参数字节数 (INT4 约
    $0.5\\sim0.6$)；$\\text{BW}$：内存带宽；$\\eta$：带宽利用率 (约
    $0.6\\sim0.8$)
  - $M$：需要的内存；KV 公式见 [Basics](/0834_LM_Infer_Basics)，端侧并发为 $1$，上下文通常也较短

| 模型 (INT4) | 权重体积 (约) | $100$ GB/s 下的 decode 上限 ($\\eta=0.7$) |
| --------- | -------- | ------------------------------------- |
| 1B        | $0.6$ GB | $\\approx117$ tokens/s                |
| 3B        | $1.8$ GB | $\\approx39$ tokens/s                 |
| 8B        | $4.7$ GB | $\\approx15$ tokens/s                 |

表中：人阅读速度大约每秒 $5\\sim8$ 个 token 即可流畅 `[经验]`，所以 $100$ GB/s 的设备上 3B\~8B 的
INT4 模型可以满足对话；8B 以上在大多数端侧设备上会偏慢，还要考虑内存是否被其他应用占用。

## 设备分工

| 设备     | 擅长              | 端侧大模型中的角色                        |
| ------ | --------------- | -------------------------------- |
| CPU    | 通用、灵活           | 小模型、兼容性兜底，控制逻辑                   |
| 集成 GPU | 并行计算，带宽与 CPU 共享 | 主力推理，prefill 比 CPU 快             |
| NPU    | 低功耗的矩阵运算        | 长时间运行、对功耗敏感的场景；对模型格式、算子和静态形状限制较多 |

表中：同一台 AI PC 上 CPU、GPU、NPU 共享同一块内存，带宽上限相同，所以三者的 decode 速度差别不像算力差别那么大，NPU
的优势主要在能效。OpenVINO 中通过设备名 (`CPU`、`GPU`、`NPU`) 选择，见
[OpenVINO](/0848_LM_Deploy_OpenVINO)。

## 模型选择与压缩

  - 选小而强的模型：近年的 1B\~8B 模型在很多任务上已足够，优先选专门为端侧优化或蒸馏得到的版本，见
    [蒸馏](/0207_MO_KD)
  - 量化：INT4 权重压缩是端侧的标准做法，敏感层保留 INT8；用数据感知的压缩 (AWQ 等) 减少精度损失，见
    [量化](/0312_MO_Quantization)
  - 上下文：限制最大上下文长度，控制 KV 的内存；需要知识库时用检索只取相关片段，见 [RAG](/0461_LM_RAG)
  - 投机解码：端侧带宽极其受限，用小 draft 模型加速大模型效果明显，见
    [Speculative](/0837_LM_Infer_Speculative)

## 运行时

| 运行时                | 平台                                | 说明                                                     |
| ------------------ | --------------------------------- | ------------------------------------------------------ |
| OpenVINO GenAI     | Intel AI PC (CPU/GPU/NPU)         | 见 [OpenVINO](/0848_LM_Deploy_OpenVINO)                 |
| llama.cpp / Ollama | 跨平台 (Windows、macOS、Linux、Android) | GGUF 量化，生态广，见 [Frameworks](/0842_LM_Deploy_Frameworks) |
| MLX                | Apple Silicon                     | Apple 的数组框架                                            |
| ONNX Runtime GenAI | 跨平台                               | 支持 DirectML 等后端                                        |
| 手机厂商 SDK           | Android/iOS                       | 调用手机 NPU                                               |

表中：选择运行时首先看目标硬件，其次看是否支持所需模型和量化格式。

## 工程要点

  - 首次加载与编译：模型首次加载 (尤其是 GPU/NPU) 有编译开销，用模型缓存减少后续启动时间
  - 内存压力：系统内存不足时会换页，速度急剧下降；提供不同大小的模型供不同配置的设备选择
  - 隐私与离线：端侧部署的主要优势是数据不出设备、可离线使用，适合个人数据相关的场景
  - 更新：模型文件大，增量更新或按需下载 LoRA 适配器可以减少下载量

## Reference

  - [OpenVINO GenAI](https://github.com/openvinotoolkit/openvino.genai)
  - [llama.cpp](https://github.com/ggml-org/llama.cpp)
  - [MLX](https://github.com/ml-explore/mlx)
  - [ONNX Runtime GenAI](https://github.com/microsoft/onnxruntime-genai)
  - [LLM in a flash: Efficient Large Language Model Inference with
    Limited Memory](https://arxiv.org/abs/2312.11514)
