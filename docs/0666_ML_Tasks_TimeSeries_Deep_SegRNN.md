---
Title | ML Tasks TimeSeries Deep SegRNN
-- | --
Created @ | `2026-11-20T08:58:07Z`
Updated @| `2026-11-20T08:58:07Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/666)

---
# SegRNN

SegRNN（Segment Recurrent Neural Network）出自论文 *SegRNN: Segment Recurrent Neural Network for Long-Term Time Series Forecasting*（Shengsheng Lin、Weiwei Lin 等，华南理工大学 / 鹏城实验室，arXiv:2308.11200，2023 年 8 月）。它要回答的问题是：**在 Transformer、MLP、CNN 占据长期预测（LTSF）主流的今天，RNN 是不是已经不行了？** 论文的判断是：RNN 的瓶颈在于回看窗口与预测长度太长导致**循环迭代次数过多**，只要把迭代次数压下来，RNN 仍然很强。

**一句话概括：把编码端的"逐点迭代"换成"逐段（segment）迭代"，把解码端的"递归预测"换成"并行多步预测（PMF）"，单层 GRU 就能在长期预测上追平甚至超过 PatchTST 等模型，同时训练更省。**

> 标注约定：未标注的内容来自论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能从论文确认的内容。本文不引用论文之外的数字。

本站相关：总览见 [时间序列总览](/0603_ML_Tasks_TimeSeries) 与 [深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)；与 RNN 相关的 [DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR)、同样走"patch / 分段"思路的 [PatchTST](/0638_ML_Tasks_TimeSeries_Deep_PatchTST)。

## 1. 解决什么问题

论文的论证链条：

- RNN 曾是时序预测的首选，但在 LTSF 中（回看窗口、预测长度可达数百到上千）被认为难以捕捉长依赖，逐渐被 Transformer、MLP、CNN 取代；
- 论文把根本原因归结为：**需要的循环迭代次数太多**，梯度消失/爆炸与误差累积都随迭代次数变严重；
- 因此提出一个朴素的策略：**尽量减少循环迭代次数，同时尽量保留序列信息**。

具体做法有两条：

策略 | 作用位置 | 迭代次数的变化
-- | -- | --
Segment-wise Iterations（逐段迭代） | 编码阶段 | 由 $L$ 次降为 $L/w$ 次
Parallel Multi-step Forecasting（PMF，并行多步预测） | 解码阶段 | 由 $H/w$ 次降为 1 次

表中：$L$ 是回看窗口长度，$H$ 是预测长度，$w$ 是段长度（segment length）。两条策略叠加后，RNN 的有效迭代次数只与分段数 $n=L/w$ 有关，解码阶段不再递归。

## 2. 问题设定与通道独立

给定历史多变量序列 $X\in\mathbb R^{L\times C}$，预测未来 $Y\in\mathbb R^{H\times C}$，其中 $C$ 是变量（通道）数。论文沿用**通道独立（Channel Independent, CI）**策略：每个通道单独作为一条单变量序列 $X^{(i)}\in\mathbb R^{L}$ 输入同一个模型，输出 $\hat Y^{(i)}\in\mathbb R^{H}$，所有通道共享参数。为弥补 CI 无法利用变量间关系的缺点，解码阶段额外加入了**通道位置编码**（见 §3.3）。

RNN 部分以 GRU 为例（论文称 SegRNN 不限定具体 RNN 类型，但 GRU 表现稳定）：

$$
\begin{aligned}
z_t&=\sigma(W_z[h_{t-1},x_t]),\qquad r_t=\sigma(W_r[h_{t-1},x_t]),\\
\tilde h_t&=\tanh(W[r_t\odot h_{t-1},x_t]),\qquad h_t=(1-z_t)\odot h_{t-1}+z_t\odot\tilde h_t
\end{aligned}
$$

其中：

- $x_t$：第 $t$ 步输入，$h_t$：第 $t$ 步隐状态，$[\cdot,\cdot]$ 表示拼接
- $z_t$：更新门，决定新旧状态的混合比例；$r_t$：重置门，决定参与候选状态计算的旧状态比例
- $\tilde h_t$：候选隐状态；$W_z,W_r,W$：可学习权重；$\sigma$：sigmoid，$\odot$：逐元素乘

## 3. 模型结构

### 3.1 整体流程

下图概括 SegRNN 的编码（逐段迭代）与解码（并行预测）两个阶段。

```
输入通道序列 X^(i) ∈ R^L
   │ 减去最后一个值（实例归一化）
   ▼
