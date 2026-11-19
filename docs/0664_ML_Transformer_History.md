---
Title | ML Transformer History
-- | --
Created @ | `2026-11-19T05:16:38Z`
Updated @| `2026-11-19T06:11:51Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/664)

---
# Transformer History

> [Transformer 发展时间线](https://junxnone.github.io/jstools/timelinemd/?md=https://raw.githubusercontent.com/junxnone/aiwiki/main/docs/0664_ML_Transformer_History.md)

## NLP

### 2017-06  Transformer

**Attention Is All You Need**：提出完全基于 Self-Attention 的 Encoder-Decoder 架构，Transformer 的起点。

[[Paper](https://arxiv.org/pdf/1706.03762.pdf)] [[Code](https://nbviewer.jupyter.org/github/tensorflow/docs/blob/master/site/en/tutorials/text/transformer.ipynb)] [[Note](https://github.com/junxnone/tech-io/issues/756)]

### 2018-06  GPT-1

**Improving Language Understanding by Generative Pre-Training**：Decoder-only 的「生成式预训练 + 微调」范式。

### 2018-10  BERT

**BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding**：Encoder-only 的双向预训练语言模型。

[[Paper](https://arxiv.org/abs/1810.04805)]

### 2019-02  GPT-2

**Language Models are Unsupervised Multitask Learners**：1.5B 参数，展示零样本多任务能力。

### 2019-10  T5

**Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer**：把所有 NLP 任务统一为 text-to-text 的 Encoder-Decoder 模型。

[[Paper](https://arxiv.org/abs/1910.10683)]

### 2019-11  MQA

**Fast Transformer Decoding: One Write-Head is All You Need**：Multi-Query Attention，多个 query head 共享一组 K/V，降低推理时 KV Cache 开销。#Optimization

[[Paper](https://arxiv.org/abs/1911.02150)]

### 2020-01  Scaling Laws

**Scaling Laws for Neural Language Models**：模型效果随参数量、数据量、算力呈幂律提升。

[[Paper](https://arxiv.org/abs/2001.08361)]

### 2020-05  GPT-3

**Language Models are Few-Shot Learners**：175B 参数，展示 In-Context Learning 能力。

[[Paper](https://arxiv.org/abs/2005.14165)]

### 2020-06  Linformer

**Linformer: Self-Attention with Linear Complexity**：用低秩投影把 Attention 复杂度降为线性。#Optimization

[[Paper](https://arxiv.org/abs/2006.04768)] [[Code](https://github.com/lucidrains/linformer)] [[Note](https://github.com/junxnone/tech-io/issues/932)]

### 2020-08  DeLighT

**DeLighT: Deep and Light-weight Transformer**：更深但更轻量的 Transformer。#Optimization

[[Paper](https://arxiv.org/abs/2008.00623)] [[Code](https://github.com/sacmehta/delight)]

### 2021-01  Switch Transformer

**Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity**：用稀疏 MoE 把参数规模扩展到万亿级。

[[Paper](https://arxiv.org/abs/2101.03961)]

### 2021-02  Nyströmformer

**A Nyström-Based Algorithm for Approximating Self-Attention**：用 Nyström 方法近似 Self-Attention。#Optimization

[[Paper](https://arxiv.org/abs/2102.03902)] [[Code](https://github.com/mlpen/Nystromformer)] [[Note](https://github.com/junxnone/tech-io/issues/935)]

### 2021-04  RoPE

**RoFormer: Enhanced Transformer with Rotary Position Embedding**：旋转位置编码，后来成为主流 LLM 的标配位置编码。

[[Paper](https://arxiv.org/abs/2104.09864)]

### 2022-03  Chinchilla

**Training Compute-Optimal Large Language Models**：给定算力下，参数量与训练 token 数应同比例增长。

[[Paper](https://arxiv.org/abs/2203.15556)]

### 2022-05  FlashAttention

**FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness**：通过分块计算减少显存读写，在不近似的前提下加速 Attention。#Optimization

[[Paper](https://arxiv.org/abs/2205.14135)]

### 2022-11  ChatGPT

OpenAI 发布基于 GPT-3.5 的对话产品，Transformer 大模型进入大众视野。

### 2023-02  LLaMA

**LLaMA: Open and Efficient Foundation Language Models**：开源基础模型，带动开源 LLM 生态。

[[Paper](https://arxiv.org/abs/2302.13971)]

### 2023-03  GPT-4

OpenAI 发布多模态大模型 GPT-4。

### 2023-05  GQA

**GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints**：Grouped-Query Attention，介于 MHA 与 MQA 之间。#Optimization

[[Paper](https://arxiv.org/abs/2305.13245)]

### 2023-07  FlashAttention-2

**FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning**。#Optimization

[[Paper](https://arxiv.org/abs/2307.08691)]

### 2023-07  Llama 2

**Llama 2: Open Foundation and Fine-Tuned Chat Models**。

[[Paper](https://arxiv.org/abs/2307.09288)]

### 2023-09  vLLM

**Efficient Memory Management for Large Language Model Serving with PagedAttention**：用分页方式管理 KV Cache，提升推理吞吐。#Optimization

[[Paper](https://arxiv.org/abs/2309.06180)]

### 2023-12  Mamba

**Mamba: Linear-Time Sequence Modeling with Selective State Spaces**：基于选择性状态空间模型、不使用 Attention 的序列模型，线性复杂度，成为 Transformer 的有力替代方案。

[[Paper](https://arxiv.org/abs/2312.00752)]

### 2024-01  Mixtral

**Mixtral of Experts**：开源稀疏 MoE 大模型。

[[Paper](https://arxiv.org/abs/2401.04088)]

### 2024-05  DeepSeek-V2

**DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-Experts Language Model**：提出 MLA（Multi-head Latent Attention），压缩 KV Cache。#Optimization

[[Paper](https://arxiv.org/abs/2405.04434)]

### 2024-12  DeepSeek-V3

**DeepSeek-V3 Technical Report**：671B 总参数、37B 激活的 MoE 模型，采用 MLA + DeepSeekMoE + Multi-Token Prediction，训练成本低。

[[Paper](https://arxiv.org/abs/2412.19437)]

### 2025-01  DeepSeek-R1

**DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning**：通过强化学习激发推理能力的开源推理模型。

[[Paper](https://arxiv.org/abs/2501.12948)]

### 2025-02  NSA

**Native Sparse Attention: Hardware-Aligned and Natively Trainable Sparse Attention**：硬件对齐、可端到端训练的稀疏注意力。#Optimization

[[Paper](https://arxiv.org/abs/2502.11089)]

### 2025-04  Llama 4

Meta 发布 Llama 4（Scout / Maverick），首批原生多模态的开源 MoE Llama 模型。

### 2025-04  Qwen3

阿里发布 Qwen3 系列，包含稠密与 MoE 模型，支持思考 / 非思考模式切换。

### 2025-08  GPT-5

OpenAI 发布 GPT-5。

### 2025-09  DeepSeek-V3.2-Exp

DeepSeek 发布 V3.2-Exp，首次引入 DeepSeek Sparse Attention（DSA），降低长上下文成本。#Optimization

### 2025-10  Kimi Linear

**Kimi Linear: An Expressive, Efficient Attention Architecture**：线性注意力与全注意力混合的架构。#Optimization

[[Paper](https://arxiv.org/abs/2510.26692)]

### 2025-11  Gemini 3

Google 发布 Gemini 3 Pro。

### 2025-12  DeepSeek-V3.2

DeepSeek 发布正式版 V3.2 及 V3.2-Speciale，采用 DSA 稀疏注意力。#Optimization

[[Paper](https://arxiv.org/abs/2512.02556)]

### 2026-02  Qwen3.5

阿里发布开源 Qwen3.5 系列，采用 Gated DeltaNet 线性注意力与全注意力 3:1 交替的混合架构，原生多模态。#Optimization

### 2026-04  DeepSeek-V4

DeepSeek 发布 V4（V4-Pro 1.6T 总参数 / 49B 激活，V4-Flash 284B / 13B），采用压缩稀疏注意力（CSA）与重度压缩注意力（HCA）混合的注意力设计，上下文长度 1M，KV Cache 大幅压缩。#Optimization

## Vision

### 2020-05  DETR

**End-to-End Object Detection with Transformers**：用 Transformer 做端到端目标检测。#ObjectDetection #Segmentation

[[Paper](https://arxiv.org/abs/2005.12872v3)] [[Code](https://github.com/facebookresearch/detr)]

### 2020-07  iGPT

**Generative Pretraining from Pixels**：在像素序列上做 GPT 式生成预训练。#Classification

[[Paper](https://cdn.openai.com/papers/Generative_Pretraining_from_Pixels_V2.pdf)] [[Code](https://github.com/openai/image-gpt)]

### 2020-09  Performer

**Rethinking Attention with Performers**：用随机特征近似 softmax attention，实现线性复杂度。

[[Paper](https://arxiv.org/pdf/2009.14794.pdf)] [[Code](https://github.com/google-research/google-research/tree/master/performer)] [[Note](https://github.com/junxnone/tech-io/issues/925)]

### 2020-10  ViT

**An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale**：将图像切成 patch 序列，直接用标准 Transformer 做图像分类。#Classification

[[Paper](https://arxiv.org/abs/2010.11929)] [[Code](https://github.com/google-research/vision_transformer)] [[Note](https://github.com/junxnone/tech-io/issues/916)]

### 2020-10  Deformable DETR

**Deformable DETR: Deformable Transformers for End-to-End Object Detection**（ICLR）：用可变形注意力加速 DETR 收敛。

[[Paper](https://arxiv.org/abs/2010.04159)] [[Code](https://github.com/fundamentalvision/Deformable-DETR)]

### 2020-11  UP-DETR

**UP-DETR: Unsupervised Pre-training for Object Detection with Transformers**

[[Paper](https://arxiv.org/abs/2011.09094)]

### 2020-11  LSTR

**End-to-end Lane Shape Prediction with Transformers**。#LaneDetection

[[Paper](https://arxiv.org/pdf/2011.04233.pdf)] [[Code](https://github.com/liuruijin17/LSTR)]

### 2020-12  IPT

**Pre-Trained Image Processing Transformer**。#denoising #super-resolution

[[Paper](https://arxiv.org/abs/2012.00364)]

### 2020-12  DeiT

**Training data-efficient image transformers & distillation through attention**：通过蒸馏在 ImageNet 上高效训练 ViT。

[[Paper](https://arxiv.org/abs/2012.12877)] [[Code](https://github.com/facebookresearch/deit)] [[Note](https://github.com/junxnone/tech-io/issues/931)]

### 2021-01  BoTNet

**Bottleneck Transformers for Visual Recognition**：在 ResNet 末端用 Self-Attention 替换卷积。

[[Paper](https://arxiv.org/abs/2101.11605)] [[Code](https://paperswithcode.com/paper/bottleneck-transformers-for-visual#code)] [[Note](https://github.com/junxnone/tech-io/issues/929)]

### 2021-01  T2T-ViT

**Tokens-to-Token ViT: Training Vision Transformers from Scratch on ImageNet**。#Classification

[[Paper](https://arxiv.org/abs/2101.11986)] [[Code](https://github.com/yitu-opensource/T2T-ViT)] [[Note](https://github.com/junxnone/tech-io/issues/928)]

### 2021-02  PVT

**Pyramid Vision Transformer: A Versatile Backbone for Dense Prediction without Convolutions**。#Backbone

[[Paper](https://arxiv.org/abs/2102.12122)] [[Code](https://github.com/whai362/PVT)] [[Note](https://github.com/junxnone/tech-io/issues/939)]

### 2021-02  CLIP

**Learning Transferable Visual Models From Natural Language Supervision**：图文对比学习，打通视觉与语言的多模态表示。

[[Paper](https://arxiv.org/abs/2103.00020)]

### 2021-03  TNT

**Transformer in Transformer**。#Classification

[[Paper](https://arxiv.org/abs/2103.00112)] [[Code](https://github.com/huawei-noah/noah-research/tree/master/TNT)] [[Note](https://github.com/junxnone/aiwiki/issues/360)]

### 2021-03  Swin Transformer

**Swin Transformer: Hierarchical Vision Transformer using Shifted Windows**：层级结构 + 移位窗口注意力。#Backbone

[[Paper](https://arxiv.org/abs/2103.14030)] [[Code](https://github.com/microsoft/Swin-Transformer)] [[Note](https://github.com/junxnone/tech-io/issues/958)]

### 2021-04  DINO

**Emerging Properties in Self-Supervised Vision Transformers**：自监督 ViT，注意力图自然涌现出目标分割。

[[Paper](https://arxiv.org/abs/2104.14294)]

### 2021-05  SegFormer

**SegFormer: Simple and Efficient Design for Semantic Segmentation with Transformers**。#Segmentation

[[Paper](https://arxiv.org/abs/2105.15203)]

### 2021-06  BEiT

**BEiT: BERT Pre-Training of Image Transformers**：将 BERT 的掩码预测范式用于图像。

[[Paper](https://arxiv.org/abs/2106.08254)]

### 2021-11  MAE

**Masked Autoencoders Are Scalable Vision Learners**：高比例掩码重建的自监督预训练。

[[Paper](https://arxiv.org/abs/2111.06377)]

### 2022-03  DINO (DETR)

**DINO: DETR with Improved DeNoising Anchor Boxes for End-to-End Object Detection**。#ObjectDetection

[[Paper](https://arxiv.org/abs/2203.03605)]

### 2022-12  DiT

**Scalable Diffusion Models with Transformers**：用 Transformer 替换扩散模型中的 U-Net。

[[Paper](https://arxiv.org/abs/2212.09748)]

### 2023-04  SAM

**Segment Anything**：基于 ViT 的通用分割基础模型。#Segmentation

[[Paper](https://arxiv.org/abs/2304.02643)]

### 2023-04  DINOv2

**DINOv2: Learning Robust Visual Features without Supervision**。

[[Paper](https://arxiv.org/abs/2304.07193)]

### 2023-04  RT-DETR

**DETRs Beat YOLOs on Real-time Object Detection**：实时的 DETR 检测器。#ObjectDetection

[[Paper](https://arxiv.org/abs/2304.08069)]

### 2024-02  Sora

OpenAI 发布基于 Diffusion Transformer 的文生视频模型 Sora。

### 2025-08  DINOv3

**DINOv3**：7B 参数的自监督视觉基础模型，并蒸馏出 ViT 与 ConvNeXt 系列小模型。

[[Paper](https://arxiv.org/abs/2508.10104)]

## Survey

### 2020-09  Efficient Transformers Survey

**Efficient Transformers: A Survey**

[[Paper](https://arxiv.org/abs/2009.06732)] [[Note](https://github.com/junxnone/tech-io/issues/934)]

### 2020-12  Visual Transformer Survey

**A Survey on Visual Transformer**

[[Paper](https://arxiv.org/pdf/2012.12556.pdf)] [[Note](https://github.com/junxnone/tech-io/issues/926)]

### 2021-01  Transformers in Vision

**Transformers in Vision: A Survey**

[[Paper](https://arxiv.org/pdf/2101.01169.pdf)] [[Note](https://github.com/junxnone/tech-io/issues/927)]

### 2021-06  A Survey of Transformers

**A Survey of Transformers**

[[Paper](https://arxiv.org/abs/2106.04554)]

## Reference
- [Transformer](/ML_Transformer)
- [原始笔记 wht#9](https://github.com/junxnone/wht/issues/9)

