---
Title | FEDformer
-- | --
Created @ | `2026-11-19T01:59:57Z`
Updated @| `2026-11-19T01:59:57Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/637)

---
# FEDformer

FEDformer（Frequency Enhanced Decomposed Transformer，Zhou, Ma, Wen, Wang, Sun, Jin，阿里巴巴，ICML 2022，arXiv:2201.12740）是面向长期时间序列预测（LSTF）的 Transformer：保留 Autoformer 式的"编码器-解码器内置季节-趋势分解"，但把注意力换成**频域**操作——先做傅里叶（或小波）变换，只保留随机选出的固定数量 $M$ 个频率模式，在这 $M$ 个模式上做可学习的混合/注意力，再反变换回时域。因为 $M$ 固定，论文声称时间和显存复杂度对序列长度线性（$O(L)$）。

一句话概括：**在频域里只对随机挑出的少量模式做线性混合/注意力，并用 MOE（Mixture of Experts）分解块提取趋势。**

它在深度时序模型中的位置见 [深度学习时序方法](/0606_ML_Tasks_TimeSeries_Deep) 与 [总览](/0603_ML_Tasks_TimeSeries)；Autoformer、Informer 等相邻方法在综述中有简述，此处只写名字。

## 解决什么问题

论文指出 Transformer 做长期预测的两个问题：

1. 计算和显存代价高；
2. 逐点注意力、逐点预测，使模型难以保持序列整体的全局性质（如整体趋势、分布）。论文在 ETTm1 上展示 vanilla Transformer 的预测与真值分布不同（Figure 1：频率模式与趋势偏移）。

对应两个思路：

- 引入经典的季节-趋势分解（STL、RobustSTL 一脉），让分解负责全局轮廓、Transformer 负责细节；
- 在频域而不是时域使用 Transformer，利用"时间序列在傅里叶等基下往往有稀疏表示"这一事实，同时顺带得到线性复杂度。

## 整体结构

```
Encoder (N 层)                          Decoder (M 层)
Input X_en^0 (I×D)                      Seasonal Init X_de^0 ((I/2+O)×D)   Trend Init T_de^0
   |                                       |
  FEB  --(+残差)--> MOEDecomp              FEB  --(+残差)--> MOEDecomp ----> S^{l,1}, T^{l,1}
   |                                       |
  FeedForward --(+残差)--> MOEDecomp       FEA(q=S^{l,1}; k,v=X_en^N) --(+残差)--> MOEDecomp -> S^{l,2}, T^{l,2}
   |                                       |
  X_en^l (只留季节分量)                     FeedForward --(+残差)--> MOEDecomp -> S^{l,3}, T^{l,3}
                                           趋势累加: T^l = T^{l-1} + W1 T^{l,1} + W2 T^{l,2} + W3 T^{l,3}
                                        输出 = W_S · X_de^M + T_de^M
