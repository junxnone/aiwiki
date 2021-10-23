---
Title | PixelFormat
-- | --
Create Date | `2021-10-21T17:44:24Z`
Update Date | `2021-10-23T06:16:28Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/119)

---
# Reference
- [Pixel Format Naming Convention - GenICam](https://www.emva.org/wp-content/uploads/GenICam_PFNC_2_1.pdf)
- [GenICam Pixel Format Names and Values](https://www.emva.org/wp-content/uploads/GenICamPixelFormatValues.pdf)
- [Pixel and Planar Image Formats](https://www.intel.com/content/www/us/en/develop/documentation/ipp-dev-reference/top/volume-2-image-processing/image-color-conversion/pixel-and-planar-image-formats.html)


# Brief
- Pixel Format - Camera 输出图像的格式
  - Packed/Planar
  - `Monochromatic Formats` - 单色灰度/`Color Formats` - 彩色
- [YUV](/YUV_Format)


## Planar
- 按平面排列像素, 几个平面合成一个 `Pixel`


![image](https://user-images.githubusercontent.com/2216970/138544801-3eefb0b2-e8a8-4abe-a1df-74a622320b9f.png)


Images | Plane size & Layout
-- | --
3-palnes Images | ![image](https://user-images.githubusercontent.com/2216970/138544560-9817dbeb-6a7d-48c3-a3b7-09c556c96e2e.png)
2-palnes Images | ![image](https://user-images.githubusercontent.com/2216970/138544563-f6750eb4-7b0d-46d5-84b1-c90f1c17c3b6.png)



## 常见相关格式

大类 | 小类
-- | --
Mono | 8/8s/10/10Packed/12/12Packed/16
Bayer | GR8/RG8/GB8/BG8/GR10/RG10/GB10/BG10/GR12/RG12/GB12/BG12
RGB/BGR | 8/a8/10/12/10v1Packed/10p32
YUV | 422/411 - 8/
YCbcr | 422/411 - 8

- **YUV vs YCbCr ?**
  -  YUV - 用于模拟信号
  - YCbCr - 用于数字信号 - 方便压缩？？

