---
Title | MO Pruning History
-- | --
Created @ | `2026-11-26T14:40:59Z`
Updated @| `2026-11-26T14:40:59Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/816)

---
# 剪枝发展历史

> 神经网络剪枝（Pruning）的发展时间线。系列文章：[总览](https://github.com/junxnone/aiwiki/issues/808)、[基础原理](https://github.com/junxnone/aiwiki/issues/809)、[重要性准则](https://github.com/junxnone/aiwiki/issues/810)、[剪枝流程与时机](https://github.com/junxnone/aiwiki/issues/811)、[结构化剪枝](https://github.com/junxnone/aiwiki/issues/812)、[N:M 半结构化稀疏](https://github.com/junxnone/aiwiki/issues/813)、[LLM 剪枝](https://github.com/junxnone/aiwiki/issues/814)、[工具](https://github.com/junxnone/aiwiki/issues/815)。
>
> 按技术路线给条目归类：
>
> | 路线 | 解决的问题 | 代表条目 |
> | --- | --- | --- |
> | 二阶方法 | 用曲率信息更准确地判断哪些权重可以去掉 | OBD、OBS |
> | 非结构化剪枝 | 把权重剪到很稀疏 | Han 等人的三步法、Deep Compression |
> | 结构化剪枝 | 去掉通道、滤波器、头，得到更小的稠密模型 | 滤波器剪枝、Network Slimming、ThiNet、DepGraph |
> | 训练方式与时机 | 何时剪、怎么调稀疏度 | 渐进式剪枝、彩票假说、SNIP、RigL |
> | 硬件友好稀疏 | 让稀疏被硬件加速 | 2:4 稀疏 |
> | LLM 剪枝 | 不重训练或少量恢复，剪枝大模型 | SparseGPT、Wanda、LLM-Pruner、Sheared-LLaMA |
>
> 表中：第一列是技术路线，第二列说明这条路线要解决的问题，第三列列出下方时间线中属于该路线的代表条目。
>
> 日期以首次公开（多为 arXiv 首版）为准，会议发表时间可能更晚。

## 早期：二阶方法

### 1989  Optimal Brain Damage

LeCun 等人提出用 Hessian 的对角元素估计删除权重引起的损失变化，删除「显著性」最小的权重。详见 [重要性准则](https://github.com/junxnone/aiwiki/issues/810)。

### 1993  Optimal Brain Surgeon

Hassibi 与 Stork 用完整的 Hessian 逆给出删除某权重后对其余权重的最优补偿，精度高于 OBD，但计算量大。它是后来 SparseGPT 的理论基础，见 [LLM 剪枝](https://github.com/junxnone/aiwiki/issues/814)。

## 深度学习时代的非结构化剪枝

### 2015-06-08  三步法（训练 - 剪枝 - 重训练）

Han 等人 *Learning both Weights and Connections for Efficient Neural Networks*：按幅度剪掉小权重并微调，AlexNet 上大幅减少参数而精度基本不变，奠定「幅度剪枝 + 微调」的基线。[arXiv:1506.02626](https://arxiv.org/abs/1506.02626)

### 2015-10-01  Deep Compression

剪枝 + 训练量化与权重共享 + 霍夫曼编码三段式流水线。[arXiv:1510.00149](https://arxiv.org/abs/1510.00149) 其中量化部分见 [量化](https://github.com/junxnone/aiwiki/issues/312)。

## 结构化剪枝

### 2016-08  Structured Sparsity Learning 与 滤波器剪枝

Wen 等人提出用组稀疏正则学习结构化稀疏（[arXiv:1608.03665](https://arxiv.org/abs/1608.03665)）；Li 等人 *Pruning Filters for Efficient ConvNets* 按滤波器 L1 范数剪枝（[arXiv:1608.08710](https://arxiv.org/abs/1608.08710)）。

### 2017-07  ThiNet 与 Channel Pruning

按下一层输出的重构误差选择通道（[ThiNet arXiv:1707.06342](https://arxiv.org/abs/1707.06342)；[Channel Pruning arXiv:1707.06168](https://arxiv.org/abs/1707.06168)）。

### 2017-08  Network Slimming

在 BN 的缩放因子 $\gamma$ 上加 L1 正则，训练后剪掉 $\gamma$ 接近 0 的通道。[arXiv:1708.06519](https://arxiv.org/abs/1708.06519) 详解见 [结构化剪枝](https://github.com/junxnone/aiwiki/issues/812)。

### 2018-02  AMC

用强化学习自动搜索每层的剪枝比例。[arXiv:1802.03494](https://arxiv.org/abs/1802.03494)

### 2018-10  Rethinking the Value of Network Pruning

指出结构化剪枝后的网络「从头训练」常常能达到与「继承权重再微调」相当的精度，说明剪枝得到的结构本身可能比继承的权重更重要。[arXiv:1810.05270](https://arxiv.org/abs/1810.05270)

## 训练方式与时机

### 2017-10  To prune, or not to prune

Zhu 与 Gupta 提出训练中渐进式幅度剪枝（三次多项式调度），并比较「大而稀疏」与「小而稠密」的模型。[arXiv:1710.01878](https://arxiv.org/abs/1710.01878) 见 [剪枝流程与时机](https://github.com/junxnone/aiwiki/issues/811)。

### 2018-03-09  彩票假说

Frankle 与 Carbin：稠密网络中存在可单独训练到相近精度的稀疏子网络（「中奖票」）。[arXiv:1803.03635](https://arxiv.org/abs/1803.03635)

### 2018-10  SNIP

训练前用一批数据的梯度估计连接敏感度，一次性剪枝。[arXiv:1810.02340](https://arxiv.org/abs/1810.02340)

### 2019-11  RigL

动态稀疏训练：训练中周期性地剪掉幅度小的权重，并在梯度大的位置长出新连接，始终保持稀疏。[arXiv:1911.11134](https://arxiv.org/abs/1911.11134)

### 2020-05  Movement Pruning

按微调中权重朝 0 移动的趋势打分，适合预训练语言模型的迁移。[arXiv:2005.07683](https://arxiv.org/abs/2005.07683)

### 2020-06  SynFlow

不使用数据的训练前剪枝，避免整层被剪光（层坍塌）。[arXiv:2006.05467](https://arxiv.org/abs/2006.05467)

## Transformer 与硬件友好稀疏

### 2019-05  注意力头剪枝

Michel 等人 *Are Sixteen Heads Really Better than One?*（[arXiv:1905.10650](https://arxiv.org/abs/1905.10650)）与 Voita 等人（[arXiv:1905.09418](https://arxiv.org/abs/1905.09418)）发现许多注意力头可以去掉而性能基本不变。

### 2020-05  Ampere 与 2:4 稀疏

NVIDIA A100（Ampere 架构）引入 Sparse Tensor Core，原生支持 2:4 稀疏，使半结构化稀疏获得真实加速。详见 [N:M 半结构化稀疏](https://github.com/junxnone/aiwiki/issues/813)。

### 2021-04  Accelerating Sparse Deep Neural Networks

NVIDIA 给出 2:4 稀疏的训练与微调流程及实验结果。[arXiv:2104.08378](https://arxiv.org/abs/2104.08378)

### 2021-02  Sparsity in Deep Learning（综述）

Hoefler 等人对剪枝与稀疏训练的系统综述。[arXiv:2102.00554](https://arxiv.org/abs/2102.00554)

### 2023-01  DepGraph

自动构建参数依赖图，实现对任意网络的结构化剪枝，是 Torch-Pruning 的核心。[arXiv:2301.12900](https://arxiv.org/abs/2301.12900) 见 [工具](https://github.com/junxnone/aiwiki/issues/815)。

## LLM 剪枝

### 2023-01-02  SparseGPT

单次、逐层、无需重训练，用 OBS 的近似求解局部问题，把大模型剪到 50% 稀疏度而精度基本不降。[arXiv:2301.00774](https://arxiv.org/abs/2301.00774) 详解见 [LLM 剪枝](https://github.com/junxnone/aiwiki/issues/814)。

### 2023-05  LLM-Pruner

通过依赖图成组移除结构，并用 LoRA 短时恢复。[arXiv:2305.11627](https://arxiv.org/abs/2305.11627)

### 2023-06  Wanda

用「权重幅度 × 输入激活范数」打分，不更新权重，比 SparseGPT 快得多。[arXiv:2306.11695](https://arxiv.org/abs/2306.11695)

### 2023-10  Sheared-LLaMA

结构化剪枝到目标形状后继续预训练。[arXiv:2310.06694](https://arxiv.org/abs/2310.06694)

### 2024-01  SliceGPT

对隐状态做正交变换后截断维度。[arXiv:2401.15024](https://arxiv.org/abs/2401.15024)

### 2024-03  层剪枝

ShortGPT（[arXiv:2403.03853](https://arxiv.org/abs/2403.03853)）与 *The Unreasonable Ineffectiveness of the Deeper Layers*（[arXiv:2403.17887](https://arxiv.org/abs/2403.17887)）发现深层 Transformer 中存在大量冗余层，可以直接移除。

### 2024-07  剪枝加蒸馏

NVIDIA *Compact Language Models via Pruning and Knowledge Distillation*：先结构化剪枝，再用蒸馏恢复，得到更小的模型。[arXiv:2407.14679](https://arxiv.org/abs/2407.14679) 蒸馏见 [知识蒸馏](https://github.com/junxnone/aiwiki/issues/207)。

