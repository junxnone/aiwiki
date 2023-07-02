-----

| Title         | Math GaussianDistribution                            |
| ------------- | ---------------------------------------------------- |
| Created @     | `2021-03-22T08:23:37Z`                               |
| Last Modify @ | `2022-12-27T03:36:58Z`                               |
| Labels        | \`\`                                                 |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/23) |

-----

# Gaussian Distribution 高斯分布

## Reference

  - [多元高斯分布（The Multivariate normal
    distribution）](https://www.cnblogs.com/bingjianing/p/9117330.html)

## Brief

  - 高斯分布 - 正态分布 - **X \~ (μ，σ<sup>2</sup>)**
  - **X \~ (0, 1) - N(0, 1)** - `μ=0 σ=1` 时为 **标准正态分布**

## 定义

若随机变量 X 密度函数为:

![image](media/30ee75e08738f6ecca1fcb7b6c10df4747a37a25.png)

则称随机变量 X 服从正态分布 X \~ (μ，σ<sup>2</sup>)

## 多维高斯分布

| 分布     | 公式/概率密度函数                                                    | 曲线                                                           |
| ------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 一维正态分布 | ![image](media/30ee75e08738f6ecca1fcb7b6c10df4747a37a25.png) | ![image](media/c0f905dfb7f4c735fbbd0367542032384c6861a0.png) |
| 标准正态分布 | ![image](media/7c42c038e1d5cf4097c703bde530778e79b569bb.png) | ![image](media/2ebb2e8b8b3949993ee36f152783f10754f939ff.png) |
| 二维高斯分布 | ![image](media/825ef2307c9ade3e2d99f4e0fee3210f2ff8ab4c.png) | ![image](media/ec7e4425a767cb31b4863be5350994d24362619f.png) |
| 多维高斯分布 | ![image](media/8bb4b03538c16c4aa41f256a04d61f80058fc7b7.png) |                                                              |

## Python Code

    import numpy as np
    import matplotlib.pyplot as plt
    import math
     
     
    def normal_distribution(x, mu, sigma):
        return np.exp( -1 * ( (x-mu) ** 2) / ( 2 * (sigma ** 2)) ) / (math.sqrt( 2 * np.pi ) * sigma)
    
    mu, sigma = 0, 1
    x = np.linspace( mu - 6 * sigma, mu + 6 * sigma, 100)
    y = normal_distribution(x, mu, sigma)
    plt.plot(x, y, 'r', label='mu = 0,sigma = 1')
    
    y = normal_distribution(x, 0, 2)
    plt.plot(x, y, 'b', label='mu = 0,sigma = 2')
    
    y = normal_distribution(x, 1, 1)
    plt.plot(x, y, 'g', label='mu = 1,sigma = 1')
    
    plt.legend()
    plt.grid()
    plt.show()
