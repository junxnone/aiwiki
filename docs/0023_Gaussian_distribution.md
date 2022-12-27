---
Title | Gaussian distribution
-- | --
Created @ | `2021-03-22T08:23:37Z`
Last Modify @| `2022-12-27T03:29:57Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/23)

---
# Gaussian Distribution 高斯分布

## Reference
- [多元高斯分布（The Multivariate normal distribution）](https://www.cnblogs.com/bingjianing/p/9117330.html)

## Brief
- 高斯分布 - 正态分布 - **X ~ (μ，σ<sup>2</sup>)**
- **X ~ (0, 1) - N(0, 1)** - `μ=0 σ=1` 时为 **标准正态分布**

##  定义
若随机变量 X 密度函数为:

 ![image](https://user-images.githubusercontent.com/2216970/111960596-e746db80-8b2a-11eb-9b37-a4bd720f191f.png) 

则称随机变量 X 服从正态分布 X ~ (μ，σ<sup>2</sup>)

## 多维高斯分布

分布 | 公式/概率密度函数 | 曲线
-- | -- | --
一维正态分布 | ![image](https://user-images.githubusercontent.com/2216970/111960596-e746db80-8b2a-11eb-9b37-a4bd720f191f.png) |![image](https://user-images.githubusercontent.com/2216970/112079175-a8606680-8bba-11eb-9cec-fd5ff9d933a1.png)
标准正态分布 | ![image](https://user-images.githubusercontent.com/2216970/111960625-ed3cbc80-8b2a-11eb-947b-e70d14cb7a04.png) |  ![image](https://user-images.githubusercontent.com/2216970/111960942-5ae8e880-8b2b-11eb-99f7-d2bc53cae895.png)
二维高斯分布 | ![image](https://user-images.githubusercontent.com/2216970/111961968-ad76d480-8b2c-11eb-8394-f602ece26d39.png) | ![image](https://user-images.githubusercontent.com/2216970/111961984-b1a2f200-8b2c-11eb-8fb1-bf629cfb9c75.png)
多维高斯分布 | ![image](https://user-images.githubusercontent.com/2216970/111963049-0dba4600-8b2e-11eb-8301-4ed57b42695d.png)




## Python Code
```
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
```
