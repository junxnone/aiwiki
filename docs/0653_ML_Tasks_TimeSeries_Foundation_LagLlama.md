---
Title | ML Tasks TimeSeries Foundation LagLlama
-- | --
Created @ | `2026-11-19T02:42:14Z`
Updated @| `2026-11-19T06:17:45Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/653)

---
# Lag-Llama

Lag-Llama 是面向**单变量概率时间序列预测**的基础模型（论文 *Lag-Llama: Towards Foundation Models for Probabilistic Time Series Forecasting*，Kashif Rasul、Arjun Ashok 等，arXiv 2310.08278；两位为共同一作；论文首页标注为 Preprint，正式发表信息 [待核实]；作者单位含 Morgan Stanley、ServiceNow Research、Mila、Université de Montréal、McGill University）。

一句话概括：把每个时间步的**滞后值（lags）+ 日期时间特征**拼成一个 token，送入 LLaMA 风格的 decoder-only Transformer，每步输出 Student's t 分布的参数；先在多领域语料上预训练，再零样本或少量微调地用于未见过的数据集。

它的定位有两层：一是"概率预测"（输出分布，用采样得到区间，评价用 CRPS）；二是"基础模型"（一个模型跨数据集、跨频率、跨预测长度使用）。论文称其目标是让模型尽量简单；结构上没有 patch、分解或专门的时序注意力，主要靠滞后特征、协变量和大规模预训练 [解读]。

## 解决什么问题

- **数据集专用模型**：论文指出以往绝大多数预测方法都是在同一数据集上训练并测试，换一个数据集要重训。
- **预训练语料频率混杂**：不同序列的采样频率不同，下游还可能遇到没见过的频率或频率的新组合。论文希望有一种**不直接依赖具体频率**的 tokenization 方式。
- **数值量级差异大**：不同数据集（如电力负荷与汇率）数值量级差别很大，需要在同一个模型里统一处理。
- **不确定性**：决策场景需要的是分布而不是点预测，因此输出头是参数化分布。

## 核心思想与结构

### 问题设定

考虑 $D$ 条单变量序列，要预测未来 $P$ 步。给定过去与协变量 $c$，建模未来的联合分布；实际训练时从完整序列里截取长度为 $C$ 的 context 窗口，并用概率链式法则做自回归分解：

$$p_\phi(x^i_{C+1:C+P}\mid x^i_{1:C},\,c^i_{1:C+P})=\prod_{t=C+1}^{C+P}p_\phi(x^i_t\mid x^i_{1:t-1},\,c^i_{1:t-1})$$

其中 $\phi$ 是分布参数，由神经网络输出。

### Tokenization：滞后特征（lag features）

给定排序的正整数滞后索引集合 $\mathcal L=\{1,\dots,L\}$（$L$ 为最后一个，即最大的滞后索引），滞后算子把 $x_t$ 映射为向量 $\mathbf k_t\in\mathbb R^{|\mathcal L|}$，第 $j$ 个分量为：

$$\mathbf k_t[j]=x_{t-\mathcal L[j]}$$

在这些滞后值之外，再加上由时间戳 $t$ 构造的日期时间特征，覆盖语料中所有频率：second-of-minute、minute-of-hour、hour-of-day 等，直到 quarter-of-year。设共有 $F$ 个日期时间特征，则论文称每个 token 的大小是 $|\mathcal L|+F$；Figure 2 的说明里 token 的协变量还包括 summary statistics（见"数值缩放"）。

要点：

- 滞后索引集合 $\mathcal L$ **覆盖季度、月、周、日、小时、秒级频率**（论文原话）。论文正文没有给出具体的索引列表，只在 Figure 1 里用"一个示例集合"示意 [待核实：官方实现里的具体 lags_seq]。
- **与频率的关系**：模型并不被告知频率。论文的说法是：对任意一条序列，除一个日期时间特征外，其余日期时间特征在相邻时间步之间保持不变，因此模型可以**隐式地推断出序列的频率**。这样遇到新频率或已见频率的组合时，理论上不需要改 tokenization。
- **代价**：构造滞后特征需要至少 $L$ 个额外的历史点。若 context 窗口为 $x_{1:C}$，则需要采样 $x_{-L:C}$；论文预训练时每个窗口的长度是 $L+C$。因此推理时输入序列至少要有 $L$ 个点。

示意图（Figure 1 的文字版）：

```
时间轴:  ... x_{t-L} ... x_{t-7} ... x_{t-2} x_{t-1} | x_t
token_t = [ x_{t-L[1]}, x_{t-L[2]}, ..., x_{t-L[|L|]},   <- |L| 个滞后值
            sec(t), min(t), hour(t), ..., month(t), qtr(t),   <- F 个日期时间特征
            mu, sigma ]                                     <- summary statistics
