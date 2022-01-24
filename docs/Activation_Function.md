---
Title | Activation Function
-- | --
Create Date | `2019-03-13T05:26:53Z`
Update Date | `2022-01-24T01:37:48Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/279)

---
## Reference
- [Activation function - Wikipedia](https://en.wikipedia.org/wiki/Activation_function)
- [激活函数（Sigmoid, tanh, Relu）](https://blog.csdn.net/weixin_41417982/article/details/81437088)
- [Activation Function - LiFeiFei](https://study.163.com/course/courseLearn.htm?courseId=1004697005#/learn/video?lessonId=1050369427&courseId=1004697005)
- [Rectifier (neural networks)](https://en.wikipedia.org/wiki/Rectifier_(neural_networks))
- [notebook demo](https://github.com/junxnone/examples/blob/master/nn/Activation_Function.ipynb)

## Brief
- 当输入激励达到一定强度，神经元就会被激活，产生输出信号。模拟这一细胞激活过程的函数，就叫激活函数。
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
ReLU |  $ReLU(x)=Max(0,x)$<br>$ReLU(x)=Max(0,w^{T}x+b)$<br>$ReLU(x)==\begin{cases}  & \text{0 if } x\leq 0   & \text{x if } x> 0 \end{cases}$ | <img width="300px" src="https://user-images.githubusercontent.com/2216970/150707916-ea8a695f-892e-4ef7-b351-cd572d65f2ce.png">



### Details

Name | Formula | Figure | Comments
-- | -- | -- | --
Sigmoid |$sigmoid(x)= \frac{1}{1 + e^{-x}}$ | <img width="100px" src="https://user-images.githubusercontent.com/2216970/150641254-016e40a7-5f30-4f7a-af24-bc4e50749d6b.png">| 导数最大值为0.25, 各层梯度相乘容易梯度为0 ==> 梯度消失
Tanh |  $TanH(x)=\frac{e^{x}-e^{-x}}{e^{x}+e^{-x}}$| <img width="100px" src="https://user-images.githubusercontent.com/2216970/150644171-1fad01e1-cccf-4baf-9298-fd5aec6abac5.png">| 导数最大值为 1 
ReLU<br>Rectified Linear Unit | ![image](https://user-images.githubusercontent.com/2216970/106373634-89153c00-63b6-11eb-8268-f33bad22f76d.png) ![image](https://user-images.githubusercontent.com/2216970/113401331-ca859000-93d5-11eb-86dd-fc9b60ffe3a9.png) | ![image](https://user-images.githubusercontent.com/2216970/106373636-8c102c80-63b6-11eb-84b9-817057c21ddd.png)
ELU | 
GELU | 
Leaky ReLU | ![image](https://user-images.githubusercontent.com/2216970/72238418-9d09c680-3618-11ea-9f66-6aaa0f799628.png)<br>λ 取值:  固定值| | 
PReLU - Parametric ReLUs | ![image](https://user-images.githubusercontent.com/2216970/72238418-9d09c680-3618-11ea-9f66-6aaa0f799628.png) <br>λ 取值:  根据 BP 学习的变量| | 
RReLU - Randomized Leaky ReLU | ![image](https://user-images.githubusercontent.com/2216970/72238418-9d09c680-3618-11ea-9f66-6aaa0f799628.png) <br>- λ 取值: 取随机值, 服从连续性均匀分布<br>  - ![image](https://user-images.githubusercontent.com/2216970/72239086-c6c3ed00-361a-11ea-9927-e1a827df7cad.png)<br>  - ![image](https://user-images.githubusercontent.com/2216970/72239101-d3484580-361a-11ea-9faa-db854ffb3b4e.png)| | 
Noisy ReLU | ![image](https://user-images.githubusercontent.com/2216970/72239128-ec50f680-361a-11ea-81d0-4ca8a7243df5.png) ![image](https://user-images.githubusercontent.com/2216970/72239134-f07d1400-361a-11ea-9da3-b69d0f017b37.png) |


