-----

| Title     | ML Tasks TimeSeries Deep TiDE                         |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-20T09:03:10Z`                                |
| Updated @ | `2026-11-20T09:03:10Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/671) |

-----

# TiDE

TiDE（Time-series Dense Encoder）出自 Google Research 的论文 *Long-term
Forecasting with TiDE: Time-series Dense Encoder*（Abhimanyu Das、Weihao
Kong、Andrew Leach、Shaan Mathur、Rajat Sen、Rose
Yu，arXiv:2304.08424，TMLR）。它是一个**基于 MLP 的编码器-解码器**长期预测模型。动机来自
DLinear：简单的线性模型在长期预测基准上可以胜过很多
Transformer，但线性模型无法刻画**非线性依赖**，也无法利用**协变量**（DLinear
论文甚至指出加时间协变量会损害性能）。TiDE 想要"线性模型的简洁与速度，同时能处理协变量和非线性"。

**一句话概括：先把每个时间步的动态协变量投影到低维，再把回看序列、协变量和静态属性一起送入稠密 MLP
编码器得到编码；稠密解码器为每个预测步产出一个向量，最后用"时序解码器"把该向量与该步未来协变量结合得到预测，并加一条从回看到预测的全局线性残差。**

> 标注约定：未标注的内容来自论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：同样走 MLP 路线的
[DLinear](/0630_ML_Tasks_TimeSeries_Deep_DLinear)、[TSMixer](/0632_ML_Tasks_TimeSeries_Deep_TSMixer)、[N-HiTS](/0629_ML_Tasks_TimeSeries_Deep_NHiTS)；支持协变量的
[TFT](/0634_ML_Tasks_TimeSeries_Deep_TFT)、[DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR)；总览见
[深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)。

## 1\. 解决什么问题

  - 线性模型简单、快速，在若干基准上优于 Transformer，但**不能处理非线性依赖**，也**不能利用协变量**；
  - Transformer 能处理协变量，但开销大（注意力对回看长度是二次复杂度）；
  - 现实预测任务（零售需求等）常有**静态属性**（商品类别）和**动态协变量**（促销、节假日，且未来已知），需要模型直接利用。

论文还给出理论支撑：在若干假设下，TiDE 的**最简线性类比**对线性动力系统（LDS）能达到近似最优的误差率；经验上，TiDE
在流行的长期预测基准上持平或优于已有方法，同时比最好的 Transformer 模型快 5–10 倍。

## 2\. 问题设定

数据集中有 $N$ 条时间序列。第 $i$ 条序列的回看窗口为 $y^{(i)}*{1:L}$，预测区间为
$y^{(i)}*{L+1:L+H}$。每条序列可能有：

  - **动态协变量** $x^{(i)}\_t\\in\\mathbb R^{r}$：在整个 $1{:}L{+}H$
    范围内已知，如星期几、节假日，或某商品某天的折扣；
  - **静态属性** $a^{(i)}$：不随时间变化，如商品的类别特征。

预测器就是把历史、协变量和静态属性映射到未来：

$$ \\hat
y^{(i)}*{L+1:L+H}=f\\big(y^{(i)}*{1:L},,x^{(i)}\_{1:L+H},,a^{(i)}\\big)
$$

其中：$L$ 是回看长度，$H$ 是预测长度，$f$ 是模型。训练时用 MSE：

$$ \\mathrm{MSE}=\\frac{1}{NH}\\sum\_{i=1}^{N}\\big\\lVert
y^{(i)}*{L+1:L+H}-\\hat y^{(i)}*{L+1:L+H}\\big\\rVert\_2^2 $$

其中：$N$ 是序列条数，$H$ 是预测步数，$\\hat y$ 是预测。TiDE
采用**通道独立**方式：一次只输入一条序列的历史与协变量，不同序列共享同一组权重（全局模型）。

## 3\. 模型结构

### 3.1 残差块（Residual Block）

TiDE 的基本积木是一个带线性跳连的 MLP 残差块：一个隐层（ReLU 激活），输出端加 dropout（作用于隐层到输出的线性层）和
LayerNorm，跳连是**纯线性**映射。

