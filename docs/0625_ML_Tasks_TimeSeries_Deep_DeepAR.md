---
Title | ML Tasks TimeSeries Deep DeepAR
-- | --
Created @ | `2026-11-18T09:27:05Z`
Updated @| `2026-11-19T09:48:29Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/625)

---
# DeepAR

DeepAR 是 Amazon 提出的**概率时间序列预测**模型（论文 *DeepAR: Probabilistic Forecasting with Autoregressive Recurrent Networks*，Salinas, Flunkert, Gasthaus, Januschowski，arXiv 2017，后发表于 International Journal of Forecasting 2020）。它用一个**自回归 RNN（多层 LSTM）**，在**大量相关时间序列上联合训练一个全局模型**，每一步不输出单个预测值，而是输出**目标分布的参数**，从而直接得到预测区间。

一句话概括：**所有序列共享参数的自回归 LSTM + 每步输出分布参数 + 最大似然训练 + 蒙特卡洛采样预测。**

## 解决什么问题

传统方法（ARIMA、指数平滑 ETS）为**每条序列单独拟合一个模型**，存在几个痛点：

痛点 | DeepAR 的做法
-- | --
成千上万条序列（如商品销量）逐条建模成本高 | 一个全局模型，所有序列共享参数
新序列/历史很短（冷启动）难预测 | 借助相似序列学到的模式，加 item embedding 和 age 特征
只给点预测，不知道不确定性 | 输出概率分布，采样得到任意分位数
需要人工做特征工程、季节性设定 | RNN 自动学习趋势、季节性，协变量直接输入
各序列量级差异极大（几件 vs 几万件，呈幂律分布） | 按序列缩放（scale handling）+ 按量级加权采样
计数型需求数据（非负整数、长尾） | 负二项（Negative Binomial）似然

表中：「痛点」是传统逐条建模遇到的问题，「DeepAR 的做法」是对应的解决思路（如全局模型、概率输出、尺度处理、计数分布）。

典型场景：零售需求预测、能源负荷、交通流量、云资源用量。

## 模型结构

### 符号

- $z_{i,t}$：第 $i$ 条序列在时刻 $t$ 的目标值
- $x_{i,t}$：协变量，在整个时间范围（包括未来）都已知，如星期、节假日、促销、价格
- $t_0$：预测起点。$[1, t_0-1]$ 称为 **conditioning range**（条件区间，真实值已知），$[t_0, T]$ 称为 **prediction range**（预测区间）
- 目标：建模 $P(z_{i,t_0:T} \mid z_{i,1:t_0-1}, x_{i,1:T})$

### 核心公式

模型把联合分布分解成逐步的似然乘积，每一步的分布参数由 LSTM 输出决定：

$$
Q(z_{i,t_0:T} \mid z_{i,1:t_0-1}, x_{i,1:T}) = \prod_{t=t_0}^{T} \ell\big( z_{i,t} \mid \theta(h_{i,t}) \big)
$$

$$
h_{i,t} = \mathrm{LSTM}\big( h_{i,t-1}, z_{i,t-1}, x_{i,t} \big) \qquad \text{（论文公式 1）}
$$

其中：$Q$ 是对预测区间内整条路径的联合分布；$z_{i,t_0:T}$ 是第 $i$ 条序列在预测区间的目标值；条件部分是已知历史 $z_{i,1:t_0-1}$ 与协变量 $x_{i,1:T}$；$\prod$ 表示逐步连乘；$\ell(\cdot\mid\theta)$ 是单步似然，$\theta(h_{i,t})$ 是由隐状态 $h_{i,t}$ 得到的分布参数；$\mathrm{LSTM}$ 是循环单元，其输入为上一步隐状态、上一步目标值和当前协变量。

- **自回归**：把上一步目标值 $z_{i,t-1}$ 当作当前步输入
- **循环**：上一步隐状态 $h_{i,t-1}$ 传入当前步
- $\ell(z \mid \theta)$ 是固定形式的分布（高斯、负二项等），网络只负责输出参数 $\theta$
- 论文中 encoder 和 decoder **结构相同、权重共享**：conditioning range 就是用同一个 LSTM 跑一遍真实值得到初始状态 $h_{i,t_0-1}$，初始状态和 $z_{i,0}$ 置零
- 所有序列**共用同一组 LSTM 参数**，序列间的差异只通过自己的历史值、协变量、item embedding 体现

### 训练与预测的输入区别


下面用示意图对比训练与预测时 LSTM 每步的输入来源。

```
训练（输入真实值）                         预测（输入上一步采样值）
z(t-2) ─►[LSTM]─► θ(t-1)                   z(t0-2)  ─►[LSTM]─► ...
z(t-1) ─►[LSTM]─► θ(t)   ◄─ 用 z(t) 算 loss   z(t0-1)  ─►[LSTM]─► θ(t0) ─► 采样 ẑ(t0)
z(t)   ─►[LSTM]─► θ(t+1) ◄─ 用 z(t+1) 算 loss ẑ(t0)    ─►[LSTM]─► θ(t0+1) ─► 采样 ẑ(t0+1)
          （每步 x(t) 也一并输入）                    ẑ(t0+1)  ─►[LSTM]─► θ(t0+2) ─► ...
