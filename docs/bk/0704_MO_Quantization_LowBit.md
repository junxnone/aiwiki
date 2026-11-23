-----

| Title     | MO Quantization LowBit                                |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-23T02:13:43Z`                                |
| Updated @ | `2026-11-23T02:25:00Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/704) |

-----

# LowBit

当位宽降到 1\~2 bit，量化就进入**二值化 / 三值化**的极限区域：权重只取 ${-1,+1}$ 或
${-1,0,+1}$，乘法可以退化成加减法或位运算，模型体积压缩 16～32
倍。本文覆盖这条路线的四个代表：BinaryConnect（*BinaryConnect:
Training Deep Neural Networks with binary weights during
propagations*，NeurIPS 2015，arXiv:1511.00363）、XNOR-Net（*XNOR-Net:
ImageNet Classification Using Binary Convolutional Neural Networks*，ECCV
2016，arXiv:1603.05279）、TWN（*Ternary Weight Networks*，arXiv:1605.04711）和
BitNet b1.58（*The Era of 1-bit LLMs: All Large Language Models are in
1.58 Bits*，arXiv:2402.17764）。

**一句话概括：BinaryConnect 前向/反向用 $\\pm1$ 的二值权重、更新用全精度权重；XNOR-Net
在二值之上加一个最优缩放因子（权重绝对值均值），并把输入也二值化让卷积变成 XNOR +
位计数；TWN 引入第三个取值 0；BitNet b1.58 把三值权重用到大语言模型并从头训练。**

> 标注约定：未标注的内容来自上述论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：总览 [量化](0312_MO_Quantization)；基础
[基础原理](/0699_MO_Quantization_Basics)；QAT 中的 STE 机制
[量化感知训练](/0703_MO_Quantization_QAT)；数据类型
[数据类型](/0700_MO_Quantization_DataType)；LLM 的常规量化 [LLM
权重量化](/0706_MO_Quantization_LLM_Weight)；系列中的
[量化历史](/0688_MO_Quantization_History)。

## 1\. 解决什么问题

  - 深度网络的核心运算是乘加（MAC）。定点加法器的面积与能耗远低于乘加器，若权重只取 $\\pm1$，乘法可以换成加减法；
  - 二值权重相对 float32 压缩 32 倍，三值（2 位存储）压缩约 16 倍；
  - 代价是精度：位宽越低，表达能力越弱，因此需要特殊的训练方法（保留全精度权重、缩放因子、阈值函数）。

## 2\. 符号约定

  - $W$：全精度权重；$B\\in{+1,-1}^n$ 或 $\\tilde
    W\\in{-1,0,+1}^n$：二值/三值权重；$\\alpha$：非负缩放因子；
  - $n$：一个滤波器（或一层）的权重个数；$\\mathrm{sign}(\\cdot)$：符号函数；
  - $\\Delta$：三值化的阈值。

## 3\. BinaryConnect：只在传播时二值化

### 3.1 二值化函数

BinaryConnect 把权重限制为 $\\pm1$。两种二值化方式：

$$
w\_b=\\mathrm{sign}(w)=\\begin{cases}+1,\&w\\ge0\\-1,&\\text{否则}\\end{cases}\\quad(\\text{确定性}),\\qquad
w\_b=\\begin{cases}+1,&\\text{概率 }p=\\sigma(w)\\-1,&\\text{概率
}1-p\\end{cases}\\quad(\\text{随机}) $$

其中：$w$ 为全精度权重；随机版中 $\\sigma$ 是"硬 sigmoid"
$\\sigma(x)=\\mathrm{clip}\\big(\\tfrac{x+1}{2},0,1\\big)$——它比软 sigmoid
便宜得多，且在实验中效果很好；随机二值化使每个权重的期望值等于原值，类似 Dropout/DropConnect
的"噪声"（但噪声是二值采样）。

### 3.2 传播与更新分离

关键思想是：**前向与反向传播用二值权重，参数更新用全精度权重**。

    1. 前向：  w_b ← binarize(w_{t-1})；用 w_b 逐层计算激活
    2. 反向：  用 w_b 计算对激活的梯度
    3. 更新：  计算对 w_b 的梯度 ∂C/∂w_b，用它更新全精度 w：  w_t ← clip(w_{t-1} − η·∂C/∂w_b, −1, 1)

