---
Title | ML Tasks TimeSeries Deep TFT
-- | --
Created @ | `2026-11-19T01:59:51Z`
Updated @| `2026-11-19T06:20:55Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/634)

---
# TFT

TFT（Temporal Fusion Transformer）出自论文 *Temporal Fusion Transformers for Interpretable Multi-horizon Time Series Forecasting*（Bryan Lim、Sercan Ö. Arık、Nicolas Loeff、Tomas Pfister；Oxford 与 Google Cloud AI，arXiv:1912.09363）。它面向**多 horizon 预测**：输入里同时有静态协变量、已知未来输入和只在过去被观测到的外生序列，模型直接输出每个未来 horizon 的**分位数**，并且结构本身能给出变量重要性、时间模式等解释。

一句话概括：**用 GRN 门控 + 变量选择网络处理异质输入，用静态编码器产生上下文向量，LSTM 编码器-解码器做局部处理，一层可解释多头注意力做长程依赖，最后线性输出分位数，用分位数损失训练。**

在时间序列总览里，TFT 属于"带协变量的深度预测"这一类，参见 [时间序列总览](/0603_ML_Tasks_TimeSeries) 与 [深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)；评估指标见 [指标](/0610_ML_Tasks_TimeSeries_Metrics)。

## 解决什么问题

### 三类输入

论文 Fig. 1 和 Sec. 3 把输入分成三类。设有 $I$ 个实体（门店、病人等），实体 $i$ 在时刻 $t$ 有：

输入类型 | 例子 | 记号 | 未来是否已知
-- | -- | -- | --
静态协变量 | 门店位置、实体 ID | $s_i$ | 不随时间变
已知输入 | 星期、节假日、促销 | $x_{i,t}$ | 是
观测输入 | 历史客流、过去的目标值 | $z_{i,t}$ | 否，只到预测起点 $t$

预测形式（论文式 1）：

$$
\hat y_i(q,t,\tau)=f_q\big(\tau,\ y_{i,t-k:t},\ z_{i,t-k:t},\ x_{i,t-k:t+\tau},\ s_i\big)\tag{1}
$$

$\hat y_i(q,t,\tau)$ 是在时刻 $t$ 对 $\tau$ 步之后的第 $q$ 分位数预测，$k$ 是回看窗口。一次性输出 $\tau\in\{1,\dots,\tau_{\max}\}$ 的全部 horizon，这是**直接式（direct）多 horizon** 预测。

### 已有方法的不足（论文观点）

- **迭代式（自回归）模型**（如 DeepAR、DSSM）把一步预测递归地喂回输入，因此要求除目标外**所有输入未来都已知**；"只在过去观测到"的输入没法自然处理；
- 有的模型忽略静态协变量，或只把它简单拼接到每个时间步；
- 多数深度模型是黑盒。标准注意力只能指出哪些**时间步**重要，区分不了同一时间步上哪些**变量**重要；LIME、SHAP 这类事后方法不考虑时间顺序依赖。

TFT 的出发点是：给网络加上与多 horizon 预测匹配的**归纳偏置**（论文原话是"suitable inductive biases"），同时让这些组件顺带提供可解释性。

## 核心思想与结构

论文列出的五个组成部分：门控机制、变量选择网络、静态协变量编码器、时间处理（LSTM seq2seq + 注意力）、分位数输出。整体流程（对应论文 Fig. 2，ASCII 为本文所画）：

```
静态 s ──► 静态变量选择 ──► 静态编码器(4 个 GRN) ──► c_s, c_e, c_c, c_h
                                                      │    │    └────────┐
过去输入 [t-k..t]  ──► 变量选择(受 c_s) ──► LSTM 编码器(初始态 c_c,c_h) ──┐ │
未来已知 [t+1..t+τmax] ─► 变量选择(受 c_s) ─► LSTM 解码器 ────────────────┤ │
                                      门控+残差+LayerNorm ◄───────────────┘ │
                                              │                              │
                         静态增强层 GRN(受 c_e) ◄──────────────────────────────┘
                                              │
                          掩码可解释多头自注意力 + 门控 + LayerNorm
                                              │
                                      位置前馈 GRN
                                              │
              门控 + LayerNorm（残差跨过整个注意力块，直连 LSTM 层输出）
                                              │
                          线性层 ──► 每个 horizon 的 q=0.1/0.5/0.9
