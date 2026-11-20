-----

| Title     | ML Tasks TimeSeries Generative CSDI                   |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-19T02:27:32Z`                                |
| Updated @ | `2026-11-20T08:17:53Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/647) |

-----

# CSDI

CSDI（Conditional Score-based Diffusion models for Imputation）出自论文 *CSDI:
Conditional Score-based Diffusion Models for Probabilistic Time Series
Imputation*（Tashiro, Song, Song, Ermon，Stanford 等，NeurIPS 2021，arXiv
2107.03502）。它用**以观测值为条件的分数扩散模型**做多变量时间序列的**概率填补**，并且可以在同一框架下做插值与概率预测。

一句话概括：**把"已观测的值"当作条件、"要填的值"当作生成目标，训练一个条件去噪网络
$\\epsilon\_\\theta$；训练时用自监督的方式把已观测值再切成"条件 +
目标"两份；网络用时间维与特征维两个 Transformer 层（2D
attention）同时捕捉时序依赖与变量间依赖。**

## 解决什么问题

多变量时间序列常有缺失值（设备故障、人为遗漏等）。论文关注的是**概率填补**：不是给出一个点估计，而是估计缺失值的条件分布。

论文指出的背景：

  - 之前的深度填补方法多基于自回归模型（RNN 类）；概率填补方面有 GP-VAE 等。
  - 扩散模型在图像、音频上表现很好，也有工作用扩散模型做填补，但做法是**近似**的：用无条件扩散模型的反向过程，把观测值和目标拼在一起一起加噪、去噪。这样加在观测值上的噪声会破坏观测值里的有用信息，且不对应精确的条件分布。
  - TimeGrad 用扩散做概率预测，但依赖 RNN 处理历史，论文称它因此不能直接用于填补。

CSDI 的思路：**不做近似，直接学条件分布** $p\_\\theta(\\mathbf x^{\\mathrm{ta}}\_0\\mid
\\mathbf x^{\\mathrm{co}}\_0)$，让观测值作为去噪网络的**输入**而不被加噪。

## 问题形式化

每条时间序列写成 ${\\mathbf X,\\mathbf M,\\mathbf s}$：

  - $\\mathbf X\\in\\mathbb R^{K\\times L}$：$K$ 个特征、长度 $L$；
  - $\\mathbf M\\in{0,1}^{K\\times L}$：观测掩码，$m\_{k,l}=1$ 表示观测到，$0$ 表示缺失；
  - $\\mathbf s\\in\\mathbb R^{L}$：时间戳（允许间隔不等）。

概率填补就是估计缺失值的分布。论文强调：插值（在目标时刻填所有特征）和预测（在未来时刻填所有特征）都是填补的特例。

近似做法与 CSDI 的区别（论文附录 C 描述了作为对比基线的"unconditional"填补）：

| 做法               | 观测值怎么处理                                                                                                                                                  | 去噪网络学的是                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| unconditional 近似 | 观测值与目标拼成一个样本，一起加噪（观测部分记为 $\\mathbf x^{\\mathrm{co}}\_t=\\sqrt{\\alpha\_t}\\mathbf x^{\\mathrm{co}}\_0+\\sqrt{1-\\alpha\_t},\\boldsymbol\\epsilon$），再整体去噪 | 无条件的联合分布，训练时缺失位置补零当 dummy 并用 $\\mathbf m$ 屏蔽损失                                   |
| CSDI             | 观测值不加噪，作为网络输入（$\\mathbf x^{\\mathrm{co}}\_0$ 与 $\\mathbf m^{\\mathrm{co}}$）                                                                              | 条件分布 $p\_\\theta(\\mathbf x^{\\mathrm{ta}}\_0\\mid\\mathbf x^{\\mathrm{co}}\_0)$ |

表中：「做法」是两种填补思路，「观测值怎么处理」说明观测值是否加噪，「去噪网络学的是」说明学习的分布。结论：CSDI
让观测值保持干净并作为输入，直接学习条件分布。

\[解读\] 直观地说，条件扩散把"观测值"从被加噪的对象变成了每一步去噪都能看到的干净上下文；论文的对比（实验表中 unconditional
行与 CSDI 行）显示这一点有明显收益。

## 核心思想

### 背景：DDPM

前向过程逐步加噪，$\\hat\\alpha\_t:=1-\\beta\_t$，$\\alpha\_t:=\\prod\_{i=1}^{t}\\hat\\alpha\_i$：

