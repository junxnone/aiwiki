-----

| Title     | ML Tasks TimeSeries Foundation Timer                  |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-19T02:42:20Z`                                |
| Updated @ | `2026-11-20T08:21:34Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/656) |

-----

# Timer

Timer（Time Series
Transformer）是清华大学团队（论文作者单位为清华大学软件学院、BNRist）提出的\*\*大时间序列模型（Large
Time Series Model, LTSM）**早期工作，论文首页标注为 ICML 2024（PMLR
235）论文。它做了三件事：把异构时间序列统一成**单序列序列（single-series
sequence, S3）\*\*格式；用 GPT 风格的 **decoder-only Transformer** 做 next token
prediction 的生成式预训练；把预测、填补、异常检测三类任务都改写成"生成"任务做下游适配。

一句话概括：**把时间序列当"句子"，按段（segment）切成 token，用语言模型的方式预训练，再用统一的生成式表述适配多任务。**

在 [时间序列基础模型综述](/0608_ML_Tasks_TimeSeries_Foundation) 的分类里，Timer
属于"从头预训练（连续值 patch）"与"通用多任务"两类；同类基础模型的整体对比见该综述，后续工作
Time-MoE 本文不展开。

## 解决什么问题

论文的出发点是：深度小模型在真实的数据稀缺场景会遇到性能瓶颈，而这种瓶颈在当前基准上被"小模型性能饱和"掩盖。论文图 1 用 PatchTST
展示：训练样本比例越低，相对全量训练的 MSE 退化越大。与此同时，LLM
通过大规模预训练展现了少样本泛化、可扩展性（scalability，性能随参数量和语料规模提升）与任务通用性，这些是小模型没有的。

论文指出开发 LTSM 还有三个没解决的问题：

1.  **数据与统一处理**：数据基础设施和异构序列的统一处理落后，已有无监督预训练多是小规模、数据集内迁移；
2.  **架构**：可扩展大模型的架构探索不足；论文观察到小模型里普遍有效的非自回归（encoder-only）结构可能不适合 LTSM；
3.  **任务统一**：已有大规模预训练模型主要只做单一任务（如预测），任务统一做得少。

Timer 的对应答案：UTSD 数据集 + S3 格式 + decoder-only 生成式预训练 + 统一生成式任务表述。论文还强调
Timer 直接在时间序列上原生预训练，不需要像 FPT、LLMTime、Time-LLM 那样做与 LLM 的模态对齐。

## 数据：UTSD

论文先建了 Unified Time Series Dataset（UTSD），用于研究 LTSM 的可扩展性：

  - 由公开数据与真实机器运行数据汇总而成，缺失值用线性插值处理；存储沿用 LOTSA 采用的 parquet/ARROW 统一格式；
  - 论文记录了每个数据集的两类统计：基本属性（时间步数、变量数、文件大小、频率等）与序列特性（周期性、平稳性、可预测性）；其中平稳性用
    ADF 检验统计量（对多序列数据集按序列长度加权），可预测性（forecastability）用傅里叶分解熵的补数（同样按长度加权）；
  - 论文称 UTSD 包含 29
    个独立数据集，覆盖七个领域（Energy、Environment、Health、IoT、Nature、Transport、Web），最大规模达
    **10 亿时间点**；
  - 按"保持模式多样性、各领域数据量尽量均衡、复杂度（由上述统计量计算）逐级上升"的原则，筛出四档层级：**UTSD-1G / 2G /
    4G / 12G**，在 HuggingFace 上发布了四个版本（`thuml/UTSD`）。\[解读\] 名字中的 G
    对应数据存储体量，而不是时间点个数；论文 Table 2 的 File Size 列是 ARROW
    文件占用。
  - 论文还对 LOTSA 做了同样的处理流程用于零样本预测实验，LOTSA 不在上述层级里。

所有下游数据集都不在预训练数据中，以避免数据泄漏。

## 核心思想与结构

### S3 格式：多变量与异构数据怎么变成单序列

异构性体现在幅值、频率、平稳性，以及不同数据集在变量数、序列长度、用途上的差异。S3 的做法（论文图 3）：

1.  在**变量级别**做归一化与合并：每个变量序列按 9:1 划分训练/验证部分，用训练部分的统计量对整条序列归一化；
2.  把归一化后的所有变量序列合并成一个**单变量序列池**，多变量数据集被拆成多条单变量序列放进池里；
3.  在池中按窗口均匀采样，得到固定上下文长度的单序列，即 S3 序列。

