---
Title | ML Op AF ReLU
-- | --
Created @ | `2026-11-10T09:50:17Z`
Updated @| `2026-11-10T09:50:17Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/616)

---
# ML Op AF ReLU 系与现代激活函数

ReLU 家族及其后续演化出的现代激活函数（GELU、SiLU/Swish、Mish、HardSwish 等），是现代 CNN、Transformer 与 LLM 中最常见的逐元素（elementwise）非线性算子。本文从公式、导数、优缺点、典型模型与推理引擎实现（inplace、LUT/分段多项式、post-op 融合、量化、`exp`/`erf` 向量化）几个角度做对比。激活函数的总体介绍见 [激活函数](0279_ML_Op_AF)，经典 S 型激活见 [Sigmoid](0280_ML_Op_AF_Sigmoid)，归一化类概率输出见 [Softmax](0335_ML_Op_AF_Softmax)。

## 目的

- 为网络引入非线性：没有激活函数，多层 [Linear](0612_ML_Op_Linear) / [Convolution](0009_ML_Op_Convolution) 的堆叠仍然等价于一个线性变换。
- 缓解 Sigmoid/Tanh 的梯度饱和：$\sigma'(x)\le 0.25$，深层网络反向传播时梯度指数衰减。
- 降低计算代价：ReLU 只需一次比较；而 GELU/Swish/Mish 引入 `exp`/`erf`/`tanh`，精度更好但算子更重，这直接催生了 HardSwish、GELU-tanh 近似等"便宜版本"。
- 在 LLM 的 FFN 中，用门控（gating）结构提升表达力：GLU / SwiGLU / GeGLU。

## 数学定义与导数

### ReLU 及其变体

$$\mathrm{ReLU}(x)=\max(0,x),\qquad \mathrm{ReLU}'(x)=\begin{cases}1&x>0\\0&x<0\end{cases}$$

$x=0$ 处不可导，框架约定导数取 0（PyTorch）。

**LeakyReLU**（负半轴小斜率 $\alpha$，常取 0.01）：

$$f(x)=\begin{cases}x&x\ge0\\\alpha x&x<0\end{cases},\quad f'(x)=\begin{cases}1&x>0\\\alpha&x<0\end{cases}$$

**PReLU**：$\alpha$ 为可学习参数，可以每通道一个，也可以整层共享一个。

$$f(x_c)=\max(0,x_c)+a_c\min(0,x_c)$$

**ReLU6**：把上界截断到 6，主要为低精度定点表示服务。

$$\mathrm{ReLU6}(x)=\min(\max(0,x),6)$$

**ELU**：

$$\mathrm{ELU}(x)=\begin{cases}x&x>0\\\alpha(e^{x}-1)&x\le0\end{cases}$$

**SELU**：ELU 乘以固定的缩放系数，$\lambda\approx1.0507,\ \alpha\approx1.6733$，配合特定初始化（LeCun normal）与 AlphaDropout，可使激活在前向中自归一化（self-normalizing）。

$$\mathrm{SELU}(x)=\lambda\cdot\mathrm{ELU}_\alpha(x)$$

### GELU

$$\mathrm{GELU}(x)=x\,\Phi(x)=\frac{x}{2}\left(1+\mathrm{erf}\!\left(\frac{x}{\sqrt2}\right)\right)$$

其中 $\Phi$ 为标准正态分布 CDF。tanh 近似（BERT/GPT-2 的原始实现）：

$$\mathrm{GELU}_{\tanh}(x)=\frac{x}{2}\left(1+\tanh\!\left(\sqrt{\tfrac{2}{\pi}}\,(x+0.044715\,x^3)\right)\right)$$

导数（精确版）：

$$\mathrm{GELU}'(x)=\Phi(x)+x\,\varphi(x),\quad \varphi(x)=\frac{1}{\sqrt{2\pi}}e^{-x^2/2}$$

另有一个更廉价的近似 $x\,\sigma(1.702x)$，本质上是 SiLU 的缩放形式。

### SiLU / Swish

$$\mathrm{SiLU}(x)=x\,\sigma(x),\qquad \mathrm{SiLU}'(x)=\sigma(x)\bigl(1+x(1-\sigma(x))\bigr)$$

Swish 的一般形式为 $x\,\sigma(\beta x)$，$\beta=1$ 时即 SiLU。该函数非单调：在 $x\approx-1.28$ 附近有一个小的负向最小值。

### Mish

$$\mathrm{Mish}(x)=x\tanh\bigl(\mathrm{softplus}(x)\bigr)=x\tanh\bigl(\ln(1+e^x)\bigr)$$

平滑、非单调，YOLOv4 的 backbone（CSPDarknet53）使用过。代价是 `exp` + `log` + `tanh` 三次超越函数，是本文中最重的一个。

### HardSigmoid / HardSwish

用分段线性/二次函数近似 Sigmoid 与 Swish，完全避免 `exp`：

$$\mathrm{HardSigmoid}(x)=\frac{\mathrm{ReLU6}(x+3)}{6},\qquad \mathrm{HardSwish}(x)=x\cdot\frac{\mathrm{ReLU6}(x+3)}{6}$$

HardSwish 导数：$x<-3$ 为 0；$x>3$ 为 1；中间为 $\frac{2x+3}{6}$。MobileNetV3 采用。注意 PyTorch 的 `nn.Hardsigmoid` 采用 $\mathrm{ReLU6}(x+3)/6$，而 Keras 等框架的 hard_sigmoid 使用 $0.2x+0.5$，两者不同，迁移模型时需留意。

### GLU 系（LLM FFN）

GLU 把输入沿某一维切成两半（或用两个独立 Linear 产生两路），一路作门控：

$$\mathrm{GLU}(a,b)=a\otimes\sigma(b)$$

后续变体把 $\sigma$ 换成别的激活：

$$\mathrm{GeGLU}(x)=\mathrm{GELU}(xW)\otimes(xV),\qquad \mathrm{SwiGLU}(x)=\mathrm{SiLU}(xW)\otimes(xV)$$

用在 Transformer FFN 中：

$$\mathrm{FFN}_{\mathrm{SwiGLU}}(x)=\bigl(\mathrm{SiLU}(xW_{\text{gate}})\otimes xW_{\text{up}}\bigr)W_{\text{down}}$$

由于多了一个投影矩阵，为保持参数量不变，隐藏维度通常由 $4d$ 缩小为约 $\tfrac{8}{3}d$（LLaMA 等再向上对齐到 256 等倍数）。详见 [Transformer](0229_ML_Transformer)。

## 输入输出与参数

| 算子 | 输入 shape | 输出 shape | 参数 |
|---|---|---|---|
| ReLU / ReLU6 / SiLU / Mish / HardSwish / HardSigmoid | 任意 | 与输入相同 | 无（ReLU 有 `inplace`） |
| LeakyReLU | 任意 | 同输入 | `negative_slope`（默认 0.01） |
| PReLU | $[N,C,\ldots]$ | 同输入 | `num_parameters`（1 或 $C$）、`init`（默认 0.25） |
| ELU / CELU | 任意 | 同输入 | `alpha`（默认 1.0） |
| GELU | 任意 | 同输入 | `approximate='none'`/`'tanh'` |
| GLU | 沿 `dim` 为偶数 | 该维减半 | `dim`（默认 -1） |
| SwiGLU / GeGLU | $[B,T,d]$ | $[B,T,d_{ff}]$ | 由两个 Linear 组成，非单一算子 |

## 典型用法

```python
import torch, torch.nn as nn, torch.nn.functional as F

