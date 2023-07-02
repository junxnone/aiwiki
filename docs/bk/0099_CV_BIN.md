-----

| Title         | CV BIN                                               |
| ------------- | ---------------------------------------------------- |
| Created @     | `2020-11-11T04:02:36Z`                               |
| Last Modify @ | `2022-12-23T14:36:55Z`                               |
| Labels        | \`\`                                                 |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/99) |

-----

# Thresholding 二值化

## Reference

  - [Thresholding (image
    processing)](https://en.wikipedia.org/wiki/Thresholding_%28image_processing%29)
  - [auto threshold](https://imagej.net/Auto_Threshold.html)
  - [十三种基于直方图的图像全局二值化算法原理、实现、代码及效果](https://www.cnblogs.com/adas/p/5430793.html)
  - [Survey over image thresholding techniques and quantitative
    performance
    evaluation](https://fei.edu.br/~psergio/VisaoComputacional/Artigos%20para%20Estudo/Threshold_survey.pdf)
  - [Picture thresholding using an iterative selection method]()
  - 1986 [Minimum Error Thresholding - J.Kittler]()
  - [Otsu's method -
    Wikipedia](https://en.wikipedia.org/wiki/Otsu%27s_method)
      - [A Threshold Selection Method from Gray-Level
        Histograms](http://raw.githubusercontent.com/jinglou/p2016-rss-small-target/master/refs/Otsu.pdf)
  - [Otsu
    Thresholding](http://www.labbookpages.co.uk/software/imgProc/otsuThreshold.html)
    -- [CN](https://blog.csdn.net/felix86/article/details/38684465)
  - [图像二值化方法介绍](https://blog.csdn.net/JJBOOM425/article/details/100645594)

## Brief

  - Image Thresholding - 图像二值化(非黑即白的简化问题)
  - Global thresholding - 使用同一阈值二值化
  - Local(dynamic ) thresholding - 动态阈值二值化
  - Multilevel thresholding - 类似于分割图像
      - [Multi-Otsu
        Thresholding](https://scikit-image.org/docs/dev/auto_examples/segmentation/plot_multiotsu.html#multi-otsu-thresholding)
  - 其他分类方法
      - Histogram shape-based
      - Clustering-based
      - Entropy-based
      - Object-attribute-based
      - Spatial

| Global thresholding | Description                                            |
| ------------------- | ------------------------------------------------------ |
| Otsu                | 取 `前景/背景` 最大类间方差作为阈值                                   |
| ISODATA             | `threshold = (average background + average objects)/2` |
| Mean                | mean(image)                                            |
| Triangle            |                                                        |
| Minimum             |                                                        |
| InterModes          |                                                        |
| Yen                 |                                                        |
| Li                  |                                                        |
| Huang               |                                                        |
| MaxEntropy          |                                                        |
| MinError            |                                                        |
| Moments             |                                                        |
| Percentile          |                                                        |
| RenyiEntropy        |                                                        |
| Shanbhag            |                                                        |

| Local thresholding | Description |
| ------------------ | ----------- |
| Niblack            |             |
| Sauvola            |             |

## OTSU

  - 把图像 `pixel` 分为两类 `前景/背景`
  - 计算最小类内方差作为最佳阈值
  - 对于二分类，最小化类内方差等价于最大化类间方差

| 类内方差 | ![image](media/f3e0ef6512d1623fb96096a4a4ce382da98e980a.png) |
| ---- | ------------------------------------------------------------ |
| 类间方差 | ![image](media/9390728c261fcded47e3c82caf0ef5133b0bcf9b.png) |

| source image           | ![image](media/318175b77a36fe0688838270528a27d5fe8dfdfd.png) |
| ---------------------- | ------------------------------------------------------------ |
| between class variance | ![image](media/934ac95de8f7c84728b5b5470e293952eef0da9b.png) |
| target image           | ![image](media/6fdff4a2fabe3192bccee635859d8c5e1e96cae7.png) |

## Local thresholding

| Original                                                     | Global thresholding                                          | Local thresholding                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/46a8d7c0ceb643aaf6f4cb42b5e60d77ba604372.png) | ![image](media/856f5ac6893fa03f6afaf2983cb5aba86d802be4.png) | ![image](media/adccf439ee348c3ebaa8ddaa3fd64fa489b9015e.png) |

### Local + OTSU

| Original                                                     | Local OTSU                                                   | Original \>= Local OTSU                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/46a8d7c0ceb643aaf6f4cb42b5e60d77ba604372.png) | ![image](media/347d9814d86810c6e2967ee8314a74c1c27613ea.png) | ![image](media/35b21235cbb3b43c122929669560c7d3b1bb01b2.png) |

## Some API

  - [scikit-image
    Thresholding](https://github.com/junxnone/aiwiki/issues/331)
  - [OpenCV Threshold](https://github.com/junxnone/aiwiki/issues/330)