切成 n=L/w 个段 (n × w) ──Linear(w→d)+ReLU──► (n × d)
   │
   ▼  GRU 逐段迭代 n 次
 隐状态 h_n（概括了整条输入序列）
   │ 复制 m=H/w 份，各自拼上位置嵌入 PE（相对位置 ⊕ 通道位置）
   ▼  同一个 GRU 并行处理 m 个输入（一次）
 m 个输出向量 (m × d) ──Dropout──Linear(d→w)──► (m × w) ──reshape──► Ŷ^(i) ∈ R^H
   │ 加回最后一个值
   ▼
 预测
```

图中：

- 上半部分是编码阶段：输入先做"减去最后一个值"的归一化，再切成长度 $w$ 的段，经线性层与 ReLU 映射为 $d$ 维向量（$d$ 为 GRU 隐层维度），然后喂入 GRU，**只迭代 $n=L/w$ 次**。
- 下半部分是解码阶段：编码得到的最终隐状态 $h_n$ 被复制 $m=H/w$ 份，各自与一个位置嵌入拼接，**同一个 GRU 在一次并行计算里处理这 $m$ 个输入**；输出再经 Dropout 与线性层还原为 $m\times w$，展平得到长度 $H$ 的预测。
- 关键结论：编码和解码的迭代次数都显著减少，且解码不再依赖上一步结果，因此既减少误差累积又利于并行。

### 3.2 编码：分段与递归

把通道序列切成 $n=L/w$ 段，每段长度 $w$：

$$
X_w^{(i)}\in\mathbb R^{n\times w}\ \xrightarrow{\ W_{prj}\in\mathbb R^{w\times d},\ \mathrm{ReLU}\ }\ X_d^{(i)}\in\mathbb R^{n\times d}
$$

其中：

- $X_w^{(i)}$：第 $i$ 个通道切段后的矩阵，每行是一段（$w$ 个连续时间点）
- $W_{prj}$：可学习线性投影，把每段映射到 GRU 的隐层维度 $d$
- $X_d^{(i)}$：投影后的"段 token"序列，$n$ 个向量依次送入 GRU，迭代 $n$ 次后得到的 $h_n$ 概括整条输入序列

`[解读]` 这与 PatchTST 的 patch 思路相似，区别在于 patch 后接的是 RNN 而非注意力；论文也说明 patch 技术启发了逐段迭代。

### 3.3 解码：并行多步预测（PMF）

传统的递归多步预测（RMF）把上一步预测当作下一步输入，有两个问题：误差逐步累积；顺序依赖使样本内无法并行。PMF 的做法：

1. 把预测区间也按长度 $w$ 切成 $m=H/w$ 段；
2. 为每一段生成位置嵌入 $PE^{(i)}\in\mathbb R^{m\times d}$，每个嵌入由**相对位置编码**（该段在预测序列中的位置，维度 $d/2$）和**通道位置编码**（当前通道在多通道序列中的下标，维度 $d/2$）拼接而成；
3. 将 $h_n$ 复制 $m$ 份并与位置嵌入组合，同一个 GRU 一次并行产出 $m$ 个 $d$ 维向量，再经 Dropout 与线性层 $W_{prd}\in\mathbb R^{d\times w}$ 得到 $m\times w$，展平为 $\hat Y^{(i)}\in\mathbb R^{H}$。

其中通道位置编码让模型在共享参数的 CI 设定下仍能区分不同通道，论文称它在一定程度上弥补了 CI 无法刻画变量关系的缺点。

### 3.4 归一化与损失

沿用 DLinear 的简单实例归一化：编码前减去输入的最后一个值 $x_L^{(i)}$，解码后再加回：

$$
x^{(i)}_{1:L}\leftarrow x^{(i)}_{1:L}-x^{(i)}_L,\qquad \hat y^{(i)}\leftarrow\hat y^{(i)}+x^{(i)}_L
$$

其中 $x^{(i)}_L$ 是第 $i$ 个通道输入窗口的最后一个值；这样模型主要学习相对最近水平的变化，缓解分布漂移。

损失函数为 MAE：

$$
\mathcal L(Y,\hat Y)=\frac1{HC}\sum_{t=1}^{H}\sum_{i=1}^{C}\left|\hat y^{(i)}_t-y^{(i)}_t\right|
$$

其中：$H$ 是预测长度，$C$ 是通道数，$\hat y_t^{(i)}$ 与 $y_t^{(i)}$ 分别是第 $i$ 个通道第 $t$ 步的预测与真值。

## 4. 训练设置

- **统一配置**：回看窗口 720，段长度 48，单层 GRU，隐层维度 512，训练 30 个 epoch，前 3 个 epoch 后学习率按 0.8 衰减，早停耐心 10；Dropout、batch size、学习率随数据规模调整。
- **硬件**：PyTorch，两块 16GB 的 NVIDIA T4。
- **数据集**：ETTh1、ETTh2、ETTm1、ETTm2、Electricity、Traffic、Weather（共 7 个）。
- **基线**：Transformer 类（PatchTST、FEDformer、Informer），MLP 类（TiDE、DLinear），CNN 类（MICN、TimesNet），RNN 类（DeepAR、GRU）。
- **指标**：MSE 与 MAE，SegRNN 的结果为 5 次运行平均。

## 5. 实验与结论

以下结论来自论文正文文字（表格数字较多，这里只摘论文自己给出的概括）。

### 5.1 主结果

- 在 56 个指标（7 个数据集 × 4 个预测长度 × 2 个指标）中，SegRNN 在 50 个取得前二，其中 45 个第一；
- 在 ETT 与 Weather 上几乎在所有指标上超过当时的 SOTA；
- 在通道数多的 Electricity（300+ 通道）和 Traffic（800+ 通道）上略有下降，论文归因于单层 GRU 容量较小，但仍有竞争力；
- 相对 GRU 与 DeepAR 两个 RNN 基线，MSE 分别改善 75% 与 80%。

### 5.2 消融与分析

下表概括论文的几组分析实验（均在 ETTm1 上）：

分析项 | 对比 | 论文观察
-- | -- | --
逐段 vs 逐点迭代 | 段长度从 1（逐点）逐渐增大 | 段越长预测误差越小、推理越快；但段长度等于回看长度时退化为 MLP，误差反而上升
PMF vs RMF | 并行多步 vs 递归多步 | PMF 误差显著更低且更稳定，预测越长优势越大；$H<192$ 时 PMF 略慢（数据复制开销），$H>192$ 时更快
回看长度 | 逐步增大 | 误差随回看长度增大而持续下降，较短回看下也稳健
RNN 变体 | RNN / LSTM / GRU | GRU 的误差更低更稳定，因此默认用 GRU

表中：「分析项」是被考察的设计，「对比」说明比较方式，「论文观察」是对应结论。核心结论是：段越大（迭代越少）越好，PMF 优于 RMF，GRU 最稳。

### 5.3 与 PatchTST 的效率对比

在 ETTm1（回看 720、预测 192，单块 T4）上，相对 PatchTST，SegRNN 平均训练时间减少超过 78%，平均最大 GPU 显存减少超过 82%。

## 6. 优缺点与局限

论文自述的优点：迭代次数少、误差累积少、速度与显存开销小；保留 RNN 的状态传递结构；对回看窗口长度稳健。

`[解读]` / `[经验]`：

- 论文自己提到在 Electricity、Traffic 这类通道很多的数据集上略有下降，原因可能是单层 GRU 容量小；
- 段长度 $w$ 是关键超参：太小退化为逐点迭代，太大退化为 MLP，需要在 $L$ 与 $H$ 的整除关系下选择（$L/w$、$H/w$ 要为整数，具体处理细节论文正文未展开 `[待核实]`）；
- 本文引用的是 arXiv v1 版本，当时源码"即将发布"，具体复现细节以官方仓库为准 `[待核实]`；
- 论文只做点预测，不含概率预测。

## 7. 与相关方法对比

方法 | 骨干 | 序列处理单位 | 解码方式 | 备注
-- | -- | -- | -- | --
SegRNN | 单层 GRU | 段（segment） | 并行多步（PMF） | 迭代次数 $L/w$ 与 1
GRU / DeepAR | RNN | 单点 | 递归 | 迭代次数随 $L$、$H$ 增长，LTSF 上表现差
PatchTST | Transformer | patch | 一次线性映射输出 | 同样用分段思想，但用注意力
DLinear | 线性层 | 整条序列 | 一次线性映射 | 论文沿用其归一化方式

表中：「骨干」是核心网络，「序列处理单位」是输入被切分的粒度，「解码方式」说明如何生成多步预测。SegRNN 的特点是把 patch 思想嫁接到 RNN 上，并用 PMF 摆脱递归解码。

## 8. 使用方式

示意代码，未运行验证；只表达分段编码与并行解码的核心逻辑，超参为占位值：

```python
import torch, torch.nn as nn

