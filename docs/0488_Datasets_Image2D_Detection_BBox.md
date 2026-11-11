---
Title | Datasets Image2D Detection BBox
-- | --
Created @ | `2024-11-18T09:08:11Z`
Updated @| `2026-11-11T09:37:29Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/488)

---
# BBox Format

不同数据集/框架使用的边界框（bounding box）格式不同，混用会导致框错位。本文整理四种常见格式及相互转换。

格式 | 表示 | 是否归一化
-- | -- | --
**Pascal VOC** | `[x_min, y_min, x_max, y_max]` | 否，像素
**COCO** | `[x_min, y_min, width, height]` | 否，像素
**YOLO** | `[x_center, y_center, width, height]` | 是，`[0,1]`
**Albumentations** | `[x_min, y_min, x_max, y_max]` | 是，`[0,1]`

## Examples

图像尺寸 640×480，同一个框：

- **Pascal VOC** -  `[98, 345, 420, 462]`
- **COCO** - `[98, 345, 322, 117]`
- **YOLO** - `[((420 + 98) / 2) /640, ((462 + 345) / 2) /480, 322 /640, 117 /480]` => `[0.4046875, 0.840625, 0.503125, 0.24375]`
- **Albumentations** - `[98 /640, 345 /480, 420 /640, 462 /480]` => `[0.153125, 0.71875, 0.65625, 0.9625]`

![image](https://github.com/user-attachments/assets/c2e26040-47eb-464f-94ba-ae80d32bc564)

## 转换代码

```python
def voc_to_coco(b):
    x1, y1, x2, y2 = b
    return [x1, y1, x2 - x1, y2 - y1]

def coco_to_voc(b):
    x, y, w, h = b
    return [x, y, x + w, y + h]

def voc_to_yolo(b, W, H):
    x1, y1, x2, y2 = b
    return [(x1 + x2) / 2 / W, (y1 + y2) / 2 / H, (x2 - x1) / W, (y2 - y1) / H]

def yolo_to_voc(b, W, H):
    xc, yc, w, h = b
    return [(xc - w/2) * W, (yc - h/2) * H, (xc + w/2) * W, (yc + h/2) * H]
```

torchvision 提供 `torchvision.ops.box_convert(boxes, in_fmt, out_fmt)`，支持 `xyxy`（VOC）、`xywh`（左上角 + 宽高，即 COCO）、`cxcywh`（中心点 + 宽高，即未归一化的 YOLO）。

## 常见坑

- 归一化时 x 方向除以图像宽 W，y 方向除以图像高 H，别写反。
- YOLO 标注文件每行为 `class x_center y_center w h`，类别在最前。
- COCO 的 `bbox` 是 xywh，而 torchvision 检测模型的输入/输出为 xyxy。
- 图像缩放/letterbox/裁剪后需同步变换框坐标。

## 相关

[Detection 汇总](0237_Datasets_Image2D_Detection)、[COCO](0247_Datasets_Image2D_COCO)、[Pascal VOC](0092_Datasets_Image2D_PascalVOC)。

