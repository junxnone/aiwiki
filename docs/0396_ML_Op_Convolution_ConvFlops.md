---
Title | ML Op Convolution ConvFlops
-- | --
Created @ | `2020-05-19T08:19:49Z`
Updated @| `2026-11-11T01:07:16Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/396)

---
# Convolution Flops

本文给出卷积层计算量（FLOPs）与参数量的计算公式，并以 Depthwise Separable 卷积为例对比。卷积本身见 [Convolution](0009_ML_Op_Convolution)。

## 符号与输出尺寸

Name | Values | Description
-- | -- | --
Input | `Cin x H x W` | 输入通道/高/宽
Conv Kernel | `K1 x K2` | 卷积核（高 x 宽）
Padding | `P1 x P2` | 填充
Stride | `S1 x S2` | 步长
filter | `N` | 卷积核个数，即输出通道数 Cout
Hout | `Hout = floor((H - K1 + 2P1) / S1) + 1` | 即 `H + 2P1 - K1`
Wout | `Wout = floor((W - K2 + 2P2) / S2) + 1` |
Output Feature Map | `N x Hout x Wout` |

带 dilation `D` 时，把 `K` 换成 `D(K-1)+1`。

## 计算量
每个输出元素需要 `Cin x K1 x K2` 次乘法和 `Cin x K1 x K2 - 1` 次加法，加 bias 再多 1 次加法，因此带 bias 时加法次数等于乘法次数。

Name | Values | Description
-- | -- | --
乘法计算量 | `N x Hout x Wout x Cin x K1 x K2` | 即 MACs（乘加次数）
加法计算量 | `N x Hout x Wout x Cin x K1 x K2` | 带 bias；无 bias 则减去 `N x Hout x Wout`
总计算量 FLOPs | `2 x N x Hout x Wout x Cin x K1 x K2` | 1 MAC = 2 FLOPs
MACs | `N x Hout x Wout x Cin x K1 x K2` | 许多论文/工具（如 thop、ptflops）报告的 "FLOPs" 实际是 MACs，对比时需先确认口径

## 参数量

Name | Values | Description
-- | -- | --
卷积核参数量 | `N x Cin x K1 x K2` |
Bias 参数量 | `N` | 无 bias 为 0；后接 BN 时通常 `bias=False`
总参数量 | `N x Cin x K1 x K2 + N` |

带 groups `g` 时：卷积核参数量与 MACs 均除以 `g`（`N x (Cin/g) x K1 x K2`）。

## 例子：标准卷积
输入 `32 x 112 x 112`，`3x3`，`N=64`，stride=1，padding=1：Hout=Wout=112
- MACs = 64 x 112 x 112 x 32 x 9 = 231,211,008 (约 231M)
- FLOPs = 约 462M
- 参数量 = 64 x 32 x 9 + 64 = 18,496

## 例子：Depthwise Separable 卷积
同样输入与输出尺寸，拆为 Depthwise 3x3 (groups=Cin=32) + Pointwise 1x1 (32 -> 64)：

Name | MACs | 参数量 (无 bias)
-- | -- | --
Depthwise | `Cin x Hout x Wout x K1 x K2` = 32 x 112 x 112 x 9 = 3,612,672 | `Cin x K1 x K2` = 288
Pointwise | `N x Hout x Wout x Cin` = 64 x 112 x 112 x 32 = 25,690,112 | `N x Cin` = 2,048
合计 | 29,302,784 (约 29M) | 2,336
标准卷积 | 231,211,008 | 64 x 32 x 9 = 18,432

两者相比：
$$
\frac{\text{DW+PW}}{\text{Standard}}=\frac{1}{N}+\frac{1}{K_1K_2}=\frac{1}{64}+\frac{1}{9}\approx 0.127
$$
计算量与参数量均约降为 1/8（MobileNet 3x3 时约 8~9 倍的节省）。

## 注意
- FLOPs 不等于速度：Depthwise 访存比低，实际加速常小于 FLOPs 比例
- 不含 BN/激活/池化等的计算量；BN 推理时可折叠进卷积，见 [Convolution](0009_ML_Op_Convolution)
- 转置卷积的 MACs 等同于其对应前向卷积（以其输入尺寸计）
- 全连接 [Linear](0612_ML_Op_Linear) 是特例：`Cin x Cout` 次 MAC

## Reference
- [深度学习之（经典）卷积层计算量以及参数量总结 （考虑有无bias，乘加情况）](https://www.cnblogs.com/qinduanyinghua/p/11302618.html)
- [cs231n - conv demo](https://cs231n.github.io/assets/conv-demo/index.html)

