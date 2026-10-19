---
Title | NNCF Weight Compression
-- | --
Created @ | `2026-10-19T08:23:50Z`
Updated @| `2026-10-19T08:23:50Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/560)

---
# NNCF Weight Compression

> 本文是 [NNCF](0451_Tools_OV_NNCF) 总览的深入篇，专门展开 Weight Compression（权重压缩）——NNCF 里专门针对 LLM 设计的压缩方式。

## 为什么 LLM 要用权重压缩而不是全模型量化

[NNCF 总览](0451_Tools_OV_NNCF) 里提到的 PTQ（`nncf.quantize()`）会把权重和**激活值**都量化，对 CNN 这类计算密集型模型效果很好；但 LLM 推理（尤其是解码阶段，一次只处理一个 token）的瓶颈主要在**从显存/内存搬运权重的带宽**，而不是算力——这时候只压缩权重、保持激活值为浮点精度（Weight-Only Compression），既能大幅减小权重体积、缓解带宽瓶颈，又因为激活值没有被量化误差污染，精度通常比全模型量化更好。而且它是 **data-free** 的——最基础的用法完全不需要校准数据集，这点和下面要讲的"精度恢复三件套"（需要数据）不冲突，是否用数据集取决于要不要做精度恢复。

## 基础用法

```python
from nncf import compress_weights, CompressWeightsMode

# INT8：几乎不掉精度，体积降到约 1/4
compressed_model = compress_weights(model, mode=CompressWeightsMode.INT8_ASYM)

# INT4：体积能降到约 1/8，但精度下降更明显，通常需要下面的精度恢复算法配合
compressed_model = compress_weights(model, mode=CompressWeightsMode.INT4_SYM)
```

核心参数：

| 参数 | 作用 |
|---|---|
| `mode` | 压缩位宽/是否对称，如 `INT8_ASYM`、`INT4_SYM`、`INT4_ASYM` |
| `group_size` | 量化分组粒度——不是整层共用一套 scale，而是每 `group_size` 个权重共用一套，越小精度越高、开销越大（`-1` 表示按通道量化，不分组） |
| `ratio` | 控制 INT4/INT8 混合比例，如 `ratio=0.9` 表示 90% 的层压到 INT4、其余 10%（通常是对精度更敏感的层）保留 INT8 |
| `dataset` | 可选，传入后才能启用下面的 data-aware 精度恢复算法 |

INT4 相比 INT8 多出来的精度损失，NNCF 提供了三种可以叠加使用的**数据感知（data-aware）**精度恢复算法：**AWQ**、**Scale Estimation**、**LoRA Correction**。三者都需要传入校准数据集（`dataset` 参数），这是它们和"基础用法"的本质区别。

## AWQ（Activation-aware Weight Quantization）

**核心观察**：量化误差并不是均匀分布在所有权重通道上的——只有一小部分通道对输出影响很大（"salient" 通道，判断依据是与之相乘的**激活值**幅度大小），这些通道的量化误差会被显著放大并传递下去。

**做法**：不是给这些重要通道开小灶用更高精度（会破坏整齐的 INT4 布局），而是在量化前把这些通道的权重**按比例放大**（让它们在量化后的整数网格上有更精细的分辨率），同时把对应的激活值按相同比例**缩小**——这是一个数学恒等变换（`(s·W) · (X/s) = W·X`），不改变浮点计算结果，但改变了量化误差在各通道间的分布方式，让重要通道获得相对更高的有效精度。

具体的缩放系数通过网格搜索确定：`scale = (激活值的平均幅度) ^ α`，`α` 在 `[0, 1]` 区间网格搜索找最优值。NNCF 里可调的相关参数包括 `alpha_min`/`alpha_max`（搜索区间）、`steps`（网格搜索步数）等。

## Scale Estimation

和 AWQ"调整谁的权重更该被保护"的思路不同，Scale Estimation 直接在数值优化层面下功夫：**以最小化原始权重和量化后权重之间的 L2 重建误差为目标，对每个分组的量化 scale/zero-point 做迭代优化**，而不是简单地用 absmax（取绝对值最大值）直接算出一个 scale 就了事。

- 在 INT4（尤其是所有层都压到 INT4）场景下，这种更精细的 scale 优化比默认的 absmax 方案能明显提升精度；
- 可以和 AWQ、以及 `ratio` 控制的混合精度叠加使用，三者不互斥；
- 需要传入校准数据集来评估重建误差。

## LoRA Correction

前两个方法都是在"量化怎么做更准"上做文章，LoRA Correction 换了个思路：**承认量化之后必然还有残留误差，直接用低秩矩阵把这部分误差学回来**。

具体做法是在已经完成 AWQ + Scale Estimation 处理的量化权重基础上，额外引入一小对低秩矩阵（LoRA adapter），用校准数据拟合这对低秩矩阵，让"量化权重 + 低秩修正项"的输出尽量逼近原始浮点权重的输出——相当于用很小的参数量开销，专门去补偿量化误差里最影响输出的那一部分。

- 默认会对 LoRA adapter 本身也做 INT8 量化（`use_int8_adapters=True`），在"额外开销"和"修正精度"之间取平衡；
- 会增加压缩耗时（需要额外的拟合过程），但模型体积增量很小；
- **和 GPTQ 互斥**——GPTQ 是另一种基于 Hessian 矩阵做逐列修正的精度恢复方法，两者都是"量化后再修正"的思路，不能同时使用，但都可以分别和 AWQ、Scale Estimation 组合。

## 三者怎么组合

典型的全套 INT4 高精度压缩流程：

```python
from nncf import compress_weights, CompressWeightsMode

