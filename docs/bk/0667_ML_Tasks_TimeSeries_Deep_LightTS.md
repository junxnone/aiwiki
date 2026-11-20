-----

| Title     | ML Tasks TimeSeries Deep LightTS                      |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-20T08:59:01Z`                                |
| Updated @ | `2026-11-20T08:59:01Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/667) |

-----

# LightTS

LightTS 出自论文 *Less Is More: Fast Multivariate Time Series Forecasting
with Light Sampling-oriented MLP Structures*（Tianping Zhang、Yizhuo
Zhang、Wei Cao、Jiang Bian、Xiaohan Yi、Shun Zheng、Jian Li，清华大学 /
微软亚洲研究院，arXiv:2207.01186，2022 年 7 月）。它是一个**只用 MLP**
的多变量时间序列预测模型，核心想法是：时间序列下采样后通常仍保留大部分信息，因此可以先把长序列用两种巧妙的下采样拆成短序列，再用简单的
MLP 处理，从而在精度不输复杂模型的同时大幅降低计算量。

**一句话概括：用"连续采样"抓局部短期模式、"间隔采样"抓全局长期模式，再用 IEBlock（信息交换块）在时间维与通道维做 MLP
混合，最后在变量维上做一次相关性融合得到预测。**

> 标注约定：未标注的内容来自论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：总览见 [时间序列总览](/0603_ML_Tasks_TimeSeries) 与
[深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)；同属 MLP 路线的
[DLinear](/0630_ML_Tasks_TimeSeries_Deep_DLinear)、[TSMixer](/0632_ML_Tasks_TimeSeries_Deep_TSMixer)、[TimeMixer](/0633_ML_Tasks_TimeSeries_Deep_TimeMixer)。

## 1\. 解决什么问题

论文的出发点有两点：

1.  **效率**：很多多变量预测方法基于
    RNN、GNN、Transformer，结构复杂、计算昂贵，在大规模真实数据集上训练与推理效率成为瓶颈；
2.  **时序特性**：时间序列有一个重要性质——**下采样往往保留了大部分信息**（相比文本、音频更是如此），但朴素的均匀下采样会丢信息。

论文要解决的两个核心挑战：

  - 同时捕捉**短期局部模式**与**长期全局模式**；
  - 捕捉**不同变量之间的相关性**。

对应地，LightTS
分成两部分：第一部分把各变量**独立**处理（解决第一个挑战），第二部分把各变量的特征拼接后学习变量间相关性（解决第二个挑战）。

## 2\. 问题设定

在时刻 $t$，给定长度为 $T$ 的回看窗口 $X={x\_{t-T+1},\\dots,x\_t}$，其中每个
$x\_i\\in\\mathbb R^{N}$，$N$ 是变量（时间序列）个数；预测水平为
$L$，任务是预测未来多个时间点（多步预测）或某个时间点
$x\_{t+L}$（单步预测）。

## 3\. 核心思想与结构

### 3.1 连续采样与间隔采样

论文设计了两种互补的采样，把一条长度 $T$ 的序列变成若干条互不重叠的子序列，**不丢弃任何点**：

  - **连续采样（continuous sampling）**：每次连续取 $C$ 个点作为一条子序列，共得到 $T/C$ 条；
  - **间隔采样（interval sampling）**：每次按固定间隔 $T/C$ 取 $C$ 个点作为一条子序列。

用矩阵写出：把长为 $T$ 的序列重排成 $C\\times(T/C)$ 的矩阵（$C$ 为块长度）：

$$
M^{cont}*{j}={x*{s+(j-1)C+1},,x\_{s+(j-1)C+2},\\dots,x\_{s+jC}},\\qquad
M^{int}*{j}={x*{s+j},,x\_{s+j+T/C},,x\_{s+j+2T/C},\\dots,x\_{s+j+(C-1)T/C}}
$$

其中：

  - $s=t-T$：窗口起点偏移；$T$：回看长度；$C$：每条子序列的长度（块长度，超参）
  - $M^{cont}\_j$：连续采样的第 $j$ 条子序列，由相邻的 $C$ 个点组成，只含局部短期信息
  - $M^{int}\_j$：间隔采样的第 $j$ 条子序列，由相隔 $T/C$ 的 $C$ 个点组成，覆盖整个窗口，反映长期全局信息
  - 以上下标以论文的描述为准，符号细节 `[解读]` 为本文按文字转写

直觉：连续采样把时间序列切成连续片段，每个片段内没有长程信息，模型关注局部模式；间隔采样抛开局部细节，模型关注长程模式。两种采样都只处理输入的一小部分，因此对很长的输入尤其高效。

### 3.2 信息交换块（IEBlock）

IEBlock 是 LightTS 的基本积木：输入一个 $H\\times W$ 的矩阵（$H$ 为时间维，$W$ 为通道维），输出一个
$F'\\times W$ 的特征矩阵（$F'$ 为输出特征维度）。内部依次做三种 MLP 投影：

1.  **时间投影（temporal projection）**：对每一列（每个通道）用 $\\mathbb
    R^{H}\\to\\mathbb R^{F}$ 的 MLP，权重在所有列间共享，提取时间维特征；
