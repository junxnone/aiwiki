-----

| Title     | OpenCV UC brightness                                  |
| --------- | ----------------------------------------------------- |
| Created @ | `2019-05-29T09:35:01Z`                                |
| Updated @ | `2026-11-26T10:18:14Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/350) |

-----

# 计算图片 average brightness

用 HSV 颜色空间的 V（明度）通道的平均值衡量一张图片的整体亮度。

    def brightness_calc(img):
        frame = cv2.imread(img)
        img_hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        v = img_hsv[:, :, 2].mean()  #average of V channel
        return v

$$ \\bar{V}=\\frac{1}{H,W}\\sum\_{x=1}^{W}\\sum\_{y=1}^{H}V(x,y) $$

其中：

  - $H,W$：图像的高和宽；$V(x,y)$：像素 $(x,y)$ 的明度，8 位图像取值 $0\\sim255$
  - $\\bar{V}$：平均明度，越大图像越亮；`img_hsv[:, :, 2]` 取第 3 个通道，即 V 通道

## 其他计算方式

| 方法         | 做法                            | 特点             |
| ---------- | ----------------------------- | -------------- |
| V 通道平均     | HSV 的 V，取每个像素 R、G、B 中的最大值     | 简单，对彩色高饱和的区域偏亮 |
| 灰度平均       | $Y=0.299R+0.587G+0.114B$ 后求平均 | 更接近人眼对亮度的感知    |
| Lab 的 L 通道 | 感知均匀的明度                       | 更准确，计算稍慢       |

表中：对比结论：做粗略的亮暗判断用 V 通道就够；需要贴近视觉感受时用灰度或 Lab 的 L。颜色空间转换见 [Color Space
转换](https://github.com/junxnone/aiwiki/issues/120)。

## 注意

  - `cv2.imread` 读不到文件时返回 `None`，应先判断再转换
  - 不同曝光、白平衡下，平均亮度不一定反映场景的真实亮度，只适合同一设备同一设置下的相对比较
