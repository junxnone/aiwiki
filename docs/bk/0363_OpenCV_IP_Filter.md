-----

| Title         | OpenCV IP Filter                                      |
| ------------- | ----------------------------------------------------- |
| Created @     | `2022-12-27T09:28:59Z`                                |
| Last Modify @ | `2022-12-27T09:28:59Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/363) |

-----

# Image Filtering

  - 用于处理 2D Image 中各种线性/非线性 `filtering`
  - **线性操作**: 相邻像素的加权和
  - **形态学操作**: 相邻像素的最小/最大值
  - ...
  - `Output Image` 拥有和 `Input Image` 相同的宽高和通道数
  - 需要通过扩展边界像素(BorderTypes) 来计算边界像素值
  - **Func**
      - [bilateralFilter](/OpenCV_bilateralFilter) - 双边滤波器 - 减少不需要的噪音,
        并保持边缘, 处理速度较慢
      - [boxFilter](/OpenCV_boxFilter) - 方框滤波
      - `blur` - 均值滤波
          - `blur(src, dst, ksize, anchor, borderType)` 等同于
            `boxFilter(src, dst, src.type(), ksize, anchor, true,
            borderType)`
      - `GaussianBlur` 采用高斯函数的权重计算
      - `medianBlur` 中值滤波