$$q(\\mathbf x\_t\\mid\\mathbf x\_0)=\\mathcal N\\big(\\mathbf
x\_t;\\sqrt{\\alpha\_t},\\mathbf x\_0,(1-\\alpha\_t)\\mathbf
I\\big),\\qquad \\mathbf x\_t=\\sqrt{\\alpha\_t},\\mathbf
x\_0+\\sqrt{1-\\alpha\_t},\\boldsymbol\\epsilon$$

其中：$\\mathbf x\_0$ 是干净数据；$\\mathbf x\_t$ 是第 $t$ 步加噪样本；$\\beta\_t$ 是第 $t$
步噪声强度，$\\hat\\alpha\_t=1-\\beta\_t$，$\\alpha\_t=\\prod\_{i=1}^t\\hat\\alpha\_i$
是累乘保留系数；$\\boldsymbol\\epsilon$ 是标准高斯噪声；$\\mathbf I$ 是单位矩阵。

\[解读\] 论文正文把第二项印成
$(1-\\alpha\_t)\\boldsymbol\\epsilon$（渲染页上看不到根号），但其前一式的方差是
$(1-\\alpha\_t)\\mathbf I$，标准 DDPM 的噪声系数是
$\\sqrt{1-\\alpha\_t}$，这里按标准形式书写，论文该处很可能是排版遗漏。

反向过程取 DDPM 的参数化：

$$\\boldsymbol\\mu^{\\mathrm{DDPM}}(\\mathbf
x\_t,t,\\boldsymbol\\epsilon)=\\frac{1}{\\sqrt{\\hat\\alpha\_t}}\\Big(\\mathbf
x\_t-\\frac{\\beta\_t}{\\sqrt{1-\\alpha\_t}},\\boldsymbol\\epsilon\\Big),\\qquad
\\sigma^{\\mathrm{DDPM}}(t)=\\tilde\\beta\_t^{1/2},\\quad
\\tilde\\beta\_t=\\begin{cases}\\dfrac{1-\\alpha\_{t-1}}{1-\\alpha\_t},\\beta\_t
& t\>1\\\[4pt\] \\beta\_1 & t=1\\end{cases}$$

其中：$\\boldsymbol\\mu^{\\mathrm{DDPM}}$ 是反向转移的均值，由噪声预测
$\\boldsymbol\\epsilon$ 与 $\\mathbf x\_t$
计算；$\\hat\\alpha\_t=1-\\beta\_t$；$\\alpha\_t$
是累乘；$\\sigma^{\\mathrm{DDPM}}(t)$ 是反向转移的标准差，$\\tilde\\beta\_t$
是对应方差（$t=1$ 时取 $\\beta\_1$）。

\[解读\] 论文 Eq.(3) 渲染页上均值前的系数印作 $1/\\alpha\_t$（既无根号也无 hat；同一式里
$\\beta\_t/\\sqrt{1-\\alpha\_t}$ 的根号是有的），这里按标准 DDPM 写成
$1/\\sqrt{\\hat\\alpha\_t}$，这是对原文的修正性转写。同类的根号遗漏还出现在论文 Eq.(4)、(7) 与附录 D
中的 $(1-\\alpha\_t)\\boldsymbol\\epsilon$。

训练目标是让网络预测所加的噪声：

$$\\min\_\\theta\\ \\mathbb E\_{\\mathbf
x\_0,\\boldsymbol\\epsilon\\sim\\mathcal N(0,\\mathbf I),t}\\
\\big\\lVert
\\boldsymbol\\epsilon-\\boldsymbol\\epsilon\_\\theta(\\mathbf
x\_t,t)\\big\\rVert\_2^2$$

其中：$\\mathbf x\_0$ 是干净数据；$\\boldsymbol\\epsilon$ 是标准高斯噪声；$t$
是随机抽取的扩散步；$\\mathbf x\_t$
是加噪样本；$\\boldsymbol\\epsilon\_\\theta$
是预测噪声的网络；目标是使预测噪声与真实噪声的平方误差最小。

### 条件扩散：目标与条件的划分

把一个样本的值分成：

  - **条件观测** $\\mathbf x^{\\mathrm{co}}\_0$：作为条件输入，不加噪；
  - **填补目标** $\\mathbf x^{\\mathrm{ta}}\_0$：被加噪、被去噪、最终要生成的部分。

条件反向过程：

$$p\_\\theta(\\mathbf x^{\\mathrm{ta}}\_{t-1}\\mid\\mathbf
x^{\\mathrm{ta}}*t,\\mathbf x^{\\mathrm{co}}*0)=\\mathcal
N\\big(\\mathbf x^{\\mathrm{ta}}*{t-1};\\
\\boldsymbol\\mu*\\theta(\\mathbf x^{\\mathrm{ta}}\_t,t\\mid\\mathbf
x^{\\mathrm{co}}*0),\\ \\sigma*\\theta(\\mathbf
x^{\\mathrm{ta}}\_t,t\\mid\\mathbf x^{\\mathrm{co}}\_0)\\mathbf
I\\big)$$

