---
Title | x Model Precision
-- | --
Created @ | `2023-10-30T07:33:26Z`
Updated @| `2026-10-16T04:59:00Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/450)

---
# Model Precision

- 浮点型
  - FP32 / TF32 / FP16 / BF16 / FP8 / FP4 / FP64 / FP80
- 整型
  - INT32 / INT8 / INT4 / U8 / U1
- 微缩放（Microscaling）格式
  - MXFP8 / MXFP6 / MXFP4 / NVFP4

## 一、浮点格式：位布局与取值范围

把浮点数拆成符号位（S）/ 指数位（E）/ 尾数位（M）三部分：指数位数决定**动态范围**，尾数位数决定**精度**。

| 格式 | 位布局（S-E-M） | 近似最大有限值 | 典型用途 |
|---|---|---|---|
| FP64 | 1-11-52 | ~1.8×10^308 | 科学计算，深度学习里极少使用，`torch.float64`/`double` |
| FP32 | 1-8-23 | ~3.4×10^38 | 训练默认精度，`torch.float32`/`tf.float32` |
| FP80 | 1-15-64 | ~1.2×10^4932 | x87 扩展精度，主要是历史遗留的 CPU 浮点寄存器格式，深度学习基本不用 |
| TF32 | 1-8-10（物理按 32bit 对齐存储） | 与 FP32 同范围，尾数精度降低 | NVIDIA GPU 上用 FP32 存、按 TF32 做矩阵乘加速 |
| FP16 | 1-5-10 | 65504 | 混合精度训练/推理，`torch.float16`/`half` |
| BF16 | 1-8-7 | ~3.4×10^38（指数位数和 FP32 相同） | 指数范围和 FP32 一致、不易溢出，训练更稳定，`torch.bfloat16` |
| FP8（E4M3） | 1-4-3 | 448 | 前向激活与权重，数值范围本就可控，想要更高精度 |
| FP8（E5M2） | 1-5-2 | 57344 | 反向传播梯度——量级波动大、容易溢出，牺牲精度换更大范围 |
| FP4（E2M1） | 1-2-1 | 6 | 配合 Microscaling 做极低比特训练/推理，单独使用误差较大 |

## 二、整型格式

| 格式 | 位数 | 取值范围 | 典型用途 |
|---|---|---|---|
| INT32 | 32 | -2^31 ~ 2^31-1 | 累加器/索引，极少直接存权重 |
| INT8 | 8 | -128 ~ 127 | 训练后量化（PTQ）最常用的权重/激活格式 |
| UINT8（U8） | 8 | 0 ~ 255 | 图像像素等天然非负数据、非对称量化 |
| INT4 | 4 | -8 ~ 7 | LLM 仅权重量化（如 GPTQ/AWQ），配合 FP16/BF16 激活 |
| U1 | 1 | 0 / 1 | 二值神经网络（Binary Neural Network），用位运算替代乘加 |

整型本身不带指数/尾数，量化时需要额外的 `Scale`/`Zero Point` 把浮点值映射到这个范围——具体映射公式和对称/非对称量化流程见 [量化](/0312_MO_Quantization)。

## 三、Microscaling（MX）格式：2023 年后的新范式

传统量化给整个张量或每个通道配一个全局 Scale；Microscaling（OCP 规范）把张量切成固定大小的小块（每块 32 个元素），每块单独配一个 8 位的共享指数 Scale（E8M0），块内每个元素再用更低比特的浮点格式表示：

| 格式 | 块大小 | 共享 Scale | 元素格式 | 等效比特/元素 |
|---|---|---|---|---|
| MXFP8 | 32 | E8M0（8bit） | E4M3 或 E5M2 | 8.25 |
| MXFP6 | 32 | E8M0（8bit） | E2M3 或 E3M2 | 6.25 |
| MXFP4 | 32 | E8M0（8bit） | E2M1 | 4.25 |

- MXFP6 已被验证可以把生成式语言模型训练到和 FP32 几乎打平的精度；MXFP4 做权重、MXFP6 做激活/梯度的组合，精度损失同样很小；
- NVIDIA Blackwell 架构同时支持 OCP 标准的 MXFP4 和自家的 **NVFP4**——两者元素格式都是 E2M1，区别在于块大小和 Scale 精度：MXFP4 是 32 元素块 + E8M0 Scale（动态范围大、精度较粗），NVFP4 是 16 元素块 + FP8(E4M3) Scale（动态范围小、精度更细）。Blackwell 上 MXFP8 主要用于 LLM 训练，NVFP4 主要用于推理。

## 四、混合精度训练的数值机制

- **Master Weights（主权重）**：即使前向/反向计算用 FP16/BF16，通常仍会额外保留一份 FP32 的主权重用于梯度更新累加，避免多次小梯度更新被低精度舍入"吃掉"；
- **为什么 FP16 训练需要 Loss Scaling**：FP16 指数位只有 5 位，动态范围远小于 FP32，训练后期很多梯度量级很小，会直接下溢成 0；解决办法是训练时把 Loss 乘一个较大的缩放因子（如 1024），让梯度整体数值变大、落回 FP16 可表示范围，更新权重前再除回去；
- **为什么 BF16 一般不需要 Loss Scaling**：BF16 指数位和 FP32 一样是 8 位，动态范围和 FP32 相同，梯度不容易下溢；代价是尾数只有 7 位（比 FP16 的 10 位更粗），单步舍入误差更大，但长期训练下这种随机误差通常比下溢导致梯度直接归零的影响更可控；
- **舍入模式**：默认通常是 Round-to-Nearest-Even（四舍六入五取偶）；低比特训练（尤其 FP8/FP4）里越来越多采用**随机舍入**（Stochastic Rounding）——按误差大小的概率向上或向下舍入，期望值上无偏，能明显减少多步累积后的系统性偏差。

## 五、KV Cache 量化：LLM 推理里精度格式的具体落地

长上下文 LLM 推理时，KV Cache（历史 token 的 Key/Value 张量）会随上下文长度线性增长，往往比权重本身更占显存。生产环境中常见做法是**权重精度不变，单独把 KV Cache 量化到 INT8 或 FP8**，在不明显影响生成质量的前提下大幅压缩显存占用、支撑更长上下文/更大 batch，vLLM、TensorRT-LLM 等主流推理框架都原生支持这一能力。

## 六、硬件支持矩阵

| GPU 架构世代 | 代表产品 | 原生支持的新增格式 |
|---|---|---|
| Ampere | A100 | FP32 / TF32 / FP16 / BF16 / INT8（无原生 FP8） |
| Hopper | H100 / H200 | + FP8（E4M3/E5M2，Transformer Engine） |
| Blackwell | B100 / B200 | + FP4 / FP6 / MXFP4 / MXFP6 / MXFP8 / NVFP4（第五代 Tensor Core） |

越新的格式对硬件代数要求越高，选型时首先要确认目标硬件是否原生支持，否则只能退化成软件模拟、拿不到预期的吞吐收益。

## 七、训练与部署现状：谁在用、为什么（2026-10）

### 预训练
- **BF16 仍是框架默认**（Megatron-LM、DeepSpeed 等）：指数范围和 FP32 一致、不需要 Loss Scaling，工程实现最简单、最稳妥；
- **FP8 已是 Hopper 及以上大规模预训练的主流标准**：吞吐和显存显著优于 BF16，质量损失可控——最著名的案例是 DeepSeek-V3 的大部分训练阶段采用 FP8，大幅降低了训练算力成本；
- **FP4 预训练正从研究走向早期生产，仅限 Blackwell**：NVFP4 配方已验证到万亿级 token、千亿级参数规模，但稳定性风险据报道是 FP8 的 4-10 倍——因为每个 block 只有约 8 个可表示的数值，数据分布一旦偏移就容易直接发散；NVIDIA 下一代 Rubin 芯片据称会把 FP4 作为"一等公民"设计，FP4 预训练预计会逐步成熟。

### 推理部署
- **FP8 是 2026 年生产推理的"安全默认值"**：质量可以做到 BF16 的约 99%，Hopper/Blackwell 原生支持，是质量和效率之间目前最稳妥的平衡点；
- **INT4（GPTQ/AWQ/EXL2 等权重量化方法）是显存受限场景的"推理下限"**：相比 BF16 可省约 75% 显存，能让 70B 级模型跑在单张消费级显卡上；代价是复杂推理/数学类任务质量下降更明显，更适合摘要、分类、代码补全这类对精度容忍度较高的场景；
- **FP4 推理尚在成熟中，还不是主流生产选择**：校准工具链（如 vLLM）对 FP4 的支持还不算"一等公民"，质量下降比 FP8 更明显，随着校准技术在 2026 年内继续改进，预计会逐步进入更多生产部署；
- **新兴最佳实践是混合精度，而非极端的纯 FP4 或纯 FP8**：比如用 NVFP4 做权重、FP8/BF16 做 attention 计算，在质量敏感任务上持续优于全 FP4 部署，是目前企业级 LLM 服务被推荐的架构方向。

### 场景 → 精度选型速查

| 场景 | 推荐精度 | 为什么 |
|---|---|---|
| 预训练（通用、求稳） | BF16 | 指数范围同 FP32，无需 Loss Scaling，工程最简单 |
| 预训练（追求效率，Hopper 及以上） | FP8 | 吞吐/显存显著优于 BF16，质量损失可控，已是大规模预训练主流 |
| 预训练（追求极致效率，Blackwell） | FP4 / NVFP4 | 吞吐最高，但稳定性风险大，仍处于从研究到生产的过渡期 |
| 云端推理（质量优先） | FP8 | 质量接近 BF16（约 99%），当前的"安全默认值" |
| 显存受限 / 边缘部署 | INT4（GPTQ/AWQ） | 显存节省最多（约 75%），让大模型跑进消费级显卡，牺牲部分复杂推理质量 |
| 长上下文 LLM 服务 | KV Cache 用 INT8/FP8 | 专门压缩 KV Cache 显存占用，权重精度可以保持不变 |

## FP16

![image](https://github.com/junxnone/aiwiki/assets/2216970/617e8097-0543-4bd5-8c89-8bfbc856a988)

## 延伸阅读
- 怎么把浮点模型转换成整型/低比特模型的具体流程见 [量化](/0312_MO_Quantization)
- 量化在整体模型性能优化（PTQ/QAT/混合精度/剪枝/蒸馏）里的定位见 [模型性能优化技术](/0471_MO)

## Reference
- [Hardware Precision](https://junxnone.github.io/xwiki/#/0281_Hardware_Precision)
- [OCP Microscaling Formats (MX) Specification v1.0](https://www.opencompute.org/documents/ocp-microscaling-formats-mx-v1-0-spec-final-pdf/)
- [Microscaling Data Formats for Deep Learning](https://arxiv.org/pdf/2310.10537)
- [nvFP4 vs MXFP4 对比](https://www.spheron.network/blog/nvfp4-vs-mxfp4-gpu-cloud-4bit-quantization-guide/)
- [NVIDIA Blackwell Number Formats](https://0xsero.github.io/blackwell-gpu-wiki/fundamentals/number-formats/)
- [Mastering Low-Precision AI: FP8 and FP4 Support Across Frameworks in Mid-2026](https://dev.to/javaeeeee/mastering-low-precision-ai-fp8-and-fp4-support-across-frameworks-in-mid-2026-4c98)
- [FP8 vs INT4 Quantization for Production LLM Inference: A Decision Framework for 2026](https://blog.traversaal.ai/fp8-vs-int4-quantization-production-llm-inference-decision-framework-2026/)
- [Full-Stack FP4: Stable LLM Pretraining with Quantized Projections, Optimizers, and Attention](https://arxiv.org/html/2607.04422)

