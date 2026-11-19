---
Title | DLinear
-- | --
Created @ | `2026-11-19T01:28:51Z`
Updated @| `2026-11-19T01:28:51Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/630)

---
# DLinear

DLinear / NLinear 出自论文 *Are Transformers Effective for Time Series Forecasting?*（Zeng, Chen, Zhang, Xu；CUHK 与 IDEA，arXiv:2205.13504），是该文提出的一组名为 **LTSF-Linear** 的"embarrassingly simple"单层线性预测模型（Linear / DLinear / NLinear）中的两个变体。**一句话概括**：用一层沿时间轴的全连接（外加"趋势-残余分解"或"减去最后一个值"的预处理）直接预测未来 T 步，在当时常用的 9 个长期预测基准上打败了一众复杂的 Transformer 模型，从而质疑"Transformer 做长期时间序列预测（LTSF）有效"这一主流叙事。

论文自己强调：贡献"不在于提出一个线性模型，而在于抛出一个重要问题、给出令人意外的对比、并从多个角度说明 LTSF-Transformer 为什么没有宣称的那么有效"；LTSF-Linear 只是一个简单的新基线。读本文时请区分三类内容：**论文的实验事实**（有数字、有设置）、**论文的解释/假设**（作者推测）、**后续领域里的争论**（本文标 `[经验]` / `[待核实]`）。

总览见 [时间序列总览](/0603_ML_Tasks_TimeSeries)、[深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)；同样涉及线性自回归思想的经典方法见 [ARIMA](/0624_ML_Tasks_TimeSeries_Classical_ARIMA)。

## 1. 动机：论文想问什么

### 1.1 对 Transformer 的质疑

论文列举的 LTSF Transformer 有：LogTrans（NeurIPS 2019）、Informer（AAAI 2021）、Autoformer（NeurIPS 2021）、Pyraformer（ICLR 2022）、Triformer（IJCAI 2022）、FEDformer（ICML 2022）。它们主要在降低自注意力 `O(L^2)` 复杂度、注入时间序列先验（分解、频域、自相关）上做文章。

作者的论点（**假设，非定理**）：

- 自注意力擅长提取序列元素之间的"语义相关"（词、图像 patch），但时间序列的数值本身缺少语义，我们关心的是**连续点之间的时间变化，顺序本身最关键**；
- 自注意力是**置换不变**（permutation-invariant）的；位置编码、把子序列当 token 能保留一部分顺序信息，但"不可避免地会有时间信息损失"。

### 1.2 已有对比可能不公平

作者还指出：已有 Transformer-LTSF 论文里，被比较的非 Transformer 基线都是**自回归 / 迭代多步（IMS）**预测，已知存在误差累积；而这些 Transformer（从 Informer 起）用的是**直接多步（DMS）**预测。作者假设 Transformer 的提升**很大程度来自 DMS 策略而非注意力**，所以用一个"最简单的 DMS 模型"——一层线性——来检验。

IMS 与 DMS 的区别（论文 §2）：

策略 | 做法 | 特点
-- | -- | --
IMS（迭代多步） | 学一个单步预测器，反复套用得到多步 | 自回归估计使方差较小，但有误差累积；适合单步预测器很准且 T 较小
DMS（直接多步） | 一次性直接优化 T 步预测目标 | 单步无偏模型难得、或 T 很大时更准

作者另一个假设：不是所有时间序列都可预测（如混沌系统），长期预测只对"趋势与周期较清晰"的序列可行；线性模型已经能抽取这类信息。

## 2. 模型结构

### 2.1 问题设定与符号

输入有 C 个变量，历史窗口长度（look-back window）为 L：`X = {X_1^t, ..., X_C^t}, t = 1..L`；预测未来 T 步 `X^ = {X^_1^t, ..., X^_C^t}, t = L+1..L+T`。

### 2.2 基础 Linear

```
X^_i = W · X_i ,   W ∈ R^{T×L}
```

- `W` 是沿**时间轴**的线性层，把长度 L 的历史直接映射到长度 T 的未来（一次输出全部，即 DMS）；
- 对每个变量 i 分别应用，**所有变量共享同一个 W**，不建模变量之间的相关（channel-independent，通道独立）。

```
 历史 L 步 (每个变量)               未来 T 步
 x_1 x_2 ... x_L   --[ W: T×L ]-->  x^_{L+1} ... x^_{L+T}
