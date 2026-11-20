---
Title | ML Tasks TimeSeries Anomaly AnomalyTransformer
-- | --
Created @ | `2026-11-19T02:27:35Z`
Updated @| `2026-11-20T08:18:26Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/648)

---
# Anomaly Transformer

Anomaly Transformer 出自论文 *Anomaly Transformer: Time Series Anomaly Detection with Association Discrepancy*（Jiehui Xu, Haixu Wu, Jianmin Wang, Mingsheng Long，清华大学软件学院 / BNRist，arXiv:2110.02642，发表于 ICLR 2022），是一个**无监督**的时间序列异常检测方法。论文自称在三类应用（服务监控、航天与地球探测、水处理）的六个基准上取得 state-of-the-art。[待核实：Spotlight 的说法在论文 PDF 里未见出处；PDF 里只写了 "Published as a conference paper at ICLR 2022"，未见 Spotlight 字样]

一句话概括：**异常点由于罕见，很难与整条序列建立强关联，它的注意力会集中在相邻时刻；因此把"每个时间点的序列关联（self-attention 分布）与一个相邻集中先验（高斯核）之间的差异"当作异常判据，并用 minimax 训练把这个差异拉得更有区分度。**

文章结构：先讲动机，再讲 Anomaly-Attention 的先验关联与序列关联、关联差异，然后是 minimax 训练和异常分数，最后是论文的实验、评估协议（point-adjust）与局限。时间序列异常检测的整体背景见[异常检测篇](/0609_ML_Tasks_TimeSeries_Anomaly)，指标与 point-adjust 的定义见[评估指标篇](/0610_ML_Tasks_TimeSeries_Metrics)，总览见[时间序列总览](/0603_ML_Tasks_TimeSeries)，深度模型分类见[深度学习篇](/0606_ML_Tasks_TimeSeries_Deep)。

## 解决什么问题

问题设定（论文 Sec. 3）：观测序列 $\mathcal X=\{x_1,\dots,x_N\}$，每个 $x_t\in\mathbb R^d$ 是 $d$ 维测量，等间隔采样；**没有标签**，要判断每个 $x_t$ 是否异常。论文还强调，无监督异常检测要同时做到两件事：学到信息丰富的表示，以及得到一个**可区分正常与异常的判据**。

论文对已有方法的批评：

类别 | 判据 | 论文指出的不足
-- | -- | --
重构 / 预测类（LSTM-VAE、OmniAnomaly、InterFusion 等） | 逐点重构误差或预测误差 | 异常稀少，点表示被正常点主导，异常不够可区分；误差逐点计算，不能综合描述时间上下文
显式关联类（VAR、状态空间、图随机游走、子序列相似度） | 显式建模关联 | 难学到信息丰富的表示、难建模细粒度关联；GNN 学到的图只限于单个时间点；子序列方法抓不到每个点与整条序列的细粒度关联
密度估计 / 聚类类（LOF、OC-SVM、Deep SVDD 等） | 密度或到簇中心的距离 | 经典方法不考虑时间信息，难泛化到未见场景

表中：「类别」是已有方法类型，「判据」是其异常判据，「论文指出的不足」是其问题。

核心观察（论文 Sec. 1）：

1. 把 Transformer 用在时间序列上，每个时间点的 self-attention 权重是它对序列中所有时间点的**关联分布**，论文称为 **series-association**，能反映周期、趋势等动态模式。
2. 因为异常罕见、正常模式占主导，异常点很难与整条序列建立强关联；由于时间上的连续性，相邻点更可能包含相似的异常模式，所以异常的关联会**集中在相邻点**（adjacent-concentration）。论文把这种"相邻集中"的归纳偏置写成 **prior-association**。
3. 于是每个点的"先验关联"与"序列关联"之间的距离，即 **Association Discrepancy**，在异常点处更小（异常的序列关联本来就近似相邻集中），在正常点处更大。

[解读] 这里"差异小 = 异常"与直觉相反，容易记反：正常点的序列关联是全局的、与"只看邻居"的高斯先验差得远；异常点的序列关联也只看邻居，所以与先验几乎重合。

## 核心思想与结构

### 整体结构

模型是 $L$ 层 Anomaly-Attention 块与前馈层交替堆叠，带残差和 Layer Norm。第 $l$ 层（论文式 (1)）：

$$\mathcal Z^l=\text{Layer-Norm}\big(\text{Anomaly-Attention}(\mathcal X^{l-1})+\mathcal X^{l-1}\big)$$

$$\mathcal X^l=\text{Layer-Norm}\big(\text{Feed-Forward}(\mathcal Z^l)+\mathcal Z^l\big)$$

其中 $\mathcal X^l\in\mathbb R^{N\times d_{\text{model}}}$，$\mathcal X^0=\text{Embedding}(\mathcal X)$ 是嵌入后的原序列；输入窗口 $\mathcal X\in\mathbb R^{N\times d}$（论文取窗口长度 $N=100$）。最后由堆叠输出经线性层得到重构 $\hat{\mathcal X}$（Figure 1 右侧 Reconstruction）。

其中：$\mathcal Z^l$ 是注意力子层输出；$\text{Layer-Norm}$ 是层归一化；$\text{Anomaly-Attention}$ 是双分支注意力；$\text{Feed-Forward}$ 是前馈层；加上输入是残差连接。下图概括整体结构。

```
          X (N x d)
             |  Embedding
             v
   +-----------------------+
   |  Anomaly-Attention    |--> 产出 P^l, S^l（供 AssDis 使用）
   |  + 残差 + LayerNorm   |
   |  Feed-Forward         |      x L 层
   |  + 残差 + LayerNorm   |
   +-----------------------+
             |  Linear
             v
        X_hat (重构)
