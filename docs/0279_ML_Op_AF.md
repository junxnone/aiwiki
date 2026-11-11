---
Title | ML Op AF
-- | --
Created @ | `2019-03-13T05:26:53Z`
Updated @| `2026-11-11T01:07:30Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/279)

---
# Activation Function 激活函数

- 【当神经元的输入激励达到一定强度，就会被激活，产生输出信号】模拟这一细胞激活过程的函数，就叫激活函数。
- 在网络中的位置：`Layer N Output` -> `Activation Function` -> `Layer N+1 Input`，通常是逐元素（[Elementwise](0620_ML_Op_Elementwise)）算子，Softmax 例外（沿某一维归一化）。
- 激活函数将输入映射到某个范围，例如 `[0, 1]`，也可以无上界（ReLU）。
- 本页是激活函数的入口：先讲为什么需要、分类与导数，再列各函数公式，最后给选型建议并导航到各子页。

## 为什么需要非线性

- 若无激活函数，$L$ 层 [Linear](0612_ML_Op_Linear) 堆叠仍是线性映射：
  $W_L(\cdots(W_2(W_1x+b_1)+b_2)\cdots)+b_L = W'x+b'$
  - `没有激活函数的神经网络` == `线性回归模型` - `Linear regression Model`，多层等价于一层。
- 引入非线性后，网络才有可能逼近任意连续函数（万能逼近定理的前提之一是非多项式的非线性激活）。
- 输出层的激活函数还决定了输出的语义：概率（Sigmoid/Softmax）、实数回归（无激活/恒等）等。

## 分类

### 按饱和性

- **左饱和**: $x\to -\infty$ 时，$f'(x)\to 0$（sigmoid、tanh、ReLU 均左饱和）
- **右饱和**: $x\to +\infty$ 时，$f'(x)\to 0$（sigmoid、tanh）
- **饱和** = **左饱和** + **右饱和**（sigmoid、tanh）；ReLU 仅左侧导数为 0，右侧导数恒为 1，称为非饱和（或单侧饱和）
- 非饱和激活函数对**梯度消失**有缓解作用，**加快收敛**
- 注：原文将左/右饱和的方向写反，此处已按常规定义（左 = $-\infty$）修正。

### 按形态

| 类别 | 代表 | 特点 |
| -- | -- | -- |
| S 形（饱和） | Sigmoid、Tanh | 输出有界，两侧饱和，易梯度消失 |
| ReLU 系 | ReLU、Leaky/PReLU/RReLU、ELU | 计算简单、右侧梯度为 1，详见 [ReLU 系](0616_ML_Op_AF_ReLU) |
| 平滑门控类 | GELU、SiLU(Swish)、Mish | 平滑、非单调，Transformer/现代 CNN 常用 |
| 归一化类 | Softmax | 沿某一维输出概率分布，见 [Softmax](0335_ML_Op_AF_Softmax) |

## 导数与梯度问题

反向传播时各层梯度连乘：$\frac{\partial L}{\partial x_1}=\frac{\partial L}{\partial x_n}\prod_{k} f_k'(\cdot)\,W_k$。

| 函数 | 导数 | 导数范围 |
| -- | -- | -- |
| Sigmoid | $\sigma(x)(1-\sigma(x))$ | $(0, 0.25]$ |
| Tanh | $1-\tanh^2(x)$ | $(0, 1]$ |
| ReLU | $\mathbb{1}[x>0]$ | $\{0,1\}$ |

- **梯度消失**: 导数小于 1 的函数多层连乘后趋于 0（sigmoid 最大仅 0.25，10 层即约 $10^{-6}$ 量级）。
- **梯度爆炸**: 权重较大时连乘趋于无穷，常用梯度裁剪、合理初始化、[Norm](0613_ML_Op_Norm) 缓解。
- **神经元死亡 (dying ReLU)**: ReLU 输入长期为负则梯度恒为 0，参数不再更新；Leaky ReLU 等通过给负半轴小斜率缓解。
- 零中心性: Sigmoid 输出均值非 0，使下一层权重梯度同号，收敛路径呈锯齿；tanh 零中心。

## 各种激活函数

![activationfunctions 2019-08-01-16_58_53](https://user-images.githubusercontent.com/2216970/108931660-f305c600-7682-11eb-980a-b239c9fcddad.gif)


### Sigmoid
- 导数最大值为 0.25, 各层梯度相乘容易梯度为 0 ==> 梯度消失
- 详见 [Sigmoid](0280_ML_Op_AF_Sigmoid)

Name | Formula | Figure 
-- | -- | -- 
Sigmoid |$Sigmoid(x)= \frac{1}{1 + e^{-x}}$ | <img width="300px" src="https://user-images.githubusercontent.com/2216970/150644672-56f10a62-b025-4989-8ca0-05689e12a17f.png">


### TanH
- 导数最大值为 1 
- $\tanh(x)=2\sigma(2x)-1$，输出范围 $(-1,1)$，零中心

Name | Formula | Figure 
-- | -- | -- 
Tanh |  $TanH(x)=\frac{e^{x}-e^{-x}}{e^{x}+e^{-x}}$| <img width="300px" src="https://user-images.githubusercontent.com/2216970/150644171-1fad01e1-cccf-4baf-9298-fd5aec6abac5.png">



### ReLU
- ReLU - `Rectified Linear Unit`
- 详见 [ReLU 系](0616_ML_Op_AF_ReLU)


Name | Formula | Figure 
-- | -- | -- 
ReLU |  $ReLU(x)=Max(0,x)$<br>$ReLU(x)=Max(0,w^{T}x+b)$<br>$ReLU(x)=\begin{cases}  & \text{0 if } x\leq 0 \\  & \text{x if } x> 0 \end{cases}$ | <img width="300px" src="https://user-images.githubusercontent.com/2216970/150707916-ea8a695f-892e-4ef7-b351-cd572d65f2ce.png">

### Leaky ReLU
- λ 取值:  固定值（常见 0.01）
- 注：原文分段条件与定义相反，此处按常规定义（$x>0$ 取 $x$，$x\le 0$ 取 $\lambda x$）修正，下同。

Name | Formula | Figure 
-- | -- | -- 
Leaky ReLU | $LReLU(x)=\begin{cases}  & \text{x if } x> 0  \\  & \lambda \text{x if } x\leq 0 \end{cases}$ | <img width="300px" src="https://user-images.githubusercontent.com/2216970/150710850-9043a6cb-cad6-4704-846d-20e4d748b692.png">


### Parametric ReLU
- λ 取值:  根据 BP 学习的变量

Name | Formula | Figure 
-- | -- | -- 
Parametric ReLU | $PReLU(x)=\begin{cases}  & \text{x if } x> 0  \\  & \lambda \text{x if } x\leq 0 \end{cases}$ | <img width="300px" src="https://user-images.githubusercontent.com/2216970/150710850-9043a6cb-cad6-4704-846d-20e4d748b692.png">

### Randomized ReLU
- λ 取值: 取随机值, 服从连续性均匀分布（训练时随机，推理时取均值）
- $\lambda \sim  U(l,u), l,u \in [0,1),l < u $


Name | Formula | Figure 
-- | -- | -- 
Randomized ReLU | $RReLU(x)=\begin{cases}  & \text{x if } x> 0  \\  & \lambda \text{x if } x\leq 0 \end{cases}$ | <img width="300px" src="https://user-images.githubusercontent.com/2216970/150710850-9043a6cb-cad6-4704-846d-20e4d748b692.png">

### Noisy ReLU

Name | Formula | Figure 
-- | -- | -- 
Noisy ReLU | $NReLU(x)=max(0,x+Y),Y\sim  N(0,\sigma(x))$ | <img width="300px" src="https://user-images.githubusercontent.com/2216970/150707916-ea8a695f-892e-4ef7-b351-cd572d65f2ce.png">

### Others

Name | Formula | Comments
-- | -- | --
ELU | $x\ (x>0);\ \alpha(e^{x}-1)\ (x\le0)$ | 负半轴平滑饱和，输出均值更接近 0
GELU | $x\,\Phi(x)\approx 0.5x\left(1+\tanh\left[\sqrt{2/\pi}(x+0.044715x^3)\right]\right)$ | BERT/GPT 等 Transformer 常用
SiLU / Swish | $x\,\sigma(x)$ | EfficientNet、YOLO、LLM 的 SwiGLU 门控中使用
Softmax | $\frac{e^{z_i}}{\sum_j e^{z_j}}$ | 多分类输出，见 [Softmax](0335_ML_Op_AF_Softmax)

## PyTorch 用法

```python
import torch, torch.nn as nn, torch.nn.functional as F
x = torch.randn(4, 8)
y1 = torch.sigmoid(x)      # 或 nn.Sigmoid()
y2 = torch.tanh(x)
y3 = F.relu(x)             # inplace=True 可省显存，但要注意是否影响反向
y4 = F.gelu(x)             # approximate='tanh' 可选
y5 = F.silu(x)
y6 = F.softmax(x, dim=-1)  # 必须指定 dim
```

## 选型指南

- 隐藏层默认首选 ReLU（CNN）；Transformer 常用 GELU / SiLU（及其门控变体）。
- 出现大量死神经元时换 Leaky ReLU / PReLU / ELU 等。
- 二分类 / 多标签输出：Sigmoid（训练时配 BCEWithLogits，见 [Sigmoid](0280_ML_Op_AF_Sigmoid)）；单标签多分类：Softmax（训练时配 CrossEntropy，见 [Softmax](0335_ML_Op_AF_Softmax)）；回归：不加激活或视值域选择。
- RNN/LSTM 门控中使用 Sigmoid / Tanh，见 [Recurrent](0618_ML_Op_Recurrent)。
- 部署：ReLU 最易融合进 Conv/Linear 并量化；GELU/SiLU/Sigmoid 在无专用单元的硬件上需 LUT 或分段近似。
- 损失函数相关见 [Loss Function](0281_ML_Arch_Func_LossFunction)。

## 导航

- [Sigmoid](0280_ML_Op_AF_Sigmoid)
- [Softmax](0335_ML_Op_AF_Softmax)
- [ReLU 系](0616_ML_Op_AF_ReLU)
- 总览：[ML Op 总览](0366_ML_Op)

## Reference
- [Activation function - Wikipedia](https://en.wikipedia.org/wiki/Activation_function)
- [激活函数（Sigmoid, tanh, Relu）](https://blog.csdn.net/weixin_41417982/article/details/81437088)
- [Activation Function - LiFeiFei](https://study.163.com/course/courseLearn.htm?courseId=1004697005#/learn/video?lessonId=1050369427&courseId=1004697005)
- [Rectifier (neural networks)](https://en.wikipedia.org/wiki/Rectifier_(neural_networks))
- [notebook demo](https://github.com/junxnone/examples/blob/master/nn/Activation_Function.ipynb)
- [torch.nn 激活函数](https://pytorch.org/docs/stable/nn.html#non-linear-activations-weighted-sum-nonlinearity)