```

每个未来点是 L 个历史点的加权和，没有激活函数，整个模型就是一个线性映射。

### 2.2.1 为什么置换不变性会丢时序信息，而线性层不会

`[解读]`（论文只给出论断，以下是用最小例子的说明）：

- 不带位置编码的自注意力，第 i 个输出是 `sum_j softmax(q_i·k_j) v_j`；把输入 token 的顺序打乱，输出只是同样被打乱，每个 token 的表示并不知道自己在第几位。顺序信息只能靠位置编码 / 时间戳 embedding 加进输入，模型要自己学会利用；
- 线性层 `W[t, l]` 则**为每个"相对位置 l → 预测步 t"单独设一个权重**，顺序被硬编码进参数的下标里。把输入打乱，等于换了一组权重去乘，结果必然改变。这与论文 Table 5 的现象一致：Linear 被打乱后明显变差，Transformer 几乎不变（§4.4）。

小例子：窗口 `[1, 2, 3]`，若 `W=[0,0,1]`（取最后一个值）输出 3；打乱成 `[3, 1, 2]` 输出 2。而一个纯"求和后再处理"的置换不变函数对两者给出相同输出。

### 2.3 DLinear：分解 + 两个线性层

论文描述：DLinear 结合了 Autoformer / FEDformer 使用的**分解**方案与线性层。

1. 用**移动平均核**把输入分成趋势项 `X_t`（trend）与残余项 `X_s`（remainder，论文也称 seasonal）：`X_t = MovingAvg(X)`，`X_s = X - X_t`；
2. 两个独立的一层线性层分别作用于两部分；
3. 两路输出**相加**得到最终预测：`X^ = W_t X_t + W_s X_s`。

```
          ┌── MovingAvg ──> X_t ──[Linear W_t]──┐
X (L) ────┤                                      ├─ (+) ──> X^ (T)
          └── X - X_t ────> X_s ──[Linear W_s]──┘
