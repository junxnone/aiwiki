---
Title | TimesNet
-- | --
Created @ | `2026-11-19T01:28:53Z`
Updated @| `2026-11-19T01:28:53Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/631)

---
# TimesNet

**TimesNet**（Wu, Hu, Liu, Zhou, Wang, Long，清华大学软件学院 / BNRist，ICLR 2023，arXiv:2210.02186）是一个面向**通用时间序列分析**的深度骨干网络。一句话概括：用 FFT 找出序列的若干主周期，把一维序列按每个周期**折叠**成二维张量（一个轴是"周期内变化"，另一个轴是"周期间变化"），再用参数共享的 2D Inception 卷积块在二维张量上同时建模两种变化，最后按周期的幅值权重把各路结果加回一维。

论文把它作为 task-general backbone，在五类任务上做了评测：长期预测、短期预测、填补（imputation）、分类、异常检测。本文是 [时间序列总览](/0603_ML_Tasks_TimeSeries) 与 [深度学习方法](/0606_ML_Tasks_TimeSeries_Deep) 中 TimesNet 一节的展开。

> 标注约定：未标注的内容来自论文原文（含附录）；`[解读]` 是对论文的理解或示意，`[经验]` 是个人经验或常见看法，`[待核实]` 是无法从论文确认的点。文中带数字的小例子是为说明而构造的，不是论文数据（论文自己的案例见"实验"一节的 Figure 7）。

## 解决什么问题

论文关注的是**时间变化（temporal variation）建模**，它被认为是各类时间序列分析任务共同的核心问题。作者对已有骨干的评价（论文引言与相关工作）：

- **RNN 类**：基于马尔可夫假设逐点递推，难以捕捉长期依赖，且串行计算效率低。
- **1D 卷积（TCN）类**：卷积核沿时间轴滑动，受局部性限制，只能建模相邻时间点之间的变化。关于 TCN 本身见 [TCN](/0626_ML_Tasks_TimeSeries_Deep_TCN)。
- **Transformer 类**：用注意力直接在散乱的时间点之间找依赖，但时间依赖被复杂的时间模式深度掩盖，难以可靠找到。
- **MLP 类**：沿时间维用 MLP，把时间依赖编码进固定参数。
- 以上方法都没有考虑"由周期性衍生出的 2D 变化"。

作者的出发点是两个观察：

1. **多周期性（multi-periodicity）**：真实序列常同时存在多个周期。论文举例：天气观测有日变化与年变化，用电量有周变化与季度变化。多个周期叠加、相互作用，让变化难以建模。
2. **每个周期内部有两种变化**：一个时间点的变化既受**邻近时间点**影响（周期内变化，intraperiod-variation，反映周期内的短期模式），也与**相邻周期的同相位点**高度相关（周期间变化，interperiod-variation，反映连续多个周期的长期趋势）。

一维序列很难同时显式表达这两种变化。折叠成 2D 之后，两种变化各占一个轴，并且各自具有"局部性"（相邻的行/列相似），正好适合 2D 卷积处理。作者还指出，对没有明显周期的序列，变化由周期内变化主导，等价于周期长度为无穷大（实际上取到频率 1，见下文）。

## 核心思想：折叠成 2D

### 为什么折叠有用

```
一维序列 (T=12，周期 p=4，共 3 个周期)

  x1 x2 x3 x4 | x5 x6 x7 x8 | x9 x10 x11 x12
    周期 1    |   周期 2    |    周期 3

折叠成 2D（行 = 周期内位置，列 = 第几个周期）

           周期1  周期2  周期3
  相位 1:   x1     x5     x9
  相位 2:   x2     x6     x10
  相位 3:   x3     x7     x11
  相位 4:   x4     x8     x12

  沿列方向（同一个周期内）相邻  -> intraperiod-variation
  沿行方向（不同周期同一相位）相邻 -> interperiod-variation
