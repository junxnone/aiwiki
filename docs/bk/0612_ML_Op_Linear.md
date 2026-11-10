-----

| Title     | ML Op Linear                                          |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-10T09:50:09Z`                                |
| Updated @ | `2026-11-10T09:50:09Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/612) |

-----

# ML Op Linear

Linear（也称 Fully Connected / Dense / Affine 层）是深度学习中最基础的算子：对输入做一次仿射变换 $y
= xW^\\top + b$。它的计算核心是矩阵乘法（MatMul / GEMM），因此 MLP、Transformer 中的 QKV
投影、FFN、分类头，乃至 1x1 [Convolution](0009_ML_Op_Convolution) 在计算上都可以归结为
GEMM。现代大模型中，Linear/MatMul 通常占据 90% 以上的 FLOPs 与权重存储，因此它的实现方式（BLAS
库、融合、量化、权重布局）直接决定推理与训练性能。本文梳理 Linear 及其相关算子
MatMul、GEMM、ONNX Gemm、Einsum 的定义、shape、实现与常见坑。

## 目的

  - 对特征做可学习的线性映射：在不同维度空间之间投影（如 hidden -\> vocab、embedding dim -\> head
    dim）。
  - 与非线性（[激活函数](0279_ML_Op_AF)）交替堆叠，构成通用函数逼近器（MLP）。
  - 在 [Attention](0210_ML_Attention) 中提供 Q/K/V 与输出投影；在 FFN 中提供升维与降维。
  - 单独的线性层只能表达线性函数；两个连续线性层可合并为一个（$W\_2(W\_1x)=(W\_2W\_1)x$），所以必须夹非线性才有意义。

## 数学定义

单个样本，输入 $x \\in \\mathbb{R}^{in}$：

$$y = W x + b,\\quad W\\in\\mathbb{R}^{out\\times in},\\
b\\in\\mathbb{R}^{out}$$

按 batch 的行向量约定（PyTorch 使用）：

$$Y = X W^\\top + \\mathbf{1} b^\\top,\\quad X\\in\\mathbb{R}^{N\\times
in},\\ Y\\in\\mathbb{R}^{N\\times out}$$

逐元素写法：

$$Y\_{n,o} = \\sum\_{i=0}^{in-1} X\_{n,i},W\_{o,i} + b\_o$$

通用 GEMM（BLAS Level 3）的定义：

$$C \\leftarrow \\alpha,\\mathrm{op}(A),\\mathrm{op}(B) +
\\beta,C,\\quad \\mathrm{op}(A)\\in{A, A^\\top}$$

反向传播（令 $L$ 为 loss，$G=\\partial L/\\partial Y$）：

$$\\frac{\\partial L}{\\partial X}=G,W,\\quad \\frac{\\partial
L}{\\partial W}=G^\\top X,\\quad \\frac{\\partial L}{\\partial
b}=\\sum\_n G\_{n,:}$$

可见前向与两个反向都是 GEMM，三者 FLOPs 相同，训练总计约为推理的 3 倍。

## 相关算子对比

| 算子              | 框架                                | 语义                           | 是否含权重/bias |
| --------------- | --------------------------------- | ---------------------------- | ---------- |
| Linear          | `torch.nn.Linear`                 | $XW^\\top+b$，权重为 `[out, in]` | 是          |
| Fully Connected | Caffe `InnerProduct` / TF `Dense` | 同上，TF Dense 权重为 `[in, out]`  | 是          |
| MatMul          | ONNX `MatMul`、`torch.matmul`      | 纯矩阵乘，支持 numpy 风格 batch 广播    | 否          |
| GEMM            | BLAS `sgemm` / ONNX `Gemm`        | $\\alpha AB+\\beta C$，仅 2D   | C 可作 bias  |
| Einsum          | `torch.einsum`、ONNX `Einsum`      | 爱因斯坦求和，通用张量收缩                | 否          |

## 输入输出 shape 与参数

### torch.nn.Linear

  - 输入：`[*, in_features]`，`*` 为任意多个 batch 维度（如 `[B, T, C]`）。
  - 权重：`[out_features, in_features]`；bias：`[out_features]`（可
    `bias=False`）。
  - 输出：`[*, out_features]`。
  - 初始化：默认 Kaiming uniform，范围由 $1/\\sqrt{in}$ 决定。

### MatMul 的广播规则

  - `[M,K] x [K,N] -> [M,N]`。
  - 1D 向量会临时升维：`[K] x [K,N]` 左侧视为 `[1,K]`，结果再去掉该维。
  - 高维时前面的 batch 维按 numpy 规则广播：`[B,H,T,D] x [B,H,D,T] -> [B,H,T,T]`（见
    [SDPA](0499_ML_Attention_SDPA)）。

