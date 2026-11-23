-----

| Title     | MO Quantization LLM Weight                            |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-23T02:18:05Z`                                |
| Updated @ | `2026-11-23T02:43:35Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/706) |

-----

# LLM 权重量化

大语言模型的推理常常受**显存和带宽**限制：权重搬运比计算更耗时。**仅权重量化（weight-only
quantization）**把权重压到 4 bit（甚至 3、2 bit），计算时再反量化回 FP16
或直接用专用内核，对延迟和显存都有明显收益，是 LLM 部署的主流做法。与传统 CNN 量化不同，LLM
的权重量化要在**不能重新训练**（成本太高）、**只有少量校准数据**的前提下，做到 4 bit
近乎无损。本文覆盖几种有代表性的方法：GPTQ（*GPTQ:
Accurate Post-Training Quantization for Generative Pre-trained
Transformers*，ICLR 2023，arXiv:2210.17323）、AWQ（*AWQ: Activation-aware
Weight Quantization for On-Device LLM Compression and
Acceleration*，MLSys 2024，arXiv:2306.00978）、SpQR（*SpQR: A
Sparse-Quantized Representation for Near-Lossless LLM Weight
Compression*，arXiv:2306.03078）、QuIP\#（*QuIP\#: Even Better LLM
Quantization with Hadamard Incoherence and Lattice Codebooks*，ICML
2024，arXiv:2402.04396）、AQLM（*Extreme Compression of Large Language
Models via Additive Quantization*，arXiv:2401.06118），以及 NF4/QLoRA（见
[数据类型](/0700_MO_Quantization_DataType)）和 GGUF 格式。

**一句话概括：GPTQ 用近似二阶信息逐列量化并补偿误差；AWQ 用"激活幅度"找出显著通道并通过等价缩放保护它；SpQR
把少数离群权重以高精度单独存放；QuIP\# 先用随机 Hadamard 变换"打散"离群值再用 E8
格点码本做向量量化；AQLM 用多个码本的加和表示权重；GGUF 则是存放量化权重的文件格式，而不是算法。**

> 标注约定：未标注的内容来自上述论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容（如
> HQQ、GGUF 的 K-quants 细节未读到原始文档）。

本站相关：总览 [量化](0312_MO_Quantization)；基础
[基础原理](/0699_MO_Quantization_Basics)；数据格式
[数据类型](/0700_MO_Quantization_DataType)；通用 PTQ 重建方法
[PTQ](/0702_MO_Quantization_PTQ)；LLM 的权重+激活量化 [LLM
WA](/0707_MO_Quantization_LLM_WA)；系列中的
[量化历史](/0688_MO_Quantization_History)。

## 1\. 解决什么问题

  - LLM 太大（如 70B 参数 FP16 需要 140GB），推理主要受内存带宽限制，把权重压到 4 bit
    及以下可以显著降低显存占用和访存时间；
  - 简单的四舍五入（RTN）只在 8 bit 够用，3～4 bit 时精度明显下降，尤其是 1～10B 的小模型；
  - LLM 的训练代价高，不能用 QAT，必须是**训练后量化（PTQ）**，只用少量校准数据，数小时内量化完成；
  - 因此重点是：更好的取整（GPTQ）、保护重要权重（AWQ、SpQR）、处理离群值与向量量化（QuIP\#、AQLM）。

## 2\. 符号约定

  - $W\\in\\mathbb R^{d\_{row}\\times
    d\_{col}}$：某个线性层的权重；$X$：该层的输入（校准数据）；$H=2XX^\\top$：层级重建误差的
    Hessian；
  - $\\mathrm{quant}(\\cdot)$：把数值取整到量化网格；$\\hat W$：量化后的权重；
  - $g$：量化分组大小（group size）。

## 3\. GPTQ：基于二阶信息的逐列量化

### 3.1 层级重建与 OBQ

GPTQ 按层量化，对每一层求使输出误差最小的量化权重：

$$ \\arg\\min\_{\\hat W}\\ \\big|WX-\\hat WX\\big|\_2^2 $$

