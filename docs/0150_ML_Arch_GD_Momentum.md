---
Title | ML Arch GD Momentum
-- | --
Created @ | `2019-03-12T01:50:50Z`
Updated @| `2026-11-26T08:17:07Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/150)

---

# Momentum

## Reference

- [神经网络优化算法：梯度下降法、Momentum、RMSprop和Adam](https://www.cnblogs.com/jiaxblog/p/9695042.html)

## Brief

- SGD --> Momentum
- **Momentum** - 对 SGD 进行指数加权平均平滑
- **Nesterov’s Accelerated Momentum** - 比 标准 Momentum 收敛更好

Name | 更新策略
-- | --
GD | ![image](https://user-images.githubusercontent.com/2216970/113683034-55c49580-96f6-11eb-9d2d-0878b3d4d307.png)
SGD | ![image](https://user-images.githubusercontent.com/2216970/113683118-6d038300-96f6-11eb-9c34-c398b880b906.png)
MBGD | ![image](https://user-images.githubusercontent.com/2216970/113683212-85739d80-96f6-11eb-992f-17d702eb007d.png)
Momentum  | ![image](https://user-images.githubusercontent.com/2216970/113683774-28c4b280-96f7-11eb-8a77-85d632f3ec2f.png)
Nesterov Momentum | ![image](https://user-images.githubusercontent.com/2216970/113686504-e5b80e80-96f9-11eb-8e21-280a162f62ae.png)

> η - 学习率
> γ - 原来梯度的比例

## 代码实现

Name | Code 
-- | -- 
SGD | $x \leftarrow x - \eta\, dx$
Momentum   |  $v \leftarrow \mu v - \eta\, dx$<br>$x \leftarrow x + v$
Nesterov Momentum | $x_{ahead} = x + \mu v$<br>$v \leftarrow \mu v - \eta\, dx_{ahead}$<br>$x \leftarrow x + v$

其中：

- $x$：待优化参数；$dx$：当前参数处的梯度；$dx_{ahead}$：在前瞻位置 $x_{ahead}$ 处计算的梯度
- $\eta$：学习率（learning_rate）
- $v$：速度（动量项），初始为 0
- $\mu$：动量系数（mu），常取 0.9
- $\leftarrow$：赋值更新





## 指数加权平均
- 缓和拟合曲线

![image](https://user-images.githubusercontent.com/2216970/113679881-d41f3880-96f2-11eb-926d-34f105ef8cbe.png)
> β - 典型值 0.9 (即当前值的0.1，前一个值的0.9)




## Momentum vs ...

![image](https://user-images.githubusercontent.com/2216970/54170647-72a82380-44b2-11e9-98ab-2973edceaa47.png)

![image](https://user-images.githubusercontent.com/2216970/113685798-33804700-96f9-11eb-97db-5ee4395456ae.png)


