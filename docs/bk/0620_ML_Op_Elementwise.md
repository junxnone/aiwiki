-----

| Title     | ML Op Elementwise                                     |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-10T09:50:25Z`                                |
| Updated @ | `2026-11-10T09:50:25Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/620) |

-----

# ML Op Elementwise 与 Reduce

Elementwise（逐元素）与 Reduce（归约）是深度学习框架里数量最多、也最容易被忽视的一类
OP。前者对张量的每个元素独立计算（`Add`、`Mul`、`Exp`、`Clip`、`Where`
等），输出 shape
与输入（广播后）一致；后者沿若干轴把多个元素聚合成一个值（`ReduceSum`、`ReduceMax`、`ArgMax`、`TopK`
等），输出 shape 缩小。它们的算术强度（FLOPs/Byte）都很低，几乎总是
memory-bound，因此实现与优化的重点不在"算得快"，而在"少读写内存"：向量化、广播
stride 技巧、算子融合、inplace 和数值稳定的归约顺序。本文按"语义 → 参数 → 用法 → 实现 → 坑 →
关系"的顺序梳理。激活函数（[激活函数](0279_ML_Op_AF)、[ReLU
系](0616_ML_Op_AF_ReLU)）本质上也是 unary
elementwise，[Softmax](0335_ML_Op_AF_Softmax) 则是 Reduce 与 Elementwise
的组合。

## 目的

  - Elementwise：构成网络里的"胶水"计算，如残差连接 `x + f(x)`、缩放 `x * scale`、mask
    `where(mask, x, -inf)`、`sqrt/exp/log` 等数学变换、`clip` 做量化截断或数值保护。
  - Reduce：产生统计量与标量/低维结果，如 loss 的 `mean`、[Norm](0613_ML_Op_Norm)
    里的均值/方差、Softmax 里的 `max` 与
    `sum`、全局池化（[Pooling](0268_ML_Op_Pooling)）、分类的
    `argmax`、检索的 `topk`。

## 数学/语义定义

### Elementwise

Binary：对广播后的形状 $S$ 上每个下标 $i$，

$$ y\_i = f(a\_i,\\ b\_i),\\quad f \\in
{+,-,\\times,\\div,\\max,\\min,\\text{pow}} $$

Unary：

$$ y\_i = g(x\_i),\\quad g \\in {\\sqrt{\\cdot},\\ e^{x},\\ \\ln x,\\
|x|,\\ \\text{clip}(x, lo, hi)} $$

$$ \\text{clip}(x, lo, hi) = \\min(\\max(x, lo), hi) $$

三元 `Where`：

$$ y\_i = \\begin{cases} a\_i & c\_i = \\text{True} \\ b\_i & c\_i =
\\text{False} \\end{cases} $$

### 广播规则（numpy 风格）

两个张量 shape 右对齐，从最后一维向前逐维比较，每一维必须满足：相等，或其中一个为 1（或该维不存在）。结果该维取较大者。

``` python
import torch
a = torch.ones(8, 1, 6)     # (8, 1, 6)
b = torch.ones(   7, 1)     # (   7, 1)  -> 视作 (1, 7, 1)
(a + b).shape               # (8, 7, 6)

torch.ones(3, 4) + torch.ones(4, 3)   # RuntimeError: 不兼容
torch.ones(3, 4) + torch.ones(3)      # RuntimeError: 3 对 4 不兼容
torch.ones(3, 4) + torch.ones(3, 1)   # OK, 按列广播 -> (3, 4)
```

ONNX 的 `Add/Sub/Mul/Div/Pow/Max/Min/Where` 同样采用 multidirectional（numpy
风格）广播；`Max/Min` 在 ONNX 中支持可变个数输入。

### Reduce

沿轴集合 $A$ 归约，设 $x$ 的下标为 $(i\_{\\bar A}, i\_A)$：

$$ \\text{Sum}:\\ y\_{i\_{\\bar A}} = \\sum\_{i\_A} x, \\qquad
\\text{Mean}:\\ y = \\frac{1}{|A|}\\sum\_{i\_A} x $$

$$ \\text{L1}:\\ \\sum |x|, \\qquad \\text{L2}:\\ \\sqrt{\\sum x^2},
\\qquad \\text{Prod}:\\ \\prod x $$

$$ \\text{LogSumExp}:\\ \\log\\sum\_{i\_A} e^{x} = m +
\\log\\sum\_{i\_A} e^{x - m},\\ \\ m=\\max\_{i\_A} x $$

`ArgMax/ArgMin` 返回极值所在下标（int64）；`TopK` 返回前 $k$ 大（或小）的值及其下标，输出沿该轴长度变为
$k$。

`cumsum`（前缀和）不是 Reduce，因为它不降维：