```

图中：输入 $X$ 经 Embedding 后进入 $L$ 层堆叠块，每层依次是 Anomaly-Attention（同时产出 $P^l,S^l$ 供关联差异使用）、残差与 LayerNorm、前馈层、残差与 LayerNorm；最后经线性层得到重构 $\hat X$。关键结论：与标准 Transformer 相比只换了注意力模块，且做窗口内重构。

[解读] 与标准 Transformer 编码器相比，结构上只换了注意力模块，没有因果掩码；它不做预测而是做**窗口内重构**。

### Anomaly-Attention：先验关联与序列关联

单分支自注意力无法同时给出"先验"和"学到的"关联，所以 Anomaly-Attention 有两个分支（论文式 (2)）：

$$\mathcal Q,\mathcal K,\mathcal V,\sigma=\mathcal X^{l-1}W^l_{\mathcal Q},\ \mathcal X^{l-1}W^l_{\mathcal K},\ \mathcal X^{l-1}W^l_{\mathcal V},\ \mathcal X^{l-1}W^l_{\sigma}$$


其中：$\mathcal X^{l-1}$ 是上一层输出；$W^l_{\mathcal Q},W^l_{\mathcal K},W^l_{\mathcal V},W^l_{\sigma}$ 是各分支的投影矩阵；$\mathcal Q,\mathcal K,\mathcal V$ 是查询、键、值；$\sigma$ 是先验分支的尺度。

**先验关联（Prior-Association）**，用以相对时间距离 $|j-i|$ 为变量的高斯核，每个时间点 $i$ 有自己的可学习尺度 $\sigma_i$：

$$\mathcal P^l=\text{Rescale}\Big(\Big[\frac{1}{\sqrt{2\pi}\,\sigma_i}\exp\Big(-\frac{|j-i|^2}{2\sigma_i^2}\Big)\Big]_{i,j\in\{1,\dots,N\}}\Big)$$


其中：$\mathcal P^l$ 是先验关联矩阵；$i,j$ 是时间点下标；$\sigma_i$ 是第 $i$ 点可学习的高斯尺度；$|j-i|$ 是相对时间距离；高斯核给出相邻集中的权重；$\text{Rescale}$ 把每行除以行和，使其成为概率分布。

$\text{Rescale}(\cdot)$ 是把每一行除以行和，使每行成为离散分布。高斯核是单峰的，所以先验天然偏向相邻区域；$\sigma_i$ 可学习，使先验能适应不同长度的异常段等模式。

**序列关联（Series-Association）**，就是普通的缩放点积自注意力：

$$\mathcal S^l=\text{Softmax}\Big(\frac{\mathcal Q\mathcal K^{\top}}{\sqrt{d_{\text{model}}}}\Big),\qquad \hat{\mathcal Z}^l=\mathcal S^l\mathcal V$$

维度：$\mathcal Q,\mathcal K,\mathcal V\in\mathbb R^{N\times d_{\text{model}}}$，$\sigma\in\mathbb R^{N\times 1}$，$W^l_{\mathcal Q},W^l_{\mathcal K},W^l_{\mathcal V}\in\mathbb R^{d_{\text{model}}\times d_{\text{model}}}$，$W^l_{\sigma}\in\mathbb R^{d_{\text{model}}\times 1}$，$\mathcal P^l,\mathcal S^l\in\mathbb R^{N\times N}$。多头版本（论文实际使用）里 $\sigma\in\mathbb R^{N\times h}$，每个头有自己的 $\sigma$ 和 $\mathcal P$、$\mathcal S$，多头输出拼接后得到 $\hat{\mathcal Z}^l$。


下图对比两个分支如何得到序列关联与先验关联。

```
 X^{l-1} --W_Q,W_K--> Q K^T / sqrt(d) --Softmax--> S  (序列关联, 学出来)  --> S V --> Z
         \--W_sigma--> sigma_i --高斯核 G(|j-i|; sigma_i)--Rescale--> P (先验关联, 相邻集中)
