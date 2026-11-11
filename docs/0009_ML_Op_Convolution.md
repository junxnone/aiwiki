---
Title | ML Op Convolution
-- | --
Created @ | `2021-09-01T03:18:20Z`
Updated @| `2026-11-11T01:07:10Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/9)

---
# ML Op Convolution

卷积（Convolution）是 CNN 的核心算子：用一组可学习的小滤波器在输入上滑动，对局部区域做加权求和，从而以**局部连接 + 权值共享**的方式提取空间（或时序）特征。本文是 Convolution 系列入口，给出定义、参数、变体、实现方式与导航。属于 [ML Op 总览](0366_ML_Op) 的一部分。

## 系列导航
- [Conv Math](0010_ML_Op_Convolution_Math) - 卷积的数学定义（连续/离散、翻转、与互相关的关系）
- [Conv DL](0011_ML_Op_Convolution_DL) - 深度学习中的卷积：2D/3D/转置/扩张/可分卷积、小卷积核等
- [ConvFlops](0396_ML_Op_Convolution_ConvFlops) - 计算量与参数量公式

## 卷积应用
- 信号处理 - 平滑/锐化/滤波
- 图像处理 - 边缘检测/特征检测/运动检测/图像匹配
- 深度学习 - 特征提取、上/下采样、检测/分割骨干网络；一维卷积用于语音/文本/时序

## 定义（深度学习中的 2D 卷积）
DL 框架中的 "卷积" 实际是互相关（滤波器不翻转，见 [Conv Math](0010_ML_Op_Convolution_Math)）：

$$
Y[n,o,i,j]=b[o]+\sum_{c=0}^{C_{in}/g-1}\sum_{u=0}^{K_h-1}\sum_{v=0}^{K_w-1}
W[o,c,u,v]\cdot X[n,\;c+\lfloor o/(C_{out}/g)\rfloor\tfrac{C_{in}}{g},\;iS_h-P_h+uD_h,\;jS_w-P_w+vD_w]
$$

超出边界的位置按 padding 取 0（或其他填充模式）。

## 参数与 shape
| 参数 | 含义 |
| -- | -- |
| `in_channels` / `out_channels` | 输入/输出通道数 $C_{in}$, $C_{out}$ |
| `kernel_size` | 卷积核大小 $K_h \times K_w$ |
| `stride` | 步长 $S$，滑动间隔，>1 时下采样 |
| `padding` | 边界填充 $P$；`same` 使 stride=1 时输出尺寸不变，`valid` 即不填充 |
| `dilation` | 核元素间隔 $D$，有效核尺寸 $D(K-1)+1$ |
| `groups` | 分组数 $g$，需整除 $C_{in}$ 与 $C_{out}$ |
| `bias` | 每个输出通道一个偏置 |

- 输入 `N x C_in x H x W`（NCHW），权重 `C_out x (C_in/g) x Kh x Kw`，输出 `N x C_out x H_out x W_out`
- 输出尺寸：

$$
H_{out}=\left\lfloor\frac{H+2P_h-D_h(K_h-1)-1}{S_h}\right\rfloor+1
$$

```python
import torch, torch.nn as nn
conv = nn.Conv2d(64, 128, kernel_size=3, stride=2, padding=1, dilation=1, groups=1, bias=True)
y = conv(torch.randn(1, 64, 56, 56))   # -> [1, 128, 28, 28]
```

## 变体对比
| 变体 | 关键点 | 参数量 (相对标准卷积) | 典型用途 |
| -- | -- | -- | -- |
| 标准卷积 | 每个输出通道连接所有输入通道 | $C_{out}C_{in}K^2$ | 通用 |
| Depthwise | `groups = C_in`，每通道独立卷积，不混合通道 | $C_{in}K^2$ | MobileNet 等轻量网络 |
| Pointwise (1x1) | 只做通道混合/升降维 | $C_{out}C_{in}$ | 瓶颈层、Depthwise 后的通道融合 |
| Depthwise Separable | Depthwise + Pointwise | 约为标准的 $1/C_{out}+1/K^2$ | 轻量模型 |
| Group | 通道分成 g 组各自卷积 | 标准的 $1/g$ | ResNeXt、AlexNet 双卡 |
| Dilated (Atrous) | 核内插入空洞，扩大感受野不增参数 | 同标准 | 分割（DeepLab）、WaveNet |
| Transposed | 上采样，是卷积前向的转置（反向传播形式） | 同标准 | 分割/生成模型的上采样 |
| Deformable | 采样位置带可学习偏移 | 标准 + offset 分支 | 检测/分割中处理几何形变 |
| 3D / 1D | 多一个（或少一个）滑动维度 | 随核维度变化 | 视频/医学影像/时序 |

详见 [Conv DL](0011_ML_Op_Convolution_DL)；计算量见 [ConvFlops](0396_ML_Op_Convolution_ConvFlops)。

## 实现方式
| 方式 | 思路 | 特点 |
| -- | -- | -- |
| Direct | 直接 6 层循环（N, Cout, H, W, Cin, K） | 简单；经分块/向量化/寄存器复用后可很快，小核、Depthwise 常用 |
| im2col + GEMM | 把每个滑窗展开成矩阵一列，卷积变成 `W[Cout, Cin*K*K] x col[Cin*K*K, Hout*Wout]` | 复用高度优化的 GEMM；代价是额外内存（约 K^2 倍展开）与拷贝 |
| Winograd | 用变换减少乘法次数，如 F(2x2,3x3) 将 16 次乘法降到 9 次 | 仅适合 3x3 stride=1 等小核；数值误差增大，低精度下需谨慎 |
| FFT | 频域逐点相乘 | 大卷积核收益明显，小核开销大 |
| 隐式 GEMM | 不显式生成 col，在 GEMM 内即时计算索引 | cuDNN/CUTLASS 等常用，省内存 |
| 推理引擎 (oneDNN/OpenVINO 等) | 针对 blocked layout（如 nChw16c）的 JIT/direct 内核，并融合后续算子 | 避免 layout 转换与中间张量读写 |

## 与 Conv-BN-ReLU 融合
推理时 [BatchNorm](0614_ML_Op_Norm_BatchNorm) 是通道上的仿射变换，可折叠进卷积权重：

$$
W' = W\cdot\frac{\gamma}{\sqrt{\sigma^2+\epsilon}},\qquad
b' = \frac{\gamma\,(b-\mu)}{\sqrt{\sigma^2+\epsilon}}+\beta
$$

折叠后 Conv+BN 变为单个 Conv；后接的 [ReLU 系](0616_ML_Op_AF_ReLU) 等逐元素激活可作为 post-op 在卷积内核的输出寄存器上直接完成（oneDNN 称 post-ops），省去一次内存读写。常见融合：Conv+Bias、Conv+BN、Conv+ReLU、Conv+Add(残差)+ReLU。注意训练时 BN 使用 batch 统计，不能直接折叠。

## 常见坑
- 框架的 "卷积" 是互相关；与严格数学卷积相比差一次核翻转，导入信号处理核时需注意
- 转置卷积易产生棋盘格伪影；可用 Resize + Conv 替代，见 [Resize](0619_ML_Op_Resize)
- stride>1 且尺寸不能整除时，不同框架的 floor/ceil、`same` padding 非对称填充行为可能不同
- Depthwise 计算访存比低，FLOPs 小但在 GPU 上不一定快
- 量化部署时 per-channel 权重量化对 Depthwise 尤其重要

## 相关
- 池化 [Pooling](0268_ML_Op_Pooling)、[GAP](0267_ML_Op_Pooling_GAP)、[SPP](0365_ML_Op_Pooling_SPP) 常与卷积配合
- 全连接 [Linear](0612_ML_Op_Linear) 可视为 1x1 卷积（或核与输入同大小的卷积）
- 激活函数见 [激活函数](0279_ML_Op_AF)

## Reference
- [A History of the Convolution Operation](https://www.embs.org/pulse/articles/history-convolution-operation/)
- [A guide to convolution arithmetic for deep learning](https://arxiv.org/abs/1603.07285)
- [PyTorch - Conv2d](https://pytorch.org/docs/stable/generated/torch.nn.Conv2d.html)

