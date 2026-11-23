---
Title | MO Quantization MixedPrecision
-- | --
Created @ | `2026-11-23T02:15:36Z`
Updated @| `2026-11-23T02:43:32Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/705)

---
# 混合精度量化

混合精度量化让**不同层使用不同的位宽**：对量化敏感的层保留较高精度，不敏感的层用更低精度，在相同的模型大小/延迟预算下获得比"全网统一位宽"更好的精度。难点是搜索空间：$L$ 层网络、每层有 $k$ 种位宽，就有 $k^L$ 种配置。本文覆盖两条解决思路：**用 Hessian 的二阶信息度量敏感度**（HAWQ：*HAWQ: Hessian AWare Quantization of Neural Networks with Mixed-Precision*，ICCV 2019，arXiv:1905.03696；HAWQ-V2：*HAWQ-V2: Hessian Aware trace-Weighted Quantization of Neural Networks*，arXiv:1911.03852），以及**用强化学习结合硬件反馈自动搜索**（HAQ：*HAQ: Hardware-Aware Automated Quantization with Mixed Precision*，CVPR 2019，arXiv:1811.08886）。

**一句话概括：HAWQ 用每个块损失曲面的 Hessian 谱（最大特征值，V2 改为平均迹）判断敏感度，越敏感给越多位；HAQ 用 DDPG 强化学习智能体逐层决定位宽，并把目标硬件的真实延迟/能耗当作约束，而不是 FLOPs 这类代理指标。**

> 标注约定：未标注的内容来自上述论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：总览 [量化](0312_MO_Quantization)；基础 [基础原理](/0699_MO_Quantization_Basics)；校准 [校准](/0701_MO_Quantization_Calibration)；量化感知训练 [QAT](/0703_MO_Quantization_QAT)；LLM 中的混合精度/离群值处理 [LLM 权重量化](/0706_MO_Quantization_LLM_Weight)；系列中的 [量化历史](/0688_MO_Quantization_History)。

## 1. 解决什么问题

- 把整个网络统一量化到超低位宽（如 2~3 bit）会显著掉点；但网络的各部分对量化的敏感程度差别很大——HAWQ 论文的 Figure 1 显示，ResNet20 与 Inception-V3 各块的 Hessian 最大特征值相差数个数量级；
- 混合精度（MP）可以改善精度，但搜索空间随层数指数增长，且现有方法常依赖手工规则，难以泛化；
- 硬件已开始支持 1~8 bit 的混合精度运算，需要为每一层找到合适的位宽，它要在精度、延迟、能耗、模型大小之间权衡，靠专家手工探索费时且往往不是最优；
- 不同硬件上最优策略也不同（HAQ 论文的 Table 1：为一种硬件优化的量化策略在另一种硬件上不是最优），而常用的 FLOPs、访存次数等代理信号无法刻画缓存局部性、内核调用次数、带宽等硬件特性。

## 2. 符号约定

- $b$ 或 $L$：网络被划分成的块/层的个数；$B_i$：第 $i$ 个块；$W_i\in\mathbb R^{n_i}$：该块的权重，$n_i$ 为其参数个数；
- $H_i$：损失 $\mathcal L$ 关于 $W_i$ 的 Hessian 矩阵；$\lambda_i$：$H_i$ 的最大特征值；$\mathrm{Tr}(H_i)$：$H_i$ 的迹；
- $Q(W_i)$：量化后的权重；$b_k$：第 $k$ 层的位宽。

## 3. HAWQ：用 Hessian 最大特征值衡量敏感度

### 3.1 为什么用二阶信息

衡量"量化对损失的影响"，一阶梯度可能严重误导：以一维抛物线 $y=\tfrac12ax^2$ 为例，在原点处梯度恒为 0，无论 $a$ 多大——但曲率 $a$ 越大，对扰动越敏感。因此应当使用二阶信息（Hessian）：Hessian 谱大，说明损失在该方向上"尖锐"，量化噪声会造成更大的损失增长；Hessian 谱小，则损失面平坦、能容忍低位宽（HAWQ 引用最小描述长度理论：平坦区域用更少的位即可描述）。

直观图示（论文 Figure 2）：沿每个块的 Hessian 最大特征向量方向扰动权重，画出一维损失曲线，各块的曲线陡峭程度差别很大。

### 3.2 计算与使用

Hessian 的规模太大，无法显式构造，但可以用 **幂迭代（power iteration）** 只通过 Hessian-向量乘积求最大特征值。对随机向量 $v$（与 $g_i$ 同维度，且与 $W_i$ 独立）：

$$
\frac{\partial(g_i^{\top}v)}{\partial W_i}=\frac{\partial g_i^{\top}}{\partial W_i}v+g_i^{\top}\frac{\partial v}{\partial W_i}=H_iv,\qquad g_i=\frac{\partial\mathcal L}{\partial W_i}
$$

其中：$g_i$ 是损失对 $W_i$ 的梯度；因为 $v$ 与 $W_i$ 无关，第二项为 0，于是只需对"梯度与 $v$ 的内积"再求一次梯度就得到 $H_iv$，不用显式算 Hessian；反复迭代（论文 Algorithm 1）可得到 $\lambda_i$。

HAWQ 的两个用法：

1. **相对位宽**：确定性地根据各块的 $\lambda_i$ 排序，$\lambda_i$ 越大的块用越多位、越小的块用越少位，把指数级的搜索空间约束成"满足敏感度顺序"的子集；
2. **微调顺序**（多阶段量化）：定义

$$
\Omega_i=\lambda_i\,\big\|Q(W_i)-W_i\big\|_2^2
$$

其中：$\|Q(W_i)-W_i\|_2^2$ 是该块量化引入的扰动大小，$\lambda_i$ 是曲率，二者的乘积近似该块对损失的影响；算法按 $\Omega_i$ **降序**逐块做量化感知微调，即先量化并微调对损失影响大的块。

论文在 CIFAR-10 的 ResNet20，以及 ImageNet 上的 Inception-V3、ResNet50、SqueezeNext 上验证，相比当时最先进的方法，精度最多提高约 1%，模型最多小约 20%，激活最多小 8 倍。

## 4. HAWQ-V2：平均迹与自动位宽选择

HAWQ 有三个不足：仅用最大特征值不够准确；只给出相对顺序而没有具体位宽；只处理权重。HAWQ-V2 做了三点改进：

1. **理论上更好的敏感度指标是平均 Hessian 迹**。论文的 Lemma 1：若对两层施加相同大小的扰动，则平均迹小的那一层带来的损失更小，即 $\frac1{n_1}\mathrm{Tr}(\nabla^2_{W_1}\mathcal L)\le\frac1{n_2}\mathrm{Tr}(\nabla^2_{W_2}\mathcal L)$ 对应 $\mathcal L(W_1+\Delta W_1,\dots)\le\mathcal L(W_1,W_2+\Delta W_2,\dots)$（在论文假设下）；
2. **快速计算 Hessian 迹**：用 Hutchinson 算法（随机向量估计迹）在 PyTorch 里实现；论文称对 ResNet50 全部 54 层，在 4 块 GPU 上约 30 分钟完成；
3. **用 Pareto 前沿自动选择位宽**：在满足相对敏感度约束的候选位宽设置集合 $\mathcal B$ 中，按这个二阶扰动总量排序：

$$
\Omega=\sum_{i=1}^{L}\frac{\mathrm{Tr}(H_i)}{n_i}\,\big\|Q(W_i)-W_i\big\|_2^2
$$

其中：$\mathrm{Tr}(H_i)/n_i$ 是第 $i$ 层的平均 Hessian 迹，$n_i$ 是其参数个数，$\|Q(W_i)-W_i\|_2^2$ 是量化扰动；$\Omega$ 越小代表总的二阶扰动越小（公式的具体形式依据论文式 2.11 的结构整理，以原文为准 `[待核实]`）；把每个候选设置按 $\Omega$ 与模型大小画成 Pareto 前沿，然后在前沿上选出满足模型大小（或延迟）约束的最优点——这样不需要昂贵的搜索。

此外，HAWQ-V2 把方法**扩展到激活的混合精度**（给出一种快速计算对激活的 Hessian 信息的方法），并用于目标检测（论文报告在其检测实验里，混合精度激活能把检测模型的 mAP 提升到 34.4，并且模型大小更小、mAP 高于当时的 FQN 方法）。

## 5. HAQ：硬件感知的强化学习搜索

### 5.1 框架

HAQ 把量化任务建模成强化学习问题（论文 Figure 2）：用 actor-critic 的 **DDPG** 智能体逐层决定位宽，目标硬件（边缘/云端、空间/时间架构的混合精度加速器）的**硬件反馈**作为资源约束，精度作为奖励。

```
        ┌─ 智能体 DDPG（Actor 输出动作，Critic 评估）
