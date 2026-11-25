-----

| Title     | ML Tasks Image Classification MobileNet              |
| --------- | ---------------------------------------------------- |
| Created @ | `2018-09-27T06:12:31Z`                               |
| Updated @ | `2026-11-25T16:51:20Z`                               |
| Labels    | \`\`                                                 |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/45) |

-----

# MobileNet

## Reference

  - 2017 **MobileNet V1** MobileNets: Efficient Convolutional Neural
    Networks for Mobile Vision Applications
    \[[paper](https://arxiv.org/pdf/1704.04861.pdf)\]
  - 2018 **MobileNet V2** MobileNetV2: Inverted Residuals and Linear
    Bottlenecks \[[paper](https://arxiv.org/pdf/1801.04381.pdf)\]
  - 2019 **MobileNet V3** Searching for MobileNetV3
    \[[paper](https://arxiv.org/pdf/1905.02244.pdf)\]
  - [MobileNets
    论文笔记](https://blog.csdn.net/Jesse_Mx/article/details/70766871)
  - [深度解读谷歌MobileNet](https://blog.csdn.net/T800GHB/article/details/78879612)
  - [Caffe Mobilenet](https://github.com/01org/caffe/wiki/Mobilenet)
  - [MobileNets: Open-Source Models for Efficient On-Device
    Vision](https://ai.googleblog.com/2017/06/mobilenets-open-source-models-for.html)
  - [论文记录\_MobileNets Efficient Convolutional Neural Networks for Mobile
    Vision
    Application](https://blog.csdn.net/u013082989/article/details/77970196)
  - [MobileNet论文详解](https://blog.csdn.net/qq_38807688/article/details/84590717)
  - [MobileNet V2 论文初读](https://zhuanlan.zhihu.com/p/33075914)
  - [轻量化网络：MobileNet-V2](https://blog.csdn.net/u011995719/article/details/79135818)
  - [目标检测：Mobilenet-SSD实现步骤](https://blog.csdn.net/Jesse_Mx/article/details/78680055)
  - [浅谈SSD检测算法](https://blog.csdn.net/nimo_cap/article/details/82888146)

## Brief

Google针对手机等嵌入式设备提出的一系列轻量级的深层神经网络，取名为MobileNet. 目前有三个版本：v1/v2/v3

  - **加速深度模型:** 不影响准确率的前提下减少参数数量，进而减少计算时间
      - **MobileNet v1** 利用了深度可分离卷积提高了计算效率
      - **MobileNet v2** 加入了线性bottlenecks和反转残差模块构成了高效的基本模块。

| Name         | Description             |
| ------------ | ----------------------- |
| MobileNet V1 | 可分卷积                    |
| MobileNet V2 | 线性 Bottlenecks & 反转残差模块 |
| MobileNet V3 | NAS                     |

## 三代演进

下图展示三个版本逐步叠加的技术：

``` mermaid
flowchart LR
    A[V1<br>depthwise + pointwise] --> B[V2<br>+ 倒残差 + 线性瓶颈]
    B --> C[V3<br>+ NAS + SE + h-swish]
```

图中：箭头表示在前一个版本的基础上增加的技术；每一代的基本单元仍然是深度可分离卷积，见
[Xception](/0050_ML_Tasks_Image_Classification_Xception) 中它的原理。

## 对比

| 版本                                                           | 年份   | 基本块                      | 参数量   | MACs  | top-1 |
| ------------------------------------------------------------ | ---- | ------------------------ | ----- | ----- | ----- |
| [V1](/0042_ML_Tasks_Image_Classification_MobileNet_V1)       | 2017 | depthwise + pointwise    | 4.2 M | 569 M | 70.6% |
| [V2](/0043_ML_Tasks_Image_Classification_MobileNet_V2)       | 2018 | 倒残差 + 线性瓶颈               | 3.4 M | 300 M | 72.0% |
| [V3-Large](/0044_ML_Tasks_Image_Classification_MobileNet_V3) | 2019 | V2 + SE + h-swish，NAS 搜索 | 5.4 M | 219 M | 75.2% |
| [V3-Small](/0044_ML_Tasks_Image_Classification_MobileNet_V3) | 2019 | 同上，更小                    | 2.9 M | 66 M  | 67.4% |

表中：参数量、MACs 和 top-1 都是论文在 $224\\times224$ 输入下的数字；MACs
是乘加次数，可以近似理解为计算量。三代都是 Google
针对手机等嵌入式设备设计的，目标是精度基本不变的前提下减少参数和计算。

## 选用建议

  - 需要极简结构、容易部署：V1，没有 shortcut，算子只有卷积和 ReLU
  - 通用移动端分类/检测 backbone：V2，生态最成熟 (如 MobileNet-SSD)
  - 追求精度/延迟折中：V3；注意 h-swish 和 SE 在某些推理引擎里支持不好，量化时要核对
  - 部署到 Intel 平台时的量化与压缩见 [Quantization](/0312_MO_Quantization)
