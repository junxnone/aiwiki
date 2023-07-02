-----

| Title     | OpenCV data                                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2022-12-28T07:18:27Z`                                |
| Updated @ | `2022-12-28T07:48:33Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/364) |

-----

# 数据结构

## 数据类型

  - \[8/16/32/64\] - bit
  - \[U/S/F\] - 8U/8S/16U/16S32F/64F
      - U 无符号整数
      - S 有符号整数
      - F 浮点数
  - C\[1/2/3/4\] - 通道数 - 8UC1/8UC3/8UC4
      - C1 Gray
      - C3 Color Image \[BGR\]
      - C4 `BGR + Alpha`

## Mat n 维矩阵

  - **cols** 列，图像宽度
  - **rows** 行，图像高度
  - **channels** 通道，1/2/3/4 GRAY=1, BGR/RGB=3, RGBA=4
  - **type** 类型 \[`8/16/32/64`\]\[`U/S/F`\]C\[`1/2/3/4`\]
  - **data** 数据存放地址

### Matx 固定矩阵类

  - 用于编译时已知类型和大小的小矩阵
  - 用于减少动态内存分配和加速计算

### Vec 固定向量

  - 继承于 Matx
  - cols = 1
  - Vec\[`2/3/4/6/8`\]\[`b/d/f/i/s/w`\]
      - b - uchar
      - d - double
      - f - float
      - i - int
      - s - short
      - w ushort

#### Scalar

  - 4 个元素的 Vector
  - 继承 Vec - `=Vec<double, 4>`

## Point 点

  - 定义了 2/3 维空间中的点 `(x, y)` / `(x, y, z)`
  - Point\[2/3\]\[i/l/f/d\]
      - i - int
      - l - int64
      - f - float
      - d - double

## Rect

  - 定义一个矩形 `(h, w, x, y)`
      - `xy` 为 Top-Left Corner
  - Rect2\[i/d/f\]