### ONNX Gemm

属性：`alpha`、`beta`、`transA`、`transB`；输入 `A`、`B`、可选 `C`（单向广播到
`[M,N]`）。PyTorch 导出 Linear 时，常见形式为 `Gemm(transB=1)`（二维输入）或 `MatMul +
Add`（高维输入）。

## 典型用法

``` python
import torch
import torch.nn as nn
import torch.nn.functional as F

fc = nn.Linear(in_features=768, out_features=3072)   # weight [3072, 768]
x = torch.randn(8, 128, 768)                         # [B, T, C]
y = fc(x)                                            # [8, 128, 3072]

# 等价的函数式写法
y2 = F.linear(x, fc.weight, fc.bias)

# 等价的 matmul 写法
y3 = x @ fc.weight.t() + fc.bias

# BLAS 风格 GEMM: out = beta*input + alpha*(mat1 @ mat2)
c = torch.addmm(fc.bias, x.reshape(-1, 768), fc.weight.t())

# Einsum 表达同一计算，以及 batch 矩阵乘
y4 = torch.einsum('btc,oc->bto', x, fc.weight) + fc.bias
scores = torch.einsum('bhtd,bhsd->bhts', torch.randn(2,4,16,64), torch.randn(2,4,16,64))
```

典型 Transformer FFN：

``` python
class FFN(nn.Module):
    def __init__(self, d, hidden):
        super().__init__()
        self.up = nn.Linear(d, hidden)
        self.down = nn.Linear(hidden, d)
    def forward(self, x):
        return self.down(F.gelu(self.up(x)))
```

导出 ONNX 时，`nn.Linear` 在二维输入下通常对应 `Gemm`，三维及以上输入对应 `MatMul` +
`Add`（实际结果取决于导出器版本与图优化，待核实）。

## 实现方式

### 1\. 朴素三重循环

``` c
for (n = 0; n < N; ++n)
  for (o = 0; o < OUT; ++o) {
    float acc = b[o];
    for (i = 0; i < IN; ++i) acc += X[n*IN+i] * W[o*IN+i];
    Y[n*OUT+o] = acc;
  }
```

问题：每个输出都要重新遍历整行 $X$ 与整行 $W$，缓存复用差，几乎无法接近硬件峰值。

### 2\. 分块（Tiling）与向量化

高性能 GEMM（Goto / BLIS 风格）的结构：

  - 按 L3 / L2 / L1 / 寄存器逐级分块，$A$、$B$ 的 panel 被 pack 成连续内存，使 micro-kernel
    以顺序访问读取。
  - micro-kernel 在寄存器中保存一个 $m\_r\\times n\_r$ 的 $C$ 小块，对 $K$
    维循环做外积累加（rank-1 update），使用
    SIMD（AVX2/AVX-512/AMX）FMA。
  - 目的是提高算术强度，让计算而非访存成为瓶颈。

### 3\. 库实现

  - CPU：OpenBLAS、MKL、oneDNN（`inner_product` / `matmul`
    primitive）、BLIS。Intel CPU 上 oneDNN 可使用 AVX-512、AMX（BF16/INT8）。
  - GPU：cuBLAS / cuBLASLt（NVIDIA，支持 epilogue 融合 bias + 激活）、CUTLASS（模板化
    GEMM）、Tensor Core；Intel GPU 上有 oneMKL / oneDNN / XeTLA / OpenVINO
    GPU plugin 的 oneDNN 或 OpenCL/ESIMD kernel。
  - 框架层：`torch.nn.Linear` 在 CPU 上调用 MKL / oneDNN，在 CUDA 上调用 cuBLAS(Lt)。

### 4\. 融合（Fusion）

  - Linear + Bias + Activation（ReLU/GELU/SiLU）：把 epilogue 放在 GEMM
    输出寄存器上完成，省去一次对 `[N,out]` 的读写。
  - Linear + Residual Add、Linear +
    [LayerNorm](0615_ML_Op_Norm_LayerNorm) 等也常见。
  - QKV 三个 Linear 合并为一个 `[3*d, d]` 的大 GEMM，减小 kernel launch 开销并提高 GPU
    利用率。
  - OpenVINO 中，`MatMul + Add + Activation` 经 transformation / plugin 融合为
    `FullyConnected` 类内部节点；`FullyConnected` 是 plugin 内部 op，不是公开 opset
    算子。

