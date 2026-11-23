-----

| Title     | MO Quantization PTQ                                   |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-23T02:09:47Z`                                |
| Updated @ | `2026-11-23T02:09:47Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/702) |

-----

# PTQ

训练后量化（Post-Training
Quantization，PTQ）是在**已经训练好的模型**上直接量化，不做端到端重新训练，只用少量（常常是无标签的）校准数据，甚至完全不用数据。它速度快、使用门槛低，是工业部署里的首选；难点在于位宽降到
4 bit 及以下时，简单的"四舍五入 + 校准范围"精度会明显下降。本文覆盖四个有代表性的 PTQ 方法：DFQ（*Data-Free
Quantization Through Weight Equalization and Bias Correction*，ICCV
2019，arXiv:1906.04721）、AdaRound（*Up or Down? Adaptive Rounding for
Post-Training Quantization*，ICML 2020，arXiv:2004.10568）、BRECQ（*BRECQ:
Pushing the Limit of Post-Training Quantization by Block
Reconstruction*，ICLR 2021，arXiv:2102.05426）和 QDrop（*QDrop: Randomly
Dropping Quantization for Extremely Low-bit Post-Training
Quantization*，ICLR 2022，arXiv:2203.05740）。

**一句话概括：DFQ 在不用数据的前提下通过"跨层均衡 + 偏置校正"让权重更好量化；AdaRound
把"四舍五入"改成"学习每个权重向上还是向下取整"；BRECQ
以网络块为单位重建输出并用 Fisher 信息近似二阶误差；QDrop
在重建时随机丢掉激活量化，使得模型更"平坦"。**

> 标注约定：未标注的内容来自上述论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：总览 [量化](0312_MO_Quantization)；基础
[基础原理](/0699_MO_Quantization_Basics)；校准范围的选择
[校准](/0701_MO_Quantization_Calibration)；量化感知训练
[QAT](/XXXX_MO_Quantization_QAT)；LLM 场景下的 PTQ [LLM
权重量化](/XXXX_MO_Quantization_LLM_Weight)；系列中的
[量化历史](/0688_MO_Quantization_History)；无需数据的蒸馏对应思路
[无数据蒸馏](/0694_MO_KD_DataFree)。

## 1\. 解决什么问题

  - QAT 需要完整训练集与大量算力，PTQ 只需少量校准数据，部署更快；
  - 但是：
      - 有些网络（如 MobileNetV2）直接做 INT8 量化就会几乎失效（Krishnamoorthi 报告 ImageNet
        top-1 从 70.9% 掉到 0.1%）；
      - 位宽降到 4 bit 及以下时，"四舍五入到最近"也不是最优选择；
  - PTQ 方法按"所需条件"可分为：不需要数据（DFQ）、需要少量校准数据并做局部优化（AdaRound、BRECQ、QDrop）。

## 2\. 符号约定

  - $W$：权重；$s$：量化步长（缩放因子）；$x$：层的输入；$z=Wx$：预激活；$\\hat\\cdot$ 表示量化后；
  - $\\lfloor\\cdot\\rfloor$：向下取整；$\\lceil\\cdot\\rceil$：向上取整；$\\lfloor\\cdot\\rceil$：四舍五入；
  - $\\mathcal L$：任务损失；$H$：Hessian（二阶导数矩阵）。

## 3\. DFQ：无数据的跨层均衡与偏置校正

### 3.1 动机

MobileNetV2 的首个深度可分离层的各输出通道权重范围差异极大（论文 Figure
2），一个张量只用一组量化参数时，范围小的通道几乎分辨不出来；逐通道量化可以缓解，但很多硬件不支持。DFQ
的思路：在**不改变 FP32
模型输出**的前提下，调整各通道权重，使它们的范围更接近。此外，权重量化误差对输出是**有偏**的，会让下一层的输入分布整体偏移，需要校正。

### 3.2 跨层范围均衡

利用 ReLU 的**正尺度等变性**：对任意非负实数 $s$，$f(sx)=sf(x)$（PReLU
和更一般的分段线性函数也近似满足）。对连续两层
$h=f(W^{(1)}x+b^{(1)})$、$y=f(W^{(2)}h+b^{(2)})$，可以把第 1 层第 $i$ 个通道缩小
$s\_i$ 倍，同时把第 2 层对应的输入权重放大 $s\_i$ 倍，输出不变：