其中：$\\mathbf x^{\\mathrm{ta}}\_{t-1},\\mathbf x^{\\mathrm{ta}}*t$
是目标在相邻扩散步的取值；$\\mathbf x^{\\mathrm{co}}*0$
是条件观测；$\\mathcal N$
是高斯分布；$\\boldsymbol\\mu*\\theta,\\sigma*\\theta$
是网络给出的均值与方差；$\\mathbf I$ 是单位矩阵。

参数化与 DDPM 完全相同，只是噪声预测网络多了条件输入：

$$\\boldsymbol\\mu\_\\theta(\\mathbf x^{\\mathrm{ta}}\_t,t\\mid\\mathbf
x^{\\mathrm{co}}\_0)=\\boldsymbol\\mu^{\\mathrm{DDPM}}\\big(\\mathbf
x^{\\mathrm{ta}}*t,t,\\boldsymbol\\epsilon*\\theta(\\mathbf
x^{\\mathrm{ta}}\_t,t\\mid\\mathbf x^{\\mathrm{co}}*0)\\big),\\qquad
\\sigma*\\theta=\\sigma^{\\mathrm{DDPM}}(\\mathbf
x^{\\mathrm{ta}}\_t,t)$$

其中：$\\boldsymbol\\mu\_\\theta$ 是条件反向转移的均值，由 DDPM 参数化给出，只是噪声预测
$\\boldsymbol\\epsilon\_\\theta$ 多了条件输入 $\\mathbf
x^{\\mathrm{co}}*0$；$\\sigma*\\theta$ 沿用 DDPM 方差；$\\mathbf
x^{\\mathrm{ta}}\_t$ 是第 $t$ 步的目标样本。

训练损失：

$$\\min\_\\theta\\ \\mathbb E\\ \\big\\lVert
\\boldsymbol\\epsilon-\\boldsymbol\\epsilon\_\\theta(\\mathbf
x^{\\mathrm{ta}}\_t,t\\mid\\mathbf
x^{\\mathrm{co}}\_0)\\big\\rVert\_2^2,\\qquad \\mathbf
x^{\\mathrm{ta}}\_t=\\sqrt{\\alpha\_t},\\mathbf
x^{\\mathrm{ta}}\_0+\\sqrt{1-\\alpha\_t},\\boldsymbol\\epsilon$$

其中：$\\boldsymbol\\epsilon$
是真实噪声；$\\boldsymbol\\epsilon\_\\theta(\\cdot\\mid\\mathbf
x^{\\mathrm{co}}\_0)$ 是以条件观测为输入的噪声预测网络；$\\mathbf x^{\\mathrm{ta}}\_t$
是加噪的目标；$\\alpha\_t$ 是累乘保留系数；损失只作用于目标，条件始终是干净的。

其中 $\\boldsymbol\\epsilon\\sim\\mathcal N(\\mathbf 0,\\mathbf I)$ 的维度与
$\\mathbf x^{\\mathrm{ta}}\_0$ 一致，期望对 $\\mathbf
x\_0$、$\\boldsymbol\\epsilon$ 和 $t$ 取。注意加噪只作用在目标上，条件 $\\mathbf
x^{\\mathrm{co}}\_0$ 始终是干净的。

### 训练时如何构造条件与目标（自监督）

真实场景里没有缺失值的真值，训练集本身可能就含缺失。于是借鉴 masked language
modeling：**把已观测值再切成两份**，一份当目标、一份当条件。

| 阶段     | 填补目标                                  | 条件观测   |
| ------ | ------------------------------------- | ------ |
| 采样（填补） | 所有缺失值                                 | 所有观测值  |
| 训练     | 观测值的一个子集（由 target choice strategy 选出） | 剩下的观测值 |

表中：「阶段」是采样（填补）与训练，「填补目标」「条件观测」说明各阶段哪些位置是生成目标、哪些是条件。结论：训练时把已观测值再切成目标与条件两份，使模型能在没有缺失真值时自监督学习。

论文给了四种选目标的策略：

1.  **Random**：不知道缺失模式时使用。随机选观测值中的 $r%$ 作为目标，$r$ 从 $\[0,100\]$
    均匀采样，以适应不同缺失率。
