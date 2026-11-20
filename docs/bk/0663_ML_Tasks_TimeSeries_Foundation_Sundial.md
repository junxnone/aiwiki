-----

| Title     | ML Tasks TimeSeries Foundation Sundial                |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-19T03:24:22Z`                                |
| Updated @ | `2026-11-20T08:24:39Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/663) |

-----

# Sundial

Sundial 是清华大学（软件学院、BNRist）团队提出的一族时间序列基础模型，论文题为 "Sundial: A Family of
Highly Capable Time Series Foundation Models"（arXiv:2502.00816，论文首页标注发表于
ICML 2025，PMLR 267）。一句话概括：**Transformer 直接吃连续值
patch，不做离散化，也不预设任何参数化分布；用基于
flow matching 的 TimeFlow Loss 学"下一个
patch（组）的分布"，推理时从高斯噪声出发采样出多条可能的预测，再由样本估计中位数、分位数等统计量。**

它在生成式预测与基础模型两条线上的位置见
[生成式篇](/0607_ML_Tasks_TimeSeries_Generative)（流匹配与连续值生成）和
[基础模型篇](/0608_ML_Tasks_TimeSeries_Foundation)；总览见
[时间序列总览](/0603_ML_Tasks_TimeSeries)。

## 解决什么问题

论文把已有时序基础模型按 "tokenization" 与 "训练目标" 分成三类（Figure 1、Table 6）：

| 类别               | 代表                            | 输入        | 输出分布                            |
| ---------------- | ----------------------------- | --------- | ------------------------------- |
| 连续 token + 参数化分布 | TimesFM、Timer、Time-MoE、Moirai | 连续值       | MSE / 分位数损失（隐含单峰），或混合分布（Moirai） |
| 离散 token + 语言建模  | Chronos、LLMTime               | 离散 token  | 类别分布（交叉熵）                       |
| 连续 token + 生成式建模 | Sundial                       | 连续值 patch | 不预设先验，流匹配采样                     |

表中：「类别」是已有基础模型的三类，「代表」是典型模型，「输入」「输出分布」说明其输入表示与输出分布假设。Sundial 属于第三类：连续
patch 输入加生成式建模，不预设分布先验。

论文指出的具体问题：

  - **mode collapse 与过平滑**：时序数据异质性强，相似的回看窗口可能对应截然不同的未来（语义不稳定）。论文称 MSE
    目标预先设定了单峰预测分布，过平滑是因为结果对该损失而言是全局最优的；`[解读]` 即 MSE
    的最优解是条件均值，预训练规模一大就学成"平均曲线"（论文 Figure
    14-15 做了与 Sundial 同骨干的 MSE 预训练模型对比）；
  - **混合分布仍是先验**：Moirai 学混合分布，但先验仍可能容纳不了复杂分布；
  - **离散化的代价**：Chronos 按时间点量化，论文认为会带来词表外问题、预测区间粒度粗、上下文很长，最终性能对量化方式敏感；
  - **多数基础模型不"生成"**：不能给出预测置信度，限制决策可靠性。

Sundial 的取向：输入保持"原生"（连续值），分布保持"灵活"（不指定先验），借鉴图像生成里 flow matching
的做法。论文也比较过扩散（Li et al. 2024 的 diffusion loss 做法），选
flow matching 的理由是框架更简单、更高效（论文原话 "simple yet effective"）。

## 整体结构

下图概括 Sundial 的整体计算流程。

    原始序列 -> Re-Norm -> PatchEmbed -> [Pre-LN -> 因果自注意力(RoPE; FlashAttn, KV Cache) -> Pre-LN -> FFN] x N 层
                                                             |
                                                     位置 i 的表示 h_i
                                                             |
              训练: 带噪未来 y_i^(t), 时间 t, 条件 h_i --> FM-Net --> 速度, 回归 (y_i - y_i^(0))
              推理: 高斯噪声 y_i^(0) --K 步 Euler 推进--> 预测样本 y_i^(1)

