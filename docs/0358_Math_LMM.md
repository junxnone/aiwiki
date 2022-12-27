---
Title | Math LMM
-- | --
Created @ | `2021-03-26T06:06:14Z`
Last Modify @| `2022-12-27T06:02:31Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/358)

---
# Lagrange Multiplier Method 拉格朗日乘数法

## Reference
- [拉格朗日乘数法 —— 通俗理解](https://blog.csdn.net/THmen/article/details/87366904)
- [拉格朗日乘数法](https://blog.csdn.net/acdreamers/article/details/41413445)

## Brief
- 通过引入`拉格朗日乘子`来将含有n个变量和k个约束条件的约束优化问题转化为含有（n+k）个变量的无约束优化问题
  - `n 个变量` + `k 个约束条件` ==> `n + k 个变量`
  

函数 | 条件 | 转化函数
-- | -- | --
![image](https://user-images.githubusercontent.com/2216970/112590809-65162a00-8e3e-11eb-9dc1-3a7551bccff7.png) | ![image](https://user-images.githubusercontent.com/2216970/112590818-67788400-8e3e-11eb-9c1f-082b3c900930.png) | ![image](https://user-images.githubusercontent.com/2216970/112590833-6cd5ce80-8e3e-11eb-8549-e618de712191.png)



## Examples
### Example 1
Name | Details
-- | --
问题描述 | 求双曲线xy=3上离原点最近的点
函数 f(x, y)  | `xy = 3`
约束 g(x, y) | `x^2 + y^2 = C`
曲线 | ![image](https://user-images.githubusercontent.com/2216970/112589909-e1a80900-8e3c-11eb-8a80-0cacb24c40ca.png)
转化问题 | 求当f(x,y)和g(x,y)相切时，x,y的值是多少？
推理 | 两个曲线相切 ==> 切线相同/法向量是相互平行
引入拉格朗日乘子 λ | ▽f//▽g ==> ▽f=λ*▽g ==> `fx=λ*gx`/`fy=λ*gy`/`xy=3`

### Example 2

Name | Details
-- | --
问题描述 | 椭球的内接长方体的最大体积
函数 f(x, y, z) | ![image](https://user-images.githubusercontent.com/2216970/112591871-f89c2a80-8e3f-11eb-87e9-b31872852d8d.png)
条件 | ![image](https://user-images.githubusercontent.com/2216970/112591854-f2a64980-8e3f-11eb-8f0a-24fd63d228a3.png)
转化问题 | ![image](https://user-images.githubusercontent.com/2216970/112592084-5761a400-8e40-11eb-8af4-57e6ec385e5b.png)
求偏导 | ![image](https://user-images.githubusercontent.com/2216970/112592106-62b4cf80-8e40-11eb-93e7-2612d11d824a.png)
求解 |  ![image](https://user-images.githubusercontent.com/2216970/112592125-6c3e3780-8e40-11eb-9243-d7263e383539.png) ![image](https://user-images.githubusercontent.com/2216970/112592133-6fd1be80-8e40-11eb-81e1-8b5a95596428.png)

