---
Title | ML Tasks TimeSeries Generative TimeGrad
-- | --
Created @ | `2026-11-19T02:27:28Z`
Updated @| `2026-11-19T02:27:28Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/645)

---
# TimeGrad

TimeGrad 是 Zalando Research 的 Kashif Rasul、Calvin Seward、Ingmar Schuster、Roland Vollgraf 提出的**多变量概率时间序列预测**模型（论文 *Autoregressive Denoising Diffusion Models for Multivariate Probabilistic Time Series Forecasting*，arXiv:2101.12072；发表于 ICML 2021 [待核实：arXiv v2 版本本身未标注会议名]）。它是一个**自回归**模型：用 RNN 把历史（连同协变量）编码成隐状态 $\mathbf h_{t-1}$，再用一个以 $\mathbf h_{t-1}$ 为条件的**去噪扩散概率模型**（DDPM）为每个时间步采样整个 $D$ 维向量 $\mathbf x_t^0\in\mathbb R^D$。

一句话概括：**RNN 负责"时间上的条件"，扩散模型负责"每一步的 $D$ 维联合分布"；训练时是简单的噪声回归，推理时对每个时间步做 $N$ 步去噪、再把采样结果喂回 RNN 逐步往前滚。**

文中 $\mathbf x^0$ 的上标 $0$ 表示"干净数据"，上标 $n\in\{1,\dots,N\}$ 表示扩散步（噪声级别），下标 $t$ 才是时间；二者不要混淆。

## 解决什么问题

论文要解决的是**多变量（成百上千条相关序列）的概率预测**：不仅要预测每条序列的不确定性，还要刻画序列之间同一时刻的依赖。

- 经典方法（见 [ARIMA](/0624_ML_Tasks_TimeSeries_Classical_ARIMA)）一般给单变量点预测、逐条序列训练；深度全局模型（如 [DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR)）共享参数、可加协变量，但 DeepAR 对每个实体 $x_{i,t}^0$ 单独最大化似然，发射分布是单变量的（实数用高斯、计数用负二项）。
- 若简单地用"各维独立"的输出分布，共享参数只能学到时间上的模式，**无法刻画同一时刻各维之间的依赖**。
- 若显式建多元高斯：协方差使参数量增加 $O(D^2)$，计算损失 $O(D^3)$，不实用；而且依赖只限于二阶。低秩协方差近似可用（论文称为 Vec-LSTM，出自 Salinas et al. 2019a），但分布族仍被限制。
- 归一化流等"可算似然"的方法对函数结构有要求（如 Jacobian 行列式）；论文还认为流模型要做连续变换，难以刻画不连通的多个模态，会在模态之间给出虚假密度，VAE 的生成网络也有类似困难，而 EBM 没有这类问题（论文观点，引 Du & Mordatch 2019）。
- 能量模型（EBM）函数形式限制少，但一般难训练。论文借助 Ho et al. 2020 的 DDPM 形式，并保留自回归模型在外推上的优势。

## 核心思想

TimeGrad 把"每个时间步的输出分布"从高斯/流换成条件扩散模型：

```
 历史 x_{1:t-1}, 协变量 c          RNN                   去噪网络 eps_theta
 ───────────────────────►  h_{t-1} ─────► x_t^N ~ N(0,I) ──► x_t^{N-1} ──► ... ──► x_t^0
                                          (N 次去噪都以同一个 h_{t-1} 为条件)