图中：

  - 每个 mini-batch 先把全精度权重二值化，用二值权重做前向和反向；
  - 更新时梯度直接施加到全精度权重 $w$ 上（相当于对 round/sign 用直通估计），所以 SGD
    的微小更新可以逐步累积——如果在更新步也离散化，梯度的微小变化就会被抹掉，SGD
    无法工作；
  - 全精度权重在每次更新后被截断到 $\[-1,1\]$：因为二值化对超出 $\\pm1$ 的幅度不敏感，不截断的话权重会无限增大而无意义。

论文还把二值化看作一种**正则化**：离散化相当于加噪声，实验证实它能起到正则作用。推理时有三种选择：用二值权重（对应确定性版本）、用全精度权重（随机版本通常这样，去噪声）、或对采样出的多个二值网络做集成；论文对确定性版本用二值权重。

## 4\. XNOR-Net：缩放因子与二值输入

### 4.1 Binary-Weight-Network 的最优缩放

只二值化权重而不加缩放，会让权重的值域整体缩小。XNOR-Net 用一个缩放因子 $\\alpha$ 与二值向量 $B$ 去逼近每个滤波器
$W$：

$$ J(B,\\alpha)=|W-\\alpha B|^2,\\qquad B^{*}=\\mathrm{sign}(W),\\qquad
\\alpha^{*}=\\frac{W^\\top\\mathrm{sign}(W)}{n}=\\frac1n|W|\_{\\ell1} $$

其中：

  - $W\\in\\mathbb R^{n}$：某个滤波器的权重（$n=c\\cdot w\\cdot
    h$）；$B\\in{+1,-1}^{n}$；$\\alpha\>0$；
  - 展开 $J=\\alpha^2n-2\\alpha W^\\top B+W^\\top W$（$B^\\top B=n$ 是常数），关于
    $B$ 的最优解就是取符号，再对 $\\alpha$ 求导置零得
    $\\alpha^{\*}=\\tfrac1n\\sum\_i|W\_i|$；
  - 结论：二值滤波器的最优估计是**权重的符号乘以权重绝对值的均值**，这个均值是每个输出通道的缩放因子（论文式 6）。

训练时（论文 Algorithm 1）：每次先对每层每个滤波器计算 $A=\\tfrac1n|W|\_{\\ell1}$ 与
$B=\\mathrm{sign}(W)$，用 $\\tilde W=AB$ 做前向（卷积用二值运算加缩放），反向则按 STE
计算梯度并更新全精度 $W$。

### 4.2 XNOR-Network：输入也二值化

要同时二值化输入，需要逼近点积 $X^\\top W\\approx\\beta H^\\top\\alpha
B$（$H,B\\in{+1,-1}^n$）：

$$ \\alpha^{*}\\beta^{*}=\\frac{1}{n}|X\\odot W|*{\\ell1}\\ \\ \\to\\ \\
\\beta^{\*}=\\frac1n|X|*{\\ell1},\\
\\alpha^{*}=\\frac1n|W|\_{\\ell1},\\quad H^{*}=\\mathrm{sign}(X),\\
B^{\*}=\\mathrm{sign}(W) $$

其中：$X$ 是输入的一个局部块，$\\odot$ 是逐元素乘；论文取最优解的近似：$\\alpha^*$、$\\beta^*$
分别是权重与输入的绝对值均值（$\\beta^\*$ 对每个空间位置都要算一遍）。二值点积可以用 **XNOR
+ 位计数（popcount）** 实现：对 ${\\pm1}$ 向量 $x,w$，$x^\\top
w=2\\cdot\\mathrm{popcount}(\\mathrm{XNOR}(x,w))-n$，其中 XNOR
对应"符号相同"，popcount 统计相同的位个数。

论文结果（摘要）：Binary-Weight-Networks 带来 32 倍的内存节省，AlexNet 的 Binary-Weight
版本精度与全精度相同；XNOR-Networks 使卷积运算快约 58 倍（按高精度运算次数计）、内存节省 32 倍，使在
CPU 上实时运行大型网络成为可能；在 ImageNet 上比当时最先进的二值化方法 BinaryNet 的 top-1 精度高 16.3%。

## 5\. TWN：三值权重

三值权重网络（Ternary Weight Networks）把权重限制为 ${-1,0,+1}$，在二值与全精度之间折中。

**表达能力**：$3\\times3$ 滤波器二值时只有 $2^{9}=512$ 种模板，三值有 $3^{9}=19683$ 种，表达能力约强
38 倍；**压缩率**：每个权重 2 位存储，相对 float32 压缩 16 倍（VGG-19 从约 500M 降到约
32M），比二值少一半；**计算量**：零值项不需要累加，所以乘加次数与二值相同，对硬件友好。

