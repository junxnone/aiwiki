---
Title | ML Metrics Detection APmAPAR
-- | --
Created @ | `2023-02-16T15:19:37Z`
Updated @| `2023-02-16T15:19:37Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/382)

---
# AP & mAP & AR

## AP
- AP 一般指单个类别

## mAP

- mAP - mAP 一般指所有类别的平均
- $mAP = \frac{\int_{1}^{n} AP}{n}$

---
- `mAP@.50IOU` - 当 IoU 大于 0.50 时认为正确识别的 mAP
- `mAP@.75IOU` - 当 IoU 大于 0.75 时认为正确识别时的 mAP
- `mAP@[.5:.95]` - IoU [0.5, 0.95] 范围内以步长 0.05 间隔计算 mAP

> COCO 中称 mAP 为 AP
> We make no distinction between AP and mAP (and likewise AR and mAR) and assume the difference is clear from context.


## AR

- AR  - 在每个图像中检测到固定数量的最大召回（recall），在类别和IoU上平均

