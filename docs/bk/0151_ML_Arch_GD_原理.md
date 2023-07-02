-----

| Title     | ML Arch GD 原理                                         |
| --------- | ----------------------------------------------------- |
| Created @ | `2021-04-06T06:57:07Z`                                |
| Updated @ | `2023-02-02T09:32:18Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/151) |

-----

# GD 原理推导

## Reference

  - [梯度下降（Gradient
    Descent）小结](https://www.cnblogs.com/pinard/p/5970503.html)

## Brief

  - Gradient Descent/梯度下降是深度学习领域用于最优化(求权值)的方法
  - **梯度** - 在微积分里面，对多元函数的参数求 ∂ 偏导数，把求得的各个参数的偏导数以向量的形式写出来，就是梯度
      - f(x,y) --\> (∂f/∂x, ∂f/∂y)T
      - 函数变化增加最快的地方
      - ML 中, 最小化损失函数的过程,可以通过迭代梯度下降求解

## 推导

| Term                     | Description               |
| ------------------------ | ------------------------- |
| Learning rate/ 步长        | 梯度下降迭代的过程中，每一步沿梯度负方向前进的长度 |
| Hypothesis function/假设函数 | 拟合输入样本                    |
| Loss function/损失函数       | 度量拟合的程度                   |

### 代数法推导 (线性回归)

| Name       | Description                                                  |
| ---------- | ------------------------------------------------------------ |
| 假设函数       | ![image](media/6df77ea5815e58c41b70e5391bc74cded08cc278.png) |
| 模型参数       | ![image](media/135cf460ef43d2ec60e0c6a09f66d1656affff50.png) |
| 输入/特征值     | ![image](media/0a9ab8652ca1a7b7405d273964064f306a2fa1b4.png) |
| 损失函数       | ![image](media/c479a53161c2d9a1a7961aaf55d96773c3386e37.png) |
| 梯度         | ![image](media/b332ddf8e71343a86b424b1afd5eaa85db510372.png) |
| 步长         | α                                                            |
| 当前位置下降距离   | ![image](media/006f4e32a3608d6894017bae8e703c8db57d39f5.png) |
| **更新模型参数** | ![image](media/5b270753449ccb99de7948fe4378c96953803ab3.png) |

### 矩阵法推导

| Name             | Description                                                  |
| ---------------- | ------------------------------------------------------------ |
| 假设函数 `m` x `1`   | ![image](media/da7643186d4ed79dfed5bd1b94318be412c81912.png) |
| 模型参数 `n+1` x `1` | θ                                                            |
| 输入 `m` x `n+1`   | X                                                            |
| 损失函数             | ![image](media/10ab88e8d17b1a3fe661de43ea9b474429ea7089.png) |
| yn样本输出 `m` x `1` | Y                                                            |
| 梯度               | ![image](media/d1fe775faec25c80e0e3293c3e728213da272d21.png) |
| 当前位置下降距离         | ![image](media/f7c471c91278145c86bb48fe152bed1d0abbd698.png) |
| 更新模型参数           | ![image](media/ff38fa8dc8c7e2baf7efab44ec366b56b2ae5e45.png) |

| 矩阵求导链式法则 | ![image](media/4c7f6a2c2d544afe5ffbbe6c3940671dfdc0bba3.png) <br>![image](media/1920ab011d026d7dee50611ca4c400534a02cece.png) |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- |