### 5.1 优化问题与阈值函数

与 XNOR-Net 类似，最小化全精度权重与"缩放 × 三值权重"的距离：

$$ \\alpha^{*},\\tilde W^{*}=\\arg\\min\_{\\alpha\\ge0,\\ \\tilde
W\_i\\in{-1,0,+1}}\\big|W-\\alpha\\tilde W\\big|\_2^2 $$

其中：直接联合求解 $\\alpha$ 与 $\\tilde W$ 互相依赖，没有确定性的解。论文改用**阈值型三值函数**近似：

$$ \\tilde
W\_i=f(W\_i|\\Delta)=\\begin{cases}+1,\&W\_i\>\\Delta\\0,&|W\_i|\\le\\Delta\\-1,\&W\_i\<-\\Delta\\end{cases},\\qquad
\\alpha^{\*}*{\\Delta}=\\frac{1}{|I*\\Delta|}\\sum\_{i\\in
I\_\\Delta}|W\_i|,\\quad I\_\\Delta={i,:,|W\_i|\>\\Delta} $$

其中：$\\Delta\>0$ 是阈值，$I\_\\Delta$ 是超过阈值的权重下标集合，$|I\_\\Delta|$ 是其个数；给定
$\\Delta$，最优 $\\alpha$ 就是**未被置零的那些权重的绝对值均值**。再把 $\\alpha$ 代回，需要求解
$\\Delta^{\*}=\\arg\\max\_{\\Delta\>0}\\frac{1}{|I\_\\Delta|}\\big(\\sum\_{i\\in
I\_\\Delta}|W\_i|\\big)^2$，没有直接的解析解。

### 5.2 经验阈值

假设权重服从均匀分布或正态分布，可以得到近似解：均匀分布 $\[-a,a\]$ 时
$\\Delta\\approx\\frac{a}{3}=\\frac23\\mathbb E|W|$；正态分布
$N(0,\\sigma^2)$ 时 $\\Delta$ 约等于 $0.75,\\mathbb E|W|$。论文据此给出经验法则：

$$ \\Delta\\approx0.75,\\mathbb
E|W|=\\frac{0.75}{n}\\sum\_{i=1}^{n}|W\_i| $$

其中：$n$ 是滤波器（或层）的权重个数。论文网上流传的版本里常见系数 0.7；本文所读的 arXiv v3 文本中系数为 0.75，以原文为准
`[待核实]`。训练时同样保持全精度权重，用阈值函数生成三值权重做前向，STE 更新。

## 6\. BitNet b1.58：三值化的大语言模型

BitNet b1.58 是 1-bit BitNet 的变体：**每个权重取 ${-1,0,1}$**（比 1 bit 多了一个
0，理论信息量 $\\log\_2 3\\approx1.58$ bit），用 BitLinear 取代
Transformer 里的 `nn.Linear`，**从头训练**，权重 1.58 bit、激活 8
bit。动机：矩阵乘法只含整数加法，大幅降低能耗；权重搬运也大幅减少显存与带宽开销；0
的存在使模型具有显式的"特征过滤"能力，建模能力更强。

### 6.1 absmean 量化函数

$$ \\tilde
W=\\mathrm{RoundClip}\\Big(\\frac{W}{\\gamma+\\epsilon},,-1,,1\\Big),\\qquad
\\gamma=\\frac{1}{nm}\\sum\_{ij}|W\_{ij}|,\\qquad
\\mathrm{RoundClip}(x,a,b)=\\max\\big(a,\\min(b,\\mathrm{round}(x))\\big)
$$

其中：

  - $W\\in\\mathbb R^{n\\times
    m}$：权重矩阵；$\\gamma$：该矩阵所有元素绝对值的**平均值**（absmean）；$\\epsilon$：避免除零的小常数；
  - 先用平均绝对值缩放权重矩阵，再四舍五入到最近的整数并截断到 ${-1,0,+1}$；
  - 激活的量化沿用 BitNet 的做法（8 位），只是不在非线性函数之前把激活缩放到 $\[0,Q\_b\]$。

### 6.2 论文报告的结果