```

- 论文附录给出：移动平均核大小为 **25**（与 Autoformer 相同）；
- 参数量：基础 Linear 与 NLinear 共 `T·L`，DLinear 为 `2·T·L`（Appendix B.2）；
- 论文称：显式处理趋势后，数据有明显趋势时 DLinear 比基础 Linear 更好。

**带数字的分解例子**（`[解读]`，为说明而设：用核大小 k=3 代替论文的 25，边界按"复制两端"补齐，这一补齐方式 `[待核实]`）：

```
x        = [10, 12, 11, 13, 12, 14]                 (L=6，单个变量)
补齐后   = [10, 10, 12, 11, 13, 12, 14, 14]
趋势 X_t = [10.67, 11, 12, 12, 13, 13.33]            (3 点滑动平均，长度仍为 6)
残余 X_s = x - X_t = [-0.67, 1, -1, 1, -1, 0.67]     (围绕 0 的"快变化")
```

假设 T=2、第 1 个预测步的权重为：趋势支路 `W_t[1] = [0,0,0,0,0.5,0.5]`，残余支路 `W_s[1] = [0,0,0,0,-1,0]`（纯属举例的权重，不是训练结果），则
`x^_{7} = 0.5×13 + 0.5×13.33 + (-1)×(-1) = 13.17 + 1 = 14.17`：趋势支路给出"水平约 13.2"，残余支路延续窗口内的交替波动。训练时 `W_t`、`W_s` 的所有元素都是被学习的参数。

`[解读]` 趋势项由滑动平均得到，本身是对窗口做固定的线性滤波，整个 DLinear 仍是输入的线性函数；分解的作用是对 `W` 加一个结构约束 / 重参数化，让两个线性层各自处理"慢变化"与"快变化"，而不是增加表达能力。`[待核实]` 官方代码中移动平均如何做边界填充（论文正文未写）。

### 2.4 NLinear：减去最后一个值

针对数据存在**分布偏移**（训练集与测试集均值不同）的情形：

1. 输入序列减去窗口里**最后一个值**；
2. 通过一个线性层；
3. 再把被减去的那个值**加回**输出。

```
X^ = W (X - x_L) + x_L
```

`x_L` 是该变量历史窗口最后一个值（逐变量，加回时广播到 T 个时间步）。论文把它称为"对输入序列的一个简单归一化"。

动机（Appendix D.1）：如果用训练集均值/方差归一化，测试集的均值可能不为 0，模型预测一旦偏出真实值的分布，就会出现大误差；NLinear 的减/加把预测"平移"回真实值分布附近。论文用 ETTh1、ETTh2、ILI 的训练/测试直方图（Figure 5）说明存在明显分布偏移，并指出这三个数据集上 NLinear 相对 Linear 提升显著；对 Electricity 这类无明显偏移的数据，Linear / NLinear / DLinear 表现相近。

**带数字的例子**（`[解读]`，权重为假设）：窗口 `[10,12,11,13,12,14]`，`x_L=14`，减去后得 `[-4,-2,-3,-1,-2,0]`；设线性层对前两个预测步输出 `[0.5, 1.0]`，加回 14 得预测 `[14.5, 15.0]`。

`[解读]` 由公式可见：若把整个输入窗口整体平移常数 c，则 `W(X - x_L)` 不变，输出恰好也平移 c，即 NLinear 对窗口水平的平移**等变**；这正是它缓解"训练/测试均值不同"的原因。代价是预测完全锚定在最后一个观测值上（与 Repeat 基线相当于 `W=0` 的特例）。

### 2.5 论文列出的特性（Appendix D.2）

- 最大信号传播路径长度 `O(1)`，因而能同时捕获短程与长程依赖；
- 高效：最多两个线性层，内存、参数、推理速度都优于 Transformer；
- 可解释：可以直接看权重（见 §4.5）；
- 易用：论文称无需调模型超参即可得到（更多超参"见其代码"）。

## 3. 训练与推理

论文正文对训练细节写得很少，已确认的信息如下，其余请读官方代码：

- 目标：直接多步（DMS），对 T 步一次性回归；指标 MSE 与 MAE（沿用 Informer/Autoformer/FEDformer 的设置）；
- 回看窗口：**LTSF-Linear 默认 L = 336，Transformer 默认 L = 96**（Appendix B.2）。理由是：LTSF-Linear 输入过短会欠拟合，LTSF-Transformer 在长窗口下容易过拟合，因此各取其最佳设置比较（这一点后来被用来质疑公平性，见 §7）；
- Transformer 基线：沿用各自官方实现与默认超参；Autoformer、Informer、vanilla Transformer 的实现取自 Autoformer 的代码库，FEDformer、Pyraformer 取自各自仓库；
- 表 2 中标 `*` 的方法（Linear / NLinear / DLinear / Pyraformer / Repeat）由作者自己实现运行，其余基线数字来自 FEDformer 论文；
- 推理：输入 `(L, C)`，对每个通道按同一 `W` 做矩阵乘，输出 `(T, C)`，一次前向给出整段预测，无自回归解码；
- 论文设置是**点预测**，没有概率输出。

**L=336 对 L=96：哪些实验用了哪个窗口**（论文有明确写出的部分）：

实验 | Linear 系列窗口 | Transformer 窗口
-- | -- | --
主结果 Table 2 | 默认 336（Appendix B.2） | 默认 96
Table 4（Informer 逐步简化为 Linear） | 96 | 96
Table 3 / 6 / 7 | 不含线性模型 | Table 3、6 为 96；Table 7 论文未明写
Table 5（shuffle） | 含 Linear，窗口论文未明写 | 同左
Table 8（效率） | DLinear，96 | 96
窗口扫描（Figure 4 / 6） | 小时/10 分钟粒度 12 个取值，ETTm 与 ILI 各 7 个 | 同样取值

因此 Table 2 的 20%–50% 提升**包含窗口不同的影响**；而 Table 4 在同为 96 的窗口下 Informer 也被逐步简化的版本超过（Exchange 与 ETTh1 上），Figure 3 的定性图也是 L=96，说明论文结论不只依赖 336 这一设置。`[待核实]` 但 Table 2 中线性模型在 L=96 下的完整数字论文未给出（本文未见）。

`[待核实]` ILI 只有 966 个时间步，且附录对 ILI 的回看窗口扫描取的是 {26,...,208}；表 2 中 ILI 是否也用 L=336 论文未明说，应以官方代码为准。

## 4. 实验与结论（论文自己的数据）

### 4.1 数据集与设置

九个多变量数据集（论文 Table 1）：

数据集 | 变量数 | 时间步 | 粒度
-- | -- | -- | --
ETTh1 / ETTh2 | 7 | 17,420 | 1 小时
ETTm1 / ETTm2 | 7 | 69,680 | 5 分钟
Traffic | 862 | 17,544 | 1 小时
Electricity | 321 | 26,304 | 1 小时
Exchange-Rate | 8 | 7,588 | 1 天
Weather | 21 | 52,696 | 10 分钟
ILI | 7 | 966 | 1 周

预测步长 T：ILI 为 {24, 36, 48, 60}，其余为 {96, 192, 336, 720}。对比方法：FEDformer（Table 2 未标明所用版本，单变量 Table 9 同时列了 FEDformer-f / -w `[待核实]`）、Autoformer、Informer、Pyraformer、LogTrans，加上朴素基线 Closest Repeat（重复窗口最后一个值）。

### 4.2 主结果（Table 2，多变量，MSE）

下表为摘录（DLinear 与 FEDformer 的 MSE，各取第一个与最后一个步长）：

数据集 | 步长 | DLinear | FEDformer
-- | -- | -- | --
Electricity | 96 / 720 | 0.140 / 0.203 | 0.193 / 0.246
Exchange | 96 / 720 | 0.081 / 0.643 | 0.148 / 1.195
Traffic | 96 / 720 | 0.410 / 0.466 | 0.587 / 0.626
Weather | 96 / 720 | 0.176 / 0.323 | 0.217 / 0.403
ILI | 24 / 60 | 2.215 / 2.368 | 3.228 / 2.857
ETTh1 | 96 / 720 | 0.375 / 0.472 | 0.376 / 0.506
ETTh2 | 96 / 720 | 0.289 / 0.605 | 0.346 / 0.463
ETTm1 | 96 / 720 | 0.299 / 0.425 | 0.379 / 0.543
ETTm2 | 96 / 720 | 0.167 / 0.397 | 0.203 / 0.421

论文给出的结论与需要注意的细节：

- 摘要称 LTSF-Linear"在所有情形下"优于现有 Transformer、常常"大幅度"；正文称相对 FEDformer **在多数情形**提升 20%–50%。表 2 的 IMP. 行是"线性模型中最好者 vs Transformer 中最好者"的提升，如 Exchange 最高 46.19%，Electricity 17%–27%，ETTh1 的 96 步仅 0.80%；
- "最好的线性模型"并不总是 DLinear：例如 ETTh2 的 720 步，MSE 为 Linear 0.698 / NLinear **0.394** / DLinear 0.605 / FEDformer 0.463，DLinear 单独在这一格不如 FEDformer，需要 NLinear 才赢。所以"线性胜出"指 Linear/NLinear/DLinear 这一**组**中的最佳者；
- 同理，ILI 上最好的是 NLinear（24 步 1.683，对比 DLinear 2.215），Exchange 的 96/336 步上 Repeat 与 DLinear 持平或更好（0.081 vs 0.081；0.305 vs 0.305）；以上数字已对照论文第 5 页渲染图的表 2 核对；
- 论文承认 FEDformer 在 ETTh1 上有竞争力，并解释为它用了频域处理等经典时间序列技术，带来了归纳偏置（**作者的解释**）；
- 朴素 Repeat 在 Exchange-Rate 上优于所有 Transformer（论文称约 45%），作者归因于 Transformer 对训练集中突变噪声过拟合而预测出错误趋势（Figure 3(b)）；
- 单变量预测（ETT 四个数据集，Appendix Table 9）上论文称 LTSF-Linear（尤其 NLinear）同样大幅优于 Transformer。

### 4.3 回看窗口长度实验（重点）

**设置**：对长期预测 T = 720，扫描 `L ∈ {24, 48, 72, 96, 120, 144, 168, 192, 336, 504, 672, 720}`（Figure 4 展示 Traffic 与 Electricity；附录 Figure 6 给出全部基准，并有 T = 24 的设置；不同粒度的数据集窗口取值不同，例如 ETTm 用 {24, 36, 48, 60, 72, 144, 288}，ILI 用 {26, 52, 78, 104, 130, 156, 208}）。

**论文结论**：

- 现有 Transformer 的误差随 L 增大**变差或基本持平**；LTSF-Linear 的误差随 L 增大**显著下降**（附录称在大多数数据集如 ETTm1、Traffic 上明显）。作者据此认为现有 Transformer 倾向于拟合时间噪声而非提取时间信息，并说"输入长度 96 恰好适合大多数 Transformer"；
- 例外：Exchange-Rate 上线性模型也没有从长窗口获益，作者归因于金融数据信噪比低；
- 论文说明这一现象与此前研究的观察相符。

**"Close vs Far"实验（Table 3）**：同样预测未来 720 步（第 192 到 192+720 步），一种用紧邻的 L=96 输入（第 96–191 步，Close），另一种用更早的 96 步（第 0–95 步，Far）。MSE：

模型 | 数据集 | Close | Far
-- | -- | -- | --
FEDformer | Electricity | 0.251 | 0.265
FEDformer | Traffic | 0.631 | 0.645
Autoformer | Electricity | 0.255 | 0.287
Autoformer | Traffic | 0.677 | 0.675

作者的解读：Transformer 性能只轻微下降，说明它们只是从邻近序列抓取到类似的信息，即长期预测主要依赖对**趋势与周期**的刻画；刻画数据本征特征不需要很多参数（"一个参数就能表示周期"），参数过多反而过拟合，这也"部分解释"了 LTSF-Linear 为何更好。（这是作者**假设**，论文并未直接检验参数量与过拟合的因果关系。）

### 4.4 对 Transformer 的消融（论文的"拆解"实验）

**(a) 自注意力是否必要（Table 4，look-back = 96）**：把 Informer 逐步简化成 Linear：Att.-Linear（把每个自注意力层换成线性层）→ Embed + Linear（去掉 FFN 等辅助设计，只保留 embedding 与线性层）→ Linear（单个线性层）。MSE：

数据集 | 步长 | Informer | Att.-Linear | Embed + Linear | Linear
-- | -- | -- | -- | -- | --
Exchange | 96 | 0.847 | 1.003 | 0.173 | 0.084
Exchange | 720 | 2.478 | 2.102 | 2.026 | 0.763
ETTh1 | 96 | 0.865 | 0.613 | 0.454 | 0.400
ETTh1 | 720 | 1.181 | 0.902 | 1.051 | 0.515

作者结论：随着简化，Informer 的性能**总体变好**，说明自注意力和其他复杂模块"至少在现有 LTSF 基准上"并非必要。细节上并非严格单调：Exchange 步长 96 上 Att.-Linear（1.003）比 Informer（0.847）更差；ETTh1 步长 720 上 Embed + Linear（1.051）比 Att.-Linear（0.902）更差。

**(b) 是否保留时间顺序（Table 5，shuffle 实验）**：对原始输入（在 embedding 之前）做两种扰动：Shuf.（整段随机打乱）与 Half-Ex.（前半段与后半段互换）；5 次平均 MSE。

- Exchange 上：Linear 平均退化 27.26%（Shuf.）/ 46.81%（Half-Ex.）；FEDformer −0.09% / 0.20%，Autoformer 0.09% / 1.12%，Informer −0.12% / −0.18%，即 Transformer **几乎不受影响**；
- ETTh1 上：Linear 退化 81.06% / 4.78%；FEDformer 73.28% / 3.44%，Autoformer 56.91% / 0.46%，Informer 1.98% / 0.18%。FEDformer 和 Autoformer 因带时间序列归纳偏置而能抽取一定时序信息，Informer 则基本不受影响；
- 论文结论：线性模型被打乱后明显变差（自然地建模了顺序），Transformer 对顺序不敏感，"没有很好保留时间顺序"，并容易在噪声很大的金融数据上过拟合。

`[解读]` 该实验只说明"这些模型的预测对输入顺序不敏感"，也可能是模型没学到有用的时序关系，而不是注意力机制先天做不到；论文的因果表述是作者的主张。

**(c) 位置与时间戳 embedding（Table 6，Traffic，L=96）**：对 Informer，去掉位置编码（wo/Pos.）使 MSE 明显变差（96 步 0.719 → 1.035），去掉时间戳 embedding（wo/Temp.）随步长增大逐步变差（720 步 0.864 → 1.259）；Autoformer、FEDformer 去掉固定位置编码后性能相当甚至更好（如 Autoformer 96 步 0.629 → 0.613），但去掉时间戳 embedding 后 Autoformer 下降很快（720 步 0.638 → 0.769，两者都去掉为 1.300），FEDformer 因频域模块的归纳偏置受影响较小。

**(d) 训练数据量是否限制了 Transformer（Table 7，Traffic）**：用完整训练集（17,544×0.7 小时）与仅 1 年（8,760 小时）数据训练，FEDformer 与 Autoformer 用短数据时误差在多数情形反而更低（如 FEDformer 96 步 0.587 → 0.568）。作者说这不意味着应该少用数据，但说明数据量**不是**这两个模型表现差的限制因素。

**消融小结（论文问题 → 实验 → 论文结论）**：

问题 | 实验 | 论文结论
-- | -- | --
长窗口有用吗 | Fig 4/6 窗口扫描 | Transformer 持平或变差，线性变好
依赖近邻还是远处输入 | Table 3 Close/Far | 差别很小，说明只抓趋势/周期
注意力必要吗 | Table 4 | 越简化越好
保留顺序吗 | Table 5 shuffle | Transformer 几乎不变，线性大幅变差
embedding 有用吗 | Table 6 | 对 Informer 很关键，FED/Auto 依赖时间戳 embedding 而非位置编码
数据量不足吗 | Table 7 | 不是主因
效率重要吗 | Table 8 | 变体并未真正更省

**(e) 效率是否真是首要问题（Table 8，Electricity，L=96，T=720，Titan XP，5 次平均）**：

模型 | MACs | 参数 | 推理时间 | 显存
-- | -- | -- | -- | --
DLinear | 0.04G | 139.7K | 0.4ms | 687MiB
Transformer（改为同样的一次性解码） | 4.03G | 13.61M | 26.8ms | 6091MiB
Informer | 3.93G | 14.39M | 49.3ms | 3869MiB
FEDformer | 4.41G | 20.68M | 40.5ms | 4143MiB

（论文表中还有 Autoformer、Pyraformer 等行，此处略。）论文结论：多数"高效 Transformer"变体相对 vanilla Transformer 的实际推理时间与参数并无优势甚至更差，vanilla 的显存对现有基准也并非不可接受，因此"优先做省内存的 Transformer"至少在现有基准上意义有限。`[解读]` DLinear 的 139.7K 参数与 `2×720×96 + 2×720 = 139,680` 吻合（本文核对计算，说明含偏置项）。

### 4.5 权重可视化（Appendix D.3）

线性层权重可直接画出。论文以 DLinear 为例，输入 L=96，把权重初始化为 `1/L`（而非随机）以得到更平滑清晰的图。观察：Exchange-Rate 缺少周期，趋势层对靠近输出端（最近的历史点）权重更大；Traffic 上模型对窗口最近的时间步在第 0、23、47...719 个预测步有高权重，其中第 0、167、335、503、671 步更高，对应"24 步 = 1 天，168 步 = 1 周"，说明存在日周期与周周期。

## 5. 优缺点与局限

**论文自述**：

- 优点：极简、参数少、推理极快、可解释、几乎无需调参；`O(1)` 的最大信号路径长度；
- 局限（Conclusion）：模型容量有限，只是"简单而有竞争力的基线"；一层线性网络难以捕获**突变点（change point）**引起的时间动态；作者认为新模型设计、数据处理与新基准仍有很大潜力；
- 结论范围：论文强调"至少对现有 LTSF 基准"成立，并倡议重新审视 Transformer 在异常检测等其他时序任务上的有效性。

**`[经验]`（非论文结论，使用时自行判断）**：

- 通道独立 + 共享权重意味着完全不利用变量间关系；变量间强耦合、协变量（日历、促销等）重要时，纯 DLinear 不一定够用；
- 输入输出长度固定，`W` 大小是 `T×L`，窗口越长参数越多；不同 T 需要分别训练；
- 无概率输出，需要区间/分位数预测时要自行改造（如换成分位数损失）或改用 [DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR) 一类概率模型；
- 因线性、训练极快，适合作为"必须先跑"的深度学习基线，再判断复杂模型有没有增益。

## 6. 与相邻方法对比

方法 | 预测方式 | 结构 | 与 DLinear 的关系
-- | -- | -- | --
Informer / FEDformer 等 | DMS | Transformer（稀疏注意力 / 频域） | 论文的比较对象；DLinear 的分解沿用 Autoformer / FEDformer 的思路
Autoformer | DMS | 自相关 + 序列分解块 | DLinear 的"核大小 25 的移动平均分解"与其相同
[DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR) | 自回归、概率输出 | RNN | 属 IMS 一类；本论文未与其对比
[TCN](/0626_ML_Tasks_TimeSeries_Deep_TCN) | IMS 或 DMS | 因果膨胀卷积 | 论文附录仅在相关工作中提及
[ARIMA](/0624_ML_Tasks_TimeSeries_Classical_ARIMA) | 递推 | 线性自回归 + 差分 | `[解读]` 窗口上的线性回归与 AR 思想相近，DLinear 可看作"多输出直接法的线性 AR + 分解"
PatchTST | DMS | patch + Transformer，通道独立 | 后续工作，`[待核实]` 具体对比见其论文与综述 [深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)

与综述（[时间序列总览](/0603_ML_Tasks_TimeSeries)、[深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)）口径一致：DLinear 是对 Transformer 路线的反思，晚于 Informer 系列而早于 PatchTST；其论断是"在选用的基准上线性模型优于 Transformer"，作者归因于自注意力的置换不变性。

## 7. 后续争论（非论文结论）

以下内容不属于 2205.13504 本身：

- `[经验]` 此文之后，长期预测论文普遍把线性基线作为必比项；PatchTST 等工作通过 patch 与通道独立让 Transformer 重新取得较好成绩，暗示问题可能出在 token 设计与评估设定而非注意力本身 `[待核实]`。
- `[经验]` 公平性争论：论文让线性模型用 L=336、Transformer 用 L=96，有评论认为这使对比并非同窗口；论文的解释是各取最佳设置（见 §3）。复现时建议同时给出同窗口下的结果。
- `[经验]` 基准本身的问题：现有 LTSF 基准（ETT、Electricity、Traffic 等）数据集较小、周期性强，简单模型已够用，"线性优于 Transformer"能推广到多大范围仍有争议；论文自己也把结论限定在"现有基准"。
- `[待核实]` shuffle 等消融能否严格推出"自注意力丢失时序信息"，存在不同看法。

## 8. 使用方式

官方代码见 Reference。最小示意如下，**示意代码，未运行验证**；分解的边界填充、是否每通道独立权重等细节以官方实现为准：

```python
import torch, torch.nn as nn