class SegRNNSketch(nn.Module):
    def __init__(self, L=720, H=192, w=48, d=512, C=7, dropout=0.5):
        super().__init__()
        self.n, self.m, self.w, self.d = L // w, H // w, w, d
        self.proj = nn.Sequential(nn.Linear(w, d), nn.ReLU())
        self.gru = nn.GRU(d, d, batch_first=True)
        self.rel = nn.Parameter(torch.randn(self.m, d // 2))     # 相对位置编码
        self.chn = nn.Parameter(torch.randn(C, d // 2))          # 通道位置编码
        self.out = nn.Sequential(nn.Dropout(dropout), nn.Linear(d, w))

    def forward(self, x):                                        # x: [B, L, C]
        B, L, C = x.shape
        last = x[:, -1:, :]
        x = (x - last).permute(0, 2, 1).reshape(B * C, self.n, self.w)
        _, h = self.gru(self.proj(x))                            # h: [1, B*C, d]
        ch = self.chn.repeat(B, 1)                               # [B*C, d/2]
        pe = torch.cat([self.rel.unsqueeze(0).expand(B * C, -1, -1),
                        ch.unsqueeze(1).expand(-1, self.m, -1)], dim=-1)
        y, _ = self.gru(pe, h)                                   # 示意：以 h_n 为初始状态并行处理 m 个位置嵌入
        y = self.out(y).reshape(B, C, -1).permute(0, 2, 1)       # [B, H, C]
        return y + last
```

注意：上面是依据论文描述写的最小示意，解码阶段"把 $h_n$ 复制 $m$ 份并与位置嵌入组合后并行过 GRU"的具体张量处理以官方实现为准 `[待核实]`。

## Reference

- Shengsheng Lin, Weiwei Lin, Wentai Wu, Feiyu Zhao, Ruichao Mo, Haotong Zhang. *SegRNN: Segment Recurrent Neural Network for Long-Term Time Series Forecasting*. [arXiv:2308.11200](https://arxiv.org/abs/2308.11200)
- 站内：[时间序列总览](/0603_ML_Tasks_TimeSeries)、[深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)、[PatchTST](/0638_ML_Tasks_TimeSeries_Deep_PatchTST)、[DLinear](/0630_ML_Tasks_TimeSeries_Deep_DLinear)

