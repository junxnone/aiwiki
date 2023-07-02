-----

| Title     | CV NearestNeighborInterpolation                       |
| --------- | ----------------------------------------------------- |
| Created @ | `2020-04-08T05:48:22Z`                                |
| Updated @ | `2023-03-27T14:27:22Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/397) |

-----

# Nearest Neighbor interpolation - 最近邻插值

  - 将目标图像各点的像素值设为源图像中与其最近的点

-----

**计算方法** ![image](media/07200b6477746fac0c690d35cc3d575a601def0b.png)

  - (w1, h1) 原图宽高
  - (w2, h2) 目标宽高

`Pixel Value @(Xi, Yi) = Pixels[floor(Xi * x_ratio), floor(Yi *
y_ratio)]`

-----

![image](media/a5337b784b4b867752c5710247faf0b521984803.png)

| Scale                  | Image                                                        |
| ---------------------- | ------------------------------------------------------------ |
| Original               | ![image](media/12690fe59d3557e299c9be8d725fb7883adb31e0.png) |
| 200%                   | ![image](media/09adc77a5c39c8758a68bf6936e093d49372018b.png) |
| 200% with black pixels | ![image](media/92b29dbd36cdcdc95c393489e9323be46a76aa27.png) |
| 130%                   | ![image](media/a2919acce56a209a62b13483a003d9d616734d24.png) |
| 130% with black pixels | ![image](media/107216e8213449b0661bc74ee156124133134322.png) |
| 50%                    | ![image](media/fc24b3fb6cca3580deae8ee0684d14d4370b3ab1.png) |

-----

  - 计算量较小
  - 可能会造成插值生成的图像灰度上的不连续，在灰度变化的地方可能出现明显的锯齿状

## Refernece

  - [图像处理: 五种
    插值法](https://blog.csdn.net/jningwei/article/details/78822026)
  - [Image scaling -
    wikipedia](https://en.wikipedia.org/wiki/Image_scaling)
  - [数字图像处理笔记二 - 图片缩放(最近邻插值(Nearest Neighbor
    interpolation))](https://blog.csdn.net/haluoluo211/article/details/80918147)
  - [Nearest Neighbor Image
    Scaling](http://tech-algorithm.com/articles/nearest-neighbor-image-scaling/)
  - [Nearest-neighbor interpolation -
    wikipedia](https://en.wikipedia.org/wiki/Nearest-neighbor_interpolation)