### 3.2 整体流程

下图概括 TiDE 的编码、解码与全局残差。

    动态协变量 x_t (每个时间步)
       │ 特征投影（残差块）：r → r̃ （r̃ ≪ r）
       ▼
     x̃_{1:L+H}（降维后的协变量）
       │ 展平 ⊕ 静态属性 a ⊕ 回看序列 y_{1:L}
       ▼
     稠密编码器（n_e 个残差块）  → 编码 e
       │
       ▼
     稠密解码器（n_d 个残差块）  → 向量 g ∈ R^{H·p} → reshape → D ∈ R^{p×H}（每个预测步一个 p 维向量 d_t）
       │
       ▼
     时序解码器（残差块，输出 1 维）：  ŷ_{L+t} = TemporalDecoder([d_t ; x̃_{L+t}])
       │
       ▼  + 全局线性残差（回看 → 预测长度 H）
     预测 ŷ_{L+1:L+H}

图中：

  - 上方是特征投影：对每个时间步（回看与预测区间）的协变量用残差块降维。直接展平会得到 $(L+H)r$ 维输入，可能过大；降维后只有
    $(L+H)\\tilde r$。
  - 中间是编码解码：把回看序列、降维协变量与静态属性拼接，经稠密编码器得到编码 $e$；稠密解码器把 $e$ 映射为 $H\\cdot p$
    维向量并重排成每个预测步一个向量。
  - 底部是时序解码器与全局残差：每个预测步的向量与该步的（降维）未来协变量一起经一个残差块产出该步预测，形成从未来协变量到预测的"高速公路"；全局线性残差把回看序列线性映射到长度
    $H$ 并加到预测上，保证纯线性模型（如 DLinear）是 TiDE 的子类。

### 3.3 编码

**特征投影**：对每个时间步的动态协变量用残差块降到 $\\tilde r\\ (\\ll r)$ 维（超参 temporalWidth）：

$$ \\tilde
x\_t^{(i)}=\\mathrm{ResidualBlock}\\big(x\_t^{(i)}\\big),\\qquad
t\\in\[1,L+H\] $$

其中：$x\_t^{(i)}\\in\\mathbb R^{r}$ 是原始协变量，$\\tilde x\_t^{(i)}\\in\\mathbb
R^{\\tilde r}$ 是降维后的协变量。

**稠密编码器**：把所有回看与预测区间的降维协变量展平，与静态属性和回看序列拼接，经 $n\_e$ 个残差块（隐层大小均为
hiddenSize）得到编码：

$$ e^{(i)}=\\mathrm{Encoder}\\big(\\big\[y^{(i)}*{1:L};\\ \\tilde
x^{(i)}*{1:L+H};\\ a^{(i)}\\big\]\\big) $$

其中：$\[\\cdot;\\cdot\]$ 表示拼接；$e^{(i)}$ 是该序列的稠密编码。

### 3.4 解码

**稠密解码器**：$n\_d$ 个残差块把编码映射为 $H\\cdot p$ 维向量（$p$ 为
decoderOutputDim），重排为矩阵，第 $t$ 列 $d\_t^{(i)}$ 是第 $t$
个预测步的解码向量：

$$ g^{(i)}=\\mathrm{Decoder}\\big(e^{(i)}\\big),\\qquad
D^{(i)}=\\mathrm{Reshape}\\big(g^{(i)}\\big)\\in\\mathbb R^{p\\times H}
$$

**时序解码器**：一个输出维度为 1 的残差块，把第 $t$ 步的解码向量与该步的降维协变量拼接得到预测：

$$ \\hat
y^{(i)}*{L+t}=\\mathrm{TemporalDecoder}\\big(\\big\[d\_t^{(i)};\\
\\tilde x^{(i)}*{L+t}\\big\]\\big),\\qquad t\\in\[H\] $$

其中：$d\_t^{(i)}$ 是第 $t$ 步解码向量，$\\tilde x^{(i)}\_{L+t}$
是该步未来协变量的降维表示。论文举例：零售预测中母亲节会直接影响某些礼品销量，没有这条"高速公路"，这类信号可能丢失或需要更久才能学到。

