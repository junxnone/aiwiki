-----

| Title     | ML Op Shape                                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-10T09:50:27Z`                                |
| Updated @ | `2026-11-10T09:50:27Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/621) |

-----

# ML Op Shape 与数据搬运

Shape/数据搬运类 OP
不做数值计算，只改变张量的形状、排列顺序或元素来源：`Reshape/View`、`Transpose/Permute`、`Squeeze/Unsqueeze`、`Flatten`、`Concat/Split/Slice/Stack`、`Gather/Scatter/GatherND/IndexSelect`、`Pad`、`Tile/Expand`、`Flip/Roll`、`Cast`。它们在模型里数量很多，却几乎不产生
FLOPs，开销全部是内存访问。理解这类 OP 的关键是区分两种实现：只修改
metadata（shape/stride/offset，零拷贝的视图）与必须真实搬运数据（拷贝）。前者几乎免费，后者是
memory-bound 的纯带宽消耗，也是推理引擎做图优化（消除、下沉、融合）的主要对象。

## 目的

  - 让上下游 OP 对张量布局达成一致：如 [Convolution](0009_ML_Op_Convolution) 需要 NCHW 或
    NHWC，[Linear](0612_ML_Op_Linear) 需要把 `(N,C,H,W)` 展平为 `(N,C*H*W)`。
  - 构造结构化计算：Attention 里的 `(B,L,H*D) → (B,H,L,D)` 拆头（见
    [Attention](0210_ML_Attention)），多路特征 `Concat`，通道分组 `Split`。
  - 索引取值：[Embedding](0617_ML_Op_Embedding) 的本质是 `Gather`；检测网络里的 `TopK +
    Gather` 做候选框筛选。
  - 填充与复制：卷积的 `Pad`，广播的 `Expand`，数据增强的 `Flip/Roll`。
  - 类型转换：`Cast` 在混合精度与量化流程中衔接 FP32/FP16/BF16/INT 类型。

## 数学/语义定义

设张量 $X$ 的 shape 为 $(d\_0,\\dots,d\_{n-1})$，行优先（row-major）连续存储时第 $i$ 维的
stride 为 $s\_i=\\prod\_{j\>i} d\_j$，下标 $(i\_0,\\dots,i\_{n-1})$ 的线性地址：

$$ \\text{addr} = \\text{offset} + \\sum\_{k} i\_k, s\_k $$

核心语义：

  - Reshape：元素的线性顺序（行优先展开序）保持不变，仅重新划分维度，要求元素总数不变 $\\prod d\_i = \\prod
    d'\_j$。
  - Transpose/Permute：按置换 $\\pi$ 重排维度，$Y\[i\_0,\\dots,i\_{n-1}\] =
    X\[i\_{\\pi^{-1}(0)},\\dots\]$，即 $Y$ 的第 $k$ 维是 $X$ 的第 $\\pi(k)$
    维；视图实现只需把 shape 与 stride 同步按 $\\pi$ 置换。
  - Gather（沿 axis=0 的最简形式）：$Y\[i, \\dots\] = X\[\\text{idx}\[i\],
    \\dots\]$。一般形式（`torch.gather`，沿 `dim`）：

$$ Y\[i\_0,\\dots,i\_{d},\\dots\] = X\[i\_0,\\dots,\\
\\text{idx}\[i\_0,\\dots,i\_d,\\dots\],\\ \\dots\] $$

  - Scatter 是 Gather 的逆写：$Y\[\\dots,\\ \\text{idx}\[i\],\\dots\] =
    U\[i,\\dots\]$；下标重复时结果取决于实现顺序，需要确定结果时用 `scatter_add` /
    `scatter_reduce`。
  - Pad：输出尺寸 $d'\_k = d\_k + p^{\\text{begin}}\_k +
    p^{\\text{end}}\_k$，填充值由
    mode（constant/reflect/replicate/circular）决定。
  - Roll：$Y\[i\] = X\[(i - \\text{shift}) \\bmod d\]$；Flip：$Y\[i\] =
    X\[d-1-i\]$。
  - Tile：沿各维重复 $r\_k$ 次，$d'\_k=d\_k r\_k$，$Y\[i\]=X\[i \\bmod
    d\]$；Expand：把长度为 1 的维广播到更大，不复制数据。

