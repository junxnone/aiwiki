---
Title | ML Op Norm LayerNorm
-- | --
Created @ | `2026-11-10T09:50:15Z`
Updated @| `2026-11-10T09:50:15Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/615)

---
# ML Op Norm LayerNorm

LayerNorm（Layer Normalization）对**单个样本内部**的特征维做归一化，统计量（均值、方差）不依赖 batch，因此训练和推理行为一致，也适合变长序列和小 batch。它是 [Transformer](0229_ML_Transformer) 的标配归一化层。RMSNorm 是 LayerNorm 的简化版（去掉减均值），在 LLaMA 等大语言模型中被广泛采用。本文同时简述 GroupNorm 与 InstanceNorm，并重点讨论融合 kernel、ONNX/推理引擎中的分解与融合写法，以及 FP16 下的数值陷阱。归一化族的总览见 [Norm](0613_ML_Op_Norm)，依赖 batch 统计量的版本见 [BatchNorm](0614_ML_Op_Norm_BatchNorm)。

## 目的

- 稳定深层网络每层输入的分布，缓解梯度爆炸/消失，允许更大学习率、更快收敛。
- 摆脱对 batch 的依赖：BatchNorm 在 batch 很小、序列长度可变、自回归解码（batch 内样本互不对齐）时统计量不可靠，且训练/推理行为不同（running mean/var）；LayerNorm 对每个 token 独立计算，训练推理完全一致。
- 为什么 Transformer 用 LN：NLP 输入是变长序列并含 padding，按 batch 维统计会混入 padding 与不同位置的 token；按 token 的 hidden 维统计则天然独立。同时 LN 推理时无需维护 running 统计量，部署简单。

## 数学定义

设输入 $x \in \mathbb{R}^{H}$（对某个 token 的 hidden 维），LayerNorm：

$$
\mu = \frac{1}{H}\sum_{i=1}^{H} x_i,\qquad
\sigma^2 = \frac{1}{H}\sum_{i=1}^{H}(x_i-\mu)^2
$$

$$
y_i = \frac{x_i-\mu}{\sqrt{\sigma^2+\epsilon}}\cdot \gamma_i + \beta_i
$$

其中 $\gamma,\beta\in\mathbb{R}^{H}$ 为可学习的仿射参数（`elementwise_affine=True` 时存在），$\epsilon$ 通常取 $10^{-5}$（PyTorch 默认）。注意方差是**有偏估计**（除以 $H$ 而非 $H-1$）。

### RMSNorm

RMSNorm 只用均方根做缩放，不减均值，也通常没有 $\beta$：

$$
\mathrm{RMS}(x)=\sqrt{\frac{1}{H}\sum_{i=1}^{H}x_i^2+\epsilon},\qquad
y_i=\frac{x_i}{\mathrm{RMS}(x)}\cdot\gamma_i
$$

动机：论文观点认为 LN 的有效性主要来自 re-scaling 不变性，而 re-centering（去均值）贡献很小。去掉均值后：

- 少一次 reduce（只需 $\sum x^2$，不需要先求 $\mu$ 再求 $\sum (x-\mu)^2$，可单 pass 完成）；
- 少一次逐元素减法与一个参数向量 $\beta$；
- 实测速度有一定提升，具体比例依硬件和实现而定（待核实，不给固定数字）。

### GroupNorm / InstanceNorm 简述

对 4D 输入 $(N,C,H,W)$：

| 层 | 统计量的归约范围 | 典型场景 |
|---|---|---|
| BatchNorm | $(N,H,W)$，每个通道一组 | CNN 分类，大 batch |
| LayerNorm | $(C,H,W)$，每个样本一组 | Transformer；CNN 中较少 |
| InstanceNorm | $(H,W)$，每个样本每个通道一组 | 风格迁移、生成模型 |
| GroupNorm | 通道分成 $G$ 组，每组 $(C/G,H,W)$ | 小 batch 的检测/分割、Diffusion UNet |

GroupNorm 在 $G=1$ 时等价于对 $(C,H,W)$ 的 LayerNorm，在 $G=C$ 时等价于 InstanceNorm。三者统计量都不依赖 batch，训练推理一致。

## 输入输出 shape 与参数

PyTorch：`torch.nn.LayerNorm(normalized_shape, eps=1e-5, elementwise_affine=True, bias=True)`。

- `normalized_shape`：输入**最后几维**的 shape。输入为 `[B, T, H]` 时，`normalized_shape=H`（或 `[H]`）表示对每个 token 的 hidden 维归一化；若为 `[T, H]` 则对整个 `T×H` 块求一组统计量。
- 输出 shape 与输入相同。
- `weight`/`bias` 的 shape 等于 `normalized_shape`。
- 前面的维度（`B`、`T`）都是独立的"行"，因此 LN 本质是对一个 `[rows, H]` 矩阵逐行做归一化。
- RMSNorm：`torch.nn.RMSNorm(normalized_shape, eps=None, elementwise_affine=True)` 在较新的 PyTorch 版本中提供（具体起始版本待核实）；老版本需自己实现。
- GroupNorm：`nn.GroupNorm(num_groups, num_channels)`，要求 `num_channels % num_groups == 0`；InstanceNorm：`nn.InstanceNorm2d(C, affine=False, track_running_stats=False)`，默认**无**仿射参数，也不跟踪 running stats。

## 典型用法

```python
import torch, torch.nn as nn

