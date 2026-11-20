---
Title | ML Tasks TimeSeries Deep NonstationaryTransformer
-- | --
Created @ | `2026-11-20T09:00:51Z`
Updated @| `2026-11-20T09:00:51Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/669)

---
# Non-stationary Transformers

Non-stationary Transformers（NST）出自论文 *Non-stationary Transformers: Exploring the Stationarity in Time Series Forecasting*（Yong Liu、Haixu Wu、Jianmin Wang、Mingsheng Long，清华大学软件学院，NeurIPS 2022，arXiv:2205.14415）。它是一个**通用框架**，可以套在任意 Transformer 上，解决真实时间序列的**非平稳性**问题：既要让输入分布稳定以提高可预测性，又不能把序列中固有的非平稳信息抹掉。

**一句话概括：用 Series Stationarization 在输入端归一化、输出端反归一化来稳定分布；再用 De-stationary Attention 把被归一化抹掉的均值、方差信息以"缩放因子 $\tau$ 与平移因子 $\Delta$"的形式补回注意力，缓解"过平稳化（over-stationarization）"。**

> 标注约定：未标注的内容来自论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：这套"实例归一化 + 反归一化"的思路与 RevIN（见 [深度学习篇 §1.3](/0606_ML_Tasks_TimeSeries_Deep)）同源，TimesNet、Informer 等模型常采用类似做法；被套用的基础模型有 [Informer](/0635_ML_Tasks_TimeSeries_Deep_Informer)、[Autoformer](/0636_ML_Tasks_TimeSeries_Deep_Autoformer) 等；总览见 [时间序列总览](/0603_ML_Tasks_TimeSeries)。

## 1. 解决什么问题

论文的出发点：

- **非平稳性让深度预测变难**：真实序列的均值、方差随时间变化，训练与测试分布不一致，模型难以泛化；
- **已有做法是"直接平稳化"**：在输入端做归一化（如 Adaptive Norm、RevIN 等），使输入分布稳定，提升可预测性；
- **但这会带来"过平稳化"**：平稳化之后的序列失去了真实序列固有的非平稳信息，对预测突发事件不再有指导意义。具体表现是 Transformer 对不同序列生成**难以区分的时间注意力**，削弱了预测能力。

论文的例子：两条序列 $x_1,x_2=x_1+c$ 只差一个平移，归一化之后得到完全相同的输入，基础模型就会算出相同的注意力，无法区分它们各自与非平稳性纠缠在一起的时间依赖。

因此要在"序列可预测性"与"模型能力"之间做权衡：既要稳定分布，又要把非平稳信息重新还给模型。

## 2. 核心思想与结构

NST 由两个相互配合的模块组成。

### 2.1 Series Stationarization（序列平稳化）

这是一个包在基础模型外面的包装器：输入端归一化，输出端反归一化。

**归一化模块**（在时间维上，对每条输入序列 $x=[x_1,\dots,x_S]\in\mathbb R^{S\times C}$ 做平移与缩放）：

$$
\mu_x=\frac1S\sum_{i=1}^{S}x_i,\qquad
\sigma_x^2=\frac1S\sum_{i=1}^{S}(x_i-\mu_x)^2,\qquad
x'_i=\frac{x_i-\mu_x}{\sigma_x}
$$

其中：

- $S$：输入序列长度；$C$：变量数；$x_i\in\mathbb R^{C}$：第 $i$ 个时间点的观测
- $\mu_x,\sigma_x\in\mathbb R^{C}$：逐变量的均值与标准差，对每条输入序列单独计算；$x'_i$：归一化后的输入（逐元素运算）
- 归一化后，各输入序列的分布差异被缩小，模型输入分布更稳定

**反归一化模块**：基础模型 $\mathcal H$ 对平稳化输入预测未来 $y'=\mathcal H(x')\in\mathbb R^{O\times C}$（$O$ 是预测长度），再用同一组统计量恢复：

$$
\hat y_i=\sigma_x\odot y'_i+\mu_x
$$

其中：$\hat y_i$ 是最终的预测；$\sigma_x,\mu_x$ 是输入的标准差与均值；$\odot$ 是逐元素乘。这使模型对序列的平移与缩放扰动**等变**。

`[解读]` 论文指出这一设计即使不带可学习的仿射参数也有效（RevIN 带有可学习仿射参数）。

### 2.2 De-stationary Attention（去平稳化注意力）

目标：近似**没有被平稳化**的原始序列上学到的注意力，把被抹掉的非平稳信息找回来。

**分析**：标准自注意力是 $\mathrm{Softmax}(QK^\top/\sqrt{d_k})V$。论文在"嵌入与前馈层近似线性、各变量方差相同"的假设下证明：对平稳化后的输入 $x'$ 计算出的 $Q',K'$，与原始序列对应的 $Q,K$ 有如下关系（论文式 (5) 的思路）：

$$
\mathrm{Softmax}\!\Big(\frac{QK^\top}{\sqrt{d_k}}\Big)=\mathrm{Softmax}\!\Big(\frac{\sigma_x^{2}\,Q'K'^\top+\mathbf 1\,(\mu_Q K^\top)}{\sqrt{d_k}}\Big)
$$

其中：

- $Q,K$：原始（未平稳化）序列对应的查询与键；$Q',K'$：由平稳化序列 $x'$ 得到的查询与键，$d_k$ 是维度
- $\sigma_x^2$：输入的方差（标量），起**缩放**作用；$\mu_Q$：$Q$ 沿时间维的均值，$\mathbf 1$ 是全 1 向量，$\mu_QK^\top$ 起**平移**作用
- 含义：原始注意力 = 对 $Q'K'^\top$ 做方差缩放后再加一项行方向的平移（softmax 对每行加常数不变，因此相关的是随键而变的部分）。右侧需要 $\sigma_x^2$、$\mu_Q$、$K$ 等被平稳化抹掉的信息

**De-stationary Attention**：用两个可学习的"去平稳化因子"来近似这两个量——缩放因子 $\tau>0$ 与平移因子 $\Delta\in\mathbb R^{S\times1}$，并用一个小 MLP 从**原始序列**（保留了非平稳信息）与其统计量中学习：

$$
\log\tau=\mathrm{MLP}(\sigma_x,\,x),\qquad
\Delta=\mathrm{MLP}(\mu_x,\,x)
$$

$$
\mathrm{Attn}(Q',K',V,\tau,\Delta)=\mathrm{Softmax}\!\Big(\frac{\tau\,Q'K'^\top+\mathbf 1\,\Delta^\top}{\sqrt{d_k}}\Big)V
$$

其中：

- $x$：原始（未平稳化）输入序列；$\mu_x,\sigma_x$：其均值与标准差；MLP 的输入包含统计量与原序列，使非平稳信息得以保留
- $\tau$：缩放因子（用 $\log\tau$ 保证为正）；$\Delta$：平移因子；两者**在所有层的 De-stationary Attention 间共享**（论文中作为共享的去平稳化因子，细节 `[待核实]`）
- $Q',K'$：平稳化序列得到的查询与键；$V$：值
- 这样，平稳化后的序列仍能"恢复"出原始非平稳序列上才有的时间依赖

### 2.3 整体流程

下图概括 NST 如何把两个模块套在任意 Transformer 上。

```
原始序列 x ──统计 μ_x, σ_x──► 归一化 x' ──► 基础 Transformer（注意力换成 De-stationary Attention）──► y'
   │                                               ▲
   └──── MLP(σ_x, x), MLP(μ_x, x) → τ, Δ ──────────┘
                                                   │
                                  反归一化  ŷ = σ_x ⊙ y' + μ_x ──► 预测 ŷ
