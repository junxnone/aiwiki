---
Title | ML Convolution DL
-- | --
Created @ | `2018-11-21T03:03:53Z`
Last Modify @| `2022-12-24T12:14:09Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/11)

---
## Reference
- 2016 A guide to convolution arithmetic for deep learning [[paper](https://arxiv.org/abs/1603.07285)] [[Code](https://github.com/vdumoulin/conv_arithmetic)]
- [直观理解深度学习卷积部分](https://www.leiphone.com/news/201807/RQ4sBWYqLkGV4ZAW.html)
- [如何理解深度学习中的卷积？](https://blog.csdn.net/jzrita/article/details/79242004)
- [理解图像卷积操作的意义](https://blog.csdn.net/chaipp0607/article/details/72236892?locationNum=9&fps=1)
- [paper - Multi-scale context aggregation by dilated convolutions](https://arxiv.org/pdf/1511.07122.pdf)
- [Multi-Scale Context Aggregation by Dilation Convolutions](https://blog.csdn.net/qq_21167623/article/details/80923537)
- [对深度可分离卷积、分组卷积、扩张卷积、转置卷积（反卷积）的理解](https://www.cnblogs.com/marsggbo/p/9737991.html)
- [卷积感受野计算](https://www.cnblogs.com/makefile/p/receptive-field.html)
- [关于感受野的理解与计算](https://www.jianshu.com/p/9997c6f5c01e)

## Brief
- 深度学习领域的卷积本质上是`互相关 Cross-correlation`, 过滤器不反转, 逐元素乘法和加法
- 卷积类型
  - 2D/3D 卷积
  - 转置卷积 - Transposed convolution
  - 扩张卷积 - Dilated Convolutions
  - 可分卷积
- 卷积核
- 卷积的用途
  - 提取图像 feature
  - UpSample/DownSample 

##  2D 卷积 



<table style="width:100%; table-layout:fixed;">
  <tr>
    <td><img width="150px" src="https://raw.githubusercontent.com/junxnone/conv_arithmetic/master/gif/no_padding_no_strides.gif"></td>
    <td><img width="150px" src="https://raw.githubusercontent.com/junxnone/conv_arithmetic/master/gif/arbitrary_padding_no_strides.gif"></td>
    <td><img width="150px" src="https://raw.githubusercontent.com/junxnone/conv_arithmetic/master/gif/same_padding_no_strides.gif"></td>
    <td><img width="150px" src="https://raw.githubusercontent.com/junxnone/conv_arithmetic/master/gif/full_padding_no_strides.gif"></td>
  </tr>
  <tr>
    <td>No padding, no strides</td>
    <td>Arbitrary padding, no strides</td>
    <td>Half padding, no strides</td>
    <td>Full padding, no strides</td>
  </tr>
  <tr>
    <td><img width="150px" src="https://raw.githubusercontent.com/junxnone/conv_arithmetic/master/gif/no_padding_strides.gif"></td>
    <td><img width="150px" src="https://raw.githubusercontent.com/junxnone/conv_arithmetic/master/gif/padding_strides.gif"></td>
    <td><img width="150px" src="https://raw.githubusercontent.com/junxnone/conv_arithmetic/master/gif/padding_strides_odd.gif"></td>
    <td></td>
  </tr>
  <tr>
    <td>No padding, strides</td>
    <td>Padding, strides</td>
    <td>Padding, strides (odd)</td>
    <td></td>
  </tr>
</table>

## 3D 卷积


![conv3d](https://user-images.githubusercontent.com/2216970/131626307-c5619328-7718-4eab-aa68-d0db5ec69ab7.gif)

## 转置卷积  - Transposed convolution
- 又名 `去卷积`/`反卷积`
- **用途**
  - Sementation 中 UpSampling 上采样恢复原图大小

<table style="width:100%; table-layout:fixed;">
  <tr>
    <td><img width="150px" src="https://raw.githubusercontent.com/junxnone/conv_arithmetic/master/gif/no_padding_no_strides_transposed.gif"></td>
    <td><img width="150px" src="https://raw.githubusercontent.com/junxnone/conv_arithmetic/master/gif/arbitrary_padding_no_strides_transposed.gif"></td>
    <td><img width="150px" src="https://raw.githubusercontent.com/junxnone/conv_arithmetic/master/gif/same_padding_no_strides_transposed.gif"></td>
    <td><img width="150px" src="https://raw.githubusercontent.com/junxnone/conv_arithmetic/master/gif/full_padding_no_strides_transposed.gif"></td>
  </tr>
  <tr>
    <td>No padding, no strides, transposed</td>
    <td>Arbitrary padding, no strides, transposed</td>
    <td>Half padding, no strides, transposed</td>
    <td>Full padding, no strides, transposed</td>
  </tr>
  <tr>
    <td><img width="150px" src="https://raw.githubusercontent.com/junxnone/conv_arithmetic/master/gif/no_padding_strides_transposed.gif"></td>
    <td><img width="150px" src="https://raw.githubusercontent.com/junxnone/conv_arithmetic/master/gif/padding_strides_transposed.gif"></td>
    <td><img width="150px" src="https://raw.githubusercontent.com/junxnone/conv_arithmetic/master/gif/padding_strides_odd_transposed.gif"></td>
    <td></td>
  </tr>
  <tr>
    <td>No padding, strides, transposed</td>
    <td>Padding, strides, transposed</td>
    <td>Padding, strides, transposed (odd)</td>
    <td></td>
  </tr>
</table>

## 扩张卷积 - Dilated Convolutions
- 又名 `膨胀卷积/空洞卷积/Atrous Convolutions(DeepLab)`
- 在标准的卷积核中注入空洞来增加感受野(使核膨胀)
- 多一个参数 `dilation rate`：卷积核的点的间隔数量(扩张率表示我们希望将核加宽的程度)
- 用于解决反卷积中丢失部分空间信息的问题

<table style="width:25%"; table-layout:fixed;>
  <tr>
    <td><img width="150px" src="https://raw.githubusercontent.com/junxnone/conv_arithmetic/master/gif/dilation.gif"></td>
  </tr>
  <tr>
    <td>No padding, no stride, dilation</td>
  </tr>
</table>

## 可分卷积
- 空间可分卷积
- 深度可分卷积

## depthwise convolution & pointwise convolution 

> 使用典型例子见 MobileNet

- standard convolution
> ![image](https://user-images.githubusercontent.com/2216970/59370080-5bf4bf80-8d74-11e9-958b-e5346b0f14c3.png)
- depthwise separable convolution 
> ![image](https://user-images.githubusercontent.com/2216970/59370092-61eaa080-8d74-11e9-8196-0bc36c4a54dc.png)
- pointwise convolution
> ![image](https://user-images.githubusercontent.com/2216970/59370105-67e08180-8d74-11e9-9ee0-c20f865cd352.png)

>> depthwise convolution 和 pointwise convolution 拼接起来，就是一个 depthwise separable convolution

## 分组卷积



## 不同的卷积核的意义

### 为什么大部分基于卷积的深层网络都在用小卷积核？

ImageNet ILSVRC 2014 上，VGGNet paper 中提出：
> This (stack of three 3 × 3 conv layers) can be seen as imposing a regularisation on the 7 × 7 conv. filters, forcing them to have a decomposition through the 3 × 3 filters (with non-linearity injected in between).
>> 7 x 7 的卷积层的正则等效于 3 个 3 x 3 的卷积层的叠加

这样的设计的优点：
- 大幅度的减少参数
- 引入更多非线性，提高决策函数判决力

### 为什么CNN需要固定输入大小？
- 卷积层和池化层的输出尺寸都是和输入尺寸相关的，它们的输入是不需要固定图片尺寸的，真正需要固定尺寸的是最后的全连接层。
- 由于FC层的存在，普通的CNN通过固定输入图片的大小来使得全连接层输入固定。

![image](https://user-images.githubusercontent.com/2216970/69900942-090bd480-13b5-11ea-8318-f136f2d194ae.png)

---
**解决方案**
- 1. resize/crop 到固定大小
- 2. spatial pyramid pooling layer