图中：原始序列经 Re-Norm 与 PatchEmbed 变成 patch token，进入 $N$ 层
Transformer（Pre-LN、带 RoPE 的因果自注意力、FFN），每个位置得到表示 $h\_i$；训练时 FM-Net
以带噪未来、时间与 $h\_i$ 为输入回归速度；推理时从高斯噪声出发，$K$ 步 Euler 推进得到预测样本。

本文数字取自 arXiv 最新版（v4）PDF 的表格与渲染页。三部分：tokenization（re-normalization +
patch embedding）、decoder-only Transformer、TimeFlow Loss。论文还把它直观地类比为一种
ARMA 式深度模型：Transformer 自回归地学 token 表示，TimeFlow
在回看表示的条件下把随机噪声变换成非确定的预测。这是论文自己的比喻，不是严格等价。

### Tokenization

**Re-Normalization**：采用 stationarization（Non-stationary Transformers
提出的、在每个样本内做的非参数两阶段实例归一化），用来缓解时间分布漂移与输入离群值范围，提升零样本泛化。另外预训练前还对每个变量单独归一化以统一数值范围。

**Patch Embedding**：序列 $X={x\_1,\\dots,x\_T}$ 切成长度 $P$ 的 patch $\\mathbf
x\_i = x\_{1+(i-1)P:iP}$。长度不能整除时在**序列开头**补位，并为每个 patch 配一个二值 mask
$\\mathbf m\_i\\in\\mathbb R^P$ 标记补位位置。共 $N=\\lceil T/P\\rceil$ 个输入
token。一个所有 patch 共享的 MLP $\\mathbb R^{2P}\\to\\mathbb R^{D}$ 完成嵌入：

$$\\mathbf h\_i=\\mathrm{PatchEmbed}\\big(\\mathrm{Concat}(\\mathbf
x\_i,\\mathbf m\_i)\\big)$$

其中：$\\mathbf x\_i$ 是第 $i$ 个 patch；$\\mathbf m\_i$ 是标记补位的二值
mask；$\\mathrm{Concat}$ 把二者拼接（长度 $2P$）；$\\mathrm{PatchEmbed}$ 是所有
patch 共享的 MLP，把它映射到 $D$ 维；$\\mathbf h\_i$ 是输入 token 表示。

与 Chronos 的逐点量化相比，patch 保留原始数值，同时让 Transformer 的上下文 token 数缩短为约 $1/P$。

自拟示意例子（非论文数值）：$P=16$，$T=100$ 时 $N=\\lceil
100/16\\rceil=7$，$7\\times16=112$，开头补 $112-100=12$ 个位置，第一个 patch 的
mask 前 12 位为补位标记；$T=2880$ 时 $N=2880/16=180$ 个 token。

### Transformer 骨干

decoder-only，只做少量"朴素"改动，论文强调这些在时序基础模型里常被忽略：

  - **Pre-LN**：提升预训练稳定性；
  - **RoPE** 因果自注意力：为 patch token 引入位置信息；
  - **FlashAttention** 与 **KV Cache**：降低训练/推理开销，利于长上下文实时推理。

$$\\mathcal A\_{ij}=\\mathbf h\_i^\\top \\mathbf W\_{\\mathbf q}\\mathbf
R\_{\\Theta,i-j}\\mathbf W\_{\\mathbf k}^\\top \\mathbf h\_j,\\qquad
\\mathrm{Attention}(\\mathbf
H)=\\mathrm{Softmax}\\Big(\\frac{\\mathrm{Mask}(\\mathcal A)}{\\sqrt
d}\\Big)\\mathbf H\\mathbf W\_{\\mathbf v}$$

其中：$\\mathcal A\_{ij}$ 是位置 $i$ 对位置 $j$ 的注意力得分；$\\mathbf h\_i$ 是 patch
表示；$\\mathbf W\_{\\mathbf q},\\mathbf W\_{\\mathbf k},\\mathbf
W\_{\\mathbf v}$ 是查询、键、值投影；$\\mathbf R\_{\\Theta,i-j}$ 是 RoPE
旋转矩阵，只依赖相对位置 $i-j$；$\\mathrm{Mask}$ 是因果掩码；$d$
是投影维度。

