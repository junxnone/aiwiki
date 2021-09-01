---
Title | Convolution-Mathematics
-- | --
Create Date | `2019-06-09T07:26:18Z`
Update Date | `2021-09-01T03:53:38Z`
---
# Reference
- [Convolution - Wikipedia](https://en.wikipedia.org/wiki/Convolution)
- [Spatial convolution](https://graphics.stanford.edu/courses/cs178/applets/convolution.html)

# Brief
- 两个函数 `f(x)` & `g(x)` 之间的数学操作产生一个新的函数: `f(x)*g(x)`
- f & g 翻转平移后重叠部分乘积的积分

## 单变量 & 双变量的数学公式定义
函数 | 定义
-- | --
单变量连续域函数 | ![image](https://user-images.githubusercontent.com/2216970/131601623-854ff312-5e0f-43ce-a056-bd2a8f23520d.png)
单变量离散域函数 | ![image](https://user-images.githubusercontent.com/2216970/131601631-3c593ffa-56da-4f90-8ed8-8f28efcec4c9.png)
双变量连续函数 | ![image](https://user-images.githubusercontent.com/2216970/131601971-4211fe0c-4ea8-4139-bde8-0868f65f55c7.png)
双变量离散函数 | ![image](https://user-images.githubusercontent.com/2216970/131601976-ebdfa058-980c-43ba-b9e9-cf72b9588a5c.png)

## 一维卷积过程
- 输入 f & g (1~2)
- g 翻转平移 (3~4)
- 求每个t点的值 (5~7)
- 得到新的函数 (8)

![image](https://user-images.githubusercontent.com/2216970/131608216-58bdf6c6-a760-410b-bf4e-3083f31130e9.png)

# Convolution & Cross-correlation & Autocorrelation
- Cross-correlation 互相关 - 两个变量的相似性度量
- Autocorrelation 自相关 - 变量不同时间的相关性

![image](https://user-images.githubusercontent.com/2216970/131608780-d2df7ecf-c6a9-48dd-a895-1fab7dc28904.png)



