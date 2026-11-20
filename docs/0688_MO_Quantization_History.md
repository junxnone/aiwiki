---
Title | MO Quantization History
-- | --
Created @ | `2026-11-20T09:44:11Z`
Updated @| `2026-11-20T09:44:19Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/688)

---
# 量化发展历史

> 神经网络量化（Quantization）的发展时间线。正文按 [timelinemd](https://github.com/junxnone/jstools/tree/main/timelinemd) 格式书写，可用 [timelinemd 在线工具](https://junxnone.github.io/jstools/timelinemd/?md=https://raw.githubusercontent.com/junxnone/aiwiki/main/docs/0688_MO_Quantization_History.md) 以交互式时间轴查看（页面顶部会多出同步脚本自动生成的 Title/Created/Updated 表格，不影响下方时间轴解析）。日期均为 arXiv 首次提交日期（已通过 arXiv API 核对）。总览见 [量化](0312_MO_Quantization)。
>
> 按技术路线给条目归类：
>
> | 路线 | 解决的问题 | 代表条目 |
> |---|---|---|
> | 低比特 / 二值化 | 把权重压到 1-2 bit，用位运算替代乘法 | BinaryConnect、XNOR-Net、TWN、BitNet b1.58 |
> | 整数推理与 QAT | 训练时模拟量化误差，端到端的整数推理 | STE、DoReFa、PACT、LSQ、Jacob 等 |
> | 训练后量化（PTQ） | 不重新训练，只用少量校准数据 | ACIQ、DFQ、AdaRound、BRECQ、QDrop |
> | 混合精度 | 不同层分配不同比特宽度 | HAQ、HAWQ |
> | 数据格式 | 用浮点或微缩放格式代替整数 | FP8、MX 格式 |
> | LLM 量化 | 应对大模型的激活离群值与显存瓶颈 | LLM.int8()、GPTQ、SmoothQuant、AWQ、QLoRA、QuaRot |
> | KV Cache 量化 | 长上下文推理的缓存显存 | KIVI、KVQuant |
>
> 表中：第一列是技术路线，第二列说明这条路线要解决的问题，第三列列出下方时间线中属于该路线的代表条目。

## 低比特与压缩

### 2013-08-15  STE  {point}

Bengio 等人在 *Estimating or Propagating Gradients Through Stochastic Neurons* 中讨论了通过不可导算子传播梯度的直通估计器（Straight-Through Estimator），后来成为量化感知训练的标准技巧。[arXiv:1308.3432](https://arxiv.org/abs/1308.3432)

### 2015-10-01  Deep Compression

剪枝 + 训练量化与权重共享（K-means 码本）+ 霍夫曼编码三段式流水线。[arXiv:1510.00149](https://arxiv.org/abs/1510.00149)

### 2015-11-02  BinaryConnect

训练时把权重二值化为 ±1，前向用二值权重、反向更新全精度权重。[arXiv:1511.00363](https://arxiv.org/abs/1511.00363)

### 2016-03-16  XNOR-Net

权重与输入都二值化，卷积变为 XNOR 与 popcount，并引入逐通道缩放因子。[arXiv:1603.05279](https://arxiv.org/abs/1603.05279)

### 2016-05-16  TWN

*Ternary Weight Networks*：权重取 {-1, 0, +1} 三值。[arXiv:1605.04711](https://arxiv.org/abs/1605.04711)

### 2024-02-27  BitNet b1.58

*The Era of 1-bit LLMs*：LLM 权重取三值 {-1, 0, 1}，约 1.58 bit。[arXiv:2402.17764](https://arxiv.org/abs/2402.17764)

## 整数推理与量化感知训练

### 2016-06-20  DoReFa-Net

用低比特权重、激活和梯度训练卷积网络。[arXiv:1606.06160](https://arxiv.org/abs/1606.06160)

### 2017-12-15  整数推理（Jacob 等）

*Quantization and Training of Neural Networks for Efficient Integer-Arithmetic-Only Inference*：仿射量化 + fake quant 的 QAT + 纯整数推理，是 TensorFlow Lite 与大多数部署框架量化流程的基础。[arXiv:1712.05877](https://arxiv.org/abs/1712.05877)

### 2018-05-16  PACT

用可学习的激活截断值参数 α 训练低比特激活。[arXiv:1805.06085](https://arxiv.org/abs/1805.06085)

### 2019-02-21  LSQ

*Learned Step Size Quantization*：把量化步长当作可学习参数，并给出梯度缩放。[arXiv:1902.08153](https://arxiv.org/abs/1902.08153)

### 2021-06-15  量化白皮书

*A White Paper on Neural Network Quantization*：系统总结 PTQ 与 QAT 的流程和实践。[arXiv:2106.08295](https://arxiv.org/abs/2106.08295)

## 训练后量化（PTQ）

### 2018-10-02  ACIQ

*Post-training 4-bit quantization of convolution networks for rapid-deployment*：用解析方式求最优截断值，并提出对通道比特分配与偏置校正。[arXiv:1810.05723](https://arxiv.org/abs/1810.05723)

### 2019-06-11  DFQ

*Data-Free Quantization Through Weight Equalization and Bias Correction*：跨层权重均衡与偏置校正，无需数据即可做 PTQ。[arXiv:1906.04721](https://arxiv.org/abs/1906.04721)

### 2020-04-22  AdaRound

*Up or Down? Adaptive Rounding for Post-Training Quantization*：不再简单四舍五入，而是学习每个权重向上还是向下取整。[arXiv:2004.10568](https://arxiv.org/abs/2004.10568)

### 2021-02-10  BRECQ

按网络块（block）重建输出，把 PTQ 推到 4 bit 及以下。[arXiv:2102.05426](https://arxiv.org/abs/2102.05426)

### 2022-03-11  QDrop

重建时随机丢弃量化，提升极低比特 PTQ 的精度。[arXiv:2203.05740](https://arxiv.org/abs/2203.05740)

## 混合精度与数据格式

### 2018-11-21  HAQ

*Hardware-Aware Automated Quantization with Mixed Precision*：用强化学习结合硬件反馈为各层分配比特。[arXiv:1811.08886](https://arxiv.org/abs/1811.08886)

### 2019-04-29  HAWQ

*Hessian AWare Quantization*：用 Hessian 的谱信息衡量各层敏感度，指导混合精度。[arXiv:1905.03696](https://arxiv.org/abs/1905.03696)

### 2022-09-12  FP8

*FP8 Formats for Deep Learning*：提出 E4M3 与 E5M2 两种 8 位浮点格式。[arXiv:2209.05433](https://arxiv.org/abs/2209.05433)

### 2023-10-16  MX 格式

*Microscaling Data Formats for Deep Learning*：以块为单位共享缩放因子的微缩放数据格式。[arXiv:2310.10537](https://arxiv.org/abs/2310.10537)

## 大语言模型量化

### 2022-08-15  LLM.int8()

*8-bit Matrix Multiplication for Transformers at Scale*：发现大模型的激活离群维度，用向量级量化 + 离群值混合精度分解处理。[arXiv:2208.07339](https://arxiv.org/abs/2208.07339)

### 2022-10-31  GPTQ

基于近似二阶信息逐列量化权重并补偿误差，数 GPU 小时即可把百亿级模型量化到 3-4 bit。[arXiv:2210.17323](https://arxiv.org/abs/2210.17323)

### 2022-11-18  SmoothQuant

把激活的量化难度通过等价变换迁移到权重上，使 W8A8 可行。[arXiv:2211.10438](https://arxiv.org/abs/2211.10438)

### 2023-05-23  QLoRA

4 bit NormalFloat（NF4）+ 双重量化 + LoRA，用于在单卡上微调大模型。[arXiv:2305.14314](https://arxiv.org/abs/2305.14314)

### 2023-06-01  AWQ

按激活幅度找出显著权重通道并做缩放保护，无需反向传播。[arXiv:2306.00978](https://arxiv.org/abs/2306.00978)

### 2023-06-05  SpQR

稀疏 + 量化的混合表示，把离群权重单独以高精度存储，实现接近无损的压缩。[arXiv:2306.03078](https://arxiv.org/abs/2306.03078)

### 2023-08-25  OmniQuant

可学习的权重截断与等价变换，同时覆盖权重与激活。[arXiv:2308.13137](https://arxiv.org/abs/2308.13137)

### 2024-02-06  QuIP#

Hadamard 非相干处理 + 格点码本，做 2 bit 级 LLM 量化。[arXiv:2402.04396](https://arxiv.org/abs/2402.04396)

### 2024-03-30  QuaRot

用旋转消除激活离群值，实现端到端 4 bit 推理。[arXiv:2404.00456](https://arxiv.org/abs/2404.00456)

## KV Cache 量化

### 2024-01-31  KVQuant

面向超长上下文的 KV Cache 量化，包括 RoPE 之前量化 Key、非均匀量化等。[arXiv:2401.18079](https://arxiv.org/abs/2401.18079)

### 2024-02-05  KIVI

无需微调的 KV Cache 2 bit 非对称量化，Key 按通道、Value 按 token 量化。[arXiv:2402.02750](https://arxiv.org/abs/2402.02750)

