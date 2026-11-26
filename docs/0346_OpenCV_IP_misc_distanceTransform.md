---
Title | OpenCV IP misc distanceTransform
-- | --
Created @ | `2020-09-24T06:12:08Z`
Updated @| `2026-11-26T10:09:15Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/346)

---

# distanceTransform 处理区域粘连

距离变换：对二值图像中每个前景像素，计算它到最近背景像素的距离，得到一幅「距离图」。离背景越远（越靠近物体中心）值越大，常用于分离粘连在一起的物体（如相互接触的硬币、细胞）。

$$
D(p)=\min_{q\in B}\ d(p,q)
$$

其中：

- $p$：前景像素；$B$：背景像素集合；$q$：背景中的某个像素
- $d(p,q)$：两像素间的距离，由距离类型决定
- $D(p)$：像素 $p$ 到最近背景像素的距离，即输出图中该点的值


```
dst_img = cv2.distanceTransform(img, cv2.DIST_C, cv2.DIST_MASK_3)
```

origin image | cv2.DIST_C | cv2.DIST_L1 | cv2.DIST_L2 
-- | -- | -- | --
![image](https://user-images.githubusercontent.com/2216970/94107353-e0872680-fe6f-11ea-8696-c5925b01ec1d.png) | ![image](https://user-images.githubusercontent.com/2216970/94107361-e5e47100-fe6f-11ea-89a5-eb7cacbe2504.png) | ![image](https://user-images.githubusercontent.com/2216970/94107537-45428100-fe70-11ea-9912-99644b644bfa.png) | ![image](https://user-images.githubusercontent.com/2216970/94107627-7458f280-fe70-11ea-9a06-5b84ed995db2.png)



表中：四张图依次为原图和用 `DIST_C`、`DIST_L1`、`DIST_L2` 三种距离类型得到的距离图（原文档附带）。

## 距离类型

| 类型 | 距离定义 | 特点 |
| --- | --- | --- |
| `DIST_L1` | 曼哈顿距离 $\lvert\Delta x\rvert+\lvert\Delta y\rvert$ | 计算快，形状偏菱形 |
| `DIST_C` | 切比雪夫距离 $\max(\lvert\Delta x\rvert,\lvert\Delta y\rvert)$ | 形状偏方形 |
| `DIST_L2` | 欧氏距离 $\sqrt{\Delta x^2+\Delta y^2}$ | 最接近真实距离，最常用 |

表中：$\Delta x,\Delta y$ 为两像素在 x、y 方向的差；最后一个参数 `DIST_MASK_3` / `DIST_MASK_5` 是近似计算使用的掩码大小，`DIST_MASK_PRECISE` 为精确计算，掩码越大越精确越慢。

## 分离粘连物体

```mermaid
flowchart LR
    A[二值图] --> B[distanceTransform 距离图]
    B --> C[阈值 取距离图的高值区域 作为每个物体的种子]
    C --> D[作为 markers 交给 watershed 分水岭]
    D --> E[粘连物体被分开]
```

图中：粘连物体的中心离背景最远，距离图在中心处出现峰值；取峰值附近作为种子，再用分水岭算法扩展，就能沿细颈处切开粘连。

```python
dist = cv2.distanceTransform(binary, cv2.DIST_L2, 5)
_, seeds = cv2.threshold(dist, 0.5 * dist.max(), 255, cv2.THRESH_BINARY)
```

其中：`0.5 * dist.max()` 是种子阈值（取距离峰值的一半以上），阈值越大，物体越容易被分开，但小物体可能被丢失。

