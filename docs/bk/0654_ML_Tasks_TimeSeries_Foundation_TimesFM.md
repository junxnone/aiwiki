-----

| Title     | ML Tasks TimeSeries Foundation TimesFM                |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-19T02:42:16Z`                                |
| Updated @ | `2026-11-20T08:20:59Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/654) |

-----

# TimesFM

TimesFM（Time-series Foundation Model）出自 Google Research（Abhimanyu
Das、Weihao Kong、Rajat Sen、Yichen Zhou）的论文 *A decoder-only foundation
model for time-series forecasting*（arXiv:2310.10688）。一句话概括：把时间序列切成
patch，用只含解码器（decoder-only）的因果 Transformer，在约 O(100B) 时间点的真实 +
合成数据上预训练，得到**一个**可直接做零样本（zero-shot）预测的单一模型；其特别设计是**输出
patch 比输入 patch 更长**，以减少自回归步数。

论文摘要的说法是：该模型在多个公开数据集上的开箱即用零样本精度，"接近"每个数据集上各自训练的最先进监督模型。它属于"从头在时序数据上预训练"的路线，与"复用
/ 微调 LLM"的路线不同（见 [基础模型综述](/0608_ML_Tasks_TimeSeries_Foundation)；总览见
[时间序列总览](/0603_ML_Tasks_TimeSeries)）。

## 要解决的问题

论文提出的问题是：像 NLP 里的大语言模型那样，在海量时序数据上预训练，能否在**从未见过的数据集**上直接做出好预测？论文指出的困难：

  - 时间序列没有明确的词表和语法；
  - 模型要支持不同的历史长度（context）、预测长度（horizon）和时间粒度；
  - 公开的大规模时序数据不像文本那样容易获得。

任务形式化为学习一个通用映射（预训练时不能使用数据集特有的动态或静态协变量，因此只做单变量输入）：

$$f:\\ (y\_{1:L})\\ \\longrightarrow\\ \\hat y\_{L+1:L+H}$$

其中：$y\_{1:L}$ 是长度为 $L$ 的历史（上下文）；$\\hat y\_{L+1:L+H}$ 是对未来 $H$ 步的预测；$f$
是通用预测映射，输入只含目标序列（单变量）。

论文还认为，用 GPT-3、LLaMA-2 这类 LLM
做开箱即用预测（llmtime）参数量大、成本高，而从头只在时序数据上训练的小得多的模型零样本效果更好。

## 核心设计

论文总结了四条设计原则：

1.  **Patching**：patch 类比语言模型的 token。好处是 token 数减少为原来的 $1/p$，推理更快；但
    patch 不能取得太长，否则会偏离 decoder-only 训练的高效性（见后文消融）。
2.  **Decoder-only**：给定一串输入 patch，模型被训练为"根据此前所有 patch 预测下一段"。与 PatchTST
    的关键区别就在这里；它可以像 LLM 一样在整个 context 窗口上并行训练，并自动适应看到不同数量 patch 的情形。
3.  **更长的输出 patch**：LLM 一次只生成一个 token，而长程预测里"一次直接预测整个
    horizon"通常比多步自回归更准；但零样本时 horizon
    事先未知，无法一次预测。TimesFM 的折中是让输出 patch 长于输入
    patch。
4.  **Patch masking**：若直接用 patch，模型可能只对 patch 长度整数倍的 context
    表现好，因此训练时对序列开头的一部分做 mask。

### 输入输出 patch 长度与自回归步数

论文给的例子（输入 patch 32，输出 patch 128）：训练时模型同时被训练为用前 32 个点预测接下来 128 个点，用前 64
个点预测第 65 到 192 个点，用前 96 个点预测第 97 到 224 个点，以此类推。推理时若给定长度 256
的序列并要求预测未来 256 步：先生成 257 到 384，再把已有输入加上刚生成的部分作为条件，生成
385 到 512，共 2 步；若输出 patch 与输入 patch 同为 32，则需要 8 步自回归。

把步数一般化写出来 \[解读\]：

$$\\text{steps}=\\lceil H/h\\rceil$$

其中：$\\text{steps}$ 是自回归步数；$H$ 是预测总长度；$h$ 是输出 patch
长度；$\\lceil\\cdot\\rceil$ 是向上取整；输出 patch 越长，需要的自回归步数越少。

其中 $h$ 为输出 patch 长度。例如（自拟示意，已重算）$H=256$，$h=128$ 时 $\\lceil
256/128\\rceil=2$；$h=32$ 时 $\\lceil 256/32\\rceil=8$，与论文例子一致。

