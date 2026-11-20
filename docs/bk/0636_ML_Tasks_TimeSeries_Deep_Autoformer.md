-----

| Title     | ML Tasks TimeSeries Deep Autoformer                   |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-19T01:59:55Z`                                |
| Updated @ | `2026-11-20T08:12:55Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/636) |

-----

# Autoformer

Autoformer（论文 *Autoformer: Decomposition Transformers with
Auto-Correlation for Long-Term Series Forecasting*，Haixu Wu、Jiehui
Xu、Jianmin Wang、Mingsheng Long，清华大学，NeurIPS 2021）是面向**长期时间序列预测**的
Transformer 变体。一句话概括：把"趋势/季节分解"从预处理改造成网络内部的基本模块（**渐进式分解**），并用基于序列周期性的
**Auto-Correlation**（自相关 + 时延聚合）取代点积自注意力，把依赖发现和信息聚合从"点"提升到"子序列"层面，复杂度
$O(L\\log L)$。

本文属于时间序列深度模型系列，总览见 [时间序列](/0603_ML_Tasks_TimeSeries) 与
[深度模型](/0606_ML_Tasks_TimeSeries_Deep)；同系列的 DeepAR、TCN 见
[DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR)、[TCN](/0626_ML_Tasks_TimeSeries_Deep_TCN)。

## 解决什么问题

论文关注 **long-term forecasting**：预测长度 $O$ 很大（实验中取
96/192/336/720）。作者指出两个困难：

1.  长期未来的时间模式交织在一起（趋势、多种周期叠加），直接从原始序列里找时间依赖不可靠。
2.  标准自注意力对序列长度是二次复杂度；此前的 Informer、Reformer、LogTrans
    把注意力稀疏化，但仍是**点对点**（point-wise）聚合，稀疏化的同时丢了信息，成为"信息利用瓶颈"。

分解本是时间序列分析的标准做法，但预测场景里未来未知，所以只能作为对**历史序列**的预处理（论文提到
Prophet、N-BEATS、DeepGLO 都属此类）。这限制了分解的作用，也忽略了未来各分量之间的交互。Autoformer
的做法是让网络**在隐变量上边预测边分解**。

## 整体结构

Autoformer 仍是 residual + encoder-decoder 结构（见论文 Figure
1），关键改动有两处：Transformer 的 self-attention 换成
Auto-Correlation，每个子层之后加上序列分解块。

下图概括 Autoformer 的编码器与解码器结构。

``` 
 编码器 (N 层)                         解码器 (M 层)
 X_en^{l-1}                            X_de^{l-1}
   |                                     |
 Auto-Correlation + 残差                Auto-Correlation + 残差 -> SeriesDecomp -> S1, T1
   |                                     |
 SeriesDecomp (丢弃趋势)                Enc-Dec Auto-Correlation(Q=S1; K,V=编码器输出) + 残差
   |                                      -> SeriesDecomp -> S2, T2
 FeedForward + 残差                       |
   |                                    FeedForward + 残差 -> SeriesDecomp -> S3, T3
 SeriesDecomp (丢弃趋势)                  |
   |                                    趋势累积 T^l = T^{l-1} + W1*T1 + W2*T2 + W3*T3
 X_en^l  (只含季节项)                    X_de^l = S3
                         最终预测 = W_S * X_de^M + T_de^M
```

图中：

  - 左侧是编码器：每层先 Auto-Correlation 加残差，再分解并丢弃趋势，接着前馈加残差再分解，输出只含季节项的
    $X\_{en}^l$。
  - 右侧是解码器：每个子层之后分解出季节项 $S\_i$ 与趋势项 $T\_i$；季节项继续进入下一子层，趋势项累积为 $T^l$。
  - 最终预测是季节分量经 $W\_S$ 投影后与累积趋势之和。

### 序列分解块（Series Decomposition Block）

用滑动平均提取趋势项（trend-cyclical），残差作为季节项（seasonal）。对长度 $L$ 的输入 $X$（$L\\times
d$）：

$$ \\begin{aligned} X\_t &= \\mathrm{AvgPool}(\\mathrm{Padding}(X))
&&\\text{（趋势项，Padding 保证长度不变）}\\ X\_s &= X - X\_t &&\\text{（季节项）}\\
X\_s, X\_t &= \\mathrm{SeriesDecomp}(X) \\end{aligned} $$

