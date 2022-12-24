---
Title | ML Tasks Image Classification VGGNet
-- | --
Created @ | `2018-10-31T22:41:35Z`
Last Modify @| `2022-12-24T12:38:24Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/146)

---
## Reference
- 2014 **VGGNet** Very Deep Convolutional Networks for Large-Scale Image Recognition [[paper](https://arxiv.org/abs/1409.1556)] [[code]())
- [VGGNet网络结构](https://blog.csdn.net/dcrmg/article/details/79254654)
- [神经网络中卷积层的堆叠](https://blog.csdn.net/v1_vivian/article/details/77776886)
- [卷积神经网络之VGG](https://www.cnblogs.com/wangguchangqing/p/10338560.html)
- [tensorflow（八）tensorflow加载VGG19模型数据并可视化每一层的输出](https://blog.csdn.net/missayaaa/article/details/80251823)
- [经典神经网络 VGG 论文解读](https://blog.csdn.net/briblue/article/details/83792394)
- [VGG16学习笔记](http://deanhan.com/2018/07/26/vgg16/)

## Brief
- VGGNet 
  - 牛津大学 `Visual Geometry Group`
  - 2014年ImageNet亚军
- 基于 AlexNet 改进
  - 使用了同样大小的3*3卷积核尺寸和2*2最大池化尺寸，网络结果简洁。
- VGGNet最明显的改进就是降低了卷积核的尺寸，增加了卷积的层数。
- VGG中使用的都是3×3卷积核，并且使用了连续多个卷积层。
> ![image](https://user-images.githubusercontent.com/2216970/59977995-5b78e600-960a-11e9-99fe-d7898270a597.png)
- 小池化核，使用的是2×2
- 通道数更多，特征度更宽
- 层数更深
- 全连接转卷积
> ![image](https://user-images.githubusercontent.com/2216970/59978013-8bc08480-960a-11e9-9f09-3172554bb96c.png)

## Arch
VGG16包含16层，VGG19包含19层。一系列的VGG在最后三层的全连接层上完全一样，整体结构上都包含5组卷积层，卷积层之后跟一个MaxPool。所不同的是5组卷积层中包含的级联的卷积层越来越多。

- VGG16 : 16 weight layer (D)
- VGG19 : 19 weight layer (E)
![image](https://user-images.githubusercontent.com/2216970/55524377-bb24bc80-56bf-11e9-982d-637821f2751d.png)

## VGG16
VGG16 是由13个卷积层+3个全连接层叠加而成。

![image](https://user-images.githubusercontent.com/2216970/55460447-962f3b80-5624-11e9-938b-f09a8be50646.png)
![image](https://user-images.githubusercontent.com/2216970/55524991-ced12280-56c1-11e9-9ce1-c892126cbdcd.png)

###  keras -> vgg16
```
import keras
model = keras.applications.vgg16.VGG16(include_top=True, weights='imagenet', input_tensor=None, input_shape=None, pooling=None, classes=1000)
model.summary()
```
```
Layer (type)                 Output Shape              Param #   
=================================================================
input_1 (InputLayer)         (None, 224, 224, 3)       0         
_________________________________________________________________
block1_conv1 (Conv2D)        (None, 224, 224, 64)      1792      
_________________________________________________________________
block1_conv2 (Conv2D)        (None, 224, 224, 64)      36928     
_________________________________________________________________
block1_pool (MaxPooling2D)   (None, 112, 112, 64)      0         
_________________________________________________________________
block2_conv1 (Conv2D)        (None, 112, 112, 128)     73856     
_________________________________________________________________
block2_conv2 (Conv2D)        (None, 112, 112, 128)     147584    
_________________________________________________________________
block2_pool (MaxPooling2D)   (None, 56, 56, 128)       0         
_________________________________________________________________
block3_conv1 (Conv2D)        (None, 56, 56, 256)       295168    
_________________________________________________________________
block3_conv2 (Conv2D)        (None, 56, 56, 256)       590080    
_________________________________________________________________
block3_conv3 (Conv2D)        (None, 56, 56, 256)       590080    
_________________________________________________________________
block3_pool (MaxPooling2D)   (None, 28, 28, 256)       0         
_________________________________________________________________
block4_conv1 (Conv2D)        (None, 28, 28, 512)       1180160   
_________________________________________________________________
block4_conv2 (Conv2D)        (None, 28, 28, 512)       2359808   
_________________________________________________________________
block4_conv3 (Conv2D)        (None, 28, 28, 512)       2359808   
_________________________________________________________________
block4_pool (MaxPooling2D)   (None, 14, 14, 512)       0         
_________________________________________________________________
block5_conv1 (Conv2D)        (None, 14, 14, 512)       2359808   
_________________________________________________________________
block5_conv2 (Conv2D)        (None, 14, 14, 512)       2359808   
_________________________________________________________________
block5_conv3 (Conv2D)        (None, 14, 14, 512)       2359808   
_________________________________________________________________
block5_pool (MaxPooling2D)   (None, 7, 7, 512)         0         
_________________________________________________________________
flatten (Flatten)            (None, 25088)             0         
_________________________________________________________________
fc1 (Dense)                  (None, 4096)              102764544 
_________________________________________________________________
fc2 (Dense)                  (None, 4096)              16781312  
_________________________________________________________________
predictions (Dense)          (None, 1000)              4097000   
=================================================================
Total params: 138,357,544
Trainable params: 138,357,544
Non-trainable params: 0
_________________________________________________________________
```
## VGG19