2.  **Historical**：利用训练集里的缺失模式。对训练样本 $\\mathbf x\_0$，再随机抽另一个样本
    $\\tilde{\\mathbf x}\_0$，取"$\\mathbf x\_0$ 的观测位置 $\\cap$
    $\\tilde{\\mathbf x}\_0$ 的缺失位置"作为目标。适合缺失有结构（如连续缺失）的数据。
3.  **Mix**：以 1:1 的比例混合上述两种，兼顾泛化与结构化缺失。
4.  **Test pattern**：已知测试集缺失模式时，直接把该模式当目标；例如预测任务，缺失就是固定的未来时刻。

### 一个自拟的小例子（自拟示意，非论文数据）

取 $K=2$、$L=4$。设当前样本的观测掩码 $\\mathbf M$ 与另一个训练样本 $\\tilde{\\mathbf x}\_0$
的观测掩码 $\\tilde{\\mathbf M}$ 为：

$$\\mathbf M=\\begin{pmatrix}1&1&0&1\\1&0&1&1\\end{pmatrix},\\qquad
\\tilde{\\mathbf M}=\\begin{pmatrix}0&0&1&1\\1&1&0&0\\end{pmatrix}$$

其中：$\\mathbf M$ 是当前样本的观测掩码（1 表示观测到）；$\\tilde{\\mathbf M}$
是另一个训练样本的观测掩码；行是特征，列是时间点。用于演示 Historical
策略取"$\\mathbf M$ 观测处与 $\\tilde{\\mathbf M}$ 缺失处的交集"作为目标。

$\\mathbf M$ 中共有 6 个观测值。

  - Random 策略：若抽到 $r=50$，则在 6 个观测值里随机选 $50%$，即 3 个当目标，其余 3 个当条件。
  - Historical 策略：取 $\\mathbf M$ 的观测位置与 $\\tilde{\\mathbf M}$
    的缺失位置之交，即位置 $(1,1),(1,2),(2,3),(2,4)$（共 4
    个）作为目标；$\\mathbf M$ 的另两个观测位置 $(1,4),(2,1)$
    作为条件。检查：$4+2=6$，与观测总数一致。
  - 采样（填补）时：观测的 6 个位置全是条件，$\\mathbf M$ 为 0 的 2 个位置是目标。

## 时间序列上的实现

### 固定形状 + 条件掩码

条件观测和目标在每个样本里位置不同，而网络需要固定形状输入。做法：把 $\\mathbf x^{\\mathrm{ta}}\_t$ 与
$\\mathbf x^{\\mathrm{co}}\_0$ 都零填充到 $K\\times L$，并引入条件掩码 $\\mathbf
m^{\\mathrm{co}}\\in{0,1}^{K\\times L}$（条件观测处为 1）作为额外输入：

$$\\boldsymbol\\epsilon\_\\theta\\big(\\mathbf
x^{\\mathrm{ta}}\_t,t\\mid\\mathbf x^{\\mathrm{co}}\_0,\\mathbf
m^{\\mathrm{co}}\\big)\\in\\mathbb R^{K\\times L}$$

其中：$\\mathbf x^{\\mathrm{ta}}\_t$ 是加噪的目标；$\\mathbf x^{\\mathrm{co}}\_0$
是干净的条件观测；$\\mathbf m^{\\mathrm{co}}$ 是条件掩码（条件位置为 1）；$K$ 是特征数，$L$
是长度；网络输出与输入同形状的噪声预测。

采样时 $\\mathbf m^{\\mathrm{co}}=\\mathbf M$，$\\mathbf
x^{\\mathrm{co}}\_0=\\mathbf m^{\\mathrm{co}}\\odot\\mathbf X$。训练时由
target choice strategy 决定 $\\mathbf m^{\\mathrm{co}}$，$\\mathbf
x^{\\mathrm{co}}\_0=\\mathbf m^{\\mathrm{co}}\\odot\\mathbf X$，$\\mathbf
x^{\\mathrm{ta}}\_0=(\\mathbf M-\\mathbf m^{\\mathrm{co}})\\odot\\mathbf
X$。

训练时原本的缺失位置补零当 dummy 值（扩展目标 $\\widehat{\\mathbf
x}^{\\mathrm{ta}}\_0$），噪声也只加在目标位置，即
$\\widehat{\\boldsymbol\\epsilon}^{\\mathrm{ta}}=(1-\\mathbf
m^{\\mathrm{co}})\\odot\\boldsymbol\\epsilon$、$\\widehat{\\mathbf
x}^{\\mathrm{ta}}\_t=\\sqrt{\\alpha\_t},\\widehat{\\mathbf
x}^{\\mathrm{ta}}\_0+\\sqrt{1-\\alpha\_t},\\widehat{\\boldsymbol\\epsilon}^{\\mathrm{ta}}$；损失只在真正的目标位置上算（$\\mathbf
m^{\\mathrm{ta}}$ 在目标位置为 1）：