$$ W^{(1)}*{i,:}\\leftarrow\\frac{W^{(1)}*{i,:}}{s\_i},\\qquad
b^{(1)}*i\\leftarrow\\frac{b^{(1)}*i}{s\_i},\\qquad
W^{(2)}*{:,i}\\leftarrow s\_i,W^{(2)}*{:,i} $$

其中：

  - $i$：中间通道下标；$W^{(1)}*{i,:}$ 是第 1 层第 $i$ 个输出通道的权重；$W^{(2)}*{:,i}$ 是第 2
    层与该通道连接的输入权重；
  - 即 $S=\\mathrm{diag}(s)$，重参数化为 $W^{(2)}\\leftarrow
    W^{(2)}S$，$W^{(1)}\\leftarrow S^{-1}W^{(1)}$，$b^{(1)}\\leftarrow
    S^{-1}b^{(1)}$；对 CNN 是逐通道并在空间维度上广播。

怎么选 $s\_i$？目标是使两层中该通道的量化范围相等：设 $\\hat r^{(1)}\_i$、$\\hat r^{(2)}*i$
分别是通道 $i$ 在两层权重里的范围（对称量化为 $2\\max\_j|W*{ij}|$），论文给出的解为：

$$ s\_i=\\frac{1}{\\hat r^{(2)}\_i}\\sqrt{\\hat r^{(1)}\_i,\\hat
r^{(2)}\_i} $$

其中：这使得缩放后 $\\hat r^{(1)}\_i/s\_i=\\hat
r^{(2)}\_i,s\_i$，即两层中该通道的范围相同；这个启发式让通道的最大/最小值在共享该通道的各层之间均匀分配，每个通道的量化精度（总精度
$\\hat r^{(1)}\\cdot\\hat
r^{(2)}$）取到最大。多于两层共享通道时（如可分离卷积），可以顺序地逐对均衡，反复迭代直到收敛。

**吸收高偏置（high-bias absorption）**：当 $s\_i\<1$
时，均衡会增大该通道的偏置，进而加大激活的量化范围。论文把偏置里"过大的部分"吸收进下一层（利用
ReLU 的性质），避免激活范围被偏置撑大。均衡时，MobileNetV2 使用 ReLU6，要先换成 ReLU 以免出现逐通道不同的截断。

### 3.3 偏置校正

权重量化误差在输出上是有偏的。用 $N$ 个样本可以经验估计第 $j$ 个输出单元的偏差：

$$ \\mathbb E\[y\_j-\\hat
y\_j\]\\approx\\frac1N\\sum\_n\\big(Wx\_n\\big)\_j-\\big(\\hat
Wx\_n\\big)\_j $$

其中：$y\_j$、$\\hat y\_j$ 是原始与用量化权重 $\\hat W$ 计算出的输出；偏差通常不为
0，会使输出均值漂移、改变下一层的输入分布。记权重量化误差为
$\\epsilon=\\hat W-W$，则期望的输出误差为 $\\mathbb E\[\\epsilon
x\]=\\epsilon,\\mathbb E\[x\]$。校正的做法是从该层偏置里减掉它：

$$ b\\leftarrow b-\\epsilon,\\mathbb E\[x\] $$

其中：$\\mathbb E\[x\]$ 是该层输入的期望。如果模型有 BN、没有数据可用，可以用上一层 BN 的参数计算 $\\mathbb
E\[x\]$：假设预激活服从均值为 $\\beta$、标准差为 $\\gamma$ 的正态分布（$\\beta,\\gamma$ 为 BN
的平移和缩放参数），再经过 ReLU，得到的是"截断正态分布"，其期望有解析式，因此**不需要任何数据**。

论文结果（ImageNet，MobileNetV2，INT8，论文 Table 1）：原始模型 FP32 的 top-1 为 71.72%，直接
INT8 量化后只有 0.12%；把 ReLU6 换成 ReLU 后 FP32 为 71.70%、INT8 为
0.11%；再做跨层均衡，INT8 回升到 69.91%；再吸收高偏置，INT8 为 70.92%（此时
FP32 为 71.57%）——论文称这使量化精度回到与 FP32 相差 2% 以内、与逐通道量化相近的水平；DFQ
在语义分割（DeepLabV3+）与检测（SSDLite）上也将精度损失控制在 1% 以内，并优于逐通道量化；DFQ
不需要逐通道的硬件支持。

