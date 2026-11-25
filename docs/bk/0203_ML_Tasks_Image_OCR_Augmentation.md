-----

| Title     | ML Tasks Image OCR Augmentation                       |
| --------- | ----------------------------------------------------- |
| Created @ | `2020-06-18T02:53:20Z`                                |
| Updated @ | `2026-11-25T16:38:33Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/203) |

-----

# Augmentation

OCR
训练需要大量带标注的文字图像，真实标注数据又贵又少，所以常见做法是**用代码批量合成并扰动文字图片**：既能把数据量放大，又能模拟真实场景里的各种退化，让模型更鲁棒。生成工具见
[TextRecognitionDataGenerator](0187_ML_Tasks_Image_OCR_Tools_TextRecognitionDataGenerator)，总览见
[OCR](0200_ML_Tasks_Image_OCR)。

## 增强类型

下表列出常见的扰动、它模拟的真实现象，以及用 OpenCV 实现的思路：

| 增强       | 模拟的现象            | 实现思路                                               |
| -------- | ---------------- | -------------------------------------------------- |
| 文字扭曲     | 弯曲、透视、拍摄角度       | 透视变换 `cv2.warpPerspective`，或对网格做正弦位移（`cv2.remap`）  |
| 背景噪声（椒盐） | 传感器噪声、纸张脏污       | 随机把一部分像素置为 0 / 255                                 |
| 文字位置     | 文字没有居中、边距不一      | 随机设置文字在画布上的中心点或偏移                                  |
| 笔画粘连     | 墨迹扩散、低分辨率下笔画连在一起 | 让笔画变粗（白底黑字图用 `cv2.erode`，黑底白字图用 `cv2.dilate`）      |
| 笔画断裂     | 墨水不足、过度二值化       | 让笔画变细（白底黑字图用 `cv2.dilate`，黑底白字图用 `cv2.erode`）      |
| 文字倾斜     | 书写或拍摄时的旋转        | 小角度旋转 `cv2.getRotationMatrix2D` + `cv2.warpAffine` |
| 多种字体     | 印刷体风格差异          | 渲染时随机选字体文件（TTF/OTF）                                |
| 模糊       | 失焦、运动模糊          | 高斯模糊 `cv2.GaussianBlur`                            |
| 亮度/对比度   | 光照变化             | 线性变换 $g(x) = a f(x) + b$                           |

表中第一列是增强名称，第二列是它要模拟的真实现象，第三列是常用的实现方式；其中"粘连"和"断裂"是两种相反的笔画缺陷，分别对应让笔画变粗和变细；注意形态学膨胀作用于亮区域，所以白底黑字的图像要反过来用（见下面的示例）。

线性亮度/对比度变换的公式：

$$ g(x) = a,f(x) + b $$

其中：

  - $f(x)$：原图像素值，$g(x)$：变换后像素值（再裁剪到 $\[0,255\]$）
  - $a$：对比度系数，$a\>1$ 增强对比度，$a\<1$ 降低
  - $b$：亮度偏移，正数变亮、负数变暗

## 示例

``` python
import cv2
import numpy as np

img = cv2.imread("text.png", cv2.IMREAD_GRAYSCALE)

# 笔画粘连：让黑色笔画变粗（白底黑字，所以用腐蚀）
kernel = np.ones((2, 2), np.uint8)
stick = cv2.erode(img, kernel, iterations=1)

# 笔画断裂：让黑色笔画变细（用膨胀）
broken = cv2.dilate(img, kernel, iterations=1)

# 小角度旋转
h, w = img.shape
M = cv2.getRotationMatrix2D((w / 2, h / 2), angle=5, scale=1.0)
rotated = cv2.warpAffine(img, M, (w, h), borderValue=255)

# 椒盐噪声
noisy = img.copy()
mask = np.random.rand(h, w)
noisy[mask < 0.01] = 0
noisy[mask > 0.99] = 255
```

形态学操作作用的是**亮区域**：膨胀让亮的部分变大，腐蚀让亮的部分变小。示例里的图像是白底黑字，所以用腐蚀让黑笔画变粗、用膨胀让它变细；黑底白字的图像则相反，使用时要按前景颜色选择，或先反色。

## 使用建议

  - **扰动强度要有范围**：每次随机采样旋转角度、模糊半径等，范围要贴近真实数据，过强的扰动会让文字无法辨认，反而伤害训练。
  - **在线与离线**：离线生成一批图片落盘，简单但数据固定；在线增强在每个 batch 上随机变换，数据更丰富，训练时更常用。
  - **合成数据只是补充**：合成数据与真实数据存在分布差异，通常先在合成数据上预训练（如 SynthText），再用少量真实数据微调。
  - **配合通用增强库**：除了手写 OpenCV，也可用 imgaug、Albumentations 等库组合上述变换。

## Reference

  - [【OCR技术系列之三】大批量生成文字训练集](https://www.cnblogs.com/skyfsm/p/8436820.html)
  - [OpenCV - Morphological
    Transformations](https://docs.opencv.org/4.x/d9/d61/tutorial_py_morphological_ops.html)
  - [Albumentations](https://albumentations.ai/)