$$\\min\_\\theta\\ \\mathbb E\\
\\Big\\lVert\\big(\\boldsymbol\\epsilon-\\boldsymbol\\epsilon\_\\theta(\\widehat{\\mathbf
x}^{\\mathrm{ta}}\_t,t\\mid\\mathbf x^{\\mathrm{co}}\_0,\\mathbf
m^{\\mathrm{co}})\\big)\\odot\\mathbf
m^{\\mathrm{ta}}\\Big\\rVert\_2^2$$

其中：$\\epsilon$ 是真实噪声；$\\epsilon\_\\theta$ 是预测噪声的网络，输入加噪目标
$\\widehat{\\mathbf x}^{\\mathrm{ta}}\_t$、扩散步 $t$、条件观测 $\\mathbf
x^{\\mathrm{co}}\_0$ 与条件掩码 $\\mathbf m^{\\mathrm{co}}$；$\\mathbf
m^{\\mathrm{ta}}$ 是目标掩码；$\\odot$ 是逐元素乘，使损失只在真正的目标位置上计算。

### 去噪网络：两个 Transformer

骨架沿用 DiffWave 的残差层结构。每个残差层里用**两个 1 层 Transformer encoder**代替卷积：

下图概括残差层内两个 Transformer 的作用顺序。

    输入 (K, L, C)
      -> Temporal Transformer：对每个特征，在 L 个时间点上做注意力（学时间依赖）
      -> Feature Transformer ：对每个时间点，在 K 个特征上做注意力（学特征间依赖）
      -> 输出 (K, L, C)，形状不变

图中：

  - 输入张量形状为 $(K,L,C)$（特征数、长度、通道数）。
  - 先经 Temporal Transformer：对每个特征在 $L$ 个时间点上做注意力，学习时间依赖。
  - 再经 Feature Transformer：对每个时间点在 $K$ 个特征上做注意力，学习特征间依赖；输出形状不变。

两层都是标准的 1 层 `TransformerEncoder`（多头注意力 + 全连接 + LayerNorm，论文用 PyTorch
实现）。序列长度可以不同，批训练时零填充并用 padding mask 处理；论文在预测任务中因特征数多、序列长，改用
"linear attention transformer" 包以提高效率。

论文的消融（healthcare 10% missing 与 air quality，MAE / CRPS）：

| 结构                 | healthcare MAE | healthcare CRPS | air quality MAE | air quality CRPS |
| ------------------ | -------------- | --------------- | --------------- | ---------------- |
| no-temporal        | 0.439          | 0.475           | 26.63           | 0.292            |
| no-feature         | 0.352          | 0.386           | 14.44           | 0.162            |
| flatten            | 0.383          | 0.418           | 12.26           | 0.139            |
| Bi-RNN             | 0.272          | 0.301           | 12.56           | 0.142            |
| dilated conv       | 0.279          | 0.305           | 11.67           | 0.130            |
| 2D attention（CSDI） | 0.217          | 0.238           | 9.60            | 0.108            |

表中：「结构」是去噪网络中时间/特征建模方式的不同设计（no-temporal 为去掉时间层，no-feature 为去掉特征层，flatten
为展平），后四列是两个数据集上的 MAE 与 CRPS（越小越好）。结论：时间与特征相关都重要，2D attention 最优。

各结构的参数量被调到与 2D attention 接近。论文据此认为时间相关与特征相关都重要，且 2D attention
优于展平、Bi-RNN 与扩张卷积。

此外还有辅助信息：128 维的时间戳嵌入、16 维的特征类别嵌入、条件掩码，与扩散步 $t$ 的 128 维嵌入一起送入。输出最后乘
$(1-\\mathbf m^{\\mathrm{co}})$，屏蔽条件观测位置。

## 训练与推理

训练（Algorithm 1）：每次迭代采样 $t\\sim\\mathrm{Uniform}({1,\\dots,T})$ 和样本
$\\mathbf x\_0$；用目标选择策略把观测值分成 $\\mathbf x^{\\mathrm{co}}\_0$ 和 $\\mathbf
x^{\\mathrm{ta}}\_0$；采样 $\\boldsymbol\\epsilon$ 构造 $\\mathbf
x^{\\mathrm{ta}}\_t$；对损失做一步梯度下降。

