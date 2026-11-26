---
Title | ML Tasks Image Classification MobileNet V3
-- | --
Created @ | `2020-02-25T10:17:32Z`
Updated @| `2026-11-26T01:26:38Z`
Labels | `index`
Edit @| [here](https://github.com/junxnone/aiwiki/issues/44)

---
# MobileNet V3

## Brief

- MobileNetV3-Large
- MobileNetV3-Small

**Tricks**
- MobileNet v2 + SENet
- MnasNet
- NetAdapt
- Redesigning Expensive Layers
- Nonlinearities - h-swish



## 改进点

### 搜索得到的结构

- 先用 MnasNet 式的平台感知 NAS (Neural Architecture Search) 搜索整体块结构：搜索目标同时考虑精度和在手机 CPU 上的实测延迟
- 再用 NetAdapt 逐层微调：在保持延迟预算的前提下，逐层裁剪通道，做细粒度的调整

### 倒残差块中加入 SE

- 在 [MobileNet V2](/0043_ML_Tasks_Image_Classification_MobileNet_V2) 的 depthwise 之后加入 SE (Squeeze-and-Excitation) 通道注意力：先对每个通道全局平均池化，经过两个全连接 (缩小比 $1/4$)，再生成 $0\sim1$ 的通道权重去乘特征

### h-swish 激活

$$
\text{swish}(x)=x\cdot\sigma(x),\qquad
\text{h-swish}(x)=x\cdot\frac{\mathrm{ReLU6}(x+3)}{6}
$$

其中：

- $\sigma(x)=1/(1+e^{-x})$：sigmoid；swish 精度比 ReLU 好，但 sigmoid 的指数运算在移动端开销大且不利于量化
- $\mathrm{ReLU6}(x+3)/6$：对 sigmoid 的分段线性近似 (h-sigmoid)，只用加法、截断和乘法
- h-swish 只在网络较深的层使用，因为深层特征图小，激活开销占比小；浅层仍用 ReLU

### 重新设计耗时层

- 把最后一个阶段的池化提前到 $1\times1$ 卷积之前，让最后几个昂贵的层在 $1\times1$ 的特征上运行，几乎不损失精度而减少延迟
- 首层卷积滤波器数从 $32$ 减到 $16$，用 h-swish，精度相同、延迟更低

## 两个版本

模型 | 参数量 | MACs | ImageNet top-1 | 目标
-- | -- | -- | -- | --
MobileNetV3-Large | 5.4 M | 219 M | 75.2% | 较高精度
MobileNetV3-Small | 2.9 M | 66 M | 67.4% | 低延迟、低功耗

表中：数据来自论文 (输入 $224\times224$)；作为对比 [MobileNet V2](/0043_ML_Tasks_Image_Classification_MobileNet_V2) 为 $3.4\text{M}$ 参数、$300\text{M}$ MACs、$72.0\%$。V3-Large 比 V2 精度高约 $3.2\%$，计算量少约 $27\%$。`[待核实]` 表中延迟相关的具体毫秒数请查阅论文。

## 小结

- V1 解决「怎样算得便宜」(可分离卷积)，V2 解决「怎样结构更好」(倒残差 + 线性瓶颈)，V3 用搜索和注意力继续逼近硬件极限
- 后续轻量网络 (EfficientNet、MobileOne 等) 沿用了 depthwise、SE 和 NAS 的思路

## Reference
- 2019 **MobileNet V3** Searching for MobileNetV3 [[paper](https://arxiv.org/pdf/1905.02244.pdf)]