$$ y\_j = \\sum\_{i \\le j} x\_i \\quad(\\text{exclusive 时为 } i\<j,\\
\\text{reverse 时从尾部累加}) $$

## 输入输出 shape 与参数

| OP                  | 输入          | 输出 shape        | 关键参数                                    |
| ------------------- | ----------- | --------------- | --------------------------------------- |
| Add/Sub/Mul/Div/Pow | A, B        | broadcast(A, B) | 无                                       |
| Sqrt/Exp/Log/Abs    | X           | 同 X             | 无                                       |
| Clip                | X, min, max | 同 X             | min/max 为标量（ONNX opset 11+ 作为输入）        |
| Where               | cond, X, Y  | broadcast 三者    | 无                                       |
| Max/Min（ONNX）       | 多个张量        | broadcast 全部    | 无                                       |
| ReduceXxx           | X           | 见下              | `axes`, `keepdims`                      |
| ArgMax/ArgMin       | X           | 见下              | `axis`, `keepdims`, `select_last_index` |
| TopK                | X, K        | 值与下标，轴长为 K      | `axis`, `largest`, `sorted`             |
| CumSum              | X, axis     | 同 X             | `exclusive`, `reverse`                  |

Reduce 的 `axes` 与 `keepdims`（以 $x$ shape 为 `(2, 3, 4)` 为例）：

| axes     | keepdims | 输出 shape                                                        |
| -------- | -------- | --------------------------------------------------------------- |
| `[1]`    | 1（True）  | `(2, 1, 4)`                                                     |
| `[1]`    | 0（False） | `(2, 4)`                                                        |
| `[0, 2]` | True     | `(1, 3, 1)`                                                     |
| 空/不指定    | True     | `(1, 1, 1)`（全部归约；ONNX 另有 `noop_with_empty_axes` 控制空 axes 时是否恒等） |
| 空/不指定    | False    | 标量 `()`                                                         |

`keepdims=True` 的主要价值是让结果可直接与原张量广播，如 `x - x.max(dim=-1,
keepdim=True).values`。

## 典型用法

``` python
import torch

x = torch.randn(2, 3, 4)

# elementwise
y = torch.sqrt(torch.abs(x) + 1e-6)
z = torch.where(x > 0, x, torch.zeros_like(x))   # 等价 ReLU
c = x.clamp(-1.0, 1.0)                           # ONNX: Clip

# reduce
s = x.sum(dim=(0, 2), keepdim=True)              # ONNX: ReduceSum
m = x.mean(dim=-1)                               # ONNX: ReduceMean
mx = x.amax(dim=1)                               # ONNX: ReduceMax
l2 = x.norm(p=2, dim=-1)                         # ONNX: ReduceL2
lse = torch.logsumexp(x, dim=-1)                 # ONNX: ReduceLogSumExp
idx = x.argmax(dim=-1)                           # ONNX: ArgMax
v, i = x.topk(k=2, dim=-1)                       # ONNX: TopK
cs = x.cumsum(dim=-1)                            # ONNX: CumSum
```

ONNX 对应算子名：`Add, Sub, Mul, Div, Pow, Sqrt, Exp, Log, Abs, Clip, Where,
Max, Min, ReduceSum, ReduceMean, ReduceMax, ReduceMin, ReduceProd,
ReduceL1, ReduceL2, ReduceLogSumExp, ArgMax, ArgMin, TopK, CumSum`。注意
`ReduceSum` 的 `axes` 自 opset 13 起为输入，而其他 Reduce 系列是在更高
opset（18）才改为输入，具体版本以 ONNX 算子文档为准。

数值稳定的 softmax 就是典型的 Reduce + Elementwise 组合：

``` python
def softmax(x, dim=-1):
    m = x.amax(dim=dim, keepdim=True)        # Reduce
    e = torch.exp(x - m)                     # Elementwise (broadcast)
    return e / e.sum(dim=dim, keepdim=True)  # Reduce + broadcast Div
```

## 不同实现与优化

### memory-bound 特性

以 FP32 `c = a + b` 为例，每个元素读 8 B、写 4 B，只做 1 次加法，算术强度约 $1/12$
FLOP/Byte，远低于现代 CPU/GPU 的 roofline 拐点，性能上限由内存带宽决定。因此：

  - 单个 elementwise OP 再怎么优化指令也快不过带宽；真正能省的是"访存次数"。
  - 小 tensor 时 kernel launch / 线程调度开销反而占主导（GPU 上尤其明显）。

### 向量化 SIMD

CPU 上对连续内存使用 SSE/AVX2/AVX-512/NEON 一次处理 4\~16 个 FP32；尾部不足一个向量的元素用 mask
或标量循环处理。`exp/log/tanh` 这类超越函数没有硬件指令，通常用多项式近似加范围规约（例如 $e^x = 2^n
\\cdot e^r$）实现 SIMD 版本，精度（ULP）与速度之间需要取舍。低精度（FP16/BF16/INT8）下一般先转 FP32
计算再转回，以保证精度。