```

按论文 Figure 1 的约定：每一**列**是一个周期内的时间点，每一**行**是不同周期中处于同一相位的时间点。折叠后，二维卷积核天然同时覆盖"周期内相邻点"和"相邻周期的同相位点"。（论文公式 3 把 `p_i` 与 `f_i` 分别称为转换后 2D 张量的行数与列数，即行数 = 周期长度，列数 = 周期个数，与上图一致。）

### 用 FFT 找周期（公式 1、2）

输入 `X_1D ∈ R^{T×C}`（长度 T、C 个变量）。论文的做法：

```
A = Avg( Amp( FFT(X_1D) ) )                      # A ∈ R^T，对 C 个通道取平均的幅值
{f_1..f_k} = argTopk_{f ∈ {1..[T/2]}} (A)        # 取幅值最大的 k 个频率
p_i = ceil(T / f_i),  i = 1..k                   # 对应的周期长度
```

要点：

- `A_j` 表示频率为 j 的周期基函数的强度，对应的周期长度是 `T/j`。
- 只取 top-k 是考虑频域的稀疏性，并避免无意义高频带来的噪声。
- 由于频域共轭对称，只考虑 `{1, ..., [T/2]}` 的频率。
- `k` 是超参数。论文把整个过程记为 `A, {f}, {p} = Period(X_1D)`。
- 对通道取平均意味着所有变量**共享**同一组周期（论文 Figure 2 说明对所有变量做同样的 reshape，以扩展到多变量）。

### 折叠（公式 3）

```
X_2D^i = Reshape_{p_i, f_i}( Padding(X_1D) ),   i = 1..k       # X_2D^i ∈ R^{p_i × f_i × C}
```

`Padding(·)` 在时间维末尾补零，使长度能被整除（即补到 `p_i × f_i`）。结果是 k 个 2D 张量，对应 k 种不同周期下的 2D 变化。

### 带数字的小例子 [解读]

以下数字为构造，仅用于演示计算过程（论文输入长度在多数任务中为 96，所以这里也取 T=96）。

**例 1：整除，无需补零。** 设输入 `T = 96`，单变量，序列里有一个很强的"每 24 点一圈"的日周期和一个较弱的"每 48 点一圈"的更长周期（设为小时粒度数据，即 2 天）。FFT 之后，频率索引 `f` 与周期的关系为 `p = ceil(96 / f)`：

频率索引 f | 周期 p = ceil(96/f) | 幅值 A_f（构造值） | 是否入选 (k=2)
-- | -- | -- | --
1 | 96 | 0.8 | 否
2 | 48 | 2.0 | 入选（第 2 名）
4 | 24 | 3.0 | 入选（第 1 名）
8 | 12 | 0.5 | 否

于是得到两个 2D 张量：

- `f=4, p=24`：`X_2D^1` 形状 `24 × 4 × C`。每列是一整天（24 个点），共 4 列（4 天）；一行是 4 天里同一小时的值。
- `f=2, p=48`：`X_2D^2` 形状 `48 × 2 × C`。每列 48 个点，共 2 列。

`24×4 = 48×2 = 96 = T`，不需要补零。

**例 2：不整除，需要补零。** 设 `T = 100`，选出 `f = 3`，则 `p = ceil(100/3) = 34`，`34 × 3 = 102`，在序列末尾补 2 个零，折叠成 `34 × 3` 的 2D 张量。2D 卷积处理完、再展平回一维后，用 `Trunc(·)` 把长度 102 截回 100（见公式 5）。

**例 3：自适应聚合的权重。** 若某层选出的三个周期，其幅值为 `A = [3.0, 2.0, 1.0]`，则 softmax 得 `exp(3)/Σ = 20.09/30.20 ≈ 0.665`，`7.39/30.20 ≈ 0.245`，`2.72/30.20 ≈ 0.090`。最终这层的输出是三路一维表示按 `0.665 : 0.245 : 0.090` 的加权和。（真实序列的幅值是未归一化的，量纲可能很大，softmax 的效果因数据而异，此处只演示机制。）

**论文自己的案例（Figure 7，Electricity）**：图中标注了三个被选中的周期，`Frequency=5 / Period=72`、`Frequency=9 / Period=40`、`Frequency=15 / Period=24`，对应的 2D 张量大小分别约为 `72×5`、`40×9`、`24×15`。三者乘积都约为 360，据此可推断该例的序列长度约为 360 [解读，图中未直接给出 T]。

## 模型结构：TimesBlock 与 TimesNet

### 整体

```
 输入 X_1D ∈ R^{T×C}
     |
 Embed  ->  X^0 ∈ R^{T×d_model}
     |
 [TimesBlock] x L 层，每层做残差：  X^l = TimesBlock(X^{l-1}) + X^{l-1}      (公式 4)
     |
 任务相关的输出层（预测 / 填补 / 分类 / 异常检测）
