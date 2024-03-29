---
Title | ML Arch GD 原理
-- | --
Created @ | `2021-04-06T06:57:07Z`
Updated @| `2023-02-02T09:32:18Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/151)

---

# GD 原理推导

## Reference
- [梯度下降（Gradient Descent）小结](https://www.cnblogs.com/pinard/p/5970503.html)

## Brief
- Gradient Descent/梯度下降是深度学习领域用于最优化(求权值)的方法
- **梯度** - 在微积分里面，对多元函数的参数求 ∂ 偏导数，把求得的各个参数的偏导数以向量的形式写出来，就是梯度
  - f(x,y) --> (∂f/∂x, ∂f/∂y)T
  - 函数变化增加最快的地方
  - ML 中, 最小化损失函数的过程,可以通过迭代梯度下降求解



## 推导

Term | Description
-- | --
Learning rate/ 步长 | 梯度下降迭代的过程中，每一步沿梯度负方向前进的长度
Hypothesis function/假设函数 |  拟合输入样本
Loss function/损失函数 | 度量拟合的程度

### 代数法推导 (线性回归)

Name | Description
-- | --
假设函数 | ![image](https://user-images.githubusercontent.com/2216970/113672379-44758c00-96ea-11eb-87bd-93475e887461.png)
模型参数 | ![image](https://user-images.githubusercontent.com/2216970/113672472-6a9b2c00-96ea-11eb-84fa-3ffaa24b3a59.png)
输入/特征值 | ![image](https://user-images.githubusercontent.com/2216970/113672513-77b81b00-96ea-11eb-9e76-aef977a333c8.png)
损失函数 | ![image](https://user-images.githubusercontent.com/2216970/113672573-8a325480-96ea-11eb-82ce-6bdc2a8e5792.png)
梯度 | ![image](https://user-images.githubusercontent.com/2216970/113672773-bbab2000-96ea-11eb-89e3-3b4f0a1e0b4e.png)
步长 | α
当前位置下降距离 | ![image](https://user-images.githubusercontent.com/2216970/113672893-dc737580-96ea-11eb-95a7-e8e8b6738893.png)
**更新模型参数** | ![image](https://user-images.githubusercontent.com/2216970/113673078-19d80300-96eb-11eb-92f5-4400ed097897.png)




### 矩阵法推导

Name | Description
-- | --
假设函数 `m` x `1` | ![image](https://user-images.githubusercontent.com/2216970/113674245-928b8f00-96ec-11eb-96b5-4729d459f1ef.png)
模型参数 `n+1` x `1` | θ
输入 `m` x `n+1` | X 
损失函数 | ![image](https://user-images.githubusercontent.com/2216970/113674864-4260fc80-96ed-11eb-976b-dd0d87113a14.png)
yn样本输出 `m` x `1` | Y
梯度 | ![image](https://user-images.githubusercontent.com/2216970/113675026-789e7c00-96ed-11eb-893b-0f3a4e6771ae.png)
当前位置下降距离 | ![image](https://user-images.githubusercontent.com/2216970/113675080-8ce27900-96ed-11eb-9eb0-f7e5d162acea.png)
更新模型参数 | ![image](https://user-images.githubusercontent.com/2216970/113675181-ab487480-96ed-11eb-99f6-29e96ff9c18f.png)


矩阵求导链式法则 | ![image](https://user-images.githubusercontent.com/2216970/113675581-17c37380-96ee-11eb-946c-bdb73a4d0a2a.png) <br>![image](https://user-images.githubusercontent.com/2216970/113675663-2dd13400-96ee-11eb-82a0-e81998e6a6ff.png)
-- | --

