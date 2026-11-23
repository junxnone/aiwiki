-----

| Title     | MO Quantization QAT                                   |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-23T02:11:34Z`                                |
| Updated @ | `2026-11-23T02:43:24Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/703) |

-----

# 量化感知训练（QAT）

量化感知训练（Quantization-Aware
Training，QAT）在训练或微调时就把量化"放进"网络：前向传播里模拟量化（先量化再反量化，称为
fake quantization /
伪量化），让网络在训练过程中感受到量化带来的误差并自行适应。代价是需要训练数据、算力和时间；好处是同等位宽下通常比训练后量化（PTQ）精度更高，特别是在
4 bit 以下。本文覆盖：QAT 的基本机制（伪量化、直通估计器 STE）、DoReFa-Net（*DoReFa-Net: Training
Low Bitwidth Convolutional Neural Networks with Low Bitwidth
Gradients*，arXiv:1606.06160）、PACT（*PACT: Parameterized Clipping
Activation for Quantized Neural Networks*，arXiv:1805.06085）、LSQ（*Learned
Step Size Quantization*，ICLR 2020，arXiv:1902.08153），以及 QAT 中的 BN
处理和与知识蒸馏的结合。STE 来自 Bengio 等人的 *Estimating or Propagating
Gradients Through Stochastic Neurons for Conditional
Computation*（arXiv:1308.3432）。

**一句话概括：QAT 在前向用量化后的值计算，在反向用 STE 把 $\\mathrm{round}$ 当作恒等函数来传梯度；DoReFa
给出任意位宽权重/激活/梯度的量化函数，PACT 让激活的截断阈值可学习，LSQ 让量化步长可学习并给出合适的梯度缩放。**

> 标注约定：未标注的内容来自上述论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：总览 [量化](0312_MO_Quantization)；基础
[基础原理](/0699_MO_Quantization_Basics)；无需训练的 [训练后量化
PTQ](/0702_MO_Quantization_PTQ)；低比特极限
[低比特量化](/0704_MO_Quantization_LowBit)；与蒸馏结合
[蒸馏理论与实践](/0698_MO_KD_Theory)；系列中的
[量化历史](/0688_MO_Quantization_History)。

## 1\. 解决什么问题

  - PTQ 在低位宽（尤其是权重和激活都是 4 bit 或更低）时精度掉得厉害，因为模型从未"见过"量化误差；
  - QAT 让量化误差成为训练的一部分，权重在"亲身经历"量化噪声的同时被更新；
  - 难点：量化函数里的 $\\mathrm{round}(\\cdot)$ 几乎处处梯度为 0（在整数边界处不可导），不能直接反向传播。

## 2\. 符号约定

  - $v$：被量化的数据（权重或激活）；$s$：步长（scale）；
  - $Q\_N$、$Q\_P$：量化的负、正水平数；有符号数据 $Q\_N=2^{b-1}$、$Q\_P=2^{b-1}-1$，无符号数据
    $Q\_N=0$、$Q\_P=2^b-1$；
  - $\\lfloor\\cdot\\rceil$：四舍五入；$\\hat v$：量化再反量化后的值（"伪量化"输出）；
  - $\\mathcal L$：训练损失。

## 3\. 基本机制：伪量化与 STE

### 3.1 伪量化

训练时在权重和激活处插入量化-反量化节点（LSQ 的写法）：

$$ \\bar
v=\\mathrm{clip}\!\\Big(\\Big\\lfloor\\frac{v}{s}\\Big\\rceil,,-Q\_N,,Q\_P\\Big),\\qquad
\\hat v=\\bar v\\cdot s $$

其中：

  - $\\bar v$：整数网格上的量化值；$\\hat v$：反量化回实数，作为后续（浮点）运算的输入；
  - 训练时用 $\\hat v$ 做矩阵乘，与推理时用整数矩阵乘再用步长缩放的做法代数等价；
  - 保存和更新的仍然是**全精度权重**，量化后的权重只用于前向和反向传播。

### 3.2 直通估计器（STE）

$\\mathrm{round}$ 的导数几乎处处为 0。解决办法是 STE（Bengio 等，2013）：**反向传播时把 round
当作恒等函数**，即梯度"直通"：

$$ \\frac{\\partial\\hat v}{\\partial
v}=\\begin{cases}1,&-Q\_N\<v/s\<Q\_P\\\[2pt\]0,&\\text{否则}\\end{cases}
$$