## 输入输出 shape 与参数

| OP                 | 输出 shape                                       | 关键参数                          | 典型实现                     |
| ------------------ | ---------------------------------------------- | ----------------------------- | ------------------------ |
| Reshape/View       | 指定 shape，可含一个 -1（自动推断）                         | target shape；ONNX `allowzero` | 视图（需满足条件）否则拷贝            |
| Transpose/Permute  | 按 perm 重排                                      | perm（ONNX `Transpose`）        | 视图；后续 contiguous 时拷贝     |
| Squeeze/Unsqueeze  | 删/增长度为 1 的维                                    | axes                          | 视图                       |
| Flatten            | `(prod(d[:axis]), prod(d[axis:]))`（ONNX 总是 2D） | axis                          | 视图（连续时）                  |
| Concat             | 沿 axis 求和                                      | axis                          | 拷贝（可优化为 in-place 拼接）     |
| Split              | 沿 axis 切为多份                                    | axis, split sizes             | 视图或拷贝                    |
| Slice              | 各轴 `[start:end:step]`                          | starts/ends/axes/steps        | 视图（含 step 时 stride 改变）   |
| Stack              | 新增一维                                           | dim                           | 拷贝（= Unsqueeze + Concat） |
| Gather/IndexSelect | index 形状替换 axis 维                              | axis, indices                 | 拷贝                       |
| GatherND           | 由 `indices.shape[-1]` 决定                       | batch\_dims                   | 拷贝                       |
| Scatter/ScatterND  | 与 data 同 shape                                 | axis/reduction                | 拷贝（基于 data 副本）           |
| Pad                | 各维加 pad                                        | pads, mode, value             | 拷贝                       |
| Tile               | `d*r`                                          | repeats                       | 拷贝                       |
| Expand             | 广播到目标 shape                                    | shape                         | 视图（stride=0）             |
| Flip/Roll          | 同输入                                            | dims/shifts                   | 拷贝（Flip 在 PyTorch 中不是视图） |
| Cast               | 同输入                                            | to（dtype）                     | 拷贝（dtype 相同时可省略）         |

## 典型用法

``` python
import torch

x = torch.arange(24).reshape(2, 3, 4)       # ONNX: Reshape

y = x.view(6, 4)                            # 零拷贝，要求兼容 stride
t = x.transpose(1, 2)                       # ONNX: Transpose(perm=[0,2,1])
p = x.permute(2, 0, 1)                      # ONNX: Transpose(perm=[2,0,1])
u = x.unsqueeze(1)                          # ONNX: Unsqueeze  (2,1,3,4)
s = u.squeeze(1)                            # ONNX: Squeeze
f = x.flatten(start_dim=1)                  # ONNX: Flatten / Reshape  (2,12)

c = torch.cat([x, x], dim=1)                # ONNX: Concat  (2,6,4)
a, b = torch.split(x, [1, 2], dim=1)        # ONNX: Split
sl = x[:, 1:, ::2]                          # ONNX: Slice
st = torch.stack([x, x], dim=0)             # (2,2,3,4)  ONNX: Unsqueeze + Concat

idx = torch.tensor([2, 0])
g = torch.index_select(x, 1, idx)           # ONNX: Gather(axis=1)
g2 = torch.gather(x, 1, torch.zeros(2, 1, 4, dtype=torch.long))  # ONNX: GatherElements
z = torch.zeros(5).scatter_add(0, torch.tensor([0, 0, 3]), torch.ones(3))  # ONNX: ScatterElements(reduction='add')

pd = torch.nn.functional.pad(x, (1, 1, 2, 0))   # 从最后一维开始，成对给出 ONNX: Pad
tl = x.repeat(1, 2, 1)                      # Tile
ex = torch.ones(3, 1).expand(3, 4)          # Expand，零拷贝
fl = x.flip(dims=[2])                       # ONNX 无 Flip，可用 Slice(step=-1)
ro = x.roll(shifts=1, dims=2)               # 无直接 ONNX 算子，通常拆为 Slice + Concat
h = x.half()                                # ONNX: Cast(to=FLOAT16)
```