其中 $\\mathbf W\_{\\mathbf q},\\mathbf W\_{\\mathbf k},\\mathbf
W\_{\\mathbf v}\\in\\mathbb R^{D\\times d}$，$\\mathbf
R\_{\\Theta,t}\\in\\mathbb R^{d\\times d}$ 是旋转角为 $t\\cdot\\Theta$ 的旋转矩阵。

### TimeFlow Loss

**1. Flow matching 回顾。** Flow matching 用时间相关的速度场 $u\_t$（ODE
$\\frac{\\mathrm d}{\\mathrm dt}\\psi\_t(\\mathbf
x)=u\_t(\\psi\_t(\\mathbf x))$）把源分布 $p\_0$ 的样本连续地搬运到目标分布 $p\_1$。用网络
$u^\\theta\_t$ 回归速度场即可。取条件最优传输（线性）路径与高斯源，训练目标简化为（论文式 (1)）：

$$\\mathcal L^{\\mathrm{Gauss}}*{\\mathrm{CFM}}(\\theta)=\\mathbb
E*{t,\\epsilon,\\mathbf x\_1}\\big|u^\\theta\_t(\\mathbf x\_t)-(\\mathbf
x\_1-\\mathbf x\_0)\\big|^2,\\qquad \\mathbf x\_t=t\\mathbf
x\_1+(1-t)\\epsilon$$

其中：$\\mathcal L^{\\mathrm{Gauss}}\_{\\mathrm{CFM}}$
是条件流匹配损失；$u^\\theta\_t$ 是网络预测的速度；$\\mathbf x\_1$
是真实数据；$\\mathbf x\_0$ 与 $\\epsilon$ 是同一个高斯噪声；$\\mathbf x\_t$
是 $t$ 时刻线性路径上的点；$(\\mathbf x\_1-\\mathbf x\_0)$
是该路径的恒定速度；$t\\sim\\mathcal U\[0,1\]$。

其中 $t\\sim\\mathcal U\[0,1\]$（论文式 (1) 的目标里写 $\\mathbf x\_0$、路径里写
$\\epsilon$，指同一个高斯噪声，符号混用）。直觉 `[解读]`：线性路径上点的速度恒为"终点减起点"，所以网络只需学会"在带噪点
$\\mathbf x\_t$、时刻 $t$ 处，该往哪个方向走"。采样时对速度做 Euler 积分（论文式 (2)）：

$$\\mathbf x\_{t+\\Delta t}-\\mathbf x\_t=u^\\theta\_t(\\mathbf
x\_t)\\Delta t,\\qquad \\mathbf x\_0\\sim\\mathcal N(\\mathbf 0,\\mathbf
I),\\ t\\in\[0,1\]$$

其中：$\\mathbf x\_t$ 是流在时刻 $t$ 的点；$u^\\theta\_t$ 是学到的速度场；$\\Delta t$
是步长（$\\Delta t=1/K$）；$\\mathbf x\_0\\sim\\mathcal N(\\mathbf
0,\\mathbf I)$ 是起点高斯噪声；沿速度做 Euler 积分到 $t=1$ 得到一个预测样本。

**2. 多 patch 预测。** 位置 $i$ 的输出不是下一个长 $P$ 的 patch，而是其后 $F$ 个点 $\\mathbf
y\_i=x\_{1+iP:F+iP}$，且 $F\>P$。动机（论文）：引用 TimesFM 的经验，较大的 patch 对
decoder-only 更好，而小的输入 patch 更能适应不同频率的数据；多 patch 预测还能减少自回归推理步数。

**3. TimeFlow Loss。** 把条件 flow matching 搬到自回归框架：对位置 $i$，以骨干最后一层表示
$\\mathbf h\_i$ 为条件（论文式 (6)）：

