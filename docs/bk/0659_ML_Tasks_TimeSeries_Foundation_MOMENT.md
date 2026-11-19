-----

| Title     | ML Tasks TimeSeries Foundation MOMENT                 |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-19T03:24:05Z`                                |
| Updated @ | `2026-11-19T03:24:05Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/659) |

-----

# MOMENT

MOMENT 是一组开源的时间序列基础模型（foundation models）：用 T5 风格的 Transformer
encoder，在自建的 Time Series Pile 上以"掩码 patch
重建"做预训练，之后用于预测、分类、异常检测、填补等多种任务。它不是
LLM 改造（reprogramming）路线，而是**直接用时序数据从零预训练**的 encoder。

一句话概括：**把序列切成 patch，随机遮住 30% 后重建，得到一个通用
encoder；下游要么直接用重建头（zero-shot），要么只训练一个轻量输出头（linear
probing）。**

论文为 Goswami、Szafer、Choudhry、Cai、Li、Dubrawski（CMU Auton Lab、UPenn），收录于
ICML 2024（PMLR 235），arXiv:2402.03885（本文依据
v3）。论文称这是"第一个开源的大型预训练时序模型家族"；已发布
MOMENT-large 权重与 Time Series Pile（Hugging Face：AutonLab）。论文研究代码仓库为
`moment-timeseries-foundation-model/moment-research`，同时说明 MOMENT-base /
small 当时"正在开源中"。

## 解决什么问题

论文在摘要里列出三个难点：

1.  **缺少大而统一的公开时序语料**：公开时序数据集小、分散、多为单任务；
2.  **多数据集混合预训练困难**：时序的采样率、通道数、长度、幅值各异，还可能有缺失值，因此以往方法大多只在单个数据集上训练，再迁移；
3.  **评测不成熟**：在算力、时间、监督都有限的场景下评测基础模型的 benchmark 尚处早期。

对应地，论文的三项贡献是：Time Series Pile（数据）、处理时序特有问题的多数据集预训练方案（模型与训练）、以及基于
TimesNet benchmark 扩展出的"有限监督"评测协议（评测）。

## Time Series Pile

Time Series Pile 由 4 个任务相关的公开仓库汇总而成（论文 3.1 节），附录另外还列出了 FRED 的短程预测数据：

| 来源               | 内容（论文描述）                                                                     |
| ---------------- | ---------------------------------------------------------------------------- |
| Informer 长程预测数据集 | ETT（hourly / minutely 共 4 个子集）、Electricity、Traffic、Weather、ILI、Exchange-rate |
| Monash 预测档案      | 58 个短程预测数据集，共超过 10 万条序列                                                      |
| UCR/UEA 分类档案     | 159 个分类数据集                                                                   |
| TSB-UAD 异常检测基准   | 1980 条带标注异常的单变量序列，来自 18 个数据集                                                 |

整体规模（附录 E）：覆盖 13 个领域，约 20.085 GB、1300 万条不同的序列、12.3 亿个时间戳（含通道）。13 个领域包括
Healthcare、Human
Body、Nature、Audio、Power、Economics、Traffic、Weather、Facilities、Web
Services、Synthetic、Sensors、Gait。

**防止数据泄漏的切分**：每个数据集严格划分 train / val / test。优先使用数据创建者给出的切分；没有的则随机取 60%
训练、10% 验证、30%
测试。长序列（长程预测、异常检测）按时间"横向"切；由许多短序列组成的数据集（短程预测、分类）则整条序列归属某一个切分。全程使用同一随机种子
13，预训练只见各数据集的训练切分。

## 核心思想与结构

### 输入处理

MOMENT 接收单变量序列 $\\mathcal T\\in\\mathbb R^{1\\times T}$ 与掩码
$M\\in{0,1}^{1\\times T}$（0 表示未观测，1 表示观测）。论文对时序特有问题的处理如下：

  - **变长**：输入长度固定为 $T=512$；更长的序列做子采样，更短的在左侧补零。
  - **多通道**：每个通道当作独立的单变量序列，沿 batch 维处理（channel independence）。
  - **幅值差异**：对观测部分用 reversible instance normalization（RevIN，Kim et al.,
    2022）做缩放与居中。
  - **采样率**：不显式建模，因为这类信息在预测数据集之外常常拿不到。

