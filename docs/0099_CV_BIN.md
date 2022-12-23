---
Title | CV BIN
-- | --
Created @ | `2020-11-11T04:02:36Z`
Last Modify @| `2022-12-23T14:33:58Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/99)

---

# Thresholding 二值化

## Reference
- [Thresholding (image processing)](https://en.wikipedia.org/wiki/Thresholding_%28image_processing%29)
- [auto threshold](https://imagej.net/Auto_Threshold.html)
- [十三种基于直方图的图像全局二值化算法原理、实现、代码及效果](https://www.cnblogs.com/adas/p/5430793.html)
- [Survey over image thresholding techniques and quantitative performance evaluation](https://fei.edu.br/~psergio/VisaoComputacional/Artigos%20para%20Estudo/Threshold_survey.pdf)
- [Picture thresholding using an iterative selection method]()
- 1986 [Minimum Error Thresholding - J.Kittler]()
- [Otsu's method - Wikipedia](https://en.wikipedia.org/wiki/Otsu%27s_method)
  - [A Threshold Selection Method from Gray-Level Histograms](http://raw.githubusercontent.com/jinglou/p2016-rss-small-target/master/refs/Otsu.pdf)
- [Otsu Thresholding](http://www.labbookpages.co.uk/software/imgProc/otsuThreshold.html)  -- [CN](https://blog.csdn.net/felix86/article/details/38684465)
- [图像二值化方法介绍](https://blog.csdn.net/JJBOOM425/article/details/100645594)

## Brief
- Image Thresholding - 图像二值化(非黑即白的简化问题)
- Global thresholding - 使用同一阈值二值化
- Local(dynamic ) thresholding - 动态阈值二值化
- Multilevel thresholding - 类似于分割图像 
  - [Multi-Otsu Thresholding](https://scikit-image.org/docs/dev/auto_examples/segmentation/plot_multiotsu.html#multi-otsu-thresholding)
- 其他分类方法
  - Histogram shape-based
  - Clustering-based
  - Entropy-based
  - Object-attribute-based
  - Spatial 



Global thresholding | Description
-- | --
Otsu | 取 `前景/背景` 最大类间方差作为阈值
ISODATA | `threshold = (average background + average objects)/2`
Mean | mean(image)
Triangle | 
Minimum
InterModes |
Yen
Li |
Huang
MaxEntropy
MinError
Moments
Percentile
RenyiEntropy
Shanbhag


Local thresholding | Description
-- | --
Niblack
Sauvola


## OTSU
- 把图像 `pixel` 分为两类 `前景/背景` 
- 计算最小类内方差作为最佳阈值
- 对于二分类，最小化类内方差等价于最大化类间方差

类内方差 | ![image](https://user-images.githubusercontent.com/2216970/98883101-c1e4f980-24c8-11eb-9d74-38e650eb26ef.png)
-- | --
类间方差 | ![image](https://user-images.githubusercontent.com/2216970/98883197-12f4ed80-24c9-11eb-9ca5-80dce36f26e2.png)

source image | ![image](https://user-images.githubusercontent.com/2216970/98887448-f9f03a80-24d0-11eb-95d4-8cea6193ca58.png)
-- | -- 
between class variance | ![image](https://user-images.githubusercontent.com/2216970/98888545-23aa6100-24d3-11eb-868b-47c3ab1c699c.png)
target image | ![image](https://user-images.githubusercontent.com/2216970/98887525-18563600-24d1-11eb-9ef4-3bdf23da47a0.png)

## Local thresholding

Original  | Global thresholding | Local thresholding
-- | -- | --
![image](https://user-images.githubusercontent.com/2216970/98890370-c9130400-24d6-11eb-94b8-37905e79fd57.png) | ![image](https://user-images.githubusercontent.com/2216970/98890376-cdd7b800-24d6-11eb-98bd-3523e43c2480.png) | ![image](https://user-images.githubusercontent.com/2216970/98890389-d4fec600-24d6-11eb-93ed-2fa8a5941895.png)

### Local + OTSU

Original | Local OTSU | Original >= Local OTSU
-- | -- | --
![image](https://user-images.githubusercontent.com/2216970/98890370-c9130400-24d6-11eb-94b8-37905e79fd57.png) | ![image](https://user-images.githubusercontent.com/2216970/98891165-979b3800-24d8-11eb-9237-e862bff5eb5d.png) | ![image](https://user-images.githubusercontent.com/2216970/98891176-9cf88280-24d8-11eb-801a-df7eafab295f.png)

## Some API

- [scikit-image Thresholding](https://github.com/junxnone/examples/issues/224)
- [OpenCV Threshold](https://github.com/junxnone/examples/issues/61)

