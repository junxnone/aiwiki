-----

| Title         | Media Image Color Space Transform                     |
| ------------- | ----------------------------------------------------- |
| Created @     | `2021-10-21T18:40:38Z`                                |
| Last Modify @ | `2022-12-23T13:32:35Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/120) |

-----

# Color Space 转换

## Reference

  - [Pixel Format Naming Convention -
    GenICam](https://www.emva.org/wp-content/uploads/GenICam_PFNC_2_1.pdf)
  - [Color
    conversions](https://docs.opencv.org/master/de/d25/imgproc_color_conversions.html)
  - [cv.cvtColor() -
    OpenCV](https://github.com/junxnone/examples/issues/26)

## Transforms

| Modes                                            | Description                                                  |
| ------------------------------------------------ | ------------------------------------------------------------ |
| RGB<br>- Red/Green/Blue                          |                                                              |
| Gray                                             | ![image](media/891224a990c41389f82fc6d1084a95e77f766273.png) |
| CIE XYZ.Rec 709 with D65 white point             | ![image](media/5890c79d91df4eaaf66e586f9177563916616922.png) |
| YCC/YCrCb                                        | ![image](media/d364e4c7fa5baa9d94aacf0c0a227a10884119a1.png) |
| HSV <br>- Hue/Saturation/Value<br>- 色相/饱和度/明度    | ![image](media/f3324bde6b1f6844db8406f8f13412881940d702.png) |
| HSL<br>- Hue/Saturation/Lightness<br>- 色相/饱和度/亮度 | ![image](media/ca8d85c5005040cc30ad5a9332e8ecfaa578d3e7.png) |
| CIE Lab                                          | ![image](media/36028e256eabfcfe41075c5dff349955bd7c5268.png) |
| CIE Luv                                          | ![image](media/48d55f349cb1349fd45a22062ef9cdb3409c743c.png) |
| Bayer                                            | ![image](media/cba43fd710abeede70dae1ebcc32f52ba2955edc.png) |
