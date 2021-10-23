---
Title | YUV
-- | --
Create Date | `2021-02-07T03:28:00Z`
Update Date | `2021-10-23T06:38:01Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/121)

---
# Reference

- [详解 YUV 格式（I420/YUV420/NV12/NV12/YUV422）](https://www.jianshu.com/p/358bf8b7eacc)
- [YUV pixel formats](https://www.fourcc.org/yuv.php)
- [YUV - videolan-wiki](https://wiki.videolan.org/YUV#Semi-planar)
- [Recommended 8-Bit YUV Formats for Video Rendering](https://docs.microsoft.com/en-us/windows/win32/medfound/recommended-8-bit-yuv-formats-for-video-rendering)

# Brief
- Packed YUV Formats - YUV 打包在一起
- Planar YUV Formats - YUV 分离
- YUV 
  - 420
    - I420/YU12
    - YV12
    - NV12
    - NV21
  - 422
    - I422
    - J422
    - UYVY
    - YUYV
  - 444
    - AYUV
  - 411

----
![image](https://user-images.githubusercontent.com/2216970/107135823-fdad2500-6938-11eb-83a2-447f4006bf42.png)

---


Format | Description | 
-- | --
I420 | YU12/IYUV 属于 YUV420P - 4:2:0 12 Bit/Pixel 3 Planars(Y/U/V)
YV12 | 同 YU12 仅改变UV顺序
NV12 | 属于 YUV420P - 4:2:0 12 Bit/Pixel 2 Planars(Y/UV)
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



