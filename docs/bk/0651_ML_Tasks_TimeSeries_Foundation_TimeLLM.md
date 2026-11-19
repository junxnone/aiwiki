-----

| Title     | ML Tasks TimeSeries Foundation TimeLLM                |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-19T02:42:10Z`                                |
| Updated @ | `2026-11-19T06:18:04Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/651) |

-----

# Time-LLM

Time-LLM 出自论文 *Time-LLM: Time Series Forecasting by Reprogramming Large
Language Models*（Ming Jin、Shiyu Wang、Lintao Ma、Zhixuan Chu、James Y.
Zhang、Xiaoming Shi、Pin-Yu Chen、Yuxuan Liang、Yuan-Fang Li、Shirui
Pan、Qingsong Wen；署名机构含 Monash University、Ant Group、IBM
Research、Griffith University、Alibaba Group、HKUST(GZ)；论文首页标注 Published
as a conference paper at ICLR
2024，arXiv:2310.01728）。它要回答的问题是：**能不能完全不改动（不微调）一个现成的大语言模型（LLM），只在它前后各接一个轻量模块，就让它做时间序列预测？**

一句话概括：**Time-LLM = 把时序切成 patch，并用"文本原型"（text
prototypes）通过多头交叉注意力重编程（reprogramming）成 LLM
词嵌入空间里的向量，再在前面拼上自然语言提示（Prompt-as-Prefix），送入冻结的 LLM
主干，最后丢掉前缀、展平、线性投影得到预测。**
只训练输入变换和输出投影，LLM 全程冻结。

> 在本站的综述里，它属于"复用 LLM"这一类（和 One Fits All / GPT4TS、LLMTime 等并列），见
> [基础模型综述](/0608_ML_Tasks_TimeSeries_Foundation) 与
> [时间序列总览](/0603_ML_Tasks_TimeSeries)。论文之后有研究质疑 LLM
> 在这类方法里是否真有贡献，本文最后单独说明。

## 解决什么问题

论文的动机有两层：

  - **能力层面**：时序预测模型通常是任务/领域专用的；而 LLM 在 NLP 里表现出 few-shot/zero-shot
    迁移能力。论文在引言里列出想借用的几点：泛化性（Generalizability）、数据效率（Data
    efficiency）、推理能力（Reasoning）、多模态知识（Multimodal knowledge）、易优化（Easy
    optimization）。
  - **障碍层面**：关键难点是**模态对齐**。LLM 处理离散 token，时序是连续值；LLM 预训练里也没有显式的"读时序"知识。

论文在相关工作里把已有思路分成三类（Fig. 1），Time-LLM 属于第三类：

| 路线         | 做法                                                                                                                       | Time-LLM 的区别         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| (a) 任务专用学习 | 为每个任务/领域从头训练专用模型（ARIMA、LSTM、TCN、Transformer 等）                                                                           | 复用预训练 LLM，不从头训练      |
| (b) 模型微调   | 先预训练再微调。跨模态的例子有 GPT4TS（Zhou et al. 2023a，论文称其不改动 LLM 的 self-attention 与 FFN 层，并在多种时序任务上微调与评估）、LLM4TS（先在时序上做监督预训练，再做任务微调） | 不微调 LLM 主干，也不直接改输入序列 |
| (c) 模型重编程  | 冻结源模型，学习输入端的适配，使其产出目标任务输出                                                                                                | 这是 Time-LLM 的路线      |

论文还对比了一种叫 **Patch-as-Prefix** 的做法（把 patch 放在前面，让 LLM 用自然语言"说出"下一个值，如
"the next value is 0.6"），指出两个问题：

1.  LLM 对高精度数字不敏感，长期预测很难做准；
2.  不同 LLM 的分词不同，同一个小数可能被拆成 `['0', '.', '6', '1']` 或 `['0', '.',
    '61']`，需要为每个模型定制后处理。

Time-LLM 的 **Prompt-as-Prefix** 把自然语言只当作"上下文前缀"，预测值不由 LLM
生成文本，而是由输出端线性层读出，从而绕开这两个问题。

