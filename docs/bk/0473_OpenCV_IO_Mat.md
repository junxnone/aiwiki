-----

| Title     | OpenCV IO Mat                                         |
| --------- | ----------------------------------------------------- |
| Created @ | `2024-08-27T08:01:25Z`                                |
| Updated @ | `2026-11-26T10:06:58Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/473) |

-----

# OpenCV Mat

`Mat` 是 OpenCV 的核心数据结构：由「矩阵头」（尺寸、类型、step 等元信息）和指向实际数据的指针组成，图像在内存里就是一个
`Mat`。

## 内存布局

``` mermaid
flowchart LR
    H[Mat 头 rows cols type step data 指针] --> D[(像素数据 连续的一块内存)]
```

图中：Mat 头很小，记录如何解释数据；数据在另一块内存里，多个 Mat 头可以共享同一块数据（拷贝构造只拷贝头，见
[Core](https://github.com/junxnone/aiwiki/issues/425)）。

## elemSize

  - 元素大小
  - 元素指 CV\_8UC1/CV\_8UC3/CV\_32FC1/...
  - `elemSize1` : elemSize 一个通道 size

$$ \\text{elemSize}=\\text{elemSize1}\\times\\text{channels} $$

其中：`elemSize` 为一个元素（一个像素，含所有通道）占用的字节数；`elemSize1` 为单个通道占用的字节数；`channels`
为通道数。

| TYPE      | elemSize | elemSize1 |
| --------- | -------- | --------- |
| CV\_8UC1  | 1        | 1         |
| CV\_8UC3  | 3        | 1         |
| CV\_16UC1 | 2        | 2         |
| CV\_16UC3 | 6        | 2         |
| CV\_32FC1 | 4        | 4         |
| CV\_32FC4 | 16       | 4         |
| `...`     | `...`    | `...`     |

表中：

  - TYPE 命名：`CV_` + 位数 + 类型（U 无符号、S 有符号、F 浮点）+ `C` + 通道数，如 `CV_16UC3` 是
    16 位无符号、3 通道
  - 对比结论：`elemSize` 随通道数成倍增加，`elemSize1` 只取决于每个通道的数据类型

## step(stride)

  - 存储着各个维度占用的内存块的大小
  - step\[0\] = cols \* elemSize
  - step\[1\] = elemSize
  - **step1**: 以 elemSize1 为单位

$$
\\text{address}(i,j)=\\text{data}+i\\cdot\\text{step}\[0\]+j\\cdot\\text{step}\[1\]
$$

其中：

  - $i$：行号；$j$：列号；$\\text{data}$：数据起始地址
  - $\\text{step}\[0\]$：相邻两行起点之间的字节数（行跨度）；$\\text{step}\[1\]$：相邻两个元素之间的字节数
  - 对于连续存储的矩阵，$\\text{step}\[0\]=\\text{cols}\\times\\text{elemSize}$；对于
    ROI 子矩阵，$\\text{step}\[0\]$ 仍是原图的行跨度，所以行与行之间并不连续

## `.at`

  - 访问元素
  - `img.at(y, x)`

<!-- end list -->

``` cpp
uchar v = img.at<uchar>(y, x);              // 单通道 8 位
cv::Vec3b px = img.at<cv::Vec3b>(y, x);     // 3 通道 8 位，px[0] 是 B
```

  - 需要用模板参数指明元素类型，且与 `Mat` 的类型一致；每次访问会做范围检查（Debug 下），逐像素循环较慢

## `.ptr`

  - 访问矩阵某行, 返回指向矩阵某行开始的地址
  - `img->ptr(n)`

<!-- end list -->

``` cpp
for (int y = 0; y < img.rows; ++y) {
    uchar* row = img.ptr<uchar>(y);          // 第 y 行的起始地址
    for (int x = 0; x < img.cols; ++x) row[x] = 255 - row[x];
}
```

  - 按行取指针后再遍历，比 `.at` 更快，适合大量像素处理
  - 对比结论：随机访问个别像素用 `.at`，遍历整行用 `.ptr`

## Reference

  - [OpenCV:Mat中的step、elemSize和任意内存访问](https://zhuanlan.zhihu.com/p/507103729)
