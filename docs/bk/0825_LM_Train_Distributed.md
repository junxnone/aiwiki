-----

| Title     | LM Train Distributed                                  |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T15:34:39Z`                                |
| Updated @ | `2026-11-26T15:34:39Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/825) |

-----

# Distributed

大模型分布式训练：为什么单卡放不下，数据并行、ZeRO/FSDP、张量并行、流水线并行和序列并行各自切分什么，怎样组合成 3D
并行，以及显存和通信的估算。

## 为什么需要并行

训练时每个参数要占的显存远多于参数本身。使用混合精度 AdamW 时，每个参数需要：

$$ \\underbrace{2}*{\\text{BF16 权重}}+\\underbrace{2}*{\\text{BF16
梯度}}+\\underbrace{4+4+4}\_{\\text{FP32 主权重 + Adam }m,v}=16\\
\\text{字节/参数} $$

其中：

  - 前两项是计算用的低精度权重和梯度；后三项是优化器状态：FP32 的主权重 (保证更新精度)、一阶矩 $m$ 和二阶矩 $v$，各 $4$
    字节
  - 例：7B 模型需要 $7\\times10^9\\times16=112\\text{ GB}$，还没算激活，远超一张 80 GB 的
    GPU；70B 则需要约 $1.1\\text{ TB}$
  - 所以必须把模型状态、计算和数据切分到多张卡上

## 并行方式总览

下图把四种基本的并行方式放在一张图里，说明各自切分的对象：

``` mermaid
flowchart TB
    M[一次训练] --> DP[数据并行 DP<br>切分 batch<br>每卡完整模型]
    M --> ZERO[ZeRO / FSDP<br>切分优化器状态/梯度/参数]
    M --> TP[张量并行 TP<br>切分层内矩阵]
    M --> PP[流水线并行 PP<br>切分层到不同卡]
    M --> SP[序列/上下文并行<br>切分序列维度]
```

图中：

  - 数据并行是最简单的方式：每张卡一份完整模型，处理不同的数据，最后同步梯度；ZeRO/FSDP 是在此基础上消除冗余的模型状态
  - 张量并行把一层内的大矩阵切到多卡；流水线并行把不同的层放到不同的卡；序列并行把长序列沿长度方向切开
  - 四类方法可以叠加使用，叠加后称为 3D (或 4D) 并行

## 数据并行与 ZeRO

数据并行 (DP)：$N\_d$ 张卡各算一份 batch 的梯度，用 all-reduce 求平均后各自更新。通信量用环形
all-reduce 估算：

$$ \\text{通信量/卡}\\approx2,\\frac{N\_d-1}{N\_d},S\\ \\approx2S $$

其中：

  - $S$：梯度大小 (字节)，BF16 梯度为 $2N$
  - $N\_d$：数据并行的卡数；环形 all-reduce 分为 reduce-scatter 和 all-gather 两步，各传
    $\\frac{N\_d-1}{N\_d}S$
  - 通信量几乎与卡数无关，所以 DP 在卡数很多时仍可扩展，但每张卡要存完整的模型状态

通信时间可以用带宽估算：$t\\approx\\dfrac{2S}{\\text{BW}*{net}}$，$\\text{BW}*{net}$
为每卡的有效网络带宽。例：7B 模型 BF16 梯度 $S=14$ GB，每卡 $400$ Gb/s ($50$ GB/s) 的
InfiniBand：$t\\approx28/50\\approx0.56$ s；如果单步计算只要 $2$
s，就必须让通信与反向计算重叠，否则会浪费约 $20%$ 的时间。

ZeRO (Zero Redundancy Optimizer) 把冗余的模型状态按 DP 维度切分：

| 阶段            | 切分内容  | 每卡显存 (字节/参数) | 通信                                       |
| ------------- | ----- | ------------ | ---------------------------------------- |
| DDP (无 ZeRO)  | 无     | $16$         | all-reduce 梯度                            |
| ZeRO-1        | 优化器状态 | $4+12/N\_d$  | 同 DDP                                    |
| ZeRO-2        | \+ 梯度 | $2+14/N\_d$  | 同 DDP                                    |
| ZeRO-3 / FSDP | \+ 参数 | $16/N\_d$    | 前向/反向前需 all-gather 参数，通信约增加 $1.5\\times$ |

