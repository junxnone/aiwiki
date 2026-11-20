---
Title | ML Tasks TimeSeries Deep FreTS
-- | --
Created @ | `2026-11-20T09:05:48Z`
Updated @| `2026-11-20T09:05:48Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/673)

---
# FreTS

FreTS（Frequency-domain MLPs for Time Series）出自论文 *Frequency-domain MLPs are More Effective Learners in Time Series Forecasting*（Kun Yi、Qi Zhang、Wei Fan、Shoujin Wang、Pengyang Wang、Hui He、Defu Lian、Ning An、Longbing Cao、Zhendong Niu，NeurIPS 2023，arXiv:2311.06184）。它的核心观点是：**把 MLP 搬到频域（对傅里叶变换后的复数频谱做 MLP）去做时间序列预测**，比在时域做 MLP 更有效。论文给出两点理由：**全局视野**（频域中的一个点对应时域整条序列的信息）与**能量集中**（序列的能量集中在少量频率分量上，学习频谱更容易识别关键模式）。

**一句话概括：先把输入扩维，再沿通道维和时间维各做一次"傅里叶变换 → 复数 MLP → 逆变换"（频域通道学习器与频域时间学习器），最后用两层前馈网络一步输出整段预测，复杂度 $O(N\log N+L\log L)$。**

> 标注约定：未标注的内容来自论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：同属 MLP 路线的 [DLinear](/0630_ML_Tasks_TimeSeries_Deep_DLinear)、[TSMixer](/0632_ML_Tasks_TimeSeries_Deep_TSMixer)、[TimeMixer](/0633_ML_Tasks_TimeSeries_Deep_TimeMixer)、[LightTS](/0667_ML_Tasks_TimeSeries_Deep_LightTS)；频域思想相近的 [FEDformer](/0637_ML_Tasks_TimeSeries_Deep_FEDformer)；总览见 [深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)。注意：FreTS 与同一作者团队同日发布的 FourierGNN（arXiv:2311.06190）是两篇不同的论文。

## 1. 解决什么问题

- 复杂的深度预测模型（RNN、CNN、GNN、Transformer）计算开销大，且在数据有限时鲁棒性容易受大量参数影响；
- MLP 类方法结构简单、复杂度低、效果好，但它们都在**时域**学习；
- 论文的观察（Figure 1）：对同一数据，频域中 MLP 学到的模式有两个特点：
  - **全局视野（global view）**：频域学到的模式比时域更能体现整条序列的全局周期性；
  - **能量集中（energy compaction）**：频域中依赖关系的对角结构和关键模式更清晰，因为能量集中在少数频率分量上。

因此论文重新设计了适用于复数频谱的 MLP，并用它搭建预测模型。

## 2. 问题定义

设有 $N$ 条序列、$T$ 个时间戳的规则采样多变量数据 $[X_1,\dots,X_T]\in\mathbb R^{N\times T}$，其中 $X_t\in\mathbb R^{N}$ 是时刻 $t$ 的 $N$ 个变量的取值。把时刻 $t$ 的长度为 $L$ 的回看窗口记作输入：

$$
\mathbf X_t=[X_{t-L+1},\dots,X_t]\in\mathbb R^{N\times L}
$$

预测目标是长度为 $\tau$ 的未来窗口 $\mathbf Y_t=[X_{t+1},\dots,X_{t+\tau}]\in\mathbb R^{N\times\tau}$。模型学习从 $\mathbf X_t$ 到 $\hat{\mathbf Y}_t$ 的映射。

其中：$N$ 是变量（通道）数，$L$ 是回看长度，$\tau$ 是预测长度，$\mathbf X_t$ 与 $\mathbf Y_t$ 分别是输入窗口与目标窗口。

## 3. 模型结构

### 3.1 整体流程

下图概括 FreTS 的频域学习架构。

```
输入 X_t ∈ R^{N×L}
   │ 维度扩展：× d（可学习向量 1×d）  →  H_t ∈ R^{N×L×d}
   ▼
 频域通道学习器 Frequency Channel Learner
   沿通道维：DomainConversion(chan) → FreMLP → DomainInversion(chan)
   对 L 个时刻共享权重，学习变量间依赖  →  Z_t ∈ R^{N×L×d}
   ▼
 频域时间学习器 Frequency Temporal Learner
   沿时间维：DomainConversion(temp) → FreMLP → DomainInversion(temp)
   对 N 个通道共享权重，学习时间依赖  →  S_t ∈ R^{N×L×d}
   ▼
 投影：展平 (L·d) → 两层 FFN → 一步输出  Ŷ_t ∈ R^{N×τ}