$$\\mathcal L(\\theta,\\mathbf h\_i)=\\mathbb E\_{t,\\epsilon,\\mathbf
y\_i}\\Big|u^\\theta\_t\\big(\\mathbf y\_i^{(t)}\\mid\\mathbf
h\_i\\big)-\\big(\\mathbf y\_i-\\mathbf y\_i^{(0)}\\big)\\Big|^2$$

其中 $\\mathbf y\_i\\in\\mathbb R^F$ 是真值，$\\mathbf
y\_i^{(0)}\\sim\\mathcal N(\\mathbf 0,\\mathbf I)$ 是 $F$
维高斯噪声，$t\\sim\\mathcal U\[0,1\]$，$\\mathbf
y\_i^{(t)}=t,\\mathbf y\_i+(1-t),\\mathbf y\_i^{(0)}$。速度网络是一个小 MLP（式
(7)）：

$$u^\\theta\_t\\big(\\mathbf y\_i^{(t)}\\mid\\mathbf
h\_i\\big)=\\mathrm{FM\\text{-}Net}\\big(\\mathbf y\_i^{(t)},t,\\mathbf
h\_i\\big)$$

其中：$u^\\theta\_t$ 是速度网络；$\\mathbf y\_i^{(t)}$ 是时刻 $t$ 的加噪点；$t$
是流时间；$\\mathbf h\_i$ 是条件（通过 AdaLN
注入）；$\\mathrm{FM\\text{-}Net}$ 是由 MLP 实现的速度预测器。

训练时对真值加噪得到 $\\mathbf y\_i^{(t)}$，与 $t$ 一同输入；条件 $\\mathbf h\_i$ 通过
**AdaLN**（Peebles & Xie 2023）注入。对所有 $N$ 个位置求和得到总损失（式 (8)）：

$$\\mathcal
L\_{\\mathrm{TimeFlow}}=\\sum\_{i=1}^{N}\\Big|\\mathrm{FM\\text{-}Net}\\big(\\mathbf
y\_i^{(t)},t,\\mathbf h\_i\\big)-\\big(\\mathbf y\_i-\\mathbf
y\_i^{(0)}\\big)\\Big|^2$$

其中：$\\mathcal L\_{\\mathrm{TimeFlow}}$ 是总损失；$N$ 是位置个数；$\\mathbf h\_i$
是位置 $i$ 的 Transformer 表示（条件）；$\\mathbf y\_i$ 是未来真值，$\\mathbf
y\_i^{(0)}$ 是高斯噪声，$\\mathbf y\_i^{(t)}$ 是在时刻 $t$
的加噪点；$\\mathrm{FM\\text{-}Net}$ 是预测速度的小 MLP；目标速度为 $\\mathbf
y\_i-\\mathbf y\_i^{(0)}$。

要点：

  - 论文强调：$\\mathbf h\_i$ 是位置 $i$ 的条件，在整个流 $t\\in\[0,1\]$
    内保持不变；它不同于条件路径里的条件（$\\mathbf
    x\_1$）和条件源分布；
  - 骨干与 FM-Net 联合训练；FM-Net 很小（Table 5：隐藏维 $D\_{tf}$ 与 Transformer 相同，层数
    3 或 6），`[解读]` 因此"生成"的额外开销主要在采样时 $K$ 次小 MLP 前向；
  - 与 MSE 的关系 `[解读]`：MSE 学的是 $\\mathbf h\_i\\mapsto$ 条件均值；TimeFlow
    学的是整个条件分布，对同一个 $\\mathbf h\_i$ 可以给出不同的未来。

**4. 推理采样。** $K$ 步均匀轨迹，$\\Delta t=1/K$（论文式 (9) 与 Algorithm 1；实验中 $K=50$
固定）：

    y ~ N(0, I)                      # F 维初始噪声（论文记作 hat y_i）
    for k in 0 .. K-1:
        y = y + FM-Net(y, k*dt, h_i) * dt
    return y                         # 一个预测样本

用不同初始噪声重复，得到一组样本，再估计中位数与分位数。论文实现了高效的重复采样：回看序列的表示 $\\mathbf h\_i$
由骨干算一次，共享给所有噪声，避免重复跑 Transformer。

