---
Title | ML Tasks TimeSeries Deep Informer
-- | --
Created @ | `2026-11-19T01:59:53Z`
Updated @| `2026-11-20T08:12:30Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/635)

---
# Informer

Informer 出自 Zhou 等人的论文 *Informer: Beyond Efficient Transformer for Long Sequence Time-Series Forecasting*（arXiv:2012.07436，AAAI 2021；作者来自北航、UC Berkeley、Rutgers、SEDD 公司）。它是面向**长序列时间序列预测**（Long Sequence Time-series Forecasting, LSTF）的 Transformer 改进模型。

一句话概括：用 **ProbSparse 自注意力**把注意力的时间与内存降到 $O(L\log L)$，用**自注意力蒸馏**（self-attention distilling）逐层把序列长度减半，再用**生成式 decoder** 一次前向直接输出整段预测，从而同时解决 Transformer 做长序列预测时的三个瓶颈。

论文脚注称 ETT 数据集由作者收集并发布。`[经验]` 它是 Transformer 系长序列预测的代表作之一，后续的 Autoformer、FEDformer、PatchTST 等常以它为基线。`[待核实]` 它获得 AAAI 2021 最佳论文的说法不在论文 PDF 中，未核对。综述见 [时间序列总览](/0603_ML_Tasks_TimeSeries) 与 [深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)。

## 解决什么问题

### LSTF 的定义与难点

论文把问题写成滚动预测：时刻 $t$ 的输入 $X^t=\{x^t_1,\dots,x^t_{L_x}\mid x^t_i\in\mathbb R^{d_x}\}$，输出 $Y^t=\{y^t_1,\dots,y^t_{L_y}\mid y^t_i\in\mathbb R^{d_y}\}$，LSTF 要求输出长度 $L_y$ 比以往工作更长，且 $d_y\ge1$（不限于单变量）。

论文用 LSTM 在 ETT 上的预测说明动机：预测长度超过 48 点后，MSE 急剧上升、推理速度骤降（原文 Fig.1）。LSTF 的核心挑战是提高模型的 **prediction capacity**，需要 (a) 很强的长程对齐（输出与输入之间的依赖）能力，(b) 对长输入长输出的高效运算。

### 原始 Transformer 的三个问题

论文列出的三点限制：

1. **自注意力的二次复杂度**：canonical dot-product 使每层时间和内存都是 $O(L^2)$。
2. **堆叠层的内存瓶颈**：$J$ 层 encoder/decoder 的总内存 $O(J\cdot L^2)$，限制可接收的输入长度。
3. **长输出的速度骤降**：动态解码（step-by-step）使推理与 RNN 一样慢，并且有误差累积。

论文指出已有的高效注意力（Sparse Transformer、LogSparse Transformer、Longformer 用启发式规则；Reformer 用 LSH；Linformer 用低秩投影）基本只针对第 1 点；Informer 同时处理三点，这是标题 "Beyond Efficient Transformer" 的含义。

## 核心思想与结构

整体结构仍是 encoder-decoder：


下图概括 Informer 的 encoder-decoder 结构。

```
 长输入 X_en (L_x)                              X_de = {X_token, X_0}
      |                                               |
 Input Representation (标量投影 + 位置 + 时间戳嵌入)   Input Representation
      |                                               |
 +------------------------+                    +--------------------------+
 | Encoder                |                    | Decoder (2 层)           |
 |  ProbSparse Attn       |                    |  Masked ProbSparse Attn  |
 |  Distilling (L -> L/2) |   feature map      |  Multi-head Attn(看enc)  |
 |  ProbSparse Attn       | -----------------> |  FC 层, 一次前向输出     |
 |  Distilling (L/2->L/4) |                    +--------------------------+
 |  ... 多个减半副本拼接   |                                |
 +------------------------+                       Y (整段 L_y 预测)
