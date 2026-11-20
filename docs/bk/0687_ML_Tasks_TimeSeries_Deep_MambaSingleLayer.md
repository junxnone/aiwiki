-----

| Title     | ML Tasks TimeSeries Deep MambaSingleLayer             |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-20T09:27:09Z`                                |
| Updated @ | `2026-11-20T09:27:09Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/687) |

-----

# MambaSingleLayer

MambaSingleLayer 即 **MambaSL** 的官方实现名（仓库 yoom618/MambaSL 的
`models/MambaSingleLayer.py`）。它出自论文 *MambaSL: Exploring Single-Layer
Mamba for Time Series Classification*（Yoo-Min Jung、Leekyung
Kim，首尔大学，ICLR 2026，OpenReview id `YDl4vqQqGP`）。与前面多数把 Mamba
用于预测的工作不同，MambaSL 面向**时间序列分类（TSC）**：作者提出一个"最小改动"的单层 Mamba，在 UEA
多变量分类基准上以单层结构取得最好的平均准确率与平均排名（README 所述）。

**一句话概括：对输入做 RevIN → 用更大核的一维卷积做词元嵌入（放大输入投影感受野）→ 单个可配置时变性的 Mamba 层 →
LayerNorm + SiLU → 去掉跳连，只用隐状态产生每个时刻的 logits → 用多头自适应池化（门控权重）对各时刻 logits
加权求和得到类别预测。**

> 标注约定：未标注的内容来自官方 README 与官方代码（models/MambaSingleLayer.py）；`[解读]`
> 是对实现的理解，`[待核实]` 是未能对照论文全文确认的内容。本文撰写时未能获取论文全文，实验数字未收录。

本站相关：Mamba 本体 [Mamba](/0643_ML_Tasks_TimeSeries_Deep_Mamba)；把 Mamba
用于预测的 [SMamba](/0644_ML_Tasks_TimeSeries_Deep_SMamba)；总览见
[深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)。

## 1\. 解决什么问题

Mamba 原本为语言建模设计，其默认配置（多层、选择性/时变的 SSM、跳连、最后一个或平均池化）直接用于时间序列分类并不一定合适。论文在
UEA 基准上围绕**四个假设**重新设计 Mamba（来自 README）：

| 假设        | 动机                                                | 对应改动                                                    |
| --------- | ------------------------------------------------- | ------------------------------------------------------- |
| H1 放大输入投影 | Mamba 的输出由门控单元调制，输入上下文不足会成为瓶颈；密集采样的时间序列需要更大的输入感受野 | 词元嵌入的卷积核大小 `num_kernels` 可调（不再固定为 3）                    |
| H2 时变性模块化 | 时间序列常近似线性时不变（LTI）；简单配置往往更好，与 Mamba 原论文的消融结论相反     | 把 $\\Delta$、$B$、$C$ 是否随输入变化（`tv_dt`、`tv_B`、`tv_C`）作为超参数 |
| H3 去掉跳连   | 时间序列模型通常较浅，跳连不一定带来收益；Mamba 本身长程记忆强                | 去掉 $D$ 跳连项（`use_D`），仅用隐状态构造 logits                      |
| H4 自适应池化  | 时间序列分类既有全局模式也有事件驱动的模式，传统池化无法兼顾                    | 多头自适应池化，按数据集自适应地加权各时刻特征                                 |

表中：

  - 第一列是假设编号与名称，第二列是论文给出的动机，第三列是对应的实现改动及代码里的参数名；
  - 作者称这些假设（在其基准上）使简单配置也能取得最好的平均准确率与排名；
  - 按照 README，论文还展示了不同骨干结构的 UMAP 可视化差异，并公开了 30 个 UEA 数据集上各模型的最佳检查点。

## 2\. 模型结构

### 2.1 整体流程

