-----

| Title         | CV Feature Harris                                    |
| ------------- | ---------------------------------------------------- |
| Created @     | `2020-11-06T10:24:21Z`                               |
| Last Modify @ | `2022-12-23T14:42:02Z`                               |
| Labels        | \`\`                                                 |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/67) |

-----

# Harris Corner

## Reference

  - 1988 [A COMBINED CORNER AND EDGE
    DETECTOR](https://web.stanford.edu/class/cs231m/references/harris-stephens.pdf)
  - [Harris Corner Detector -
    wikipedia](https://en.wikipedia.org/wiki/Harris_Corner_Detector)
  - [图像处理特征不变算子系列之Harris算子](https://blog.csdn.net/kezunhai/article/details/11265167)
  - [Harris Corner Detection -
    OpenCV](https://www.docs.opencv.org/4.0.0/dc/d0d/tutorial_py_features_harris.html)
  - [An Analysis and Implementation of the Harris Corner
    Detector](https://ipolcore.ipol.im/demo/clientApp/demo.html?id=229)
  - [slides - Harris Corner
    Detector](https://www.slideshare.net/shihweihuang39/harris-corner-detector-and-face-recognition)
  - [A Comparative Study between Moravec and Harris Corner Detection of
    Noisy Images Using Adaptive Wavelet Thresholding
    Technique](https://arxiv.org/ftp/arxiv/papers/1209/1209.1558.pdf)
  - [feature -
    ppt](https://www.csie.ntu.edu.tw/~cyy/courses/vfx/07spring/lectures/handouts/lec04_feature_4up.pdf)
  - [Harris 角点 - 计算机视觉 北京邮电大学
    鲁鹏](https://www.bilibili.com/video/BV1nz4y197Qv?p=6)
  - [The Shi-Tomasi Corner
    Detector](https://aishack.in/tutorials/shitomasi-corner-detector/)
  - [Subpixel Corners: Increasing
    accuracy](https://aishack.in/tutorials/subpixel-corners-increasing-accuracy/)
  - [亚像素角点的求法](https://xueyayang.github.io/pdf_posts/%E4%BA%9A%E5%83%8F%E7%B4%A0%E8%A7%92%E7%82%B9%E7%9A%84%E6%B1%82%E6%B3%95.pdf)

## Brief

  - 1988 Harris Corner Detector Harris\&Stephens

| 检测原理                                                         |
| ------------------------------------------------------------ |
| ![image](media/4b88de7b835dab70298c8095e5cccb842501414e.png) |

-----

**公式推导**

| 响应公式 | ![image](media/d3740770eb17f98caf6ad40c16fca3ed33367856.png) |
| ---- | ------------------------------------------------------------ |
| 窗口函数 | ![image](media/7e9f5fc801759f1ede1cb99b5eb89492abed84e4.png) |

| 窗口图解 | ![image](media/ef1d0864a04a7a11ae5dc84591cba4413ca37275.png) | ![image](media/eabf6c6d367789f42407b9366ee5566e6120c62d.png) |
| ---- | ------------------------------------------------------------ | ------------------------------------------------------------ |

**通过 `泰勒展开式` 简化 为 u,v 相关的函数**

| ![image](media/97b082cd255ae2ae4712e6e73d17bedca2954325.png) | ![image](media/1f3f59f6ffd04eec956dd856fb79c34b60966be3.png) | ![image](media/9655a6d7c0c4b22419f9c1496ac4c3f4a0fbb13f.png) |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |

| ![image](media/b98059fe3e18e1b9c4862b098a0bff90ace7f404.png) | ![image](media/a7f23ad3203b392cc1f0cd63608d8a14daf7456b.png)                                                                                                                                    |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![image](media/f0829b526a1f01ad97d7b354f1c72cd8408d42b2.png) | ![image](media/b5cf1591f854841d5948d8e685505c3198747fe0.png) <br> ![image](media/94b11be37826f8add888387138f6e3b61cb8f70e.png) <br>![image](media/db609ccaea897c14d2970f39ad38b98c86e32a2c.png) |
| ![image](media/e9c30692925be2defb72007efc7e0f3a7a8521b3.png) | ![image](media/43bd3f7d42bcb555d67192d15c767ebbee6be35e.png)                                                                                                                                    |

## Pipelines

1.  Compute Gaussian derivatives at each pixel
2.  Compute second moment matrix M in a Gaussian window around each
    pixel
3.  Compute corner response function R
4.  Threshold R
5.  Find local maxima of response function(NMS)

## 扩展

### Shi-Tomasi

  - 减少计算量
  - ![image](media/b3dd753a1f168cb3cee3f0cad0d80fbbfce2a5ec.png) ==\>
    ![image](media/2934a0faf56ef3630f1ff0353e5553460ad04ab1.png)

| ![image](media/076eac34041137910c9d3d97c7e156b98d62ca3c.png) |
| ------------------------------------------------------------ |
| ![image](media/a2fdc85fa0ebca21c05e0ae9da7f75bbbc1a47b7.png) |

-----

**Harris vs Shi-Tomasi**
![1\_wvTlz05svCeCPu3MvJgeBQ](media/c0292d5a1afe47ba716d065a1a3970db94a2fab1.gif)

### Subpixel Corners

  - 增加精确度
  - Pixel - (56, 120)
      - Subpixel - (56.768, 120.1432)
