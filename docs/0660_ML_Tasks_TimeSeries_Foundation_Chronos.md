---
Title | ML Tasks TimeSeries Foundation Chronos
-- | --
Created @ | `2026-11-19T03:24:17Z`
Updated @| `2026-11-20T08:23:21Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/660)

---
# Chronos

Chronos（论文 *Chronos: Learning the Language of Time Series*，arXiv:2403.07815，Amazon 等机构作者，发表于 Transactions on Machine Learning Research，2024 年 10 月）是一个预训练的概率时序预测框架。一句话概括：**把实数时间序列做均值缩放并量化成离散 token，几乎不改动地用 T5 等语言模型架构、按交叉熵损失训练；预测时自回归采样多条 token 轨迹，再反量化、反缩放，得到概率预测。**

在[时序基础模型](/0608_ML_Tasks_TimeSeries_Foundation)的分类里，它属于"从头预训练 + 量化 token"这一路：不是提示或微调现成的 LLM，而是用语言模型的**架构和训练配方**在时间序列语料上从头训练。本文把它拆成三部分来讲：(1) 极简的 tokenization（缩放 + 均匀量化）加语言模型训练；(2) 两种数据策略：TSMixup 增强与 KernelSynth 合成；(3) 覆盖 42 个数据集的域内与零样本评测。本文只讨论单变量预测（论文自己也限定在单变量）。

## 动机：为什么用语言模型的方式做时序

论文从一个朴素的问题出发：预测下一个词的语言模型，和预测下一个值的时序模型，本质差别是什么？前者的 token 来自有限字典，后者的值来自无界的连续域，但二者都在建模序列结构以预测未来。既然如此，只要把连续值变成有限词表里的 token，好的语言模型是否"直接就能用"？

论文对已有路线的评价（论文自述）：

- **提示或微调 LLM**（LLMTime、PromptCast、GPT4TS、Time-LLM）：要么需要为每个任务做提示工程或微调，要么依赖 GPT-3、Llama 2 这样的大模型，推理资源开销大；
- **同期预训练时序模型**（Lag-Llama、Moirai 等）：在实值上工作，带有时序专用设计，如时间特征、滞后项、patching、实值分布头；
- **ForecastPFN**：只在预设趋势和季节性生成的合成数据上训练，且只给点预测。

Chronos 的取向是"极简"：**不加任何时序专用的特征和结构，只改 tokenization**，让整个 NLP 生态（模型库、解码技巧、推理加速）原样可用。论文结尾称之为"对时间不可知"（agnostic to time）的语言建模框架。

## 核心思想与结构

### 整体流程


下图概括 Chronos 的训练与推理流程。

```
训练:  序列 x_1..x_{C+H} ─均值缩放─> 量化为 token z_1..z_{C+H} (+EOS)
       ─> 语言模型, 预测下一个 token 的分布, 与真实 token 做交叉熵

推理:  历史 x_1..x_C ─均值缩放 (s)─> 量化 z_1..z_C
       ─> 语言模型自回归采样 (多条轨迹)
       ─> 反量化 d(·) ─> 乘以 s ─> 多条样本路径 = 预测分布
