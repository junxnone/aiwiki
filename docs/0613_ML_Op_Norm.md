---
Title | ML Op Norm
-- | --
Created @ | `2026-11-10T09:50:11Z`
Updated @| `2026-11-10T09:50:11Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/613)

---
# ML Op Normalization 总览

Normalization（归一化）是深度学习网络中最常见的一类 OP：对中间激活（或权重）按某些轴计算统计量，把它们重新缩放到稳定的分布，再用可学习的参数恢复表达能力。它几乎出现在所有现代网络里：CNN 里是 [BatchNorm](0614_ML_Op_Norm_BatchNorm)，[Transformer](0229_ML_Transformer) 里是 [LayerNorm](0615_ML_Op_Norm_LayerNorm) 或 RMSNorm。本文给出各种 Normalization 的统一视角：为什么需要、沿哪些轴统计、训练/推理行为有何差异、如何选型。输入数据本身的预处理见 [数据归一化](0251_ML_PreP_DataNorm)，其他 OP 见 [ML Op 总览](0366_ML_Op)。

## 目的：为什么需要 Normalization

1. **稳定优化**：深层网络中每层输出的尺度会随层数指数漂移，导致梯度爆炸/消失。归一化把每层输入拉回近似零均值、单位方差，使得可以用更大的学习率、对初始化不那么敏感。
2. **加速收敛**：BN 论文报告在 ImageNet 上用更少的训练步数达到相同精度（具体倍数以原文为准）。
3. **隐式正则**：BN 在训练时用 mini-batch 统计量，引入了样本间的噪声，有轻微的正则效果，有时可以减弱对 [Dropout](0258_ML_Op_Dropout) 的依赖，参见 [Regularization](0252_ML_Op_Regularization)。
4. **缓解对激活函数饱和区的依赖**：把输入拉回 0 附近，使 sigmoid/tanh 不易饱和，ReLU 也不易全部死亡，参见 [激活函数](0279_ML_Op_AF)。

### ICS 争议与 loss landscape 平滑

BN 原论文的动机是缓解 **Internal Covariate Shift (ICS)**：前层参数更新使后层输入分布不断变化，迫使后层持续适应。

后续研究（Santurkar et al., *How Does Batch Normalization Help Optimization?*, 2018）对此提出质疑：
- 在 BN 之后人为注入随机分布漂移，训练速度几乎不受影响，说明 ICS 的缓解不是 BN 有效的主因；
- 更合理的解释是 BN 使 **loss landscape 更平滑**：loss 与梯度的 Lipschitz 常数更小（梯度更 "可预测"、$\beta$-smoothness 更好），因此可以使用更大的步长而不发散。

目前的共识：ICS 不是完整解释，"平滑优化曲面 + 尺度不变性带来的有效学习率自适应" 更被接受；但各解释仍有争论，不应把任何一种当成定论。

## 统一数学形式

对激活张量 $x$，选定一个统计集合 $S$（即 "沿哪些轴归一化"），则

$$
\mu_S = \frac{1}{|S|}\sum_{i\in S} x_i,\qquad
\sigma_S^2 = \frac{1}{|S|}\sum_{i\in S}(x_i-\mu_S)^2
$$

$$
\hat{x}_i = \frac{x_i-\mu_S}{\sqrt{\sigma_S^2+\epsilon}},\qquad
y_i = \gamma\,\hat{x}_i + \beta
$$

其中 $\epsilon$ 防止除零，$\gamma,\beta$ 为可学习的仿射参数（scale / shift），保证网络仍可表达恒等映射（取 $\gamma=\sqrt{\sigma^2+\epsilon},\beta=\mu$）。各种 Normalization 的区别几乎全部来自 **$S$ 的选取** 以及 **$\gamma,\beta$ 的形状**。

## 各种 Normalization 沿哪些轴统计

以图像特征 $x\in\mathbb{R}^{N\times C\times H\times W}$（$N$ batch，$C$ 通道）为例：

| 方法 | 统计集合 $S$ | 每个统计量的元素数 | 统计量个数 |
|---|---|---|---|
| BatchNorm | 对每个通道，跨 $N,H,W$ | $N\cdot H\cdot W$ | $C$ |
| LayerNorm | 对每个样本，跨 $C,H,W$（或仅最后若干维） | $C\cdot H\cdot W$ | $N$（或 $N\cdot H\cdot W$，取决于 `normalized_shape`） |
| InstanceNorm | 对每个样本每个通道，跨 $H,W$ | $H\cdot W$ | $N\cdot C$ |
| GroupNorm | 对每个样本每组通道，跨组内 $C/G,H,W$ | $(C/G)\cdot H\cdot W$ | $N\cdot G$ |
| RMSNorm | 同 LayerNorm 的轴，但不减均值 | 同 LN | 同 LN |

- GroupNorm 是 "中间态"：$G=1$ 退化为 LayerNorm（对 $C,H,W$ 整体），$G=C$ 退化为 InstanceNorm。
- 在 Transformer 中输入为 $[B,T,D]$，LayerNorm/RMSNorm 通常只沿最后一维 $D$ 统计，每个 token 独立。

### BatchNorm

$$\mu_c=\frac{1}{NHW}\sum_{n,h,w}x_{nchw},\quad y=\gamma_c\frac{x-\mu_c}{\sqrt{\sigma_c^2+\epsilon}}+\beta_c$$

训练用当前 batch 统计量并更新 running 统计量，推理用 running 统计量，因此是唯一在 train/eval 行为上有显著差异、且依赖 batch 的主流方法。详见 [BatchNorm](0614_ML_Op_Norm_BatchNorm)。

### LayerNorm

$$y=\gamma\odot\frac{x-\mu}{\sqrt{\sigma^2+\epsilon}}+\beta,\quad \mu,\sigma^2\text{ 沿 normalized\_shape 计算}$$

与 batch 无关，train/eval 行为一致，适合变长序列与小 batch。详见 [LayerNorm](0615_ML_Op_Norm_LayerNorm)。

### InstanceNorm

对每个样本每个通道单独归一化，去除了图像的 "风格" 统计信息（对比度等），因此在风格迁移（style transfer）中效果好。与 $H\times W$ 很小的特征图不适配（统计量噪声大）。

### GroupNorm

$$S_{n,g}=\{(c,h,w): \lfloor c/(C/G)\rfloor=g\}$$

不依赖 batch，在检测/分割等小 batch 场景下可替代 BN。要求 $C$ 能被 $G$ 整除，常用 $G=32$。

### RMSNorm

$$y=\gamma\odot\frac{x}{\sqrt{\frac1d\sum_{i}x_i^2+\epsilon}}$$

去掉了减均值和 $\beta$，计算量和访存更少，被 LLaMA 等大模型广泛采用。其假设是重新居中（re-centering）不重要，重新缩放（re-scaling）才是关键。

### Weight Normalization

不归一化激活，而是重参数化权重：

$$w=g\,\frac{v}{\lVert v\rVert}$$

把权重的方向 $v/\lVert v\rVert$ 与幅值 $g$ 解耦，完全不依赖 batch，开销小；常用于 RNN、生成模型。PyTorch 中为 `torch.nn.utils.parametrizations.weight_norm`。

### Spectral Normalization

用权重矩阵的最大奇异值（谱范数）缩放：

$$\bar W=\frac{W}{\sigma(W)},\quad \sigma(W)=\max_{\lVert h\rVert\le1}\lVert Wh\rVert$$

用 power iteration 近似 $\sigma(W)$，约束每层 Lipschitz 常数，主要用于稳定 GAN 的判别器训练。

### Local Response Normalization (LRN)

AlexNet 时代的做法，沿通道方向对相邻 $n$ 个通道的平方和做归一化：

$$b_{c}=a_{c}\Big(k+\alpha\sum_{j=\max(0,c-n/2)}^{\min(C-1,c+n/2)}a_j^2\Big)^{-\beta}$$

无可学习参数，后来基本被 BN 取代。PyTorch 为 `nn.LocalResponseNorm`，ONNX 为 `LRN`。

## 对比表

| 方法 | 统计对象 | 依赖 batch | 训练/推理差异 | 可学习参数 | 典型场景 |
|---|---|---|---|---|---|
| BN | 激活，$(N,H,W)$ | 是 | 有（running stats） | $\gamma,\beta$ 形状 $[C]$ | CNN 分类、大 batch |
| LN | 激活，每样本的特征轴 | 否 | 无 | $\gamma,\beta$ 形状 `normalized_shape` | Transformer、RNN、NLP |
| IN | 激活，每样本每通道 $(H,W)$ | 否 | 默认无（可选 track running stats） | 默认无（`affine=False`） | 风格迁移、图像生成 |
| GN | 激活，每样本每组 | 否 | 无 | $\gamma,\beta$ 形状 $[C]$ | 检测/分割、小 batch |
| RMSNorm | 激活，不减均值 | 否 | 无 | $\gamma$ | LLM |
| WeightNorm | 权重 | 否 | 无 | $g$ | RNN、生成模型 |
| SpectralNorm | 权重 | 否 | 无（power iteration 状态 eval 时固定） | 无 | GAN 判别器 |
| LRN | 激活，跨邻近通道 | 否 | 无 | 无 | 早期 CNN（AlexNet） |

## 输入输出与 PyTorch 用法

所有激活归一化均为 shape-preserving：输出 shape 与输入相同，另需 $\gamma,\beta$ 等参数张量。

```python
import torch, torch.nn as nn