论文称归一化后训练数据的时间点近似服从正态分布，从而缓解不同数据集间幅值和变量数的差异。

S3 是 Channel Independence（CI，PatchTST 采用）的扩展。区别：

| 方面       | CI                               | S3                      |
| -------- | -------------------------------- | ----------------------- |
| 时间对齐     | 要求多变量序列时间对齐                      | 不要求                     |
| batch 来源 | 变量维展平进 batch，一个 batch 的样本来自同一数据集 | 同一 batch 可混合不同时间段、不同数据集 |
| 适用数据     | 规整的多变量序列                         | 单变量与不规则序列均可             |

表中：「方面」是对比维度，后两列是 CI（通道独立）与 S3 的做法。结论：S3 不要求时间对齐，同一 batch
可混合不同数据集，适用于单变量与不规则序列。

论文认为 S3 让模型在预训练时见到来自不同时期、不同数据集的序列，难度更高，但促使模型更关注时间变化本身。\[解读\]
一个直接的后果是模型不显式建模变量间依赖：多变量数据被拆成独立的单变量序列后，变量间关系不再保留。

### Tokenization 与模型

LLM 的自回归目标是

$$P(\\mathcal U)=\\prod\_{i=1}^{N}p(u\_i\\mid u\_{\<i})$$

其中：$\\mathcal U={u\_1,\\dots,u\_N}$ 是 token 序列；$p(u\_i\\mid u\_{\<i})$
是在已知前面所有 token 时第 $i$ 个 token 的条件概率；连乘把联合分布分解为逐 token
的条件分布，这是自回归生成的基础。

Timer 把 S3 序列 $\\mathbf X={x\_1,\\dots,x\_{NS}}$（上下文长度 $NS$）按长度 $S$ 切成
$N$ 个 token，每个 token 是一段连续时间点：

$$\\mathbf s\_i={x\_{(i-1)S+1},\\dots,x\_{iS}}\\in\\mathbb R^{S},\\quad
i=1,\\dots,N$$

其中：$\\mathbf s\_i$ 是第 $i$ 个 token，即连续 $S$
个时间点；$x\_{(i-1)S+1},\\dots,x\_{iS}$ 是这些时间点的取值；$N$ 是 token
个数；$\\mathbb R^{S}$ 表示 $S$ 维向量。

模型是 $L$ 层、维度 $D$ 的 decoder-only Transformer（因果注意力）：

$$\\mathbf h\_i^0=\\mathbf W\_e\\mathbf s\_i+\\mathbf{TE}*i,\\qquad
\\mathbf H^l=\\mathrm{TrmBlock}(\\mathbf H^{l-1}),\\
l=1,\\dots,L,\\qquad {\\hat{\\mathbf s}*{i+1}}=\\mathbf H^L\\mathbf
W\_d$$

其中：$\\mathbf h\_i^0$ 是第 $i$ 个 token 的输入表示；$\\mathbf W\_e$
是编码矩阵；$\\mathbf{TE}*i$ 是可选的时间戳嵌入；$\\mathbf H^l$ 是第 $l$
层输出，$\\mathrm{TrmBlock}$ 是因果 Transformer 块，$L$ 是层数；$\\mathbf
W\_d$ 是解码矩阵；$\\hat{\\mathbf s}*{i+1}$ 是对下一个 token 的预测。

其中 $\\mathbf W\_e,\\mathbf W\_d\\in\\mathbb R^{D\\times S}$ 分别独立地对每个
token 做编码和解码，$\\mathbf{TE}\_i$ 是可选的时间戳嵌入。预训练目标是 token 级的 MSE：

$$\\mathcal L\_{\\rm MSE}=\\frac1{NS}\\sum\\lVert \\mathbf
s\_i-\\hat{\\mathbf s}\_i\\rVert\_2^2,\\quad i=2,\\dots,N$$

其中：$\\mathcal L\_{\\rm MSE}$ 是预训练损失；$N$ 是 token 个数，$S$ 是每个 token
的长度；$\\mathbf s\_i$ 是第 $i$ 个真实 token，$\\hat{\\mathbf s}\_i$
是模型预测；求和遍及第 2 到第 $N$ 个 token，因为第 1 个 token 没有前文可预测。

每个位置生成的 token 都被独立监督（token-wise supervision），因此推理时上下文长度可变，并能通过滑动、扩大输入
token 做迭代多步生成。

