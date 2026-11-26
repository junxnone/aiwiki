-----

| Title     | LM Train Stability                                    |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T15:35:57Z`                                |
| Updated @ | `2026-11-26T15:42:20Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/831) |

-----

# Stability

大模型训练的稳定性：loss spike 和发散的成因，z-loss、QK-Norm 等稳定化手段，监控哪些信号，以及 checkpoint
与故障恢复。是 [Pretrain](/0824_LM_Train_Pretrain) 中稳定性一节的展开。

## 现象

| 现象         | 表现                 | 后果                  |
| ---------- | ------------------ | ------------------- |
| loss spike | loss 突然跳高，之后可能自行恢复 | 浪费计算，频繁出现会影响最终效果    |
| 发散         | loss 持续升高或变为 NaN   | 必须回滚到之前的 checkpoint |
| 缓慢退化       | 某些层的激活或权重范数持续增大    | 迟早引发 spike 或数值溢出    |

表中：规模越大、学习率越高，越容易出现这些问题；它们通常有共同的前兆：梯度范数和激活最大值的异常增长。

## 成因与对策

下图把常见成因与对应手段对应起来：

``` mermaid
flowchart LR
    A[注意力 logits 过大<br>softmax 饱和] --> A1[QK-Norm]
    B[输出 logits 过大<br>softmax 分母溢出] --> B1[z-loss]
    C[学习率过高 / Adam 二阶矩过小] --> C1[降低学习率<br>增大 epsilon<br>warmup]
    D[异常数据 batch] --> D1[跳过 batch<br>数据清洗]
    E[低精度溢出] --> E1[BF16 + FP32 累加<br>关键算子用 FP32]
    F[梯度爆炸] --> F1[梯度裁剪 1.0]
```

图中：左边是成因，右边是对应手段；实际的一次 spike 往往由多个原因叠加，所以通常同时使用多项手段。

### z-loss

$$ \\mathcal L\_z=\\lambda\_z,\\bigl(\\log Z\\bigr)^2,\\qquad
Z=\\sum\_{j=1}^{V}e^{z\_j} $$

其中：

  - $z\_j$：输出层第 $j$ 个词的 logit；$V$：词表大小；$Z$：softmax 的分母 (配分函数)
  - $\\lambda\_z$：系数，PaLM 用 $10^{-4}$；这一项鼓励 $\\log Z$ 接近 $0$，防止 logits
    整体漂移得很大，避免 BF16 下 softmax 溢出和梯度异常
  - 作为辅助损失加到交叉熵上，对模型效果几乎没有影响

### QK-Norm

$$ \\mathrm{score}\_{ij}=\\frac{\\mathrm{Norm}(\\mathbf
q\_i)^\\top\\mathrm{Norm}(\\mathbf k\_j)}{\\sqrt{d\_h}} $$

其中：

  - $\\mathbf q\_i,\\mathbf k\_j$：位置 $i$ 的 query 和位置 $j$ 的
    key；$\\mathrm{Norm}$：LayerNorm 或 RMSNorm
  - 在点积之前先对 $q,k$ 归一化，限制注意力 logits 的大小，避免 softmax 饱和成接近 one-hot 的分布
    (此时梯度接近 $0$，训练卡住或突变)
  - 已被 OLMo 2、Gemma 等模型采用 `[待核实]`

### 其他

  - 学习率：spike 多发生在学习率较高的阶段；降低峰值学习率是最直接的手段，见
    [Optimizer](/0830_LM_Train_Optimizer)
  - Adam 的 $\\epsilon$ 与 $\\beta\_2$：某些参数的梯度长期很小，$v\_t$
    也很小，一旦梯度突然变大，$\\hat m/\\sqrt{\\hat v}$
    会给出很大的更新；减小 $\\beta\_2$ (如 $0.95$) 让 $v\_t$ 跟得更快
  - 嵌入层：对嵌入的梯度或输出做缩放 (如 GLM-130B 的 embedding gradient shrink)
  - 跳过 batch：PaLM 报告在 spike 发生时，从 spike 前约 $100$ 步的 checkpoint 重启，并跳过其后
    $200\\sim500$ 个 batch，spike 不再出现，说明它与特定数据和当时的参数状态的组合有关

## 监控

| 指标                    | 关注点                   |
| --------------------- | --------------------- |
| 训练 loss               | 突然跳高、持续上升             |
| 梯度范数                  | 突然增大往往先于 loss spike   |
| 各层激活的最大值/RMS          | 持续增长是数值溢出的前兆          |
| 注意力 logits 最大值        | 是否需要 QK-Norm          |
| 输出 logits 的 $\\log Z$ | 是否需要 z-loss           |
| 学习率、吞吐 (tokens/s)、MFU | 确认训练按计划进行，吞吐下降可能是硬件问题 |

表中：这些指标要按步记录并设置告警，大规模训练中通常配有自动化的 spike 检测和回滚流程。

## Checkpoint 与故障恢复

  - 万卡规模下硬件故障很常见：Llama 3 报告 $54$ 天的训练中出现了 $419$ 次意外中断，平均约每 $3$
    小时一次，其中大部分与 GPU 和 HBM 有关 `[待核实]`
  - checkpoint 内容：模型参数、优化器状态、学习率调度器状态、数据读取的位置、随机数种子；缺任何一项都无法精确恢复
  - 写盘开销：70B 模型的完整状态约 $70\\times10^9\\times16\\approx1.1$ TB；用分片
    checkpoint 让每卡只写自己的分片，并异步写盘，避免训练长时间停顿
  - 间隔的选择：间隔越短，故障时丢失的进度越少，但写盘开销越大，可以用下式估算：

$$ T\_{opt}\\approx\\sqrt{2,t\_{ckpt}\\cdot\\mathrm{MTBF}} $$

其中：

  - $T\_{opt}$：最优的 checkpoint 间隔；$t\_{ckpt}$：一次保存造成的停顿时间
  - $\\mathrm{MTBF}$：整个集群的平均无故障时间 (单卡 MTBF 除以卡数)
  - 例：$t\_{ckpt}=1$ 分钟，$\\mathrm{MTBF}=3$ 小时 ($180$
    分钟)：$T\_{opt}\\approx\\sqrt{2\\times1\\times180}\\approx19$ 分钟
  - 这是经典的 Young/Daly 公式，给出量级参考；实际还要考虑故障检测和重启所需的时间

## Reference

  - [PaLM: Scaling Language Modeling with
    Pathways](https://arxiv.org/abs/2204.02311)
  - [Scaling Vision Transformers to 22 Billion Parameters
    (QK-Norm)](https://arxiv.org/abs/2302.05442)
  - [Small-scale proxies for large-scale Transformer training
    instabilities](https://arxiv.org/abs/2309.14322)
  - [GLM-130B: An Open Bilingual Pre-trained
    Model](https://arxiv.org/abs/2210.02414)
  - [The Llama 3 Herd of Models](https://arxiv.org/abs/2407.21783)
  - [A higher order estimate of the optimum checkpoint interval for
    restart dumps (Daly)](https://doi.org/10.1016/j.future.2004.11.016)