状态 O_k ─►│     动作 a_k ∈ [0,1] → 位宽 b_k
        └─────────────┬────────────
                      ▼
  量化该层（权重一步、激活一步）→ 全部层决策完毕后：
     ① 向硬件查询延迟/能耗/大小：超预算则按顺序降低位宽（动作空间受限）
     ② 量化后再训练 1 个 epoch → 得到精度 acc_quant
                      ▼
  奖励 R = λ·(acc_quant − acc_origin)，更新 Actor/Critic
```

图中：

- 智能体逐层处理网络，对每层分两步：先决定权重位宽，再决定激活位宽；
- 状态 $O_k$ 是 10 维特征向量；动作是 $[0,1]$ 上的连续值，取整得到离散位宽；
- 资源约束通过限制动作空间实现：若一条策略超出延迟、能耗或模型大小预算，就依次降低位宽直到满足；
- 奖励只与精度有关（资源约束已体现在动作空间里）。

### 5.2 状态、动作、奖励

对卷积层，状态 $O_k$ 为：

$$
O_k=(k,\,c_{in},\,c_{out},\,s_{kernel},\,s_{stride},\,s_{feat},\,n_{params},\,i_{dw},\,i_{w/a},\,a_{k-1})
$$

其中：$k$ 是层号；$c_{in}$、$c_{out}$ 是输入、输出通道数；$s_{kernel}$、$s_{stride}$ 是核大小与步长；$s_{feat}$ 是输入特征图大小；$n_{params}$ 是参数量；$i_{dw}$ 指示是否是深度可分离卷积；$i_{w/a}$ 指示当前是为权重还是为激活决策；$a_{k-1}$ 是上一步的动作；各维度被归一化到 $[0,1]$。全连接层的状态类似，用隐藏单元数代替通道数。

**动作**取连续值 $a_k\in[0,1]$，用下式取整成位宽：

$$
b_k=\mathrm{round}\big(b_{min}-0.5+a_k\cdot(b_{max}-b_{min}+1)\big)
$$

其中：$b_{min}$、$b_{max}$ 是最小、最大位宽（论文取 2 与 8）；不用离散动作是因为会丢失"2 bit 比 4 bit 更激进、比 8 bit 更激进"的相对顺序信息。

**奖励**为：

$$
R=\lambda\cdot\big(acc_{quant}-acc_{origin}\big)
$$

其中：$acc_{origin}$ 是全精度模型在训练集上的 top-1 精度，$acc_{quant}$ 是量化后再训练一个 epoch 的精度，$\lambda$ 是缩放因子（论文取 0.1）。DDPG 的目标值为 $\hat Q_k=R_k-B+\gamma\,Q(O_{k+1},w(O_{k+1}))$（$B$ 是历史奖励的滑动平均基线，用来降低梯度方差；折扣因子 $\gamma=1$），损失为 $(\hat Q_k-Q(O_k,a_k))^2$ 的均值；Actor 与 Critic 都是全连接网络（隐藏层大小 400、300）。

### 5.3 量化与硬件反馈

线性量化每层的权重与激活：权重先截断到 $[-c,c]$，再线性量化到 $a_k$ 位：

$$
\mathrm{quantize}(w,a_k,c)=\mathrm{round}\Big(\frac{\mathrm{clamp}(w,c)}{s}\Big)\cdot s,\qquad s=\frac{c}{2^{a_k-1}-1},\qquad c=\arg\min_x D_{KL}\big(W_k\,\|\,\mathrm{quantize}(W_k,a_k,x)\big)
$$

其中：$\mathrm{clamp}(\cdot,x)$ 把值截断到 $[-x,x]$；$s$ 是缩放因子；截断阈值 $c$ 取使原权重分布与量化后权重分布的 KL 散度最小的 $x$（与 [校准](/0701_MO_Quantization_Calibration) 里的 KL 校准同类）；激活截断到 $[0,c]$（因为是 ReLU 的非负输出）。

**硬件直接反馈**：不用 FLOPs 或模型大小做代理，而是从目标硬件加速器**直接获得延迟和能耗**作为资源约束。这样智能体能学到不同层之间的细微差别：例如普通卷积数据复用多、局部性好，深度卷积复用少、受访存限制，对位宽的响应不同。

## 6. 方法对比

| 方法 | 敏感度/决策依据 | 搜索方式 | 是否感知硬件 | 是否覆盖激活 |
|---|---|---|---|---|
| HAWQ | 各块 Hessian 最大特征值 $\lambda_i$ | 确定性排序（无搜索）；微调顺序按 $\Omega_i$ | 否 | 否（权重） |
| HAWQ-V2 | 平均 Hessian 迹 | Pareto 前沿自动选位宽 | 间接（用模型大小/延迟约束） | 是（扩展） |
| HAQ | 强化学习的奖励（精度）+ 硬件反馈约束 | DDPG 逐层搜索 | 是（直接用延迟、能耗反馈） | 是（权重、激活各一步） |

表中：

- 第一列是方法，第二列是衡量敏感度或做决策的依据，第三列是怎样搜索位宽，第四列是否感知硬件，第五列是否同时覆盖激活；
- HAWQ 系列是**基于二阶信息的分析式**方法，开销小、结果确定（不依赖随机初始化）；HAQ 是**基于数据驱动搜索**的方法，直接优化目标硬件上的指标，但搜索代价高、结果依赖搜索的初始化（HAWQ-V2 论文就是这样批评搜索类方法的）；
- 二者思路互补：前者回答"哪些层更敏感"，后者回答"在这块硬件上怎样分配位宽最划算"。

## 7. 总结 [解读]

- 混合精度的核心原则：**敏感层高位、不敏感层低位**；怎样度量"敏感度"是关键（梯度不可靠，曲率或硬件反馈更合适）；
- 工程上先用 Hessian 类的分析方法缩小范围，再在目标硬件上验证延迟；硬件是否支持逐层不同位宽也是前提；
- 在 LLM 里，混合精度的思想以"少数离群值/显著通道保留高精度"的形式出现（如 SpQR、AWQ，见 [LLM 权重量化](/0706_MO_Quantization_LLM_Weight)）。

## Reference

- Dong Z, Yao Z, Gholami A, Mahoney M W, Keutzer K. HAWQ: Hessian AWare Quantization of Neural Networks with Mixed-Precision. ICCV 2019. arXiv:1905.03696
- Dong Z, Yao Z, Cai Y, Arfeen D, Gholami A, Mahoney M W, Keutzer K. HAWQ-V2: Hessian Aware trace-Weighted Quantization of Neural Networks. NeurIPS 2020. arXiv:1911.03852 `[会议待核实]`
- Wang K, Liu Z, Lin Y, Lin J, Han S. HAQ: Hardware-Aware Automated Quantization with Mixed Precision. CVPR 2019. arXiv:1811.08886 `[第四、五作者待核实]`