```

图中：

- 训练流程：序列经均值缩放、量化为 token（末尾加 EOS），语言模型预测下一个 token 的分布，与真实 token 做交叉熵。
- 推理流程：历史序列缩放（缩放因子 $s$）并量化，语言模型自回归采样多条轨迹，再反量化并乘以 $s$，得到多条样本路径，即预测分布。

### 缩放

对每条序列，用历史上下文里绝对值的均值做缩放（仿射变换 $\tilde x_i=(x_i-m)/s$ 的特例，取 $m=0$）：

$$\tilde x_i=\frac{x_i}{s},\qquad s=\frac1C\sum_{i=1}^{C}\lvert x_i\rvert$$


其中：$x_i$ 是第 $i$ 个观测；$s$ 是上下文窗口内绝对值的均值，作为缩放因子；$C$ 是上下文长度；$\tilde x_i$ 是缩放后的值；缩放保留 0 值，并使不同量级的序列处于相近范围。

论文选均值缩放的理由有二：它在实际使用的深度预测模型（如 DeepAR）里行之有效；它**保留 0 值**，而 0 常有语义（0 销量、夜间光伏发电为 0）。论文指出标准化、min-max 等其他缩放也可用，只需很小改动。

### 量化

选 $B$ 个箱中心 $c_1<\dots<c_B$，以及 $B-1$ 个边界 $b_i$（$c_i<b_i<c_{i+1}$），量化函数 $q$ 与反量化函数 $d$ 为

$$q(x)=\begin{cases}1 & -\infty\le x<b_1\\ 2 & b_1\le x<b_2\\ \vdots & \\ B & b_{B-1}\le x<\infty\end{cases}\qquad d(j)=c_j$$


其中：$q(x)$ 把缩放后的实数 $x$ 映射到 token 编号；$b_i$ 是第 $i$ 个箱边界；$B$ 是箱个数；$d(j)=c_j$ 把 token 反量化为第 $j$ 个箱中心；箱边界之间的值被归入同一 token。

分箱方式有两类：**分位数分箱**（数据相关，使每个箱里的训练点数大致相同）和**均匀分箱**（箱中心在 $[c_1,c_B]$ 内等距，边界取中点 $b_i=(c_i+c_{i+1})/2$）。论文选**均匀分箱**，理由是未见过的下游数据的取值分布可能与训练分布差别很大。

具体设置：

- 箱中心覆盖 $[c_1,c_B]=[-15,+15]$（缩放后的值域）；
- 词表 $\mathcal V_{ts}$ 大小 4096，**包含**两个特殊 token PAD 和 EOS；论文在局限性一节写"$B=4094$"，与此一致；
- PAD 用于把不同长度的序列补齐到固定长度（便于组 batch）以及替换缺失值；EOS 附在量化并补齐后的序列末尾。论文说明 EOS 对时序并非必需，只是让主流语言模型库用起来更方便；
- 除了把词表大小调整为 $\lvert\mathcal V_{ts}\rvert$（截断或扩展输入、输出 embedding 层），**不改语言模型结构**；
- 不使用时间和频率特征（如星期几、第几周），"时间序列"被当作纯 token 序列。

**自拟示意（非论文数字，已手算）**：历史上下文 $[2,4,0,6]$ 的 $s=(2+4+0+6)/4=3$，缩放后为 $[2/3,\,4/3,\,0,\,2]$。若取 $c_1=-15$、$c_B=15$、$B=4094$ 的均匀箱，则相邻箱中心间距为 $30/(B-1)=30/4093\approx0.00733$（缩放空间）；还原到原值空间，间距为 $s\times0.00733\approx0.022$。也就是说，这条序列里相差远小于 0.022 的两个观测可能被量化成同一个 token。这正是论文"精度损失"现象（见局限）的来源。

**[解读]（自拟推算，假设箱中心严格等距且含两端点）**：此时 4094 个中心关于 0 对称、没有恰好等于 0 的中心；0 恰落在中间两个中心 $\pm0.00366$ 的边界上，按 $q$ 的定义（$b_i\le x$ 归入下一箱）反量化后约为 $+0.0037\,s$。也就是说"保留 0 值"在量化后只是近似保留，误差为半个 bin 宽度（缩放空间约 0.0037）。

### 模型

论文主要使用 **T5**（编码器-解码器）四个规格：Mini(20M)、Small(46M)、Base(200M)、Large(710M)；另用 GPT-2 base（90M，仅解码器）验证框架可直接用于 decoder-only 模型。论文脚注说明这些参数量与 T5 原版不同，是因为词表大小变了。T5 的编码器读入上下文 token，解码器逐 token 预测未来。

## 训练目标

输出是 $\mathcal V_{ts}$ 上的类别分布 $p_\theta(z_{C+h+1}\mid z_{1:C+h})$，损失为分类交叉熵，对单条已 token 化的序列（含 EOS）：

$$\ell(\theta)=-\sum_{h=1}^{H+1}\sum_{i=1}^{\lvert\mathcal V_{ts}\rvert}\mathbf 1_{(z_{C+h+1}=i)}\log p_\theta(z_{C+h+1}=i\mid z_{1:C+h})$$


其中：$\ell(\theta)$ 是单条序列的损失；$C$ 是上下文长度，$H$ 是预测长度（多一个 EOS，故求和到 $H+1$）；$z$ 是量化后的 token；$\mathcal V_{ts}$ 是词表；$\mathbf 1_{(z_{C+h+1}=i)}$ 是指示函数；$p_\theta$ 是模型预测的 token 分布；这是标准的分类交叉熵。

求和上界为 $H+1$ 是因为多了 EOS；实际训练时对 batch 取平均。

论文对这个目标有几点说明：

- 它**不是距离感知**的：不会显式地认为 bin $i$ 离 bin $i+1$ 比离 bin $i+2$ 更近，模型需要从数据里自己学出相邻 bin 的关系。因此 Chronos 做的是"通过分类做回归"（regression via classification）；
- 优点一：不用改语言模型的架构和训练目标，可直接使用语言模型库；
- 优点二：对输出分布的形状没有限制，能学到任意分布，包括多峰分布。这对跨领域预训练的模型尤其有用（论文观点）；
- 论文也承认把输出当作有序变量处理可能更合适，并把"引入序关系"（如对邻近 bin 做 label smoothing 一类的方法）列为未来工作，没有实验。

**[解读]** 与 DeepAR 这类用高斯、Student-t 等**参数化连续分布**，或 TFT 这类**分位数回归**的概率预测相比，Chronos 的输出是一个 4000 多类的非参数 categorical 分布，不需要预先假设分布族，代价是丢掉了数值的度量结构和分辨率上限（由 bin 宽度决定）。

## 推理：采样得到概率预测

Chronos 天然是概率模型：对 $h=1,\dots,H$ 依次从 $p_\theta(z_{C+h+1}\mid z_{1:C+h})$ 自回归采样，重复多次得到多条样本路径；每条路径的 token 用 $d$ 映射回实数，再乘以 $s$ 还原。预测分位数就从样本中统计。

论文评测时的做法：对需要采样的方法用 **20 条**样本路径估计分位数；点预测取中位数（0.5 分位）。**[解读]** 因为 token 是逐步自回归生成的，推理成本随预测长度和样本数线性增加，而且点预测也要聚合多条样本，论文在讨论中也指出这一点。

## 数据：TSMixup 与 KernelSynth

公开时序数据在数量和质量上远逊于 NLP 语料，论文因此提出两种增强数据多样性的方法。

### TSMixup

把图像分类里的 Mixup 推广到**多于两条**的时间序列。先随机取 $k\sim\mathcal U\{1,K\}$ 条长度为 $l\sim\mathcal U\{l_{min},l_{max}\}$ 的序列（来自随机选的训练数据集），各自**先均值缩放**（使小值序列和大值序列在混合里同等重要），再做凸组合：

$$\tilde x^{\text{TSMixup}}_{1:l}=\sum_{i=1}^{k}\lambda_i\,\tilde x^{(i)}_{1:l}$$


其中：$\tilde x^{(i)}_{1:l}$ 是第 $i$ 条经均值缩放的序列；$\lambda_i$ 是第 $i$ 条的混合权重（非负且和为 1）；$k$ 是参与混合的序列条数；$l$ 是序列长度；该式是多条序列的凸组合。

权重 $[\lambda_1,\dots,\lambda_k]$ 来自对称 Dirichlet 分布 $\mathrm{Dir}(\alpha)$。附录 Algorithm 1 的取值为：$K=3$，$\alpha=1.5$，$l_{min}=128$，$l_{max}=2048$。由于 $k=1$ 时就是原序列，原始序列会以 $1/3$ 的概率保留在增强集中（论文原话）。

### KernelSynth

受 Automatic Statistician（在 GP 核空间里做组合搜索来解释时间序列）启发，**把这个过程反过来**：随机组合 GP 核来生成新序列。

1. 核库 $\mathcal K$ 含 6 类基础核：常数、白噪声、线性（趋势）、RBF（平滑局部变化）、有理二次、周期（季节性）；其超参取离散集合，例如周期核的周期 $p$ 取自 $\{24,48,96,168,336,672,7,14,30,60,365,730,4,26,52,6,12,40,10\}$（对应各种典型采样频率）；
2. 采样核的个数 $j\sim\mathcal U\{1,J\}$（$J=5$），从 $\mathcal K$ 中有放回地取 $j$ 个核；
3. 依次用随机二元运算 $+$ 或 $\times$ 把它们组合成 $\tilde\kappa$；
4. 从 GP 先验 $\mathcal{GP}(0,\tilde\kappa)$ 采样长度 $l_{syn}=1024$ 的序列。

```
算法 (KernelSynth, 论文 Algorithm 2 大意)
  j ~ U{1, J};  取 j 个核 κ_1..κ_j ~ K
  κ* = κ_1
  for i = 2..j:  ⋆ ~ {+, ×};  κ* = κ* ⋆ κ_i
  return  x_{1:l_syn} ~ GP(0, κ*)
