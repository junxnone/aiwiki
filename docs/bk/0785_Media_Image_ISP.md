-----

| Title     | Media Image ISP                                       |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-25T16:28:19Z`                                |
| Updated @ | `2026-11-25T16:28:19Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/785) |

-----

# ISP

ISP (Image Signal Processor，图像信号处理器)：把传感器输出的 RAW 数据处理成可显示、可编码的 RGB/YUV
图像的流水线，以及各模块的作用。

## 为什么需要 ISP

  - 传感器输出的是单通道 [Bayer](@@BY@@) RAW：线性、带噪声、有暗电流偏置、有镜头暗角、颜色不准
  - ISP 依次校正这些缺陷，完成去马赛克、白平衡、色彩校正、gamma 等，输出 YUV 或 RGB 图像
  - ISP 可以是 SoC 里的硬件模块、相机内部的 FPGA，也可以用软件实现 (如 libcamera、自己对 RAW 处理)
  - ISP 的处理时间是端到端延迟的一部分，见 [低延迟](/0037_Media_Image_Camera_LowLatency)

## 处理流水线

下图是一条典型 ISP 流水线的模块顺序 (具体顺序因厂商而异)：

``` mermaid
flowchart LR
    S[传感器 RAW] --> A[黑电平校正 BLC]
    A --> B[坏点校正 DPC]
    B --> C[镜头阴影校正 LSC]
    C --> D[RAW 降噪]
    D --> E[白平衡 AWB 增益]
    E --> F[去马赛克]
    F --> G[色彩校正 CCM]
    G --> H[Gamma]
    H --> I[色彩空间转换 YCbCr]
    I --> J[降噪/锐化]
    J --> K[输出 YUV/RGB]
    F -.统计.-> ST[3A 统计]
    ST -.控制.-> CTRL[自动曝光/白平衡/对焦]
    CTRL -.-> S
```

图中：

  - 主路径从左到右：RAW 域 (去马赛克之前) 的处理在前，RGB 域在中间，YUV 域在最后
  - `3A` 指自动曝光 (AE)、自动白平衡 (AWB)、自动对焦 (AF)：ISP
    统计画面亮度、颜色信息，控制器据此调整曝光时间、增益等，形成闭环；曝光相关见
    [Exposure](@@EXP@@)
  - 前几步 (BLC/DPC/LSC) 都是在修正传感器本身的缺陷，需要线性数据，所以放在 gamma 之前

## 各模块

### 黑电平校正 BLC

  - 传感器即使在完全无光时也有一个非零偏置输出 (黑电平)，需要先减掉：

$$ I' = \\max(I - B, 0) $$

其中：

  - $I$：RAW 像素值；$B$：黑电平 (通常按通道标定，如 10 bit 下约 64)
  - $I'$：校正后的值；取最大值避免出现负数

### 坏点校正 DPC

  - 传感器上总有一些总是亮或总是暗的像素，用邻近同色像素的中值或均值替换

### 镜头阴影校正 LSC

  - 镜头会使画面四角比中心暗 (暗角)，并且不同颜色通道衰减不同，造成四角偏色
  - 做法：按位置乘以一张增益表，该表由拍摄均匀光源标定得到

### 白平衡 AWB

  - 不同光源色温不同，同一白色物体在 RAW 里的 R、G、B 比例会变化；白平衡对 R、B 通道分别乘增益，使灰色物体呈现
    $R=G=B$：

$$ R'=g\_R R,\\qquad G'=G,\\qquad B'=g\_B B $$

其中：

  - $g\_R,g\_B$：红、蓝通道增益，固定 $G$ 通道增益为 1
  - 灰度世界 (gray world) 假设场景平均颜色为灰色，则 $g\_R=\\bar G/\\bar R$，$g\_B=\\bar
    G/\\bar B$，$\\bar R,\\bar G,\\bar B$ 为各通道的均值

### 去马赛克

  - 把 Bayer RAW 变成每个像素三个分量，见 [Bayer](@@BY@@)

### 色彩校正 CCM

  - 传感器的 R、G、B 滤光片光谱和标准色彩空间 (如 sRGB) 不同，要用一个 $3\\times3$ 矩阵校正：

$$ \\begin{bmatrix}R\_{out}\\G\_{out}\\B\_{out}\\end{bmatrix}=
\\begin{bmatrix} m\_{11} & m\_{12} & m\_{13}\\ m\_{21} & m\_{22} &
m\_{23}\\ m\_{31} & m\_{32} & m\_{33} \\end{bmatrix}
\\begin{bmatrix}R\\G\\B\\end{bmatrix} $$

其中：

  - $m\_{ij}$：由色卡标定得到的系数；每一行之和通常约束为 $1$，使灰色 ($R=G=B$) 经过变换后仍是灰色，不破坏白平衡
  - 对角线元素大于 1、非对角元素为负时，效果是增加饱和度

### Gamma 与色彩空间转换

  - 线性 RGB 经 gamma 编码后才适合 8 bit 存储和显示，见 [Gamma](@@GM@@)
  - 再转换到 YCbCr 方便压缩和传输，见 [YUV](/0121_Media_Image_Color_Model_YUV)

### 降噪与锐化

  - 降噪：在 RAW 域做空域/时域降噪效果更好，因为此时噪声接近简单的统计模型；RGB/YUV
    域降噪成本更低但已混入去马赛克带来的相关噪声
  - 锐化：增强边缘，常用 unsharp mask：$I\_{out}=I+\\alpha(I-I\_{blur})$，$\\alpha$
    为锐化强度，$I\_{blur}$ 为模糊后的图像，相关滤波见 [OpenCV IP
    Filter](/0363_OpenCV_IP_Filter)

## 常见相机里的 ISP

| 场景                           | ISP 位置                  | 可调程度                                                              |
| ---------------------------- | ----------------------- | ----------------------------------------------------------------- |
| 手机/消费类相机                     | SoC 内置硬件 ISP            | 厂商调校，用户基本不可调                                                      |
| 工业相机                         | 相机内部 FPGA 或 SoC         | 通过 [GenICam](/0106_Media_Image_Camera_GenICam) 特征调整增益、白平衡、gamma 等 |
| 输出 RAW (PixelFormat 为 Bayer) | 不做 ISP                  | 由主机软件 (如 OpenCV) 自己处理                                             |
| USB/UVC 摄像头                  | 摄像头内部 ISP，输出 YUY2/MJPEG | 部分参数可通过 V4L2 调整                                                   |

表中：`ISP 位置` 说明处理在哪里完成；`可调程度` 说明用户能否干预。要得到精确可控的结果 (如测量、标定) 时，往往选择输出 RAW
并关闭相机自带的自动处理，再自行实现 ISP 中需要的步骤。

## Reference

  - [Image processor -
    Wikipedia](https://en.wikipedia.org/wiki/Image_processor)
  - [libcamera - Software ISP](https://libcamera.org/)
  - [Color correction matrix -
    Wikipedia](https://en.wikipedia.org/wiki/Color_balance)
  - [GenICam
    SFNC](https://www.emva.org/standards-technology/genicam/genicam-downloads/)