**全局残差**：把回看 $y\_{1:L}$ 线性映射成长度为 $H$ 的向量并加到预测上，使纯线性模型始终是 TiDE 的特例。

## 4\. 训练与评估

  - **训练**：小批量梯度下降，每个 batch 含 batchSize 条序列及其回看/预测窗口；MSE 损失；每个 epoch
    遍历训练期内所有可构造的（回看, 预测）对，因此相邻 batch 可以有重叠时间点（与长期预测领域的惯例一致）；
  - **评估**：在测试集上对所有可构造的（回看, 预测）对做滚动评估；验证集可用来选择超参；
  - **超参**：hiddenSize、$n\_e$（numEncoderLayers）、$n\_d$（numDecoderLayers）、decoderOutputDim
    $p$、temporalWidth $\\tilde r$、temporalDecoderHidden
    等，具体搜索范围见论文附录，本文未逐项核对 `[待核实]`。

## 5\. 实验与结论

### 5.1 长期预测基准

  - **数据集**：Weather、Traffic、Electricity 与 4 个 ETT
    数据集（ETTh1、ETTh2、ETTm1、ETTm2）共 7 个；
  - **论文结论**：TiDE 以较大优势优于除 PatchTST 之外的所有对比方法；对 PatchTST，TiDE 在除 Weather
    之外的所有数据集上更好或相当。具体表格数字见论文 Table 2，本文不转引。

### 5.2 需求预测（M5）

用 M5 竞赛数据检验处理静态属性与复杂动态协变量的能力：超过 3 万条序列，静态属性包括层级类别，动态协变量包括促销等。指标是竞赛的
WRMSSE，对比 DeepAR（能使用所有协变量）与 PatchTST（实现不支持协变量）。论文结论：PatchTST
因不能用协变量而表现差；TiDE 使用全部协变量时比同样使用全部协变量的 DeepAR 好多达
20%。

### 5.3 训练与推理效率

论文比较 TiDE 与 PatchTST 的复杂度：TiDE 编码器的推理复杂度约为 $\\tilde O(n\_e
h^2+hL)$（$n\_e$ 为编码器层数，$h$ 为隐层大小，$L$ 为回看长度），对回看长度**线性**；PatchTST 编码器约为
$\\tilde O(K,n\_a L^2/P^2)$（$K$ 为键维度，$n\_a$ 为注意力层数，$P$ 为 patch
大小），对回看长度**二次**。在 Electricity 数据集上，回看长度从 192 增加到 2880
时，TiDE 的单 batch 推理时间比 PatchTST 低一个数量级，训练时间的差距更大；PatchTST 在回看
$L\\ge1440$ 时显存不足。

### 5.4 消融

表格概括论文的几组分析：

| 分析项   | 做法                                    | 论文观察                                                     |
| ----- | ------------------------------------- | -------------------------------------------------------- |
| 时序解码器 | 在带事件协变量的半合成 Electricity 数据上对比有/无时序解码器 | 有时序解码器时在事件发生时段预测更准，并且事件结束后恢复更快；去掉后模型在事件之后容易被"带偏"         |
| 回看长度  | 在 Traffic 上逐步增大回看窗口                   | 预测精度随回看窗口增大而变好，与 FEDformer、Informer 在 DLinear 论文中显示的趋势相反 |
| 残差连接  | 去掉所有残差（含块内残差与全局线性残差）                  | 在预测长度 96–336 上性能出现有统计显著的下降                               |

表中：「分析项」是被考察的设计，「做法」说明实验设置，「论文观察」是对应结论。核心结论：时序解码器有助于利用未来协变量，更长的回看能被有效利用，残差连接有帮助。

## 6\. 优缺点与局限

论文自述的优点：简单、快速、可处理协变量与非线性；有线性情形下的理论保证；对回看长度线性扩展。

