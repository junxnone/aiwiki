---
Title | ML Metrics Detection APmAPAR
-- | --
Created @ | `2023-02-16T15:19:37Z`
Updated @| `2023-02-20T06:00:30Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/382)

---
# AP & mAP & AR

## AP
- PR 曲线下的面积
- AP 一般指单个类别

### 计算步骤

GT | ![image](https://user-images.githubusercontent.com/2216970/220018804-6eeb8f11-aeba-4fb7-8c35-80a84858b7cb.png)
-- | --
Predict Dog  | ![image](https://user-images.githubusercontent.com/2216970/219999922-5d64b9cf-f1e5-439a-9ae1-346b699051df.png)

#### 计算 Precision & Recall
- 根据 `confidence` 排序
- 
![image](https://user-images.githubusercontent.com/2216970/219999957-82ea09f1-1813-49e8-bdc5-eadc712051c8.png)

#### Plot PRCurve

- 每个 `Recall Level` 的 `Precision` 值 使用右侧最大值 使其单调?

![image](https://user-images.githubusercontent.com/2216970/220000067-3e7a8e79-1b1e-49ad-9681-d8b8468c681c.png)
![mean-average-precision-map-calculation-11-point-interpolation-pascal-voc-manual](https://user-images.githubusercontent.com/2216970/220021066-6f256990-3c13-43ad-901a-6fa23139bd67.gif)



##### 11 Point Interpolation Method

- **11 Recall Point: N=11** [0, 0.1, 0.2, ..., 0,9, 1.0]

![image](https://user-images.githubusercontent.com/2216970/220000690-1d169ef1-3857-46b0-996e-3a67070e9e77.png)

- $\huge AP =  \frac{1}{11}\times \int_{1}^{11}Precisions$
- $\huge =\frac{1}{11}\times (1+4\times 0.71+6\times 0)$
- $\huge =0.349$

#### 101 Point Interpolation AP
- **N=101**: MSCOCO AP `[0:.01:1]`

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