## 训练与推理流程

数据与训练：

  - **TimeBench**：论文称超过一万亿时间点（Table 4 合计 1032B）。绝大部分是真实数据，合成数据仅 0.05%（按
    Chronos 的 KernelSynth 生成，为增加模式多样性）。来源含 Chronos
    数据集（94B）、LOTSA（230B）、ECG（48B）、金融（10.5B）、IoT（5.8B），以及大量
    ERA5 气象再分析数据（3h 129B、12h 32B、日频 406B
    等六种频率，论文给出的理由是天气系统的可预测性）。论文做了缺失值插补、异常剔除、归一化与非平稳性/可预测性/季节性统计，并排除所有评测集以保证零样本；
  - **单变量预训练**：多变量数据按 S3 格式（Timer 的做法）拆成单变量；训练样本长度可变，最大上下文
    2880；各领域数据按预设比例采样；
  - 设施：PyTorch，32 张 NVIDIA A100，AdamW。

模型规模（Table 5），三者 patch 长 $P=16$、上下文 $T=2880$：

| 模型            | 层数 $L$ | $(D,D\_{ff})$ | 头数 | TimeFlow $(D\_{tf},L\_{tf})$ | 参数量  |
| ------------- | ------ | ------------- | -- | ---------------------------- | ---- |
| Sundial Small | 6      | (512, 2048)   | 8  | (512, 3)                     | 32M  |
| Sundial Base  | 12     | (768, 3072)   | 12 | (768, 3)                     | 128M |
| Sundial Large | 24     | (1024, 4096)  | 16 | (1024, 6)                    | 444M |

表中：「模型」是三种规模，其余列是 Transformer 层数
$L$、$(D,D\_{ff})$（模型维度与前馈维度）、头数、TimeFlow
网络的 $(D\_{tf},L\_{tf})$ 与参数量（M 为百万）。三者 patch 长 $P=16$、上下文 $T=2880$。

预测长度 $F$：FEV（短期任务）训练 $F=16$ 的版本；TSLib 点预测与 GIFT-Eval（预测长度 6 到 900）训练
$F=720$ 的版本。所需预测更短则截断输出，更长则滚动预测。自拟算术示意：$F=720$、$P=16$ 时一次输出覆盖
$720/16=45$ 个 patch 的跨度。

推理时：评测中 FEV 采 20 条样本，GIFT-Eval 采 100 条（分别与 Chronos、Moirai 的评测设置一致），采样步数
$K=50$。

## 实验结果

以下数字来自论文表格（已对照渲染页）。

### 零样本点预测（TSLib，Table 1）

MSE / MAE，四个预测长度（96/192/336/720）平均，上下文 2880；Time-MoE 数字来自其官方报告：

| 数据集     | Sundial Small | Sundial Base  | Sundial Large | Time-MoE Ultra | Moirai Large  | Chronos Large |
| ------- | ------------- | ------------- | ------------- | -------------- | ------------- | ------------- |
| ETTm1   | 0.354 / 0.388 | 0.336 / 0.377 | 0.331 / 0.369 | 0.356 / 0.391  | 0.422 / 0.391 | 0.555 / 0.465 |
| ETTm2   | 0.265 / 0.324 | 0.258 / 0.320 | 0.254 / 0.315 | 0.288 / 0.344  | 0.329 / 0.343 | 0.295 / 0.338 |
| ETTh1   | 0.390 / 0.418 | 0.411 / 0.434 | 0.395 / 0.420 | 0.412 / 0.426  | 0.480 / 0.439 | 0.588 / 0.466 |
| ETTh2   | 0.340 / 0.387 | 0.333 / 0.387 | 0.334 / 0.387 | 0.371 / 0.399  | 0.367 / 0.377 | 0.455 / 0.427 |
| ECL     | 0.169 / 0.265 | 0.169 / 0.265 | 0.166 / 0.262 | \-             | 0.186 / 0.270 | 0.204 / 0.273 |
| Weather | 0.233 / 0.271 | 0.234 / 0.270 | 0.238 / 0.275 | 0.256 / 0.288  | 0.264 / 0.273 | 0.279 / 0.306 |