```

图中：上支路由 $W_Q,W_K$ 得到查询与键，经缩放点积和 Softmax 得到序列关联 $S$（学出来的），再乘 $V$ 得到输出 $Z$；下支路由 $W_\sigma$ 得到每点的尺度 $\sigma_i$，经高斯核与 Rescale 得到先验关联 $P$（相邻集中）。关键结论：序列关联参与重构，先验关联只作对比参照。

[解读] 只有序列关联分支参与重构（$\hat{\mathcal Z}^l=\mathcal S^l\mathcal V$）；先验分支不产出特征，只作为"相邻集中"的参照分布，为关联差异提供对比。论文没写 $\sigma$ 如何保证为正，这里不展开 [待核实：官方实现细节]。

### 关联差异（Association Discrepancy）

论文把关联差异定义为先验与序列关联的**对称 KL 散度**，并在 $L$ 层上取平均，把多层特征的关联综合起来（式 (3)）：

$$\text{AssDis}(\mathcal P,\mathcal S;\mathcal X)=\Big[\frac1L\sum_{l=1}^{L}\Big(\text{KL}\big(\mathcal P^l_{i,:}\,\Vert\,\mathcal S^l_{i,:}\big)+\text{KL}\big(\mathcal S^l_{i,:}\,\Vert\,\mathcal P^l_{i,:}\big)\Big)\Big]_{i=1,\dots,N}$$


其中：$\mathcal P^l_{i,:},\mathcal S^l_{i,:}$ 是第 $l$ 层第 $i$ 个时间点的先验关联与序列关联（各为一行离散分布）；$\text{KL}$ 是 KL 散度，两个方向相加得到对称 KL；$L$ 是层数，对层取平均；结果是长度为 $N$ 的逐点关联差异。

KL 是对 $\mathcal P^l$ 和 $\mathcal S^l$ 的**每一行**（对应一个时间点的离散分布）计算的，所以 $\text{AssDis}\in\mathbb R^{N\times1}$ 是逐点的。论文附录 Algorithm 2 的实现顺序是：先对头维度取平均得到每层的 $\mathcal P,\mathcal S$，再对每行算两个方向的 KL 并相加，最后对层维度取平均。

## 训练与推理

### 损失与两阶段 minimax

无监督目标是重构损失，再加一项用来拉大关联差异的损失（式 (4)）：

$$\mathcal L_{\text{Total}}(\hat{\mathcal X},\mathcal P,\mathcal S,\lambda;\mathcal X)=\Vert\mathcal X-\hat{\mathcal X}\Vert_F^2-\lambda\times\Vert\text{AssDis}(\mathcal P,\mathcal S;\mathcal X)\Vert_1$$


其中：$\mathcal X$ 是输入窗口，$\hat{\mathcal X}$ 是重构；$\Vert\cdot\Vert_F^2$ 是 Frobenius 范数的平方（重构误差）；$\lambda$ 是权重；$\Vert\text{AssDis}\Vert_1$ 是各点关联差异的 L1 范数；减号表示在重构的同时最大化关联差异。

$\lambda>0$ 时优化方向是**增大**关联差异。因为先验是单峰高斯，增大差异会迫使序列关联更多地关注**非相邻**区域；在重构损失约束下，这对异常点更难做到（异常需要保持较大的相邻关联才能重构好），因而放大了正常与异常的可区分性。

但论文指出，直接最大化关联差异会使高斯核的尺度参数急剧减小，先验关联变得没有意义。为此采用 **minimax 策略**（式 (5)，Figure 2）：

$$\text{Minimize 阶段：}\ \mathcal L_{\text{Total}}(\hat{\mathcal X},\mathcal P,\mathcal S_{\text{detach}},-\lambda;\mathcal X)$$

$$\text{Maximize 阶段：}\ \mathcal L_{\text{Total}}(\hat{\mathcal X},\mathcal P_{\text{detach}},\mathcal S,\lambda;\mathcal X)$$


其中：$\hat{\mathcal X}$ 是重构；$\mathcal P,\mathcal S$ 是先验关联与序列关联；$\lambda$ 是权重；$\ast_{\text{detach}}$ 表示该项不回传梯度（stop-gradient）。Minimize 阶段令关联差异项的权重为 $-\lambda$（只更新先验），Maximize 阶段为 $\lambda$（只更新序列关联）。

其中 $\ast_{\text{detach}}$ 表示该关联不回传梯度（stop-gradient，Figure 1 的灰色箭头）。

阶段 | 更新谁 | 关联差异项的符号 | 效果
-- | -- | -- | --
Minimize | 先验 $\mathcal P$（$\mathcal S$ 被 detach） | $-(-\lambda)=+\lambda$，即**最小化**关联差异 | 让先验的 $\sigma$ 去逼近当前学到的序列关联，先验适应各种时间模式
Maximize | 序列关联 $\mathcal S$（$\mathcal P$ 被 detach） | $-\lambda$，即**最大化**关联差异 | 序列关联被推向非相邻区域；先验已贴近序列关联，所以这一阶段的约束更强

表中：「阶段」是 minimax 的两个阶段，「更新谁」说明更新的关联（另一方 detach），「关联差异项的符号」说明优化方向，「效果」说明作用。结论：先验追逐序列关联，序列关联远离先验，二者博弈。

两个阶段都同时包含重构项。论文附录 F 的说法是：minimize 阶段倾向于同时降低关联差异和重构误差，maximize 阶段倾向于增大关联差异并降低重构误差，并给出两项损失在五个真实数据集上都能收敛的曲线。

[解读] 可以把它类比为 GAN 式的"两方博弈"：先验去追序列关联，序列关联去躲先验，躲得越远越好，但又受重构误差约束。论文未写两个阶段在同一个 batch 内如何具体交替（同一步里先后做还是分 epoch 交替）[待核实：官方代码细节]。

### 推理：关联与重构共同给出异常分数

把归一化后的关联差异乘到逐点重构误差上，得到最终分数（式 (6)）：

$$\text{AnomalyScore}(\mathcal X)=\text{Softmax}\big(-\text{AssDis}(\mathcal P,\mathcal S;\mathcal X)\big)\odot\Big[\Vert\mathcal X_{i,:}-\hat{\mathcal X}_{i,:}\Vert_2^2\Big]_{i=1,\dots,N}$$


其中：$\text{AssDis}$ 是逐点的关联差异（窗口内 $N$ 个点）；$\text{Softmax}(-\text{AssDis})$ 是窗口内的归一化权重，差异越小权重越大；$\Vert\mathcal X_{i,:}-\hat{\mathcal X}_{i,:}\Vert_2^2$ 是第 $i$ 个点的重构误差；$\odot$ 是逐元素乘。分数越高越可能是异常。

$\odot$ 是逐元素乘，Softmax 在窗口内的 $N$ 个时间点之间做。关联差异越小（越像异常），$-\text{AssDis}$ 越大，权重越高。论文解释：即使异常被重构得不错，它仍然倾向于降低关联差异，所以分数仍然会高；重构误差和关联差异在这里是**协作**关系。

**自拟示意（非论文数据，已手算）**：窗口只有 3 个点，设 $\text{AssDis}=(2,1,0)$，逐点重构误差为 $(0.2,0.3,0.4)$。则 $e^{-2}=0.1353$，$e^{-1}=0.3679$，$e^{0}=1$，和为 $1.5032$，权重为 $(0.0900,0.2447,0.6652)$，分数为 $(0.0180,0.0734,0.2661)$。第 3 个点的关联差异最小（最像异常），权重最大，分数最高。

[解读] Softmax 在窗口内归一，所以各点权重之和为 1，分数的绝对量级随窗口长度 $N$ 变化；这也是论文用**验证集上的比例**而不是固定绝对值定阈值的自然原因之一（论文本身只说明了按比例 $r$ 定阈值，没有解释这一点）。

### 阈值与 point-adjust

- 论文（Sec. 4 与附录 H）：先按非重叠滑窗（窗口 100）把序列切成子序列；在验证集（无标签）上算出异常分数，选阈值 $\delta$，使验证集中比例为 $r$ 的时间点被判为异常；主结果设 $r=0.1\%$（SWaT）、$0.5\%$（SMD）、$1\%$（其余数据集）。附录 H 称分数分布在验证集上分成两簇，并参照 K-Means 的 Gap Statistic 来选超参；附录里也给出直接固定 $\delta$（SMD、MSL、SWaT 取 0.1，SMAP、PSM 取 0.01）的备选，称性能很接近。
- **评估用的 point-adjust 协议**：论文原话是采用 "widely-used adjustment strategy"（引用 Xu et al. 2018、Su et al. 2019、Shen et al. 2020）：**只要一段连续异常中有一个时间点被检出，这一整段的所有异常点就都视为被正确检出**。论文给的理由是：现实中一个异常点会触发告警，从而让整段异常被注意到。

## 实验与结论

以下数字均来自论文，对照渲染页核对过。

**设置**：论文主文的数据集描述为：SMD（38 维，服务器）、PSM（26 维，eBay 服务器）、MSL（55 维）、SMAP（25 维）（后两者来自 NASA）、SWaT（51 个传感器，水处理）、NeurIPS-TS（Lai et al. 2021 提出，含 point-global、pattern-contextual、pattern-shapelet、pattern-seasonal、pattern-trend 五类异常）。模型 3 层，$d_{\text{model}}=512$，8 头，$\lambda=3$（所有数据集），Adam，初始学习率 $10^{-4}$，batch 32，训练在 10 个 epoch 内 early stop。论文称对比 18 个基线：主文 Table 1 中的 15 个（InterFusion、BeatGAN、OmniAnomaly、LSTM-VAE、DAGMM、MPPCACD、LOF、ITAD、THOC、Deep-SVDD、CL-MPPCA、LSTM、VAR、OC-SVM、IsolationForest），另有 3 个变点检测 / 分割基线（BOCPD、TS-CP2、U-Time）在附录 I。数据集维度以主文描述为准；PSM 论文内部不一致：主文写 26 维，附录 Table 13 写 25 维（SMAP 为 25 维），本文不替论文裁定。

**主结果（Table 1，F1 %，P/R/F1 采用 point-adjust 后计算）**：

方法 | SMD | MSL | SMAP | SWaT | PSM
-- | -- | -- | -- | -- | --
THOC | 84.99 | 89.69 | 90.68 | 85.13 | 89.54
InterFusion | 86.22 | 86.62 | 89.14 | 83.01 | 83.52
Anomaly Transformer | 92.33 | 93.59 | 96.69 | 94.07 | 97.89

表中：「方法」是对比模型，其余列是各数据集的 F1（%，point-adjust 后计算，越大越好）。结论：Anomaly Transformer 在五个数据集上均最优；注意其数字是 PA 协议下的结果。

论文称 Anomaly Transformer 在所有基准上取得一致的 SOTA，并在 Figure 3 中给出 ROC 曲线，AUC 为：SMD 0.9866、MSL 0.9812、SMAP 0.9941、SWaT 0.9876、PSM 0.9946，均为对比方法中最高（Figure 3 的对比方法为 BeatGAN、Deep-SVDD、LSTM-VAE）。NeurIPS-TS 上 F1 为 71.31（Figure 4），同图里最高的其他方法为 67.45（BeatGAN）。

**消融（Table 2，F1 %）**：

架构 / 判据 / 先验 / 优化 | SMD | MSL | SMAP | SWaT | PSM | 平均
-- | -- | -- | -- | -- | -- | --
纯 Transformer，Recon | 79.72 | 76.64 | 73.74 | 74.56 | 78.43 | 76.62
AT，Recon，Learnable，Minimax | 71.35 | 78.61 | 69.12 | 81.53 | 80.40 | 76.20
AT，AssDis，Learnable，Minimax | 87.57 | 90.50 | 90.98 | 93.21 | 95.47 | 91.55
AT，Assoc，Fix，Max | 83.95 | 82.17 | 70.65 | 79.46 | 79.04 | 79.05
AT，Assoc，Learnable，Max | 88.88 | 85.20 | 87.84 | 81.65 | 93.83 | 87.48
AT final（Assoc，Learnable，Minimax） | 92.33 | 93.59 | 96.90 | 94.07 | 97.89 | 94.96

表中：各行是消融设置（AT 指 Anomaly Transformer；Recon 为重构判据，AssDis 为关联差异，Assoc 为关联判据；Learnable/Fix 表示 $\sigma$ 可学习或固定；Max/Minimax 为优化策略），后几列是各数据集 F1（%）与平均。结论：关联判据、可学习先验与 minimax 都带来明显提升。

其中 Recon 是纯重构判据，AssDis 是纯关联差异，Assoc 是式 (6) 的关联判据；Fix 指把 $\sigma$ 固定为 1.0。论文的结论：关联判据比重构判据平均 F1 绝对提升 18.76（76.20 到 94.96）；只用关联差异也有 91.55，超过 THOC 的 88.01（由 Table 1 算出）；可学习先验和 minimax 分别再带来 8.43 和 7.48 的平均提升。

注意：Table 2 final 行 SMAP 为 96.90，而 Table 1 的 SMAP F1 为 96.69，论文两处不一致且未说明原因；Table 2 的平均 94.96 是按 96.90 算的（按 Table 1 的五个 F1 平均约为 94.91）。本文引用时两处各按原表。

**Table 3：相邻关联权重（%）的对比度**（Contrast = Abnormal / Normal，越大越可区分；Recon / Max / Ours 依次对应只用重构、直接最大化、minimax）：

数据集 | Recon | Max | Ours（minimax）
-- | -- | -- | --
SMD | 1.15 | 1.27 | 2.39
MSL | 1.01 | 1.10 | 1.59
SMAP | 1.05 | 1.08 | 1.43
SWaT | 1.08 | 1.14 | 1.76
PSM | 1.03 | 1.04 | 2.64

表中：「数据集」是评测集，其余三列是不同训练方式下相邻关联权重（%）的对比度（异常 / 正常，越大越可区分）：Recon 只用重构，Max 直接最大化关联差异，Ours 为 minimax。结论：minimax 显著拉大了异常与正常的差别。

这说明：只用重构时异常与正常点在相邻关联上几乎没差别（对比度接近 1），直接最大化略有改善，minimax 显著拉大。

**其他分析（论文附录）**：多层平均的关联差异优于只用单层（Table 4）；对称 KL 优于 JSD、Wasserstein、CE、L2 等距离（Table 5），其中 CE 与 JSD 也不错，L2 不适合；高斯核先验一致优于幂律核（Table 6）；窗口太小时模型可能失败（Figure 7，附录 A）。Figure 6 显示异常段处学到的 $\sigma$ 通常比正常点小，与"异常相邻集中"一致。

### 评估协议 point-adjust：怎么看这些数字

Anomaly Transformer 的 F1 是在 point-adjust 之后算的（见上文）。综述[评估指标篇 §3.3](/0610_ML_Tasks_TimeSeries_Metrics)和[异常检测篇 §5.1](/0609_ML_Tasks_TimeSeries_Anomaly)对 PA 的口径是：Kim et al.（arXiv:2109.05257）理论与实验表明 PA 有很大可能高估性能，**随机异常分数也能变成"最先进"**，PA 下的排名会误导；并且禁用 PA 时，一个未训练的模型即可与现有方法相当。综述的例子：一段 100 点的异常，检测器只对其中 1 点报警，PA 之后整段记为 100 个 TP，召回 100%。

对读这篇论文的含义：

- 论文本身采用 PA 并说明了理由，属于当时领域内通行的做法；论文没有引用 Kim et al.（该工作也在 2021 年，论文文本中未出现对 PA 的批评）。
- 因此 Table 1 里的 F1（尤其 SMAP 96.69、PSM 97.89 这样接近上限的数字）应理解为 "PA 协议下的结果"，不宜与不用 PA 的结果混比（综述口径：把 PA 后的 $F_1$ 与不用 PA 的结果混比是常见误区）。
- 论文主文没有报告不使用 PA 的结果，所以无法从论文中判断 "关联差异" 在严格协议下的增益大小 [解读]。[待核实：基线数字是否都在同一 PA 协议下得到，论文未逐一说明]
- 综述同时指出，评估协议往往比模型本身更能决定结论，综述（[深度学习篇](/0606_ML_Tasks_TimeSeries_Deep)）给出的 [经验] 建议是：部署前先跑传统基线，并报告不依赖 PA 的结果。

## 优缺点与局限

**论文自述**：

- 窗口大小需要折中：窗口太小关联学不好，而 Transformer 复杂度与窗口长度呈平方关系（附录 J）。
- 缺少理论分析，未来工作是借助自回归与状态空间模型的经典分析来研究（附录 J、Sec. 5）。

**[经验]**：

- 判据依赖"异常点相邻集中"这一假设；对长时间持续、与正常模式没有明显断裂的异常，或在窗口里占比很大的异常，该假设未必成立 [待核实：论文没有专门实验]。
- 分数在窗口内归一化，阈值又由验证集比例 $r$ 决定，$r$ 实际隐含了对异常占比的先验；不同数据集的 $r$ 是人为设定的（0.1% / 0.5% / 1%）。
- 评估依赖 PA，见上节。

## 与相关方法对比

方法 | 判据来源 | 是否用注意力 | 说明
-- | -- | -- | --
LSTM-VAE / OmniAnomaly / InterFusion | 重构误差（点表示） | 否（RNN / VAE） | 论文的重构类基线
THOC | 到多尺度簇中心的距离 | 否 | 论文称其与 InterFusion 是当时的 SOTA 深度基线
GTA（Chen et al., 2021） | 图 + Transformer + 重构 | 是 | 论文相关工作中提到，仍是重构判据
Anomaly Transformer | 关联差异 × 重构误差 | 是（改造为 Anomaly-Attention） | 判据来自注意力分布本身

表中：「方法」是对比对象，「判据来源」说明异常判据，「是否用注意力」说明是否基于注意力机制，「说明」给出补充。结论：Anomaly Transformer 的判据直接来自注意力分布本身，并与重构误差结合。

综述中还提到同属"关联 / 表示"路线的 DCdetector 与对抗训练的 TranAD（具体机理本文不展开）。

## 使用方式

论文附录 Algorithm 1–3 给出了 Anomaly-Attention、关联差异和异常分数的伪代码。官方代码仓库为 thuml/Anomaly-Transformer。下面是计算关联差异与分数的示意代码，**示意代码，未运行验证**（假设已有逐层逐头的 `P`、`S`，形状 `[L, h, N, N]`，以及重构误差 `err`，形状 `[N]`）：

```python
import torch

