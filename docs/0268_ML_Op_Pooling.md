---
Title | ML Op Pooling
-- | --
Created @ | `2019-03-02T04:16:50Z`
Updated @| `2026-11-11T01:07:26Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/268)

---
# Pooling 池化

Pooling 是在特征图的局部窗口（或整张图）上做**无参数的聚合**（取最大/平均/范数等），用于降低空间分辨率、减少计算量、引入一定的局部平移不变性。它与 [Convolution](0009_ML_Op_Convolution) 一样是滑窗算子，但窗口内没有可学习权重，且通常逐通道独立计算（不跨通道混合）。总览见 [ML Op 总览](0366_ML_Op)。

- Pooling - `池化` - 降维（如特征图 `2x2` -> `1`）
- MP - `Max Pooling`；AP - `Average Pooling`（Mean Pooling）
- GAP - Global Average Pooling，详见 [GAP](0267_ML_Op_Pooling_GAP)
- SPP - Spatial Pyramid Pooling，详见 [SPP](0365_ML_Op_Pooling_SPP)

**作用**
- 抑制噪声，降低信息冗余
- 缩减特征图尺寸，降低后续层的计算量与显存
- 增大感受野，提升对小幅平移/形变的鲁棒性（尺度、旋转不变性只是很弱的近似，不要夸大）
- 一定程度缓解过拟合

**超参**
- `kernel_size` (f)：窗口大小，如 3x3 则 f = 3
- `stride` (s)：步幅，默认等于 kernel_size
- `padding` (p)：填充；PyTorch 要求 `p <= kernel_size/2`
- `dilation` (d)：窗口内元素间隔（仅 MaxPool 支持）
- `ceil_mode`：输出尺寸取整方式

池化过程中没有需要学习的参数。

```
f = 2
s = 2
相当于高度和宽度缩减一半
```

Pooling | Figure
-- | --
Max Pooling | <img height="200px" src="https://user-images.githubusercontent.com/2216970/150455902-62441320-60b2-416f-aaa0-38e96cbc7bfa.png">
Average Pooling<br>(Mean Pooling) | <img width="200px" src="https://user-images.githubusercontent.com/2216970/150455378-68b2d05a-4c6b-46c2-ac9c-40c756431e05.png">

## 数学定义

输入 $x \in \mathbb{R}^{N\times C\times H\times W}$，窗口 $\mathcal{W}(i,j)$ 为输出位置 $(i,j)$ 对应的输入坐标集合：

$$\mathcal{W}(i,j)=\{(is-p+d\,m,\; js-p+d\,n)\mid 0\le m<k_h,\ 0\le n<k_w\}$$

| 类型 | 公式 |
|---|---|
| Max | $y_{ij}=\max_{(u,v)\in\mathcal{W}} x_{uv}$ |
| Average | $y_{ij}=\frac{1}{\lvert\mathcal{W}\rvert}\sum_{(u,v)\in\mathcal{W}} x_{uv}$ |
| Lp | $y_{ij}=\Big(\sum_{(u,v)\in\mathcal{W}} x_{uv}^{\,p}\Big)^{1/p}$（$p=1$ 为窗口和，$p\to\infty$ 趋近 Max） |
| Global | 窗口 = 整个 $H\times W$，输出 $N\times C\times1\times1$ |
| Adaptive | 给定目标输出尺寸，自动推导窗口（见下） |
| Stochastic | 窗口内按 $p_{uv}=x_{uv}/\sum x$ 采样一个值作为输出（训练），测试时用概率加权平均 |
| Fractional Max | 用伪随机序列生成非整数缩放比例（如 $\sqrt2$）的不规则窗口，Max 取值 |

Stochastic Pooling（Zeiler & Fergus, 2013）与 Fractional Max Pooling（Graham, 2014）主要是正则化手段，工业部署中很少见。

## 输出尺寸公式

$$H_{out}=\Big\lfloor \frac{H+2p-d\,(k-1)-1}{s}\Big\rfloor+1$$

- `ceil_mode=True` 时外层 floor 改为 ceil；但 PyTorch 额外规定：**最后一个窗口必须起始于输入内部或左/上 padding 内**，若起点落入右侧 padding 则丢弃该窗口（输出少 1）。
- 例：$H=5,k=2,s=2,p=0$：floor 得 2，ceil 得 3（最后一个窗口只覆盖 1 个元素）。
- TensorFlow/Keras 的 `padding='same'` 输出为 $\lceil H/s\rceil$，与 PyTorch 显式 padding 的取整不同，跨框架迁移要小心。

**Adaptive Pooling**：指定输出尺寸 $O$，第 $i$ 个输出的窗口为

$$\text{start}_i=\lfloor iH/O\rfloor,\quad \text{end}_i=\lceil (i+1)H/O\rceil$$

窗口大小可能不同、相邻窗口可能重叠；$O=1$ 即 Global Pooling。它使网络对任意输入分辨率输出固定尺寸，与 [SPP](0365_ML_Op_Pooling_SPP) 的每一层本质相同。

## PyTorch 用法

```python
import torch, torch.nn as nn, torch.nn.functional as F