```

## 训练配置

项 | 取值
-- | --
模型 | T5 Mini 20M / Small 46M / Base 200M / Large 710M；GPT-2 base 90M
训练数据 | 28 个数据集，约 890K 条单变量序列、约 84B 个观测（token）
增强与合成 | 10M 条 TSMixup 增强序列（$K=3$）+ 1M 条 KernelSynth 序列，训练时按 9:1 采样
序列切分 | 从序列中随机切窗口，缩放并量化；上下文 512（T5 默认），预测长度 64
批大小 | 有效 batch 256 条序列
优化 | 200K 步，AdamW，weight decay 0.01，学习率从 0.001 线性退火到 0
硬件 | AWS EC2，8 张 A100 40GB

表中：「项」是训练配置项，右列是对应取值。

## 实验与结论

### 数据集与评测协议

论文共汇集 55 个公开数据集（含 Monash 时序预测库、M 系列竞赛、Kaggle 公开数据等），分三类：

数据子集 | 数据集数 | 序列数 | 用途
-- | -- | -- | --
仅预训练 | 13 | 795,936 | 预训练
Benchmark I | 15 | 97,272 | 预训练 + 域内（in-domain）评测
Benchmark II | 27 | 190,674 | 仅零样本（zero-shot）评测

表中：「数据子集」是数据集分组，「数据集数」「序列数」是规模，「用途」是其在训练与评测中的角色。结论：Benchmark I 既用于预训练也做域内评测，Benchmark II 只用于零样本评测。

其中 Benchmark I 与仅预训练的数据集合计 28 个用于训练。评测时用每条序列最后 $H$ 个点做留出测试集，$H$ 因任务而异（任务 = 数据集 + 预测长度）。

指标：

- **WQL**（加权分位数损失，近似 CRPS）：在 9 个分位 $\{0.1,\dots,0.9\}$ 上评估；
- **MASE**：用 0.5 分位（中位数）作点预测；
- 聚合：每个数据集上先除以 **Seasonal Naive** 的得分，再对所有数据集取**几何平均**，得到 Agg. Relative WQL / MASE（越低越好，Seasonal Naive 为 1.000）。几何平均对基准选择不敏感；运行失败的模型在该数据集上按相对得分 1 处理；各任务等权。

基线分三组：本地模型（Naive、Seasonal Naive、AutoETS、AutoARIMA、AutoTheta、SCUM）、任务专用模型（DeepAR、TFT、PatchTST、DLinear、WaveNet、N-BEATS、N-HiTS、GPT4TS）、其他预训练模型（Lag-Llama、Moirai-1.0-R；Benchmark II 另有 LLMTime 与 ForecastPFN）。

### Benchmark I（域内）

下表数字取自论文 Figure 4（逐项对照渲染图）。Chronos 与任务专用模型（GPT4TS 除外）的结果为 3 个随机种子平均。

模型 | Agg. 相对 WQL | Agg. 相对 MASE
-- | -- | --
Chronos-T5 (Large) | 0.564 | 0.695
Chronos-T5 (Base) | 0.580 | 0.706
Chronos-T5 (Small) | 0.603 | 0.727
Chronos-T5 (Mini) | 0.598 | 0.732
Chronos-GPT2 | 0.623 | 0.741
PatchTST | 0.601 | 0.740
Moirai-1.0-R (Large) | 0.670 | 0.806
Seasonal Naive | 1.000 | 1.000

表中：「模型」是对比方法，两列是 Benchmark I（域内）上的聚合相对 WQL 与 MASE（相对 Seasonal Naive 归一，越小越好）。结论：Chronos-T5 明显优于所有基线，最小的 Mini 也优于 Moirai-Large；注意这是域内结果。

论文的结论：Chronos-T5 Base 和 Large 在这个 benchmark 上明显优于所有基线；最小的 Chronos-T5 Mini（20M）也优于最好的 Moirai-1.0-R（Large，311M），尽管后者训练语料大得多。注意：这是**域内**结果，Benchmark I 的数据在 Chronos 的训练语料里；对 Moirai 和 Lag-Llama，论文注明训练语料不同，部分数据集未见过或测试集被其训练见过，因此那一列只能作参考。

### Benchmark II（零样本）

下表数字取自论文 Figure 5（逐项对照渲染图）。

模型 | Agg. 相对 WQL | Agg. 相对 MASE
-- | -- | --
TFT（任务专用） | 0.639 | 0.847
Chronos-T5 (Large) | 0.645 | 0.823
Chronos-T5 (Base) | 0.662 | 0.832
Chronos-T5 (Small) | 0.667 | 0.841
PatchTST（任务专用） | 0.684 | 0.810
Moirai-1.0-R (Base) | 0.696 | 0.907
Seasonal Naive | 1.000 | 1.000

表中：「模型」是对比方法，两列是 Benchmark II（零样本）上的聚合相对 WQL 与 MASE（相对 Seasonal Naive，越小越好）。结论：Chronos 在零样本下与最好的任务专用模型相当，优于其他预训练模型。

论文的结论：Chronos 明显优于本地统计模型；WQL 上 Chronos 占据第 2 到第 4 名，优于大多数在这些任务上训练过的专用模型；MASE 上 Chronos-T5 (Large) 排第 2，超过包括 SCUM 集成在内的多数基线；明显优于 Moirai-1.0-R、Lag-Llama、LLMTime、ForecastPFN，甚至优于对每个数据集微调 GPT-2 的 GPT4TS。论文同时说明：Moirai 在 Benchmark II 上的预训练语料覆盖了不少数据集，评测设置可能对它有利。总体论文表述为"与最好的任务专用深度模型相当"。

### 微调

论文做了一个初步的微调实验：对 Chronos-T5 (Small) 在 Benchmark II 的各数据集上微调（与数据集无关的统一配方：初始学习率 0.001，线性退火到 0，共 1000 步），微调后的模型在 Benchmark II 上取得第一，超过了更大的零样本 Chronos 和最好的任务专用模型。论文称这只是初步探索。

### 设计选择的消融（均以 Chronos-T5 Small 为主）

- **模型大小**：训练损失和下游性能都随规模变好，论文推测更大模型可能更好，但未探索更大规模（推理慢）；
- **初始化**：用 C4 上预训练的 T5 权重初始化，相比随机初始化没有收益，甚至略差；论文结论是语言模型权重对时序预测并不特别，随机初始化可能更优；
- **TSMixup**：域内性能与不用增强相近，但零样本性能提升；
- **合成数据比例**：加入 KernelSynth 数据对域内和零样本都有帮助，约 10% 的比例最稳定；继续增加反而变差；仅用合成数据训练的模型表现不如含真实数据的，但明显优于同样只用合成数据训练的 ForecastPFN；
- **训练步数**：1M 步的实验里，性能持续随训练步数变好；
- **上下文长度**：在 4 个取值里，上下文增加到 1024 以内有改善，再长则趋于饱和或变差；论文提醒评测集里高频数据（$\ge$15 分钟）不够多，不能下定论；
- **词表大小**：MASE 随词表变大略有改善；WQL 先改善后变差。论文的解释（假说）：MASE 与训练损失一样对尺度不变，更相关；WQL 对尺度敏感，与训练损失关系较弱。论文还提出词表大小的权衡：太小则离散化误差大，太大则每个 bin 里数据点太少，易产生泛化误差。

### 定性分析

论文用合成序列检查 Chronos-T5 (Base)：对高斯噪声给出合理预测，80% 区间与真值分布的 80% 区间吻合；线性趋势预测准确，指数趋势不准（论文认为训练数据里指数趋势较少，建议先做对数缩放）；上下文太短时会低估趋势；季节性序列预测精确；趋势与季节性的加性、乘性组合也准确。在 AR(1) 到 AR(4) 过程上，简单的 AR(1)、AR(2) 对"正确阶数的 AR 模型"和 AutoARIMA 更容易，MSE 更好；到 AR(3)、AR(4) 时，Chronos-T5 (Base) 优于 AutoARIMA，与阶数正确的拟合 AR 模型相当。预测分布的 KDE 图显示，尽管交叉熵不感知距离，模型仍学会在相邻 token 上放置概率质量，并能产生多峰分布。

## 局限

**论文自述：**

- **溢出与精度损失**：token 表示 $[-15s,15s]$ 内的值，$s$ 是序列的平均绝对值。当序列稀疏（$s$ 很小而存在大尖峰）时，尖峰会超出可表示范围；当 $s$ 相对序列方差很大时（例如大均值叠加小波动），相邻 token 在原空间间距为 $30s/(B-1)$，更接近的值会被映射到同一 token，精度受损。论文给出的推理时启发式办法是对这类序列换用别的归一化（如标准化），并把无需启发式的更好 tokenization 留给未来；
- **强趋势**：预测范围被限制在 $[c_1,c_B]$，理论上难以建模强趋势序列；
- **推理速度**：大模型推理比任务专用模型慢，论文称与某些统计本地模型相当，但还不至于慢到不可用；
- **仅单变量、等间隔序列**：协变量、多变量、不规则采样序列留作未来工作，论文建议的方向是任务专用 adaptor 或与 LightGBM 等做 stacking 集成；
- 只用 4 种规格，且论文没有探索更大模型；评测里的高频数据偏少。

**论文之外**：Chronos-2 被认为是面向多变量与协变量的后续工作，它不在本文论文的范围内，这里只提名字 [待核实]。

**[经验]**：

- 由于每条样本都要自回归解码，长预测步长下的延迟和显存开销要预估；
- 均匀分箱 + 均值缩放对"大均值小波动"类序列很敏感，使用前最好检查 $s$ 与波动幅度之比。

## 与相关方法对比

方法 | 如何用时序数据喂模型 | 是否从头预训练 | 概率输出
-- | -- | -- | --
Chronos | 缩放 + 量化为 token，语言模型原样使用 | 是（T5、GPT-2） | 类别分布采样
LLMTime | 把数字编码成数字字符串，零样本提示预训练 LLM | 否（GPT-3、Llama 2 等） | 采样
GPT4TS | 预训练 GPT-2 为骨干，patch 嵌入，按任务微调少量参数 | 否 | 点预测
Time-LLM | 将 patch 嵌入与文本原型对齐，冻结 LLM | 否 | 本文未列
Lag-Llama / Moirai | 实值输入，含滞后项、patching 与实值分布头等（论文对这类同期工作的概述） | 是 | 实值分布头

表中：「方法」是对比对象，「如何用时序数据喂模型」说明输入表示，「是否从头预训练」说明是否从头训练，「概率输出」说明输出形式。结论：Chronos 以缩放加量化把时序变成 token，直接复用语言模型，输出类别分布。

（以上描述依据本论文第 2 节对相关工作的介绍。）**[解读]** 与 [DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR) 相比，两者都用自回归采样给出概率预测，但 DeepAR 逐数据集训练、输出参数化分布；Chronos 预训练一次、输出 categorical 分布。关于 Chronos 在基础模型谱系中的位置，参见 [Foundation 综述](/0608_ML_Tasks_TimeSeries_Foundation)，评测指标参见 [Metrics 综述](/0610_ML_Tasks_TimeSeries_Metrics)。

## 使用方式

论文说明代码和预训练模型发布在 github.com/amazon-science/chronos-forecasting，评测所用数据集发布在 Hugging Face 的 autogluon/chronos_datasets。下面是**示意代码，未运行验证**，接口名称依据对该仓库的印象，请以官方文档为准 [待核实]：

```python
# 示意代码，未运行验证
import torch
from chronos import ChronosPipeline

pipeline = ChronosPipeline.from_pretrained("amazon/chronos-t5-small")  # 模型名 [待核实]
context = torch.tensor(history)                 # 一维历史序列
samples = pipeline.predict(context, prediction_length=24, num_samples=20)
low, median, high = torch.quantile(samples[0], torch.tensor([0.1, 0.5, 0.9]), dim=0)
```

## Reference

- Ansari et al., *Chronos: Learning the Language of Time Series*, TMLR 2024, [arXiv:2403.07815](https://arxiv.org/abs/2403.07815)
- 官方代码与预训练模型：[amazon-science/chronos-forecasting](https://github.com/amazon-science/chronos-forecasting)
- 评测数据集：[autogluon/chronos_datasets](https://huggingface.co/datasets/autogluon/chronos_datasets)