其中：$X$ 是输入（$L\\times d$）；$\\mathrm{AvgPool}$ 是滑动平均池化，$\\mathrm{Padding}$
在两端填充以保持长度；$X\_t$ 是趋势项；$X\_s$ 是季节项；第三行是前两行的简写 $\\mathrm{SeriesDecomp}$。

论文 Algorithm 1 给出滑动窗口 $k=25$。这个块没有可学习参数，是一个固定的 moving average 平滑。

### 解码器输入

编码器输入是过去 $I$ 步 $X\_{en}$。解码器的输入由两部分组成，各长 $I/2+O$：

$$ \\begin{aligned} X\_{ens}, X\_{ent} &=
\\mathrm{SeriesDecomp}(X\_{en}\[I/2 : I\]) &&\\text{（取编码器输入后半段做分解）}\\
X\_{des} &= \\mathrm{Concat}(X\_{ens}, X\_0) &&\\text{（季节项初始化：后接
}O\\text{ 个 0）}\\ X\_{det} &= \\mathrm{Concat}(X\_{ent},
X\_{\\mathrm{Mean}}) &&\\text{（趋势项初始化：后接 }O\\text{ 个 }X\_{en}\\text{
的均值）} \\end{aligned} $$

其中：$X\_{en}\[I/2:I\]$ 是编码器输入的后半段；$X\_{ens},X\_{ent}$ 是其季节与趋势部分；$X\_0$
是长度 $O$ 的零占位符，$X\_{\\mathrm{Mean}}$ 是 $O$ 个 $X\_{en}$
均值；$X\_{des},X\_{det}$ 是解码器季节与趋势的初始输入。

### 编码器

编码器只关心季节项：每层内两次分解都把趋势部分丢掉（论文公式 3 里用 $\_$
表示被消除的趋势），输出携带"过去的季节信息"，作为解码器的交叉信息。

$$ \\begin{aligned} S\_{en}^{l,1}, \_ &=
\\mathrm{SeriesDecomp}\\big(\\mathrm{AutoCorrelation}(X\_{en}^{l-1}) +
X\_{en}^{l-1}\\big)\\ S\_{en}^{l,2}, \_ &=
\\mathrm{SeriesDecomp}\\big(\\mathrm{FeedForward}(S\_{en}^{l,1}) +
S\_{en}^{l,1}\\big)\\ X\_{en}^{l} &= S\_{en}^{l,2} \\end{aligned} $$

其中：$X\_{en}^{l-1}$ 是编码器第 $l$ 层输入；$S\_{en}^{l,1},S\_{en}^{l,2}$
是两次分解后保留的季节项；下划线 $\_$ 表示被丢弃的趋势项；$X\_{en}^{l}$
是该层输出，只含季节信息。

### 解码器

解码器分两条线：季节分量用堆叠的 Auto-Correlation 精修（内部一个 +
编码器-解码器一个），趋势分量则**累积**每次分解抽出的趋势（论文公式
4）：

$$ \\begin{aligned} S\_{de}^{l,1}, T\_{de}^{l,1} &=
\\mathrm{SeriesDecomp}\\big(\\mathrm{AutoCorrelation}(X\_{de}^{l-1}) +
X\_{de}^{l-1}\\big)\\ S\_{de}^{l,2}, T\_{de}^{l,2} &=
\\mathrm{SeriesDecomp}\\big(\\mathrm{AutoCorrelation}(S\_{de}^{l,1},
X\_{en}^{N}) + S\_{de}^{l,1}\\big)\\ S\_{de}^{l,3}, T\_{de}^{l,3} &=
\\mathrm{SeriesDecomp}\\big(\\mathrm{FeedForward}(S\_{de}^{l,2}) +
S\_{de}^{l,2}\\big)\\ T\_{de}^{l} &= T\_{de}^{l-1} + W\_{l,1} \\ast
T\_{de}^{l,1} + W\_{l,2} \\ast T\_{de}^{l,2} + W\_{l,3} \\ast
T\_{de}^{l,3} \\end{aligned} $$

