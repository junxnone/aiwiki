-----

| Title     | Media Image Camera PixelFormat                        |
| --------- | ----------------------------------------------------- |
| Created @ | `2021-10-21T17:44:24Z`                                |
| Updated @ | `2026-11-25T16:21:39Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/119) |

-----

# 像素格式

## Reference

  - [Pixel Format Naming Convention -
    GenICam](https://www.emva.org/wp-content/uploads/GenICam_PFNC_2_1.pdf)
  - [GenICam Pixel Format Names and
    Values](https://www.emva.org/wp-content/uploads/GenICamPixelFormatValues.pdf)
  - [Pixel and Planar Image
    Formats](https://www.intel.com/content/www/us/en/develop/documentation/ipp-dev-reference/top/volume-2-image-processing/image-color-conversion/pixel-and-planar-image-formats.html)

## Brief

  - Pixel Format - Camera 输出图像的格式
      - Packed(Pixel-Order)/Planar
      - `Monochromatic Formats` - 单色灰度/`Color Formats` - 彩色
  - [YUV](/YUV)

## Packed

  - Packed - Pixel-Order

| Format    | Channel Values Order          |
| --------- | ----------------------------- |
| RGB       | `R0 G0 B0 R1 G1 B1 R2 G2 B2`  |
| RGBA      | `R0 G0 B0 A0 R1 G1 B1 A1`     |
| BGR       | `B0 G0 R0 A0 B1 G1 R1 A1`     |
| YUV       | `Y0 U0 V0 Y1 U1 V1 Y2 U2 V2`  |
| YUV 422   | `Y0 U0 V0 A0 Y1 U1 V1 A1`     |
| YCbCr     | `Y0 Cb0 Cr0 Y1 Cb1 Cr1`       |
| YCbCr 422 | `Y0 Cb0 Y1 Cr0 Y2 Cb1 Y3 Cr1` |

## Planar

  - 按平面排列像素, 几个平面合成一个 `Pixel`

![image](media/6b403f95f12ea4cfdaba6aa7200a972ce1f39e2a.png)

| Images          | Plane size & Layout                                          |
| --------------- | ------------------------------------------------------------ |
| 3-planes Images | ![image](media/2846873952ec9a64a33a7b7facfac60a6a341f01.png) |
| 2-planes Images | ![image](media/b8a7debd8fae22250f6c9918c4b5f30e8dc52f2c.png) |

## 常见相关格式

| 大类      | 小类                                                      |
| ------- | ------------------------------------------------------- |
| Mono    | 8/8s/10/10Packed/12/12Packed/16                         |
| Bayer   | GR8/RG8/GB8/BG8/GR10/RG10/GB10/BG10/GR12/RG12/GB12/BG12 |
| RGB/BGR | 8/a8/10/12/10v1Packed/10p32                             |
| YUV     | 422/411 - 8/                                            |
| YCbcr   | 422/411 - 8                                             |

### YUV vs YCbCr

| Name  | 信号类型 | 取值范围                                                               | 说明                                                                   |
| ----- | ---- | ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| YUV   | 模拟   | $Y\\in\[0,1\]$, $U,V$ 带符号                                          | 用于 PAL/NTSC 模拟电视, 由 RGB 线性变换得到                                       |
| YCbCr | 数字   | 8 bit 下 limited range $Y\\in\[16,235\]$, $C\_b,C\_r\\in\[16,240\]$ | 是 YUV 的缩放平移版本, 用于 H.264/H.265 等数字视频标准 (JPEG 使用 full range, 即 0\~255) |

表中：`信号类型` 说明它出现在模拟还是数字链路里；`取值范围` 说明 8 bit 整数如何表示。YCbCr 把带符号的色差平移到 $128$
附近, 使其可以用无符号整数存储, 因此数字场景里说的 `YUV` 绝大多数实际指 YCbCr (Pixel Format 名称如
`YUY2`、`NV12` 也沿用 YUV 叫法)。公式和范围的细节见
[YUV](/0121_Media_Image_Color_Model_YUV)。