下图概括 MambaSL 的分类流程（对应 README 的结构图与代码前向过程）。

    输入 X ∈ R^{B×L×C}（分类数据，可能带填充掩码）
       │ RevIN（可选）
       ▼
    嵌入：Conv1d（核大小=num_kernels，same 填充，复制填充，无偏置）+ 正弦位置编码 + Dropout
       ▼  [B, L, d_model]
    单层 Mamba（Mamba_TimeVariant）→ LayerNorm → SiLU
       ▼  [B, L, d_model]
    投影头（projection_type）：
       gating（提出）：逐时刻线性得到 logits [B,L,K]，再用门控权重加权求和
       full / last / avg / max（消融）
       ▼
    类别 logits ∈ R^{B×K}

图中：

  - $B$ 是批大小，$L$ 是序列长度，$C$ 是变量数，$d\_{model}$ 是隐层维度，$K$ 是类别数；
  - 嵌入部分把变量维 $C$ 映射到 $d\_{model}$，且卷积核大小可调以放大输入感受野（H1）；
  - 骨干只有**一层** Mamba，之后只接 LayerNorm 与 SiLU（与 Mamba Block 用相同的激活）；
  - 最后的投影头有五种选择，提出的是 `gating`，其余四种用于消融。

### 2.2 Mamba 层（时变性可配置）

骨干使用 `Mamba_TimeVariant`：一个标准选择性状态空间模型，但允许分别关闭 $\\Delta$、$B$、$C$
的时变性。其递推（离散化后）为：

$$ h\_t=\\bar A\_t,h\_{t-1}+\\bar B\_t,x\_t,\\qquad
y\_t=C\_t,h\_t+D,x\_t $$

其中：

  - $x\_t,y\_t$：时刻 $t$ 的输入与输出（逐通道）；$h\_t$：状态，维度由 `d_state`（代码里取自
    `d_ff`）决定；
  - $\\bar A\_t=\\exp(\\Delta\_t A)$、$\\bar B\_t=\\Delta\_t
    B\_t$：离散化后的状态转移与输入矩阵，$\\Delta\_t$ 是步长；
  - 在选择性 Mamba 中，$\\Delta\_t$、$B\_t$、$C\_t$ 由输入 $x\_t$
    通过线性映射产生（**时变**，即随输入变化）；MambaSL
    把三者的时变性作为开关：关掉后对应量变为与时间无关的可学习参数，模型退化为更接近线性时不变系统（H2）；
  - $D,x\_t$：跳连项；MambaSL 通过 `use_D` 将其去掉（H3），使输出仅取决于隐状态；
  - 这里对 Mamba 公式的写法是通用的选择性 SSM 形式，具体实现细节（卷积分支、门控分支、`expand`、`d_conv` 等）以
    mamba-ssm 与论文为准 `[待核实]`。

### 2.3 嵌入层

嵌入层用 `Conv1d(c_in → d_model, kernel = num_kernels, padding='same',
padding_mode='replicate', bias=False)` 把输入映射到 $d\_{model}$ 维（Kaiming
初始化），再加上正弦位置编码并做 dropout：

$$
E=\\mathrm{Dropout}\\big(\\mathrm{Conv1d}*{k}(X)+\\mathrm{PE}\\big)\\in\\mathbb
R^{L\\times d*{model}} $$

其中：

  - $\\mathrm{Conv1d}\_k$：核大小为 $k$ 的一维卷积（$k$ 即 `num_kernels`），$k$
    越大每个词元看到的局部上下文越多（H1）；
  - $\\mathrm{PE}$：位置编码，最大长度取 $\\max(5000,L)$（避免 EigenWorms 等 $L$
    很长的数据集触发警告）；
  - 官方代码注释说明：TSLib 原版固定核为 3，这里为了验证 H1 把它改为可调。

### 2.4 多头自适应池化（门控投影头）

提出的 `gating` 头把"逐时刻分类"与"自适应加权"结合：先对每个时刻的隐状态做线性映射得到该时刻的
logits，再用一个由隐状态产生的门控权重对各时刻加权求和：

