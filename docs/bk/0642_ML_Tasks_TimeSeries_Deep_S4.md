-----

| Title     | ML Tasks TimeSeries Deep S4                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-19T02:27:22Z`                                |
| Updated @ | `2026-11-20T08:15:26Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/642) |

-----

# S4

S4（Structured State Space sequence model）出自论文 *Efficiently Modeling Long
Sequences with Structured State Spaces*（Albert Gu, Karan Goel,
Christopher Ré，Stanford，arXiv:2111.00396；会议为 ICLR 2022，arXiv
文本里未印会议名，`[待核实]`）。论文要解决的问题是：序列模型很难处理上万步的长程依赖（long-range
dependencies，LRD），而此前基于状态空间模型（SSM）的 LSSL 虽然在原理上可行，却因为计算和显存开销太大而无法实用。

一句话概括：**S4 = 连续时间 SSM + HiPPO 初始化 + 把状态矩阵改写成"对角 + 低秩"（DPLR）形式；借助
Woodbury 恒等式和 Cauchy 核，卷积核可以在近线性时间内算出，所以同一个层训练时用全局卷积并行，推理时用 $O(N)$
的递推。**

> 本文重点放在 S4 的数学机制（连续时间 SSM、离散化、卷积核、HiPPO、DPLR 与 Cauchy 核）。S4
> 是通用序列层，论文只在一个设定（Informer 的 ETT / Weather / ECL
> 基准）上做了时间序列预测实验，下文会明确区分"论文做了什么"和"我的推断"。

## 解决什么问题

长程依赖是序列建模的核心难题。论文指出，RNN、CNN、Transformer 都有各种专门应对 LRD 的变体（正交 / Lipschitz
RNN、膨胀卷积、高效 Transformer 等），但在 Long Range
Arena（LRA）或原始音频分类这类任务上依然表现不佳；LRA
中的 Path-X（长度 16384）上此前所有模型都只是随机猜测。

SSM 是控制论等领域的经典模型。直接把它当作深度学习层用效果很差，原因之一是线性一阶 ODE
的解是指数函数，梯度会随序列长度指数地消失或爆炸。LSSL（Linear
State Space Layer）用 HiPPO 理论给出的特殊 $A$ 矩阵解决了"记忆历史"的问题，但：

  - 状态维度 $N$、序列长度 $L$ 下，计算隐状态需要 $O(N^2L)$ 运算和 $O(NL)$ 空间，而下界只有 $O(N+L)$；
  - 论文证明 LSSL 里理论上更快的算法数值不稳定，原因是 HiPPO 矩阵是高度非正规（non-normal）矩阵，常规代数技巧不适用。

S4 的贡献就是给出一种新的参数化，使 SSM 的三种视角（连续、递推、卷积）能被高效地相互转换。

## 核心思想与结构

### 连续时间 SSM

SSM 把 1 维输入信号 $u(t)$ 经 $N$ 维隐状态 $x(t)$ 映射到 1 维输出 $y(t)$：

$$x'(t)=Ax(t)+Bu(t),\\qquad y(t)=Cx(t)+Du(t)$$

其中：$u(t)$ 是输入信号；$x(t)\\in\\mathbb R^{N}$ 是隐状态，$x'(t)$ 是其导数；$y(t)$
是输出；$A\\in\\mathbb R^{N\\times N}$ 决定状态演化；$B$ 决定输入如何写入状态；$C$
决定如何读出状态；$D$ 是直连项（论文取 $D=0$）。

其中 $A\\in\\mathbb R^{N\\times N}$，$B,C,D$ 是参数，用梯度下降学习。论文后文设 $D=0$，因为
$Du$ 只是 skip connection，容易计算。深度网络里的特征维是 $H$，S4 的做法是对 $H$ 个特征各自配一份独立的
SSM（见"层结构"）。

### HiPPO 初始化

HiPPO 理论给出一类 $A$，使状态 $x(t)$ 能够"记住"输入 $u(t)$ 的历史。论文使用的最重要的一个是（论文称之为 HiPPO
矩阵）：

$$A\_{nk}=-\\begin{cases}(2n+1)^{1/2}(2k+1)^{1/2}, & n\>k\\\[2pt\] n+1,
& n=k\\\[2pt\] 0, & n\<k\\end{cases}$$

其中：$A\_{nk}$ 是 HiPPO 矩阵第 $n$ 行第 $k$ 列的元素（下标从 0 起）；下三角（$n\>k$）元素为
$-(2n+1)^{1/2}(2k+1)^{1/2}$，对角元（$n=k$）为 $-(n+1)$，上三角（$n\<k$）为
0。该矩阵使状态能够"记住"输入的历史。