代价（论文自述）：输出 patch 太长，则难以处理长度短于输出 patch 的序列，例如预训练数据里的月度、年度序列。

### 结构

下图概括 TimesFM 的数据流。

``` 
 原始序列 y_1 ... y_L  (按 p 个点切 patch，不重叠；不足整数倍时补零并把对应 mask 置 1)
   |  每个 patch：InputResidualBlock( patch * (1 - mask) )
   v
 token t_1 ... t_N  (+ 位置编码 PE_j，N = floor(L/p))
   |  num_layers 层 [ 多头因果自注意力 SA  ->  FFN ]
   v
 o_1 ... o_N
   |  OutputResidualBlock：每个 o_j -> 长度 h 的预测
   v
 y_hat[pj+1 : pj+h]      (j = 1..N，训练时全部位置并行计算损失)
```

图中：

  - 原始序列按 $p$ 个点切成 patch（不足整数倍时补零并把掩码置 1），每个 patch 经 InputResidualBlock
    并加位置编码，得到 token。
  - token 经若干层"多头因果自注意力 + FFN"得到输出 token，再经 OutputResidualBlock
    为每个位置预测后续 $h$ 个点。
  - 训练时所有位置的预测并行计算损失。

输入层（论文公式 (2)）：序列切成长度 $p$ 的 patch，第 $j$ 个 patch 为 $\\tilde
y\_j=y\_{p(j-1)+1:pj}$，掩码同样切成 $\\tilde m\_j$（1 表示该点被忽略）：

$$t\_j=\\text{InputResidualBlock}\\big(\\tilde y\_j\\odot(1-\\tilde
m\_j)\\big)+PE\_j$$

其中：$t\_j$ 是第 $j$ 个输入 token；$\\tilde y\_j$ 是第 $j$ 个 patch 的原始值，$\\tilde
m\_j$ 是对应掩码（1 表示忽略该点）；$\\odot$ 是逐元素乘，$(1-\\tilde m\_j)$
屏蔽被忽略的点；$\\text{InputResidualBlock}$ 是带跳连的 MLP；$PE\_j$
是位置编码。

其中 Residual Block 本质上是一个带一个隐层和跳连的 MLP（论文说类似其引用的 TiDE 中的定义）；$PE\_j$ 为原始
Transformer 的位置编码；token 数 $N=\\lfloor L/p\\rfloor$。

堆叠 Transformer（公式 (3)）：每层是标准多头自注意力加前馈网络（FFN），FFN 隐层维度等于
`model_dim`。使用**因果注意力**：每个输出 token 只能看到它之前（含对应位置）的输入 token。

$$o\_j=\\text{StackedTransformer}\\big((t\_1,\\dot
m\_1),\\dots,(t\_j,\\dot m\_j)\\big)$$

其中：$o\_j$ 是第 $j$ 个输出 token；$t\_1,\\dots,t\_j$ 是前 $j$ 个输入
token（因果注意力只看到这些）；$\\dot m\_j$ 是 token
级掩码；$\\text{StackedTransformer}$ 是多层因果自注意力加前馈网络。

其中 $\\dot m\_j=\\min{\\mathbf m\_{p(j-1)+1:pj}}$：只要 patch 内有一个未被 mask
的点，该 token 就不算被 mask；整个 patch 都被 mask 的 token 不会被因果自注意力关注。

输出层（公式 (4)）：另一个 Residual Block 把输出 token 映射为接下来 $h$ 个点的预测：

$$\\hat y\_{pj+1:pj+h}=\\text{OutputResidualBlock}(o\_j)$$

其中：$\\hat y\_{pj+1:pj+h}$ 是接下来 $h$ 个点的预测；$o\_j$ 是第 $j$ 个输出 token，编码了
$y\_{1:pj}$ 的信息；$p$ 是输入 patch 长度；$\\text{OutputResidualBlock}$ 是把输出
token 映射为 $h$ 维预测的残差 MLP。

即 $o\_j$ 编码了 $y\_{1:pj}$ 的全部信息，用它预测 $y\_{pj+1:pj+h}$。

模型规模（论文表 6）：

| 模型   | num\_layers | model\_dims | input\_patch\_len | output\_patch\_len | num\_heads | dropout |
| ---- | ----------- | ----------- | ----------------- | ------------------ | ---------- | ------- |
| 200M | 20          | 1280        | 32                | 128                | 16         | 0.2     |
| 70M  | 10          | 1024        | 32                | 128                | 16         | 0.2     |
| 17M  | 10          | 512         | 32                | 128                | 16         | 0.2     |

