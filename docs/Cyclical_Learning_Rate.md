---
Title | Cyclical Learning Rate
-- | --
Create Date | `2019-09-03T08:50:27Z`
Update Date | `2022-01-20T08:33:09Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/266)

---


## Reference

- [周期性学习率(Cyclical Learning Rate)技术](https://blog.csdn.net/weixin_43896398/article/details/84762886)
- [paper - Cyclical Learning Rates for Training Neural Networks](https://arxiv.org/pdf/1506.01186.pdf)
- [神经网络学习速率设置指南（CLR Callback，LRFinder，SGDR等最新的学习率设置方案）](https://blog.csdn.net/qq_38410428/article/details/88061738)
- [Cyclical Learning Rate (CLR) - github](https://github.com/bckenstler/CLR)
- [Cyclic Learning Rates和One Cycle Policy-Keras](https://blog.csdn.net/m0_37477175/article/details/89400436)


## Brief
CLR是Leslie Smith于2015年提出的。这是一种调节LR的方法，在该方法中，设定一个LR上限和下限，LR的值在上限和下限的区间里周期性地变化。看上去，CLR似乎是自适应LR技术和SGD的竞争者，事实上，CLR技术是可以和上述提到的改进的优化器一起使用来进行参数更新的。

一个cycle定义为学习率从低到高，然后从高到低走一轮所用的iteration数。而stepsize指的是cycle迭代步数的一半。
![image](https://user-images.githubusercontent.com/2216970/64158526-3e169280-ce6b-11e9-8e7c-0b25fe1356b6.png)

> Leslie建议:
> - 最大学习率应该根据Learning Rate Finder来确定
> - 最小值则可以取最大值的十分之一。
