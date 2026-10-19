---
Title | OpenCV data
-- | --
Created @ | `2022-12-28T07:18:27Z`
Updated @| `2026-10-19T05:24:02Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/364)

---
# OpenCV 数据结构

## 数据类型

- [8/16/32/64] - bit
- [U/S/F] - 8U/8S/16U/16S32F/64F
  - U 无符号整数
  - S 有符号整数
  - F 浮点数
- C[1/2/3/4] - 通道数 - 8UC1/8UC3/8UC4
  - C1 Gray
  - C3 Color Image [BGR]
  - C4 `BGR + Alpha`

组合起来就是 `CV_[位数][U/S/F]C[通道数]` 这个固定格式的类型常量（如 `CV_8UC3`），创建/判断 `Mat` 类型时用的都是这一组常量：

| 类型常量 | 单通道取值范围 | 典型用途 |
|---|---|---|
| `CV_8U` | 0 ~ 255 | 最常见的图像存储格式（每个像素每通道 1 字节） |
| `CV_8S` | -128 ~ 127 | 较少用，部分需要带符号差值的场景 |
| `CV_16U` | 0 ~ 65535 | 高位深图像（如医学影像、部分深度相机原始数据） |
| `CV_16S` | -32768 ~ 32767 | 需要带符号的 16 位数据（如滤波/梯度计算的中间结果） |
| `CV_32F` | 约 ±3.4×10³⁸（单精度浮点） | 算法计算过程中的中间结果，很多算法内部都转成 float 计算避免精度/溢出问题 |
| `CV_64F` | 约 ±1.8×10³⁰⁸（双精度浮点） | 精度要求更高的场景，如相机标定里的矩阵运算 |

代码里常用的查询方式：

```cpp
mat.type();      // 返回完整的类型常量，如 CV_8UC3
mat.depth();      // 只返回深度部分，如 CV_8U（不含通道数信息）
mat.channels();   // 只返回通道数，如 3
mat.elemSize();   // 每个像素占用的字节数 = (位数/8) × 通道数
```


## Mat  n 维矩阵

- **cols** 列，图像宽度
- **rows** 行，图像高度
- **channels** 通道，1/2/3/4 GRAY=1, BGR/RGB=3, RGBA=4
- **type** 类型 [`8/16/32/64`][`U/S/F`]C[`1/2/3/4`]
- **data** 数据存放地址——`Mat` 用**引用计数**管理这块内存，`Mat b = a;` 这种赋值默认只拷贝头信息（`cols`/`rows`/`type`/`data` 指针等），`a`、`b` 指向同一块数据，改 `b` 的内容 `a` 也会跟着变；真正需要独立一份数据时要显式调用 `a.clone()` 或 `a.copyTo(b)`。这是 OpenCV 里最容易踩的坑之一——很多"改了一个变量，另一个也莫名其妙变了"的 bug 根源都在这里。内存在最后一个引用它的 `Mat` 析构（或手动调用 `.release()`）时才会真正释放
- **多维支持**：标题里的"n 维"不是说说而已——`Mat` 确实支持超过 2 维，用 `cv::Mat(int ndims, const int* sizes, int type)` 这个构造函数创建（如 3 维体数据），但日常图像处理绝大多数场景用的都是 2 维（`rows`/`cols`），本文后面的例子也都基于 2 维，多维场景了解有这个能力即可，不用的时候不用特意记它的用法
- **step**：每一行数据在内存里实际占用的字节数（可能比 `cols × elemSize()` 大，因为部分 `Mat` 的每行末尾会补齐对齐字节），这是理解"为什么不能直接用 `cols*rows*channels` 下标去访问原始内存"的关键——要正确定位任意像素的地址，必须用 `step` 而不是简单按列数计算；
- **isContinuous()**：整个 `Mat` 的数据在内存里是否连续存放（没有行间填充）。大多数独立创建的 `Mat` 是连续的，但对已有 `Mat` 做 ROI 裁剪（`mat(Rect(...))`）得到的子矩阵通常不连续——这时如果想把数据当作一维数组处理（如 `reshape(1, 1)`），要先判断/处理这个情况。

### 构造与元素访问

```cpp
cv::Mat img(480, 640, CV_8UC3, cv::Scalar(0, 0, 0));  // 480 行 640 列的黑色 BGR 图像
cv::Mat z = cv::Mat::zeros(480, 640, CV_8UC1);        // 全 0
cv::Mat o = cv::Mat::ones(3, 3, CV_32F);              // 全 1
cv::Mat e = cv::Mat::eye(3, 3, CV_32F);                // 单位矩阵，常用作旋转矩阵初值