推理（Algorithm 2）：从 $\\mathbf x^{\\mathrm{ta}}\_T\\sim\\mathcal
N(0,\\mathbf I)$（维度对应缺失位置）出发，$t=T$ 到 $1$ 按条件反向过程逐步去噪。多次采样得到缺失值的分布；论文用
100 个样本近似分布，确定性填补取 100 个样本的中位数。

### 超参数

超参数（填补实验）：扩散步 $T=50$，$\\beta\_1=0.0001$，$\\beta\_T=0.5$，中间用二次调度：

$$\\beta\_t=\\Big(\\frac{T-t}{T-1}\\sqrt{\\beta\_1}+\\frac{t-1}{T-1}\\sqrt{\\beta\_T}\\Big)^2$$

其中：$\\beta\_t$ 是第 $t$ 步的噪声方差；$T$ 是总扩散步数；$\\beta\_1,\\beta\_T$ 是首末步方差；该式在
$\\sqrt{\\beta}$ 上做线性插值再平方，即二次调度，使噪声逐步增大。

4 个 residual layer、64 通道、8 个注意力头，参数量约 41.5 万；batch size 16，200
epoch，Adam，学习率 0.001，在 75% 和 90% 的 epoch 处分别降到 0.0001 和 0.00001。

## 填补与预测两类用途

两者用的是同一个模型，区别只在**目标选择策略**和哪些位置被当作目标：

| 用途        | 目标（要生成的位置）  | 训练时的目标策略（论文设置）                                            |
| --------- | ----------- | --------------------------------------------------------- |
| 填补        | 缺失位置        | healthcare 用 Random；air quality 用 Random 与 Historical 的混合 |
| 插值（不规则采样） | 目标时间点上的所有特征 | Random（调整为按时间点采样）                                         |
| 预测        | 未来时间点上的所有特征 | Test pattern：每条训练序列取 $L\_1+L\_2$ 个连续时间步，最后 $L\_2$ 步作目标    |

表中：「用途」是任务类别，「目标（要生成的位置）」说明哪些位置作为生成目标，「训练时的目标策略」是对应的目标选择策略。结论：同一模型只需改变目标位置与策略即可完成填补、插值与预测。

预测时特征数很大（数百到两千），训练时每个 batch 随机抽 64 个特征的子集（subset sampling of
features）；因此特征数多的数据集需要更多 epoch（论文 Table 6：solar 50、electricity
100、traffic 200、taxi 300、wiki 300）。

## 实验与结论

### 评价指标：CRPS

论文用 CRPS 评价概率填补：对分位数损失 $\\Lambda\_\\alpha(q,z)=(\\alpha-\\mathbb
1\_{z\<q})(z-q)$ 在所有分位数水平上积分：

$$\\mathrm{CRPS}(F^{-1},x)=\\int\_0^1
2\\Lambda\_\\alpha\\big(F^{-1}(\\alpha),x\\big),d\\alpha\\ \\simeq\\
\\sum\_{i=1}^{19}\\frac{2\\Lambda\_{i\\cdot0.05}\\big(F^{-1}(i\\cdot0.05),x\\big)}{19}$$

其中：$F^{-1}$ 是预测分布的分位数函数；$x$ 是真实值；$\\alpha\\in\[0,1\]$
是分位数水平；$\\Lambda\_\\alpha$ 是分位数损失；右侧用 0.05 间隔的 19
个分位数对积分做离散近似。CRPS 越小，预测分布越接近真实值。

实际用 100 个样本近似分布 $F$，并取 0.05 间隔的 19 个分位数。填补实验报告的是对所有目标位置归一化后的平均 CRPS：

$$\\frac{\\sum\_{k,l}\\mathrm{CRPS}(F^{-1}*{k,l},x*{k,l})}{\\sum\_{k,l}\\lvert
x\_{k,l}\\rvert}$$

其中：$F^{-1}*{k,l}$ 是位置 $(k,l)$ 的预测分布的分位数函数；$x*{k,l}$
是真实值；分子对所有目标位置求和，分母是真实值绝对值之和；结果是归一化的平均
CRPS，越小越好。

预测实验用 CRPS-sum，即对"所有 $K$ 个特征之和"的分布算 CRPS：

$$\\frac{\\sum\_{l}\\mathrm{CRPS}\\big(F^{-1},\\sum\_k
x\_{k,l}\\big)}{\\sum\_{k,l}\\lvert x\_{k,l}\\rvert}$$

