---
Title | OpenCV GaussianBlur
-- | --
Created @ | `2022-11-29T07:55:56Z`
Last Modify @| `2022-11-29T07:55:56Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/320)

---
## 高斯核

- `kx1` 高斯核计算:  $G_i= \alpha *e^{-(i-( \texttt{ksize} -1)/2)^2/(2* \texttt{sigma}^2)}$

高斯核 OpenCV API | 高斯核
-- | --
cv2.getGaussianKernel(7, 0.8) | ![image](https://user-images.githubusercontent.com/2216970/204470955-d54b19ac-c165-41f1-b638-f6a2d1141100.png)