```

图中：

- 左侧是训练：每一步的输入是**真实值** $z$（teacher forcing），LSTM 输出分布参数 $\theta$，再用下一时刻的真实值计算损失。
- 右侧是预测：每一步的输入是**上一步的采样值** $\hat z$，LSTM 输出 $\theta$ 后采样得到下一步输入，如此递推。
- `x(t)` 表示每步同时输入的协变量；`t0` 是预测起点。
- 关键结论：训练用真实值、预测用采样值，这个差异在论文中未造成明显的精度问题。

### 输出分布（likelihood）

网络输出 $h_{i,t}$ 后接全连接层映射成分布参数。

**高斯**（实数值数据）：

$$
\begin{aligned}
\mu(h) &= w_\mu^{\top} h + b_\mu \\
\sigma(h) &= \mathrm{softplus}(w_\sigma^{\top} h + b_\sigma) = \log\big(1 + \exp(w_\sigma^{\top} h + b_\sigma)\big) \qquad \text{（保证 } \sigma > 0\text{）}
\end{aligned}
$$

其中：$h$ 是 LSTM 在该时刻的隐状态；$w_\mu,b_\mu$ 与 $w_\sigma,b_\sigma$ 是两个全连接层的权重与偏置；$\mu(h)$ 是预测均值；$\sigma(h)$ 是预测标准差；$\mathrm{softplus}(x)=\log(1+e^x)$ 把任意实数映射为正数，保证 $\sigma>0$。

**负二项**（非负计数数据，如销量），用均值 $\mu$ 和形状参数 $\alpha$ 参数化：

$$
\begin{aligned}
\mathrm{NB}(z \mid \mu, \alpha) &= \frac{\Gamma(z + 1/\alpha)}{\Gamma(z+1)\,\Gamma(1/\alpha)} \left( \frac{1}{1+\alpha\mu} \right)^{1/\alpha} \left( \frac{\alpha\mu}{1+\alpha\mu} \right)^{z} \\
\mu(h) &= \mathrm{softplus}(w_\mu^{\top} h + b_\mu) \\
\alpha(h) &= \mathrm{softplus}(w_\alpha^{\top} h + b_\alpha) \\
\mathrm{Var}[z] &= \mu + \alpha \mu^2
\end{aligned}
$$

其中：$z$ 是非负整数的观测值；$\mu$ 是分布均值；$\alpha$ 是形状（离散度）参数；$\Gamma(\cdot)$ 是伽马函数；$w_\mu,b_\mu,w_\alpha,b_\alpha$ 是全连接层的权重与偏置；$h$ 是 LSTM 隐状态；$\mathrm{softplus}$ 保证 $\mu,\alpha>0$；$\mathrm{Var}[z]$ 是方差，$\alpha\mu^2$ 项使方差大于均值（过度离散）。

- $\alpha$ 控制方差相对均值的放大程度：$\alpha \to 0$ 退化为泊松，$\alpha$ 越大长尾越明显
- 论文说明这种 $(\mu, \alpha)$ 参数化在预实验中收敛最快
- 计数数据用高斯拟合会产生负值/非整数预测，且论文中 `rnn-gaussian` 的精度明显更差
- 其他似然也可以：Beta（0~1 区间）、Bernoulli（二值）、混合分布等，**前提是能廉价采样、且对数似然及梯度可算**

## 特征（Features）

- **协变量 $x_{i,t}$**：可以是随序列变化的、随时间变化的，或两者兼有；时间不变的特征会沿时间维度重复
- 只要未来也已知（价格、促销、节假日）就可作为输入
- 论文所有实验都用了：
  - **age 特征**：当前时刻距序列第一个观测的距离（让模型区分新旧序列）
  - 时间特征：小时数据用 day-of-week、hour-of-day；周数据用 week-of-year；月数据用 month-of-year（作为递增数值而不是 one-hot）
  - 一个**类别 item 特征**，学习其 embedding：零售大数据集里是粗粒度的商品类目，小数据集里是 item 本身（学习个体行为）
- 所有协变量**标准化**为零均值、单位方差

## 尺度处理（Scale Handling）

真实数据（如 Amazon 商品销量）的量级呈**幂律分布**，直接训练会出现两个问题。

**1) 输入/输出量级跨度大**

自回归输入 $z_{t-1}$ 和输出（如 $\mu$）都随观测值的量级变化，但中间的非线性层工作范围有限。做法是为每条序列计算尺度 $\nu_i$，输入除以 $\nu_i$，输出的**与尺度相关的参数**乘回 $\nu_i$：

$$
\nu_i = 1 + \frac{1}{t_0} \sum_{t=1}^{t_0} z_{i,t} \qquad \text{（条件区间内的均值 + 1）}
$$

其中：$
u_i$ 是第 $i$ 条序列的尺度；$t_0$ 是预测起点，求和遍及条件区间内的观测；$z_{i,t}$ 是目标值；加 1 避免全零序列的尺度为 0。

$$
\text{输入：}\quad \frac{z_{i,t-1}}{\nu_i}
$$

其中：$z_{i,t-1}$ 是上一步真实（或采样）值；除以尺度 $\nu_i$ 得到缩放后的自回归输入。

$$
\text{负二项：}\quad
\begin{aligned}
\mu &= \nu_i \cdot \mathrm{softplus}(o_\mu) \\
\alpha &= \frac{\mathrm{softplus}(o_\alpha)}{\sqrt{\nu_i}}
\end{aligned}
$$

（$o_\mu$、$o_\alpha$ 是网络对这两个参数的原始输出）

其中：$\nu_i$ 是第 $i$ 条序列的尺度；$\mu$ 是缩放回原量级的负二项均值（与尺度成正比）；$\alpha$ 除以 $\sqrt{\nu_i}$，使方差随尺度的增长更合理；$\mathrm{softplus}$ 保证参数为正。

- 对计数数据不能像实数那样直接在预处理阶段归一化，所以要用上面这种"输入缩小、输出放大"的方式
- 对实数据，可以直接预处理缩放

**2) 训练样本被大量级序列"淹没"或相反**

均匀采样窗口时，少量大尺度序列很少被抽到，容易欠拟合；而业务上高销量商品往往更重要。论文采用**加权采样**：从某序列取一个窗口的概率**正比于其尺度 $\nu_i$**。

## 训练

- **目标函数**：最大化对数似然（等价于最小化负对数似然，无需手工设计损失）

$$
\mathcal{L} = \sum_i \sum_{t=t_0}^{T} \log \ell\big( z_{i,t} \mid \theta(h_{i,t}) \big)
$$

其中：$\mathcal L$ 是要最大化的对数似然；$i$ 遍历序列，$t$ 遍历 $t_0$ 到 $T$ 的时刻；$z_{i,t}$ 是真实值；$\theta(h_{i,t})$ 是由 LSTM 隐状态得到的分布参数；$\ell(\cdot\mid\theta)$ 是似然函数；负的 $\mathcal L$ 即训练使用的损失。

- 因为 $h_{i,t}$ 是输入的确定性函数，**没有隐变量，不需要推断**，直接用 SGD 即可（区别于状态空间模型）
- 论文中 encoder 与 decoder 一致，所以对 conditioning range 的似然项也一并计入（相当于 $t_0 = 0$）
- **窗口划分**：每条序列取不同起点的窗口生成多个训练样本，总长度 $T$ 以及条件区间/预测区间的相对长度固定
  - 保证预测区间始终落在已有真实数据范围内
  - 窗口起点可以**早于序列的第一个观测**，用 0 填充，这样模型能学习"新序列"的行为
  - 因此"绝对时间"只通过协变量进入模型，不会通过位置泄漏
- **Teacher forcing**：训练时预测区间的输入用真实值，而预测时用采样值。这在 NLP 里会造成 exposure bias，但论文**没有观察到**对预测精度的明显影响；尝试过 scheduled sampling 也没有显著收益，只是收敛变慢
- **缺失值处理**：缺失观测 $z_{i,t}$ 用模型自己的采样 $\tilde z_{i,t} \sim \ell(\cdot \mid \theta(h_{i,t}))$ 代替输入计算公式 1，并把该项从似然中排除。这在需求预测里可以避免"缺货 → 需求被低估 → 更少补货"的恶性循环

### 论文使用的超参数（附录）

- 3 层 LSTM，每层 40 个单元（大数据集 ec 用 120），forget bias = 1.0
- Adam 优化器 + early stopping；学习率按数据集手工调，其余用网格搜索（item embedding 维度、LSTM 单元数），用留出 10% 数据的负对数似然选择
- 预测时抽 **200** 条样本路径
- 论文称"几乎不需要超参调优"，且在只有几百条序列的中等数据集上也适用

## 预测

预测未来多步没有真实值可供输入，使用 **祖先采样（Ancestral Sampling）**：

1. 对 $t = 1,\dots,t_0-1$，用真实 $z$ 前向，得到 $h_{i,t_0-1}$
2. 对 $t = t_0,\dots,T$：从 $\ell(\cdot \mid \theta(\tilde h_{i,t}))$ 采样 $\tilde z_{i,t}$，并以 $\tilde h_{i,t} = \mathrm{LSTM}(h_{i,t-1}, \tilde z_{i,t-1}, x_{i,t})$ 继续
3. 得到**一条样本路径**；重复多次（论文 200 条，GluonTS 默认 `num_parallel_samples=100`）
4. 逐时刻（或对区间求和后）取样本的分位数，即得到预测区间；取中位数即点预测

- 每条样本路径是一个**联合样本**，能正确保留多步之间的相关性。论文做了对照：把每个时刻的样本**独立打乱**破坏相关性后，长区间的校准变差，且 $0.9$-risk 高约 10%
- 可以直接回答"未来 N 周总销量的 P90 是多少"这类对区间求和的问题，而不只是单点的边缘分布

## 一个带数字的例子

下面用一个极简示例走一遍流程（数值为示意，不是真实模型输出）。

设 `context_length = 3`，`prediction_length = 2`，使用**负二项**似然，一条序列取到窗口：

```
t    :  1   2   3 | 4   5
z    :  4   6   8 | ?   ?        前 3 个为 conditioning range，后 2 个为 prediction range
x(t) : 周特征等，已知
```

**1) 计算尺度**

$$
\nu = 1 + \frac{4 + 6 + 8}{3} = 7
$$

$$
\text{输入缩放：}\quad z/\nu = [0.57,\ 0.86,\ 1.14]
$$

其中：$\nu$ 是该序列的尺度，等于条件区间观测之和除以 3 的均值再加 1；$z/\nu$ 是缩放后的输入，使不同量级序列的输入处于相近范围。

**2) 训练（teacher forcing）**

- $t=4$：输入 $\tilde z_3=8/7$、$x_4$、$h_3$ → LSTM → $h_4$ → 全连接层得到原始输出 $o_\mu = 0.2$、$o_\alpha = -0.5$

$$
\begin{aligned}
\mathrm{softplus}(0.2) &= \log(1+e^{0.2}) \approx 0.798 &&\Rightarrow\ \mu = \nu \cdot 0.798 \approx 5.59 \\
\mathrm{softplus}(-0.5) &= \log(1+e^{-0.5}) \approx 0.474 &&\Rightarrow\ \alpha = 0.474 / \sqrt{7} \approx 0.179 \\
\mathrm{Var} &= \mu + \alpha \mu^2 \approx 5.59 + 0.179 \times 31.2 \approx 11.2 &&\text{（标准差约 3.3）}
\end{aligned}
$$

其中：$o_\mu,o_\alpha$ 是网络的原始输出；$\mathrm{softplus}(x)=\log(1+e^x)$ 把实数映射为正数；$\nu=7$ 是前面算出的尺度；$\mu$ 是缩放回原量级后的均值；$\alpha$ 是形状参数；$\mathrm{Var}$ 是负二项分布的方差，标准差为其平方根。

- 用真实的 $z_4$（比如 7）计算 $-\log \mathrm{NB}(7 \mid \mu, \alpha)$ 作为 $t=4$ 的损失
- $t=5$：输入换成**真实的** $z_4 = 7$（再除以 $\nu$），重复上述过程

**3) 预测（祖先采样）**

- $t=4$：输入真实 $z_3$，得到 $\mathrm{NB}(\mu\approx5.59, \alpha\approx0.179)$，**采样**得到 $\hat z_4 = 5$（每条样本路径不同）
- $t=5$：输入的是上一步采样的 $\hat z_4 = 5$（而不是真实值），得到新的分布参数，再采样 $\hat z_5$
- 重复 $N$ 次得到 $N$ 条路径 $(\hat z_4, \hat z_5)$；分别取 P10/P50/P90，即为 $t=4$、$t=5$ 的预测区间；也可以把每条路径的 $\hat z_4 + \hat z_5$ 相加，再取分位数得到"两步总量"的预测区间

## 评估

### $\rho$-risk（分位数损失）

对某个区间 $[L, L+S)$，设真实总量 $Z_i = \sum_t z_{i,t}$，预测分位数 $\hat Z_i$（先对每条样本路径在该区间上求和，再取样本的 $\rho$ 分位数）：

$$
\begin{aligned}
L_\rho(Z, \hat Z) &= 2 \cdot (\hat Z - Z) \cdot \big( \mathbf{1}[\hat Z > Z] - \rho \big) &&\text{（论文写法）} \\
&= 2 \cdot \big( \rho \cdot \max(Z - \hat Z, 0) + (1-\rho) \cdot \max(\hat Z - Z, 0) \big) &&\text{（等价：低估罚 } \rho\text{，高估罚 } 1-\rho\text{）}
\end{aligned}
$$

$$
\rho\text{-risk} = \frac{\sum_i L_\rho(Z_i, \hat Z_i)}{\sum_i Z_i}
$$

其中：$L_\rho$ 是分位数损失；$Z$ 是区间 $[L,L+S)$ 内的真实总量；$\hat Z$ 是对每条样本路径求和后取到的 $\rho$ 分位数预测；$\rho\in(0,1)$ 是分位水平；$\mathbf 1[\cdot]$ 是指示函数；$i$ 是序列编号；分母 $\sum_i Z_i$ 把损失按真实总量归一，使不同量级的序列可比，$\rho$-risk 越小越好。

- 论文常报告 $0.5$-risk（P50，类似归一化 MAE）和 $0.9$-risk
- 点预测对比时还用 ND（Normalized Deviation）和 NRMSE

### 校准（Calibration）

$\mathrm{Coverage}(p)$：预测分布的 $p$ 分位数大于真实值的序列所占比例，完美校准时 $\mathrm{Coverage}(p) = p$（落在对角线）。论文显示 DeepAR 的校准优于 ISSM。

## 论文中的实验结论

数据集：`parts`（汽车零件月销量 1046 条）、`electricity`（370 户小时用电）、`traffic`（SF 963 条车道占有率）、`ec` / `ec-sub`（Amazon 周销量，ec 约 53 万条）。

- 在计数型数据 `parts`、`ec`、`ec-sub` 上，相对 Croston、ETS、Snyder、ISSM 等基线，DeepAR 在 0.5-risk / 0.9-risk 上**整体更好**
- **负二项 vs 高斯**：`rnn-gaussian` 明显更差，说明计数数据需要计数分布
- **尺度处理 + 加权采样的价值**：在幂律分布的 `ec`/`ec-sub` 上，去掉后（`rnn-negbin`）精度下降；而在不呈幂律的 `parts` 上，两者接近
- 与矩阵分解方法 MatFact 的点预测对比（Table 2）：
  - electricity：ND 0.07 vs 0.16，NRMSE 1.00 vs 1.15
  - traffic：ND 0.17 vs 0.20，NRMSE 0.42 vs 0.43
- **不确定性不是线性增长**：不像 ISSM 假设不确定性线性增长，DeepAR 从数据中学到不确定性在 Q4 升高、随后回落
- 工程规模：ec（50 万条序列）端到端训练+预测在单张 GPU 上约 10 小时内完成

## 优缺点

优点
- 一个模型预测大量序列，可处理冷启动
- 原生概率预测，直接给出置信区间和多步联合分布
- 自动处理不同尺度的序列，支持协变量和类别特征
- 支持非高斯、离散的输出分布，可处理缺失观测

局限
- 预测时需要逐步采样，**推理比一次性输出多步的模型慢**，且误差会沿自回归链累积
- 共享参数的前提是序列"相关"；序列间差异极大时收益有限
- 序列之间没有显式依赖建模（每条序列独立预测，不考虑跨序列相关）
- 对很长的周期依赖，LSTM 不如 Transformer / 带分解结构的模型（如 N-BEATS、TFT、PatchTST）

## 代码对应：GluonTS 实现

[GluonTS](https://ts.gluon.ai/) 的 PyTorch 版 `DeepAREstimator` 是常用实现，和论文有若干差异，需要注意。

### 输入如何构成

每个时间步 RNN 的输入 = **滞后值（lags） + 时间特征 + 静态特征**，其中：

输入部分 | 对应参数 | 说明
-- | -- | --
目标值的滞后（lags） | `lags_seq`（默认由 `freq` 推断：固定包含 1~7，再加上前几个周期内同一季节位置（±若干步）的滞后） | 不只用 $z_{t-1}$，还把若干滞后值（已除以 scale）一起输入，帮助捕获周期性
时间特征 | `time_features` | 由频率推断，如星期、月份、日期等
age 特征 | 内部自动添加 | 距序列起点的距离（取对数）
动态协变量 | `num_feat_dynamic_real` | 未来已知的特征（价格、促销）
类别静态特征 | `num_feat_static_cat` + `cardinality` + `embedding_dimension` | 做 embedding，对应论文的 item embedding
实数静态特征 | `num_feat_static_real` | 直接拼接
$\log(\text{scale})$ | 内部自动添加 | 把序列尺度也作为静态特征输入

表中：「输入部分」是 RNN 每步输入的组成，「对应参数」是 GluonTS 中的参数名，「说明」解释其作用。注意输入不只包含上一步目标值，还包含多个滞后值、时间特征与静态特征。

### 与论文的差异

项目 | 论文 | GluonTS (PyTorch)
-- | -- | --
默认输出分布 | 高斯 / 负二项 | `StudentTOutput()`（可通过 `distr_output` 切换）
尺度 | $\nu = 1 + \text{条件区间均值}$ | `MeanScaler`（在条件窗口上取绝对值均值），`scaling=True` 开启，可设 `default_scale`
上下文长度 | 与预测长度同量级 | 默认 `context_length = prediction_length`
层数 / 隐层 | 3 层 × 40 | 默认 `num_layers=2`、`hidden_size=40`
预测样本数 | 200 | 默认 `num_parallel_samples=100`
加权采样 | 按尺度加权 | 由 `train_sampler` 决定（默认是按位置均匀采样，不是论文的尺度加权）

表中：「项目」是对比的设置项，「论文」是原论文取值，「GluonTS (PyTorch)」是该实现的默认取值；复现论文结果时需要手动对齐这些默认值。

### 示例

```python
from gluonts.dataset.common import ListDataset
from gluonts.torch import DeepAREstimator
from gluonts.torch.distributions import NegativeBinomialOutput