## 4\. AdaRound：自适应取整

### 4.1 为什么"四舍五入"不是最优

对权重加一个小扰动 $\\Delta w$，任务损失的变化可以按二阶泰勒展开：

$$ \\mathbb E\\big\[\\mathcal L(x,y,w+\\Delta w)-\\mathcal
L(x,y,w)\\big\]\\approx\\Delta w^{\\top}g(w)+\\frac12\\Delta
w^{\\top}H(w)\\Delta w $$

其中：$g(w)$ 和 $H(w)$ 是损失对 $w$ 的期望梯度与 Hessian。关键是第二项里有**权重间的交互**（$H$
的非对角元素），而"四舍五入"逐个地把每个权重独立取最近值，没有考虑这些交互。论文的实验：对 ResNet-18
第一层做 4 bit 量化，生成 100 种随机取整方案：最近取整 52.29%，随机取整的平均为
52.06%±5.52%，其中最好的一种达 63.06%（向上取整、向下取整都只有
0.10%）——说明存在远好于四舍五入的取整方案。

### 4.2 从任务损失到局部损失

每个权重只能取向下或向上取整两个值。把问题写成二值优化 $\\arg\\min\_{\\Delta w}\\ \\Delta w^\\top
g+\\tfrac12\\Delta w^\\top H\\Delta w$ 在计算上不可行（需要完整 Hessian 且是
NP-hard）。论文做了两步简化：

1.  对收敛的模型，忽略梯度项；并假设不同层之间的 Hessian 块对角；
2.  假设层输出的 Hessian 是常数对角阵，则该问题分解成对每一行权重独立的子问题，目标等价于最小化**预激活的均方误差**：

$$ \\arg\\min\_{\\Delta W\_{k,:}}\\ \\mathbb E\\Big\[\\big(\\Delta
W\_{k,:},x^{(\\ell-1)}\\big)^2\\Big\]=\\arg\\min\\ \\mathbb
E\\big|Wx-\\hat Wx\\big|\_F^2 $$

其中：$W\_{k,:}$ 是第 $k$ 行权重；$x^{(\\ell-1)}$ 是第 $\\ell$
层输入；这样的目标不需要后续层或任务损失的信息。这也是此前许多压缩工作使用的层级重建目标，但论文是"有理论依据"地推导出来的。

### 4.3 AdaRound 的松弛与正则

直接优化二值取整仍然困难，于是把取整变量**连续松弛**：

$$ \\tilde W=s\\cdot\\mathrm{clip}\\big(\\lfloor
W/s\\rfloor+h(V),,n,,p\\big),\\qquad
h(V\_{ij})=\\mathrm{clip}\\big(\\sigma(V\_{ij})(\\zeta-\\gamma)+\\gamma,,0,,1\\big)
$$

$$ \\arg\\min\_V\\ \\big|f\_a(Wx)-f\_a(\\tilde
Wx)\\big|*F^2+\\lambda,f*{reg}(V),\\qquad
f\_{reg}(V)=\\sum\_{i,j}\\big(1-|2h(V\_{ij})-1|^{\\beta}\\big) $$

其中：

  - $V\_{ij}$：每个权重对应的连续变量；$h(V)\\in\[0,1\]$ 是"向上取整的程度"，是**整流
    sigmoid**（$\\sigma$ 为 sigmoid，$\\zeta=1.1$、$\\gamma=-0.1$ 为拉伸参数，使
    $h$ 在接近 0 或 1 时梯度不消失）；$n,p$ 是整数网格的下、上界；$s$ 为预先固定的步长；
  - $f\_{reg}$：可微正则项，鼓励 $h(V)$ 收敛到 0 或 1（取整是二值的）；$\\beta$ 被**退火**：前期较大，让
    $h$ 自由地降低重建误差；后期变小，逼 $h$ 变成二值；
  - $f\_a$：激活函数；$\\hat x$
    表示该层输入是**前面各层都已量化**后的输出；这种"非对称重建"避免误差逐层累积，并考虑了激活函数的影响；
  - $\\lambda$：正则权重；整个模型按层依次优化，用 SGD 即可；
  - AdaRound 在每层只需少量无标签数据，把权重量化到 4 bit 时精度可以显著提升。