```

### GRN（Gated Residual Network）

GRN 是 TFT 的基本积木，输入主向量 $a$ 与可选上下文 $c$（论文式 2-5）：

$$
\begin{aligned}
\mathrm{GRN}(a,c)&=\mathrm{LayerNorm}\big(a+\mathrm{GLU}(\eta_1)\big)\\
\eta_1&=W_1\eta_2+b_1\\
\eta_2&=\mathrm{ELU}(W_2a+W_3c+b_2)\\
\mathrm{GLU}(\gamma)&=\sigma(W_4\gamma+b_4)\odot(W_5\gamma+b_5)
\end{aligned}
$$

- 无上下文时 $c=0$；$\eta_1,\eta_2\in\mathbb R^{d_{\text{model}}}$；$\odot$ 是逐元素乘。
- 论文对 ELU 的解释：$W_2a+W_3c+b_2\gg0$ 时 ELU 近似恒等，$\ll0$ 时输出近似常数，整体表现为线性层。
- GLU 的 sigmoid 门可趋近 0，于是**整个 GRN 的非线性贡献可以被关掉，只剩 $a$ 的残差**，等于"跳过这一层"。论文动机：事先不知道需要多少非线性，数据小或噪声大时简单模型更好，让网络**按需自适应深度**。
- 训练时 dropout 加在 $\eta_1$ 上（门控与 LayerNorm 之前）。

[解读] 可以把 GRN 看成"带残差的 MLP + 可学习开关 + 可选条件输入"，TFT 里几乎每处非线性变换都是它。

### 变量选择网络（Variable Selection Network）

作用：**逐样本、逐时间步**挑出相关变量，抑制噪声输入，并给出可读的重要性权重。

1. 每个变量先变成 `d_model` 维向量：类别变量用 entity embedding，连续变量用线性变换（维度统一以便做跳连）；
2. 对第 $t$ 步，把 $m$ 个变量向量拼成 $\Xi_t$，与静态上下文 $c_s$ 一起过 GRN 再 Softmax（式 6）；
3. 每个变量另有自己的 GRN 做进一步非线性处理（跨时间步共享权重，式 7）；
4. 加权求和（式 8）。

$$
\begin{aligned}
v_t&=\mathrm{Softmax}\big(\mathrm{GRN}_v(\Xi_t,c_s)\big)\in\mathbb R^m\\
\tilde\xi_t^{(j)}&=\mathrm{GRN}_j\big(\xi_t^{(j)}\big)\\
\tilde\xi_t&=\sum_{j=1}^{m}v_t^{(j)}\,\tilde\xi_t^{(j)}
\end{aligned}
$$

静态、过去、未来三类输入各用**独立**的变量选择网络；静态那个不带 $c_s$（它本身就是静态信息的来源）。

### 静态协变量编码器

用四个**独立**的 GRN 把静态变量选择的输出 $\zeta$ 编码成四个上下文向量（如 $c_s=\mathrm{GRN}_{c_s}(\zeta)$），接到解码器不同位置：

上下文 | 去向
-- | --
$c_s$ | 时间变量选择网络
$c_c$、$c_h$ | 分别初始化第一层 LSTM 的 cell 状态和 hidden 状态（局部处理）
$c_e$ | 静态增强层

动机：静态信息（如门店属性）会影响整个时间动态，与其每步拼接，不如让它**条件化**多个处理环节。

### LSTM 编码-解码（局部处理）

过去的 $\tilde\xi_{t-k:t}$ 送入 LSTM 编码器，未来已知的 $\tilde\xi_{t+1:t+\tau_{\max}}$ 送入 LSTM 解码器，得到一组统一的时间特征 $\phi(t,n)$，$n\in[-k,\tau_{\max}]$ 是位置索引。

- 论文理由：时序中的异常点、变点、周期都靠"与周围值的关系"识别，注意力前先做局部处理有益；Li 等人的 ConvTrans 用单层卷积做局部增强，但过去与未来的输入个数不同（存在观测输入），同一个卷积核不合适，所以改用 seq2seq。
- 它同时**替代了位置编码**，提供时间顺序的归纳偏置。
- 论文实验用 LSTM 编码-解码以便与常用 seq2seq 基线比较，称也可用其他模型。
- 之后接一个门控跳连（式 17）：$\tilde\phi(t,n)=\mathrm{LayerNorm}\big(\tilde\xi_{t+n}+\mathrm{GLU}(\phi(t,n))\big)$。

### 静态增强层

$\theta(t,n)=\mathrm{GRN}\big(\tilde\phi(t,n),c_e\big)$（式 18），层内权重在所有位置共享。把静态元数据重新注入时间特征。

### 可解释多头注意力

标准多头注意力（式 9-12）每个头有独立的 $W_V^{(h)}$，值空间不同，因此注意力权重本身不能代表某个特征的重要性。TFT 的修改（式 13-16）：**所有头共享同一个值投影 $W_V$，并对各头的注意力矩阵相加取平均**：

$$
\begin{aligned}
\mathrm{InterpretableMultiHead}(Q,K,V)&=\tilde H\,W_H\\
\tilde H&=\tilde A(Q,K)\,V\,W_V\\
\tilde A(Q,K)&=\frac{1}{m_H}\sum_{h=1}^{m_H}\mathrm{Softmax}\!\left(\frac{QW_Q^{(h)}\big(KW_K^{(h)}\big)^{\top}}{\sqrt{d_{\text{attn}}}}\right)
\end{aligned}
$$

各头仍有不同的 $W_Q^{(h)},W_K^{(h)}$，可以学不同的时间模式，但都作用在同一组值上，因此可以看作对注意力权重的简单集成，得到单个矩阵 $\tilde A$，可直接读作"各位置对各位置的贡献"。论文取 $d_V=d_{\text{attn}}=d_{\text{model}}/m_H$，序列长度 $N=\tau_{\max}+k+1$。

- **解码器掩码**：每个位置只能看它之前的位置，保持因果。
- 注意力之后再接门控+LayerNorm：$\delta(t,n)=\mathrm{LayerNorm}\big(\theta(t,n)+\mathrm{GLU}(\beta(t,n))\big)$（式 20），然后是位置前馈 GRN：$\psi(t,n)=\mathrm{GRN}(\delta(t,n))$（式 21），最后一个门控残差**跨过整个注意力块**：$\tilde\psi(t,n)=\mathrm{LayerNorm}\big(\tilde\phi(t,n)+\mathrm{GLU}(\psi(t,n))\big)$（式 22），给出一条直达 LSTM 层的路径——如果注意力块没用，模型可以退化成更简单的结构。
- 论文为保持可解释性，**只用单个**注意力层。

### 分位数输出与损失

输出层是对解码器输出的线性变换（式 23），只对未来 horizon 输出：

$$
\begin{aligned}
\hat y(q,t,\tau)&=W_q\,\tilde\psi(t,\tau)+b_q,\quad \tau\in\{1,\dots,\tau_{\max}\}\qquad(\tilde\psi\text{ 为式 22 的输出})\\
\mathrm{QL}(y,\hat y,q)&=q\,(y-\hat y)_++(1-q)\,(\hat y-y)_+,\qquad (x)_+=\max(0,x)\\
L&=\sum_{y_t\in\Omega}\sum_{q\in Q}\sum_{\tau=1}^{\tau_{\max}}\frac{\mathrm{QL}\big(y_t,\hat y(q,t-\tau,\tau),q\big)}{M\,\tau_{\max}}
\end{aligned}
$$

$M$ 是训练样本数；论文实验取 $Q=\{0.1,0.5,0.9\}$。评估用归一化 q-Risk（式 26）：$q\text{-Risk}=\dfrac{2\sum\sum\mathrm{QL}\big(y_t,\hat y(q,t-\tau,\tau),q\big)}{\sum\sum\lvert y_t\rvert}$，求和遍历测试样本与 $\tau$，论文报告 $q=0.5$ 与 $0.9$（即 P50、P90）。

**自拟小例子（示意，已手算）**：真实值 $y=10$，取 $q=0.9$。若 $\hat y=8$（低估 2），$\mathrm{QL}=0.9\times2=1.8$；若 $\hat y=12$（高估 2），$\mathrm{QL}=(1-0.9)\times2=0.2$。所以 $q=0.9$ 的分位数头被训练得"宁可高估"，即输出偏上的分位数；$q=0.5$ 时两边对称，等价于 MAE 的一半，对应中位数预测。

## 训练与推理

- **训练**：每个数据集按时间/实体切成训练、验证、留出测试三部分，验证集做超参搜索。论文用 random search，Volatility 搜索 240 次，其余 60 次。搜索空间：state size ∈ {10,20,40,80,160,240,320}，dropout ∈ {0.1,0.2,0.3,0.4,0.5,0.7,0.9}，minibatch ∈ {64,128,256}，learning rate ∈ {0.0001,0.001,0.01}，max gradient norm ∈ {0.01,1.0,100.0}，heads ∈ {1,4}。
- **最优配置**（论文 Table 1，已对渲染图核对）：

配置 | Electricity | Traffic | Retail | Vol.
-- | -- | -- | -- | --
回看 $k$ / 最大 horizon $\tau_{\max}$ | 168 / 24 | 168 / 24 | 90 / 30 | 252 / 5
Dropout | 0.1 | 0.3 | 0.1 | 0.3
State size | 160 | 320 | 240 | 160
Heads | 4 | 4 | 4 | 1
Minibatch | 64 | 128 | 128 | 64
Learning rate | 0.001 | 0.001 | 0.001 | 0.01
Max gradient norm | 0.01 | 100 | 100 | 0.01

- **推理**：给定回看窗口内的过去输入与未来已知输入，一次前向直接得到全部 $\tau$ 步的 10%/50%/90% 分位数，没有递归采样，也不需要未来的观测输入。
- **算例**：注意力序列长度 $N=\tau_{\max}+k+1$，Electricity 为 $24+168+1=193$，Retail 为 $30+90+1=121$（自拟算术，已重算）。
- **计算成本**（论文自述）：单张 NVIDIA V100 上，Electricity 最优模型训练略超 6 小时（每 epoch 约 52 分钟），对含 5 万样本的验证集批量推理约 8 分钟。

## 实验与结论

### 数据集与设置（论文 Sec. 6.1 与 Appendix A）

数据集 | 说明 | $k$ / horizon | 特点
-- | -- | -- | --
Electricity | UCI Electricity Load Diagrams，370 个用户，小时级 | 168 / 24 | 只有目标与已知输入
Traffic | UCI PEMS-SF，440 条旧金山湾区高速路的占有率，小时级 | 168 / 24 | 目标取值 [0,1]，分布严重偏斜
Retail | Kaggle Favorita 杂货销量，日级，预测 log 销量 | 90 / 30 | 丰富静态元数据 + 观测输入
Volatility | OMI realized library，指数已实现波动率，日级 | 252 / 5 | 数据量小、噪声大

Electricity/Traffic 沿用 DeepAR 等工作的设置；Volatility 数据说明里写的是"31 个指数"，而论文 Table 1 实体数写 41，Retail 的 Table 1 写 130k 实体而 Appendix 写"超过 135k"，论文内部口径略有不一致，这里照录不作取舍。

### 对比方法

- 直接式：Seq2Seq、MQRNN（Multi-horizon Quantile Recurrent Forecaster）；
- 迭代式：DeepAR、DSSM、ConvTrans（Li 等人 NeurIPS 2019）（带卷积局部处理的 Transformer）；
- 简单数据集还含 ARIMA、ETS、TRMF。简单数据集上 ARIMA、ETS、TRMF、DeepAR、DSSM、ConvTrans 的结果论文称是从 Li 等人的工作复现过来的；
- 迭代式模型需要所有输入未来已知，对复杂数据集，论文用"最后一个可得值"填补未知输入。

### 结果（P50 / P90 q-Risk，越低越好；论文 Table 2，已对渲染图核对）

P50：

数据集 | ARIMA | ETS | TRMF | DeepAR | DSSM | ConvTrans | Seq2Seq | MQRNN | TFT
-- | -- | -- | -- | -- | -- | -- | -- | -- | --
Electricity | 0.154 | 0.102 | 0.084 | 0.075 | 0.083 | 0.059 | 0.067 | 0.077 | **0.055**
Traffic | 0.223 | 0.236 | 0.186 | 0.161 | 0.167 | 0.122 | 0.105 | 0.117 | **0.095**

数据集 | DeepAR | ConvTrans | Seq2Seq | MQRNN | TFT
-- | -- | -- | -- | -- | --
Volatility | 0.050 | 0.047 | 0.042 | 0.042 | **0.039**
Retail | 0.574 | 0.429 | 0.411 | 0.379 | **0.354**

P90：

数据集 | ARIMA | ETS | TRMF | DeepAR | DSSM | ConvTrans | Seq2Seq | MQRNN | TFT
-- | -- | -- | -- | -- | -- | -- | -- | -- | --
Electricity | 0.102 | 0.077 | - | 0.040 | 0.056 | 0.034 | 0.036 | 0.036 | **0.027**
Traffic | 0.137 | 0.148 | - | 0.099 | 0.113 | 0.081 | 0.075 | 0.082 | **0.070**

数据集 | DeepAR | ConvTrans | Seq2Seq | MQRNN | TFT
-- | -- | -- | -- | -- | --
Volatility | 0.024 | 0.024 | 0.021 | 0.021 | **0.020**
Retail | 0.230 | 0.192 | 0.157 | 0.152 | **0.147**

（Volatility/Retail 小表里 ConvTrans 在论文中写作 "CovTrans"，应是笔误，此处统一写 ConvTrans。TRMF 的 P90 在论文中为 "-"。）

论文结论：TFT 在所有实验中优于对比方法，相对次优方法改善 3% 到 26%；平均而言 P50 低 7%、P90 低 9%。论文同时指出：

- ConvTrans 在需要填补观测输入的 Volatility、Retail 上较差，说明考虑观测输入很重要；
- Traffic 目标分布明显偏斜（论文称超过 90% 的占有率落在 0 到 0.1），直接式分位数回归比高斯输出的模型更占优势。

### 消融（论文 Sec. 6.6，文字结论，未引用图中具体数字）

做法：分别去掉门控（GLU 换成线性+ELU）、静态编码器（上下文向量置 0 并把静态变量拼到每步输入）、变量选择（softmax 权重换成可训练系数）、自注意力（注意力矩阵换成可训练的 $N\times N$ 参数矩阵 $W_A$）、seq2seq 局部处理（换回标准位置编码），再看损失上升百分比。

- 所有组件整体上都有贡献；各组件在各数据集上的最大增幅，P50 为 3.6% 到 23.4%，P90 为 4.1% 到 28.4%（论文 Fig. 3 说明）；
- 时间相关的两项（局部处理、自注意力）影响最大，P90 平均上升超过 6%，个别数据集超过 20%；
- 静态编码器与变量选择次之，P90 平均分别上升超过 2.6% 与 4.1%；
- 门控 P90 平均上升 1.9%，在 Volatility 上最显著（4.1%），论文据此认为门控对小而嘈杂的数据集有益；
- Electricity 上去掉局部处理后 P50 反而更低，论文推测是日周期性主导，直接注意前几天更有用，因此建议把"是否做局部处理/只用位置编码"当超参。

## 可解释性用例（论文 Sec. 7）

1. **全局变量重要性**：汇总测试集上各变量选择权重 $v_t^{(j)}$ 的 10/50/90 分位。Retail 上（论文 Table 3）静态里权重最大的是能唯一标识实体的 item 与 store 编号，过去输入里最重要的是 log 销量本身，未来输入里促销与全国节假日影响最大。
2. **持续性时间模式**：把式 14 与 19 合起来，第 $\tau$ 个位置的注意力输出可写成 $\beta(t,\tau)=\sum_{n=-k}^{\tau_{\max}}\alpha(t,n,\tau)\,\tilde\theta(t,n)$（式 27，$\tilde\theta=\Theta W_V$，$\alpha$ 是 $\tilde A$ 的元素），再统计各固定滞后上 $\alpha(t,n,\tau)$ 的分布。论文观察到 Electricity、Traffic 有日周期尖峰，Retail 有较弱的周周期并呈近期衰减，Volatility 注意力近似均匀（类似滑动平均）。
3. **regime/事件识别**：对每个实体先求各 horizon 的平均注意力向量 $\bar\alpha(n,\tau)$（式 28），用 Bhattacharyya 系数定义距离 $\kappa(p,q)=\sqrt{1-\rho(p,q)}$（$\rho=\sum_j\sqrt{p_jq_j}$，式 29；论文称该距离取自 Comaniciu 等人的目标跟踪工作），$\mathrm{dist}(t)$ 为各 horizon 下当前注意力与平均注意力距离的均值（式 30）。以 S&P 500 已实现波动率为例，$\mathrm{dist}(t)>0.3$ 的时期对应高波动期（含 2008 金融危机）。

## 优缺点与局限

论文自述的优点：

- 自然处理静态、已知未来、观测输入三类异质数据；
- 门控与变量选择提升小数据/噪声场景的稳健性；
- 用同一个模型给出全局变量重要性、周期/滞后模式、regime 变化三类解释；
- 单 GPU 可训练（上文成本）。

论文未明说或实验未覆盖 / `[经验]`：

- `[经验]` 结构复杂、超参多，训练耗时比线性/小 MLP 模型明显更高；
- 论文只在四个数据集上做了对比，对比的深度模型是 DeepAR、DSSM、ConvTrans、Seq2Seq、MQRNN，没有 N-BEATS 等后来的方法，也没有与 GBDT 的对比；论文没做的比较不能当作结论；
- `[解读]` 注意力权重作为解释只是一种相关性证据，不等价于因果贡献；
- `[解读]` 局部处理用 LSTM，序列很长时受 LSTM 顺序计算限制；论文自己的回看长度最长为 252（Volatility），未涉及更长上下文。

## 与相关方法对比

方法 | 范式 | 多 horizon | 输出 | 协变量
-- | -- | -- | -- | --
[DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR) | 自回归 LSTM | 递归采样 | 分布参数（论文 Sec. 2 称其为一步高斯预测分布） | 要求未来已知
MQRNN | 直接式，编码器 + 每 horizon 的 MLP | 一次性 | 分位数 | 论文称其忽略重要的静态协变量（只是简单拼接，论文 Sec. 1）
ConvTrans | 迭代式 Transformer + 卷积局部处理 | 递归 | 论文未展开 | 要求未来已知
TFT | 直接式，seq2seq + 注意力 | 一次性 | 分位数 | 静态/已知/观测分别处理
[TCN](/0626_ML_Tasks_TimeSeries_Deep_TCN) | 因果膨胀卷积 | 视实现 | 视实现 | 视实现

（表中 DeepAR/MQRNN/ConvTrans 的描述来自论文 Sec. 2；TCN 一行为 `[解读]`，仅作位置参照。）

## 使用方式

`[待核实]`：论文脚注给出了其实验代码的位置（见 Reference，未核对仓库当前状态）；社区常见的 PyTorch 实现有 pytorch-forecasting，下面的参数名凭印象，未核对其当前版本与 API。用的时候最重要的是把列分类：

```
static_categoricals / static_reals       -> 静态 s
time_varying_known_*                      -> 已知输入 x（含未来）
time_varying_unknown_*                    -> 观测输入 z（含目标）
max_encoder_length = k, max_prediction_length = τmax
```

示意代码，未运行验证：

```python
from pytorch_forecasting import TemporalFusionTransformer, QuantileLoss

tft = TemporalFusionTransformer.from_dataset(
    training_dataset,          # 已按上述四类变量与 k/τmax 构造
    hidden_size=160,           # 对应论文 d_model / state size
    attention_head_size=4,
    dropout=0.1,
    loss=QuantileLoss([0.1, 0.5, 0.9]),
)
```

经验上的注意点（`[经验]`）：先列清楚每个协变量是否"未来已知"，放错类别会造成信息泄露；评估用 P50/P90 q-Risk 或 pinball loss，并检查区间覆盖率。

## Reference

- [Temporal Fusion Transformers for Interpretable Multi-horizon Time Series Forecasting](https://arxiv.org/abs/1912.09363)
- 论文脚注 3 给出的开源实现（`[待核实]` 当前是否仍可访问）：https://github.com/google-research/google-research/tree/master/tft

