-----

| Title     | ML Tasks TimeSeries Foundation TiRex                  |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-20T09:18:39Z`                                |
| Updated @ | `2026-11-20T09:18:51Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/681) |

-----

# TiRex

TiRex 出自论文 *TiRex: Zero-Shot Forecasting Across Long and Short Horizons
with Enhanced In-Context Learning*（NXAI / JKU Linz，NeurIPS
2025，arXiv:2505.23719）。它是一个**基于 xLSTM
的预训练零样本预测模型**。论文的出发点是：Transformer
虽有很强的上下文学习（in-context learning）能力，但在时间序列上常不及循环模型；LSTM
具备状态追踪（state-tracking）能力，却缺乏强的上下文学习；xLSTM 弥合了这一差距。TiRex
再配合一种训练时遮盖策略 **CPM（Contiguous Patch Masking）**，在 GiftEval 与
Chronos-ZS 两个榜单上刷新零样本预测的
SOTA，且超过体量大得多的模型（TabPFN-TS、Chronos-Bolt、TimesFM、Moirai
等）。

**一句话概括：z-score 归一化 + 不重叠分块（窗口 32）→ 两层残差块嵌入 → 堆叠的 sLSTM
块（decoder-only，带真正的循环状态）→ 残差块输出 9
个分位数；长预测时把未来输入当作缺失值，让内部记忆跨块传播预测状态与不确定性，训练时用
CPM 模拟这一过程。**

> 标注约定：未标注的内容来自论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：同类预训练预测模型
[Chronos](/0660_ML_Tasks_TimeSeries_Foundation_Chronos)、[TimesFM](/0654_ML_Tasks_TimeSeries_Foundation_TimesFM)、[Moirai](/0657_ML_Tasks_TimeSeries_Foundation_Moirai)、[TTM](/0655_ML_Tasks_TimeSeries_Foundation_TTM)、[Sundial](/0663_ML_Tasks_TimeSeries_Foundation_Sundial)；总览见
[时间序列基础模型](/0608_ML_Tasks_TimeSeries_Foundation)。

## 1\. 解决什么问题

  - **零样本预测**：模型在大规模语料 $\\mathcal C={D\_1,\\dots,D\_N}$
    上预训练，推理时直接用于未见过的数据集
    $D\_{test}$，不做任何微调；
  - 现有预训练模型多为 Transformer（Chronos 的编码器-解码器、Moirai 的 encoder-only、TimesFM
    的 decoder-only 等），在时间序列上未必占优（如 DLinear 可在多个场景超越 Transformer）；
  - **长预测的难题**：当预测长度超过一个输出块时，TimesFM、Chronos-Bolt
    等模型通常**自回归**地用上一步的点估计（均值或中位数）作为下一步输入，这会在每一步重置概率预测，破坏不确定性的传播；
  - TiRex 要同时做好短期与长期预测，并保持预测分布的连贯。

## 2\. 问题定义

给定序列 $(y\_1,\\dots,y\_T)$，预测未来 $h$ 步
$(y\_{T+1},\\dots,y\_{T+h})$；概率预测则学习条件分布：

$$ p\\big(y\_{T+1:T+h}\\mid y\_{1:T}\\big) $$

其中：

  - $y\_t\\in\\mathbb R$：时刻 $t$ 的取值；$T$：上下文长度；$h$：预测长度；
  - 概率预测不输出单个点估计，而是刻画未来取值的不确定性；
  - 零样本设置要求 $y\\in D\_{test}$ 且不属于任何训练数据集。

## 3\. 模型结构

### 3.1 整体流程

下图概括 TiRex 的数据流。

    输入序列 y_{0:T}
       │ z-score 实例归一化（记录均值 μ、标准差 σ）
       │ 切成不重叠窗口（长度 32），拼接"是否缺失"掩码
       ▼
    输入残差块（两层）：R^{2·m_in} → R^d   （所有窗口共享）
       ▼
    N 个 xLSTM 块（每块：RMSNorm→sLSTM→残差，RMSNorm→FFN→残差）
       ▼  最后再接一个 RMSNorm
    输出残差块：R^d → R^{m_out×|Q|}   （9 个分位数）
       │ 反归一化
       ▼
    各窗口的分位数预测