其中：$X\_{de}^{l-1}$ 是解码器上一层输出；$S\_{de}^{l,i}$ 与 $T\_{de}^{l,i}$ 是第 $l$ 层第
$i$ 次分解得到的季节项与趋势项；$X\_{en}^{N}$ 是编码器最终输出，作为交叉注意力的键与值；$W\_{l,i}$
是对趋势项做投影的线性映射；$\\ast$ 表示线性映射；$T\_{de}^{l}$ 是累积的趋势分量。

其中 $W\_{l,i}$ 是对抽出趋势做投影的线性映射。最终预测是两个分量之和：$W\_S \\ast X\_{de}^{M} +
T\_{de}^{M}$，$W\_S$ 把季节分量投影到目标维度。论文 Figure 4
的可视化表明：去掉分解块时模型抓不到上升趋势与季节峰谷，逐个加上分解块后趋势逐步被拟合。

## Auto-Correlation 机制

### 动机：周期内同相位的子序列相似

论文观察到：不同周期里**相同相位**的子序列往往有相似的过程。于是不再逐点算
$\\mathrm{softmax}(QK^\\top)$，而是找"最可能的周期长度（时延）"，再把按该时延对齐后的子序列聚合起来。

### 自相关

对实值离散过程 ${X\_t}$，自相关为（论文公式 5）

$$ R\_{XX}(\\tau) = \\lim\_{L\\to\\infty} \\frac{1}{L} \\sum\_{t=1}^{L}
X\_t, X\_{t-\\tau} $$

其中：$R\_{XX}(\\tau)$ 是时延 $\\tau$ 的自相关；$X\_t$ 是 $t$ 时刻取值，$X\_{t-\\tau}$
是滞后 $\\tau$ 的取值；$L$ 是序列长度；求和平均衡量序列与其滞后版本的相似度。

$R(\\tau)$ 衡量序列与其滞后 $\\tau$ 序列的相似度；论文把它当作"周期长度为 $\\tau$ 的**未归一化置信度**"。

### 时延聚合（Time Delay Aggregation）

对单头情形，序列经投影得到 $Q,K,V$（长度 $L$）。论文公式 6：

$$ \\begin{aligned} \\tau\_1,\\dots,\\tau\_k &=
\\operatorname\*{arg,Topk}*{\\tau\\in{1,\\dots,L}}\\big(R*{Q,K}(\\tau)\\big),
\\qquad k = \\lfloor c \\log L \\rfloor\\ \\hat
R\_{Q,K}(\\tau\_1,\\dots,\\tau\_k) &=
\\mathrm{SoftMax}\\big(R\_{Q,K}(\\tau\_1,\\dots,\\tau\_k)\\big)\\
\\mathrm{AutoCorrelation}(Q,K,V) &= \\sum\_{i=1}^{k}
\\mathrm{Roll}(V,\\tau\_i), \\hat R\_{Q,K}(\\tau\_i) \\end{aligned} $$

其中：$Q,K,V$ 是查询、键、值（长度 $L$）；$R\_{Q,K}(\\tau)$ 是 $Q$ 与 $K$ 在时延 $\\tau$
的自相关；$\\arg\\mathrm{Topk}$ 选出自相关最大的 $k$ 个时延
$\\tau\_1,\\dots,\\tau\_k$，$k=\\lfloor c\\log L\\rfloor$；$\\hat R$ 是它们的
softmax 权重；$\\mathrm{Roll}(V,\\tau\_i)$ 是把 $V$ 按时延 $\\tau\_i$
循环移位；输出是各移位序列的加权和。

$c$ 是超参数（论文 Algorithm 2 设 $1\\le c\\le 3$）。$\\mathrm{Roll}(X,\\tau)$
表示把序列按时延 $\\tau$ 循环移位，被移出首位的元素重新接到末尾。多头版本和 Transformer
一致：$d\_{\\text{model}}$ 通道分成 $h$ 个头，每头独立做 Auto-Correlation，再拼接过
$W\_{\\text{output}}$（论文设 $d\_{\\text{model}}=512,\\ h=8$）。在
encoder-decoder 的 Auto-Correlation 中，$K,V$ 来自编码器输出，会被 resize 到长度
$O$（截断或补零），$Q$ 来自解码器上一块。

### 用 FFT 高效计算：Wiener–Khinchin 定理