论文引用 LSSL 的发现：仅仅把随机 $A$ 换成这个矩阵，sequential MNIST 上的性能就从 60% 提升到 98%。

> 小例子（自拟示意，已手算核对）：取 $N=2$，下标从 0 起，则对角元为 $-(n+1)=-1,-2$，左下角 $n=1\>k=0$ 处为
> $-(3)^{1/2}(1)^{1/2}=-\\sqrt3$，即
> $A=\\begin{pmatrix}-1&0\\-\\sqrt3&-2\\end{pmatrix}$：下三角、有对角项，不是反对称（也不是正规）矩阵。

### 离散化（bilinear）

输入是离散序列 $(u\_0,u\_1,\\dots)$，需要步长
$\\Delta$（输入的"分辨率"，$u\_k=u(k\\Delta)$）。论文沿用 bilinear
方法：

$$\\overline
A=\\Bigl(I-\\tfrac{\\Delta}{2}A\\Bigr)^{-1}\\Bigl(I+\\tfrac{\\Delta}{2}A\\Bigr),\\qquad
\\overline B=\\Bigl(I-\\tfrac{\\Delta}{2}A\\Bigr)^{-1}\\Delta B,\\qquad
\\overline C=C$$

其中：$\\Delta$ 是步长（输入的分辨率）；$A,B,C$ 是连续时间参数；$I$ 是单位矩阵；$\\overline
A,\\overline B,\\overline C$ 是 bilinear 离散化后的参数；bilinear 方法比简单的欧拉法更稳定。

得到离散 SSM，其状态方程就是一个 RNN 递推：

$$x\_k=\\overline A,x\_{k-1}+\\overline B,u\_k,\\qquad y\_k=\\overline
C,x\_k$$

其中：$x\_k$ 是第 $k$ 步隐状态；$u\_k$ 是输入；$y\_k$ 是输出；$\\overline A$
控制保留多少旧状态，$\\overline B$ 控制写入多少新输入，$\\overline C$
把状态读出为输出；这就是一个线性 RNN 递推。

### 卷积视角

设初始状态 $x\_{-1}=0$，展开递推：

$$y\_k=\\overline C,\\overline A^{k}\\overline B,u\_0+\\overline
C,\\overline A^{k-1}\\overline B,u\_1+\\cdots+\\overline C,\\overline
A,\\overline B,u\_{k-1}+\\overline C,\\overline B,u\_k$$

其中：$y\_k$ 是第 $k$ 步输出；$u\_0,\\dots,u\_k$ 是输入；$\\overline A,\\overline
B,\\overline C$ 是离散 SSM 参数；设初始状态为 0，展开后每个输入以 $\\overline C\\overline
A^{j}\\overline B$ 的权重影响输出。

这是一次（非循环的）卷积 $y=\\overline K \* u$，卷积核为

$$\\overline K\\in\\mathbb R^{L}:=\\mathcal K\_L(\\overline A,\\overline
B,\\overline C)=\\bigl(\\overline C,\\overline A^{i},\\overline
B\\bigr)\_{i\\in\[L\]}=\\bigl(\\overline C\\overline B,\\ \\overline
C\\overline A\\overline B,\\ \\dots,\\ \\overline C\\overline
A^{L-1}\\overline B\\bigr)$$

其中：$\\overline K\\in\\mathbb R^{L}$ 是长度 $L$ 的卷积核；$\\mathcal
K\_L(\\cdot)$ 是由三元组生成卷积核的算子；第 $i$ 项 $\\overline C\\overline
A^{i}\\overline B$ 表示 $i$ 步之前的输入对当前输出的影响；$L$ 是序列长度。

只要 $\\overline K$ 已知，卷积可用 FFT 高效完成；难点是怎样快速算出 $\\overline K$，这是论文技术贡献的核心。

> 小例子（自拟示意，已重算）：取 $N=1$，$A=-1,\\ B=1,\\ C=1,\\ \\Delta=1$。则 $\\overline
> A=(1+\\tfrac12)^{-1}(1-\\tfrac12)=\\tfrac13$，$\\overline
> B=(1+\\tfrac12)^{-1}\\cdot1=\\tfrac23$，$\\overline C=1$，$\\overline
> K=(\\tfrac23,\\tfrac29,\\tfrac2{27},\\dots)$。输入 $u=(1,0,2)$：卷积给出
> $y\_2=\\tfrac2{27}\\cdot1+\\tfrac29\\cdot0+\\tfrac23\\cdot2=\\tfrac{38}{27}$；递推给出
> $x\_0=\\tfrac23,\\ x\_1=\\tfrac13\\cdot\\tfrac23=\\tfrac29,\\
> x\_2=\\tfrac13\\cdot\\tfrac29+\\tfrac23\\cdot2=\\tfrac{38}{27}$，两种算法结果一致。

