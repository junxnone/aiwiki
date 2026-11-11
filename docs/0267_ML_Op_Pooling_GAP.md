---
Title | ML Op Pooling GAP
-- | --
Created @ | `2019-02-24T14:07:21Z`
Updated @| `2026-11-11T01:07:24Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/267)

---
# Global Average Pooling

Global Average Pooling（GAP）是窗口等于整张特征图的 [Pooling](0268_ML_Op_Pooling)：对每个通道把 $H\times W$ 个值平均成一个标量，输出 $N\times C\times1\times1$。它由 *Network In Network*（Lin 等，2013）提出，用来取代 CNN 末端庞大的全连接层，现已是分类网络（ResNet、MobileNet、EfficientNet 等）的标准配置。

- GAP 的思路是把"全连接层 + dropout"合二为一：本身无参数，对整个网络在结构上做正则化，防止过拟合。
- 直接剔除了全连接层中黑箱的特征，让每个 channel 对应一个类别的置信度图（配合最后 1x1 卷积输出 `num_classes` 个通道时），具有更明确的语义，也便于做 CAM 可视化。
- GAP 可以接受任意大小的输入（输出固定为 1x1xC）。
- 使用 GAP 可能会造成收敛速度减慢。

## 数学定义

$$y_{n,c}=\frac{1}{HW}\sum_{h=1}^{H}\sum_{w=1}^{W}x_{n,c,h,w}$$

- 输入：$(N,C,H,W)$，输出：$(N,C,1,1)$，无参数。
- 反向：$\partial L/\partial x_{n,c,h,w}=\frac{1}{HW}\,\partial L/\partial y_{n,c}$，即梯度均摊到每个空间位置。
- 对比：Global Max Pooling（GMP）取 $\max$，反向只给 argmax 位置；GAP 的梯度稠密均匀，通常更稳定。

## 工作原理

> 假设卷积层的最后输出是 h × w × d 的三维特征图，具体大小为 6 × 6 × 3，经过 GAP 转换后，变成了大小为 1 × 1 × 3 的输出值，也就是每一层 h × w 会被平均化成一个值。

![image](https://user-images.githubusercontent.com/2216970/53677377-c912a680-3ce9-11e9-98f6-9353f6ecae5a.png)
![image](https://user-images.githubusercontent.com/2216970/53300202-ecb79600-387e-11e9-87c7-88db9d60fe70.png)

## PyTorch 用法

```python
import torch, torch.nn as nn

feat = torch.randn(8, 512, 7, 7)
gap = nn.AdaptiveAvgPool2d(1)
v = gap(feat).flatten(1)            # (8, 512)
v2 = feat.mean(dim=(2, 3))          # 等价写法, 导出更简单
logits = nn.Linear(512, 1000)(v)    # 参见 Linear

# 全卷积式分类头: 1x1 conv 输出类别图, 再 GAP
head = nn.Sequential(nn.Conv2d(512, 1000, 1), nn.AdaptiveAvgPool2d(1), nn.Flatten())
```

参数量对比（输入 7x7x512 -> 1000 类）：展平后 FC 需 $7\cdot7\cdot512\cdot1000\approx25.1\text{M}$；GAP 后 FC 仅 $512\cdot1000\approx0.5\text{M}$（VGG 的 FC 占了网络绝大部分参数）。

## 实现与优化

- 本质是对 $HW$ 维的 reduce-mean，访存受限；GPU 上用 warp/block 归约，CPU 上沿 W 连续方向向量化求和。
- NHWC / 块状布局下沿 $C$ 方向向量化更高效。
- 推理中可与前面的算子融合；ONNX 中为 `GlobalAveragePool`，`mean(dim=(2,3))` 导出为 `ReduceMean`，不同后端对两者的优化程度不同。
- 量化：累加需更高位宽再除以 $HW$，一般需要重量化。
- 也可视为 [Linear](0612_ML_Op_Linear) 的特例：固定权重 $1/(HW)$ 的稀疏线性层。
- 相关：Squeeze-and-Excitation 的 squeeze 步骤即 GAP；GeM Pooling 是用可学习 $p$ 的广义均值（$p=1$ 为 GAP，$p\to\infty$ 为 GMP）。

## AP vs MP
![image](https://user-images.githubusercontent.com/2216970/53677458-265b2780-3ceb-11e9-928e-63604259d755.png)

- Average 保留整体背景/上下文信息，Max 保留最显著的纹理/边缘响应；分类末端常用 Average，浅层或需要显著特征时常用 Max。

## GAP vs GMP vs FC
> GMP在本模型中表现太差，不值一提；而FC在前40次迭代时表现尚可，但到了40次后发生了剧烈变化，出现了过拟合现象（运行20次左右时的模型相对较好，但准确率不足70%，模型还是很差）；三者中表现最好的是GAP，无论从准确度还是损失率，表现都较为平稳，抗过拟合化效果明显（但最终的准确度70%，模型还是不行）。

以下为某个小数据集上的单次实验结果，不代表普遍结论。

VGG19 | ![image](https://user-images.githubusercontent.com/2216970/53677387-024b1680-3cea-11e9-8a2e-2039e302bcde.png) | ![image](https://user-images.githubusercontent.com/2216970/53677389-05460700-3cea-11e9-8d96-30221ba825f0.png)
-- | -- | --
InceptionV3 | ![image](https://user-images.githubusercontent.com/2216970/53677406-4807df00-3cea-11e9-8554-41ad0e86dac0.png) | ![image](https://user-images.githubusercontent.com/2216970/53677407-4a6a3900-3cea-11e9-9246-6c1a649438ae.png)

## 常见坑

- GAP 丢弃所有空间位置信息；需要位置信息的任务（检测定位、姿态）不适用。
- 训练输入分辨率与测试差别大时，GAP 的统计分布会变化（train-test resolution discrepancy）。
- 前面特征图 padding 较多时，边缘零值会拉低平均。
- 替换 FC 时通常要在 GAP 后保留一层线性分类器，且学习率/收敛速度需重新调节。

## 导航

- 通用概念与公式：[Pooling](0268_ML_Op_Pooling)
- 多尺度固定输出：[SPP](0365_ML_Op_Pooling_SPP)
- 正则化角度：[Regularization](0252_ML_Op_Regularization)、[Dropout](0258_ML_Op_Dropout)
- 分类头输出：[Softmax](0335_ML_Op_AF_Softmax)

## Reference

- [Global Average Pooling对全连接层的可替代性分析](https://blog.csdn.net/williamyi96/article/details/77530995)
- [论文 - Network In Network](https://arxiv.org/abs/1312.4400)
- [Global Average Pooling是否可以替代全连接层？](https://www.cnblogs.com/hutao722/p/10008581.html)
- [图像分类中max-pooling和average-pooling之间的异同](https://blog.csdn.net/u012193416/article/details/79432668)
- [Learning Deep Features for Discriminative Localization (CAM)](https://arxiv.org/abs/1512.04150)