class MovingAvg(nn.Module):
    def __init__(self, k=25):
        super().__init__(); self.k = k
        self.pool = nn.AvgPool1d(kernel_size=k, stride=1)
    def forward(self, x):                     # x: (B, L, C)
        pad = (self.k - 1) // 2
        front = x[:, :1].repeat(1, pad, 1)    # 复制两端以保持长度
        end = x[:, -1:].repeat(1, pad, 1)
        x = torch.cat([front, x, end], dim=1)
        return self.pool(x.transpose(1, 2)).transpose(1, 2)

class DLinear(nn.Module):
    def __init__(self, L=336, T=96, k=25):
        super().__init__()
        self.ma = MovingAvg(k)
        self.lin_t = nn.Linear(L, T)           # 趋势支路，沿时间轴
        self.lin_s = nn.Linear(L, T)           # 残余支路
    def forward(self, x):                      # x: (B, L, C)
        trend = self.ma(x); seas = x - trend
        out = self.lin_t(trend.transpose(1, 2)) + self.lin_s(seas.transpose(1, 2))
        return out.transpose(1, 2)             # (B, T, C)

class NLinear(nn.Module):
    def __init__(self, L=336, T=96):
        super().__init__(); self.lin = nn.Linear(L, T)
    def forward(self, x):
        last = x[:, -1:, :].detach()
        return self.lin((x - last).transpose(1, 2)).transpose(1, 2) + last
