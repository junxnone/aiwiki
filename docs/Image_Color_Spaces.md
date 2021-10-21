---
Title | Image Color Spaces
-- | --
Create Date | `2020-11-11T06:09:50Z`
Update Date | `2021-10-21T18:41:15Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/41)

---
# Reference
- [Color model - wikipedia](https://en.wikipedia.org/wiki/Color_model)
- [Hue - wikipedia](https://en.wikipedia.org/wiki/Hue)
- [色彩](http://vr.theatre.ntu.edu.tw/fineart/chap04/chap04-02.htm)


# Brief
- Image Color Spaces - 颜色空间
  - RGB - 用于计算机图形学
  - YIQ/YUV/YCbCr - 用于视频
  - CMYK - 用于彩色打印
- Color model
- Others Color Spaces
  - CIE 1931 color space - `CIE 1931 RGB color space`/`CIE 1931 XYZ color space`
  - CIEUVW
  - CIELUV
  - CIELAB
- [颜色空间变换](/Image_Color_Spaces_Transforms)


## HSV
- HSV -  Hue/Saturation/Value

![image](https://user-images.githubusercontent.com/2216970/101112203-c1e39f80-3617-11eb-9c6b-62a5e9d387c9.png) | ![HSV_cone](https://user-images.githubusercontent.com/2216970/101111758-d6736800-3616-11eb-9695-de186dbb872e.jpg) | ![Hsv-hues-cf-lch-hues](https://user-images.githubusercontent.com/2216970/101111776-dd9a7600-3616-11eb-8d07-4d4587c762ab.png) 
-- | -- | --
 ![image](https://user-images.githubusercontent.com/2216970/101111902-25b99880-3617-11eb-9239-c1201c8c423b.png) | ![image](https://user-images.githubusercontent.com/2216970/101111876-15a1b900-3617-11eb-9b4b-433e812701e8.png) | ![image](https://user-images.githubusercontent.com/2216970/101112317-f9524c00-3617-11eb-8546-311d747d3007.png)


## RGB
- 人眼对于 `RGB` 三种颜色分量的敏感程度不同 `R<G<B`
- 均匀性较差, 使用 `欧氏距离` 度量相似性结果会合人眼视觉有较大偏差