其中：当输入落在量化范围内时梯度近似为 1，超出截断范围时梯度为
0（被截断的值不再随输入变化）；这样梯度就能穿过量化节点回传到底层的浮点权重。这一式子对应
LSQ 论文的式 (5)；Qualcomm 白皮书也使用同样的近似 $\\partial\\lfloor y\\rceil/\\partial
y=1$。

下图是 QAT 训练图中伪量化节点的位置。

    输入 x → [激活伪量化] → 量化后的 x̂ ─┐
                                        ├─ 卷积/全连接（浮点算术，等价于整数乘加 × 步长）→ 输出 → ReLU 等
    全精度权重 w → [权重伪量化] → ŵ ────┘
    反向：梯度经 STE 穿过两个伪量化节点，更新的是全精度权重 w（以及可学习的 s、α 等）

图中：

  - 激活在算子之后（如激活函数之后）被量化，权重在与输入卷积之前被量化；有 BN 的层，BN 参数先折叠进权重再量化（见第 7 节）；
  - 前向用量化后的值，反向用 STE 近似的梯度；
  - 偏置不被量化（推理时按累加器位宽 int32 保存，见 [基础原理](/0699_MO_Quantization_Basics)）。

## 4\. DoReFa-Net：任意位宽的权重、激活与梯度

DoReFa-Net 把二值网络推广到**任意位宽的权重、激活，以及低位宽的参数梯度**，卷积可以用位卷积核实现。其核心是 STE 形式的
$k$ 位量化函数：

$$ \\text{前向：}\\
r\_o=\\frac{1}{2^k-1},\\mathrm{round}\\big((2^k-1),r\_i\\big),\\qquad
\\text{反向：}\\ \\frac{\\partial c}{\\partial r\_i}=\\frac{\\partial
c}{\\partial r\_o} $$

其中：$r\_i\\in\[0,1\]$ 是输入，$r\_o\\in\[0,1\]$ 是量化到 $k$ 位后的输出（共 $2^k$
个取值），$c$ 为损失；反向时直接把输出的梯度传给输入（STE）。

**权重量化**：先用 $\\tanh$ 把权重限制到 $\[-1,1\]$，再映射到 $\[0,1\]$ 量化，最后映射回
$\[-1,1\]$：

$$
r\_o=2,\\mathrm{quantize}\_k\\Big(\\frac{\\tanh(r\_i)}{2\\max(|\\tanh(r\_i)|)}+\\frac12\\Big)-1
$$

其中：$r\_i$ 为全精度权重，最大值取该层所有权重的 $\\max|\\tanh(r\_i)|$；$\\tanh$
的作用是把任意取值范围的权重压到固定范围内再量化。对 1 位的情形，权重被二值化为
$\\mathrm{sign}(r\_i)\\cdot\\mathbb E\_F(|r\_i|)$（用整个层的绝对值均值缩放，与
XNOR-Net 的逐通道缩放不同，这样才能整体使用位卷积核）。

**激活量化**：先截断到 $\[0,1\]$
再量化，$f\_\\alpha(r)=\\mathrm{quantize}\_k(r)$；**梯度量化**：反向传播时对参数梯度做随机量化（并加噪声）。论文探索了权重/激活/梯度的位宽配置，例如
1 位权重、1 位激活、2 位梯度在 SVHN 上可达到 93% 的精度。

## 5\. PACT：可学习的激活截断

激活用 ReLU 时没有上界，低位宽量化时动态范围太大会带来大的量化误差。PACT（Parameterized Clipping
Activation）把 ReLU 换成带**可学习截断阈值** $\\alpha$ 的函数：

$$
y=\\mathrm{PACT}(x)=\\tfrac12\\big(|x|-|x-\\alpha|+\\alpha\\big)=\\begin{cases}0,\&x\<0\\x,&0\\le
x\<\\alpha\\\\alpha,\&x\\ge\\alpha\\end{cases},\\qquad
y\_q=\\mathrm{round}\!\\Big(y\\cdot\\frac{2^k-1}{\\alpha}\\Big)\\cdot\\frac{\\alpha}{2^k-1}
$$

