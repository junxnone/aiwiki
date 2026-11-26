-----

| Title     | OpenCV IP Filter                                      |
| --------- | ----------------------------------------------------- |
| Created @ | `2022-12-27T09:28:59Z`                                |
| Updated @ | `2026-11-26T10:11:38Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/363) |

-----

# Image Filtering

  - 用于处理 2D Image 中各种线性/非线性 `filtering`
  - **线性操作**: 相邻像素的加权和
  - **形态学操作**: 相邻像素的最小/最大值
  - ...
  - `Output Image` 拥有和 `Input Image` 相同的宽高和通道数
  - 需要通过扩展边界像素(BorderTypes) 来计算边界像素值
  - **Func**
      - [bilateralFilter](https://github.com/junxnone/aiwiki/issues/317)
        - 双边滤波器 - 减少不需要的噪音, 并保持边缘, 处理速度较慢
      - [boxFilter](/OpenCV_boxFilter) - 方框滤波
      - [blur](https://github.com/junxnone/aiwiki/issues/441) - 均值滤波
          - `blur(src, dst, ksize, anchor, borderType)` 等同于
            `boxFilter(src, dst, src.type(), ksize, anchor, true,
            borderType)`
      - [GaussianBlur](https://github.com/junxnone/aiwiki/issues/320)
        采用高斯函数的权重计算
      - [medianBlur](https://github.com/junxnone/aiwiki/issues/442) 中值滤波
      - [Sobel](https://github.com/junxnone/aiwiki/issues/443) -
        求图像梯度，用于边缘检测

## 线性滤波的数学形式

$$
\\texttt{dst}(x,y)=\\sum\_{i,j}K(i,j)\\cdot\\texttt{src}\\big(x+i-a\_x,\\
y+j-a\_y\\big) $$

其中：

  - $\\texttt{src},\\texttt{dst}$：输入、输出图像；$K$：滤波核（kernel），大小为
    $k\_w\\times k\_h$
  - $(i,j)$：核内的下标；$(a\_x,a\_y)$：核的锚点（anchor），默认为中心
  - 即输出像素是输入邻域像素按核权重的加权和；核权重不同就得到不同的滤波（均值、高斯、Sobel 等）
  - 严格说 OpenCV 的 `filter2D` 做的是**相关**而非卷积，二者相差核的翻转；对称核（均值、高斯）结果相同

## 各函数对比

| 函数               | 类型  | 核权重                  | 擅长        |
| ---------------- | --- | -------------------- | --------- |
| blur / boxFilter | 线性  | 全部相等                 | 快速平滑      |
| GaussianBlur     | 线性  | 高斯分布                 | 抑制高斯噪声    |
| medianBlur       | 非线性 | 取中值，无核权重             | 去椒盐噪声     |
| bilateralFilter  | 非线性 | 空间权重 $\\times$ 灰度差权重 | 平滑同时保边，较慢 |
| Sobel            | 线性  | 差分核                  | 求梯度、边缘    |

表中：

  - **线性**：输出是邻域的加权和；**非线性**：用排序或条件权重，不能写成单一核
  - 对比结论：只想降噪选 Gaussian；有椒盐噪声选 median；需要保边选 bilateral；要边缘用 Sobel 或 Canny

## 边界处理

核在图像边缘处会超出图像，需要扩展边界（BorderTypes）：

| 模式                   | 效果          |
| -------------------- | ----------- |
| `BORDER_CONSTANT`    | 用常数填充       |
| `BORDER_REPLICATE`   | 复制边缘像素      |
| `BORDER_REFLECT_101` | 以边缘为轴镜像（默认） |

表中：默认的 `BORDER_REFLECT_101` 能避免边缘出现人为的亮线。