### 为什么不直接算：对角化的数值问题

朴素地算 $\\overline K$ 要连乘 $L$ 次 $\\overline A$，即 $O(N^2L)$ 时间和 $O(NL)$
空间。若 $A$ 是对角阵，$\\overline K$ 就是 Vandermonde 乘积，理论上只要
$O((N+L)\\log^2(N+L))$。论文给出共轭等价关系（Lemma 3.1）：

$$(A,B,C)\\sim(V^{-1}AV,\\ V^{-1}B,\\ CV)$$

其中：$(A,B,C)$ 是 SSM 参数；$V$ 是可逆变换矩阵；右侧是换状态基底后的参数；该等价关系说明换基底不改变输入到输出的映射。

即换状态基底不改变 $u\\mapsto y$ 的映射。但 Lemma 3.2 指出，HiPPO 矩阵被
$V\_{ij}=\\binom{i+j}{i-j}$ 对角化，且
$V\_{3i,i}=\\binom{4i}{2i}\\approx2^{4i}$，因此 $V$ 的元素量级可达
$2^{4N/3}$，数值上不可行。要想稳定，只能用条件数良好（酉）的
$V$，而能被酉矩阵对角化的恰是正规矩阵，HiPPO 矩阵不是正规的。

### NPLR 与 DPLR

论文观察到：HiPPO 矩阵虽然不正规，但可以写成"正规矩阵 + 低秩矩阵"（Normal Plus Low-Rank，NPLR）：

$$A=V\\Lambda
V^{*}-PQ^{\\top}=V\\bigl(\\Lambda-(V^{*}P)(V^{*}Q)^{*}\\bigr)V^{\*}$$

其中：$V\\in\\mathbb C^{N\\times N}$ 是酉矩阵；$\\Lambda$ 是对角矩阵；$V^{\*}$ 是 $V$
的共轭转置；$P,Q\\in\\mathbb R^{N\\times r}$ 是低秩因子；$r$ 是秩；第二个等号是用酉矩阵 $V$
做共轭变换后得到对角加低秩（DPLR）形式。

其中 $V\\in\\mathbb C^{N\\times N}$ 酉，$\\Lambda$ 对角，$P,Q\\in\\mathbb
R^{N\\times r}$（Theorem 1）。HiPPO 的 LegS、LegT、LagT 三类矩阵都满足 $r=1$ 或
$r=2$，式 (2) 对应 $r=1$。再经酉共轭，NPLR 就变成复数域上的"对角 +
低秩"（DPLR）：$A=\\Lambda-PQ^{\*}$。

> 小例子（自拟示意，已手算核对）：上面 $N=2$ 的 $A$ 加上 $\\tfrac12 pp^{\\top}$，其中
> $p=(1,\\sqrt3)^{\\top}$，得到
> $\\begin{pmatrix}-\\tfrac12&\\tfrac{\\sqrt3}{2}\\-\\tfrac{\\sqrt3}{2}&-\\tfrac12\\end{pmatrix}=-\\tfrac12
> I+S$，$S$ 是反对称矩阵（正规矩阵）。所以 $A=-\\tfrac12I+S-PP^{\\top}$，$P=p/\\sqrt2$，秩为
> 1。这与论文附录对 HiPPO 矩阵式 (2) 的做法一致（论文附录 C.1 的小节标题把式 (2) 称作
> HiPPO-LegS，而该证明开头一句又写 "式 (2) 是 HiPPO-LegT
> 矩阵"，两处自相矛盾；从小节内容看应以 LegS 为准，开头一句疑为笔误
> \[待核实\]）。

### 三步算法：生成函数、Woodbury、Cauchy 核

低秩项让"求幂"依然很慢，所以 S4 同时用了三个技巧（Algorithm 1）：

**1. 截断生成函数 + iFFT。** 不直接算 $\\overline K$，而是算它的截断生成函数在 $L$
次单位根处的取值，再做一次逆 FFT。定义

$$\\hat{\\mathcal K}*L(z)=\\sum*{i=0}^{L-1}\\overline C^{*},\\overline
A^{i},\\overline B,z^{i}=\\overline C^{*}\\bigl(I-\\overline
A^{L}z^{L}\\bigr)\\bigl(I-\\overline Az\\bigr)^{-1}\\overline B$$

其中：$\\hat{\\mathcal K}\_L(z)$ 是截断生成函数；$\\overline A,\\overline B$
是离散化矩阵；$\\overline C^{\*}$ 是输出向量的共轭转置；$z$ 是复变量；$L$
是序列长度；$I$ 是单位矩阵；第二个等号把等比级数求和化为一个矩阵的逆，使"矩阵的幂"变成"矩阵的逆"。

