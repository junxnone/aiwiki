---
Title | ML Tasks TimeSeries Deep SCINet
-- | --
Created @ | `2026-11-20T09:06:43Z`
Updated @| `2026-11-20T09:06:43Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/674)

---
# SCINet

SCINet（Sample Convolution and Interaction Network）出自论文 *SCINet: Time Series Modeling and Forecasting with Sample Convolution and Interaction*（Minhao Liu、Ailing Zeng、Muxi Chen、Zhijian Xu、Qiuxia Lai、Lingna Ma、Qiang Xu，香港中文大学 CURE Lab，NeurIPS 2022，arXiv:2106.09305）。它是一个**卷积类**时间序列预测网络，设计动机来自时间序列的一个独特性质：**时间序列下采样成两个子序列（偶数位与奇数位）后，时间关系大部分被保留**。SCINet 因此采用递归的"下采样—卷积—交互"结构，在多个分辨率上提取并交换时间特征，用来替代 TCN 里的膨胀因果卷积。

**一句话概括：每个 SCI-Block 把序列按奇偶拆成两个子序列，用各自独立的卷积核提取特征，再通过"互相学习缩放与平移参数"的交互学习补偿下采样造成的信息损失；多个 SCI-Block 按二叉树层层嵌套，最后重排、残差相加、用全连接层解码出预测，可堆叠多个 SCINet 并做中间监督。**

> 标注约定：未标注的内容来自论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：被改进的 [TCN](/0626_ML_Tasks_TimeSeries_Deep_TCN)；同样走下采样思路的 [LightTS](/0667_ML_Tasks_TimeSeries_Deep_LightTS)、[N-HiTS](/0629_ML_Tasks_TimeSeries_Deep_NHiTS)；同属卷积路线的 [TimesNet](/0631_ML_Tasks_TimeSeries_Deep_TimesNet)；总览见 [深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)。

## 1. 解决什么问题

论文重新审视了时间序列预测中事实上的标准卷积——**膨胀因果卷积（DCC，如 TCN）**，指出两点：

1. **因果卷积并非预测所必需**：因果性只在"自回归预测"（上一步输出作为下一步输入）时才需要，用来避免未来信息泄漏。当预测完全基于回看窗口内已知的输入时，没有时间重叠，就不存在泄漏，普通卷积即可。论文的实验里，把 TCN 中的因果卷积换成普通卷积的变体在所有数据集上都优于原 TCN。
2. **TCN 膨胀结构有两个固有缺陷**：
   - 每层共享**单个**卷积核，倾向于提取"平均"的时间特征，难以刻画复杂时间序列里丰富的时间动态；
   - 只有最后一层对整个回看窗口有全局视野，靠近输入的中间层的有效感受野有限，特征提取时会丢失时间关系。

这两点促成了 SCINet 的设计。

## 2. 核心思想与结构

### 2.1 SCI-Block：拆分 + 交互学习

SCI-Block 是 SCINet 的基本模块，把输入特征 $F$ 分解为两个子特征，分两步：

**拆分（Splitting）**：把序列按偶数位与奇数位分成两个子序列 $F_{\mathrm{even}}$ 与 $F_{\mathrm{odd}}$。它们时间分辨率更粗，但保留了原序列的大部分信息。

**交互学习（Interactive learning）**：两个子序列分别用**不同**的卷积核提取特征；为补偿下采样造成的信息损失，再让二者通过互相学习的仿射变换参数交换信息。步骤如下：

$$
\begin{aligned}
F^{s}_{\mathrm{odd}}&=F_{\mathrm{odd}}\odot\exp\big(\phi(F_{\mathrm{even}})\big),&
F^{s}_{\mathrm{even}}&=F_{\mathrm{even}}\odot\exp\big(\psi(F_{\mathrm{odd}})\big)\\
F'_{\mathrm{odd}}&=F^{s}_{\mathrm{odd}}\pm\eta\big(F^{s}_{\mathrm{even}}\big),&
F'_{\mathrm{even}}&=F^{s}_{\mathrm{even}}\pm\rho\big(F^{s}_{\mathrm{odd}}\big)
\end{aligned}
$$

其中：

- $F_{\mathrm{even}},F_{\mathrm{odd}}$：偶数位与奇数位子序列特征；$\odot$：Hadamard 积（逐元素乘）
- $\phi,\psi,\eta,\rho$：四个一维卷积模块（带各自独立权重），把子特征投影到隐状态；$\exp$ 保证缩放因子为正
- 第一行是**缩放变换**：一个子序列的缩放因子由另一个子序列通过网络学得；第二行是在缩放后的特征上加（或减）由另一个子序列得到的偏移，得到更新后的子特征 $F'_{\mathrm{odd}},F'_{\mathrm{even}}$（论文中第二行运算符的选择影响参数初始化，附录 B.3 给出了影响分析）
- 与 TCN 的区别：TCN 每层共享单个卷积核，SCI-Block 汇集了来自两个下采样子序列（分别具有局部与全局视野）的特征，并且每个卷积层的感受野比 TCN 更大

### 2.2 SCINet：二叉树结构

把多个 SCI-Block 按层级排列成树状：第 $l$ 层有 $2^{l}$ 个 SCI-Block（$l=1,\dots,L$，$L$ 为总层数）。每个 SCI-Block 的两个输出子序列分别送入下一层的两个 SCI-Block，如此逐层递归，使特征在不同时间分辨率上被提取；浅层的信息逐步累积到深层，深层包含从浅层传来的更细尺度的信息，因此可以同时捕捉短期与长期依赖。

经过 $L$ 层后，把所有子特征按奇偶拆分的逆操作重新排列并拼接，成为新的序列表示，通过**残差连接**加回原始序列，得到可预测性增强的序列；最后用一个简单的全连接网络把它解码为预测 $\hat X^{k}=\{\hat x^{k}_{1},\dots,\hat x^{k}_{\tau}\}$。

下图概括一个 SCINet 的二叉树结构与奇偶拆分。

```
输入序列 F（长度 T）
   │ SCI-Block（层 1）
   ├─ 偶位子序列 ─► SCI-Block（层 2）─► 偶偶 / 偶奇 子序列 ─► ...
   └─ 奇位子序列 ─► SCI-Block（层 2）─► 奇偶 / 奇奇 子序列 ─► ...
   │   （每个 SCI-Block 内：拆分 → 不同卷积核 → 交互学习）
   ▼
 L 层之后：反向奇偶重排并拼接 ─ 残差相加（原序列）─ 全连接解码 ─► 预测
