-----

| Title     | Media Image Histogram                                 |
| --------- | ----------------------------------------------------- |
| Created @ | `2018-10-09T08:20:07Z`                                |
| Updated @ | `2024-01-15T06:27:36Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/342) |

-----

# Histogram 图像直方图

  - X - 像素值
  - Y - 相应的像素数量

| Gray                                                         | RGB                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/98d9e8da5d04095bde0eaa4c76cf4f824bac24b8.png) | ![image](media/2a3c177b549eea482d5935ab0b92c9aac94dbdfa.png) |

**计算 & 绘制函数**

  - cv.calcHist()
  - np.histogram()
  - np.bincount()
  - matplotlib.pyplot.hist()

## 直方图均衡

  - 将像素值范围均衡化到更大范围
  - 改善图像的对比度

| ![image](media/ede075218fd75f6154c7656097636af36d575230.png) | ![image](media/05706f4003776b5acd9fc6e4ebcdad25aa377a19.png) |
| ------------------------------------------------------------ | ------------------------------------------------------------ |

| 原图                                                           | cv.equalizeHist() - 全局直方图均衡                                  | cv.createCLAHE() - 自适应直方图均衡                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/7729bd4a0db352173b9ec14c70dee30b7082cbdb.png) | ![image](media/256bc23d464d07087fc6ad56c080224aa2e95957.png) | ![image](media/94707c31be24ef137b75775ee29c77aef80f592e.png) |

## 2D 直方图

  - RGB -\> HSV
      - H - \[0, 180\]
      - S - \[0, 256\]

**计算方法**

  - cv.calcHist(\[hsv\], \[0, 1\], None, \[180, 256\], \[0, 180, 0,
    256\])
  - np.histogram2d(h.ravel(),s.ravel(),\[180,256\],\[\[0,180\],\[0,256\]\])

![image](media/0592bdb30d7f45d65542e22a41948faeee5eb03b.png)

## 直方图反投影

  - 应用 - 分割部分同色物体

![image](media/492f0bfa8b1a1b59f7f6401ad61e9d74b14c2229.png)

## Reference

  - [OpenCV
    中的直方图](https://opencv.apachecn.org/#/docs/4.0.0/4.10-tutorial_py_histograms)