注意 `F.pad` 的 pad 参数顺序是从最后一维开始、每维一对 `(begin, end)`，而 ONNX `Pad` 的 pads 是
`[x1_begin, x2_begin, ..., x1_end, x2_end, ...]`，先所有 begin 后所有
end，导出器会自动转换，手写时易混。

## 不同实现与优化

### 只改 metadata 与必须拷贝

| 类别      | 操作                                                                            | 说明                                  |
| ------- | ----------------------------------------------------------------------------- | ----------------------------------- |
| 纯视图     | Reshape（兼容时）、Squeeze/Unsqueeze、Expand、Transpose/Permute、基础 Slice、Split（沿某轴切块） | 只改 shape/stride/offset，共享存储，修改会互相影响 |
| 必须拷贝    | Concat、Stack、Pad、Tile、Gather、Scatter、Flip、Roll、Cast（dtype 变化）                 | 产生新缓冲区                              |
| 视图加后续拷贝 | Transpose 后接要求 contiguous 的 OP                                                | 在下游 kernel 前才真正 `contiguous()`      |

Transpose 的"视图"实际上把成本转嫁给了下游：若下游 kernel 只能处理连续内存，则物化（materialize）转置时要做一次
cache 不友好的矩阵转置，常用分块（tile）+ SIMD shuffle（CPU）或 shared memory 中转（GPU，避免
bank conflict 与非合并访问）来加速。

### Reshape/View 与 contiguous 条件

`view` 只在新 shape 可以由原 stride 表示时成立，否则需要拷贝。直觉：被合并的各维在内存中必须本来就是"连续相邻"的。

``` python
x = torch.randn(2, 3, 4)
x.is_contiguous()            # True
x.view(6, 4)                 # OK

t = x.transpose(1, 2)        # shape (2,4,3)  stride (12,1,4)  非连续
t.is_contiguous()            # False
# t.view(2, 12)              # RuntimeError: view size is not compatible
t.reshape(2, 12)             # 可以：内部发现无法视图，自动拷贝
t.contiguous().view(2, 12)   # 显式拷贝后 view
```

`reshape` = 能 view 就 view，否则拷贝，因此返回值是否与原张量共享内存不确定；`view` 要么共享要么报错。

### NCHW 与 NHWC（channels\_last）布局转换

NCHW 的 stride 为 $(CHW, HW, W, 1)$，NHWC（PyTorch 的 `channels_last`，shape
仍是 `(N,C,H,W)`，只是 stride 变为 $(HWC, 1, WC, C)$）。

``` python
x = torch.randn(8, 64, 56, 56)
y = x.to(memory_format=torch.channels_last)
y.shape                      # (8,64,56,56) 不变
y.stride()                   # (200704, 1, 3584, 64)
y.is_contiguous(memory_format=torch.channels_last)  # True
```

  - NHWC 下通道维连续，利于 SIMD 沿 C 向量化、Tensor Core 与 oneDNN 等库的 1x1
    卷积/depthwise 卷积；NCHW 在某些后端对 3x3 卷积也可很快，取决于库与硬件，不能一概而论。
  - 布局转换本身是一次完整拷贝（本质是 Transpose），应尽量在网络入口一次转换，并让中间所有 OP 保持同一布局，避免在每个 OP
    前后反复 `Transpose`。
  - 许多框架的卷积内部采用 blocked 布局（如 `nChw16c`）以对齐向量宽度，这属于引擎内部的 reorder（见
    [Convolution](0009_ML_Op_Convolution)、[Pooling](0268_ML_Op_Pooling)）。

### Concat / Split / Slice 的优化

  - Concat 若各输入由前序 OP 产生，可让前序 OP 直接写入 Concat 输出缓冲区的对应区间（concat-free /
    in-place concat），省去拷贝；沿 axis=0（或外层维）拼接时各块在内存中是连续的，最容易做。
  - Split 沿最外维时输出可以是输入的视图（偏移不同）；沿内层维时各块不连续，需要 stride 视图或拷贝。
  - Slice 带 `step`：stride 乘以 step，offset 前移，仍是视图；负 step 在 PyTorch
    视图中不支持，需用 `flip` 拷贝；ONNX 允许负 step，推理引擎里一般实现为拷贝。

