---
Title | OpenCV GaussianBlur
-- | --
Created @ | `2022-11-29T07:55:56Z`
Last Modify @| `2022-11-29T08:04:13Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/320)

---
## 高斯核

- 1D 高斯核:  $G_i= \alpha *e^{-(i-( \texttt{ksize} -1)/2)^2/(2* \texttt{sigma}^2)}$
- 2D 高斯核: $G_{0}(x, y) = A e^{ \dfrac{ -(x - \mu_{x})^{2} }{ 2\sigma^{2}_{x} } + \dfrac{ -(y - \mu_{y})^{2} }{ 2\sigma^{2}_{y} } }$

D | 高斯核 OpenCV API | 高斯核
-- | -- | --
1D 7x1 | `cv2.getGaussianKernel(7, 0.8)` | ![image](https://user-images.githubusercontent.com/2216970/204470955-d54b19ac-c165-41f1-b638-f6a2d1141100.png)
2D 5x5 | `cv2.getGaussianKernel(5, 0.9) * cv2.getGaussianKernel(5, 0.9).T` | ![image](https://user-images.githubusercontent.com/2216970/204472203-d264e2c7-0954-45d0-8de4-b7ef40f95423.png)





