-----

| Title     | ML Arch GD History                                    |
| --------- | ----------------------------------------------------- |
| Created @ | `2021-04-06T06:21:52Z`                                |
| Updated @ | `2026-10-18T00:15:18Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/149) |

-----

> 梯度下降及其优化器的发展时间线。正文按
> [timelinemd](https://github.com/junxnone/jstools/tree/main/timelinemd)
> 格式书写，可用 [timelinemd
> 在线工具](https://junxnone.github.io/jstools/timelinemd/?md=https://raw.githubusercontent.com/junxnone/aiwiki/main/docs/0149_ML_Arch_GD_History.md)
> 以交互式时间轴形式查看（页面顶部会多出同步脚本自动生成的 Title/Created/Updated
> 表格，不影响下方时间轴正常解析渲染）。原理与分类详见
> [Gradient Descent & Optimizer](0147_ML_Arch_GD)、[BGD SGD
> MBGD](0148_ML_Arch_GD_xGD)、[Momentum](0150_ML_Arch_GD_Momentum)。

## 1847 Cauchy 最速下降法

Augustin-Louis Cauchy
发表的论文给出了求解连续多元函数最小值的数学方法，是今天"梯度下降"最早的雏形。本质上就是用全部数据/全部约束一次性计算下降方向，对应后来的
**BGD（Batch Gradient
Descent，批量梯度下降）**——用整个训练集计算一次梯度再更新一次参数，计算量大、收敛稳定但速度慢。

## 1951 Robbins-Monro 随机近似

Herbert Robbins 和 Sutton Monro 发表《A Stochastic Approximation
Method》，首次给出了"用带噪声的采样观测做递归式求根"的数学框架，是所有基于采样的优化方法（包括
**SGD，Stochastic Gradient
Descent，随机梯度下降**）的理论源头——每次只用一个随机样本估计梯度，噪声大但能跳出局部最优、单步计算量小。后来的
\*\*MBGD（Mini-batch Gradient Descent，小批量梯度下降）\*\*是 BGD 和 SGD
的工程折中，每次用一小批随机样本，在速度和稳定性之间取得平衡，并没有单一的"发明"论文，而是伴随神经网络训练实践逐步成为业界标准做法。三者的更新策略对比见
[BGD SGD MBGD](0148_ML_Arch_GD_xGD)。

## 1964 Polyak 动量法（Heavy Ball）

Boris Polyak 发表《Some methods of speeding up the convergence of iteration
methods》，提出在梯度更新里加入"惯性"项——参考前几步的更新方向来加速收敛、抑制震荡，这就是
\*\*Momentum（动量法）\*\*的理论起点。1999 年 Ning Qian
把这一思想系统地引入神经网络训练场景，使其在深度学习里普及开来。具体更新公式与代码实现见
[Momentum](0150_ML_Arch_GD_Momentum)。

## 1983 Nesterov 加速梯度（NAG，理论）

Yurii Nesterov 发表《A method for unconstrained convex minimization problem
with the rate of convergence O(1/k²)》，提出 **NAG（Nesterov's Accelerated
Gradient）**——不是在当前点算梯度，而是先按动量"预估"一步再算梯度，收敛速度的理论上界比标准动量法更优。

## 2013 NAG 引入深度学习

Ilya Sutskever 等人发表《On the importance of initialization and momentum in
deep learning》（ICML 2013），把 Nesterov 1983
年的理论方法系统地应用到深度神经网络训练中，并证明了合适的初始化和动量调度能让简单的
SGD+Momentum/NAG 训练出媲美当时复杂方法的效果——这是 NAG 真正走入主流深度学习实践的节点。

## 2010 \~ 2011 Adagrad

John Duchi、Elad Hazan、Yoram Singer 在 COLT 2010 提出、JMLR 2011
正式发表《Adaptive Subgradient Methods for Online Learning and
Stochastic
Optimization》，是最早引入"**自适应学习率**"概念的优化器之一——按每个参数历史梯度平方的累积和动态缩放学习率，频繁更新的参数学习率自动变小，稀疏特征对应的参数学习率相对更大。缺点是累积量只增不减，训练后期学习率会趋近于零。

## 2012-12 Adadelta

Matthew Zeiler 发表《ADADELTA: An Adaptive Learning Rate
Method》（[arXiv:1212.5701](https://arxiv.org/abs/1212.5701)），针对
Adagrad 学习率单调衰减的问题，改用梯度平方的**指数衰减移动平均**代替全部历史的累积和，同时还消除了需要手工设置全局学习率这一超参数。

## 2012 RMSprop

Geoffrey Hinton 在 Coursera 神经网络课程的第 6 讲第 6e 页提出，没有正式发表论文，但因为效果好而被
PyTorch/TensorFlow 等框架广泛内置支持。和 Adadelta
几乎同期、各自独立地提出了同样的核心思路——用梯度平方的指数衰减移动平均来归一化学习率。

## 2014-12 Adam

Diederik Kingma 和 Jimmy Ba 发表《Adam: A Method for Stochastic
Optimization》（[arXiv:1412.6980](https://arxiv.org/abs/1412.6980)，2014-12-22
提交），把一阶动量（梯度的指数移动平均）和二阶动量（梯度平方的指数移动平均，类似
RMSprop）结合在一起，并加入了偏置修正项来修正训练初期两个移动平均的低估问题。Adam
此后成为深度学习里最常用的默认优化器之一，对稀疏梯度和高噪声场景效果尤其好。

## 2014-12 AdaMax

与 Adam 同一篇论文里提出的变体，把二阶动量里的 L2 范数换成 **L∞ 范数（无穷范数）**，在某些场景下数值上更稳定。

## 2016 Nadam

Timothy Dozat 发表《Incorporating Nesterov Momentum into Adam》（ICLR 2016
Workshop），把 Nesterov 动量的"预估一步再更新"思路移植进 Adam 的一阶动量项里，结合了两者的优点。

## 2018 AMSGrad

Sashank Reddi、Satyen Kale、Sanjiv Kumar 发表《On the Convergence of Adam and
Beyond》（ICLR 2018 Best Paper），指出 Adam
类方法在某些场景下二阶动量估计会导致不收敛，提出用历史二阶动量的**最大值**而非当前值来做归一化，修复了这个理论缺陷。

## 2017-11 AdamW

Ilya Loshchilov 和 Frank Hutter 发表《Decoupled Weight Decay
Regularization》（[arXiv:1711.05101](https://arxiv.org/abs/1711.05101)，2017-11-14
提交，ICLR 2019 正式发表），指出 Adam 里 L2 正则化和权重衰减（Weight Decay）在数学上并不等价（这是经典 SGD
场景下的巧合），将权重衰减从梯度更新里**解耦**出来单独处理。AdamW 后来成为训练 Transformer/LLM 的事实标准优化器。

## 2019 LAMB

You Yang 等人提出 LAMB（Layer-wise Adaptive Moments optimizer for Batch
training），在 Adam 的基础上引入**按层自适应**的信任域缩放，使超大 batch size（上万）训练也能稳定收敛，被用于
BERT 等大模型的分布式加速训练。

## 2019 RAdam

Liyuan Liu 等人提出 RAdam（Rectified Adam），分析了 Adam
训练初期自适应学习率方差过大导致的不稳定问题，加入一个"方差修正"项，让模型在训练初期不需要手动做学习率
warmup 也能稳定训练。

## 2020-10 AdaBelief

Juntang Zhuang 等人发表《AdaBelief Optimizer: Adapting Stepsizes by the
Belief in Observed
Gradients》（[arXiv:2010.07468](https://arxiv.org/abs/2010.07468)），把二阶动量的统计对象从"梯度平方"改为"梯度与其动量估计之差的平方"——直观理解为用"观测梯度和预期的偏离程度"来调整步长，号称兼顾了
Adam 的快速收敛与 SGD 的泛化能力。

## 2023-02 Lion

Xiangning Chen 等人（Google）发表《Symbolic Discovery of Optimization
Algorithms》（[arXiv:2302.06675](https://arxiv.org/abs/2302.06675)），用程序搜索（而非人工设计）的方式自动发现了
Lion（EvoLved Sign
Momentum）——更新时只用动量的**符号**而不是具体数值，内存占用更低（只需维护一阶动量），在图像和语言模型上取得了有竞争力的效果。

## 2023-05 Sophia

Hong Liu 等人（Stanford）发表《Sophia: A Scalable Stochastic Second-order
Optimizer for Language Model
Pre-training》（[arXiv:2305.14342](https://arxiv.org/abs/2305.14342)），引入轻量级的\*\*二阶（Hessian
对角近似）\*\*信息来指导步长，在大语言模型预训练场景下相比 AdamW 号称可减少约一半的训练步数。

## 2024-12-08 Muon

Keller Jordan 等人以博客（而非论文）形式发布《Muon: An optimizer for hidden layers in
neural networks》，面向权重矩阵的隐藏层提出**正交化（orthogonalization）更新**——用
Newton-Schulz 迭代把动量矩阵投影到近似正交矩阵，在多个小规模训练速度记录测试中大幅超过 AdamW。

## 2025-02 Muon 规模化验证

Moonshot AI（Kimi）团队发表《Muon is Scalable for LLM
Training》（[arXiv:2502.16982](https://arxiv.org/abs/2502.16982)），通过增加权重衰减和调整更新幅度等工程改进，验证了
Muon 在十亿参数级大语言模型预训练上同样可以稳定扩展，且训练耗时比 AdamW 更短。

## Reference

  - [An overview of gradient descent optimization
    algorithms](https://arxiv.org/pdf/1609.04747.pdf)
  - [Development of Deep Learning Optimizers: Approaches, Concepts, and
    Update Rules](https://arxiv.org/pdf/2509.18396)
  - [Adam: A Method for Stochastic
    Optimization](https://arxiv.org/abs/1412.6980)
  - [Decoupled Weight Decay
    Regularization](https://arxiv.org/abs/1711.05101)
  - [AdaBelief Optimizer](https://arxiv.org/abs/2010.07468)
  - [Symbolic Discovery of Optimization Algorithms
    (Lion)](https://arxiv.org/abs/2302.06675)
  - [Sophia: A Scalable Stochastic Second-order
    Optimizer](https://arxiv.org/abs/2305.14342)
  - [Muon: An optimizer for hidden layers in neural
    networks](https://kellerjordan.github.io/posts/muon/)
  - [Muon is Scalable for LLM
    Training](https://arxiv.org/abs/2502.16982)
  - [timelinemd
    格式说明](https://github.com/junxnone/jstools/blob/main/timelinemd/README.md)
