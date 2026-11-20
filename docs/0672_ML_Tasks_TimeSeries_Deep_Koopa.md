---
Title | ML Tasks TimeSeries Deep Koopa
-- | --
Created @ | `2026-11-20T09:04:34Z`
Updated @| `2026-11-20T09:04:34Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/672)

---
# Koopa

Koopa 出自论文 *Koopa: Learning Non-stationary Time Series Dynamics with Koopman Predictors*（Yong Liu、Chenyu Li、Jianmin Wang、Mingsheng Long，清华大学软件学院，NeurIPS 2023，arXiv:2305.18803）。它用现代 **Koopman 理论**来处理真实时间序列的**非平稳性**：把序列看作动力系统，先把"随时间变化的成分"与"时不变的成分"分离，再分别用 Koopman 预测器（Koopman Predictor, KP）在线性化的嵌入空间里向前推进动力学。

**一句话概括：每个 Koopa 块先用傅里叶滤波器把输入拆成时不变与时变两部分，时不变部分用一个全局可学习的 Koopman 算子预测，时变部分在回看窗口内用 DMD 现场解析求出局部算子预测；块之间以残差方式堆叠，学习层次化的动力学。**

> 标注约定：未标注的内容来自论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：非平稳性的另一种处理见 [Non-stationary Transformers](/0669_ML_Tasks_TimeSeries_Deep_NonstationaryTransformer)；同样用傅里叶/频域思想的 [FEDformer](/0637_ML_Tasks_TimeSeries_Deep_FEDformer)、[FiLM](/XXXX_ML_Tasks_TimeSeries_Deep_FiLM)；线性动力学视角与状态空间模型（[S4](/0642_ML_Tasks_TimeSeries_Deep_S4)、[Mamba](/0643_ML_Tasks_TimeSeries_Deep_Mamba)）相通；总览见 [深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)。

## 1. 解决什么问题

- 真实时间序列有内在**非平稳性**（统计量与时间有关），是深度预测模型的主要挑战；
- 以往模型往往难以处理由时间分布变化带来的复杂序列变化；
- Koopman 理论从动力系统出发：非线性动力学可以通过某个**测量函数**嵌入到高维空间，在该空间中由一个线性算子推进；若把时间线放大看，局部时间序列表现出**弱平稳性**，与 Koopman 理论分析大型非线性动力学的思路吻合。

挑战在于：时变与时不变的动力学需要不同的算子，且需要在端到端框架里训练。

## 2. 背景：Koopman 理论与 DMD

**Koopman 理论**：离散时间动力系统写作 $x_{t+1}=F(x_t)$，其中 $x_t$ 是系统状态，$F$ 是描述动力学的向量场。直接在状态空间辨识 $F$ 很难（非线性、含噪）。Koopman 理论假设状态可以投影到**测量函数** $g$ 的空间，在该空间里由一个（无限维）线性算子 $\mathcal K$ 向前推进：

$$
\mathcal K\,g(x_t)=g(x_{t+1})
$$

其中：$x_t$ 是第 $t$ 步状态；$g$ 是测量函数（把状态映射到嵌入空间）；$\mathcal K$ 是 Koopman 算子，作用在嵌入上是线性的。它搭起了有限维非线性动力学与无限维线性动力学之间的桥梁。

**动态模态分解（DMD）**：用收集到的状态快照（snapshot）拟合一个有限维矩阵 $K$ 来近似 $\mathcal K$；扩展 DMD（eDMD）避免手工设计测量函数，可与自编码器结合（Koopman 自编码器 KAE）。Koopa 用 MLP 学习测量函数（编码器/解码器），并用 DMD 的最小二乘形式求局部算子。

## 3. 模型结构

### 3.1 Koopa 块与整体流程

Koopa 由可堆叠的 Koopa 块组成，每个块学习输入的动力学并向前推进以做预测；块之间用**残差**方式层次化地学习算子（后一块的输入是前一块拟合后的残差）。

下图概括一个 Koopa 块与块间堆叠。

```
输入 X^(b) ∈ R^{T×C}
   │ Fourier Filter（按平均幅值 Top-α 频率划分）
   ├─► 时不变成分 X_inv ──► Time-invariant KP（全局可学习算子 K_inv）──► 预测 Y_inv^(b) ，拟合 X̂_inv
   └─► 时变成分   X_var ──► Time-variant KP（窗口内 DMD 现场求局部算子 K_var）──► 预测 Y_var^(b) ，拟合 X̂_var
   │
   ▼ 残差：X^(b+1) = X^(b) − X̂_inv − X̂_var   （作为下一块输入）