`[解读]` / `[经验]`：

  - 通道独立使不同序列之间不共享信息（仅共享权重），不显式建模变量相关；
  - 特征投影与协变量使用要求未来协变量已知；协变量缺失或不可靠时优势减弱；
  - 论文主要针对点预测（MSE）；TiDE 的官方/社区实现还提供概率预测扩展，细节论文外 `[待核实]`；
  - 在 Weather 数据集上论文自己指出不如 PatchTST。

## 7\. 与相关方法对比

| 方法       | 骨干             | 协变量          | 复杂度（对回看长度） | 备注               |
| -------- | -------------- | ------------ | ---------- | ---------------- |
| TiDE     | MLP 残差块编码器-解码器 | 动态 + 静态      | 线性         | 含全局线性残差，线性模型是其子类 |
| DLinear  | 线性层            | 不用（加协变量反而变差） | 线性         | TiDE 的出发点        |
| PatchTST | Transformer    | 不支持          | 二次         | 论文主要对手           |
| DeepAR   | RNN            | 支持           | 逐步递推       | M5 上对比           |
| TFT      | LSTM + 注意力     | 支持           | 随注意力       | 本站另有文章           |

表中：「骨干」是核心网络，「协变量」说明是否支持动态与静态协变量，「复杂度」是对回看长度的量级，「备注」给出特点。TiDE 的特点是用 MLP
同时拿到协变量支持与线性扩展。

## 8\. 使用方式

官方实现之一在 Google Research 的代码库，社区实现见 Darts 的 `TiDEModel`、GluonTS 等
`[待核实]`。下面是残差块与整体前向的示意代码（未运行验证，超参为占位值）：

``` python
import torch, torch.nn as nn

class ResBlock(nn.Module):
    def __init__(self, d_in, d_hidden, d_out, dropout=0.1):
        super().__init__()
        self.mlp = nn.Sequential(nn.Linear(d_in, d_hidden), nn.ReLU(),
                                 nn.Linear(d_hidden, d_out), nn.Dropout(dropout))
        self.skip = nn.Linear(d_in, d_out)      # 完全线性的跳连
        self.norm = nn.LayerNorm(d_out)
    def forward(self, x):
        return self.norm(self.mlp(x) + self.skip(x))

class TiDESketch(nn.Module):
    def __init__(self, L, H, r, a_dim, r_proj=4, hid=256, p=4, ne=2, nd=2):
        super().__init__()
        self.proj = ResBlock(r, hid, r_proj)
        d_in = L + (L + H) * r_proj + a_dim
        self.enc = nn.Sequential(*[ResBlock(d_in if i == 0 else hid, hid, hid) for i in range(ne)])
        self.dec = nn.Sequential(*[ResBlock(hid, hid, hid if i < nd - 1 else H * p) for i in range(nd)])
        self.temporal = ResBlock(p + r_proj, hid, 1)
        self.skip = nn.Linear(L, H)
        self.H, self.p = H, p

    def forward(self, y, x, a):           # y:[B,L]; x:[B,L+H,r]; a:[B,a_dim]
        xt = self.proj(x)                                           # [B,L+H,r_proj]
        e = self.enc(torch.cat([y, xt.flatten(1), a], dim=-1))
        d = self.dec(e).view(-1, self.H, self.p)                    # [B,H,p]
        out = self.temporal(torch.cat([d, xt[:, -self.H:]], dim=-1)).squeeze(-1)
        return out + self.skip(y)
```

使用要点 `[经验]`：先确认未来协变量是否真的"未来已知"；回看长度可以比 Transformer 类模型取得更长，因为复杂度线性；与
DLinear 比较时可以验证全局线性残差带来的下限。

## Reference

  - Abhimanyu Das, Weihao Kong, Andrew Leach, Shaan Mathur, Rajat Sen,
    Rose Yu. *Long-term Forecasting with TiDE: Time-series Dense
    Encoder*. [arXiv:2304.08424](https://arxiv.org/abs/2304.08424)
  - 站内：[深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)、[DLinear](/0630_ML_Tasks_TimeSeries_Deep_DLinear)、[TSMixer](/0632_ML_Tasks_TimeSeries_Deep_TSMixer)、[TFT](/0634_ML_Tasks_TimeSeries_Deep_TFT)