其中 $X$ 是该层的输入；量化网格事先固定，权重可以自由选择取整方向。它建立在 OBQ（Optimal Brain
Quantization）之上：OBQ
逐行独立处理，一次量化一个权重，并同时更新所有尚未量化的权重去补偿误差。该目标是二次的，Hessian
为 $H\_F=2X\_FX\_F^\\top$（$F$ 是尚未量化的权重集合）。贪心地选择下一个要量化的权重 $w\_q$
以及对其余权重的最优更新 $\\delta\_F$ 为：

$$
w\_q=\\arg\\min\_{w\_q}\\frac{(\\mathrm{quant}(w\_q)-w\_q)^2}{\[H\_F^{-1}\]*{qq}},\\qquad
\\delta\_F=-\\frac{w\_q-\\mathrm{quant}(w\_q)}{\[H\_F^{-1}\]*{qq}}\\cdot(H\_F^{-1})\_{:,q}
$$

其中：$q$ 是被选中的权重下标；$\[H\_F^{-1}\]*{qq}$ 是逆 Hessian 的第 $q$
个对角元素；$(H\_F^{-1})*{:,q}$ 是其第 $q$ 列；第二个式子表示：量化 $w\_q$ 引入的误差
$w\_q-\\mathrm{quant}(w\_q)$，要按逆 Hessian 的第 $q$
列去"补偿"给还没量化的权重。每量化完一个权重，就从
$H$ 中删除对应的行列，逆矩阵用高斯消元一步更新：

$$
H\_{-q}^{-1}=H^{-1}-\\frac{H^{-1}*{:,q}H^{-1}*{q,:}}{\[H^{-1}\]\_{qq}}
$$

OBQ 的问题是太慢：ResNet-50（2500 万参数）需要约 1 小时，无法扩展到数百亿参数的 LLM。

### 3.2 GPTQ 的三项改进

1.  **任意顺序（Arbitrary Order）**：OBQ 贪心选择误差最小的权重，但对大型层，这相对于任意顺序的收益很小。GPTQ
    让**所有行按同一顺序**量化——于是未量化集合 $F$ 以及 $H\_F^{-1}$ 对所有行都相同，每一列只需更新一次
    $H^{-1}$（而不是每行各更新），复杂度大幅下降；
2.  **延迟批量更新（Lazy Batch-Updates）**：直接实现的访存比低，被内存带宽限制。观察到第 $i$
    列的取整只受**该列自己**之前的更新影响，所以可以每次处理一块 $B=128$
    列，更新限制在该块的 $B\\times B$ 子矩阵里，块处理完后再对整个 $H^{-1}$
    与 $W$ 做一次全局更新（使用多权重版本的更新式）。理论计算量不变，但 GPU 利用率大幅提升；
3.  **Cholesky 重构**：大模型上逆 Hessian 的数值误差会累积、甚至变成不定矩阵，导致错误的更新。论文用 Cholesky
    分解预先稳定地算出所需的行，并加上轻微阻尼（给对角线加平均对角值的 1%）。

算法（论文 Algorithm 1）可概括为：

    输入：W、逆 Hessian H⁻¹=(2XXᵀ+λI)⁻¹、块大小 B
    H⁻¹ ← Cholesky(H⁻¹)
    对每个块 i（步长 B）：
        对块内每一列 j：
            Q[:,j] ← quant(W[:,j])
            E[:,j−i] ← (W[:,j] − Q[:,j]) / [H⁻¹]_{jj}        # 量化误差（按对角元素归一化）
            W[:,j:(i+B)] ← W[:,j:(i+B)] − E[:,j−i] · H⁻¹[j, j:(i+B)]   # 更新块内尚未量化的列
        W[:, (i+B):] ← W[:, (i+B):] − E · H⁻¹[i:(i+B), (i+B):]       # 更新块外所有剩余列

图中：

  - 外层按块循环，块内按列量化；每量化一列就把误差补偿给本块内后面的列；块处理完再统一更新块外的所有列；
  - $E$ 存放块内每一列的量化误差；$H^{-1}$ 来自 Cholesky 分解后的上三角因子；
  - 所有行共用同一个顺序和同一份逆 Hessian 信息，因此可以按矩阵整体做列向量运算。

论文结论：GPTQ 可在约 **4 个 GPU 小时**内量化 1750 亿参数（OPT-175B、BLOOM-176B）、把位宽降到 3 或
4 bit，困惑度增加很小；首次证明数百亿参数的语言模型可量化到 3～4 bit（此前的 PTQ 方法只在 8 bit 下保持精度）；在极端的
2 bit 乃至三值下也能给出相当不错的结果；配合专门的 GPU 内核，在 A100 上加速约 3.25 倍，在 A6000 上约 4.5
倍，OPT-175B 可以在单块 A100 或两块 A6000 上运行。

