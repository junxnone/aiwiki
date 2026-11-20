-----

| Title     | ML Tasks TimeSeries Deep MSGNet                       |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-20T09:07:50Z`                                |
| Updated @ | `2026-11-20T09:07:50Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/675) |

-----

# MSGNet

MSGNet 出自论文 *MSGNet: Learning Multi-Scale Inter-Series Correlations for
Multivariate Time Series Forecasting*（Wanlin Cai、Yuxuan Liang、Xianggen
Liu、Jianshuai Feng、Yuankai Wu，四川大学 / 香港科技大学（广州）/ 北京理工大学，AAAI
2024，arXiv:2401.00423）。它面向**多变量**预测，关注一个被忽视的问题：**变量之间的相关性在不同时间尺度上是不同的**（例如金融里市场动荡时资产相关性升高、经济增长时降低；生态系统里物种数量与环境变量在多个时间尺度上有不同相关）。已有模型常常只学一种固定的变量间相关（例如用一个固定图结构的
GNN），无法描述这种随尺度变化的相关性。

**一句话概括：用 FFT 找出输入序列的主周期作为多个"时间尺度"，在每个尺度上自适应地学习一张变量间图并做 Mixhop
图卷积，再用多头注意力学习序列内的时间相关，最后按各尺度的 FFT 幅值用 softmax
加权聚合（专家混合式），堆叠多个 ScaleGraph 块得到预测。**

> 标注约定：未标注的内容来自论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：同样用 FFT 找周期的
[TimesNet](/0631_ML_Tasks_TimeSeries_Deep_TimesNet)；对比基线之一的
[DLinear](/0630_ML_Tasks_TimeSeries_Deep_DLinear)、[Informer](/0635_ML_Tasks_TimeSeries_Deep_Informer)、[Autoformer](/0636_ML_Tasks_TimeSeries_Deep_Autoformer)；同属变量间建模路线的
[iTransformer](/0639_ML_Tasks_TimeSeries_Deep_iTransformer)、[SOFTS](/0641_ML_Tasks_TimeSeries_Deep_SOFTS)、[TimeFilter](/XXXX_ML_Tasks_TimeSeries_Deep_TimeFilter)；总览见
[深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)。

## 1\. 解决什么问题

时间序列预测有两个相互关联的方面：

  - **序列内相关（intra-series）**：用一条序列自身的模式预测未来；
  - **序列间相关（inter-series）**：不同序列之间的关系与依赖。

论文指出现有深度模型（RNN、TCN、Transformer 以及 GNN）在刻画**随时间尺度变化的序列间相关**上存在空白：

  - 若只依赖一种序列间相关（例如一个固定图结构的 GNN），在相关性复杂多变的场景下预测会变差；
  - 不同时间尺度上同一对变量的相关性可能完全不同（论文 Figure 1：在尺度 1 上两条序列可能呈正相关，在另一个尺度上则不然）。

MSGNet 的目标：**在多个时间尺度上分别发现并利用序列间相关**，同时利用多头注意力刻画序列内相关。

## 2\. 核心思想与结构

### 2.1 整体流程

MSGNet 由若干个 **ScaleGraph 块**以残差方式堆叠而成。每个 ScaleGraph 块包含四步：

1.  识别输入序列的时间尺度；
2.  用自适应图卷积学习与尺度相关的序列间相关；
3.  用多头注意力捕捉序列内相关；
4.  用 softmax 自适应聚合不同尺度的表示。

下图概括一个 ScaleGraph 块与整体流程。

    输入 X_{t-L:t} (N × L)
       │ 归一化 + 嵌入（1-D 卷积，kernel 3）+ 位置嵌入 + 时间戳嵌入  → X⁰ ∈ R^{d_model × L}
       ▼ 重复 若干个 ScaleGraph 块（残差）
       ┌──────────────────────────────────────────────────────────────┐
       │ ① FFT：挑出幅值最大的 k 个频率 → 尺度 s_1…s_k（周期）        │
       │    把 X 按每个尺度 reshape 成 d_model × s_i × f_i 的 3D 张量  │
       │ ② 每个尺度：线性映射回 N 个变量 → 自适应图 A_i → Mixhop 图卷积│
       │ ③ 每个尺度：沿尺度维做多头注意力（序列内相关）                │
       │ ④ 按各尺度 FFT 幅值做 softmax，加权聚合 k 个尺度的表示        │
       └──────────────────────────────────────────────────────────────┘
       ▼
     输出 X_out ──线性（变量维 W_s，时间维 W_t）──► 预测 X̂_{t:t+T} (N × T)

