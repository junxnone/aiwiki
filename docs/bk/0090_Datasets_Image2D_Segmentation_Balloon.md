-----

| Title     | Datasets Image2D Segmentation Balloon                |
| --------- | ---------------------------------------------------- |
| Created @ | `2020-04-15T08:30:13Z`                               |
| Updated @ | `2026-11-11T09:36:39Z`                               |
| Labels    | \`\`                                                 |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/90) |

-----

# Balloon

Balloon 是 Matterport 版 Mask R-CNN
仓库示例中使用的气球小数据集，用于演示如何在自定义数据上微调实例分割模型。图像很少，训练快，适合验证流程。

![image](media/b63fdcd176779929c2748bc9f75d21f647aa1099.png)

## 来源

  - 来自 matterport/Mask\_RCNN 的 `samples/balloon` 示例，图片取自公开来源（待核实）。

## 任务与标注

  - 单类（balloon）实例分割。
  - 标注用 VIA（VGG Image Annotator）导出的 JSON，为多边形（polygon）。
  - 场景包含单个、多个以及相互重叠的气球。

## 规模统计

| 项目    | 数值                 |
| ----- | ------------------ |
| Train | 61 张               |
| Val   | 13 张               |
| 类别    | 1（balloon）         |
| 下载大小  | 约 37MB（release 页面） |

## 目录结构与解析

    balloon/
    ├── train/  via_region_data.json  *.jpg
    └── val/    via_region_data.json  *.jpg

解析多边形并生成 mask：

``` python
import json
import numpy as np
from PIL import Image
from skimage.draw import polygon

def load_masks(split_dir):
    ann = json.load(open(split_dir + "/via_region_data.json"))
    for a in ann.values():
        regs = a["regions"]
        if not regs:
            continue
        regs = regs.values() if isinstance(regs, dict) else regs  # 兼容 VIA 新旧格式
        img = Image.open(split_dir + "/" + a["filename"])
        w, h = img.size
        masks = []
        for r in regs:
            s = r["shape_attributes"]
            m = np.zeros((h, w), np.uint8)
            rr, cc = polygon(s["all_points_y"], s["all_points_x"], (h, w))
            m[rr, cc] = 1
            masks.append(m)
        yield img, np.stack(masks)
```

torchvision 的 Mask R-CNN 微调可参考官方 TorchVision Object Detection Finetuning
教程，需把上述 mask 打包成 `boxes/labels/masks` 的 target 字典。

## 下载与许可

  - 下载：见 Reference（Mask\_RCNN releases 页面，约 37MB）。
  - 许可：随 Mask\_RCNN 仓库（MIT，待核实），图像版权属原作者。

## 评测与基线

  - 通常看 mask AP / 可视化效果；数据极小，指标仅用于流程验证，不具备跨论文可比性。

## 常见坑

  - VIA 导出的 `regions` 在不同版本中可能是 dict 或 list，解析需兼容。
  - 部分图像无 region，需跳过。
  - 仅 74 张图，容易过拟合，建议从 COCO 预训练权重微调并做数据增强。

## 相关

  - [Segmentation 汇总](0097_Datasets_Image2D_Segmentation)、[Datasets
    Image2D](0018_Datasets_Image2D)

## Reference

  - [Github
    Download 37MB](https://github.com/matterport/Mask_RCNN/releases)