```

图中：

- 每个节点是一个 SCI-Block，它把输入序列按奇偶拆成两个子序列并做交互学习；两个输出分别送往下一层的两个 SCI-Block，形成二叉树，第 $l$ 层共 $2^{l}$ 个块。
- 层数越深，子序列越短、时间分辨率越粗；各层提取的特征在最后被重新拼回原来的时间顺序。
- 重排后的序列与原始序列做残差相加，再经全连接层解码得到预测。
- 关键结论：SCINet 通常不需要把序列下采样到最粗的程度（TCN 在膨胀系数为 2 时需要 $\log_2T$ 层，而 SCINet 的层数 $L$ 可以远小于它）。

### 2.3 堆叠 SCINet 与中间监督

训练样本足够时可以堆叠 $K$ 个 SCINet 获得更高精度，代价是模型更复杂。论文对每个 SCINet 的输出施加**中间监督**：第 $k$ 个 SCINet 的输出 $\hat X^{k}$（长度 $\tau$）与输入窗口的一部分拼接，恢复成原输入长度后送入第 $k+1$ 个 SCINet，最后一个 SCINet 的输出 $\hat X^{K}$ 即最终预测。

### 2.4 损失函数

第 $k$ 个 SCINet 的预测与真值之间用 L1 损失，总损失为各 SCINet 损失之和：

$$
\mathcal L=\sum_{k=1}^{K}\mathcal L_k,\qquad
\mathcal L_k=\frac1{\tau}\sum_{i=0}^{\tau}\big\lVert\hat x^{k}_{i}-x_i\big\rVert
$$

其中：$K$ 是堆叠的 SCINet 个数；$\mathcal L_k$ 是第 $k$ 个 SCINet 输出与真实预测窗口之间的 L1 损失；$\tau$ 是预测长度；$\hat x^{k}_i$ 与 $x_i$ 分别是第 $k$ 个 SCINet 的第 $i$ 步预测和真实值。（论文中的求和下标与归一化的具体写法以原文为准 `[待核实]`。）

### 2.5 复杂度

由于下采样，SCINet 每个卷积层的神经元感受野比 TCN 更大；论文称 SCINet 的计算开销通常与 TCN 相当，最坏情况下的时间复杂度为 $O(T\log T)$，远低于 vanilla Transformer 的 $O(T^2)$。

## 3. 训练与实验设置

- **数据集**：论文使用 11 个真实数据集，覆盖三类任务：
  - **短期预测**：Traffic、Solar-Energy、Electricity、Exchange-Rate（输入长度 168，预测 $\{3,6,12,24\}$）；
  - **长期预测**：ETTh1、ETTh2、ETTm1 等（与 Informer 同设置，具体数据集与预测长度见论文）；
  - **时空预测**：PEMS 交通数据集。
- **基线**：RNN/TCN 类（LSTNet、TPA-LSTM、TCN 及其用普通卷积替代因果卷积的变体）、Transformer 类（Informer 等）以及时空预测方法。
- **其他超参**：如隐层大小、$K$、$L$、卷积核大小等见论文附录，本文未逐项核对 `[待核实]`。

## 4. 实验与结论

- 论文称 SCINet 在短期、长期、时空三类预测任务上均优于对比的 TSF 模型；
- 短期预测：大多数情况下优于 RNN/TCN 类与 Transformer 类方法，在 Solar-Energy 与 Exchange-Rate 上尤其明显；Transformer 类方法在短期预测任务上表现较差；"普通卷积 TCN 变体优于原 TCN"这一结果也支持论文第 2 节的论断；
- 论文的 Table 2–6 给出了完整数字，本文不转引。

### 消融研究

在 ETTh1 与 PEMS08 上，论文对各组件做了消融：

变体 | 做法 | 论文观察
-- | -- | --
w/o InterLearn | 去掉交互学习（两个子序列各自更新） | 预测精度变差；回看窗口越长，交互学习越有效
WeightShare | 让两个子序列的卷积模块共享权重 | 预测精度变差，说明需要不同的权重
w/o ResConn | 去掉残差连接 | 性能明显下降（残差使原序列的可预测性增强）
w/o Linear | 去掉最后的全连接解码器 | 性能下降（解码器帮助提取并融合相关时间信息）
$K$、$L$、运算符选择 | 附录 B.2 的敏感性分析 | 见论文附录

表中：「变体」是被去掉或改动的组件，「做法」说明改动，「论文观察」是对应结论。核心结论：交互学习与独立权重都是必要的，残差连接带来明显提升。

## 5. 优缺点与局限

论文自述的优点：每层感受野更大、卷积核更丰富、能提取多分辨率的时间特征；最坏复杂度 $O(T\log T)$；不要求因果卷积。论文的第 5 节还讨论了局限与未来工作（如对高度非平稳或含更多变量交互的场景），具体内容见原文 `[待核实]`。

`[解读]` / `[经验]`：

- 奇偶拆分假设"下采样后时间关系保持"，对周期性强或平滑的序列合理，对高频噪声占主导的序列未必成立；
- 输入长度需要能被拆分 $L$ 次（长度为 $2^L$ 的倍数），实现上需要补齐或截断 `[待核实]`；
- 论文发表于 2021/2022 年，对比的是当时的基线；与 PatchTST、iTransformer 的比较不在论文范围内；
- 官方代码在 `cure-lab/SCINet`（论文摘要给出）。

## 6. 与相关方法对比

方法 | 卷积方式 | 感受野 | 卷积核 | 备注
-- | -- | -- | -- | --
SCINet | 奇偶拆分 + 交互学习，二叉树 | 每层都较大，多分辨率 | 各子序列独立卷积核 | 不要求因果
TCN | 膨胀因果卷积 | 只有最后一层是全局视野 | 每层共享单个卷积核 | SCINet 的改进对象
LightTS | 连续/间隔采样 + MLP | 通过采样获得 | MLP | 同样利用下采样信息保留特性
N-HiTS | 池化 + 层级插值 | 多速率 | MLP | 多尺度输入与输出

表中：「卷积方式」说明各方法如何处理序列，「感受野」「卷积核」说明其特征提取能力，「备注」给出特点。SCINet 的特点是用递归下采样加交互学习替代膨胀卷积。

## 7. 使用方式

官方代码为 `cure-lab/SCINet`；Time-Series-Library 也提供了 `SCINet` 实现。下面是 SCI-Block 的示意代码（未运行验证，卷积模块为占位实现）：

```python
import torch, torch.nn as nn