```

图中：

- 第一步是维度扩展：把输入 $\mathbf X_t$ 与一个可学习权重向量 $\mathbf d\in\mathbb R^{1\times d}$ 相乘，得到更有表达力的隐表示 $\mathbf H_t\in\mathbb R^{N\times L\times d}$（灵感来自词嵌入）。
- 第二步是**频域通道学习器**：在每个时刻上沿通道维把表示变到频域，用频域 MLP 学习变量间依赖，再变回时域；$L$ 个时刻共享同一组权重。
- 第三步是**频域时间学习器**：对每个通道沿时间维做同样的"变换—MLP—逆变换"，$N$ 个通道共享权重，学习时间依赖。
- 最后一步投影：两层前馈网络一次性输出整段预测，避免逐步预测的误差累积。
- 关键结论：两个学习器都用频域 MLP，分别负责变量间与时间上的依赖。

### 3.2 域转换与逆转换

利用傅里叶变换把隐表示分解为不同频率的成分，有助于发现周期与趋势：

$$
\mathcal H(f)=\int_{-\infty}^{\infty}H(v)\,e^{-j2\pi fv}\,dv=\int H(v)\cos(2\pi fv)\,dv-j\int H(v)\sin(2\pi fv)\,dv=\mathrm{Re}(\mathcal H)+j\,\mathrm{Im}(\mathcal H)
$$

其中：

- $H(v)$：时域信号（沿通道维或时间维的取值），$v$ 是积分变量，$f$ 是频率，$j$ 是虚数单位（$j^2=-1$）
- $\mathcal H(f)$：对应的频域复数表示，$\mathrm{Re}$ 与 $\mathrm{Im}$ 分别是实部与虚部
- 论文用 DomainConversion 表示正变换，DomainInversion 表示逆变换（逆变换把频域结果变回时域）；在实现上用离散傅里叶变换（DFT）与其逆变换，且**分别沿通道维和时间维**执行

### 3.3 频域 MLP（FreMLP）

论文为复数输入重新设计了 MLP（Definition 1）：对复数输入 $\mathcal H\in\mathbb C^{m\times d}$，复数权重 $\mathcal W\in\mathbb C^{d\times d}$、偏置 $\mathcal B\in\mathbb C^{d}$，第 $\ell$ 层为 $\mathcal Y^{\ell}=\sigma(\mathcal Y^{\ell-1}\mathcal W^{\ell}+\mathcal B^{\ell})$，$\mathcal Y^{0}=\mathcal H$。按复数乘法法则，把实部和虚部分开计算后再堆成复数：

$$
\mathcal Y^{\ell}=\sigma\big(\mathrm{Re}(\mathcal Y^{\ell-1})W_r-\mathrm{Im}(\mathcal Y^{\ell-1})W_i+B_r\big)+j\,\sigma\big(\mathrm{Re}(\mathcal Y^{\ell-1})W_i+\mathrm{Im}(\mathcal Y^{\ell-1})W_r+B_i\big)
$$

其中：

- $\mathcal Y^{\ell-1}\in\mathbb C^{m\times d}$：上一层输出（第 0 层为输入）；$\mathrm{Re},\mathrm{Im}$ 取其实部与虚部
- $W_r,W_i\in\mathbb R^{d\times d}$：复数权重 $\mathcal W$ 的实部与虚部；$B_r,B_i\in\mathbb R^{d}$：偏置的实部与虚部
- $\sigma$：激活函数（分别作用于实部与虚部）；$m$ 是频率分量个数，$d$ 是隐维度

论文给出两条理论结论来支持频域 MLP：

- **Theorem 1（能量守恒，Parseval 型）**：时域中序列的能量等于其频域表示的能量。含义：若大部分能量集中在少数频率上，只用这些分量就能较准确地表示序列，丢弃其余分量不会显著影响信号能量，这解释了"能量集中"；
- **Theorem 2（全局卷积）**：频域上的 MLP 运算等价于时域中的**全局圆周卷积**：$\mathcal H\mathcal W+\mathcal B\ \Leftrightarrow\ H\circledast W+B$（$\circledast$ 为圆周卷积，$W,B$ 是时域对应的权重与偏置）。含义：频域逐点乘积相当于时域整条序列的卷积，因此具有全局视野。

### 3.4 两个学习器与投影

**频域通道学习器**：输入 $\mathbf H_t\in\mathbb R^{N\times L\times d}$，对第 $l$ 个时刻的 $\mathbf H^{:,(l)}_t\in\mathbb R^{N\times d}$，沿通道维做域转换得到频谱 $\mathcal H^{\mathrm{chan}}$，经 FreMLP 后逆转换回时域，得到 $\mathbf Z^{:,(l)}\in\mathbb R^{N\times d}$，再把 $L$ 个时刻合并为 $\mathbf Z_t\in\mathbb R^{N\times L\times d}$。权重在 $L$ 个时刻间共享。

**频域时间学习器**：输入 $\mathbf Z_t$，对第 $n$ 个通道的 $\mathbf Z^{(n),:}_t\in\mathbb R^{L\times d}$ 沿时间维做域转换，经 FreMLP 并逆转换，得到 $\mathbf S^{(n),:}\in\mathbb R^{L\times d}$，合并所有通道得到 $\mathbf S_t\in\mathbb R^{N\times L\times d}$。权重在 $N$ 个通道间共享。

**投影**：用两层前馈网络一步输出（无递归）：

$$
\hat{\mathbf Y}_t=\sigma(\mathbf S_t\,\phi_1+b_1)\,\phi_2+b_2
$$

其中：

- $\mathbf S_t$：频域时间学习器的输出，按通道展平为 $N\times(L\cdot d)$
- $\phi_1\in\mathbb R^{(Ld)\times d_h}$、$\phi_2\in\mathbb R^{d_h\times\tau}$：两层的权重；$b_1\in\mathbb R^{d_h}$、$b_2\in\mathbb R^{\tau}$：偏置；$d_h$ 是内层维度；$\sigma$ 是激活函数
- $\hat{\mathbf Y}_t\in\mathbb R^{N\times\tau}$：一步输出的预测窗口，避免递归带来的误差累积

### 3.5 复杂度

论文给出 FreTS 的复杂度为 $O(N\log N+L\log L)$（来自沿通道维与时间维的 FFT），并在 Wiki 数据集上随变量数 $N\in\{1000,\dots,5000\}$ 与不同预测长度，对比了 GNN 类与 Transformer 类方法的效率。

## 4. 训练与实验设置

- **数据集**：共 13 个真实基准。短期预测：Solar、Wiki、Traffic、Electricity、ECG、METR-LA、COVID-19；长期预测：Weather、Exchange、Traffic、Electricity 与 ETT 系列。
- **基线**：短期预测对比 VAR、SFM、LSTNet、TCN、GraphWaveNet、DeepGLO、StemGNN、MTGNN、AGCRN，以及需要预定义图结构的 TAMP-S2GCNets、DCRNN、STGCN；长期预测对比 Informer、Autoformer、Reformer、FEDformer 等（论文表格里的完整基线列表以论文为准）。
- **实现**：PyTorch 1.8，单块 NVIDIA RTX 3080 10GB；损失为 MSE，报告 MAE 与 RMSE（长期预测还报告 MSE）。更多超参见论文附录，本文未逐项核对 `[待核实]`。

## 5. 实验与结论

论文称在短期与长期预测的多个基准上，FreTS 优于对比的 SOTA 方法（表格数字见论文 Table 1、2，本文不转引）。除了主结果，论文还做了几组分析：

分析项 | 做法 | 论文观察
-- | -- | --
频域通道/时间学习器消融 | FreCL：去掉频域时间学习器；FreTL：去掉频域通道学习器 | 两个学习器都有贡献（具体数字见论文 Table 3）
效率 | 在 Wiki 数据集上随变量数 $N\in\{1000,\dots,5000\}$ 与预测长度比较参数量、训练时间、显存 | 与 GNN 类、Transformer 类方法相比更高效（复杂度 $O(N\log N+L\log L)$）
可视化 | 对比频域与时域 MLP 学到的模式 | 频域学到的模式更清晰，体现全局周期性和能量集中

表中：「分析项」是被考察内容，「做法」是实验设置，「论文观察」是结论。核心结论：频域 MLP 有全局视野与能量集中的优势，两个学习器互补，并且效率较高。

## 6. 优缺点与局限

论文自述的优点：把 MLP 搬到频域，结构简单、有理论解释（能量守恒与全局卷积），复杂度低。

`[解读]` / `[经验]`：

- 频域通道学习器在通道维上做 FFT，但通道的顺序并没有物理上的"周期"含义；论文用同一套机制处理通道维，本质上是一种频域上的混合变换，其归纳偏置与 FFT 沿时间维不同，需要通过实验验证 `[解读]`；
- 论文一步输出整段预测，对长预测长度需要增大 $\phi_2$ 的输出，且不使用协变量；
- 论文发表于 2023 年，对比的是当时的基线；与 PatchTST、iTransformer 等的比较不在论文范围内；
- 官方代码仓库与 Time-Series-Library 中的 `FreTS` 实现以各自仓库为准 `[待核实]`。

## 7. 与相关方法对比

方法 | 学习域 | 变量间依赖 | 时间依赖 | 复杂度
-- | -- | -- | -- | --
FreTS | 频域 MLP | 频域通道学习器 | 频域时间学习器 | $O(N\log N+L\log L)$
DLinear | 时域线性 | 无（通道独立） | 线性映射 | 线性
TSMixer | 时域 MLP | 特征混合 | 时间混合 | 线性
FEDformer | 频域注意力 | 通道混合 | 傅里叶/小波增强注意力 | 随模式数线性
FourierGNN | 频域图运算 | 图（超变量图） | 图 | 论文称更低复杂度

表中：「学习域」说明在时域还是频域学习，「变量间依赖」「时间依赖」说明各自如何处理，「复杂度」是量级。FreTS 的特点是同时在频域对通道与时间做 MLP。

## 8. 使用方式

示意代码，未运行验证；只表达沿某一维做"DFT → 复数 MLP → 逆 DFT"的核心逻辑，超参为占位值：

```python
import torch, torch.nn as nn