图中：

  - 输入层先归一化再分块，分块后序列长度缩短为原来的 $1/m\_{in}$；缺失值用 0/1 掩码标记；
  - 中间是堆叠的 xLSTM 块，使用 **sLSTM**（而不是 mLSTM）作为序列混合模块，因为只有 sLSTM
    支持状态追踪（代价是记忆容量较小）；每块含 sLSTM 与前馈网络，二者前面各有一个
    RMSNorm，并带残差跳连；
  - 输出层把隐状态映射回输出窗口，并给出 $|Q|=9$ 个等间隔分位数（0.1 到 0.9）；
  - 模型是 **decoder-only**：每个输出 token 对应一个预测块，训练时相当于"每读入一个 token
    就做一次预测"，推理时只关注最后几个输出窗口。

### 3.2 输入与输出层

实例归一化采用 z-score：

$$ \\tilde y\_{0:T}=\\frac{y\_{0:T}-\\mu^{y}*{0:T}}{\\sigma^{y}*{0:T}}
$$

其中：$\\mu^{y}*{0:T}$、$\\sigma^{y}*{0:T}$
是该样本的均值与标准差；归一化让模型对不同领域差异很大的数值尺度保持鲁棒，输出时再按此尺度还原到原始空间。

分块与嵌入：输入窗口大小为 $m\_{in}$、xLSTM 隐维度为 $d$，输入块定义映射 $\\mathbb
R^{2m\_{in}}\\to\\mathbb R^{d}$（"2"来自拼接的缺失掩码，所有窗口共享同一个残差块）；输出块定义映射
$\\mathbb R^{d}\\to\\mathbb R^{m\_{out}\\times|Q|}$。训练时上下文长度
2048，输入/输出窗口都取 32。

### 3.3 分位数损失

模型输出 9 个分位数 $Q={0.1,0.2,\\dots,0.9}$，用分位数损失（pinball loss）训练。对一个输出窗口：

$$ \\mathcal
L=\\frac{1}{|Q|,m\_{out}}\\sum\_{t=1}^{m\_{out}}\\sum\_{q\\in Q}
\\begin{cases} q,(y\_t-\\hat y^{q}\_t), & \\hat y^{q}\_t\\le
y\_t\\\[2pt\] (1-q),(\\hat y^{q}\_t-y\_t), & \\text{否则} \\end{cases} $$

其中：

  - $y\_t$：时刻 $t$ 的真实值；$\\hat y^{q}\_t$：分位数水平 $q$ 对应的预测值；
  - $m\_{out}$：输出窗口长度；$|Q|$：分位数个数，这里为 9；
  - 当预测低于真值时按 $q$ 加权惩罚，高于真值时按 $1-q$ 加权惩罚，这样第 $q$ 个输出会逼近条件分布的 $q$ 分位数；
  - 损失对每个输出 token 都计算，输出窗口里的缺失值被忽略；一个训练样本所有输出 token
    的损失取平均，所以并不区分"上下文"与"预测"，隐式地做"每个输入
    token 之后都预测"。

### 3.4 多块预测与 Contiguous Patch Masking（CPM）

当预测长度 $h$ 大于一个输出块时，需要预测多个未来块。TiRex
不用"点估计回灌"的自回归，而是把未来的输入**当作缺失值**喂给模型，让内部记忆（sLSTM
的状态）带着预测状态与**不确定性**一直传播，得到更连贯的概率预测。

为了让模型学会这种推理方式，提出 CPM（图
3）：预训练时随机遮盖**连续的整块**，被遮盖的块以"缺失值"形式输入，与推理时多块预测的输入形态一致。过程如下：对每个训练样本，先均匀采样连续遮盖块数
$c\_{mask}\\sim U(1,c^{max}*{mask})$ 与遮盖概率 $p*{mask}\\sim
U(0,p^{max}*{mask})$；再对长度为 $\\lceil T/(c*{mask},m\_{out})\\rceil$
的序列以伯努利概率 $p\_{mask}$ 采样二值掩码，把每个元素重复 $c\_{mask}\\cdot
m\_{out}$ 次，使掩码长度还原到 $T$。

其中：

  - $c\_{mask}$：一次连续遮盖的块数；$p\_{mask}$：每段被遮盖的概率；$c^{max}*{mask}$、$p^{max}*{mask}$：二者的上界超参数；
  - 相邻段都被遮盖时，实际连续遮盖的块数可超过 $c^{max}\_{mask}$；
  - CPM 借用了 BERT 式掩码建模的元素，但目标是右移的、信息流是单向的，所以训练仍更接近 decoder-only 的因果式训练。

