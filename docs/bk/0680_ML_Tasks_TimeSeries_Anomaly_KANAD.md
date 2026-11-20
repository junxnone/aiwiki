-----

| Title     | ML Tasks TimeSeries Anomaly KANAD                     |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-20T09:17:38Z`                                |
| Updated @ | `2026-11-20T09:17:38Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/680) |

-----

# KANAD

KAN-AD 出自论文 *KAN-AD: Time Series Anomaly Detection with
Kolmogorov-Arnold Networks*（Quan Zhou、Changhua Pei、Fei Sun、Jing
Han、Zhengwei Gao、Haiming Zhang、Gaogang Xie、Dan Pei、Jianhui Li，ICML
2025，arXiv:2411.00278，代码
CSTCloudOps/KAN-AD）。它是一个面向\*\*单变量时间序列异常检测（TSAD）\*\*的轻量模型：**把"建模正常模式"重新表述为用光滑的单变量函数去逼近序列，并把
KAN 中的 B 样条换成截断傅里叶级数**，从而对局部扰动保持鲁棒。论文报告在四个 TSAD 基准上平均检测精度提升约 15%（最高超过
27%），可训练参数不到 1000 个，推理速度比原始 KAN 快约 50%。

**一句话概括：对滑动窗口做一阶差分与再归一化 → 用 $N$ 组正弦/余弦函数展开成 $T\\times 2N$ 的函数矩阵 →
用堆叠的小核一维卷积学习各函数的系数，合成"正常模式" → 一层线性层预测下一时刻 →
用预测值与观测值的偏差作为异常分数。**

> 标注约定：未标注的内容来自论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：同属频域/周期建模的
[FreTS](/0673_ML_Tasks_TimeSeries_Deep_FreTS)、[FiLM](/0676_ML_Tasks_TimeSeries_Deep_FiLM)；基线之一
[TimesNet](/0631_ML_Tasks_TimeSeries_Deep_TimesNet)；总览见
[时间序列任务](/0603_ML_Tasks_TimeSeries)；异常检测同类
[AnomalyTransformer](/0648_ML_Tasks_TimeSeries_Anomaly_AnomalyTransformer)、[TranAD](/0649_ML_Tasks_TimeSeries_Anomaly_TranAD)；总览另见
[异常检测](/0609_ML_Tasks_TimeSeries_Anomaly)。

## 1\. 解决什么问题

  - 基于预测的 TSAD 方法通过"预测值 vs
    观测值"的偏差判断异常，但真实序列常含**局部尖峰与骤降**；深度模型会过拟合这些局部扰动（论文
    Figure 2：TimesNet 在含噪训练数据上训练后检测失败）；
  - 先过滤再预测需要另一个模型，且难以定义通用的过滤标准；VAE 类方法假设正常模式在低维潜空间中可重构，但存在欠拟合；
  - 直接套用 KAN 也不行：KAN 的单变量函数用 B 样条，其**局部性**会把局部异常也拟合进去；
  - 有效的 TSAD 应当关注"正常行为的光滑局部模式"。

## 2\. 问题定义与理论背景

问题设定：给定单变量序列 $x\_{0:t}={x\_0,\\dots,x\_t}$ 与异常标签
$C={c\_0,\\dots,c\_t}$，用点 $x\_i$ 之前的数据 $\[x\_0,\\dots,x\_i\]$ 预测
$c\_i$。

其中：$x\_t\\in\\mathbb R$ 是观测值；$c\\in{0,1}$，1 表示异常；本文只处理单条曲线（UTS）。

**Kolmogorov-Arnold 表示定理**说明任意多元连续函数可以分解为单变量函数的有限和与复合：

$$
f(x\_1,\\dots,x\_n)=\\sum\_{q=1}^{2n+1}\\Phi\_q\!\\left(\\sum\_{p=1}^{n}\\phi\_{q,p}(x\_p)\\right)
$$

其中：

  - $\\phi\_{q,p}$：把每个输入变量 $x\_p$ 映射到一维的单变量连续函数；
  - $\\Phi\_q$：对内部求和结果再作用的单变量连续函数；
  - 按这一定理，KAN 用可学习的单变量函数取代 MLP 的"权重 + 固定激活"，原版 KAN 用 B 样条实现这些函数；B
    样条的局部逼近特性恰好使它容易拟合局部异常点。