```

图中：

- 左侧是 Encoder：长输入经输入表示后依次通过 ProbSparse 注意力与蒸馏（序列长度每次减半），多个减半副本拼接成特征图。
- 右侧是 Decoder（2 层）：输入是 start token 与零占位符的拼接，先做带掩码的 ProbSparse 自注意力，再对 encoder 特征图做多头注意力，最后全连接层一次前向输出整段预测 $Y$。
- 关键结论：注意力复杂度降为 $O(L\log L)$，蒸馏降低内存，生成式解码避免逐步预测。

### Input Representation

论文（附录 B）用统一的输入表示：标量值经 1-D 卷积（kernel width 3, stride 1）投影到 `d_model` 维，再加上固定位置编码（sin/cos）和**可学习的全局时间戳嵌入**（分钟、小时、周、月、节假日等，词表上限 60）：

$$
X_{\text{feed}}[i]=\alpha u_i+\mathrm{PE}(\cdots)+\sum_p\mathrm{SE}(\cdots)_p\tag{8}
$$


其中：$X_{\text{feed}}[i]$ 是第 $i$ 个时间点输入网络的向量；$u_i$ 是经 1-D 卷积投影后的标量值；$\alpha$ 是平衡系数；$\mathrm{PE}$ 是固定位置编码；$\mathrm{SE}$ 是可学习的全局时间戳嵌入，$p$ 遍历不同的时间类别（分钟、小时、周、月、节假日等）。

（论文 Eq.8；$\alpha$ 为平衡系数，输入已归一化时推荐 $\alpha=1$。）

论文称 decoder 的预测只依赖时间戳。`[解读]` 即时间戳让 decoder 在输入里只有"目标时刻的时间信息"（数值位为 0）时也能定位输出。

### ProbSparse 自注意力

**1. 把注意力写成核平滑**。第 $i$ 个 query 的注意力为

$$
\begin{aligned}
A(q_i,K,V)&=\sum_j\frac{k(q_i,k_j)}{\sum_l k(q_i,k_l)}\,v_j=\mathbb E_{p(k_j\mid q_i)}[v_j]\\
k(q_i,k_j)&=\exp\!\left(\frac{q_ik_j^{\top}}{\sqrt d}\right)
\end{aligned}
$$


其中：$A(q_i,K,V)$ 是第 $i$ 个 query 的注意力输出；$k(q_i,k_j)$ 是 query 与第 $j$ 个 key 的核函数（指数化的缩放点积）；$d$ 是维度；分母 $\sum_l k(q_i,k_l)$ 把权重归一化；$p(k_j\mid q_i)$ 是注意力分布，输出是 $v_j$ 在该分布下的期望。

即 value 在分布 $p(k_j\mid q_i)$ 下的期望。

**2. 动机：注意力呈长尾分布**。论文在 ETTh1 上训练 4 层标准 Transformer，看第 1 层的 softmax 分数（附录 C，Fig.7），发现少数点积对贡献了主要注意力，其余可忽略。如果某个 query 的 $p(\cdot\mid q_i)$ 接近均匀分布，则它的输出约等于对 $V$ 取平均，这样的 query 是"懒惰"的、对输入几乎没有加工；真正有信息的是分布远离均匀的"活跃" query。

**3. query 稀疏性度量**。用均匀分布 $q$ 与 $p$ 的 KL 散度衡量"远离均匀"的程度，去掉常数 $\ln L_K$ 后得到

$$
M(q_i,K)=\ln\sum_{j=1}^{L_K}\exp\!\left(\frac{q_ik_j^{\top}}{\sqrt d}\right)-\frac{1}{L_K}\sum_{j=1}^{L_K}\frac{q_ik_j^{\top}}{\sqrt d}\tag{2}
$$


其中：$M(q_i,K)$ 是第 $i$ 个 query 的稀疏性度量；$L_K$ 是 key 个数；$q_ik_j^{\top}/\sqrt d$ 是缩放点积；第一项是对数和指数（Log-Sum-Exp），第二项是算术平均；二者之差越大，该 query 的注意力分布越偏离均匀。

第一项是 Log-Sum-Exp，第二项是算术平均。$M$ 越大，注意力分布越"尖"，越可能含有长尾头部的主导点积对。

**4. ProbSparse**。只保留 Top-$u$ 个 query 做完整注意力：

$$
A(Q,K,V)=\mathrm{Softmax}\!\left(\frac{\bar Q K^{\top}}{\sqrt d}\right)V\tag{3}
$$

$$
u=c\cdot\ln L_Q
$$


其中：$\bar Q$ 是只含 Top-$u$ 个活跃 query 的稀疏矩阵（与 $Q$ 同尺寸，其余行为 0）；$K,V$ 是键与值矩阵；$d$ 是维度；$u$ 是保留的 query 个数；$c$ 是采样因子常数；$L_Q$ 是 query 个数。

（论文 Eq.3，$\bar Q$ 与 $Q$ 同尺寸，只含 Top-$u$ query；$c$ 为采样因子常数。）

于是每次 query-key 查询只需约 $O(\ln L_Q)$ 次点积，每层内存 $O(L_K\ln L_Q)$。每个 head 选出的稀疏 query 不同，论文认为这样可避免严重的信息损失。（注意论文原文写的是"allowing each key to only attend to the u dominant queries"，按 Eq.3 与 Algorithm 1 的实际操作，应理解为 `[解读]` 只有 Top-$u$ 个 query 去 attend 全部 key。）

**5. 近似：max-mean**。直接算 $M$ 要遍历全部点积（仍是 $O(L_QL_K)$），且 LSE 有数值稳定性问题。论文给出 Lemma 1：

$$
\ln L_K\ \le\ M(q_i,K)\ \le\ \max_j\left\{\frac{q_ik_j^{\top}}{\sqrt d}\right\}-\frac{1}{L_K}\sum_j\frac{q_ik_j^{\top}}{\sqrt d}+\ln L_K
$$


其中：$M(q_i,K)$ 是稀疏性度量；上下界分别对应均匀分布（$\ln L_K$）与 max-mean 上界；$q_i,k_j$ 是第 $i$ 个 query 与第 $j$ 个 key；$L_K$ 是 key 个数；$d$ 是向量维度。该引理说明 max-mean 可以作为 $M$ 的近似。

于是提出 max-mean 度量：

$$
\bar M(q_i,K)=\max_j\left\{\frac{q_ik_j^{\top}}{\sqrt d}\right\}-\frac{1}{L_K}\sum_j\frac{q_ik_j^{\top}}{\sqrt d}\tag{4}
$$


其中：$\bar M(q_i,K)$ 是 max-mean 稀疏性度量，等于最大缩放点积减去平均缩放点积，值越大表示 query 越"活跃"；$k_j$ 是第 $j$ 个 key；$L_K$ 是 key 个数；$d$ 是维度。

并在长尾假设下只随机采样 $U$ 个点积对来估计 $\bar M$（其余填 0），再从中选 Top-$u$。max 算子对 0 不敏感，数值稳定。论文在附录 D 的 Proposition 1 中给出了"Top-$u$ 范围近似成立"的论证（对 key 做高斯假设、用对数正态和近似；`[解读]` 属于启发式论证而非严格证明）。当 $L_Q=L_K=L$ 时，总时间与空间复杂度为 $O(L\ln L)$。

**6. 未被选中的 query 输出什么**。论文附录 Algorithm 1：Top-$u$ query 用 softmax 注意力，其余行输出 `mean(V)`；带 mask 的 decoder 用 `cumsum(V)` 的累积均值实现。

Algorithm 1 的步骤（$Q\in\mathbb R^{m\times d}$，$K,V\in\mathbb R^{n\times d}$）：

```
1. 设超参 c，u = c·ln m，U = m·ln n
2. 从 K 中随机选 U 个点积对作为 K̄
3. 采样得分 S̄ = Q K̄^T
4. 按行算 M = max(S̄) - mean(S̄)
5. 取 M 最大的 Top-u query 作为 Q̄
6. S1 = softmax(Q̄ K^T/√d) · V
7. S0 = mean(V)
8. 按原行位置合并 S = {S1, S0}
```

`[解读]` 论文正文写 $U=L_K\ln L_Q$，Algorithm 1 写 $U=m\ln n$（$m=L_Q$，$n=L_K$），两处下标不一致；二者在 $L_Q=L_K$ 时相同，不影响主结论。

### 自拟小例子：M、max-mean 与 Top-u

`[自拟示意，数字为演示手算，非论文数据]` 设 $L_K=4$，4 个 query 对 4 个 key 的缩放点积 $q_ik_j^{\top}/\sqrt d$ 为（每行 4 个数）：

query | 缩放得分 | softmax 权重 p | $M$ (Eq.2) | $\bar M$ (Eq.4) | $\mathrm{KL}(\text{均匀}\Vert p)=M-\ln4$
-- | -- | -- | -- | -- | --
q1 | [0, 0, 0, 0] | [0.25, 0.25, 0.25, 0.25] | 1.386 | 0 | 0
q2 | [2, 0, 0, 0] | [0.711, 0.096, 0.096, 0.096] | 1.841 | 1.5 | 0.454
q3 | [1, 1, 0, 0] | [0.366, 0.366, 0.134, 0.134] | 1.506 | 0.5 | 0.120
q4 | [3, 1, -1, -3] | [0.865, 0.117, 0.016, 0.002] | 3.145 | 3 | 1.759

表中：「query」是 4 个示例 query，「缩放得分」是它对 4 个 key 的缩放点积，「softmax 权重 p」是对应注意力分布，「$M$」与「$\bar M$」是两种稀疏性度量，最后一列是与均匀分布的 KL 散度。结论：两种度量排序一致，分布越尖（如 q4）度量越大。

手算过程（以 q4 为例）：$\sum\exp=e^{3}+e^{1}+e^{-1}+e^{-3}=20.086+2.718+0.368+0.050=23.221$，$\ln 23.221=3.145$，均值为 0，故 $M=3.145$；$\text{max-mean}=3-0=3$。再以 q3 为例：$\sum\exp=2e+2=7.437$，$\ln 7.437=2.006$，均值 0.5，$M=1.506$；用定义直接算 KL：$0.5\ln(0.25/0.3655)+0.5\ln(0.25/0.1345)=0.5\cdot(-0.380)+0.5\cdot0.620=0.120$，与 $M-\ln4=0.120$ 一致。

要点：

- 两种度量排序一致：q4 > q2 > q3 > q1。取 $u=2$ 就选出 q4、q2，让它们做完整注意力；q1、q3 输出 `mean(V)`。
- 满足 Lemma 1：例如 q2 有 $1.386\le1.841\le1.5+1.386=2.886$；q4 有 $1.386\le3.145\le3+1.386=4.386$。$M$ 的下界 $\ln L_K$ 对应均匀分布（q1 取到）。
- 近似是有损的：令 $V=[1,2,3,4]$（标量，仅作演示），q1 的精确输出 $=2.5=\mathrm{mean}(V)$，无损；q3 精确输出 $0.3655\cdot1+0.3655\cdot2+0.1345\cdot3+0.1345\cdot4=2.038$，用 $\mathrm{mean}(V)=2.5$ 替代会差 0.46；q4 精确输出 $\approx1.155$，差异大，正是应当保留的 query。所以 Top-$u$ 的合理性依赖"多数 query 近似均匀"这一长尾假设。
- 真实规模：论文设 $c=5$。若 $L=96$，则 $u=5\cdot\ln96\approx22.8$（取整规则 `[待核实]`），也就是 96 个 query 中只对约 23 个算完整注意力；$L=720$ 时约 33（$5\cdot\ln720\approx32.9$，自算）。

### 自注意力蒸馏

ProbSparse 的结果是 encoder 特征图里 $V$ 的组合有冗余。论文用类似空洞卷积的"蒸馏"操作，把第 $j$ 层变到第 $j+1$ 层：

$$
X^{t}_{j+1}=\mathrm{MaxPool}\Big(\mathrm{ELU}\big(\mathrm{Conv1d}([X^t_j]_{\mathrm{AB}})\big)\Big)\tag{5}
$$


其中：$X^t_j$ 是第 $j$ 层的 encoder 输出；$[\cdot]_{\mathrm{AB}}$ 是 attention block；$\mathrm{Conv1d}$ 是沿时间维的一维卷积；$\mathrm{ELU}$ 是激活；$\mathrm{MaxPool}$ 是步长 2 的最大池化，使序列长度减半；$X^t_{j+1}$ 是下一层输入。

$[\cdot]_{\mathrm{AB}}$ 是 attention block（含多头 ProbSparse 注意力和 FFN 等），`Conv1d` 在时间维上做 kernel width=3 的一维卷积，ELU 激活，再接 stride=2 的 max-pooling，使序列长度逐层减半。因为每层输入长度减半，总内存为 $O((2-\epsilon)L\log L)$（$\epsilon$ 为小量）。 `[自算]` 如 $L=96$ 时各层长度约 $96\to48\to24$，各层的内存之和是几何级数，小于首层的 2 倍，这就是 $(2-\epsilon)$ 的来源。

为增强鲁棒性，论文再建**输入减半的副本 stack**，并逐个少用一层蒸馏，使各 stack 输出维度对齐，最后把所有 stack 的输出**拼接**得到 encoder 的最终表示（金字塔结构，原文 Fig.2/3）。实验中 encoder 为"3 层主 stack + 1 层（1/4 输入）stack"，decoder 为 2 层。

### 生成式 decoder

decoder 是标准的两层多头注意力结构，但输入改为：

$$
X_{\text{de}}=\mathrm{Concat}\big(X_{\text{token}},X_0\big)\in\mathbb R^{(L_{\text{token}}+L_y)\times d_{\text{model}}}\tag{6}
$$


其中：$X_{\text{de}}$ 是 decoder 的输入；$X_{\text{token}}$ 是从已知序列取出的 start token（长度 $L_{\text{token}}$）；$X_0$ 是目标时段的占位符，标量为 0 但带时间戳；$L_y$ 是预测长度；$d_{\text{model}}$ 是隐层维度。

$X_{\text{token}}$ 是 start token，$X_0$ 是目标序列的占位符（标量置 0，但带有目标时刻的时间戳）。与 NLP 中用特定标记符不同，论文**直接从输入序列里取一段**（目标之前的一段已知序列）作为 token。论文例子：预测 168 点（7 天）时，取目标之前已知的 5 天作为 start token，$X_{\text{de}}=\{X_{5\mathrm{d}},X_0\}$。`[自算]` 若为小时粒度，则 token 120 点，decoder 输入长 $120+168=288$。

decoder 里的自注意力带 mask（把被屏蔽的点积置为 $-\infty$），防止位置看到未来；最后用一个全连接层输出，输出维度 $d_y$ 决定是单变量还是多变量预测。因此从单变量改多变量，只需改最后的 FCN 层。

由此得到：训练时和推理时都是一次前向输出全部 $L_y$ 个点，避免动态解码的累积误差，推理步数为 1（论文 Table 4）。

### 损失函数

对预测序列与真值序列直接用 **MSE** 损失，梯度从 decoder 输出回传整个模型。

## 训练与推理

训练设置（论文正文 Experimental Details 与附录 E）：

项目 | 论文设置
-- | --
优化器 | Adam，初始学习率 `1e-4`，每个 epoch 衰减为一半
训练轮数 / batch size | 总共 8 个 epoch（配 early stopping）；batch size 32
归一化 | 输入零均值（标准化，均值 0、标准差 1）
结构超参 | `d_model=512`；encoder 多头 $h=16$、每头 $d=32$，decoder 多头 $h=8$、$d=64$；FFN 内层 2048；dropout 0.1；FFN 激活 GELU
采样因子 | $c=5$（参数敏感性实验选定）
调参 | 网格搜索；encoder 层数在 {6,4,3,2} 中选，decoder 固定 2 层；输入长度与 token 长度在 {24,48,96,168,336,480,720}（ETTm 为 {24,48,96,192,288,480,672}）中选
重复 | 保留 10% 验证数据，沿时间做 5 次随机 train/val 划分，结果取 5 次平均
硬件 | 单张 Nvidia V100 32GB

表中：「项目」是训练设置，「论文设置」是对应取值（$h$ 为注意力头数，$d$ 为每头维度，$c$ 为 ProbSparse 采样因子）。

推理：把 $X_{\text{token}}$（输入序列末尾附近的一段）和零占位符拼成 decoder 输入，**一次前向**输出整个预测窗口；评估时对整个测试集按 stride=1 滚动。论文强调 decoder 的预测只依赖时间戳，因而可以带偏移预测（见消融 Table 6）。

## 实验与结论

以下数字全部来自论文 Table 1~6 与正文（对着渲染图核对过）。

### 数据集

数据集 | 内容 | 划分（train/val/test）
-- | -- | --
ETTh1, ETTh2 | 2 年、两个县的变压器数据，小时级；目标 "oil temperature" + 6 个负载特征 | 12/4/4 个月
ETTm1 | 同类数据，15 分钟级 | 12/4/4 个月
ECL | 321 个用户的用电量，转成 2 年的小时级，目标 `MT_320` | 15/3/4 个月
Weather | 美国约 1600 个地点，2010~2013 共 4 年，小时级；目标 "wet bulb" + 11 个气候特征 | 28/10/10 个月

表中：「数据集」是评测集，「内容」说明数据来源与目标变量，「划分」是训练/验证/测试的时间划分（ETT 等按月）。

论文说"四个数据集"（ETT 算一个，含 3 个子集），实验表中共 5 列。预测窗口：ETTh、ECL、Weather 为 {1d, 2d, 7d, 14d, 30d, 40d}（表中为 24/48/168/336/720 点，ECL 为 48/168/336/720/960 点），ETTm 为 {6h, 12h, 24h, 72h, 168h}。指标为 MSE 与 MAE。

基线：ARIMA、Prophet、LSTMa、LSTnet、DeepAR，以及 LogTrans（LogSparse 自注意力）、Reformer，和用标准注意力的变体 Informer†。

### 单变量结果（论文 Table 1，MSE，节选）

数据集/预测长度 | Informer | Informer† | LogTrans | Reformer | LSTMa | DeepAR | ARIMA | Prophet
-- | -- | -- | -- | -- | -- | -- | -- | --
ETTh1 / 168 | 0.183 | 0.187 | 0.207 | 1.522 | 0.236 | 0.239 | 0.396 | 1.224
ETTh1 / 720 | 0.269 | 0.257 | 0.273 | 2.112 | 0.683 | 0.658 | 0.659 | 2.735
ECL / 48 | 0.239 | 0.238 | 0.280 | 0.971 | 0.493 | 0.204 | 0.879 | 0.524
ECL / 960 | 0.582 | 0.594 | 0.624 | 7.019 | 1.545 | 0.657 | 1.370 | 6.901

表中：「数据集/预测长度」是评测设置，其余各列是各方法的单变量预测 MSE（越小越好）；Informer† 是用标准注意力的变体。结论：Informer 在多数设置下最优，ECL 的短预测上 DeepAR 更好。

最后一行 Count（获得最优的次数，MSE 与 MAE 合计 50 项）：Informer 32，Informer† 12，DeepAR 6，其他为 0。

### 多变量结果（论文 Table 2，MSE，节选）

数据集/预测长度 | Informer | Informer† | LogTrans | Reformer | LSTMa | LSTnet
-- | -- | -- | -- | -- | -- | --
ETTh1 / 24 | 0.577 | 0.620 | 0.686 | 0.991 | 0.650 | 1.293
ETTh1 / 720 | 1.215 | 1.241 | 1.397 | 2.415 | 1.960 | 2.143
ETTm1 / 672 | 1.192 | 1.231 | 1.669 | 2.187 | 2.736 | 1.917
Weather / 720 | 0.831 | 0.834 | 0.885 | 2.726 | 1.536 | 0.851
ECL / 960 | 0.460 | 0.492 | 0.477 | 2.141 | 1.591 | 0.605

表中：「数据集/预测长度」是评测设置，其余各列是各方法的多变量预测 MSE（越小越好）。结论：Informer 在多数设置下最优，但多变量下的优势比单变量小。

Count：Informer 33，Informer† 14，LogTrans 1，LSTnet 2，其余 0。

### 论文的结论性陈述

- 单变量：Informer 相对 LSTMa 的 MSE 降低 26.8%（预测 168）、52.4%（336）、60.1%（720）；相对 DeepAR、ARIMA、Prophet 平均降低 49.3%、61.1%、65.1%（同样三个长度）。论文承认在 ECL 上 DeepAR 在较短预测（≤336）更好，Informer 在更长预测上超过。（这些百分比为论文自述，作者未在表里逐项给出，我未逐项复算。）
- 多变量：相对 LSTMa 与 LSTnet，MSE 平均降低 26.6%（168）、28.2%（336）、34.3%（720）。论文自己指出，多变量下的优势比单变量小，猜测与特征维度预测能力的各向异性有关，"超出本文范围，留作未来工作"。
- Reformer 保持动态解码，在 LSTF 上表现很差；论文认为其他方法受益于生成式非自回归 decoder。
- 粒度对比：ETTm1 的 {96,288,672} 与 ETTh1 的 {24,48,168} 在时间跨度上对齐，Informer 在不同粒度上都优于基线。

### 参数敏感性（ETTh1，单变量，论文 Fig.4）

- 输入长度：预测短序列（如 48）时，先增加输入长度反而变差，再增加又下降；预测长序列（如 168）时，输入越长 MSE 越低。
- 采样因子 c：从 3 起增大，性能略升后趋于稳定，论文据此认为"存在冗余点积对"，实践中取 $c=5$。
- 多 stack 组合：论文选择"$L$ 与 $L/4$"两个 stack 的组合，称其最鲁棒（Fig.4c）。

### 消融（ETTh1，单变量）

**ProbSparse 注意力（Table 3，MSE，预测长度 336 / 720，batch 8、heads 8、dim 64 的精简设定）**：

预测长度 / 输入长度 | Informer（ProbSparse） | Informer†（标准注意力） | LogTrans | Reformer
-- | -- | -- | -- | --
336 / 336 | 0.249 | 0.241 | 0.263 | 1.875
336 / 720 | 0.225 | 0.214 | 0.231 | 1.865
336 / 1440 | 0.216 | OOM | OOM | 1.861
720 / 720 | 0.271 | 0.259 | 0.273 | 2.243
720 / 1440 | 0.261 | OOM | OOM | 2.174
720 / 2880 | 0.257 | OOM | OOM | 2.113

表中：「预测长度 / 输入长度」是评测设置，其余四列是不同注意力在该设置下的 MSE（越小越好，OOM 表示内存溢出）。结论：输入较短时标准注意力略好，输入很长时只有 ProbSparse 能运行。

读法：输入长度较短时，标准注意力略好（如 0.241 对 0.249），ProbSparse 的 MSE 与它相当（论文称"comparable"）；输入长到 1440 以上时标准注意力和 LogTrans 内存溢出，ProbSparse 仍能运行。论文说 LogTrans 溢出是因为其公开实现用对完整注意力加 mask，内存仍是 $O(L^2)$。

**自注意力蒸馏（Table 5，MSE）**：论文正文称以标准注意力版本 Informer† 为基准来排除 ProbSparse 的影响，比较有无蒸馏。`[解读]` 但 Table 5 带蒸馏那一行（336 输入为 0.249/0.393）与 Table 3 的 ProbSparse 行相同，而非标准注意力行（0.241/0.383），说明论文各表的 † 符号含义不一致，这一行很可能就是完整 Informer。预测长度 336 时，该带蒸馏行的输入 336/480/720/960/1200 对应 MSE 为 0.249/0.208/0.225/0.199/0.186；去掉蒸馏的版本只有输入 336/480/720 能跑，分别是 0.229/0.215/0.204，更长输入内存溢出。预测长度 480 时，带蒸馏的 0.197/0.243/0.213/0.192/0.174，去掉蒸馏为 0.224/0.208/0.197 后同样溢出。`[解读]` 在两者都能跑的短输入上，有无蒸馏的 MSE 互有胜负，蒸馏的主要价值是让更长输入可行，进而在长输入下取得更低 MSE。论文的结论是"蒸馏值得采用，尤其是需要更长预测时"。

**生成式 decoder（Table 6，MSE，带偏移预测）**：预测长度 336，偏移 +0/+12/+24/+48/+72，生成式 decoder 为 0.207/0.209/0.211/0.211/0.216；动态解码版本只在 +0 给出 0.201，其余偏移结果"不可接受"（表中为 `-`）。预测长度 480，偏移 +0/+48/+96/+144/+168，生成式为 0.198/0.203/0.203/0.208/0.208；动态解码在 +0 为 0.392，其余同样失败。`[解读]` 在偏移 0 的 336 上动态解码版本略好（0.201 对 0.207），生成式的优势体现在更长预测与偏移场景。

### 计算效率（论文 Table 4 与 Fig.5）

方法 | 训练时间 | 训练内存 | 测试步数
-- | -- | -- | --
Informer | $O(L\log L)$ | $O(L\log L)$ | 1
Transformer | $O(L^2)$ | $O(L^2)$ | $L$
LogTrans | $O(L\log L)$ | $O(L^2)$ | 1*
Reformer | $O(L\log L)$ | $O(L\log L)$ | $L$
LSTM | $O(L)$ | $O(L)$ | $L$

表中：「方法」是对比对象，「训练时间」「训练内存」是复杂度量级（$L$ 为序列长度），「测试步数」是推理需要的解码步数（带 * 的为套用 Informer decoder）。结论：Informer 的时间、内存均为 $O(L\log L)$，且测试只需 1 步。

（* 表示给 LogTrans 套用了 Informer 的 decoder。）论文的 Fig.5 报告了多变量设定下的总运行时间：训练阶段 Informer 在 Transformer 类方法中最快，测试阶段因生成式解码远快于其他方法。该图只有曲线、没有可核对的具体数字，这里不引用数值。

## 优缺点与局限

### 论文自述

- 优点：$O(L\log L)$ 的注意力、蒸馏降低内存、一次前向的解码；在其五个数据集设置下大多数预测长度取得最优。
- 局限（论文自己承认）：多变量下优势缩小，原因留待未来工作；ProbSparse 依赖"注意力长尾/query 稀疏"这一经验假设，Proposition 1 的证明是在高斯假设下的近似论证。
- 论文把"Informer†（标准注意力）"作为 ProbSparse 的对照：Informer 的最优次数多于 Informer†（Table 1 为 32 对 12，Table 2 为 33 对 14），论文据此称支持 query 稀疏假设；在 Table 3 的精简设定里二者 MSE 接近。`[解读]` ProbSparse 的主要收益是省内存，精度上大致持平。

### `[经验]` 与论文之外的评价

以下不是该论文的结论，均为论文之外的内容，标 `[经验]` / `[待核实]`：

- `[待核实]` 后续工作（如 DLinear，arXiv:2205.13504）质疑 Transformer 系模型（含 Informer）在 LSTF 基准上的有效性：一个简单的线性模型在常见基准上可以达到或超过它们。仓库综述 [深度学习方法](/0606_ML_Tasks_TimeSeries_Deep) 也有"基准上增益不稳（DLinear）"的口径。具体对比数字请以 DLinear 论文为准，此处不引用。
- `[经验]` ETT 等基准体量较小，且 Informer 的输入长度、token 长度是通过网格搜索选的，对比时需注意基线是否同样调参、输入长度是否一致。
- `[经验]` 它的"生成式"decoder 本质上是用一个已知片段 + 零占位符 + 时间戳，一次性回归整段输出，是直接多步（direct multi-horizon）预测，而不是生成模型意义的概率生成；它输出点预测，没有概率预测。
- `[经验]` ProbSparse 的稀疏选择含随机采样，所以结果有一定随机性，理论上也依赖 query/key 的统计特性。

## 与相关方法对比

方法 | 注意力 | 解码方式 | 备注
-- | -- | -- | --
Transformer（vanilla） | 全注意力 $O(L^2)$ | 动态解码 | 论文指出其三个问题
LogTrans / LogSparse | 按指数步长的启发式稀疏，各 head 同一策略 | 论文中用 Informer 的 decoder 比较 | 论文称其内存实现仍 $O(L^2)$
Reformer | LSH 注意力 $O(L\log L)$ | 动态解码 | 论文称仅在极长序列上有效，LSTF 表现差
Linformer | 线性投影，$O(L)$ | - | 论文指出投影矩阵对真实长序列无法固定，可能退化到 $O(L^2)$
Informer | ProbSparse（按 query 活跃度选择），数据驱动，每个 head 不同 | 一次前向生成 | 同时优化三个瓶颈

表中：「方法」是对比对象，「注意力」说明其注意力机制与复杂度（$L$ 为序列长度），「解码方式」是动态解码还是一次前向，「备注」是论文的评价。结论：Informer 同时降低了注意力复杂度并避免了逐步解码。

与本站其他深度预测方法的关系（`[解读]`）：[DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR) 是自回归的概率预测，逐步解码；[TCN](/0626_ML_Tasks_TimeSeries_Deep_TCN) 靠膨胀卷积扩大感受野；Informer 靠稀疏注意力直接建模任意位置对的依赖，且是非自回归的点预测。后续的 Autoformer、FEDformer、PatchTST 等沿着"让 Transformer 更适合时间序列"的路线，改成自相关、频域、patch 等思路，具体以各自论文为准；相关的一般综述可看 [时间序列总览](/0603_ML_Tasks_TimeSeries)。

## 使用方式

论文说明官方代码在 GitHub 的 `zhouhaoyi/Informer2020`（论文原文给出），ETT 数据集也在 `zhouhaoyi/ETDataset` 发布。官方仓库的具体脚本参数名与当前维护状态 `[待核实]`，以仓库 README 为准。

下面是 ProbSparse 自注意力的**示意代码，未运行验证**，只表达 Algorithm 1 的思路（非官方实现，省略 mask、多头与 dropout）：

```python
import math, torch

