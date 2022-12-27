---
Title | Tools OpenCV Read Image
-- | --
Created @ | `2018-12-11T05:52:41Z`
Last Modify @| `2022-12-27T06:57:49Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/361)

---
## Reference
- [关于cv2.imread()读取图像为BGR问题](https://blog.csdn.net/liu13364876993/article/details/79867061)

## Read
- [cv2.imread](https://docs.opencv.org/3.4.3/d4/da8/group__imgcodecs.html#ga288b8b3da0892bd651fce07b3bbd3a56)
- [Flags](https://docs.opencv.org/3.4.3/d4/da8/group__imgcodecs.html#ga61d9b0126a3e57d9277ac48327799c80)
- In the case of color images, the decoded images will have the channels stored in B G R order.

> OpenCV 读取图像的格式 为 `BGR`, 而其他很多工具(matplotlib/...)需要 `RGB` format Image, 可以使用 `cv2.cvtColor()` 转换

## BGR -> RGB

-  [ cv2.cvtColor](https://docs.opencv.org/3.4.3/d7/d1b/group__imgproc__misc.html#ga397ae87e1288a81d2363b61574eb8cab)
> Converts an image from one color space to another.  

- [ColorConversionCodes](https://docs.opencv.org/3.4.3/d7/d1b/group__imgproc__misc.html#ga4e0972be5de079fed4e3a10e24ef5ef0)
- [Color conversions](https://docs.opencv.org/3.4.3/de/d25/imgproc_color_conversions.html)