### 5\. 权重布局

  - PyTorch 权重 `[out, in]`，计算 $XW^\\top$ 在行主序下是 "NT" GEMM（B 转置）；TF/Keras
    `[in, out]` 为 "NN"。
  - 推理引擎常在加载时离线重排（pre-pack）：转置、按 micro-kernel 的 $n\_r$ 分块交织、对 INT8 做
    VNNI/AMX 所需的 4 元素交织布局。
  - LLM 推理中权重常被视为只读，因此一次性 reorder 的开销可忽略，换来每次推理访存顺序化。

### 6\. 量化（INT8 / INT4）

  - 对称/非对称线性量化：$x \\approx s\_x (q\_x - z\_x)$。
  - INT8 GEMM：$Y \\approx s\_x s\_w \\sum\_i (q\_x - z\_x)(q\_w -
    z\_w)$，以 INT32 累加，最后 requantize 回 INT8 或反量化为 FP32/FP16。
  - 权重常用 per-channel（每个 out 通道一个 scale），激活常用 per-tensor 或 per-token（动态）。
  - 硬件：x86 VNNI（`vpdpbusd`）、AMX-INT8、NVIDIA INT8 Tensor Core。
  - LLM 中常见 weight-only 量化（W8A16、W4A16、GPTQ/AWQ 一类方法）：权重 INT4/INT8
    存储，计算时在寄存器中反量化为 FP16/BF16 再做 MMA；主要收益是减少 decode 阶段的显存带宽。
  - 在 OpenVINO / NNCF 中，`MatMul` 的权重可通过 NNCF 做 INT8/INT4
    压缩（具体支持范围以文档为准）。

### 7\. 数值精度（FP16 / BF16）

  - FP16：10 位尾数、5 位指数，动态范围小，易溢出（最大约 65504），训练时需 loss scaling。
  - BF16：7 位尾数、8 位指数，范围同 FP32，精度更低。
  - 关键是累加精度：Tensor Core / AMX 通常用 FP32 累加器，仅输入为 FP16/BF16；若用 FP16 累加，长
    $K$ 下误差明显增大。
  - PyTorch 中 `torch.backends.cuda.matmul.allow_tf32` 与
    `allow_fp16_reduced_precision_reduction` 等开关会影响结果，可能导致与 CPU
    参考值的小幅偏差。
  - 浮点加法不满足结合律，不同分块 / split-K 策略会让结果不能逐位一致。

## 复杂度、FLOPs 与访存

对 $X\\in\\mathbb{R}^{N\\times K}$，$W\\in\\mathbb{R}^{M\\times K}$：

  - FLOPs：$2NMK$（一次乘加记 2 FLOPs），bias 与激活可忽略。
  - 权重参数量：$MK + M$。
  - 最少访存元素数：$NK + MK + NM$。
  - 算术强度（FLOPs/Byte，元素大小 $s$ 字节）：

$$AI = \\frac{2NMK}{s,(NK+MK+NM)}$$

  - 训练或大 batch prefill（$N$ 大）：AI 高，compute-bound，能打满 Tensor Core。
  - LLM decode（$N=1$ 或很小）：AI 约为 $2/s$，memory-bound，性能由权重读取带宽决定，所以
    weight-only 量化对 decode 加速最明显。
  - 例：GPT 类模型一层 FFN 约 $2\\cdot 2\\cdot T\\cdot d\\cdot 4d = 16Td^2$
    FLOPs（每个 token）。

## 常见坑

1.  **权重布局混淆**：PyTorch `[out, in]` 与 TF `[in, out]`、ONNX `Gemm` 的
    `transB` 属性；转换模型时容易漏掉转置，shape 恰好为方阵时不报错但结果错误。
2.  **Linear 与 1x1 Conv 互换**：作用于 `[B,C,H,W]` 时需 permute 或用 Conv；NHWC 与
    NCHW 下的性能差别大。
3.  **Gemm 的 C 广播**：ONNX `Gemm` 中 `C` 必须能单向广播到 `[M,N]`，不支持任意 batch。
4.  **MatMul 广播的内存放大**：`[B,1,T,D] x [1,H,D,S]` 之类的广播在部分后端会物化中间张量。
5.  **不规则 shape 的性能悬崖**：Tensor Core 要求维度为 8（FP16）或
    16（INT8）的倍数才能走高效路径；vocab\_size 取 50257 与
    50304 速度可差很大。
6.  **FP16 溢出**：大激活值（如某些 LLM 的 outlier channel）经 Linear 后溢出为 inf，需
    BF16、缩放或 FP32 累加。
7.  **量化 outlier**：LLM 激活存在少数极大值通道，直接 per-tensor INT8
    激活量化会严重掉点（SmoothQuant、LLM.int8() 等工作都针对此问题）。