```

**自拟小例子**（示意，非论文数据）：取 $\mathcal L=\{1,2,3,7\}$，序列 $x_1,\dots,x_{10}=10,12,11,13,15,14,16,18,17,19$。在 $t=10$ 处，滞后向量为 $(x_9,x_8,x_7,x_3)=(17,18,16,11)$。最大滞后 7 意味着第一个能构造完整滞后向量的时间点是 $t=8$。

### 模型结构

Lag-Llama 基于 decoder-only 的 LLaMA 结构：

1. 长度为 $C$ 的 token 序列（每个 token 由上面的滞后值与协变量拼接而成）经**共享的线性投影层**映射到注意力模块的隐层维度；
2. 经过 $M$ 层带因果掩码（causally masked）的 Transformer decoder layer；每层沿用 LLaMA 的 **RMSNorm 预归一化**，并在 query 和 key 上使用 **RoPE** 旋转位置编码；
3. 最后接**分布头**，输出**下一个时间步**的分布参数 $\phi$；训练目标是所有被预测时间步的**负对数似然**之和最小。

```
x_{-L:C} + 协变量
   -> 构造 C 个 token（滞后值 + 日期时间特征 + mu/sigma）
   -> 线性投影
   -> [ 因果 decoder layer (RMSNorm, RoPE) ] x M
   -> 分布头 -> Student's t 参数 (自由度, 均值, 尺度)
   -> 负对数似然