### Gather / Scatter

Gather/Scatter 是不规则访存，性能受 index 的局部性影响；Embedding 查表（沿 axis=0 的
Gather）每次拷贝一整行，行内连续，效率较好。Scatter 在重复 index 时有写冲突：GPU
上用原子操作（`scatter_add`）会带来非确定性与性能下降；需要确定性时可先对 index
排序再做分段归约。

### 动态 shape 与 ShapeOf 子图常量折叠

导出的 ONNX 图中，`Reshape` 的目标 shape 经常由 `Shape → Gather → Unsqueeze →
Concat` 这样的子图动态计算得到：

``` text
x --> Shape --> Gather(idx=0) --> Unsqueeze --\
                                               Concat --> Reshape(x, shape)
const [-1, 64] ------------------------------/
```

  - 当输入 shape 完全静态时，`Shape` 的输出是常量，整条子图可以被常量折叠（constant folding）为一个
    const shape，Reshape 变成静态目标。
  - 动态 shape 时（如 batch、序列长度可变），引擎需做 shape inference 与符号传播：已知某些维为常量（如
    `-1`、64），只对动态维运行时计算；有的引擎对 `ShapeOf` 子图在 shape 推断阶段单独求值（"shape
    subgraph" 在 CPU 上执行，数据张量在设备上），避免 GPU 同步。
  - ONNX `Reshape` 的 shape 中 `0` 表示"沿用输入对应维"（`allowzero=0` 时），`-1`
    表示推断；PyTorch 导出常据此生成动态 batch 的 Reshape。
  - 使用 `onnxsim`（onnx-simplifier）等工具可在导出后做常量折叠，清理这类子图。

### 推理引擎中的消除与融合

  - 连续的 Reshape/Squeeze/Unsqueeze/Flatten 可合并为一个
    Reshape，或在组合后等价于恒等时整体删除。
  - Transpose 下沉（sinking）与消除：`Transpose(perm) → elementwise →
    Transpose(perm⁻¹)` 可把 elementwise 前后的转置抵消；`Transpose` 穿过
    Concat、激活等对布局无关的 OP；连续两个 Transpose 合成一个
    permute，若合成置换为恒等则删除。
  - `Transpose → MatMul` 可被吸收为 MatMul 的 `transpose_a/transpose_b`
    属性，不再物化转置；Attention 中的拆头转置同理常与 MatMul 融合。
  - 卷积前后的布局转换（NCHW ↔ NHWC）在图级优化中尽量聚拢到网络边界。
  - Cast 链折叠：`Cast(FP32→FP16) → Cast(FP16→FP32)`
    并非恒等（有精度损失），不能随意消除；`Cast(FP32→FP32)`
    才可删除。
  - Pad 常可融合进随后的 Conv 的 padding 属性（零填充时）。

## 常见坑

1.  view vs reshape：对转置/切片后的非连续张量调用 `view` 报错 `view size is not
    compatible with input tensor's size and stride`；`reshape`
    不会报错但可能悄悄拷贝，导致"以为共享内存而修改无效"，或"以为拷贝而修改了原张量"。
2.  视图共享存储：`x[:, 0]`、`transpose`、`expand` 的结果与原张量共享数据，对其做 inplace
    修改会改动原张量；对 `expand` 的结果 inplace
    写入更是危险（多个元素指向同一内存），PyTorch
    会报错或行为未定义。
3.  非连续内存传给自定义 kernel / C++ 扩展 / `.numpy()`：需先 `.contiguous()`；`permute`
    后直接 `.view(-1)` 报错。
4.  `Transpose` 与 `Reshape` 的混淆：把 `(N,C,H,W)` 变为 `(N,H,W,C)` 必须用
    permute，用 reshape 只会打乱元素对应关系且不报错。
5.  `Flatten` 在 ONNX 中总是输出 2D；PyTorch `flatten` 可输出任意维。
6.  Squeeze 不指定 axes 时会删除所有长度为 1 的维，batch=1 时会把 batch 维也删掉，造成动态 batch 下的
    shape 错误；应显式指定 dim。