```

图中：

- 主路径：原始序列先归一化得到 $x'$，送入基础 Transformer，输出再反归一化得到预测；
- 旁路：用原始序列的统计量与序列本身，经 MLP 得到 $\tau$、$\Delta$，注入每一层注意力（De-stationary Attention），补回非平稳信息；
- 关键结论：两个模块分别负责"稳定分布"和"找回被抹掉的信息"，二者缺一不可。

## 3. 训练与实验设置

- **数据集**：论文使用 6 个真实基准（ETT 系列、Electricity、Exchange、Traffic、Weather、ILI 等，ETTm1/ETTh1/ETTh2 的补充结果见附录）；输入长度 ILI 为 36，其余为 96，预测长度 $O\in\{96,192,336,720\}$（ILI 为 $\{24,36,48,60\}$）。
- **基础模型**：把框架套在 Transformer、Informer、Reformer、Autoformer 等主流 Transformer 上（论文也给出其他对照的基线，如 Pyraformer、LogTrans、LSTNet）。
- **超参**：训练设置与基础模型一致，具体取值见论文附录，本文未逐项核对 `[待核实]`。

## 4. 实验与结论

- **通用性**：论文称该框架在所有基准与预测长度上都稳定提升主流 Transformer，使平均 MSE 分别降低 49.43%（Transformer）、47.34%（Informer）、46.89%（Reformer），并因此使它们达到 SOTA；
- **高非平稳数据集上优势更明显**：预测长度 336 时，Exchange 上 MSE 降低 17%（0.509→0.421），ILI 上降低 25%（2.669→2.010）；
- **定性分析**：论文比较"原始 Transformer"、"Transformer + 仅 Series Stationarization"与完整 NST 三者在 ETTm2 上的预测：Series Stationarization 主要使各序列输入的统计性质对齐，有助于预测值的整体水平；De-stationary Attention 则让模型重新捕捉与非平稳性相关的时间依赖；两个模块从不同角度提升了非平稳预测能力；
- **消融**：论文还在多种基础模型上验证两个模块各自的作用，具体表格数字见论文，本文不转引。

## 5. 优缺点与局限

论文自述的优点：通用（可套在各类 Transformer 上）、改动小（只替换注意力并加一层包装）、对非平稳数据集提升显著。

`[解读]` / `[经验]`：

- 推导依赖"嵌入与前馈层近似线性、各变量方差相同"等简化假设，实际网络是非线性的，因此 De-stationary Attention 是**近似**而非等价；
- 平稳化统计量按每条输入窗口计算，窗口过短时均值、方差估计不稳；
- 论文在 2022 年发表，实验里的基础模型以 Transformer 系为主；后续的线性/MLP 模型也常使用类似的"均值方差归一化 + 反归一化"，但未必需要 De-stationary Attention（因为没有注意力）；
- 官方代码在 `thuml/Nonstationary_Transformers`，TimesNet 所在的 Time-Series-Library 也提供了 `NonstationaryTransformer` 模型。

## 6. 与相关方法对比

方法 | 对非平稳性的处理 | 是否补回被抹掉的信息 | 适用范围
-- | -- | -- | --
NST | 平稳化包装器 + De-stationary Attention | 是（$\tau,\Delta$） | 套在任意 Transformer 上
RevIN | 输入归一化 + 输出反归一化（带可学习仿射参数） | 否 | 通用，与模型无关
Adaptive Norm 等 | 输入端归一化 | 否 | 通用
ARIMA（差分） | 差分使序列平稳 | 否 | 经典统计模型，见 [ARIMA](/0624_ML_Tasks_TimeSeries_Classical_ARIMA)

表中：「对非平稳性的处理」说明各方法的做法，「是否补回被抹掉的信息」指是否把归一化丢弃的均值方差信息重新注入模型，「适用范围」说明方法使用场景。NST 的独特之处是在注意力内部补回非平稳信息。

## 7. 使用方式

官方代码为论文摘要给出的仓库 `thuml/Nonstationary_Transformers`。下面是 Series Stationarization 与 De-stationary Attention 核心的示意代码（未运行验证，省略多头与 MLP 的细节）：

```python
import torch, torch.nn as nn

