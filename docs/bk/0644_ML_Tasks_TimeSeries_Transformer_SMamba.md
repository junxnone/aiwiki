-----

| Title     | ML Tasks TimeSeries Transformer SMamba                |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-19T02:27:26Z`                                |
| Updated @ | `2026-11-19T06:17:25Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/644) |

-----

# S-Mamba

S-Mamba（Simple-Mamba）出自论文 *Is Mamba Effective for Time Series
Forecasting?*（arXiv:2403.11144，Zihan Wang 等，东北大学），是把 Mamba
引入多变量时间序列预测的一个简单模型。一句话概括：沿用 iTransformer
的"每个变量一个 token"的做法，把其中用来建模**变量间相关**的自注意力换成**双向 Mamba**，**时间依赖**仍交给
FFN，最后线性投影得到预测。

论文同时是一篇"探索性"工作：除了提出模型，还用大量实验回答"Mamba 在时序预测里到底行不行"，包括变量顺序是否影响结果、能否替换
Transformer 的编码器、能否随回看窗口变长而受益、能否泛化到未见变量。本文依据 arXiv v3（2024-04）撰写，PDF 页眉为
"Preprint submitted to Elsevier"，是否已正式发表 \[待核实\]。综述里对 S-Mamba 的简述见
[时序深度模型](/0606_ML_Tasks_TimeSeries_Deep)。

## Mamba 原理（简述）

Mamba 是一种选择性状态空间模型（selective SSM）。普通 SSM 用线性递推 $h\_t=\\bar A
h\_{t-1}+\\bar B x\_t,\\ y\_t=Ch\_t$ 处理序列，复杂度对序列长度近似线性。Mamba 的改动有两点：一是让
$\\Delta,B,C$
依赖当前输入（"选择性"），使状态更新能按内容决定记住还是忽略；二是用硬件感知的并行算法实现这个"输入相关"的递推。Mamba
本身的细节另有文章，这里只需要记住两点：

  - 它是\*\*单向（因果）\*\*扫描，位置 $t$ 的输出只依赖 $t$ 之前的输入；
  - 计算量随序列长度近似线性增长，而自注意力是平方增长。

这两点正是 S-Mamba 设计的出发点：把"序列"换成"变量序列"，用近线性代价做变量间的信息交互，并用两个方向的 Mamba 弥补单向性。

## 动机

论文的论证链条如下：

  - 时序数据含有两类模式：**时间依赖（temporal dependency,
    TD）**，如交通流的早晚高峰；**变量间相关（inter-variate
    correlation, VC）**，如气象中温度与湿度的相关。
  - Transformer 擅长抓这两类模式，但注意力复杂度是
    $O(N^2)$，变量数或回看长度增大时开销剧增。许多工作只让注意力关注序列的一部分，论文认为这会带来信息损失。
  - 线性模型（DLinear 等）复杂度线性，但只有线性数值计算、不含上下文信息，论文认为不及 SOTA Transformer。
  - Mamba 有选择机制（能像注意力一样辨别有价值的信息）又是近线性复杂度，因此作者想检验它在时序预测中的潜力。

## 结构

### 问题设定

论文的记号：历史序列 $U\_{in}\\in\\mathbb R^{L\\times V}$，$L$ 为回看窗口长度，$V$ 为变量数；预测

$$U\_{out}\\in\\mathbb R^{T\\times V}$$

$T$ 为预测步长。

### 整体流程

S-Mamba 由四层组成：

    输入 [B, L, V]
      │ 转置 → [B, V, L]
      ▼
    Linear Tokenization       每个变量一个 token：[B, V, D]
      ▼
    ┌─ 重复 N 层 ─────────────────────────────────────────┐
    │ Mamba VC Encoding Layer                              │
    │    正向 Mamba block ──┐                              │
    │    反向 Mamba block ──┴─ 相加 ─ 残差(+U)             │
    │ FFN TD Encoding Layer                                │
    │    LayerNorm → Feed-Forward → LayerNorm              │
    └──────────────────────────────────────────────────────┘
      ▼
    Projection（线性 D → T）→ 转置 → [B, T, V]

其中 $B$ 为 batch 大小，$D$ 为隐藏维度，$N$ 为堆叠层数（论文 Algorithm 2 中的 Mamba Layers）。这与
iTransformer 的骨架几乎一致，唯一的结构差异是 VC 编码层。

