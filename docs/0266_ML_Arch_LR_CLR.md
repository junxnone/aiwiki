---
Title | ML Arch LR CLR
-- | --
Created @ | `2019-09-03T08:50:27Z`
Updated @| `2026-11-26T08:33:52Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/266)

---
# Cyclical Learning Rate 周期学习率

CLR是Leslie Smith于2015年提出的。这是一种调节LR的方法，在该方法中，设定一个LR上限和下限，LR的值在上限和下限的区间里周期性地变化。看上去，CLR似乎是自适应LR技术和SGD的竞争者，事实上，CLR技术是可以和上述提到的改进的优化器一起使用来进行参数更新的。

一个cycle定义为学习率从低到高，然后从高到低走一轮所用的iteration数。而stepsize指的是cycle迭代步数的一半。
![image](https://user-images.githubusercontent.com/2216970/64158526-3e169280-ce6b-11e9-8e7c-0b25fe1356b6.png)

图中：该图为原文档附带的 CLR 示意图，对应上面对 cycle 的定义：学习率在下限与上限之间周期往复，一次上升加一次下降为一个 cycle。

> Leslie建议:
> - 最大学习率应该根据Learning Rate Finder来确定
> - 最小值则可以取最大值的十分之一。

## 三角形（triangular）策略

$$
c=\left\lfloor 1+\frac{t}{2s}\right\rfloor,\quad x=\left|\frac{t}{s}-2c+1\right|,\quad \eta_t=\eta_{min}+\left(\eta_{max}-\eta_{min}\right)\max(0,\ 1-x)
$$

其中：

- $t$：当前迭代次数；$s$：stepsize，即半个周期的迭代数（一个 cycle 为 $2s$ 次迭代）
- $c$：当前处于第几个 cycle；$x$：当前位置在三角波中的相对位置
- $\eta_{min}$、$\eta_{max}$：学习率的下限和上限；$\eta_t$：当前学习率
- 结果：学习率在 $\eta_{min}$ 与 $\eta_{max}$ 之间沿三角波线性往复

## 常见变体

| 策略 | 做法 |
| --- | --- |
| triangular | 上下限固定，三角波 |
| triangular2 | 每个 cycle 后振幅减半 |
| exp_range | 振幅随迭代按指数衰减 |
| One Cycle | 只走一个 cycle：先升到最大值再降到远低于最小值，常配合动量反向变化 |

表中：

- **振幅**：学习率上下限之差
- 对比结论：triangular2 和 exp_range 让后期学习率越来越小，更利于收敛；One Cycle 在固定预算内常能训得更快

## 实践建议

- stepsize 通常取每个 epoch 迭代数的 2 到 10 倍
- 训练结束于一个 cycle 的末尾（学习率最低点）效果更好
- 上下限用 [学习率选择（LR Finder）](https://github.com/junxnone/aiwiki/issues/263) 确定
- 与退火系列对比见 [AnnealingLR](https://github.com/junxnone/aiwiki/issues/372)

## Reference

- [周期性学习率(Cyclical Learning Rate)技术](https://blog.csdn.net/weixin_43896398/article/details/84762886)
- [paper - Cyclical Learning Rates for Training Neural Networks](https://arxiv.org/pdf/1506.01186.pdf)
- [神经网络学习速率设置指南（CLR Callback，LRFinder，SGDR等最新的学习率设置方案）](https://blog.csdn.net/qq_38410428/article/details/88061738)
- [Cyclical Learning Rate (CLR) - github](https://github.com/bckenstler/CLR)
- [Cyclic Learning Rates和One Cycle Policy-Keras](https://blog.csdn.net/m0_37477175/article/details/89400436)