（论文附录为了让 $C$ 与 $B,P,Q$ 形状相同，把 $C$ 取成列向量，输出写成 $C^{*}x$。）在单位根
$z\\in\\Omega\_L$ 上 $z^{L}=1$，于是 $\\overline A^{L}z^{L}=\\overline
A^{L}$，可以并入 $\\tilde C=(I-\\overline A^{L})^{*}C$（实现时直接学习 $\\tilde C$
即可）。这个函数把"矩阵的幂"变成"矩阵的逆"。

**2. Woodbury 恒等式。** 对 $A=\\Lambda-PQ^{\*}$，利用

$$(A+UV^{*})^{-1}=A^{-1}-A^{-1}U\\bigl(I\_p+V^{*}A^{-1}U\\bigr)^{-1}V^{\*}A^{-1}$$

其中：$A$ 是可逆矩阵（此处取对角矩阵）；$U,V$ 是低秩因子；$I\_p$ 是 $p$ 阶单位矩阵；左侧是"对角 +
低秩"矩阵的逆，右侧把它化为对角矩阵的逆加一个小矩阵的逆，从而避免直接求高维逆。

把低秩项修正掉，只剩对角矩阵的逆。把 bilinear 离散化代回去（Lemma C.3），对 $z\\in\\Omega\_L$：

$$\\hat{\\mathcal K}\_L(z)=\\frac{2}{1+z}\\Bigl\[\\tilde
C^{*}R(z)B-\\tilde
C^{*}R(z)P\\bigl(1+Q^{*}R(z)P\\bigr)^{-1}Q^{*}R(z)B\\Bigr\],\\qquad
R(z;\\Lambda)=\\Bigl(\\frac{2}{\\Delta}\\frac{1-z}{1+z}-\\Lambda\\Bigr)^{-1}$$

其中：$\\hat{\\mathcal K}\_L(z)$ 是卷积核的截断生成函数；$z$ 是单位根；$\\tilde C$
是并入长度修正后的输出向量；$R(z;\\Lambda)$
是对角矩阵的逆（预解算子）；$\\Lambda$ 是对角矩阵；$P,Q$
是低秩项向量；$B$ 是输入向量；$\\Delta$ 是步长；括号中第二项是 Woodbury
恒等式带来的低秩修正。

**3. Cauchy 核。** $R(z;\\Lambda)$ 是对角阵，所以 $Q^{*}R(z)P$、$\\tilde
C^{*}R(z)B$ 等项都是形如

$$\\sum\_{j}\\frac{q\_j^{\*},p\_j}{g(\\omega\_i)-\\lambda\_j},\\qquad
g(\\omega)=\\frac{2}{\\Delta}\\frac{1-\\omega}{1+\\omega}$$

其中：$\\omega\_i$ 是第 $i$ 个单位根取值点；$\\lambda\_j$ 是对角矩阵 $\\Lambda$ 的第 $j$
个元素；$q\_j^{\*}p\_j$ 是向量 $Q,P$ 的对应分量乘积；$g(\\omega)$ 是 bilinear
变换下的频率映射，$\\Delta$ 是步长。这类和是 Cauchy 矩阵与向量的乘积，可用快速算法计算。

的和，即 Cauchy 矩阵（$M\_{ij}=1/(\\omega\_i-\\zeta\_j)$）与向量的乘积。Cauchy
矩阵-向量乘法是数值分析里研究得很透的问题：朴素算法 $O(MN)$；精确算术下有
$O((M+N)\\log^2(M+N))$ 的算法；若只要求数值精度 $\\epsilon$，则为
$O((M+N)\\log(M+N)\\log\\tfrac1\\epsilon)$，论文称这类快速算术算法与基于 Fast Multipole
Method（FMM）的快速数值算法都已被充分研究，其中数值算法是稳定的。

Algorithm 1（论文给出的是 sketch）的步骤：

    输入: Lambda, P, Q, B, C (N 维复向量), 步长 Delta
    1: C~ <- (I - Abar^L)^* C                       # 截断生成函数的长度修正
    2: [[k00, k01],[k10, k11]](omega)
          <- [C~ Q]^* ( (2/Delta)(1-omega)/(1+omega) - Lambda )^{-1} [B P]   # 黑盒 Cauchy 核
    3: Khat(omega) <- 2/(1+omega) * ( k00 - k01 (1 + k11)^{-1} k10 )         # Woodbury
    4: Khat <- { Khat(omega) : omega 取遍 L 次单位根 }
    5: K <- iFFT(Khat)

