-----

| Title         | Media Image Color Model YUV                           |
| ------------- | ----------------------------------------------------- |
| Created @     | `2021-02-07T03:28:00Z`                                |
| Last Modify @ | `2022-12-23T13:32:38Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/121) |

-----

# YUV Color Model

## Reference

  - [详解 YUV
    格式（I420/YUV420/NV12/NV12/YUV422）](https://www.jianshu.com/p/358bf8b7eacc)
  - [YUV pixel formats](https://www.fourcc.org/yuv.php)
  - [YUV - videolan-wiki](https://wiki.videolan.org/YUV#Semi-planar)
  - [Recommended 8-Bit YUV Formats for Video
    Rendering](https://docs.microsoft.com/en-us/windows/win32/medfound/recommended-8-bit-yuv-formats-for-video-rendering)
  - [一文理解 YUV](https://zhuanlan.zhihu.com/p/75735751)

## Brief

  - YUV Color Space - 用于模拟信号彩色电视广播
      - Y - Luminance/Luma - 明亮度/灰度 - `[0,1] [0,255]`
      - UV - Chrominance/Chroma - 色度 - `[-0.5, 0.5] [-128, 127]`
      - Y 与 UV 分开 解决 彩色电视 和 黑白电视 兼容问题
  - YCbCr 来源于 YUV, 用于处理数字视频(一些编码标准中提到的 `YUV` 其实是指 `YCbCr`)
      - Cb - 蓝色分量
      - Cr - 红色分量
  - 采样格式 - 444/422/411/420
  - 存储格式
      - Packed - YUV 打包在一起
      - Planar - YUV 分离

## 采样格式 - Downsampling

  - `4:4:4` / `4:2:2` / `4:2:0` /`4:1:1`
  - 几个 Y 共享 UV - 节约带宽

| Pattern | 码流                                         | 像素点                                                                                           |
| ------- | ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| 444     | `Y0 U0 V0 Y1 U1 V1 Y2 U2 V2 Y3 U3 V3`      | `[Y0 U0 V0] [Y1 U1 V1] [Y2 U2 V2] [Y3 U3 V3]`                                                 |
| 422     | `Y0 U0 Y1 V1 Y2 U2 Y3 V3`                  | `[Y0 U0 V1] [Y1 U0 V1] [Y2 U2 V3] [Y3 U2 V3]`                                                 |
| 411     | `Y0 U0 Y1 Y2 V2 Y3`                        | `[Y0 U0 V2] [Y1 U0 V2] [Y2 U0 V2] [Y3 U0 V2]`                                                 |
| 420     | `Y0 U0 Y1 Y2 U2 Y3`<br>`Y5 V5 Y6 Y7 V7 Y8` | `[Y0 U0 V5] [Y1 U0 V5] [Y2 U2 V7] [Y3 U2 V7]`<br>`[Y5 U0 V5] [Y6 U0 V5] [Y7U2 V7] [Y8 U2 V7]` |

![chrome\_MTeacI7PMZ](media/3d8ed9cfccdaf3c2650b3fb343a151138944f9a7.png)

| Sub Sampling ratio | Format                   |
| ------------------ | ------------------------ |
| 444                | AYUV                     |
| 422                | I422/J422/UYVY/YUYV      |
| 420                | I420/YU12/YV12/NV12/NV21 |

| Format  | Description                                                  |
| ------- | ------------------------------------------------------------ |
| I420    | YU12/IYUV 属于 YUV420P - `4:2:0` 12 Bit/Pixel 3 Planars(Y/U/V) |
| YV12    | 同 YU12 仅改变UV顺序                                               |
| NV12    | 属于 YUV420P - `4:2:0` 12 Bit/Pixel 2 Planars(Y/UV)            |
| NV21    | 同 NV21 仅 UV 排序改变                                             |
| YUV 422 |                                                              |

## Pixel Format

| Format | Figure                                                       |
| ------ | ------------------------------------------------------------ |
| AYUV   | ![image](media/de43f20d1338a5e4d0050d64ec85835ae2988a93.png) |
| YUY2   | ![image](media/20b3081bf459322aa3db78234e6c0698d61842a2.png) |
| UYVY   | ![image](media/2fc0d3a3040217c898e60cfcabeaee242be62e6a.png) |
| IMC1   | ![image](media/bfad5103c9df38a47731b7b7b25e170e50269b01.png) |
| IMC2   | ![image](media/5ce7fb8515e3ffabc55694617f16579e4baef341.png) |
| IMC3   | ![image](media/7f725d9183ce93de73357bebfb3ec22f9a68a294.png) |
| IMC4   | ![image](media/6e29361f7158870b2199c34e312bfe5a2f23d333.png) |
| YV12   | ![image](media/18d25056cbb0954ebfb9e71adedae3060565cdad.png) |
| NV12   | ![image](media/ddc3c7a36298f70a7da3d72dc3e2bab24f7c583a.png) |

## YUV \<--\> RGB

    Y'= 0.299*R' + 0.587*G' + 0.114*B'
    U'= -0.147*R' - 0.289*G' + 0.436*B' = 0.492*(B'- Y')
    V'= 0.615*R' - 0.515*G' - 0.100*B' = 0.877*(R'- Y')
    R' = Y' + 1.140*V'
    G' = Y' - 0.394*U' - 0.581*V'
    B' = Y' + 2.032*U'

| YUV                                                                       | YCbCr                                                        |
| ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| ![chrome\_bgGeKE4sTE](media/4d05585390ddbbeab465dc8ffa892d509706a9f1.png) | ![image](media/548c860eaffe6193600c91836fe9366fb69aec3e.png) |
