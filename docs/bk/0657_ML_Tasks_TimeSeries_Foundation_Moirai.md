-----

| Title     | ML Tasks TimeSeries Foundation Moirai                 |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-19T02:42:22Z`                                |
| Updated @ | `2026-11-19T02:42:22Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/657) |

-----

# Moirai

Moirai（Masked EncOder-based UnIveRsAl TIme Series Forecasting
Transformer）出自 Salesforce AI Research（部分作者同时隶属新加坡管理大学）的论文 *Unified
Training of Universal Time Series Forecasting Transformers*（Gerald
Woo、Chenghao Liu、Akshat Kumar、Caiming Xiong、Silvio Savarese、Doyen
Sahoo，arXiv:2402.02592，论文首页标注发表于 ICML 2024 的 PMLR
235）。它要做的是**通用预测（universal
forecasting）**：在大规模开放数据集 LOTSA
上预训练一个模型，之后不针对目标数据集训练，直接零样本（zero-shot）预测不同频率、不同变量数、不同分布的时间序列。

一句话概括：**Moirai = 把多变量展平成一条序列的 patch 掩码编码器 Transformer + 多 patch 尺寸投影层 +
Any-variate Attention + 混合分布输出头，在 LOTSA（超过 27B 观测）上统一训练。**

论文摘要给出了代码、数据与模型权重的位置：`https://github.com/SalesforceAIResearch/uni2ts`。

## 解决什么问题

传统深度预测是
"one-model-per-dataset"：每个数据集单独训练一个固定上下文长度、固定预测长度的模型。论文类比视觉与语言中的大模型预训练，希望有一个模型"能处理任何预测问题"。但时间序列不像图像和文本有统一格式，高度异构。论文把难点归为三条（外加数据）：

| 难点                   | 论文的说法                                                                 | Moirai 的对策                   |
| -------------------- | --------------------------------------------------------------------- | ---------------------------- |
| 跨频率（cross-frequency） | 采样频率决定序列模式；跨频率联合学习有负迁移（negative interference），已有工作常常每个频率一个模型          | 多 patch 尺寸的输入/输出投影层          |
| 任意变量数                | 多变量序列维度不同，且同一位置的变量在不同数据集语义不同；逐变量独立建模可回避但无法利用变量间交互与外生协变量               | 展平变量 + Any-variate Attention |
| 分布差异                 | 不同数据集支撑集和分布性质不同，例如对恒正序列用 Normal / Student-t 这类对称分布并不合适；预先指定单一简单分布不够灵活 | 混合分布输出头                      |
| 数据规模                 | 已有时序数据集规模不足以支撑这类模型                                                    | 构建 LOTSA                     |

## 问题形式化

论文把数据集写成 $\\mathcal D={(\\boldsymbol Y^{(i)},\\boldsymbol
Z^{(i)})}*{i=1}^{N}$，其中 $\\boldsymbol Y^{(i)}\\in\\mathbb
R^{d*{y\_i}\\times T\_i}$ 是 $d\_{y\_i}$ 个变量、$T\_i$
个时间步的目标序列，$\\boldsymbol Z^{(i)}\\in\\mathbb
R^{d\_{z\_i}\\times T\_i}$ 是协变量。目标是用模型 $f\_{\\boldsymbol\\theta}$ 由回看窗口
$\\boldsymbol Y\_{t-l:t}$ 与协变量 $\\boldsymbol Z\_{t-l:t+h}$ 预测分布参数
$\\hat{\\boldsymbol\\phi}$，最大化预测窗口的对数似然：

$$\\max\_{\\boldsymbol\\theta}\\ \\mathbb E\_{\\substack{(\\mathbf
Y,\\mathbf Z)\\sim p(\\mathcal D)\\ (t,l,h)\\sim p(\\mathcal
T\\mid\\mathcal D)}}\\ \\log p(\\mathbf
Y\_{t:t+h}\\mid\\hat{\\boldsymbol\\phi}),\\qquad \\text{s.t. }\\
\\hat{\\boldsymbol\\phi}=f\_{\\boldsymbol\\theta}(\\mathbf
Y\_{t-l:t},\\mathbf Z\_{t-l:t+h})$$

要点是：期望里除了"采哪条序列" $p(\\mathcal D)$，还有"采哪个任务" $p(\\mathcal T\\mid\\mathcal
D)$，也就是上下文长度 $l$ 与预测长度 $h$ 都是**随机的**，这是它能在下游灵活使用不同长度的原因。