其中：$\\mathrm{CRPS}(F^{-1},\\sum\_k x\_{k,l})$ 是对第 $l$ 个时间点所有 $K$
个特征之和的分布计算的 CRPS；分子对时间点 $l$ 求和；分母是真实值绝对值之和，用于归一化。

### 填补

数据集：PhysioNet Challenge 2012 医疗数据（4000 条 ICU 时间序列，35 个变量，48 小时，处理成小时级后约
80% 缺失；因无真值，随机取 10/50/90% 观测值当测试真值）；北京空气质量数据（36 个站点 PM2.5，36 步为一条序列，约
13% 缺失，有人工构造的真值）。每个实验跑 5 次。

CRPS（越低越好，括号为标准误，下表省略）：

| 方法            | healthcare 10% | 50%   | 90%   | air quality |
| ------------- | -------------- | ----- | ----- | ----------- |
| Multitask GP  | 0.489          | 0.581 | 0.942 | 0.301       |
| GP-VAE        | 0.574          | 0.774 | 0.998 | 0.397       |
| V-RIN         | 0.808          | 0.831 | 0.922 | 0.526       |
| unconditional | 0.360          | 0.458 | 0.671 | 0.135       |
| CSDI          | 0.238          | 0.330 | 0.522 | 0.108       |

表中：「方法」是概率填补模型，10% / 50% / 90% 是 healthcare 数据上的测试缺失比例，最后一列是空气质量数据集，数值是
CRPS（越小越好）。结论：CSDI 在所有设置下最优，CRPS 较已有方法改善 40–65%。

论文摘要称 CRPS 较已有概率填补方法改善 40-65%，确定性填补 MAE 降低 5-20%。

MAE（带 (\*) 的行是论文引自原论文的结果，只有部分设置；论文表中的标准误此处省略）：

| 方法            | healthcare 10% | 50%   | 90%   | air quality |
| ------------- | -------------- | ----- | ----- | ----------- |
| V-RIN         | 0.271          | 0.365 | 0.606 | 25.4        |
| BRITS         | 0.284          | 0.368 | 0.517 | 14.11       |
| BRITS (\*)    | 0.278          | \-    | \-    | 11.56       |
| GLIMA (\*)    | 0.265          | \-    | \-    | 10.54       |
| RDIS          | 0.319          | 0.419 | 0.631 | 22.11       |
| unconditional | 0.326          | 0.417 | 0.625 | 12.13       |
| CSDI          | 0.217          | 0.301 | 0.481 | 9.60        |

表中：「方法」是对比模型（带 (\*) 的行引自原论文，"-"表示未给出），各列是确定性填补的 MAE（越小越好）。结论：CSDI
在所有设置下最优。

论文对结果的说明：healthcare 上基线与 CSDI 的差距在缺失率低时尤其明显，因为观测值更多，更利于 CSDI 学到依赖关系；CSDI
优于 unconditional 说明显式建模条件分布有益。论文图 4 的例子里，air quality 上 CSDI
给出高置信度且准确的填补，而 GP-VAE 的结果远离真值。

补充实验（论文附录 F）：

  - 采样数：论文称 5 到 10 个样本就足以估计出较好的分布并优于基线，样本数增加性能继续提升，超过 50 个后提升很小。
  - 噪声调度与 NLL：论文发现 ELBO（NLL 上界）受噪声调度影响很大，而 CRPS 几乎不受影响，因此认为 ELBO
    不适合评价样本质量，主要看 CRPS 和 MAE。

### 插值（不规则采样）

healthcare 数据按不规则采样处理（观测时间取整到分钟，每条序列有 $48\\times60$ 个可能的测量时刻），随机取
10/50/90% 的时间点作为真值。CRPS：

| 方法         | 10%   | 50%   | 90%   |
| ---------- | ----- | ----- | ----- |
| Latent ODE | 0.700 | 0.676 | 0.761 |
| mTANs      | 0.526 | 0.567 | 0.689 |
| CSDI       | 0.380 | 0.418 | 0.556 |

表中：「方法」是对比模型，10% / 50% / 90% 是随机取作测试真值的时间点比例，数值是 CRPS（越小越好）。结论：CSDI
在各比例下均优于对比方法。

### 概率预测

五个 GluonTS 常用数据集，评价指标 CRPS-sum（跑 3 次）：

| 方法        | solar | electricity | traffic | taxi  | wiki  |
| --------- | ----- | ----------- | ------- | ----- | ----- |
| GP-copula | 0.337 | 0.024       | 0.078   | 0.208 | 0.086 |
| TransMAF  | 0.301 | 0.021       | 0.056   | 0.179 | 0.063 |
| TLAE      | 0.124 | 0.040       | 0.069   | 0.130 | 0.241 |
| TimeGrad  | 0.287 | 0.021       | 0.044   | 0.114 | 0.049 |
| CSDI      | 0.298 | 0.017       | 0.020   | 0.123 | 0.047 |

