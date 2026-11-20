---
Title | ML Tasks TimeSeries Deep FiLM
-- | --
Created @ | `2026-11-20T09:14:07Z`
Updated @| `2026-11-20T09:14:07Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/676)

---
# FiLM

FiLM（Frequency improved Legendre Memory Model）出自论文 *FiLM: Frequency improved Legendre Memory Model for Long-term Time Series Forecasting*（Tian Zhou 等，NeurIPS 2022，arXiv:2205.08897）。它要解决长期预测中的核心矛盾：**既要尽量完整地保留历史信息，又要去掉历史中的噪声**。做法是用 Legendre 多项式把历史窗口压缩成固定大小的"记忆"，再用傅里叶变换在频域里做特征选择与去噪，并用低秩近似压缩参数。论文报告在六个基准上，多变量预测平均提升 20.3%，单变量预测提升 22.6%。

**一句话概括：RevIN 归一化 → Legendre 投影单元（LPU）把历史压成系数 → 频率增强层（FEL）在频域里保留低频模式并做（低秩）线性变换 → 反向 Legendre 重构出预测，再用多尺度专家混合。整个模型只有一层 LPU 和一层 FEL。**

> 标注约定：未标注的内容来自论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：同样在频域做文章的 [FEDformer](/0637_ML_Tasks_TimeSeries_Deep_FEDformer)、[FreTS](/0673_ML_Tasks_TimeSeries_Deep_FreTS)；线性/MLP 路线的 [DLinear](/0630_ML_Tasks_TimeSeries_Deep_DLinear)；用 Koopman 理论的 [Koopa](/0672_ML_Tasks_TimeSeries_Deep_Koopa)；总览见 [深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)。

## 1. 解决什么问题

- 长期预测需要看很长的历史，但历史越长，噪声越多，直接把长序列喂给 MLP、RNN 或原始注意力，往往效果不好；
- 论文的做法分两步：先用 Legendre 多项式投影"无损地"压缩历史（保留信息），再用傅里叶变换挑选重要频率（去除噪声）；
- 论文也强调这是一个通用框架：Legendre 投影可以换成其他正交基（如傅里叶、小波、Laguerre、Chebyshev 多项式）。

## 2. 理论基础：Legendre-Fourier 表示

### 2.1 Legendre 投影

给定在线观测的函数 $f$，目标是在每个时刻 $t$ 维护其窗口历史 $f(x)_{[t-\theta,t]}$ 的固定大小压缩表示。用最高 $N-1$ 阶的 Legendre 多项式去逼近：

$$
g^{(t)}(x)=\sum_{n=0}^{N-1} c_n(t)\,P_n\!\left(\frac{2(x-t)}{\theta}+1\right)
$$

其中：

- $g^{(t)}(x)$：时刻 $t$ 对窗口历史的近似函数；
- $P_n(\cdot)$：第 $n$ 阶 Legendre 多项式，作为正交基；
- $c_n(t)$：第 $n$ 个投影系数，所有 $c_n$ 合起来就是"记忆"；
- $N$：多项式个数，也就是记忆的维度，越大逼近越精确；
- $\theta$：窗口大小；括号内的线性变换把窗口 $[t-\theta,t]$ 映射到 $[-1,1]$。

> 上式的写法 `[解读]`：论文采用 HiPPO 的度量 $\mu^{(t)}=\frac1\theta\mathbb I_{[t-\theta,t]}(x)$，即窗口内均匀加权，具体坐标变换形式以论文为准。

系数 $c(t)$ 随新数据到来按线性动态方程更新，离散化后是一个状态空间递推：

$$
C_t = A\,C_{t-1} + B\,x_t
$$

其中：

- $x_t\in\mathbb R$：时刻 $t$ 的输入信号；
- $C_t\in\mathbb R^{N}$：记忆单元，即 $N$ 个 Legendre 系数；
- $A\in\mathbb R^{N\times N}$、$B\in\mathbb R^{N\times 1}$：由 HiPPO-LegT 给出的**固定、不可训练**矩阵（定义见 Voelker 等 2019），所以投影这一步没有可学参数。

**逼近精度（Theorem 1）**：若 $f$ 是 $L$-Lipschitz 的，则逼近误差为 $O(L/\sqrt N)$；若 $f$ 有 $k$ 阶有界导数，则误差为 $O(k N^{-k+1/2})$。结论是：基越多越准。但基太多会把历史里的噪声也一起拟合，因此需要下一步的频域滤波。

### 2.2 固定窗口与噪声积累

论文特意使用**固定窗口**而非不断增长的窗口：考虑带噪自回归 $x_{t+1}=Ax_t+b+\epsilon_t$，$A$ 为酉矩阵、$\epsilon_t$ 为次高斯噪声时（Theorem 2），向前追溯 $\theta$ 步，噪声会以 $O(\sqrt\theta)$ 的速率积累——窗口越长噪声越多，所以限制窗口大小有利于去噪。

### 2.3 傅里叶特征选择

对 Legendre 系数矩阵做傅里叶变换后，只保留部分频率模式。论文的 Theorem 3 指出：若被丢弃的高频分量幅度足够小（小于某个 $a_{\min}$），那么保留前 $s$ 个低频列、再随机补充少量其余列所张成的空间，与原空间几乎一致——也就是说，**丢弃小幅度的频率分量几乎不损失信息**。这为"只取低频、可混入少量随机高频"的模式选择提供了依据。

## 3. 模型结构

### 3.1 整体流程

下图概括 FiLM 的数据流。

```
输入 X ∈ R^{T×D}
   │ RevIN 归一化（可选）
   ▼