## 整体结构

``` 
 每个变量切成不重叠 patch -> 所有变量的 patch 首尾相接，展平成一条序列
 [v0: p0 p1 [mask]] [v1: p0 p1 [mask]] [v2(协变量): p0 p1 p2]
          |  按 patch 尺寸选择输入线性层（multi patch size input projection）
          v
   patch embedding  + (time id, variate id)
          |
   Transformer encoder（全自注意力，Any-variate Attention）
          |  按 patch 尺寸选择输出线性层（multi patch size output projection）
          v
   [mask] 位置的输出 -> 混合分布参数 -> 负对数似然 / 采样
```

对应论文 Figure 2（3 个变量，变量 0、1 是预测目标，变量 2 是预测期内数值已知的动态协变量；patch 大小 64，每个变量切成
3 个 token，预测区间对应的 patch 被替换为可学习的 `[mask]` embedding）。

主要结构选择（论文 3.1 节）：

  - 不重叠 patch，掩码编码器（masked encoder），encoder-only Transformer；
  - 对输入/输出做（不可学习的）instance normalization；
  - 采用近年 LLM 的改进：pre-normalization、LayerNorm 换成 RMSNorm、query-key
    normalization、FFN 的非线性换成 SwiGLU（隐层维度调整到与原 FFN 参数量相同）、所有层去掉 bias。

### 多 patch 尺寸投影层

已有 patch 模型只有一个 patch 大小超参。Moirai 的想法：

  - 高频数据用**大** patch：在同样的上下文长度下减少 token 数，降低注意力的二次计算开销；
  - 低频数据用**小** patch：把更多计算从简单的线性嵌入层转移到 Transformer 层。

实现上就是学习多组输入、输出线性层，每组对应一个 patch 尺寸；频率到 patch 尺寸的对应关系是**预先手工设定**的（论文附录
B.1）：

| 频率                | 可选 patch 尺寸 |
| ----------------- | ----------- |
| Yearly, Quarterly | 8           |
| Monthly           | 8, 16, 32   |
| Weekly, Daily     | 16, 32      |
| Hourly            | 32, 64      |
| Minute-level      | 32, 64, 128 |
| Second-level      | 64, 128     |

每个 patch 尺寸只学一套投影权重，在频率有重叠时共享，因此总共是 **5 个输入投影层和 5 个输出投影层**（尺寸
8、16、32、64、128）。输入层把 patch 映射到隐状态，输出层把隐状态映射为分布参数。

### Any-variate Attention

做法是把多变量序列"展平"：所有变量的 patch 排成一条序列，之后注意力同时作用在时间轴和变量轴上。这带来一个新需求：模型要能区分
token
属于哪个变量，并满足（论文的表述）对变量顺序的置换**等变（equivariance）**、对变量下标的置换**不变（invariance）**；常规的正弦或可学习位置/变量嵌入做不到，也无法处理任意数量的变量。

论文的方案是 RoPE 编码时间，二值注意力偏置（binary attention bias）编码变量。省略层与头的下标和缩放因子后，第
$(i,m)$ 个 query（$i$ 为时间下标、$m$ 为变量下标）与第 $(j,n)$ 个 key 的注意力得分为

$$E\_{ij,mn}=(\\boldsymbol W^{Q}\\boldsymbol
x\_{i,m})^{\\top}\\boldsymbol R\_{i-j},(\\boldsymbol W^{K}\\boldsymbol
x\_{j,n})+u^{(1)}\\cdot\\mathbb 1\_{{m=n}}+u^{(2)}\\cdot\\mathbb
1\_{{m\\neq n}}$$

$$A\_{ij,mn}=\\frac{\\exp{E\_{ij,mn}}}{\\sum\_{k,o}\\exp{E\_{ik,mo}}}$$

其中 $\\boldsymbol R\_{i-j}\\in\\mathbb R^{d\_h\\times d\_h}$
是旋转矩阵（RoPE），$u^{(1)},u^{(2)}\\in\\mathbb R$
是**每层每个头**各自的可学习标量，$\\mathbb 1\_{{\\mathrm{cond}}}$
在条件成立时取 1，否则取 0。