x = torch.randn(2, 8, 16, 16)
y1 = nn.ReLU(inplace=True)(x.clone())
y2 = nn.LeakyReLU(0.1)(x)
y3 = nn.PReLU(num_parameters=8)(x)         # 每通道一个斜率
y4 = F.gelu(x)                              # erf 精确版
y5 = F.gelu(x, approximate='tanh')          # tanh 近似
y6 = F.silu(x)                              # Swish-1
y7 = F.mish(x)
y8 = F.hardswish(x)
y9 = nn.ReLU6()(x)

class SwiGLUFFN(nn.Module):
    def __init__(self, d, hidden):
        super().__init__()
        self.w_gate = nn.Linear(d, hidden, bias=False)
        self.w_up   = nn.Linear(d, hidden, bias=False)
        self.w_down = nn.Linear(hidden, d, bias=False)
    def forward(self, x):
        return self.w_down(F.silu(self.w_gate(x)) * self.w_up(x))
```

ONNX 对应：`Relu`、`LeakyRelu`、`PRelu`、`Elu`、`Selu`、`Celu`、`HardSigmoid`、`HardSwish`（opset 14）、`Gelu`（opset 20，带 `approximate` 属性）、`Mish`（opset 18）。SiLU 没有独立算子，导出为 `Sigmoid` + `Mul`；低版本 opset 下 GELU 会被展开为 `Div/Erf/Add/Mul` 的子图，推理引擎需做模式匹配融合。ReLU6 导出为 `Clip(min=0,max=6)`。

## 对比

| 激活 | 平滑 | 单调 | 负半轴 | 超越函数 | 典型使用 |
|---|---|---|---|---|---|
| ReLU | 否 | 是 | 恒 0 | 无 | ResNet、VGG 等经典 CNN |
| LeakyReLU | 否 | 是 | 小斜率 | 无 | GAN 判别器、YOLOv3 / v2 |
| PReLU | 否 | 通常是 | 可学习斜率 | 无 | 早期人脸识别、超分网络 |
| ELU/SELU | 是（ELU 一阶不连续于 $\alpha\ne1$ 的二阶） | 是 | 指数饱和到 $-\alpha$ | `exp` | 自归一化 MLP |
| ReLU6 | 否 | 是 | 恒 0，上界 6 | 无 | MobileNetV1/V2，量化部署 |
| GELU | 是 | 否 | 小负值 | `erf` / `tanh` | BERT、GPT、ViT |
| SiLU | 是 | 否 | 小负值 | `exp` | EfficientNet、YOLOv5/v8、LLM（SwiGLU 内部） |
| Mish | 是 | 否 | 小负值 | `exp,log,tanh` | YOLOv4 |
| HardSwish | 否（分段） | 否 | 小负值 | 无 | MobileNetV3 |
| SwiGLU/GeGLU | 是 | 否 | 门控 | `exp` / `erf` | LLaMA 系、PaLM、Gemma 系（具体型号待核实） |

## 优缺点与梯度行为

- **ReLU**：正半轴梯度恒为 1，不饱和，计算极快，产生稀疏激活。缺点是 **dying ReLU**：若某神经元因大学习率或偏置过负，使其对所有输入的预激活都 $<0$，则梯度恒为 0，权重再无法更新。BatchNorm 与合理初始化（He init）能显著缓解。
- **LeakyReLU/PReLU**：负半轴保留小梯度，避免神经元死亡；PReLU 增加少量参数，小数据集上可能过拟合。
- **ELU/SELU**：负半轴的平滑饱和使均值向 0 靠近，但 `exp` 较贵；SELU 的自归一化只在严格条件（全连接、LeCun init、不用 BN）下成立，CNN 中收益有限。
- **GELU/SiLU/Mish**：平滑且非单调，大量经验结果显示在深层网络、Transformer 中训练更稳、精度略好。缺点是推理成本高、对低比特量化不友好（输出分布在负半轴有小凹陷、范围无上界）。
- **HardSwish**：精度接近 Swish，但完全由 `min/max/mul` 组成，适合移动端与定点计算。
- **GLU 系**：多一个矩阵乘，参数/计算增加，但同等参数预算下通常效果更好，已成为 LLM 的主流 FFN 结构。

## 实现差异与优化

### inplace

`ReLU(inplace=True)` 直接覆盖输入缓冲区，节省一次激活的显存分配。注意：若前一个算子的反向需要其输出（例如某些 BN 的实现或需要原值的残差分支），inplace 会触发 autograd 报错 `modified by an inplace operation`；推理引擎中的 inplace 则是由内存规划（buffer reuse）自动完成，前提是该张量没有其他消费者。

### 融合进 Conv/Linear 的 post-op

激活是 memory-bound 算子，单独运行时带宽消耗大。主流做法是在 [Convolution](0009_ML_Op_Convolution) / [Linear](0612_ML_Op_Linear) 的输出写回前，在寄存器内直接应用激活：

- oneDNN 的 post-ops（`eltwise`）支持 relu、gelu_erf、gelu_tanh、swish、hardswish、mish、clip 等，并可与 BN 折叠、`sum`（残差加）、`binary` 链式组合。
- OpenVINO、TensorRT 等会在图优化阶段识别 `Conv + BN + ReLU`、`MatMul + Add + GELU` 等模式，融合为单一 kernel。
- ReLU / ReLU6 / Clip 还能在量化中被"吸收"到输出的 requantize 步骤：ReLU 等价于把输出量化范围的下界设为零点，不需要额外的 kernel。

### `exp` / `erf` / `tanh` 的向量化

- 标量库的 `expf`、`erff` 不能直接向量化，SIMD 实现通常：范围缩减 $e^x=2^{n}\cdot e^{r}$，其中 $n=\mathrm{round}(x/\ln2)$、$r$ 为余项，再对 $e^r$ 用低阶（4–6 阶）多项式（minimax）近似，最后用整数加法把 $n$ 加到指数位上。AVX2/AVX-512 版本的精度在数个 ULP 内。
- Sigmoid/SiLU：$\sigma(x)=1/(1+e^{-x})$，常用 `exp` 加快速倒数（`rcp` + Newton 迭代）；需要对 $x$ 做 clamp 防止 `exp` 溢出。
- `erf`：常用 Abramowitz–Stegun 类的有理/多项式近似，或分区间多项式。GELU-tanh 版只需 `tanh`，而 `tanh` 又可用 `exp` 或有理逼近；因此 "GELU 精确版 vs tanh 版" 在 GPU 上差异很小，在 CPU 上 tanh 版往往更快，但数值上与精确版有约 $10^{-3}$ 级别的差异，**训练用哪个，推理就应该用哪个**。
- 小输入域可用 LUT：例如对 INT8 输入只有 256 种取值，激活直接预计算为 256 项表，一次 `gather`/`pshufb` 完成，任意复杂激活（Mish、GELU）在量化推理中的成本与 ReLU 相当。FP16/BF16 也可对 16 位输入做 65536 项的表，但缓存压力较大，实践中更常用分段多项式。
- 分段多项式/分段线性：GPU 的 SFU 提供 `ex2`、`rcp` 等硬件近似，PyTorch 的 `fast-math` 与 Triton/CUDA 的 `__expf` 就是利用这一点，精度略降。

### 量化友好性

- **ReLU6 / HardSwish / HardSigmoid**：输出范围有界（ReLU6 为 $[0,6]$），激活量化的 scale 可以静态确定，对 INT8 友好；这也是 MobileNet 系列选择 ReLU6 的主要原因之一。
- **GELU/SiLU/Swish**：无上界、含平滑非线性，PTQ 下常出现精度损失，尤其在 Transformer 的 FFN 之后存在大量离群值（outlier）；常见对策是保留 FP16/BF16、用 LUT 实现、或做 SmoothQuant 一类的预处理。
- HardSwish 在 INT8 下通常用 LUT 或整数分段运算实现；MobileNetV3 在 TFLite 量化中的行为需要注意不同后端的 $x+3$ 与 $/6$ 的舍入细节。

## 常见坑

1. **GELU 版本不一致**：PyTorch `F.gelu` 默认精确 erf；TensorFlow/BERT 早期代码、HuggingFace 中的 `gelu_new` / `gelu_fast` 为 tanh 或 sigmoid 近似。导出与推理时选错会导致输出出现小偏差，累积后影响 logits。
2. **inplace 破坏 autograd 或残差分支**：`ReLU(inplace=True)` 作用在被其他分支复用的张量上，会得到错误结果或报错。
3. **PReLU 的 `num_parameters` 与通道数不匹配**，或在 ONNX 中斜率的广播形状错误（需 `[C,1,1]`）。
4. **HardSigmoid 定义不同**：PyTorch 为 $(x+3)/6$ 的 clip，ONNX `HardSigmoid` 默认 `alpha=0.2, beta=0.5`，导出时 PyTorch 会显式设置属性，手写模型转换需核对。
5. **dying ReLU 与 LR 过大**：训练发散后大量输出恒 0；可降低学习率、改用 LeakyReLU/ELU，或检查初始化与归一化。
6. **SiLU 在低版本导出为 Sigmoid+Mul**，在不识别该模式的后端上多出两个 elementwise kernel，造成显著的延迟，需要图融合 pass。
7. **FP16 下 `exp` 溢出**：Mish/SiLU 的 `exp(x)` 在 $x>11$（FP16 约 $\ln 65504$）溢出，实现中应使用稳定形式（如 softplus 的阈值分支）。
8. **GLU 的 `dim` 维度必须为偶数**，导出到 ONNX 时被拆成 `Split + Sigmoid + Mul`。

## 与其他 OP 的关系

- [Sigmoid](0280_ML_Op_AF_Sigmoid)：SiLU、HardSigmoid、GLU 都由 Sigmoid 构造或近似；Sigmoid 的输出又常作为 SE 模块的通道门控。
- [Softmax](0335_ML_Op_AF_Softmax)：同样是带 `exp` 的算子，但它是跨元素的归一化，而不是逐元素；其数值稳定技巧（减最大值）可类比到 Mish/softplus。
- [Elementwise](0620_ML_Op_Elementwise)：所有这些激活在图中被归为一元 elementwise 算子，与 `Add/Mul/Clip` 等共同参与融合；ReLU6 即 `Clip`。
- [Convolution](0009_ML_Op_Convolution) / [Linear](0612_ML_Op_Linear)：激活的主要融合对象；`Conv-BN-ReLU` 是 CNN 推理的标准融合单元，另见 [BatchNorm](0614_ML_Op_Norm_BatchNorm)、[Norm](0613_ML_Op_Norm)、[LayerNorm](0615_ML_Op_Norm_LayerNorm)（Transformer 中 LN + FFN(GELU/SwiGLU) 的组合）。
- [Dropout](0258_ML_Op_Dropout)：SELU 配合 AlphaDropout 使用；普通 Dropout 对 ReLU 之后的稀疏激活作用方式略有不同。
- [Transformer](0229_ML_Transformer)：FFN 中的 GELU / SwiGLU / GeGLU。
- [激活函数](0279_ML_Op_AF)、[ML Op 总览](0366_ML_Op)：整体分类与索引。

## Reference

- PyTorch 激活函数文档：https://pytorch.org/docs/stable/nn.html#non-linear-activations-weighted-sum-nonlinearity
- ONNX 算子文档：https://onnx.ai/onnx/operators/
- Delving Deep into Rectifiers (PReLU / He init)：https://arxiv.org/abs/1502.01852
- Fast and Accurate Deep Network Learning by Exponential Linear Units (ELU)：https://arxiv.org/abs/1511.07289
- Self-Normalizing Neural Networks (SELU)：https://arxiv.org/abs/1706.02515
- Gaussian Error Linear Units (GELU)：https://arxiv.org/abs/1606.08415
- Searching for Activation Functions (Swish)：https://arxiv.org/abs/1710.05941
- Sigmoid-Weighted Linear Units (SiLU)：https://arxiv.org/abs/1702.03118
- Mish: A Self Regularized Non-Monotonic Activation Function：https://arxiv.org/abs/1908.08681
- Searching for MobileNetV3 (HardSwish)：https://arxiv.org/abs/1905.02244
- Language Modeling with Gated Convolutional Networks (GLU)：https://arxiv.org/abs/1612.08083
- GLU Variants Improve Transformer (SwiGLU / GeGLU)：https://arxiv.org/abs/2002.05202
- oneDNN Eltwise / Post-ops：https://uxlfoundation.github.io/oneDNN/

