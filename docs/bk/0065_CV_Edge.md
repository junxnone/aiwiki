-----

| Title     | CV Edge                                              |
| --------- | ---------------------------------------------------- |
| Created @ | `2020-11-12T07:09:54Z`                               |
| Updated @ | `2026-10-19T07:36:48Z`                               |
| Labels    | \`\`                                                 |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/65) |

-----

# 边缘

  - Roberts
  - Prewitt
  - Sobel
  - Scharr
  - [Canny](0101_CV_Edge_Canny)
  - Marr-Hildreth

> DL 中一般使用 `Object Contour Detection` & `Semantic Segmentation`
> 检测边缘，代表工作如 HED（Holistically-Nested Edge
> Detection），直接用卷积网络端到端学习"什么是边缘"，不再依赖人工设计的梯度算子

## 这些算子的共同原理与分类

边缘的本质是**像素灰度值发生剧烈变化的地方**，数学上对应图像灰度函数的**导数**在该处取极值（一阶导数）或过零点（二阶导数）。本页和
[Canny](0101_CV_Edge_Canny) 里的方法按这个思路可以分两大类：

  - **一阶导数（梯度）算子**——Roberts、Prewitt、Sobel、Scharr：都是用一个固定的小卷积核（2×2 或
    3×3）对图像做卷积，近似计算 x/y 方向的梯度 `Gx`/`Gy`，再合成梯度幅值 `sqrt(Gx² + Gy²)`
    和方向 `atan2(Gy, Gx)`。四者的核权重设计不同，本质目标一致：**在抗噪声和边缘定位精度之间做不同的取舍**；
  - **二阶导数算子**——Marr-Hildreth：找图像二阶导数（拉普拉斯算子，`∇²I`）的**过零点**作为边缘——一阶导数的极值点正好对应二阶导数的过零点，是同一件事的另一个数学视角；
  - **完整检测流水线**——Canny：本身不是一个新的"核"，而是**在一阶梯度算子（内部用的就是
    Sobel）基础上，叠加降噪、非极大值抑制、滞后阈值**这几个后处理步骤，解决单纯用
    Sobel/Prewitt 算出来的"粗边缘"太宽、太多噪声响应的问题；详见 [Canny
    边缘检测](0101_CV_Edge_Canny)。

## Roberts

  - 用于图像锐化
  - 计算量小
  - 结果边缘不平滑

| Original     | Vertical - Positive                                          | Horizontal - Negative                                        |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Computations | ![image](media/176d326a1dc5b11c876a6a111ced160190662936.png) | ![image](media/e60979b4c8cad00cd7796cefec89c54ec2c762dc.png) |
| Pixel 权重     | ![image](media/e60979b4c8cad00cd7796cefec89c54ec2c762dc.png) | ![image](media/3d9855de983d026ba3bb5fb161906b7345b04f02.png) |

  - 核只有 2×2，是这几种算子里计算量最小的，但对噪声非常敏感（没有任何平滑/加权），实际工程里较少单独使用，多作为教学对比案例。

## Prewitt

| Original                                                     | Vertical                                                     | Horizontal                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Computations                                                 | ![image](media/0fe4b0cb09566be113e944770021eb57c5de4ce7.png) | ![image](media/3f3793450edb9163067ea8caaf9b19ff8be1ab01.png) |
| Pixel 权重                                                     | ![image](media/47398d4a154b59207d979434b288b5410708f061.png) | ![image](media/85a380b474e80a060f714186f2c7029184fe2c9c.png) |
| ![image](media/a76c6a7fc5da2ea8519dbb00695b3d1fd5df3696.png) | ![image](media/dcbb5a1e8b4967ca02abe8b84f45f7fcdbe7e77c.png) | ![image](media/cf70a8af3a3f4f70b9eb9e9900e9e4d32029e976.png) |

  - 3×3 核，相比 Roberts 多了一维"平滑"效果（核里不只是 +1/-1，还有一整行/列同号），抗噪声能力更好。

## Sobel

  - 相比 `prewitt` 增加了权重

| Direction    | Vertical - Gx                                                | Horizontal - Gy                                              |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Computations | ![image](media/cefb747798cb58af9d28fe80cd990c612e578963.png) | ![image](media/d38345c6baf7134c8e68b94c14e7e8183245b4f1.png) |
| Pixel 权重     | ![image](media/4417397475da48f3bfb9bb380b6e90846a255ed6.png) | ![image](media/50be7b5b1b343a59bd31932d41048d4baa78abd3.png) |

  - 给中心行/列额外乘了权重 2（而不是 Prewitt 的全
    1），让越靠近中心像素的贡献越大，相当于在求导的同时做了一点加权平滑——这是目前**工程里最常用**的一阶梯度算子，OpenCV/几乎所有图像处理库都内置，也是
    [Canny](0101_CV_Edge_Canny) 内部实际使用的梯度算子。

## Scharr

  - 使用了更大的权重

| Direction    | Vertical - Gx                                                | Horizontal - Gy                                              |
| ------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Computations | ![image](media/a396862bd77b97ed3dc9b36d3a9ea8a160c8f664.png) | ![image](media/51aa7de0af83eae3e7dedadc01969362476dc531.png) |
| Pixel 权重     | ![image](media/ace01a6bbdc460fe4ef4c87c241ec851a089bb8a.png) | ![image](media/24fe3dc7af1f3a124f05cbf1488659518a2521a4.png) |

  - 针对 Sobel 在 3×3
    核尺寸下**旋转对称性不够好**（不同角度边缘的响应不完全一致）这个问题做了优化，权重数值更极端（3/10/3
    而不是 1/2/1），在小核尺寸下梯度方向估计更准，OpenCV 里 `ksize=3` 时官方更推荐用 Scharr 而不是
    Sobel。

## Prewitt vs Sobel vs Scharr

| Original                                                     | Roberts                                                      | Prewitt                                                      | Sobel                                                        | Scharr                                                       |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/fb8100493d24ab2c0fa06a6c0d225694010a01c0.png) | ![image](media/897877ea9c118e85e50ee6aebbb2a3bedd38190a.png) | ![image](media/281ab365cc898c207a263d87723d4697fb06fc64.png) | ![image](media/c56cb453eeb7f7d2f07ae534368c581d884bb3f1.png) | ![image](media/4da77075820457a3dff26debf476ce6538af676a.png) |

## Marr-Hildreth（LoG，Laplacian of Gaussian）

  - 先用高斯核对图像做平滑（抑制噪声，二阶导数对噪声比一阶导数更敏感，必须先平滑），再对平滑后的图像求拉普拉斯算子（二阶导数）；
  - 边缘对应拉普拉斯响应的**过零点**（从正变负或从负变正的位置），而不是像一阶算子那样找梯度幅值的极大值点；
  - 优点是对边缘方向不敏感（拉普拉斯是各向同性的，不用像一阶算子那样分别算 x/y
    两个方向再合成），缺点是过零点检测对噪声残留比较敏感，容易产生虚假边缘，实际工程里用得比
    Sobel/Canny 少，更多是作为理解"边缘检测的另一种数学视角"的教学案例。

## 怎么选

  - 快速原型/对精度要求不高 → Sobel（最通用、库支持最全）；
  - 需要更准确的梯度方向估计（如后续要接结构张量/角点检测，见 [Structure
    Tensor](0070_CV_StructureTensor)）→ Scharr；
  - 需要"干净"的二值边缘图、能自动阈值 → 直接用 [Canny](0101_CV_Edge_Canny)，不要自己从梯度图手动二值化；
  - 做学术对比/理解二阶导数视角 → Marr-Hildreth（LoG）；
  - Roberts 和 Prewitt 一般不用作最终方案，了解原理即可。

## 延伸：Canny 之后的改进方向

  - **Canny-Deriche**：Canny 原始实现用高斯滤波做平滑，Deriche 在 1987
    年提出用一个无限脉冲响应（IIR）指数滤波器替代高斯滤波来求梯度，效果上和
    Canny 的设计目标（好的检测/好的定位/单一响应）一致，但 IIR
    实现的计算量**不随滤波器尺寸增大而增加**（高斯核尺寸越大计算量越大，Deriche
    滤波器是常数时间），适合需要大尺度平滑、又对性能敏感的场景，OpenCV 没有内置，需要自己实现或用其他库。
  - **亚像素级边缘定位（Subpixel Edge Localization）**：Canny
    等算法输出的边缘位置精度受限于像素网格（整数坐标），但在工业测量（如零件尺寸检测、PCB
    检测）等场景，这个精度往往不够。常见做法是在检测到的整数像素边缘位置附近，对灰度剖面做**局部曲线拟合**（如抛物线拟合梯度幅值、或拟合灰度阶跃的
    Sigmoid/Erf 模型），取拟合曲线的极值/拐点作为亚像素级的边缘坐标，可以把定位精度提升到 0.1 像素甚至更高。

## 代码示例（OpenCV）

``` cpp
cv::Sobel(gray, gx, CV_32F, 1, 0, 3);   // x 方向一阶导数，核大小 3
cv::Sobel(gray, gy, CV_32F, 0, 1, 3);   // y 方向一阶导数
cv::Scharr(gray, gx, CV_32F, 1, 0);     // Scharr，常用于替代 ksize=3 的 Sobel
cv::magnitude(gx, gy, edge_magnitude);  // 合成梯度幅值

cv::Laplacian(gray, lap, CV_32F, 3);    // 二阶导数（Marr-Hildreth 思路的工程近似，通常先做高斯模糊再调用）
```

## Reference

  - [Prewitt operator](https://en.wikipedia.org/wiki/Prewitt_operator)
  - [梯度与Roberts、Prewitt、Sobel、Lapacian算子](https://blog.csdn.net/swj110119/article/details/51777422)
  - 1970 [Object enhancement and
    extraction](http://web.eecs.utk.edu/~hqi/ece472-572/reference/edge-Prewitt70.pdf)
  - [数字图像处理:边缘检测(Edge detection)](https://zhuanlan.zhihu.com/p/59640437)
  - [Awesome-Edge-Detection-Papers](https://github.com/MarkMoHR/Awesome-Edge-Detection-Papers)
  - [传统实现 - prewitt/laplace/sobel/scharr/Canny
    ](https://github.com/butub1/Edge-detection)
  - [Marr, D. & Hildreth, E. (1980). Theory of edge
    detection.](https://royalsocietypublishing.org/doi/10.1098/rspb.1980.0020)