// 包装一块已有内存，不拷贝数据——常用于零拷贝对接外部 buffer（如相机 SDK/其他库给的裸指针）
unsigned char* external_buf = ...;
cv::Mat wrapped(480, 640, CV_8UC3, external_buf);

// 浅拷贝 vs 深拷贝
cv::Mat a = img;          // 浅拷贝：a 和 img 共享同一块数据，改 a 会改到 img
cv::Mat b = img.clone();  // 深拷贝：b 是独立的一份数据，改 b 不影响 img

// 安全但较慢：带边界检查，适合少量随机访问
img.at<cv::Vec3b>(row, col) = cv::Vec3b(255, 0, 0);

// 更快：拿到某一行的指针后按列遍历，适合整行/整图扫描
for (int r = 0; r < img.rows; r++) {
    cv::Vec3b* ptr = img.ptr<cv::Vec3b>(r);
    for (int c = 0; c < img.cols; c++) {
        ptr[c] = cv::Vec3b(255, 0, 0);
    }
}
```

`.at<T>()` 模板参数 `T` 要和 `Mat` 的实际元素类型匹配（比如 3 通道 8 位图像对应 `cv::Vec3b`），类型不匹配是最常见的运行时 bug 来源之一；性能敏感场景优先用 `.ptr<T>()` 按行取指针，避免 `.at<T>()` 每次调用的边界检查开销。

### InputArray / OutputArray

翻 OpenCV 函数签名时会发现参数类型几乎不直接写 `Mat`，而是写 `cv::InputArray`/`cv::OutputArray`（以及可读写的 `cv::InputOutputArray`）。这两个不是真正的数据结构，而是一层**多态包装**：函数内部实际接收的可以是 `Mat`、`UMat`（见 [TAPI](0436_OpenCV_TAPI)）、`vector<Mat>`、`Scalar`、甚至普通数组等多种类型，调用方不需要关心，写代码时该传什么类型就传什么类型，不需要先转换成统一类型再调用。理解这一层包装后，再看 OpenCV 函数文档里一长串的 `InputArray` 参数就不会觉得奇怪了——它们对应的就是本文介绍的这些数据结构中的任意一种。

### Matx  固定矩阵类

- 用于编译时已知类型和大小的小矩阵
- 用于减少动态内存分配和加速计算——`Matx` 在栈上分配、大小固定在模板参数里，没有 `Mat` 那样的引用计数/堆内存开销，适合小尺寸、高频创建的场景（如每个点一个变换矩阵）
- 常见用途：`cv::Matx33f`（3×3 浮点矩阵，常用来表示旋转矩阵/内参矩阵）、`cv::Matx21f`（2×1 向量）；支持矩阵乘法、转置、求逆等常规线性代数运算符重载

```cpp
cv::Matx33f rotation(
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
);
```

### Vec 固定向量


- 继承于 Matx
- cols = 1
- Vec[`2/3/4/6/8`][`b/d/f/i/s/w`]
  - b - uchar
  - d - double
  - f - float
  - i - int
  - s - short
  - w ushort
- 最常见的用法是表示**单个像素**：`cv::Vec3b` 就是一个 BGR 三通道、每通道 1 字节的像素（`Mat.at<Vec3b>(r, c)` 取出来的正是这个类型），`cv::Vec4b` 对应 BGRA。

#### Scalar

- 4 个元素的 Vector
- 继承 Vec  - `=Vec<double, 4>`
- 两个常见用法：(1) 表示一个颜色，如 `cv::Scalar(255, 0, 0)` 在 BGR 图像上代表蓝色；(2) 在 `Mat` 初始化/算术运算里代表"所有通道都用同一个值填充"，如 `Mat(h, w, CV_8UC1, cv::Scalar(128))` 创建一个全灰图。


## Point 点

- 定义了 2/3 维空间中的点 `(x, y)` / `(x, y, z)`
- Point[2/3][i/l/f/d]
  - i - int
  - l - int64
  - f - float
  - d - double
- 注意访问图像像素时下标习惯是 `(row, col)`（行优先），而 `Point` 的习惯是 `(x, y)`（列优先，x 对应列/宽度方向）——两者顺序正好相反，混用时最容易写反，`img.at<T>(point.y, point.x)` 才是对应同一个像素的正确写法；
- 整数版 `Point`/`Point2i` 常用于像素坐标，浮点版 `Point2f`/`Point2d` 常用于需要亚像素精度的几何计算（如特征点坐标、相机标定结果）。

## Size

- 定义宽高 `(width, height)`，常用于创建 `Mat`、`resize()` 目标尺寸等场景：`cv::Size(width, height)`，同样是**先宽后高**，和 `Mat` 本身 `(rows, cols)` 行优先的习惯顺序相反，容易搞反；
- `Size2i`/`Size2f` 分别对应整数/浮点版本。

## Rect

- 定义一个矩形，构造参数顺序是 `(x, y, width, height)`——`xy` 为左上角坐标（Top-Left Corner），`width`/`height` 是宽高，不是"`(h, w, x, y)`"这个顺序；
- `Rect2[i/d/f]` 对应不同的坐标数据类型（int/double/float）；
- 常见用法是对 `Mat` 做 ROI 裁剪：`cv::Mat roi = img(cv::Rect(x, y, w, h));`，得到的 `roi` 和原图共享同一块内存（不拷贝数据），修改 `roi` 会直接影响原图对应区域——这也是前面提到"ROI 子矩阵通常不连续（`isContinuous()` 为 false）"的来源。

## Range

- `cv::Range(start, end)` 表示一个左闭右开的下标区间 `[start, end)`，配合 `Mat::operator()(Range rowRange, Range colRange)` 可以按行列范围切片，是除了 `Rect` 之外另一种常见的 ROI 取法：

```cpp
cv::Mat roi = img(cv::Range(10, 20), cv::Range(0, img.cols));  // 第 10~19 行、所有列
```

  和 `Rect` 的区别：`Rect` 是"起点 + 宽高"，更直观地对应一块矩形区域；`Range` 是"起止下标"，更适合只按行或只按列切片（这时用 `Rect` 反而要多算一次宽/高）。`Range::all()` 表示"这一维全选"，上面例子里的 `Range(0, img.cols)` 也可以直接写成 `cv::Range::all()`。

## TermCriteria

- `cv::TermCriteria(type, maxCount, epsilon)` 是专门描述"迭代算法什么时候停"的小结构体，`kmeans`、`cornerSubPix` 等需要反复迭代收敛的函数都靠它控制终止条件：
  - `type` 是 `TermCriteria::COUNT`（迭代够次数就停）、`TermCriteria::EPS`（精度够了就停）或两者相或 `COUNT + EPS`（哪个先满足就停，最常用）；
  - `maxCount` 是最大迭代次数上限，`epsilon` 是精度阈值；
- 例：`cv::TermCriteria(cv::TermCriteria::COUNT + cv::TermCriteria::EPS, 100, 0.001)` 表示最多迭代 100 次，或者精度已经优于 0.001 就提前停止。

## Reference
- [cv::Mat](https://docs.opencv.org/4.x/d3/d63/classcv_1_1Mat.html)
- [cv::Matx](https://docs.opencv.org/4.x/de/de1/classcv_1_1Matx.html)
- [cv::Vec](https://docs.opencv.org/4.x/d6/dcf/classcv_1_1Vec.html)
- [cv::Point_](https://docs.opencv.org/4.x/db/d4e/classcv_1_1Point__.html)
- [cv::Rect_](https://docs.opencv.org/4.x/d2/d44/classcv_1_1Rect__.html)
- [cv::Range](https://docs.opencv.org/4.x/da/d35/classcv_1_1Range.html)
- [cv::TermCriteria](https://docs.opencv.org/4.x/d9/d5d/classcv_1_1TermCriteria.html)
- [cv::InputArray](https://docs.opencv.org/4.x/dd/d9a/classcv_1_1_input_array.html)
- [Core functionality](0425_OpenCV_Core)

