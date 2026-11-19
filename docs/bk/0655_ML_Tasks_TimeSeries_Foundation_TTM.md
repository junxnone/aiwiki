-----

| Title     | ML Tasks TimeSeries Foundation TTM                    |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-19T02:42:18Z`                                |
| Updated @ | `2026-11-19T02:42:18Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/655) |

-----

# TTM

TTM（Tiny Time Mixers）是 IBM Research 的 Ekambaram
等人提出的轻量级预训练时序预测模型（论文首页注明被
NeurIPS 2024 接收）。它以 TSMixer 为骨架，在约 1B 样本的公开数据上预训练，参数量从 1M
起，目标是用"很小"的模型做好零样本/少样本多变量预测，并在微调阶段再引入通道相关与外生变量。

一句话概括：**用 TSMixer 搭一个几百万以内参数的预训练预测器，靠自适应
patching、多分辨率下采样增广、分辨率前缀三个小改动让小容量模型能吃下多分辨率的异质数据，再用"骨干冻结、只调
head（含可选通道混合/外生混合）"完成下游适配。**

在总览里 TTM 被归入"轻量预训练"路线，见 [时序基础模型](/0608_ML_Tasks_TimeSeries_Foundation) 与
[时序总览](/0603_ML_Tasks_TimeSeries)；与之同系的 MLP-Mixer 类前作 TSMixer、TimeMixer
本文只写名字。

## 解决什么问题

论文的出发点（原文 Introduction）：

  - 2024 年初出现了一批"大"预训练预测模型（Moment、TimesFM、Chronos、Moirai、Lag-Llama），以及用
    LLM 做预测的 LLMTime、Time-LLM、GPT4TS；它们参数从几百万到数十亿不等，计算昂贵、推理慢。
  - 摘要还指出这些模型"忽略通道间相关与外生变量"。
  - 受"小语言模型"启发，论文问：`tiny` 的预训练模型能否在时序上成功，并胜过大模型的零/少样本结果？

难点在于：公开时序数据少且异质（领域、采样分辨率从秒到天、长度、通道数都不同），而模型又极小，容易欠拟合。TTM 的几个组件正是为"小容量 +
多分辨率预训练"设计的。

## 整体结构

TTM 由四个组件组成（论文 Figure 2(a)）：

| 组件                  | 说明（论文）                                    |
| ------------------- | ----------------------------------------- |
| TTM backbone        | 由 TSMixer 的块搭成，加入自适应 patching；微调阶段冻结      |
| TTM decoder         | 结构同骨干但小得多，约为骨干大小的 10%-20%；不使用自适应 patching |
| Forecast head       | 线性头，输出预测                                  |
| Exogenous mixer（可选） | 融合外生变量                                    |

其中 decoder 与 forecast head 合称 TTM head，微调时只更新它。预处理沿用 PatchTST/TSMixer
的做法：逐实例、逐通道归一化到零均值单位方差，最后输出处反归一化；再切成不重叠的 patch。

记输入 $X\\in\\mathbb R^{c\\times sl}$（$sl$ 为 context 长度，$c$ 为通道数），预测目标

$$X\\in\\mathbb R^{c\\times sl}\\ \\longrightarrow\\ \\hat Y\\in\\mathbb
R^{c'\\times fl}\\qquad (c'\\le c)$$

$fl$ 为预测长度，$c'$ 为需要预测的目标通道数，其余通道是外生变量。patch 后 $X\_p\\in\\mathbb
R^{c\\times n\\times pl}$，其中 $pl$ 为 patch 长度，$n=sl/pl$（stride 等于
$pl$，见附录 D.1）。

### 与 TSMixer 的关系

TSMixer 本身（MLP-Mixer 式块：patch 内、patch 间、可选的通道间混合，穿插 gated
attention）被直接当作 TTM 的积木。论文附录 A 的说法是：原始 TSMixer
没法在多样数据集上训练，所以需要新增组件。具体地，TTM 相对 TSMixer 增加了：

  - 自适应 patching（骨干内逐层改变 patch 数与 patch 维度）；
  - 分辨率前缀；
  - 预训练数据层面的 DRS 增广；
  - "预训练通道独立、微调才开通道混合"的多层级使用方式，以及外生混合器。