结构对比（论文图 4）：encoder-only 的预测器（如 PatchTST、iTransformer）把 lookback
的全局表示展平后线性投影出预测，论文认为展平可能抹掉注意力建模的序列依赖；Timer 则逐 token
预测下一个 token，保留序列结构。

\[解读\] Timer 的模型形态与 GPT 几乎同构，只是把词表 embedding
换成对一段原始数值的线性映射，输出端直接回归下一段，不做离散化，也不输出分布（论文
Table 9 标注 Probabilistic 为 False）。

## 训练与推理

### 预训练

  - 预测任务相关的 Timer：在 UTSD-12G 上预训练，$S=96$，$N=15$，上下文最长
    $15\\times96=1440$；
  - 填补任务相关的 Timer：在 UTSD-4G 上预训练，$S=24$，$N=15$；
  - 优化：AdamW + cosine annealing，base lr $5\\times10^{-5}$，最终 lr
    $2\\times10^{-6}$，batch size 8192，PyTorch + NVIDIA A100；
  - UTSD-12G 无法整体载入内存做全局打乱，论文采用局部打乱：随机分成三个 4G 子集轮流载入。

模型规格（论文 Table 6，head 数固定为 8）：

| 扩展方式 | 层数 L          | 模型维度 D                 | 参数量                              |
| ---- | ------------- | ---------------------- | -------------------------------- |
| 增加层数 | 2 / 4 / 6 / 8 | 256                    | 1.10M / 2.16M / 3.21M / 4.27M    |
| 增加维度 | 6             | 256 / 512 / 768 / 1024 | 3.21M / 12.72M / 28.51M / 50.59M |
| 其他   | 8             | 768 / 1024             | 37.97M / 67.40M                  |

表中：「扩展方式」说明改变的是层数、维度还是两者，「层数 L」「模型维度 D」是网络规模，「参数量」是对应总参数。

### 统一的生成式下游任务（论文图 5）

**预测**：本身就是 next token prediction。下游微调时把 lookback 切成 $N=7$ 个
token（$S=96$，即 lookback 672），模型输出 $N$ 个 next token，与真值算
MSE；推理时迭代生成：把预测结果拼回 lookback，反复生成下一个
token，直到长度够，多出的部分截断。

**填补**：改成 T5 式 denoising autoencoding。序列分 $N=8$ 段、每段 24
点，随机把若干段整段置零（mask，首段保持可见），被 mask 的段作为特殊
token，其余为普通 token 输入；把输出当作 next token，用被 mask 段的生成结果与真值的重建误差反传。推理时用被
mask 段的 MSE 评估。这是**段级（segment-level）填补**：论文认为真实世界的缺失往往连续出现，比 TimesNet
的点级填补更难。

**异常检测**：论文提出**预测式**协议：用已观测的段预测下一段，预测值作为"正常标准"，与实际到达的值比较。与 Anomaly
Transformer、TimesNet 的重建式（先收集一段时间序列再重建）不同，预测式可以逐段在线检测。具体做法：用 $N=7$ 段、每段
$S=96$ 训练去生成下一个 96 点 token；训练后记录测试集所有段的 MSE
并降序排列，找到第一个命中标注异常区间的段，记录它落在前多少分位（$\\alpha$
quantile）。

下游适配配置（论文 Table 8）：初始 lr 均为 $3\\times10^{-5}$，指数衰减底数 0.5，MSE 损失，10
epochs；预测 batch size 2048，填补 32，异常检测 128；填补与异常检测用 4 层、$D=256$。

自拟示意（非论文数字）：若预测长度为 192、$S=96$，需要迭代 $192/96=2$ 次 next token 生成；预测长度 100
则生成 2 个 token 后截断多余 92 点。

## 实验与结论

所有数字来自论文图表，设置标注如下。

### 预测（少样本）

设置：ETT、ECL、Traffic、Weather、PEMS；lookback 672、预测长度 96；Timer 在 UTSD-12G
预训练；对比 PatchTST 与 iTransformer
在全量样本上训练的较优者（SOTA）；通过按均匀间隔抽取训练样本构造数据稀缺场景。

  - 微调 Timer 仅用 ETTh1 的 1%、Traffic 的 5%、PEMS03 的 3%、PEMS04 的 25% 样本，就优于
    SOTA 全量训练；
  - 从头训练的 Timer 在全量样本的表现，被预训练 Timer 用 ETTh1 的 2%、ECL 的 5%、Weather 的
    1%、PEMS03 的 4% 样本微调所达到；
  - 全量样本下预训练仍有益：Weather 0.165→0.154，PEMS03 0.126→0.118，PEMS04
    0.125→0.107（MSE，从头训练→预训练）。

