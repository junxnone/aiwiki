---
Title | ML Op Resize
-- | --
Created @ | `2026-11-10T09:50:23Z`
Updated @| `2026-11-10T09:50:23Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/619)

---
# ML Op Resize 与上采样相关算子

Resize（也称 Upsample / Interpolate）是把特征图或图像的空间尺寸放大或缩小的算子，是语义分割、目标检测（FPN）、超分、生成模型中解码器的基本构件。本文覆盖插值型 Resize（nearest / bilinear / bicubic）、ONNX 与 PyTorch 在坐标变换上的差异（导出与推理不一致的经典坑），以及可学习的上采样 ConvTranspose、PixelShuffle、Unpool，并讨论实现层面的优化与 INT8 精度。传统图像处理视角的缩放见 [图像 Resize](0347_Media_Image_Resize)。

## 目的

- 空间分辨率变换：FPN 自顶向下路径把低分辨率特征放大后与高分辨率特征相加；U-Net 解码器逐级放大。
- 输入预处理：把任意尺寸图像缩放到网络固定输入。
- 超分/生成：把低分辨率特征变为高分辨率输出。
- 与 [Pooling](0268_ML_Op_Pooling)、步长卷积（stride conv）构成下采样/上采样的互补关系。

## 数学定义

设输出坐标 $x_{out}$，输入长度 $L_{in}$，输出长度 $L_{out}$，缩放因子 $s=L_{out}/L_{in}$。**坐标变换**把输出坐标映射到输入坐标 $x_{in}$：

| 模式 | 公式 |
|---|---|
| `asymmetric` | $x_{in}=x_{out}/s$ |
| `half_pixel` | $x_{in}=(x_{out}+0.5)/s-0.5$ |
| `align_corners` | $x_{in}=x_{out}\cdot\dfrac{L_{in}-1}{L_{out}-1}$ |
| `pytorch_half_pixel` | $L_{out}>1$ 时同 `half_pixel`，否则 $x_{in}=0$ |

`half_pixel` 把像素视为面积为 1 的方块、坐标指向方块中心，使输入输出的几何中心对齐，是 OpenCV、TensorFlow 2、PIL 的默认行为。`asymmetric` 把像素视为左上角采样点，会导致整体偏移，是早期 TF1 与 PyTorch 的 `nearest` 的行为。`align_corners` 令首尾像素严格对齐。

### Nearest

$$y(x_{out})=x\bigl[\,\mathrm{round}(x_{in})\,\bigr]$$

取整方式即 ONNX 的 `nearest_mode`：`round_prefer_floor`（默认）、`round_prefer_ceil`、`floor`、`ceil`。PyTorch 的 `mode='nearest'` 等价于 `asymmetric + floor`；`nearest-exact` 等价于 `half_pixel + round_prefer_ceil`（与 PIL/OpenCV 一致）。

### Bilinear（一维为 linear）

设 $x_0=\lfloor x_{in}\rfloor,\ x_1=x_0+1,\ \lambda=x_{in}-x_0$：

$$y=(1-\lambda)\,x[x_0]+\lambda\,x[x_1]$$

二维为两个方向的张量积，权重：$w_{ij}=(1-\lambda_h)^{1-i}\lambda_h^{i}\cdot(1-\lambda_w)^{1-j}\lambda_w^{j}$。边界处索引 clamp 到 $[0,L_{in}-1]$。

### Bicubic

对 4 个邻点使用三次卷积核：

$$W(t)=\begin{cases}(a+2)|t|^3-(a+3)|t|^2+1&|t|\le1\\a|t|^3-5a|t|^2+8a|t|-4a&1<|t|<2\\0&\text{otherwise}\end{cases}$$

ONNX 属性 `cubic_coeff_a` 默认 $-0.75$（PyTorch 同为 $-0.75$，OpenCV 为 $-0.75$ 版本约定，TF 部分实现为 $-0.5$，注意核对）。bicubic 输出可能超出输入值域，需要时手动 clamp。

### antialias

缩小（downscale）时，若仍用固定的 2 点/4 点核，会产生混叠（aliasing）。antialias 做法是把插值核按缩放倍数拉宽：核半径乘 $1/s$（$s<1$），相当于先低通再采样。PIL、`torchvision.transforms.Resize`（tensor 版）与 `F.interpolate(..., antialias=True)` 采用此方式；OpenCV 的 `INTER_LINEAR` 缩小时**不**做 antialias，只有 `INTER_AREA` 近似做。

### 转置卷积 ConvTranspose

等价于对输入在行列方向插入 $(\text{stride}-1)$ 个 0 后做普通卷积，或理解为卷积前向对应矩阵 $C$ 的转置 $C^\top$：

$$H_{out}=(H_{in}-1)\cdot s-2p+d(k-1)+p_{out}+1$$

其中 $s$ 为 stride，$p$ 为 padding，$d$ 为 dilation，$k$ 为 kernel，$p_{out}$ 为 `output_padding`（用于消除 stride>1 时输出尺寸的歧义）。

### PixelShuffle

把通道重排为空间：$[N,\,C r^2,\,H,\,W]\to[N,\,C,\,Hr,\,Wr]$，

$$y[n,c,\,h r+i,\,w r+j]=x[n,\;c\,r^2+i\,r+j,\;h,\;w]$$

逆运算为 `PixelUnshuffle`（space-to-depth）。

### Unpool

`MaxUnpool` 与 `MaxPool(return_indices=True)` 配对：把值放回池化时记录的最大值位置，其余位置填 0：$y[\text{idx}_i]=x_i$。

## 输入输出与参数

| 算子 | 输入 | 输出 | 关键参数 |
|---|---|---|---|
| `F.interpolate` / `nn.Upsample` | $[N,C,H,W]$（或 3D/5D） | $[N,C,H',W']$ | `size` 或 `scale_factor`、`mode`、`align_corners`、`recompute_scale_factor`、`antialias` |
| `nn.ConvTranspose2d` | $[N,C_{in},H,W]$ | $[N,C_{out},H',W']$ | `kernel_size`、`stride`、`padding`、`output_padding`、`groups`、`dilation` |
| `nn.PixelShuffle(r)` | $[N,Cr^2,H,W]$ | $[N,C,Hr,Wr]$ | `upscale_factor` |
| `nn.MaxUnpool2d` | 值 + indices | 指定 `output_size` | `kernel_size`、`stride`、`padding` |

注意：`align_corners` 仅对 `linear/bilinear/bicubic/trilinear` 有意义，对 `nearest` 不适用。

## 典型用法

```python
import torch, torch.nn as nn, torch.nn.functional as F