多尺度专家：取长度 T, 2T, ..., nT 的输入各自处理
   │  每个专家：
   │   LPU  ：投影到 Legendre 记忆  C ∈ R^{N}
   │   FEL  ：FFT → 选 M 个模式 → 权重 W 变换 → 逆 FFT  → C'
   │   LPU_R：由 C' 重构出预测序列
   ▼
线性层合并各专家预测
   │ RevIN 反归一化
   ▼
输出 Y ∈ R^{T×D}
```

图中：

- **RevIN**：对每个实例做归一化（均值/方差，带可学习仿射参数），输出时做反归一化；论文称它是可选的稳定器；
- **LPU**（Legendre Projection Unit）：把输入序列投影成记忆 $C$，不可训练；
- **FEL**（Frequency Enhanced Layer）：整个模型唯一需要学习的核心层，在频域里做选择与变换；
- **LPU_R**：LPU 的反向过程，用离散 Legendre 多项式矩阵把记忆重构成时间序列；
- **多尺度专家**：用 $\{T,2T,\dots,nT\}$ 长度的历史分别预测同一个长度为 $T$ 的未来，再用线性层合并；
- 关键结论：整个模型只有一层 LPU 和一层 FEL，结构非常简单。

### 3.2 LPU：投影与重构

LPU 有两个阶段：

- **投影（Projection）**：$C=\mathrm{LPU}(X)$，按上面的状态空间递推把输入压缩成记忆；
- **重构（Reconstruction）**：$X_{re}=\mathrm{LPU\_R}(C)$，用离散 Legendre 多项式矩阵乘记忆，恢复到原始信号空间。

下图是 LPU 内部的两个状态。

```
投影：  x(t) ──► [ C(t) = A·C(t-1) + B·x(t) ] ──► C(t)   （A, B 固定）
重构：  C(t) ──► [ 乘离散 Legendre 多项式矩阵 ] ──► x_re(t)
```

图中：

- $x(t)$ 是 $t$ 时刻的原始输入信号，$C(t)$ 是到 $t$ 时刻为止的历史压缩记忆；
- $A$、$B$ 是两个预先固定的投影矩阵，投影阶段不含可学习参数；
- 重构阶段把记忆乘以离散 Legendre 矩阵，恢复为原始信号的近似。

### 3.3 FEL：频率增强层

FEL 作用在 LPU 产生的记忆上：先做傅里叶变换，只保留 $M$ 个频率模式，用一个可学习权重在频域做线性变换，再逆变换回去。其可学习权重为：

$$
W\in\mathbb R^{M\times N\times N}
$$

其中：

- $M$：保留的频率模式个数；
- $N$：Legendre 多项式个数（默认 256）；
- $W$：FEL 唯一需要从数据学习的权重，大小随 $M$ 与 $N^2$ 增长，可能很大。

**低秩近似**：把 $W$ 分解为三个小矩阵：

$$
W \approx W_1\times W_2\times W_3,\quad W_1\in\mathbb R^{M\times N'\times N'},\; W_2\in\mathbb R^{N\times N'},\; W_3\in\mathbb R^{N\times N'}
$$

其中：

- $N'$：低秩维度，$N'\ll N$；
- $W_1,W_2,W_3$：分解后的三个因子（具体的维度排布以论文图 5 为准）；
- 论文报告：在默认 $N=256$ 下取 $N'=4$，可学习参数可降到原来的 0.4%，精度只有轻微下降。

**模式选择**：选哪些频率模式有几种策略：Lowest（取最低的 $M$ 个）、Random（随机取 $M$ 个）、Low random（取 $0.8M$ 个最低频加 $0.2M$ 个随机高频）。默认是 Lowest；论文的实验表明在部分数据集上，混入少量随机高频还能带来额外提升，这与 Theorem 3 一致。

### 3.4 多尺度专家混合与数据归一化

- **多尺度专家混合（Mixture of Multiscale Experts）**：模型对所有历史点一视同仁，缺少多尺度的先验，因此让输入取 $\{T,2T,\dots,nT\}$ 多个长度，各自预测未来 $T$ 步，再用线性层合并；论文称这在所有数据集上都稳定带来提升（Table 7）。
- **RevIN 归一化**：对每个实例 $x^{(i)}_k\in\mathbb R^{T}$ 先算均值与方差，再做可学习仿射的归一化：

$$
\hat x^{(i)}_{kt}=\gamma_k\,\frac{x^{(i)}_{kt}-\mathbb E_t[x^{(i)}_{kt}]}{\sqrt{\mathrm{Var}_t[x^{(i)}_{kt}]+\epsilon}}+\beta_k
$$

其中：

- $k$：变量（通道）编号，$i$：样本编号，$t$：时间；
- $\mathbb E_t[\cdot]$、$\mathrm{Var}_t[\cdot]$：沿时间维 $T$ 求的均值与方差，即 $\mathbb E_t[x_{kt}]=\frac1T\sum_{j=1}^{T}x_{kj}$；
- $\gamma_k,\beta_k$：可学习的仿射参数向量；$\epsilon$：数值稳定小常数；
- 输出时用同样的统计量做反归一化。

论文指出：LPU 投影本身在多数数据集上已经起到归一化作用，RevIN 只是**可选**的稳定器——它会让训练慢 2–5 倍，且并非在所有数据集上都有提升。

## 4. 组件汇总

| 组件 | 是否可训练 | 作用 |
| --- | --- | --- |
| RevIN | 仿射参数可训练（可选） | 缓解分布漂移，增强鲁棒性 |
| LPU / LPU_R | 否（$A,B$ 与重构矩阵固定） | 用 Legendre 基压缩并重构历史 |
| FEL | 是（权重 $W$，可低秩） | 频域选模式、去噪、做线性变换 |
| 多尺度专家 + 线性合并 | 线性层可训练 | 融合不同长度历史的预测 |

表中：

- 第一列是模块名；第二列说明该模块是否含可训练参数；第三列说明其作用；
- 可训练参数几乎只集中在 FEL 的 $W$（以及合并用的线性层）里，这也是 FiLM 参数量可以被低秩近似压到很小的原因。

## 5. 实验与结论

- 论文在六个长期预测基准上评测，报告多变量与单变量预测分别平均提升 20.3% 和 22.6%（相对此前的 SOTA）；
- 消融实验（Table 7）分别考察 FEL、LPU、多尺度专家、RevIN 的作用，结论是 LPU 与 FEL 两个模块都有贡献，多尺度专家稳定带来提升，RevIN 视数据集而定；
- 论文还研究了不同的频率模式选择策略与低秩维度对精度的影响。

## 6. 总结 [解读]

- FiLM 的思路是"先尽量保留、再选择性地丢弃"：Legendre 投影保留信息，傅里叶低频选择去噪；
- 它比 Transformer 类模型简单得多（一层 LPU + 一层 FEL），参数还能低秩压缩；
- 局限：LPU 的 $A,B$ 固定，窗口大小 $\theta$ 与基数 $N$ 需要选择；具体数值请以论文为准。

## Reference

- Zhou T, Ma Z, Wen Q, Sun L, Yao T, Yin W, Jin R. FiLM: Frequency improved Legendre Memory Model for Long-term Time Series Forecasting. NeurIPS 2022. arXiv:2205.08897
- Gu A, Dao T, Ermon S, Rudra A, Ré C. HiPPO: Recurrent Memory with Optimal Polynomial Projections. NeurIPS 2020.
- Voelker A, Kajić I, Eliasmith C. Legendre Memory Units: Continuous-Time Representation in Recurrent Neural Networks. NeurIPS 2019.
- Kim T 等. Reversible Instance Normalization for Accurate Time-Series Forecasting against Distribution Shift. ICLR 2022.