def conv_module(c, k=5):
    return nn.Sequential(nn.ReplicationPad1d(k // 2), nn.Conv1d(c, c, k), nn.LeakyReLU(0.01), nn.Conv1d(c, c, 3, padding=1), nn.Tanh())

class SCIBlock(nn.Module):
    def __init__(self, c):
        super().__init__()
        self.phi, self.psi, self.eta, self.rho = (conv_module(c) for _ in range(4))

    def forward(self, x):                        # x: [B, C, T]，T 为偶数
        even, odd = x[:, :, ::2], x[:, :, 1::2]
        odd_s = odd * torch.exp(self.phi(even))      # 缩放：缩放因子由另一子序列学得
        even_s = even * torch.exp(self.psi(odd))
        odd_new = odd_s + self.eta(even_s)           # 偏移：运算符 ± 的一种选择
        even_new = even_s - self.rho(odd_s)
        return even_new, odd_new                     # 送入下一层的两个 SCI-Block
```

使用要点 `[经验]`：回看长度尽量取 $2^L$ 的倍数；样本较少时先用单个 SCINet（$K=1$）、较少层数，再视情况增加堆叠。

## Reference

- Minhao Liu, Ailing Zeng, Muxi Chen, Zhijian Xu, Qiuxia Lai, Lingna Ma, Qiang Xu. *SCINet: Time Series Modeling and Forecasting with Sample Convolution and Interaction*. NeurIPS 2022. [arXiv:2106.09305](https://arxiv.org/abs/2106.09305)
- 官方代码（论文摘要给出）：https://github.com/cure-lab/SCINet
- 站内：[深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)、[TCN](/0626_ML_Tasks_TimeSeries_Deep_TCN)、[LightTS](/0667_ML_Tasks_TimeSeries_Deep_LightTS)

