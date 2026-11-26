-----

| Title     | ML Arch GD Momentum                                   |
| --------- | ----------------------------------------------------- |
| Created @ | `2019-03-12T01:50:50Z`                                |
| Updated @ | `2026-11-26T08:17:07Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/150) |

-----

# Momentum

## Reference

  - [神经网络优化算法：梯度下降法、Momentum、RMSprop和Adam](https://www.cnblogs.com/jiaxblog/p/9695042.html)

## Brief

  - SGD --\> Momentum
  - **Momentum** - 对 SGD 进行指数加权平均平滑
  - **Nesterov’s Accelerated Momentum** - 比 标准 Momentum 收敛更好

| Name              | 更新策略                                                         |
| ----------------- | ------------------------------------------------------------ |
| GD                | ![image](media/221f2c20bec0f22d8691743fb41dcd48b888c956.png) |
| SGD               | ![image](media/f74f612932ea087ccec0707f405bd3900f45cae6.png) |
| MBGD              | ![image](media/cc24e2ea0400e1ea643e333d4ff5a1bb826ee3dd.png) |
| Momentum          | ![image](media/d69f55fd81166577810c61760472d74926f8455a.png) |
| Nesterov Momentum | ![image](media/3ebe80f72928625c21bdc684ad0c9d5a87fb631a.png) |

> η - 学习率 γ - 原来梯度的比例

## 代码实现

| Name              | Code                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| SGD               | $x \\leftarrow x - \\eta, dx$                                                                     |
| Momentum          | $v \\leftarrow \\mu v - \\eta, dx$<br>$x \\leftarrow x + v$                                       |
| Nesterov Momentum | $x\_{ahead} = x + \\mu v$<br>$v \\leftarrow \\mu v - \\eta, dx\_{ahead}$<br>$x \\leftarrow x + v$ |

其中：

  - $x$：待优化参数；$dx$：当前参数处的梯度；$dx\_{ahead}$：在前瞻位置 $x\_{ahead}$ 处计算的梯度
  - $\\eta$：学习率（learning\_rate）
  - $v$：速度（动量项），初始为 0
  - $\\mu$：动量系数（mu），常取 0.9
  - $\\leftarrow$：赋值更新

## 指数加权平均

  - 缓和拟合曲线

![image](media/dde4582499c25ca02eab36b64d0cf43a48ea5476.png)

> β - 典型值 0.9 (即当前值的0.1，前一个值的0.9)

## Momentum vs ...

![image](media/ecf1647079cd5bdc77c769307ee64d9fab35da95.png)

![image](media/10086dfca5b3fcca905cfdce1f882324ade4358c.png)