```

符号：$I$ 为输入长度，$O$ 为预测长度，$D$ 为隐维度。编码器输入是 $I\times D$，解码器输入是 $(I/2+O)\times D$（Figure 2 中的 Seasonal Init / Trend Init，具体初始化细节论文正文未展开 [待核实]）。

编码器第 $l$ 层（Eq. 1）：

$$
\begin{aligned}
S_{en}^{l,1} &= \mathrm{MOEDecomp}\big(\mathrm{FEB}(X_{en}^{l-1}) + X_{en}^{l-1}\big)\\
S_{en}^{l,2} &= \mathrm{MOEDecomp}\big(\mathrm{FeedForward}(S_{en}^{l,1}) + S_{en}^{l,1}\big)\\
X_{en}^{l} &= S_{en}^{l,2}
\end{aligned}
$$

解码器第 $l$ 层（Eq. 2）：

$$
\begin{aligned}
S_{de}^{l,1}, T_{de}^{l,1} &= \mathrm{MOEDecomp}\big(\mathrm{FEB}(X_{de}^{l-1}) + X_{de}^{l-1}\big)\\
S_{de}^{l,2}, T_{de}^{l,2} &= \mathrm{MOEDecomp}\big(\mathrm{FEA}(S_{de}^{l,1}, X_{en}^{N}) + S_{de}^{l,1}\big)\\
S_{de}^{l,3}, T_{de}^{l,3} &= \mathrm{MOEDecomp}\big(\mathrm{FeedForward}(S_{de}^{l,2}) + S_{de}^{l,2}\big)\\
X_{de}^{l} &= S_{de}^{l,3}\\
T_{de}^{l} &= T_{de}^{l-1} + W_{l,1} \cdot T_{de}^{l,1} + W_{l,2} \cdot T_{de}^{l,2} + W_{l,3} \cdot T_{de}^{l,3}
\end{aligned}
$$

最终预测 = $W_S \cdot X_{de}^{M} + T_{de}^{M}$，其中 $W_S$ 把季节分量投影到目标维度。

FEB（Frequency Enhanced Block）替代自注意力，FEA（Frequency Enhanced Attention）替代编码器-解码器交叉注意力。两者各有傅里叶版（-f）和小波版（-w）：用 -f 搭起来的整个模型称 FEDformer-f，用 -w 的称 FEDformer-w。**这是两个独立的模型版本**，论文表格里分两行报告。

## Frequency Enhanced Block：FEB-f

输入 $x\in\mathbb{R}^{N\times D}$（Eq. 3, 4）：

$$
\begin{aligned}
q &= x\, w, \qquad w \in \mathbb{R}^{D\times D}\ \text{（线性投影）}\\
Q &= \mathcal{F}(q) \in \mathbb{C}^{N\times D}, \qquad \mathcal{F}\ \text{为 DFT}\\
\tilde Q &= \mathrm{Select}(Q) \in \mathbb{C}^{M\times D}, \qquad \text{只保留随机选出的 }M\text{ 个模式，}M \ll N\\
Y &= \tilde Q \odot R, \qquad Y_{m,d_o} = \sum_{d_i} \tilde Q_{m,d_i}\, R_{d_i,d_o,m}\\
\text{FEB-f}(q) &= \mathcal{F}^{-1}\big(\mathrm{Padding}(Y)\big), \qquad \text{Padding：补零到 }N\times D\text{ 再逆变换}
\end{aligned}
$$

$R\in\mathbb{C}^{D\times D\times M}$ 是随机初始化的可学习核：**每个保留的频率模式 $m$ 有自己的 $D\times D$ 复数矩阵**，做通道混合。可以把它理解成"只在 $M$ 个频率上做的、逐频率不同的全连接"，类似 Fourier Neural Operator 里的谱卷积 [解读]（论文在相关工作中提到 FNO，但没有这样直接类比）。

## Frequency Enhanced Attention：FEA-f

$q$ 来自解码器，$k$、$v$ 来自编码器（Eq. 5-7）：

$$
\begin{aligned}
&\tilde Q = \mathrm{Select}(\mathcal{F}(q)),\quad \tilde K = \mathrm{Select}(\mathcal{F}(k)),\quad \tilde V = \mathrm{Select}(\mathcal{F}(v)), \qquad \text{各 }\in \mathbb{C}^{M\times D}\\
&\text{FEA-f}(q,k,v) = \mathcal{F}^{-1}\Big(\mathrm{Padding}\big(\sigma(\tilde Q \tilde K^\top)\, \tilde V\big)\Big)
\end{aligned}
$$

$\sigma$ 用 softmax 或 tanh（论文说两者在不同数据集上收敛表现不同；附录 F.4 称默认 tanh，并观察到 softmax 的注意力图更稀疏）。注意 $\tilde Q\tilde K^\top$ 是 **$M\times M$** 矩阵，它的大小只取决于保留的模式数 $M$，与序列长度无关——论文结论里称"频域增强结构把输入序列长度与注意力矩阵维度解耦"。

## 线性复杂度到底怎么来的

论文的说法（Section 3.2, 3.5）：完整 DFT 用 FFT 是 $O(L\log L)$；但"在 DFT 和逆 DFT 之前就选定模式下标"、模式数固定为常数 $M$ 时，时间和显存可进一步降到 $O(L)$。默认 $M=64$。

拆开看（以下为 [解读]，不是论文原话）：

- 只需要 $M$ 个频率的系数时，直接按定义算每个系数是 $O(L)$ 次乘加，$M$ 个系数是 $O(L\cdot M)$，$M$ 为常数故为 $O(L)$（避免了完整 FFT 的 log 因子）；
- 频域核 $R$ 的参数量是 $M\cdot D^2$，与 $L$ 无关；FEA 的注意力矩阵是 $M\times M$，也与 $L$ 无关；
- 实际实现是否真的绕过了完整 FFT，论文正文没有说明 [待核实]（Table 1 的 $O(L)$ 是理论口径）。

Table 1（训练复杂度与测试步数）：

模型 | 训练时间 | 训练显存 | 测试步数
-- | -- | -- | --
FEDformer | $O(L)$ | $O(L)$ | 1
Autoformer | $O(L\log L)$ | $O(L\log L)$ | 1
Informer | $O(L\log L)$ | $O(L\log L)$ | 1
Transformer | $O(L^2)$ | $O(L^2)$ | $L$
LogTrans | $O(L\log L)$ | $O(L^2)$ | 1
Reformer | $O(L\log L)$ | $O(L\log L)$ | $L$
LSTM | $O(L)$ | $O(L)$ | $L$

小波版 FEDformer-w：递归分解步数固定为 $L$（默认 3，论文用同一个字母 $L$ 表示序列长度和分解步数，注意区分）、模式数固定同 -f 时，论文称复杂度同样是 $O(L)$。

自拟示意算术（非论文数字，已手算）：设 $L=720$、$M=64$，则标准注意力矩阵有 $720^2 = 518400$ 个元素，而 FEA 的 $\tilde Q\tilde K^\top$ 有 $64^2 = 4096$ 个元素，约为 $518400/4096 \approx 126.6$ 倍之差。又设 $D=16$，则一个 FEB 的核 $R$ 有 $16\times 16\times 64 = 16384$ 个复数权重。再注意：当输入长度 $I=96$（论文主实验设置）时，$M=64$ 并不"远小于"序列长度，实序列 DFT 本身只有约一半独立频率 [解读]，因此在该设置下线性复杂度的实际收益有限；论文没有给出运行时间对比表 [待核实]。

## 随机选取频率模式的理论依据

**问题**：保留哪些频率？

- 只保留低频是常见做法，但论文认为一些趋势变化对应重要事件，全丢高频会丢失信息；
- 全保留则可能引入噪声（很多高频变化来自噪声输入）并过拟合历史。

**论文的做法与论证**（Section 2、附录 C）：从 $d$ 个傅里叶分量中**均匀随机**选 $s$ 个（$s<d$）。设 $m$ 条序列的傅里叶系数组成矩阵 $A\in\mathbb{R}^{m\times d}$（每行一条序列，每列一个频率分量），选择矩阵 $S\in\{0,1\}^{s\times d}$（$S_{i,k}=1$ 当且仅当第 $i$ 个被选分量是第 $k$ 个），$A' = A S^\top \in \mathbb{R}^{m\times s}$。用 $A'$ 的列空间对 $A$ 的每一列做投影 $P_{A'}(A)$，误差与 $A$ 的秩 $k$ 最优近似 $A_k$（取前 $k$ 个奇异值）比较。

**Theorem 1**：设 $A$ 的相干度（coherence）$\mu(A)$ 满足论文所述条件（正文 Theorem 1 与附录 Theorem 5 的陈述都写 $\Omega(k/n)$，附录证明最后一句却写 $\mu(A)=O(k/n)$，不一致 [待核实]），则以高概率

$$
\lVert A - P_{A'}(A) \rVert \le (1+\epsilon)\, \lVert A - A_k \rVert, \qquad s = O(k^2/\epsilon^2)
$$

（符号说明：论文把 $A$ 的行数写作 $m$、列数写作 $d$，定理中的 $n$ 指矩阵维度，论文未再逐一定义，证明细节见原文附录 C。）

**怎么读**：只要随机抽的列数 $s$ 的量级达到 $k^2$（$k$ 是 $A$ 的有效秩），投影误差就只比最优秩 $k$ 近似大 $(1+\epsilon)$ 倍。**与具体选了哪些频率无关**，所以不必依赖"低频更重要"的先验。证明（附录 C）直接引用 Drineas 等人关于 CUR 分解的结果，把 $s$ 的条件代入即得，附录中概率下界为 0.7。

论文进一步称：多变量序列的矩阵 $A$ 往往呈低秩，因为各变量互相依赖且共享相近频率成分，所以随机选频率能很好地表示 $A$。

**小波/Legendre 版本**（附录 B）：Legendre 多项式等小波正交多项式满足 RIP（restricted isometry property），沿用 Linformer 的 Johnson-Lindenstrauss 思路，论文给出 Theorem 3、4：用随机选出的傅里叶/Legendre 基放在注意力矩阵与 V 之间，计算量从 $O(N^2 d)$ 降到 $O(NMd)$，且误差有界（证明大量借用 Linformer，细节见 Wang et al., 2020）。

**经验验证**（Section 4.3、Figure 6）：在 ETT 四个数据集（h1/m1/h2/m2）上，模式数 $M\in\{2,4,8,\dots,256\}$ 下比较随机选择（rand）与只取最低频（fix），论文称 rand 更好，并且出现"模式饱和"——适当的随机模式数优于使用全部模式。论文还强调随机策略不需要先验、更易推广到新任务。

**[解读] 局限**：定理是关于"一个固定矩阵 $A$ 的列子采样"的，与"训练后的网络里 FEB 保留这些频率"之间还有距离；论文也没有说明随机下标是每层固定还是每步重采样（需看代码 [待核实]）；Figure 6 是在四个 ETT 数据集上的比较，其他数据集论文没有做同样的对比。

## 小波版：FEB-w / FEA-w

傅里叶只有全局频率信息；小波同时给出时间-频率局部信息，论文称小波更擅长捕捉局部结构。

**FEB-w**（Section 3.3、Figure 5）：用 Legendre 多项式为基的多小波（multiwavelet）变换，参考 Gupta et al. 2021。每一级递归把信号抽取为一半长度，分成三部分：高频部分、低频部分、剩余的原始低频部分 $X(L+1)$；论文说用"三个 FEB-f 模块"分别处理高频、低频和剩余部分（Eq. 9：$U_d = A d + B s$，$\hat U_s = C d$，$U_s = F s$；$A$、$B$、$C$ 为三个独立的 FEB-f，$F$ 为单层感知机，处理 $L$ 步分解后剩下的最粗信号）。分解步数 $L<\log_2 M$，实践中 $L=3$；三组 FEB-f 在不同分解级之间共享。重构阶段递归把 $X(L+1)$、$U_s(L)$、$U_d(L)$ 合成上一级 $X(L)$，每级长度翻倍。

**FEA-w**：重构部分与 FEB-w 相同，只改分解部分：同一个分解矩阵分别分解 q、k、v，三者共享同一组处理模块，把每个 FEB-f 换成 FEA-f，并另加一个 FEA-f 处理最粗尺度的 $q(L), k(L), v(L)$。

**用 -f 还是 -w**：论文 Appendix F.8 给的经验原则是：傅里叶版通常更适合较不复杂的序列，小波版更适合复杂序列，并据此说小波版在多变量序列上更有效、傅里叶版在单变量上更好，依据是排列熵（permutation entropy）——多变量序列的熵更高（Table 13：Electricity 0.910 vs 0.902、Traffic 0.792 vs 0.790、Exchange 0.961 vs 0.949、Illness 0.960 vs 0.867）。**[解读]** 这条原则并不严格：Table 2 的多变量结果里 ETTm2、Weather 是 -f 更好；而 Table 3 的单变量结果里 Traffic 四个预测长度全是 -w 更好、Exchange 多数长度也是 -w 更好。读者应以"两个版本互补、需分别试"为准，论文正文也这样说。

模式数的选择同样随数据复杂度：论文用排列熵与 SVD 熵衡量，ETTx1 比 ETTx2 熵高（排列熵 ETTh1 0.954、ETTh2 0.866、ETTm1 0.959、ETTm2 0.788），说明 ETTx1 需要更多模式（附录 F.7）。

## MOEDecomp：混合专家式的趋势提取

动机：真实数据里周期复杂并与趋势耦合，用单个固定窗口的滑动平均提趋势效果有限。

$$
X_{\text{trend}} = \mathrm{Softmax}(L(x)) \ast F(x) \qquad \text{(Eq. 10)}
$$

$F(\cdot)$ 是一组窗口大小不同的平均池化滤波器（"专家"），$L(x)$ 是线性层，给出数据相关的混合权重。季节分量取 $x - X_{\text{trend}}$（这一减法论文正文未明确写出，由"分解"含义推出 [解读]）。

自拟示意（非论文数字，已手算）：设两个专家得到的趋势分别为 $t_1$、$t_2$，权重 logits 为 $[0,\ \ln 3]$，则 softmax 权重为 $[1/(1+3),\ 3/(1+3)] = [0.25,\ 0.75]$，趋势为 $0.25\, t_1 + 0.75\, t_2$。

论文附录 F.5 对比：用单个核大小 24 的平均池化做分解为基线，MOEDecomp 在 ETT 和 Weather 上平均带来 2.96% 的提升（Section 4.2）。

## 训练与推理

- 训练设置（附录 F.2）：Adam，学习率 1e-4，batch size 32；验证集损失连续 3 个 epoch 不降则 early stopping；指标 MSE、MAE；所有实验重复 5 次取均值；PyTorch，NVIDIA V100 32GB。
- 数据划分 7:1:2（训练/验证/测试，附录 F.1）。
- 默认模式数 $M=64$；小波版递归分解步数 $L=3$（Section 3.5）。
- 推理：一次前向直接输出整个预测窗口（Table 1 测试步数为 1），不像 LSTM/Reformer 的逐步解码（Table 1 中二者测试步数为 $L$）。
- 隐藏维度 $D$、层数 $N/M$ 等超参的具体取值正文未给出 [待核实]（见代码）。

## 实验与结论

**设置**：沿用 Autoformer。输入长度 $I=96$，预测长度 $O\in\{96,192,336,720\}$；ILI 数据集 $I=36$，$O\in\{24,36,48,60\}$。六个数据集：ETT（正文表中为 ETTm2，完整 ETT 在附录 Table 8/9）、Electricity、Exchange、Traffic、Weather、ILI。对比方法：Autoformer、Informer、LogTrans、Reformer（论文称 Autoformer 在六个基准上最强，作为主要基线）。

**多变量结果**（Table 2，MSE，数字已对照渲染图核对；FEDformer-f/-w 两行分开列出；只摘部分列，预测长度取最短 / 最长）：

数据集 | 预测长度 | FEDformer-f | FEDformer-w | Autoformer
-- | -- | -- | -- | --
ETTm2 | 96 / 720 | 0.203 / 0.421 | 0.204 / 0.433 | 0.255 / 0.422
Electricity | 96 / 720 | 0.193 / 0.246 | 0.183 / 0.231 | 0.201 / 0.254
Exchange | 96 / 720 | 0.148 / 1.195 | 0.139 / 1.090 | 0.197 / 1.447
Traffic | 96 / 720 | 0.587 / 0.626 | 0.562 / 0.596 | 0.613 / 0.660
Weather | 96 / 720 | 0.217 / 0.403 | 0.227 / 0.424 | 0.266 / 0.419
ILI | 24 / 60 | 3.228 / 2.857 | 2.203 / 2.545 | 3.483 / 2.770

论文结论：FEDformer 在六个数据集所有预测长度上最优（每个格子取 -f 与 -w 中较好者），相对 Autoformer 平均 MSE 降低 14.8%，Exchange 和 ILI 上超过 20%；Exchange 没有明显周期性，FEDformer 仍有效。**注意版本**：上表 ILI 60 一列 FEDformer-f（2.857）反而比 Autoformer（2.770）差，ETTm2 的 720 列 -f 与 Autoformer 几乎持平，说明"全面优于"依赖于取 -f/-w 两者之一。

**单变量结果**（Table 3）：论文称相对 Autoformer 平均 MSE 降低 22.6%，Traffic、Weather 上超过 30%。同样 -f 与 -w 在不同数据集上各有胜负，论文称二者互补。预测长度 96 的 MSE：Traffic 上 -f 0.207、-w 0.170、Autoformer 0.246；ETTm2 上 -f 0.072、-w 0.063、Autoformer 0.065——这里 -f 比 Autoformer 差，-w 更好。单变量表里也并非每格 FEDformer 都最好（例如 Weather 上 Informer 的若干数值更小）。

**消融**（Table 4，ETTm1/ETTm2，多变量，FEDformer-f）：V1 只把自注意力换成 FEB、V2 只把交叉注意力换成 FEA、V3 两处都用 FEA、完整版 = 自注意力换 FEB + 交叉注意力换 FEA。相对 Autoformer 取得改进的格子数（共 16 个）：V1 为 10 个，V2 为 12 个，完整 FEDformer 为 16 个。

**分布分析**（Table 5，Kolmogorov-Smirnov 检验，ETTm1/ETTm2）：检验输入序列与预测输出是否来自同一分布，p 值越大越难拒绝。取 0.01 为阈值，Transformer、Informer 几乎都低于 0.01；Autoformer 与 FEDformer 的 p 值明显更大，FEDformer 是唯一在两个数据集全部 8 个设置下 p 值都大于 0.01 的模型。例如 ETTm1：FEDformer 为 0.048/0.028/0.015/0.014，Autoformer 为 0.020/0.015/0.012/0.008（预测长度 96/192/336/720）。论文还指出 ETTm1 上"真值"的 p 值（0.023/0.013/0.010/0.004）反而小于 FEDformer，说明分布接近来自模型的控制而不仅是预测更准。

**稳定性**（附录 F.6、Table 11）：5 次运行，FEDformer-f 的标准差较小，如 ETTm2 预测长度 96 为 0.203 ± 0.0042，说明频率选择的随机性对结果影响不大。

## 与 Autoformer 的区别

论文 Section 4.5 的说法：整体"分解编码器-解码器"架构与 Autoformer 相同，区别在特征提取方式。Autoformer 用自相关（auto-correlation）做 top-k 子序列相似度选择，傅里叶变换只是用来加速子序列相关的计算，相当于把序列分解为多个**时域子序列**；FEDformer 用频率变换把序列分解为多个**频域模式**，且不做子序列选择，所有频率特征都由整条序列全局计算，论文认为这种全局性使其在长序列上更好。

项目 | Autoformer | FEDformer
-- | -- | --
替换注意力的机制 | 自相关（时域 top-k 子序列） | 频域选模式后的混合/注意力（Section 4.5）
序列分解 | 论文 Section 3.4 称此前做法是固定窗口平均池化提趋势 | MOEDecomp，多窗口平均池化 + 数据相关权重（Section 3.4）
复杂度（论文 Table 1） | $O(L\log L)$ | $O(L)$
变体 | 单一 | -f、-w 两个版本

## 优缺点

论文自述的优势：线性复杂度（理论口径）、在六个基准上优于 Autoformer 等基线、预测分布更接近输入分布、两个版本互补。

**[经验/解读] 局限与注意点**（以下不是论文结论，均需自行验证）：

- 论文实验的基线只有四个 Transformer 系模型（Autoformer、Informer、LogTrans、Reformer），没有与线性或 MLP 模型比较；后续工作 DLinear 对 Transformer 系长期预测方法提出质疑（见综述 [深度学习时序方法](/0606_ML_Tasks_TimeSeries_Deep)），FEDformer 与这类简单模型在同类基准上的具体比较需另行查证 [待核实]；
- 复杂度结论是理论口径，论文没有提供速度/显存实测表；
- 随机选频的随机下标对结果有一定随机性，论文报告标准差较小，但仅在部分数据集上报告；
- 超参（$M$、$L$、$\sigma$ 的选择）对数据集敏感，论文承认 softmax/tanh 与 -f/-w 的优劣随数据集而变。

## 使用方式

官方代码仓库为 MAZiqing/FEDformer（见论文摘要）。下面是示意代码，只表达 FEB-f 的计算思路，**未运行验证**，与官方实现无对应关系。

```python
import torch

def feb_f(x, w, R, idx):
    """x:(B,N,D) w:(D,D) R:(M,D,D) complex idx:LongTensor(M) 选定的频率下标；示意代码，未运行验证"""
    q = x @ w
    Q = torch.fft.rfft(q, dim=1)               # (B, N//2+1, D)
    Qs = Q[:, idx, :]                          # Select：只留 M 个模式
    Y = torch.einsum("bmi,mio->bmo", Qs, R)    # 逐频率的 D×D 混合
    out = torch.zeros_like(Q)
    out[:, idx, :] = Y                         # Padding：其余补零
    return torch.fft.irfft(out, n=x.size(1), dim=1)
```

调参要点（来自论文设置）：$M$ 默认 64，小波版 $L$ 默认 3；FEA 的激活 softmax/tanh 可试；数据复杂（熵高）时用更多模式、优先尝试小波版。

## Reference

- Tian Zhou, Ziqing Ma, Qingsong Wen, Xue Wang, Liang Sun, Rong Jin. *FEDformer: Frequency Enhanced Decomposed Transformer for Long-term Series Forecasting*. ICML 2022. https://arxiv.org/abs/2201.12740
- 官方代码：https://github.com/MAZiqing/FEDformer（见论文摘要）