x = torch.randn(2, 16, 768)            # [B, T, H]
ln = nn.LayerNorm(768)                 # 对最后一维归一化
y = ln(x)

# 手写等价实现（用于理解/导出分解）
mu  = x.mean(-1, keepdim=True)
var = ((x - mu) ** 2).mean(-1, keepdim=True)
y2  = (x - mu) / torch.sqrt(var + 1e-5) * ln.weight + ln.bias
assert torch.allclose(y, y2, atol=1e-5)

class RMSNorm(nn.Module):
    def __init__(self, dim, eps=1e-6):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))
    def forward(self, x):
        # 先转 FP32 做归约，再转回原 dtype
        xf = x.float()
        xf = xf * torch.rsqrt(xf.pow(2).mean(-1, keepdim=True) + self.eps)
        return xf.to(x.dtype) * self.weight

gn = nn.GroupNorm(num_groups=32, num_channels=256)
inn = nn.InstanceNorm2d(64)
```

函数式：`torch.nn.functional.layer_norm(x, normalized_shape, weight, bias, eps)`。ONNX 中对应算子为 `LayerNormalization`（opset 17 引入）、`GroupNormalization`（opset 18）、`InstanceNormalization`；RMSNorm 在标准 ONNX 中较晚才有对应算子（具体 opset 待核实），之前一般以基础算子分解。

## pre-LN 与 post-LN

```
post-LN (原始 Transformer):  x = LN(x + Sublayer(x))
pre-LN  (GPT-2 / LLaMA 等):  x = x + Sublayer(LN(x))
```

- post-LN：残差分支输出再归一化，浅层效果好，但深层时输出层附近梯度较大，训练需要 learning rate warmup，层数很深时容易不稳定。
- pre-LN：归一化放在子层输入，残差主干保持恒等通路，梯度更平稳，通常可不用或少用 warmup，是大模型的主流选择；代价是主干上激活范数随层数增长，最终需要一个 final LN，且在某些任务上最终精度略逊于调优良好的 post-LN（经验观点）。
- 现代 LLM 常见组合：pre-norm + RMSNorm（在 [MHA](0500_ML_Attention_MHA) 与 FFN 之前各一次）。

## 不同实现与优化

### 朴素实现的访存问题

按公式逐步展开需要多个 kernel：mean、sub、pow、mean、add eps、sqrt、div、mul、add。每一步都读写整个 `[rows, H]` 张量，LN 是典型的 **memory-bound** 算子，瓶颈在显存带宽而不是算力。

### 融合 kernel

- **fused LN**：一个 kernel 内每个 block/warp 负责一行（或若干行），把该行读入寄存器/共享内存，一次完成求和、方差、归一化、仿射并写回，全局内存只读一次、写一次。
- **单 pass 方差**：用 Welford 算法或同时累加 $\sum x$ 与 $\sum x^2$（后者在 $|\mu|\gg\sigma$ 时有灾难性抵消的风险，需用 FP32 累加或 Welford）。
- **Apex FusedLayerNorm / FlashAttention 仓库中的 fused 实现风格**：把 LN 与前后的 elementwise 融合，典型是 `residual add + dropout + LayerNorm`（"fused add & norm"），即 `y = LN(x + residual)`，同时输出新的残差流，省掉一次完整的读写。具体 kernel 名称与接口以对应仓库为准，本文不展开。
- **向量化访存**：按 128-bit 加载（FP16 一次 8 个元素），`H` 为 8 的倍数时效率最高。
- **反向**：需要保存 `mean` 与 `rstd`（每行 2 个标量），反向时重算 $\hat{x}$；$\gamma,\beta$ 的梯度需要跨行归约，通常分两级 reduce。
- 编译器路径：`torch.compile`（Inductor）可把分解后的 LN 自动融合为单个 Triton kernel。

### ONNX 与推理引擎

opset 17 之前，LN 导出为一串基础算子：

```
ReduceMean -> Sub -> Pow(2) -> ReduceMean -> Add(eps) -> Sqrt -> Div -> Mul(gamma) -> Add(beta)
```

RMSNorm 的分解则是 `Pow(2) -> ReduceMean -> Add(eps) -> Sqrt -> Div(或 Reciprocal+Mul) -> Mul(gamma)`。opset 17 起 `LayerNormalization` 是一个单独算子，属性有 `axis`（默认 -1，从该轴起到末尾均参与归一化，对应 `normalized_shape`）、`epsilon`、`stash_type`（默认 1，即 FP32，指定统计量的计算精度），输出可选 `Mean` 与 `InvStdDev`。

推理引擎（OpenVINO、TensorRT、ONNX Runtime 等）的常见做法：

- 图优化阶段用 pattern matching 把上述分解子图识别并融合为内部的 LayerNorm / MVN（Mean Variance Normalization）/ RMS 节点，再调用高度优化的 kernel；
- 模式匹配对子图结构敏感：用 `x * x` 还是 `Pow`、`1/sqrt` 还是 `rsqrt`、eps 的加法位置不同，都可能导致融合失败，性能下降明显；
- 融合后还可能与前后的 `Add`（残差）、量化/反量化节点继续融合；
- 若导出 ONNX 后发现 LN 没被融合，先检查导出 opset 是否 ≥ 17，再用引擎的图可视化/日志确认节点是否被识别。

## 常见坑

1. **FP16 溢出**：$x^2$ 在 FP16 下最大约 65504，当激活幅值超过 $\approx 255$ 时平方即溢出为 inf，导致 NaN。大模型中常有少数通道的巨大离群值（outlier）。解决：归约在 FP32 中进行。
2. **FP32 累加**：即使不溢出，FP16/BF16 做长度 $H$ 的求和也会有显著舍入误差，kernel 应使用 FP32 累加器；ONNX `stash_type` 即为此设计。PyTorch autocast 下 `layer_norm` 会自动以 FP32 运行。
3. **手写分解不自动保护**：自己实现 RMSNorm 时若 `x.pow(2).mean()` 直接在 FP16 上算，就会踩 1、2 两个坑；参考上面代码先 `.float()`。
4. **eps 位置与取值**：`sqrt(var + eps)` 与 `sqrt(var) + eps` 不等价；不同框架默认 eps 不同（LN 常见 $10^{-5}$，LLaMA 的 RMSNorm 常见 $10^{-5}$ 或 $10^{-6}$，以模型配置为准），转换模型时必须对齐，否则精度有小偏差。
5. **`normalized_shape` 写错**：CNN 中对 `[N,C,H,W]` 若写 `LayerNorm(C)` 会作用在最后一维 `W` 上而不是通道，需 permute 或使用 `GroupNorm(1, C)`。
6. **padding 与 mask**：LN 逐 token 独立，padding token 不会污染有效 token，但 padding 位置输出无意义，别把它参与后续统计。
7. **小方差**：常数输入时 $\sigma^2=0$，输出由 $\epsilon$ 决定，$\hat{x}=0$；$\epsilon$ 过小在低精度下可能下溢。
8. **量化**：LN 对输入分布很敏感，INT8 量化时通常保留 LN 为 FP16/FP32，或使用专门的量化 LN kernel。

## 与其他 OP 的关系

- [BatchNorm](0614_ML_Op_Norm_BatchNorm)：同属 Norm 家族，区别仅在归约维度；BN 推理时可折叠进前一层 [Convolution](0009_ML_Op_Convolution) / [Linear](0612_ML_Op_Linear)，LN 因为统计量依赖输入，**不能**折叠，只能做 kernel 融合。
- [Attention](0210_ML_Attention) / [MHA](0500_ML_Attention_MHA)：每个 Transformer block 中 Attention 与 FFN 前（pre-LN）或后（post-LN）各有一个 LN。
- [Softmax](0335_ML_Op_AF_Softmax)：同样是沿最后一维归约的逐行算子，融合实现与访存分析思路类似。
- [Dropout](0258_ML_Op_Dropout)：训练时常与 residual add、LN 融合为一个 kernel。
- [Elementwise](0620_ML_Op_Elementwise) 与 [Shape](0621_ML_Op_Shape)：分解形式中的 Sub/Pow/Mul/Add 及 Reshape 都属于这类算子，是融合的对象。
- [激活函数](0279_ML_Op_AF)：FFN 内的 GELU/SwiGLU 等与 LN 一起构成 block 的主要逐元素/归约开销。

## Reference

- Layer Normalization, Ba et al.: https://arxiv.org/abs/1607.06450
- Root Mean Square Layer Normalization, Zhang & Sennrich: https://arxiv.org/abs/1910.07467
- Group Normalization, Wu & He: https://arxiv.org/abs/1803.08494
- Instance Normalization: The Missing Ingredient for Fast Stylization: https://arxiv.org/abs/1607.08022
- On Layer Normalization in the Transformer Architecture: https://arxiv.org/abs/2002.04745
- PyTorch LayerNorm: https://pytorch.org/docs/stable/generated/torch.nn.LayerNorm.html
- PyTorch GroupNorm: https://pytorch.org/docs/stable/generated/torch.nn.GroupNorm.html
- PyTorch InstanceNorm2d: https://pytorch.org/docs/stable/generated/torch.nn.InstanceNorm2d.html
- ONNX LayerNormalization: https://onnx.ai/onnx/operators/onnx__LayerNormalization.html
- ONNX GroupNormalization: https://onnx.ai/onnx/operators/onnx__GroupNormalization.html
- NVIDIA Apex: https://github.com/NVIDIA/apex