x = torch.randn(1, 3, 7, 7)
nn.MaxPool2d(kernel_size=3, stride=2, padding=1)(x)             # 4x4
nn.MaxPool2d(2, 2, ceil_mode=True)(x)                           # 4x4 (floor 为 3)
nn.AvgPool2d(2, 2, count_include_pad=False)(x)                  # 分母不含 padding
nn.AdaptiveAvgPool2d((1, 1))(x)                                 # GAP -> (1,3,1,1)
nn.AdaptiveMaxPool2d((2, 2))(x)
nn.LPPool2d(norm_type=2, kernel_size=2)(x)
nn.FractionalMaxPool2d(2, output_ratio=0.7)(x)
y, idx = F.max_pool2d(x, 2, return_indices=True)               # 配合 MaxUnpool2d
```

## 反向传播

- **Max**：梯度只传给窗口内 argmax 位置，其余为 0。前向需记录 argmax 索引（PyTorch 的 `return_indices`）。窗口重叠（$s<k$）时，同一输入可能是多个窗口的最大值，梯度需累加（GPU 上用 atomicAdd，导致结果非确定性）。并列最大值时仅一个位置得到梯度（实现相关）。
- **Average**：窗口内每个元素得到 $\frac{1}{|\mathcal W|}\,\partial L/\partial y$，重叠处累加。
- **Lp**：$\partial y/\partial x_{uv}=x_{uv}^{p-1}\,y^{1-p}$。
- 因此 Max Pooling 的梯度稀疏，Average 的梯度均匀稠密。

## 实现差异与优化

- **朴素滑窗**：逐输出点遍历 $k_h k_w$ 个元素，复杂度 $O(N C H_{out}W_{out}k_hk_w)$，访存受限（memory-bound），算术强度很低。
- **分离式**：Max 与 Avg（无 padding 排除时）的矩形窗口可拆成先沿 W 再沿 H 的两次一维操作，复杂度降到 $O(k_h+k_w)$/点；大窗口 Max 还可用单调队列/van Herk 算法做到与窗口大小无关。
- **积分图 / 前缀和**：Avg（尤其大窗口、Box filter）可用 summed-area table，每个输出 $O(1)$。
- **Adaptive**：窗口大小不固定，实现多按输出点各自算起止，难以向量化；输入能整除输出时等价于普通 Pooling（$k=s=H/O$），导出 ONNX 时即利用这点。
- **Padding 语义**：MaxPool 的 padding 等价于 $-\infty$，不影响结果；AvgPool 有 `count_include_pad`（分母是否含 padding，PyTorch 默认 True），对应 oneDNN 的 `pooling_avg_include_padding / exclude_padding` 与 cuDNN 的 `CUDNN_POOLING_AVERAGE_COUNT_INCLUDE_PADDING / EXCLUDE_PADDING`。
- **库实现**：oneDNN 提供 `pooling_max`、`pooling_avg_*`，支持 nChw8c/16c 块状布局，并可与后续算子做 post-op 融合；cuDNN 提供 `cudnnPoolingForward/Backward`，另有 `CUDNN_POOLING_MAX_DETERMINISTIC`。
- **融合**：推理时常与前一层 Conv+BN+ReLU 融合以省一次内存往返。
- **量化**：Max Pooling 对量化保持尺度不变（直接在 int8 上取最大，无需重量化）；Average Pooling 需要累加到更高位宽再除，并可能重量化。

## 与 stride-2 卷积替代的争论

*Striving for Simplicity: The All Convolutional Net*（Springenberg 等，2014）主张用 stride-2 卷积替换 Pooling，让下采样可学习；ResNet 的下采样即用 stride-2 卷积（及 shortcut 上的 stride-2 1x1 卷积），而 VGG/早期网络用 MaxPool。取舍：
- Strided Conv 可学习、能自适应，但增加参数与计算量，且 $k<s$ 时会丢信息、产生混叠。
- Pooling 零参数、廉价，Max 提供非线性与局部不变性；Average 则近似低通滤波，有利于抗混叠（BlurPool 等工作，细节待核实）。
- 经验上两者精度差异取决于任务与网络，没有绝对结论；现代 CNN 多数下采样用 strided conv，末端用 GAP。

## ONNX 算子对应

| PyTorch | ONNX |
|---|---|
| MaxPool2d | `MaxPool`（支持 `dilations`、`ceil_mode`、`Indices` 输出） |
| AvgPool2d | `AveragePool`（`count_include_pad`、`ceil_mode`） |
| LPPool2d | `LpPool` |
| AdaptiveAvgPool2d((1,1)) | `GlobalAveragePool` |
| AdaptiveMaxPool2d((1,1)) | `GlobalMaxPool` |
| AdaptiveAvgPool2d(O) 其他 | 无专用算子；输入尺寸静态且可整除时导出为 `AveragePool`，否则导出失败或需自定义 |
| MaxUnpool2d | `MaxUnpool` |
| roi_pool / roi_align | `MaxRoiPool` / `RoiAlign` |

## 导航

- 整图平均成 1x1：[GAP](0267_ML_Op_Pooling_GAP)
- 多尺度固定长度输出、任意输入尺寸：[SPP](0365_ML_Op_Pooling_SPP)
- 常见搭配：[Convolution](0009_ML_Op_Convolution)、[BatchNorm](0614_ML_Op_Norm_BatchNorm)、[ReLU 系](0616_ML_Op_AF_ReLU)、[Resize](0619_ML_Op_Resize)

## 常见坑

- `ceil_mode` 与 `padding` 同时使用时输出尺寸与其他框架（TF `same`）不一致。
- AvgPool 边界处 `count_include_pad` 默认 True，会让边缘值偏小；与 TF/Keras 默认（排除 padding）不同。
- MaxPool 的 padding 必须 `<= k/2`，否则报错。
- 检测/分割任务中池化会丢失定位精度，需要 ROI Align、上采样等补偿。
- 训练时 Max Pooling 反向在 GPU 上非确定，开 `torch.use_deterministic_algorithms` 可能报错/变慢。

## Reference

- [卷积神经网络中的各种池化操作](https://zhuanlan.zhihu.com/p/112216409)
- [Pooling Operations - paperwithcode](https://paperswithcode.com/methods/category/pooling-operation)
- [PyTorch MaxPool2d](https://pytorch.org/docs/stable/generated/torch.nn.MaxPool2d.html)
- [PyTorch AdaptiveAvgPool2d](https://pytorch.org/docs/stable/generated/torch.nn.AdaptiveAvgPool2d.html)
- [ONNX MaxPool](https://onnx.ai/onnx/operators/onnx__MaxPool.html)
- [Striving for Simplicity: The All Convolutional Net](https://arxiv.org/abs/1412.6806)
- [Stochastic Pooling](https://arxiv.org/abs/1301.3557)
- [Fractional Max-Pooling](https://arxiv.org/abs/1412.6071)

