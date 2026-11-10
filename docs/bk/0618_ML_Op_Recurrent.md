-----

| Title     | ML Op Recurrent                                       |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-10T09:50:21Z`                                |
| Updated @ | `2026-11-10T09:50:21Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/618) |

-----

# ML Op Recurrent

循环神经网络（Recurrent Neural Network）按时间步依次处理序列，把上一步的隐状态 $h\_{t-1}$ 与当前输入
$x\_t$ 一起变换得到 $h\_t$，从而对任意长度序列建模。本文覆盖三种经典单元：基础 RNN、LSTM（Long Short-Term
Memory）、GRU（Gated Recurrent Unit），说明公式、门的作用、梯度消失问题、PyTorch 的 shape
约定与用法，以及从逐步展开到 cuDNN 融合、ONNX 算子、推理引擎循环实现的各种落地方式，最后讨论它与
[Transformer](0229_ML_Transformer) 的对比和现状。

## 目的

  - 对序列数据（语音、文本、时间序列、传感器信号）建模，参数量与序列长度无关（权重跨时间步共享）。
  - 推理时只需保存固定大小的隐状态，**每步计算量与内存为
    $O(1)$**（相对历史长度），适合流式（streaming）场景，如在线语音识别、端侧
    KWS。
  - LSTM/GRU 通过门控机制缓解基础 RNN 的梯度消失，能记住更长的依赖。

## 数学定义

记输入 $x\_t\\in\\mathbb{R}^{d\_{in}}$，隐状态
$h\_t\\in\\mathbb{R}^{d\_h}$，$\\sigma$ 为
[Sigmoid](0280_ML_Op_AF_Sigmoid)，$\\odot$ 为逐元素乘。

### 基础 RNN（Elman）

$$ h\_t=\\tanh\\left(W\_{ih}x\_t+b\_{ih}+W\_{hh}h\_{t-1}+b\_{hh}\\right)
$$

激活也可换成 ReLU（见 [激活函数](0279_ML_Op_AF)）。

### LSTM

$$ \\begin{aligned}
i\_t&=\\sigma(W\_{ii}x\_t+b\_{ii}+W\_{hi}h\_{t-1}+b\_{hi})
&&\\text{输入门}\\
f\_t&=\\sigma(W\_{if}x\_t+b\_{if}+W\_{hf}h\_{t-1}+b\_{hf})
&&\\text{遗忘门}\\
g\_t&=\\tanh(W\_{ig}x\_t+b\_{ig}+W\_{hg}h\_{t-1}+b\_{hg})
&&\\text{候选记忆}\\
o\_t&=\\sigma(W\_{io}x\_t+b\_{io}+W\_{ho}h\_{t-1}+b\_{ho})
&&\\text{输出门}\\ c\_t&=f\_t\\odot c\_{t-1}+i\_t\\odot g\_t
&&\\text{细胞状态}\\ h\_t&=o\_t\\odot\\tanh(c\_t) \\end{aligned} $$

  - 遗忘门 $f\_t$ 决定保留多少旧记忆，输入门 $i\_t$ 决定写入多少新信息，输出门 $o\_t$ 决定暴露多少记忆给外部。
  - 细胞状态 $c\_t$ 沿时间的更新是**加性**的，梯度可沿 $c$ 通路传递（类似残差连接），这是缓解梯度消失的关键。

### GRU

$$ \\begin{aligned}
r\_t&=\\sigma(W\_{ir}x\_t+b\_{ir}+W\_{hr}h\_{t-1}+b\_{hr})
&&\\text{重置门}\\
z\_t&=\\sigma(W\_{iz}x\_t+b\_{iz}+W\_{hz}h\_{t-1}+b\_{hz})
&&\\text{更新门}\\
n\_t&=\\tanh(W\_{in}x\_t+b\_{in}+r\_t\\odot(W\_{hn}h\_{t-1}+b\_{hn}))
&&\\text{候选状态}\\ h\_t&=(1-z\_t)\\odot n\_t+z\_t\\odot h\_{t-1}
\\end{aligned} $$

GRU 把 $c$ 与 $h$ 合并，只有 2 个门，参数量约为 LSTM 的 3/4。注意 PyTorch 中重置门作用在
$(W\_{hn}h\_{t-1}+b\_{hn})$ 之后，与原论文"先乘 $r$ 再做线性变换"的写法略有差异，导入其他框架权重时要留意。

### 梯度消失/爆炸

展开 BPTT（Backpropagation Through Time）后：