由此得到两个定理：

  - **Theorem 2（S4 递推）**：给定任意 $\\Delta$，递推一步只需 $O(N)$ 运算。原因是 DPLR 矩阵的逆仍是
    DPLR，离散化矩阵是两个 DPLR 矩阵的乘积。附录 C.2 给出闭式：令 $A\_0=\\tfrac2\\Delta
    I+(\\Lambda-PQ^{*})$，$D=(\\tfrac2\\Delta-\\Lambda)^{-1}$，$A\_1=D-DP(I+Q^{*}DP)^{-1}Q^{\*}D$，则

$$\\overline A=A\_1A\_0,\\qquad \\overline B=2A\_1B,\\qquad
x\_k=A\_1A\_0,x\_{k-1}+2A\_1B,u\_k$$

其中：$\\overline A,\\overline B$ 是离散化后的状态矩阵与输入向量；$A\_0,A\_1$ 是用于分解的两个 DPLR
矩阵（$A\_0$ 是 $\\tfrac2\\Delta I$ 加原矩阵，$A\_1$ 由 $D$ 与低秩修正得到）；$D$
是对角矩阵的逆；$x\_k$ 是第 $k$ 步状态；$u\_k$ 是输入。每步只需对 $A\_0,A\_1$
做矩阵-向量乘法，复杂度 $O(N)$。

$A\_0,A\_1$ 都只通过矩阵-向量乘法使用，各为 $O(N)$；秩 1 时 $1+Q^{\*}DP$ 是标量。

  - **Theorem 3（S4 卷积）**：给定任意 $\\Delta$，卷积核 $\\overline K$ 可归约为 4 次
    Cauchy 乘法，仅需 $\\tilde O(N+L)$ 运算和 $O(N+L)$ 空间。

### 层结构

一个 S4 层这样参数化：先把 $A$ 设为 HiPPO 矩阵，由 Lemma 3.1 与 Theorem 1，它酉等价于某个
$(\\Lambda-PQ^{\*},B,C)$，其中 $\\Lambda$ 对角、$P,Q,B,C\\in\\mathbb
C^{N\\times1}$，共 $5N$ 个可训练参数。S4 处理 $H$ 个特征时，是 $H$ 份独立的
SSM，再用位置不变（position-wise）的线性层混合特征，每层参数量
$O(H^2)+O(HN)$，层与层之间插入非线性激活。整体输入输出形状为（batch, 长度, 隐藏维），与
Transformer、RNN、CNN 相同。

核心 S4 模块是线性的，非线性来自层间激活，这类似普通 CNN；广播到 $H$ 个特征类似 depthwise-separable
卷积，因此论文把 deep S4 看作"带全局卷积核的 depthwise-separable CNN"。

论文还提到，后续工作发现这版 S4 在 $A$ 有右半平面特征值时可能数值不稳，将 NPLR 参数化由 $\\Lambda-PQ^{*}$ 改为
$\\Lambda-PP^{*}$ 可修正（引自论文对 "It's raw\!" 一文的转述）。

## 训练与推理

  - **训练**：用卷积视角。每次前向由 $\\Lambda,P,Q,B,C,\\Delta$ 现算 $\\overline
    K$（Algorithm 1），再对整条序列做 FFT 卷积，序列维完全并行 \[解读：这是对论文"训练用卷积"表述的展开\]。
  - **推理 / 自回归生成**：切换到递推视角，每步 $O(N)$，状态大小恒定，不随上下文长度增长。论文报告在 CIFAR-10 与
    WikiText-103 的生成上比标准 Transformer 快约 60 倍。
  - **采样率变化**：由于是连续时间模型，测试时改变内部步长 $\\Delta$ 即可适应不同采样率，无需重训。论文在 Speech
    Commands 上以 0.5 倍频率测试得到 96.3%（见下文）。

LRA 实验里的训练细节（论文附录 D.2）：AdamW，学习率常数 + 验证集平台期衰减；HiPPO
相关参数（$\\Lambda,P,Q,B,C,\\Delta$）的最大初始学习率降到 0.001 以提升稳定性；状态大小固定
$N=64$；分类任务在最后一层后沿长度维做 mean pooling。

论文提到当前实现里 Cauchy 核实际用的是朴素 $O(NL)$ 算法（借助 pykeops
做显存高效的并行），论文所说的渐近更快的稳定算法在
GPU 上尚未实现。

## 复杂度对比

论文 Table 1（$L$ 序列长度，$B$ batch，$H$ 隐藏维；波浪号表示省略 log 因子；S4 的状态 $N$ 取与 $H$
相同）：