7.  `Gather` 的负 index 在 ONNX 中允许（语义为从尾部数起），但越界 index 的行为依后端而异（CPU 报错，GPU
    可能静默读错），需保证合法。
8.  `Scatter` 在 index 重复时结果不确定；ONNX `Scatter` 已被 `ScatterElements` 取代。
9.  `torch.repeat` 是 Tile（拷贝），`expand`
    是广播视图（不拷贝），两者名字相近语义不同；`repeat_interleave`
    则是逐元素重复。
10. `Pad` 的 reflect 模式要求 pad 小于对应维长度；pad 参数顺序（PyTorch 从最后一维起）与 ONNX 不同。
11. `Cast` 的浮点转整数是向零截断，不是四舍五入；NaN/Inf 转整数结果未定义；INT64 索引转 INT32
    在大张量上可能溢出。
12. channels\_last 张量调用 `view` 常因非 NCHW 连续而失败，应使用 `reshape` 或先转回
    contiguous；`.is_contiguous()` 对 channels\_last 张量返回 False，需用
    `memory_format` 参数检查。
13. 动态 shape 导出时，使用 Python 的 `x.shape[0]` 参与 `view` 计算可能被 trace
    成常量，导致导出模型 batch 固定；应使用 `torch.onnx.export` 的
    `dynamic_axes`（或 dynamo 导出的 dynamic shapes）并检查图中是否存在 `Shape` 节点。

## 与其他 OP 的关系

  - [Elementwise](0620_ML_Op_Elementwise)：广播（`Expand`）就是 stride=0
    的视图；Elementwise 链两端的 Transpose 可被消除；Reduce 的 `keepdims` 与
    `Squeeze/Unsqueeze` 等价。
  - [Convolution](0009_ML_Op_Convolution)、[Pooling](0268_ML_Op_Pooling)：依赖布局（NCHW/NHWC/blocked），布局转换由
    Transpose/Reorder 完成；`Pad` 常与卷积/池化的 padding 融合。
  - [Linear](0612_ML_Op_Linear)：前置 `Flatten/Reshape`，权重的 `Transpose`
    在推理时通常常量折叠预处理掉。
  - [Attention](0210_ML_Attention)：`Reshape + Transpose` 拆头/合头，`Concat`
    拼接 KV cache，`Slice` 做因果 mask，`Gather` 读取位置编码。
  - [Embedding](0617_ML_Op_Embedding)：本质是 `Gather`（`IndexSelect`），其反向是
    `Scatter-add`。
  - [Resize](0619_ML_Op_Resize)、[图像 Resize](0347_Media_Image_Resize)：与
    `Pad/Tile/Expand` 都是改变空间尺寸，但 Resize 会插值计算，而后者只搬运数据。
  - [Norm](0613_ML_Op_Norm)、[LayerNorm](0615_ML_Op_Norm_LayerNorm)：其归约轴选择依赖布局，NHWC
    下常需 Transpose 以保持高效。
  - [Recurrent](0618_ML_Op_Recurrent)：序列的 `Split/Concat/Stack`
    用于时间步展开与门控拆分。
  - [ML Op 总览](0366_ML_Op) 给出 OP 的整体分类。

## Reference

  - PyTorch Tensor
    Views：<https://pytorch.org/docs/stable/tensor_view.html>
  - PyTorch
    torch.reshape：<https://pytorch.org/docs/stable/generated/torch.reshape.html>
  - PyTorch
    torch.Tensor.view：<https://pytorch.org/docs/stable/generated/torch.Tensor.view.html>
  - PyTorch
    torch.gather：<https://pytorch.org/docs/stable/generated/torch.gather.html>
  - PyTorch
    torch.nn.functional.pad：<https://pytorch.org/docs/stable/generated/torch.nn.functional.pad.html>
  - PyTorch Memory Format
    Tutorial（channels\_last）：<https://pytorch.org/tutorials/intermediate/memory_format_tutorial.html>
  - NumPy
    Broadcasting：<https://numpy.org/doc/stable/user/basics.broadcasting.html>
  - ONNX Operators：<https://onnx.ai/onnx/operators/>
  - onnx-simplifier：<https://github.com/daquexian/onnx-simplifier>