```

### 一个 TimesBlock（公式 5、6）

对第 l 层、输入 `X^{l-1} ∈ R^{T×d_model}`：

```
A^{l-1}, {f}, {p} = Period( X_1D^{l-1} )                       # 对深层特征再做一次 FFT 取周期
X_2D^{l,i}  = Reshape_{p_i,f_i}( Padding(X_1D^{l-1}) )         # i = 1..k，折叠
X^_2D^{l,i} = Inception( X_2D^{l,i} )                          # 2D 卷积（参数共享）
X^_1D^{l,i} = Trunc( Reshape_{1,(p_i×f_i)}( X^_2D^{l,i} ) )    # 展平并截断回长度 T

A^_{f_1}..A^_{f_k} = Softmax( A_{f_1}^{l-1}..A_{f_k}^{l-1} )   # 幅值归一化为权重
X_1D^l = Σ_i  A^_{f_i} × X^_1D^{l,i}                           # 自适应聚合（公式 6）
```

一层 TimesBlock 内的张量形状（按论文符号；`B` 为 batch，论文公式里未写，属 `[解读]`）：

步骤 | 张量 | 形状
-- | -- | --
输入 | `X_1D^{l-1}` | `B × T × d_model`
FFT / 取周期 | `A`、`{f_i}`、`{p_i}` | `A ∈ R^T`，k 个整数频率与周期
折叠（第 i 路） | `X_2D^{l,i}` | `B × p_i × f_i × d_model`（卷积时通道维 = d_model）
Inception 之后 | `X^_2D^{l,i}` | 同上（论文只写了展平回 1D 后截断到长度 T，Inception 前后形状不变是 `[解读]`）
展平并截断 | `X^_1D^{l,i}` | `B × T × d_model`
softmax 聚合 | `X_1D^l` | `B × T × d_model`

即每层输入输出形状相同，因此能直接做残差并堆叠。

### 为什么 2D 卷积能同时建模周期内与周期间变化 [解读]

- 折叠后的张量中，**沿一个轴**（列内）相邻的元素是同一周期里相邻的时间点；**沿另一个轴**（行内）相邻的元素是相邻两个周期里同一相位的点。论文原话是这种变换"带来两种局部性"，所以 2D 核可以直接利用。
- 一个 `3×3` 的核在一次操作里就同时看到"前后相邻时刻"和"前后相邻周期的同一相位"。在一维序列里，要看到"上一个周期同一相位"的点，核必须跨过整整一个周期 p 的距离，普通 1D 小核或需要很深的堆叠/很大的膨胀系数才能做到 `[解读]`。
- **Inception 的作用**：它包含多个不同尺寸的 2D 核并行（论文称"multi-scale 2D kernels"），所以能同时抓住不同尺度的 2D 局部模式（多尺度的周期内、周期间变化）。具体的核尺寸与分支数，论文主文与附录的文字和 Figure 3 渲染图里都没有给出 `[待核实]`。
- 因为每层都对不同的 p 重新折叠，同一个共享的卷积块会在 k 种不同"网格形状"上工作，所以实际上等价于对不同周期学习同一套局部模式提取器；这点是我的理解 `[解读]`，论文只说共享是为了参数效率，使模型大小与 k 无关。

几个设计点：

- **每一层都重新做周期发现与折叠**，作用在深层特征 `X^{l-1}` 上而不是只作用在原始输入。论文消融（Table 9，异常检测）显示"只在原始序列上做一次变换"（Transform raw data）平均 F1 从 85.49% 降到 84.85%。
- **Inception 块**（Szegedy et al., 2015）含多尺度 2D 卷积核，同时覆盖相邻时间点（列方向）与相邻周期（行方向）。论文认为它是视觉里被广泛认可的骨干之一，并强调"参数高效"。具体的卷积核尺寸在正文图中文字提取不清，此处不展开 `[待核实]`。
- **k 个张量共享同一个 Inception 块**：这样模型参数量不随 k 变化。独立参数（Ind）会带来一点提升，但模型大小就与 k 相关（Table 8）。
- **自适应聚合**：幅值反映各周期的相对重要性，因此用 softmax 后的幅值做加权。论文说这一设计受 Autoformer 的 Auto-Correlation 启发。消融（Table 10）：直接求和（Directly-sum）平均 F1 为 84.57%，去掉 softmax 为 85.25%，完整设计为 85.49%。
- **没有明显周期的序列**：论文说模型会学到最显著频率为 1，此时趋势被周期内变化的建模覆盖（相当于一个 `T×1` 的 2D 张量）。论文还报告：把 Autoformer 的深度分解结构加到 TimesNet 上没有进一步提升（Table 9，平均 F1 85.29%，对比 85.49%）。
- **可替换的 2D 骨干**：论文主张只要折叠成了 2D，就可以换成 ResNet、ResNeXt、ConvNeXt、Swin Transformer 等视觉骨干。Table 8（异常检测平均 F1）：ResNet 84.81、ResNeXt 86.34、Swin Transformer 86.11、ConvNeXt 86.89，对比 Inception（共享）85.49、Inception（独立）85.60。论文最终以效率与性能折中选 Inception。

### 任务适配与实现细节

- 论文附录说，为公平比较，所有基线共用同样的输入 embedding 和最终投影层，只比较"基础模型"本身。
- 预测任务：在时间维度上用一个 MLP 得到对未来的初始化预测。
- 采用 Non-stationary Transformer 的 **Series Stationarization** 来缓解分布漂移。
- `d_model` 按输入变量数 C 设定：`min{ max{ 2^⌈log C⌉, d_min }, d_max }`（出自论文 Table 7 脚注，其中 C 为输入变量维数；`d_min`、`d_max` 见下表）。
- 填补、分类、异常检测的输出头的具体结构：论文主文没有细述 `[待核实]`。异常检测用**重构误差**作为所有模型共用的异常判据（见实验）。

五类任务的做法（只列论文明确写出的部分）：

任务 | 做法 | 训练损失 / 评测指标
-- | -- | --
长期预测 | 输入 96（ILI 36）；时间维 MLP 初始化未来，再经 TimesBlock 堆叠；按 Autoformer 基准 | MSE / MSE、MAE
短期预测 | M4，预测长度 6~48 | SMAPE / SMAPE、MASE、OWA
填补 | 在长度 96 的序列上随机遮盖时间点 | MSE / MSE、MAE
分类 | 序列级分类，UEA 10 个数据集 | 交叉熵 / 准确率
异常检测 | 无监督，重构，用重构误差判异常 | MSE / Precision、Recall、F1

填补、分类的具体输出头论文未细述 `[待核实]`。

## 训练与推理

论文附录 Table 7 的配置（所有实验使用 Adam，`β = (0.9, 0.999)`；单张 NVIDIA TITAN RTX 24GB；实验重复三次）：

任务 | k | 层数 | d_min / d_max | 初始学习率 | 损失 | batch size | epoch
-- | -- | -- | -- | -- | -- | -- | --
长期预测 | 5 | 2 | 32 / 512 | 1e-4 | MSE | 32 | 10
短期预测 | 5 | 2 | 16 / 64 | 1e-3 | SMAPE | 16 | 10
填补 | 3 | 2 | 64 / 128 | 1e-3 | MSE | 16 | 10
分类 | 3 | 2 | 32 / 64 | 1e-3 | 交叉熵 | 16 | 30
异常检测 | 3 | 3 | 32 / 128 | 1e-4 | MSE | 128 | 10

各任务的设置：

- **长期预测**：沿用 Autoformer 的基准。输入长度 96（ILI 为 36），预测长度 {96, 192, 336, 720}（ILI 为 {24, 36, 48, 60}），结果对四个预测长度取平均。
- **短期预测**：M4，预测长度在 [6, 48]，指标 SMAPE、MASE、OWA。
- **填补**：长度 96 的序列，随机遮盖 {12.5%, 25%, 37.5%, 50%} 的时间点，结果对四个遮盖比例平均。
- **分类**：UEA 的 10 个多变量数据集，预处理按 Zerveas et al. (2021)。
- **异常检测**：无监督，按 Anomaly Transformer 的预处理用滑窗切成不重叠片段；为公平，所有模型统一用重构误差做异常判据（替换掉 Anomaly Transformer 的联合判据）。

**推理**：就是前向传播：Embed、L 个 TimesBlock、任务输出层。每一层都要做一次 FFT 和 k 次 reshape + 卷积。k 越大计算量越大（论文 Table 11 比较了效率，在 ETTh1 填补任务上记录，论文结论是在前三名中 TimesNet 效率最高，并且对 Transformer 类模型显存占用有优势；具体数字不在此列出）。

**超参敏感性**（附录 B，Figure 8）：论文称 TimesNet 在不同 k 下性能稳定；对预测、异常检测这类低层建模任务，k 的选择影响更大（k 会直接影响深层表示的信息量）；对分类、填补这类需要层次化表示的高层任务，对 k 更鲁棒。

## 实验与结论

以下数字均来自论文，设置见各项说明。

### 总体

论文声称在五类任务上取得"一致的 SOTA（consistent state-of-the-art）"，基线共 15 个以上，包括 LSTM、LSTNet、LSSL、TCN、LightTS、DLinear、Reformer、Informer、Pyraformer、Autoformer、FEDformer、Non-stationary Transformer、ETSformer，以及各任务的专用方法（N-HiTS、N-BEATS、Anomaly Transformer、Rocket、Flowformer 等）。注意"一致"是论文的措辞，下面逐表看会发现并非每个数据集都第一。

### 长期预测（Table 2，四个预测长度平均，MSE / MAE）

数据集 | TimesNet | 论文表中的有力对手
-- | -- | --
ETTm1 | 0.400 / 0.406 | DLinear 0.403 / 0.407
ETTm2 | 0.291 / 0.333 | ETSformer 0.293 / 0.342
ETTh1 | 0.458 / 0.450 | FEDformer 0.440 / 0.460；DLinear 0.456 / 0.452
ETTh2 | 0.414 / 0.427 | FEDformer 0.437 / 0.449
Electricity | 0.192 / 0.295 | Autoformer 0.193 / 0.296
Traffic | 0.620 / 0.336 | FEDformer 0.610 / 0.376
Weather | 0.259 / 0.287 | LightTS 0.261 / 0.312
Exchange | 0.416 / 0.443 | DLinear 0.354 / 0.414
ILI | 2.139 / 0.931 | FEDformer 2.077 / 0.914

论文正文称 TimesNet 在长期预测中"超过 80% 的情形"达到 SOTA（依据完整表 Table 13）。从 Table 2 可见，ETTh1 的 MSE、Traffic 的 MSE、Exchange 和 ILI 上它并不是最好的（对比数字取自上表，表中最优为加粗项）。

### 短期预测（Table 3，M4，加权平均）

模型 | SMAPE | MASE | OWA
-- | -- | -- | --
TimesNet | 11.829 | 1.585 | 0.851
N-HiTS | 11.927 | 1.613 | 0.861
N-BEATS | 11.851 | 1.599 | 0.855
FEDformer | 12.840 | 1.701 | 0.918
DLinear | 13.639 | 2.095 | 1.051

差距在三个专用方法之间很小（SMAPE 差 0.02~0.1）。论文写明 M4 含有 10 万条来自不同来源的序列。N-BEATS、N-HiTS 的方法见同批的文章（只写名字：N-BEATS、N-HiTS）。

### 填补（Table 4，长度 96，四种遮盖比例平均，MSE / MAE）

数据集 | TimesNet | 次优（表中；Stationary 即 Non-stationary Transformer）
-- | -- | --
ETTm1 | 0.027 / 0.107 | Stationary 0.036 / 0.126
ETTm2 | 0.022 / 0.088 | Stationary 0.026 / 0.099
ETTh1 | 0.078 / 0.187 | Stationary 0.094 / 0.201
ETTh2 | 0.049 / 0.146 | Stationary 0.053 / 0.152
Electricity | 0.092 / 0.210 | Stationary 0.100 / 0.218
Weather | 0.030 / 0.054 | Autoformer 0.031 / 0.057

六个数据集 TimesNet 都是最好。

### 分类（UEA 10 个数据集的平均准确率，Figure 5）

TimesNet 73.6%，超过经典方法 Rocket（72.5%）和深度模型 Flowformer（73.0%）。DLinear 只有 67.5%。论文的解释是：DLinear 只在时间维用一层 MLP，适合固定时间依赖的自回归类任务，学高层表示能力会退化；TimesNet 在 2D 空间统一了 2D 变化，便于用 2D 核学层次化表示。

### 异常检测（Table 5，F1 %，重构误差判据）

模型 | SMD | MSL | SMAP | SWaT | PSM | 平均 F1
-- | -- | -- | -- | -- | -- | --
TimesNet (Inception) | 85.12 | 84.18 | 70.85 | 92.10 | 95.21 | 85.49
TimesNet (ResNeXt) | 85.81 | 85.15 | 71.52 | 91.74 | 97.47 | 86.34
FEDformer | 85.08 | 78.57 | 70.76 | 93.19 | 97.23 | 84.97
Autoformer | 85.11 | 79.05 | 71.12 | 92.74 | 93.29 | 84.26
Anomaly Transformer（重构误差判据） | 85.49 | 83.31 | 71.18 | 83.10 | 79.40 | 80.50
Transformer | 79.56 | 78.68 | 69.70 | 80.37 | 76.07 | 76.88

论文的解释是：周期性分析有助于突出违反周期的变化，因此 TimesNet、FEDformer、Autoformer 都表现不错；vanilla attention 计算每对时间点的相似度，容易被占多数的正常点干扰（这是论文的推测）。

### 模型分析与可视化

- **表示分析（Figure 6，CKA）**：预测与异常检测中，更好的性能对应第一层与最后一层表示的 CKA 相似度更高（低层表示）；填补与分类则相反，需要层次化表示。论文说 TimesNet 能为不同任务学习合适的表示，而 FEDformer 在预测和异常检测上好，但学不到层次化表示，所以填补和分类差。
- **2D 变化案例（Figure 7 与附录 D）**：折叠后的 2D 张量结构清晰，列、行分别体现时间点和周期间的局部性；周期间变化能体现长期趋势（附录里 Exchange 的行内数值递减对应下降趋势）。

## 优缺点与局限

**论文自述的优点**：

- 一个统一骨干覆盖五类任务，并在论文所选基准上整体领先。
- 通过 2D 化把时间序列接到视觉骨干生态上，可以换用更强的 2D 骨干继续提升（Table 8）。
- 共享 Inception 块使参数量与 k 无关；论文称相比 Transformer 类模型显存更省。

**论文自述的局限**：结论部分只说未来会探索以 TimesNet 为骨干的大规模预训练，没有专门的局限小节。

**从论文表格可见的现象**：并非所有数据集都最优（见 Table 2 的 ETTh1、Traffic、Exchange、ILI）；k 对预测与异常检测更敏感。

**`[经验]` 常见的看法与使用中需注意的点**（以下不是论文结论）：

- 方法依赖 FFT 抽取周期；周期不稳定、频谱不清晰时，折叠的收益可能有限（论文声称无周期时会退化为频率 1，但这并不保证效果好，论文没有对"强非周期"数据做专门实验）。
- 折叠要求补零到 `p×f`，周期很长而序列较短时补零比例可能较大 `[解读]`。
- 所有变量共享同一组周期（通道平均后取 top-k），变量间周期差异大时不够灵活 `[解读]`。
- 计算量随 k、序列长度、`d_model` 增长，2D 卷积的开销比线性/MLP 类方法大。
- 后来的工作（如 PatchTST、iTransformer 一类）在长期预测基准上常被报告优于 TimesNet `[待核实]`，对预测任务是否选 TimesNet 应在自己数据上与线性基线对比。
- 与 [总览](/0603_ML_Tasks_TimeSeries) 一致：它输出点预测，论文以点预测评测，不提供概率预测。

## 与相关方法对比

方法 | 建模方式 | 对周期的处理 | 与 TimesNet 的区别
-- | -- | -- | --
[TCN](/0626_ML_Tasks_TimeSeries_Deep_TCN) | 1D 因果膨胀卷积 | 隐式，靠感受野 | TimesNet 先折叠成 2D，用 2D 卷积同时看相邻点与相邻周期
Autoformer | 分解 + Auto-Correlation | 学周期做序列级依赖聚合 | TimesNet 同样用幅值做加权（论文称受其启发），但把周期用于折叠 2D 而不是时延聚合；论文还报告加上深度分解无提升
FEDformer | 频域增强 + 分解 | 频域稀疏注意力 / 混合专家分解 | 都用频域，TimesNet 用频域只为找周期
DLinear | 时间维线性层 | 无 | 论文里 DLinear 在部分预测集上很强（如 Exchange），但分类只有 67.5%
PatchTST | 把序列切成 patch 当 token，Transformer 编码，通道独立 | 无显式周期 | `[经验]` 思路是"局部 patch 上的注意力"，TimesNet 是"按周期折叠的 2D 卷积"；TimesNet 论文的基线中没有 PatchTST（参考文献里未见）
[DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR) | 自回归 RNN，概率预测 | 无 | 目标不同：DeepAR 输出分布，TimesNet 是点预测的通用骨干
N-BEATS / N-HiTS | MLP 堆叠，残差 | 无 | 短期预测的专用强基线，论文在 M4 上与它们的差距很小

## 使用方式

论文摘要给出的代码库是 `github.com/thuml/TimesNet`。下面是按论文公式写的**示意代码，未运行验证**，仅用于说明结构，不是官方实现。

```python
# 示意代码，未运行验证
import torch, torch.nn as nn, torch.nn.functional as F