`[解读]` 偏置项只依赖"两个 token
是否属于同一个变量"，不依赖变量的具体编号，所以重新给变量编号不会改变注意力得分，这就是置换性质的来源；而且没有任何固定长度的变量嵌入表，因此变量数可以任意。一个自拟的小例子（示意）：3
个变量、每个变量 3 个 patch，展平后序列长 $3\\times3=9$，同变量 token 对加偏置 $u^{(1)}$，不同变量
token 对加 $u^{(2)}$；若把变量 0 与变量 1 互换，9 个 token 之间的得分矩阵只是行列做对应置换。

### 混合分布输出头

输出是 $c$ 个分量的混合分布：

$$p(\\mathbf
Y\_{t:t+h}\\mid\\hat{\\boldsymbol\\phi})=\\sum\_{i=1}^{c}w\_i,p\_i(\\mathbf
Y\_{t:t+h}\\mid\\hat{\\boldsymbol\\phi}\_i),\\qquad
\\hat{\\boldsymbol\\phi}={w\_1,\\hat{\\boldsymbol\\phi}\_1,\\dots,w\_c,\\hat{\\boldsymbol\\phi}\_c}$$

混合权重经 softmax 约束在概率单纯形上。论文提出的四个分量（附录 B.2）：

| 分量                     | 用途（论文说法）        | 参数与约束                                                                  |
| ---------------------- | --------------- | ---------------------------------------------------------------------- |
| Student's t            | 对一般时间序列稳健       | 预测自由度 $\\nu$、位置 $\\mu$、尺度 $\\tau$，softplus 保证正，且 $\\nu$ 下界取 2（否则方差无定义） |
| 负二项（negative binomial） | 正的计数数据          | 预测 $r\>0$（softplus）与 $p\\in\[0,1\]$（sigmoid）；实现的是连续扩展                  |
| 对数正态（log-normal）       | 经济、自然现象中常见的右偏数据 | 预测 $\\mu$、$\\sigma\>0$（softplus）                                       |
| 低方差正态                  | 高置信度预测          | 只预测 $\\mu$，固定 $\\sigma=10^{-3}$                                        |

Student's t 的密度为

$$p(x;\\nu,\\mu,\\tau)=\\frac{\\Gamma\!\\left(\\frac{\\nu+1}{2}\\right)}{\\Gamma\!\\left(\\frac{\\nu}{2}\\right)\\sqrt{\\pi\\nu\\tau}}\\left(1+\\frac1\\nu\\Big(\\frac{x-\\mu}{\\tau}\\Big)^{2}\\right)^{-(\\nu+1)/2}$$

论文还强调：直接优化灵活分布的负对数似然，与直接优化目标指标相比有竞争力（引 Awasthi et al.,
2022），因此预训练后可以用任何指标评估。

## 数据：LOTSA

LOTSA（Large-scale Open Time Series Archive）把公开数据源整合进统一的 Arrow 存储格式，共
**27,646,462,733** 个观测、**九个领域**。论文称此前常用的 Monash 与 GluonTS 数据合计约 1B 观测。

| 领域         | 数据集数 | 观测数            | 占比     |
| ---------- | ---- | -------------- | ------ |
| Energy     | 30   | 16,358,600,896 | 59.17% |
| Transport  | 23   | 4,900,453,419  | 17.73% |
| Climate    | 6    | 4,188,011,890  | 15.15% |
| CloudOps   | 3    | 1,518,268,292  | 5.49%  |
| Web        | 3    | 428,082,373    | 1.55%  |
| Sales      | 6    | 197,984,339    | 0.72%  |
| Nature     | 5    | 28,547,647     | 0.09%  |
| Econ/Fin   | 23   | 24,919,596     | 0.10%  |
| Healthcare | 6    | 1,594,281      | 0.01%  |

按频率看，（Multi）Hourly 占 71.893%，（Multi）Minute-level 占 25.370%，Daily 占
2.565%，其余频率各不到 0.1%（论文 Table 3）。可见数据在领域与频率上都很不均衡，这是下面要做重采样的原因。

## 训练

### 数据分布与任务分布

  - **子数据集采样**：先采一个子数据集，再在其中按观测数比例采序列。为避免大数据集淹没小数据集，把每个子数据集的采样权重上限设为
    $\\epsilon=0.001$ 后再归一化：

