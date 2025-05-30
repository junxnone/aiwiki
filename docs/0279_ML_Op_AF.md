---
Title | ML Op AF
-- | --
Created @ | `2019-03-13T05:26:53Z`
Updated @| `2025-04-08T02:42:15Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/279)

---
# Activation Function 激活函数

- 【当神经元的输入激励达到一定强度，就会被激活，产生输出信号】模拟这一细胞激活过程的函数，就叫激活函数。
- 激活函数将输入映射到某个范围，例如 `[0, 1]`
- 作为每一层 Layer 最后的选择条件: `Layer N Output` --> `Activation Function` -> `Layer N+1 Input`
- 激活函数引入了**非线性特性**
  - `没有激活函数的神经网络` == `线性回归模型` - `Linear regression Model`
- **分类**: 饱和/非饱和
  - **左饱和**: x-> +∞，f(x) 导数趋近于 0 (sigmoid)
  - **右饱和**: x-> -∞，f(x) 导数趋近于 0 (tanh)
  - **饱和** = **左饱和** + **右饱和**
  - 非饱和激活函数对**梯度消失**有效/**加快收敛**
- [Sigmoid vs Softmax](/Sigmoid_vs_Softmax)



## 各种激活函数
 
![activationfunctions 2019-08-01-16_58_53](https://user-images.githubusercontent.com/2216970/108931660-f305c600-7682-11eb-980a-b239c9fcddad.gif)


### Sigmoid
- 导数最大值为0.25, 各层梯度相乘容易梯度为0 ==> 梯度消失

Name | Formula | Figure 
-- | -- | -- 
Sigmoid |$Sigmoid(x)= \frac{1}{1 + e^{-x}}$ | <img width="300px" src="https://user-images.githubusercontent.com/2216970/150644672-56f10a62-b025-4989-8ca0-05689e12a17f.png">


### TanH
- 导数最大值为 1 

Name | Formula | Figure 
-- | -- | -- 
Tanh |  $TanH(x)=\frac{e^{x}-e^{-x}}{e^{x}+e^{-x}}$| <img width="300px" src="https://user-images.githubusercontent.com/2216970/150644171-1fad01e1-cccf-4baf-9298-fd5aec6abac5.png">



### ReLU
- ReLU - `Rectified Linear Unit`


Name | Formula | Figure 
-- | -- | -- 
ReLU |  $ReLU(x)=Max(0,x)$<br>$ReLU(x)=Max(0,w^{T}x+b)$<br>$ReLU(x)=\begin{cases}  & \text{0 if } x\leq 0 \\  & \text{x if } x> 0 \end{cases}$ | <img width="300px" src="https://user-images.githubusercontent.com/2216970/150707916-ea8a695f-892e-4ef7-b351-cd572d65f2ce.png">

### Leaky ReLU
- λ 取值:  固定值

Name | Formula | Figure 
-- | -- | -- 
Leaky ReLU | $LReLU(x)=\begin{cases}  & \text{x if } x\leq 0  \\  & \lambda \text{x if } x> 0 \end{cases}$ | <img width="300px" src="https://user-images.githubusercontent.com/2216970/150710850-9043a6cb-cad6-4704-846d-20e4d748b692.png">


### Parametric ReLU
- λ 取值:  根据 BP 学习的变量

Name | Formula | Figure 
-- | -- | -- 
Parametric ReLU | $PReLU(x)=\begin{cases}  & \text{x if } x\leq 0  \\  & \lambda \text{x if } x> 0 \end{cases}$ | <img width="300px" src="https://user-images.githubusercontent.com/2216970/150710850-9043a6cb-cad6-4704-846d-20e4d748b692.png">

### Randomized ReLU
- λ 取值: 取随机值, 服从连续性均匀分布
- $\lambda \sim  U(l,u), l,u \in [0,1),l < u $


Name | Formula | Figure 
-- | -- | -- 
Randomized ReLU | $RReLU(x)=\begin{cases}  & \text{x if } x\leq 0  \\  & \lambda \text{x if } x> 0 \end{cases}$ | <img width="300px" src="https://user-images.githubusercontent.com/2216970/150710850-9043a6cb-cad6-4704-846d-20e4d748b692.png">

### Noisy ReLU

Name | Formula | Figure 
-- | -- | -- 
Noisy ReLU | $NReLU(x)=max(0,x+Y),Y\sim  N(0,\sigma(x))$ | <img width="300px" src="https://user-images.githubusercontent.com/2216970/150707916-ea8a695f-892e-4ef7-b351-cd572d65f2ce.png">

### Others

Name | Formula | Figure | Comments
-- | -- | -- | --
ELU | 
GELU | 


## Reference
- [Activation function - Wikipedia](https://en.wikipedia.org/wiki/Activation_function)
- [激活函数（Sigmoid, tanh, Relu）](https://blog.csdn.net/weixin_41417982/article/details/81437088)
- [Activation Function - LiFeiFei](https://study.163.com/course/courseLearn.htm?courseId=1004697005#/learn/video?lessonId=1050369427&courseId=1004697005)
- [Rectifier (neural networks)](https://en.wikipedia.org/wiki/Rectifier_(neural_networks))
- [notebook demo](https://github.com/junxnone/examples/blob/master/nn/Activation_Function.ipynb)