### 3.5 训练数据与数据增强

  - **训练数据**共约 4750 万条样本，由三部分组成：Chronos 的训练集（配合 TSMixup 增强）、受
    KernelSynth 启发生成的合成序列、GiftEval 预训练集的一部分；
  - **三种数据增强**（图 3）：
    1.  **幅度调制（Amplitude Modulation）**：给序列引入趋势与尺度变化点；
    2.  **截断增强（Censor Augmentation）**：以随机阈值（从信号经验分布中均匀抽分位数）截断数值；
    3.  **尖峰注入（Spike Injection）**：叠加短暂、周期性的尖峰，核函数可为 tophat、RBF
        或线性，目的是让模型学到"瞬态事件"的一般概念而非记忆具体周期； 应用概率分别为
        0.5、0.5、0.05。

## 4\. 实验与结论

  - **基准**：Chronos Zero-Shot Benchmark（27 个数据集，以短期为主）与 GiftEval（24
    个数据集、97 个评测设置，覆盖短/中/长期与多种频率）；为保证零样本，从 GiftEval 排除与训练数据重叠的
    16 个设置，称 GiftEval-ZS；
  - **指标**：点预测用 MASE，概率预测用 CRPS（以 0.1–0.9 九个分位数的加权分位数损失 WQL
    近似）；各评测设置的得分先除以季节朴素基线再取几何平均，同时报告平均排名；
  - **对比模型**：零样本模型（Chronos、Chronos-Bolt、TimesFM v1.0/v2.0、Moirai
    1.1、TabPFN-TS、TTM）与按数据集单独训练的任务专用模型（PatchTST、TFT、DLinear、DeepAR、N-BEATS）；
  - **结果**：在 GiftEval-ZS 上，TiRex 在短期与长期预测上都稳定优于所有对手，CRPS 为
    0.411（六个种子的标准差 ±0.002）；在 Chronos-ZS 上也刷新 SOTA。

消融实验（Table 1）的结论汇总如下：

| 消融项  | 变体                                                                       | 结论                                                                             |
| ---- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| 多块预测 | ① 标准 decoder-only + 自回归推理；② 把 rollout 固定放在序列末尾的朴素多块训练；③ CPM              | 只有 CPM 既保持短期性能又获得强长期性能；①损害长期，②损害短期                                             |
| 数据增强 | 分别去掉每种增强、或全部去掉                                                           | 去掉任一增强都会在至少一个指标上变差，全部去掉退化最明显                                                   |
| 骨干网络 | 纯 sLSTM（TiRex）、纯 mLSTM、xLSTM\[i:j\] 混合、Transformer（RoPE）、Chronos-Bolt 架构 | 纯 sLSTM 最好，尤其是长期预测；纯 mLSTM 最差，但换回一个 sLSTM 块就接近 TiRex；Chronos-Bolt 架构始终不及 TiRex |

表中：

  - 第一列是被消融的组件，第二列是对比的变体，第三列是论文给出的结论；
  - 变体里 xLSTM\[i:j\] 表示 $i$ 个 sLSTM 块与 $j$ 个 mLSTM 块混合的架构；
  - 论文的解释 `[解读]`：sLSTM 的显式状态追踪可能有助于不确定性传播以及长期建模周期结构。

## 5\. 局限与展望

  - 与多数预训练预测模型一样，TiRex
    面向**单变量**序列，多变量被当作独立的单变量处理；后续可通过扩展上下文或改输入层引入多变量信息；
  - 由于算力限制，超参数没有被充分调优，只做了关键参数的敏感性分析；
  - 论文展望了把学到的表示用于分类、异常检测等下游任务。

## 6\. 总结 \[解读\]

  - TiRex 的两个关键点：用**可状态追踪的循环骨干（sLSTM）**代替纯 Transformer；用**CPM 训练 +
    缺失值推理**代替"点估计回灌"的自回归，保持长预测中的不确定性传播；
  - 模型相对小，却在零样本榜单上超过更大的 Transformer 模型；具体数值请以论文与榜单为准。

## Reference

  - Auer A, Podest P, Klotz D, Böck S, Klambauer G, Hochreiter S. TiRex:
    Zero-Shot Forecasting Across Long and Short Horizons with Enhanced
    In-Context Learning. NeurIPS 2025. arXiv:2505.23719
  - Beck M 等. xLSTM: Extended Long Short-Term Memory. NeurIPS 2024.
  - Ansari A F 等. Chronos: Learning the Language of Time Series. TMLR
    2024.
  - Aksu T 等. GIFT-Eval: A Benchmark for General Time Series Forecasting
    Model Evaluation. 2024.