其中：

  - $\\alpha$：截断阈值，把激活限制到 $\[0,\\alpha\]$；$k$：位宽；$y\_q$：线性量化到 $k$ 位后的输出；
  - $\\alpha$ 是损失函数的变量，通过反向传播学习；用 STE，梯度为：$\\partial
    y\_q/\\partial\\alpha=\\partial y/\\partial\\alpha$，即 $x\<\\alpha$
    时为 0，$x\\ge\\alpha$ 时为 1；
  - $\\alpha$ 越大，PACT 越接近 ReLU；为避免动态范围过大造成大的量化误差，损失函数里对 $\\alpha$ 加
    $L\_2$ 正则；
  - 论文观察到不同层的最优 $\\alpha$ 范围不同，而且存在损失的"平台"区域，这正是需要"学习"而不是手工设置截断阈值的原因；
  - PACT 使得权重与激活都能量化到 4 bit 甚至更低，论文还估算了位宽降低带来的 MAC 面积与加速收益。

## 6\. LSQ：可学习的步长

LSQ（Learned Step Size Quantization）把步长 $s$ 本身当作可学习参数，并推出关于 $s$
的梯度。每一层权重和每一层激活各有独立的步长。

### 6.1 步长梯度

对量化器 $\\hat v=\\lfloor\\mathrm{clip}(v/s,-Q\_N,Q\_P)\\rceil\\cdot s$ 用
STE 近似 round 的梯度，其余部分正常求导，得到：

$$ \\frac{\\partial\\hat v}{\\partial s}=\\begin{cases}-\\dfrac
vs+\\Big\\lfloor\\dfrac vs\\Big\\rceil,&-Q\_N\<\\dfrac
vs\<Q\_P\\\[6pt\]-Q\_N,&\\dfrac vs\\le-Q\_N\\\[4pt\]Q\_P,&\\dfrac vs\\ge
Q\_P\\end{cases} $$

其中：

  - 在范围内，梯度等于"取整残差" $\\lfloor v/s\\rceil-v/s$：$v$
    越接近量化转换点（两个量化级之间的边界），$s$
    的微小改变越可能让它跳到另一个量化桶，梯度的幅值就越大；
  - 超出范围时，梯度是常数 $-Q\_N$ 或 $Q\_P$；
  - 与 PACT、QIL 的梯度估计不同，LSQ 的梯度对"数据到各转换点的距离"敏感（论文 Figure 2）；而 PACT
    在范围内梯度为 0。

### 6.2 步长梯度缩放与初始化

为了让各层的"平均更新幅度与平均参数幅度之比"近似一致，把步长的梯度乘以缩放因子：

$$ g=\\frac{1}{\\sqrt{N\_WQ\_P}}\\ \\ (\\text{权重}),\\qquad
g=\\frac{1}{\\sqrt{N\_FQ\_P}}\\ \\ (\\text{激活}) $$

其中：$N\_W$ 是该层权重个数，$N\_F$ 是该层的特征（激活）个数，$Q\_P$ 是正水平数；直觉是：位宽越高 $s$
应越小；被求和的元素越多，$s$ 的梯度越大，所以需要按 $1/\\sqrt{N\\cdot Q\_P}$
缩小。论文的消融表明梯度缩放能提高训练精度。步长初始化为
$s=2\\langle|v|\\rangle/\\sqrt{Q\_P}$（在初始权重或第一批激活上计算，具体写法以论文附录为准
`[待核实]`）。

### 6.3 训练设置与结论

  - 保存并更新全精度权重，用量化后的权重/激活做前向反向，STE 传梯度，SGD 训练（动量 0.9，余弦学习率衰减，不带重启）；
  - 所有矩阵乘层的输入激活与权重取 2/3/4/8 位，**第一层与最后一层固定为 8 位**（量化网络的常规做法）；8 位网络只训练 1
    个 epoch，其余训练 90 个 epoch；
  - 结论：在 ImageNet 上，多种架构的 2/3/4 位模型达到当时最高的精度，3 位模型可以达到全精度基线精度；
  - **与蒸馏结合（论文 3.7 节）**：LSQ 加上同结构的知识蒸馏（Hinton 的蒸馏损失，温度为
    1，标准损失与蒸馏损失权重相等）后精度进一步提高，3
    位网络达到全精度基线的精度（论文 Table 4）——见
    [蒸馏理论与实践](/0698_MO_KD_Theory)。

## 7\. QAT 中的 BN 处理与实用流程

