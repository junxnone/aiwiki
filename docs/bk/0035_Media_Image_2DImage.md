-----

| Title     | Media Image 2DImage                                  |
| --------- | ---------------------------------------------------- |
| Created @ | `2021-09-23T07:12:20Z`                               |
| Updated @ | `2026-11-25T16:30:47Z`                               |
| Labels    | \`\`                                                 |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/35) |

-----

# 2D 图像

2D 图像由二维像素阵列组成。理解它需要分清三件事：内存里像素怎么排布 (Pixel Format)、文件怎么存 (Image
Format)、数据从哪来 (2D Camera)。

## Pixel Format

  - mono8
  - ycbcr422\_8
  - bayerrggb
  - rgb8
  - bgr8
  - bayerbggr

上面是 GenICam 命名的常见像素格式，各自含义见
[像素格式](/0119_Media_Image_Camera_PixelFormat)：

| 格式                    | 含义                       | 详见                                           |
| --------------------- | ------------------------ | -------------------------------------------- |
| mono8                 | 8 bit 灰度，每像素 1 字节        | [像素格式](/0119_Media_Image_Camera_PixelFormat) |
| rgb8 / bgr8           | 8 bit 三通道，通道顺序不同         | [像素格式](/0119_Media_Image_Camera_PixelFormat) |
| ycbcr422\_8           | 8 bit YCbCr，`4:2:2` 采样   | [YUV](/0121_Media_Image_Color_Model_YUV)     |
| bayerrggb / bayerbggr | 传感器原始 Bayer 数据，每像素只有一种颜色 | [Bayer](/0784_Media_Image_Bayer)             |

表中：左列是格式名，中列说明数据含义，右列是对应的详细文章；bgr8 是 OpenCV 默认的内存顺序。

## Image Format

  - \[jpeg/jpg\]
  - \[png\]
  - \[bmp\]
  - \[raw\]
  - \[tiff\]

各格式的压缩方式、位深和选用见 [Image Format](/0782_Media_Image_Format)。

## 2D Camera

  - [Low Latency Camera](/0037_Media_Image_Camera_LowLatency)
  - 传感器与快门：[Sensor](/0788_Media_Image_Camera_Sensor)
  - 曝光与增益：[Exposure](/0789_Media_Image_Camera_Exposure)
  - 从 RAW 到图像的处理流程：[ISP](/0785_Media_Image_ISP)

## 相关

  - 色彩：[Color](/0126_Media_Image_Color)、[Gamma](/0783_Media_Image_Color_Gamma)
  - 几何变换：[Resize](/0347_Media_Image_Resize)、[Affine](/0786_Media_Image_Affine)、[透视变换](/0345_Media_Image_PT)
