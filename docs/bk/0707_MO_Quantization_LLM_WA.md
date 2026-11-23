-----

| Title     | MO Quantization LLM WA                                |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-23T02:20:33Z`                                |
| Updated @ | `2026-11-23T02:43:40Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/707) |

-----

# LLM 权重+激活量化

仅量化权重（W4A16）主要省显存和带宽，但大模型的**预填充（prefill）阶段是算力受限**的——要加速计算，需要**把激活也量化**，让矩阵乘全部用低位整数完成（W8A8、W4A4）。难点是
LLM 激活里有**系统性的离群值**：少数通道的幅值比其他通道大一两个数量级，使得按张量量化的激活几乎只剩 2～3
个有效量化级别。本文覆盖四条应对离群值的路线：**混合精度分解**（LLM.int8()，*LLM.int8():
8-bit Matrix Multiplication for Transformers at Scale*，NeurIPS
2022，arXiv:2208.07339）、**把难度从激活迁移到权重**（SmoothQuant，*SmoothQuant:
Accurate and Efficient Post-Training Quantization for Large Language
Models*，ICML
2023，arXiv:2211.10438）、**可学习的截断与等价变换**（OmniQuant，*OmniQuant:
Omnidirectionally Calibrated Quantization for Large Language
Models*，ICLR 2024，arXiv:2308.13137）和**旋转消除离群值**（QuaRot，*QuaRot:
Outlier-Free 4-Bit Inference in Rotated LLMs*，arXiv:2404.00456）；还简述
ZeroQuant（*ZeroQuant: Efficient and Affordable Post-Training
Quantization for Large-Scale Transformers*，arXiv:2206.01861）的细粒度量化，以及
FP8 推理。

**一句话概括：激活量化的核心矛盾是少数离群通道。LLM.int8() 把离群维度单独用 FP16 算；SmoothQuant 用等价变换
$Y=(X,\\mathrm{diag}(s)^{-1})(\\mathrm{diag}(s)W)$ 把离群值从激活挪给权重；OmniQuant
让截断和变换系数可学习；QuaRot 对隐状态乘正交旋转矩阵，把离群值"打散"到所有通道，实现 4 bit 的权重、激活与 KV
cache。**

> 标注约定：未标注的内容来自上述论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容（如
> SpinQuant、FP8 推理的细节未读原文）。

本站相关：总览 [量化](0312_MO_Quantization)；基础
[基础原理](/0699_MO_Quantization_Basics)；数据格式（FP8、MX）[数据类型](/0700_MO_Quantization_DataType)；仅权重量化
[LLM 权重量化](/0706_MO_Quantization_LLM_Weight)；KV Cache 量化 [KV
Cache](/0708_MO_Quantization_KVCache)；系列中的
[量化历史](/0688_MO_Quantization_History)。

## 1\. 解决什么问题

  - **权重易量化，激活难量化**：权重分布均匀平坦，INT8 甚至 INT4 都基本不掉点；但 LLM 的激活有离群值，幅度可达其他值的
    100 倍以上（SmoothQuant 论文）；
  - 若对激活做逐张量量化，最大值被离群值主导，非离群通道的有效量化级别只有 $2^8\\cdot m\_i/m$（$m\_i$ 为通道
    $i$ 的最大幅度，$m$ 为整个矩阵的最大值），通常只剩 2～3 级，量化误差很大；
  - 离群值**固定出现在少数通道**（SmoothQuant 的观察），且沿 token
    方向相对稳定——这是它们能被通道级的变换处理的原因；
  - LLM.int8() 发现：当模型规模达到约 6.7B 参数时出现"相变"，几乎所有层、约 75%
    的序列位置都被极端幅值的特征影响，普通的 8 bit
    量化在此规模以上失效。

## 2\. 符号约定

  - $X\\in\\mathbb R^{T\\times C\_{in}}$：激活（$T$ 个 token，$C\_{in}$
    个输入通道）；$W\\in\\mathbb R^{C\_{in}\\times
    C\_{out}}$：权重；$Y=XW$；
  - $s\\in\\mathbb R^{C\_{in}}$：逐输入通道的缩放向量，$\\mathrm{diag}(s)$ 为对角矩阵；
  - $Q$：正交矩阵（$QQ^\\top=I$）；$\\max|X\_j|$：第 $j$ 个通道激活的绝对值最大值。