### 1\. Linear Tokenization

把每个变量完整的 $L$ 步历史当成一个整体，用一个线性层映射为 $D$ 维 token（论文 Eq. 3）：

$$U=\\mathrm{Linear}\\big(U\_{in}^{\\top}\\big)\\in\\mathbb R^{B\\times
V\\times D}$$

这样"序列长度"变成了变量数 $V$，后面 Mamba 扫描的是**变量序列**而不是时间序列。论文明确说这一步"与 iTransformer
类似"。

### 2\. Mamba VC Encoding Layer

Mamba 单向扫描，只能看到排在前面的变量，无法像注意力那样看到全部变量。论文用两个 Mamba block 组成双向层（论文 Eq.
4），再相加并接残差：

$$\\overrightarrow Y=\\overrightarrow{\\mathrm{MambaBlock}}(U),\\qquad
\\overleftarrow Y=\\overleftarrow{\\mathrm{MambaBlock}}(U)$$

$$Y=\\overrightarrow Y+\\overleftarrow Y,\\qquad U'=Y+U$$

论文用箭头区分两个方向的 block，图 3 中标为 "Mamba" 与 "Mamba (reversed)"。\[解读\] 反向 block
即沿变量维度反向扫描，下文示意代码用翻转变量维度来实现，论文正文没有给出实现细节。

Mamba block 内部（论文 Algorithm 1，这里输入记作 $X$、输出记作 $O$，以免与上面的 $Y$ 混淆）：

