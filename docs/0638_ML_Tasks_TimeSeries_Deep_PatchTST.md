---
Title | ML Tasks TimeSeries Deep PatchTST
-- | --
Created @ | `2026-11-19T01:59:59Z`
Updated @| `2026-11-20T08:13:41Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/638)

---
# PatchTST

PatchTST（Patch Time Series Transformer）出自论文 *A Time Series is Worth 64 Words: Long-term Forecasting with Transformers*（Yuqi Nie、Nam H. Nguyen、Phanwadee Sinthong、Jayant Kalagnanam；Princeton University / IBM Research；ICLR 2023，arXiv:2211.14730）。[解读] 标题里的 "64 words" 大概对应它的 PatchTST/64 变体：回看窗口被切成 64 个 patch，每个 patch 相当于一个"词"（论文没有明说这一对应）。

一句话概括：**PatchTST = 通道独立（每个变量是一条单变量序列，共享同一套嵌入和 Transformer 权重）+ 子序列级 patch 作为 token + 可选的 masked patch 自监督预训练。** 骨干就是原版 Transformer encoder，没有改注意力机制。

论文的出发点是 DLinear（*Are Transformers Effective for Time Series Forecasting?*）的质疑：一个很简单的线性模型在常见长期预测基准上胜过了 Informer、Autoformer、FEDformer 等一系列 Transformer，Transformer 对时间序列预测到底有没有用？PatchTST 的回答是：问题不一定在 Transformer 本身，而在 token 怎么设计、通道怎么处理。更详细的背景见 [时间序列总览](/0603_ML_Tasks_TimeSeries) 与 [深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)。

## 解决什么问题

论文指出以往 Transformer 预测模型的三个问题：

问题 | 论文的说法 | PatchTST 的对策
-- | -- | --
token 没有语义 | 单个时间步不像句子里的单词那样有语义；以往大多用逐点 token，或手工构造的信息 | 把相邻时间步聚合成 patch，在嵌入里保留局部语义
窗口不能长 | 原版 Transformer 的时间、空间复杂度都是 $O(N^2)$，$N$ 是 token 数；不预处理时 $N = L$ | patch 化把 $N$ 降到约 $L/S$，同样的算力可以看更长的历史
通道混合效果差 | 通道混合（channel-mixing）把所有变量拼成一个 token；通道独立此前在 CNN、线性模型上有效，但没用在 Transformer 上 | 通道独立，每个变量单独成一条序列、共享权重

表中：「问题」是以往 Transformer 预测模型的缺陷，「论文的说法」是其成因（$N$ 为 token 数，$L$ 为回看长度，$S$ 为步长），「PatchTST 的对策」是对应改进。

此外论文还强调：线性模型因表达能力有限，可能不适合做自监督表示学习，而 PatchTST 既能做预测又能做表示学习（论文 §1）。

## 核心思想与结构

### 问题设定

给定回看窗口 $(x_1,\dots,x_L)$，每个 $x_t$ 是 $M$ 维向量（$M$ 个变量），预测未来 $T$ 步 $(x_{L+1},\dots,x_{L+T})$。

### 通道独立（Channel-independence）

输入被拆成 $M$ 条单变量序列 $x^{(i)}\in\mathbb R^{1\times L}$，每条独立送入同一个 Transformer 骨干，得到 $\hat x^{(i)}\in\mathbb R^{1\times T}$，最后拼起来。损失是各通道 MSE 的平均：

$$
\mathrm{Loss}=\mathbb E_x\left[\frac1M\sum_{i=1}^{M}\left\lVert \hat x^{(i)}_{L+1:L+T}-x^{(i)}_{L+1:L+T}\right\rVert_2^2\right]
$$


其中：$M$ 是变量（通道）数；$x^{(i)}$ 是第 $i$ 个通道的真实序列，$\hat x^{(i)}$ 是其预测；下标 $L+1:L+T$ 表示预测区间；$\lVert\cdot\rVert_2^2$ 是平方误差；$\mathbb E_x$ 是对样本取期望，损失是各通道 MSE 的平均。

实现上不需要特殊算子：形状 $B\times M\times L$ 的批数据经 patching 得到 $B\times M\times P\times N$，reshape 成 $(B\cdot M)\times P\times N$，就可以交给任何标准 Transformer 实现（论文 A.1.5）。

### Patching

每条单变量序列被切成可重叠或不重叠的 patch。patch 长 $P$，步长 $S$（相邻两个 patch 之间"不重叠"的部分），patch 数：

$$
N=\left\lfloor \frac{L-P}{S}\right\rfloor+2
$$


其中：$N$ 是 patch 个数；$L$ 是回看窗口长度；$P$ 是 patch 长度；$S$ 是相邻 patch 的步长；$\lfloor\cdot\rfloor$ 为向下取整；$+2$ 来自首个 patch 与末尾补 $S$ 个值后多出的一个 patch。

切之前先在序列末尾补 $S$ 个重复的最后一个值 $x_L$。得到 $x_p^{(i)}\in\mathbb R^{P\times N}$。

自拟小例子（示意，已重算）：$L = 10,\ P = 4,\ S = 2$，补 2 个末值后长度为 12，patch 起点为 0、2、4、6、8，共 5 个；公式 $\lfloor(10-4)/2\rfloor+2 = 3+2 = 5$，一致。

### Transformer encoder

- 嵌入：$x_d^{(i)} = W_p x_p^{(i)} + W_{\mathrm{pos}}$，其中 $W_p\in\mathbb R^{D\times P}$ 是可训练线性投影，$W_{\mathrm{pos}}\in\mathbb R^{D\times N}$ 是可学习的加性位置编码。
- 每个注意力头 $h$ 的 $Q_h = (x_d)^{\top} W_h^Q$、$K_h = (x_d)^{\top} W_h^K$、$V_h = (x_d)^{\top} W_h^V$，注意力为 $\mathrm{Softmax}\left(Q K^{\top} / \sqrt{d_k}\right) V$。
- 每个 encoder 块里用 BatchNorm（不是 LayerNorm；论文脚注引用 Zerveas et al. 2021 说 BatchNorm 在时序 Transformer 上更好）、FFN 和残差连接。
- 输出表示 $z^{(i)}\in\mathbb R^{D\times N}$，经 flatten + 线性头得到 $T$ 步预测。
- 默认超参：3 层 encoder，$H = 16$ 个头，$D = 128$，FFN 内层 $F = 256$（两层线性 + GELU），dropout 0.2。极小的数据集（ILI、ETTh1、ETTh2）用 $H = 4$、$D = 16$、$F = 128$ 以减轻过拟合。

### 实例归一化

每条输入序列（每个样本、每个通道）在 patching 之前先做零均值、单位标准差的归一化，预测结果再把均值和标准差加回去，用于缓解训练/测试分布漂移（论文引用 Kim et al. 2022，即 RevIN）。

### 整体示意（ASCII）


下图概括 PatchTST 对每个通道的处理流程。

```
多变量输入 [M x L]
   | 拆成 M 条单变量序列（共享权重）
   v