## 4\. AWQ：激活感知的权重量化

### 4.1 显著权重（salient weights）

AWQ 的观察：LLM 的权重并不同等重要，约 \*\*0.1%～1% 的"显著权重"\*\*对性能影响很大；跳过对它们的量化（保留
FP16）能显著降低量化误差。关键是怎样识别它们：

| 选择 FP16 保留通道的依据 | 在 INT3（组大小 128）下的效果（OPT 系列困惑度）                                 |
| --------------- | -------------------------------------------------------------- |
| 不保留（RTN）        | OPT-1.3B：119.00；OPT-6.7B：23.54；OPT-13B：46.04                   |
| 按**激活**幅度选 1%   | 约 16.9 / 11.4 / 10.4（显著变好，接近 FP16 的 14.62 / 10.86 / 10.13 的水平） |
| 按**权重**幅度选      | 约 98～109 / 22～23 / 46～54（几乎无改善）                                |
| 随机选             | 改善有限（OPT-1.3B 最好约 61，OPT-6.7B 约 24，OPT-13B 约 40）               |

表中：

  - 第一列是选择"保留 FP16"通道的依据，第二列是对应的 WikiText 困惑度（数字取自论文 Table
    1，越低越好，括号外为近似范围）；
  - 只有**按激活分布**挑选才有效，按权重大小或随机选几乎没有帮助——说明权重的重要性由与之相乘的**激活幅度**决定，而不是权重自身的大小；
  - 但保留部分权重为 FP16 的"混合精度"实现困难（硬件不友好），所以需要不用混合精度也能保护这些权重的方法。

### 4.2 通过激活感知的缩放保护显著权重

量化函数（带绝对值最大值缩放）：

$$
Q(w)=\\Delta\\cdot\\mathrm{Round}\\Big(\\frac{w}{\\Delta}\\Big),\\qquad
\\Delta=\\frac{\\max|w|}{2^{N-1}} $$

其中：$N$ 是位宽，$\\Delta$ 是由该组权重的绝对值最大值决定的量化步长。若把某个权重 $w$ 乘以 $s\>1$、同时把对应的输入
$x$ 除以 $s$，则：

$$ Q(w\\cdot s)\\cdot\\frac
xs=\\Delta'\\cdot\\mathrm{Round}\\Big(\\frac{ws}{\\Delta'}\\Big)\\cdot
x\\cdot\\frac1s $$