### 填补

设置：11 个数据集，各 4 个 mask 比例 {12.5%, 25%, 37.5%, 50%}（共 44 个场景），对比
TimesNet，Timer 在 UTSD-4G 预训练。

| 下游样本比例 | Timer 胜出场景数（共 44） |
| ------ | ----------------- |
| 5%     | 44（100.0%）        |
| 20%    | 38（86.4%）         |
| 100%   | 25（56.8%）         |

表中：「下游样本比例」是用于微调的训练样本比例，「Timer 胜出场景数（共 44）」是在 44 个填补场景中 Timer 优于
TimesNet 的个数（括号为占比）。结论：样本越少，预训练的优势越大。

5% 样本下，预训练相对从头训练平均降低的填补 MSE，各数据集在 1.85%（ETTh2）到 15.49%（PEMS04）之间（图 8）。

### 异常检测

设置：UCR Anomaly Archive 共 250 个任务，每个任务仅一条正常序列训练；统计在给定分位 $\\alpha$
内检出异常的任务数。

| $\\alpha$ 分位 | TimesNet | Anomaly Transformer | Timer |
| ------------ | -------- | ------------------- | ----- |
| 1%           | 31       | 51                  | 51    |
| 3%           | 61       | 98                  | 110   |
| 10%          | 109      | 129                 | 172   |

表中：「$\\alpha$ 分位」是允许的检测位置（测试段按重构误差降序排列后的前多少比例），后三列是在该分位内检出异常的任务数（共 250
个任务，越大越好）。结论：Timer 在各分位下检出数最多或并列最多。

预训练 vs 从头训练（图 9）：3% 分位检出 99→110，10% 分位 146→172；250 个任务的平均分位
14.3%→12.5%（越小越好）。

### 可扩展性（scaling）

设置：预训练后在 PEMS 全部子集上做预测微调，比较 5% 与 20% 两种少样本比例（图 10、11）。

  - **模型规模**（UTSD-4G 预训练）：固定 $D=256$，层数增加使参数量由 1M 到 4M，5% 样本的 MSE
    0.231→0.197、20% 样本 0.194→0.154（论文称平均降低 14.7% 与 20.6%）；固定
    $L=6$，增大维度使参数量 3M→50M，5% 样本 0.203→0.152、20% 样本
    0.159→0.130（降低 25.1% 与 18.2%）。
  - **数据规模**（$L=8$，$D=1024$）：UTSD 从 1G 到 12G，5% 样本 MSE 为
    0.149、0.145、0.144、0.138；20% 样本为
    0.129、0.127、0.125、0.123。论文称收益比扩大模型小，并归因于这些数据集上的性能饱和。
  - 综合放大模型和数据：5% 样本 0.231→0.138（-40.3%），20% 样本
    0.194→0.123（-36.6%），超过全量样本训练的 iTransformer（PEMS
    为 0.139）。

### 模型分析

  - **骨干选择**：在 UTSD-4G 上比较 TiDE（MLP）、TCN（CNN）、LSTM（RNN）、encoder-only
    PatchTST、decoder-only Timer；论文结论是 Transformer 作为 LTSM
    骨干可扩展性好，MLP、CNN 可能在容纳多样数据时遇到瓶颈。
  - **decoder-only vs encoder-only**（论文 Table 1，在 UTSD-12G
    预训练）：从头训练时，样本不足（1%）encoder-only 更好，样本更多时
    decoder-only 更好；预训练后 decoder-only 在多数场景最优。例如 1% 目标样本下
    Traffic，decoder 预训练 0.390，对 encoder 预训练 0.434。论文提醒：encoder-only
    的训练 loss 更小（图 12），但 decoder-only 泛化更强；并说 encoder-only
    在现有小基准上易过拟合。
  - **灵活长度**：同一个 Timer 可用不同 lookback（图 13，PEMS 上 lookback
    越长误差整体下降）；也可通过滚动生成得到任意预测长度，图 15 显示在
    ECL、Traffic 上相比 encoder-only 的 PatchTST 误差累积更小。

### 零样本预测（与其他 LTSM）

