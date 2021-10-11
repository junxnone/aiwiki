---
Title | Feature Detection SIFT
-- | --
Create Date | `2021-10-11T07:39:39Z`
Update Date | `2021-10-11T07:39:39Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/69)

---


# Reference

- [自动化特征提取器：图像特征提取和深度学习](http://fe4ml.apachecn.org/#/docs/8.%E8%87%AA%E5%8A%A8%E5%8C%96%E7%89%B9%E5%BE%81%E6%8F%90%E5%8F%96%E5%99%A8%EF%BC%9A%E5%9B%BE%E5%83%8F%E7%89%B9%E5%BE%81%E6%8F%90%E5%8F%96%E5%92%8C%E6%B7%B1%E5%BA%A6%E5%AD%A6%E4%B9%A0)
- [SIFT特征详解](https://www.cnblogs.com/wangguchangqing/p/4853263.html)
- [SIFT算法详解](https://blog.csdn.net/zddblog/article/details/7521424)
- [SIFT 特征提取算法总结](https://www.cnblogs.com/liuchaogege/p/5155739.html)
- [SIFT特征提取分析](https://blog.csdn.net/abcjennifer/article/details/7639681)
- [Paper - Distinctive Image Features from Scale-Invariant Keypoints ](https://www.cs.ubc.ca/~lowe/papers/ijcv04.pdf)
- [SIFT算法的应用--目标识别之Bag-of-words模型](https://www.cnblogs.com/v-July-v/archive/2011/06/20/2091170.html)
- [Laplacian of Gaussian (LOG) 高斯拉普拉斯算子](https://blog.csdn.net/qq_25638133/article/details/83276318)


# Brief
- SIFT - Scale Invariant Feature Transform
- 尺度不变特征变换，由加拿大教授David G.Lowe提出的。SIFT特征对旋转、尺度缩放、亮度变化等保持不变性，是一种非常稳定的局部特征。
- 图像的局部特征，对旋转、尺度缩放、亮度变化保持不变，对视角变化、仿射变换、噪声也保持一定程度的稳定性。
- 独特性好，信息量丰富，适用于海量特征库进行快速、准确的匹配。
- 多量性，即使是很少几个物体也可以产生大量的SIFT特征
- 高速性，经优化的SIFT匹配算法甚至可以达到实时性
- 扩招性，可以很方便的与其他的特征向量进行联合。

**应用**
- BOW


## Steps

1.**构建尺度空间，检测极值点，获得尺度不变性** - 搜索所有尺度空间上的图像，通过高斯微分函数来识别潜在的对尺度和选择不变的兴趣点。
2. **特征点过滤并进行精确定位** - 在每个候选的位置上，通过一个拟合精细模型来确定位置尺度，关键点的选取依据他们的稳定程度。
3. **特征方向赋值** 基于图像局部的梯度方向，分配给每个关键点位置一个或多个方向，后续的所有操作都是对于关键点的方向、尺度和位置进行变换，从而提供这些特征的不变性。
4. **特征点描述** 在每个特征点周围的邻域内，在选定的尺度上测量图像的局部梯度，这些梯度被变换成一种表示，这种表示允许比较大的局部形状的变形和光照变换。

# 尺度空间
> 所谓尺度空间就相当于对一幅图片做一次高斯滤波，生成的图片就是一个尺度空间下的，再对这幅滤波后的图片循环往复的滤波，就会让图片变得越来越模糊，这样就形成了不同的“尺度。就是由清楚到模糊的一系列图片就是一系列的尺度，这些尺度放在一起就形成了一个尺度空间。

![image](https://user-images.githubusercontent.com/2216970/57970841-18977300-79b9-11e9-89b8-0a6d753ff1e6.png)

**不同σ下图像尺度空间：**
![image](https://user-images.githubusercontent.com/2216970/57971907-c8271200-79c6-11e9-85a1-a62c1ba81af8.png)
> 2kσ中的2是必须的，尺度空间是连续的。在  Lowe的论文中 ，将第0层的初始尺度定为1.6（最模糊），图片的初始尺度定为0.5（最清晰）. 在检测极值点前对原始图像的高斯平滑以致图像丢失高频信息，所以 Lowe 建议在建立尺度空间前首先对原始图像长宽扩展一倍，以保留原始图像信息，增加特征点数量。尺度越大图像越模糊。


**图像金字塔的建立**
对于一幅图像I,建立其在不同尺度(scale)的图像，也成为子八度（octave），这是为了scale-invariant，也就是在任何尺度都能够有对应的特征点，第一个子八度的scale为原图大小，后面每个octave为上一个octave降采样的结果，即原图的1/4（长宽分别减半），构成下一个子八度（高一层金字塔）。
![image](https://user-images.githubusercontent.com/2216970/57971175-218a4380-79bd-11e9-8f19-cb5a233cb206.png)
![image](https://user-images.githubusercontent.com/2216970/57980058-92cb0480-7a58-11e9-9e36-84b1cfb6b4f5.png)