2.  **通道投影（channel projection）**：对每一行（每个特征）用 $\\mathbb R^{W}\\to\\mathbb
    R^{W}$ 的 MLP，权重在所有行间共享，在通道间交换信息，形状保持不变；
3.  **输出投影（output projection）**：对每一列用 $\\mathbb R^{F}\\to\\mathbb
    R^{F'}$ 的 MLP 映射到期望的输出维度。

为避免输入很长时对每个时间步重复做通道投影，论文采用**瓶颈设计（bottleneck）**：先用时间投影把行数从 $H$ 压到一个小得多的
$F$，通道投影只做 $F$ 次，最后再用输出投影映射到 $F'$。$F$ 远小于 $H$ 与 $F'$。

用公式表示三步：

$$ \\begin{aligned}
Z\_{:,j}&=\\mathrm{MLP}*{\\mathrm{temp}}(X*{:,j}),\\quad
j=1,\\dots,W&&(\\mathbb R^{H}\\to\\mathbb R^{F})\\
Y\_{i,:}&=\\mathrm{MLP}*{\\mathrm{chan}}(Z*{i,:}),\\quad
i=1,\\dots,F&&(\\mathbb R^{W}\\to\\mathbb R^{W})\\
O\_{:,j}&=\\mathrm{MLP}*{\\mathrm{out}}(Y*{:,j}),\\quad
j=1,\\dots,W&&(\\mathbb R^{F}\\to\\mathbb R^{F'}) \\end{aligned} $$

其中：

  - $X\\in\\mathbb R^{H\\times W}$：IEBlock 的输入矩阵；$X\_{:,j}$ 是第 $j$
    列（一个通道沿时间的取值）
  - $Z,Y,O$：依次是时间投影、通道投影、输出投影后的中间/最终矩阵
  - $\\mathrm{MLP}*{\\mathrm{temp}},\\mathrm{MLP}*{\\mathrm{chan}},\\mathrm{MLP}\_{\\mathrm{out}}$：三个
    MLP，各自在列或行上共享权重
  - $F$：瓶颈维度（远小于 $H$）；$F'$：输出特征维度

`[解读]` 这与 TSMixer 的"时间混合 + 特征混合"思路相近，不同在于 LightTS
把它放在下采样后的短序列上，并用瓶颈设计控制开销。

### 3.3 整体架构

下图概括 LightTS 的两个部分。

    对每个变量独立处理（第一部分）
      x (长度 T) ──连续采样──► (T/C × C) ──IEBlock-A──► 特征 ──线性降维──► 向量 a
               └─间隔采样──► (T/C × C) ──IEBlock-B──► 特征 ──线性降维──► 向量 b
    
    拼接（第二部分）
      所有变量的 [a;b] 在时间维（2 行）与通道维（N 列）拼成 2F × N 矩阵
            │
            ▼  IEBlock-C（通道投影学习变量间相关）
       最终预测 (L × N)

图中：

  - 第一部分：每个变量的序列分别经过连续采样、间隔采样，得到两个矩阵，各自送入一个 IEBlock（图中
    IEBlock-A、IEBlock-B），得到的特征再用线性映射降到固定维度；这一阶段各变量互不交互，专注时间模式。
  - 第二部分：把所有变量在两种采样下得到的特征沿时间维（两种采样）与通道维（变量）拼接成矩阵，送入
    IEBlock-C，其通道投影学习变量间相关性，输出最终预测。
  - 关键结论：只有 IEBlock-C 里的通道投影在不同变量间交换信息，而且它只是一个简单的线性层。

## 4\. 训练与实验设置

  - **数据集**：论文使用八个基准集。短序列预测用
    SolarEnergy、Traffic、Electricity、Exchange-Rate；长序列预测用
    ETTh1、ETTh2、ETTm1、Electricity、Weather。
  - **指标**：长序列预测用 MSE 与 MAE；短序列预测用 RSE（Root Relative Squared Error）与
    CORR（经验相关系数）。
  - **基线**：长序列预测对比
    LogTrans、Reformer、Informer、LSTMa、LSTNet、TCN、SCINet、Autoformer
    等；短序列预测对比 MTGNN、SCINet 等。具体超参与基线配置见论文附录，本文未逐项核对 `[待核实]`。
  - **可重复性**：论文用 5 个随机种子报告均值与标准差。

## 5\. 实验与结论

### 5.1 主结果

  - **长序列预测**：LightTS 在 ETTh1、ETTh2、ETTm1、Electricity 的所有预测长度上取得最优，在
    Weather 上第二；在最长预测长度上，MSE 分别降低 9.21%、33.90%、34.18%、13.60%（对应
    ETTh1、ETTh2、ETTm1、Electricity）。
  - **短序列预测**：在 Solar-Energy 上最优，RSE 在预测水平 3、6、12、24 上分别降低
    4.16%、4.61%、3.90%、2.73%；在 Traffic、Electricity、Exchange-Rate 上与
    MTGNN、SCINet 相当，没有模型在所有数据集上一致占优。论文还指出 RSE 与 CORR 两个指标之间存在不一致（如
    Traffic 上 RSE 最优但 CORR 略落后）。

### 5.2 效率与鲁棒性

  - 摘要给出：在最大的基准数据集上，LightTS 所需 FLOPS 不到此前 SOTA 的 5%；
  - 鲁棒性：在 5 个随机种子下，LightTS 在长序列预测上的方差远小于 Autoformer 与 SCINet（论文 Table
    6、Figure 3）。

### 5.3 消融

表格概括论文在预测水平为 24 的短序列任务上的消融（RSE，越小越好；CORR 越大越好）：

| 变体     | 含义              | 论文观察                                                                        |
| ------ | --------------- | --------------------------------------------------------------------------- |
| w/o CP | 去掉通道投影，不利用变量间相关 | 在 Solar、Electricity 上明显变差（这两个数据集变量相关性明显）；Exchange-Rate 上相关性不明显，去掉后几乎无影响甚至略好 |
| w/o IS | 去掉间隔采样          | 长期周期模式（如 Traffic 的周模式）预测变差                                                  |
| w/o CS | 去掉连续采样          | 短期局部模式（如 Traffic 的日模式）预测变差                                                  |

表中：「变体」是被去掉的组件，「含义」说明其功能，「论文观察」是对应结论。核心结论：两种采样分别对应短期与长期模式，通道投影对变量相关性强的数据集有明显帮助。

## 6\. 优缺点与局限

论文自述的优点：结构极简（只有 MLP）、计算量小、对长输入友好、结果稳定。

`[解读]` / `[经验]`：

  - 变量间相关性由一个线性通道投影学习；论文在讨论部分专门探讨"简单线性层是否足以刻画变量相关性"，并指出在相关性不明显的数据集上通道投影帮助有限；
  - 块长度 $C$ 需要与回看长度 $T$ 配合（$T$ 通常取 $C$ 的整数倍，细节论文正文未全部展开 `[待核实]`）；
  - 论文发表于 2022 年，对比的是当时的基线；与 PatchTST、iTransformer 等后续模型的比较不在论文范围内；
  - 只做点预测。

## 7\. 与相关方法对比

| 方法      | 结构    | 时间建模             | 变量间交互             | 备注             |
| ------- | ----- | ---------------- | ----------------- | -------------- |
| LightTS | 纯 MLP | 连续/间隔两种下采样后做 MLP | 一次通道投影（IEBlock-C） | 强调效率与稳定性       |
| SCINet  | 卷积    | 递归下采样 + 卷积交互     | 隐含在卷积中            | LightTS 论文的基线  |
| TSMixer | 纯 MLP | 时间混合 + 特征混合交替    | 特征混合              | 同为 MLP 路线，设计不同 |
| DLinear | 线性层   | 整条序列线性映射         | 通道独立              | 更简单，无变量交互      |

表中：「结构」是模型类型，「时间建模」「变量间交互」说明各自如何处理时间与变量维，「备注」给出特点。LightTS
的特点是用采样减少输入长度，再用瓶颈 MLP 控制计算量。

## 8\. 使用方式

示意代码，未运行验证；只表达采样与 IEBlock 的结构，超参为占位值：

``` python
import torch, torch.nn as nn

class IEBlock(nn.Module):
    def __init__(self, H, W, F, Fout):
        super().__init__()
        self.temporal = nn.Sequential(nn.Linear(H, F), nn.LeakyReLU(), nn.Linear(F, F))
        self.channel = nn.Sequential(nn.Linear(W, W), nn.LeakyReLU(), nn.Linear(W, W))
        self.out = nn.Linear(F, Fout)

    def forward(self, x):                   # x: [B, H, W]
        z = self.temporal(x.transpose(1, 2)).transpose(1, 2)   # [B, F, W]
        y = self.channel(z)                                    # [B, F, W]
        return self.out(y.transpose(1, 2)).transpose(1, 2)     # [B, Fout, W]

def samplings(x, C):                        # x: [B, T]；T 需为 C 的整数倍
    B, T = x.shape
    cont = x.reshape(B, T // C, C)                           # 连续采样：相邻 C 个点一组
    inter = x.reshape(B, C, T // C).transpose(1, 2)          # 间隔采样：间隔 T/C 取点
    return cont, inter
```

使用要点 `[经验]`：块长度 $C$ 要使 $T/C$ 与 $C$ 都不过大；变量相关性弱的数据集可去掉通道投影以减少参数。

## Reference

  - Tianping Zhang, Yizhuo Zhang, Wei Cao, Jiang Bian, Xiaohan Yi, Shun
    Zheng, Jian Li. *Less Is More: Fast Multivariate Time Series
    Forecasting with Light Sampling-oriented MLP Structures*.
    [arXiv:2207.01186](https://arxiv.org/abs/2207.01186)
  - 站内：[时间序列总览](/0603_ML_Tasks_TimeSeries)、[深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)、[DLinear](/0630_ML_Tasks_TimeSeries_Deep_DLinear)、[TSMixer](/0632_ML_Tasks_TimeSeries_Deep_TSMixer)
