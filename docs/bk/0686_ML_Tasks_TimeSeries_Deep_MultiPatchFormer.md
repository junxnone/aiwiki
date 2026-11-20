-----

| Title     | ML Tasks TimeSeries Deep MultiPatchFormer             |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-20T09:25:45Z`                                |
| Updated @ | `2026-11-20T09:25:45Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/686) |

-----

# MultiPatchFormer

MultiPatchFormer 出自论文 *A multiscale model for multivariate time series
forecasting*（UQAM bioinfoUQAM 团队，Scientific Reports
2025，15:1565，doi:10.1038/s41598-024-82417-4，代码
bioinfoUQAM/MultiPatchFormer）。它是一个基于 Transformer
的多变量预测模型，要同时解决两件事：**用不同大小的分块（patch）在多个时间尺度上建模时间依赖**，以及**用通道维度的编码器建模变量之间的相关性**。再配一个"半自回归"的多步解码器一次性输出长预测。

**一句话概括：RevIN 归一化 → 四种不同块长的卷积嵌入（多尺度）并拼接 → 时间编码器（块之间的因果注意力）→
把每个通道的全部块特征压成一个向量 → 通道编码器（变量之间的注意力）→ 8
个线性头按段半自回归地依次生成预测 → 反归一化。**

> 标注约定：未标注的内容来自官方代码仓库（model/MultiPatchFormer.py 与
> scripts）与论文摘要/README；`[解读]` 是对实现的理解，`[待核实]`
> 是未能对照论文全文确认的内容。本文撰写时无法访问论文全文（nature.com /
> PMC 受网络限制），论文中的实验数字未收录；以下结构描述以官方代码为准。

本站相关：分块的来源
[PatchTST](/0638_ML_Tasks_TimeSeries_Deep_PatchTST)；同样建模变量间依赖的
[Crossformer](/0685_ML_Tasks_TimeSeries_Deep_Crossformer)、[iTransformer](/0639_ML_Tasks_TimeSeries_Deep_iTransformer)；同属多尺度思想的
[TimeMixer](/0633_ML_Tasks_TimeSeries_Deep_TimeMixer)、[WPMixer](/0677_ML_Tasks_TimeSeries_Deep_WPMixer)；总览见
[深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)。

## 1\. 解决什么问题

  - 单一块长的 PatchTST 只能在一个时间粒度上取局部信息，而真实序列往往同时存在短周期与长周期模式；
  - 通道独立的做法忽略变量之间的相关性；
  - 因此论文提出：**多尺度嵌入**（不同块长）捕获多粒度的时间依赖，**通道编码器**捕获变量间相关，**多步解码器**减少长预测的误差累积或提升一致性（具体动机以论文为准）。

论文的消融实验分别检验了去掉多尺度嵌入、去掉通道编码器、去掉多步解码器的效果；摘要称在七个真实数据集上取得 SOTA。

## 2\. 模型结构

### 2.1 整体流程

下图概括 MultiPatchFormer 的数据流（以官方实现的默认配置标注形状）。

    输入 X ∈ R^{B×L×C}（L=96 为回看长度，C 个变量）
       │ RevIN 归一化
       ▼ 每个变量单独处理（通道独立地嵌入）
    多尺度块嵌入：4 个一维卷积，块长/步长 = (8,8) (16,8) (24,7) (32,6)
       每个卷积输出 d_model/4 = 64 维，在特征维拼接 → 256 维，加正弦位置编码
       ▼ 形状 [(B·C), P, d_model]，P = ⌊(L−16)/8⌋+2 个块
    时间编码器（多头自注意力 + 前馈，带因果掩码，N 层）
       ▼ 展平每个通道的 P×d_model → 1×1 卷积压成 d_model
    形状 [B, C, d_model]
       ▼
    通道编码器（多头自注意力 + 前馈，无掩码）：变量与变量之间注意
       ▼
    多步解码器：8 个线性头，逐段半自回归 → 拼接成 pred_len 步
       ▼ RevIN 反归一化
    预测 Ŷ ∈ R^{B×O×C}