compressed_model = compress_weights(
    model,
    mode=CompressWeightsMode.INT4_ASYM,
    group_size=64,
    ratio=0.9,
    dataset=calibration_dataset,   # 启用 data-aware 算法必须传数据集
    awq=True,                      # 先用 AWQ 保护重要通道
    scale_estimation=True,         # 再优化每组的量化 scale
    lora_correction=True,          # 最后用低秩修正补偿残留误差
)
```

概念上的执行顺序：AWQ 先重新分配各通道的量化误差 → Scale Estimation 针对重分配后的权重优化每组 scale → LoRA Correction 在最终量化结果上叠加低秩修正项。三者是递进关系，不是相互替代，可以按需只开启其中一个或几个（开启越多，压缩耗时越长，精度收益递减）。

## 怎么选

| 场景 | 建议 |
|---|---|
| 只想要个基础版 INT4，追求压缩速度，不太在意多出来 1-2 个点的精度损失 | 只用 `compress_weights(mode=INT4_SYM)`，不传数据集 |
| 希望 INT4 精度尽量接近 INT8，有校准数据集，不特别在意压缩耗时 | `awq=True` 起步，视情况加 `scale_estimation=True` |
| 对精度要求最高、模型对量化特别敏感 | 三者全开（`awq` + `scale_estimation` + `lora_correction`），或改用 `ratio<1.0` 让部分敏感层保留 INT8 |
| 想用 GPTQ 做精度修正 | 和 `lora_correction` 二选一，不能同时开 |

## Reference
- [LLM Weight Compression - OpenVINO 官方文档](https://docs.openvino.ai/2024/openvino-workflow/model-optimization-guide/weight-compression.html)
- [4-bit Weight Quantization - OpenVINO 官方文档](https://docs.openvino.ai/2024/openvino-workflow/model-optimization-guide/weight-compression/4-bit-weight-quantization.html)
- Lin, J. et al. (2023). AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration. [arXiv:2306.00978](https://arxiv.org/abs/2306.00978)
- [nncf.quantization.advanced_parameters API 文档](https://openvinotoolkit.github.io/nncf/autoapi/nncf/quantization/advanced_parameters/index.html)
- [Optimum Intel Optimization 文档](https://huggingface.co/docs/optimum-intel/openvino/optimization)
- [NNCF 总览](0451_Tools_OV_NNCF)