最终预测 Y = Σ_b ( Y_var^(b) + Y_inv^(b) )
```

图中：

- 每个块先用傅里叶滤波器把输入拆成时不变与时变两路，两路各有一种 KP；
- 每路 KP 给出对未来的预测和对回看窗口的拟合；回看窗口里未被拟合的残差作为下一块的输入，用来学习"修正算子"；
- 所有块的预测分量相加得到最终预测；
- 论文强调：与 KAE 等方法不同，Koopa **不**对回看窗口加严格的重构损失，而是把 KP 嵌进深度残差结构，只用单一的预测损失做端到端训练。

### 3.2 傅里叶滤波器（Fourier Filter）

目的：找到各窗口共享的**全局频谱**与随时间变化的**局部频谱**。做法：对训练集中每个回看窗口预先做 FFT，对每个频率 $f\in S=\{0,1,\dots,\lfloor T/2\rfloor\}$ 计算平均幅值，按幅值排序，取前 $\alpha$ 比例作为子集 $G\subset S$（占主导、在各窗口间共享，反映数据集中的时不变动力学），其余频率 $\bar G=S\setminus G$ 属于随窗口、时期而变的成分。分解为：

$$
X_{\mathrm{inv}}=\mathcal F^{-1}\big(\mathrm{Filter}(\mathcal F(X),G)\big),\qquad
X_{\mathrm{var}}=\mathcal F^{-1}\big(\mathrm{Filter}(\mathcal F(X),\bar G)\big)
$$

其中：

- $X\in\mathbb R^{T\times C}$：当前块的输入（$T$ 为回看长度，$C$ 为变量数）；$\mathcal F$：FFT，$\mathcal F^{-1}$：逆 FFT
- $\mathrm{Filter}(\cdot,G)$：只让集合 $G$ 里的频率通过；$G$ 是主导频率集合，$\bar G$ 是其补集
- $X_{\mathrm{inv}}$、$X_{\mathrm{var}}$：时不变与时变成分，二者之和还原输入

### 3.3 时不变 Koopman 预测器（Time-invariant KP）

目标：刻画全局共享的动力学，学习从回看窗口到预测窗口的直接转移 $F:X_{\mathrm{inv}}\to Y_{\mathrm{inv}}$。引入一对编码器、解码器学习共同的 Koopman 嵌入，算子 $K_{\mathrm{inv}}\in\mathbb R^{D\times D}$ 是一个可学习的模型参数，把回看窗口的嵌入推进到预测窗口的嵌入：

$$
z_{\mathrm{back}}=\mathrm{Encoder}(X_{\mathrm{inv}}),\qquad
z_{\mathrm{fore}}=K_{\mathrm{inv}}\,z_{\mathrm{back}},\qquad
Y_{\mathrm{inv}}=\mathrm{Decoder}(z_{\mathrm{fore}})
$$

其中：

- $\mathrm{Encoder}:\mathbb R^{T\times C}\to\mathbb R^{D}$：把整个回看窗口编码成 $D$ 维 Koopman 嵌入；$\mathrm{Decoder}:\mathbb R^{D}\to\mathbb R^{H\times C}$：把嵌入解码成长度 $H$ 的预测窗口
- $z_{\mathrm{back}},z_{\mathrm{fore}}\in\mathbb R^{D}$：回看窗口与预测窗口的嵌入（"快照对"）
- $K_{\mathrm{inv}}\in\mathbb R^{D\times D}$：全局可学习的算子，对所有窗口共用
- $D$：嵌入维度；$H$：预测长度

### 3.4 时变 Koopman 预测器（Time-variant KP）

时变动力学持续变化，因此使用窗口内的**局部快照**：时间邻域更可能被线性化。把回看窗口切成长度为 $S$ 的片段（$S$ 能整除 $T$ 与 $H$，否则补齐/截断），每个片段由另一对编码器/解码器映射为 Koopman 嵌入 $z_j\in\mathbb R^{D}$，得到快照集合 $Z=[z_1,\dots,z_{T/S}]$。用 eDMD 的一步算子近似解析求出局部算子：

$$
Z_{\mathrm{back}}=[z_1,\dots,z_{T/S-1}],\quad
Z_{\mathrm{fore}}=[z_2,\dots,z_{T/S}],\quad
K_{\mathrm{var}}=Z_{\mathrm{fore}}\,Z_{\mathrm{back}}^{\dagger}
$$

其中：

- $z_j$：第 $j$ 个片段的 $D$ 维嵌入；$Z_{\mathrm{back}}$：除最后一个片段外的嵌入集合，$Z_{\mathrm{fore}}$：除第一个片段外的嵌入集合（相邻快照对）
- $Z_{\mathrm{back}}^{\dagger}$：$Z_{\mathrm{back}}$ 的 Moore-Penrose 伪逆；$K_{\mathrm{var}}\in\mathbb R^{D\times D}$：该窗口局部拟合出的算子，**随窗口变化、现场计算**，不是可学习参数
- 用它推进嵌入：拟合 $[\hat z_1,\dots,\hat z_{T/S}]=[z_1,K_{\mathrm{var}}Z_{\mathrm{back}}]$，并用同一个算子继续迭代向前得到预测片段的嵌入，再由解码器还原为时间片段，按序拼接得到 $\hat X_{\mathrm{var}}$ 与 $Y_{\mathrm{var}}$

论文还说明，局部算子使模型可以在预测时利用已到达的真实观测不断适应，从而**扩展预测长度**（见 §5.3）。

### 3.5 训练目标

编码器、解码器与 $K_{\mathrm{inv}}$ 是可学习参数，$K_{\mathrm{var}}$ 现场计算。为保持不同块之间 Koopman 嵌入的一致性，时变与时不变 KP 之间共享编码器/解码器（论文把它们记作 var 与 inv 两组）。用 MSE 损失优化：

$$
\mathcal L=\big\lVert Y_{\mathrm{gt}}-Y\big\rVert_2^2,\qquad Y=\sum_{b}\big(Y_{\mathrm{var}}^{(b)}+Y_{\mathrm{inv}}^{(b)}\big)
$$

其中：$Y_{\mathrm{gt}}$ 是真实的预测窗口；$Y$ 是所有块预测分量之和；论文的假设是"若重构失败则预测必然失败"，因此消除预测误差也有助于拟合观测到的动力学，无需额外重构损失。

## 4. 训练与实验设置

- **数据集**：多变量预测使用 Autoformer 基准中的 ECL、ETT、Exchange、ILI、Traffic、Weather 共 6 个；单变量预测使用 M4 的四个子集；数据处理与划分沿用 TimesNet 的设置。
- **回看长度**：对每个预测长度 $H$，回看窗口 $T=2H$（沿用 N-BEATS 的做法），预测长度对 ILI 为 $\{24,36,48,60\}$，其余为 $\{48,96,144,192\}$。
- **基线**：Transformer 类 Autoformer、PatchTST；TCN 类 TimesNet、MICN；MLP 类 DLinear；傅里叶预测器 FiLM；Koopman 预测器 KNF；单变量另有 N-HiTS、N-BEATS。基线结果按原论文或官方代码复现。
- **其他超参**：嵌入维度、块数、$\alpha$ 等见论文附录，本文未逐项核对 `[待核实]`。

## 5. 实验与结论

### 5.1 预测性能与效率

- 论文称 Koopa 在 **70% 以上**的多变量设置中达到最优，在单变量设置中一致优于其他深度模型；
- 大幅超过此前最好的 Koopman 预测器 KNF，论文归因于层次化动力学学习与解耦机制；
- DLinear 在 ILI、Traffic、Weather 上表现一般，论文认为这表明时间序列的非线性动力学对模型容量提出挑战，逐点加权未必适合刻画时间依赖；
- 摘要给出：与 SOTA 模型相比，Koopa 达到有竞争力的性能，同时节省 77.3% 的训练时间和 76.0% 的内存。

### 5.2 模型分析

分析项 | 做法 | 论文观察
-- | -- | --
动力学解耦 | 把序列分成 20 个不同时期的子集，对傅里叶滤波器分出的成分各做线性回归，用线性权重的标准差衡量逐点时间依赖的变化程度 | 滤波器分出的时变成分变化程度更大，时不变成分更稳定，验证了解耦效果
案例（汇率） | 每隔一年采样回看窗口，可视化时变 KP 求得的局部算子 | 局部算子在不同时期呈现不同的时间模式，说明需要随窗口变化的算子；并给出可解释线索（如序列上升趋势与算子特征值对应）
消融 | 只用 $K_{\mathrm{inv}}$、只用 $K_{\mathrm{var}}$、用高低通滤波替代傅里叶滤波、交换 KP 顺序 | 时变与时不变 KP 互补，去掉任意一个都变差；傅里叶滤波解耦有效；平均结果见论文 Table 3

表中：「分析项」是被考察的内容，「做法」是实验设置，「论文观察」是结论。核心结论：时变与时不变成分需要不同的算子，傅里叶滤波器能有效分离，两种 KP 缺一不可。

### 5.3 扩展预测长度

多数深度预测模型训练后是固定函数（输入 $T$、输出 $H$）。当预测长度不匹配或需要更长预测时：(1) 要复用已学到的参数；(2) 要利用陆续到来的真实观测做适应。论文称 Koopa 通过算子适应（用新到的真值更新局部算子）有潜力扩展预测长度。具体实验与数字见论文 5.3 节，本文不转引。

## 6. 优缺点与局限

论文自述的优点：把时间序列当动力系统，解耦时变/时不变成分；用 MLP 学习 Koopman 嵌入与算子，结构简单高效；可端到端训练；可在预测中适应新观测。

`[解读]` / `[经验]`：

- 局部算子由窗口内少量快照解析求解，快照太少或噪声大时伪逆不稳定，需要合理设定片段长度 $S$；
- 傅里叶滤波器以训练集平均幅值划分频率，如果数据分布随时间漂移明显，"全局主导频率"的稳定性取决于训练数据；
- 论文的实验使用 $T=2H$ 的回看设置，与固定回看窗口（如 96 或 336）的基准口径不同，跨论文比较数字需要小心；
- 官方代码在 `thuml/Koopa`；Time-Series-Library 中也提供 `Koopa` 模型 `[待核实]`。

## 7. 与相关方法对比

方法 | 对非平稳性的处理 | 骨干 | 特点
-- | -- | -- | --
Koopa | 傅里叶分解时变/时不变 + Koopman 预测器 | MLP 编码器-解码器 | 线性化嵌入空间推进动力学，局部算子现场求解
KNF | Koopman 神经预测器 | 神经网络 | 同属 Koopman 预测器，论文中被大幅超过
Non-stationary Transformers | 平稳化 + De-stationary Attention | Transformer | 通过注意力补回非平稳信息
FiLM | 勒让德记忆 + 傅里叶投影去噪 | 记忆单元 | 同为频域预测器
DLinear | 线性映射 | 线性层 | 简单高效，对复杂非线性动力学容量有限

表中：「对非平稳性的处理」说明各方法的核心手段，「骨干」是网络类型，「特点」给出差异。Koopa 的独特点是把时变与时不变动力学分开，并在线性化的嵌入空间里推进。

## 8. 使用方式

示意代码，未运行验证；只表达时变 KP 中局部算子的现场求解（DMD）与时不变 KP 的可学习算子，超参为占位值：

```python
import torch, torch.nn as nn

