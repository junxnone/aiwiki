---
Title | ML AutoML NAS NASwRL
-- | --
Created @ | `2020-07-20T06:36:15Z`
Updated @| `2023-03-25T14:45:11Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/390)

---

## Neural Architecture Search with Reinforcement Learning
- 第一篇比较正式的 RL-Based NAS paper
- RL
  - Agent - RNN - Controller - `A variable-length String`
  - Reward - Accuracy
  - Policy Gradient
- REINFORCE rule - Williams - 1992
- Attention - `set-selection`

## Pipeline

![image](https://user-images.githubusercontent.com/2216970/87909825-88146100-ca9b-11ea-987d-19aa297ccebb.png)

without skip-connections | + skip-connections
-- | --
![image](https://user-images.githubusercontent.com/2216970/87910747-19380780-ca9d-11ea-91a0-aac234f6b7e5.png) | ![image](https://user-images.githubusercontent.com/2216970/87915640-01648180-caa5-11ea-8936-ab2d8a5cffe3.png)

## Training
- Reward - Accuracy - 不可微 --> Policy Gradient --> REINFORCE --> Update `θc`

Name | Formula
-- | --
Reward | ![image](https://user-images.githubusercontent.com/2216970/87912079-4b4a6900-ca9f-11ea-8b31-170492f0e487.png)
REINFORCE | ![image](https://user-images.githubusercontent.com/2216970/87912099-543b3a80-ca9f-11ea-8660-1de889acd7c2.png)
empirical approximation | ![image](https://user-images.githubusercontent.com/2216970/87912436-f8bd7c80-ca9f-11ea-9c96-f80c9eb2b2e1.png)
with Baseline Function | ![image](https://user-images.githubusercontent.com/2216970/87916062-88195e80-caa5-11ea-888c-2369e429aa2d.png)


- m - 子网络数量/batch
- T - 超参数数量/子网络
- Rk - 第 `k` 个子网络 Accuracy
- b - 之前子网络准确率的指数移动平均值


Parallelism and Asynchronous Updates | 
-- | 
![image](https://user-images.githubusercontent.com/2216970/87917001-d54a0000-caa6-11ea-8828-b7962316f717.png)

### Skip-Connections
- 第 N Layer `+Anchor Point` = `N-1 sigmoids` - 指定之前 `N-1 Layer` 的连接关系
- `Compilation Failures` - 当 Layer 与其他 Layer 不兼容, 或者 Layer 没有输入或者输出时
  - 如果没有输入, 则使用 `Input Layer`
  - 最后一个 Layer 和所有没被连接的 Layer concat 送入分类器
  - concat 不同大小的输入, `0-padding` 比较小的 Layer

当前RNN 状态和前 `N-1` Anchor Point 函数 | ![image](https://user-images.githubusercontent.com/2216970/87929436-02071300-cab9-11ea-988f-8c6bb28d3d72.png)
-- | --
hj | RNN 第 `j` 层 Anchor  Point  隐藏状态
j | `0 ~ N-1`

### RNN Cell

RNN Cell 1 - Base Cell | ![image](https://user-images.githubusercontent.com/2216970/88000790-2acaef00-cb31-11ea-9d99-d257a256ef4e.png)
-- | --
RNN Cell 2  - LSTM  | ![image](https://user-images.githubusercontent.com/2216970/88001557-03752180-cb33-11ea-885d-cfd2177088e2.png)
Input | Base Cell - xt/ht-1<br> LSTM - xt/ht-1/ct-1
Output | Base Cell - ht<br> LSTM - ht/ct
Combination method | Addition/Elementwise/Multiplication
Activation Function | tanh/sigmoid


## Reference

- [paper - 2016 - Neural Architecture Search with Reinforcement Learning](https://arxiv.org/pdf/1611.01578.pdf)
- [AutoDL论文解读（一）：基于强化学习的开创性工作](https://blog.csdn.net/u014157632/article/details/101721343)
- [论文笔记《Neural Architecture Search With Reinforcement Learning》](https://blog.csdn.net/Sugar_girl/article/details/89516578)
- [NAS详解](https://zhuanlan.zhihu.com/p/52471966)