8.  **bias 为 None 与融合**：有无 bias 会影响是否走融合 kernel。
9.  **非连续张量**：`x.transpose(...)` 后直接 matmul 可能触发隐式 `contiguous` 拷贝。
10. **Einsum 性能**：`einsum` 的收缩顺序对多操作数很重要（`torch.einsum` 可借助 opt\_einsum
    优化路径）；ONNX `Einsum` 在部分推理引擎中支持有限（只支持特定方程），不如直接用 MatMul / Transpose
    表达稳妥。

## Einsum 说明

Einsum 用下标表示收缩：

$$C\_{ij} = \\sum\_k A\_{ik}B\_{kj}\\ \\Leftrightarrow\\
\\texttt{ik,kj-\>ij}$$

下标重复且不出现在输出中则求和，出现在输出中则保留。几个常见例子：

  - batch 矩阵乘：`bij,bjk->bik`
  - 向量内积：`i,i->`
  - 外积：`i,j->ij`
  - 迹：`ii->`
  - 多头注意力打分：`bhqd,bhkd->bhqk`

多数后端会把 Einsum 重写为 Transpose / Reshape + (Batch)MatMul；无法重写的方程回退到慢速通用实现。

## 与其他 OP 的关系

  - [Convolution](0009_ML_Op_Convolution)：Conv 可通过 im2col 转换为 GEMM；1x1
    Conv 等价于 Linear 作用在通道维；Linear 是 kernel 覆盖整张输入的特例。
  - [Attention](0210_ML_Attention) / [MHA](0500_ML_Attention_MHA) /
    [SDPA](0499_ML_Attention_SDPA)：QKV 投影与输出投影是 Linear，$QK^\\top$ 与 $AV$
    是 batch MatMul。
  - [Embedding](0617_ML_Op_Embedding)：查表等价于 one-hot 向量乘以权重矩阵（无 bias 的
    Linear），但实际用 gather 实现；输出层 logits 常与 Embedding 共享权重（weight tying）。
  - [激活函数](0279_ML_Op_AF) / [ReLU 系](0616_ML_Op_AF_ReLU)：与 Linear 交替构成
    MLP；常被融合到 GEMM epilogue。
  - [Norm](0613_ML_Op_Norm) / [BatchNorm](0614_ML_Op_Norm_BatchNorm)：推理时
    BatchNorm 可折叠进前一个 Linear/Conv 的权重与 bias（$W' = \\gamma W/\\sigma$）。
  - [Dropout](0258_ML_Op_Dropout)：常出现在 Linear 之后，推理时为恒等。
  - [Softmax](0335_ML_Op_AF_Softmax) 与 [Loss
    Function](0281_ML_Arch_Func_LossFunction)：分类头为 Linear + Softmax +
    Cross Entropy，实现中常合并为 logits 上的 `cross_entropy` 以提高数值稳定性。
  - [Recurrent](0618_ML_Op_Recurrent)：RNN/LSTM/GRU 的门计算本质是对 $\[x\_t,
    h\_{t-1}\]$ 的 Linear，可合并成一个大 GEMM。
  - [Elementwise](0620_ML_Op_Elementwise)、[Shape](0621_ML_Op_Shape)：bias
    Add、Reshape / Transpose 常围绕 Linear 出现，是融合与布局优化的对象。
  - 更多算子见 [ML Op 总览](0366_ML_Op)。

## Reference

  - [PyTorch:
    torch.nn.Linear](https://pytorch.org/docs/stable/generated/torch.nn.Linear.html)
  - [PyTorch:
    torch.matmul](https://pytorch.org/docs/stable/generated/torch.matmul.html)
  - [PyTorch:
    torch.einsum](https://pytorch.org/docs/stable/generated/torch.einsum.html)
  - [ONNX Operators:
    Gemm](https://onnx.ai/onnx/operators/onnx__Gemm.html)
  - [ONNX Operators:
    MatMul](https://onnx.ai/onnx/operators/onnx__MatMul.html)
  - [ONNX Operators:
    Einsum](https://onnx.ai/onnx/operators/onnx__Einsum.html)
  - [oneDNN Documentation](https://oneapi-src.github.io/oneDNN/)
  - [NVIDIA cuBLAS Documentation](https://docs.nvidia.com/cuda/cublas/)
  - [CUTLASS](https://github.com/NVIDIA/cutlass)
  - Anatomy of High-Performance Matrix Multiplication (Goto & van de
    Geijn), ACM TOMS
  - [LLM.int8(): 8-bit Matrix Multiplication for Transformers at
    Scale](https://arxiv.org/abs/2208.07339)
  - [SmoothQuant](https://arxiv.org/abs/2211.10438)
  - [GPTQ](https://arxiv.org/abs/2210.17323)
  - [AWQ](https://arxiv.org/abs/2306.00978)
