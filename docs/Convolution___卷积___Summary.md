---
Title | Convolution - 卷积 - Summary
-- | --
Create Date | `2021-09-01T01:50:16Z`
Update Date | `2021-09-01T01:50:16Z`
---
> 深度学习领域的卷积本质上是信号/图像处理领域内的互相关（cross-correlation）

- 在深度学习中，卷积中的过滤器不经过反转。严格来说，这是互相关。我们本质上是执行逐元素乘法和加法.


# Reference
- [ ] [关于深度学习中的卷积，这些是你该懂得！](https://mp.weixin.qq.com/s?__biz=MzU2MTgxNTE1Nw==&mid=2247483771&idx=1&sn=e66b6121691f88e2c4f63deef2a314ea&chksm=fc724a61cb05c3773ed73517e2987b4388758518d15ba6d68e829dfa48fd5a593a3d63703cd0&mpshare=1&scene=1&srcid=#rd)
- [ ] [直观理解深度学习卷积部分](https://www.leiphone.com/news/201807/RQ4sBWYqLkGV4ZAW.html)
- [ ] [如何理解深度学习中的卷积？](https://blog.csdn.net/jzrita/article/details/79242004)
- [ ] [理解图像卷积操作的意义](https://blog.csdn.net/chaipp0607/article/details/72236892?locationNum=9&fps=1)
- [ ] [paper - A guide to convolution arithmetic for deep learning](https://arxiv.org/abs/1603.07285)
  - [ ] [Convolution arithmetic](https://github.com/vdumoulin/conv_arithmetic)
- [ ] [paper - Multi-scale context aggregation by dilated convolutions](https://arxiv.org/pdf/1511.07122.pdf)
- [ ] [【译】Multi-Scale Context Aggregation by Dilation Convolutions(空洞卷积)](https://blog.csdn.net/qq_21167623/article/details/80923537)
- [ ] [对深度可分离卷积、分组卷积、扩张卷积、转置卷积（反卷积）的理解](https://www.cnblogs.com/marsggbo/p/9737991.html)
- [ ] [卷积感受野计算](https://www.cnblogs.com/makefile/p/receptive-field.html)
- [ ] [关于感受野的理解与计算](https://www.jianshu.com/p/9997c6f5c01e)



#  2D 卷积  & 3D 卷积

- 2D 卷积过滤器深度与输入层深度一样。这个 3D 过滤器仅沿两个方向移动（图像的高和宽）。这种操作的输出是一张 2D 图像（仅有一个通道）。
- 3D 卷积的过滤器深度小于输入层深度（核大小<通道大小），在所有三个方向（图像的高度、宽度、通道）上移动。输出是一个 3D 数据。
![image](https://user-images.githubusercontent.com/2216970/59156307-98ea5900-8acb-11e9-88da-5672604110a1.png)

# 转置卷积 - 去卷积 - 反卷积
- Sementation 中 UpSampling 上采样恢复原图大小

## 扩张卷积 - Dilated Convolutions
> 膨胀卷积 - 空洞卷积 - Atrous Convolutions(DeepLab)

- 在标准的卷积核中注入空洞来增加感受野
> 多了一个参数 `dilation rate`：卷积核的点的间隔数量
- 用于解决反卷积中丢失部分空间信息的问题


扩张卷积就是通过在核元素之间插入空格来使核「膨胀」。新增的参数 l（扩张率）表示我们希望将核加宽的程度。

![dilation](https://user-images.githubusercontent.com/2216970/69900620-c0eab300-13b0-11ea-96c9-30698c1ef5d7.gif)


# 可分卷积
- 空间可分卷积
- 深度可分卷积

# depthwise convolution & pointwise convolution 
> 使用典型例子见 MobileNet

- standard convolution
> ![image](https://user-images.githubusercontent.com/2216970/59370080-5bf4bf80-8d74-11e9-958b-e5346b0f14c3.png)
- depthwise separable convolution 
> ![image](https://user-images.githubusercontent.com/2216970/59370092-61eaa080-8d74-11e9-8196-0bc36c4a54dc.png)
- pointwise convolution
> ![image](https://user-images.githubusercontent.com/2216970/59370105-67e08180-8d74-11e9-9ee0-c20f865cd352.png)

>> depthwise convolution 和 pointwise convolution 拼接起来，就是一个 depthwise separable convolution

# 分组卷积



# 不同的卷积核的意义

# 为什么大部分基于卷积的深层网络都在用小卷积核？
ImageNet ILSVRC 2014 上，VGGNet paper 中提出：
> This (stack of three 3 × 3 conv layers) can be seen as imposing a regularisation on the 7 × 7 conv. filters, forcing them to have a decomposition through the 3 × 3 filters (with non-linearity injected in between).
>> 7 x 7 的卷积层的正则等效于 3 个 3 x 3 的卷积层的叠加

这样的设计的优点：
- 大幅度的减少参数
- 引入更多非线性，提高决策函数判决力

# 为什么CNN需要固定输入大小？
- 卷积层和池化层的输出尺寸都是和输入尺寸相关的，它们的输入是不需要固定图片尺寸的，真正需要固定尺寸的是最后的全连接层。
- 由于FC层的存在，普通的CNN通过固定输入图片的大小来使得全连接层输入固定。

![image](https://user-images.githubusercontent.com/2216970/69900942-090bd480-13b5-11ea-8318-f136f2d194ae.png)

---
**解决方案**
- 1. resize/crop 到固定大小
- 2. spatial pyramid pooling layer