`[解读]` 因此可以把 TTM 看成"TSMixer 的预训练配方 + 多分辨率适配件"，而不是新的块设计。

### 自适应 patching（AP）

骨干有 $L$ 个 level，每个 level 有 $M$ 个 TTM block，同一 level 内 patch 配置相同。每个 TTM
block 由 patch partition、一个普通 TSMixer block、patch merge 三部分组成。第 $i$ 个
level 的 patch partition 把张量重排：

$$X\_h^{(i-1)}\\in\\mathbb R^{c\\times n\\times hf}\\ \\longrightarrow\\
X\_h^{i}\\in\\mathbb R^{c\\times (n\\cdot K\_i)\\times
(hf/K\_i)},\\qquad K\_i=2^{L-i}$$

并要求 $hf=m\\cdot 2^{L-1}$（$m$ 为整数）。TSMixer 在这个重排后的形状上工作，随后 patch merge
把形状还原为 $c\\times n\\times hf$。level 每加一，patch 数减半、patch 维度翻倍。论文图
2(b) 以 $L=3$、$M=2$ 为例。AP 只用于骨干，不用于 decoder。

自拟数值示意（非论文数字，已重算）：取 $sl=512$、$pl=64$，则 $n=512/64=8$；附录 D.1 给出
$hf=fs\\cdot pl$，$fs=3$，故 $hf=192=48\\cdot 2^{2}$，即 $m=48$。$L=3$ 时：

| level | $K\_i$ | patch 数 $n\\cdot K\_i$ | patch 维度 $hf/K\_i$ |
| ----- | ------ | ---------------------- | ------------------ |
| 1     | 4      | 32                     | 48                 |
| 2     | 2      | 16                     | 96                 |
| 3     | 1      | 8                      | 192                |

每层 $n\\cdot K\_i\\cdot hf/K\_i=8\\times192=1536$
不变，只是切分粒度不同。（此处忽略了分辨率前缀额外占用的一个
patch。）

直觉（论文）：不同分辨率的数据集适合的 patch 长度不同，AP
让同一个小模型在多种粒度上建模，在预训练数据少时尤其有助于泛化。论文提到这一思路来自视觉里的
Swin Transformer。

### 多分辨率增广：Diverse Resolution Sampling（DRS）

公开数据集中高分辨率（采样密）数据占样本量的大头，容易让模型偏向细粒度数据。DRS 对高分辨率数据集做两种降采样来产生更低分辨率的新数据集：

  - 对连续不重叠的 $k$ 个点取平均；
  - 或经典抽取：每 $k$ 个点只留一个。

$k$ 的选取使其达到目标分辨率。论文例子：从 4 秒分辨率数据，$k=15$ 得到分钟级，$k=900$
得到小时级（$4\\times15=60$ 秒，$4\\times900=3600$
秒，一致）。原始高分辨率数据集仍留在预训练池中。

### 分辨率前缀（Resolution Prefix Tuning, RPT）

把每种分辨率映射成一个整数，经 embedding 层投影到隐维度 $hf$，再沿通道扩展成 $c\\times1\\times hf$
的张量，作为可学习的"前缀 patch"拼到 patch embedding 前面（图 2(b) 中
$n=n+1$）。其作用是显式告诉模型当前数据的分辨率，使小模型能"解耦"不同分辨率的数据；论文还指出当
context 很短时，模型难以自己判断分辨率，RPT 对此也有帮助。附录 D.1 说明除 TTMQ 外所有变体默认启用 RPT。

## 训练与推理

### 预训练

  - 通道独立：多变量数据集先拆成单变量序列 $(X\_1,\\dots,X\_N)\\in\\mathbb R^{(c=1)\\times
    sl}$，因为各数据集通道数不一，预训练阶段不建模通道相关。
  - 直接预测目标（不是掩码重建），损失为预测窗口上的 MSE：

$$\\mathcal L=\\lVert Y-\\hat Y\\rVert\_2^2$$

  - 数据：从 Monash 与 LibCity 取约 1B 样本（Monash 约 250M，其余为 LibCity；一个样本是一对窗口
    $X\\in\\mathbb R^{1\\times sl}$、$Y\\in\\mathbb R^{1\\times
    fl}$）。评测用到的 Weather、Electricity、Traffic
    被排除；年度、月度等过短数据集也被排除。
  - 设置（附录 D.1）：$L=3$、$M=2$，decoder 2 层，batch size 4500，20 个
    epoch，dropout 0.4，在 6 张 A100 上完成；正文称 1B 预训练约需 24-30 小时。
  - 每个预训练模型对应固定的 context 长度和预测长度（见局限）。

