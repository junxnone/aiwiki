-----

| Title     | 光流 Optical Flow                                       |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-19T07:31:44Z`                                |
| Updated @ | `2026-10-19T07:31:44Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/559) |

-----

# 光流 Optical Flow

  - 光流是对图像序列中**像素运动**的估计——给定相邻两帧（或多帧）图像，估计每个像素（或稀疏选取的一批像素）从一帧到下一帧的位移向量
    `(u, v)`，本质上是在求解"图像内容是怎么运动的"这个逆问题。
  - 应用场景：视频目标跟踪、运动检测、视频插帧、动作识别、SLAM/视觉里程计的帧间匹配等。

## 亮度恒定假设（Brightness Constancy Assumption）

光流估计的出发点是一个假设：同一个物理点在相邻两帧之间，**亮度值不变**，只是位置发生了移动：

`I(x, y, t) = I(x + u, y + v, t + 1)`

对右边按泰勒展开并保留一阶项，可以得到**光流约束方程**：

`Ix * u + Iy * v + It = 0`

其中 `Ix`、`Iy` 是图像在 x/y 方向的空间梯度（和 [边缘](0065_CV_Edge) 里 Sobel
等算子计算的是同一个量），`It` 是时间方向的梯度（相邻两帧对应像素的灰度差）。

这个方程只有一个，却有 `u`、`v` 两个未知数——这就是光流估计里著名的**孔径问题（Aperture
Problem）**：单凭一个像素局部的灰度变化，只能确定运动在梯度方向上的分量，无法确定垂直于梯度方向（即沿着边缘方向）的分量到底是多少。所有光流算法的核心差异，本质上都是用了什么样的**额外约束**去补足这缺失的一个方程。

## Lucas-Kanade 光流法

Lucas-Kanade（LK）给出的额外约束是：**假设一个局部小窗口内所有像素的运动向量相同**。这样一来，一个 `N` 像素的窗口就能提供
`N` 个形如 `Ix*u + Iy*v = -It` 的方程，用最小二乘求解这个超定方程组，对误差平方和求导置零，得到正规方程：

    | ΣIx²    ΣIxIy | | u |   | -ΣIxIt |
    | ΣIxIy   ΣIy²  | | v | = | -ΣIyIt |

左边这个 2×2 系数矩阵，正是 [结构张量](0070_CV_StructureTensor)
`E`——这不是巧合，而是同一个"局部窗口梯度二阶矩"在两个不同问题里的复用。要让这个最小二乘问题有稳定解（矩阵可逆、不病态），需要
`E` 的两个特征值 `λ1`、`λ2` 都足够大，这正好对应结构张量里"角点区域"的判定条件。所以实践中 LK
光流通常只在角点/强纹理区域上跟踪（先用
[Harris](0067_CV_Feature_Harris) 或 Shi-Tomasi
选出一批"好的特征点"，再对这些点分别求光流），在平坦区域或只有单一方向边缘的区域，`E`
接近奇异，孔径问题无法被这个局部窗口假设解决，跟踪会失败或很不稳定。

### 金字塔 LK（应对大位移）

上面的推导依赖"位移足够小，一阶泰勒展开成立"这个前提——如果物体在两帧之间移动较快（位移超过几个像素），线性近似会失效。实际工程里常用**图像金字塔**：先在分辨率较低的金字塔顶层估计一个粗略光流（此时像素位移在缩小后的图像里相对更小），再把这个估计结果作为初始值传递到下一层更高分辨率的图像上做精细化，逐层迭代到原始分辨率——OpenCV
的 `cv::calcOpticalFlowPyrLK` 就是这个思路的实现，能处理比单层 LK 大得多的运动幅度。

## Horn-Schunck 光流法（对比）

Horn-Schunck（HS）给孔径问题的额外约束不同于 LK
的"局部窗口运动相同"，而是**全局平滑性假设**：整张图像的光流场应该是平滑变化的（相邻像素的运动向量差异不应太大），通过在误差函数里加入一个平滑性惩罚项（光流场梯度的平方），对整张图像的所有像素**同时**求解，得到的是**稠密光流**（每个像素都有估计值），而不是
LK 那样只在选定的稀疏特征点上求解。代价是计算量更大、在真正的运动边界处（物体边缘，光流本应不连续）容易被平滑性假设过度抹平，边界处精度不如
LK。

## LK vs HS 怎么选

| 场景                                 | 推荐                                                  |
| ---------------------------------- | --------------------------------------------------- |
| 只需要跟踪一批关键点（如目标跟踪、视觉里程计特征点匹配），要求速度快 | Lucas-Kanade（稀疏光流）                                  |
| 需要整幅图像稠密的运动场（如视频插帧、运动分割）           | Horn-Schunck 或其现代变体（如 Farneback 稠密光流）               |
| 位移幅度较大（镜头快速运动/高速物体）                | 金字塔 LK，或带金字塔的稠密方法（如 `cv::calcOpticalFlowFarneback`） |

> 现代基于深度学习的光流方法（如
> FlowNet、RAFT）直接用卷积网络端到端回归稠密光流场，不再显式依赖亮度恒定假设和局部/全局平滑性这些手工约束，在大位移、光照变化等传统方法的薄弱场景下通常精度更高，但计算成本和对训练数据的依赖也更高。

## 代码示例（OpenCV）

``` cpp
// 1. 先用 goodFeaturesToTrack（本质是 Shi-Tomasi，Harris 的改进版）选一批适合跟踪的角点
std::vector<cv::Point2f> prevPts, nextPts;
cv::goodFeaturesToTrack(prevGray, prevPts, 200, 0.01, 10);

// 2. 金字塔 LK 光流，status 标记每个点是否跟踪成功
std::vector<uchar> status;
std::vector<float> err;
cv::calcOpticalFlowPyrLK(prevGray, nextGray, prevPts, nextPts, status, err);

// 3. 稠密光流（Farneback，Horn-Schunck 思路的现代实现）
cv::Mat flow;
cv::calcOpticalFlowFarneback(prevGray, nextGray, flow, 0.5, 3, 15, 3, 5, 1.2, 0);
```

## Reference

  - Lucas, B.D. & Kanade, T. (1981). An Iterative Image Registration
    Technique with an Application to Stereo Vision. *IJCAI*.
  - Horn, B.K.P. & Schunck, B.G. (1981). Determining Optical Flow.
    *Artificial Intelligence*, 17(1-3): 185-203.
  - [OpenCV Optical Flow
    官方教程](https://docs.opencv.org/4.x/d4/dee/tutorial_optical_flow.html)
  - [Optical flow -
    wikipedia](https://en.wikipedia.org/wiki/Optical_flow)
  - [结构张量](0070_CV_StructureTensor)、[边缘](0065_CV_Edge)、[Harris
    Corner](0067_CV_Feature_Harris)
