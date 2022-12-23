---
Title | CV Edge Canny
-- | --
Created @ | `2020-10-19T05:14:34Z`
Last Modify @| `2022-12-23T14:47:18Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/101)

---
# Reference
- [opencv实现图像的边缘提取](https://blog.csdn.net/weixin_43900597/article/details/104793553)


# Brief
- 边缘检测算法 - 由 John F. Canny 在 1986 年提出
- **缺点**
  - **手动设置阈值** - 将下限和上限值设置为滞后阈值是一个手动过程，需要实验和视觉验证。
  - **鲁棒性** - 对一个图像有效的滞后阈值可能不适用于另一个图像（对于在不同光照条件下捕获的图像，这几乎总是如此）。
  - **预处理** - Canny边缘检测器通常需要许多预处理步骤（即转换为灰度，模糊/平滑等）以获得良好的边缘图。

Steps | Description
-- | --
Noise Reduction | `降噪`  - 使用 5x5 高斯滤波器去除图像中的噪声
Finding Intensity Gradient of the Image |  `寻找图像的强度梯度`  - 在水平和垂直方向上用 Sobel 内核对平滑后的图像进行滤波，以获得水平方向（G_x）和垂直方向（G_y）的一阶导数
Non-maximum Suppression | `非最大抑制` - 检查像素是否是其在梯度方向上的邻域中的局部最大值以去除可能不构成边缘的任何不需要的像素
Hysteresis Thresholding | `滞后阈值` - 两个阈值 (minVal, maxVal) , 强度梯度大于 maxVal 的任何边缘肯定是边缘，小于 minVal 的边缘肯定是非边缘，位于这两个阈值之间则基于其连通性分类边缘或非边缘

![image](https://user-images.githubusercontent.com/2216970/98219581-29aaba00-1f88-11eb-8371-2766fbc9a466.png)