def probsparse_attn(Q, K, V, c=5):
    # Q,K,V: (B, L, d)；示意代码，未运行验证
    B, L, d = Q.shape
    u = min(L, int(c * math.log(L)))             # Top-u 个 query
    U = min(L, int(c * math.log(L)))             # 采样的 key 数（示意，所有 query 共用同一批；论文 Algorithm 1 的采样总量为 U=m·ln n 个点积对）
    idx = torch.randint(0, L, (U,))
    S_bar = Q @ K[:, idx].transpose(-1, -2)      # (B, L, U) 采样得分
    M = S_bar.max(-1).values - S_bar.mean(-1)    # max-mean 度量
    top = M.topk(u, dim=-1).indices              # (B, u)
    out = V.mean(1, keepdim=True).expand(B, L, d).clone()   # 非选中 query 输出 mean(V)
    Q_top = torch.gather(Q, 1, top.unsqueeze(-1).expand(-1, -1, d))
    attn = torch.softmax(Q_top @ K.transpose(-1, -2) / math.sqrt(d), dim=-1)
    out.scatter_(1, top.unsqueeze(-1).expand(-1, -1, d), attn @ V)
    return out
```

实践提示（`[经验]`，需结合自己的数据验证）：先从论文的 $c=5$、输入长度在 {96, 336, 720} 里做网格搜索起步；做对比实验时，请与带有同样输入长度和归一化的线性基线放在一起。

## Reference

- Haoyi Zhou, Shanghang Zhang, Jieqi Peng, Shuai Zhang, Jianxin Li, Hui Xiong, Wancai Zhang. *Informer: Beyond Efficient Transformer for Long Sequence Time-Series Forecasting*. AAAI 2021. [arXiv:2012.07436](https://arxiv.org/abs/2012.07436)
- 官方代码（论文中给出）：[zhouhaoyi/Informer2020](https://github.com/zhouhaoyi/Informer2020)
- ETT 数据集（论文脚注给出）：[zhouhaoyi/ETDataset](https://github.com/zhouhaoyi/ETDataset)
- DLinear：[arXiv:2205.13504](https://arxiv.org/abs/2205.13504)