图中：

  - $B$ 是批大小，$L$ 是回看长度，$O$ 是预测长度，$C$ 是变量数；
  - 四个卷积的"块长/步长"对应官方代码中的 `patch_len1..4` 与 `stride1..4`：块越长，看到的时间范围越大；
  - 时间编码器作用在"块"这一维（每个变量单独、互不相通），通道编码器作用在"变量"这一维；
  - 关键点：先时间后通道——先在每个变量内部提炼多尺度的时间特征，再让变量之间交换信息。

### 2.2 多尺度块嵌入

对每个变量的序列，用 4 个不同的一维卷积分别嵌入，每个卷积相当于"切块 + 线性映射"：

$$ e^{(k)}*p=\\mathrm{Conv1d}*{k}\\big(x^{(c)}\\big)*p\\in\\mathbb
R^{d*{model}/4},\\qquad
e\_p=\\big\[e^{(1)}\_p,|,e^{(2)}\_p,|,e^{(3)}\_p,|,e^{(4)}\_p\\big\]+\\mathrm{PE}\_p
$$

其中：

  - $x^{(c)}$：变量 $c$ 的归一化序列；$k=1,\\dots,4$ 对应四种块长 $P\_k\\in{8,16,24,32}$
    与步长 $S\_k\\in{8,8,7,6}$；
  - $\\mathrm{Conv1d}*{k}$：核大小为 $P\_k$、步长为 $S\_k$ 的卷积，输出通道数为
    $d*{model}/4$；块长更大的分支感受野更大、更偏向长周期模式；
  - 后三个分支在序列末尾复制填充 $S\_k$ 个值，使四个分支输出的块数 $P=\\lfloor (L-16)/8\\rfloor+2$
    一致 `[解读]`；
  - $|$：在特征维拼接，因此 $e\_p\\in\\mathbb R^{d\_{model}}$（默认 256）；
  - $\\mathrm{PE}*p$：第 $p$ 个块的正弦位置编码（$\\sin/\\cos$，波长
    $10000^{2i/d*{model}}$）。

### 2.3 时间编码器

每个变量的 $P$ 个块 token 经过 $N$ 层标准 Transformer 编码器（默认 $N=1$），每层为多头自注意力 +
前馈网络，并带残差与 LayerNorm：

$$
\\mathrm{Attn}(Q,K,V)=\\mathrm{softmax}\!\\left(\\frac{QK^\\top}{\\sqrt{d\_k}}+M\\right)V
$$

其中：

  - $Q,K,V$：由块 token 线性映射得到的查询、键、值；默认头数 16、每头 $q=v=16$；
  - $d\_k$：键的维度，用于缩放；
  - $M$：注意力掩码；官方实现中时间编码器的 `mask=True`（因果掩码，块只能看到自己及之前的块），通道编码器的
    `mask=False`；
  - 所有层共用同一个 MHA 模块（`shared_MHA`）与前馈网络（`d_hidden=512`），dropout 为 0.2。

### 2.4 从时间表示到通道表示

时间编码器输出 $\[(B\\cdot C),P,d\_{model}\]$。把每个通道的 $P$ 个块 token 展平成一个长为
$P\\cdot d\_{model}$ 的向量，再用核大小为 1 的一维卷积压回 $d\_{model}$：

$$
z\_c=W\_{ch},\\mathrm{Flatten}\\big(H^{time}*{c,1:P}\\big)\\in\\mathbb
R^{d*{model}} $$

其中：$H^{time}*{c,1:P}$ 是变量 $c$ 的所有块特征；$W*{ch}$ 是 1×1 卷积（等价于线性映射）；$z\_c$
就是变量 $c$ 的"通道 token"，所有 $C$ 个通道 token 组成 $\[B,C,d\_{model}\]$
送入通道编码器。

### 2.5 通道编码器

