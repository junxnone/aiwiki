---
Title | Media Image Color Model YUV
-- | --
Created @ | `2021-02-07T03:28:00Z`
Last Modify @| `2022-12-23T13:32:38Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/121)

---
# YUV Color Model

## Reference

- [详解 YUV 格式（I420/YUV420/NV12/NV12/YUV422）](https://www.jianshu.com/p/358bf8b7eacc)
- [YUV pixel formats](https://www.fourcc.org/yuv.php)
- [YUV - videolan-wiki](https://wiki.videolan.org/YUV#Semi-planar)
- [Recommended 8-Bit YUV Formats for Video Rendering](https://docs.microsoft.com/en-us/windows/win32/medfound/recommended-8-bit-yuv-formats-for-video-rendering)
- [一文理解 YUV](https://zhuanlan.zhihu.com/p/75735751)


## Brief

- YUV Color Space - 用于模拟信号彩色电视广播
  - Y - Luminance/Luma - 明亮度/灰度 - `[0,1] [0,255]`
  - UV - Chrominance/Chroma  - 色度 - `[-0.5, 0.5] [-128, 127]`
  - Y 与 UV 分开 解决 彩色电视 和 黑白电视 兼容问题
- YCbCr 来源于 YUV, 用于处理数字视频(一些编码标准中提到的 `YUV` 其实是指 `YCbCr`)
  - Cb - 蓝色分量
  - Cr - 红色分量
- 采样格式 - 444/422/411/420
- 存储格式
  - Packed  - YUV 打包在一起
  - Planar  - YUV 分离

## 采样格式 - Downsampling 
- `4:4:4` / `4:2:2` / `4:2:0` /`4:1:1`
- 几个 Y 共享 UV - 节约带宽



Pattern | 码流 | 像素点
-- | -- | --
444 | `Y0 U0 V0 Y1 U1 V1 Y2 U2 V2 Y3 U3 V3` | `[Y0 U0 V0] [Y1 U1 V1] [Y2 U2 V2] [Y3 U3 V3]`
422 | `Y0 U0 Y1 V1 Y2 U2 Y3 V3` | `[Y0 U0 V1] [Y1 U0 V1] [Y2 U2 V3] [Y3 U2 V3]`
411 | `Y0 U0 Y1 Y2 V2 Y3` | `[Y0 U0 V2] [Y1 U0 V2] [Y2 U0 V2] [Y3 U0 V2]`
420 | `Y0 U0 Y1 Y2 U2 Y3`<br>`Y5 V5 Y6 Y7 V7 Y8` | `[Y0 U0 V5] [Y1 U0 V5] [Y2 U2 V7] [Y3 U2 V7]`<br>`[Y5 U0 V5] [Y6 U0 V5] [Y7U2 V7] [Y8 U2 V7]`



![chrome_MTeacI7PMZ](https://user-images.githubusercontent.com/2216970/138546210-0a8b1aff-1feb-40c3-a7d0-dd6fbbcaddb0.png)

Sub Sampling ratio | Format
-- | --
444 | AYUV
422 | I422/J422/UYVY/YUYV
420 | I420/YU12/YV12/NV12/NV21


Format | Description | 
-- | --
I420 | YU12/IYUV 属于 YUV420P - `4:2:0` 12 Bit/Pixel 3 Planars(Y/U/V)
YV12 | 同 YU12 仅改变UV顺序
NV12 | 属于 YUV420P - `4:2:0` 12 Bit/Pixel 2 Planars(Y/UV)
NV21 | 同 NV21 仅 UV 排序改变
YUV 422 |



## Pixel Format

Format | Figure
-- | --
AYUV | ![image](https://user-images.githubusercontent.com/2216970/107135853-3ea53980-6939-11eb-9a29-e2b26c1e1b5e.png)
YUY2 | ![image](https://user-images.githubusercontent.com/2216970/107135859-48c73800-6939-11eb-95f2-e4853f4d5c11.png)
UYVY | ![image](https://user-images.githubusercontent.com/2216970/107135864-4e248280-6939-11eb-87ac-9094dedebd2b.png)
IMC1 | ![image](https://user-images.githubusercontent.com/2216970/107135878-63011600-6939-11eb-8199-b159b14b51a7.png)
IMC2 | ![image](https://user-images.githubusercontent.com/2216970/107135873-5c729e80-6939-11eb-9a29-03e3219f80cb.png)
IMC3 | ![image](https://user-images.githubusercontent.com/2216970/107135877-60062580-6939-11eb-81af-010b8dfe54b6.png)
IMC4 | ![image](https://user-images.githubusercontent.com/2216970/107135882-68f6f700-6939-11eb-9460-08bee6be9a2c.png)
YV12 | ![image](https://user-images.githubusercontent.com/2216970/107135890-81671180-6939-11eb-8f5b-475f76a5db9f.png)
NV12 | ![image](https://user-images.githubusercontent.com/2216970/107135891-83c96b80-6939-11eb-98c8-c121813f0d9c.png)

## YUV <--> RGB

```
Y'= 0.299*R' + 0.587*G' + 0.114*B'
U'= -0.147*R' - 0.289*G' + 0.436*B' = 0.492*(B'- Y')
V'= 0.615*R' - 0.515*G' - 0.100*B' = 0.877*(R'- Y')
R' = Y' + 1.140*V'
G' = Y' - 0.394*U' - 0.581*V'
B' = Y' + 2.032*U'
```


YUV | YCbCr
-- | --
![chrome_bgGeKE4sTE](https://user-images.githubusercontent.com/2216970/138547312-e9b4ba37-b027-4f72-b7e4-30e64ad9db57.png) | ![image](https://user-images.githubusercontent.com/2216970/138547293-a7617dbb-448b-4814-b3d8-d8a71cdcde77.png)