图中：

  - 上方是输入处理：先对输入做归一化，再经 1-D 卷积嵌入、加位置嵌入与可学习的全局时间戳嵌入，得到 $d\_{model}\\times
    L$ 的特征。
  - 中间的方框是一个 ScaleGraph 块的四个步骤：FFT
    识别多个尺度并把序列重排成三维张量；每个尺度内学习序列间图与图卷积；每个尺度内用多头注意力学习序列内相关；最后按尺度幅值聚合。
  - 下方是预测：用沿变量维与时间维的线性映射得到最终预测。
  - 关键结论：序列间相关在每个尺度上单独学习，序列内相关由注意力负责，二者在一个块内结合。

### 2.2 输入嵌入

对输入先归一化，再用核宽 3、步长 1 的 1-D 卷积把变量投影到 $d\_{model}$ 维（采用 Informer
的统一输入表示，加上位置嵌入 $\\mathrm{PE}\\in\\mathbb
R^{d\_{model}\\times L}$ 和可学习的全局时间戳嵌入 $\\mathrm{SE}*p$）。第 $l$ 层的输入记作
$X^{l-1}\\in\\mathbb R^{d*{model}\\times L}$，以残差方式处理：

$$ X^{l}=\\mathrm{ScaleGraphBlock}\\big(X^{l-1}\\big)+X^{l-1} $$

其中：$X^{0}$ 是嵌入后的输入；$X^{l}$ 是第 $l$ 层的输出；$L$ 是回看长度；$d\_{model}$ 是隐层维度。

### 2.3 用 FFT 识别时间尺度

论文选择**周期性**作为尺度来源，受 TimesNet 启发，用 FFT 检测主周期：

$$
F=\\mathrm{Avg}\\big(\\mathrm{Amp}(\\mathrm{FFT}(X\_{\\mathrm{in}}))\\big),\\qquad
{f\_1,\\dots,f\_k}=\\arg\\mathrm{Top}\\text{-}k\\big(F\\big),\\qquad
s\_i=\\Big\\lceil\\frac{L}{f\_i}\\Big\\rceil $$

其中：

  - $X\_{\\mathrm{in}}$：ScaleGraph
    块的输入；$\\mathrm{FFT}$：快速傅里叶变换，$\\mathrm{Amp}$：取幅值，$\\mathrm{Avg}$：对
    $d\_{model}$ 个维度取平均，得到每个频率的幅值向量 $F\\in\\mathbb R^{L}$
  - $f\_1,\\dots,f\_k$：幅值最大的 $k$ 个频率；$s\_i$：第 $i$ 个频率对应的时间尺度（周期长度）
  - 随输入不同，检测到的主周期也会不同，因此模型能检测出随时间变化的尺度

然后按每个尺度把输入重排成三维张量（补零使长度可被整除）：

$$ \\hat
X^{i}=\\mathrm{Reshape}*{s\_i,f\_i}\\big(\\mathrm{Padding}(X*{\\mathrm{in}})\\big)\\in\\mathbb
R^{d\_{model}\\times s\_i\\times f\_i} $$

其中：$\\hat X^{i}$ 是第 $i$ 个尺度上的张量；$s\_i\\times f\_i$
是把时间轴折成的两个维度（每行一个周期长度、共
$f\_i$ 个周期，与 TimesNet 的折叠思路一致 `[解读]`）。

### 2.4 自适应多尺度图卷积

对第 $i$ 个尺度的张量，先把 $d\_{model}$ 个通道线性映射回 $N$ 个变量：

$$ H^{i}=W^{i},\\hat X^{i}\\in\\mathbb R^{N\\times s\_i\\times
f\_i},\\qquad W^{i}\\in\\mathbb R^{N\\times d\_{model}} $$

其中：$W^{i}$ 是第 $i$ 个尺度专属的可学习权重；$N$
是变量数。论文提到，尽管"线性映射再映射回去"看起来可能损害序列间相关，但图卷积能够保留这种相关性。