表中：「模型」是三种规模，其余列是层数、隐层维度、输入与输出 patch 长度、注意力头数与
dropout。三个模型仅在深度与宽度上不同，patch 设置相同。

主模型为 200M 参数；Residual Block 和 FFN 的隐层维度都等于 model\_dim；Transformer 层里保留
layer norm，Residual Block 里没有。

参数量粗算 \[解读\]：若每层按注意力 $4d^2$ 加 FFN（隐层维 $d$）$2d^2$ 估计，200M 模型约为
$6\\times1280^2\\times20=196{,}608{,}000$，与 200M 同量级（自拟估算，忽略 Residual
Block、嵌入等）。

## 预训练

### 数据

论文的数据主要来自三类：

  - **Google Trends**：约 22k 个热门查询，取小时、日、周、月粒度，小时级为 2018 年 1 月至 2019 年 12
    月，其余为 2007 年 1 月至 2021 年 12 月；总计约 0.5B 个时间点。
  - **Wiki Pageviews**：2012 年 1 月至 2023 年 11 月全部 Wikimedia
    页面的访问量，清洗并聚合到小时、日、周、月粒度，滤掉零值过多的序列；论文正文称约
    300B 个时间点（表 1 中四个粒度的行相加约为 374B，是本文自行求和 \[解读\]，两者口径可能不同）。
  - **合成数据**：300 万条、每条长 2048 个点（见下）。

另外加入其他公开数据：M4 全部粒度、小时和 15 分钟的 Electricity、小时 Traffic、10 分钟 Weather，以及
LibCity 的 15 分钟交通序列，表 1 中还列有 Favorita Sales（日）。

论文表 1 的部分行（序列数 / 时间点数）：

| 数据            | 粒度      | 序列数        | 时间点数            |
| ------------- | ------- | ---------- | --------------- |
| Synthetic     | \-      | 3,000,000  | 6,144,000,000   |
| Wiki hourly   | Hourly  | 5,608,693  | 239,110,787,496 |
| Wiki daily    | Daily   | 68,448,204 | 115,143,501,240 |
| Wiki weekly   | Weekly  | 66,579,850 | 16,414,251,948  |
| Wiki monthly  | Monthly | 63,151,306 | 3,789,760,907   |
| Trends hourly | Hourly  | 22,435     | 393,043,680     |
| M4 yearly     | Yearly  | 22,739     | 840,644         |

表中：「数据」是数据来源，「粒度」是采样频率，「序列数」「时间点数」是数据规模。结论：Wikipedia
访问量占预训练数据的绝大部分，合成数据约 61 亿个时间点。

### 合成数据怎么造

先造四种基础成分：分段线性趋势（段数在 2 到 8 之间随机）；ARMA(p, q)（$1\\le p,q\\le
8$，系数由多元高斯或均匀分布生成后归一化）；周期在 4 到"最大 context
长度的一半"之间随机的正弦和余弦波（含随机相位）。然后随机启用或关闭这四个成分，各生成长 2048
的序列，用均匀随机权重相加；趋势成分被选中时，有 50% 概率以乘性方式作用。

为什么需要合成数据（论文消融）：真实数据多为小时、日等常见粒度，而 Monash 里有季度、年度、10 分钟等相对稀缺的粒度；去掉合成数据后
Monash 变差，ETTh（小时，粒度充足）几乎没差别，ETTm（15 分钟）则明显更差。

### 数据混合与归一化

  - 训练加载器按 80% 真实 + 20% 合成采样；真实数据中，"小时及更细粒度"、日、周、月四组等权。
  - 最大 context 长度 512；周粒度序列不够长，用 256；月粒度用 64。
  - 只使用可逆实例归一化（RevIN）中的标准化部分，即用 context 中第一个输入 patch 的均值和标准差对整个 context
    缩放。

### Mask 采样

对每条序列，随机采样 $r\\in{0,\\dots,p-1}$，令 $m\_{1:r}=1$，其余为 0，即屏蔽第一个 patch 的前
$r$ 个点。论文举例：最大 context 512、$p=32$，若 $r=4$，则 $o\_1$ 看到的有效点数为
$28=32-4$，$o\_2$ 对应 $28+32$，依此类推；对所有 $r$ 重复，模型就见过 1 到 512 的所有 context
长度。

### 训练与算力

使用标准小批量梯度下降；损失为（公式 (5)）：

