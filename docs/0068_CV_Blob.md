---
Title | CV Blob
-- | --
Created @ | `2020-11-10T07:04:47Z`
Updated @| `2026-11-26T10:18:27Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/68)

---
# Blob Detection

Blob（斑点）是图像中与周围相比亮度或颜色不同、且相对独立的一块区域。Blob 检测就是找出这些区域的位置和大小，常用于计数（如细胞、颗粒、星点）。

- LoG - `Laplacian of Gaussian`
- DoG - `Difference of Gaussian`
- DoH - `Determinant of Hessian`

![image](https://user-images.githubusercontent.com/2216970/98642334-43714600-2368-11eb-8ed9-c46e9b405a9a.png)

图中：该图为原文档附带的 Blob 检测示意图，圆圈表示检测到的斑点位置和尺度。

## 原理

用不同尺度 $\sigma$ 的高斯平滑图像，再求二阶导数；斑点中心在某个尺度下会出现极值：

$$
\nabla^2_{norm}L(x,y;\sigma)=\sigma^{2}\big(L_{xx}+L_{yy}\big),\qquad L=G_\sigma * I
$$

其中：

- $I$：输入图像；$G_\sigma$：标准差为 $\sigma$ 的高斯核；$*$：卷积；$L$：高斯平滑后的图像
- $L_{xx},L_{yy}$：$L$ 对 $x$、$y$ 的二阶偏导；$L_{xx}+L_{yy}$ 即拉普拉斯算子
- $\sigma^2$：尺度归一化系数，使不同尺度的响应可以比较
- 在位置和尺度上同时找极值，二维下斑点半径约为 $r=\sqrt{2}\,\sigma$

## 三种方法

| 方法 | 做法 | 特点 |
| --- | --- | --- |
| LoG | 高斯平滑后求拉普拉斯 | 精度高，最慢 |
| DoG | 用相邻两个尺度的高斯图相减近似 LoG | 更快，SIFT 中使用 |
| DoH | 求 Hessian 矩阵的行列式 | 对大斑点更快，但小斑点检测较差 |

表中：对比结论：精度优先用 LoG，速度优先用 DoG，斑点较大时可用 DoH。

```python
from skimage.feature import blob_log
blobs = blob_log(gray, max_sigma=30, num_sigma=10, threshold=0.1)   # 每行 (y, x, sigma)
```

其中：`max_sigma`、`num_sigma` 控制搜索的尺度范围；`threshold` 越小检测到的斑点越多；返回值每行为斑点中心坐标和尺度 $\sigma$。OpenCV 中另有 `SimpleBlobDetector`（基于阈值与连通域，可按面积、圆度等过滤）。

应用 | Examples
-- | --
应用于 Counting | ![image](https://user-images.githubusercontent.com/2216970/98645639-3acf3e80-236d-11eb-9b6b-336b301c7118.png)

表中：右侧图为原文档附带的计数应用示例，对应上面的斑点检测结果用于统计目标数量。

## Reference
- [Blob detection -Wikipedia](https://en.wikipedia.org/wiki/Blob_detection)
- [Blob Detection - scikit-image](https://scikit-image.org/docs/dev/auto_examples/features_detection/plot_blob.html#sphx-glr-auto-examples-features-detection-plot-blob-py)
- [Blob-Detect](https://www.cnblogs.com/brt3/p/11421191.html)

