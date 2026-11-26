-----

| Title     | LM Lifecycle                                          |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T15:32:57Z`                                |
| Updated @ | `2026-11-26T15:41:47Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/817) |

-----

# Lifecycle

大模型从数据到线上服务的完整生命周期：每个阶段做什么、输入输出是什么、主要消耗什么资源，以及本站对应的文章。这是 [大模型](/0408_LM)
系列中「训练 → 推理 → 部署」主线的入口。

## 全流程

下图把一个大语言模型从零开始到上线运行的过程拆成六个阶段，实线是主流程，虚线是反馈：

``` mermaid
flowchart LR
    A[数据<br>采集/清洗/配比] --> B[预训练<br>学习语言与知识]
    B --> C[对齐与微调<br>SFT / RLHF / DPO / LoRA]
    C --> D[压缩<br>量化 / 蒸馏]
    D --> E[推理引擎<br>KV Cache / 批处理]
    E --> F[服务化与运维<br>API / 监控 / 安全]
    F -.线上数据与反馈.-> A
    F -.评估回归.-> C
```

图中：

  - 前三个阶段属于「训练」：预训练得到基础模型 (base)，对齐和微调使模型会听指令、符合偏好，或适配某个领域
  - 压缩是训练与部署之间的桥：把训练好的大模型变小、变快，使其能在目标硬件上跑得起来
  - 后两个阶段属于「推理与部署」：推理引擎负责高效生成，服务化负责对外提供稳定、安全的接口
  - 虚线表示闭环：线上的真实数据和评估结果会反过来影响数据构造和后续的微调

## 各阶段概览

| 阶段    | 输入             | 输出            | 主要资源             | 典型规模         | 文章                                                                                                                    |
| ----- | -------------- | ------------- | ---------------- | ------------ | --------------------------------------------------------------------------------------------------------------------- |
| 数据    | 网页、书籍、代码等原始语料  | 清洗后的 token 序列 | CPU、存储           | 万亿 token 量级  | [Data](/0821_LM_Train_Data)、[Tokenizer](/0822_LM_Train_Tokenizer)                                                     |
| 预训练   | token 序列       | 基础模型          | 大规模 GPU 集群       | 数十万 GPU 小时   | [Pretrain](/0824_LM_Train_Pretrain)、[Distributed](/0825_LM_Train_Distributed)、[Efficiency](/0826_LM_Train_Efficiency) |
| 对齐/微调 | 基础模型 + 指令/偏好数据 | 对话/领域模型       | 少量到数十 GPU        | 数小时到数天       | [微调](/0410_LM_FT)、[对齐](/0568_LM_FT_Alignment)、[推理训练](/0833_LM_FT_Reasoning)                                           |
| 压缩    | 训练好的模型         | 量化/蒸馏后的小模型    | 单卡               | 分钟到数小时       | [量化](/0312_MO_Quantization)、[蒸馏](/0207_MO_KD)                                                                         |
| 推理    | 模型 + 请求        | 生成的文本         | GPU/CPU 的算力与显存带宽 | 毫秒级 token 延迟 | [Infer](/0819_LM_Infer)                                                                                               |
| 部署与运维 | 模型 + 流量        | 稳定的在线服务       | 服务集群             | 7×24         | [Deploy](/0820_LM_Deploy)                                                                                             |

表中：`主要资源` 指该阶段最紧张的资源；`典型规模`
是量级而不是精确值。预训练的算力消耗比后面所有阶段高几个数量级，而线上推理的累计成本往往随用户量持续增长，最终超过训练成本。

## 贯穿全流程的几个量

$$ C\_{train}\\approx6,N,D,\\qquad C\_{infer}\\approx2,N\\
\\text{FLOPs/token} $$

其中：

  - $N$：模型参数量；$D$：训练用的 token 数；$C\_{train}$：训练的总计算量 (FLOPs)，系数 $6$ 来自前向
    $2N$ + 反向 $4N$
  - $C\_{infer}$：推理时每生成一个 token 的计算量，只有前向，所以是 $2N$
  - 同样的参数量 $N$ 决定了：训练要多少算力，推理的显存占用 (权重 $\\approx N\\times$
    每参数字节数)，以及推理速度的上限
  - 例：$N=7\\times10^9$，$D=2\\times10^{12}$ 时，$6ND=8.4\\times10^{22}$
    FLOPs，推导见 [Pretrain](/0824_LM_Train_Pretrain)

## 三条主线

  - 训练：怎样把模型训出来，见 [Train](/0818_LM_Train)
  - 推理：模型怎样高效地生成，见 [Infer](/0819_LM_Infer)
  - 部署：怎样稳定地对外服务，见 [Deploy](/0820_LM_Deploy)

已有文章 (微调 [LM FT](/0410_LM_FT)、对齐 [Alignment](/0568_LM_FT_Alignment)、[多
LoRA
服务](/0572_LM_FT_MultiLoRAServing)、[RAG](/0461_LM_RAG)、[量化](/0312_MO_Quantization))
不重复展开，只在对应位置链接。

## 阅读路径

  - 想训练或微调自己的模型：Train 系列 → [微调](/0410_LM_FT) →
    [对齐](/0568_LM_FT_Alignment)
  - 想把现有模型跑起来：[Infer Basics](/0834_LM_Infer_Basics) →
    [Frameworks](/0842_LM_Deploy_Frameworks) →
    [Sizing](/0844_LM_Deploy_Sizing) →
    [Service](/0845_LM_Deploy_Service)
  - 想在 Intel 平台部署：[Format](/0843_LM_Deploy_Format) →
    [OpenVINO](/0848_LM_Deploy_OpenVINO) → [量化](/0312_MO_Quantization)

## Reference

  - [Training Compute-Optimal Large Language Models
    (Chinchilla)](https://arxiv.org/abs/2203.15556)
  - [Efficient Memory Management for Large Language Model Serving with
    PagedAttention](https://arxiv.org/abs/2309.06180)
  - [Llama 2: Open Foundation and Fine-Tuned Chat
    Models](https://arxiv.org/abs/2307.09288)