## 核心思想与结构

输入多变量序列 $X\\in\\mathbb R^{N\\times T}$（$N$ 个一维变量、$T$ 个时间步），目标是预测未来 $H$ 步
$\\hat Y\\in\\mathbb R^{N\\times H}$，整体目标是最小化 MSE：

$$\\frac1H\\sum\_{h=1}^{H}\\lVert \\hat Y\_h-Y\_h\\rVert\_F^2$$

论文把方法分为三块：(1) 输入变换，(2) 预训练并冻结的 LLM，(3) 输出投影。多变量序列先拆成 $N$ 条单变量序列
$X^{(i)}\\in\\mathbb R^{1\\times T}$，**各自独立**处理（沿用 PatchTST 的做法，即
channel independence），每条得到 $\\hat Y^{(i)}\\in\\mathbb R^{1\\times H}$。

    X(i) -> RevIN -> Patching -> Patch Embedder(线性) -> Patch Reprogramming (与文本原型 E' 做多头交叉注意力) --+
                                                                                                            |
    <dataset description> ### Domain ### Instruction ### Input statistics --> LLM 词嵌入 --> prompt embeddings --+--> [冻结 LLM] --> 丢弃前缀 --> 展平 --> 线性 --> Y(i)
                                                           (提示放在前面，作为 prefix)
    可训练：Patch Embedder、重编程层、输出投影   冻结：LLM 主干与词嵌入

### 输入嵌入

每个通道先单独做 RevIN（reversible instance
normalization，用来缓解分布漂移）归一化为零均值、单位标准差。然后切成长度
$L\_p$、步长 $S$ 的 patch（可重叠也可不重叠），patch 总数为

$$P=\\left\\lfloor \\frac{T-L\_p}{S}\\right\\rfloor+2$$

论文给出切 patch 的两点动机：(1) 把局部信息聚合进每个 patch，更好地保留局部语义；(2) 起到 tokenization
的作用，形成紧凑的输入 token 序列，降低计算量。再用一个简单的线性层把 $X\_P^{(i)}\\in\\mathbb
R^{P\\times L\_p}$ 嵌入为 $\\hat X\_P^{(i)}\\in\\mathbb R^{P\\times d\_m}$。

> 自拟示意（非论文数字）：取 $T=512$、$L\_p=16$、$S=8$，则
> $P=\\lfloor(512-16)/8\\rfloor+2=62+2=64$，即一条序列变成 64 个 token。论文 B.4 的
> Table 9 只给出了 $T$ 和 $d\_m$，正文与附录里没有 $L\_p$、$S$ 的取值；官方仓库
> `models/TimeLLM.py` 的构造函数默认 `patch_len=16, stride=8`，其 `patch_nums`
> 的写法与上式一致 \[经验：读自仓库 main 分支源码，未运行；论文实验是否用此默认值仍
> 待核实\]。这里的数值仅用来说明公式。

### Patch Reprogramming

**为什么要"重编程"**：时序既不能被直接编辑成 LLM 能懂的形式，也无法无损地用自然语言描述。论文的做法是让 patch 表示"落到"
LLM 预训练过的词嵌入空间里：用骨干的词嵌入 $E\\in\\mathbb R^{V\\times D}$（$V$ 为词表大小，$D$
为骨干隐藏维度）来表示 patch。

**为什么要"原型"**：不知道哪些词与时序相关，直接用整个 $E$ 会使重编程空间又大又稠密。于是先通过对 $E$
的线性探测得到一小组文本原型：

$$E'\\in\\mathbb R^{V'\\times D},\\qquad V'\\ll V$$

