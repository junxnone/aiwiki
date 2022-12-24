---
Title | ML Tasks Image Classification MobileNet
-- | --
Created @ | `2018-09-27T06:12:31Z`
Last Modify @| `2022-12-24T12:41:36Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/45)

---
# Reference
- 2017 **MobileNet V1** MobileNets: Efficient Convolutional Neural Networks for Mobile Vision Applications [[paper](https://arxiv.org/pdf/1704.04861.pdf)]
- 2018 **MobileNet V2** MobileNetV2: Inverted Residuals and Linear Bottlenecks [[paper](https://arxiv.org/pdf/1801.04381.pdf)]
- 2019 **MobileNet V3** Searching for MobileNetV3 [[paper](https://arxiv.org/pdf/1905.02244.pdf)]
- [MobileNets 论文笔记](https://blog.csdn.net/Jesse_Mx/article/details/70766871)
- [深度解读谷歌MobileNet](https://blog.csdn.net/T800GHB/article/details/78879612)
- [Caffe Mobilenet](https://github.com/01org/caffe/wiki/Mobilenet)
- [MobileNets: Open-Source Models for Efficient On-Device Vision](https://ai.googleblog.com/2017/06/mobilenets-open-source-models-for.html)
- [论文记录_MobileNets Efficient Convolutional Neural Networks for Mobile Vision Application](https://blog.csdn.net/u013082989/article/details/77970196)
- [MobileNet论文详解](https://blog.csdn.net/qq_38807688/article/details/84590717)
- [MobileNet V2 论文初读](https://zhuanlan.zhihu.com/p/33075914)
- [轻量化网络：MobileNet-V2](https://blog.csdn.net/u011995719/article/details/79135818)
- [目标检测：Mobilenet-SSD实现步骤](https://blog.csdn.net/Jesse_Mx/article/details/78680055)
- [浅谈SSD检测算法](https://blog.csdn.net/nimo_cap/article/details/82888146)



# Brief

Google针对手机等嵌入式设备提出的一系列轻量级的深层神经网络，取名为MobileNet. 
目前有三个版本：v1/v2/v3

- **加速深度模型:** 不影响准确率的前提下减少参数数量，进而减少计算时间
  - **MobileNet v1** 利用了深度可分离卷积提高了计算效率
  - **MobileNet v2** 加入了线性bottlenecks和反转残差模块构成了高效的基本模块。


Name | Description
-- | --
MobileNet V1 |  可分卷积
MobileNet V2 |  线性 Bottlenecks & 反转残差模块
MobileNet V3 |  NAS