| 结构          | 参数量   | 训练计算                                  | 训练空间        | 并行 | 推理（单样本单步）   |
| ----------- | ----- | ------------------------------------- | ----------- | -- | ----------- |
| Convolution | $LH$  | $\\tilde LH(B+H)$                     | $BLH$       | 是  | $LH^2$      |
| Recurrence  | $H^2$ | $BLH^2$                               | $BLH$       | 否  | $H^2$       |
| Attention   | $H^2$ | $B(L^2H+LH^2)$                        | $B(L^2+HL)$ | 是  | $L^2H+H^2L$ |
| S4          | $H^2$ | $BH(\\tilde H+\\tilde L)+B\\tilde LH$ | $BLH$       | 是  | $H^2$       |

表中：「结构」是序列模型类型，后几列是参数量、训练计算、训练空间、是否并行、推理（单样本单步）的复杂度（$L$ 为序列长度，$B$ 为
batch，$H$ 为隐藏维，波浪号表示省略对数因子）。结论：S4 在五项指标上都达到或并列理论最优。

论文在每一行用粗体标出理论最优项，S4 在五项指标上均被标为最优（含并列），即兼具卷积的训练并行和递推的快速推理。

## 实验与结论

以下数字均来自论文，且已对照渲染页核对。

### 效率

与 LSSL 对比（Table 2，单层前向 + 反向，A100）：隐藏维 128 / 256 / 512 时，LSSL 训练一步 9.32 /
20.6 / 140.7 ms，S4 为 4.77 / 3.07 / 4.75 ms；显存 LSSL 为 222.1 / 1685 /
13140 MB，S4 为 5.3 / 12.6 / 33.5 MB；512 维时速度比 29.6 倍，显存比 392 倍。

与高效 Transformer 对比（Table 3，相对于 Transformer 的倍率，遵循 LRA 协议）：长度 4096 时 S4
速度 5.19 倍、显存为 0.091 倍；Linear Transformer 为 5.35 倍、0.067 倍；Performer
为 3.79 倍、0.086 倍。论文据此认为 S4 的速度和显存与最高效的 Transformer
变体相当（竞争力相近）；论文也提醒各方法的相对排序会随超参设置变化。

### Long Range Arena

Table 4（论文用的是后续工作更新后的 S4 数字，原始版本见 Table 10：平均 80.48，Path-X 88.10）：

| 模型            | ListOps | Text  | Retrieval | Image | Pathfinder | Path-X  | Avg   |
| ------------- | ------- | ----- | --------- | ----- | ---------- | ------- | ----- |
| Transformer   | 36.37   | 64.27 | 57.46     | 42.44 | 71.40      | 不可行（随机） | 53.66 |
| Linear Trans. | 16.13   | 65.90 | 53.09     | 42.34 | 75.30      | 不可行（随机） | 50.46 |
| Luna-256      | 37.25   | 64.57 | 79.29     | 47.38 | 77.72      | 不可行（随机） | 59.37 |
| S4（original）  | 58.35   | 76.02 | 87.09     | 87.26 | 86.05      | 88.10   | 80.48 |
| S4（updated）   | 59.60   | 86.82 | 90.90     | 88.65 | 94.20      | 96.35   | 86.09 |

表中：「模型」是对比方法，各列是 LRA 的六个任务与平均（Avg）的准确率（%，越大越好），Path-X
一列"不可行（随机）"表示该模型只能随机猜测；S4（original）与
S4（updated）是同一模型的原始与更新结果。结论：S4 在所有任务上大幅领先，并首次解决 Path-X。

论文引言和 4.2 节里的 "平均 80.48%"、"Path-X 88%" 对应 original 行，Table 4 与附录 D.5
说明后来用后续工作（同一模型，仅超参小调整）更新为 updated 行。"训练与推理"一节中的 LRA 训练超参（N=64
等）描述的是 original 结果。

Path-X 序列长度 $128\\times128=16384$，此前所有模型都失败（随机猜测 50%）。论文还把 Path-X
上训练出的卷积核 $\\overline K\\in\\mathbb R^{16384}$ 重排成
$128\\times128$ 的图像可视化：低层核只看局部几行，高层核则覆盖整个 16384 的上下文。

### Speech Commands 与 sequential 图像分类

  - Speech Commands（SC10 子集，原始语音长度 16000）：S4 为 98.32%（Table 5）；MFCC
    特征（长度 161）下为 93.96%；测试时频率降为 0.5 倍为
    96.30%。原始语音设置下，Transformer、LipschitzRNN
    等在单卡上不可行（表中标 ✗），Performer 为 30.77%，ExpRNN 为
    11.6%，CKConv 为 71.66%，专为原始语音设计的 WaveGAN-D 为 96.25%（参数量约 26.3M，论文称约为
    S4 的 90 倍）。需要注意 MFCC 一栏里 CKConv 的 95.3% 高于 S4 的 93.96%，论文的说法是 S4
    的原始语音结果高于所有使用 MFCC 的基线。论文提醒：之后作者改用完整 35 类 SC 数据集，引用 SC
    结果请用后续工作的 Table，不要直接引用本文 Table 5。
  - Pixel-level 1-D 图像分类（Table 6）：sMNIST 99.63，pMNIST 98.70，sCIFAR
    91.13；LSSL 的 sCIFAR 为 84.65。论文还对比 ResNet18（7.9M vs 11.0M
    参数）：无数据增强时 91.12% vs 89.46%，有增强时 93.16% vs
    95.62%；把 BatchNorm 换成 LayerNorm 时 S4 为 90.46%、ResNet 为 79.52%。