$$\\omega\_k=\\min\!\\Big(\\frac{\\lvert\\boldsymbol
D\_k\\rvert}{\\sum\_{i=1}^{K}\\lvert\\boldsymbol D\_i\\rvert},\\
\\epsilon\\Big),\\qquad p(\\boldsymbol
D\_k)=\\frac{\\omega\_k}{\\sum\_{i=1}^{K}\\omega\_i},\\qquad
\\lvert\\boldsymbol D\_k\\rvert=\\sum\_{i\\in\\boldsymbol D\_k}T\_i$$

  - **任务分布**：对每条序列，均匀采一个窗口，窗口长度从范围内均匀采样（每个变量最短 2，总序列长度最长
    512）；再把窗口切成回看与预测两段，预测长度占窗口的比例在
    $\[0.15,0.5\]$ 内均匀采样。
  - **变量数增广**：对多变量序列在变量维度上均匀子采样；对单变量子数据集则随机拼接成多变量序列。变量数从 beta-binomial
    分布（$n=128,a=2,b=5$）采样，最多 128 个变量，均值约 37。

`[解读]` 自拟核对：beta-binomial 的均值为
$n\\cdot\\frac{a}{a+b}=128\\times\\frac27\\approx36.6$，与论文"均值约 37"一致。

### 模型与优化

| 型号           | 层数 | $d\_{\\mathrm{model}}$ | $d\_{\\mathrm{ff}}$ | 头数 | $d\_{\\mathrm{kv}}$ | 参数量  |
| ------------ | -- | ---------------------- | ------------------- | -- | ------------------- | ---- |
| Moirai-Small | 6  | 384                    | 1536                | 6  | 64                  | 14m  |
| Moirai-Base  | 12 | 768                    | 3072                | 12 | 64                  | 91m  |
| Moirai-Large | 24 | 1024                   | 4096                | 16 | 64                  | 311m |

  - 小模型训练 100,000 步，Base 与 Large 训练 1,000,000 步，batch size 256；
  - AdamW，学习率 $10^{-3}$，weight decay $10^{-1}$，$\\beta\_1=0.9,\\
    \\beta\_2=0.98$；前 10,000 步线性 warmup，之后余弦退火；
  - NVIDIA A100-40G，TF32 精度；
  - **序列打包（sequence packing）**：展平变量后序列长度差异很大，不打包时 padding 占输入 token 的
    61.08%，打包后仅 0.38%（1000 次迭代统计）。

## 推理

  - 一次前向即可输出整个预测窗口（预测区间的 patch 都是 `[mask]`），不需要自回归逐段生成；论文在计算成本分析中以此对比
    decoder-only 模型与 RNN。
  - 点预测：取预测分布样本的**中位数**（长序列预测实验）；概率预测则用分位数评估。
  - 上下文长度与 patch 尺寸在推理时选择：论文在验证集上调这两项（概率预测实验中上下文长度取
    ${1000,2000,3000,4000,5000}$，patch 尺寸按频率）。
  - 协变量按展平方式作为额外的"变量"输入（Figure 2 的变量 2）。

## 实验与结论

### 样本内：Monash

论文把 Monash 归档作为 LOTSA
的一部分，大部分数据集只放训练集、留出测试集用于样本内（in-distribution）评估。设置：上下文长度
1000，除 quarterly 用 patch 8 外统一用 patch 32。指标为按 naive 预测 MAE
归一化后、跨数据集取几何平均的 normalized MAE（Figure
3）。论文结论：**无论模型大小，Moirai 都优于 Monash
基准的所有基线**（这些基线通常是每个数据集或每条序列单独训练）。

### 零样本：概率预测

六个数据集（能源、交通、气候、销售），滚动评估，步长等于预测长度；评估数据集不在 LOTSA 中。指标 CRPS（越低越好，以 9 个分位数
$0.1,\\dots,0.9$ 的加权分位数损失均值近似）。基线 PatchTST、TiDE、DeepAR 使用 Student's t
头，TFT 用分位数预测，都在验证集 CRPS 上调参，结果为 5 个随机种子平均；Moirai 的上下文长度与 patch
尺寸在验证集 CRPS 上选。下表为论文 Table 5 的 CRPS（Moirai 三列为零样本，其余为
full-shot 或简单基线；基线的 $\\pm$ 标准差省略）：