x = torch.randn(8, 64, 32, 32)

bn = nn.BatchNorm2d(64)                    # 统计 (N,H,W)
ln = nn.LayerNorm([64, 32, 32])            # 统计 (C,H,W)
inn = nn.InstanceNorm2d(64, affine=True)   # 统计 (H,W)
gn = nn.GroupNorm(num_groups=32, num_channels=64)
lrn = nn.LocalResponseNorm(size=5)

# Transformer 风格: [B, T, D]
t = torch.randn(4, 128, 768)
ln_t = nn.LayerNorm(768)
rms = nn.RMSNorm(768)                      # PyTorch >= 2.4

# 权重归一化
from torch.nn.utils.parametrizations import weight_norm, spectral_norm
conv = weight_norm(nn.Conv2d(64, 64, 3))
conv2 = spectral_norm(nn.Conv2d(64, 64, 3))
```

ONNX 对应算子：`BatchNormalization`、`LayerNormalization`（opset 17）、`InstanceNormalization`、`GroupNormalization`（opset 18）、`RMSNormalization`（较新 opset，需确认所用版本）、`LpNormalization`、`LRN`。部分框架导出时会把 GroupNorm/RMSNorm 拆成 `ReduceMean/Sub/Pow/Sqrt/Div/Mul/Add` 等基础算子，推理引擎需要做图融合才能还原为单个高效 kernel。

## 选型建议

1. **CNN + 较大 batch（每卡约 16 以上）**：首选 BN；推理时可折叠进 Conv，几乎零开销。
2. **小 batch / 检测 / 分割 / 视频**：用 GN，或使用 SyncBN 扩大统计 batch。
3. **Transformer / NLP / 序列模型**：用 LN；大模型追求速度和显存时用 RMSNorm。
4. **风格迁移 / 图像生成**：IN（或 AdaIN 等条件变体）。
5. **GAN 判别器**：SpectralNorm，必要时配合其他归一化。
6. **需要部署到推理引擎**：优先选可以折叠/融合的（BN），或引擎有成熟融合 kernel 的（LN、GN）。

要注意：混合使用时（例如 CNN 末端接 Transformer head），各自的 train/eval 行为需要分别检查。

## Pre-Norm 与 Post-Norm

在残差结构中，归一化放置的位置影响训练稳定性：

$$\text{Post-Norm:}\quad x_{l+1}=\mathrm{Norm}\big(x_l+F(x_l)\big)$$

$$\text{Pre-Norm:}\quad x_{l+1}=x_l+F\big(\mathrm{Norm}(x_l)\big)$$

- **Post-Norm**（原始 Transformer）：归一化在残差相加之后。梯度需要穿过每一层的 Norm，深层时梯度范数在靠近输出处较大，训练初期需要 learning rate warmup，层数很深时容易训练不稳；但在能训练成功时，最终效果通常略好。
- **Pre-Norm**（GPT-2 之后的主流）：Norm 只放在分支内，残差主干保持恒等通路，梯度可直接回传，训练更稳定、对 warmup 不敏感，适合超深/超大模型。缺点是深层的主干范数不断增长，各层的贡献相对变小，可能导致表示崩塌（representation collapse）和略低的上限。
- 折中方案：DeepNorm、Sandwich-Norm 等在 Post-Norm 上调整残差缩放或增加额外 Norm，用于训练极深 Transformer（具体细节以原论文为准）。

实际大语言模型多数采用 Pre-Norm + RMSNorm。

## 不同实现与优化

- **融合（fusion）**：BN 在推理时可折叠进前面的 Conv/Linear（见 [BatchNorm](0614_ML_Op_Norm_BatchNorm)）；LN/RMSNorm 常与前后的 residual add、bias、激活融合成单个 kernel，减少访存。
- **统计量计算**：方差计算常用 Welford 算法或两遍法，避免 $E[x^2]-E[x]^2$ 在 FP16 下的灾难性抵消；大规模归约需用 warp/block 级 reduce。
- **混合精度**：统计量与归约通常用 FP32 累加，仅输入输出为 FP16/BF16。
- **跨设备**：BN 的统计量需要跨卡同步才等价于大 batch（SyncBN），LN/GN 不需要。
- **量化**：BN 通常折叠后再量化；LN/RMSNorm/Softmax 一类对精度敏感的 OP 在 INT8 部署中常保留在更高精度，参见 [Softmax](0335_ML_Op_AF_Softmax)。

## 常见坑

- **BN 在 eval 模式忘记调用 `model.eval()`**：推理时仍使用 batch 统计量，结果依赖于 batch 组成。
- **`normalized_shape` 选错**：LN 沿哪些轴归一化取决于参数；图像上 `LayerNorm(C)` 并不能直接作用于 NCHW 的通道维（需要先 permute 到 NHWC）。
- **GN 的分组数不整除通道数**会报错；$G$ 与精度有关，不是越大越好。
- **$\epsilon$ 位置与取值不同**：框架间 $\epsilon$ 一般加在方差外、根号内，但默认值不同（如 BN 为 1e-5，部分实现为 1e-3），导出/转换时需对齐。
- **偏置冗余**：Conv/Linear 后紧跟 BN 时，bias 会被均值抵消，可设置 `bias=False`。
- **batch=1 或空间大小为 1** 时 BN（训练）/IN 的方差为 0 或不可估计，会报错或输出退化。
- **FP16 溢出**：LN/RMSNorm 的平方和在 FP16 下可能溢出，需在 FP32 下累加。

## 与其他 OP 的关系

- 通常与 [Convolution](0009_ML_Op_Convolution) 或 [Linear](0612_ML_Op_Linear) 配对，位于其后（Conv-BN-ReLU）或位于残差分支内（Transformer）。
- 与 [激活函数](0279_ML_Op_AF)、[ReLU 系](0616_ML_Op_AF_ReLU) 的顺序（BN 在激活前还是后）影响分布，主流做法是线性层 → Norm → 激活。
- [Attention](0210_ML_Attention) 的 QK 归一化（QK-Norm）也是 Norm 的一种应用，用于稳定注意力 logits。
- 与 [Pooling](0268_ML_Op_Pooling) 不同：Pooling 改变空间尺寸，Norm 不改变 shape。
- 与 [Dropout](0258_ML_Op_Dropout) 同属 train/eval 行为可能不同的 OP（BN 与 Dropout 同时使用时有 variance shift 问题）。

## Reference

- Ioffe & Szegedy, *Batch Normalization: Accelerating Deep Network Training by Reducing Internal Covariate Shift*: https://arxiv.org/abs/1502.03167
- Ba et al., *Layer Normalization*: https://arxiv.org/abs/1607.06450
- Ulyanov et al., *Instance Normalization: The Missing Ingredient for Fast Stylization*: https://arxiv.org/abs/1607.08022
- Wu & He, *Group Normalization*: https://arxiv.org/abs/1803.08494
- Zhang & Sennrich, *Root Mean Square Layer Normalization*: https://arxiv.org/abs/1910.07467
- Salimans & Kingma, *Weight Normalization*: https://arxiv.org/abs/1602.07868
- Miyato et al., *Spectral Normalization for Generative Adversarial Networks*: https://arxiv.org/abs/1802.05957
- Santurkar et al., *How Does Batch Normalization Help Optimization?*: https://arxiv.org/abs/1805.11604
- Xiong et al., *On Layer Normalization in the Transformer Architecture*: https://arxiv.org/abs/2002.04745
- PyTorch `torch.nn` 归一化层文档: https://pytorch.org/docs/stable/nn.html#normalization-layers
- ONNX 算子文档: https://onnx.ai/onnx/operators/