$$\\text{TrainLoss}=\\frac1N\\sum\_{j=1}^{N}\\text{MSE}\\big(\\hat
y\_{pj+1:pj+h},,y\_{pj+1:pj+h}\\big)$$

其中：$N$ 是输出 token 个数（即 patch 数）；$j$ 是 patch 序号；$\\hat y\_{pj+1:pj+h}$ 是第
$j$ 个位置预测的后续 $h$ 个点；$y\_{pj+1:pj+h}$ 是真实值；$\\text{MSE}$ 是均方误差；损失是各位置 MSE
的平均。

学习率为余弦衰减，峰值 $5\\times10^{-4}$。论文的缩放实验用全局 batch size 4096、训练到 1.5M
迭代；200M 模型在 16 核 TPUv5e 上 2 天跑完 1.5M 迭代。

论文只做**点预测**（MSE）。若要概率预测，论文说可对每个输出 patch 配多个分位数头（quantile
loss），或输出分布族参数做最大似然；但这被留作未来工作。

## 推理

推理时用自回归解码得到任意长度的预测：给定 $y\_{1:L}$（为简便设 $L$ 是 $p$ 的整数倍），先预测 $\\hat
y\_{L+1:L+h}$，把 $\[y\_{1:L};\\hat y\_{L+1:L+h}\]$ 拼起来作为新输入，再预测 $\\hat
y\_{L+h+1:L+2h}$，如此继续。若 $L$ 不是 $p$ 的倍数，则补零凑齐并把对应位置的 mask 置 1（原文写作 append
zeros，补在序列哪一端未明说；下文示意代码补在前端，是本文的选择 \[解读\]，因为训练时被 mask 的也是序列开头）。

注意本文所依据的论文版本（v4）里，架构只有上述 patch、Residual Block、因果
Transformer，论文的架构描述中未出现频率嵌入（frequency
embedding）等输入；预测头只有点预测头。

## 实验

论文在三组**训练时被刻意排除**的公开数据上做零样本评测（Informer 数据集合中有几个用于预训练，所以只用
ETTm1、ETTm2、ETTh1、ETTh2）。以下数字均来自论文表格，并对照渲染页核对过。

### Monash

Monash 档案共 30 个数据集；沿用 llmtime 的做法，滤掉含缺失值的，剩 18 个。指标为 mean
MAE，对每个数据集除以"naive 基线（重复最后一个值）"的 MAE 后跨数据集聚合；图 2a
用几何平均（GM），附录用算术平均（AM）。多数数据集的 context 取该数据集最大长度（上限
512）；少数数据集在"训练集最后一个 horizon 长度的窗口"上用 32、64
和最大长度试一遍，取验证指标最好的；论文列出最终使用的最大 context 长度为 cif
2016、tourism yearly、covid deaths、bitcoin 取 32，tourism monthly 原文同时写了 32
和 64。论文认为这是公平的，因为 Monash 的深度学习基线本来也对不同数据集用不同 context。

Scaled MAE（论文表 4，越低越好）：

| 模型                 | GM     | AM     |
| ------------------ | ------ | ------ |
| TimesFM（零样本）       | 0.6846 | 0.8005 |
| N-BEATS（监督）        | 0.7005 | 0.7844 |
| DeepAR（监督）         | 0.7477 | 1.1925 |
| llmtime（零样本，GPT-3） | 0.9715 | 1.0588 |
| Naive              | 1.0000 | 1.0000 |

表中：「模型」是对比方法，GM 与 AM 分别是 scaled MAE（相对 Naive 归一）的几何平均与算术平均（越小越好）。结论：GM
口径下 TimesFM 最好，AM 口径下 N-BEATS 略低，二者差距都很小。

论文结论：图 2a（GM）中 TimesFM 是第一，略好于 N-BEATS 但在统计显著性之内，并优于 DeepAR 等深度监督模型，相对
llmtime 改善超过 25%（由上表 GM 重算：$(0.9715-0.6846)/0.9715\\approx 29.5%$）。附录图
4（AM 口径）中 N-BEATS 最低（0.7844 对 0.8005），论文说 TimesFM
在其显著性范围内。可见排名对聚合方式敏感，两者差距都很小。

### Darts

8 个单变量数据集，基线包括 ARIMA、GP（SM-GP）、TCN、N-HiTS、N-BEATS 等监督方法，另有 PatchTST 和
llmtime（零样本）。Scaled MAE（论文表 3，GM）：