def period(x, k):                     # x: [B, T, d]
    T = x.shape[1]
    amp = torch.fft.rfft(x, dim=1).abs().mean(dim=(0, 2))   # 对通道（及 batch）取平均幅值
    amp[0] = 0                                              # 去掉直流分量，只考虑 f >= 1
    f = torch.topk(amp, k).indices                          # top-k 频率
    p = [-(-T // int(fi)) for fi in f]                      # p = ceil(T / f)
    return p, [int(fi) for fi in f], amp[f]                 # 周期、列数、幅值

class TimesBlock(nn.Module):
    def __init__(self, d, k, inception):
        super().__init__(); self.k, self.inception = k, inception  # 共享同一个 2D 卷积模块
    def forward(self, x):             # x: [B, T, d]
        B, T, d = x.shape
        p, f, amp = period(x, self.k)
        outs = []
        for pi, fi in zip(p, f):
            pad = F.pad(x, (0, 0, 0, pi * fi - T))                  # 补零到 p*f
            x2d = pad.reshape(B, fi, pi, d).permute(0, 3, 2, 1)     # -> [B, d, p, f]
            y = self.inception(x2d).permute(0, 3, 2, 1).reshape(B, -1, d)[:, :T]  # 展平并 Trunc
            outs.append(y)
        w = torch.softmax(amp, dim=0)                               # 幅值 softmax 做权重
        return sum(wi * yi for wi, yi in zip(w, outs)) + x          # 聚合 + 残差
```

实用建议：

- `[经验]` 先用论文 Table 7 的配置作为起点（k 取 3 或 5，层数 2~3），再按数据调整 k 与 `d_model`。
- `[经验]` 把它当作一个可插拔的骨干：换掉输入输出头，就可复用到预测、填补、分类、异常检测。
- `[经验]` 如果序列周期明显、且有一定长度，值得试；否则先用线性模型或简单基线对照。可参考 [深度学习方法](/0606_ML_Tasks_TimeSeries_Deep) 和 [异常检测](/0609_ML_Tasks_TimeSeries_Anomaly) 的选型建议，评估指标见 [指标](/0610_ML_Tasks_TimeSeries_Metrics)。
- 官方仓库的目录结构、依赖与训练脚本用法，此处未核对 `[待核实]`。

## Reference

- 论文：Haixu Wu, Tengge Hu, Yong Liu, Hang Zhou, Jianmin Wang, Mingsheng Long. *TimesNet: Temporal 2D-Variation Modeling for General Time Series Analysis*. ICLR 2023. [arXiv:2210.02186](https://arxiv.org/abs/2210.02186)
- 代码：论文摘要中给出的仓库 [thuml/TimesNet](https://github.com/thuml/TimesNet)（链接来自论文摘要，本文未实际访问核对）
- 站内：[时间序列总览](/0603_ML_Tasks_TimeSeries)、[深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)、[TCN](/0626_ML_Tasks_TimeSeries_Deep_TCN)、[DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR)

