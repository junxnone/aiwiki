---
Title | ML Tasks Image Classification Inception
-- | --
Created @ | `2018-10-31T21:54:28Z`
Last Modify @| `2022-12-24T12:38:37Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/49)

---

# Reference
-  2014 **Inception V1 / GoogleNet** Going deeper with convolutions [[paper](https://arxiv.org/pdf/1409.4842.pdf)]
- 2015 **Inception V2 & V3** Rethinking the Inception Architecture for Computer Vision [[paper](https://arxiv.org/pdf/1512.00567.pdf)]
- 2016 **Inception V4 & Inception-ResNet**  Inception-v4, Inception-ResNet and the Impact of Residual Connections on Learning [[paper](https://arxiv.org/pdf/1602.07261.pdf)]
- [一文概览Inception家族的「奋斗史」](https://www.chainnews.com/articles/727946354364.htm)
- [图像分类丨Inception家族进化史「GoogleNet、Inception、Xception」](https://www.cnblogs.com/vincent1997/p/10920036.html)

# Brief

- Inception V1 即 GoogLeNet  
  - `GoogLeNet` 是对 `Yann LeCuns` 的 `LeNet` 致敬
- Inception V2 和 V3 是同一篇 paper 提出，各种 Improve 最终版的 V2 即 V3
- Inception V4 和 Inception-ResNet 是同一篇 paper 提出


## Improve

### Inception v1

  - 引入 1x1, 3x3, 5x5 Conv 并行结构 Inception Module
> - 由于图像的突出部分可能有极大的尺寸变化
>   - 全局的信息应该使用大的内核卷积
>   - 局部的信息应该使用小内核卷积

### Inception v2  & Inception v3
- 说明了 Inception Module 设计准则
  - 避免大kernel 导致的表达瓶颈
  - 高维特征更易处理
  - 低维空间聚合无需担心丢失信息
  - 平衡网络宽度和深度
- **使用了Batch Normalization**
- **分解卷积 - Factorizing Convolutions**
  - 使用包括 2 个 3x3 的 卷积 `Mini-network` 替换 5x5 的卷积
  - 任意nxn的卷积都可以通过1xn卷积后接nx1 非对称卷积来替代
- 采用 Conv 和 Pooling 并行的方式来减小特征图大小，减少计算量
  - 先 Pooling 后 Conv 会导致特征表示遇到瓶颈（特征缺失）
  - 先 Conv 后 Pooling 会导致计算量很大
- Label smoothing
  - softmax loss过于注重使模型学习分类出正确的类别, 当在新数据集扩展时, 容易过拟合, 可以使用label的先验分布信息对其loss进行校正
- RMSProp优化器

### Inception v4 & Inception-ResNet
- Inception v4 
  - 修改了Inception的Stem
  - 添加了Reduction Block
- Inception-ResNet v1/v2
  - 添加了 ResNet


