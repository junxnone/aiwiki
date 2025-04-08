---
Title | ML Arch GD
-- | --
Created @ | `2018-12-12T10:16:49Z`
Updated @| `2025-04-08T02:37:48Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/147)

---
# Gradient Descent & Optimizer

- 使用梯度下降进行优化，是几乎所有优化器的核心思想

## 梯度

- 向量(方向) 描述变化率
- 表示某一函数在该点处的方向导数沿着该方向取得最大值(即最大方向导数的方向)
- 函数在该点处沿着该方向变化最快，变化率最大（为该梯度的模）
- 在神经网络的训练过程中，梯度消失和爆炸是常见的问题。

![image](https://user-images.githubusercontent.com/2216970/216771243-f3dc74e1-2ce1-4db1-89b2-adf2b0515efa.png)

## 梯度下降

- 通过寻找梯度下降的方式寻找最优点

## 对比

![1](https://user-images.githubusercontent.com/2216970/54171780-98cfc280-44b6-11e9-9588-ef8249c67586.gif) | ![2](https://user-images.githubusercontent.com/2216970/54171786-9bcab300-44b6-11e9-9e80-3550a56ed548.gif)
-- | --


## 梯度消失
- 梯度消失指的是在反向传播过程中，梯度随着层数的增加而逐渐减小，导致前面的层难以学习到有效的参数更新；
- 一些激活函数，如 ReLU 函数及其变体，能够在一定程度上缓解梯度消失问题，因为它们在正数部分的导数为常数 1，不会导致梯度在传播过程中指数级地衰减。

## 梯度爆炸
- 梯度爆炸则是梯度变得过大，使得模型无法稳定训练。
- 通过合理选择激活函数和调整网络结构，也可以避免梯度爆炸的发生，使得神经网络能够更加稳定和高效地进行训练。


## Reference

- [随机梯度下降法，批量梯度下降法和小批量梯度下降法以及代码实现](https://blog.csdn.net/LoseInVain/article/details/78243051)
- [优化器（Optimizer）介绍](https://blog.csdn.net/weixin_41417982/article/details/81561210)
- [为什么说随机最速下降法(SGD)是一个很好的方法？](https://zhuanlan.zhihu.com/p/27609238)
- [SGD过程中的噪声如何帮助避免局部极小值和鞍点？](https://zhuanlan.zhihu.com/p/36816689) 
- [Deep Learning 最优化方法之SGD](https://blog.csdn.net/bvl10101111/article/details/72615436)
- [最清晰的讲解各种梯度下降法原理与Dropout](https://baijiahao.baidu.com/s?id=1613121229156499765&wfr=spider&for=pc)
- [一文搞懂深度学习中的梯度下降](https://www.cnblogs.com/wangguchangqing/p/10521330.html)
- [An overview of gradient descent optimization algorithms](https://arxiv.org/pdf/1609.04747.pdf)
- [梯度下降优化算法概述](https://alanlee.fun/2017/10/08/gradient-descent-methods/)
- [paper - Learning internal representations by error propagation.pdf](https://github.com/junxnone/AI/files/4431755/Learning.internal.representations.by.error.propagation.pdf)
- [gradient descent visualization tool](https://github.com/lilipads/gradient_descent_viz)
- [deeplearningbook  - optimization](https://www.deeplearningbook.org/contents/optimization.html)