x(i) [1 x L] -> 实例归一化 -> 末尾补 S 个末值 -> patching -> [P x N]
             -> 线性投影 W_p + 位置编码 W_pos -> [D x N]
             -> Transformer encoder x 3 -> z(i) [D x N]
             -> flatten -> 线性头 -> [1 x T] -> 加回均值/标准差
   |
   v
拼回 M 个通道 -> 预测 [M x T]
```

图中：

- 自上而下：多变量输入 $[M\times L]$ 拆成 $M$ 条单变量序列（共享权重），每条经实例归一化、末尾补值、patching 变成 $[P\times N]$。
- 线性投影与位置编码把每个 patch 变成 $D$ 维 token，3 层 Transformer encoder 得到表示 $[D\times N]$，再 flatten 并经线性头输出 $T$ 步预测，最后加回均值与标准差。
- 各通道预测拼回，得到 $[M\times T]$。关键结论：通道并入 batch 维，共享同一套参数。

## patch 长度、步长与 token 数

论文的两个监督版本都取 $P = 16$、$S = 8$：

变体 | 回看窗口 $L$ | patch 数 $N$ | 用途（论文说法）
-- | -- | -- | --
PatchTST/64 | 512 | 64 | 在大数据集上探索更好的结果
PatchTST/42 | 336 | 42 | 默认回看窗口，与 DLinear、其他 Transformer 公平比较

表中：「变体」是两个监督版本，「回看窗口 $L$」与「patch 数 $N$」是对应取值，「用途」是论文说法。两者 $P=16$、$S=8$，只是回看窗口不同。

核对：$(512-16)/8 + 2 = 62 + 2 = 64$；$(336-16)/8 + 2 = 40 + 2 = 42$。注意 $P = 2S$ 时 $N = L/S$ 恰好成立（$(L-2S)/S + 2 = L/S$），论文正文里的"$N \approx L/S$"在这组超参下是精确的。

### 复杂度下降的算术

下面是**自拟示意**（我自己的算术，已重算），统计单个通道、单个头、单层的注意力矩阵元素数 $N^2$：

设置 | token 数 $N$ | 注意力矩阵元素数 $N^2$ | 相对逐点
-- | -- | -- | --
逐点，$L = 96$ | 96 | 9,216 | 1x
patch，$L = 96$ | $(96-16)/8+2 = 12$ | 144 | 缩小 64 倍
逐点，$L = 336$ | 336 | 112,896 | 1x
patch，$L = 336$ | 42 | 1,764 | 缩小 64 倍
逐点，$L = 512$ | 512 | 262,144 | 1x
patch，$L = 512$ | 64 | 4,096 | 缩小 64 倍
逐点，$L = 720$ | 720 | 518,400 | 1x
patch，$L = 720$ | $(720-16)/8+2 = 90$ | 8,100 | 缩小 64 倍

表中：「设置」是逐点与 patch 两种做法及回看长度 $L$，「token 数 $N$」是 token 个数，「注意力矩阵元素数 $N^2$」是单头单层的注意力矩阵规模，「相对逐点」是缩小倍数。结论：$S=8$ 时注意力矩阵缩小 64 倍。

要点：(1) 论文说 token 数约缩小 $S$ 倍，注意力的计算和内存 "quadratically decreased by a factor of S"（原文措辞含糊）；按 $N^2$ 算，$S = 8$ 时对应 $S^2 = 64$ 倍的缩小，上表的 64 倍就是这么来的（[解读] 我对原文措辞的理解）；(2) patch 化后看 720 步历史（8,100）的注意力矩阵比逐点看 96 步（9,216）还小，这就是"同样预算看更长历史"的含义。这只是注意力矩阵的元素数，整体训练时间的缩小要小得多，见下面论文实测。

论文实测（Table 1，$L = 336$，$P = 16$，$S = 8$，训练时间，单位秒，论文未在表中说明是否为每 epoch）：

数据集 | 有 patch | 无 patch | 论文标注的加速
-- | -- | -- | --
Traffic | 464 | 10040 | x 22
Electricity | 300 | 5730 | x 19
Weather | 156 | 680 | x 4


表中：「数据集」是评测集，「有 patch」「无 patch」是训练时间（秒），「论文标注的加速」是二者之比。结论：patch 化带来 4 到 22 倍加速，数据集越大收益越明显。
重算：$10040/464 = 21.6$，$5730/300 = 19.1$，$680/156 = 4.4$，与论文的取整一致。可见实测加速（4~22 倍）远小于理论的 64 倍，[解读] 因为总耗时里还有 FFN、嵌入、数据加载等不随 $N^2$ 缩小的部分，加上数据集大小不同；论文没有拆分各部分耗时。

### 线性头的参数量（自拟示意）

论文 §3.2 指出：如果每个时间步一个 token（$z_t\in\mathbb R^D$，共 $L$ 个），要把它们线性映射到 $M$ 个变量 × $T$ 步的输出，参数矩阵是 $(L\times D)\times(M\times T)$，很容易过大。拿 Traffic（$M = 862$）、$L = 336,\ D = 128,\ T = 96$ 代入：$(336\times128)\times(862\times96) = 43{,}008\times82{,}752 = 3{,}558{,}998{,}016$，约 $3.6\times10^9$。PatchTST 的线性头是 $(N\times D)\to T$，且各通道共享：$42\times128\times96 = 5{,}376\times96 = 516{,}096$，约 $5.2\times10^5$；两者相差 $8\times862 = 6{,}896$ 倍（重算：$516{,}096\times6{,}896 = 3{,}558{,}998{,}016$，吻合）。这是对论文论点的数量化示意，不是论文里的数字，论文也没拿这组数字做对比。

## 训练与推理

- 监督训练：对每个预测长度 $T$ 单独训练一个模型（论文说监督 PatchTST 是"为每个预测长度训练整个模型"）。预测长度 $T$ 取 $\{96, 192, 336, 720\}$，ILI 取 $\{24, 36, 48, 60\}$。损失 MSE。
- 推理：一次前向直接输出整个 $T$ 步（直接多步预测，不做递归）。
- 随机种子：主文结果固定用 seed 2021，附录用 5 个种子（2019~2023）验证方差很小（Table 14）。
- 不同数量的变量：因为通道独立且共享权重，训练和测试的变量数不必一致，这对预训练尤其有利（A.1.5）。

## 自监督预训练（masked patch）

做法（§3.2）：沿用同一个 Transformer encoder，去掉预测头，换成一个 $D\times P$ 的线性层；监督训练时 patch 可以重叠，自监督时改为**不重叠**，这样可见 patch 不会含有被遮 patch 的信息。随机均匀选一部分 patch 下标，用 0 替换，用 MSE 重构被遮 patch。

为什么这样设计（论文的论据）：

- 逐时间步遮挡时，被遮的值可以靠前后时间点插值轻松恢复，学不到整段序列的高层表示（论文批评 Zerveas et al. 2021 的 TST）；遮整个 patch 更难。
- 如果每个时间步一个 token，下游预测头参数是 $(L\times D)\times(M\times T)$，下游样本少时容易过拟合；patch + 通道共享后头小得多（上一节有数字示意）。
- 每个序列有自己的潜表示，靠共享权重联合学习，所以预训练数据的变量数可以和下游不同。

实验设置（§4.2）：输入长度 512，patch 长度 12（不重叠）-> 42 个 patch；遮 40% 的 patch；在每个数据集上预训练 100 epoch。评估两种：(a) linear probing：冻结骨干，只训练头 20 epoch；(b) 端到端微调：先 linear probing 10 epoch，再全网络微调 20 epoch（论文引用 Kumar et al. 2022 说这种两步法优于直接微调）。

算术核对：$512 / 12 = 42.67$，取整得 42，与论文一致；$40\% \times 42 = 16.8$，约遮 17 个 patch。[解读] 论文文本没有说明 512 除以 12 的余数怎么处理、遮挡个数怎么取整，这里只是我的推算。

### PatchTST/64 与 PatchTST/42 的区别

- 两者结构相同，$P = 16$、$S = 8$；区别只在回看窗口 $L$：512（64 个 patch）对 336（42 个 patch）。
- 论文用 /42 与 DLinear（$L = 336$）及其他 Transformer 公平比较，用 /64 探索更好的结果。
- 注意这两个名字与自监督实验里的 "42 个 patch" 只是数字巧合：自监督用的是 $L = 512$、$P = 12$、不重叠，也得到 42 个 patch，那是另一套设置，并非 /42。
- [待核实] 论文各处对自监督设置的描述不完全一致：§4.2 写 "输入长度 512、patch size 12、42 个 patch"；而 Table 1 的自监督一行写的是 $L = 336$、$N = 42$；附录 Table 14 标题又写 "PatchTST/42 self-supervised"。论文没有解释这几处的关系，本文只照录各处原话，不替论文作调和。

## 实验与结论

以下数字均来自论文表格，已对照渲染图核对。

### 长期预测（Table 3，监督）

设置：8 个数据集（Weather 21 变量、Traffic 862、Electricity 321、ILI、ETTh1/h2/m1/m2 各 7 个变量）；基线结果取自 DLinear 论文，Transformer 基线默认 $L = 96$，DLinear $L = 336$（ILI 分别为 36 和 104）；论文还对 FEDformer、Autoformer、Informer 在 $L\in\{24, 48, 96, 192, 336, 720\}$ 上重跑并取最好，作为更强基线。指标 MSE、MAE。

论文结论：相对 Transformer 基线中的最好结果，PatchTST/64 总体 MSE 降 21.0%、MAE 降 16.7%；PatchTST/42 分别降 20.2% 和 16.4%。对 DLinear，论文称 PatchTST 总体更好，尤其在大数据集（Weather、Traffic、Electricity）和 ILI 上。

预测长度 96 的几组数字（MSE）：

数据集 | PatchTST/64 | PatchTST/42 | DLinear | FEDformer
-- | -- | -- | -- | --
Weather | 0.149 | 0.152 | 0.176 | 0.238
Traffic | 0.360 | 0.367 | 0.410 | 0.576
Electricity | 0.129 | 0.130 | 0.140 | 0.186
ETTh1 | 0.370 | 0.375 | 0.375 | 0.376

表中：「数据集」是评测集，其余各列是预测长度 96 的 MSE（越小越好）。结论：PatchTST 在大数据集上明显优于 DLinear 与 FEDformer，在 ETTh1 上差距很小。

在 ETTh1 上差距很小，且并非处处领先：ETTh1 预测长度 192 时 DLinear 的 MSE 0.405 比 PatchTST/42 的 0.414 更好（见 Table 3）。

### Table 1：Traffic 上的案例（预测长度 96）

设置 | $L$ | token 数 $N$ | MSE
-- | -- | -- | --
通道独立 Transformer，无 patch | 96 | 96 | 0.518
通道独立，无 patch，下采样（每 4 步取一点并加最后一点） | 380 | 96 | 0.447
通道独立，无 patch | 336 | 336 | 0.397
PatchTST，patch（监督） | 336 | 42 | 0.367
PatchTST，patch（自监督） | 336 | 42 | 0.349
FEDformer（通道混合） | 336 | 336 | 0.597
DLinear | 336 | 336 | 0.410

表中：「设置」是不同配置，「$L$」是回看窗口，「token 数 $N$」是送入 Transformer 的 token 个数，「MSE」是 Traffic 预测长度 96 的误差（越小越好）。结论：窗口越长越好，patch 在不增加 token 的同时进一步降低误差，自监督预训练最好。

读法：(1) 窗口从 96 加到 336，MSE 从 0.518 降到 0.397；(2) token 数相同（96）时，下采样看到更长历史（$L = 380$）比只取最近 96 步更好（0.447 对 0.518）——论文由此说长历史有信息；(3) patch 不丢数据又缩短序列，在 $L = 336$ 下 MSE 进一步降到 0.367。

### 消融：patching 与通道独立（Table 7，监督 PatchTST/42，预测长度 96）

数据集 | P+CI（完整） | 仅 CI | 仅 P | 原始 TST（都没有）
-- | -- | -- | -- | --
Weather | 0.152 | 0.164 | 0.168 | 0.177
Traffic | 0.367 | 0.397 | 0.595 | 显存不足
Electricity | 0.130 | 0.136 | 0.196 | 0.205


表中：「数据集」是评测集，其余四列是各配置在预测长度 96 的 MSE（越小越好）：P+CI 为完整 PatchTST（patch + 通道独立），仅 CI 为不 patch，仅 P 为 patch 但通道混合，原始 TST 为两者都没有。结论：两个设计都有贡献，大数据集上更明显。
"仅 CI" 是把 $P$ 和 $S$ 都设为 1（等价于不 patch）；"仅 P" 是在 patch 后把张量 reshape 成 $B\times (M\cdot P)\times N$，即通道混合；"显存不足" 指 NVIDIA A40 48GB 上 batch size 为 1 也放不下。Traffic、Electricity 的消融把最大 epoch 从 100 降到 20（A.4.3）。结论：两者都有贡献，在大数据集上更明显。

### 通道独立为什么有效（附录 A.7）

论文承认直觉上通道混合应该更强（有更大灵活性），但观察到相反，并给出三条理由：

1. **适应性**：每条序列单独过 Transformer，生成自己的注意力图，可以学不同的注意力模式；通道混合时所有序列共享同一个注意力模式。论文用 Electricity 的注意力图（Figure 6）说明：相似的序列注意力图相似，不相关的不同。论文称这是 PatchTST 胜过 Informer 等通道混合模型的主要原因之一，但措辞是 "We suspect"。
2. **数据效率**：通道混合需要更多训练数据才能同时学跨通道、跨时间的关系。Figure 7 左（Weather，PatchTST/42，预测长度 96）：随训练集比例增加，通道独立的测试损失更快下降。
3. **更不易过拟合**：Figure 7 右：通道混合模型在最初几个 epoch 后测试损失回升，通道独立持续下降。

论文还列了几条"额外优势"（未做实验，只是论述）：可以扩展到用 GNN 学跨通道关系；可对不同序列施加不同损失做多任务学习；噪声通道的噪声不会在嵌入空间混入其他通道。

A.7.2：把通道独立套在 Informer、Autoformer、FEDformer 上，论文称总体上有提升，但仍赶不上 PatchTST。部分设置显存不足或超过 12 小时限制（见 Table 15 说明）。

### 回看窗口与 patch 长度

- 回看窗口（Figure 2，Electricity/Traffic/Weather，预测长度 96 与 720，$L\in\{24, 48, 96, 192, 336, 720\}$）：论文称多数 Transformer 基线随 $L$ 增大并无改善，而 PatchTST 的 MSE 随 $L$ 增大持续降低（Figure 2 与 Table 9）。
- patch 长度（A.4.1）：回看窗口 336，步长等于 patch 长（不重叠），预测长度 96。论文观察 MSE 随 $P$ 变化不大（读 Figure 4 的图，不是表格数字：Weather 约在 0.150 到 0.155 之间，Electricity 约 0.132 到 0.134；Traffic 变化较大，约 0.39 到 0.455，$P = 2$ 时最差），结论是对 patch 长度鲁棒；原文称最佳 $P$ 可能因数据集而异，但 $P$ 取 8 或 16 看起来是通用的好选择。图注写的 $P$ 取值含 2，正文写的是从 4 开始，两处略有出入。

### 实例归一化消融（Table 11，PatchTST/42，预测长度 96，MSE，有 / 无实例归一化）

Weather 0.152 / 0.156；Traffic 0.367 / 0.425；Electricity 0.130 / 0.131；ILI（预测长度 24）1.522 / 3.489。论文结论：实例归一化让结果略有提升，即使去掉也在多数数据集上优于其他 Transformer，说明提升主要来自 patching 与通道独立。[解读] 但 ILI 上有无归一化差距很大（1.522 对 3.489），"略有提升"并不适用于所有数据集。

### 自监督与迁移

- 表 4：自监督 PatchTST（微调）在大数据集上优于从头监督训练。预测长度 96 的 MSE：Weather 微调 0.144 / 线性探测 0.158 / 监督 0.152；Traffic 0.352 / 0.399 / 0.367；Electricity 0.126 / 0.138 / 0.130。论文称仅线性探测就已与从头训练相当并好于 DLinear（表中 Traffic 的线性探测 0.399 比监督 0.367 差，但比 DLinear 0.410 好）。
- 表 5：在 Electricity 上预训练，迁移到 Weather 和 Traffic。论文称微调后整体略逊于"在目标数据集上预训练再微调"，有时也差于监督训练，但仍好于其他模型（预测长度 96：Weather 迁移微调 0.145 优于监督 0.152；Traffic 0.388 差于监督 0.367，好于 DLinear 0.410）。
- 表 6：与对比学习式表示学习方法在 ETTh1 上比较，只做线性探测。预测长度 24 的 MSE：PatchTST 迁移（在 Traffic 上预训练）0.312、自监督（在 ETTh1 上预训练）0.322；BTSF 0.541、TS2Vec 0.599、TNC 0.632、TS-TCC 0.653。预测长度 720：PatchTST 0.508（迁移）/ 0.487（自监督）；BTSF 0.993、TS2Vec 1.048、TNC 1.604、TS-TCC 1.603。论文称提升幅度在 34.5% 到 48.8% 之间。
- 效率：论文指出，监督 PatchTST 要为每个预测长度训练整个模型，而预训练后只需重训线性头或用少得多的 epoch 微调，节省训练时间。

## 与 DLinear 的关系

论文里写到的部分：

- DLinear 的结论（简单线性模型胜过 Transformer）是 PatchTST 的动机；论文把 DLinear 作为"最近的非 Transformer 基线"，默认 $L = 336$。
- 通道独立在 DLinear 里已经用过（论文说"在 CNN 和线性模型上被证明有效，但没用在 Transformer 上"），PatchTST 把它带进了 Transformer。
- 论文对基线窗口的解释（A.1.2）：Transformer 基线在窗口长时容易过拟合，DLinear 则倾向欠拟合，所以两者的默认 $L$ 不同（96 对 336）。
- 对表示学习，论文认为线性模型表达能力有限，不适合做自监督任务。
- 结果上：PatchTST 总体优于 DLinear，大数据集和 ILI 上更明显；小数据集上差距不大，个别设置 DLinear 更好。

[经验]（不是论文内容）：

- 在 ETT 这类小数据集上，DLinear 与 PatchTST 差距不大时，优先用 DLinear 作基线能省很多算力。
- 后续文献对"通道独立 vs 通道混合"有不少讨论，PatchTST 论文本身只在其基准上比较，并在结论中把"恰当建模跨通道依赖"列为未来工作。

## 优缺点

论文自述：

- 优点：保留局部语义；注意力的计算与内存按 $S^2$ 量级降低；能利用更长回看窗口；通道独立更不易过拟合、更省数据；可做自监督预训练与迁移；patching 可以移植到其他模型。
- 未来工作（论文结论）：通道独立可以进一步结合通道间相关性，"恰当建模跨通道依赖"是重要的下一步。这等于承认当前版本不显式建模跨通道依赖。

[经验] 与 [解读]：

- [解读] 通道独立在变量间强耦合（如图结构依赖）的任务上可能吃亏，论文没有对此做专门实验。
- [解读] 论文在 A.1.5 说通道并行需要"复制多份 Transformer 权重"（实际是共享一份权重、把通道并入 batch 维），实现上不需要特殊算子；但 $M$ 很大时 $B\cdot M$ 的有效批大小会放大显存开销（Traffic 上 $M = 862$），这是我的推断，论文只给了时间对比（Table 1）。
- [经验] $P$、$S$、$L$ 需要结合数据采样频率重新调；默认 $P = 16$、$S = 8$ 来自论文的实验，并不保证对所有频率适用。
- 论文的比较范围：基线只包含 FEDformer、Autoformer、Informer、Pyraformer、LogTrans 和 DLinear，没有与 N-BEATS、TimesNet 等其他方法比较，这类结论本文不下。

## 与相关方法对比

方法 | token 单位 | 通道处理 | 注意力 | 备注
-- | -- | -- | -- | --
Informer / Autoformer / FEDformer | 逐点 | 通道混合（A.7 将其作通道混合对照） | ProbSparse / 自相关 / 傅里叶增强 | 论文基线，侧重改注意力降复杂度
LogTrans、Pyraformer | 逐点 | 论文未专门说明 | 卷积自注意力 + LogSparse / 金字塔注意力 | 论文列为基线
Triformer | 论文称其 patch attention 用伪时间戳作 patch 内的 query | 论文未专门说明 | patch attention | 论文指出其目的是降复杂度，没有把 patch 当输入单元
TST（Zerveas 2021） | 逐点（一个时间步的所有变量为一个 token） | 通道混合 | 原版 | 论文的 "Original" 消融即它
DLinear | 逐点（线性层） | 通道独立 | 无 | 论文主要对照
PatchTST | patch | 通道独立 | 原版注意力 | 本文

表中：「方法」是对比对象，「token 单位」是输入单元，「通道处理」说明通道混合还是独立，「注意力」说明机制，「备注」给出补充。结论：PatchTST 以 patch 为 token 并采用通道独立，注意力沿用原版。

论文在 Related Work 里把 patch 类比为 NLP 的 subword 切分、CV 里 ViT 的 $16\times16$ patch（BEiT、MAE 也以 patch 为输入）。同系列的其他方法（N-BEATS、N-HiTS、DLinear、TimesNet、TSMixer、TimeMixer 等）此处不展开，综述见 [深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)。论文结论提到 PatchTST 有潜力成为时间序列基础模型的构件，相关背景见 [时序基础模型](/0608_ML_Tasks_TimeSeries_Foundation)。

## 使用方式

最小用法示意（示意代码，未运行验证；作者的官方实现请以其仓库为准）：

```python
import torch, torch.nn as nn