## 3\. LLM.int8()：混合精度分解

### 3.1 观察

论文发现 Transformer 隐状态里存在**涌现的离群特征**：幅值最多比其他维度大 20 倍的特征首先出现在约 25%
的层，并随规模增大逐渐扩散；约 6.7B 参数处发生相变，所有层、约 75%
的序列位置都受影响。这些离群特征**高度系统化**：在 6.7B
规模每个序列有约 15 万个离群值，却集中在整个 Transformer 的仅 **6
个**特征维度上。把这些维度置零，会使 top-1 注意力 softmax 概率质量下降 20%
以上，验证困惑度恶化 600%～1000%；而随机去掉同样数量的特征只带来很小的影响——所以不能简单地裁掉或截断它们。

### 3.2 两部分的量化流程

LLM.int8() 对前馈层与注意力投影层的矩阵乘分成两部分：

1.  **向量级量化（vector-wise）**：矩阵乘可看成一系列独立的行向量与列向量内积，为每个内积使用单独的归一化常数，得到的输出再用行、列常数的外积反归一化；大多数特征用
    INT8 计算；
2.  **混合精度分解（mixed-precision decomposition）**：把含离群值的少数特征维度单独抽出，用 16
    位矩阵乘处理，其余用 INT8：

$$
XW\\approx\\underbrace{X\_{O}W\_{O}}*{\\text{FP16（离群维度）}}+\\underbrace{\\mathrm{dequant}\\big(Q\_8(X*{\\bar
O}),Q\_8(W\_{\\bar O})\\big)}\_{\\text{INT8（其余维度）}} $$

其中：

  - $O$ 是离群特征维度的集合（论文的经验：幅值大于等于 6 的特征视为离群特征，此后困惑度退化不再出现），$\\bar O$
    是其余维度；
  - $X\_O$、$W\_O$ 是取出的离群列/对应行（保持 FP16），$X\_{\\bar O}$、$W\_{\\bar O}$
    是其余部分，经过向量级的 INT8 量化后相乘再反量化；
  - 离群维度只占全部特征的约 0.1%，所以绝大部分计算仍是 INT8。

论文结论：在 OPT 系列上，6.7B 以上普通 INT8 量化失效，LLM.int8() 保持 16 位精度；可以把一个 175B 参数的
16/32 位检查点直接加载、转成 Int8 并立即使用，显存减半，无性能退化。

## 4\. SmoothQuant：把难度迁移到权重

### 4.1 等价变换

激活逐通道量化不可行（反量化时需要对内积维度做逐通道缩放，硬件内核不支持）。SmoothQuant 的做法是用逐通道的**平滑因子** $s$
把输入激活"除平滑"，同时把权重反向缩放，保证线性层输出数学上等价：

$$
Y=\\big(X,\\mathrm{diag}(s)^{-1}\\big)\\cdot\\big(\\mathrm{diag}(s),W\\big)=\\hat
X\\hat W $$

其中：$\\hat X=X\\mathrm{diag}(s)^{-1}$ 是平滑后的激活（离群通道被缩小）；$\\hat
W=\\mathrm{diag}(s)W$ 是相应放大的权重；因为 $X$ 通常来自前一个线性层或
LayerNorm，平滑因子可以**离线融合进上一层的参数**，运行时没有额外的缩放开销；若输入来自残差加法，则在残差分支上增加一个缩放。

### 4.2 平滑因子的选择

为了让所有通道的最大幅值相同（此时总的有效量化位数最大），一个直接的选择是
$s\_j=\\max|X\_j|$；但这会把全部难度压到权重上。论文引入**迁移强度**
$\\alpha$ 控制迁移多少：

$$ s\_j=\\frac{\\max(|X\_j|)^{\\alpha}}{\\max(|W\_j|)^{1-\\alpha}} $$