`[解读]` 直接逐个滞后求和需要 $O(L^2)$。论文用 Wiener–Khinchin
定理：自相关是功率谱密度的逆傅里叶变换，而功率谱密度
= 信号傅里叶变换乘以它的共轭（公式 8）：

$$ \\begin{aligned} S\_{XX}(f) &= \\mathcal{F}(X\_t),
\\overline{\\mathcal{F}(X\_t)}\\ R\_{XX}(\\tau) &=
\\mathcal{F}^{-1}\\big(S\_{XX}(f)\\big) \\end{aligned} $$

其中：$X\_t$ 是序列；$\\mathcal F$ 是傅里叶变换，$\\mathcal F^{-1}$
是其逆变换，$\\overline{\\mathcal F(X\_t)}$ 是复共轭；$S\_{XX}(f)$
是功率谱密度，$f$ 是频率；$R\_{XX}(\\tau)$ 是时延 $\\tau$ 的自相关，可由一次 FFT
得到所有时延。

对 $Q,K$ 则是 $R\_{Q,K} =
\\mathcal{F}^{-1}\\big(\\mathcal{F}(Q),\\overline{\\mathcal{F}(K)}\\big)$。所有滞后
$1,\\dots,L$ 的自相关一次 FFT 就能全部算出，加上只聚合 $O(\\log L)$ 条长度 $L$ 的延迟序列，整体复杂度
$O(L\\log L)$。

### 一个自拟的小例子（自拟示意，数字已手工重算）

以下数字是为说明机制自拟的，**不是论文中的实验数据**。

**(a) 序列分解。** 取 $X=\[2,6,4,8,6,10\]$，窗口
$k=3$，两端用边界值复制填充（$\[2,2,6,4,8,6,10,10\]$；论文只写了
Padding，复制填充是本例的自拟假设，官方实现的具体填充方式 `[待核实]`）。滑动平均得到

$$ \\begin{aligned} \\text{趋势}\\ X\_t &= \\Big\[\\tfrac{2+2+6}{3},\\
\\tfrac{2+6+4}{3},\\ \\tfrac{6+4+8}{3},\\ \\tfrac{4+8+6}{3},\\
\\tfrac{8+6+10}{3},\\ \\tfrac{6+10+10}{3}\\Big\]\\ &= \[3.333,\\ 4,\\
6,\\ 6,\\ 8,\\ 8.667\]\\ \\text{季节}\\ X\_s &= X - X\_t = \[-1.333,\\
2,\\ -2,\\ 2,\\ -2,\\ 1.333\] \\end{aligned} $$

其中：$X$ 是输入序列；$X\_t$ 是滑动平均得到的趋势项；$X\_s$ 是季节项（原序列减趋势）；每个趋势值是窗口 $k=3$
内三点的平均。

趋势项平滑上升，季节项在正负之间交替。

**(b) 自相关与时延聚合。** 取 $L=8$ 的序列（令 $Q=K=V=x$ 以便手算）

$$ x = \[3, 1, -3, -1, 2, 1, -3, 0\] \\qquad \\text{（和为 0，近似周期 4）} $$

循环自相关 $R(\\tau)=\\sum\_t x\_t, x\_{(t-\\tau)\\bmod 8}$（FFT 算出的正是循环自相关）：

    tau :   0    1    2    3    4    5    6    7
    R   :  34    0  -32   -1   32   -1  -32    0

例如 $R(4) = 3\\cdot 2 + 1\\cdot 1 + (-3)(-3) + (-1)\\cdot 0 + 2\\cdot 3 +
1\\cdot 1 + (-3)(-3) + 0\\cdot(-1) = 32$，$R(2)$ 为 $-32$（相隔半个周期，反相）。取
$k=2$，Top-2 为 $\\tau=0$（$R=34$）和 $\\tau=4$（$R=32$；$\\tau=0$ 对应论文
$\\tau=L$，即不移位）。softmax 权重：

$$ \\begin{aligned} w\_0 &= \\frac{e^{34}}{e^{34} + e^{32}} =
\\frac{1}{1 + e^{-2}} = 0.8808\\ w\_4 &= 0.1192 \\end{aligned} $$

其中：$w\_0,w\_4$ 是时延 0 与 4 的 softmax 权重，由自相关值 $R(0)=34$、$R(4)=32$
归一化得到，自相关越大权重越大；$e$ 是自然常数。

