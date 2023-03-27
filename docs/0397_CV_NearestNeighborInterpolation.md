---
Title | CV NearestNeighborInterpolation
-- | --
Created @ | `2020-04-08T05:48:22Z`
Updated @| `2023-03-27T14:27:22Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/397)

---


# Nearest Neighbor interpolation - 最近邻插值

- 将目标图像各点的像素值设为源图像中与其最近的点

---
**计算方法**
![image](https://user-images.githubusercontent.com/2216970/70605471-8a752980-1c35-11ea-9f11-3c9c01dbe5c6.png)
- (w1, h1) 原图宽高
- (w2, h2) 目标宽高

`Pixel Value @(Xi, Yi) = Pixels[floor(Xi * x_ratio), floor(Yi * y_ratio)]`

---
![image](https://user-images.githubusercontent.com/2216970/70603227-03be4d80-1c31-11ea-8eff-ba845413cc0b.png)

Scale | Image
-- | --
Original | ![image](https://user-images.githubusercontent.com/2216970/70603319-3f591780-1c31-11ea-850f-e8ecd2841821.png)
200% | ![image](https://user-images.githubusercontent.com/2216970/70603330-454ef880-1c31-11ea-8f67-bf7a9f14c6a8.png)
200% with black pixels | ![image](https://user-images.githubusercontent.com/2216970/70603359-57c93200-1c31-11ea-96ff-d42b7900d3c6.png)
130% | ![image](https://user-images.githubusercontent.com/2216970/70603367-5d267c80-1c31-11ea-8488-42ef27722727.png)
130% with black pixels | ![image](https://user-images.githubusercontent.com/2216970/70603380-66174e00-1c31-11ea-84ae-229171762c6e.png)
50% | ![image](https://user-images.githubusercontent.com/2216970/70603386-6adc0200-1c31-11ea-9e06-aed0f953ac30.png)

---
- 计算量较小
- 可能会造成插值生成的图像灰度上的不连续，在灰度变化的地方可能出现明显的锯齿状


## Refernece

- [图像处理: 五种 插值法](https://blog.csdn.net/jningwei/article/details/78822026)
- [Image scaling - wikipedia](https://en.wikipedia.org/wiki/Image_scaling)
- [数字图像处理笔记二 - 图片缩放(最近邻插值(Nearest Neighbor interpolation))](https://blog.csdn.net/haluoluo211/article/details/80918147)
- [Nearest Neighbor Image Scaling](http://tech-algorithm.com/articles/nearest-neighbor-image-scaling/)
- [Nearest-neighbor interpolation - wikipedia](https://en.wikipedia.org/wiki/Nearest-neighbor_interpolation)