设置：7 个 iTransformer 使用的数据集（不含 PEMS，因 PEMS 已出现在 LOTSA 中），按 predict-96
窗口平均 MSE，对比官方开源 checkpoint：Moirai、TimesFM、Chronos、MOMENT。Timer
提供三个版本：Timer-1B（UTSD 预训练）、Timer-16B（UTSD +
Buildings900K）、Timer-28B（UTSD + LOTSA）。结果（图 14）：正文称排名靠前的 LTSM 是
Timer、Moirai、TimesFM（图 14 Overall 平均排名柱图上的奖牌标注为 Timer 第 1、TimesFM 第
2、Moirai 第 3）；论文同时指出性能与预训练规模的正相关仍较弱，强调高质量数据以及数据与模型规模的同步扩展。具体 MSE 数值见论文
Table 18，本文不转引。

论文 Table 9 对 LTSM 的横向属性：Timer 为 Decoder 架构，参数 29M/50M/67M，预训练规模
28B，支持预测、填补、异常检测，token 类型为 Segment，上下文 ≤1440，变长，非概率预测。

## 优缺点与局限

论文自述：

  - 当前 LTSM 参数量远小于 LLM，可支持更多任务和更长上下文；
  - 未来方向包括更好的零样本泛化，以及概率预测和长上下文预测；
  - 数据基础设施仍需加快，论文强调需要数据与模型同步扩展。

\[经验\] / \[解读\]：

  - \[解读\] 非概率：输出是点预测，不给不确定性，这与 Moirai、Chronos 等概率预测模型不同；
  - \[解读\] S3 丢弃变量间对齐，因此无法利用变量间依赖；
  - 论文的预测实验用 $S=96$、填补实验用 $S=24$，两者分别预训练；\[解读\] 下游 token
    长度需与预训练时一致，上下文长度也受限于 $N\\times
    S$（预测设置下为 1440）；
  - \[解读\] 论文的突出优势在少样本场景；全量样本下优势变小（如填补在 100% 样本下仅在 25/44 个场景胜出，即 56.8%）。

## 与相关方法对比

| 方法       | 预训练方式                  | 架构              | 任务            | 备注                                                        |
| -------- | ---------------------- | --------------- | ------------- | --------------------------------------------------------- |
| Timer    | 生成式（next token）        | decoder-only    | 预测、填补、异常检测    | S3 + UTSD                                                 |
| PatchTST | 论文相关工作将其归为 BERT 式掩码预训练 | encoder-only    | 预测            | 论文用它作少样本基线                                                |
| MOMENT   | 掩码建模                   | encoder         | 预测、填补、分类、异常检测 | 见 Table 9                                                 |
| Moirai   | 见论文 Table 9            | encoder         | 预测            | 概率预测，segment token                                        |
| TimesFM  | 见论文 Table 9            | decoder         | 预测            | Timer 论文 Table 9 标为概率预测（TimesFM 原论文自述只做点预测），segment token |
| Chronos  | 见论文 Table 9            | encoder-decoder | 预测            | 概率预测，point token                                          |

表中：「方法」是对比模型，「预训练方式」「架构」「任务」「备注」说明各自的训练目标、网络结构、支持的任务与特点。结论：Timer 是
decoder-only 的生成式预训练，并统一支持预测、填补、异常检测。

其他相邻方法：PatchTST、iTransformer、TimesNet 等监督式小模型（本系列已有同名文章，见
[时间序列深度模型综述](/0606_ML_Tasks_TimeSeries_Deep)）；Time-MoE
是后续工作，此处只提名字。

## 使用方式

官方代码与 UTSD 数据集见 Reference。典型流程：

1.  用 UTSD（或自备数据）按 S3 格式整理；
2.  载入预训练 checkpoint；
3.  按下游任务选择：预测用 next token 微调，填补用 mask token，异常检测用预测式 next token。

示意代码（未运行验证，仅表达 S3 与 next token 预测的思路）：

``` python
# 示意代码，未运行验证
import random

def s3_window(series_pool, N=15, S=96):
    x = random.choice(series_pool)           # 归一化后的单变量序列
    i = random.randint(0, len(x) - N * S)
    return x[i:i + N * S].reshape(N, S)      # N 个 token，每个 S 点

tokens = s3_window(pool)                     # [N, S]
pred = model(tokens[:-1])                    # 因果注意力，每个位置预测下一个 token
loss = ((pred - tokens[1:]) ** 2).mean()
```

## Reference

  - 论文：[Timer: Generative Pre-trained Transformers Are Large Time Series
    Models](https://arxiv.org/abs/2402.02368)
  - 代码与数据：<https://github.com/thuml/Large-Time-Series-Model>
    ，UTSD：<https://huggingface.co/datasets/thuml/UTSD>