## 5\. BRECQ：块重建

### 5.1 重建粒度

论文用二阶误差分析比较了四种重建粒度：

| 粒度                | 假设的 Hessian 结构 | 评价                           |
| ----------------- | -------------- | ---------------------------- |
| 层级（Layer-wise）    | 层对角，层间独立       | 与 AdaRound 等相近，忽略跨层依赖        |
| 块级（Block-wise）    | 块对角，块内考虑依赖     | **最好**：Hessian 的主要非对角损失集中在块内 |
| 阶段级（Stage-wise）   | 同一下采样阶段内所有层联合  | 考虑更多依赖，但泛化误差变大               |
| 网络级（Network-wise） | 整个网络输出重建       | 类似蒸馏，少量校准图像下泛化误差大，效果不好       |

表中：

  - 第一列是重建的粒度，第二列是对应的 Hessian 近似结构，第三列是论文的评价；
  - 块（block）指现代 CNN 的基本构件，如残差瓶颈块；残差连接会增加块内的依赖；
  - 论文结论：**块级重建在"跨层依赖"与"泛化误差"之间取得最好平衡**，这也是 BRECQ（Block
    REConstruction）名称的由来。

### 5.2 用 Fisher 信息近似预激活 Hessian

对第 $i$ 个块，其二阶误差可转化为块输出处的误差 $\\mathbb E\[\\Delta
z^{(i)\\top}H(z^{(i)})\\Delta z^{(i)}\]$，仍需预激活 Hessian
$H(z^{(i)})$。BRECQ 用\*\*对角 Fisher 信息矩阵（FIM）\*\*代替：

$$ \\min\\ \\ \\mathbb E\\Big\[\\Delta
z^{(i)\\top},\\mathrm{diag}\\big((\\partial\\mathcal L/\\partial
z^{(i)}\_1)^2,\\dots,(\\partial\\mathcal L/\\partial
z^{(i)}\_a)^2\\big),\\Delta z^{(i)}\\Big\] $$

其中：$\\Delta z^{(i)}=z^{(i)}-\\hat z^{(i)}$ 是第 $i$ 块 FP
输出与量化输出之差；$\\partial\\mathcal L/\\partial
z^{(i)}\_j$ 是损失对块输出第 $j$
个分量的梯度，其平方作为该分量误差的权重（梯度大的位置对任务损失更敏感，误差权重更大）；相比假设
Hessian 为常数的做法（误差直接取 $|\\Delta z|^2$），这保留了更多信息 `[解读]`。

### 5.3 算法与混合精度

流程（论文 Algorithm 1）：对 FP 模型逐块：收集该块的输入 $x^{(i)}$、FP 输出 $z^{(i)}$
及其梯度；多次迭代：计算量化输出 $\\hat
z^{(i)}$，按上式的误差下降，更新块内**所有权重的取整**（采用
AdaRound 的取整变量）；如启用激活量化，同时更新激活的量化步长；最后（2 bit
时）计算各层及层间的敏感度，用于混合精度。论文报告其首次把
PTQ 的位宽推到 INT2，并首次证明无需额外技巧，PTQ 能让 4 位 ResNet 与 MobileNetV2 与 QAT 相当。

## 6\. QDrop：随机丢弃激活量化

### 6.1 动机

此前的 PTQ 重建往往只量化权重（激活保持 FP）来做重建，或者把激活也量化。QDrop
首先发现：**在重建过程中引入激活量化有益于最终精度**，而且令人意外的是**只量化一部分激活更好**。论文通过理论分析指出：优化出的低比特模型在校准数据和测试数据上的\*\*平坦度（flatness）\*\*至关重要。

### 6.2 方法

QDrop 的做法很简单：重建时每次前向，以概率 $p$ **随机地不对某些激活做量化**（保留 FP 值）：

$$ \\tilde a^{\\ell}=\\mathrm{mask}\\odot
a^{\\ell}+(1-\\mathrm{mask})\\odot\\mathrm{Quantize}(a^{\\ell}),\\qquad
\\mathrm{mask}\_i\\sim\\mathrm{Bernoulli}(p) $$