$\\mathrm{Roll}(x,4)=\[2,1,-3,0,3,1,-3,-1\]$（$y\_t = x\_{(t+4)\\bmod
8}$），聚合输出

$$ \\begin{aligned} \\text{out} &= 0.8808, x + 0.1192, \\mathrm{Roll}(x,
4)\\ &= \[2.881,\\ 1,\\ -3,\\ -0.881,\\ 2.119,\\ 1,\\ -3,\\ -0.119\]
\\end{aligned} $$

其中：$x$ 是输入序列（令 $Q=K=V=x$）；$\\mathrm{Roll}(x,4)$ 是按时延 4 循环移位后的序列；$0.8808$
与 $0.1192$ 是两个时延的 softmax 权重；out 是聚合结果，每个位置融合了自身与"一个周期前同相位"的值。

例如 $\\text{out}\_0 = 0.8808\\cdot 3 + 0.1192\\cdot 2 =
2.881$，$\\text{out}\_4 = 0.8808\\cdot 2 + 0.1192\\cdot 3 =
2.119$。一个位置的输出融合了"前一个周期相同相位"的取值，而不是只看邻近时间点。实际模型里 $Q,K,V$
是不同的投影，且在多通道/多头上计算，这里只演示机制。

### 与自注意力家族的区别

论文 Figure 3 对比：全注意力连接所有点对；稀疏注意力（Reformer/Informer）按相似度挑点；LogSparse
按指数间隔挑点；Auto-Correlation
连接的是**不同周期之间的子序列**。聚合方式上，自注意力对被选中的点做点积加权，Auto-Correlation
用 `Roll` 对齐整段子序列后加权求和。

## 训练与推理

  - 训练：L2 损失，ADAM，初始学习率 `1e-4`，batch size 32，10 个 epoch 内 early
    stopping，每个实验重复三次，PyTorch，单张 NVIDIA TITAN RTX 24GB。
  - 结构超参：2 个编码器层、1 个解码器层，$d\_{\\text{model}}=512$，$h=8$，滑动窗口 $k=25$，$c$
    取 1 到 3。
  - 输入嵌入：沿用 Informer 的嵌入与 one-step
    generation（一次性生成整个预测段）；因为序列级聚合已含足够位置信息，Autoformer
    **不使用 position embedding**，保留 value embedding 与 time stamp
    embedding。
  - 数据划分：按时间顺序，ETT 为 6:2:2，其余为 7:1:2。
  - 加速版本：标准实现里的 `gather` 对内存访问不友好。论文附录给出"batch-normalization
    风格"的加速版：训练时把一个 batch 内的自相关取平均、并合并通道与头维度来确定
    lag；推理时仍用 `gather`。论文称全部实验结果来自加速版。
  - 推理：一次前向直接输出 $O$ 步，不做自回归逐步解码。

## 实验与结论

以下数字均来自论文表格（已对照渲染图）。设置：输入长度 $I=96$（ILI 为 36），预测长度 $O$ 取 {96, 192, 336,
720}（ILI 为 {24, 36, 48, 60}）。指标为 MSE / MAE，越低越好。

**数据集**：ETT（论文主表用 ETTm2，完整 ETTh1/ETTh2/ETTm1 见附录）、Electricity（321
个客户的小时用电量）、Exchange（8
国日汇率）、Traffic（加州交通部小时数据）、Weather（2020
年每 10 分钟，21 项气象指标）、ILI（美国 CDC 周度流感样病例）。覆盖能源、交通、经济、天气、疾病五类应用。

**多变量主结果**（论文 Table 1，Autoformer 的 MSE / MAE）：

| 数据集         | $O=96$        | $O=192$       | $O=336$       | $O=720$       |
| ----------- | ------------- | ------------- | ------------- | ------------- |
| ETT(ETTm2)  | 0.255 / 0.339 | 0.281 / 0.340 | 0.339 / 0.372 | 0.422 / 0.419 |
| Electricity | 0.201 / 0.317 | 0.222 / 0.334 | 0.231 / 0.338 | 0.254 / 0.361 |
| Exchange    | 0.197 / 0.323 | 0.300 / 0.369 | 0.509 / 0.524 | 1.447 / 0.941 |
| Traffic     | 0.613 / 0.388 | 0.616 / 0.382 | 0.622 / 0.337 | 0.660 / 0.408 |
| Weather     | 0.266 / 0.336 | 0.307 / 0.367 | 0.359 / 0.395 | 0.419 / 0.428 |

