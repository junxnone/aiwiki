---
Title | Image Color Spaces
-- | --
Create Date | `2020-11-11T06:09:50Z`
Update Date | `2021-10-25T02:36:19Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/41)

---
# Reference
- [Color model - wikipedia](https://en.wikipedia.org/wiki/Color_model)
- [Hue - wikipedia](https://en.wikipedia.org/wiki/Hue)
- [Color FAQ - Frequently Asked Questions Color](http://poynton.ca/notes/colour_and_gamma/ColorFAQ.html)
- [Gamma FAQ - Frequently Asked Questions about Gamma](http://poynton.ca/notes/colour_and_gamma/GammaFAQ.html)
- [Color Models - Intel IPP](https://www.intel.com/content/www/us/en/develop/documentation/ipp-dev-reference/top/volume-2-image-processing/image-color-conversion/color-models.html)
- [ColorSpace颜色空间简介](https://blog.csdn.net/zb1165048017/article/details/109003125)



# Brief
- Color Model  - 色彩模型 - 抽象数学模型分解色彩分量, 描述颜色
  - RGB - 用于计算机图形学 - 基于人眼感光细胞
  - CMYK - 用于彩色打印
  - [YUV](/YUV) - 用于视频
  - LAB - 基于人眼视觉神经
  - HSV/HSB
  - HSL
  - RYB
- Gamut - 色域 - 对颜色进行编码的方法
- Color Spaces - 色彩空间 - `色彩模型 + 色域`
  - Adobe RGB
  - sRGB - `standard RedGreenBlue`
- Others Color Spaces
  - CIE 1931 color space - `CIE 1931 RGB color space`/`CIE 1931 XYZ color space`
  - CIEUVW
  - CIELUV
  - CIELAB
- [颜色空间变换](/Image_Color_Spaces_Transforms)




## RGB & CMYK
- 人眼对于 `RGB` 三种颜色分量的敏感程度不同 `R<G<B`
- 均匀性较差, 使用 `欧氏距离` 度量相似性结果会合人眼视觉有较大偏差
- 光三原色 - 红/绿/蓝 - Red/Green/Blue
- 颜料三原色 - 青/洋红/黄 -Cyan/Magenta/Yellow

> 通过混合颜料无法得出纯粹的黑色，因此在印刷品中又加入了黑色（Black）得到 `CMYK`

![image](https://user-images.githubusercontent.com/2216970/138558889-6f82126e-d09f-4843-a451-f90cb7c41b65.png)


![chrome_BFsF54nopB](https://user-images.githubusercontent.com/2216970/138545570-af06d4d5-c327-4f1b-b119-479a48c9c416.png)
![chrome_VZC8n9V9VZ](https://user-images.githubusercontent.com/2216970/138545560-c90a757a-866e-483f-9647-c3e906ddb450.png)


## HSV/HSB
- HSV -  Hue/Saturation/Value(Brightness)
- Hue - 色调/色相 - 是什么颜色 - 取决于主波长
- Saturation - 饱和度 - 色彩浓淡/纯度 `颜色+白色` `饱和=纯色` 
  - 饱和度越高(低), 颜色越纯正(淡)
- Brightness - 明亮度  --> 黑色


![image](https://user-images.githubusercontent.com/2216970/138560166-34abfb71-63c4-4507-9751-835a700a4321.png) | ![image](https://user-images.githubusercontent.com/2216970/138560178-283f4163-43b4-4c2a-b0d3-355b69bf1ab6.png) 
-- | --
![image](https://user-images.githubusercontent.com/2216970/138560183-c81aa5f1-27f2-4847-9517-86a61794df80.png) | ![image](https://user-images.githubusercontent.com/2216970/138560185-704c7249-7fff-4a3b-a4c3-6eb811ecd039.png)



![image](https://user-images.githubusercontent.com/2216970/101112203-c1e39f80-3617-11eb-9c6b-62a5e9d387c9.png) | ![HSV_cone](https://user-images.githubusercontent.com/2216970/101111758-d6736800-3616-11eb-9695-de186dbb872e.jpg) | ![Hsv-hues-cf-lch-hues](https://user-images.githubusercontent.com/2216970/101111776-dd9a7600-3616-11eb-8d07-4d4587c762ab.png) 
-- | -- | --
 ![image](https://user-images.githubusercontent.com/2216970/101111902-25b99880-3617-11eb-9239-c1201c8c423b.png) | ![image](https://user-images.githubusercontent.com/2216970/101111876-15a1b900-3617-11eb-9b4b-433e812701e8.png) | ![image](https://user-images.githubusercontent.com/2216970/101112317-f9524c00-3617-11eb-8546-311d747d3007.png)


## HSL
- HSL - Hue/Saturation/Lightness


![image](https://user-images.githubusercontent.com/2216970/138561236-0caa4c51-94f5-4a08-8c25-fc909ad44477.png)

HSV | HSL
-- | --
![image](https://user-images.githubusercontent.com/2216970/138561823-d64682b6-58f6-4a7e-a345-c29693f42d47.png) | ![image](https://user-images.githubusercontent.com/2216970/138561831-2e5fa871-76e0-43a2-a2a9-c2eec1e1ac06.png)


