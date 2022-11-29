---
Title | OpenCV GaussianBlur
-- | --
Created @ | `2022-11-29T07:55:56Z`
Last Modify @| `2022-11-29T08:00:18Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/320)

---
## 高斯核

- `kx1` 高斯核计算:  $G_i= \alpha *e^{-(i-( \texttt{ksize} -1)/2)^2/(2* \texttt{sigma}^2)}$

D | 高斯核 OpenCV API | 高斯核
-- | -- | --
1D | `cv2.getGaussianKernel(7, 0.8)` | ![image](https://user-images.githubusercontent.com/2216970/204470955-d54b19ac-c165-41f1-b638-f6a2d1141100.png)
2D | `cv2.getGaussianKernel(7, 0.9) * cv2.getGaussianKernel(7, 0.9).T` | ![image](https://user-images.githubusercontent.com/2216970/204471927-47eb77c0-102d-42b3-b557-85a508a2af42.png)