def ass_dis(P, S, eps=1e-8):
    P, S = P.mean(1), S.mean(1)                    # 先对头取平均 -> [L, N, N]
    kl = lambda a, b: (a * (torch.log(a + eps) - torch.log(b + eps))).sum(-1)
    return (kl(P, S) + kl(S, P)).mean(0)           # 行内 KL, 再对层平均 -> [N]

def anomaly_score(P, S, err):
    return torch.softmax(-ass_dis(P, S), dim=0) * err
```

使用要点：

- 数据切成长度 100 的非重叠窗口；训练时按 Minimize / Maximize 两个损失分别更新先验与序列关联（对另一方 detach）。
- 在无标签验证集上按比例 $r$ 定阈值；若要报告结果，建议同时给出 PA 与非 PA 两种口径 [经验]。

## Reference

- Jiehui Xu, Haixu Wu, Jianmin Wang, Mingsheng Long. *Anomaly Transformer: Time Series Anomaly Detection with Association Discrepancy*. ICLR 2022. [arXiv:2110.02642](https://arxiv.org/abs/2110.02642)
- 官方代码：[thuml/Anomaly-Transformer](https://github.com/thuml/Anomaly-Transformer)
- Kim et al. *Towards a Rigorous Evaluation of Time-series Anomaly Detection*（PA 的批评）. [arXiv:2109.05257](https://arxiv.org/abs/2109.05257)


