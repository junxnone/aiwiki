---
Title | LM FT MultiLoRAServing
-- | --
Created @ | `2026-10-20T08:04:56Z`
Updated @| `2026-10-20T08:04:56Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/572)

---
# 多 LoRA 生产部署（Multi-LoRA Serving）

> 本文是 [大模型微调总览](0410_LM_FT) 的深入篇，从 [LoRA](0406_LM_FT_LoRA) 拆分出来，专门展开"训练完多个任务各自的 LoRA 之后，生产环境里怎么部署、怎么服务"这个工程问题。

## 两种部署方式

LoRA 推理时有两种选择：

- **合并（Merge）**：把 `BA` 加回 `W_0`，得到一个和原模型结构完全一样的新权重矩阵（`W = W_0 + BA`）。合并后推理没有任何额外开销，等效于一个全参数微调过的模型，但代价是**失去了动态切换的能力**——每换一个任务就要重新合并、重新加载一份完整模型；
- **不合并**：让 LoRA adapter 以独立的小矩阵形式留在显存里，推理时实时计算 `W_0x + BAx`，多一次矩阵乘法的开销，但好处是**同一个底座模型可以同时服务多个任务**，不同请求按需挂载各自的 adapter。

生产环境里，只要涉及"一个底座、多个任务/多个用户"的场景，几乎都会选择不合并这条路。

## 为什么值得专门做服务框架

一个底座模型常驻显存，不同用户/任务各自的 LoRA 权重体积很小（通常只有底座模型的千分之一到百分之一），理论上可以给每个请求动态挂载对应的 adapter，不需要为每个任务都单独部署一份完整模型——这件事看起来简单，但要在高并发场景下做到低延迟、高吞吐，涉及不少工程细节：

- **批处理（Batching）**：同一批请求可能对应不同的 LoRA adapter，普通的批处理矩阵乘法假设整个 batch 共用同一组权重，直接套用会出错，需要专门设计能支持"同一个 batch 里不同样本用不同 adapter"的 batched 矩阵乘法 kernel；
- **adapter 加载/换入换出**：热门 adapter 常驻显存，冷门 adapter 按需从 CPU 内存甚至磁盘换入，需要类似 cache 的管理策略；
- **显存管理**：底座模型的 KV Cache 和多个 adapter 的权重要在有限显存里合理分配，不能因为加载新 adapter 挤占了正在服务请求的 KV Cache。

## 代表性方案

- **S-LoRA**：专门针对"同时服务数千个 LoRA adapter"场景设计，核心贡献是统一分页（Unified Paging）显存管理——把 adapter 权重和 KV Cache 放进同一套分页机制里统一调度，以及支持异构 batching 的定制 CUDA kernel，论文报告能在单卡/单节点上同时服务数千个 adapter；
- **vLLM 的 multi-LoRA 支持**：vLLM 本身以 PagedAttention 闻名（把 KV Cache 当作操作系统虚拟内存一样分页管理），在此基础上扩展了对多 LoRA 的原生支持，请求级别指定要用哪个 adapter，复用同一份底座模型权重和推理引擎；
- **Punica**：提出了 SGMV（Segmented Gather Matrix-Vector multiplication）这个专门的 CUDA kernel，用来高效计算"同一个 batch 里不同样本乘不同 LoRA 矩阵"这种不规则的批量矩阵运算。

## 怎么选

| 场景 | 推荐 |
|---|---|
| 单一任务、固定部署，不需要切换 | 训练完直接合并（merge），零额外推理开销 |
| 需要同时服务少量（几个到几十个）任务 | vLLM 等推理框架自带的 multi-LoRA 支持通常够用 |
| 需要同时服务成百上千个 LoRA adapter（如 SaaS 场景每个客户一个专属 adapter） | S-LoRA 这类专门为大规模多 adapter 场景设计的服务系统 |

## Reference
- Sheng, Y. et al. (2023). S-LoRA: Serving Thousands of Concurrent LoRA Adapters. [arXiv:2311.03285](https://arxiv.org/abs/2311.03285)
- Chen, L. et al. (2023). Punica: Multi-Tenant LoRA Serving. [arXiv:2310.18547](https://arxiv.org/abs/2310.18547)
- [vLLM 官方文档 - LoRA 适配器](https://docs.vllm.ai/en/latest/features/lora.html)
- [LoRA](0406_LM_FT_LoRA)
- [大模型微调总览](0410_LM_FT)