| 模型           | GM     |
| ------------ | ------ |
| llmtime（零样本） | 0.4882 |
| ARIMA        | 0.5219 |
| TimesFM（零样本） | 0.5767 |
| PatchTST     | 0.6458 |
| N-HiTS       | 0.6936 |
| N-BEATS      | 0.7316 |
| GP           | 0.7509 |
| TCN          | 0.7946 |

表中：「模型」是对比方法，「GM」是 Darts 八个数据集上 scaled MAE 的几何平均（越小越好）。结论：TimesFM
与最优方法在统计显著性内无法区分，数据集少、误差棒宽。

论文结论：TimesFM 与最优的 llmtime、季节 ARIMA 在统计显著性内无法区分；只有 8
条序列，误差棒很宽，无法给出清晰排序。论文还提醒：ARIMA
的季节性参数需要手工设定，且这些数据常被博客引用，llmtime 的数据污染"不能排除"。

### ETT（Informer 数据）

context 512，预测 horizon 96 和 192，4 个数据集共 8 个任务；按 llmtime
的做法只评测最后一个测试窗口（论文附录注明 llmtime 在 ETT 上因
GPT-3 停止访问改用 GPT-3.5-Turbo 生成预测）。MAE（论文表 5）：

| 数据集（horizon） | TimesFM（零样本） | PatchTST（监督） | llmtime（零样本） |
| ------------ | ------------ | ------------ | ------------ |
| ETTh1（96）    | 0.45         | 0.41         | 0.42         |
| ETTh1（192）   | 0.53         | 0.49         | 0.50         |
| ETTh2（96）    | 0.35         | 0.28         | 0.33         |
| ETTh2（192）   | 0.62         | 0.68         | 0.70         |
| ETTm1（96）    | 0.19         | 0.33         | 0.37         |
| ETTm1（192）   | 0.26         | 0.31         | 0.71         |
| ETTm2（96）    | 0.24         | 0.23         | 0.29         |
| ETTm2（192）   | 0.27         | 0.25         | 0.31         |
| 平均           | 0.36         | 0.37         | 0.45         |

表中：「数据集（horizon）」是评测设置，后三列是各方法的 MAE（越小越好），最后一行为平均。结论：TimesFM
平均最好，但逐项看并非处处最优，监督的 PatchTST 在统计显著性内与之相当。

另外，论文表 5 里 FEDformer、Autoformer、Informer 的平均 MAE 分别为
0.53、0.53、0.99。论文结论：TimesFM 平均最好，监督 PatchTST
在显著性内与之相当。注意：这是在最后一个窗口上的结果，逐项看 TimesFM 并非处处最优（如
ETTh1 的 96 上它不如 PatchTST）。另外表 5 还列了用同一数据加载器预训练的 PatchTST(ZS)，其平均 MAE 为
0.35，略低于 TimesFM 的 0.36，而图 2c 未画出它。

### 微调（附录 A.3）

协议同 GPT4TS：只用 10% 训练集，微调输入和输出两个 Residual Block。平均 MAE（论文表 2）：

| 数据集   | TimesFM（微调） | GPT4TS（微调） |
| ----- | ----------- | ---------- |
| ETTh1 | 0.426       | 0.525      |
| ETTh2 | 0.410       | 0.421      |
| ETTm1 | 0.388       | 0.441      |
| ETTm2 | 0.334       | 0.335      |

表中：「数据集」是 ETT 的四个子集，后两列是 10% 训练数据微调后的平均 MAE（越小越好）。结论：TimesFM 在
ETTh1、ETTh2、ETTm1 上优于 GPT4TS，ETTm2 上几乎持平。

论文称在 ETTh1、ETTh2、ETTm1 上分别比 GPT4TS 好 18%、3%、12%（由上表平均 MAE 重算约为
18.9%、2.6%、12.0%）；ETTm2 上两者几乎持平；并称其 10% 数据微调的结果与多数用全量训练集的基线相当或更好。

### 消融（论文自述结论）

  - **缩放**：训练 17M、70M、200M 三个模型到 1.5M 迭代，Monash 上的 scaled MAE（GM）随
    FLOPS（对数尺度）单调下降。
  - **输出 patch 长度**：在 ETT 上预测 512 步，输出 patch 从 8 增到 128，平均 MAE 单调下降。
  - **输入 patch 长度**：从 8 到 128，70M 模型在 Monash 上 $p=16$、32
    最好，两端误差更大；$p=32$ 训练速度约为 $p=16$ 的两倍，所以选 32。
  - **合成数据**：见上节。
  - **对比 PatchTST 预训练（附录 A.4）**：用同一数据加载器、同样 FLOPS 预训练 200M 的 PatchTST（记作
    PatchTST(ZS)）；Monash 上较差，论文归因于预训练主要是 512 长度的 context、同 FLOPS
    下迭代更少；ETT 上与 TimesFM 相近（表 5 中其平均 MAE 为 0.35，TimesFM 为
    0.36）。

