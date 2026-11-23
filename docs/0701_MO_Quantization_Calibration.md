---
Title | MO Quantization Calibration
-- | --
Created @ | `2026-11-23T02:07:17Z`
Updated @| `2026-11-23T02:43:16Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/701)

---
# 量化校准（Calibration）

校准（Calibration）回答量化里最基础的一个问题：**量化范围 $[\alpha,\beta]$（或截断阈值）该取多大**。范围太大，量化步长 $s$ 大，舍入误差大；范围太小，大值被截断，截断误差大。权重在训练后就是固定的，范围通常可直接取最大/最小值；激活依赖输入，需要用少量**校准数据**统计它们的分布。本文汇总几种常用的校准方法：min-max、百分位、MSE、KL 熵（TensorRT 默认）、交叉熵（用于最后一层 logits）、基于 BN 统计量，以及 ACIQ（*Post training 4-bit quantization of convolution networks for rapid-deployment*，Banner 等，NeurIPS 2019，arXiv:1810.05723）给出的解析最优截断值。主要依据：Qualcomm 的 *A White Paper on Neural Network Quantization*（arXiv:2106.08295）、NVIDIA 的 *Integer Quantization for Deep Learning Inference*（arXiv:2004.09602）和 ACIQ 论文。

**一句话概括：校准就是在截断误差与舍入误差之间找平衡点——min-max 不截断、对离群值敏感；百分位/KL/MSE/ACIQ 都是主动截断一部分大值来换取更小的步长；各有适用场景，没有一种方法在所有网络上都最好。**

> 标注约定：未标注的内容来自上述论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容（如 TensorRT KL 校准的实现细节未读到原始文档）。

本站相关：总览 [量化](0312_MO_Quantization)；量化基础与误差 [基础原理](/0699_MO_Quantization_Basics)；校准用于 [训练后量化 PTQ](/0702_MO_Quantization_PTQ)；系列中的 [量化历史](/0688_MO_Quantization_History)。

## 1. 解决什么问题

- 量化网格由 $[q_{min},q_{max}]$ 对应的实数区间决定，区间之外的值会被**截断**，区间之内的值有**舍入**误差（$\le s/2$）；
- 权重可以不需要校准数据；激活的范围依赖输入，**通常需要几批校准数据**（Qualcomm 白皮书；其 PTQ 流程中一般 500～1000 张无标签图像就足够）；
- 目标不是简单地让量化后的数值误差最小，而是让**任务损失**最小；各方法优化的都是局部代价函数的代理。

## 2. 符号约定

- $V$：要量化的张量（权重或激活）；$[q_{min},q_{max}]$：量化范围（截断阈值）；
- $\hat V(q_{min},q_{max})$：用该范围量化再反量化后的张量；
- $b$ 或 $M$：位宽；$\alpha$：截断阈值（ACIQ 记为 $\alpha$）。

## 3. 几种校准方法

### 3.1 Min-max

覆盖张量的整个动态范围：

$$
q_{min}=\min V,\qquad q_{max}=\max V
$$

其中：$V$ 是被量化的张量；不会产生截断误差，但**对离群值敏感**——极端的大值会使步长 $s$ 变大、造成过大的舍入误差。NVIDIA 论文里的 **Max** 校准同理：取校准期间看到的绝对值最大值（对称量化）；权重用逐通道 max 校准即可在 int8 下保持精度。

### 3.2 百分位（Percentile）

把范围设为校准期间绝对值分布的某个百分位。例如 99% 校准会截断最大的 1% 值。

NVIDIA 论文在多种网络上比较了 99.9%、99.99%、99.999%、99.9999% 等百分位：99.9% 截断过于激进，在大多数网络上精度显著下降；较好的结果来自熵（KL）、99.99% 或 99.999% 百分位，但**没有哪一种校准方法在所有网络上都最好**。

### 3.3 MSE

最小化原张量与量化后张量的均方误差：

$$
(q_{min},q_{max})=\arg\min_{q_{min},q_{max}}\big\|V-\hat V(q_{min},q_{max})\big\|_F^2
$$

其中：$\|\cdot\|_F$ 是 Frobenius 范数；常用网格搜索、黄金分割搜索或解析近似（如下面的 ACIQ）求解。Qualcomm 白皮书的比较：高位宽下 MSE 与 min-max 差不多；低位宽下 MSE 明显优于 min-max。

### 3.4 KL 熵校准（TensorRT 默认）

NVIDIA 论文把 **Entropy** 定义为：用 KL 散度使原浮点值与量化格式所能表示的值之间的信息损失最小，这是 TensorRT 的默认方法。常见的实现思路是 `[待核实：未读到 TensorRT 原始文档，以下为一般描述]`：

1. 在校准数据上统计激活绝对值的直方图（如 2048 个桶）；
2. 对每个候选阈值 $T$：把超过 $T$ 的桶合并到最后一个桶得到参考分布 $P$；把 $[0,T]$ 内的桶压缩到量化级别数（如 int8 为 128 档）再展开得到 $Q$；
3. 取使 $\mathrm{KL}(P\|Q)$ 最小的 $T$ 作为截断阈值。

$$
T^{*}=\arg\min_{T}\ \mathrm{KL}\big(P_T\,\|\,Q_T\big)=\arg\min_T\sum_i P_T(i)\log\frac{P_T(i)}{Q_T(i)}
$$

其中：$P_T$ 是带截断的参考分布，$Q_T$ 是量化后的近似分布，$i$ 遍历直方图的桶；这一方法用"分布形状的相似度"代替直接的数值误差。

### 3.5 交叉熵（用于最后一层）

最后一层 logits 的量化需要**保持最大值的排序**，MSE 把所有值同等对待，不太合适（尤其类别数多、大量小值的情况）。此时用 softmax 后的交叉熵：

$$
\arg\min_{q_{min},q_{max}}\ H\big(\psi(v),\ \psi(\hat v(q_{min},q_{max}))\big)
$$

其中：$H(\cdot,\cdot)$ 是交叉熵，$\psi$ 是 softmax，$v$ 是 logits 向量，$\hat v$ 是量化后的 logits。Qualcomm 白皮书发现：对其他层用 MSE、最后一层用交叉熵（MSE + Xent）的组合，尤其在低位宽下优于其他方法。

### 3.6 基于 BN 统计量

若某层的激活是经过批归一化的，则其逐通道均值与标准差等于 BN 学到的平移与缩放参数 $\beta$、$\gamma$，无需校准数据即可定出范围：

$$
q_{min}=\min_c\,(\beta_c-n\,\gamma_c),\qquad q_{max}=\max_c\,(\beta_c+n\,\gamma_c)
$$

其中：$\beta$、$\gamma$ 是逐通道的 BN 平移与缩放参数，$c$ 为通道下标，$n>0$ 控制保留的标准差倍数；Nagel 等人（2019）取 $n=6$，使得只有很大的离群值被截断（原文公式形式以论文为准 `[待核实]`）。

### 3.7 ACIQ：解析最优截断

ACIQ（Analytical Clipping for Integer Quantization）假设激活服从 Laplace 或 Gaussian 分布，直接推出让均方误差最小的截断值，**不需要搜索**。设张量 $X$ 的概率密度为 $f$，截断值为 $\alpha$，$[-\alpha,\alpha]$ 被均分成 $2^M$ 个量化区间，步长 $\Delta=\dfrac{2\alpha}{2^M}$，每个区间的值被取整到区间中点 $q_i=-\alpha+(2i+1)\dfrac{\Delta}{2}$。期望均方误差由三部分组成：

$$
\mathbb E\big[(X-Q(X))^2\big]=\underbrace{\int_{-\infty}^{-\alpha}f(x)(x+\alpha)^2dx+\int_{\alpha}^{\infty}f(x)(x-\alpha)^2dx}_{\text{截断噪声}}+\underbrace{\sum_{i=0}^{2^M-1}\int_{-\alpha+i\Delta}^{-\alpha+(i+1)\Delta}f(x)(x-q_i)^2dx}_{\text{量化（舍入）噪声}}
$$

其中：

- $M$：位宽；$f$：激活的密度函数；$\alpha$：截断值；
- 第一、二项是**截断噪声**（超出 $[-\alpha,\alpha]$ 的值被截断到 $\pm\alpha$ 产生的误差），对关于 0 对称的分布两项相等；第三项是**舍入噪声**，论文用分段线性近似密度函数，近似为 $\frac{\Delta^2}{12}$ 量级的项；
- 对 Laplace$(0,b)$ 分布，论文得到近似的闭式表达（论文式 5）：

$$
\mathbb E\big[(X-Q(X))^2\big]\approx2b^2e^{-\alpha/b}+\frac{\alpha^2}{3\cdot2^{2M}}
$$

其中 $b$ 是 Laplace 分布的尺度参数；令对 $\alpha$ 的导数为零，$\frac{2\alpha}{3\cdot2^{2M}}-2be^{-\alpha/b}=0$（论文式 6），数值求解得到最优截断值：

| 位宽 $M$ | 最优截断值 $\alpha^{*}$（Laplace） |
|---|---|
| 2 | $2.83\,b$ |
| 3 | $3.89\,b$ |
| 4 | $5.03\,b$ |

表中：

- 第一列是位宽，第二列是 Laplace 分布下的最优截断值，以尺度参数 $b$ 的倍数表示；位宽越高，最优截断值越大（越少截断，因为舍入误差已很小）；
- 实际使用：估计 $b=\mathbb E|X-\mathbb E[X]|$，再乘上对应常数（如 4 位乘 5.03）作为截断值；高斯分布的情形论文附录给出类似的推导；
- 论文还提出两项配套技术：**逐通道比特分配**（在平均位宽约束下，最优量化步长与各通道范围的 $2/3$ 次幂成正比）与**偏置校正**（修正量化后权重的均值与方差偏差）。论文的 ACIQ 面向"快速部署"的训练后 4 位量化。

## 4. 方法对比

| 方法 | 是否截断 | 需要校准数据 | 优化目标 | 适用 / 注意 |
|---|---|---|---|---|
| Min-max | 否 | 激活需要 | 覆盖全部范围 | 权重常够用；对离群值敏感 |
| 百分位 | 是（按比例） | 需要 | 去掉最大的若干比例 | 比例要调；99.9% 往往过激进 |
| MSE | 是 | 需要 | 数值误差最小 | 低位宽下明显优于 min-max |
| KL 熵 | 是 | 需要 | 分布信息损失最小 | TensorRT 默认；实现需要直方图 |
| 交叉熵 | 是 | 需要 | softmax 输出一致 | 适合最后一层 logits |
| BN 统计 | 是（$n$ 个标准差） | 不需要 | 由 BN 参数定出范围 | 要求有 BN 的层 |
| ACIQ | 是（解析值） | 只需估计分布参数 | 假设分布下 MSE 最小 | 依赖 Laplace/Gaussian 假设 |

表中：

- 第一列是方法，第二列是是否截断大值，第三列是是否依赖校准数据，第四列是优化目标，第五列是适用场景与注意点；
- 实际工程上，常按网络类型试几种方法并挑选（NVIDIA 的推荐流程是先对 max、entropy、几个百分位做统一校准、评估后选最优，达不到精度再做逐层敏感度分析、跳过最敏感的层，见 [训练后量化 PTQ](/0702_MO_Quantization_PTQ)）；
- 权重一般用 max 校准 + 逐通道即可（NVIDIA 的实验）；激活才是校准方法的主战场。

下图以激活直方图示意不同截断阈值的位置：

```
频数
 │█
 │██
 │████
 │███████▃▂▁                          ▁   ← 稀疏的长尾（离群值）
 └────────────────────────────────────────► 激活值
      ↑          ↑           ↑        ↑
  MSE/KL 阈值  99.99% 百分位   99.9999%   max（min-max）
