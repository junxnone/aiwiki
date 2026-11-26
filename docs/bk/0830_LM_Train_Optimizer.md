-----

| Title     | LM Train Optimizer                                    |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-26T15:35:44Z`                                |
| Updated @ | `2026-11-26T15:42:18Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/830) |

-----

# Optimizer

大模型训练的优化器与超参：AdamW 为什么是默认选择，Lion、Muon 等新优化器的思路，学习率与 batch size 的关系，以及 μP
怎样让小模型上调好的超参直接迁移到大模型。基础的梯度下降方法见 [GD History](/0149_ML_Arch_GD_History)。

## AdamW

$$ \\begin{aligned} m\_t&=\\beta\_1m\_{t-1}+(1-\\beta\_1)g\_t, &
v\_t&=\\beta\_2v\_{t-1}+(1-\\beta\_2)g\_t^2\\ \\hat
m\_t&=\\frac{m\_t}{1-\\beta\_1^t}, & \\hat
v\_t&=\\frac{v\_t}{1-\\beta\_2^t}\\
\\theta\_t&=\\theta\_{t-1}-\\eta\\Bigl(\\frac{\\hat m\_t}{\\sqrt{\\hat
v\_t}+\\epsilon}+\\lambda,\\theta\_{t-1}\\Bigr) \\end{aligned} $$

其中：

  - $g\_t$：第 $t$ 步的梯度；$m\_t$：一阶矩 (梯度的滑动平均，起动量作用)；$v\_t$：二阶矩
    (梯度平方的滑动平均，衡量每个参数梯度的尺度)
  - $\\beta\_1,\\beta\_2$：滑动平均系数，大模型常用 $0.9$ 和 $0.95$；$\\hat m\_t,\\hat
    v\_t$：偏差修正，抵消初始化为 $0$ 带来的偏小
  - $\\eta$：学习率；$\\epsilon$：防止除零的小常数 (如 $10^{-8}$)；$\\lambda$：权重衰减系数 (常用
    $0.1$)
  - 「W」表示解耦的权重衰减：直接从参数中减去 $\\eta\\lambda\\theta$，而不是加到梯度里，使衰减不被自适应缩放影响
  - 代价：每个参数要多存 $m,v$ 两份 FP32 状态 ($8$ 字节)，是训练显存的大头，见
    [Distributed](/0825_LM_Train_Distributed)

## 新的优化器

| 优化器              | 核心思路                                                                                  | 状态显存          | 特点                               |
| ---------------- | ------------------------------------------------------------------------------------- | ------------- | -------------------------------- |
| AdamW            | 每个参数按梯度的二阶矩自适应缩放                                                                      | $2$ 份 ($m,v$) | 默认选择，稳定                          |
| Lion             | 只用动量的符号更新：$\\theta\\leftarrow\\theta-\\eta,\\mathrm{sign}(\\beta\_1m+(1-\\beta\_1)g)$ | $1$ 份 ($m$)   | 省一半状态，学习率需比 AdamW 小 $3\\sim10$ 倍 |
| Adafactor        | 把二阶矩矩阵分解成行、列两个向量                                                                      | 近似 $0$        | 极省显存，T5 使用                       |
| Muon             | 对二维权重矩阵的动量做正交化 (Newton-Schulz 迭代) 后再更新                                                | $1$ 份         | 报告的训练效率高于 AdamW，已有大模型采用 `[待核实]`  |
| Sophia、Shampoo 等 | 利用二阶 (曲率) 信息                                                                          | 更多            | 收敛更快，但实现与开销更复杂                   |

表中：除 AdamW 外的优化器在不同规模上的收益结论并不一致，换优化器通常需要重新调学习率和权重衰减；生产级预训练目前仍以 AdamW 为主。

Muon 的更新 (对二维权重矩阵)：

$$ M\_t=\\mu M\_{t-1}+G\_t,\\qquad
O\_t=\\mathrm{NewtonSchulz}(M\_t)\\approx UV^\\top,\\qquad
W\_t=W\_{t-1}-\\eta,O\_t $$

其中：

  - $G\_t$：权重矩阵的梯度；$M\_t$：动量矩阵，$\\mu$ 为动量系数
  - $M\_t=U\\Sigma V^\\top$ 是奇异值分解；$UV^\\top$ 把所有奇异值都置为
    $1$，使更新在各个方向上的幅度相同，不会被少数主方向主导；用几次
    Newton-Schulz 迭代近似，避免真正做 SVD
  - 嵌入层、输出层和一维参数 (归一化、偏置) 仍用 AdamW

## 学习率、batch 与 warmup

  - 学习率随模型变宽要减小：宽度增大后，同样的学习率会使每层输出的变化变大，训练不稳定
  - batch size 与学习率：在「临界 batch」之内，batch 加倍、学习率相应增大，能用更少的步数达到同样损失；超过临界
    batch 后收益递减，只是浪费计算
  - warmup：训练开始时 Adam 的二阶矩估计不准、参数还在随机初始化附近，用逐步升高的学习率避免早期发散，常用约 $2000$
    步或总步数的 $0.1%\\sim1%$ `[经验]`
  - 调度：cosine 或 WSD，见 [Pretrain](/0824_LM_Train_Pretrain)

## μP：超参迁移

在标准参数化下，最优学习率会随模型宽度变化，大模型无法直接复用小模型的调参结果。μP (Maximal Update
Parametrization) 调整初始化和每层的学习率缩放，使最优超参与宽度无关：

| 参数类别  | 初始化方差                                    | Adam 学习率                     |
| ----- | ---------------------------------------- | ---------------------------- |
| 输入嵌入  | $\\propto1$                              | $\\eta$                      |
| 隐藏层矩阵 | $\\propto1/d$                            | $\\eta\\cdot\\frac{d\_0}{d}$ |
| 输出层   | $\\propto1/d^2$ (或输出乘 $\\frac{d\_0}{d}$) | $\\eta$                      |

表中：$d$ 是当前宽度，$d\_0$ 是调参用的小模型 (代理模型) 的宽度；按表中的规则缩放后，在宽度 $d\_0$ 的小模型上搜到的最优
$\\eta$ 等超参可以直接用到宽度 $d$ 的大模型，省下在大模型上反复试错的成本。这是简化版的规则，完整的形式以论文为准 `[待核实]`。

## 实践建议

  - 先用 AdamW + cosine/WSD 的公开配置作为基线，见
    [Pretrain](/0824_LM_Train_Pretrain)
  - 在小模型上做学习率扫描，用 μP 或经验的缩放规律推到大模型
  - 观察梯度范数与 loss 曲线，不稳定时优先降低学习率、检查数据，见
    [Stability](/0831_LM_Train_Stability)
  - 微调阶段的学习率远小于预训练 (如 $10^{-5}$ 量级)，LoRA 可以更大，见 [微调](/0410_LM_FT)

## Reference

  - [Adam: A Method for Stochastic
    Optimization](https://arxiv.org/abs/1412.6980)
  - [Decoupled Weight Decay Regularization
    (AdamW)](https://arxiv.org/abs/1711.05101)
  - [Symbolic Discovery of Optimization Algorithms
    (Lion)](https://arxiv.org/abs/2302.06675)
  - [Muon is Scalable for LLM
    Training](https://arxiv.org/abs/2502.16982)
  - [Tensor Programs V: Tuning Large Neural Networks via Zero-Shot
    Hyperparameter Transfer (μP)](https://arxiv.org/abs/2203.03466)
  - [An Empirical Model of Large-Batch
    Training](https://arxiv.org/abs/1812.06162)