表中：$N\_d$ 为数据并行卡数，数字按上文的 $2+2+12=16$ 字节计。例：$N\_d=64$ 时 ZeRO-3 每卡只需
$16/64=0.25$ 字节/参数，7B 模型的模型状态约 $1.75\\text{
GB}$。代价是通信增加，对网络带宽要求高。PyTorch 的 FSDP
实现了同样的思想，DeepSpeed 提供 ZeRO 及其 offload 版本 (把状态放到 CPU/NVMe)。

## 张量并行

Megatron-LM 的做法：把 FFN 的第一个矩阵按列切、第二个矩阵按行切，注意力按头切，这样每个子层只需要一次 all-reduce：

$$
Y=\\mathrm{GeLU}(XA)B=\\mathrm{GeLU}\\bigl(X\[A\_1,A\_2\]\\bigr)\\begin{bmatrix}B\_1\\B\_2\\end{bmatrix}=\\mathrm{GeLU}(XA\_1)B\_1+\\mathrm{GeLU}(XA\_2)B\_2
$$

其中：

  - $X$：输入；$A$：第一个权重矩阵，按列切成 $A\_1,A\_2$ (分到两张卡)；$B$：第二个权重矩阵，按行切成
    $B\_1,B\_2$
  - 每张卡独立算 $\\mathrm{GeLU}(XA\_i)B\_i$，最后把两个部分和相加 (一次 all-reduce) 得到
    $Y$；列切分使非线性可以在本地计算，不需要中间通信
  - 每层前向有 $2$ 次 all-reduce (注意力和 FFN 各一次)，反向同样，通信频繁，因此张量并行通常限制在一个节点内 (有
    NVLink 的 $8$ 卡)，不跨节点

## 流水线并行

把 $L$ 层分成 $p$ 个阶段，每个阶段放在一张卡 (或一组卡) 上，micro-batch 依次流过各阶段：

$$ \\text{气泡比例}=\\frac{p-1}{m+p-1} $$

其中：

  - $p$：流水线阶段数 (卡数)；$m$：一个 batch 切成的 micro-batch 数
  - 气泡 (bubble)：流水线启动和排空时有些卡空闲的时间占比；$m$ 越大气泡越小：例如 $p=8$、$m=32$ 时气泡约
    $\\frac{7}{39}\\approx18%$，$m=8$ 时高达 $\\frac{7}{15}\\approx47%$
  - 通信只在相邻阶段之间传递激活，数据量小，适合跨节点；常用调度有 1F1B 和交错 (interleaved)
    1F1B，以减小气泡和激活显存

## 序列并行与上下文并行

  - 序列并行 (Sequence Parallel)：与张量并行配合，把 LayerNorm/Dropout
    等不被张量并行切分的部分沿序列维度切分，减少激活显存
  - 上下文并行 (Context Parallel / Ring Attention)：把长序列分到多卡，通过环形传递 K、V
    计算注意力，使上下文长度可扩展到数十万 token

## 组合：3D 并行

$$ N\_{gpu}=N\_d\\times N\_t\\times N\_p $$

其中：

  - $N\_t$：张量并行度，通常 $\\le8$ (一个 NVLink 域)
  - $N\_p$：流水线并行度
  - $N\_d$：数据并行度 (也可以是 ZeRO/FSDP 的分片度)
  - 三者的乘积等于总卡数；调整顺序一般是：先选能放下一层的最小 $N\_t$，再选能放下整个模型的最小 $N\_p$，剩余的卡全部给
    $N\_d$

通用做法 (按通信需求从高到低匹配硬件)：

| 并行方式        | 通信需求                   | 放置位置         |
| ----------- | ---------------------- | ------------ |
| 张量并行        | 极高 (每层 2 次 all-reduce) | 节点内 (NVLink) |
| 流水线并行       | 低 (只传激活)               | 跨节点          |
| 数据并行 / ZeRO | 中 (每步一次梯度/参数通信)        | 跨节点 (最外层)    |

