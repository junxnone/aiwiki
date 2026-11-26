-----

| Title     | LM Train Pretrain                                     |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T15:34:26Z`                                |
| Updated @ | `2026-11-26T15:34:26Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/824) |

-----

# Pretrain

大模型预训练：训练目标、优化器与学习率、batch size，Scaling Law 与训练算力的估算，以及训练稳定性和 checkpoint。

## 训练目标

预训练是在海量文本上做 next-token 预测，即最大化每个 token 在其前文条件下的概率：

$$ \\mathcal L(\\theta)=-\\frac1T\\sum\_{t=1}^{T}\\log
p\_\\theta\\bigl(x\_t\\mid x\_{\<t}\\bigr),\\qquad
\\mathrm{PPL}=e^{\\mathcal L} $$

其中：

  - $x\_1,\\dots,x\_T$：一个训练序列的 token；$x\_{\<t}$：第 $t$ 个 token 之前的所有
    token；$p\_\\theta$：模型输出的 softmax 概率
  - $\\mathcal L$：平均交叉熵损失，单位是
    nat；$\\mathrm{PPL}$：困惑度，可以理解为模型平均在多少个等可能的候选里犹豫，越低越好
  - 因果掩码使一个长度为 $T$ 的序列一次前向就能得到 $T$ 个训练信号，所以训练非常高效

## 训练配置

下图是一个训练循环的步骤：

``` mermaid
flowchart LR
    A[取一个 batch<br>约 4M token] --> B[前向 计算 loss]
    B --> C[反向 计算梯度]
    C --> D[梯度裁剪 1.0]
    D --> E[AdamW 更新参数]
    E --> F[调整学习率<br>warmup + cosine]
    F --> G{到 checkpoint 间隔?}
    G -->|是| H[保存 checkpoint]
    G --> A
```

图中：循环中的每一步都有标准做法：大 batch (按 token 数计，常见 $2\\sim16$M
token)、梯度裁剪防止梯度爆炸、AdamW 优化器、学习率先升后降，并周期性保存
checkpoint 以便故障恢复。

| 配置项        | 常见取值 `[经验]`                                  | 说明                        |
| ---------- | -------------------------------------------- | ------------------------- |
| 优化器        | AdamW，$\\beta\_1=0.9,\\ \\beta\_2=0.95$      | 比默认 $\\beta\_2=0.999$ 更稳定 |
| 权重衰减       | $0.1$                                        | 不作用于偏置和归一化参数              |
| 学习率        | 峰值约 $3\\times10^{-4}$ (7B 量级)                | 模型越大，峰值越小                 |
| 学习率调度      | 线性 warmup (约 $2000$ 步) + cosine 衰减到峰值的 $10%$ | warmup 避免训练初期发散           |
| batch size | 约 $4$M token                                 | 大模型用更大的 batch             |
| 梯度裁剪       | 全局范数 $1.0$                                   | 抑制 loss spike             |
| 精度         | BF16 前向反向，FP32 主权重与优化器状态                     | 见 [Efficiency](@@TEFF@@)  |

表中：这是 Llama 2 一类模型公开的典型设置；具体数值需要根据模型规模调整，更大模型通常用更小的学习率和更大的
batch。优化器的选择与超参迁移见 [Optimizer](@@TOPT@@)。

### 学习率调度：cosine 与 WSD

$$
\\eta\_{cos}(t)=\\eta\_{min}+\\frac12(\\eta\_{max}-\\eta\_{min})\\Bigl(1+\\cos\\frac{\\pi(t-t\_w)}{T-t\_w}\\Bigr),\\qquad
t\\ge t\_w $$

其中：

  - $t$：当前步数；$t\_w$：warmup 步数，$t\<t\_w$ 时学习率从 $0$ 线性升到
    $\\eta\_{max}$；$T$：总步数
  - $\\eta\_{max}$：峰值学习率；$\\eta\_{min}$：最低学习率，常取 $0.1\\eta\_{max}$
  - cosine 的问题：曲线形状依赖事先确定的总步数 $T$，想中途延长训练或复用中间 checkpoint 都不方便

