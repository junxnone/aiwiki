---
Title | MO Quantization Basics
-- | --
Created @ | `2026-11-23T02:03:30Z`
Updated @| `2026-11-23T02:24:49Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/699)

---
# Basics

量化（Quantization）把神经网络中的浮点数（权重、激活）用低比特整数表示，让推理可以用整数运算完成，从而省存储、省带宽、省算力。这一篇讲量化的**基本原理**：仿射量化的公式、对称与非对称、量化粒度、截断与舍入误差，以及整数推理的算术（整数矩阵乘、requantize、零点展开、偏置、BN 折叠）。内容主要依据三份文献：Jacob 等人的 *Quantization and Training of Neural Networks for Efficient Integer-Arithmetic-Only Inference*（CVPR 2018，arXiv:1712.05877，即 TensorFlow Lite 的量化方案）、Qualcomm 的 *A White Paper on Neural Network Quantization*（arXiv:2106.08295）以及 NVIDIA 的 *Integer Quantization for Deep Learning Inference: Principles and Empirical Evaluation*（arXiv:2004.09602）。

**一句话概括：量化就是用一个"缩放因子 + 零点"把浮点区间线性映射到整数网格（$r=S(q-Z)$）；舍入误差与截断误差此消彼长；整数推理时把所有缩放因子合并成一个只依赖离线常量的乘子，用 int32 累加后再"重新量化"回 int8。**

> 标注约定：未标注的内容来自上述论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：总览 [量化](0312_MO_Quantization)；模型优化总览 [模型性能优化技术](0471_MO)；BN 折叠的实现 [OpenVINO BN 折叠](0564_Tools_OV_MO_BNFolding)；系列中的 [量化历史](/0688_MO_Quantization_History)。

## 1. 解决什么问题

- FP32 模型体积大、访存多、乘加开销高；嵌入式与移动设备的算力、内存、功耗都受限；
- 定点运算比浮点更节能，且数字电路的开销随位宽线性到平方增长（Qualcomm 白皮书的硬件背景）；
- 所以需要一个"浮点 ↔ 整数"的转换方案，使得：①精度损失可控；②推理可以只用整数算术；③0 能被精确表示（卷积的零填充需要）。

## 2. 符号约定

- $r$：实数（real value），$q$：量化后的整数（quantized value）；
- $S$：缩放因子（scale），$Z$：零点（zero-point，实数 0 对应的整数）；
- $b$：位宽；$[q_{min},q_{max}]$：整数网格范围，如 uint8 为 $[0,255]$，int8 为 $[-128,127]$；
- $[\alpha,\beta]$：被量化数据的范围（最小值、最大值）。

## 3. 仿射量化

### 3.1 量化与反量化

Jacob 等人把量化方案定义为整数 $q$ 到实数 $r$ 的**仿射映射**：

$$
r=S\,(q-Z)
$$

其中：

- $S$：缩放因子，任意正实数，通常用浮点保存；$Z$：零点，类型与 $q$ 相同，**是实数 0 对应的量化值**——这保证 $r=0$ 能被精确表示（卷积的零填充需要）；
- 每个激活数组、每个权重数组使用一组 $(S,Z)$（即逐张量）；偏置向量一般量化成 32 位整数。

给定实数 $x$，Qualcomm 白皮书把量化（先映射到整数网格）与反量化写成：

$$
x_{int}=\mathrm{clamp}\!\Big(\Big\lfloor\frac{x}{s}\Big\rceil+z;\ q_{min},q_{max}\Big),\qquad \hat x=s\,(x_{int}-z)
$$

其中：

- $\lfloor\cdot\rceil$：四舍五入到最近整数；$\mathrm{clamp}(a;q_{min},q_{max})$：把 $a$ 截断到 $[q_{min},q_{max}]$；
- $s=S$、$z=Z$，两篇论文记号不同；无符号 $b$ 位时 $q_{min}=0,\ q_{max}=2^b-1$；
- $\hat x$：反量化得到的近似值，$\hat x$ 与 $x$ 的差就是量化误差。

### 3.2 如何确定 $S$ 和 $Z$

给定数据范围 $[\alpha,\beta]$（$\alpha$ 为最小值、$\beta$ 为最大值）和位宽 $b$（无符号网格）：

$$
s=\frac{\beta-\alpha}{2^{b}-1},\qquad z=\Big\lfloor-\frac{\alpha}{s}\Big\rceil
$$

其中：$s$ 是网格的步长；$z$ 使得 $x=0$ 恰好落在整数网格上（需要 $\alpha\le0\le\beta$，范围会被"推"到包含 0，Jacob 论文称为 nudge）。

### 3.3 数值例子

取数据范围 $[-1,\,3]$，uint8 非对称量化：$s=4/255\approx0.01569$，$z=\lfloor 1/s\rceil=64$。

| 实数 $x$ | 量化 $x_{int}$ | 反量化 $\hat x$ | 误差 | 说明 |
|---|---|---|---|---|
| 0 | 64 | 0 | 0 | 零点：0 被精确表示 |
| 0.5 | 96 | 0.50196 | +0.00196 | 舍入误差，不超过 $s/2\approx0.00784$ |
| 3.5 | 255（原本 287，被截断） | 2.996 | −0.504 | 超出范围，发生截断误差 |

表中：

- 第一列是原始实数，第二列是量化后的整数（含截断），第三列是反量化回实数的结果，第四列是误差，第五列说明误差来源；
- 范围之内的值只有**舍入误差**，其绝对值不超过 $s/2$；范围之外的值被截断到边界，出现**截断误差**，误差可以很大。

### 3.4 舍入误差与截断误差的权衡

量化网格的范围是 $q_{min}$ 对应 $-sz$、$q_{max}$ 对应 $s(2^b-1-z)$。两种误差此消彼长：

- 想减少截断误差，就扩大范围、增大 $s$；
- 但 $s$ 增大会使舍入误差（范围 $[-\tfrac12s,\tfrac12s]$）变大；
- 如何选 $[\alpha,\beta]$ 是量化的核心问题之一，见 [校准](/0701_MO_Quantization_Calibration)。

## 4. 对称量化与非对称量化

**对称量化**把零点限制为 0：

$$
x_{int}=\mathrm{clamp}\!\Big(\Big\lfloor\frac{x}{s}\Big\rceil;\,-2^{b-1},\,2^{b-1}-1\Big)\ \ (\text{有符号}),\qquad
s=\frac{2\max|x|}{2^b-1}
$$

其中：有符号对称量化适合大致以 0 为中心的分布（如权重）；无符号对称（$[0,2^b-1]$）适合单边分布（如 ReLU 的输出）；$s$ 由绝对值最大值决定，数据对称地落在 0 的两侧，整数网格因此也关于 0 对称。

两者的计算开销差异来自零点。设权重是非对称的 $W=s_w(W_{int}-z_w)$，激活是非对称的 $x=s_x(x_{int}-z_x)$，则：

$$
Wx=s_ws_x\,W_{int}x_{int}-s_ws_xz_w\,x_{int}-s_ws_xz_x\,W_{int}+s_ws_xz_wz_x
$$

其中：

- 第一项就是两者都对称时得到的整数矩阵乘；
- 第三、四项只依赖权重和零点，**可以离线预先算好并并入偏置**，几乎没有开销；
- 第二项 $s_ws_xz_wx_{int}$ **依赖输入数据**，推理时每个 batch 都要额外计算；
- 因此常见做法是：**权重用对称、激活用非对称**，避免出现数据相关的额外项。

| 方案 | 零点 | 表达能力 | 计算开销 | 常见用途 |
|---|---|---|---|---|
| 非对称（仿射） | 有 $z\ne0$ | 更强（多一个偏移参数） | 零点展开带来额外项 | 激活 |
| 对称 | $z=0$ | 受限（范围必须关于 0 对称） | 最小 | 权重 |

表中：第一列是方案，第二列是零点，第三列是表达能力，第四列是计算开销，第五列是常见的使用位置；对称量化用 $z=0$ 换取了更低的计算开销，因此常用于权重，而激活（如 ReLU 之后分布偏向一侧）常用非对称。

## 5. 量化粒度

量化参数（$S$、$Z$）在多大范围内共享，称为量化粒度。**逐张量（per-tensor）**整个 tensor 共用一组参数，所有定点加速器都支持；**逐通道（per-channel）**每个输出通道一组参数，当不同通道的权重范围差异很大时能明显提升精度（Qualcomm 白皮书：权重的逐通道量化可以改善精度）。组粒度的做法见 [LLM 权重量化](/0706_MO_Quantization_LLM_Weight)。

## 6. 整数推理的算术

### 6.1 整数矩阵乘与乘子 $M$

设两个矩阵 $r_1,r_2$ 相乘得到 $r_3=r_1r_2$，三者的量化参数分别为 $(S_1,Z_1)$、$(S_2,Z_2)$、$(S_3,Z_3)$。把 $r=S(q-Z)$ 代入矩阵乘法：

$$
q_3^{(i,k)}=Z_3+M\sum_{j=1}^{N}\big(q_1^{(i,j)}-Z_1\big)\big(q_2^{(j,k)}-Z_2\big),\qquad M=\frac{S_1S_2}{S_3}
$$

其中：

- $q^{(i,j)}$：矩阵第 $i$ 行第 $j$ 列的量化值，$N$ 为内积维度；
- $M$：唯一的非整数，**只依赖三个缩放因子，可以离线算好**；Jacob 论文发现它总是落在 $(0,1)$ 内，可以写成归一化形式 $M=2^{-n}M_0$（$M_0\in[0.5,1)$，$n$ 为非负整数）；
- $M_0$ 用定点数表示（如 int32 时取 $\lfloor2^{31}M_0\rceil$，由于 $M_0\ge0.5$，至少有 30 位相对精度），乘 $M_0$ 就是一次定点乘法，乘 $2^{-n}$ 就是带"四舍五入"的位移——于是推理全程不需要浮点。

### 6.2 零点的高效处理

直接计算 $(q_1-Z_1)(q_2-Z_2)$ 需要 $2N^3$ 次减法并把操作数扩成 16 位。把乘法展开：

$$
q_3^{(i,k)}=Z_3+M\Big(NZ_1Z_2-Z_1\,a_2^{(k)}-Z_2\,\bar a_1^{(i)}+\sum_{j=1}^{N}q_1^{(i,j)}q_2^{(j,k)}\Big),\quad
a_2^{(k)}=\sum_{j}q_2^{(j,k)},\ \bar a_1^{(i)}=\sum_{j}q_1^{(i,j)}
$$

其中：$a_2^{(k)}$、$\bar a_1^{(i)}$ 分别是 $q_2$ 的列和与 $q_1$ 的行和，各只需 $N$ 次加法，总共 $2N^2$ 次；其余开销几乎全部集中在核心的整数乘加 $\sum q_1q_2$（$2N^3$ 次运算）上，所以任意零点只带来 $O(N^2)$ 的低开销。

### 6.3 一个典型融合层的数据类型

下图是融合了偏置加法和激活函数的量化层的数据流（以 uint8 权重/激活为例）。

```
权重 q_w (uint8) ─┐
                  ├─ 整数乘加 ─► int32 累加器 ─ + 偏置(int32) ─► ×M（定点乘 + 位移） ─► + Z_out ─► 饱和截断 uint8 ─► clamp(ReLU 等)