表中：把通信最频繁的放在带宽最高的链路上。

### 示例：70B 模型的配置核算

以 Llama 2 70B ($d=8192$、$L=80$、$a=64$ 头) 为例，序列长度 $S=4096$，micro-batch
$B=1$，GPU 为 80 GB，取 $N\_t=8$、$N\_p=4$、$N\_d=2$ 共 $64$ 卡，逐项核算：

| 项目                        | 计算                                          | 每卡                   |
| ------------------------- | ------------------------------------------- | -------------------- |
| 每卡分到的参数                   | $70\\times10^9/(N\_t N\_p)=2.19\\times10^9$ | $2.19$ B 参数          |
| 模型状态 (ZeRO-1，$N\_d=2$)    | $2.19\\times10^9\\times(2+2+12/2)$ 字节       | 约 $21.9$ GB          |
| 每层激活 (TP + 序列并行 + 选择性重计算) | $34SBd/N\_t=34\\times4096\\times8192/8$ 字节  | 约 $143$ MB/层         |
| 每个流水线阶段的层数                | $L/N\_p=20$                                 | $20$ 层               |
| 1F1B 下最多同时在途的 micro-batch | $N\_p=4$                                    | $4$ 份                |
| 激活合计                      | $143\\text{ MB}\\times20\\times4$           | 约 $11.4$ GB          |
| 合计 (不含通信缓冲和碎片)            |                                             | 约 $33$ GB，80 GB 卡放得下 |

表中：激活公式见 [Efficiency](@@TEFF@@)；张量并行配合序列并行时，每层激活按 $N\_t$ 均分。模型状态如果不用
ZeRO (每参数 $16$ 字节) 是约 $35$ GB，也放得下，但余量更少。

再核算流水线气泡和训练时间：

  - 全局 batch 取 $4$M token，即 $1024$ 条序列；每个数据并行副本每步处理 $512$ 条，micro-batch
    为 $1$ 时 $m=512$，气泡约 $\\frac{3}{515}\\approx0.6%$，可以忽略
  - 训练 $2$T token 的计算量为
    $6\\times7\\times10^{10}\\times2\\times10^{12}=8.4\\times10^{23}$
    FLOPs；$64$ 张 A100、MFU $40%$ 时需要约 $1.05\\times10^8$ s，约 $3.3$ 年
  - 所以实际要扩大数据并行度：保持 $N\_t=8$、$N\_p=4$，把 $N\_d$ 提高到 $64$ ($2048$ 卡) 后约
    $38$ 天；Llama 2 70B 公开的约 $1.72\\times10^6$ GPU 小时与此量级一致
  - 也可以用 FSDP (ZeRO-3) 代替部分流水线并行，减少气泡和调度复杂度，代价是更多的跨节点通信

## 实践

  - 框架：Megatron-LM (3D 并行)、DeepSpeed (ZeRO)、PyTorch
    FSDP、torchtitan；训练效率相关见 [Efficiency](@@TEFF@@)
  - 通信库：NCCL (NVIDIA)、oneCCL (Intel)；网络：节点内 NVLink，节点间 InfiniBand/RoCE
  - 微调场景用 FSDP + LoRA 即可在少量卡上训练大模型，见 [微调](/0410_LM_FT)
  - 推理时的并行方式见 [Infer Parallel](@@IPAR@@)

## Reference

  - [ZeRO: Memory Optimizations Toward Training Trillion Parameter
    Models](https://arxiv.org/abs/1910.02054)
  - [Megatron-LM: Training Multi-Billion Parameter Language Models Using
    Model Parallelism](https://arxiv.org/abs/1909.08053)
  - [Efficient Large-Scale Language Model Training on GPU Clusters Using
    Megatron-LM](https://arxiv.org/abs/2104.04473)
  - [PyTorch FSDP: Experiences on Scaling Fully Sharded Data
    Parallel](https://arxiv.org/abs/2304.11277)
  - [Ring Attention with Blockwise Transformers for Near-Infinite
    Context](https://arxiv.org/abs/2310.01889)