```

图中：

- 横轴是激活值，纵轴是频数；大多数值集中在左侧，少量离群值构成长尾（对应论文 ResNet50 某层激活直方图，以对数刻度显示）；
- 各竖线标记不同校准方法给出的上限：min-max（max）取到最右端，不截断但步长最大；百分位与 MSE/KL 的阈值更靠左，截断一小部分离群值，换取更小的步长；
- 这些位置只是示意（不代表真实数值）；真实位置随网络与数据变化，NVIDIA 的图 2 展示了 max、entropy、99.99% 的阈值差异。

## 5. 总结 [解读]

- 校准的本质是 clipping 与 rounding 的折中；低位宽（4 bit 及以下）时必须主动截断，高位宽（8 bit）时 max 往往也能工作；
- 实践上：权重 max（逐通道）、激活试 entropy / 99.99% / MSE，最后一层 logits 单独处理，并检查最敏感的层；
- 当校准无法达到精度要求时，转向更强的 PTQ 方法（如 AdaRound、BRECQ，见 [训练后量化](/0702_MO_Quantization_PTQ)）或量化感知训练（见 [QAT](/0703_MO_Quantization_QAT)）。

## Reference

- Banner R, Nahshan Y, Soudry D. Post training 4-bit quantization of convolutional networks for rapid-deployment. NeurIPS 2019. arXiv:1810.05723
- Nagel M, Amjad R A, van Baalen M 等. A White Paper on Neural Network Quantization. arXiv:2106.08295
- Wu H, Judd P, Zhang X, Isaev M, Micikevicius P. Integer Quantization for Deep Learning Inference: Principles and Empirical Evaluation. arXiv:2004.09602
- Nagel M 等. Data-Free Quantization Through Weight Equalization and Bias Correction. ICCV 2019. arXiv:1906.04721
- Migacz S. 8-bit Inference with TensorRT. GTC 2017. `[未核对原文]`