train_ds = ListDataset(
    [{"start": "2020-01-01", "target": series_values}],
    freq="D",
)

estimator = DeepAREstimator(
    freq="D",
    prediction_length=14,                 # 预测未来 14 步
    context_length=28,                    # 条件窗口长度
    num_layers=2,
    hidden_size=40,
    dropout_rate=0.1,
    distr_output=NegativeBinomialOutput(),  # 计数数据；实数数据可用默认 StudentTOutput
    scaling=True,
    num_parallel_samples=100,
    trainer_kwargs={"max_epochs": 20},
)
predictor = estimator.train(train_ds)

forecast = next(iter(predictor.predict(train_ds)))
print(forecast.quantile(0.1), forecast.quantile(0.5), forecast.quantile(0.9))
```

> 示例代码未在本地运行验证；参数名以所用 GluonTS 版本的文档为准。

### 其他实现

- Amazon SageMaker 内置算法 `DeepAR`
- [PyTorch Forecasting](https://pytorch-forecasting.readthedocs.io/) 的 `DeepAR`
- Darts 的 `RNNModel`（可输出概率预测）

## 常见问题与调参经验

- **`context_length` 怎么选**：一般取 1 到数倍 `prediction_length`，并尽量覆盖一个完整季节周期。注意模型实际需要的历史长度是 `context_length + max(lags_seq)`，序列太短时窗口会被 0 填充
- **选对输出分布最重要**：计数/非负数据用负二项（`NegativeBinomialOutput`），实数用 StudentT / 高斯；用高斯拟合销量会出现负值，间歇性需求（大量 0）更要用计数分布
- **点预测有偏时**：间歇性需求下 P50 常为 0，需要看 P90 等分位数或对区间求和后的分布，而不是只看均值
- **量级差异大**：确认 `scaling=True`；如果大量序列在条件窗口内全是 0，可设 `default_scale`
- **预测区间过宽/过窄**：增大 `num_parallel_samples` 让分位数更稳定；检查校准曲线 $\mathrm{Coverage}(p)$
- **协变量必须在未来也已知**：如价格、促销计划；否则不能作为动态特征
- **推理慢**：采样路径数乘上预测长度决定开销，上线时可适当降低采样路径数、批量推理
- **过拟合**：序列条数少时降低 `hidden_size`、增加 `dropout_rate`，并使用 early stopping（`patience`）

## 与其他时序模型对比

模型 | 类型 | 概率预测 | 全局模型 | 说明
-- | -- | -- | -- | --
ARIMA / ETS | 统计 | 是（解析） | 否 | 单序列拟合
Prophet | 加性分解 | 是 | 否 | 趋势+季节+节假日，易用
**DeepAR** | RNN 自回归 | 是（采样） | 是 | 本文
N-BEATS / N-HiTS | MLP 堆叠 | 否（点预测） | 是 | 非自回归，速度快
TFT | Transformer | 是（分位数） | 是 | 可解释的多步预测
PatchTST 等 | Transformer | 否 | 是 | 长序列预测

表中：「模型」是对比对象，「类型」是方法类别，「概率预测 / 全局模型」两列表示是否原生输出概率、是否跨序列共享参数，「说明」给出特点。结论：DeepAR 是全局的、自回归的概率预测模型，与 N-BEATS 等非自回归模型相比推理更慢但原生给出概率。

## Reference
- [DeepAR: Probabilistic Forecasting with Autoregressive Recurrent Networks (arXiv 1704.04110)](https://arxiv.org/abs/1704.04110)
- [GluonTS - DeepAR](https://ts.gluon.ai/stable/api/gluonts/gluonts.torch.model.deepar.html)
- [GluonTS - DeepAR 源码](https://github.com/awslabs/gluonts/tree/dev/src/gluonts/torch/model/deepar)
- [Amazon SageMaker DeepAR](https://docs.aws.amazon.com/sagemaker/latest/dg/deepar.html)
- [PyTorch Forecasting - DeepAR](https://pytorch-forecasting.readthedocs.io/en/stable/api/pytorch_forecasting.models.deepar.DeepAR.html)