### 生成建模

  - CIFAR-10 密度估计（Table 7）：S4 base 2.92 bpd、large 2.85 bpd，无 2D
    归纳偏置；base 的生成速度为 20.84 images/s，约为 Transformer（0.32）的 65
    倍。
  - WikiText-103（Table 8）：S4 测试 ppl 20.95（249M 参数），Transformer 基线
    20.51（247M）；生成 48K tokens/s，约 60 倍于 Transformer 的 0.8K。附录 D.5
    说明此数字来自重训（batch 1、context 8192），原始版本为 21.28。

### 时间序列预测（论文唯一的时序预测实验）

做法：沿用 Informer 的设置。把长度 $C$ 的上下文与长度 $F$ 的"掩码"拼成一条长 $C+F$ 的序列，输入同一个深 S4
模型，输出长度同为 $C+F$，只取最后 $F$ 个输出作为预测（Figure 5）。附录 Table 13（单变量）和 Table
14（多变量）覆盖 Informer 论文里的全部 50 个设置，S4 在其中 40 个最优（单变量 22，多变量 18）。

下面是单变量设置、各数据集最长预测步长的结果（Table 9；MSE / MAE，越小越好；ETTh1、ETTh2、Weather 最长步长为
720，ETTm1 为 672，ECL 为 960）：

| 数据集     | S4            | Informer      | DeepAR        |
| ------- | ------------- | ------------- | ------------- |
| ETTh1   | 0.116 / 0.271 | 0.269 / 0.435 | 0.658 / 0.707 |
| ETTh2   | 0.187 / 0.358 | 0.277 / 0.431 | 0.429 / 0.580 |
| ETTm1   | 0.292 / 0.466 | 0.512 / 0.644 | 2.437 / 1.352 |
| Weather | 0.245 / 0.375 | 0.359 / 0.466 | 0.499 / 0.596 |
| ECL     | 0.432 / 0.497 | 0.582 / 0.608 | 0.657 / 0.683 |

表中：「数据集」是评测集，其余三列是 S4、Informer、DeepAR 在最长预测步长下的 MSE / MAE（越小越好）。结论：S4
在这五个数据集上都优于对比基线。

论文正文还说"预测 30 天天气数据时 MSE 降低 37%"。按 Table 9 的 Weather 一行（0.245 对
0.359）自行计算约为 32%（多变量 Table 14 的 Weather 720 步 0.578 对 0.831 约为
30%），与 37% 对不上，原因未知（本文核对的是 arXiv v3，正文仍写
37%，表中数据重算对不上；可能来自旧版本，未能确认）\[待核实\]，建议只引用表中数字。

要点：这是 2021 年的结果，对比对象是
Informer、LogTrans、Reformer、LSTMa、DeepAR、ARIMA、Prophet 等；S4
并非在所有设置上最优（例如 Table 13 里 ETTh2 预测 24 步时 Informer 的 MSE 为 0.093，S4 为
0.095）。更新的时序预测基线（PatchTST、DLinear 等）论文未做比较 \[经验\]。

### 消融：HiPPO 的重要性

在 sequential CIFAR-10 上（参数量限制在 100K 以内，plateau 学习率调度，无正则）：

  - 训练 SSM 对所有初始化都有提升；
  - $A$ 可训练时，所有初始化都能达到 100% 训练准确率，但验证准确率相差超过 15%，说明初始化对泛化很关键；
  - 随机 NPLR 矩阵效果仍然不好，说明 S4 的有效性主要来自 HiPPO 初始化，而不是 NPLR 参数化本身；
  - 加 0.1 dropout 后，完整 S4（HiPPO 初始化）在仅 100K 参数下达到 84.27% 的测试准确率。

NPLR/DPLR 的作用是让 HiPPO 初始化"算得动"，HiPPO 才是"学得好"的来源。

## 优缺点与局限

论文自述：

  - 优点：同一个模型覆盖 LRD、图像、语音、文本、时间序列；训练卷积并行、推理递推恒定；可通过改 $\\Delta$ 适应采样率变化。
  - 局限：Cauchy 核目前用朴素 $O(NL)$ 实现，渐近更快的稳定算法未在 GPU 上实现；初版 NPLR 参数化在 $A$
    有右半平面特征值时可能数值不稳；语言建模上与 Transformer 仍有差距（20.95 对 20.51 ppl）。

