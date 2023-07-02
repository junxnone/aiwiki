-----

| Title     | ML Arch GD xGD                                        |
| --------- | ----------------------------------------------------- |
| Created @ | `2020-04-04T13:09:55Z`                                |
| Updated @ | `2023-02-02T09:32:13Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/148) |

-----

# BGD SGD MBGD

## Reference

  - [随机梯度下降法，批量梯度下降法和小批量梯度下降法以及代码实现](https://blog.csdn.net/LoseInVain/article/details/78243051)
  - [优化器（Optimizer）介绍](https://blog.csdn.net/weixin_41417982/article/details/81561210)
  - [为什么说随机最速下降法(SGD)是一个很好的方法？](https://zhuanlan.zhihu.com/p/27609238)
  - [SGD过程中的噪声如何帮助避免局部极小值和鞍点？](https://zhuanlan.zhihu.com/p/36816689)
  - [Deep Learning
    最优化方法之SGD](https://blog.csdn.net/bvl10101111/article/details/72615436)
  - [最清晰的讲解各种梯度下降法原理与Dropout](https://baijiahao.baidu.com/s?id=1613121229156499765&wfr=spider&for=pc)
  - [一文搞懂深度学习中的梯度下降](https://www.cnblogs.com/wangguchangqing/p/10521330.html)
  - [An overview of gradient descent optimization
    algorithms](https://arxiv.org/pdf/1609.04747.pdf)
  - [梯度下降优化算法概述](https://alanlee.fun/2017/10/08/gradient-descent-methods/)

## Brief

  - **BGD ==\> SGD ==\> MBGD**
  - **BGD** 学习时间长/计算量大/内存消耗大
  - **SGD** 可以逃离局部最优点
  - **MBGD** - 结合 BGD + SGD，速度快/精度高

| Name                                               | Description        | 更新策略                                                         |
| -------------------------------------------------- | ------------------ | ------------------------------------------------------------ |
| **BGD**<br>Batch Gradient Descent<br>批量梯度下降        | 使用整个训练集            | ![image](media/f641aa620876f4d6ba6cbcd8a724fa9c736bdd01.png) |
| **SGD**<br>Stochastic Gradient Descent<br>随机梯度下降   | 样本集中的一个随机样本        | ![image](media/1bc20582400cacbe22af2e0a74930434ce263ffb.png) |
| **MBGD**<br>Mini-batch Gradient Descent<br>小批量梯度下降 | 随机采样batch\_size个样本 | ![image](media/f440c75a8015d49b9de7fcc5b08a143858f40045.png) |

-----

| 鞍点                                                           | 局部最小值                                                        |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/a90bc46f8c015a1c2cf5c4eafe7cfc6c96fc02a0.png) | ![image](media/554c00727ee1ac444af53c406b5b7e5b106d3bd6.png) |