表中：「数据集」是评测集，四列分别是预测长度 $O=96,192,336,720$ 下 Autoformer 的 MSE /
MAE（越小越好）。结论：预测越长误差越大，Exchange 随长度增长最明显。

ILI（$O=24/36/48/60$）为 MSE 3.483 / 3.103 / 2.669 / 2.770。论文表中所有数据集与预测长度上
Autoformer 均为最优（对比 Informer、LogTrans、Reformer、LSTNet、LSTM、TCN）。论文称：在
input-96-predict-336 设置下，相对此前最好结果，ETT 的 MSE 降低 74%（1.334 到
0.339）、Electricity 18%、Exchange 61%、Traffic 15%、Weather 21%；ILI 的
input-36-predict-60 降低 43%；上述设置平均 MSE 降低 38%。作者还强调，在没有明显周期性的 Exchange
上仍有明显提升，且随预测长度增长性能变化较平稳。

**单变量**（论文 Table 2，ETT 与 Exchange，对比含
N-BEATS、DeepAR、Prophet、ARIMA）：Autoformer 在 ETT 上四个长度均最优（MSE
0.065 / 0.118 / 0.154 / 0.182）；Exchange 上 $O=96$ 时 ARIMA 最优（MSE
0.112，Autoformer 为 0.241），$O=192/336/720$ 时 Autoformer 最优（0.273 /
0.508 / 0.991）。论文对此的解释是 ARIMA 对非平稳经济数据有固有优势，但抵不住长期复杂模式。另注：论文正文写 ETT 在
$O=336$ 的单变量 MSE 降低 14%（0.180 到 0.145），而 Table 2 中 Autoformer 为
0.154，疑为正文笔误（0.180 到 0.154 约 14%），以表为准，`[待核实]`。

**消融**：

  - 分解架构（Table 3，ETT 多变量 MSE，$I=96$）：把渐进式分解架构套到
    Transformer、Informer、LogTrans、Reformer
    上，均优于原模型；也优于"预先分解后用两个模型分别预测再相加"（Sep）。例如
    Transformer 在 $O=720$ 时 MSE 从 2.672（Origin）、3.200（Sep）降到
    0.537（Ours）。论文指出预分解有时甚至带来负面效果（如 Transformer 的 $O=720$、Informer
    的 $O=336$）。
  - Auto-Correlation vs 注意力家族（Table 4，ETT 多变量，在 Autoformer 中替换该模块）：在所列
    $I\\in{96,192,336}$、$O\\in{336,720,1440}$ 的设置中 Auto-Correlation
    都是最优；例如 $I=96,\\ O=336$ 时 MSE 0.339，Full Attention
    0.375、LogSparse 0.362、LSH 0.366、ProbSparse 0.481。$I=192$ 和 $336$ 时
    $O=1440$ 的 Full Attention 报 out-of-memory（`-`）。
  - 学到的 lag（Figure 6）：论文对测试集每条序列统计解码器学到的 top-10
    lag（input-96-predict-336）。Traffic 上出现 24 与 168
    小时（日周期、周周期），Exchange
    上出现月/季/年周期；Electricity、Weather 的直方图标注了日周期等。
  - 效率（Figure 7）：训练阶段内存和耗时随输出长度的增长，Auto-Correlation 比
    Full/LSH/ProbSparse 注意力更平缓（图中读数，论文未给具体表格数字）。

## 局限与讨论

论文自述：

  - 若数据是随机的或时间相关性极弱，Autoformer 和其他模型一样会退化（可预测性差）。
  - 论文称没有发现异常失败案例，但上面 Exchange 的 $O=96$ 单变量结果输给 ARIMA，是一个具体反例。