```

- 联合分布按时间做自回归分解；
- 每个因子 $p_\theta(\mathbf x_t^0\mid\mathbf h_{t-1})$ 是一个**任意形状**的 $D$ 维分布，由扩散模型隐式给出，不需要写出协方差，也不需要可逆变换。

## 扩散模型回顾（论文 Section 2）

**前向过程**（固定，不训练）是一条逐步加高斯噪声的马尔可夫链，方差表 $\beta_1,\dots,\beta_N$ 递增，$\beta_n\in(0,1)$：

$$q(\mathbf x^{1:N}\mid\mathbf x^0)=\prod_{n=1}^N q(\mathbf x^n\mid\mathbf x^{n-1}),\qquad q(\mathbf x^n\mid\mathbf x^{n-1})=\mathcal N\big(\mathbf x^n;\ \sqrt{1-\beta_n}\,\mathbf x^{n-1},\ \beta_n\mathbf I\big)$$

记 $\alpha_n=1-\beta_n$，$\bar\alpha_n=\prod_{i=1}^n\alpha_i$（累乘），则任意噪声级别 $n$ 可由 $\mathbf x^0$ 一步闭式采样：

$$q(\mathbf x^n\mid\mathbf x^0)=\mathcal N\big(\mathbf x^n;\ \sqrt{\bar\alpha_n}\,\mathbf x^0,\ (1-\bar\alpha_n)\mathbf I\big)$$

等价地 $\mathbf x^n=\sqrt{\bar\alpha_n}\,\mathbf x^0+\sqrt{1-\bar\alpha_n}\,\epsilon$，$\epsilon\sim\mathcal N(\mathbf 0,\mathbf I)$。这是训练时"随机抽一个 $n$ 就能算一次损失"的原因。

**反向过程**（学习）从 $p(\mathbf x^N)=\mathcal N(\mathbf x^N;\mathbf 0,\mathbf I)$ 出发，是一条带学习到的高斯转移的马尔可夫链：

$$p_\theta(\mathbf x^{0:N})=p(\mathbf x^N)\prod_{n=N}^{1}p_\theta(\mathbf x^{n-1}\mid\mathbf x^n),\qquad p_\theta(\mathbf x^{n-1}\mid\mathbf x^n)=\mathcal N\big(\mathbf x^{n-1};\ \mu_\theta(\mathbf x^n,n),\ \Sigma_\theta(\mathbf x^n,n)\mathbf I\big)$$

其中 $\mu_\theta,\Sigma_\theta$ 都以 $\mathbf x^n$ 和噪声索引 $n$ 为输入。$p_\theta(\mathbf x^{n-1}\mid\mathbf x^n)$ 的作用就是"消去前向过程加的那一点噪声"。

**变分下界。** 最小化负对数似然的上界（Jensen 不等式）：

$$\min_\theta\ \mathbb E_{q(\mathbf x^0)}\big[-\log p_\theta(\mathbf x^0)\big]\ \le\ \min_\theta\ \mathbb E_{q(\mathbf x^{0:N})}\big[-\log p_\theta(\mathbf x^{0:N})+\log q(\mathbf x^{1:N}\mid\mathbf x^0)\big]$$

利用马尔可夫性，该上界可写成 KL 散度之和：

$$-\log p_\theta(\mathbf x^0\mid\mathbf x^1)+D_{\mathrm{KL}}\big(q(\mathbf x^N\mid\mathbf x^0)\,\|\,p(\mathbf x^N)\big)+\sum_{n=2}^{N}D_{\mathrm{KL}}\big(q(\mathbf x^{n-1}\mid\mathbf x^n,\mathbf x^0)\,\|\,p_\theta(\mathbf x^{n-1}\mid\mathbf x^n)\big)$$

条件在 $\mathbf x^0$ 上的前向后验是可解的高斯：

$$q(\mathbf x^{n-1}\mid\mathbf x^n,\mathbf x^0)=\mathcal N\big(\mathbf x^{n-1};\ \tilde\mu_n(\mathbf x^n,\mathbf x^0),\ \tilde\beta_n\mathbf I\big)$$

$$\tilde\mu_n(\mathbf x^n,\mathbf x^0)=\frac{\sqrt{\bar\alpha_{n-1}}\,\beta_n}{1-\bar\alpha_n}\,\mathbf x^0+\frac{\sqrt{\alpha_n}\,(1-\bar\alpha_{n-1})}{1-\bar\alpha_n}\,\mathbf x^n,\qquad \tilde\beta_n=\frac{1-\bar\alpha_{n-1}}{1-\bar\alpha_n}\,\beta_n$$

两个高斯之间的 KL 只剩均值的平方误差（$C$ 与 $\theta$ 无关）：

$$D_{\mathrm{KL}}\big(q(\mathbf x^{n-1}\mid\mathbf x^n,\mathbf x^0)\,\|\,p_\theta(\mathbf x^{n-1}\mid\mathbf x^n)\big)=\mathbb E_q\Big[\frac1{2\Sigma_\theta}\big\|\tilde\mu_n(\mathbf x^n,\mathbf x^0)-\mu_\theta(\mathbf x^n,n)\big\|^2\Big]+C$$

**噪声预测参数化。** 利用 $\mathbf x^n=\sqrt{\bar\alpha_n}\,\mathbf x^0+\sqrt{1-\bar\alpha_n}\,\epsilon$ 可把 $\tilde\mu_n$ 改写成关于 $\mathbf x^n$ 与 $\epsilon$ 的式子，于是让网络 $\epsilon_\theta$ 去预测噪声 $\epsilon$，并令

$$\mu_\theta(\mathbf x^n,n)=\frac1{\sqrt{\alpha_n}}\Big(\mathbf x^n-\frac{\beta_n}{\sqrt{1-\bar\alpha_n}}\,\epsilon_\theta(\mathbf x^n,n)\Big)$$

目标函数化简为（论文式 7）：

$$\mathbb E_{\mathbf x^0,\epsilon}\Big[\frac{\beta_n^2}{2\Sigma_\theta\,\alpha_n(1-\bar\alpha_n)}\,\big\|\epsilon-\epsilon_\theta\big(\sqrt{\bar\alpha_n}\,\mathbf x^0+\sqrt{1-\bar\alpha_n}\,\epsilon,\ n\big)\big\|^2\Big]$$

论文指出它类似 Noise Conditional Score Networks 中的 score matching 损失，并因此把推理采样描述为类似 Langevin dynamics。

## TimeGrad 的建模方式（论文 Section 3）

**符号。** 多变量序列 $\mathbf x_t^0\in\mathbb R^D$，分量为 $x_{i,t}^0$，$i\in\{1,\dots,D\}$。把一段序列切成上下文窗口 $[1,t_0)$ 与预测区间 $[t_0,T]$。协变量 $\mathbf c_t$ 在整个预测区间已知。

**自回归分解**（论文式 8）：

$$q_{\mathcal X}\big(\mathbf x^0_{t_0:T}\mid\mathbf x^0_{1:t_0-1},\mathbf c_{1:T}\big)=\prod_{t=t_0}^{T}q_{\mathcal X}\big(\mathbf x_t^0\mid\mathbf x^0_{1:t-1},\mathbf c_{1:T}\big)$$

每个因子用条件去噪扩散模型学习。

**RNN 编码**（论文式 9，LSTM 或 GRU，多层，共享权重）：

$$\mathbf h_t=\mathrm{RNN}_\theta\big(\mathrm{concat}(\mathbf x_t^0,\mathbf c_t),\ \mathbf h_{t-1}\big),\qquad \mathbf h_0=\mathbf 0$$

于是式 8 被近似为（论文式 10）：

$$\prod_{t=t_0}^{T}p_\theta\big(\mathbf x_t^0\mid\mathbf h_{t-1}\big)$$

这里 $\theta$ 同时包含 RNN 与去噪网络的权重。它之所以是自回归的，是因为 $\mathbf h_{t-1}$ 消费了 $t-1$ 时刻的观测（推理时是上一步的采样值）。

**条件如何嵌入。** 与 DDPM 唯一的区别是：噪声预测网络多了一个输入，写作 $\epsilon_\theta(\mathbf x_t^n,\mathbf h_{t-1},n)$。**每个时间步各自有一条完整的"加噪-去噪链"，链内部所有 $N$ 次去噪都以同一个 $\mathbf h_{t-1}$ 为条件**；时间上的依赖只通过 $\mathbf h$ 传递，扩散步 $n$ 与时间步 $t$ 是两层不同的循环。

### 训练

从训练序列随机采样"上下文窗口 + 紧随其后的预测窗口"，对预测窗口里每个 $t\in[t_0,T]$ 最小化负对数似然 $\sum_t-\log p_\theta(\mathbf x_t^0\mid\mathbf h_{t-1})$，其中起始状态 $\mathbf h_{t_0-1}$ 来自 RNN 跑完上下文窗口。选 $\Sigma_\theta=\tilde\beta_n$ 时，按上一节同样的推导，得到条件版的目标：

$$\mathbb E_{\mathbf x_t^0,\epsilon,n}\Big[\big\|\epsilon-\epsilon_\theta\big(\sqrt{\bar\alpha_n}\,\mathbf x_t^0+\sqrt{1-\bar\alpha_n}\,\epsilon,\ \mathbf h_{t-1},\ n\big)\big\|^2\Big]$$

Algorithm 1（每个时间步）：

```
输入: 数据 x_t^0 ~ q_X(x_t^0), 状态 h_{t-1}
repeat
    n ~ Uniform(1..N);  eps ~ N(0, I)
    对 || eps - eps_theta( sqrt(abar_n) x_t^0 + sqrt(1-abar_n) eps,  h_{t-1}, n ) ||^2 做一次梯度步