def fourier_filter(x, alpha_set):                # x: [B, T, C]；alpha_set: 主导频率的布尔掩码 [T//2+1]
    f = torch.fft.rfft(x, dim=1)
    mask = alpha_set.view(1, -1, 1)
    inv = torch.fft.irfft(f * mask, n=x.shape[1], dim=1)
    var = torch.fft.irfft(f * (~mask), n=x.shape[1], dim=1)
    return inv, var

class TimeInvKP(nn.Module):
    def __init__(self, T, H, C, D=128):
        super().__init__()
        self.enc = nn.Sequential(nn.Linear(T * C, 256), nn.ReLU(), nn.Linear(256, D))
        self.dec = nn.Sequential(nn.Linear(D, 256), nn.ReLU(), nn.Linear(256, H * C))
        self.K = nn.Parameter(torch.eye(D))        # 全局可学习算子 K_inv
        self.H, self.C = H, C
    def forward(self, x):                          # x: [B, T, C]
        z = self.enc(x.flatten(1))
        return self.dec(z @ self.K.T).view(-1, self.H, self.C)

def dmd_operator(Z):                               # Z: [B, N, D] 片段嵌入快照
    back, fore = Z[:, :-1], Z[:, 1:]               # 相邻快照对
    # K = fore^T · pinv(back^T)：最小二乘一步算子（现场求解，非可学习）
    return fore.transpose(1, 2) @ torch.linalg.pinv(back.transpose(1, 2))   # [B, D, D]
```

使用要点 `[经验]`：先用官方仓库的默认超参在 ETT/ECL 上复现，再迁移到自己的数据；注意其 $T=2H$ 的回看设置。

## Reference

- Yong Liu, Chenyu Li, Jianmin Wang, Mingsheng Long. *Koopa: Learning Non-stationary Time Series Dynamics with Koopman Predictors*. NeurIPS 2023. [arXiv:2305.18803](https://arxiv.org/abs/2305.18803)
- 站内：[深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)、[Non-stationary Transformers](/0669_ML_Tasks_TimeSeries_Deep_NonstationaryTransformer)、[TimesNet](/0631_ML_Tasks_TimeSeries_Deep_TimesNet)