### 广播的 stride 技巧

广播不需要真正物理复制数据：把被广播维度的 stride 设为 0 即可。

``` python
b = torch.randn(3, 1).expand(3, 4)
b.stride()      # (1, 0)  —— 第二维 stride 为 0，零拷贝
```

kernel 内按 stride 计算偏移 `offset = Σ idx[d] * stride[d]`。工程上常见优化：

1.  合并相邻且可合并的维度（两者 stride 满足连续关系）以减少循环层数。
2.  对常见模式做特化：标量广播、`(N,C,H,W) + (1,C,1,1)`（per-channel
    bias）、最后一维连续广播等，避免通用的多维 index 计算。
3.  通用路径用 NdIterator / TensorIterator 一类机制，把输入输出 stride 统一后分块并行。

### 算子融合（elementwise chain fusion）

连续的 elementwise OP（如 `x * scale + bias → relu →
clip`）若逐个执行，每个中间结果都要写回再读出；融合成单个
kernel 后，只需读一次输入、写一次输出，访存量近似除以链长。实现途径：

  - 手写融合 kernel：如 Conv + Bias + ReLU、`Add + ReLU`（残差后接激活）。
  - JIT/代码生成：把 elementwise 子图编成一个 loop body，如 PyTorch
    `torch.compile`（Inductor）、TVM、XLA 等。
  - 推理引擎里的 post-ops 机制：把 elementwise 作为前一个计算密集
    OP（Conv/MatMul）的后处理，在寄存器里完成，不落内存。

### 推理引擎里的 EltwiseLayer / Snippets

在 OpenVINO 等引擎中，二元逐元素运算通常由统一的 Eltwise 类节点承载（按 mode 区分 Add/Mul/Max
等），再通过图变换把"Conv/MatMul + Eltwise/Activation"折叠为带 post-ops
的单个节点；对剩余的 elementwise 链，CPU 插件使用 Snippets：把一段由
Eltwise、Convert、Broadcast 等组成的子图收集为 subgraph，生成统一的 JIT
代码，循环中完成整条链计算，从而减少内存往返。其核心思路与上面的 chain
fusion 相同；具体支持的算子集合和开关以对应引擎版本文档为准。

### inplace

当输出与某个输入的 shape/dtype 相同且该输入后续不再被使用时，可以把结果直接写回输入缓冲区，省去一次内存分配并提升缓存命中。

``` python
x.add_(1.0)          # PyTorch 的 inplace 变体
torch.relu_(x)
```

推理引擎在图编译期通过 liveness 分析自动做 buffer 复用。训练时需谨慎：若反向传播要用到被覆盖的值（如 `exp`
的输出要用于梯度，或 `x` 本身），inplace 会触发 autograd
报错或得到错误梯度。广播场景下输出比被写入的输入大时不能
inplace。

### Reduce 的并行实现

  - 沿连续轴归约：每个输出对应一段连续内存，SIMD 内先做向量累加，最后水平求和（horizontal add）。
  - 沿非连续轴归约（如对 `(N, C)` 的 N 求和）：反而更适合"外层并行输出通道、内层逐行累加整行向量"，保持访存连续。
  - GPU 上采用并行树形归约：线程块内先各自累加（grid-stride loop），再经 shared memory / warp
    shuffle 做 $\\log\_2 n$ 步折半合并；跨块则再启动一次归约或使用原子操作。
  - 并行树形归约会改变求和顺序，浮点加法不满足结合律，因此结果与串行不完全一致，且使用原子操作时可能每次运行有微小差异（非确定性）。

### 数值精度

  - 浮点串行累加的误差随长度增长；树形归约（pairwise summation）误差增长更慢，通常可优于朴素串行。
  - Kahan 补偿求和用额外变量记录丢失的低位，把误差降到与长度近乎无关，代价是约 4 倍的浮点运算，且编译器的 fast-math
    可能把补偿项优化掉。
  - 低精度输入（FP16/BF16）做 Sum/Mean 时应使用 FP32 累加，再转回目标类型；否则 FP16
    在累加值较大时会因尾数不足而"吃掉"小增量，甚至溢出（FP16 最大约
    65504）。
  - Mean 在大规模求和后再除以 $n$ 可能先溢出，可先除后加或使用 FP32；方差应使用 Welford 在线算法或两遍法，避免
    $E\[x^2\]-E\[x\]^2$ 的灾难性抵消。
  - LogSumExp 必须减去最大值再 exp，否则 $e^{x}$ 在 $x\\approx 90$（FP32）即上溢。