x = torch.randn(1, 16, 32, 32)

# 1) 插值
y_nn   = F.interpolate(x, scale_factor=2, mode='nearest')
y_bil  = F.interpolate(x, scale_factor=2, mode='bilinear', align_corners=False)
y_bic  = F.interpolate(x, size=(96, 96), mode='bicubic', align_corners=False)
y_down = F.interpolate(x, scale_factor=0.5, mode='bilinear', antialias=True)

# 2) 可学习上采样：k=4,s=2,p=1 恰好 2 倍
up = nn.ConvTranspose2d(16, 8, kernel_size=4, stride=2, padding=1)

# 3) 子像素卷积
sr = nn.Sequential(nn.Conv2d(16, 8 * 4, 3, padding=1), nn.PixelShuffle(2))

# 4) Pool / Unpool
pool, unpool = nn.MaxPool2d(2, return_indices=True), nn.MaxUnpool2d(2)
p, idx = pool(x); r = unpool(p, idx, output_size=x.shape[-2:])

# 5) 导出 ONNX（opset>=11 才能表达 coordinate_transformation_mode）
torch.onnx.export(nn.Upsample(scale_factor=2, mode='bilinear', align_corners=False),
                  x, 'up.onnx', opset_version=13)
```

ONNX 算子名：`Resize`（opset 10 起；opset 11 起支持 `coordinate_transformation_mode`、`nearest_mode`、`cubic_coeff_a`、`exclude_outside`、`extrapolation_value`；opset 18 增加 `antialias`、`axes`、`keep_aspect_ratio_policy`）、旧版 `Upsample`（opset 10 起弃用）、`ConvTranspose`、`DepthToSpace`（对应 PixelShuffle，`mode=CRD`）、`SpaceToDepth`、`MaxUnpool`。

## 对比与选择

| 方法 | 是否可学习 | 计算量 | 质量 | 典型场景 |
|---|---|---|---|---|
| nearest | 否 | 极低（纯拷贝/gather） | 块状、锯齿 | FPN、YOLO 的 Upsample、mask 的 resize |
| bilinear | 否 | 低 | 平滑 | 分割（DeepLab）、预处理 |
| bicubic | 否 | 中（16 邻点） | 更锐利 | 超分的基准与预处理 |
| ConvTranspose | 是 | 与同参数卷积相当 | 易出现棋盘格 | GAN 生成器、早期 FCN/U-Net |
| Upsample + Conv | 部分 | 略高 | 无棋盘格 | 现代 U-Net、扩散模型 UNet |
| PixelShuffle | 配合 Conv | 卷积在低分辨率进行，较省 | 无棋盘格倾向较小 | ESPCN 等超分 |
| Unpool | 否 | 低 | 稀疏（含 0） | SegNet |

## 转置卷积与棋盘格伪影

当 kernel 大小不能被 stride 整除时（如 $k=3,s=2$），输出像素被卷积核覆盖的次数不均匀，产生周期性的棋盘格（checkerboard）伪影，反向传播的梯度也会有相同的不均匀模式。常见规避：

- 选 $k$ 为 $s$ 的整数倍（$k=4,s=2$）；
- 使用"最近邻/双线性 Upsample + 3×3 Conv"代替 ConvTranspose；
- 对 ConvTranspose 的权重用 bilinear 核初始化（FCN 的做法），使其在训练初期等价于双线性上采样。

**术语**："反卷积（deconvolution）"在深度学习中通常指 ConvTranspose，它**不是**数学上卷积的逆运算（不能恢复原始输入，只能恢复形状）。真正的反卷积（如 Wiener 滤波）是信号处理中的另一回事。ConvTranspose 的细节见 [Convolution](0009_ML_Op_Convolution)。

## 导出与推理引擎不一致的经典坑

1. **`align_corners` 与 `half_pixel` 的混用**：PyTorch `align_corners=False` 对应 ONNX `half_pixel`；`align_corners=True` 对应 `align_corners`。而 PyTorch `nearest` 实际为 `asymmetric`，导出时会写成 `asymmetric + floor`；若目标引擎忽略属性、按自己默认模式（如 half_pixel）执行，结果会整体偏移半个像素。
2. **`nearest_mode` 的默认值**：ONNX 默认 `round_prefer_floor`，而 PyTorch 为 `floor`。当 `asymmetric` 且整数倍放大时二者一致，非整数倍时结果会不同。
3. **`scale_factor` vs `size`**：PyTorch 在 `recompute_scale_factor=None/False` 时，用用户给的 `scale_factor` 计算坐标，而输出大小是 $\lfloor L_{in}\cdot s\rfloor$；ONNX 的 `scales` 输入与 `sizes` 输入二选一，引擎有的实现以 `sizes` 反推 scale（$L_{out}/L_{in}$），非整数缩放时得到略有差异的坐标。
4. **动态 shape 导出**：用 `size=x.shape[-2:]` 在 tracing 下被固化为常量；应使用 `torch.onnx.dynamo_export` / `scripting`，或把目标尺寸作为张量传入 `sizes`。
5. **opset 低于 11**：不能表达坐标变换模式，导出的 `Upsample` 只有 asymmetric 行为，`align_corners=True` 可能无法正确导出或报错。
6. **TF/TFLite 差异**：TF1 的 `resize_bilinear` 默认 asymmetric（`align_corners=False`、`half_pixel_centers=False`），TF2 / TFLite 新版支持 `half_pixel_centers=True`；转换时需核对。
7. **OpenCV vs PyTorch**：`cv2.resize` 的 bilinear 为 half_pixel 且无 antialias；PyTorch 缩小默认也无 antialias，而 PIL 有，**训练用 PIL 预处理、部署用 OpenCV**是精度下降的常见原因。
8. **整数/uint8 路径**：`F.interpolate` 对 uint8 在 CPU 上走专用快速路径，舍入与 float 路径可能差 1 个 level；bicubic 用于 uint8 必须 clamp 到 $[0,255]$。
9. **ConvTranspose 的 `output_padding`** 在导出时需与 ONNX 的 `output_padding`/`output_shape` 对应，缺失会导致输出尺寸差 1。
10. **边界处理**：ONNX `exclude_outside=1` 会把越界权重置零后重新归一化（TF 部分行为），默认 0 则是 clamp；bicubic 尤为敏感。

## 实现差异与优化

- **gather 式（直接式）**：对每个输出像素，计算 $x_{in}$、邻点索引和权重，从输入 gather 后加权。实现简单，但每个输出像素重复做坐标计算，访存不连续，适合 nearest 与小规模。
- **分离式两遍（separable）**：bilinear/bicubic 的核可分离，先沿 W 方向插值得到中间结果 $[H_{in},W_{out}]$，再沿 H 方向插值。计算量由 $O(HW\cdot k^2)$ 降为 $O(HW\cdot k)$（$k$ 为核宽）。同时**预计算**每个输出坐标对应的 `index[]` 与 `weight[]` 表（每个维度一份，只与尺寸相关，可缓存），内层循环变成纯 FMA，易于 SIMD 化。缺点是需要一块中间缓冲区；当放大时先做较小的那一维可减少中间量。PIL-SIMD、OpenCV `resize` 与 PyTorch CPU 的 `UpSampleKernel` 都采用类似的预计算权重策略。
- **整数倍特化**：当 scale 为整数 $r$ 且使用 `asymmetric`/`half_pixel` 时，每个输出的邻点索引与权重呈周期为 $r$ 的重复模式（权重表只有 $r$ 种），可以展开循环、用 `memcpy`/广播 store 实现 nearest（如 2× 最近邻只需 `unpack`/`shuffle` 复制每个元素两次，再复制整行）。FPN 里的 2× nearest 因此几乎等价于带宽拷贝。
- **融合**：Upsample 常与后续 Add（FPN 横向连接）或 Concat（U-Net skip）相邻；可把 nearest 上采样"虚拟化"，在 Add 的读取侧用 `x[i/2][j/2]` 索引代替真实写出中间张量，节省一次读写（[Elementwise](0620_ML_Op_Elementwise)、[Shape](0621_ML_Op_Shape) 中的 Concat 融合同理）。
- **layout**：NHWC 下沿 C 连续，插值的每个邻点是一整条通道向量，天然向量化；NCHW 下需沿 W 做 gather，更依赖预计算表。
- **GPU**：纹理单元（texture）硬件支持 bilinear 采样与坐标 clamp，但其权重只有 8 位小数精度，严格对齐 CPU 结果时需用手写 kernel；训练用的反向 `upsample_bilinear2d_backward` 需要 `atomicAdd`，因而是非确定性算子（`torch.use_deterministic_algorithms(True)` 下会报错或走慢路径）。
- **ConvTranspose 实现**：(1) 在输入中插零后做普通卷积（浪费算力于 0）；(2) col2im：先做矩阵乘 $W^\top x$，再把列散射累加（col2im/overlap-add）到输出；(3) 按 stride 的相位分解成 $s^2$ 个小卷积（sub-pixel 分解），避免乘 0，与 PixelShuffle 的思想一致。
- **INT8 下的处理**：
  - nearest 是纯拷贝，输入输出共享同一 scale/zero-point，可直接在 INT8 上做，无精度损失。
  - bilinear 的加权和在 INT32（或定点权重，如 Q15/Q8）累加后再 requantize；若输入输出量化参数相同，可省去反量化。常见做法是权重量化为 8–15 位定点，累加后右移并四舍五入。
  - 浮点实现与定点实现在 round 上差 1 LSB 属常见现象，对齐精度测试时需设阈值。
  - bicubic 含负权重，会超出输入范围，输出量化 scale 需留余量或做饱和。
  - 对分割 mask 的 logits 上采样，建议放在 float 或至少 INT16 下，再 argmax。

## 与其他 OP 的关系

- [图像 Resize](0347_Media_Image_Resize)：同一原理在图像预处理中的应用，库（OpenCV/PIL）之间的差异亦同。
- [Convolution](0009_ML_Op_Convolution)：ConvTranspose 是卷积的转置；stride conv 与 Resize 互为下/上采样的两种范式。
- [Pooling](0268_ML_Op_Pooling)：下采样的另一手段；MaxUnpool 是其逆向配对；AdaptiveAvgPool 的窗口划分与 Resize(`INTER_AREA`) 近似。
- [Shape](0621_ML_Op_Shape)：PixelShuffle / DepthToSpace 本质是 reshape + transpose + reshape，没有算术计算。
- [Elementwise](0620_ML_Op_Elementwise)：与 FPN 的 Add、Concat 融合。
- [Norm](0613_ML_Op_Norm)、[激活函数](0279_ML_Op_AF)：上采样块通常是 `Upsample → Conv → Norm → Act` 的结构。
- [Transformer](0229_ML_Transformer)：ViT 在输入分辨率变化时需要对位置编码做 bicubic 插值，即用 `F.interpolate` 作用在 position embedding 上。
- [ML Op 总览](0366_ML_Op)：算子分类索引。

## Reference

- PyTorch `torch.nn.functional.interpolate`：https://pytorch.org/docs/stable/generated/torch.nn.functional.interpolate.html
- PyTorch `torch.nn.Upsample`：https://pytorch.org/docs/stable/generated/torch.nn.Upsample.html
- PyTorch `torch.nn.ConvTranspose2d`：https://pytorch.org/docs/stable/generated/torch.nn.ConvTranspose2d.html
- PyTorch `torch.nn.PixelShuffle`：https://pytorch.org/docs/stable/generated/torch.nn.PixelShuffle.html
- PyTorch `torch.nn.MaxUnpool2d`：https://pytorch.org/docs/stable/generated/torch.nn.MaxUnpool2d.html
- ONNX Resize 算子：https://onnx.ai/onnx/operators/onnx__Resize.html
- ONNX ConvTranspose 算子：https://onnx.ai/onnx/operators/onnx__ConvTranspose.html
- ONNX DepthToSpace 算子：https://onnx.ai/onnx/operators/onnx__DepthToSpace.html
- Deconvolution and Checkerboard Artifacts (Distill)：https://distill.pub/2016/deconv-checkerboard/
- Real-Time Single Image and Video Super-Resolution Using an Efficient Sub-Pixel CNN (PixelShuffle)：https://arxiv.org/abs/1609.05158
- Fully Convolutional Networks for Semantic Segmentation：https://arxiv.org/abs/1411.4038
- A guide to convolution arithmetic for deep learning：https://arxiv.org/abs/1603.07285
- Feature Pyramid Networks for Object Detection：https://arxiv.org/abs/1612.03144