## 3\. 模型结构

### 3.1 整体流程

KAN-AD 的流程分三个阶段：映射（mapping）、归约（reducing）、投影（projection）。

    滑动窗口 x_{0:i} ∈ R^T
       │ 一阶差分 + 重新归一化（常数项消除）
       ▼
    映射 mapping：展开成 N 个正弦 + N 个余弦单变量函数
       →  H ∈ R^{T×2N}
       ▼
    归约 reducing：L 个 [1D 卷积(核=3) → BatchNorm → GELU] 学系数
       → 与输入做残差 → 1 宽核卷积降维 → 当前窗口的"正常模式"
       ▼
    投影 projection：线性层预测下一时刻（未来的正常行为）
       ▼
    异常分数 = |预测 − 观测|（在线检测）

图中：

  - **映射**：把原始窗口变换成多个新的函数值通道；
  - **归约**：一维卷积核学习每个单变量函数的系数并加权求和，得到当前窗口的"正常模式"；
  - **投影**：线性层用正常模式预测未来，随后与实时观测比较得到异常分数；
  - 关键点：所有可学习的部分只有函数系数（边上的权重），函数本身是固定的正余弦——这是 KAN-AD 与原 KAN 的核心区别（论文
    Figure 3a），参数因此极少。

### 3.2 函数分解（Function Deconstruction, FD）

用傅里叶级数表示正常模式：把从历史窗口 $x\_{0:i}$ 到 $x\_{i+1}$ 的映射展开：

$$
f(x\_{0:i})=\\frac{A\_0}{2}+\\sum\_{n=1}^{\\infty}\\big\[A\_n\\cos(n,x\_{0:i})+B\_n\\sin(n,x\_{0:i})\\big\]\\approx
g(x)+\\epsilon,\\quad
g(x)=\\frac{A\_0}{2}+\\sum\_{n=1}^{N}\\big\[A\_n\\cos(n,x)+B\_n\\sin(n,x)\\big\]
$$

其中：

  - $A\_0$：常数项（窗口均值）；$A\_n,B\_n$：第 $n$ 项的余弦、正弦系数，是模型需要学习的量；
  - $N$：保留的项数；前 $N$ 项 $g(x)$ 代表**正常模式**，$N$ 项之后的高阶项被视为随机观测噪声
    $\\epsilon$；
  - 正弦、余弦的局部光滑性避免了对局部噪声的过拟合，其天然的周期性又能刻画全局模式；
  - 上式的具体写法（变量放进三角函数的方式）是按论文描述整理的 `[解读]`，细节以论文公式 (3)(4) 为准。

映射阶段把窗口信号 $x\_{0:i}\\in\\mathbb R^{T}$ 变成 $H\\in\\mathbb R^{T\\times
2N}$：$T$ 是滑动窗口长度，前 $N$ 列是 $N$ 个正弦函数，后 $N$ 列是 $N$ 个余弦函数。

### 3.3 常数项消除

傅里叶级数里的 $A\_0$
是窗口均值。即使整条序列已归一化为零均值，各个窗口的均值仍会因趋势而剧烈波动，这会干扰系数估计、使"正常模式"出现偏差。KAN-AD
的做法：预处理时对窗口做**一阶差分**以削弱残余趋势，再对差分结果**重新归一化**，这样只需学习 $A\_{1:n}$ 与
$B\_{1:n}$，不必学习频繁变化的常数项。差分之后，正常模式表示为 $\\hat
x\_{0:i}\\approx\\Delta(x\_{0:i})\\cdot H$ 的形式 `[待核实]`。

### 3.4 系数学习：堆叠一维卷积

先构造函数矩阵 $H^{(0)}$，再经过 $L$ 个卷积块逐步逼近正常模式：

$$
H^{(l)}=\\mathrm{GELU}\!\\big(\\mathrm{BN}(\\mathrm{Conv}(H^{(l-1)}))\\big),\\quad
l=1,\\dots,L;\\qquad \\hat
x=\\mathrm{DownConv}\\big(H^{(L)}+H^{(0)}\\big) $$

