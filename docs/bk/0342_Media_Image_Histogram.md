-----

| Title     | Media Image Histogram                                 |
| --------- | ----------------------------------------------------- |
| Created @ | `2018-10-09T08:20:07Z`                                |
| Updated @ | `2024-01-15T06:42:18Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/342) |

-----

# Histogram 图像直方图

## 1D Histogram

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

## 2D Histogram

  - RGB -\> HSV
      - H - \[0, 180\]
      - S - \[0, 256\]

**计算方法**

  - cv.calcHist(\[hsv\], \[0, 1\], None, \[180, 256\], \[0, 180, 0,
    256\])
  - np.histogram2d(h.ravel(),s.ravel(),\[180,256\],\[\[0,180\],\[0,256\]\])

| ![image](media/65fd79fafafab1375ecd07470f098a0b3b569d05.png) | ![image](media/0592bdb30d7f45d65542e22a41948faeee5eb03b.png) |
| ------------------------------------------------------------ | ------------------------------------------------------------ |

## 3D Histogram

![image](media/1660d4c99090e21d76d91de8964f40538ca0b33d.png)

## 直方图均衡

  - 将像素值范围均衡化到更大范围
  - 改善图像的对比度

| ![image](media/ede075218fd75f6154c7656097636af36d575230.png) | ![image](media/05706f4003776b5acd9fc6e4ebcdad25aa377a19.png) |
| ------------------------------------------------------------ | ------------------------------------------------------------ |

| 原图                                                           | cv.equalizeHist() - 全局直方图均衡                                  | cv.createCLAHE() - 自适应直方图均衡                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/7729bd4a0db352173b9ec14c70dee30b7082cbdb.png) | ![image](media/256bc23d464d07087fc6ad56c080224aa2e95957.png) | ![image](media/94707c31be24ef137b75775ee29c77aef80f592e.png) |

## 直方图反投影

  - 应用 - 分割部分同色物体

![image](media/492f0bfa8b1a1b59f7f6401ad61e9d74b14c2229.png)

## Reference

  - [OpenCV
    中的直方图](https://opencv.apachecn.org/#/docs/4.0.0/4.10-tutorial_py_histograms)
  - [2D
    Histogram](https://docs.opencv.org/4.x/dd/d0d/tutorial_py_2d_histogram.html)
  - [3D
    histogram](https://docs.opencv.org/4.x/d1/d1d/tutorial_histo3D.html)