$$ \\begin{aligned} x,,z &= \\mathrm{Linear}(X)\\quad\\text{（隐藏维度扩张为 }
ED\\text{）}\\ x' &= \\mathrm{SiLU}\\big(\\mathrm{Conv1D}(x)\\big)\\ B,,C
&= \\mathrm{Linear}(x'),\\ \\mathrm{Linear}(x')\\ \\Delta &=
\\mathrm{Softplus}\\big(\\mathrm{Parameter}+\\mathrm{Broadcast}(\\mathrm{Linear}(x'))\\big)\\
\\bar A,,\\bar B &= \\mathrm{discretize}(\\Delta,A,B)\\ y &=
\\mathrm{SelectiveSSM}(\\bar A,\\bar B,C)(x')\\ y' &=
y\\otimes\\mathrm{SiLU}(z)\\ O &= \\mathrm{Linear}(y') \\end{aligned} $$

其中离散化与递推（论文 Eq. 2）为：

$$h\_t=\\bar A h\_{t-1}+\\bar B x\_t,\\qquad y\_t=C h\_t$$

$$\\bar A=\\exp(\\Delta A),\\qquad \\bar B=(\\Delta
A)^{-1}\\big(\\exp(\\Delta A)-I\\big)\\cdot\\Delta B$$

论文给出 Mamba block 的三个超参：SSM 状态扩张因子 $N$（与上文层数 $N$ 重名，论文如此）、卷积核大小 $k$、块扩张因子
$E$；$N$ 和 $E$ 越大，计算开销越高。

### 3\. FFN TD Encoding Layer

先 LayerNorm（论文称"把所有变量标准化到高斯分布"，参考 iTransformer 的做法），再对每个变量的 token
做前馈网络，最后再一个 LayerNorm。论文的解释是：token 的 $D$
维表示由整段回看序列线性映射而来，FFN
对它做稠密非线性变换，既"编码观测序列"又"解码未来序列表示"，从而**隐式**编码时间依赖。注意
S-Mamba 并没有显式的时间维度扫描，时间依赖完全靠 token 化的线性层和 FFN 承担。

细节上，Algorithm 2 把这一层写成 LayerNorm、Feed-Forward、LayerNorm 三步顺序执行，而图 3 在
Feed-forward 处画有一条跳连（带 ⊕）。是否存在围绕 FFN 的残差连接，论文文字没有明确说明 \[待核实\]。

### 4\. Projection

线性层把 token 映射为长度 $T$ 的预测，转置后得到 $U\_{out}$。整个模型一次输出未来 $T$ 步，没有自回归解码。

### 自拟示意：一个形状与复杂度例子

\[解读\] 下面是自拟的算术示意，不是论文数字。设 Electricity（$V=321$），$L=96$，$T=96$，隐藏维度取
$D=512$（$D$ 仅为假设，论文正文未给出）：

  - tokenization 线性层参数量：$96\\times512+512=49{,}664$；
  - projection 线性层：$512\\times96+96=49{,}248$；
  - 变量间交互：一层自注意力每个头要算 $321^2=103{,}041$ 个变量对的得分，而双向 Mamba 是两次长度 $321$
    的扫描，共 $2\\times321=642$ 步（每步内部还有状态更新与扩张维度 $E\\cdot D$
    的运算，不能直接比较绝对开销，只说明增长阶数不同）。

## 训练与推理

  - 训练是标准的端到端监督训练：回看 $L$ 步，直接输出未来 $T$ 步。
  - 论文正文没有给出学习率、层数 $N$、隐藏维度 $D$、损失函数、优化器、数据划分与标准化细节等训练超参
    \[待核实\]，复现请以官方代码为准。
  - 主实验统一使用回看长度 $L=96$；预测长度对
    Traffic、ETT、Electricity、Exchange、Weather、Solar-Energy 为
    96/192/336/720，PEMS 为 12/24/48/96。
  - 效率测试使用单张 NVIDIA RTX3090，batch size 为 16。

## 实验

### 数据集与基线

13 个公开数据集，论文分三类：

| 类别  | 数据集                                                        | 特点（论文描述）                                            |
| --- | ---------------------------------------------------------- | --------------------------------------------------- |
| 交通  | Traffic（862 个变量）、PEMS03/04/07/08（358/307/883/170 个变量）      | 变量多，大多周期性                                           |
| ETT | ETTm1、ETTm2、ETTh1、ETTh2（7 个变量）                             | 变量少，规律性弱                                            |
| 其他  | Electricity（321）、Exchange（8）、Weather（21）、Solar-Energy（137） | Electricity、Solar 变量多且多周期；Exchange、Weather 变量少且多非周期 |

9
个基线：iTransformer、PatchTST、Crossformer、FEDformer、Autoformer、RLinear、TiDE、DLinear、TimesNet。

### 主结果

下表为论文 Table 2\~4 的平均（Avg）结果（MSE / MAE，回看 96）。只列
S-Mamba、iTransformer，以及该数据集上论文表中比两者更好的基线（若有）：

| 数据集          | S-Mamba       | iTransformer  | 论文表中更优的基线                                    |
| ------------ | ------------- | ------------- | -------------------------------------------- |
| Traffic      | 0.414 / 0.276 | 0.428 / 0.282 | 无                                            |
| PEMS03       | 0.122 / 0.228 | 0.113 / 0.221 | iTransformer 更优                              |
| PEMS04       | 0.103 / 0.211 | 0.111 / 0.221 | 无                                            |
| PEMS07       | 0.089 / 0.188 | 0.101 / 0.204 | 无                                            |
| PEMS08       | 0.148 / 0.224 | 0.150 / 0.226 | 无                                            |
| ETTm1        | 0.398 / 0.405 | 0.407 / 0.410 | PatchTST 0.387 / 0.400                       |
| ETTm2        | 0.288 / 0.332 | 0.288 / 0.332 | PatchTST 0.281 / 0.326；RLinear 0.286 / 0.327 |
| ETTh1        | 0.455 / 0.450 | 0.454 / 0.447 | RLinear 0.446 / 0.434；FEDformer MSE 0.440    |
| ETTh2        | 0.381 / 0.405 | 0.383 / 0.407 | RLinear 0.374 / 0.398                        |
| Electricity  | 0.170 / 0.265 | 0.178 / 0.270 | 无                                            |
| Exchange     | 0.367 / 0.408 | 0.360 / 0.403 | DLinear MSE 0.354                            |
| Weather      | 0.251 / 0.276 | 0.258 / 0.278 | 无                                            |
| Solar-Energy | 0.240 / 0.273 | 0.233 / 0.262 | iTransformer 更优                              |

论文自己的归纳：

1.  变量多且周期性强的数据集（交通类、Electricity、Solar-Energy）上表现好——论文认为周期变量更可能含有可学习的
    VC。
2.  ETT、Exchange 变量少、多非周期，VC 弱，Mamba VC 层带不来有用信息甚至引入噪声，S-Mamba 没有明显优势。
3.  Weather 变量少且多非周期，但 S-Mamba 仍最优；论文的解释是 Weather 各变量常同时上升或下降，VC
    层仍有收益，FFN 也能准确记录大段上升下降趋势。

\[解读\] 对照上表，论文"在 Solar-Energy 上表现好"的说法并不准确：Solar-Energy 的 Avg 上
iTransformer（0.233 / 0.262）优于 S-Mamba（0.240 / 0.273）。PEMS03 同样如此，PEMS03
与 PEMS08 在预测步长 96 上 iTransformer 的优势更大（PEMS03：0.164 对
0.201；PEMS08：0.221 对 0.245，MSE）。整体看，S-Mamba 相对 iTransformer
的优势在多数大变量数据集上幅度较小（如 Traffic 0.414 对 0.428，Electricity
0.170 对 0.178），在 ETT 上基本持平。

### 效率（论文 Figure 5）

论文用气泡图展示 MSE、训练时间（ms/iter）与显存（图中标注，单位印为 "Gb"）。图上可读的显存标注如下：

| 数据集            | S-Mamba | iTransformer | PatchTST | Crossformer | FEDformer | Autoformer | RLinear |
| -------------- | ------- | ------------ | -------- | ----------- | --------- | ---------- | ------- |
| PEMS07（$T=12$） | 1.47    | 2.38         | 2.01     | 2.51        | 0.37      | 0.39       | 0.04    |
| Electricity    | 0.84    | 0.79         | 1.38     | 2.04        | 0.68      | 0.88       | 0.03    |
| Traffic        | 2.91    | 4.66         | 3.67     | 5.4         | 0.88      | 0.94       | 0.06    |
| ETTm1          | 0.05    | 0.04         | 0.05     | 0.35        | 0.6       | 0.37       | 0.02    |

训练时间的具体数值在图上无法逐点读准，这里不写数值。论文结论是：S-Mamba 在 PEMS07、Electricity、Traffic
上取得最好的 MSE，相对 Transformer 类模型通常训练时间短、显存低；RLinear
显存和时间最少但精度不具竞争力。

\[解读\] 从上表看，这个结论要加限定：显存上 S-Mamba 明显低于 iTransformer 的只有 Traffic 和
PEMS07（变量数较多），在 Electricity 与 ETTm1 上反而略高；FEDformer、Autoformer 在
Traffic 上显存更低（0.88、0.94）。因此"低开销"主要是相对
iTransformer、PatchTST、Crossformer，在变量多的数据上成立。

## 消融（论文 Table 5）

论文在 Electricity、Traffic、Weather、Solar-Energy、ETTh2 上，分别替换或去掉 VC 编码层和 TD
编码层。下表为预测长度 96 的 MSE：

| 设计（VC 编码 + TD 编码）       | Electricity | Traffic | Weather | Solar-Energy | ETTh2 |
| ----------------------- | ----------- | ------- | ------- | ------------ | ----- |
| S-Mamba（bi-Mamba + FFN） | 0.139       | 0.382   | 0.165   | 0.205        | 0.296 |
| bi-Mamba + uni-Mamba    | 0.155       | 0.488   | 0.161   | 0.213        | 0.297 |
| bi-Mamba + bi-Mamba     | 0.154       | 0.512   | 0.162   | 0.221        | 0.297 |
| bi-Mamba + Attention    | 0.153       | 0.514   | 0.163   | 0.230        | 0.299 |
| Attention + FFN         | 0.148       | 0.395   | 0.174   | 0.203        | 0.297 |
| bi-Mamba + 无 TD         | 0.141       | 0.380   | 0.167   | 0.210        | 0.298 |
| 无 VC + FFN              | 0.169       | 0.437   | 0.183   | 0.228        | 0.299 |

预测长度 720 时，Electricity / Traffic 的 MSE 依次为：S-Mamba 0.204 / 0.460；TD 换
uni-Mamba 0.210 / 0.621；TD 换 bi-Mamba 0.216 / 0.661；TD 换 Attention 0.213
/ 0.685；VC 换 Attention 0.225 / 0.467；去掉 TD 0.214 / 0.466；去掉 VC 0.233 /
0.496。

论文结论：Mamba 适合做 VC 编码，FFN 适合做 TD 编码，因此当前结构"最有效"。

\[解读\] 逐项对照后，更细的读法是：

  - 把 VC 层的 bi-Mamba 换成 Attention（即 iTransformer 的结构；该行
    Electricity、Traffic、Weather 的四个步长数字与主表中 iTransformer 一致），在
    Electricity、Traffic、Weather 上变差，但 Solar-Energy 上 Attention 略好（96 步
    0.203 对 0.205）。
  - 去掉 VC 层的变化最大，说明变量间交互确实有用；去掉 TD 层（只保留 bi-Mamba 做 VC）仅带来小幅变差，Traffic 的
    96 步上甚至略好（0.380 对 0.382），说明 FFN 的贡献在这些数据上并不大。注意该变体里仍有 token 化和
    projection 两个线性层。
  - 在 TD 位置换成 Mamba 或 Attention，Electricity、Traffic、Solar-Energy 明显变差，但
    Weather 上 uni-Mamba 反而更好（0.161 对 0.165），ETTh2 上几乎无差别。论文"FFN 在 TD
    编码上占优"的结论并非在所有数据集上成立。

## 论文的其他探索实验

### 变量顺序是否影响（Section 5.5，Figure 6）

Mamba 把变量当序列扫描，而变量本身并无顺序，且论文指出 Mamba 的选择机制与 HiPPO
矩阵相关，初始化时偏向更近的元素。论文先用傅里叶变换把
Electricity 的变量分成周期与非周期两组，把非周期变量（视为噪声）移到序列中部或末尾，比较 S-Mamba 与
iTransformer（回看 96、预测 96）：

| 设置        | S-Mamba（MSE / MAE） | iTransformer（MSE / MAE） |
| --------- | ------------------ | ----------------------- |
| 原始顺序      | 0.139 / 0.235      | 0.148 / 0.240           |
| 非周期变量移到末尾 | 0.140 / 0.237      | 0.147 / 0.239           |
| 非周期变量移到中部 | 0.139 / 0.235      | 0.148 / 0.239           |

论文结论是 S-Mamba 基本不受变量顺序影响，训练足够后能缓解 HiPPO 的初始偏置。只在 Electricity
上做了该实验，论文称是因为只有它同时有大量周期与非周期变量。

### 能否替换"高级 Transformer"的编码器（Section 5.6，Figure 7）

把 Autoformer、Flashformer、Flowformer 的编码器直接换成 uni-Mamba，得到
Auto-M、Flash-M、Flow-M，在 Electricity、Traffic、PEMS07、ETTm1
上比较。论文结论：显存和训练时间降低，整体性能略有提升。具体数值只有柱状图，这里不引用数值。

### 回看窗口变长是否受益（Section 5.7，Figure 8）

作者在 Reformer、Informer、Transformer 的编码器与解码器之间加一个 Mamba block，得到
Refor-M、Infor-M、Trans-M，并让回看长度变化。论文观察到：

1.  S-Mamba 与 iTransformer 的性能随输入变长而提升，作者认为主要归功于两者共有的 FFN TD 层，而不是 Mamba
    或 Transformer block；
2.  S-Mamba 始终优于 iTransformer，作者归因于 Mamba VC 层优于 Transformer VC 层；
3.  加 Mamba block 通常带来性能提升，但这些变体并不随回看变长而持续变好，论文称这与 DLinear 论文（Zeng
    等）的发现一致。

### 泛化到未见变量（Section 5.8，Figure 9）

参照 iTransformer：只用 40% 的变量训练，再预测全部变量，并与用 100% 变量训练的结果比较。论文在
PEMS03、PEMS04、Electricity、Weather、Traffic、Solar 上做了该实验，结论是 S-Mamba
在这六个数据集上展现出泛化潜力。具体数值只有柱状图，这里不引用。

## 局限

论文自述：

  - 变量少、非周期的数据集（ETT、Exchange）上 VC 弱，Mamba VC 层可能引入噪声，没有优势。
  - 变量顺序对 Mamba 有潜在影响（HiPPO 偏置），论文只在 Electricity 一个数据集上验证了"影响不大"。
  - 论文把"变量更多的场景"和"基于 Mamba 的时序预训练模型"列为未来方向。

\[解读\] 其他需要注意的点：

  - 主实验统一回看 96；论文正文未说明基线的超参设置；回看窗口变长的实验只覆盖 S-Mamba 与 iTransformer 等少数模型。
  - 与 iTransformer 的差距在多数数据集上是小幅的（见上表），PEMS03、Solar-Energy
    上还落后；效率优势也主要体现在变量很多的数据集。
  - 论文里对 Eq. 1 的维度标注（$x(t)\\in\\mathbb R^D$、$y(t)\\in\\mathbb R^N$）与一般
    SSM 写法不一致，疑似笔误，本文不引用这些维度。

## 与相关方法对比

下表中"对变量数的复杂度"一列为 \[解读\]（依据论文关于注意力平方复杂度与 Mamba 近线性复杂度的论述归纳）：

| 方法                | 变量间交互                 | 时间依赖                  | 对变量数 $V$ 的复杂度 | 说明            |
| ----------------- | --------------------- | --------------------- | ------------- | ------------- |
| iTransformer      | 自注意力（变量 token 之间）     | FFN                   | $O(V^2)$      | S-Mamba 的骨架来源 |
| S-Mamba           | 双向 Mamba（变量 token 之间） | FFN                   | 近线性于 $V$      | 只换了 VC 编码器    |
| PatchTST          | 论文称其通道独立（共享嵌入与权重）     | patch 化后的 Transformer | 不涉及           | 论文基线          |
| DLinear / RLinear | 通道独立                  | 线性层                   | 线性            | 论文基线          |

其中 iTransformer 与 S-Mamba 的差别最清晰：论文表 5 的 "Attention + FFN" 行就是
iTransformer 的结构，S-Mamba 即把 Attention 换成 bi-Mamba。论文相关工作还提到另一个 Mamba
时序模型 TimeMachine（arXiv:2403.09898），本文不展开。

## 使用方式

论文摘要给出代码仓库地址，PDF 文字中写作 `github.com/wzhwzhwzh0921/S- D-
Mamba`，连字符处有断开，推测为 `S-D-Mamba`
\[待核实\]，使用前请自行确认。下面是依据论文结构写的最小示意（示意代码，未运行验证），Mamba
部分假设使用 `mamba_ssm` 包的 `Mamba` 模块（需要 CUDA 环境）：

``` python
import torch, torch.nn as nn
from mamba_ssm import Mamba   # 假设已安装

class SMambaLayer(nn.Module):
    def __init__(self, d, d_state=16, d_ff=512):
        super().__init__()
        self.fwd = Mamba(d_model=d, d_state=d_state)
        self.bwd = Mamba(d_model=d, d_state=d_state)
        self.norm1, self.norm2 = nn.LayerNorm(d), nn.LayerNorm(d)
        self.ffn = nn.Sequential(nn.Linear(d, d_ff), nn.GELU(), nn.Linear(d_ff, d))

    def forward(self, u):                      # u: [B, V, D]
        y = self.fwd(u) + self.bwd(u.flip(1)).flip(1)   # 双向，沿变量维度
        u = u + y                              # VC 层残差
        h = self.ffn(self.norm1(u))            # FFN 外是否有残差见上文 [待核实]
        return self.norm2(h)

class SMamba(nn.Module):
    def __init__(self, L, T, d=512, n_layers=2):
        super().__init__()
        self.embed = nn.Linear(L, d)
        self.layers = nn.ModuleList(SMambaLayer(d) for _ in range(n_layers))
        self.proj = nn.Linear(d, T)

    def forward(self, x):                      # x: [B, L, V]
        u = self.embed(x.transpose(1, 2))      # [B, V, D]
        for layer in self.layers:
            u = layer(u)
        return self.proj(u).transpose(1, 2)    # [B, T, V]
```

\[经验\] 示意中的 `d_state`、`d_ff`、`n_layers`、激活函数都是随意取值，非论文设置。

## Reference

  - Wang, Z., Kong, F., Feng, S., Wang, M., Yang, X., Zhao, H., Wang,
    D., Zhang, Y., *Is Mamba Effective for Time Series Forecasting?*,
    arXiv:2403.11144 — <https://arxiv.org/abs/2403.11144>
  - 论文摘要给出的代码仓库：`https://github.com/wzhwzhwzh0921/S-D-Mamba`（拼写 \[待核实\]）
  - Gu & Dao, *Mamba: Linear-Time Sequence Modeling with Selective State
    Spaces*, arXiv:2312.00752
  - Liu et al., *iTransformer*, arXiv:2310.06625