$$ \\frac{\\partial h\_T}{\\partial
h\_t}=\\prod\_{k=t+1}^{T}\\frac{\\partial h\_k}{\\partial h\_{k-1}}
=\\prod\_{k=t+1}^{T}\\mathrm{diag}(\\tanh'(\\cdot)),W\_{hh} $$

连乘项的范数随 $T-t$ 指数变化：谱半径 $\<1$ 则梯度消失，$\>1$ 则爆炸。tanh 的导数 $\\le 1$
更加剧消失。对策：LSTM/GRU
的门控与加性通路、梯度裁剪（`clip_grad_norm_`，主要应对爆炸）、正交初始化
$W\_{hh}$、遗忘门 bias 初始化为正值（如 1）。

## 输入输出 shape 与参数

`nn.RNN / nn.LSTM / nn.GRU(input_size, hidden_size, num_layers=1,
bias=True, batch_first=False, dropout=0.0, bidirectional=False)`，LSTM 另有
`proj_size`。

  - 输入 `input`：`[T, B, input_size]`（默认），`batch_first=True` 时为 `[B, T,
    input_size]`。
  - 初始状态 `h0`：`[D*num_layers, B, hidden_size]`，其中 $D=2$（双向）或 $1$。**`h0`
    不受 `batch_first` 影响**，永远 batch 在第二维。LSTM 还需 `c0`，shape 同上（有
    `proj_size` 时 `h0` 最后一维为 `proj_size`）。
  - 输出 `output`：`[T, B, D*hidden_size]`（或 batch\_first
    形式），包含**最后一层**所有时间步的隐状态；双向时前向、反向结果在最后一维拼接。
  - `h_n`：`[D*num_layers, B,
    hidden_size]`，每层每方向最后时间步状态。双向时反向方向的"最后一步"对应时间
    $t=0$。
  - 参数 `weight_ih_l{k}`：RNN `[H, in]`，GRU `[3H, in]`，LSTM `[4H,
    in]`；`weight_hh_l{k}`：对应 `[gates*H, H]`；反向方向带 `_reverse` 后缀。第
    $k\>0$ 层的 `in` 为 `D*H`。
  - 门顺序（行分块）：LSTM 为 `i, f, g, o`，GRU 为 `r, z, n`。
  - `num_layers>1`：层间堆叠，`dropout` 作用于除最后一层外的每层输出（见
    [Dropout](0258_ML_Op_Dropout)）。

## 典型用法

``` python
import torch, torch.nn as nn

lstm = nn.LSTM(input_size=128, hidden_size=256, num_layers=2,
               batch_first=True, bidirectional=True, dropout=0.1)
x = torch.randn(4, 50, 128)                  # [B, T, in]
out, (h_n, c_n) = lstm(x)                    # 不传 h0/c0 则为 0
print(out.shape)   # [4, 50, 512]  = D*H
print(h_n.shape)   # [4, 4, 256]   = D*num_layers, B, H

# 取最后一层的双向最终状态作为序列表示
h_last = torch.cat([h_n[-2], h_n[-1]], dim=-1)   # [B, 512]

# 变长序列：packed sequence
from torch.nn.utils.rnn import pack_padded_sequence, pad_packed_sequence
lengths = torch.tensor([50, 42, 30, 12])          # 需降序，或 enforce_sorted=False
packed = pack_padded_sequence(x, lengths, batch_first=True, enforce_sorted=True)
out_p, (h_n, c_n) = lstm(packed)
out, _ = pad_packed_sequence(out_p, batch_first=True, total_length=50)

# 单步 Cell（自己控制循环，如自回归解码）
cell = nn.LSTMCell(128, 256)
h = c = torch.zeros(4, 256)
for t in range(x.size(1)):
    h, c = cell(x[:, t], (h, c))
```

对应 ONNX 算子：`RNN`、`LSTM`、`GRU`（均为 ai.onnx 标准算子）。

## 不同实现与优化

### 逐步展开 vs 融合

  - **逐步展开（unrolled）**：在图中把循环展成 $T$ 份（或用 `Loop`/`Scan`），每步 1\~2 个
    [Linear](0612_ML_Op_Linear) / MatMul 加若干
    [Elementwise](0620_ML_Op_Elementwise) 操作。灵活但 kernel 数量为 $O(T\\cdot
    \\text{ops})$，launch 开销大；动态 $T$ 会让展开失效。
  - **融合 RNN（cuDNN / oneDNN 等）**：整个序列、多层、双向在一个库调用内完成。库内部做了：
      - 输入侧投影 $W\_{ih}x\_t$ 对**全部时间步**合并为一个大 GEMM（因其不依赖 $h\_{t-1}$），只有
        $W\_{hh}h\_{t-1}$ 必须串行；
      - 逐元素的门计算（sigmoid/tanh/乘加）融合为一个 kernel；
      - 多层时可做 wavefront（层与时间步的并行流水）；
      - 权重按 persistent kernel 方式常驻片上存储（小 hidden 时）。 PyTorch 在 CUDA 上使用
        cuDNN 时，权重会被 `flatten_parameters()` 整理为连续的一块内存；多卡 `DataParallel`
        或 `deepcopy` 后可能出现 "RNN module weights are not part of single
        contiguous chunk of memory" 警告，需再调用一次。

### 权重合并 gate 矩阵

四个门（或三个门）的权重沿行拼接为 `[4H, in]` 与 `[4H, H]`，一次 GEMM 得到所有门的预激活，然后切片，这样 GEMM
更大、利用率更高。ONNX LSTM 同样要求 `W: [num_directions, 4*H, in]`、`R:
[num_directions, 4*H, H]`，但**门顺序是 `i, o, f, c`**，与 PyTorch 的 `i, f, g,
o` 不同；GRU 为 `z, r, h`，与 PyTorch 的 `r, z, n`
也不同。导出/转换器负责重排，手工搬运权重时要注意。ONNX
的 `B` 为 `[num_directions, 8*H]`（Wb 与 Rb 拼接）。

### Packed sequence

`PackedSequence` 把一个 batch 按时间步展平，并记录每个时间步的有效 batch
大小（`batch_sizes`，随时间递减），避免对 padding 做无意义计算，也避免 padding
污染 `h_n`（否则 `h_n` 会是 padding 之后的状态）。ONNX 里对应的是 `LSTM` 的
`sequence_lens` 输入；导出 PyTorch packed 输入通常能映射到该输入，但带
`enforce_sorted=False` 时导出的图可能更复杂，需实测。

### ONNX 算子要点

  - 属性：`hidden_size`、`direction`（`forward`/`reverse`/`bidirectional`）、`activations`、`clip`、`layout`（0
    为 `[T,B,*]`，1 为 `[B,T,*]`，对应 `batch_first`）、LSTM 的
    `input_forget`；GRU 的 `linear_before_reset`（PyTorch 的 GRU 对应
    `linear_before_reset=1`）。
  - 输出：`Y: [T, num_directions, B, H]`（layout=0），`Y_h`、`Y_c`。注意 `Y` 的
    shape 与 PyTorch 的 `output` 不同，导出器会插入 `Transpose/Reshape` 来对齐。
  - 多层 `num_layers>1` 在 ONNX 中被展开成多个 LSTM 节点串联。

### 推理引擎实现

  - **TensorIterator / Loop 风格**：OpenVINO 等把 RNN 表示为
    `TensorIterator`/`Loop`，循环体是一个 `LSTMCell` 子图，沿时间轴 slice 输入、merge
    隐状态；引擎再把 `LSTMSequence` 识别为单个融合算子，交给 CPU/GPU 插件的专用 kernel。
  - **循环展开**：对已知固定且较短的 $T$，可静态展开子图，利于常量折叠与跨步融合，但图体积随 $T$ 线性增长。
  - **静态 vs 动态长度**：动态 $T$ 要求 `Loop`/序列算子支持，部分加速器后端不支持，需固定长度或分段。
  - **量化**：RNN 的递推会累积量化误差，INT8 下常保留激活状态为较高精度，或只量化 GEMM 部分。
  - **流式推理**：把 `h/c` 作为模型的显式输入输出，每次推 1\~几帧，应用侧缓存状态。

## 常见坑

1.  `batch_first` 只改 `input/output`，不改 `h0/c0/h_n/c_n`。
2.  双向模型的 `h_n[-1]` 只是反向方向最后一层，需与 `h_n[-2]` 拼接才得到完整表示。
3.  用带 padding 的 batch 直接取 `output[:, -1]` 会取到 padding 位置，应使用 `lengths`
    索引或 packed sequence。
4.  `pack_padded_sequence` 的 `lengths` 必须在 CPU 上，且默认要求降序。
5.  训练时梯度爆炸，需 `torch.nn.utils.clip_grad_norm_`；长序列梯度需要 truncated
    BPTT，并在截断处 `h.detach()`。
6.  跨框架转换忘记重排门顺序、忘记合并 `b_ih + b_hh`（部分框架只有一个 bias）、忽略 GRU 的 reset
    位置差异，会导致输出完全对不上。
7.  导出 ONNX 时 `Y` 的 layout、`dropout` 在 eval 模式下失效（推理必须 `model.eval()`）。
8.  确定性：cuDNN RNN 的反向在某些配置下非确定性，需要可复现时查看
    `torch.use_deterministic_algorithms` 的相关说明。
9.  FP16 下 hidden 大、序列长时，细胞状态 $c\_t$ 的累加可能超出表示范围，注意混合精度策略。

## 与其他 OP 的关系与现状

  - 单步计算本质是 [Linear](0612_ML_Op_Linear)（合并 gate 的 GEMM）+
    [Sigmoid](0280_ML_Op_AF_Sigmoid)/tanh +
    [Elementwise](0620_ML_Op_Elementwise) 乘加，因此 RNN 的优化大多落在这几类算子的融合上。
  - 输入常来自 [Embedding](0617_ML_Op_Embedding)；序列表示常经
    [Softmax](0335_ML_Op_AF_Softmax) 做分类或解码。
  - 为稳定训练，在 RNN 中常用 [LayerNorm](0615_ML_Op_Norm_LayerNorm)（LN-LSTM）而非
    [BatchNorm](0614_ML_Op_Norm_BatchNorm)。
  - 一维卷积 [Convolution](0009_ML_Op_Convolution)（TCN）是另一类序列建模方式，可并行；全局
    [Pooling](0268_ML_Op_Pooling) 可替代取最后状态。
  - 与 [Attention](0210_ML_Attention)：Seq2Seq + Attention 最初就是为解决 RNN
    编码器把整句压成一个定长向量的瓶颈而提出，后来 [Transformer](0229_ML_Transformer) 的
    [MHA](0500_ML_Attention_MHA) 完全取代了循环结构。

对比：

| 维度           | RNN/LSTM/GRU       | Transformer               |
| ------------ | ------------------ | ------------------------- |
| 训练并行度        | 沿时间串行              | 序列维完全并行                   |
| 长程依赖         | 靠门控，仍有衰减           | 任意两点直接交互                  |
| 单步推理成本       | $O(1)$ 状态          | KV cache 随长度增长，注意力 $O(T)$ |
| 总计算（序列长 $T$） | $O(T)$             | 注意力 $O(T^2)$              |
| 部署           | 状态管理、融合 kernel 依赖库 | 算子规整，生态成熟                 |

现状：在 NLP 与大模型主流中 Transformer 基本取代了 RNN；但 RNN 在小模型、低延迟流式语音（如 RNN-T
类模型）、端侧传感器与时间序列场景仍常见。近年的线性注意力、状态空间模型（如 Mamba 一类）与 RWKV
等重新把"固定大小状态 + 递推"的思想引回主流，并设法通过并行扫描（scan）恢复训练并行性。

## Reference

  - Long Short-Term Memory, Hochreiter & Schmidhuber (Neural
    Computation, 1997)
  - Learning Phrase Representations using RNN Encoder-Decoder for
    Statistical Machine Translation（GRU）:
    <https://arxiv.org/abs/1406.1078>
  - Empirical Evaluation of Gated Recurrent Neural Networks on Sequence
    Modeling: <https://arxiv.org/abs/1412.3555>
  - On the difficulty of training Recurrent Neural Networks:
    <https://arxiv.org/abs/1211.5063>
  - Attention Is All You Need: <https://arxiv.org/abs/1706.03762>
  - Neural Machine Translation by Jointly Learning to Align and
    Translate: <https://arxiv.org/abs/1409.0473>
  - Layer Normalization: <https://arxiv.org/abs/1607.06450>
  - PyTorch LSTM:
    <https://pytorch.org/docs/stable/generated/torch.nn.LSTM.html>
  - PyTorch GRU:
    <https://pytorch.org/docs/stable/generated/torch.nn.GRU.html>
  - PyTorch RNN:
    <https://pytorch.org/docs/stable/generated/torch.nn.RNN.html>
  - PyTorch pack\_padded\_sequence:
    <https://pytorch.org/docs/stable/generated/torch.nn.utils.rnn.pack_padded_sequence.html>
  - ONNX LSTM: <https://onnx.ai/onnx/operators/onnx__LSTM.html>
  - ONNX GRU: <https://onnx.ai/onnx/operators/onnx__GRU.html>
  - ONNX RNN: <https://onnx.ai/onnx/operators/onnx__RNN.html>
