---
Title | Image Color Spaces
-- | --
Create Date | `2020-11-11T06:09:50Z`
Update Date | `2021-10-21T18:14:50Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/41)

---
# Reference
- [Color conversions](https://docs.opencv.org/master/de/d25/imgproc_color_conversions.html)
- [cv.cvtColor() - OpenCV](https://github.com/junxnone/examples/issues/26)
- [Hue - wikipedia](https://en.wikipedia.org/wiki/Hue)
- [色彩](http://vr.theatre.ntu.edu.tw/fineart/chap04/chap04-02.htm)


# Brief
- Image Color Spaces - 颜色空间
  - RGB - 用于计算机图形学
  - YIQ/YUV/YCbCr - 用于视频
  - CMYK - 用于彩色打印



Modes | Description
-- | --
RGB<br>- Red/Green/Blue | 
Gray | ![image](https://user-images.githubusercontent.com/2216970/98776339-b7275780-2429-11eb-84fe-e688c324bdc4.png)
CIE XYZ.Rec 709 with D65 white point | ![image](https://user-images.githubusercontent.com/2216970/98776369-c3131980-2429-11eb-93b3-af1efe716fba.png)
YCC/YCrCb | ![image](https://user-images.githubusercontent.com/2216970/98776407-d58d5300-2429-11eb-8bcf-2ca29c070d94.png)
HSV <br>- Hue/Saturation/Value<br>- 色相/饱和度/明度| ![image](https://user-images.githubusercontent.com/2216970/98776460-eb9b1380-2429-11eb-82be-3093e81bf0ed.png)
HSL<br>- Hue/Saturation/Lightness<br>- 色相/饱和度/亮度 | ![image](https://user-images.githubusercontent.com/2216970/98776483-f786d580-2429-11eb-9c33-42333a568e4d.png)
CIE Lab | ![image](https://user-images.githubusercontent.com/2216970/98776510-053c5b00-242a-11eb-8503-41a7f538cc5f.png)
CIE Luv | ![image](https://user-images.githubusercontent.com/2216970/98776527-0ec5c300-242a-11eb-9533-05cc5995c48d.png)
Bayer | ![image](https://user-images.githubusercontent.com/2216970/98776539-14bba400-242a-11eb-91d3-1f46d49f0610.png)

## HSV
- HSV -  Hue/Saturation/Value

![image](https://user-images.githubusercontent.com/2216970/101112203-c1e39f80-3617-11eb-9c6b-62a5e9d387c9.png) | ![HSV_cone](https://user-images.githubusercontent.com/2216970/101111758-d6736800-3616-11eb-9695-de186dbb872e.jpg) | ![Hsv-hues-cf-lch-hues](https://user-images.githubusercontent.com/2216970/101111776-dd9a7600-3616-11eb-8d07-4d4587c762ab.png) 
-- | -- | --
 ![image](https://user-images.githubusercontent.com/2216970/101111902-25b99880-3617-11eb-9239-c1201c8c423b.png) | ![image](https://user-images.githubusercontent.com/2216970/101111876-15a1b900-3617-11eb-9b4b-433e812701e8.png) | ![image](https://user-images.githubusercontent.com/2216970/101112317-f9524c00-3617-11eb-8546-311d747d3007.png)


## RGB
- 人眼对于 `RGB` 三种颜色分量的敏感程度不同 `R<G<B`
- 均匀性较差, 使用 `欧氏距离` 度量相似性结果会合人眼视觉有较大偏差
