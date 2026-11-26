-----

| Title     | OpenCV IP                                             |
| --------- | ----------------------------------------------------- |
| Created @ | `2022-11-28T06:22:43Z`                                |
| Updated @ | `2026-11-26T10:11:40Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/316) |

-----

# Image Processing

`imgproc` 是 OpenCV 里图像处理的主模块，包含滤波、几何变换、颜色处理、形态学、特征与分割等。

  - Image Filtering
  - Geometric Image Transformations
  - Miscellaneous Image Transformations
  - Drawing Functions
  - Color Space Conversions
  - ColorMaps in OpenCV
  - Planar Subdivision
  - Histograms
  - Structural Analysis and Shape Descriptors
  - Motion Analysis and Object Tracking
  - Feature Detection
  - Object Detection
  - Image Segmentation
  - C API
  - Hardware Acceleration Layer

## 各部分说明与相关文章

| 部分                                  | 内容              | 相关文章                                                                                                                                                                                  |
| ----------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Image Filtering                     | 平滑、边缘等滤波        | [Image Filtering](https://github.com/junxnone/aiwiki/issues/363)、[GaussianBlur](https://github.com/junxnone/aiwiki/issues/320)、[Sobel](https://github.com/junxnone/aiwiki/issues/443) |
| Geometric Image Transformations     | 缩放、旋转、仿射、透视     |                                                                                                                                                                                       |
| Miscellaneous Image Transformations | 阈值、距离变换、积分图等    | [distanceTransform](https://github.com/junxnone/aiwiki/issues/346)、[Thresholding](https://github.com/junxnone/aiwiki/issues/99)                                                       |
| Color Space Conversions             | 颜色空间转换          | [Color Space 转换](https://github.com/junxnone/aiwiki/issues/120)                                                                                                                       |
| ColorMaps in OpenCV                 | 伪彩色             | [ColorMaps](https://github.com/junxnone/aiwiki/issues/349)                                                                                                                            |
| Feature Detection                   | 边缘、直线、圆、角点      | [Hough](https://github.com/junxnone/aiwiki/issues/340)                                                                                                                                |
| Hardware Acceleration Layer         | SIMD、OpenCL 等加速 | [HAL](https://github.com/junxnone/aiwiki/issues/435)                                                                                                                                  |

表中：对比结论：处理一般流程为「读取 → 滤波去噪 → 颜色或几何变换 → 特征 / 分割」，各部分文章可在上表中按需查阅。
