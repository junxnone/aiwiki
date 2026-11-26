---
Title | ML Tasks Image Classification MobileNet V1
-- | --
Created @ | `2020-02-25T10:14:26Z`
Updated @| `2026-11-26T01:26:33Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/42)

---
# MobileNet V1

## Brief
- 使用了 depthwise 和 pointwise 卷积分解 减少计算量，加快模型推理速度


## Arch

- 网络结构 - 28 layers = 1+2x13+1

![image](https://user-images.githubusercontent.com/2216970/69853207-295a6700-12c1-11ea-95bf-e11dbac5bc23.png)


## depthwise & pointwise

- MobileNet 主要概念是深度可分卷积，将标准卷积分解为：
  - **深度卷积** - `depthwise convolution` :  用于过滤通道, 宽度相当于是无穷的)
  - **逐点卷积** - `pointwise convolution` : 1*1卷积, 用于组合通道
- 标准卷积将过滤通道和组合通道、提取空间特征的作用组合在一起
- 深度可分卷积具有大幅度减少计算和模型大小的效果

![image](https://user-images.githubusercontent.com/2216970/69784363-8e925780-11f0-11ea-954c-8a9a61136db6.png) |  ![image](https://user-images.githubusercontent.com/2216970/69728962-707d1680-1160-11ea-9aa5-baf765746667.png)
-- | --

**计算量缩小的比例**

标准卷积 vs 可分卷积 | 计算量
-- | --
![image](https://user-images.githubusercontent.com/2216970/69727854-43c7ff80-115e-11ea-9ef2-725facac4967.png) | ![image](https://user-images.githubusercontent.com/2216970/69728274-26dffc00-115f-11ea-9711-a2f0cd1c3f3a.png)


卷积 | 计算量
-- | --
标准卷积 | D<sub>F</sub>\*D<sub>F</sub>\*D<sub>K</sub>\*D<sub>K</sub>\*M\*N
分解卷积 | D<sub>F</sub>\*D<sub>F</sub>\*D<sub>K</sub>\*D<sub>K</sub>\*M+D<sub>F</sub>\*D<sub>F</sub>\*M\*N
depthwise | D<sub>F</sub>\*D<sub>F</sub>\*D<sub>K</sub>\*D<sub>K</sub>\*M
pointwise | D<sub>F</sub>\*D<sub>F</sub>\*1\*1\*M\*N

> feature map为D<sub>F</sub>\*D<sub>F</sub>\*N
> 如果卷积核大小为3*3，那么差不多卷积操作的时间能降到原来的1/9左右




## 宽度乘数
构造这些更小，计算量更小的模型，引入了一个非常简单的参数α，称为宽度乘法器
- 宽度乘数α的作用是在每层均匀地减薄网络。
- 对于给定的层和宽度乘数α，输入通道M的数量变为αM，输出通道数量N变为αN。
- 可分离卷积的计算量减小为： 
![image](https://user-images.githubusercontent.com/2216970/69731407-d2d81600-1164-11ea-8f99-403780fab4bc.png)
> α的典型值设置为1，0.75，0.5和0.25

## 分辨率乘数ρ

- 输入分辨率隐式设置ρ
- 可分离卷积的计算量减小为：
![image](https://user-images.githubusercontent.com/2216970/69731598-234f7380-1165-11ea-9858-fe6fe4555dc8.png)
> ρ 为隐式设置(1，6/7，5/7，4/7)，对应分辨率取值为 224, 192, 160, 128

## 参数&计算量&精度

![mobilenet_diff](https://user-images.githubusercontent.com/2216970/46989687-9730e700-d130-11e8-8fbe-335484c9eaf4.png)

> MACs Multiply-Accumulates

## 存在的问题

- 结构是非常复古的直筒结构
- Depthwise每个kernel dim相对于普通Conv要小得多，过小的kernel_dim, 加上ReLU的激活影响下，使得神经元输出很容易变为0，这个问题在定点化低精度训练的时候会进一步放大。



## 计算量公式

$$
\text{Cost}_{std}=D_F^2D_K^2MN,\qquad
\text{Cost}_{sep}=D_F^2D_K^2M+D_F^2MN
$$

$$
\frac{\text{Cost}_{sep}}{\text{Cost}_{std}}=\frac{1}{N}+\frac{1}{D_K^2}
$$

其中：

- $D_F$：输出特征图的边长；$D_K$：卷积核边长；$M$：输入通道数；$N$：输出通道数
- 第一项 $D_F^2D_K^2M$ 是 depthwise 卷积 (每个输入通道一个 $D_K\times D_K$ 的核)，第二项 $D_F^2MN$ 是 pointwise $1\times1$ 卷积
- 比值 $1/N+1/D_K^2$：$D_K=3$、$N$ 较大时约为 $1/9$，即计算量降到标准卷积的约九分之一，与上文表中的说明一致

## 宽度乘数与分辨率乘数

$$
\text{Cost}_{\alpha,\rho}=D_K^2\,\alpha M\,\rho D_F\rho D_F+\alpha M\,\alpha N\,\rho D_F\rho D_F
$$

其中：

- $\alpha\in(0,1]$：宽度乘数，所有层的通道数乘以 $\alpha$；$\rho\in(0,1]$：分辨率乘数，输入分辨率缩小到原来的 $\rho$ 倍
- 计算量约按 $\alpha^2\rho^2$ 缩小 (宽度乘数使 pointwise 层按 $\alpha^2$ 缩小)，参数量约按 $\alpha^2$ 缩小
- 这两个旋钮可以在精度和速度之间平滑折中，不用重新设计网络

## 结构与效果

层类型 | 占计算量 | 占参数量
-- | -- | --
$1\times1$ 卷积 (pointwise) | 约 94.9% | 约 74.6%
$3\times3$ depthwise 卷积 | 约 3.1% | 约 1.1%
全连接 | 约 0.2% | 约 24.3%
标准 $3\times3$ 首层卷积 | 约 1.7% | 约 0.03%

表中：数据来自论文，说明 MobileNet V1 的计算几乎都在 $1\times1$ 卷积上，它是矩阵乘法 (GEMM) 形式，容易被优化；depthwise 卷积本身计算量很小，但访存比高，在实际硬件上不一定同比例加速。

模型 | 输入 | 参数量 | MACs | ImageNet top-1
-- | -- | -- | -- | --
MobileNet 1.0 | 224 | 4.2 M | 569 M | 70.6%
MobileNet 0.75 | 224 | 2.6 M | 325 M | 68.4%
MobileNet 0.5 | 224 | 1.3 M | 149 M | 63.7%
MobileNet 0.25 | 224 | 0.5 M | 41 M | 50.6%
MobileNet 1.0 | 128 | 4.2 M | 186 M | 64.4%

表中：前四行改变宽度乘数 $\alpha$，最后一行改变输入分辨率 (即 $\rho$)；精度随宽度乘数下降得比计算量慢得多，说明在移动端「缩小宽度」是有效的折中。作为对比，VGG16 为 $138\text{M}$ 参数、$15.3\text{G}$ MACs，top-1 为 $71.5\%$，MobileNet 精度只低约 $1\%$，计算量只有它的约 $1/27$ `[待核实]`。

## Reference
- 2017 **MobileNet V1** MobileNets: Efficient Convolutional Neural Networks for Mobile Vision Applications [[paper](https://arxiv.org/pdf/1704.04861.pdf)]
- [MobileNets 论文笔记](https://blog.csdn.net/Jesse_Mx/article/details/70766871)
- [深度解读谷歌MobileNet](https://blog.csdn.net/T800GHB/article/details/78879612)
- [Caffe Mobilenet](https://github.com/01org/caffe/wiki/Mobilenet)
- [MobileNets: Open-Source Models for Efficient On-Device Vision](https://ai.googleblog.com/2017/06/mobilenets-open-source-models-for.html)
- [论文记录_MobileNets Efficient Convolutional Neural Networks for Mobile Vision Application](https://blog.csdn.net/u013082989/article/details/77970196)
- [MobileNet论文详解](https://blog.csdn.net/qq_38807688/article/details/84590717)
- [tensorflow/models - Mobilenet v1](https://github.com/tensorflow/models/blob/master/research/slim/nets/mobilenet_v1.md)