然后为该尺度**自适应地**生成邻接矩阵 $A^{i}\\in\\mathbb R^{N\\times N}$（由可学习的节点表示得到，用
softmax 对节点间权重归一化，具体生成形式见论文 `[待核实]`），再用 **Mixhop 图卷积**（Abu-El-Haija
等人）融合多跳信息：

$$ H^{i}*{\\mathrm{out}}=\\sigma\\Big(\\big\\Vert*{j\\in
P},(A^{i})^{j},H^{i},W\_{j}\\Big) $$

其中：

  - $A^{i}$：第 $i$ 个尺度学到的邻接矩阵；$(A^{i})^{j}$：它自乘 $j$ 次，对应 $j$ 跳邻居
  - $P$：一组整数的邻接幂（超参，例如 ${0,1,2}$）；$W\_j$：第 $j$ 个幂对应的可学习权重
  - $\\Vert$：沿特征维拼接各幂的结果；$\\sigma$：激活函数
  - 之后用一个 MLP 把 $H^{i}*{\\mathrm{out}}$ 映射回三维张量 $\\hat X^{i}\\in\\mathbb
    R^{d*{model}\\times s\_i\\times f\_i}$

### 2.5 序列内相关：多头注意力

在每个尺度的张量上，沿尺度维度（时间尺度维）做自注意力（MHA），捕捉该尺度内的序列内相关。

### 2.6 尺度聚合（专家混合视角）

把 $k$ 个尺度的结果恢复为原来的长度后，按各尺度的 FFT 幅值做 softmax 得到权重，再加权求和：

$$ \\hat
a\_i=\\mathrm{SoftMax}\\big(F\_{f\_1},\\dots,F\_{f\_k}\\big)*i,\\qquad
X*{\\mathrm{out}}=\\sum\_{i=1}^{k}\\hat a\_i,\\hat
X^{i}\_{\\mathrm{agg}} $$

其中：

  - $F\_{f\_i}$：第 $i$ 个主频率对应的 FFT 幅值；$\\hat a\_i$：softmax
    归一化后的权重，幅值越大的尺度权重越大
  - $\\hat X^{i}*{\\mathrm{agg}}$：第 $i$ 个尺度经图卷积与注意力后恢复到长度 $L$
    的表示；$X*{\\mathrm{out}}$：聚合后的块输出
  - 这类似于专家混合（Mixture of Experts）：各尺度是"专家"，幅值决定其权重（论文附录从 MoE 角度给出了分析）

### 2.7 预测头

用沿变量维与时间维的线性映射把 $X\_{\\mathrm{out}}\\in\\mathbb R^{d\_{model}\\times L}$
转换成预测：

$$ \\hat X\_{t:t+T}=W\_s,X\_{\\mathrm{out}},W\_t+b $$

其中：$W\_s\\in\\mathbb R^{N\\times
d\_{model}}$：沿变量维的线性映射；$W\_t\\in\\mathbb
R^{L\\times T}$：沿时间维的线性映射；$b\\in\\mathbb R^{T}$：偏置；$T$ 是预测长度；$\\hat
X\_{t:t+T}\\in\\mathbb R^{N\\times T}$ 是对 $N$ 个变量未来 $T$ 步的预测。

## 3\. 训练与实验设置

  - **数据集**：8
    个数据集：Flight、Weather、ETT（h1、h2、m1、m2）、Exchange-Rate、Electricity。其中
    Flight 数据来自 OpenSky 官网，是与新冠疫情相关的航班数据，是论文新引入的数据集，其他是常用基准。
  - **基线**：Informer、Autoformer（Transformer
    类）、MTGNN（图卷积类）、DLinear、NLinear（线性模型）、TimesNet（基于周期分解的
    SOTA）。
  - **设置**：RTX 3090 24GB；训练损失 MSE；所有模型回看窗口 $L=96$（公平比较），预测长度
    ${96,192,336,720}$；初始学习率 $10^{-4}$，batch size 32，10 个
    epoch，使用早停；数据划分 (0.7,0.1,0.2) 或 (0.6,0.2,0.2)。

