---
Title | ML Tasks TimeSeries Deep ETSformer
-- | --
Created @ | `2026-11-20T09:00:00Z`
Updated @| `2026-11-20T09:00:00Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/668)

---
# ETSformer

ETSformer 出自论文 *ETSformer: Exponential Smoothing Transformers for Time-series Forecasting*（Gerald Woo、Chenghao Liu、Doyen Sahoo、Akshat Kumar、Steven Hoi，Salesforce Research / 新加坡管理大学，arXiv:2202.01381，2022 年 2 月）。它把经典**指数平滑（exponential smoothing）**的思想嵌入 Transformer：用两个专为时间序列设计的注意力机制——**指数平滑注意力（ESA）**与**频率注意力（FA）**——替换自注意力，并把网络设计成可分解的编码器-解码器，使预测天然由**水平（level）、增长（growth）、季节（seasonality）**三个可解释分量组成。

**一句话概括：ESA 用"按时间距离指数衰减"的非自适应注意力提取增长分量，FA 用傅里叶变换挑出最强的 $K$ 个频率提取季节分量，再按指数平滑的方式提取水平，最终预测 = 水平 + 增长 + 季节，复杂度 $O(L\log L)$。**

> 标注约定：未标注的内容来自论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：经典背景见 [经典统计模型](/0604_ML_Tasks_TimeSeries_Classical)（指数平滑 / ETS）与 [ARIMA](/0624_ML_Tasks_TimeSeries_Classical_ARIMA)；同属"分解 + 频域"思路的 [Autoformer](/0636_ML_Tasks_TimeSeries_Deep_Autoformer)、[FEDformer](/0637_ML_Tasks_TimeSeries_Deep_FEDformer)；总览见 [深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)。

## 1. 解决什么问题

论文指出传统 Transformer 在时间序列预测上有三类局限：

- **缺少分解能力与可解释性**：自注意力是"黑盒"，无法直接说明预测中趋势、季节各占多少；
- **对时序数据不够有效**：通用的内容相关注意力（如点积）并没有利用时间序列"近期观测更重要"这类先验；
- **对长期预测不够高效**：标准自注意力复杂度为 $O(L^2)$。

论文的思路是回到经典方法：指数平滑给近期观测更高权重，并把序列分解为水平、趋势（增长）、季节三个分量。ETSformer 把这些原则写进网络结构。

## 2. 指数平滑回顾

经典简单指数平滑把水平 $\ell_t$ 写成当前观测与上一步水平的加权平均：

$$
\ell_t=\alpha\,x_t+(1-\alpha)\,\ell_{t-1}
$$

其中：$x_t$ 是第 $t$ 步观测；$\ell_t$ 是第 $t$ 步水平；$\alpha\in(0,1)$ 是平滑系数，越大越看重当前观测。展开后，过去观测的权重按几何级数衰减，这就是"指数"一词的来源。（更完整的 ETS 家族见 [经典篇](/0604_ML_Tasks_TimeSeries_Classical)。）

## 3. 模型结构

ETSformer 的设计遵循三条原则（论文原话大意）：

1. 多层堆叠，从中间残差中**逐层**提取水平、增长、季节表示；
2. 沿用指数平滑的精神，给近期观测更高权重；
3. 最终预测是水平、增长、季节分量的组合，因此**可解释**。

### 3.1 整体流程

下图概括编码器逐层剥离季节与增长、解码器再外推组合的过程。

```
回看窗口 X ──Conv(kernel 3)嵌入──► Z⁰
   │
   ▼ 编码器 × N 层（逐层从残差中剥离分量）
   ├─ FA ───────► S^(n) 季节    Z ← Z − S
   ├─ MH-ESA ───► B^(n) 增长    Z ← LN(Z − B)
   ├─ FFN ──────► 残差更新      Z ← LN(Z + FF(Z))
   └─ Level 模块：按指数平滑递推提取水平 E^(n)
   │
   ▼ 解码器（N 个 Growth+Seasonal 堆叠 + 1 个 Level 堆叠）
   ├─ Level：重复最后一个时间步的水平 H 次
   ├─ Growth：增长阻尼（GD）外推
   └─ Seasonal：FA 把季节模式外推到预测区间
   │
   ▼
 预测 = 水平 + Σ Linear(增长) + Σ Linear(季节)