论文附录 B.1 说明，这是学习一个矩阵 $W\\in\\mathbb R^{V'\\times V}$ 作为中介 \[解读：即
$E'=WE$，$W$ 可训练、$E$ 冻结\]。原型可以理解为对词表的少量"可学习混合词"，Fig. 3 用 "short
up"、"steady down" 举例：一个 patch 可由这些语言线索组合表示（如 "short up then down
steadily"），而表示始终没有离开 LLM 预训练时的空间。

**怎么做**：用多头交叉注意力，patch 作 query，原型作 key/value。对第 $k$ 个头（$k=1,\\dots,K$）：

$$Q\_k^{(i)}=\\hat X\_P^{(i)}W\_k^Q,\\qquad K\_k^{(i)}=E'W\_k^K,\\qquad
V\_k^{(i)}=E'W\_k^V$$

其中 $W\_k^Q\\in\\mathbb R^{d\_m\\times d}$，$W\_k^K,W\_k^V\\in\\mathbb
R^{D\\times d}$，$d=\\lfloor d\_m/K\\rfloor$。每个头里：

$$Z\_k^{(i)}=\\mathrm{softmax}\!\\left(\\frac{Q\_k^{(i)}K\_k^{(i)\\top}}{\\sqrt{d\_k}}\\right)V\_k^{(i)}$$

论文式 (1) 里的缩放项写作 $\\sqrt{d\_k}$ \[解读：即每个头的维度 $d$\]。各头输出
$Z\_k^{(i)}\\in\\mathbb R^{P\\times d}$ 拼接得 $Z^{(i)}\\in\\mathbb
R^{P\\times d\_m}$，再线性投影到与骨干隐藏维度对齐，得到

$$O^{(i)}\\in\\mathbb R^{P\\times D}$$

直观上，每个 patch 是原型的一个**软选择加权组合**；因为 $V'$ 个原型都是词嵌入空间里的向量，$O^{(i)}$
的每一行就是一个"看起来像词嵌入"的 token。

### Prompt-as-Prefix（PaP）

光靠重编程后的 patch，LLM 并不知道任务是什么、数据来自哪里。PaP 的想法是把这些信息写成自然语言，作为前缀放到 patch
前面（论文 Fig. 4 的示例中，字段为
`[Domain]`、`[Instruction]`、`[Statistics]`）。论文指出有三个关键成分：

| 成分                      | 作用                   | 内容                                                                                   |
| ----------------------- | -------------------- | ------------------------------------------------------------------------------------ |
| 数据集上下文（dataset context） | 提供输入序列的背景（不同领域特征不同）  | 数据集简介，如 ETT 的描述                                                                      |
| 任务指令（task instruction）  | 指导 LLM 如何变换 patch 嵌入 | 如 "Predict the next `<H>` steps given the previous `<T>` steps information attached" |
| 输入统计量（input statistics） | 帮助模式识别与推理            | 最小值、最大值、中位数、整体趋势（上升或下降）、top-5 lags                                                   |

统计量的计算方式（附录 B.1）：趋势取相邻时间步差值之和，大于 0 为上升，否则为下降；top-5 lags 通过 FFT
计算自相关，选相关值最高的五个滞后。这些提示经 LLM 自带的词嵌入层变成 prompt
embeddings，与 $O^{(i)}$ 拼接后送入 LLM。

Fig. 4 的 ETT 示例里，`[Domain]` 写的是 "We usually observe that electricity
consumption peaks at noon, with a significant increase in transformer
load"，`[Statistics]` 里的
`<min_val>`、`<max_val>`、`<median_val>`、`<lag_val>`
等是按输入窗口算出后填入的占位符。\[解读\] LLM
是因果注意力的话，放在前面的提示对后面的 patch token
可见，这大概就是"前缀"的用意；论文的原话只是"提示作为前缀来丰富输入上下文并引导 patch
表示的变换"。

### 输出投影

把 prompt embeddings 与 $O^{(i)}$ 打包送入冻结的 LLM 后，**丢弃前缀部分**，只保留 patch
位置的输出表示 $\\tilde O^{(i)}\\in\\mathbb R^{P\\times D}$；按
PatchTST 的做法展平成长度 $P\\times D$ 的一维向量，再经线性层得到

$$\\hat Y^{(i)}\\in\\mathbb R^{H}$$

> 自拟算术提示：如果 $D=4096$（Llama-7B 的隐藏维度，属常识 \[经验\]），上面示意的 $P=64$，则展平后长度为
> $64\\times4096=262144$，直接接 $H=96$ 的线性层会有
> $262144\\times96=25{,}165{,}824$ 个参数（仅权重，不计偏置），约
> 25M，大于论文效率分析里报告的"重编程网络少于 6.6M
> 可训练参数"（见后），二者矛盾。论文本身没有解释这一点：按 B.1 的字面描述（展平 $P\\times D$
> 再线性投影），输出头就应有上千万参数。\[经验\] 官方仓库 `models/TimeLLM.py` 里，LLM
> 输出在展平前先被截取到前 `d_ff` 维（`dec_out[:, :, :self.d_ff]`），输出头输入维为
> `d_ff * patch_nums`；若取其 ETTh1 脚本中的 `d_ff=128`（读自 main 分支，未运行），则为
> $128\\times64\\times96=786{,}432$（自拟算术，仅权重）。所以论文文字描述的"展平 $P\\times
> D$"与官方实现不完全一致，6.6M 的统计口径也没有说明 \[待核实\]。

## 训练与推理

  - **可训练**：patch embedder、重编程层（含文本原型的线性组合矩阵与注意力投影）、输出投影；**冻结**：LLM
    主干。论文称 Time-LLM 只需一小批时序数据和很少几个 epoch
    就能训练，并可与量化等技术结合以降低显存（这里"很少"是论文的说法；Table
    9 实际设置为 50 或 100 个 epoch）。
  - **损失**：长期预测用 MSE；M4/M3 短期预测用 SMAPE。
  - **默认配置**（论文附录 Table 9）：Adam 优化器；骨干 Llama-7B 全容量 32 层；长期预测文本原型数
    $V'=1000$、短期 $V'=100$；注意力头数 $K=8$；长期预测输入长度 $T=512$，短期 $T=2\\times
    H$。例外：Table 9 中 ILI 一行为 $V'=100$、$T=96$（正文 4.1 节写的是
    $T=512$，两处不一致，论文未解释）。

| 数据集                   | $d\_m$ | 学习率       | Batch size | Epochs |
| --------------------- | ------ | --------- | ---------- | ------ |
| ETTh1 / ETTh2         | 16     | $10^{-3}$ | 16         | 50     |
| ETTm1 / ETTm2         | 16     | $10^{-3}$ | 16         | 100    |
| Weather               | 16     | $10^{-2}$ | 8          | 100    |
| Electricity / Traffic | 16     | $10^{-2}$ | 8          | 100    |
| ILI                   | 16     | $10^{-2}$ | 16         | 50     |
| M3-Quarterly / M4     | 32     | $10^{-4}$ | 32         | 50     |

  - **推理**：对每条通道独立前向，LLM 不生成文本，直接由线性层读出 $H$ 步预测。
  - **实现**：PyTorch，实验在 NVIDIA A100-80G GPU 上进行，每个实验重复三次取平均（论文 B.1）。

## 实验与结论

以下数字均来自论文表格（已对照渲染页）。除非注明，骨干为默认的 Llama-7B；对比实验遵循 Time-Series-Library
的统一评估流程。基线包括 PatchTST、ETSformer、Non-stationary
Transformer、FEDformer、Autoformer、Informer、Reformer、GPT4TS、LLMTime、DLinear、TimesNet、LightTS；短期预测还有
N-HiTS、N-BEATS。

### 长期预测（Table 1）

设置：$T=512$，$H\\in{96,192,336,720}$（ILI 为 ${24,36,48,60}$），表中为四个 horizon
的平均。

| 数据集     | Time-LLM MSE / MAE | GPT4TS        | DLinear       | PatchTST      |
| ------- | ------------------ | ------------- | ------------- | ------------- |
| ETTh1   | 0.408 / 0.423      | 0.465 / 0.455 | 0.422 / 0.437 | 0.413 / 0.430 |
| ETTh2   | 0.334 / 0.383      | 0.381 / 0.412 | 0.431 / 0.446 | 0.330 / 0.379 |
| ETTm1   | 0.329 / 0.372      | 0.388 / 0.403 | 0.357 / 0.378 | 0.351 / 0.380 |
| ETTm2   | 0.251 / 0.313      | 0.284 / 0.339 | 0.267 / 0.333 | 0.255 / 0.315 |
| Weather | 0.225 / 0.257      | 0.237 / 0.270 | 0.248 / 0.300 | 0.225 / 0.264 |
| ECL     | 0.158 / 0.252      | 0.167 / 0.263 | 0.166 / 0.263 | 0.161 / 0.252 |
| Traffic | 0.388 / 0.264      | 0.414 / 0.294 | 0.433 / 0.295 | 0.390 / 0.263 |
| ILI     | 1.435 / 0.801      | 1.925 / 0.903 | 2.169 / 1.041 | 1.443 / 0.797 |

论文文字：平均相对 GPT4TS 提升 12%、相对 TimesNet 提升 20%；相对 PatchTST 平均 MSE 降低 1.4%；相对
DLinear 超过 12%。**从表中看**，与 PatchTST 的差距很小，ETTh2 上 PatchTST 更好，Weather 的
MSE 持平 \[解读\]。

### 短期预测（Table 2，M4）

M4 三行为各采样频率的加权平均。Time-LLM：SMAPE 11.983、MASE 1.595、OWA 0.859；GPT4TS：12.69
/ 1.808 / 0.94；N-HiTS：12.035 / 1.625 / 0.869；PatchTST：12.059 / 1.623 /
0.869。论文称相对 GPT4TS 提升 8.7%，对 SOTA 的 N-HiTS 在 MASE 和 OWA 上仍有竞争力。

### Few-shot 预测（Table 3 / 4）

设置：只用训练集前 10%（或 5%）时间步，遵循 GPT4TS 的 few-shot 设置。表为四个 horizon 平均的 MSE（10%
数据）：

| 数据集     | Time-LLM | GPT4TS | DLinear | PatchTST |
| ------- | -------- | ------ | ------- | -------- |
| ETTh1   | 0.556    | 0.590  | 0.691   | 0.633    |
| ETTh2   | 0.370    | 0.397  | 0.605   | 0.415    |
| ETTm1   | 0.404    | 0.464  | 0.411   | 0.501    |
| ETTm2   | 0.277    | 0.293  | 0.316   | 0.296    |
| Weather | 0.234    | 0.238  | 0.241   | 0.242    |
| ECL     | 0.175    | 0.176  | 0.180   | 0.180    |
| Traffic | 0.429    | 0.440  | 0.447   | 0.430    |

自拟重算：对上表七个数据集的 MSE 取算术平均，Time-LLM 约 0.349，GPT4TS 约 0.371，降幅约 5.9%，与论文的
"5%" 大体相符。论文文字：10% 设置下相对 GPT4TS 平均 MSE 降低 5%，5% 设置下超过 5%；相对
PatchTST、DLinear、TimesNet 在 10% 设置下平均提升超过 8%、12%、33%。

### Zero-shot 预测（Table 5）

设置：在一个 ETT 数据集上训练，在另一个没见过的 ETT 数据集上测试（如 ETTh1 → ETTh2）。MSE：

| 迁移方向          | Time-LLM | GPT4TS | LLMTime | DLinear | PatchTST | TimesNet |
| ------------- | -------- | ------ | ------- | ------- | -------- | -------- |
| ETTh1 → ETTh2 | 0.353    | 0.406  | 0.992   | 0.493   | 0.380    | 0.421    |
| ETTh1 → ETTm2 | 0.273    | 0.325  | 1.867   | 0.415   | 0.314    | 0.327    |
| ETTh2 → ETTh1 | 0.479    | 0.757  | 1.961   | 0.703   | 0.565    | 0.865    |
| ETTh2 → ETTm2 | 0.272    | 0.335  | 1.867   | 0.328   | 0.325    | 0.342    |
| ETTm1 → ETTh2 | 0.381    | 0.433  | 0.992   | 0.464   | 0.439    | 0.457    |
| ETTm1 → ETTm2 | 0.268    | 0.313  | 1.867   | 0.335   | 0.296    | 0.322    |
| ETTm2 → ETTh2 | 0.354    | 0.435  | 0.992   | 0.455   | 0.409    | 0.435    |
| ETTm2 → ETTm1 | 0.414    | 0.769  | 1.933   | 0.649   | 0.568    | 0.769    |

论文文字：相对第二名 MSE 降低超过 14.2%；相对 GPT4TS，10% few-shot、5% few-shot、zero-shot
的整体误差降幅分别为 7.7%、8.4%、22%（注意 §4.3 文字写的是"约 5%"和"超过 5%"，与这里的 7.7%、8.4%
不完全一致，论文未解释口径 \[待核实\]）；相对同为 7B 量级骨干的 LLMTime 改进超过 75%。

### 模型分析（Table 6 / 7，ETTh1 与 ETTm1 的 96/192 步，MSE）

| 变体                         | ETTh1-96 | ETTh1-192 | ETTm1-96 | ETTm1-192 | few-shot ETTh1-96 |
| -------------------------- | -------- | --------- | -------- | --------- | ----------------- |
| A.1 Llama 32 层（默认）         | 0.362    | 0.398     | 0.272    | 0.310     | 0.448             |
| A.2 Llama 前 8 层            | 0.389    | 0.412     | 0.297    | 0.329     | 0.567             |
| A.3 GPT-2（12 层）            | 0.385    | 0.419     | 0.306    | 0.332     | 0.548             |
| B.1 去掉 Patch Reprogramming | 0.410    | 0.412     | 0.310    | 0.342     | 0.498             |
| B.2 去掉 Prompt-as-Prefix    | 0.398    | 0.423     | 0.298    | 0.339     | 0.521             |
| C.1 去掉数据集上下文               | 0.402    | 0.417     | 0.298    | 0.331     | 0.491             |
| C.2 去掉任务指令                 | 0.388    | 0.420     | 0.285    | 0.327     | 0.476             |
| C.3 去掉统计量                  | 0.391    | 0.419     | 0.279    | 0.347     | 0.483             |

注意标号：论文 4.5 节文字把"去掉输入统计量"写作 C.1，而 Table 6 里 C.1 是 w/o Dataset
Context、C.3 是 w/o Statistical Context，两处标号对不上；下面按 Table 6 的名称理解
\[解读\]（自拟粗算：表中八列 MSE 之和，C.3
最大，与"统计量最关键"的说法方向一致）。论文文字结论：骨干容量越大越好（"scaling
law 在重编程后依然成立"）；去掉重编程平均退化 9.2%（few-shot 超过 17%）；去掉 PaP 在常规与 few-shot
上分别退化超过 8% 和 19%；三个提示成分中去掉**输入统计量**伤害最大（平均 MSE 增加
10.2%），数据集上下文和任务指令也有帮助（分别 9.6% 与 7.7% 以上）。附录 F 还称，与用
QLoRA 微调骨干的变体（A.5）相比，重编程平均好 19%。

**重编程可视化（Fig. 5）**：在 ETTh1 上用 100 个文本原型重编程 48 个
patch。论文观察到只有一小部分原型真正参与；不同 patch
由不同的原型组合表示；所挑出的原型对应的词里有描述时序性质的词（如
`periodic`、`seasonal`、`quantile`、`average`）。

**效率（Table 7）**：重编程网络本身（D.3，不含 LLM）可训练参数少于 6.6M，约为 Llama-7B 总参数的
0.2%。ETTh1 预测 96 步：带 Llama(32) 显存 32136 MiB、0.517 s/iter；带 Llama(8) 为
11370 MiB、0.184 s/iter；不带 LLM 为 3678 MiB、0.046 s/iter。整体效率主要受骨干限制。（该表
Llama 行的 Param. 一列为 3404.53 M 与 975.83 M，与"7B"的直觉不一致，论文没有解释，本文不引用
\[待核实\]。）

## 优缺点与局限

**论文自述的优点**：骨干不变、训练轻量；few-shot/zero-shot 表现好；可以通过提示注入领域知识；骨干越大越好。

**论文自述/可见的局限**：

  - 骨干（Llama-7B）的显存和延迟成本高，见上面的效率数字。
  - 结论的论证主要靠与基线的对比和 PaP/重编程消融。\[解读\] 我在正文和附录表里没有看到"去掉 LLM（或换成同规模随机初始化的
    Transformer）后的预测精度"对比；Table 7 的 "w/o LLM" 只比较了参数、显存和速度，不是精度。
  - 数据集集中在 ETT/Weather/ECL/Traffic/ILI/M4 等常见基准；zero-shot 只在 ETT 系列之间迁移。

**论文之外的评价**（与本站综述 [基础模型综述](/0608_ML_Tasks_TimeSeries_Foundation)
的口径一致）：后续的 *Are Language Models Actually Useful for Time
Series Forecasting?*（arXiv:2406.16964）对三种基于 LLM 的预测方法做消融，摘要称移除 LLM
或替换为基本注意力层，预测性能常不下降甚至更好。综述摘录里没有写明那三个方法具体是哪些，是否包括 Time-LLM
我没有核对 \[待核实\]；因此不能把它当作对 Time-LLM 本身的结论。综述的判断是：LLM
作为时序骨干的收益需谨慎看待，更稳妥的价值可能在于文本旁路信息
\[经验\]。

## 与相关方法对比

| 方法                         | 与 LLM 的关系                              | 输入处理                         | 预测方式       |
| -------------------------- | -------------------------------------- | ---------------------------- | ---------- |
| Time-LLM                   | 冻结 LLM；训练输入/输出模块                       | patch → 文本原型重编程，加文本前缀        | 展平 + 线性    |
| GPT4TS（综述中也称 One Fits All） | 微调；论文称其不改动 self-attention 与 FFN 层      | 该论文未详述其输入处理                  | 该论文未详述     |
| LLM4TS                     | 先监督预训练、再任务微调（两阶段微调）                    | 该论文未详述                       | 该论文未详述     |
| LLMTime                    | 不训练，数字文本化后让 LLM 零样本续写（依据本站综述 0608 的描述） | 数字文本化                        | LLM 生成数字文本 |
| PatchTST                   | 无 LLM                                  | patch + channel independence | 展平 + 线性    |

Time-LLM 的输入端结构（RevIN、patching、channel independence、展平线性输出）与 PatchTST
相同，区别是中间多了"重编程 + 冻结 LLM"。其余同系列方法见本站已发布的
PatchTST、DLinear、TimesNet、N-HiTS、N-BEATS 等文章。

## 使用方式

官方代码仓库在论文摘要中给出（见 Reference）。下面只是说明结构的示意代码，未运行验证：

``` python
# 示意代码，未运行验证
class ReprogrammingLayer(nn.Module):
    def __init__(self, d_model, n_heads, d_llm):
        super().__init__()
        self.h, self.dk = n_heads, d_model // n_heads
        self.q = nn.Linear(d_model, self.dk * n_heads)
        self.k = nn.Linear(d_llm, self.dk * n_heads)
        self.v = nn.Linear(d_llm, self.dk * n_heads)
        self.out = nn.Linear(self.dk * n_heads, d_llm)

    def forward(self, patches, prototypes):          # patches: [B,P,d_model]; prototypes: [V',D]
        ...  # softmax(QK^T / sqrt(dk)) V，再拼接各头并线性投影到 d_llm

# prototypes = mapping(word_embeddings.T).T          # 可训练线性层 V -> V'
# x = cat([prompt_embeds, reprogram(patch_embed(patches), prototypes)], dim=1)
# h = frozen_llm(inputs_embeds=x).last_hidden_state[:, prompt_len:]   # 丢弃前缀
# y_hat = head(h.flatten(1))                                          # 展平后线性投影到 H
```

\[经验\] 落地时要注意：7B 骨干的训练/推理成本远高于 PatchTST 这类小模型；提示里的统计量需要按每个输入窗口计算。

## Reference

  - 论文：[Time-LLM: Time Series Forecasting by Reprogramming Large
    Language Models](https://arxiv.org/abs/2310.01728)
  - 官方代码（论文摘要给出）：<https://github.com/KimMeen/Time-LLM>
