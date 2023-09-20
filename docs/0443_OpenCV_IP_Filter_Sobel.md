---
Title | OpenCV IP Filter Sobel
-- | --
Created @ | `2023-09-20T15:23:49Z`
Updated @| `2023-09-20T15:23:49Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/443)

---
# 用于边缘检测的线性滤波器 Sobel
- Sobel 算子 在水平和垂直方向上做像素值的差分，得到图像梯度近似值
- Sobel算子对灰度渐变和噪声较多的图像处理效果较好，但是Sobel算子对边缘定位不是很准确(图像的边缘不止一个像素),因此精度要求不是很高时，Sobel比较常用

```
void cv::Sobel(InputArray 	src,
            OutputArray 	dst,
            int 	ddepth,
            int 	dx,
            int 	dy,
            int 	ksize = 3,
            double 	scale = 1,
            double 	delta = 0,
            int 	borderType = BORDER_DEFAULT 
)		
```

参数 | 描述
-- | --
ddepth | 输出图像的深度
dx | x 方向的差分阶数 `0`/`1`
dy | y 方向的差分阶数 `0`/`1`
ksize | 边缘检测时模板大小, 默认为 3
scale | 对导数计算结果缩放，默认为 1
delta | 计算结果 默认偏值
borderType | 图像边界填充方法, 见 [BorderTypes](https://docs.opencv.org/4.x/d2/de8/group__core__array.html#ga209f2f4869e304c82d07739337eae7c5)


横向边缘(dx)  | 纵向边缘(dy)
-- | --
![Image](https://user-images.githubusercontent.com/2216970/268812598-1ae6415a-2495-4b0c-a6c4-dab6bc6a09c7.png) | ![Image](https://user-images.githubusercontent.com/2216970/268812615-441beae3-ccb3-4fd1-b0da-1c156b8a326f.png)


## Sobel 算子

### x 方向

-1 | 0 | 1
-- | -- | --
-2 | 0 | 2
-1 | 0 | 1






### y 方向

-1 | -2 | -1
-- | -- | --
0 | 0 | 0
1 | 2 | 1





## Scharr 算子

- 当 `ksize = -1` 时，[使用 scharr kernel](https://github.com/opencv/opencv/blob/157b0e7760117a60de457a4ae874b0709edc4e53/modules/imgproc/src/deriv.cpp#L169-L172), 即 perf test 中的 `scharrViaSobelFilter`

### x 方向

-3 | 0 | 3
-- | -- | --
-10 | 0 | 10
-3 | 0 | 3

### y 方向

-3 | -10 | -3
-- | -- | --
0 | 0 | 0
3 | 10 | 3


## perf test 中的 ROI

- perf test 中 ROI 是指[处理图像时只取部分处理](https://github.com/opencv/opencv/blob/157b0e7760117a60de457a4ae874b0709edc4e53/modules/imgproc/perf/perf_sepfilters.cpp#L75)，但是可选不同的边界填充模式, `BORDER_ISOLATED` 选项不使用 ROI 外的像素生成边界

> When the source image is a part (ROI) of a bigger image, the function will try to use the pixels outside of the ROI to form a border. To disable this feature and always do extrapolation, as if src was not a ROI, use borderType | [BORDER_ISOLATED](https://docs.opencv.org/4.x/d2/de8/group__core__array.html#gga209f2f4869e304c82d07739337eae7c5a4fcb77ae62e1e1336c1c2b24a441995c).



## Reference
- [Sobel OpenCV Impl](https://github.com/opencv/opencv/blob/157b0e7760117a60de457a4ae874b0709edc4e53/modules/imgproc/src/deriv.cpp#L414)
- [Depth combinations](https://docs.opencv.org/4.x/d4/d86/group__imgproc__filter.html#filter_depths)
- [Sobel算子](https://www.cnblogs.com/zhaobinyouth/p/12171497.html)
- [图像梯度的解释及相关梯度算子的实现](https://blog.csdn.net/literacy_wang/article/details/109640726)