WSD (Warmup-Stable-Decay) 把调度拆成三段：warmup 后长期保持 $\\eta\_{max}$ 不变，只在最后约
$10%\\sim20%$ 的步数快速衰减：

| 调度     | 形状                   | 优点                                                      | 缺点            |
| ------ | -------------------- | ------------------------------------------------------- | ------------- |
| cosine | warmup 后平滑下降         | 简单，效果稳定                                                 | 必须预先定好总步数     |
| WSD    | warmup → 平台 → 末段快速衰减 | 平台期的 checkpoint 可以随时接一段衰减得到可用模型；方便继续训练和做 Scaling Law 实验 | 多一个超参 (衰减段长度) |

表中：MiniCPM、DeepSeek 等公开的训练都采用了类似的「平台 + 衰减」思路 (DeepSeek 用的是分段阶梯式衰减)
`[待核实]`；末段衰减通常配合切换到更高质量的数据 (退火)，对最终效果的提升很明显。

## Scaling Law

损失随模型大小和数据量按幂律下降：

$$ L(N,D)=E+\\frac{A}{N^{\\alpha}}+\\frac{B}{D^{\\beta}},\\qquad
C\\approx6ND,\\qquad D\_{opt}\\approx20,N $$

其中：

  - $N$：参数量；$D$：训练 token 数；$E$：数据本身不可约的熵 (理论下限)
  - $A,B,\\alpha,\\beta$：拟合得到的常数；$\\frac{A}{N^\\alpha}$
    是模型容量带来的误差，$\\frac{B}{D^\\beta}$ 是数据量不足带来的误差
  - $C$：训练的总计算量 (FLOPs)，$6ND$ 来自前向 $2N$ + 反向 $4N$ 每 token
  - Chinchilla 的结论：在给定计算预算下，参数量和数据量应该同比例增长，最优大约是每个参数配 $20$ 个 token，即
    $D\_{opt}\\approx20N$；之前的 GPT-3 (175B 参数，约 $300$B token) 数据明显不足
  - 但推理成本也要考虑：如果模型要被大量使用，宁可训得「过量」(更多 token) 得到更小、推理更便宜的模型，所以 Llama 3 8B
    用了约 $15\\text{T}$ token (约 $1900$ 个 token/参数) 远超 Chinchilla 最优
    `[待核实]`

Chinchilla 论文 (第三种方法) 的拟合值为
$E=1.69$、$A=406.4$、$B=410.7$、$\\alpha=0.34$、$\\beta=0.28$ (损失单位为
nat，基于其 MassiveText 数据和分词器，换数据后常数会变)。代入
$N=7\\times10^9$、$D=2\\times10^{12}$：

$$ \\frac{406.4}{(7\\times10^9)^{0.34}}\\approx0.18,\\qquad
\\frac{410.7}{(2\\times10^{12})^{0.28}}\\approx0.15,\\qquad
L\\approx1.69+0.18+0.15=2.02 $$

其中：

  - 第一项是模型容量带来的损失，第二项是数据量不足带来的损失；两项量级相当，说明这个配置大致平衡
  - 若把 $D$ 增大 $10$ 倍，第二项降为 $0.15\\times10^{-0.28}\\approx0.08$，损失约
    $1.95$
  - 若改为把 $N$ 增大 $10$ 倍，第一项降为 $0.18\\times10^{-0.34}\\approx0.08$，损失也约
    $1.95$；两种做法的训练计算量都增大 $10$ 倍，但后者的推理成本也增大 $10$ 倍，这就是前一条「宁可多训数据」的量化依据

在给定 $C$ 下最小化 $L$，可以解出最优分配：

$$ N\_{opt}\\propto C^{\\frac{\\beta}{\\alpha+\\beta}},\\qquad
D\_{opt}\\propto C^{\\frac{\\alpha}{\\alpha+\\beta}} $$