## 4\. 实验与结论

  - **主结果**：以不同预测长度平均的 MSE 计，MSGNet 在 5 个数据集上最优，在 2 个数据集上次优；
  - **Flight 数据集**：相对 TimesNet（此前 SOTA），平均 MSE 降低 21.5%（0.265→0.208），MAE
    降低 13.7%（0.372→0.321）；论文称 TimesNet 虽然利用了多尺度信息，但用纯视觉模型处理序列间与序列内相关；
  - **可视化**：在 Flight 预测中，MSGNet 的预测与真值更接近，其他模型在特定时间段出现明显偏差；
  - **更长输入**：论文附录称 MSGNet 在更长的回看窗口下可以取得更好表现；附录还包含各数据集上检测到的尺度、计算效率与更多示例；
  - **泛化性**：摘要指出 MSGNet 能自动学习可解释的多尺度序列间相关，并且在分布外样本上也表现出较强的泛化能力。

## 5\. 优缺点与局限

论文自述的优点：把序列间相关与时间尺度联系起来；可解释（每个尺度的图可视化）；泛化能力好。

`[解读]` / `[经验]`：

  - 尺度来自 FFT 检测的周期，对没有明显周期或周期不稳的数据，尺度的意义减弱；
  - 每个尺度单独学习一张 $N\\times N$ 的图，变量数很多时图卷积与邻接矩阵开销会增大；
  - 论文主实验统一回看 96，与搜索回看长度的口径不同；
  - 官方代码在 `YoZhibo/MSGNet`（论文脚注给出 `[待核实]`）；Time-Series-Library 也提供
    `MSGNet`。

## 6\. 与相关方法对比

| 方法           | 序列间相关建模                 | 多尺度来源   | 序列内相关 | 备注               |
| ------------ | ----------------------- | ------- | ----- | ---------------- |
| MSGNet       | 每个尺度一张自适应图 + Mixhop 图卷积 | FFT 主周期 | 多头注意力 | 按尺度幅值 softmax 聚合 |
| MTGNN        | 一张固定（学习得到的）图            | 无       | 时间卷积  | 论文中的图卷积类基线       |
| TimesNet     | 折叠为 2D 后用卷积             | FFT 主周期 | 2D 卷积 | 多尺度但不显式建模变量间图    |
| iTransformer | 变量 token 间的自注意力         | 无       | 前馈网络  | 本站另有文章           |
| DLinear      | 无（通道独立）                 | 无       | 线性层   | 论文中的线性基线         |

表中：「序列间相关建模」说明各方法如何刻画变量关系，「多尺度来源」说明多尺度的获得方式，「序列内相关」说明时间维的处理，「备注」给出特点。MSGNet
的独特点是在每个周期尺度上独立学习变量间图。

## 7\. 使用方式

示意代码，未运行验证；只表达 FFT 选尺度与尺度聚合的权重计算，超参为占位值：

``` python
import torch

def detect_scales(x, k=3):                          # x: [B, L, d]
    amp = torch.fft.rfft(x, dim=1).abs().mean(dim=(0, 2))   # [L//2+1]
    amp[0] = 0                                       # 去掉直流分量
    top = torch.topk(amp, k).indices
    periods = [-(-x.shape[1] // int(f)) for f in top]       # s_i = ceil(L / f_i)
    weights = torch.softmax(amp[top], dim=0)                 # 各尺度聚合权重
    return periods, weights

def mixhop(A, H, W_list, powers=(0, 1, 2)):           # A:[N,N]; H:[B,N,F]
    outs, Ak = [], torch.eye(A.shape[0])
    for j in range(max(powers) + 1):
        if j in powers:
            outs.append(torch.relu(Ak @ H @ W_list[j]))
        Ak = Ak @ A
    return torch.cat(outs, dim=-1)
```

使用要点 `[经验]`：先用论文的默认超参在 ETT、Weather 上复现；变量很多时可以减少尺度数 $k$ 或图卷积的幂集合 $P$
以控制开销。

## Reference

  - Wanlin Cai, Yuxuan Liang, Xianggen Liu, Jianshuai Feng, Yuankai Wu.
    *MSGNet: Learning Multi-Scale Inter-Series Correlations for
    Multivariate Time Series Forecasting*. AAAI 2024.
    [arXiv:2401.00423](https://arxiv.org/abs/2401.00423)
  - 站内：[深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)、[TimesNet](/0631_ML_Tasks_TimeSeries_Deep_TimesNet)、[iTransformer](/0639_ML_Tasks_TimeSeries_Deep_iTransformer)
