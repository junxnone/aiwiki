-----

| Title         | OpenCV IP misc BIN                                    |
| ------------- | ----------------------------------------------------- |
| Created @     | `2019-05-24T08:05:26Z`                                |
| Last Modify @ | `2022-12-27T09:15:35Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/330) |

-----

# OpenCV 二值化

## Reference

  - [Python-OpenCV
    处理图像（七）：图像灰度化处理](https://blog.csdn.net/qq_26898461/article/details/50454371)
  - [opencv threshold
    tutorial](https://docs.opencv.org/master/db/d8e/tutorial_threshold.html)

## Brief

  - cv2.threshold
  - cv2.adaptiveThreshold

## 普通二值化

    ret, dst = cv2.threshold(src, thresh, maxval, type)

| Type                    | 公式                                                           | 图解                                                           |
| ----------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| cv2.THRESH\_BINARY      | ![image](media/25c20617798020bdaaa30afc78c2a909600fad65.png) | ![image](media/7d397d9a2c7a19dbda94445ad48c802a6a6f9ca8.png) |
| cv2.THRESH\_BINARY\_INV | ![image](media/a1c5aee465c9dcc6a4cd50067c66e54926740b87.png) | ![image](media/267f8b20899fcc122afea2665a65376b348ab3a0.png) |
| cv2.THRESH\_TRUNC       | ![image](media/cd38696104ae1a137c7b3c1fdb11a3a1ba490551.png) | ![image](media/9cff909ff69f2b382e643781502e2a5744e4fa5c.png) |
| cv2.THRESH\_TOZERO      | ![image](media/26e93496b652160ce246ac386a88cafcffe0a5c4.png) | ![image](media/03125879c1bec46dccda4d394662985f55a37786.png) |
| cv2.THRESH\_TOZERO\_INV | ![image](media/1efe7e9f6c3b9345d275b634c4a8f079b164fe67.png) | ![image](media/e5dcf3297b51a97518b5df23d63a33f09c848e48.png) |
| `source image`          |                                                              | ![image](media/63de0a4de557cec88cd1dc94b0944d74926cd339.png) |

**Examples**

| ![image](media/bc74798df9903aebb66772f86f58d4e995b87645.png) |
| ------------------------------------------------------------ |
| ![image](media/bd9276bbef73487bebae0668c9fcf9d401dff832.png) |

## 自适应二值化

    dst = cv2.adaptiveThreshold(src, maxval, thresh_type, type, Block Size, C)

  - `cv.ADAPTIVE_THRESH_MEAN_C` - 阈值为邻近区域平均值
  - `cv.ADAPTIVE_THRESH_GAUSSIAN_C` - 阈值是权重为高斯窗的邻域值的加权和

![image](media/f80f40442d21d72a9bdcab298d7b6cd2a34a893b.png)