`[解读]` / `[经验]`：

  - `[解读]` 自相关选出的是**全局**的 top-k 周期，对周期随时间变化、多个周期叠加或缺乏周期的序列，聚合效果依赖这些 lag
    的质量。
  - `[解读]` 趋势提取靠固定窗口 $k=25$ 的移动平均，窗口大小与数据采样频率、真实周期不一定匹配；论文附录有输入长度（Table
    7）和 $c$（Table 6）的敏感性分析，以及与 STL、HP/CF/BK 滤波器等其他分解算法做预处理的对比（Table
    9），但本文阅读范围内未见对 $k$ 的消融（`[待核实]`）。
  - `[经验]` 后续工作（如 DLinear 对线性模型的对比）指出 Transformer
    类长序列模型在若干基准上的优势并不稳定，本仓库综述
    [深度模型](/0606_ML_Tasks_TimeSeries_Deep)
    也有类似表述；使用时应与简单基线（DLinear、季节朴素）对比。
  - `[解读]` 按论文附录，加速版训练时对 batch 内自相关取平均，因此训练时选出的 lag 是 batch
    层面共享的，而不是每条样本各自选。

## 与相关方法对比

| 方法          | 依赖发现             | 聚合方式            | 复杂度（论文）           | 分解      |
| ----------- | ---------------- | --------------- | ----------------- | ------- |
| Transformer | 全点对 QK 点积        | 点级加权            | $O(L^2)$          | 无       |
| LogTrans    | 指数间隔选点           | 点级              | $O(L(\\log L)^2)$ | 无       |
| Reformer    | LSH 选点           | 点级              | $O(L\\log L)$     | 无       |
| Informer    | KL 散度 ProbSparse | 点级              | $O(L\\log L)$     | 无       |
| Autoformer  | 自相关选 top-k 时延    | 子序列级（Roll + 加权） | $O(L\\log L)$     | 内置渐进式分解 |

表中：「方法」是对比对象，「依赖发现」是挑选相关位置的方式，「聚合方式」是点级还是子序列级，「复杂度（论文）」是对序列长度 $L$
的复杂度，「分解」说明是否内置分解。结论：Autoformer 在子序列级聚合、内置分解的同时保持
$O(L\\log L)$。

  - 与 N-BEATS（论文把它列为"预处理式分解"的例子并作为单变量基线）相比：Autoformer 在隐变量上持续分解，N-BEATS
    用基函数展开。
  - `[解读]` 与 FEDformer（后续工作，非本论文内容）同属"分解 +
    频域/周期"思路，细节见原论文，`[待核实]`。DLinear
    同样使用移动平均分解（综述已述），但用线性层而非注意力。

## 使用方式

官方代码仓库为 `thuml/Autoformer`（论文摘要给出的链接）。下面是理解结构用的示意代码，未运行验证。

``` python
import torch

def series_decomp(x, k=25):            # x: [B, L, d]
    pad = (k - 1) // 2
    front = x[:, :1, :].repeat(1, pad, 1)
    end = x[:, -1:, :].repeat(1, pad, 1)
    xp = torch.cat([front, x, end], dim=1)
    trend = torch.nn.functional.avg_pool1d(xp.transpose(1, 2), k, 1).transpose(1, 2)
    return x - trend, trend

def auto_correlation(q, k, v, c=2):    # [B, L, d]，示意：忽略多头与加速版
    L = q.shape[1]
    corr = torch.fft.irfft(torch.fft.rfft(q, dim=1) * torch.fft.rfft(k, dim=1).conj(), n=L, dim=1)
    top = max(1, int(c * torch.log(torch.tensor(float(L)))))
    w, lag = torch.topk(corr.mean(dim=(0, 2)), top)    # 简化：对 batch 与通道取均值
    w = torch.softmax(w, dim=0)
    return sum(w[i] * torch.roll(v, shifts=-int(lag[i]), dims=1) for i in range(top))
```

示意代码中的复制填充与对 batch、通道取均值的 top-k 都是为简洁做的简化，并非官方实现的逐行对应。常用建议
`[经验]`：长序列预测先在 ETT、Electricity
等基准上用官方脚本复现，再替换数据；输入长度、$c$、窗口
$k$ 需按数据周期调；务必与 DLinear 等简单基线对照。

## Reference

  - [Autoformer: Decomposition Transformers with Auto-Correlation for
    Long-Term Series
    Forecasting](https://arxiv.org/abs/2106.13008)（arXiv:2106.13008，NeurIPS
    2021）
  - 官方代码：<https://github.com/thuml/Autoformer>