### patch 化与嵌入

序列被切成 $N$ 个互不重叠、长度为 $P$ 的 patch，本文模型取 $P=8$，$N=T/P=64$。patch
全部时间点都观测到时，用可训练的线性层映射为 $D$
维嵌入；否则（有被遮/缺失的时间点）用一个可学习的
$\[\\mathrm{MASK}\]\\in\\mathbb R^{1\\times D}$ 嵌入替代。这 $N$ 个嵌入进入
Transformer encoder，encoder 内部保持形状不变，最后用一个轻量的重建头把每个嵌入映射回 patch
的原始维度，得到对所有 patch（被遮与未被遮）的重建。

``` 
 T=512 序列 --RevIN--> 64 个 patch (P=8)
        |
   线性嵌入 (被遮 patch -> [MASK])        N x D
        |
   Transformer encoder (T5 风格)           N x D
        |
   重建头 (lightweight)                    N x P  -> 还原 512 点
```

### encoder 结构

沿用 Raffel et al. (2020) 对原始 Transformer 的修改：LayerNorm 去掉加性 bias
并放在残差连接之前，使用相对位置编码。此外论文又给每个 patch
加了绝对正弦位置编码，并在脚注中说明：这是"最初无意中加入"，后续实验发现绝对
+ 相对位置编码并用能改善预测。

论文给出的设计取舍：

  - **Intentionally simple encoder**：贴近语言模型的
    Transformer，可直接利用其成熟的高效实现（gradient
    checkpointing、混合精度等）；
  - **Light-weight prediction head**：不使用与 encoder 同样大的
    decoder，下游微调时只需训练少量参数，让大部分参数与 encoder
    学到的高层特征保持不变；
  - **patch 化**：使显存和计算量随序列长度的二次项下降，同时线性地增加可输入的序列长度。

### 模型规格

| 规格    | 层数 | 隐藏维度 $D$ | 注意力头 | FFN 维度 | 参数量    |
| ----- | -- | -------- | ---- | ------ | ------ |
| Small | 6  | 512      | 8    | 2048   | 约 40M  |
| Base  | 12 | 768      | 12   | 3072   | 约 125M |
| Large | 24 | 1024     | 16   | 4096   | 约 385M |

三者大致对应 T5-Small / Base / Large 的 encoder 规模，所有权重随机初始化。

## 预训练：掩码时序建模

随机均匀地遮住 30% 的 patch，把它们的嵌入替换成 $\[\\mathrm{MASK}\]$，用 encoder +
重建头重建原序列。损失是被遮 patch 上的 MSE：

$$\\mathcal
L\_{\\text{pre}}=\\frac{1}{\\lvert\\Omega\\rvert}\\sum\_{i\\in\\Omega}\\frac{1}{P}\\lVert
\\hat{\\mathbf x}\_i-\\mathbf x\_i\\rVert\_2^2$$

