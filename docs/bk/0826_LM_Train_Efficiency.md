-----

| Title     | LM Train Efficiency                                   |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T15:34:52Z`                                |
| Updated @ | `2026-11-26T15:34:52Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/826) |

-----

# Efficiency

大模型训练效率：混合精度、激活重计算、梯度累积、FlashAttention，怎样用 MFU 衡量效率，以及常用训练框架。

## 效率瓶颈

训练一步的时间由三部分决定：计算、显存访问和通信。下图说明提升效率的手段分别针对哪一类瓶颈：

``` mermaid
flowchart LR
    A[训练慢/显存不够] --> B{瓶颈在哪?}
    B --> C[算力利用低<br>MFU 不高]
    B --> D[显存不够<br>OOM]
    B --> E[通信等待]
    C --> C1[混合精度 BF16/FP8<br>FlashAttention<br>算子融合 torch.compile]
    D --> D1[激活重计算<br>ZeRO/FSDP<br>梯度累积]
    E --> E1[计算通信重叠<br>增大 micro-batch<br>调整并行策略]
```

图中：

  - 先判断瓶颈：算力没吃满 (MFU 低)、显存放不下，还是在等通信，再选择对应手段
  - 并行相关的显存和通信问题见 [Distributed](@@TDIST@@)，本文集中讲单卡层面的优化和效率度量

## 混合精度

  - BF16：8 位指数、7 位尾数，动态范围与 FP32 相同，不需要像 FP16 那样做 loss
    scaling，是目前大模型训练的主流；FP16 的指数只有 5 位，容易溢出，需要
    loss scaling
  - FP8：E4M3 (精度高，用于前向权重和激活) 和 E5M2 (范围大，用于梯度)，算力约为 BF16 的
    $2\\times$；需要逐张量的缩放因子，位布局见
    [DataType](/0700_MO_Quantization_DataType)
  - 做法：前向反向用低精度，参数主副本和优化器状态保持 FP32，更新精度不丢失；显存见 [Distributed](@@TDIST@@)
    的 $16$ 字节/参数

## 激活重计算

反向传播需要保存前向的激活。对一个 Transformer 层，Megatron-LM 的分析给出 16-bit 激活的显存
(不使用张量并行时)：

$$ M\_{act}^{layer}=S,B,d\\left(34+\\frac{5,a,S}{d}\\right)\\
\\text{字节},\\qquad M\_{act}=L\\cdot M\_{act}^{layer} $$

其中：

  - $S$：序列长度；$B$：micro-batch 大小；$d$：隐藏维度；$a$：注意力头数；$L$：层数
  - $34SBd$：线性层、LayerNorm、激活函数、dropout 等保存的中间结果，与 $S$ 成正比
  - $5aS^2B$：注意力的得分矩阵和 softmax 输出 (含 dropout 掩码)，与 $S^2$
    成正比；长序列时它占主导，FlashAttention
    不实例化这个矩阵，因此直接去掉这一项
  - 例：$S=4096$、$B=1$、$d=4096$、$a=32$、$L=32$：$34$ 项约 $0.57$
    GB/层，$5aS/d=160$ 项约 $2.7$ GB/层，32 层合计约 $104$ GB，远超模型状态本身；用
    FlashAttention 后降到约 $18$ GB

两种重计算方式：

| 方式     | 保存什么                | 激活显存/层          | 额外计算                    |
| ------ | ------------------- | --------------- | ----------------------- |
| 不重计算   | 全部中间激活              | $SBd(34+5aS/d)$ | $0$                     |
| 选择性重计算 | 除注意力得分/softmax 外的激活 | $34SBd$         | 很小 (只重算注意力部分)           |
| 全量重计算  | 只保存每层输入             | $2SBd$          | 约多 $1$ 次前向，即总计算约 $+33%$ |

表中：全量重计算 (activation checkpointing) 只保存每个 block 的输入 ($2SBd$
字节)，反向时重做一次前向得到中间激活，激活显存约降到原来的 $1/17$
以下；由于反向本身约是前向的 $2$ 倍计算量，多一次前向使总计算从 $3$ 份变成 $4$
份。选择性重计算只重算显存大而计算便宜的注意力部分，是 Megatron 的默认推荐；用了 FlashAttention
时，它本身就在反向时重算注意力，效果与选择性重计算相当。

## FlashAttention

标准注意力要把 $S\\times S$ 的得分矩阵写到显存再读回，访存量是 $O(S^2)$，注意力成为
memory-bound。FlashAttention 通过分块 (tiling) 在片上高速缓存中完成 softmax
和加权求和，不实例化完整矩阵：