其中：$X\_j$ 是第 $j$ 个输入通道的激活，$W\_j$ 是对应的权重行，$\\alpha\\in\[0,1\]$
是迁移强度；$s\_j$ 是在校准样本上统计得到的；$\\alpha=0.5$ 对多数模型（如所有
OPT、BLOOM）是均衡点，使对应通道的权重与激活的最大值相近，便于同样的量化器；模型的激活离群更严重时（如
GLM-130B）可以取更大的 $\\alpha$ `[具体取值待核实]`。

### 4.3 在 Transformer 中的应用与效率档位

默认对自注意力和前馈的输入激活做平滑，并量化所有线性层为 W8A8，同时也量化注意力中的 BMM；LayerNorm、Softmax、ReLU
等轻量逐元素算子保持 FP16。论文给出由保守到激进的三档（O1/O2/O3）：

| 档位             | 权重  | 激活         |
| -------------- | --- | ---------- |
| SmoothQuant-O1 | 逐张量 | 逐 token 动态 |
| SmoothQuant-O2 | 逐张量 | 逐张量动态      |
| SmoothQuant-O3 | 逐张量 | 逐张量静态      |

表中：

  - 第一列是效率档位，第二、三列是权重与激活的量化粒度；
  - 从 O1 到 O3，激活的量化越来越"粗"（逐 token 动态 → 逐张量动态 → 逐张量静态），推理延迟越来越低，精度要求越高；
  - 论文报告在多个 LLM（OPT、BLOOM、GLM、Llama-1/2、Falcon、Mistral、Mixtral 等）上以 W8A8
    近乎无损，并带来最高约 1.56 倍加速和 2 倍显存减少。

## 5\. ZeroQuant（简述）

ZeroQuant 同样做 W8A8，但从**量化粒度**入手：对权重用**分组量化（group-wise）**，对激活用**逐 token
量化（token-wise）**，并配合内核融合降低量化/反量化开销；此外提出\*\*逐层知识蒸馏（LKD）\*\*做
INT4/INT8 混合精度量化，无需原训练数据。论文报告 INT8 模型相对 FP16 推理在 A100 上可获得最高约 5.19
倍（BERT-base）/ 4.16 倍（GPT-3 350M）的加速。关于蒸馏的更多内容见
[蒸馏理论与实践](/0698_MO_KD_Theory)。

## 6\. OmniQuant：可学习的截断与等价变换

OmniQuant 指出：此前的 PTQ
方法的量化参数（截断阈值、平滑因子）是手工设定的，在极低位宽下效果差。它在**块级（block-wise）量化误差最小化**的框架下，用梯度优化少量量化参数，同时保持
PTQ 的计算效率：

$$ \\arg\\min\_{\\Theta\_1,\\Theta\_2}\\ \\Big|\\mathcal
F(W,X)-\\mathcal
F\\big(Q\_w(W;\\Theta\_1,\\Theta\_2),,Q\_a(X,\\Theta\_2)\\big)\\Big| $$

其中：$\\mathcal F$ 是一个 Transformer 块的映射函数；$W$、$X$ 是全精度权重和激活；$Q\_w$、$Q\_a$
是权重和激活的量化器；$\\Theta\_1$ 是可学习权重截断（LWC）的参数，$\\Theta\_2$
是可学习等价变换（LET）的参数。原模型的全精度权重被冻结，只优化这一小组参数，按块依次量化，资源开销很小。

**LWC（Learnable Weight Clipping）**：不直接学习截断阈值（如 PACT、LSQ 的做法），而是学习"截断强度"：

$$ W\_q=\\mathrm{clamp}\\Big(\\Big\\lfloor\\frac
Wh\\Big\\rceil+z,,0,,2^N-1\\Big),\\quad
h=\\frac{\\gamma\\max(W)-\\beta\\min(W)}{2^N-1},\\quad
z=-\\Big\\lfloor\\frac{\\beta\\min(W)}{h}\\Big\\rceil $$

其中：$N$ 是位宽；$h$ 是归一化因子（步长），$z$ 是零点；$\\gamma,\\beta\\in\[0,1\]$
是上、下界的**可学习截断强度**（通过 sigmoid
参数化，$\\mathrm{Sigmoid}(t)=1/(1+e^{-t})$）；当 $\\gamma=\\beta=1$
时退化为普通的 min-max 量化——所以 LWC 继承了 min-max 的优点，只需调节截断强度，优化更容易。

