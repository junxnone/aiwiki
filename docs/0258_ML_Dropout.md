---
Title | ML Dropout
-- | --
Created @ | `2019-03-02T04:21:09Z`
Last Modify @| `2022-12-24T12:19:54Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/258)

---
## Reference

- [ Dropout VS Batch Normalization? 是时候放弃Dropout了](http://www.cnblogs.com/hutao722/p/9946047.html)
- [keras - dropout layer](https://keras.io/zh/layers/core/#dropout)
- [Dropout: A Simple Way to Prevent Neural Networks from Overfitting - 2014](http://www.jmlr.org/papers/volume15/srivastava14a/srivastava14a.pdf)

## Brief
- dropout是指在神经网络中丢弃掉一些隐藏或可见单元
- 通常来说，是在神经网络的训练阶段，每一次迭代都会随机选择一批单元，让其被暂时忽略掉，所谓的忽略是不让这些单元参与前向推理和后向传播
- 发生过拟合的情况下才会使用dropout等正则化技术(神经网络过深，或训练时间过长，或没有足够多的数据时)
- 通常，使用20％-50％的舍弃率比较好
  - **概率太低**: 没什么效果
  - **概率太高**: 会导致网络的学习不充分。
- [Multi-Sample Dropout](/Multi_Sample_Dropout)

## Dropout

![image](https://user-images.githubusercontent.com/2216970/53677074-412a9d80-3ce5-11e9-92b1-35ef4559f85f.png) | ![image](https://user-images.githubusercontent.com/2216970/53677075-438cf780-3ce5-11e9-995e-1b1331729120.png) 
-- | --
标准的神经网络 | dropout后


## Dropout正在被抛弃
> Dropout在现代卷积架构中，已经逐步被BN取代，BN也同样拥有不亚于Dropout的正则化效果。
无论是VGG、ResNet、Inception、MobileNetV2等模型，都不见了Dropout踪影。唯独在MobileNetV1模型里，还可以找到Dropout，但不是在卷积层；而且在MobileNetV2后，已经不再有全连接层，而是被全局平均池化层所取代。

Dropout不再受青睐，原因如下：
- Dropout在卷积层的正则效果有限。相比较于全连接层，卷积层的训练参数较少，激活函数也能很好地完成特征的空间转换，因此**正则化效果在卷积层不明显**；
- Dropout也过时了，能发挥其作用的地方在全连接层，可当代的深度网络中，**全连接层也在慢慢被全局平均池化曾所取代**，不但能减低模型尺寸，还可以提升性能。


## Dropout vs Batch Normalization

![image](https://user-images.githubusercontent.com/2216970/53677173-a763f000-3ce6-11e9-8e4d-4c2b8d52c589.png) | ![image](https://user-images.githubusercontent.com/2216970/53677174-ab900d80-3ce6-11e9-8771-d41cef7d9f31.png)
-- | --
各模型的验证准确率 | 各模型的验证损失

> Dropout在不同概率下，其表现差异较大，相对来说，Dropout with 0.2的表现接近于 No bn and dropout（可以理解为Dropout的keep-prob为1的版本）。总体来说，BN在准确率和损失率上表现要优于Dropout，比如准确率上BN能达到85%，而Dropout接近为79%。