$$ \\text{显存}:\\ O(S^2)\\to O(S),\\qquad \\text{HBM 访存}:\\ O(S^2+Sd)\\to
O\!\\left(\\frac{S^2d^2}{M}\\right) $$

其中：

  - $S$：序列长度；$d$：头维度；$M$：片上 SRAM 大小 (每个 SM 约百 KB 量级)
  - 标准实现要把 $S\\times S$ 的得分矩阵和 softmax 结果写回显存 (HBM) 再读出，访存是
    $O(S^2)$；FlashAttention 分块后只在 SRAM 里保存一个块，用在线 softmax
    (逐块更新最大值和归一化分母) 得到正确结果
  - 结果与标准注意力数学上完全等价 (精确注意力，不是近似)，速度快 $2\\sim4$
    倍并节省大量显存，使长序列训练成为可能；FlashAttention-2/3
    进一步优化了并行度和对新硬件的利用
  - 推理中的使用见 [Infer Optimization](@@IOPT@@) 和 [Attention](@@IATT@@)

## 梯度累积

$$ B\_{global}=B\_{micro}\\times N\_{accum}\\times N\_d $$

其中：

  - $B\_{micro}$：单卡单次前向反向的 batch
  - $N\_{accum}$：累积步数，即累加多少次梯度再更新一次参数
  - $N\_d$：数据并行卡数；$B\_{global}$：每次参数更新实际使用的样本数
  - 用累积可以在显存有限时仍获得大的全局 batch，数学上等价于大 batch；注意梯度要除以累积步数，BatchNorm 类层不等价，而
    LLM 使用 LayerNorm/RMSNorm 不受影响

## MFU

$$ \\text{MFU}=\\frac{\\text{实际达到的 FLOPs/s}}{\\text{硬件峰值
FLOPs/s}}=\\frac{6N\\cdot\\text{tokens/s}}{N\_{gpu}\\cdot\\text{FLOPs}\_{peak}}
$$

其中：

  - $6N\\cdot\\text{tokens/s}$：每秒训练的 token 数乘以每 token 的计算量
    (常见简化，未计入注意力项，长序列时注意力的 FLOPs 也应加上)
  - $N\_{gpu}$：卡数；$\\text{FLOPs}\_{peak}$：单卡的峰值算力
  - 例：7B 模型在 $8$ 张 A100 (BF16 峰值 $312$ TFLOPs) 上跑到
    $\\text{tokens/s}=24000$：$\\text{MFU}=\\frac{6\\times7\\times10^9\\times24000}{8\\times312\\times10^{12}}\\approx0.40$，即
    $40%$
  - MFU 低于 $30%$ 通常说明有明显的瓶颈 (数据加载、通信、小算子)；大规模训练一般在 $35%\\sim55%$
    `[经验]`；与之对应的 HFU (Hardware FLOPs Utilization) 还会计入重计算的开销

## 其他优化

  - 算子融合与编译：`torch.compile`、融合的 AdamW、融合的 RMSNorm/RoPE 等，减少小算子的启动和访存开销
  - 数据加载：预先分词并存成二进制、用多进程预取，避免 GPU 等数据；长度分桶减少补零
  - 计算与通信重叠：梯度分桶通信与反向计算重叠，FSDP 预取下一层的参数

## 框架

| 框架                                | 特点                                                                |
| --------------------------------- | ----------------------------------------------------------------- |
| Megatron-LM                       | 张量/流水线/序列并行，性能高，适合预训练                                             |
| DeepSpeed                         | ZeRO 系列，易用，支持 offload                                             |
| PyTorch FSDP / torchtitan         | 原生 PyTorch，与生态兼容好                                                 |
| Hugging Face Trainer / Accelerate | 易上手，适合微调                                                          |
| LLaMA-Factory、Axolotl、TRL         | 面向微调和对齐 (SFT/DPO)，见 [微调](/0410_LM_FT)、[对齐](/0568_LM_FT_Alignment) |

表中：预训练追求性能选 Megatron 或 torchtitan，微调追求易用选 Hugging Face 生态。

## Reference

  - [FlashAttention: Fast and Memory-Efficient Exact Attention with
    IO-Awareness](https://arxiv.org/abs/2205.14135)
  - [FlashAttention-2](https://arxiv.org/abs/2307.08691)
  - [Mixed Precision Training](https://arxiv.org/abs/1710.03740)
  - [Reducing Activation Recomputation in Large Transformer
    Models](https://arxiv.org/abs/2205.05198)
  - [PaLM: Scaling Language Modeling with Pathways
    (MFU)](https://arxiv.org/abs/2204.02311)
  - [FP8 Formats for Deep Learning](https://arxiv.org/abs/2209.05433)