**LET（Learnable Equivalent Transformation）**：对线性层采用逐通道缩放加逐通道平移，使激活更易量化：

$$ Y=XW+B=\\big\[(X-\\delta)\\oslash s\\big\]\\cdot\\big\[s\\odot
W\\big\]+\\big\[B+\\delta W\\big\] $$

其中：$s\\in\\mathbb R^{1\\times C\_{in}}$ 是逐通道缩放，$\\delta\\in\\mathbb
R^{1\\times C\_{in}}$ 是逐通道平移（均为可学习），$\\oslash$、$\\odot$
是逐元素除、乘；该变换数学上等价，缩放与平移可以吸收进前面的归一化或线性层，权重端的缩放也可以融合进原权重，所以**不引入额外的参数或开销**；平移
$\\delta$ 的引入是对 SmoothQuant 只做缩放的扩展（OmniQuant 借鉴了 SmoothQuant 与 Outlier
Suppression+）。变换后的权重更难量化，所以 LWC 恰好与之互补。对注意力，论文也对 $Q$、$K$ 做缩放以便量化
KV：$P=\\mathrm{Softmax}\\big((Q\\oslash s\_a)(s\_a\\odot
K^\\top)\\big)$；因此 $\\Theta\_2={\\delta,s,s\_a}$。

论文报告：OmniQuant 在多种设置（仅权重的 W4A16、W3A16、W2A16，权重-激活的 W6A6、W4A4 等）下都取得
SOTA，尤其在低位宽 `[具体设置以论文为准，待核实]`。

## 7\. QuaRot：旋转消除离群值

QuaRot 把整个 LLM 的**所有权重、激活和 KV cache 都量化到 4 bit**，所有矩阵乘都用 4
bit，**不保留任何高精度的离群通道**。其核心是：对模型隐状态做正交旋转来去除离群值，同时保持输出不变。

### 7.1 计算不变性

正交矩阵 $Q$ 满足 $QQ^\\top=I$；旋转矩阵是正交矩阵；Hadamard 矩阵是元素为 $\\pm1/\\sqrt d$
的正交矩阵，Walsh-Hadamard 变换只需 $O(d\\log d)$。**计算不变性定理**（Ashkboos
等，2024）指出：对带 RMSNorm 的 Transformer，把权重与隐状态用正交矩阵旋转，输出不变（RMSNorm
除以范数，旋转不改变范数，前提是先把 RMSNorm 的缩放吸收进相邻的权重）。基本思想可写成：

$$ XW=(XQ),(Q^{\\top}W) $$

其中：$X$ 是隐状态，$W$ 是线性层权重，$Q$ 是正交矩阵；把旋转后的激活 $XQ$ 与旋转后的权重 $Q^\\top W$
相乘，结果与原来相同。选 $Q$ 为**随机 Hadamard 矩阵**（$\\tilde
H=H,\\mathrm{diag}(s)$，$s$ 为 $\\pm1$
的随机向量）时，旋转会把离群值的幅度"摊"到所有通道上，使激活近似均匀、易于量化，而且
$Q^\\top W$ 可以离线算好、吸收进权重。

### 7.2 两阶段

  - **阶段 1（权重修改，全精度）**：把各权重矩阵乘上正交矩阵（先把 LayerNorm/RMSNorm
    的线性部分融合进相邻权重），并在模型的前向里插入两个额外的
    Hadamard 运算；
  - **阶段 2（量化）**：权重用 RTN 或 GPTQ 量化；激活用逐 token 的量化；在注意力模块里再加一个在线的
    Hadamard 变换，去除 key、value 中的离群值，使 KV cache 也能量化到 4 bit。

论文结果：4 bit 量化的 Llama 2-70B 在 WikiText-2 上困惑度损失至多 0.47，保留了 99% 的零样本性能；对
6、8 bit，仅用 RTN（无校准数据）就能做到无损。与 QuaRot 思路相近的还有
SpinQuant（用学习得到的旋转矩阵，arXiv:2405.16406，本文未读原文
`[待核实]`）。此前 QuIP/QuIP\# 已在仅权重量化中用到旋转（见 [LLM
权重量化](/0706_MO_Quantization_LLM_Weight)）。