### 变体

| 变体                 | 参数量 | $sl$ | $pl$ |
| ------------------ | --- | ---- | ---- |
| TTM-Base（TTMB）     | 1M  | 512  | 64   |
| TTM-Enhanced（TTME） | 4M  | 1024 | 128  |
| TTM-Advanced（TTMA） | 5M  | 1536 | 128  |

此外还有 Quick TTM（TTMQ）：在 Monash 子集（约 250M 样本）上训练的二级实验变体，预训练仅需 4-6 小时，不启用
RPT。论文说明直接法下参数量随预测长度变化，结果表里报告的是平均参数量（所以 Table 3 里 TTMB 写 0.8M，而其他表写 1M）。

### 微调与适配

微调时目标数据与预训练数据不重叠，有三种用法：

1.  零样本：直接用预训练模型测试；
2.  少样本：只用训练集的 5%-10% 更新 TTM head；
3.  全样本：用完整训练集更新 head（论文称 head probing）。

骨干始终冻结、保持通道独立。decoder 可选通道混合：开启后，decoder 里所有 TSMixer 块的 channel-mixer
被启用以捕获通道相关。通道混合与外生混合器在预训练时关闭、仅在微调时按数据需要开启（附录 D.1）。微调同样用 MSE，head
dropout 与 batch size 依数据集设定（附录 D.2）。

### 外生混合器

设 forecast head 输出 $\\hat Y\\in\\mathbb R^{c\\times fl}$，通道
$x\_0,\\dots,x\_{c'}$ 为目标，$x\_{c'+1},\\dots,x\_c$
为未来值已知的外生通道。先用真值替换外生通道的预测值并转置：

$$\\hat Y\_e=\[\\hat y\_0,\\dots,\\hat
y\_{c'},y\_{c'+1},\\dots,y\_c\]\\in\\mathbb R^{fl\\times c}$$

再以 stride 为 1 做重叠切片得到

$$\\hat Y\_{e,p}\\in\\mathbb R^{fl\\times\\Delta\\times c},\\qquad
\\Delta=2\\cdot l+1$$