激活 q_x (uint8) ─┘
```

图中：

- 乘加 `int32 += uint8 * uint8`：累加器必须是 32 位，否则大量乘积累加会溢出；
- **偏置**量化为 int32，零点为 0，缩放因子等于累加器的缩放因子，即 $S_{bias}=S_wS_x$——这样偏置可以直接加进 int32 累加器；偏置虽是 32 位，但只占参数的极小部分，而且偏置的量化误差会作为整体偏差（均值非零的误差）出现在许多输出上，必须避免；
- 累加结果乘以乘子 $M$（定点乘法 + 位移）得到输出尺度，再加零点、饱和截断到 $[0,255]$ 回到 uint8；这一步称为**重新量化（requantize）**；
- 只做截断的激活函数（ReLU、ReLU6）直接融合为进一步 clamp 到某个子区间；数学函数（如 sigmoid）不融合。

### 6.4 BN 折叠

推理时批归一化（BN）会"折叠"进前一个卷积/全连接层的权重与偏置，以提高效率。折叠后的权重为：

$$
w_{fold}=\frac{\gamma\,w}{\sqrt{\mathrm{EMA}(\sigma_B^2)+\varepsilon}}
$$

其中：

- $\gamma$：BN 的缩放参数；$\mathrm{EMA}(\sigma_B^2)$：卷积结果在 batch 上方差的滑动平均估计；$\varepsilon$：数值稳定的小常数；
- 折叠后的偏置同理合并（偏置折叠式见 [OpenVINO BN 折叠](0564_Tools_OV_MO_BNFolding)）；
- 量化应该**在折叠之后**对 $w_{fold}$ 做；训练时要模拟这一折叠（见 [量化感知训练](/0703_MO_Quantization_QAT)）。折叠后每个输出通道的权重范围由 $\gamma/\sigma$ 决定，通道间差异可能变大，这也是逐通道量化更有利的原因之一 `[解读]`。

## 7. 汇总

| 概念 | 要点 |
|---|---|
| 仿射量化 | $r=S(q-Z)$；$Z$ 保证 0 精确可表示 |
| 对称/非对称 | 对称 $Z=0$，开销最小；非对称表达更强，激活常用 |
| 粒度 | per-tensor（最粗、普遍支持）→ per-channel（权重常用）→ per-group（LLM 常用） |
| 误差 | 舍入误差 $\le s/2$；超出范围产生截断误差；二者随 $s$ 反向变化 |
| 整数算术 | $M=S_1S_2/S_3=2^{-n}M_0$ 定点实现；int32 累加；requantize 回 8 位 |
| 偏置 | int32、$Z=0$、$S_{bias}=S_wS_x$ |
| BN | 折叠后再量化 |

表中：第一列是概念，第二列是要点；它们合在一起构成量化的"基础设施"，后续的校准、PTQ、QAT、LLM 量化都是在这套机制上选取 $S$、$Z$ 的不同方法。

## 8. 总结 [解读]

- 量化的关键是**让整数运算与真实数的运算保持一致**：缩放与零点只能在运算前后处理，核心的乘加完全用整数；
- 工程上默认的组合是"权重对称（逐通道）+ 激活非对称（逐张量）"，兼顾精度与速度（Qualcomm 白皮书的建议）；
- 选择量化范围、取整方式、如何训练以适应误差，是后续几篇的主题。

## Reference

- Jacob B, Kligys S, Chen B, Zhu M, Tang M, Howard A, Adam H, Kalenichenko D. Quantization and Training of Neural Networks for Efficient Integer-Arithmetic-Only Inference. CVPR 2018. arXiv:1712.05877
- Nagel M, Amjad R A, van Baalen M 等. A White Paper on Neural Network Quantization. arXiv:2106.08295
- Wu H, Judd P, Zhang X, Isaev M, Micikevicius P. Integer Quantization for Deep Learning Inference: Principles and Empirical Evaluation. arXiv:2004.09602