until 收敛
```

这里的损失把式 7 中的权重系数 $\frac{\beta_n^2}{2\Sigma_\theta\alpha_n(1-\bar\alpha_n)}$ 去掉了，即"简化损失"（论文称其为 simplification of (7)）。训练时不需要在扩散步上循环去噪网络，每个样本只抽一个 $n$；论文也指出这与流模型需要多层双射堆叠不同。

[解读] 训练时 RNN 的输入是真实值（teacher forcing），所以整个预测窗口的 $\mathbf h_{t-1}$ 可以一次展开 RNN 全部算出，再对各 $t$ 各抽独立的 $(n,\epsilon)$ 并行算损失。论文只写了"对每个时间步"的算法，并行化细节以官方代码为准。

### 推理（采样）

对时间步 $t$，已知 $\mathbf h_{t-1}$，Algorithm 2（论文称 annealed Langevin dynamics 形式的采样）：从 $\mathbf x_t^N\sim\mathcal N(\mathbf 0,\mathbf I)$ 起，对 $n=N,\dots,1$：

$$\mathbf x_t^{n-1}=\frac1{\sqrt{\alpha_n}}\Big(\mathbf x_t^n-\frac{\beta_n}{\sqrt{1-\bar\alpha_n}}\,\epsilon_\theta(\mathbf x_t^n,\mathbf h_{t-1},n)\Big)+\sqrt{\Sigma_\theta}\,\mathbf z$$

其中 $n>1$ 时 $\mathbf z\sim\mathcal N(\mathbf 0,\mathbf I)$，$n=1$ 时 $\mathbf z=\mathbf 0$。返回 $\mathbf x_t^0$。论文训练时取 $\Sigma_\theta=\tilde\beta_n$，采样用同一方差。

[解读] 严格说这是 DDPM 的祖先采样（每步加噪、去噪的随机转移），论文称其"类似 Langevin dynamics"；$N$ 步之间不能并行。

整体的滚动预测流程：

```
1. 用 RNN 跑完最近的上下文窗口，得到 h_T
2. 用 Algorithm 2 采样 x_{T+1}^0
3. 把 x_{T+1}^0 与协变量 c_{T+1} 一起送入 RNN 得 h_{T+1}（自回归）
4. 重复直到预测步长用完 -> 得到一条采样轨迹
5. 整个过程重复 S 次（论文例：S = 100）-> 对每个维度、每个时间点取经验分位数
```

论文还有两处处理：**缩放**（Section 3.3）——每个序列除以其上下文窗口均值（若为 0 则用 1），推理时样本乘回同样的均值，据称显著降低了问题难度（引 DeepAR）；Traffic 数据集不需要缩放。**协变量**（Section 3.4）——时间相关特征（星期几、小时）、时间无关的类别嵌入，以及按数据频率设定的滞后（lag）特征。论文还说：LSTNet 那种"输入到输出的短接"在这里不适用。

## 网络结构与超参（论文 Section 4.2）

- 优化：Adam，学习率 $1\times10^{-3}$；批大小 64（随机窗口，允许重叠），上下文长度设为预测步数；用与测试集等大的验证集做 early stopping。
- 扩散：$N=100$ 步，线性方差表，$\beta_1=1\times10^{-4}$ 到 $\beta_N=0.1$。
- RNN：2 层 LSTM，隐状态 $\mathbf h_t\in\mathbb R^{40}$。
- 扩散步 $n$ 的编码：Transformer 式 Fourier 位置编码（$N_{\max}=500$），映射成 $\mathbb R^{32}$ 向量。
- 去噪网络 $\epsilon_\theta$：借自 WaveNet / DiffWave 的条件一维空洞卷积残差网络，8 个残差块，带 gated activation unit，各块的 skip-connection 输出相加得到最终输出；除最后一层外卷积输出通道为 8；每块用双向空洞卷积，空洞率 $2^{i\%2}$。输入为 $\mathbf x_t^n$、噪声嵌入和 $\mathbf h_{t-1}$（经全连接变换到合适大小）。论文图 2 注明卷积为一维、circular padding 使空间大小保持 $D$，即卷积沿**维度 $D$ 方向**进行。
- 评估时每个预测用 $S=100$ 条轨迹；单张 V100 16GB。

[解读] 沿维度 $D$ 做卷积意味着相邻维度被当作"邻居"；论文在相关工作中承认维度顺序固定、相邻实体尺度可相差一个数量级，但没有做对维度排列是否敏感的实验。

## 评估指标：为什么用 CRPS-sum

CRPS（Continuous Ranked Probability Score）衡量预测 CDF $F$ 与观测 $x$ 的相容度：

$$\mathrm{CRPS}(F,x)=\int_{\mathbb R}\big(F(z)-\mathbb I\{x\le z\}\big)^2\,\mathrm dz$$

它是适当评分规则（proper scoring function），预测分布等于数据分布时取最小。用 $S$ 个样本 $X_s\sim F$ 的经验 CDF $\hat F(z)=\frac1S\sum_{s=1}^S\mathbb I\{X_s\le z\}$ 即可直接由采样计算。**CRPS-sum** 先把 $D$ 个维度求和（真值与样本都求和，得到 $\hat F_{\mathrm{sum}}(t)$），再对预测时间步取平均：

$$\mathrm{CRPS}_{\mathrm{sum}}=\mathbb E_t\Big[\mathrm{CRPS}\Big(\hat F_{\mathrm{sum}}(t),\ \sum_i x_{i,t}^0\Big)\Big]$$

论文给出的理由：CRPS-sum 也是 proper scoring function（引 de Bézenac et al. 2020），并且对比的方法并非都有解析的预测分布，或者似然没有意义，所以用基于样本的指标，而不用基于似然的指标。

[解读] 由于只需要样本，TimeGrad（隐式分布）与流模型、Copula 模型可以放在同一指标下比较。CRPS-sum 先求和再评估，考察的是"总量"预测分布的好坏，只能间接反映维间相关性是否被正确建模。论文正文说既算每个维度的 CRPS 也算 CRPS-sum，但 Table 2 只汇报 CRPS-sum。

## 实验结果（论文 Section 4）

**数据集**（预处理与 Salinas et al. 2019a 相同，论文 Table 1）：

数据集 | 维度 $D$ | 频率 | 总训练时间步 | 预测步数
-- | -- | -- | -- | --
Exchange | 8 | 天 | 6,071 | 30
Solar | 137 | 小时 | 7,009 | 24
Electricity | 370 | 小时 | 5,833 | 24
Traffic | 963 | 小时 | 4,001 | 24
Taxi | 1,214 | 30 分钟 | 1,488 | 24
Wikipedia | 2,000 | 天 | 792 | 30

**主结果**（论文 Table 2，测试集 CRPS-sum，越低越好；TimeGrad 为重新训练评估 10 次的均值，省略了标准误；这里只摘录几行，数字与论文渲染页核对过）：

方法 | Exchange | Solar | Electricity | Traffic | Taxi | Wikipedia
-- | -- | -- | -- | -- | -- | --
Vec-LSTM ind-scaling | 0.008 | 0.391 | 0.025 | 0.087 | 0.506 | 0.133
GP-Copula | 0.007 | 0.337 | 0.0245 | 0.078 | 0.208 | 0.086
Transformer-MAF | 0.005 | 0.301 | 0.0207 | 0.056 | 0.179 | 0.063
TimeGrad | 0.006 | 0.287 | 0.0206 | 0.044 | 0.114 | 0.0485

论文的结论：TimeGrad 在除最小的 Exchange 数据集外的其余数据集上最优（Exchange 上 VES、VAR、Transformer-MAF 均为 0.005，TimeGrad 为 0.006）。完整的 VES、VAR、VAR-Lasso、GARCH、KVAE 等基线数字请查论文 Table 2。

**消融**（Section 4.4，Electricity）：改变扩散长度 $N=2,4,8,\dots,256$，论文称 $N$ 可以降到约 10 而性能没有显著下降，最优在 $N\approx100$ 附近，更大的 $N$ 在其他超参不变时没有益处，其他数据集也有类似现象（图 3）。这里不引用具体数值。

**预测可视化**：论文图 4 给出 Traffic 前 6 维的中位数、50% 与 90% 预测区间。

## 一个自拟的小例子（自拟示意，非论文数值）

假设方差表是从 $\beta_1=10^{-4}$ 到 $\beta_{100}=0.1$ 的严格线性插值（论文只写"线性方差表"，具体离散化 [待核实]），则 $\bar\alpha_{100}=\prod_{i=1}^{100}(1-\beta_i)\approx0.0056$，$\sqrt{\bar\alpha_{100}}\approx0.075$，$\sqrt{1-\bar\alpha_{100}}\approx0.997$，即 $\mathbf x^{100}\approx0.075\,\mathbf x^0+0.997\,\epsilon$：信号几乎被噪声淹没，所以用 $\mathcal N(\mathbf 0,\mathbf I)$ 作为反向链起点是合理的。

再算采样代价：设 Electricity（预测 24 步）、$N=100$、$S=100$，则一个预测窗口需要调用去噪网络 $24\times100\times100=240{,}000$ 次（$S$ 条轨迹彼此独立，可在 batch 维并行，但时间步与扩散步必须串行）。

## 与 DeepAR 的联系与区别

[DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR) 与 TimeGrad 在"自回归 + RNN 隐状态 + 采样得到预测轨迹 + 协变量 + 缩放"这条主线上几乎一致，区别在**每步的输出分布**：

维度 | DeepAR | TimeGrad
-- | -- | --
目标 | 单变量，每个实体各自的似然 | 多变量，每步一个 $D$ 维向量的联合分布
输出分布 | 参数化分布（高斯 / 负二项），由 RNN 状态映射出参数 | 条件扩散模型，隐式分布，RNN 隐状态作条件
训练 | 直接最大化对数似然 | 优化变分下界，简化为噪声回归的 MSE
单步采样代价 | 一次前向加一次分布采样 | $N$ 次去噪网络前向（论文用 $N=100$）
似然 | 解析可得 | 只有下界，评估用 CRPS 类指标
维间依赖 | 单变量发射分布不显式刻画 | 联合分布由扩散模型刻画，无需写协方差

## 与其他方法的对比

- **Vec-LSTM（低秩协方差）/ GP-Copula**：分布族固定为（Copula 变换后的）低秩加对角高斯，TimeGrad 去掉了这一限制。
- **Transformer-MAF**（Rasul et al. 2021，第一作者与本文相同）：时间上用 Transformer，输出用 Masked Autoregressive Flow；TimeGrad 把输出分布换成扩散模型、时间部分用 RNN。论文 Table 2 中 TimeGrad 在多数数据集上更好。
- **后续扩散类方法**（CSDI、TSDiff 等）：见 [生成式模型综述](/0607_ML_Tasks_TimeSeries_Generative)。[解读] TimeGrad 为预测任务训练的条件模型，每个时间步一条扩散链；CSDI 是非自回归的条件分数扩散，综述里主要用于填补。

## 优缺点与局限

论文自述：

- 训练时不需要在 $\epsilon_\theta$ 上循环，但**采样时要对 $\epsilon_\theta$ 循环 $N$ 次**。缓解方向：改进方差表与 L1 损失以更少步数采样（Chen et al. 2021），或非马尔可夫的加速采样（Song et al. 2021），这些不是 TimeGrad 实验的一部分。
- 对离散数据不需要像流模型那样做 dequantization，显式建模离散分布留作未来工作。
- 论文还提到 EBM 的 OOD 检测潜力，但并未在本文实验。

[解读]：

- 自回归采样的误差会沿预测步长累积（论文未做长预测的专门分析）。
- 去噪网络沿维度方向卷积，模型可能与 $D$ 个维度的排列方式有关（论文没有做排列敏感性实验）。
- 推理成本正比于预测步数 $\times N\times S$，长预测、大 $D$ 时尤为明显。
- 评估只用 CRPS-sum，对分布形状与维间相关性的验证比较间接。

## 使用方式

论文（arXiv v2）写明"源码将在评审后公开"；我没有核实官方仓库地址，不在此列出，使用时请自行查找作者页或论文页 [待核实：官方/社区实现的仓库名与路径]。落地时的要点：按序列用上下文窗口均值缩放；协变量要在预测区间已知；每次预测抽 $S$ 条轨迹后取分位数（论文取 $S=100$）；去噪步数 $N$ 在 10 到 100 之间权衡速度与效果（依据论文 Electricity 消融，其他数据 [待核实]）。

下面是实现思路的**示意代码，未运行验证**：

```python
# 示意代码，未运行验证
import torch, torch.nn as nn