推理时 BN 会折叠进卷积权重（见 [基础原理](/0699_MO_Quantization_Basics)）。QAT 要尽量模拟推理行为：

  - **每通道量化**时，BN 的逐通道缩放不会改变量化误差，忽略折叠也问题不大；
  - **逐张量量化**时，若训练时保留 BN 而部署时折叠，则网络适应的是另一种量化噪声，可能导致显著的精度下降；
  - 两种折叠方式：Jacob 等的做法是在 QAT
    中更新滑动统计量并用校正做折叠，需要两次前向（一次算批统计量，一次做量化线性运算），较繁琐；Qualcomm
    白皮书的**静态折叠**则直接把 BN 的缩放与平移折进权重和偏置，从收敛的预训练模型出发时很有效，实验上不输甚至优于前者。

Qualcomm 白皮书给出的标准 QAT 流程（从预训练模型出发，并先做一些 PTQ 步骤）：

1.  （可选）跨层均衡（CLE），对 MobileNet 一类权重分布不均的网络是必要的（见
    [PTQ](/0702_MO_Quantization_PTQ)）；
2.  添加量化器：权重用对称量化（若支持，逐通道），激活用非对称量化，并正确模拟 BN；
3.  范围估计：初始化所有量化参数，推荐用逐层 MSE 准则（逐通道时 min-max 有时更好），见
    [校准](/0701_MO_Quantization_Calibration)；
4.  让量化参数**可学习**，低比特时尤其有益；使用 SGD 类优化器时，量化参数的学习率要比权重的学习率小；
5.  微调训练。

## 8\. 方法对比

| 方法         | 可学习的量          | 作用对象     | 梯度近似                                                          | 特点                                   |
| ---------- | -------------- | -------- | ------------------------------------------------------------- | ------------------------------------ |
| DoReFa-Net | 无（固定函数）        | 权重、激活、梯度 | STE                                                           | 任意位宽；权重用 tanh 归一化；梯度也量化              |
| PACT       | 截断阈值 $\\alpha$ | 激活       | STE，$\\partial y/\\partial\\alpha=\\mathbb 1\[x\\ge\\alpha\]$ | 对 $\\alpha$ 加 $L\_2$ 正则；每层独立         |
| LSQ        | 步长 $s$         | 权重与激活    | STE + 对 $s$ 的残差梯度                                             | 梯度缩放 $1/\\sqrt{N Q\_P}$；2/3/4 位 SOTA |

表中：

  - 第一列是方法，第二列是可学习的量，第三列是作用的对象，第四列是梯度近似，第五列是特点；
  - 三者按"让量化器越来越可学习"的顺序演进：从固定函数（DoReFa），到可学习截断（PACT），再到可学习步长并带原则性的梯度与缩放（LSQ）；
  - 它们都用 STE，区别在于量化参数的梯度怎么估计。

## 9\. 总结 \[解读\]

  - QAT 的"配方"：全精度预训练 → 插入伪量化 → 用合适的范围初始化 → 可学习的量化参数 → 少量 epoch 的微调（4 bit
    以上通常只需很少 epoch）；
  - 与 KD 结合是常见做法：用 FP 模型当 Teacher，帮助低比特 Student 恢复精度；
  - 对 LLM，完整 QAT 往往太贵，常用 PTQ（见 [LLM
    权重量化](/0706_MO_Quantization_LLM_Weight)）；只有在 PTQ
    无法满足精度、且有训练预算时才上 QAT。

## Reference

  - Bengio Y, Léonard N, Courville A. Estimating or Propagating
    Gradients Through Stochastic Neurons for Conditional Computation.
    arXiv:1308.3432
  - Zhou S, Wu Y, Ni Z, Zhou X, Wen H, Zou Y. DoReFa-Net: Training Low
    Bitwidth Convolutional Neural Networks with Low Bitwidth Gradients.
    arXiv:1606.06160
  - Choi J, Wang Z, Venkataramani S, Chuang P I-J, Srinivasan V,
    Gopalakrishnan K. PACT: Parameterized Clipping Activation for
    Quantized Neural Networks. arXiv:1805.06085 `[作者列表待核实]`
  - Esser S K, McKinstry J L, Bablani D, Appuswamy R, Modha D S. Learned
    Step Size Quantization. ICLR 2020. arXiv:1902.08153
  - Nagel M, Amjad R A, van Baalen M 等. A White Paper on Neural Network
    Quantization. arXiv:2106.08295
  - Jacob B 等. Quantization and Training of Neural Networks for
    Efficient Integer-Arithmetic-Only Inference. CVPR 2018.
    arXiv:1712.05877
