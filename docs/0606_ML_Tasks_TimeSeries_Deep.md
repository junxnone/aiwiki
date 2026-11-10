---
Title | ML Tasks TimeSeries Deep
-- | --
Created @ | `2026-11-10T09:17:24Z`
Updated @| `2026-11-10T09:17:24Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/606)

---
# 深度学习时间序列模型：方法详解、原理与发展脉络

> 读者：想弄清 RNN、CNN、MLP、Transformer、状态空间这几大类深度时序模型各自怎么做、为什么这样设计、哪些设计经得起检验、哪些只是基准上的现象的工程师和研究者。
>
> 配套文档：[总览](0603_ML_Tasks_TimeSeries)｜[经典统计模型](0604_ML_Tasks_TimeSeries_Classical)｜[机器学习](0605_ML_Tasks_TimeSeries_ML)｜[评估指标](0610_ML_Tasks_TimeSeries_Metrics)｜[生成式](0607_ML_Tasks_TimeSeries_Generative)｜[基础模型](0608_ML_Tasks_TimeSeries_Foundation)｜[时间线](0611_ML_Tasks_TimeSeries_Timeline)。
>
> 公式用 LaTeX 书写，需要支持数学渲染的 Markdown 查看器。
>
> 标注：**[V]** 书目信息经 Crossref 或 arXiv API 核对（标题、作者、年份、期刊与 DOI 或编号；arXiv 条目另读过摘要页，论述与摘要一致，不含全文核对）；**[经验]** 编者判断，需用自己的数据验证；**待核实** 凭记忆写出或书目核对不完全（对模型内部结构的细节描述，凡未读摘要或原文者，一律视为待核实）。方法的数学形式是标准内容，由编者归纳整理。本文不引用任何模型在具体基准上的得分，例子中的数字是为说明概念构造的。核对日期：2026-11-10。

## 0. 先看全景

深度学习路线用神经网络直接学习"历史窗口 → 未来窗口"的映射，不预设序列的随机过程形式。不同架构的差别在于**把什么归纳偏置写进了网络**：

| 架构 | 归纳偏置 | 代表 | 本文章节 |
|---|---|---|---|
| RNN / LSTM / GRU | 状态递推，顺序处理 | DeepAR、ES-RNN | §3.1 |
| CNN / TCN | 局部性、平移不变、膨胀卷积扩大感受野 | TCN、WaveNet、LSTNet、TimesNet | §3.2 |
| MLP / 线性 | 对窗口做全局线性或浅层非线性映射，常带分解 | N-BEATS、N-HiTS、DLinear、TSMixer、TimeMixer | §3.3 |
| Transformer | 内容相关的全局注意力 | Informer、Autoformer、FEDformer、PatchTST、iTransformer、TFT | §3.4 |
| 状态空间 SSM | 线性递推 + 可并行的卷积形式 | S4、Mamba、S-Mamba | §3.5 |
| 表示学习 / 自监督 | 对比或掩码重构得到通用表示 | TS2Vec、CoST、TF-C、SimMTM | §3.6 |
| 异常检测 | 重构、预测、关联差异 | Anomaly Transformer、TranAD | §3.7 |

一句话定位：**深度路线的优势是端到端、可处理复杂依赖、可跨序列共享并扩展到大数据；代价是对小而平稳的数据容易"白增方差"**。近几年最重要的认识是：在长期预测的常用基准上，**简单的线性/MLP 模型常与复杂 Transformer 打平**，所以设计新模型前必须先问"这个复杂度买到了什么"。

读完本文你应能回答：窗口、归一化、分解这些共同组件各自在做什么；为什么早期 Transformer 在预测上被线性模型质疑；patch 与通道独立为什么有效；"倒置"的 iTransformer 在改什么；SSM 与 Kalman 滤波有什么关系；异常检测里深度模型的证据是什么。

---

## 1. 基石概念

### 1.1 输入输出与训练设置

设回看长度 $L$（look-back），预测步长 $H$，通道数 $C$。样本为

$$X\in\mathbb R^{L\times C}\ \longrightarrow\ \hat Y\in\mathbb R^{H\times C}$$

训练在滑窗样本上用小批量随机梯度（常用 Adam，Kingma & Ba，arXiv:1412.6980 [V]）。多数现代深度预测模型是 **MIMO**：一次输出整个 $H$ 步，没有递归累积（对比[机器学习篇 §1.2](0605_ML_Tasks_TimeSeries_ML)）；自回归模型（DeepAR）则逐步采样。

### 1.2 损失函数

| 目标 | 损失 | 说明 |
|---|---|---|
| 点预测 | MSE、MAE、Huber | 长期预测基准多用 MSE 与 MAE，且在标准化后的尺度上计算（见 [metrics §5.2](0610_ML_Tasks_TimeSeries_Metrics)） |
| 概率预测 | 负对数似然（NLL）、分位数损失 | DeepAR 输出分布参数；TFT 输出分位数 |
| 业务指标 | 对齐评估的自定义损失 | 例如 MASE 型加权 |

### 1.3 可逆实例归一化（RevIN）

非平稳序列的均值与方差随时间漂移，训练期与测试期分布不同。**RevIN**（Kim et al., ICLR 2022，Crossref 本次未命中，书目待核实）的思想：对每个输入样本按其自身统计量标准化，输出再反变换：

$$\tilde x_{t}^{(k)}=\gamma_k\,\frac{x_t^{(k)}-\mu^{(k)}}{\sqrt{\sigma^{2(k)}+\epsilon}}+\beta_k,\qquad
\hat y_t^{(k)}=\sqrt{\sigma^{2(k)}+\epsilon}\cdot\frac{\tilde y_t^{(k)}-\beta_k}{\gamma_k}+\mu^{(k)}$$

其中 $\mu^{(k)},\sigma^{2(k)}$ 是第 $k$ 个通道在输入窗口内的均值与方差，$\gamma_k,\beta_k$ 是可学习的仿射参数。它让网络只学习"去掉水平和尺度之后的形状"，再把水平和尺度加回去，等价于一种**针对每个窗口的水平与尺度自适应**。PatchTST、DLinear 的变体（NLinear 的"减去最后一个值"思想与之同源）等许多模型采用类似做法 [经验]。

对机制的理论分析见 Li et al.（*Revisiting Long-term Time Series Forecasting: An Investigation on Linear Mapping*，[arXiv:2305.10721](https://arxiv.org/abs/2305.10721)）[V]：摘要报告可逆归一化显著改善趋势预测，因为它把非周期趋势变换成"类周期"形态。

### 1.4 分解

把窗口拆成趋势与季节余项，是深度模型从[经典分解](0604_ML_Tasks_TimeSeries_Classical)继承的最常用组件。常见实现是**移动平均**：

$$X_{\text{trend}}=\mathrm{AvgPool}\bigl(\mathrm{Padding}(X)\bigr),\qquad X_{\text{seasonal}}=X-X_{\text{trend}}$$

DLinear、Autoformer（序列分解块）、FEDformer、TimeMixer 都内置这类分解（具体实现细节待核实）。

### 1.5 Token 化与位置信息

Transformer 需要把序列变成 token 序列：

| 做法 | token 是什么 | 代表 |
|---|---|---|
| 时间点 token | 每个时间步（所有变量拼成向量）一个 token | 早期 Transformer 预测模型 |
| patch token | 连续若干时间点组成一个 patch | PatchTST |
| 变量 token | 每个变量的整条序列一个 token | iTransformer |

注意力本身对输入顺序**置换不变**，所以需要位置编码；DLinear 论文（arXiv:2205.13504 [V]）的论断是：自注意力的置换不变性会造成时序信息的损失，即使使用位置编码和子序列 token 也只能保留一部分顺序信息。

### 1.6 通道独立与通道混合

| 策略 | 做法 | 代表 | 风险 |
|---|---|---|---|
| **通道独立（CI）** | 每个变量作为一条独立序列，共享同一套参数 | PatchTST（摘要明确使用通道独立 [V]）、DLinear | 完全忽略变量间关系 |
| **通道混合 / 依赖（CD）** | 显式建模变量间交互 | iTransformer、TSMixer、Crossformer 等 | 变量多时易过拟合、成本高 |

[经验] 变量数多、各序列相对独立时 CI 更稳；变量间有明确物理耦合时值得试 CD；无论哪种，用自己的验证集决定。

### 1.7 复杂度与回看窗口

| 结构 | 时间复杂度（序列长度 $L$、隐维 $D$） | 说明 |
|---|---|---|
| RNN / LSTM | $O(L\,D^2)$，不可并行 | 逐步递推 |
| 一维卷积（核 $k$） | $O(L\,k\,D^2)$，可并行 | 感受野随深度/膨胀增长 |
| 全注意力 | $O(L^2D)$ | 长序列昂贵；Informer、Autoformer 等为此做高效变体 |
| patch 注意力（patch 长 $P$） | $O\bigl((L/P)^2D\bigr)$ | PatchTST 摘要指出 patch 使注意力图的计算与内存"quadratically reduced" [V] |
| 线性映射 | $O(LH)$ 参数与计算 | DLinear 一类，窗口越长参数越多 |
| SSM（Mamba） | $O(L\,D)$（线性） | 摘要称"linear-time" [V] |

**回看窗口的作用**：窗口越长，原则上信息越多，但噪声与过拟合风险也上升，且部分 Transformer 随窗口变长性能反而下降（iTransformer 摘要即指出 Transformer 在较大回看窗口下"performance degradation and computation explosion" [V]）。Scaling law 研究（*Scaling Law for Time Series Forecasting*，[arXiv:2405.15124](https://arxiv.org/abs/2405.15124)）[V] 对此给出理论：摘要说明更多训练数据有帮助，但更强的模型并不总胜过较弱的模型、较长回看窗口对部分模型反而有害，并提出一个把数据集大小、模型复杂度与回看窗口都考虑在内的理论来解释这些现象。**对每个模型都应搜索回看窗口**，而不是固定为同一个值（见 [metrics §5.2](0610_ML_Tasks_TimeSeries_Metrics)）。

### 1.8 小数据与过拟合

时序数据集往往很小（ETT 等基准仅数万个点），复杂模型的参数量常超过样本量，因此**过拟合与随机种子方差**是常态。对策：权重衰减、dropout、早停、较小的隐维、多种子汇报（见 [metrics §5.5](0610_ML_Tasks_TimeSeries_Metrics)）。

---

## 2. 发展脉络

年份与出处凡标 [V] 者书目信息已核对；其余待核实。

| 时代 | 事件 | 要点 |
|---|---|---|
| 1997 | LSTM（Hochreiter & Schmidhuber, *Neural Computation*）[V] | 门控缓解长程梯度问题 |
| 2014 | GRU（Cho et al., EMNLP）[V] | 更简的门控结构 |
| 2016–2017 | WaveNet（arXiv:1609.03499）[V]；LSTNet（arXiv:1703.07015）[V]；DeepAR（arXiv:1704.04110，*IJF* 2020）[V]；Transformer（arXiv:1706.03762）[V] | 因果膨胀卷积；CNN+RNN 混合；全局概率 RNN；注意力架构 |
| 2018 | TCN 实证评估（arXiv:1803.01271）[V]；ES-RNN（Smyl, *IJF* 2020）[V] | 通用 TCN 与 RNN 相当；统计与深度的混合在 M4 中表现突出 |
| 2019 | N-BEATS（arXiv:1905.10437）[V]；TFT（arXiv:1912.09363）[V]；LogTrans（arXiv:1907.00235）[V] | 纯 MLP 预测架构；多 horizon 协变量 Transformer；局部性与内存瓶颈 |
| 2020–2021 | Informer（arXiv:2012.07436）[V]；Autoformer（arXiv:2106.13008）[V]；S4（arXiv:2111.00396）[V]；TS2Vec（arXiv:2106.10466）[V]；Anomaly Transformer（arXiv:2110.02642）[V] | 长序列高效注意力；内置分解；结构化状态空间；通用表示；关联差异 |
| 2022 | FEDformer（arXiv:2201.12740）[V]；N-HiTS（arXiv:2201.12886）[V]；**DLinear**（arXiv:2205.13504）[V]；TimesNet（arXiv:2210.02186）[V]；**PatchTST**（arXiv:2211.14730）[V]；TranAD（arXiv:2201.07284）[V]；CoST、TF-C [V] | 频域增强；层级插值；**线性模型的挑战**；2D 变换通用骨干；patch 与通道独立 |
| 2023 | TSMixer（arXiv:2303.06053）[V]；**iTransformer**（arXiv:2310.06625）[V]；Mamba（arXiv:2312.00752）[V]；Koopa（arXiv:2305.18803）[V]；FITS、RLinear（arXiv:2307.03756、2305.10721）[V]；SimMTM（arXiv:2302.00861）[V] | 全 MLP；倒置的 Transformer；选择性 SSM；轻量线性与频域模型；掩码预训练 |
| 2024 | TimeMixer（arXiv:2405.14616）[V]；TimeXer（arXiv:2402.19072）[V]；SOFTS（arXiv:2404.14197）[V]；S-Mamba（arXiv:2403.11144）[V]；TimeMachine（arXiv:2403.09898）[V]；SparseTSF（arXiv:2405.00946）[V]；Scaling law（arXiv:2405.15124）[V] | 多尺度混合；外生变量；系列核心融合；Mamba 类预测；极小参数量；扩展规律 |

---

## 3. 各类方法详解

### 3.1 RNN / LSTM / GRU 与 DeepAR

#### 原理

LSTM（Hochreiter & Schmidhuber 1997 [V]）用门控控制信息的写入、遗忘与读出：

$$\begin{aligned}
f_t&=\sigma(W_f[h_{t-1},x_t]+b_f),\quad i_t=\sigma(W_i[h_{t-1},x_t]+b_i),\quad o_t=\sigma(W_o[h_{t-1},x_t]+b_o)\\
\tilde c_t&=\tanh(W_c[h_{t-1},x_t]+b_c),\quad c_t=f_t\odot c_{t-1}+i_t\odot\tilde c_t,\quad h_t=o_t\odot\tanh(c_t)
\end{aligned}$$

细胞状态 $c_t$ 以**加性**路径传递，缓解梯度消失。GRU（Cho et al. 2014 [V]）合并为更新门 $z_t$ 与重置门 $r_t$：$h_t=(1-z_t)\odot h_{t-1}+z_t\odot\tilde h_t$。

#### DeepAR

DeepAR（arXiv:1704.04110；*IJF* 2020 [V]）是该路线最有影响的预测模型：自回归 RNN 在**大量相关序列**上训练**一个全局模型**，每步输出分布参数：

$$h_{i,t}=\mathrm{RNN}\bigl(h_{i,t-1},\,y_{i,t-1},\,\mathbf x_{i,t}\bigr),\qquad \theta_{i,t}=\mathrm{proj}(h_{i,t}),\qquad
\mathcal L=-\sum_{i,t}\log \ell\bigl(y_{i,t}\mid\theta_{i,t}\bigr)$$

$\ell$ 为选定的似然（高斯、负二项、Student-t 等）。预测时对未来逐步**祖先采样**，把采样值喂回，得到多条样本路径，由此求分位数。输入按序列自身的尺度做缩放（具体缩放公式待核实）。

#### 优缺点

| | |
|---|---|
| **优点** | 全局模型借用跨序列信息、冷启动友好；天然概率预测；支持协变量与静态特征；对计数数据可用负二项似然 |
| **缺点** | 顺序计算难并行；自回归采样有**误差累积**与"暴露偏差"；超长依赖建模不如注意力/线性模型 [经验] |
| **适用** | 序列条数多的业务预测（需求、容量）、需要预测分布的场景 |

**ES-RNN**（Smyl, *IJF* 2020 [V]）把指数平滑的分层参数与 RNN 结合，是 M4 的亮点（具体名次待核实），属于"统计结构 + 神经网络"的早期代表。

### 3.2 卷积网络：TCN、WaveNet、LSTNet、TimesNet

#### TCN 与 WaveNet

**因果膨胀卷积**：对输入 $x$，膨胀系数 $d$、核大小 $k$ 的因果卷积为

$$F(s)=\sum_{i=0}^{k-1}f(i)\cdot x_{s-d\,i}$$

只看过去，不泄漏未来。逐层令 $d=2^{\ell}$，$\ell=0,1,\dots,N-1$，则感受野为 $1+(k-1)(2^{N}-1)$，随深度**指数**增长。Bai et al.（*An Empirical Evaluation of Generic Convolutional and Recurrent Networks for Sequence Modeling*，arXiv:1803.01271）[V] 的实证结论是：通用的 TCN 架构在多种序列建模任务上可与典型 RNN 相当或更好；WaveNet（arXiv:1609.03499 [V]）是其在音频生成上的先驱。

#### LSTNet

LSTNet（arXiv:1703.07015 [V]）把卷积（捕捉短期局部模式）与循环结构（捕捉长期依赖）结合，用于多变量预测；具体结构（含周期性跳跃连接、自回归分量）待核实。

#### TimesNet：把周期折叠成 2D

TimesNet（arXiv:2210.02186 [V]）是面向预测、填补、分类、异常检测的**通用骨干**。核心思想（依原文印象，内部细节待核实）：先用快速傅里叶变换找到主要周期，再把一维序列按周期**折叠**成二维张量，使"周期内变化"与"周期间变化"分别成为二维张量的两个轴，用 2D 卷积（Inception 式）同时建模：

$$A=\mathrm{Avg}\bigl(\mathrm{Amp}(\mathrm{FFT}(X))\bigr),\qquad \{f_1,\dots,f_k\}=\arg\mathrm{Top}\text{-}k(A),\qquad p_i=\Bigl\lceil\frac{T}{f_i}\Bigr\rceil$$

再对 $k$ 个周期对应的二维表示做自适应聚合（按幅值加权）。

#### 优缺点

| | |
|---|---|
| **优点** | 可并行；感受野可控；参数量适中；对局部形状（尖峰、周期形态）敏感 |
| **缺点** | 感受野固定，难建模超长依赖；对变长输入和不规则采样需额外处理 |
| **适用** | 高采样率信号的分类与异常检测、周期性明显的预测 |

### 3.3 MLP 与线性模型

这是近年最值得注意的一类：**用很简单的模型达到很强的结果，并倒逼评估规范化**。

#### N-BEATS 与 N-HiTS

N-BEATS（arXiv:1905.10437 [V]）是纯全连接的堆叠，每个块输出对输入的**回看补偿**（backcast）和对未来的**预测**（forecast），并采用**双重残差**：

$$\hat x_\ell,\ \hat y_\ell=\mathrm{Block}_\ell(x_\ell),\qquad x_{\ell+1}=x_\ell-\hat x_\ell,\qquad \hat y=\sum_{\ell}\hat y_\ell$$

可解释版本（依原文印象，细节待核实）把块输出约束为**多项式基**（趋势）与**傅里叶基**（季节），使分解可读。N-HiTS（arXiv:2201.12886 [V]）加入多速率输入池化与层级插值：不同块处理不同频率，低频块输出缩短后插值到完整 $H$，降低长 horizon 的计算量。NBEATSx（arXiv:2104.05522 [V]）扩展到外生变量，以电价预测为应用。

#### DLinear / NLinear

*Are Transformers Effective for Time Series Forecasting?*（arXiv:2205.13504；AAAI 2023 [V]）提出一组"embarrassingly simple"的**单层线性模型**（LTSF-Linear）。DLinear 先分解再线性：

$$X_t=\mathrm{AvgPool}\bigl(\mathrm{Padding}(X)\bigr),\quad X_s=X-X_t,\qquad \hat Y=W_s X_s+W_t X_t,\qquad W_s,W_t\in\mathbb R^{H\times L}$$

权重对所有通道共享（通道独立）。NLinear 先减去窗口最后一个值、线性映射后再加回（依原文印象）。参数量约 $2LH$。该文摘要报告：这些线性模型在其选用的长期预测基准上优于当时的 Transformer 方法，作者认为自注意力的**置换不变性**造成时序信息损失，因此质疑 Transformer 在该任务上的有效性 [V]。

**"线性为什么够用"的理论线索**：RLinear 一文（arXiv:2305.10721 [V]）的摘要报告：在常用基准上"affine mapping dominates forecasting performance"，不同模型学到相似的转移矩阵；仿射映射能有效捕捉周期模式，但对非周期信号或各通道周期不同的序列有困难；并说明可逆归一化和延长输入窗口对稳健性的影响。联系[经典篇 §1.5–§1.8](0604_ML_Tasks_TimeSeries_Classical)：周期信号的最优预测本就是线性的（AR 与傅里叶外推），所以线性映射抓住周期结构并不意外 [经验]。

**极轻量化的继续**：FITS（arXiv:2307.03756 [V]）在**复频域**做插值并丢弃高频，约 $10$k 参数；SparseTSF（arXiv:2405.00946 [V]）用"跨周期稀疏预测"解耦周期与趋势，参数量不到 $1$k，摘要称其性能与最先进相当或更优。

#### TSMixer 与 TimeMixer

- **TSMixer**（arXiv:2303.06053 [V]）：全 MLP，在**时间维**和**特征维**交替做混合；摘要称在学术基准上与专用最先进模型相当，并在 M5 零售数据上表现更好，强调高效利用跨变量与辅助信息的重要性。
- **TimeMixer**（arXiv:2405.14616 [V]）：把"不同采样尺度呈现不同模式"作为出发点，用**可分解的多尺度混合**：PDM 块在多尺度序列上分解并沿细→粗与粗→细两个方向混合季节与趋势，FMM 块融合多个预测器。

#### 优缺点

| | |
|---|---|
| **优点** | 参数少、训练快、可部署到边缘；难以过拟合；是对复杂模型的**必备对照**；周期明显的数据上很强 |
| **缺点** | 回看窗口越长参数越多（线性映射）；对非周期、强非线性、跨变量复杂交互的表达有限；在复杂协变量场景需 TSMixer 一类结构 |
| **适用** | 长期预测基线；资源受限场景；先验认为"趋势 + 季节"占主导的数据 |

### 3.4 Transformer

#### 注意力

$$\mathrm{Attn}(Q,K,V)=\mathrm{softmax}\!\Bigl(\frac{QK^{\top}}{\sqrt{d_k}}\Bigr)V$$

（Vaswani et al.，arXiv:1706.03762 [V]）复杂度 $O(L^2d)$，对长序列昂贵。

#### 第一阶段（2019–2022）：为长序列降复杂度

| 模型 | 要点 |
|---|---|
| **LogTrans**（arXiv:1907.00235 [V]） | 用卷积增强局部性（"enhancing the locality"）、稀疏注意力突破内存瓶颈 |
| **Informer**（arXiv:2012.07436 [V]） | **ProbSparse** 自注意力：只保留"最活跃"的查询，复杂度降到约 $O(L\log L)$；自注意力蒸馏；一次性生成式解码器（细节待核实）。稀疏度度量大致为 $M(q_i,K)=\ln\sum_j e^{q_ik_j^\top/\sqrt d}-\frac1L\sum_j\frac{q_ik_j^\top}{\sqrt d}$（依原文印象，待核实） |
| **Autoformer**（arXiv:2106.13008 [V]） | 序列分解模块内置于网络；**自相关**机制取代点积注意力：用自相关系数挑出 top-$k$ 的时间延迟并做延迟聚合；自相关可经 FFT 计算 $\mathcal R=\mathcal F^{-1}\bigl(\mathcal F(x)\,\overline{\mathcal F(x)}\bigr)$（依 Wiener–Khinchin 定理，细节待核实） |
| **FEDformer**（arXiv:2201.12740 [V]） | 在**频域**做增强的分解 Transformer，利用傅里叶或小波变换在频域保留少量模式 |

#### 转折：DLinear 质疑

DLinear 论文（[V]，见 §3.3）报告简单线性模型在选定基准上胜过上述 Transformer，作者以置换不变性解释。此后几乎所有论文都需与线性基线对比；**这条质疑促使人们重新设计 token 的方式**，而不是继续改注意力本身。

#### 第二阶段：重新设计 token

- **PatchTST**（arXiv:2211.14730 [V]）：两个关键设计：① 把序列切成**子序列级 patch** 作为 token；② **通道独立**，每个变量共享同一套嵌入和 Transformer 权重。摘要给出 patch 的三重好处：保留局部语义信息；在相同回看窗口下注意力图的计算和内存二次地降低；模型能关注更长历史。patch 数（长度 $P$、步长 $S$、末端填充）：

  $$N=\Bigl\lfloor\frac{L-P}{S}\Bigr\rfloor+2$$

  该文同样用于**自监督预训练**，摘要称在大数据集上微调优于有监督训练，并可跨数据集迁移掩码预训练表示。

- **iTransformer**（arXiv:2310.06625 [V]）：不改动 Transformer 的基本组件，只**倒置**输入维度。把每个变量的整条序列嵌入为一个**变量 token**，注意力在变量之间捕捉多元相关；前馈网络对每个变量 token 学习非线性的时间表示：

  $$\mathbf h_c^{0}=\mathrm{Embed}\bigl(X_{:,c}\bigr),\quad \mathbf h^{\ell+1}=\mathrm{TrmBlock}\bigl(\mathbf h^{\ell}\bigr),\quad \hat Y_{:,c}=\mathrm{Proj}\bigl(\mathbf h_c^{L}\bigr)$$

  动机（摘要）：时间点 token 把不同物理含义的变量混在一个嵌入里，可能导致"meaningless attention maps"，并且在较大回看窗口下性能退化。

- **TimeXer**（arXiv:2402.19072 [V]）：对内生序列与外生变量分别处理，用于带外生变量的预测；**SOFTS**（arXiv:2404.14197 [V]）：用"系列核心融合"（series-core fusion）降低变量间交互的成本。

- **TFT**（Temporal Fusion Transformer，arXiv:1912.09363；*IJF* 2021 [V]）：面向**多 horizon、含静态/已知未来/仅历史协变量**的预测，输出分位数。结构上通常包含变量选择网络、门控残差网络、LSTM 编码器-解码器与可解释的多头注意力（依原文印象，细节待核实）。它是业务预测中最常被引用的 Transformer 变体之一，因为它**显式支持协变量并给出注意力层面的可解释性** [经验]。

#### 优缺点

| | |
|---|---|
| **优点** | 内容相关的全局依赖；patch/变量 token 等设计可扩展；可用于自监督预训练；TFT 适合含协变量的多 horizon 业务预测 |
| **缺点** | 在许多长期预测基准上相对线性模型的增益有限（[V] DLinear）；数据小时易过拟合；注意力成本随长度增长；对 token 设计敏感 |
| **适用** | 变量多且相关明确、数据量充足、需要协变量与可解释性（TFT）或长依赖的场景 |

### 3.5 状态空间模型（SSM）与 Mamba

#### 连续时间 SSM 与离散化

$$x'(t)=Ax(t)+Bu(t),\qquad y(t)=Cx(t)$$

按步长 $\Delta$ 做零阶保持（ZOH）离散化（标准结果，细节以原文为准，待核实）：

$$\bar A=e^{\Delta A},\qquad \bar B=(\Delta A)^{-1}\bigl(e^{\Delta A}-I\bigr)\Delta B,\qquad x_k=\bar A x_{k-1}+\bar B u_k,\quad y_k=C x_k$$

这是[经典篇 §3.6](0604_ML_Tasks_TimeSeries_Classical) 的**线性状态空间模型**的深度版本：状态递推、线性观测。线性使得它同时有**两种等价形式**：

- **递推形式**：推理时 $O(1)$ 每步，适合在线；
- **卷积形式**：训练时展开为一个长卷积 $K=(C\bar B,\ C\bar A\bar B,\ C\bar A^2\bar B,\dots)$，可用 FFT 并行计算。

**S4**（*Efficiently Modeling Long Sequences with Structured State Spaces*，arXiv:2111.00396 [V]）通过对 $A$ 的结构化参数化（HiPPO 初始化等，细节待核实）让这种模型能稳定高效地建模**超长依赖**。

#### Mamba：选择性

**Mamba**（arXiv:2312.00752 [V]）让 SSM 的参数**依赖输入**：$\Delta,B,C$ 成为输入 $u$ 的函数（"selective"），使模型能按内容选择记住或忽略信息；配合硬件感知的并行扫描，摘要称实现"linear-time"序列建模。

#### 时序应用

- **S-Mamba**（*Is Mamba Effective for Time Series Forecasting?*，arXiv:2403.11144 [V]）：用线性层把每个变量的序列分别 token 化，**双向 Mamba** 提取变量间相关，前馈网络学习时间依赖，线性映射得到预测；
- **TimeMachine**（arXiv:2403.09898 [V]）：用四个 Mamba 组合统一处理通道混合与通道独立，多尺度地捕捉全局与局部上下文。

#### 优缺点

| | |
|---|---|
| **优点** | 线性复杂度；长序列友好；训练可并行、推理可递推；与 Kalman/ETS 同族，具备明确的状态语义 |
| **缺点** | 在时序预测基准上相对强线性/MLP/Transformer 基线的稳定优势**仍待更多独立验证** [经验]；实现依赖专门算子；离散化与初始化敏感 |
| **适用** | 超长序列、需要在线递推推理的场合 |

### 3.6 表示学习与自监督

**目的**：在标签稀缺时，从无标签序列学到通用表示，再用于分类、预测、异常检测。

| 方法 | 思想 |
|---|---|
| **TS2Vec**（arXiv:2106.10466 [V]） | 在多个层级上做对比学习，得到任意子序列粒度的通用表示（"universal representation"） |
| **CoST**（arXiv:2202.01575 [V]） | 解耦的**季节-趋势**表示，面向预测 |
| **TF-C**（arXiv:2206.08496 [V]） | **时频一致性**的对比预训练 |
| **SimMTM**（arXiv:2302.00861 [V]） | 掩码时序建模的预训练框架 |
| **PatchTST 自监督**（[V]） | patch 级掩码重构预训练 |

两类基本目标（标准形式）：

$$\mathcal L_{\text{InfoNCE}}=-\log\frac{\exp\bigl(\mathrm{sim}(z,z^{+})/\tau\bigr)}{\exp\bigl(\mathrm{sim}(z,z^{+})/\tau\bigr)+\sum_{z^{-}}\exp\bigl(\mathrm{sim}(z,z^{-})/\tau\bigr)},\qquad
\mathcal L_{\text{mask}}=\frac{1}{\lvert\mathcal M\rvert}\sum_{t\in\mathcal M}\lVert x_t-\hat x_t\rVert^2$$

**风险**：对比学习中"正样本对"的构造（如何增强才不破坏时间语义）高度依赖数据；预训练收益与数据量、与下游任务的匹配度强相关 [经验]。这条线是通往[基础模型](0608_ML_Tasks_TimeSeries_Foundation)的桥梁。

### 3.7 异常检测

| 类型 | 做法 | 异常分数 |
|---|---|---|
| **重构类** | 自编码器（含 LSTM-AE、Transformer）重构窗口 | $\lVert x-\hat x\rVert^2$ |
| **预测类** | 预测下一步或下一段，看偏差 | $\lVert x_{t+1}-\hat x_{t+1}\rVert$ |
| **关联类** | **Anomaly Transformer**（arXiv:2110.02642 [V]）提出**关联差异**：异常点难以与整条序列建立强关联，而更多关注邻近点；通过比较"先验关联"与"序列关联"的差异定义分数（具体公式，如两个分布间的对称 KL，依原文印象，待核实） |
| **对抗 / 自条件类** | **TranAD**（arXiv:2201.07284 [V]）：深度 Transformer 加对抗训练与自条件机制处理多变量异常 |

**证据与评估**：

- Audibert et al.（arXiv:2204.01637 [V]）比较 16 种传统、机器学习和深度方法，摘要结论是"no family of methods outperforms the others"；
- 深度时序异常检测综述见 arXiv:2211.05244 [V]；
- **评估协议比模型本身更能决定结论**：point-adjust 会严重高估性能（Kim et al.，arXiv:2109.05257 [V]），详见 [metrics §3.3](0610_ML_Tasks_TimeSeries_Metrics)。

[经验] 部署前先跑传统基线（见[机器学习篇 §3.6](0605_ML_Tasks_TimeSeries_ML)），并报告不依赖 point-adjust 的结果。

---

## 4. 方法总览对比

| 方法 | 归纳偏置 | 多变量 | 协变量 | 概率输出 | 复杂度（对长度） | 典型局限 |
|---|---|---|---|---|---|---|
| LSTM / GRU / DeepAR | 状态递推 | 可 | 强（DeepAR） | 是（DeepAR） | 线性，不可并行 | 误差累积、长依赖弱 |
| TCN / WaveNet | 因果膨胀卷积 | 可 | 可 | 视实现 | 线性，可并行 | 感受野固定 |
| TimesNet | 周期折叠 + 2D 卷积 | 可 | 可 | 否（原文以点预测为主） | 与周期数相关 | 依赖主周期检测 |
| N-BEATS / N-HiTS | 残差 MLP | 弱 | 有限（NBEATSx 扩展） | 否 | 线性 | 协变量与多变量弱 |
| DLinear / NLinear / FITS / SparseTSF | 线性映射 + 分解 / 频域 | CI | 弱 | 否 | $O(LH)$ 或更低 | 非周期、非线性表达有限 |
| TSMixer / TimeMixer | 时间与特征混合的 MLP | 强 | 可 | 否 | 线性 | 变量多时参数与过拟合 |
| Informer / Autoformer / FEDformer | 高效注意力 / 自相关 / 频域 | 可 | 有限 | 否 | 次二次 | 基准上增益不稳（[V] DLinear） |
| PatchTST | patch + CI | CI | 弱 | 否 | $O((L/P)^2)$ | 忽略变量交互 |
| iTransformer / SOFTS | 变量 token | CD | 有限 | 否 | 随变量数 | 变量极多时成本 |
| TFT | 门控 + 注意力 + 协变量 | 可 | **强** | 是（分位数） | 中 | 结构复杂、调参多 |
| S4 / Mamba 类 | 线性递推（选择性） | 可 | 可 | 否 | 线性 | 优势待独立验证 |
| TS2Vec / SimMTM 等 | 对比 / 掩码表示学习 | 可 | — | — | 视骨干 | 增强与数据依赖 |
| Anomaly Transformer / TranAD | 关联差异 / 对抗自条件 | 可 | 否 | 分数 | 注意力 | 评估协议敏感 |

---

## 5. 发展趋势

下面各条分"事实"（基于上述已核对文献）与"判断"（编者 [经验]，需持续观察）。

### 5.1 "更复杂"不等于"更好"：基线与评估回归

- **事实**：DLinear（[V]）的摘要质疑 Transformer 在 LTSF 上的有效性；RLinear（[V]）指出仿射映射在基准上起主导作用；FITS、SparseTSF（[V]）把参数量压到约 $10$k 与不到 $1$k 仍具竞争力；Scaling law 研究（[V]）说明更强的模型并不总胜过较弱的模型；TFB（arXiv:2403.20150 [V]）把现有基准对传统方法的刻板偏见列为缺陷之一；Hewamalage 等人（arXiv:2203.10716 [V]）系统总结了预测评估的常见陷阱。
- **判断**：**基线完整、协议公平、多种子汇报**会成为评审门槛；在小而平稳的基准上，新架构的差距常落在噪声内 [经验]。

### 5.2 Token 设计比注意力改造更重要

- **事实**：从 Informer 系的"降复杂度"，到 PatchTST 的 patch + 通道独立、iTransformer 的变量 token（[V]）。
- **判断**：重要的是"一个 token 应当代表什么"（局部片段、整条变量序列、某个尺度），而不是注意力公式如何改 [经验]。

### 5.3 多尺度、分解、频域成为通用积木

- **事实**：Autoformer、FEDformer、TimesNet、TimeMixer、FITS、SparseTSF（[V]）都用到分解、周期或频域，这些来自[经典统计思想](0604_ML_Tasks_TimeSeries_Classical)。
- **判断**：深度模型里最稳定的增益，往往来自把经典的**分解与周期结构**做成可学习模块 [经验]。

### 5.4 SSM 与线性递推的回归

- **事实**：S4、Mamba、S-Mamba、TimeMachine（[V]）把线性状态空间与现代并行训练结合。
- **判断**：线性递推结构因为同时给出长依赖、线性复杂度与可递推推理，会继续是重要方向，但**需要独立、公平的评测来确认相对强 MLP/Transformer 基线的优势** [经验]。

### 5.5 从"每个数据集一个模型"到预训练

- **事实**：PatchTST 的自监督预训练、TS2Vec/SimMTM 等表示学习（[V]）已显示预训练迁移的可行性，并发展出一系列[时序基础模型](0608_ML_Tasks_TimeSeries_Foundation)。
- **判断**：数据充足、领域多样时预训练有用；数据小时，简单模型加好评估仍是更稳的起点 [经验]。

### 5.6 异常检测：协议与基线

- **事实**：Audibert 等人（[V]）结论；point-adjust 问题（[V]）。
- **判断**：深度异常检测要靠严格协议证明自己 [经验]。

---

## 6. 实践建议 [经验]

**推荐流程**

1. 先做经典基线与机器学习基线（[经典篇 §6](0604_ML_Tasks_TimeSeries_Classical)、[机器学习篇 §6](0605_ML_Tasks_TimeSeries_ML)）；
2. 加一个**线性/MLP 深度模型**（DLinear、N-HiTS）作为深度基线；
3. 对每个模型**搜索回看窗口**，使用 RevIN 或等价的归一化；
4. 只有上述在滚动评估下仍有差距，再试 PatchTST、iTransformer、TFT（需要协变量时）、TimesNet 等；
5. **多种子**（至少 3–5 个）报告均值与标准差；
6. 数据量大且跨领域时，再考虑预训练与[基础模型](0608_ML_Tasks_TimeSeries_Foundation)。

**训练细节**

| 项 | 建议 |
|---|---|
| 归一化 | 按训练集统计量标准化；每窗口用 RevIN；不要用全量统计量 |
| 切分 | 严格按时间；验证集用于早停与超参，测试集只用一次 |
| 窗口 | 对每个模型独立搜索 $L$ |
| 正则 | 权重衰减、dropout、早停、较小隐维 |
| 损失 | 与评估指标对齐；需要区间时用分位数或分布 NLL |
| 评估 | 滚动起点；报告 MASE/WAPE 等业务可读指标，不只用标准化 MSE |

**常见错误**

- 只在 ETT 一类小基准上比较，把噪声内的差距当作改进；
- 回看窗口只给自己的方法调；
- 标准化统计量用了测试期；
- 丢弃最后不足一个 batch 的测试样本（drop-last）导致结果不可比；
- 把 point-adjust 后的异常检测 $F_1$ 与不使用 PA 的结果混比。

**工具**（版本与接口以官方文档为准，待核实）

| 用途 | 库 |
|---|---|
| 概率预测 | GluonTS（arXiv:1906.05264 [V]）、PyTorch Forecasting |
| 统一预测库 | Darts、NeuralForecast |
| 基准与复现 | Time-Series-Library（TSLib）、TFB（arXiv:2403.20150 [V]） |

---

## 7. 深度路线的局限

- **小数据易过拟合**：参数量常超过样本量，随机种子方差大；
- **基准饱和**：常用数据集小、差距落在噪声内；
- **协变量支持参差**：多数长期预测模型只吃历史值，只有 TFT、TimeXer、NBEATSx 等明确支持外生变量；
- **概率输出非默认**：多数架构只给点预测，概率化需要额外设计；
- **长依赖与长窗口并不总有益**（[V] iTransformer、Scaling law）；
- **可解释性弱**：不如状态空间/ETS 的分量语义清晰；
- **部署成本**：注意力类模型对延迟、内存敏感。

这些局限正是[生成式](0607_ML_Tasks_TimeSeries_Generative)（概率分布）、[基础模型](0608_ML_Tasks_TimeSeries_Foundation)（预训练与零样本）出场的空间，但并不改变"先跑简单基线"的建议。

---

## 来源与核对状态

**[V]：书目信息经 Crossref API 与 arXiv API 核对（2026-11-10）**。核对仅指标题、作者、年份、期刊或编号一致；arXiv 条目另读过摘要页（部分模型的内部结构描述未读全文，已标待核实）。

**Crossref 核对（标题、年份、期刊、DOI）**

| 文献 | DOI |
|---|---|
| Hochreiter & Schmidhuber 1997, *Neural Computation*（LSTM） | 10.1162/neco.1997.9.8.1735 |
| Cho et al. 2014, EMNLP（GRU / RNN Encoder–Decoder） | 10.3115/v1/d14-1179 |
| Salinas, Flunkert, Gasthaus, Januschowski 2020, *IJF*（DeepAR） | 10.1016/j.ijforecast.2019.07.001 |
| Smyl 2020, *IJF*（ES-RNN） | 10.1016/j.ijforecast.2019.03.017 |
| Lim, Arık, Loeff, Pfister 2021, *IJF*（TFT） | 10.1016/j.ijforecast.2021.03.012 |
| Zhou et al. 2021, AAAI（Informer） | 10.1609/aaai.v35i12.17325 |
| Zeng et al. 2023, AAAI（DLinear） | 10.1609/aaai.v37i9.26317 |
| Oreshkin et al. 2021, AAAI（N-BEATS 的元学习扩展版，Crossref 命中的是该扩展论文） | 10.1609/aaai.v35i10.17115 |
| Wen et al. 2023, IJCAI（Transformers in Time Series: A Survey） | 10.24963/ijcai.2023/759 |
| Benidis et al. 2022, *ACM Comput. Surv.*（深度预测教程与综述） | 10.1145/3533382 |

**arXiv 编号经 API 核对**：[1412.6980](https://arxiv.org/abs/1412.6980)（Adam）、[1706.03762](https://arxiv.org/abs/1706.03762)（Attention Is All You Need）、[1609.03499](https://arxiv.org/abs/1609.03499)（WaveNet）、[1703.07015](https://arxiv.org/abs/1703.07015)（LSTNet）、[1704.04110](https://arxiv.org/abs/1704.04110)（DeepAR）、[1803.01271](https://arxiv.org/abs/1803.01271)（TCN）、[1905.10437](https://arxiv.org/abs/1905.10437)（N-BEATS）、[2104.05522](https://arxiv.org/abs/2104.05522)（NBEATSx）、[1912.09363](https://arxiv.org/abs/1912.09363)（TFT）、[1907.00235](https://arxiv.org/abs/1907.00235)（LogTrans）、[2012.07436](https://arxiv.org/abs/2012.07436)（Informer）、[2106.13008](https://arxiv.org/abs/2106.13008)（Autoformer）、[2201.12740](https://arxiv.org/abs/2201.12740)（FEDformer）、[2201.12886](https://arxiv.org/abs/2201.12886)（N-HiTS）、[2205.13504](https://arxiv.org/abs/2205.13504)（DLinear）、[2210.02186](https://arxiv.org/abs/2210.02186)（TimesNet）、[2211.14730](https://arxiv.org/abs/2211.14730)（PatchTST）、[2303.06053](https://arxiv.org/abs/2303.06053)（TSMixer）、[2310.06625](https://arxiv.org/abs/2310.06625)（iTransformer）、[2402.19072](https://arxiv.org/abs/2402.19072)（TimeXer）、[2404.14197](https://arxiv.org/abs/2404.14197)（SOFTS）、[2405.14616](https://arxiv.org/abs/2405.14616)（TimeMixer）、[2305.10721](https://arxiv.org/abs/2305.10721)（RLinear）、[2307.03756](https://arxiv.org/abs/2307.03756)（FITS）、[2405.00946](https://arxiv.org/abs/2405.00946)（SparseTSF）、[2305.18803](https://arxiv.org/abs/2305.18803)（Koopa，仅核对标题）、[2111.00396](https://arxiv.org/abs/2111.00396)（S4）、[2312.00752](https://arxiv.org/abs/2312.00752)（Mamba）、[2403.11144](https://arxiv.org/abs/2403.11144)（S-Mamba）、[2403.09898](https://arxiv.org/abs/2403.09898)（TimeMachine）、[2106.10466](https://arxiv.org/abs/2106.10466)（TS2Vec）、[2202.01575](https://arxiv.org/abs/2202.01575)（CoST）、[2206.08496](https://arxiv.org/abs/2206.08496)（TF-C）、[2302.00861](https://arxiv.org/abs/2302.00861)（SimMTM）、[2110.02642](https://arxiv.org/abs/2110.02642)（Anomaly Transformer）、[2201.07284](https://arxiv.org/abs/2201.07284)（TranAD）、[2204.01637](https://arxiv.org/abs/2204.01637)（Audibert 等）、[2211.05244](https://arxiv.org/abs/2211.05244)（异常检测综述）、[2109.05257](https://arxiv.org/abs/2109.05257)（point-adjust 批评）、[2403.20150](https://arxiv.org/abs/2403.20150)（TFB）、[2203.10716](https://arxiv.org/abs/2203.10716)（预测评估陷阱）、[2405.15124](https://arxiv.org/abs/2405.15124)（Scaling law）、[1906.05264](https://arxiv.org/abs/1906.05264)（GluonTS）。

**待核实**：RevIN（Kim et al., ICLR 2022，本次 Crossref 未命中）；DeepAR 的输入缩放公式；LSTNet、TimesNet、TFT、N-BEATS 可解释版本、Informer ProbSparse、Autoformer 自相关、Anomaly Transformer 关联差异的**内部结构与公式细节**（仅标题或摘要层面核对）；S4 的 HiPPO 初始化与离散化细节；Koopa 的方法描述（仅核对标题）；对比学习与掩码预训练各方法的内部机制；各工具库的当前版本与接口。

**构造的例子与标准结果**：RNN/LSTM/GRU、注意力、TCN 感受野、ZOH 离散化、InfoNCE 等公式为教科书或原文的标准形式，由编者整理；复杂度表为渐近量级的归纳。