class FreMLP(nn.Module):
    """对复数频谱的一层 MLP：实部/虚部分别计算（对应论文公式 7）"""
    def __init__(self, d):
        super().__init__()
        self.Wr = nn.Parameter(torch.randn(d, d) * 0.02)
        self.Wi = nn.Parameter(torch.randn(d, d) * 0.02)
        self.Br = nn.Parameter(torch.zeros(d))
        self.Bi = nn.Parameter(torch.zeros(d))

    def forward(self, z):                          # z: 复数张量 [..., m, d]
        re, im = z.real, z.imag
        out_r = torch.relu(re @ self.Wr - im @ self.Wi + self.Br)
        out_i = torch.relu(re @ self.Wi + im @ self.Wr + self.Bi)
        return torch.complex(out_r, out_i)

class FreLearner(nn.Module):
    def __init__(self, d, dim):                    # dim：沿哪一维做 DFT（通道维或时间维）
        super().__init__()
        self.dim, self.mlp = dim, FreMLP(d)

    def forward(self, h):                          # h: [B, N, L, d]
        n = h.shape[self.dim]
        f = torch.fft.rfft(h, dim=self.dim)        # 域转换
        f = f.movedim(self.dim, -2)                # [..., m, d]
        f = self.mlp(f).movedim(-2, self.dim)
        return torch.fft.irfft(f, n=n, dim=self.dim)   # 域逆转换
```

使用要点 `[经验]`：先用默认超参在 ETT、Electricity 上复现；通道很多时可关注沿通道维 FFT 的数值稳定性与归一化方式。

## Reference

- Kun Yi, Qi Zhang, Wei Fan, Shoujin Wang, Pengyang Wang, Hui He, Defu Lian, Ning An, Longbing Cao, Zhendong Niu. *Frequency-domain MLPs are More Effective Learners in Time Series Forecasting*. NeurIPS 2023. [arXiv:2311.06184](https://arxiv.org/abs/2311.06184)
- 站内：[深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)、[DLinear](/0630_ML_Tasks_TimeSeries_Deep_DLinear)、[TSMixer](/0632_ML_Tasks_TimeSeries_Deep_TSMixer)、[FEDformer](/0637_ML_Tasks_TimeSeries_Deep_FEDformer)