class PatchTSTSketch(nn.Module):
    def __init__(self, L=336, T=96, P=16, S=8, D=128, H=16, F=256, layers=3):
        super().__init__()
        self.P, self.S = P, S
        self.N = (L - P) // S + 2
        self.proj = nn.Linear(P, D)                       # W_p
        self.pos = nn.Parameter(torch.zeros(self.N, D))   # W_pos
        enc = nn.TransformerEncoderLayer(D, H, F, 0.2, batch_first=True)
        self.enc = nn.TransformerEncoder(enc, layers)
        self.head = nn.Linear(self.N * D, T)

    def forward(self, x):                                 # x: [B, M, L]
        B, M, L = x.shape
        mu, sd = x.mean(-1, keepdim=True), x.std(-1, keepdim=True) + 1e-5
        x = (x - mu) / sd                                 # 实例归一化
        x = torch.cat([x, x[..., -1:].repeat(1, 1, self.S)], -1)  # 末尾补 S 个末值
        x = x.unfold(-1, self.P, self.S)                  # [B, M, N, P]
        x = self.proj(x.reshape(B * M, self.N, self.P)) + self.pos
        z = self.enc(x).reshape(B * M, -1)                # 通道并入 batch 维
        y = self.head(z).reshape(B, M, -1)
        return y * sd + mu
```

说明：此示意用 PyTorch 自带的 LayerNorm 版 encoder，与论文使用 BatchNorm 不同；`unfold` 的 patch 数应等于 $\lfloor (L-P)/S\rfloor + 2$。

[经验] 实际使用时建议直接用论文作者的官方实现（见 Reference）。论文正文只写了 "The code will be publicly available"，仓库地址取自 arXiv 摘要页。

## Reference

- 论文：Nie, Nguyen, Sinthong, Kalagnanam. *A Time Series is Worth 64 Words: Long-term Forecasting with Transformers*. ICLR 2023. [arXiv:2211.14730](https://arxiv.org/abs/2211.14730)
- 官方代码（arXiv 摘要页链接）：https://github.com/yuqinie98/PatchTST
- 相关：Zeng et al. *Are Transformers Effective for Time Series Forecasting?* [arXiv:2205.13504](https://arxiv.org/abs/2205.13504)（DLinear）