| 模型           | 参数规模 | 显存（GB）      | 延迟（ms）      | PPL   |
| ------------ | ---- | ----------- | ----------- | ----- |
| LLaMA        | 700M | 2.08（1.00×） | 1.18（1.00×） | 12.33 |
| BitNet b1.58 | 700M | 0.80（2.60×） | 0.96（1.23×） | 12.87 |
| LLaMA        | 1.3B | 3.34（1.00×） | 1.62（1.00×） | 11.25 |
| BitNet b1.58 | 1.3B | 1.14（2.93×） | 0.97（1.67×） | 11.29 |
| LLaMA        | 3B   | 7.89（1.00×） | 5.07（1.00×） | 10.04 |
| BitNet b1.58 | 3B   | 2.22（3.55×） | 1.87（2.71×） | 9.91  |
| BitNet b1.58 | 3.9B | 2.38（3.32×） | 2.11（2.40×） | 9.62  |

表中：

  - 第一列是模型，第二列是参数规模，第三、四列是显存与推理延迟（括号内是相对同规模 LLaMA
    的倍数），第五列是困惑度（PPL，越低越好）；数字取自论文
    Table 1；
  - 从 3B 起 BitNet b1.58 的困惑度与 LLaMA 持平甚至更好（3B：9.91 vs 10.04），3.9B 的
    BitNet b1.58 比 3B LLaMA 更省显存、更快、PPL 更低；规模较小时（700M、1.3B）略逊；
  - 论文称它同时定义了新的缩放定律与训练方案，并在 70B 规模上有吞吐对比（论文的吞吐数据与端侧结论请以原文为准 `[待核实]`）；
  - 这些是论文的自述结果，与常规的"PTQ 到 4 bit"路线不同的是：BitNet b1.58 要求**从头训练**，不能直接把已有
    LLM 转成三值。

## 7\. 对比汇总

| 方法             | 权重取值        | 缩放因子                            | 激活                                     | 训练要点                                    |
| -------------- | ----------- | ------------------------------- | -------------------------------------- | --------------------------------------- |
| BinaryConnect  | $\\pm1$     | 无                               | 全精度                                    | 传播用二值、更新用全精度；更新后截断 $\[-1,1\]$           |
| BWN / XNOR-Net | $\\pm1$     | $\\alpha=|W|\_{\\ell1}/n$（逐滤波器） | XNOR-Net 也二值（$\\beta=|X|\_{\\ell1}/n$） | STE；XNOR + popcount 实现                  |
| TWN            | ${-1,0,+1}$ | $\\alpha=$ 非零权重绝对值均值            | 全精度                                    | 阈值函数 $\\Delta\\approx0.75\\mathbb E|W|$ |
| BitNet b1.58   | ${-1,0,+1}$ | $\\gamma=$ 矩阵 absmean           | 8 位                                    | LLM 从头训练；absmean + RoundClip            |

表中：

  - 第一列是方法，第二列是权重取值，第三列是缩放因子的定义，第四列是激活的处理，第五列是训练要点；
  - 演进主线：二值（BinaryConnect）→ 加缩放（BWN/XNOR）→ 加入零值（TWN）→ 把三值用到大模型（BitNet
    b1.58）；
  - 位宽越低对"从头训练/充分微调"的依赖越强，这与 [QAT](/0703_MO_Quantization_QAT) 一脉相承。

## 8\. 总结 \[解读\]

  - 极低比特的收益是计算范式的改变（乘法 → 加法/位运算），而不仅是压缩；但需要专门的硬件与内核才能兑现；
  - 精度问题靠"保留全精度权重 + 最优缩放因子 + 合适的阈值/截断"来缓解；
  - 对 LLM，主流做法仍是 4 bit 左右的 PTQ/QAT（见 [LLM
    权重量化](/0706_MO_Quantization_LLM_Weight)）；三值化需要从头训练，是另一条路线。

## Reference

  - Courbariaux M, Bengio Y, David J-P. BinaryConnect: Training Deep
    Neural Networks with binary weights during propagations. NeurIPS
    2015. arXiv:1511.00363 `[第三作者待核实]`
  - Rastegari M, Ordonez V, Redmon J, Farhadi A. XNOR-Net: ImageNet
    Classification Using Binary Convolutional Neural Networks. ECCV
    2016. arXiv:1603.05279 `[作者列表待核实]`
  - Li F, Liu B, Wang X, Zhang B, Yan J. Ternary Weight Networks.
    arXiv:1605.04711
  - Ma S, Wang H, Ma L, Wang L, Wang W, Huang S, Dong L, Wang R, Xue J,
    Wei F. The Era of 1-bit LLMs: All Large Language Models are in 1.58
    Bits. arXiv:2402.17764
