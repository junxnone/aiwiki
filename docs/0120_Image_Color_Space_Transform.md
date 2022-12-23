---
Title | Image Color Space Transform
-- | --
Created @ | `2021-10-21T18:40:38Z`
Last Modify @| `2022-12-23T13:23:54Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/120)

---

# Color Space 转换

## Reference
- [Pixel Format Naming Convention - GenICam](https://www.emva.org/wp-content/uploads/GenICam_PFNC_2_1.pdf)
- [Color conversions](https://docs.opencv.org/master/de/d25/imgproc_color_conversions.html)
- [cv.cvtColor() - OpenCV](https://github.com/junxnone/examples/issues/26)


## Transforms

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