表中：「数据集」是评测集，其余各列是各模型四个预测长度平均的 MSE /
MAE（越小越好，"-"表示该数据集在对应模型的预训练集中）。结论：Sundial
总体优于 Time-MoE、Moirai、Chronos，但并非逐项最优或逐项随规模单调。

（"-" 表示该数据集在对应模型的预训练集中，不评测。）论文称与此前最好的 Time-MoE 相比，Sundial 系列用更少参数取得平均
MSE 下降 7.57%、平均 MAE 下降 4.71%。同表可见 Sundial 并非每个数据集都最优（如 ETTh1 的 MSE 最优是
Small 的 0.390，ETTh1 上 Base 反而比 Small 差），`[解读]` 随规模增大总体变好但并不逐项单调（如
ETTh2、Weather 上 Large 不优于 Base）。

### 概率预测

**GIFT-Eval**（23 个数据集，97 个配置；100 条生成样本；Table 2，基线数字由 GIFT-Eval 官方报告）：

| 模型               | MASE  | CRPS  | Rank   |
| ---------------- | ----- | ----- | ------ |
| Sundial          | 0.673 | 0.472 | 9.062  |
| TimesFM          | 0.680 | 0.465 | 8.237  |
| TabPFN           | 0.748 | 0.480 | 8.268  |
| Chronos          | 0.786 | 0.551 | 14.309 |
| Moirai           | 0.809 | 0.515 | 10.175 |
| PatchTST（监督）     | 0.762 | 0.496 | 10.052 |
| iTransformer（监督） | 0.802 | 0.524 | 11.320 |

表中：「模型」是对比方法，MASE 与 CRPS 越小越好，Rank 是平均排名（越小越好）。结论：Sundial 的 MASE
在监督与基础模型中第一、CRPS 第二；按 Rank 看 TimesFM 与 TabPFN 更靠前。

论文的结论：在监督模型与基础模型中，Sundial 的 MASE 第一、CRPS 第二；按 Rank 看 TimesFM 与 TabPFN
更靠前（此点论文正文未强调，数字见上表）。

**FEV 排行榜**（27 个数据集，20 条样本，Figure 4）：Sundial (Base) 的 Agg. Relative WQL
为 0.694、MASE 为 0.834；论文称其零样本表现超过 70%
的统计方法与同分布监督训练的深度模型，在零样本预训练模型中排第二，次于
Chronos (Base)（0.662 / 0.832）；推理速度相对 Chronos 约 35 倍（Figure 5），接近
N-BEATS。

### 消融与分析

  - **训练目标（Table 3，同骨干、同预训练规模，TSLib 平均 MSE）**：TimeFlow 0.290，Diffusion
    0.314，MSE 0.296。论文称扩散目标明显差于 TimeFlow；MSE 目标只能输出单条预测。
  - **概率指标 CRPS（Table 7）**：GIFT-Eval 上 TimeFlow 0.5050，Diffusion
    0.5340，MSE 0.6420。论文据此说 TimeFlow 的预测分布更连贯、更多样、缓解 mode collapse。
  - **规模（Figure 6、Table 1）**：Large 相对 Small 收敛训练损失下降 15.38%；下游随规模总体改善。
  - **数据规模（Table 8，TSLib 平均 MSE）**：Sundial 在 94B / 230B / 1032B
    时间点上预训练，如 ETTm1 MSE 为 0.367 / 0.352 / 0.336，ECL 为
    0.172 / 0.171 / 0.169；论文称同样的预训练数据子集下，Sundial 优于对应的 Chronos（94B）和
    Moirai（230B）。
  - **测试时校准（Figure 7，FEV）**：样本数从 10 增到 100，MASE 0.851 降到 0.830，WQL 0.718
    降到 0.687；采样步数从 5 增到 50，MASE 0.842 降到 0.834，WQL 0.712 降到 0.694。论文称在
    CPU 上，20 条样本、每条 50 步约一秒。
  - **模型适配（Figure 8，FEV）**：在 FEV 全部数据上一次性微调 Sundial (Base)，MASE/WQL
    从零样本的 0.834/0.694 变为 0.821/0.675，从头训练则为 1.091/0.910。
  - **架构消融（Figure 9）**：RoPE、Pre-LN 带来更好零样本表现（Post-LN
    可能有害）；FlashAttention + KV Cache 在不影响性能下，论文称降低 14.8%
    内存占用与 43.6% 推理时间。
  - **回看长度（Figure 10）**：评测了 480 到 2880；论文认为合适的回看长度取决于任务，需按预测长度与周期调节。