```

使用建议 `[经验]`：

1. 先用 NLinear 与 DLinear 各跑一遍作为基线；序列有明显水平漂移（训练/测试均值不同）时 NLinear 更稳，趋势明显时 DLinear 更合适，与论文 D.1 的动机一致；
2. 回看窗口 L 值得扫描（论文显示线性模型能从更长窗口获益），但信噪比低的数据（如汇率）未必有益；
3. 按训练集统计量做标准化后训练；评估时加入 Repeat 等朴素基线，不要只与复杂模型比；
4. 需要变量间关系、协变量或概率输出时，应换用其他模型，或把 DLinear 作为其中一个分量。

## Reference

- 论文：Ailing Zeng, Muxi Chen, Lei Zhang, Qiang Xu. *Are Transformers Effective for Time Series Forecasting?* arXiv:2205.13504，<https://arxiv.org/abs/2205.13504>（本文依据 arXiv v3，2022-08-17；`[待核实]` 综述记载其发表于 AAAI 2023，已发表版本与 v3 的数字/实验是否一致未对照）。
- 官方代码：论文摘要给出 <https://github.com/cure-lab/LTSFLinear>。
- 论文所比较的 Informer、Autoformer、FEDformer、Pyraformer、LogTrans 的出处见该论文参考文献。
- 本站相关：[时间序列总览](/0603_ML_Tasks_TimeSeries)、[深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)、[DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR)、[TCN](/0626_ML_Tasks_TimeSeries_Deep_TCN)、[ARIMA](/0624_ML_Tasks_TimeSeries_Classical_ARIMA)。