### ArgMax / TopK / CumSum

  - ArgMax 需同时归约值与下标，并行归约时要规定平局规则（取最先出现的下标；ONNX 提供 `select_last_index`
    控制）。
  - TopK 小 $k$ 常用堆或部分排序（selection / partial sort），大 $k$ 则直接排序；GPU 上常用
    radix select / bitonic 排序。
  - CumSum 是 scan 操作，并行实现用 Blelloch / Hillis-Steele 类扫描算法，共 $O(n)$ 或
    $O(n\\log n)$ 工作量。

## 常见坑

1.  整数除法：`torch.div` 默认为真除法（得到 float）；`//` 或 `rounding_mode='floor'`
    才是整除。ONNX `Div` 对整数输入为整数除法，两者在导出时要核对。
2.  `Pow` 的底数为负且指数为非整数得到 NaN；`Sqrt(负数)`、`Log(0 或负数)` 分别得到
    NaN、-inf/NaN，需加 eps 或 clip 保护。
3.  `Max/Min` 与 `amax/amin`：`torch.max(a, b)`（两张量）是
    elementwise，`torch.max(x, dim)` 是 Reduce 并返回 (values, indices)；而
    ONNX 的 `Max` 是 elementwise，`ReduceMax` 才是归约。
4.  梯度差异：`amax` 平均分配平局梯度，`max(dim)` 只把梯度传给返回的那个下标。
5.  广播意外：`(N,)` 与 `(N,1)` 相加得到 `(N,N)`，而不是 `(N,)`，是最常见的 shape bug；loss 中
    `pred.shape != target.shape` 会静默广播。
6.  `keepdims` 默认值不同：PyTorch 默认 `keepdim=False`，ONNX Reduce 系列默认
    `keepdims=1`，转换时要显式对齐。
7.  `Clip` 的 min \> max 行为未定义（PyTorch 中结果取 max），应避免。
8.  FP16 下 `x * x` 或 `exp` 容易溢出；`Sum` 未用 FP32 累加会造成精度显著下降。
9.  在 inplace 操作过的张量上继续用于反向传播，会遇到 "modified by an inplace operation" 错误。
10. 并行 Reduce 的非确定性：同一输入不同次运行结果的低位可能不同；需要可复现时使用确定性算法开关（如
    `torch.use_deterministic_algorithms(True)`），可能牺牲性能。

## 与其他 OP 的关系

  - [激活函数](0279_ML_Op_AF) 与 [ReLU 系](0616_ML_Op_AF_ReLU) 是 unary
    elementwise（部分如 PReLU 含广播参数），常被融合到前一个
    [Convolution](0009_ML_Op_Convolution) 或 [Linear](0612_ML_Op_Linear)
    的输出阶段。
  - [Softmax](0335_ML_Op_AF_Softmax)：ReduceMax、Exp、ReduceSum、Div
    的组合；[Attention](0210_ML_Attention) 中的
    scale、mask（`Where`/`Add`）和 softmax 是融合（FlashAttention 类）的典型目标。
  - [Norm](0613_ML_Op_Norm)、[BatchNorm](0614_ML_Op_Norm_BatchNorm)、[LayerNorm](0615_ML_Op_Norm_LayerNorm)：ReduceMean/方差
    + Sub/Div/Mul/Add；推理时 BatchNorm 可折叠成 per-channel 的 `Mul + Add`，进而并入
    Conv 权重。
  - [Pooling](0268_ML_Op_Pooling)：滑窗上的 Reduce（Max/Avg）；全局池化等价于在 H、W 轴上的
    ReduceMax/ReduceMean。
  - [Embedding](0617_ML_Op_Embedding)、[Shape](0621_ML_Op_Shape)：Gather/Scatter
    类 OP 与 `ScatterReduce` 结合了数据搬运与归约；广播的 `Expand` 在 Shape 类 OP 中也是
    stride=0 的视图。
  - [ML Op 总览](0366_ML_Op) 给出各类 OP 的整体分类。

## Reference

  - PyTorch Broadcasting
    semantics：<https://pytorch.org/docs/stable/notes/broadcasting.html>
  - PyTorch Tensor
    Views：<https://pytorch.org/docs/stable/tensor_view.html>
  - PyTorch
    torch.sum：<https://pytorch.org/docs/stable/generated/torch.sum.html>
  - PyTorch
    torch.topk：<https://pytorch.org/docs/stable/generated/torch.topk.html>
  - PyTorch
    torch.cumsum：<https://pytorch.org/docs/stable/generated/torch.cumsum.html>
  - PyTorch
    torch.logsumexp：<https://pytorch.org/docs/stable/generated/torch.logsumexp.html>
  - NumPy
    Broadcasting：<https://numpy.org/doc/stable/user/basics.broadcasting.html>
  - ONNX Operators：<https://onnx.ai/onnx/operators/>
  - ONNX Broadcasting：<https://onnx.ai/onnx/repo-docs/Broadcasting.html>