## 8\. FP8 推理

FP8 推理不需要把激活压成整数，而是用 FP8 的 E4M3/E5M2 格式（见
[数据类型](/0700_MO_Quantization_DataType)）：权重与激活常用
E4M3，并用逐张量的缩放因子把数值范围对齐到 FP8 可表示区间；FP8
的浮点网格本身对离群值更宽容，因此对激活量化更友好。具体框架支持与精度表现本文未对照原始文档
`[待核实]`。

## 9\. 方法对比

| 方法          | 对付离群值的方式              | 是否需要校准数据           | 位宽                    | 是否改变模型结构         |
| ----------- | --------------------- | ------------------ | --------------------- | ---------------- |
| LLM.int8()  | 离群维度单独 FP16           | 否（运行时按阈值检测）        | W8A8                  | 否，但需要混合精度内核      |
| ZeroQuant   | 细粒度量化（权重分组、激活逐 token） | 否                  | W8A8、INT4/INT8        | 否                |
| SmoothQuant | 离线把激活的离群值迁移给权重        | 需要（统计 $\\max       | X\_j                  | $）               |
| OmniQuant   | 可学习截断 + 可学习缩放/平移      | 需要（块级重建）           | W4A16～W2A16、W6A6、W4A4 | 否（参数可融合）         |
| QuaRot      | 正交 Hadamard 旋转摊平离群值   | 可以不需要（RTN）；GPTQ 需要 | W4A4KV4               | 是（插入在线 Hadamard） |

表中：

  - 第一列是方法，第二列是处理离群值的方式，第三列是否需要校准数据，第四列是论文主要的位宽设置，第五列是否改变模型结构；
  - 演进主线：从"把离群值单独处理"（LLM.int8()）到"把离群值挪走"（SmoothQuant）、"学习怎么挪"（OmniQuant），再到"把离群值打散"（QuaRot），位宽从
    W8A8 推进到 W4A4；
  - 它们都在回答同一个问题：怎样让激活的数值范围更均匀，使低位量化的有效级别不被少数离群通道浪费。

## 10\. 总结 \[解读\]

  - W8A8（SmoothQuant、LLM.int8()）已经相当成熟，适合服务端加速；W4A4
    需要旋转类方法（QuaRot、SpinQuant）或更强的重建；
  - 与仅权重量化（W4A16）相比，WA 量化多了对激活的校准与离群值处理，但能同时利用整数算力，加速预填充；
  - 权重与激活的量化往往要和 KV cache 量化一起考虑（见 [KV
    Cache](/0708_MO_Quantization_KVCache)）。

## Reference

  - Dettmers T, Lewis M, Belkada Y, Zettlemoyer L. LLM.int8(): 8-bit
    Matrix Multiplication for Transformers at Scale. NeurIPS 2022.
    arXiv:2208.07339 `[作者与会议待核实]`
  - Xiao G, Lin J, Seznec M, Wu H, Demouth J, Han S. SmoothQuant:
    Accurate and Efficient Post-Training Quantization for Large Language
    Models. ICML 2023. arXiv:2211.10438
  - Yao Z, Aminabadi R Y, Zhang M, Wu X, Li C, He Y. ZeroQuant:
    Efficient and Affordable Post-Training Quantization for Large-Scale
    Transformers. NeurIPS 2022. arXiv:2206.01861
  - Shao W, Chen M, Zhang Z, Xu P, Zhao L, Li Z, Zhang K, Gao P, Qiao Y,
    Luo P. OmniQuant: Omnidirectionally Calibrated Quantization for
    Large Language Models. ICLR 2024. arXiv:2308.13137
  - Ashkboos S, Mohtashami A 等. QuaRot: Outlier-Free 4-Bit Inference in
    Rotated LLMs. arXiv:2404.00456 `[作者列表与会议待核实]`
  - Ashkboos S 等. SliceGPT: Compress Large Language Models by Deleting
    Rows and Columns（计算不变性定理的来源）. 2024 `[未读原文]`