```

图中：

- 左上是输入嵌入：用核大小为 3 的一维卷积把原始序列映射到隐空间，**不使用**手工设计的日期时间协变量（周几、月份等）。论文称频率注意力能自动发现季节模式，因此不需要这些协变量。
- 中间是编码器：每层依次做三件事——用 FA 提取并从残差中扣除季节分量；用 MH-ESA 提取增长分量并扣除；再经前馈层与 LayerNorm 更新残差。同时有一个水平模块按指数平滑递推提取水平。
- 下方是解码器：水平分量直接重复最后一个时间步的水平；增长分量通过"增长阻尼"外推；季节分量通过 FA 外推到预测区间。
- 最终预测是三个分量之和，因此每个分量都可以单独可视化。

### 3.2 指数平滑注意力（ESA）

ESA 是一个**非自适应**（权重与输入内容无关）、**可学习**的注意力，只由时间滞后决定权重。对输入序列 $V\in\mathbb R^{L\times d}$，其输出第 $t$ 行为：

$$
A_{\mathrm{ES}}(V)_t=\alpha\,V_t+(1-\alpha)\,A_{\mathrm{ES}}(V)_{t-1}=\sum_{j=0}^{t-1}\alpha(1-\alpha)^{j}V_{t-j}+(1-\alpha)^{t}v_0
$$

其中：

- $V_t$：第 $t$ 个时间步的 $d$ 维表示；$A_{\mathrm{ES}}(V)_t$：ESA 在第 $t$ 步的输出
- $\alpha\in(0,1)$：可学习的平滑参数；$j$ 是向过去回溯的步数，权重 $\alpha(1-\alpha)^j$ 随 $j$ 指数衰减，即越近越重要
- $v_0$：可学习的初始状态；$L$：回看窗口长度

直接构造 $L\times L$ 注意力矩阵并相乘的复杂度是 $O(L^2)$。论文发现该矩阵每一行是前一行的右移加填充，因此矩阵-向量乘法可以写成互相关，用 FFT 实现，复杂度降为 $O(L\log L)$。

**多头 ESA（MH-ESA）**用来提取增长分量：对残差做逐步差分后再作用 ESA：

$$
B_{t-L:t}=\text{MH-}A_{\mathrm{ES}}\big(Z_{t-L:t}-[Z_{t-L:t-1},\,v_0]\big)
$$

其中：$Z_{t-L:t}$ 是当前层的残差；$[Z_{t-L:t-1},v_0]$ 是整体右移一步的残差（前面补初始状态 $v_0$），二者相减得到相邻时间步的"增长"；$B$ 是提取出的增长表示。

### 3.3 频率注意力（FA）

FA 是**非可学习**的注意力，用离散傅里叶变换（DFT）挑出主导的季节模式：

1. 沿时间维对输入做 DFT，得到 $F=\lfloor L/2\rfloor+1$ 个频率分量；
2. 只保留幅值最大的 $K$ 个频率（$K$ 是超参数）；
3. 做逆 DFT 得到时域里的季节模式，并且可以**外推**到预测区间。

用公式表示第 $i$ 个维度上季节分量：

$$
S_{j,i}=\sum_{k\in\arg\mathrm{Top\text{-}}K}A_{k,i}\cos\!\big(2\pi f_k\,j+\phi_{k,i}\big)
$$

其中：

- $j$：时间下标（回看窗口内取 $j=t-L,\dots,t-1$；外推时取 $j=t,\dots,t+H-1$）；$i$：隐空间的第 $i$ 个维度
- $A_{k,i},\phi_{k,i}$：第 $k$ 个频率在第 $i$ 维上的幅值与相位；$f_k$：第 $k$ 个傅里叶频率
- $\arg\mathrm{Top\text{-}}K$：取幅值最大的 $K$ 个频率；论文写法还包含共轭项，这里省略以保持简洁

`[解读]` 由于 $K$ 取得小，FA 的复杂度同样是 $O(L\log L)$（受 DFT 支配）。

### 3.4 水平模块

水平按指数平滑的方式从每层的增长与季节中递推：当前（去季节后的）水平与上一步水平加增长预测的加权平均：

$$
E_t^{(n)}=\alpha\odot\big(E_t^{(n-1)}-\mathrm{Linear}(S_t^{(n)})\big)+(1-\alpha)\odot\big(E_{t-1}^{(n)}+\mathrm{Linear}(B_{t-1}^{(n)})\big)
$$

其中：

- $E_t^{(n)}\in\mathbb R^{m}$：第 $n$ 层在第 $t$ 步提取的水平（$m$ 是观测维度）；$S_t^{(n)},B_t^{(n)}$：第 $n$ 层的季节与增长表示
- $\mathrm{Linear}(\cdot)$：把隐空间表示映射回观测空间；$\alpha\in\mathbb R^{m}$：可学习的平滑参数；$\odot$：逐元素乘
- 最后一层得到的 $E^{(N)}$ 即回看窗口内各步的水平

### 3.5 解码器与增长阻尼

解码器由 $N$ 个 Growth+Seasonal（G+S）堆叠和一个 Level 堆叠组成，最终预测写成：

$$
\hat X_{t:t+H}=E_{t:t+H}+\mathrm{Linear}\Big(\sum_{n=1}^{N}B^{(n)}_{t:t+H}+\sum_{n=1}^{N}S^{(n)}_{t:t+H}\Big)
$$

其中：$E_{t:t+H}$ 是水平预测（Level 堆叠把最后一步水平重复 $H$ 次）；$B^{(n)}_{t:t+H}$ 与 $S^{(n)}_{t:t+H}$ 是第 $n$ 个堆叠对增长与季节的外推；$H$ 是预测步长；$\mathrm{Linear}$ 把隐空间表示映射回观测空间。

增长分量的外推沿用经典的**阻尼趋势**思想：用最后一步的增长表示 $B_t^{(n)}$，乘以逐步累积的阻尼因子 $\gamma$ 向前外推，使长期外推不会无限增长（$0<\gamma<1$ 且可学习；多头版本使用多个阻尼参数）。季节分量则由 FA 把季节模式延拓到预测区间。

## 4. 训练与实验设置

- **数据集**：ETT、ECL、Exchange、Traffic、Weather、ILI 共 6 个真实数据集，覆盖多变量与单变量设定；ETT 按 60/20/20、其余按 70/10/20 的时间顺序划分，输入做零均值归一化，指标为 MSE 与 MAE；ETSformer 的结果为 3 次运行平均。
- **基线**：多变量：Autoformer、Informer、LogTrans、Reformer、LSTnet、LSTM；单变量另含 N-BEATS、DeepAR、ARIMA、Prophet、AutoETS。基线结果取自已有论文。
- **其他超参**：层数、隐层维度、$K$ 的搜索范围等见论文附录，本文未逐项核对 `[待核实]`。

## 5. 实验与结论

- 论文称 ETSformer 取得最优表现：多变量设定下在 40 个设置中 35 个 MSE 最优，单变量设定下在 23 个设置中 17 个最优；
- 即使不是最优，多变量 40 个设置全部排在前二，单变量 23 个设置中 21 个排在前二；
- 在没有明显周期的 Exchange 数据集上，相对最好基线平均（跨预测长度）提升 39.8%，论文据此说明其强趋势预测能力；
- **可解释性**：在合成数据（有可控的非线性趋势与季节）上训练后，ETSformer 预测的水平、趋势（水平+增长）、季节分量能紧密跟踪真实分量；论文对比的 Autoformer 虽然 MSE 也低，但难以区分趋势与季节。
- **消融**：论文在预测水平 24 上对各组件（ESA、FA 等）做了消融，数值见论文 Table 2，本文未逐项转引。

## 6. 优缺点与局限

论文自述的优点：分解与可解释；$O(L\log L)$ 复杂度；无需手工日期时间协变量。论文列出的未来方向包括加入节假日等额外协变量。

`[解读]` / `[经验]`：

- FA 只保留固定 $K$ 个频率，对周期不稳、多周期叠加或非周期事件主导的序列，季节外推的质量依赖这些频率；
- ESA 是非自适应注意力，权重只取决于时间距离，不随输入内容变化，因此表达力比内容相关注意力弱，换来的是效率与先验；
- 论文的对比基线是 2022 年初的方法，与 DLinear、PatchTST 等后续模型的比较不在论文内。

## 7. 与相关方法对比

方法 | 注意力 | 分解方式 | 复杂度 | 可解释性
-- | -- | -- | -- | --
ETSformer | ESA（指数衰减）+ FA（傅里叶 Top-K） | 水平 / 增长 / 季节 | $O(L\log L)$ | 分量可单独可视化
Autoformer | 自相关 + 序列分解块 | 趋势 / 季节 | $O(L\log L)$ | 有分解但难区分趋势与季节
FEDformer | 频域增强注意力 | 趋势 / 季节（MOE 分解） | 随模式数线性 | 有限
Informer | ProbSparse 自注意力 | 无 | $O(L\log L)$ | 无

表中：「注意力」说明各模型替换自注意力的方式，「分解方式」说明其如何拆分序列，「复杂度」是对回看长度 $L$ 的量级，「可解释性」是论文视角下的评价。ETSformer 的特点是把指数平滑的结构直接写进网络，使分量具有明确含义。

## 8. 使用方式

官方代码见论文摘要给出的仓库 `salesforce/ETSformer`。下面是 ESA 的示意代码（未运行验证，仅演示指数衰减权重矩阵的构造，未实现论文中的 FFT 加速）：

```python
import torch

def esa_weights(L, alpha):
    # alpha ∈ (0,1)；返回 L×L 下三角权重，第 t 行对过去第 j 步的权重为 alpha*(1-alpha)^j
    idx = torch.arange(L)
    lag = idx.unsqueeze(1) - idx.unsqueeze(0)            # t - s
    w = alpha * (1 - alpha) ** lag.clamp(min=0)
    return torch.where(lag >= 0, w, torch.zeros_like(w))

def esa(v, alpha):                                        # v: [L, d]
    return esa_weights(v.shape[0], alpha) @ v            # O(L^2)，论文用 FFT 降到 O(L log L)
```

## Reference

- Gerald Woo, Chenghao Liu, Doyen Sahoo, Akshat Kumar, Steven Hoi. *ETSformer: Exponential Smoothing Transformers for Time-series Forecasting*. [arXiv:2202.01381](https://arxiv.org/abs/2202.01381)
- 官方代码（论文摘要给出）：https://github.com/salesforce/ETSformer
- 站内：[经典统计模型](/0604_ML_Tasks_TimeSeries_Classical)、[深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)、[Autoformer](/0636_ML_Tasks_TimeSeries_Deep_Autoformer)