## 优缺点与局限

论文自述的局限（Appendix E）：

  - 仍可能出现幻觉；
  - TimeBench 以中低频数据为主，**极高频数据上的表现无保证**；
  - 单变量预训练，不能显式利用变量间相关或协变量；
  - 只采用了朴素的"从高斯噪声起采样"策略，采样与后处理有改进空间；
  - 多步自回归仍可能导致过平滑、不可靠。

`[经验]` 使用时需注意：生成式预测需要采多条样本才有分布信息，计算量比一次前向的确定性模型高（论文已给出 CPU
约一秒的量级）；样本数与步数 $K$ 是需要自己调的精度/时延旋钮；GIFT-Eval
上 Sundial 并非所有指标第一（CRPS、Rank 次于 TimesFM），FEV 上次于 Chronos。

## 与相关方法对比

| 方法                         | tokenization | 分布/损失                   | 概率输出                                      | 说明                |
| -------------------------- | ------------ | ----------------------- | ----------------------------------------- | ----------------- |
| Sundial                    | 连续 patch     | TimeFlow（flow matching） | 是，采样                                      | 多 patch 输出 $F\>P$ |
| Chronos                    | 逐点离散量化       | 交叉熵                     | 是                                         | 词表量化，上下文长         |
| Moirai                     | 连续 patch     | 混合分布                    | 是                                         | 参数化先验             |
| TimesFM / Timer / Time-MoE | 连续           | MSE / 分位数               | Table 6 标注 TimesFM、Timer-XL、Time-MoE 为非概率 | 确定性点预测            |

表中：「方法」是对比对象，「tokenization」说明输入表示，「分布/损失」说明训练目标，「概率输出」说明是否支持概率预测，「说明」给出补充。结论：Sundial
以连续 patch 输入加 flow matching 生成式目标，不预设分布先验。

这里的 Table 6 判断（Probabilistic = True/False）是论文自己的口径。与相邻方法的区别
`[解读]`：论文相关工作提到的 TimeGrad、CSDI
一类扩散方法多是任务专用的预测或生成器，Sundial
是预训练基础模型；DeepAR：DeepAR 每步输出参数化分布的参数；Sundial 把分布族的假设换成一个生成头。

## 使用方式

论文称模型已发布在 HuggingFace（thuml/sundial-base-128m），代码在
github.com/thuml/Sundial。下面是示意代码，`generate` 的接口与参数名为 `[待核实]`（以官方仓库为准）：

``` python
# 示意代码，未运行验证
import torch
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained("thuml/sundial-base-128m", trust_remote_code=True)
context = torch.randn(1, 2880)                       # 回看序列
samples = model.generate(context, max_new_tokens=96, num_samples=20)   # 参数名 [待核实]
median = samples.median(dim=1).values
```

## Reference

  - Yong Liu, Guo Qin, Zhiyuan Shi, Zhi Chen, Caiyin Yang, Xiangdong
    Huang, Jianmin Wang, Mingsheng Long. [Sundial: A Family of Highly
    Capable Time Series Foundation Models,
    arXiv:2502.00816](https://arxiv.org/abs/2502.00816)（ICML 2025，PMLR
    267）
  - 代码：<https://github.com/thuml/Sundial>（论文摘要给出）
  - 模型：<https://huggingface.co/thuml/sundial-base-128m>（论文脚注给出）
