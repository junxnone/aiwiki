---
Title | Media Image Color Gamma
-- | --
Created @ | `2026-11-25T16:27:56Z`
Updated @| `2026-11-25T16:30:31Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/783)

---
# Gamma

Gamma：图像像素值与真实亮度之间的非线性关系，sRGB 的编码公式，以及在 resize、模糊、混合时为什么要考虑线性空间。

## 为什么需要 Gamma

- 人眼对暗部变化更敏感，对亮部变化迟钝，感知亮度大致与光强的幂次成正比
- 如果用 8 bit 线性存储光强，暗部的台阶太大会产生色带 (banding)，亮部又浪费了大量码值
- 所以图像存储时对线性光强做一次非线性压缩 (gamma 编码)，把更多码值留给暗部；显示时再做相反的变换 (gamma 解码)
- 传统显示器 (CRT) 的响应曲线本身就近似 $\text{亮度}\propto V^{2.2}$，系统沿用了这个约定

下图展示光从场景到屏幕经过的编码与解码：

```mermaid
flowchart LR
    A[场景线性光强] --> B[传感器线性响应]
    B --> C["gamma 编码<br>V = L^(1/γ)"]
    C --> D[8 bit 存储/传输]
    D --> E["gamma 解码<br>显示器 L = V^γ"]
    E --> F[屏幕亮度]
```

图中：

- 传感器本身输出的是和光强成正比的线性值，ISP 里会做 gamma 编码，见 [ISP](/0785_Media_Image_ISP)
- 中间 8 bit 数据 (JPEG、PNG、视频) 存的是编码后的非线性值
- 显示器解码后得到近似线性的亮度，整条链路总体是线性的，人眼看到的就接近真实场景

## 公式

简单幂函数形式：

$$
V = L^{1/\gamma},\qquad L = V^{\gamma}
$$

其中：

- $L\in[0,1]$：归一化的线性光强
- $V\in[0,1]$：编码后的像素值 (除以 255 后)
- $\gamma$：gamma 值，常取 $2.2$；$\gamma>1$ 时编码会提亮暗部

sRGB 使用的是分段函数，近似 $\gamma=2.2$ 但在暗部改为线性段以避免斜率无穷大：

$$
V=\begin{cases}
12.92\,L & L\le0.0031308\\
1.055\,L^{1/2.4}-0.055 & L>0.0031308
\end{cases}
$$

$$
L=\begin{cases}
V/12.92 & V\le0.04045\\
\left(\dfrac{V+0.055}{1.055}\right)^{2.4} & V>0.04045
\end{cases}
$$

其中：

- 第一个式子是编码 (线性 → sRGB)，第二个是解码 (sRGB → 线性)
- 指数 $2.4$ 加上偏移和系数后，整体曲线与 $\gamma\approx2.2$ 的幂函数非常接近
- 阈值 $0.0031308$ 和 $0.04045$ 是两段曲线的衔接点，$12.92$ 是暗部线性段的斜率

## 对图像处理的影响

- 图像里的像素值通常是 gamma 编码的，直接对它做加权平均 (resize、模糊、alpha 混合) 在数学上并不是对光强平均
- 例：黑 (0) 与白 (255) 各占一半，直接平均得 $127$；按光强平均，线性值为 $0.5$，编码后为 $V\approx0.735$，即约 $187$。后者才符合真实世界中两种光混合后的亮度
- 影响最明显的场合：大幅缩小图像、高斯模糊、颜色渐变、抗锯齿；精确做法是先解码到线性空间，处理后再编码回去
- 实际工程里大多数算法 (CNN 输入、OpenCV 常规滤波) 直接在编码值上运算，这是约定俗成，不是错误，但要知道它与「物理正确」的差异；需要做光照、辐射度相关计算时必须转线性

## 常见 Gamma 取值

名称 | 取值 | 场景
-- | -- | --
sRGB | 分段，约 2.2 | 网页、电脑显示器、大多数图片
Rec.709 | 分段 (OETF 等效约 1.9~2.0 `[待核实]`)，显示约 2.4 | 高清视频
Gamma 2.2 / 2.4 | 幂函数 | 显示器设置、视频母版
线性 (Linear) | 1.0 | RAW、渲染、HDR 中间格式

表中：`取值` 为近似指数，实际标准多为分段函数；`场景` 说明常见用途。视频使用的亮度分量 $Y'$ 就是 gamma 编码后加权得到的，见 [YUV](/0121_Media_Image_Color_Model_YUV)。

## 调整图像 Gamma

用查找表 (LUT) 实现最快：

```python
import cv2, numpy as np
gamma = 2.2
lut = np.array([((i / 255.0) ** (1.0 / gamma)) * 255 for i in range(256)], dtype=np.uint8)
out = cv2.LUT(img, lut)       # gamma > 1 提亮暗部
```

- 直方图均衡和 gamma 校正都能改善对比度，区别在于 gamma 是固定曲线，均衡根据直方图自适应，见 [Histogram](/0342_Media_Image_Histogram)

## Reference
- [Gamma FAQ - Poynton](http://poynton.ca/notes/colour_and_gamma/GammaFAQ.html)
- [sRGB - Wikipedia](https://en.wikipedia.org/wiki/SRGB)
- [Gamma correction - Wikipedia](https://en.wikipedia.org/wiki/Gamma_correction)