其中：

  - $a^\\ell$：第 $\\ell$ 层的 FP
    激活，$\\mathrm{Quantize}(a^\\ell)$：量化后的激活；$\\mathrm{mask}$
    是与激活同形状的二值掩码，$p$ 是丢弃（保留 FP）的概率，论文默认 **$p=0.5$**（Bernoulli 分布取 0.5
    时熵最大，有利于各个方向的平坦性）；
  - 该形式是对论文式 (9) 的整理 `[待核实：精确的掩码与符号定义以原文为准]`；
  - 它是对已有三种做法的推广：全部量化（$p=0$）、全部不量化（$p=1$）、以及块级地丢弃（对被优化的块
    $p=1$、其他部分保持量化）；
  - 理论上，随机地掩盖一部分激活量化能覆盖更多"平坦方向"，使量化权重的损失曲面在测试数据上更平坦。

论文结论：QDrop 在 ImageNet 上权重 2 bit、激活 2/4 bit 的设置下，对 6
个模型的精度都有提升，对轻量网络提升更明显（如
MNasNet 在 W2A4 提升 2.36%，RegNet-3.2GF 提升 12.6%）；它也适用于 Transformer（NLP 的
GLUE 与 SQuAD），把 PTQ 推到 2-bit 激活，精度提升最高可达 51.49%；在 W4A4 上相对
AdaRound、BRECQ 有 0～3% 的提升。

## 7\. 方法对比

| 方法       | 是否需要数据 | 优化什么           | 是否需要梯度/反向    | 关键点                           |
| -------- | ------ | -------------- | ------------ | ----------------------------- |
| DFQ      | 不需要    | 权重的范围与偏置       | 不需要          | ReLU 等变均衡 + 偏置校正（BN 解析）       |
| AdaRound | 少量无标签  | 每个权重的取整（向上/向下） | 需要对取整变量做 SGD | 局部 MSE 损失 + 整流 sigmoid + 正则退火 |
| BRECQ    | 少量无标签  | 块内权重取整（+激活步长）  | 需要           | 块级重建 + Fisher 加权 + 混合精度       |
| QDrop    | 少量无标签  | 同上（权重取整）       | 需要           | 重建时随机丢弃激活量化，追求平坦              |

表中：

  - 第一列是方法，第二列是需要的数据，第三列是优化的对象，第四列是否要反向传播（对取整变量的梯度下降），第五列是关键点；
  - DFQ 是"完全无数据"的 level-1 方法，AdaRound、BRECQ、QDrop
    属于需要少量校准数据的"重建类"方法，精度更高但耗时更长（仍远低于
    QAT）；
  - 趋势：优化对象从"范围/偏置"（DFQ）发展到"取整决策"（AdaRound），再到"更合理的重建单位与激活扰动"（BRECQ、QDrop）。

## 8\. 总结 \[解读\]

  - PTQ 的常用阶梯：先做校准（见
    [校准](/0701_MO_Quantization_Calibration)），不行就加跨层均衡/偏置校正，再不行用
    AdaRound/BRECQ/QDrop 做权重取整的重建，仍不行才上
    [QAT](/XXXX_MO_Quantization_QAT)；
  - 这些方法大多在 CNN 上提出，用于大模型时需要针对 LLM 的特点调整（如 GPTQ 对 OBS 的利用，见 [LLM
    权重量化](/XXXX_MO_Quantization_LLM_Weight)）；
  - 局限：重建类方法依赖校准数据的代表性，QDrop 的分析也说明 PTQ 对校准数据非常敏感。

## Reference

  - Nagel M, van Baalen M, Blankevoort T, Welling M. Data-Free
    Quantization Through Weight Equalization and Bias Correction. ICCV
    2019. arXiv:1906.04721 `[第四作者待核实]`
  - Nagel M, Amjad R A, van Baalen M, Louizos C, Blankevoort T. Up or
    Down? Adaptive Rounding for Post-Training Quantization. ICML 2020.
    arXiv:2004.10568 `[作者列表待核实]`
  - Li Y 等. BRECQ: Pushing the Limit of Post-Training Quantization by
    Block Reconstruction. ICLR 2021. arXiv:2102.05426 `[作者列表待核实]`
  - Wei X, Gong R, Li Y, Liu X, Yu F. QDrop: Randomly Dropping
    Quantization for Extremely Low-bit Post-Training Quantization. ICLR
    2022. arXiv:2203.05740
