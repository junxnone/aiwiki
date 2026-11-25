---
Title | Media Image Affine
-- | --
Created @ | `2026-11-25T16:28:31Z`
Updated @| `2026-11-25T16:28:31Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/786)

---
# Affine

仿射变换：平移、缩放、旋转、错切的矩阵表示，组合顺序，以及 OpenCV 的 `warpAffine` 用法。它是 [透视变换](/0345_Media_Image_PT) 的特例。

## 定义

仿射变换保持直线和平行关系，用一个 $2\times3$ 矩阵描述：

$$
\begin{bmatrix}x'\\y'\end{bmatrix}=
\begin{bmatrix}a_{11}&a_{12}&t_x\\a_{21}&a_{22}&t_y\end{bmatrix}
\begin{bmatrix}x\\y\\1\end{bmatrix}
$$

其中：

- $(x,y)$：变换前的坐标；$(x',y')$：变换后的坐标
- $a_{11},a_{12},a_{21},a_{22}$：线性部分，决定缩放、旋转、错切
- $t_x,t_y$：平移量
- 末尾补的 $1$ 是齐次坐标，让平移也能写成矩阵乘法；共 6 个自由度，需要 3 组不共线的对应点才能解出

## 基本变换

变换 | 矩阵 ($3\times3$ 齐次形式) | 参数
-- | -- | --
平移 | $\begin{bmatrix}1&0&t_x\\0&1&t_y\\0&0&1\end{bmatrix}$ | $t_x,t_y$：水平/垂直平移量
缩放 | $\begin{bmatrix}s_x&0&0\\0&s_y&0\\0&0&1\end{bmatrix}$ | $s_x,s_y$：水平/垂直缩放系数
旋转 | $\begin{bmatrix}\cos\theta&-\sin\theta&0\\\sin\theta&\cos\theta&0\\0&0&1\end{bmatrix}$ | $\theta$：旋转角，绕原点
错切 | $\begin{bmatrix}1&k_x&0\\k_y&1&0\\0&0&1\end{bmatrix}$ | $k_x,k_y$：沿 x/y 方向的错切系数

表中：每一行是一种基本变换及其矩阵，取前两行就是 OpenCV 里使用的 $2\times3$ 矩阵；图像坐标系 y 轴向下，所以屏幕上看到的旋转方向与数学上相反。

## 组合与顺序

多个变换依次作用，就是把 $3\times3$ 矩阵按顺序相乘：

$$
M = M_n\cdots M_2 M_1
$$

其中：

- $M_1$ 最先作用，$M_n$ 最后作用，矩阵乘法顺序与作用顺序相反
- 矩阵乘法不满足交换律：先旋转再平移与先平移再旋转结果不同
- 绕图像中心旋转 = 先把中心平移到原点，旋转，再平移回去

OpenCV 提供了绕任意点旋转加缩放的矩阵：

$$
M=\begin{bmatrix}
\alpha&\beta&(1-\alpha)c_x-\beta c_y\\
-\beta&\alpha&\beta c_x+(1-\alpha)c_y
\end{bmatrix},\quad
\alpha=s\cos\theta,\ \beta=s\sin\theta
$$

其中：

- $(c_x,c_y)$：旋转中心；$s$：缩放系数；$\theta$：旋转角度 (OpenCV 中正值为逆时针)
- 最后一列是平移项，用来把旋转中心保持在原位

## 反向映射

直接把每个源像素算到目标位置会产生空洞，所以实现时是对每个目标像素 $(x',y')$，用逆矩阵找到它在源图的位置再取值：

$$
\begin{bmatrix}x\\y\end{bmatrix}=M^{-1}\begin{bmatrix}x'\\y'\\1\end{bmatrix}
$$

其中：

- $M^{-1}$：仿射矩阵的逆变换；$(x,y)$ 通常不是整数，需要插值，方法见 [Resize](/0347_Media_Image_Resize)
- 源图范围之外的点按 `borderMode` 填充，默认填 0 (黑色)

## OpenCV

```python
import cv2, numpy as np
h, w = img.shape[:2]
M = cv2.getRotationMatrix2D((w/2, h/2), 30, 1.0)       # 中心, 角度, 缩放
out = cv2.warpAffine(img, M, (w, h))                   # dsize 是 (w, h)

# 由 3 组对应点求仿射矩阵
src = np.float32([[0, 0], [w-1, 0], [0, h-1]])
dst = np.float32([[10, 20], [w-30, 10], [30, h-20]])
M = cv2.getAffineTransform(src, dst)
```

- 旋转后图像会超出原画布，想保留全部内容需要扩大 `dsize` 并调整平移项
- `flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP` 表示传入的矩阵已经是逆变换
- 数据增强 (随机旋转、平移、缩放) 本质都是随机的仿射变换；标注框或关键点需要用同一个 $M$ 一起变换

## 仿射与透视

- 仿射变换保持平行线仍平行，6 个自由度；透视变换允许平行线相交，8 个自由度，见 [透视变换](/0345_Media_Image_PT)
- 平面物体拍摄角度不正时需要透视矫正，仅有旋转/缩放/平移时用仿射即可

## Reference
- [Affine transformation - Wikipedia](https://en.wikipedia.org/wiki/Affine_transformation)
- [OpenCV Geometric Transformations](https://docs.opencv.org/4.x/da/d6e/tutorial_py_geometric_transformations.html)
- [OpenCV warpAffine](https://docs.opencv.org/4.x/da/d54/group__imgproc__transform.html)