def stationarize(x, eps=1e-5):                  # x: [B, S, C]
    mu = x.mean(1, keepdim=True)
    sigma = torch.sqrt(x.var(1, keepdim=True, unbiased=False) + eps)
    return (x - mu) / sigma, mu, sigma

def destationarize(y, mu, sigma):               # y: [B, O, C]
    return y * sigma + mu

class DeStationaryAttn(nn.Module):
    def forward(self, q, k, v, tau, delta):     # q,k,v: [B, S, d]; tau: [B,1,1]; delta: [B,1,S]
        d = q.shape[-1]
        scores = (tau * (q @ k.transpose(-1, -2)) + delta) / d ** 0.5
        return torch.softmax(scores, dim=-1) @ v
```

使用要点 `[经验]`：若基础模型已经用了 RevIN，可先评估是否还需要 De-stationary Attention；对非平稳性强的数据（汇率、流感等）收益更明显。

## Reference

- Yong Liu, Haixu Wu, Jianmin Wang, Mingsheng Long. *Non-stationary Transformers: Exploring the Stationarity in Time Series Forecasting*. NeurIPS 2022. [arXiv:2205.14415](https://arxiv.org/abs/2205.14415)
- 官方代码（论文摘要给出）：https://github.com/thuml/Nonstationary_Transformers
- 站内：[时间序列总览](/0603_ML_Tasks_TimeSeries)、[深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)、[Informer](/0635_ML_Tasks_TimeSeries_Deep_Informer)