表中：「方法」是对比模型，各数据集列是 CRPS-sum（越小越好）。结论：CSDI 在 electricity、traffic、wiki
上最优，其余数据集上有竞争力。

CSDI 在 electricity、traffic、wiki 上数值最低；solar 上 TLAE 最好，taxi 上 TimeGrad
最好。论文自己的结论是预测上 CSDI "有竞争力"，优势小于填补，并推测原因是预测数据集很少有缺失值、适合 RNN
之类的编码器，而填补时 RNN 处理缺失值相对困难（这是论文的假设，并非论文验证过的结论）。

## 优缺点与局限

论文自述：

  - 采样比其他生成模型慢；可考虑用 ODE solver 加速采样。
  - 后续方向：把填补与下游任务（如分类）联合训练；探索其他模态上的填补。

\[经验\] 以下为一般性判断，论文没有测过：

  - 每个样本需要 $T=50$ 步反向去噪，且为了得到分布要生成多个样本（论文用 100
    个），推理成本明显高于单次前向的判别式填补模型；论文只在局限里泛泛说"采样较慢"，没有给出耗时数据
    \[待核实\]。
  - 时间维注意力对长度 $L$、特征维注意力对特征数 $K$ 都是平方级开销；论文在特征数很多的预测任务里换成 linear
    attention 并对特征做子采样，与这一判断相符，但论文没有直接报告复杂度对比。
  - 目标选择策略与真实缺失机制不匹配（例如训练用
    Random、而实际是长段整块缺失）时效果可能下降；论文只说明"按缺失模式选策略"，没有系统测过失配情形。

## 与相关方法对比

| 方法                                                        | 类型               | 条件方式         | 论文中的关系                       |
| --------------------------------------------------------- | ---------------- | ------------ | ---------------------------- |
| TimeGrad                                                  | 自回归扩散，RNN 编码历史   | 以 RNN 隐状态为条件 | 论文称其因 RNN 不能直接用于填补；预测实验中作为基线 |
| unconditional 扩散填补                                        | 无条件扩散 + 近似       | 观测值随目标一起加噪   | 论文的消融基线                      |
| GP-VAE、Multitask GP、V-RIN                                 | 概率填补基线           | \-           | 论文 Table 2 的对比对象             |
| BRITS、GLIMA、RDIS                                          | 确定性填补基线（自回归/循环类） | \-           | 论文 Table 3 的对比对象             |
| DeepAR（见 [DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR)） | 自回归 RNN 输出参数化分布  | 条件为历史        | \[解读\] 它也是概率预测方法，但不做任意位置的填补  |

表中：「方法」是对比对象，「类型」是方法类别，「条件方式」说明其如何利用条件信息，「论文中的关系」说明其在论文中的角色。结论：CSDI
是非自回归的条件扩散，观测值作为干净条件输入，可直接用于填补。

综述 [Generative](/0607_ML_Tasks_TimeSeries_Generative) 与 [TimeSeries
总览](/0603_ML_Tasks_TimeSeries) 把 CSDI 归为"条件分数扩散，用于概率填补（也可预测）"，与论文一致。

## 使用方式

论文给出了官方代码（见 Reference）。下面是一段**示意代码，未运行验证**，只表达训练/采样的数据流，函数名为虚构：

``` python
# 训练一步（示意）
def train_step(model, x, M, strategy, alphas):   # x: (K,L), M: 观测掩码, alphas[t] 即累积 alpha_t
    m_co = strategy(M)                 # random / historical / mix / test
    m_ta = M - m_co                    # 目标位置
    t = randint(1, T+1)
    eps = randn_like(x) * m_ta         # 只在目标位置加噪
    x_t = sqrt(alphas[t]) * x * m_ta + sqrt(1 - alphas[t]) * eps
    pred = model(x_t, t, cond=m_co * x, m_co=m_co)
    return (((eps - pred) * m_ta) ** 2).sum() / m_ta.sum()

# 填补（示意）：对缺失位置生成多条样本，取中位数得到点估计
samples = [reverse_process(model, x, M) for _ in range(100)]
imputed = median(stack(samples))
```

## Reference

  - Tashiro et al., CSDI, NeurIPS 2021:
    <https://arxiv.org/abs/2107.03502>
  - 代码：<https://github.com/ermongroup/CSDI>
