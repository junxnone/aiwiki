---
Title | ML AutoML NAS NASNet
-- | --
Created @ | `2018-11-11T15:24:24Z`
Updated @| `2023-03-25T15:57:26Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/395)

---

# NASNet

- Learning Transferable Architectures for Scalable Image Recognition
- 基于 [Neural Architecture Search with Reinforcement Learning](https://arxiv.org/abs/1611.01578)
- `Normal Cell` - 输入和输出的特征图维度相同
- `Reduction Cell` - 输出特征图长宽减半
- NASNet Search Space
- ScheduledDropPath
- AO - `RL` + `Policy Gradient`


## Arch
- `Model` = `Normal Cell` x N + `Reduction Cell` x M
- `Normal/Reduction Cell` = `Block` x B
>  在 paper 中 B = 5
- `Block` = `hidden states` x 2 + `Operation` x 3 

Arch | Blocks
-- | --
![image](https://user-images.githubusercontent.com/2216970/88145877-b3c75080-cc2d-11ea-96ab-f21bc3ad0b51.png) | ![image](https://user-images.githubusercontent.com/2216970/88146520-934bc600-cc2e-11ea-8830-2e7e22830097.png)

Cell = `B Block` / Each Block predict 5 Steps |
-- | 
![image](https://user-images.githubusercontent.com/2216970/88147063-461c2400-cc2f-11ea-9c85-99751f098edc.png)

Step 3/4 可选 Operations | Step 5 可选 Operation / Combine two hidden states 
-- | --
identity  | element-wise addition 
1x3 then 3x1 convolution | concatenation 
1x7 then 7x1 convolution 
3x3 dilated convolution
3x3 average pooling 
3x3 max pooling
5x5 max pooling 
7x7 max pooling
1x1 convolution 
3x3 convolution
3x3 depthwise-separable conv 
5x5 depthwise-seperable conv
7x7 depthwise-separable conv

## Search Result `NASNet-A/B/C`

Name | Description
-- | --
NASNet-A | - B=5 
NASNet-B | - B=4 <br>-  最后没有Concatenate <br>-  `Layer Normalization` & `Instance Normalization` 
NASNet-C | - B=4 <br>-  `Layer Normalization` & `Instance Normalization`

搜素到的相对比较好的 `Normal Cell` & `Reduction Cell`  - NASNet-A
-- |
![image](https://user-images.githubusercontent.com/2216970/88151430-45868c00-cc35-11ea-951d-c8139a92f44d.png)

NASNet-B | NASNet-C
-- | --
![image](https://user-images.githubusercontent.com/2216970/88152213-4bc93800-cc36-11ea-898f-4019255a70da.png) | ![image](https://user-images.githubusercontent.com/2216970/88152270-5daadb00-cc36-11ea-8642-48a967a24d4a.png)


> Layer Normalization 
> Instance Normalization


## Reference

- [paper - 2017 - Learning Transferable Architectures for Scalable Image Recognition](https://arxiv.org/pdf/1707.07012.pdf)
- [TensorFlow-Slim NASNet-A Implementation/Checkpoints
](https://github.com/tensorflow/models/tree/master/research/slim/nets/nasnet)
- [NASNet学习笔记](https://blog.csdn.net/xjz18298268521/article/details/79079008)
- [论文笔记-NAS](https://zhuanlan.zhihu.com/p/47221948)
- [论文笔记-NASNet](https://zhuanlan.zhihu.com/p/47246311)
- [AutoMl及NAS概述：更有效地设计神经网络模型工具](https://baijiahao.baidu.com/s?id=1611550014520179332&wfr=spider&for=pc)
- [神经网络架构搜索（NAS）综述（附AutoML资料推荐）](https://baijiahao.baidu.com/s?id=1610377335349935453&wfr=spider&for=pc)
- [【Transferable NAS with RL】2018-CVPR-Learning Transferable Architectures for Scalable Image Recognition-论文阅读](https://www.cnblogs.com/chenbong/p/13098483.html)
- [NASNet - pytorch](https://github.com/aussetg/nasnet.pytorch)