## 局限与未来工作

论文附录 A.1 自述的局限：

  - 只做点预测，概率预测留待未来；
  - 预训练不含协变量（缺少带有意义协变量的大规模预训练数据）；论文设想了两种做法：零样本时在 context
    内预测后对残差线性回归协变量，或微调时把协变量加到输入、输出
    Residual Block；日期特征（A.7）也只是设想，论文没有实现；
  - 超参数几乎没有调优；Mamba、全 MLP 等其他架构尚未尝试；
  - 可解释性不如 ARIMA、ETS，可用 LOCO、SHAP 等做一定程度归因；
  - 与 LLM 类似，某些输入上模型可能表现不好甚至"幻觉"，关键场景建议人工复核或微调。

\[经验\] 此外值得注意：

  - 只做单变量输入，多变量序列需要按通道分别预测，跨变量依赖利用不到。
  - 论文评测里 Darts 只有 8 条序列、ETT 只看最后一个窗口，统计力度有限；训练数据以 Google Trends 与
    Wikipedia 为主，对分布差异很大的领域是否同样有效，需要自行验证。

## 与相关方法对比

| 方法                              | 训练范式                 | 与 TimesFM 的区别                                           |
| ------------------------------- | -------------------- | ------------------------------------------------------- |
| PatchTST                        | 每个数据集上监督训练           | 同样 patch；论文强调 TimesFM 以 decoder-only 方式训练，并用单一预训练模型做零样本 |
| llmtime                         | 把序列文本化后让 GPT-3 零样本预测 | 论文称 TimesFM 参数小得多，Monash 上更好                            |
| N-BEATS / N-HiTS / TCN / DeepAR | 每个数据集监督训练            | 论文里作监督基线                                                |
| GPT4TS（One Fits All）            | 微调预训练 GPT-2          | 论文微调实验里 TimesFM 的 MAE 更低                                |
| TimeGPT-1                       | 零样本基础模型              | 论文称其模型不公开访问，若干模型细节和基准数据集未披露                             |

表中：「方法」是对比对象，「训练范式」说明其训练方式，「与 TimesFM 的区别」说明差异。结论：TimesFM
是从头在时序数据上预训练的单一模型，可直接零样本预测，参数量远小于基于 LLM 的
llmtime。

相关方法见
[深度学习预测方法](/0606_ML_Tasks_TimeSeries_Deep)、[DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR)、[TCN](/0626_ML_Tasks_TimeSeries_Deep_TCN)，同系列文章还有
N-BEATS、N-HiTS、PatchTST。综述中提到的 TimesFM-ICF（上下文微调）属于论文之外的后续工作
\[待核实\]，本文不展开。

## 使用方式

论文声明计划开放权重并发布 model card（原文为 "plan to do a open weights
release"）。官方代码仓库名与 API 论文 PDF
中未给出，\[待核实\]，此处不写。下面是按论文流程写的**示意代码**（示意代码，未运行验证；`model`
为假想的已训练好的 TimesFM 网络，非官方接口）：

``` python
# 示意代码，未运行验证
import numpy as np

def forecast(model, y, H, p=32, h=128, max_ctx=512):
    y = np.asarray(y, dtype=float)[-max_ctx:]       # 截取最近的 context
    out = []
    while sum(len(o) for o in out) < H:
        L = len(y)
        pad = (-L) % p                              # 补零凑成 p 的整数倍
        x = np.concatenate([np.zeros(pad), y])
        mask = np.concatenate([np.ones(pad), np.zeros(L)])
        first = x[mask == 0][:p]                    # 近似 "第一个输入 patch" 的统计量 [解读]
        mu, sd = first.mean(), first.std() + 1e-8
        pred = model((x - mu) / sd, mask)           # 返回长度 h 的下一段预测
        pred = pred * sd + mu
        out.append(pred)
        y = np.concatenate([y, pred])[-max_ctx:]    # 自回归拼接
    return np.concatenate(out)[:H]
```

## Reference

  - [A decoder-only foundation model for time-series forecasting,
    arXiv:2310.10688](https://arxiv.org/abs/2310.10688)
