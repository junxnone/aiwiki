---
Title | ML Tasks Image Classification VGGNet
-- | --
Created @ | `2018-10-31T22:41:35Z`
Updated @| `2026-11-26T01:26:18Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/146)

---
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





VGG19 与 VGG16 的区别只是在第 3、4、5 组卷积里各多一个 $3\times3$ 卷积，共 16 个卷积层 + 3 个全连接层，参数约 $143.7\text{M}$ `[待核实]`。

## 为什么用小卷积核堆叠

$$
\underbrace{3\times3 \to 3\times3}_{\text{感受野 }5\times5},\qquad
\underbrace{3\times3 \to 3\times3 \to 3\times3}_{\text{感受野 }7\times7}
$$

$$
\text{Params}_{3\times(3\times3)}=3\times(3^2C^2)=27C^2,\qquad
\text{Params}_{7\times7}=7^2C^2=49C^2
$$

其中：

- 两个 $3\times3$ 卷积叠加的感受野等于一个 $5\times5$，三个叠加等于一个 $7\times7$
- $C$：输入和输出通道数 (这里假设相同，忽略偏置)
- 三个 $3\times3$ 的参数量为 $27C^2$，一个 $7\times7$ 为 $49C^2$，参数少约 45%
- 同时多了 2 个 ReLU 非线性层，表达能力更强，决策函数更有区分度

## 参数量与分布

分组 | 层 | 参数量
-- | -- | --
block1 | conv$\times$2 ($64$ 通道) | $1{,}792+36{,}928=38{,}720$
block2 | conv$\times$2 ($128$) | $73{,}856+147{,}584=221{,}440$
block3 | conv$\times$3 ($256$) | $295{,}168+590{,}080\times2=1{,}475{,}328$
block4 | conv$\times$3 ($512$) | $1{,}180{,}160+2{,}359{,}808\times2=5{,}899{,}776$
block5 | conv$\times$3 ($512$) | $2{,}359{,}808\times3=7{,}079{,}424$
卷积合计 | | **14,714,688**
fc1 | $25088\to4096$ | 102,764,544
fc2 | $4096\to4096$ | 16,781,312
fc3 | $4096\to1000$ | 4,097,000
全连接合计 | | **123,642,856**
总计 | | **138,357,544**

表中：数字来自上面 keras 的 `model.summary()`；卷积部分只有约 $14.7\text{M}$ 参数，而全连接层占约 $89\%$，其中 `fc1` 的 $25088=7\times7\times512$ 个输入乘以 $4096$ 个神经元就占了总参数的 $74\%$。

## 全连接转卷积

- fc1 可以看作一个 $7\times7$ 的卷积 (输出通道 $4096$)，fc2、fc3 看作 $1\times1$ 卷积
- 转成卷积网络后，输入图像不必固定为 $224\times224$：输入更大时输出是一张类别得分图，再对空间做平均就得到分类结果，称为稠密评估 (dense evaluation)
- 这种「全卷积」思路是后续 [FCN](/0160_ML_Tasks_Image_Segmentation_FCN) 做分割的起点

## 配置总览

配置 | 带权重层数 | 说明
-- | -- | --
A | 11 | 8 conv + 3 fc
B | 13 | A 的基础上每组加一个 conv
C | 16 | 在 B 的后三组加 $1\times1$ conv
D (VGG16) | 16 | 把 C 的 $1\times1$ 换成 $3\times3$
E (VGG19) | 19 | D 的后三组各再加一个 $3\times3$

表中：论文共比较了 A 到 E 五种配置，层数越深错误率越低，说明深度本身是提升精度的关键；A-LRN 配置加入了 [AlexNet](/0027_ML_Tasks_Image_Classification_AlexNet) 的 LRN，结果没有提升。

## 小结

- 优点：结构规整，只用 $3\times3$ 卷积和 $2\times2$ 池化，容易复现，特征提取能力强，至今仍常作为感知损失、风格迁移和检测网络的 backbone
- 缺点：参数多 (138M)，全连接层占大头；计算量大 (VGG16 约 $15.5\text{G}$ MACs `[待核实]`)；没有残差连接，再加深会难以训练，后续由 [ResNet](/0051_ML_Tasks_Image_Classification_ResNet) 解决

## Reference
- 2014 **VGGNet** Very Deep Convolutional Networks for Large-Scale Image Recognition [[paper](https://arxiv.org/abs/1409.1556)] [[code]())
- [VGGNet网络结构](https://blog.csdn.net/dcrmg/article/details/79254654)
- [神经网络中卷积层的堆叠](https://blog.csdn.net/v1_vivian/article/details/77776886)
- [卷积神经网络之VGG](https://www.cnblogs.com/wangguchangqing/p/10338560.html)
- [tensorflow（八）tensorflow加载VGG19模型数据并可视化每一层的输出](https://blog.csdn.net/missayaaa/article/details/80251823)
- [经典神经网络 VGG 论文解读](https://blog.csdn.net/briblue/article/details/83792394)
- [VGG16学习笔记](http://deanhan.com/2018/07/26/vgg16/)

