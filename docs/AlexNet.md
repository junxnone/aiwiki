---
Title | AlexNet
-- | --
Create Date | `2021-09-17T01:17:09Z`
Update Date | `2021-09-17T01:17:09Z`
---
# Reference
- 2012 **AlexNet** ImageNet Classification with Deep Convolutional Neural Networks [[paper](http://www.cs.toronto.edu/~fritz/absps/imagenet.pdf)]
- [5.6. 深度卷积神经网络AlexNet - 动手学深度学习](https://zh.d2l.ai/chapter_convolutional-neural-networks/alexnet.html)
- [深入理解AlexNet网络](https://blog.csdn.net/luoluonuoyasuolong/article/details/81750190)
- [卷积神经网络之AlexNet](https://www.cnblogs.com/wangguchangqing/p/10333370.html)

# Brief
- 2012 ImageNet 图像识别挑战赛冠军，以一作 `Alex Krizhevsky` 命名 `AlexNet`
- `Conv Layer` x 8 + `FC Layer` x 2
- +`Max Pooling`
- +`Dropout` 减少复杂度
- +`ReLU` 计算量小，更易训练
- +`Image Aug` 减少过拟合

##  Input Image preprocess
- **Training:** Resize + Center Crop + Random Crop

```  
1 取最小边 resize 到 256(保持长宽比)
2 取中心 crop 256x256
3 random crop 224x224
```

- **Testing:** 10 张 224x224 的图片取测试均值(`4个角+中心` 224x224 + `水平翻转`)

```
1 取最小边 resize 到 256(保持长宽比)
2 分别从4个角和中心点取 224x224 图片
3 对5张图片水平翻转，获取 10 张测试图
4 对测试结果的 softmax layer 输出取均值
```
# Layers
> AlexNet包含8层变换，其中有5层卷积和2层全连接隐藏层，以及1个全连接输出层。

![image](https://user-images.githubusercontent.com/2216970/59816202-cd70d700-934d-11e9-8973-c87c25bc8d69.png)


## LRN - Local Response Normalized