其中：

  - $\\frac{\\beta}{\\alpha+\\beta}$ 与
    $\\frac{\\alpha}{\\alpha+\\beta}$：用上面的拟合值约为 $0.45$ 和 $0.55$，即算力增加
    $10$ 倍时，参数量约增 $2.8$ 倍、数据量约增 $3.5$ 倍
  - 论文的另外两种方法得到的指数都接近 $0.5$，「每参数约 $20$ token」就来自这两种方法
  - 后续的复现工作对第三种方法的常数提出过修正，使用时以趋势为主，不要直接套用具体数值 `[待核实]`

## 算力估算示例

$$ \\text{GPU
小时}=\\frac{6ND}{\\text{FLOPs}\_{peak}\\cdot\\text{MFU}\\cdot3600} $$

其中：

  - $6ND$：训练的总计算量 (FLOPs)，见上文
  - $\\text{FLOPs}\_{peak}$：单卡的峰值算力 (BF16 稠密)
  - $\\text{MFU}$：实际达到的算力占峰值的比例，定义见 [Efficiency](@@TEFF@@)
  - 除以 $3600$ 把秒换算为小时，结果是单卡等效的 GPU 小时数

以 7B 模型、$2\\text{T}$ token、A100 (BF16 峰值 $312\\text{ TFLOPs}$)、MFU $40%$
为例：

  - $6ND=6\\times7\\times10^{9}\\times2\\times10^{12}=8.4\\times10^{22}$
    FLOPs
  - 有效算力 $=312\\times10^{12}\\times0.4\\approx1.25\\times10^{14}$
    FLOPs/s
  - 时间 $=8.4\\times10^{22}/1.25\\times10^{14}\\approx6.7\\times10^{8}$ s
    $\\approx1.87\\times10^5$ GPU 小时
  - 用 $2048$ 张 A100 并行约 $91$ 小时 (约 $3.8$ 天，不含故障和调试)；Llama 2 7B 公开的是约
    $1.84\\times10^5$ GPU 小时，量级一致

## 训练稳定性

  - loss spike：训练中 loss 突然飙升，常见原因是学习率过大、异常数据 batch、数值溢出；应对：降低峰值学习率、跳过问题
    batch、梯度裁剪、QK-Norm、z-loss (约束 logit 过大)，并在 spike 前的 checkpoint 重启
  - 监控指标：loss、梯度范数、各层激活的最大值、学习率、吞吐，异常时及时报警
  - checkpoint：定期保存模型、优化器状态、数据读取位置和随机数种子，保证可以精确恢复；大模型使用分片 checkpoint
    并异步写盘
  - 故障：万卡集群上硬件故障频繁，需要自动检测、替换节点和恢复；这也是训练框架和运维的重点，见
    [Distributed](@@TDIST@@)

## 预训练之后

  - 基础模型不会听指令，需要 SFT、RLHF/DPO，见 [对齐](/0568_LM_FT_Alignment)；领域适配见
    [微调](/0410_LM_FT)
  - 评价预训练模型的方法见 [Eval](@@TEVAL@@)

## Reference

  - [Scaling Laws for Neural Language
    Models](https://arxiv.org/abs/2001.08361)
  - [Training Compute-Optimal Large Language Models
    (Chinchilla)](https://arxiv.org/abs/2203.15556)
  - [Chinchilla Scaling: A replication
    attempt](https://arxiv.org/abs/2404.10102)
  - [MiniCPM: Unveiling the Potential of Small Language Models
    (WSD)](https://arxiv.org/abs/2404.06395)
  - [Llama 2: Open Foundation and Fine-Tuned Chat
    Models](https://arxiv.org/abs/2307.09288)
  - [The Llama 3 Herd of Models](https://arxiv.org/abs/2407.21783)
  - [Decoupled Weight Decay Regularization
    (AdamW)](https://arxiv.org/abs/1711.05101)
