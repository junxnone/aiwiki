-----

| Title         | Media Image Resize                                    |
| ------------- | ----------------------------------------------------- |
| Created @     | `2019-06-13T02:44:22Z`                                |
| Last Modify @ | `2022-12-27T03:09:43Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/347) |

-----

## Reference

  - [Image scaling -
    wikipedia](https://en.wikipedia.org/wiki/Image_scaling)
  - [数字图像处理笔记二 - 图片缩放(最近邻插值(Nearest Neighbor
    interpolation))](https://blog.csdn.net/haluoluo211/article/details/80918147)
  - [Nearest Neighbor Image
    Scaling](http://tech-algorithm.com/articles/nearest-neighbor-image-scaling/)
  - [Nearest-neighbor interpolation -
    wikipedia](https://en.wikipedia.org/wiki/Nearest-neighbor_interpolation)
  - [Bilinear Image
    Scaling](http://tech-algorithm.com/articles/bilinear-image-scaling/)
  - [双三次插值算法(bicubic
    interpolation)与图形学和计算方法的关系](https://blog.csdn.net/nandina179/article/details/85330552)
  - [Bicubic interpolation -
    wikipedia](https://en.wikipedia.org/wiki/Bicubic_interpolation)
  - [paper - Cubic convolution interpolation for digital image
    processing](http://www.ncorr.com/download/publications/keysbicubic.pdf)
    ----
    [Download](https://github.com/junxnone/tech-io/files/3949833/keysbicubic.pdf)
  - [图像处理: 五种
    插值法](https://blog.csdn.net/jningwei/article/details/78822026)

## Brief

| Algo                   | Description                                                                       |
| ---------------------- | --------------------------------------------------------------------------------- |
| Nearest Neighbor - 最近邻 | 使用 scale 坐标最近的值作为插值<br> <li> 损失 `空间对称性 - Alignment`</li>                          |
| Bilinear - 双线性         | <li>计算量比最近邻大</li><li>没有灰度不连续的缺点</li><li>具有低通滤波性质，使高频分量受损，图像轮廓可能会有一点模糊，看起来更光滑</li> |
| Bicubic 双三次            |                                                                                   |
| Area 区域关系              |                                                                                   |
| Lanczos                |                                                                                   |

### Tips

  - multi-segmentation label mask image resize 会改变label的值
      - 可使用 `最近邻插值` 法解决
      - `cv2.resize(image, (w, h), interpolation=cv2.INTER_NEAREST)`
  - 水波纹和插值方法有关？？

## OpenCV

`dst = cv.resize( src, dsize[, dst[, fx[, fy[, interpolation]]]] )`

  - interpolation , default cv.INTER\_LINEAR

| Flags                   | Comment                                                                                                                                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| cv.INTER\_NEAREST       | nearest neighbor interpolation 最近邻插值                                                                                                                                                                |
| cv.INTER\_LINEAR        | bilinear interpolation 双线性插值                                                                                                                                                                        |
| cv.INTER\_CUBIC         | bicubic interpolation                                                                                                                                                                               |
| cv.INTER\_AREA          | resampling using pixel area relation. It may be a preferred method for image decimation, as it gives moire'-free results. But when the image is zoomed, it is similar to the INTER\_NEAREST method. |
| cv.INTER\_LANCZOS4      | Lanczos interpolation over 8x8 neighborhood                                                                                                                                                         |
| cv.INTER\_LINEAR\_EXACT | Bit exact bilinear interpolation                                                                                                                                                                    |
| cv.INTER\_MAX           | mask for interpolation codes                                                                                                                                                                        |
| cv.WARP\_FILL\_OUTLIERS | flag, fills all of the destination image pixels. If some of them correspond to outliers in the source image, they are set to zero                                                                   |
| cv.WARP\_INVERSE\_MAP   | flag, inverse transformationFor example, linearPolar or logPolar transforms:                                                                                                                        |

    image = cv2.imread('xxx')
    image_resize = cv2.resize(image, (w, h))

  - image.shape = (h, w, c)
  - resize 使用的是 (w, h)
  - numpy empty image - `np.zeros((h, w, c), dtype=np.uint8)`