其中 $\\Omega$ 是被遮 patch 的下标集合，$\\mathbf x\_i,\\hat{\\mathbf
x}\_i\\in\\mathbb R^{P}$ 为第 $i$ 个 patch 的真值与重建 \[解读：论文只写"在被遮 patch 上平均的
MSE"，上式的归一化写法是本文的形式化\]。

训练设置：AdamW（weight decay
$\\lambda=0.05$，$\\beta\_1=0.9$，$\\beta\_2=0.999$），梯度裁剪 5.0，batch
size 2048，余弦学习率从 $10^{-4}$ 降到 $10^{-5}$，gradient
checkpointing，混合精度（layer norm 等数值敏感操作用 float32，其余
bfloat16），训练 2 个 epoch。

论文强调选择掩码重建的理由：预测和填补本质上都是"掩码重建"问题；并且用专门的 $\[\\mathrm{MASK}\]$
嵌入而不是把被遮位置置零，因为零本身带有信息，会使零样本预测产生偏差（论文附录 Fig. 10
的对比）。

## 下游使用

论文区分三种用法（论文用下标 0 和 LP 区分变体，本文写作 `MOMENT-0`、`MOMENT-LP`）：

  - **Zero-shot（`MOMENT-0`）**：保留重建头，不做任何训练。用于异常检测、填补，以及"无监督表示学习"（取
    embedding 再训 SVM）；
  - **Linear probing（`MOMENT-LP`）**：冻结除重建头或预测头外的全部参数，只训练这个头；
  - **End-to-end 微调**：全部参数一起训练。

各任务的具体做法：

| 任务              | 做法                                                                   |
| --------------- | -------------------------------------------------------------------- |
| 预测（horizon $H$） | 换成预测头：把 $N$ 个 $D$ 维 patch 嵌入展平为 $N\\times D$ 维向量，经一层线性投影得到 $H$ 维输出   |
| 分类              | 无监督表示学习：取序列级 embedding，在其上训练分类器（如 RBF 核 SVM）；论文也提到可换成线性分类头，但主实验按前者评估 |
| 异常检测            | 保留重建头重建窗口（长 512），以观测与重建之间的 MSE 作为异常分数                                |
| 填补              | 只要 patch 内有未观测点就用 $\[\\mathrm{MASK}\]$ 替换，用重建头补出缺失值                  |

预测头的参数量可以自行核算 \[解读\]：$N\\cdot D\\cdot
H=64\\times1024\\times96=6{,}291{,}456$，与论文 Table 33 中 ETTh1-96 上 MOMENT
的可训练参数 6.29M 吻合（对应 $D=1024$ 即 Large；但该表同时给出总参数 347.53M，与前述约 385M
不同，原因论文未说明 \[待核实\]）。

论文附录 F.1 还提到短程预测的另一种免训练用法：在序列末尾追加被遮的 patch，用默认重建头直接预测。

## 评测协议：有限资源的设定

论文在 TimesNet benchmark（Wu et al.,
2023）的基础上做了扩展，核心是：**只考虑算力和监督都受限的场景**——这些场景模拟"训练或微调深度网络不可行（资源有限，或数据特征不充分）"的实际情况。具体而言：能
zero-shot 就 zero-shot，否则只做若干 epoch 的 linear
probing。论文不做超参数调优；基线用各自论文与官方仓库推荐的设置。

| 任务   | 监督设定                       | 数据                                                 | 指标                       | 主要基线                                                                                 |
| ---- | -------------------------- | -------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| 长程预测 | Linear probing             | ETT 4 个子集、Electricity、Traffic、Weather、Exchange、ILI | MSE、MAE                  | Time-LLM、GPT4TS、TimesNet、PatchTST、FEDformer、DLinear、N-BEATS、Stationary、LightTS       |
| 短程预测 | Zero-shot（源数据集训练，目标数据集评测）  | M3、M4 的子集                                          | sMAPE                    | GPT4TS、TimesNet、N-BEATS、AutoARIMA、AutoTheta、AutoETS、Seasonal Naive、Naive、Random Walk |
| 分类   | 无监督表示学习（SVM）               | UCR 分类档案                                           | Accuracy                 | GPT4TS、TimesNet、TS2Vec、T-Loss、TNC、TS-TCC、TST、若干监督深度模型、DTW                            |
| 异常检测 | Linear probing / zero-shot | UCR 异常档案                                           | Adjusted best F1、VUS-ROC | GPT4TS、TimesNet、Anomaly Transformer、DGHL、k-NN                                        |
| 填补   | Linear probing / zero-shot | ETT 4 个子集、Electricity、Weather                      | MSE、MAE                  | GPT4TS、TimesNet、DGHL、线性 / 最近邻 / 三次样条插值                                               |

设定细节：

  - **长程预测**：回看窗口 $L=512$；horizon
    $H\\in{24,60}$（ILI）、${96,720}$（其余）；去掉多变量数据集中的外生变量，只预测目标序列；Time-LLM
    在 Weather、Electricity、Traffic 上因时间和单卡显存限制没有跑出结果。
  - **短程预测的 "zero-shot"**：沿用 Oreshkin et al. (2021)
    的设置——在源数据集上训练（微调）预测头，再到目标数据集上直接评测，不再微调；只在
    M3/M4 中预训练时未见过的 40%
    数据上报告，且只取数据量最大的几个频率（Yearly/Quarterly/Monthly）。注意这里的
    zero-shot 指"对目标数据集零样本"，并非完全不训练。
  - **分类**：MOMENT 不在每个数据集上训练；其他模型各自在每个数据集上单独训练。
  - **异常检测**：窗口 512，长于 2560 的序列下采样 10 倍，阈值估计不在研究范围内。
  - **填补**：随机遮住长度为 8 的连续子序列（即一个 patch），遮挡比例 12.5% / 25% / 37.5% /
    50%，结果取平均。论文指出之前的 benchmark 随机遮单个时间点，任务过于简单，统计插值已经能和
    Transformer 打平。
  - **数据集数量表述不一致**：分类数据集数论文正文与 Table 4 为 91 个，附录 F.2 写 95 个；异常检测所用序列数正文写
    44、Table 22 说明写 45、附录 F.3 写 46、Table 7 说明写 248；TSB-UAD 的序列数 1980（3.1
    节）与 1970（Table 12）也不同。本文只在 Table 4 处按其标注引用 91，其余不作为结论使用 \[待核实\]。
  - **微调超参**：论文正文写明 MOMENT-Large 微调 batch size 64、one-cycle 学习率（峰值 5e-5
    到 1e-3）；附录文字则写 MOMENT-Base、batch size 16、余弦学习率初始 1e-5，两处表述不一致
    \[待核实\]。

## 实验结果

以下数字均取自论文表格（已对照渲染页核对）。

### 长程预测（论文 Table 2，MOMENT 为 linear probing，MSE / MAE）

| 数据集-horizon | MOMENT        | PatchTST      | GPT4TS        | N-BEATS       | Time-LLM      |
| ----------- | ------------- | ------------- | ------------- | ------------- | ------------- |
| Weather-96  | 0.154 / 0.209 | 0.149 / 0.198 | 0.162 / 0.212 | 0.152 / 0.210 | \-            |
| ETTh1-96    | 0.387 / 0.410 | 0.370 / 0.399 | 0.376 / 0.397 | 0.399 / 0.428 | 0.408 / 0.429 |
| ECL-96      | 0.136 / 0.233 | 0.129 / 0.222 | 0.139 / 0.238 | 0.131 / 0.228 | \-            |
| Traffic-96  | 0.391 / 0.282 | 0.360 / 0.249 | 0.388 / 0.282 | 0.375 / 0.259 | \-            |
| ILI-24      | 2.728 / 1.114 | 1.319 / 0.754 | 2.063 / 0.881 | 4.539 / 1.528 | 3.025 / 1.195 |

论文结论：MOMENT 在多数数据集与 horizon 上接近 SOTA，仅次于通常 MSE 最低的 PatchTST；在不少设置下优于基于
LLM 的 Time-LLM 和 GPT4TS；N-BEATS 也胜过若干近期方法。\[解读\] 上表 ILI-24 一行显示 MOMENT 与
PatchTST 差距明显（MSE 2.728 对 1.319），"接近 SOTA"并非对所有数据集成立；ILI
序列很短，可能与此有关（未经论文验证）。

### 零样本短程预测（论文 Table 3，sMAPE，越低越好）

MOMENT 列后面的 M4 / FR 表示用 M4 或 FRED 作为源数据集训练。

| 数据集          | MOMENT（M4 源 / FR 源） | N-BEATS（M4 / FR） | ARIMA | Theta | ETS   |
| ------------ | ------------------- | ---------------- | ----- | ----- | ----- |
| M3 Yearly    | 16.74 / 16.97       | 16.82 / 15.92    | 17.90 | 16.70 | 16.47 |
| M3 Quarterly | 10.09 / 10.62       | 11.26 / 11.30    | 10.18 | 9.19  | 8.99  |
| M3 Monthly   | 16.04 / 16.90       | 15.63 / 16.37    | 15.95 | 14.96 | 14.41 |
| M4 Yearly    | \- / 14.84          | \- / 14.18       | 16.19 | 14.04 | 14.06 |
| M4 Quarterly | \- / 12.02          | \- / 12.25       | 10.86 | 10.21 | 10.24 |
| M4 Monthly   | \- / 15.80          | \- / 15.24       | 13.68 | 13.19 | 13.58 |

论文自己的结论是：这是所有任务中提升空间最大的一个，Theta、ETS 等统计方法优于深度模型；仅在部分数据集上 MOMENT（及
GPT4TS、N-BEATS）的 sMAPE 低于 ARIMA。

### 分类（论文 Table 4，UCR，91 个数据集，accuracy）

| 方法         | 均值    | 中位数   | 平均排名 |
| ---------- | ----- | ----- | ---- |
| `MOMENT-0` | 0.794 | 0.815 | 7.2  |
| TS2Vec     | 0.851 | 0.871 | 3.5  |
| TS-TCC     | 0.793 | 0.802 | 6.5  |
| TNC        | 0.786 | 0.788 | 6.9  |
| TimesNet   | 0.572 | 0.565 | 13.3 |
| GPT4TS     | 0.566 | 0.583 | 13.3 |

表中 TS-TCC、TNC 的均值略低于 MOMENT（0.793、0.786 对 0.794）。论文称：无需在各数据集上训练，MOMENT
表示上的 SVM 优于除 4 个方法之外的所有方法（从 Table 4 看，均值与中位数都更高的是
TS2Vec、T-Loss、FCN、ResNet）；而 GPT4TS、TimesNet 即使在各数据集上有标签地训练，表现也较差。

### 异常检测（论文 Table 7，UCR Anomaly Archive）

| 方法                  | Adj. best F1 均值 | VUS-ROC 均值 |
| ------------------- | --------------- | ---------- |
| `MOMENT-0`          | 0.585           | 0.670      |
| `MOMENT-LP`         | 0.628           | 0.684      |
| GPT4TS              | 0.424           | 0.611      |
| TimesNet            | 0.537           | 0.679      |
| Anomaly Transformer | 0.492           | 0.661      |
| DGHL                | 0.425           | 0.646      |
| k-NN                | 0.554           | 0.706      |

`MOMENT-LP` 在 Adj. F1 上最好；k-NN 在 VUS-ROC 上略高，论文称 MOMENT"接近 SOTA"。

### 填补（论文 Table 6，MSE）

| 数据集         | `MOMENT-0` | `MOMENT-LP` | GPT4TS | TimesNet | Linear 插值 |
| ----------- | ---------- | ----------- | ------ | -------- | --------- |
| Weather     | 0.082      | 0.035       | 0.031  | 0.036    | 0.065     |
| ETTh1       | 0.402      | 0.139       | 0.227  | 0.175    | 0.775     |
| ETTm2       | 0.078      | 0.031       | 0.052  | 0.112    | 0.062     |
| Electricity | 0.250      | 0.094       | 0.072  | 0.124    | 0.737     |

论文称 `MOMENT-LP` 在所有 ETT 数据集上重建误差最低；zero-shot 时优于除线性插值外的统计插值方法。

### 模型性质（RQ2 / RQ3）

  - **表示是否捕捉直观特征**：用合成正弦波做 PCA / t-SNE，MOMENT 的 embedding
    能反映趋势、幅值、频率、相位的变化，但无法区分垂直平移（因为先做了归一化）。
  - **规模**：模型越大训练损失越低（Fig. 6），零样本的预测、填补、异常检测表现总体随模型增大而变好（附录 F.6）。
  - **从零初始化 vs 语言模型初始化**：随机初始化的 MOMENT-small 最终训练损失低于用 Flan-T5
    权重初始化的同规模模型。
  - **跨模态**：冻结 self-attention 与 FFN 层后，MOMENT 在 Bit
    Memory、MNIST、CIFAR-10、IMDb 序列分类上与 GPT-2、Flan-T5 同量级。例如 MNIST 为
    0.982 vs 0.975 / 0.987，CIFAR-10 为 0.620 vs 0.711 / 0.672，IMDb 为
    0.872 vs 0.867 / 0.861（Table 5，依次为 MOMENT vs GPT-2 / Flan-T5）。
  - **效率**（Table 33，ETTh1-96）：MOMENT 总参数 347.53M、可训练 6.29M、显存 2079
    MiB；GPT4TS 为 82.28M / 1.12M / 1031 MiB；Time-LLM 为 3623.71M /
    254.37M / 4537 MiB。

## 优缺点与局限

**论文自述**：

  - 预训练使其在数据量小的任务（分类、异常检测）上尤其有优势；
  - 对垂直平移不敏感，因为先做了归一化；
  - 零样本短程预测弱于统计方法；
  - 预测靠 linear probing 的结果仍低于 PatchTST，论文把"用因果注意力和预测目标预训练 MOMENT
    以提升预测"列为未来工作；
  - 需要谨慎用于高风险场景（如医疗），论文建议先用任务相关的域内数据微调与评测；论文也承认 model transparency
    评分偏低，第三方的危害评估缺失；
  - 训练开销：论文估算三个模型总计约 1021 GPU 小时（上限，Table 8），碳排放估算上限 103.096 tCO2eq。

**\[经验\]**：

  - 输入固定为 512 个点的单变量窗口，较长上下文需要子采样，多变量之间的依赖靠通道独立而被忽略；
  - 重建式预训练天然偏向"填补 / 异常"，预测要依赖额外的预测头。

## 与相关方法对比

  - **PatchTST**：同样 patch 化、通道独立，也用掩码重建做过自监督，但按数据集分别训练；MOMENT
    是跨数据集混合的大规模预训练，并在多任务上评测。
  - **GPT4TS / Time-LLM**：借用语言模型做 reprogramming
    的路线。论文的观察是：从头预训练的时序模型在不少任务和数据集上优于它们；效率表中
    Time-LLM 总参数达 3623.71M，GPT4TS 为 82.28M（可训练 1.12M），均与 MOMENT 的
    347.53M / 6.29M 不同量级或取向。
  - **TimesNet**：论文使用其 multi-task benchmark，但改成有限监督设定，并扩充了分类和异常检测数据集与指标。
  - **Timer、Moirai、TimesFM、Lag-Llama 等**：同期的时序基础模型（本系列另有文章）。\[解读\]
    MOMENT 的特点是 encoder + 掩码重建、面向多任务，而不是专注概率预测。

## 使用方式

示意代码，未运行验证；包名与接口以官方仓库为准 \[待核实\]：

``` python
# 示意代码，未运行验证
from momentfm import MOMENTPipeline

model = MOMENTPipeline.from_pretrained(
    "AutonLab/MOMENT-1-large",
    model_kwargs={"task_name": "reconstruction"},  # 其他任务名以官方文档为准
)
model.init()
# x: [batch, channels, 512] 的张量；输出为重建结果或 embedding
```

## Reference

  - 论文：[MOMENT: A Family of Open Time-series Foundation
    Models](https://arxiv.org/abs/2402.03885)
  - 模型与数据（论文给出）：[AutonLab/MOMENT-1-large](https://huggingface.co/AutonLab/MOMENT-1-large)、[AutonLab/Timeseries-PILE](https://huggingface.co/datasets/AutonLab/Timeseries-PILE)
  - 研究代码（论文给出）：<https://github.com/moment-timeseries-foundation-model/moment-research>
