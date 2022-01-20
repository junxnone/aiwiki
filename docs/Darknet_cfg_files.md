---
Title | Darknet cfg files
-- | --
Create Date | `2020-01-29T11:56:37Z`
Update Date | `2022-01-20T08:16:19Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/262)

---
## Reference
- [pytorch实现yolov3(2) 配置文件解析及各layer生成](https://www.cnblogs.com/sdu20112013/p/11099244.html)
- [CFG Parameters in the [net] section](https://github.com/AlexeyAB/darknet/wiki/CFG-Parameters-in-the-%5Bnet%5D-section)
- [CFG Parameters in the different layers](https://github.com/AlexeyAB/darknet/wiki/CFG-Parameters-in-the-different-layers)

## Brief

Name | Description
-- | -- 
**[net]** | model input, 参数等
**[convolutional]** | convolutional layer - 卷积层
**[shortcut]** | 类似 `ResNet skip connection/residual connection` <br>两layer逐元素加, 前一层和 `from=` 指定的层
**[upsample]** | 双线性插值增加上采样 `new_w = w*stride, new_h = h*stride`
**[route]** | concatenation layer, 连接 (`concat` 方式) 指定 `layer`<br>`layer=` - 大于0 绝对 layer 小于0 - 相对 layer
**[yolo]** |  detection layer for Yolo v3
[Gaussian_yolo] | Gaussian yolo v3 中的 yolo layer
[connected] | fully connected layer
[avgpool] |  average pooling layer input `W x H x C` -> output `1 x 1 x C`
[batchnorm] | separate Batch-normalization layer
[cost] | cost layer calculates (linear)Delta and (squared)Loss
[crnn] | convolutional RNN-layer (recurrent)
[crop] | yolo v1
[detection] | yolo v1
[dropout] | dropout layer
[gru] | fully connected GRU-layer (recurrent)
[local] | yolo v1 v2 中使用
[lstm] | fully connected LSTM-layer (recurrent)
[maxpool] | max-pooling layer (the maximum value)
[region] | 在 yolo v1 v2 以及相关的 tiny 中类似 `yolo`
[reorg] | OLD reorg layer from Yolo v2
[reorg3d] | reorg layer (resize W x H x C)
[rnn] | fully connected RNN-layer (recurrent)
[scale_channels] | scales channels (squeeze-and-excitation blocks)
[softmax] | SoftMax CE (cross entropy) layer 


## `[net]`

### Input
Parameter | Description
-- | --
batch=64 | 这儿batch与机器学习中的batch有少许差别，仅表示网络积累多少个样本后进行一次BP 
subdivisions=16 | 这个参数表示将一个batch的图片分sub次完成网络的前向传播<br>`mini_batch = batch/subdivisions`
width=608 | 网络输入图片宽
height=608 | 网络输入图片高
channels=3 | 网络输入的通道数channels

### Learning
Parameter | Description
-- | --
momentum=0.9 | 动量参数, 类似滤波参数
decay=0.0005 | 权重衰减正则项，防止过拟合
learning_rate=0.001 | 初始学习率
burn_in=1000 | 前 1000 iterations 使用特殊方式调整 lr  <br>`current_lr = lr * pow(iterations / burn_in, power)` <br>`= 0.001 * pow(iterations/1000, 4)`
max_batches = 500200 | 最大训练次数，达到此值后停止训练
policy=steps | 学习率改变的策略, 可选参数: <br>`constant (by default), sgdr, steps, step, sig, exp, poly, random`
steps=400000,450000 |  对应 `policy=steps` , 和 `scales` 值 相对应
scales=.1,.1 |  `current_lr-n = lr * scales[0] * ... * scales[n]` <br> 若 `n=1, iterations = 450000`<br>则 `currnet_lr =  0.001 * 0.1 * 0.1 = 0.00001`

### Augment
Parameter | Description
-- | --
angle=0 | 旋转角度
saturation = 1.5 | 调整饱和度
exposure = 1.5 | 调整曝光量
hue=.1 | 调整色调
mixup=1 |
mosaic=1 |
cutmix=1 |
blur=1 |

## `[convolutional]`

Parameter | Description | default
-- | -- | --
batch_normalize=1 | 是否使用 BN | 0
filters=64 | kernel filters 数量 | 1
size=3 | kernel size | 1
groups = 32 | number of groups for grouped-convolutional (depth-wise)  | 1
stride=1 | stride (offset step) of kernel filter | 1
padding=1 | size of padding | 0 
pad=1 |  1 -  `padding = size/2`<br> 0 -  `padding=0` | 0 
dilation=1 | size of dilation | 1
activation=leaky | activation function after convolution <br>logistic, loggy, relu, elu, selu, relie, plse, hardtan, lhtan, linear, ramp, leaky, tanh, stair | logistic 

## `[yolo]`

Parameter | Description 
-- | -- 
mask | 在当前 layer 起作用的 anchors
anchors | 通过聚类获取的 bbox 大小
num=9 | anchors 数量
classes | 目标数量
ignore_thresh = .7 | IoU 阈值大于此值则保留重复检测，并在 NMS 时融合
truth_thresh = 1 | IoU 阈值大于此值则调整重复检测，并在 NMS 时融合
jitter=.3 |  randomly crops and resizes images <br>倍率 - `x(1 - 2*jitter) 到 x(1 + 2*jitter)`
random=1 | randomly resizes