其中 $l$ 是时间点两侧各纳入的上下文长度（需在两端补长为 $l$ 的零）。随后过一个开启通道混合的普通 TSMixer
块以学习外生变量到目标的滞后依赖，最后接线性头并 reshape 成 $\\hat
Y\\in\\mathbb R^{c'\\times fl}$。图 2(c) 的示例是 $l=1$、$\\Delta=3$。

### 预测长度适配（FLA）

TTM 需要为特定预测长度预训练，但论文给出两种让已有模型适配其他长度的办法：

  - Pruning：用较长预测长度（如 720）的模型，裁剪输出到所需长度；
  - Recursive：用较短预测长度（如 96）的模型递归预测直到够长。

论文 Figure 4（TTMB，$FL\\in{96,192,336,720}$，D1 平均 MSE）的结论：短距离适配（96 到
192）递归与直接预测相当；大跨度适配（336 到 96，或 720 到 96）pruning 更稳、更接近直接预测。

## 实验与结论

以下数字均来自论文表格，已对照渲染页核对。指标为 MSE，f-imp 为 TTM 相对基线的 MSE 改进百分比（跨数据集平均），s-imp
为基线参数量与 TTM 参数量之比。D1 为 ETTH1/H2/M1/M2、Weather、Electricity、Traffic；D2
为 bike sharing（BS）、carbon capture plant（CC）及两个业务/IT 可观测数据集
Application（APP）、Service（SER）。

### 零样本（Table 1，滑窗，MSE 对 $FL\\in{96,192,336,720}$ 平均）

| TTM 变体   | 对 MoiraiS（14M） | 对 MoiraiB（91M）      | 对 MoiraiL（311M） | 对 TimesFM（200M） |
| -------- | -------------- | ------------------- | --------------- | --------------- |
| TTMB（1M） | 6%，14X         | 1%（表中为向下箭头，即退步），91X | 4%，311X         | 15%，200X        |
| TTME（4M） | 7%，4X          | 1%，23X              | 6%，78X          | 16%，50X         |
| TTMA（5M） | 10%，3X         | 4%，18X              | 9%，62X          | 19%，40X         |

每格为 f-imp 与 s-imp。论文摘要概括为零/少样本预测优于已有基准 4%-40%，同时大幅降低计算需求。TimesFM 的
Electricity 与 Weather 未报告（它们被用于其预训练）；Traffic 被 Moirai 和 TimesFM
用于预训练，该表没有 Traffic 列。

### 零样本（Table 2，最后一个测试窗口，$FL\\in{24,48,60,96,192}$）

Chronos 与 Lag-Llama 推理慢，论文只在最后一个测试窗口上比较。TTMB（1M）相对
ChronosT/S/B/L（8M/46M/201M/709M）的 f-imp 分别为 32%/26%/17%/18%，相对
Lag-Llama（3M）为 40%。论文还在附录称 TTM 相对 LLMTime 和 UniTime 提升超过 25%。

### 推理成本（Table 3，$sl=512$、$fl=96$、batch 32、单通道，A100 80GB）

| 模型       | GPU 时间（ms） | 参数（M） | 显存（GB） | CPU 时间（s） |
| -------- | ---------- | ----- | ------ | --------- |
| TTMB     | 4.7        | 0.8   | 0.06   | 0.01      |
| TimesFM  | 24         | 200   | 2      | 0.4       |
| MoiraiS  | 205        | 14    | 0.1    | 1.4       |
| ChronosT | 1389       | 8     | 2      | 2504      |
| GPT4TS   | 13.9       | 87    | 1.34   | 0.3       |

论文称在所比较的预训练模型中 TTM 推理时间与显存都最低。

### 少样本 5%（Table 4，MSE 对 $FL\\in{96,192,336,720}$ 平均）

TTMB 在仅用 5% 训练数据微调的设定下，相对 GPT4TS（84M）f-imp 为 15%，相对 Time-LLM（7B）为
10%；相对在 5% 数据上从头训练的
PatchTST、TSMixer、TimeMixer、iTransformer、TimesNet、DLinear，f-imp
分别为 17%、15%、31%、22%、40%、23%。表内数值也显示 TTM 并非每个数据集都最好：Electricity 上
TTMB 为 0.183，GPT4TS 为 0.178、PatchTST 为 0.176。

### 全样本 head probing（Table 5，$FL$ 取 96 与 720 平均，沿用 Moment 论文口径）

TTMB 相对 Moment（348M）f-imp 为 3%，相对 GPT4TS 为 4%，相对 Time-LLM（7B）为 9%。TTMA
分别为 4%、6%、10%。

### 通道混合与外生变量（Table 6，D2 数据集，用 TTMQ）

TTMQ-CM（开 decoder 通道混合与外生混合器）的 MSE：BS 0.582、CC 0.250、APP 0.042、SER
0.114；普通 TTMQ 为 0.635、0.261、0.073、0.143。表中 TTMQ-CM
相对各基线（TTMQ、PatchTST、TSMixer-CC、TSMixer-CM、TSMixer、GPT4TS）的
f-imp 依次为 18%、15%、15%、20%、17%、18%。设定：BS 用 $(sl,fl)=(512,96)$，其他用
$(96,24)$。

### 消融

  - 预训练数据与 DRS（Figure 3，零样本，$FL$ 取 96、192 平均 MSE）：仅 Monash（250M）为
    0.511，加 DRS 后为 0.322（改进 37%），再扩到 1B 样本为 0.303（再改进
    6%）。论文据此强调"分辨率多样性比数据量更重要"。
  - RPT 与 AP（Table 7，零样本 $FL=96$）：1B 预训练下 RPT 带来约 3%
    改进；预训练数据较少（250M，TTMQ）时 AP 带来约 3% 改进。论文正文还称
    RPT 在很短 context 下改进 8%（详见附录 F.9）。
  - 论文在设计讨论（4.9 节）中称直接预测目标的零样本表现优于传统掩码式预训练，并只是"假设"其原因是模型学到了固定 context
    到预测窗口的非线性映射；正文中未见对应的对比表 `[待核实]`，不宜当作消融结论。

### 可解释性

论文做了 PCA 嵌入可视化（Figure 5(a)）与微调后通道混合层的注意力分析（Figure 5(b)），称在 bike sharing
上模型关注 weathersit、season、holiday、temperature 等通道。

## 优缺点

论文自述的优点：参数量小（1M 起）、预训练快（24-30 小时、6 张 A100）、可在单 GPU 或仅 CPU
上微调/推理、同时支持通道相关与外生变量。

论文自述的局限（附录 H）：

  - 目前只做预测任务，不像 Moment、GPT4TS 那样扩展到分类、回归、异常检测；
  - 对 context 长度敏感，需为不同 context 设置训练不同模型（因此给了三个变体）；
  - 只支持点预测，不支持 Lag-Llama、Moirai 那样的概率预测。

`[经验]` 另一些使用上需留意的点：模型按固定 context/预测长度预训练，要换长度需 FLA
或重新选权重；论文的零样本评测中，Chronos、Lag-Llama
只比较最后一个测试窗口，与滑窗评测的 Moirai/TimesFM 口径不同，跨表数字不宜直接比较。

## 与相关方法对比

| 方法      | 骨架                       | 预训练目标       | 通道处理                  | 规模           |
| ------- | ------------------------ | ----------- | --------------------- | ------------ |
| TTM     | TSMixer（MLP-Mixer）       | 直接预测 + MSE  | 预训练通道独立，微调可开通道混合/外生混合 | 1M-5M        |
| Moirai  | Transformer encoder      | 掩码重建（预测窗口）  | any-variate，展平所有通道    | 14M/91M/311M |
| TimesFM | decoder-only Transformer | 单变量预训练      | 单变量                   | 200M         |
| Chronos | T5 语言模型，序列量化为 token      | 自回归采样 token | 单变量                   | 8M-709M      |
| Moment  | Transformer encoder      | 掩码重建        | 单变量                   | 348M         |
| GPT4TS  | 微调 GPT 的输入/归一化/输出层       | 微调          | 论文称未建模通道相关            | 87M（Table 3） |

（对比内容取自论文附录 B.2、B.3 与各表。）TTM 与 PatchTST 共享"patch + 通道独立 + 归一化"思路；N-HiTS
的多尺度思想与 TTM 的多粒度 patching 有可类比之处 `[解读]`。

## 使用方式

论文摘要给出了权重与源码链接；经 PDF 首页链接注释确认的地址有：Hugging Face 上的
`ibm-granite/granite-timeseries-ttm-r1`、`ibm-granite/granite-timeseries-ttm-r2`、`ibm/ttm-research-r2`，以及代码目录
`github.com/ibm-granite/granite-tsfm`（`tsfm_public/models/tinytimemixer`）。摘要说明研究用权重与企业可用（Apache）权重是分开发布的，其中最新变体（TTMB/E/A）为推荐使用。

示意代码（未运行验证；类名与参数名凭记忆书写，不来自论文，`[待核实]`，实际请以仓库 README 与模型卡为准）：

``` python
# 示意代码，未运行验证
from tsfm_public.models.tinytimemixer import TinyTimeMixerForPrediction

model = TinyTimeMixerForPrediction.from_pretrained(
    "ibm-granite/granite-timeseries-ttm-r2",  # 可能需要指定 revision 选择 context/预测长度
)
# past_values: [batch, context_length, channels]
out = model(past_values=past_values)
forecast = out.prediction_outputs  # [batch, forecast_length, channels]
```

少样本流程（概念）：加载预训练权重，冻结骨干，仅用 5% 训练数据训练 head；若有外生变量，则开启 decoder 通道混合与外生混合器。

## Reference

  - Ekambaram et al., Tiny Time Mixers (TTMs): Fast Pre-trained Models
    for Enhanced Zero/Few-Shot Forecasting of Multivariate Time Series,
    arXiv:2401.03955：<https://arxiv.org/abs/2401.03955>
  - 代码：<https://github.com/ibm-granite/granite-tsfm>
  - 权重：<https://huggingface.co/ibm-granite/granite-timeseries-ttm-r2>