其中：

  - $\\mathrm{Conv}(\\cdot)$：核大小为 3 的一维卷积，对每个通道 $H\_c$
    沿时间窗口滑动；卷积核权重即待学习的函数系数；
  - $\\mathrm{BN}(\\cdot)$：批归一化，稳定训练、减少内部协变量偏移；$\\mathrm{GELU}$：激活函数；
  - $H^{(L)}+H^{(0)}$：隐藏状态与原输入的残差连接，保持数值稳定；
  - $\\mathrm{DownConv}(H)=\\sum\_{c=1}^{2N}W\_c\\cdot H\_c\[i\]$：宽度为 1
    的卷积核，把 $2N$ 个通道加权求和降成一维，得到当前窗口的正常模式 $\\hat x$；
  - 选择一维 CNN 的理由：它擅长沿时间遍历序列，卷积核天然适合处理函数分解带来的多种特征。

最后的**投影**阶段是一个线性层：

$$ \\hat x\_{i+1}=W,\\hat x+b $$

其中：$W$ 与 $b$ 是线性层的权重矩阵与偏置；$\\hat x\_{i+1}$ 是对下一时刻正常行为的预测，与观测值比较得到异常分数。

## 4\. 实验与结论

  - **数据集**：KPI、TODS、WSD、UCR 四个公开单变量数据集；每条曲线单独训练一个 KAN-AD，统一使用 batch
    size 1024、学习率 0.01、最多 100 个 epoch；五次随机种子取均值与标准差；
  - **评价指标**：除常用的 Best F1（点调整，易虚高）外，还采用 Delay F1（延迟点调整，延迟阈值 5）与 Event
    F1（把每个异常段视为长度为 1 的事件，避免长异常段导致的虚高），并以 Event F1 为主指标，AUPRC 为辅；
  - **基线**：LSTMAD、FCVAE、SRCNN、FITS、TimesNet、OFA、TranAD、SubLOF、Anomaly
    Transformer、KAN、SAND 等；
  - **精度**：平均 Event F1 相对已有最优方法提升超过 15%；在 TODS（训练数据含大量异常）上比 SOTA 高
    27%，体现对含噪训练数据的鲁棒性；在 WSD、KPI 等周期性强的数据上持平或更好；在
    UCR（训练集无异常但周期变化显著）上也能抓住正常模式；
  - **效率**：KAN-AD 仅需 274 个参数，比下一个最紧凑的 TranAD 少约 25%；对比之下 OFA 约 8192
    万参数，Anomaly Transformer、FCVAE、TimesNet 在 73k–4.75M 之间；
  - **超参数**：窗口 $T$ 越大越能学到正常模式；项数 $N$ 太少表达不足、太多会过拟合；最佳为 $T=96,\\ N=2$；即使
    $T=16,\\ N=1$ 在 UCR 上也能超过 SOTA；
  - **案例（UCR InternalBleeding10）**：TranAD、TimesNet
    在正常段周期性误报，OFA、LSTMAD、SubLOF、FITS
    对正常波动过于敏感，KAN-AD 在正常段保持低分、在异常段分数高。

## 5\. 总结 \[解读\]

  - KAN-AD 的关键是"把拟合局部扰动的能力主动限制住"：用光滑的傅里叶基 +
    极少的系数，让模型只能学到全局的、光滑的正常模式，局部异常自然表现为较大的残差；
  - 局限：论文主要面向单变量序列，多变量只做了补充评估；周期性不明显的序列上傅里叶基是否同样有效，需要看具体数据；详细数值请以论文为准。

## Reference

  - Zhou Q, Pei C, Sun F, Han J, Gao Z, Zhang H, Xie G, Pei D, Li J.
    KAN-AD: Time Series Anomaly Detection with Kolmogorov-Arnold
    Networks. ICML 2025. arXiv:2411.00278
  - Liu Z 等. KAN: Kolmogorov-Arnold Networks. ICLR 2025.
  - Wu H 等. TimesNet: Temporal 2D-Variation Modeling for General Time
    Series Analysis. ICLR 2023.