| 数据集              | Moirai-S | Moirai-B | Moirai-L | PatchTST | TiDE  | TFT   | DeepAR | AutoARIMA | Seasonal Naive |
| ---------------- | -------- | -------- | -------- | -------- | ----- | ----- | ------ | --------- | -------------- |
| Electricity      | 0.072    | 0.055    | 0.050    | 0.052    | 0.048 | 0.050 | 0.065  | 0.327     | 0.070          |
| Solar            | 0.471    | 0.419    | 0.406    | 0.518    | 0.420 | 0.446 | 0.431  | 1.055     | 0.512          |
| Walmart          | 0.103    | 0.093    | 0.098    | 0.082    | 0.077 | 0.087 | 0.121  | 0.124     | 0.151          |
| Weather          | 0.049    | 0.041    | 0.051    | 0.059    | 0.054 | 0.043 | 0.132  | 0.252     | 0.068          |
| Istanbul Traffic | 0.173    | 0.116    | 0.112    | 0.112    | 0.110 | 0.110 | 0.108  | 0.589     | 0.257          |
| Turkey Power     | 0.048    | 0.040    | 0.036    | 0.054    | 0.046 | 0.039 | 0.066  | 0.116     | 0.085          |

论文的文字结论：Base 与 Large 在除 Walmart 与 Istanbul Traffic
外的所有数据集上取得最优或次优，即使在这两个数据集上也接近最优。

### 零样本：长序列预测

在长序列预测基准的子集上评估（去掉与 LOTSA 有同源数据的数据集，所以只剩 ETT 与 Weather、Electricity），预测长度
${96,192,336,720}$ 取平均，full-shot 基线结果取自 iTransformer 论文。下表为 MSE（节选基线，论文
Table 6）：

| 数据集         | Moirai-S | Moirai-B | Moirai-L | iTransformer | TimesNet | PatchTST | DLinear |
| ----------- | -------- | -------- | -------- | ------------ | -------- | -------- | ------- |
| ETTh1       | 0.400    | 0.434    | 0.510    | 0.454        | 0.458    | 0.469    | 0.456   |
| ETTh2       | 0.341    | 0.345    | 0.354    | 0.383        | 0.414    | 0.387    | 0.559   |
| ETTm1       | 0.448    | 0.381    | 0.390    | 0.407        | 0.400    | 0.387    | 0.403   |
| ETTm2       | 0.300    | 0.272    | 0.276    | 0.288        | 0.291    | 0.281    | 0.350   |
| Electricity | 0.233    | 0.188    | 0.188    | 0.178        | 0.193    | 0.216    | 0.212   |
| Weather     | 0.242    | 0.238    | 0.259    | 0.258        | 0.259    | 0.259    | 0.265   |

论文的评语：Base 在各数据集上取得最优或次优；Large 不够稳定，略弱但仍有竞争力；性能与模型规模的关系在该设置下"微弱"，但这不构成反对
scaling 的强证据，因为训练数据量与设置固定，需要更系统的 scaling law 研究。

### 消融（Monash，Moirai-Small，normalized MAE，越低越好）

| 变体                                             | normalized MAE |
| ---------------------------------------------- | -------------- |
| Moirai-Small（完整）                               | 0.655          |
| 去掉 patch 尺寸约束（任意频率可用任意 patch）                  | 0.720          |
| 去掉多 patch 尺寸（固定 patch 为 32）                    | 1.156          |
| 去掉 Any-variate Attention（改用可学习加性嵌入，训练时随机化变量下标） | 0.904          |
| 去掉混合分布（改为 Student's t）                         | 0.740          |
| 去掉 LOTSA（只用 GluonTS 与 Monash 训练）               | 0.809          |
| 去掉 packing                                     | 0.785          |

论文的解读：每个组件都有贡献；数据多样性在样本内评估上也关键；packing 在相同算力下提升约 16%。Figure 4 展示：对
Traffic Hourly 的峰值，Student's t 的预测区间是对称的，不适合峰值，混合分布则更合适。

### 其他分析

  - 上下文长度：在零样本设置下，ETTm1、Electricity、Weather 的验证 MAE 随上下文变长而持续下降（论文
    Figure 5），论文称这是传统 Transformer 预测器通常不具备的性质，且能处理上千个时间步。
  - 计算成本（附录 D.4）：论文称在相同模型规模下推理成本与其他深度模型相近；Moirai 即使上下文与预测长度达 5000，也在 1
    秒内出结果（patch 32，batch size 32）。

## 局限与展望

