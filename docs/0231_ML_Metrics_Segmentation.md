---
Title | ML Metrics Segmentation
-- | --
Created @ | `2020-03-03T02:31:43Z`
Last Modify @| `2022-12-24T12:33:24Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/231)

---
## Reference
- [图像语义分割准确率度量方法总结](https://zhuanlan.zhihu.com/p/38236530)
- [Evaluating image segmentation models. - Jeremy Jordan](https://www.jeremyjordan.me/evaluating-image-segmentation-models/)

## Brief

Name | MIoU | Pixel Accuracy | FWIoU | Precision | Recall | PQ | SQ | RQ
-- | --  | -- | -- | -- | -- | -- | -- | --
Semantic Segmentation | √ | √ | √ | √ | √
Instance Segmentation | √ | √ | √ | √ | √
Panoptic Segmentation | √ | | | | | √ | √ | √


## Accuracy



Accuracy | Formula
-- | --
PA<br>Pixel Accuracy<br>像素准确率 | ![image](https://user-images.githubusercontent.com/2216970/69928565-044f3980-14f7-11ea-8700-7cd7ce646fa3.png)
MPA<br>Mean Pixel Accuracy<br>平均像素准确率 | ![image](https://user-images.githubusercontent.com/2216970/69928574-0913ed80-14f7-11ea-8c94-16c3536a189b.png)


- `pij` 表示本属于类 `i` 但被预测为类 `j` 的像素数量

## IoU
- IoU - `Intersection over Union`
- MIoU - `Mean IoU`
  - 基于类进行计算 IOU , 将每一类的 IOU计算之后累加, 再进行平均
- FWIoU - `Frequency Weighted IoU`
  - 根据每个类出现的频率设置权重

IoU | Formula
-- | --
MIoU | ![image](https://user-images.githubusercontent.com/2216970/69928583-103afb80-14f7-11ea-9eb5-a628af1f3f9b.png)
FWIoU | <img height="100px" src="https://user-images.githubusercontent.com/2216970/70517389-7ff25b80-1b73-11ea-82da-3723ff537c64.png">



## PQ - SQ - RQ