class TimeGradSketch(nn.Module):
    def __init__(self, D, cov_dim, N=100, hid=40):
        super().__init__()
        self.N = N
        self.rnn = nn.LSTM(D + cov_dim, hid, num_layers=2, batch_first=True)
        self.eps_net = EpsNet(D, hid)              # 条件空洞卷积残差网络，输入 (x_n, h, n)
        beta = torch.linspace(1e-4, 0.1, N)
        self.register_buffer("beta", beta)
        self.register_buffer("abar", torch.cumprod(1 - beta, 0))

    def loss(self, x, c):                           # x: (B, T, D)，已除以上下文均值
        h, _ = self.rnn(torch.cat([x, c], -1))      # h[:, t] 即 h_t；用 h[:, t-1] 预测 x_t
        x0, hc = x[:, 1:], h[:, :-1]
        n = torch.randint(0, self.N, x0.shape[:2])
        eps = torch.randn_like(x0)
        a = self.abar[n].unsqueeze(-1)
        xn = a.sqrt() * x0 + (1 - a).sqrt() * eps
        return ((eps - self.eps_net(xn, hc, n)) ** 2).mean()
```

## Reference

- Rasul, Seward, Schuster, Vollgraf. *Autoregressive Denoising Diffusion Models for Multivariate Probabilistic Time Series Forecasting*. arXiv:2101.12072. https://arxiv.org/abs/2101.12072
- Ho, Jain, Abbeel. *Denoising Diffusion Probabilistic Models*. arXiv:2006.11239. https://arxiv.org/abs/2006.11239
- Salinas et al. *DeepAR*. arXiv:1704.04110；本站文章见 [DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR)