`[经验]` 补充：

  - S4 层是线性时不变（LTI）的（论文 2.4 节明确写到 LTI SSM 才能写成卷积），卷积核由
    $\\Lambda,P,Q,B,C,\\Delta$ 决定，与输入内容无关；因此它不能"按输入内容选择性地记忆"。后来的 Mamba
    一类方法针对这一点把参数改成输入相关的。
  - 实现上 NPLR/Cauchy 的步骤较多（复数、Woodbury、FFT）；论文参考文献列有后续工作 "On the
    parameterization and initialization of diagonal state space
    models"（arXiv:2206.11893），研究把 $A$ 取成纯对角，具体结论本文未核对 \[待核实\]。
  - Mamba 等后续方法不在本论文内，上述说法为我的背景知识 \[待核实\]。
  - 论文在时序预测上只验证了 Informer 同一套基准；是否在现代长期预测基准上有优势，需看后续独立评测。

## 与相关方法对比

| 方法                     | 长程依赖机制             | 训练       | 推理        | 备注                                                          |
| ---------------------- | ------------------ | -------- | --------- | ----------------------------------------------------------- |
| RNN / LSTM             | 隐状态递推              | 串行       | $O(1)$ 步长 | 梯度消失 / 爆炸                                                   |
| TCN                    | 膨胀因果卷积，感受野有限       | 并行       | 需缓存       | 见 [TCN](/0626_ML_Tasks_TimeSeries_Deep_TCN)                 |
| Transformer / Informer | 注意力，$O(L^2)$ 或稀疏近似 | 并行       | 随上下文增长    | 论文基线之一                                                      |
| LSSL                   | SSM + HiPPO，未结构化   | 并行       | 递推        | $O(N^2L)$ 计算、$O(NL)$ 空间                                     |
| S4                     | SSM + HiPPO + DPLR | 并行（全局卷积） | $O(N)$ 递推 | 本文                                                          |
| DeepAR                 | 自回归 RNN + 概率输出     | 串行       | 采样        | 见 [DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR)，论文预测表中的基线 |

表中：「方法」是对比对象，「长程依赖机制」说明其如何处理长依赖，「训练」「推理」说明并行性与推理开销，「备注」给出补充。结论：S4
兼具全局卷积的训练并行与 $O(N)$ 递推推理。

S4 与 TCN 的关系：论文把 deep S4 描述为"带全局卷积核的 depthwise-separable CNN"。\[解读\] 与
TCN 用有限核长加膨胀来扩大感受野不同，S4 的核长等于序列长度，且由少量 SSM 参数（每个特征约 $5N$ 个）隐式生成，而不是逐点学习。

## 使用方式

官方代码在
HazyResearch/state-spaces（论文脚注给出）。下面是纯概念性的示意代码：用最朴素的"幂次"法生成卷积核（**不是**
S4 的 Cauchy 算法，仅用于说明卷积视角）。

``` python
# 示意代码，未运行验证；真实的 S4 层请使用官方仓库实现
import numpy as np

def discretize_bilinear(A, B, delta):
    I = np.eye(A.shape[0])
    inv = np.linalg.inv(I - delta / 2 * A)
    return inv @ (I + delta / 2 * A), inv @ (delta * B)   # Abar, Bbar

def ssm_kernel_naive(Abar, Bbar, C, L):
    # K_i = C @ Abar^i @ Bbar, i = 0..L-1 (S4 用 Cauchy 核 + iFFT 代替这一步)
    K, x = [], Bbar
    for _ in range(L):
        K.append((C @ x).item())
        x = Abar @ x
    return np.array(K)

def causal_conv_fft(K, u):
    n = len(u)
    return np.fft.irfft(np.fft.rfft(K, 2 * n) * np.fft.rfft(u, 2 * n), 2 * n)[:n]
```

时序预测的接法（论文 D.3.5）：拼接上下文与长度为预测窗的掩码占位，整条序列送入 S4，只取最后 $F$ 个输出作为预测值。

## Reference

  - Albert Gu, Karan Goel, Christopher Ré. Efficiently Modeling Long
    Sequences with Structured State Spaces.
    [arXiv:2111.00396](https://arxiv.org/abs/2111.00396)
  - 官方代码：[HazyResearch/state-spaces](https://github.com/HazyResearch/state-spaces)（论文脚注给出）
  - 相关背景：HiPPO（Gu et al., NeurIPS 2020）、LSSL（Gu et al., NeurIPS
    2021）、Long Range Arena（Tay et al.）
  - 站内：[时间序列总览](/0603_ML_Tasks_TimeSeries)、[深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)