其中：$\\Delta'$ 是缩放后的新步长。论文的经验：①舍入误差 $\\mathrm{RoundErr}(\\cdot)$（平均约
0.25）基本不变；②放大单个权重通常不改变该组的最大值，即 $\\Delta'\\approx\\Delta$。于是该权重的输出误差之比为
$\\frac{\\Delta'}{\\Delta}\\cdot\\frac1s$，当 $\\Delta'\\approx\\Delta$ 且
$s\>1$ 时**相对误差变小**。实验（OPT-6.7B）：把 1% 的显著通道乘以 $s$，困惑度从 $s=1$ 的 23.54 降到
$s=2$ 的 11.92，更大的 $s$ 反而会增加非显著通道的相对误差，最佳在 $s=2$——所以需要同时考虑显著与非显著通道。

### 4.3 搜索缩放因子

AWQ 自动搜索每个**输入通道**的缩放因子，最小化量化前后该层的输出差异：

$$ s^{\*}=\\arg\\min\_{s}\\ \\mathcal L(s),\\qquad \\mathcal
L(s)=\\Big|Q\\big(W\\cdot\\mathrm{diag}(s)\\big)\\big(\\mathrm{diag}(s)^{-1}\\cdot
X\\big)-WX\\Big| $$

其中：$Q$ 是权重量化函数（如 INT3/INT4、组大小 128）；$W$ 是原始 FP16 权重；$X$
是从小规模校准集（取自预训练数据集的一小部分，避免对特定任务过拟合）缓存的输入特征。为了稳定，把搜索空间限定为由激活幅度决定的一维形式：

$$ s=s\_X^{\\alpha},\\qquad \\alpha^{\*}=\\arg\\min\_{\\alpha}\\
\\mathcal L(s\_X^{\\alpha}) $$

其中：$s\_X$ 是各输入通道**激活的平均幅度**；$\\alpha\\in\[0,1\]$
是平衡"保护显著通道"与"保护非显著通道"的唯一超参数，在
$\[0,1\]$ 上快速网格搜索（$\\alpha=0$ 不缩放，$\\alpha=1$ 最激进）。AWQ
**不依赖反向传播或重建**，只用到激活统计，因此对校准集的分布更鲁棒、不容易过拟合；论文还配套了推理系统
TinyChat。AWQ 荣获 MLSys 2024 最佳论文奖（论文头部标注）。

## 5\. SpQR：稀疏 + 量化的混合表示

SpQR 的出发点：3～4 bit 量化在 1～10B
的小模型上常带来中到高的精度损失。它通过**识别并隔离少量离群权重**（它们带来特别大的量化误差），以高精度单独存放，而把其余权重压到
3～4 bit，在 LLaMA 与 Falcon 上取得小于 1% 的相对困惑度损失，实现首个跨规模的"近无损"压缩。

论文先分析发现，敏感权重的位置**并非随机**，而有结构：存在行离群（某个输出单元内高敏感的区域，有整行的也有部分的）、列离群、以及无法归入上述模式的零散离群。据此提出两项改动：

  - **双层量化（bilevel
    quantization）捕获小的敏感权重组**：权重在小的连续分组内表现相似、组间变化突兀，所以使用很小的分组（如
    16 个权重，具体取值待核实），并把这些小分组的缩放与零点本身再用一层低位宽量化；
  - **用稀疏离群捕获个别的离群权重**：识别敏感度超过阈值 $\\tau$ 的权重，用高精度（并用稀疏格式，如
    CSR）单独存放，其余权重按 GPTQ 的框架量化。

论文称其可以在单块 24GB 消费级 GPU 上无性能损失地运行 33B 参数模型，同时有约 15% 的加速。

## 6\. QuIP\#：非相干处理 + 格点码本

QuIP\# 面向 $\\le4$ bit 的极端压缩，用三项技术：

1.  **随机 Hadamard 变换（RHT）做非相干处理**：对权重与 Hessian
    乘以随机正交变换，把离群值"摊开"，使变换后的权重近似服从球形亚高斯分布，比
    QuIP 的 Kronecker 分解更快且理论性质更好；
2.  **E8 格点码本的向量量化**：非相干的权重近似分布在球内，论文设计了基于高度对称的 **E8 格点**（8
    维单位球最优堆积）的硬件友好码本，用 BlockLDLQ 做分块自适应取整；
3.  **层间微调**：进一步提升对原模型的保真度。

论文结果：在极端压缩（$\\le4$ bit/权重）下优于现有 PTQ 方法，并支持快速推理（例如 Llama 2 70B 用 2 bit
量化后不到 20GB）。

## 7\. AQLM：加性码本量化

AQLM 把"极端压缩"（每参数 2～3 bit）视为多码本量化（MCQ）问题，把经典的\*\*加性量化（Additive
Quantization）\*\*推广到 LLM，两项创新：

  - **输入自适应的加性量化**：把每组权重（如 8 个，具体配置见论文）表示成 $M$
    个码本向量之和，码本和码是通过最小化层输出误差学习的，而不是单纯的权重重建；
  - **跨 Transformer 块联合优化码本**。

论文称 AQLM 是首个在每参数少于 3 bit 时在"精度-模型大小"意义上达到 Pareto 最优的方案，在 2 bit
的极端压缩下显著优于此前所有已知方案，并提供了面向 token 生成的快速 GPU/CPU 实现。

## 8\. NF4、HQQ 与 GGUF

  - **NF4 / bitsandbytes**：QLoRA 引入的 4 位 NormalFloat
    数据类型，分位点对准正态分布，主要用于微调场景的权重存储，细节见
    [数据类型](/0700_MO_Quantization_DataType)；
  - **HQQ**（Half-Quadratic Quantization）：一种无需校准数据的快速量化方法，具体机制本文未读到原始文献
    `[待核实]`；
  - **GGUF**：llama.cpp / GGML 项目使用的**文件格式**，把已量化的权重（Q2\_K 到 Q8\_0
    等多种位宽，社区常用 Q4\_K\_M 作为精度与体积的折中）、分词器、元数据打包进同一个文件，主要面向
    CPU/边缘端本地推理；它是**容器**而不是量化算法，可以装 K-quants，也可以装 GPTQ/AWQ
    量化出来的权重；K-quants 的块结构细节本文未读原始文档 `[待核实]`。

## 9\. 方法对比

| 方法     | 核心思想                   | 是否需要校准数据   | 位宽（论文重点）               | 是否改变权重存储结构     |
| ------ | ---------------------- | ---------- | ---------------------- | -------------- |
| GPTQ   | 逐列量化 + 用逆 Hessian 补偿误差 | 需要（估计 $H$） | 3～4 bit（2 bit 也可）      | 否（标准均匀量化，配分组）  |
| AWQ    | 按激活找显著通道，等价缩放保护        | 需要（激活统计）   | 4 bit（INT3/INT4，组 128） | 否              |
| SpQR   | 敏感权重高精度稀疏存放，其余 3～4 bit | 需要         | 3～4 bit（近无损）           | 是（稀疏离群 + 双层量化） |
| QuIP\# | RHT 非相干 + E8 格点码本 + 微调 | 需要         | $\\le4$ bit（极端 2 bit）  | 是（码本索引）        |
| AQLM   | 加性多码本 + 输入自适应          | 需要         | 2～3 bit                | 是（多码本索引）       |
| GGUF   | 文件格式（可装各类量化）           | —          | Q2\_K～Q8\_0            | 容器             |

表中：

  - 第一列是方法，第二列是核心思想，第三列是否依赖校准数据，第四列是论文关注的位宽，第五列是否改变了权重的存储结构；
  - 从上到下，方法越来越"激进"：GPTQ、AWQ 保持标准的均匀量化结构（部署最简单，生态最成熟）；SpQR、QuIP\#、AQLM
    引入稀疏离群或码本，换取更低的位宽与更高的精度，但需要专门内核；
  - AWQ 与 GPTQ 的关系：二者都是算法，AWQ 不更新权重、只做缩放，GPTQ 通过更新权重补偿误差；二者都能被 GGUF
    之类的容器存放。

## 10\. 实践里怎么选 \[经验\]

  - 先用 **4 bit 的 PTQ**（AWQ 或 GPTQ，分组大小常取 128）；
  - 需要更低位宽（≤3 bit）或小模型要求近无损时，考虑 SpQR、QuIP\#、AQLM，同时确认推理框架是否支持相应的内核；
  - 本地 CPU/边缘部署常用 llama.cpp + GGUF（社区常用 Q4\_K\_M）；
  - 同时量化激活的方案见 [LLM 权重+激活量化](/0707_MO_Quantization_LLM_WA)；KV Cache 见
    [KV Cache 量化](/0708_MO_Quantization_KVCache)。

## Reference

  - Frantar E, Ashkboos S, Hoefler T, Alistarh D. GPTQ: Accurate
    Post-Training Quantization for Generative Pre-trained Transformers.
    ICLR 2023. arXiv:2210.17323
  - Lin J, Tang J, Tang H, Yang S, Chen W-M, Wang W-C, Xiao G, Dang X,
    Gan C, Han S. AWQ: Activation-aware Weight Quantization for
    On-Device LLM Compression and Acceleration. MLSys 2024.
    arXiv:2306.00978
  - Dettmers T 等. SpQR: A Sparse-Quantized Representation for
    Near-Lossless LLM Weight Compression. arXiv:2306.03078 `[作者列表待核实]`
  - Tseng A, Chee J, Sun Q, Kuleshov V, De Sa C. QuIP\#: Even Better LLM
    Quantization with Hadamard Incoherence and Lattice Codebooks. ICML
    2024. arXiv:2402.04396
  - Egiazarian V, Panferov A, Kuznedelev D, Frantar E, Babenko A,
    Alistarh D. Extreme Compression of Large Language Models via
    Additive Quantization. arXiv:2401.06118 `[会议待核实]`
  - Dettmers T, Pagnoni A, Holtzman A, Zettlemoyer L. QLoRA: Efficient
    Finetuning of Quantized LLMs. NeurIPS 2023. arXiv:2305.14314
