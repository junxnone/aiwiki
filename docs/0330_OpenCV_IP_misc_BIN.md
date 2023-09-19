---
Title | OpenCV IP misc BIN
-- | --
Created @ | `2019-05-24T08:05:26Z`
Updated @| `2023-09-19T14:54:57Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/330)

---
# OpenCV 二值化



- cv2.threshold
- cv2.adaptiveThreshold


## 普通二值化

```
ret, dst = cv2.threshold(src, thresh, maxval, type)
```

Type | 公式 | 图解
-- | -- | --
cv2.THRESH_BINARY | ![image](https://user-images.githubusercontent.com/2216970/98774732-901b5680-2426-11eb-8237-f0b034180130.png) | ![image](https://user-images.githubusercontent.com/2216970/98774880-db356980-2426-11eb-99f8-1dca928aebf6.png)
cv2.THRESH_BINARY_INV | ![image](https://user-images.githubusercontent.com/2216970/98774743-97426480-2426-11eb-8ddd-6f0b24ae781d.png) | ![image](https://user-images.githubusercontent.com/2216970/98774897-e5576800-2426-11eb-9ebd-f98335ed8ad2.png)
cv2.THRESH_TRUNC | ![image](https://user-images.githubusercontent.com/2216970/98774758-a0333600-2426-11eb-92ba-c7fd996ed8a3.png) | ![image](https://user-images.githubusercontent.com/2216970/98774902-e8eaef00-2426-11eb-84a3-df22b70a2017.png)
cv2.THRESH_TOZERO | ![image](https://user-images.githubusercontent.com/2216970/98774776-a7f2da80-2426-11eb-8b29-5b1895de82c8.png) |![image](https://user-images.githubusercontent.com/2216970/98774905-ec7e7600-2426-11eb-8689-d6ee2bfc0517.png)
cv2.THRESH_TOZERO_INV | ![image](https://user-images.githubusercontent.com/2216970/98774787-ade8bb80-2426-11eb-9d28-2a4dc5485e57.png) | ![image](https://user-images.githubusercontent.com/2216970/98774910-eee0d000-2426-11eb-8ce2-142b0182a287.png)
`source image` | | ![image](https://user-images.githubusercontent.com/2216970/98775012-2ea7b780-2427-11eb-85e5-90119b2ec5d6.png)


**Examples**

 ![image](https://user-images.githubusercontent.com/2216970/98204043-3c18f980-1f70-11eb-8f2a-e639e325681d.png)
-- | 
![image](https://user-images.githubusercontent.com/2216970/58337228-e766e900-7e77-11e9-857d-de78cd4ab156.png)

## 自适应二值化

- 根据图像局部像素值来取阈值


```
void cv::adaptiveThreshold(InputArray 	src,
                      OutputArray 	dst,
                      double 	maxValue,
                      int 	adaptiveMethod,
                      int 	thresholdType,
                      int 	blockSize,
                      double 	C 
)	
```

参数 | 描述
-- | --
maxValue | 符合条件的值赋予的值, 二值化中的大值, 小值为 0
adaptiveMethod | 使用的自适应算法 `ADAPTIVE_THRESH_MEAN_C`/`ADAPTIVE_THRESH_GAUSSIAN_C`
thresholdType | 二值化方法
blockSize | 计算阈值的邻域
C | 减去的常数


### 自适应算法
#### ADAPTIVE_THRESH_MEAN_C
- 取相邻区域均值
- `T(x,y)` 为点 `(x,y)` 相邻区域 `blockSize x blockSize` 的均值 减去 `C`
- 相当于用 `boxfilter` 求阈值

<script src="https://junxnone.github.io/emgithub/embed-v2.js?target=https%3A%2F%2Fgithub.com%2Fopencv%2Fopencv%2Fblob%2F157b0e7760117a60de457a4ae874b0709edc4e53%2Fmodules%2Fimgproc%2Fsrc%2Fthresh.cpp%23L1695-L1697&style=default&type=code&showBorder=on&showLineNumbers=on&showFileMeta=on&showFullPath=on&showCopy=on"></script>

#### ADAPTIVE_THRESH_GAUSSIAN_C
- 取相邻区域高斯加权和
- `T(x,y)` 为点 `(x,y)` 相邻区域 `blockSize x blockSize` 的 高斯加权和 减去 `C`
- 相当于用 `GaussianBlur` 求阈值


<script src="https://junxnone.github.io/emgithub/embed-v2.js?target=https%3A%2F%2Fgithub.com%2Fopencv%2Fopencv%2Fblob%2F157b0e7760117a60de457a4ae874b0709edc4e53%2Fmodules%2Fimgproc%2Fsrc%2Fthresh.cpp%23L1698C51-L1705&style=default&type=code&showBorder=on&showLineNumbers=on&showFileMeta=on&showFullPath=on&showCopy=on"></script>


### 二值化方法

Enum | 描述 
-- | -- 
THRESH_BINARY | 大于阈值取大值，否则为 0
THRESH_BINARY_INV | 与上面相反
THRESH_TRUNC | 大于阈值取阈值，其他不变 
THRESH_TOZERO | 小于阈值取 0 ，其他不变
THRESH_TOZERO_INV | 与上面相反
THRESH_OTSU |  Otsu 算法 选择最佳阈值 
THRESH_TRIANGLE | Triangle 算法选择最佳阈值 


> 详情见  [ThresholdTypes](https://docs.opencv.org/4.x/d7/d1b/group__imgproc__misc.html#gaa9e58d2860d4afa658ef70a9b1115576)



```
dst = cv2.adaptiveThreshold(src, maxval, thresh_type, type, Block Size, C)
```
- `cv.ADAPTIVE_THRESH_MEAN_C` - 阈值为邻近区域平均值
- `cv.ADAPTIVE_THRESH_GAUSSIAN_C` - 阈值是权重为高斯窗的邻域值的加权和

![image](https://user-images.githubusercontent.com/2216970/98205820-cb73dc00-1f73-11eb-841c-2a631a07e753.png)


## Reference
- [Python-OpenCV 处理图像（七）：图像灰度化处理](https://blog.csdn.net/qq_26898461/article/details/50454371) 
- [opencv threshold tutorial](https://docs.opencv.org/master/db/d8e/tutorial_threshold.html)
- [ADAPTIVE_THRESH_MEAN_C Impl](https://github.com/opencv/opencv/blob/157b0e7760117a60de457a4ae874b0709edc4e53/modules/imgproc/src/thresh.cpp#L1695-L1697)
- [ADAPTIVE_THRESH_GAUSSIAN_C Impl](https://github.com/opencv/opencv/blob/157b0e7760117a60de457a4ae874b0709edc4e53/modules/imgproc/src/thresh.cpp#L1698C51-L1705)
- [ThresholdTypes](https://docs.opencv.org/4.x/d7/d1b/group__imgproc__misc.html#gaa9e58d2860d4afa658ef70a9b1115576)