通道编码器与时间编码器结构相同（多头自注意力 + 前馈），但**把"变量"当作序列维度**：注意力在 $C$ 个通道 token
之间进行且不加掩码，因此每个变量都能看到所有其他变量，显式建模变量间相关性。

### 2.6 半自回归多步解码器

解码器由 8 个线性层组成，每个头产生 $O/8$ 步预测（最后一个头产生剩余步数）。第 $j$
个头的输入是通道编码器输出与**前面所有头已生成的预测**的拼接：

$$ \\hat y\_{1}=W\_1 z,\\qquad \\hat y\_{j}=W\_j\\big\[z,|,\\hat
y\_{1},|\\cdots|,\\hat y\_{j-1}\\big\],\\quad j=2,\\dots,8,\\qquad \\hat
Y=\[\\hat y\_1,|\\cdots|,\\hat y\_8\] $$

其中：

  - $z\\in\\mathbb R^{d\_{model}}$：通道编码器对某个变量输出的表示；
  - $\\hat y\_j\\in\\mathbb R^{O/8}$：第 $j$ 段预测；$W\_j$：第 $j$ 个线性头，输入维度为
    $d\_{model}+(j-1)\\cdot O/8$；
  - 段与段之间是**半自回归**的：段内并行输出，段间依次依赖，既避免逐点自回归的慢与误差累积，又让后面的段参考前面的段 `[解读]`；
  - 论文把这一设计称为多步解码器（multi-step decoder），并在消融中检验了它的作用。

最后对输出做 RevIN 反归一化，得到最终预测。

## 3\. 组件汇总

| 组件      | 实现要点                          | 对应能力   |
| ------- | ----------------------------- | ------ |
| RevIN   | 对每个变量归一化/反归一化                 | 缓解分布漂移 |
| 多尺度块嵌入  | 4 个卷积，块长 8/16/24/32，拼接成 256 维 | 多时间粒度  |
| 时间编码器   | 块维度上的因果自注意力                   | 时间依赖   |
| 通道编码器   | 变量维度上的无掩码自注意力                 | 变量间相关  |
| 半自回归解码器 | 8 个线性头，逐段依赖前面段的预测             | 多步预测   |

表中：

  - 第一列是组件，第二列是代码里的主要做法，第三列是它承担的建模能力；
  - 默认超参数（来自官方实现）：$d\_{model}=256$、前馈隐层 512、16 个头、dropout 0.2、编码器层数
    1、回看长度 96、学习率 1e-4、batch size 32、训练 10 个 epoch、早停耐心 3。

## 4\. 实验与结论

  - 论文在七个真实数据集上评估，并报告与基线相比取得 SOTA、泛化更好（摘要）；官方仓库提供了
    ETTh1、ETTm1、Electricity、Traffic、Weather 的运行脚本；
  - 消融：去掉多尺度嵌入、去掉通道编码器、去掉多步解码器，用来验证三者各自的贡献；
  - 具体数字与对比表请以论文为准 `[待核实]`。

## 5\. 总结 \[解读\]

  - MultiPatchFormer 可以看作"PatchTST 的多块长版本 + 通道注意力 + 分段解码头"的组合，思路简单、模块清晰；
  - 局限：多尺度块长与步长是写死在代码里的超参数；通道编码器的注意力对变量数 $C$ 是平方复杂度，变量很多时开销变大；解码器头数固定为
    8，预测长度不能被 8 整除时由最后一个头补足。

## Reference

  - A multiscale model for multivariate time series forecasting.
    Scientific Reports 15, 1565 (2025). doi:10.1038/s41598-024-82417-4.
    <https://www.nature.com/articles/s41598-024-82417-4>
  - 官方代码：<https://github.com/bioinfoUQAM/MultiPatchFormer>
  - Nie Y 等. A Time Series is Worth 64 Words: Long-term Forecasting with
    Transformers (PatchTST). ICLR 2023.
  - Kim T 等. Reversible Instance Normalization for Accurate Time-Series
    Forecasting against Distribution Shift. ICLR 2022.
