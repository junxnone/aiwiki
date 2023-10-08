---
Title | OpenCV IP Filter bilateralFilter
-- | --
Created @ | `2022-11-28T06:40:30Z`
Updated @| `2023-10-08T15:34:04Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/317)

---
# Bilateral Filter 双边滤波

- 普通滤波器导致图像边缘处也被模糊, 因此诞生了 双边滤波
- 赋予点不同距离的点不同的权重，赋予差值不同的点不同权重
- **双边**
  - Domain Filter (空域信息): 考虑像素在空间距离上的关系
  - Range Filter (值域信息): 差值越小，边缘的概率越小，权重应该越高


## 原理
- **滤波函数:** $\huge h(x)=k^{-1}(x)\int_{-\infty}^{+\infty}\int_{-\infty}^{+\infty}f(\xi)c(\xi,x)s(f(\xi),f(x))d\xi$
- k的作用是归一化，使各权重因子的和为1

### Domain Filter (Geometric)

$\huge h(x)=k_d^{-1}(x)\int_{-\infty}^{+\infty}\int_{-\infty}^{+\infty}f(\xi)c(\xi,x)d\xi$

- $c(\xi,x)$ 测量邻域中心点 x 和近邻点 $\xi$ 的色度(?像素)接近度

$\huge c(\xi,x)=e^{-\frac{1}{2}(\frac{d(\xi,x)}{\sigma_d})^2}$

- $d(\xi,x) = d(\xi - x) = \left\|| \xi - x \right\||$ 是 欧式距离


### Range Filter (Photometric)


$\huge h(x)=k_r^{-1}(x)\int_{-\infty}^{+\infty}\int_{-\infty}^{+\infty}f(\xi)s(f(\xi),f(x))d\xi$

- $s(f(\xi),f(x))$ 测量邻域中心点 x 和近邻点 $\xi$ 的几何接近度

$\huge   s(\xi,x)=e^{-\frac{1}{2}(\frac{\delta(f(\xi),f(x))}{\sigma_r})^2}$

$\huge \delta(\phi,\textbf{f}) = \delta(\phi - \textbf{f}) = \left\|| \phi - \textbf{f}\right\||$

## 不同 $σ_d$ 和 $σ_r$ 效果
- 两个 sigma 值为 kernel 的方差，方差越大，说明该项对于权重的影响越大
  - sigma_d 变大，表示更多采用近邻的值作平滑，说明图像的空间信息更重要，即相近相似。
  - sigma_d变小（sigma_r相对更大），表示和自己同一类的条件变得苛刻，从而强调值域的相似性
- sigma_d 表示的是空域的平滑，因此对于没有边缘的，变化慢的部分更适合；sigma_r 表示值域的差别，因此强调这一差别，即增加 sigma_r 可以让像素值的影响更大

![image](https://user-images.githubusercontent.com/2216970/204224127-33c792f5-969e-4af1-9c92-a8f36c0a6c02.png)



## Tips

- 对于彩色图片，由于两种颜色中可能有其他完全不同的颜色，因此不像灰度图那样，仅仅是 blurred ，而是会产生 auras like 的奇怪的晕圈，所以在双边滤波的过程中，将RGB转换到 CIE-Lab 色彩空间，这个空间与人的主管色彩辨识能力相关，因此可以改善这一缺陷。


### OpenCV API

```
void cv::bilateralFilter(InputArray 	src,
                        OutputArray 	dst,
                        int 	d,
                        double 	sigmaColor,
                        double 	sigmaSpace,
                        int 	borderType = BORDER_DEFAULT 
                        )	
```

- **d**: 过滤直径, 比较大时(>5) 会处理比较慢
- **sigma** 比较小时(<10), 影响较小, 比较大时(>150), 卡通化
  - **sigmaColor**:  Color Space sigma 值越大，相近像素值权重越大 (Range Filter)
  - **sigmaSpace** Coordinate Space sigma, 值越大, 远距离点权重越大 (Domain Filter)



## Reference

- [Bilateral Filtering for Gray and Color Images](https://homepages.inf.ed.ac.uk/rbf/CVonline/LOCAL_COPIES/MANDUCHI1/Bilateral_Filtering.html) [paper - [Bilateral Filtering for Gray and Color Images.pdf](https://github.com/junxnone/aiwiki/files/12840067/Bilateral.Filtering.for.Gray.and.Color.Images.pdf)]
- [Bilateral Filtering: Theory and Applications](https://people.csail.mit.edu/sparis/publi/2009/fntcgv/Paris_09_Bilateral_filtering.pdf)
- [双边滤波原理（Bilateral Filtering）](https://zhuanlan.zhihu.com/p/161665205)