```

论文最终模型（超参搜索结果，Table 5）：8 层、9 个 head、每个 head 的 embedding 维度 16、context 长度 $C=32$，总参数量 2,449,299（约 245 万）。注意 Table 5 脚注：$C$ 只是每个窗口里被连续采样的 context 长度，实际由于使用滞后特征，窗口要大得多。

### 分布头

论文实验采用 **Student's t 分布**，输出三个参数：**自由度、均值、尺度**，并加合适的非线性保证应为正的参数为正。论文也提到归一化流（normalizing flows）和 copula 是更有表达力的备选头，但认为它们训练和优化更困难，而本工作的目标是"尽量简单"，把这些留给未来工作。

### 数值缩放（Value Scaling）

预训练语料中的序列量级各异，所以对每个窗口做缩放，并把窗口统计量作为额外输入：

- 论文先介绍沿用的 scaling heuristic：对每个窗口求均值 $\mu^i=\sum_{t=1}^{C}x^i_t/C$ 和方差 $\sigma^i$，把序列替换为 $\{(x^i_t-\mu^i)/\sigma^i\}_{t=1}^{C}$；
- 同时把 $\mu^i$ 与 $\sigma^i$ 作为**与时间无关的实值协变量**加到每个 token 上（论文称为 summary statistics），让模型知道输入的统计量；
- 计算似然时数值用均值/方差变换后的值，采样时每个时间步再用同一组统计量**反标准化**；
- 实践中论文发现，预训练时下面的 **Robust Standardization** 比标准 scaler 更好：减去中位数、除以 IQR，对离群点稳健。

$$x'_t=\frac{x_t-\mathrm{Med}(x_{1:C})}{\mathrm{IQR}(x_{1:C})},\qquad \mathrm{IQR}(x_{1:C})=\mathrm{Med}\big(\{x_{C/2:C}\}\big)-\mathrm{Med}\big(\{x_{1:C/2}\}\big)$$

注意论文这里的 IQR 是**用后半窗口的中位数减去前半窗口的中位数**（即论文式 (4) 的写法），并非常见的 75% 分位减 25% 分位。

**自拟小例子**（示意）：窗口 $C=4$，$x=(10,12,11,13)$。$\mathrm{Med}(x_{1:4})=11.5$；后半 $\{x_2,x_3,x_4\}=\{12,11,13\}$ 的中位数为 12；前半 $\{x_1,x_2\}=\{10,12\}$ 的中位数为 11；故 $\mathrm{IQR}=12-11=1$，标准化后为 $(-1.5,\,0.5,\,-0.5,\,1.5)$。

论文没有提到 RevIN；缩放用的是按窗口计算的固定统计量，并把统计量作为协变量输入 [解读]。

## 训练与推理

### 预训练语料

论文汇集了 **27 个**时间序列数据集，来自能源、交通、经济、自然、空气质量、云运维 **6 个语义领域**。每个领域留出少数数据集作为"未见"测试集，另外还留了完全不同领域的数据集（Exchange Rate，经济领域，频率为论文所说的"新的未见频率"）检验是否能泛化到差异大的数据。其中：

- 预训练用 **20 个**数据集，共 **7,965 条**单变量序列，约 **3.52 亿**个数据窗口（论文称 tokens，即窗口大小为 1 的总数）；
- 下游"未见"数据集 **7 个**。

预训练数据集（按论文 Table 3 的领域分组）：

领域 | 预训练数据集
-- | --
交通 | Traffic（旧金山湾区）、Uber TLC Hourly
能源 | Australian Electricity Demand、Electricity Hourly、London Smart Meters、Solar、Wind Farms、ETT H1、ETT H2、ETT M1
自然 | KDD Cup 2018、Sunspot
空气质量 | Beijing Multisite、Air Quality UCI
云运维 | Huawei 云的 6 个分钟级数据集（论文 Table 3 按数据集列出）：CPU Limit、CPU Usage、Function Delay、Instances、Memory Limit、Memory Usage

下游未见数据集：Weather、Pedestrian Counts、ETT-M2、Platform Delay（云）、Requests（云）、Beijing-PM2.5、Exchange Rate。

附录 A 中多数数据集引用的来源是 Godahewa et al. (2021)，即 Monash 时间序列预测库；论文作者之一在贡献说明里提到把 Monash 数据集加入 Hugging Face datasets。论文在讨论中还指出，这类最大的时序数据仓库本身对基础模型来说也太小，收集大规模开放时序语料是未来重要方向。

### 训练策略

- **分层采样**：随机采样窗口时，按各数据集的序列总数加权；
- **时间序列增强**：使用 Freq-Mix 和 Freq-Mask（Chen et al., 2023），论文称可减轻过拟合，增强超参作为超参搜索的一部分；
- **超参搜索**：随机搜索 100 组配置，用预训练语料上的平均验证损失选模型；最优值：8 层、9 head、每 head 维度 16、$C=32$、增强概率 0.5、频率遮蔽率 0.5、频率混合率 0.25、weight decay 0、dropout 0（Table 5 中带星号者）；
- **预训练设置**：batch size 256，学习率 $10^{-4}$，每个 epoch 为 100 个随机采样的窗口（窗口长度 $L+C$），以训练集各数据集平均验证损失、**50 个 epoch** 的耐心做 early stopping；
- **微调**：同样的 batch size 与学习率，每个 epoch 从目标数据集随机采样 100 个窗口（窗口长度 $L+(C+P)$，$P$ 为该数据集预测长度），以目标数据集的验证损失、50 epoch 耐心早停。由于是 decoder-only，预测长度不固定，模型可用于任意下游预测长度；
- 算力：论文称所有模型都在单张 12GB 的 Nvidia Tesla-P100 GPU（4 个 CPU 核、24GB 内存）上训练。

### 推理

给定长度至少为 $L$ 的序列，构造特征向量，得到下一个时间点的分布；再**自回归地**从分布中采样并把采样值接回输入，得到多条模拟轨迹，直到预测长度 $P$。由这些经验样本可计算不确定性区间及评价指标。论文评估时用 **100 条样本**，报告 CRPS（在预测范围和数据集内所有序列上取平均），并用**平均排名**衡量一个方法作为"通用预测器"的表现；所有结果都是在测试集划分的**最后一个预测窗口**上得到的。

## 实验与结论

### 基线

- 通过 AutoGluon：AutoARIMA、AutoETS、CrostonSBA、DynOptTheta、NPTS 五个统计模型，以及 DeepAR、PatchTST、TFT；
- 其余：N-BEATS、Informer、Autoformer、ETSformer、OneFitsAll（GPT-2 微调输入输出层）；
- 所有方法均按单变量设置，每条序列独立预测；后五个原为点预测的模型，论文加了分布头和与 Lag-Llama 类似的特征（如数值缩放）使其能做概率预测。

### 零样本与微调（Table 1，CRPS，越低越好）

下表摘录论文 Table 1（取均值，省略 ±标准差；数字已对照渲染页核对）。

模型 | Weather | Ped-counts | ETT-M2 | Platform-delay | Requests | Beijing-PM2.5 | Exchange | 平均排名
-- | -- | -- | -- | -- | -- | -- | -- | --
DeepAR | 0.148 | 0.239 | 0.068 | 0.068 | 0.045 | 0.154 | 0.012 | 5.714
PatchTST | 0.178 | 0.254 | 0.035 | 0.094 | 0.024 | 0.145 | 0.011 | 5.643
N-BEATS | 0.134 | 0.267 | 0.031 | 0.112 | 0.021 | 0.081 | 0.024 | 5.071
TFT | 0.151 | 0.268 | 0.030 | 0.099 | 0.015 | 0.156 | 0.008 | 5.000
Lag-Llama 零样本 | 0.164 | 0.285 | 0.063 | 0.091 | 0.090 | 0.130 | 0.011 | 6.714
Lag-Llama 微调 | 0.132 | 0.227 | 0.017 | 0.096 | 0.012 | 0.125 | 0.009 | 2.786

论文的结论：

- **零样本**：与各监督基线"相当"，平均排名 6.714；在 platform-delay 和 weather 上尤其接近基线。
- **微调后**：在 ETT-M2、Weather、Requests 三个数据集上取得最低误差（论文称 state-of-the-art），平均排名 **2.786**，比最好的监督基线（TFT，5.000）高约 2 名；论文据此称"在不了解数据的前提下，Lag-Llama 是最佳选择"。
- **Exchange Rate**（全新领域和新频率）：零样本表现可比，微调后接近 SOTA。
- 相比 Informer、Autoformer、ETSformer 这类使用复杂归纳偏置的 Transformer，Lag-Llama 在零样本与微调下平均排名都更好；论文据此推测"规模足够大时，vanilla decoder-only Transformer 优于其它 Transformer 结构"，并说是时序里首次指出这一点。这个结论是论文的推测，论文自己也说要进一步研究。
- 相比 OneFitsAll（改造预训练 LLM），Lag-Llama 在所有数据集上显著更好，仅 Beijing-PM2.5 上相近；论文认为这体现了"从头在时序语料上训练基础模型"相对"适配预训练 LLM"的潜力，但同时指出两者优劣的系统比较留作未来工作。

### 少样本适配（Table 2）

只保留训练集最后 K% 历史（K=20/40/60/80），监督基线在这部分数据上从头训练，Lag-Llama 微调。论文报告的平均排名（DeepAR / PatchTST / TFT / Lag-Llama）：

可用历史 | DeepAR | PatchTST | TFT | Lag-Llama
-- | -- | -- | -- | --
20% | 3.429 | 2.714 | 2.000 | 1.857
40% | 3.071 | 2.929 | 2.500 | 1.500
60% | 3.071 | 2.929 | 2.429 | 1.571
80% | 3.429 | 2.714 | 2.429 | 1.429

Lag-Llama 在各比例下平均排名都是最好；论文称随可用历史增加，Lag-Llama 的优势扩大。Exchange-rate 上 Lag-Llama 多数时候不及 TFT，论文解释为该数据集与预训练语料最不相似，需要更多历史才能适配。

### 预训练数据集上的表现（附录 C）

论文也在 20 个预训练数据集上评测：Lag-Llama 不是每个数据集的最佳（其训练预算分摊给所有数据集，而监督基线只训一个数据集），平均排名 4.625，论文称其处于平均排名靠前的模型之列（Table 9 中 TFT 3.875、N-BEATS 4.600、Lag-Llama 4.625、PatchTST 4.700、DeepAR 5.125，即 Lag-Llama 排第三）。

### 数据多样性与 scaling 观察

- **多样性**：用 catch22 特征对每个预训练数据集求平均后做 PCA，取前 2 个主成分作图；论文发现领域内、领域间有多个数据集时，特征空间的多样性增加，并据此假设"多领域混合预训练有利于零样本和少样本泛化"（假设基于 Brown et al., 2020，论文并没有对照实验直接验证这一点）。
- **Scaling law**：论文用 Caballero et al. (2023) 的 broken neural scaling law 形式拟合验证损失（负对数似然）随预训练 epoch 数 $x$ 的变化（每个 epoch 100 个窗口，对 3 个种子取平均，60/20/20 划分拟合与外推）：

$$y=a+\big(b\,x^{-c_0}\big)\prod_{i=1}^{n}\Big(1+\big(x/d_i\big)^{1/f_i}\Big)^{-c_i f_i}$$

拟合参数（$n=1$）：$a=-6.1167$，$b=8.01589$，$c_0=0.0155$，$c_1=-0.1043$，$d_1=1.6423\times10^{-36}$，$f_1=-36.4660$。验证损失随 epoch 数下降，曲线可外推预测更大数据量下的损失。论文称这是拟合"性能随预训练数据量"的 scaling law，横轴实际是已见的预训练 epoch 数，更像训练曲线的外推而非改变数据集规模的对照实验 [解读]；论文没有探索更大的模型尺寸，并把进一步放大模型列为未来方向。

## 优缺点与局限

论文自述：

- 仅限**单变量**；多变量动态建模是未来方向；
- 分布头是简单的参数化 Student's t，更强的头（flow、copula）留待未来；
- 滞后特征要求至少 $L$ 个历史点，且需要比 context 更长的窗口；
- 只探索了较小的模型尺寸，需要更大规模、更多开放数据；
- 在与预训练分布差异大的数据（如 Exchange Rate）上需要更多历史才能适配好。

[经验]：

- 2.4M 参数的模型很小，推理成本低，微调很容易在单卡完成；
- 评测只在每个数据集的最后一个预测窗口、7 个未见数据集上进行，平均排名对样本数量较敏感，单次结果不宜过度解读。

## 与相关方法对比

方面 | DeepAR | Lag-Llama
-- | -- | --
骨干 | RNN（LSTM）自回归 | LLaMA 风格 decoder-only Transformer
输入 | 滞后值 + 时间特征 + 静态特征 | 滞后值 + 日期时间特征 + 窗口统计量（$\mu,\sigma$）
输出分布 | 依数据选 Gaussian、负二项等 | Student's t（自由度、均值、尺度）
缩放 | 窗口内均值缩放 | 窗口统计量标准化，预训练用 median/IQR 稳健标准化，并把统计量作输入
训练方式 | 在目标数据集上训练 | 多领域大语料预训练，再零样本/微调
目标 | 单个数据集内的多序列联合训练 | 跨数据集、跨频率的基础模型

下表 DeepAR 一列依据本站 DeepAR 文章与 DeepAR 论文的常见设定 [经验]，Lag-Llama 一列依据其论文。

联系：二者都是**自回归的概率预测**模型，都用**滞后值作为输入、每步输出分布参数、负对数似然训练、采样得到预测区间**，都依赖按序列的数值缩放来处理量级差异。区别主要是骨干网络（RNN vs. Transformer）和使用范式（数据集专用 vs. 预训练 + 迁移）。DeepAR 的细节见 [DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR)。[解读] Lag-Llama 可以看作"把 DeepAR 的滞后特征 + 分布头思路换到 Transformer 骨干，并放大到跨数据集预训练"。

与其它基础模型：Lag-Llama 的特点是以滞后特征而不是 patch 做 token，且是概率输出的单变量模型；总览见 [时间序列基础模型](/0608_ML_Tasks_TimeSeries_Foundation) 和 [时间序列总览](/0603_ML_Tasks_TimeSeries)。

## 使用方式

下面是**示意代码，未运行验证**。论文在贡献部分提到代码集成到 Hugging Face 并合并相关改动到 GluonTS，但官方仓库名与权重发布位置本文 [待核实]。

```python
# 示意代码，未运行验证；接口名称以官方仓库为准
# 1. 准备 GluonTS 格式的单变量数据集 (需要至少 max_lag + context_length 个历史点)
# 2. 零样本: 加载预训练权重，对 prediction_length 做自回归采样（论文评测用 100 条样本）
# 3. 微调: 在目标数据集上用同样的 batch size / lr 继续训练，按验证 NLL 早停
# 4. 输出: forecasts 的样本 -> 分位数 / CRPS
```

## Reference

- Kashif Rasul, Arjun Ashok, et al. *Lag-Llama: Towards Foundation Models for Probabilistic Time Series Forecasting*. [arXiv:2310.08278](https://arxiv.org/abs/2310.08278)

