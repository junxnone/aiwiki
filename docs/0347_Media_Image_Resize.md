---
Title | Media Image Resize
-- | --
Created @ | `2019-06-13T02:44:22Z`
Updated @| `2026-11-25T16:21:41Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/347)

---
## Reference

- [Image scaling - wikipedia](https://en.wikipedia.org/wiki/Image_scaling)
- [数字图像处理笔记二 - 图片缩放(最近邻插值(Nearest Neighbor interpolation))](https://blog.csdn.net/haluoluo211/article/details/80918147)
- [Nearest Neighbor Image Scaling](http://tech-algorithm.com/articles/nearest-neighbor-image-scaling/)
- [Nearest-neighbor interpolation - wikipedia](https://en.wikipedia.org/wiki/Nearest-neighbor_interpolation)
- [Bilinear Image Scaling](http://tech-algorithm.com/articles/bilinear-image-scaling/)
- [双三次插值算法(bicubic interpolation)与图形学和计算方法的关系](https://blog.csdn.net/nandina179/article/details/85330552)
- [Bicubic interpolation - wikipedia](https://en.wikipedia.org/wiki/Bicubic_interpolation)
- [paper - Cubic convolution interpolation for digital image processing](http://www.ncorr.com/download/publications/keysbicubic.pdf)  ---- [Download](https://github.com/junxnone/tech-io/files/3949833/keysbicubic.pdf)
- [图像处理: 五种 插值法](https://blog.csdn.net/jningwei/article/details/78822026)

## Brief

Algo | Description
-- | -- 
Nearest Neighbor - 最近邻 | 使用 scale 坐标最近的值作为插值<br> <li> 损失 `空间对称性 - Alignment`</li>
Bilinear - 双线性| <li>计算量比最近邻大</li><li>没有灰度不连续的缺点</li><li>具有低通滤波性质，使高频分量受损，图像轮廓可能会有一点模糊，看起来更光滑</li>
Bicubic 双三次 | <li>用目标点周围 `4×4` 共 16 个像素加权, 权重由三次卷积核给出</li><li>比双线性更锐利, 但计算量更大, 可能产生过冲 (overshoot) 和振铃</li>
Area 区域关系 | <li>缩小时对目标像素覆盖的源像素区域做面积加权平均, 相当于抗混叠的低通滤波</li><li>缩小图像首选, 可避免摩尔纹; 放大时效果接近最近邻</li>
Lanczos | <li>用 sinc 函数加窗作为核, OpenCV 的 `INTER_LANCZOS4` 使用 `8×8` 邻域</li><li>细节保留最好, 计算量最大, 同样可能出现振铃</li>

### 坐标映射

插值之前先要确定目标像素在源图中的位置。OpenCV 的双线性等方法使用像素中心对齐 (half-pixel) 的映射:

$$
x_{src} = (x_{dst} + 0.5)\cdot\frac{W_{src}}{W_{dst}} - 0.5
$$

其中：

- $x_{dst}$：目标图中的像素横坐标 (整数, 从 0 开始); 纵坐标 $y$ 同理
- $x_{src}$：映射回源图的横坐标, 一般不是整数, 需要靠插值求值
- $W_{src},W_{dst}$：源图、目标图的宽度; $W_{src}/W_{dst}$ 即缩放比的倒数
- $+0.5/-0.5$：把整数下标看作像素中心, 保证缩放后图像不会整体偏移半个像素

不同库对这一步的约定不同 (如 PyTorch `align_corners=True/False`, OpenCV `INTER_NEAREST` 直接取 $\lfloor x_{dst}\cdot W_{src}/W_{dst}\rfloor$), 因此同样的 resize 在不同库里结果会有细微差异, 做精度对齐时需要注意。

### 双线性插值

设 $(x_{src},y_{src})$ 落在四个相邻像素 $f_{00},f_{10},f_{01},f_{11}$ 围成的单元内:

$$
f = (1-a)(1-b)f_{00} + a(1-b)f_{10} + (1-a)b\,f_{01} + ab\,f_{11}
$$

其中：

- $f_{00},f_{10},f_{01},f_{11}$：左上、右上、左下、右下四个相邻像素的值
- $a = x_{src}-\lfloor x_{src}\rfloor$：水平方向的小数部分, $a\in[0,1)$
- $b = y_{src}-\lfloor y_{src}\rfloor$：垂直方向的小数部分, $b\in[0,1)$
- 四个权重之和为 $1$, 离哪个像素越近, 该像素的权重越大

### 双三次插值

双三次沿每个方向使用三次卷积核 (Keys, 1981) 对 4 个邻近点加权:

$$
W(x)=\begin{cases}
(a+2)|x|^3-(a+3)|x|^2+1 & |x|\le 1\
a|x|^3-5a|x|^2+8a|x|-4a & 1<|x|<2\
0 & \text{otherwise}
\end{cases}
$$

其中：

- $x$：待求点到某个邻近像素的距离 (以像素为单位)
- $W(x)$：该邻近像素的权重; 对 $4\times4$ 邻域按 $W(x_i)W(y_j)$ 加权求和
- $a$：控制锐度的参数, Keys 原文推荐 $a=-0.5$, OpenCV 取 $a=-0.75$; $|a|$ 越大越锐利, 过冲也越明显

### Lanczos 插值

$$
L(x)=\begin{cases}
\mathrm{sinc}(x)\,\mathrm{sinc}(x/n) & |x|<n\
0 & \text{otherwise}
\end{cases},\qquad \mathrm{sinc}(x)=\frac{\sin(\pi x)}{\pi x}
$$

其中：

- $n$：窗口半宽, 即参与插值的邻域半径; OpenCV 的 `INTER_LANCZOS4` 取 $n=4$, 对应 $8\times8$ 邻域
- $\mathrm{sinc}(x)$：理想低通滤波器的冲激响应; 乘上 $\mathrm{sinc}(x/n)$ 是为了把无限长的 sinc 截成有限窗口

### 方法对比与选用

Method | 参考像素数 | 计算量 | 效果 | 适用
-- | -- | -- | -- | --
Nearest | 1 | 最低 | 有锯齿, 不产生新值 | 分割 label mask、需要保持离散值
Bilinear | 4 | 低 | 较平滑, 略模糊 | 默认选择, 速度与质量折中
Bicubic | 16 | 中 | 比双线性锐利 | 放大图片
Area | 覆盖区域内全部像素 | 中 | 缩小时无摩尔纹 | 缩小图片
Lanczos | 64 (`8×8`) | 高 | 细节保留最好, 可能有振铃 | 对画质要求高的放大/缩小

表中：`参考像素数` 是计算一个目标像素用到的源像素个数; `计算量`、`效果` 为相对比较。选用经验：放大用 Bilinear/Bicubic, 缩小用 Area, 离散标签用 Nearest。缩小倍数较大时, 若用 Nearest/Bilinear 而不做低通, 会因混叠产生摩尔纹或闪烁, 这也是 Area 在缩小场景更好的原因。

### Tips
- multi-segmentation label mask image resize 会改变label的值
  - 可使用 `最近邻插值` 法解决
  - `cv2.resize(image, (w, h), interpolation=cv2.INTER_NEAREST)`
- 水波纹和插值方法有关？？



## OpenCV

`dst  =  cv.resize( src, dsize[, dst[, fx[, fy[, interpolation]]]] )`

- interpolation , default cv.INTER_LINEAR

Flags | Comment
-- | --
cv.INTER_NEAREST | nearest neighbor interpolation 最近邻插值
cv.INTER_LINEAR | bilinear interpolation 双线性插值
cv.INTER_CUBIC | bicubic interpolation
cv.INTER_AREA | resampling using pixel area relation. It may be a preferred method for image decimation, as it gives moire'-free results. But when the image is zoomed, it is similar to the INTER_NEAREST method.
cv.INTER_LANCZOS4 | Lanczos interpolation over 8x8 neighborhood
cv.INTER_LINEAR_EXACT | Bit exact bilinear interpolation
cv.INTER_MAX | mask for interpolation codes
cv.WARP_FILL_OUTLIERS | flag, fills all of the destination image pixels. If some of them correspond to outliers in the source image, they are set to zero
cv.WARP_INVERSE_MAP | flag, inverse transformationFor example, linearPolar or logPolar transforms:



```
image = cv2.imread('xxx')
image_resize = cv2.resize(image, (w, h))
```
- image.shape = (h, w, c)
- resize 使用的是 (w, h)
- numpy empty image - `np.zeros((h, w, c), dtype=np.uint8)`