论文自述（Limitations & Future Work）：

  - 受资源限制几乎没有做超参数调优（可用 $\\mu$P 等）；
  - 用多 patch 尺寸处理跨频率"有点启发式"，希望未来有更灵活优雅的方案；
  - 当前架构对高维时间序列支持有限，可用扩展 Transformer 输入长度的高效方法缓解；
  - LOTSA 在领域与频率的多样性上还可增强；
  - 加入表格、文本等多模态输入是新方向；掩码编码器结构也便于探索 latent diffusion 架构。

`[经验]` 补充几点读论文时的体会（非论文结论）：频率到 patch 尺寸是手工映射，用户给错频率可能影响效果；展平后序列长度是"时间
patch 数 × 变量数"，变量很多时注意力开销上升，与论文"高维支持有限"的自述一致；只有 Monash
的实验是样本内，其余是零样本，不能混为一谈。

## 与相邻方法对比

| 对比点            | Moirai                              | 相邻方法（论文 Table 1 与相关工作的说法）                                                                                               |
| -------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 任意变量数（零样本）     | 支持                                  | 论文 Table 1 中只有 Moirai 与 TimeGPT-1 打勾（后者闭源）；ForecastPFN、Lag-Llama、TimesFM、TTM、LLMTime 均为叉                                |
| 概率预测           | 混合分布，含正支撑的分量                        | Lag-Llama 用 Student's t（论文称对称、不灵活）；TimeGPT-1 用 conformal prediction 构造区间；LLMTime 用类别分布；其余（ForecastPFN、TimesFM、TTM）只做点预测 |
| 架构             | 掩码编码器，一次前向出整个预测窗口                   | TimesFM 是 patch-based decoder-only，用更大的输出 patch 加速解码；Lag-Llama 用 LLaMA 结构加滞后特征；TTM 是轻量 mixer 结构                         |
| 预训练数据          | LOTSA（\>27B，开源）                     | TimeGPT-1 数据未知（表中标 Unknown (100B)，闭源）；ForecastPFN 为合成数据；TimesFM 用 Wiki 与 Trends 等（\>100B）；Lag-Llama、TTM 用 Monash（\<1B）  |
| 与 PatchTST 的关系 | 同样基于 patch，但不假设变量独立，且 patch 尺寸随频率变化 | PatchTST 逐变量独立（channel independent）、单一 patch 尺寸；论文长序列实验中还让 Moirai 在低维数据集上选择通道独立或通道混合策略                                  |

与 [DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR)
的相同点是都预测分布参数并最大化似然；不同点是
Moirai 一次性输出整个预测窗口，不自回归，且不需要针对数据集训练。基础模型这一类的整体对比见
[时序基础模型](/0608_ML_Tasks_TimeSeries_Foundation)。

## 使用方式

论文说代码、数据、权重和训练库 uni2ts 都开源。下面是示意代码，只为说明调用思路，**接口和模型名来自记忆，未对照官方文档，未运行验证
`[待核实]`**：

``` python
# 示意代码，未运行验证；接口名称 [待核实]
from uni2ts.model.moirai import MoiraiForecast, MoiraiModule

model = MoiraiForecast(
    module=MoiraiModule.from_pretrained("Salesforce/moirai-1.0-R-small"),
    prediction_length=24,
    context_length=1000,   # 论文概率预测实验在 1000~5000 中按验证集选择
    patch_size="auto",     # 或按频率指定 8/16/32/64/128
    num_samples=100,
    target_dim=1,
    feat_dynamic_real_dim=0,
    past_feat_dynamic_real_dim=0,
)
# 得到的预测是样本；点预测取中位数，区间取分位数
```

实践上要决定的事：上下文长度（越长通常越好，见 Figure 5）、patch
尺寸（按频率表选）、是否把协变量作为动态协变量输入、点预测用样本中位数。

## 后续工作

论文之外的内容：综述提到 Moirai 的后续工作，名字有 Moirai-MoE、Moirai 2.0，具体内容与发表信息本文未核对
`[待核实]`，详见 [时序基础模型](/0608_ML_Tasks_TimeSeries_Foundation) 的 Moirai
系列小节。

## Reference

  - Woo G., Liu C., Kumar A., Xiong C., Savarese S., Sahoo D. *Unified
    Training of Universal Time Series Forecasting Transformers*.
    arXiv:2402.02592, ICML 2024 (PMLR 235).
    <https://arxiv.org/abs/2402.02592>
  - 官方代码、数据与模型权重（论文摘要给出）：<https://github.com/SalesforceAIResearch/uni2ts>