$$ \\ell\_t=W\_{out},\\mathrm{Drop}(m\_t),\\qquad
w\_{t}=\\mathrm{Softmax}*t\\Big(\\mathrm{MaxPool}*{heads}\\big(W\_g,m\_t+b\_g\\big)\\Big),\\qquad
\\hat y=\\sum\_{t=1}^{L} w\_t,\\big(\\ell\_t\\odot s\_t\\big) $$

其中：

  - $m\_t\\in\\mathbb R^{d\_{model}}$：Mamba 层输出（经 LayerNorm 与 SiLU）在时刻
    $t$ 的隐状态；
  - $W\_{out}\\in\\mathbb R^{K\\times d\_{model}}$：输出层，得到时刻 $t$ 的类别
    logits $\\ell\_t\\in\\mathbb R^{K}$；
  - $s\_t$：掩码（来自 `x_mark_enc`），把变长序列的填充位置置零；
  - $W\_g,b\_g$：门控线性层，输出 `n_heads` 个标量，再对头维做最大池化得到每个时刻一个标量，然后**沿时间做
    softmax** 得到权重 $w\_t$（初始化时权重为零、偏置为 1，因此起点等价于对各时刻取平均）；
  - $\\hat y\\in\\mathbb R^{K}$：最终类别 logits，即各时刻 logits 的加权和；
  - 直观上：全局模式可以让权重平均分散在所有时刻；事件驱动的模式则让权重集中在关键时刻——权重由数据集决定，这就是"自适应"（H4）；
  - 代码里还会记录每个样本权重的平方和（Gini 指数）用于分析权重分布的集中程度，仅用于论文分析。

代码中的五种投影头对比：

| `projection_type` | 做法                                  |
| ----------------- | ----------------------------------- |
| full              | 把 $L\\times d\_{model}$ 展平后接全连接（消融） |
| last              | 只取最后一个时刻的隐状态再线性分类（消融）               |
| avg               | 对各时刻 logits 取平均（消融）                 |
| max               | 对各时刻 logits 取最大（消融）                 |
| gating            | 门控加权求和（**提出**）                      |

表中：

  - 第一列是代码中的开关名，第二列是汇聚方式；
  - full 参数量随 $L$ 增长；last 只用最后时刻，依赖 Mamba 的长程记忆；avg/max 是两种固定的池化；gating
    则让池化权重可学习且随输入变化。

## 3\. 实验与结论

  - **基准**：UEA 的 30 个多变量分类数据集；README 称 MambaSL 以单层 Mamba
    在平均准确率与平均排名上取得最佳，并公开了 MambaSL 及近期
    TSC 基线在全部 30 个数据集上的最佳检查点；
  - **分析**：论文通过 UMAP 可视化比较不同骨干结构的系统性差异，另有时变性消融（`ablate_MambaSL_TV` 对应论文
    Figure 7）与自适应池化权重可视化（Figure 8）；
  - 具体数字与对比表请以论文为准 `[待核实]`。

## 4\. 总结 \[解读\]

  - MambaSL 的启示是：把为语言设计的 Mamba
    搬到时间序列分类时，**应当按数据特性做减法与模块化**——一层足够，时变性可关、跳连可去，关键改进在输入感受野与输出汇聚方式；
  - 局限：结论建立在 UEA 分类基准与作者的超参数搜索之上；不同任务（预测、异常检测）是否同样适用需要另行验证；作者实现依赖
    mamba-ssm 与 causal-conv1d，安装较为麻烦。

## Reference

  - Jung Y-M, Kim L. MambaSL: Exploring Single-Layer Mamba for Time
    Series Classification. ICLR 2026.
    <https://openreview.net/forum?id=YDl4vqQqGP>
  - 官方代码：<https://github.com/yoom618/MambaSL>
  - Gu A, Dao T. Mamba: Linear-Time Sequence Modeling with Selective
    State Spaces. 2023.
