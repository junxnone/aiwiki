---
Title | Image Object Detection Metrics
-- | --
Create Date | `2019-01-16T03:46:56Z`
Update Date | `2022-01-20T05:42:14Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/230)

---
## Reference

- [目标检测评价指标(mAP)](https://www.cnblogs.com/makefile/p/metrics-mAP.html)
- [SSD算法评估：AP， mAP和Precision-Recall曲线](https://blog.csdn.net/xunan003/article/details/79252162)
- [目标检测的评价指标](https://blog.csdn.net/Liven_Zhu/article/details/81316627)
- [一文了解目标检测/图像分割/coco数据集检测评价标准  - Oldpan](https://oldpan.me/archives/understand-coco-metric)
- [深度学习中IU、IoU(Intersection over Union)的概念理解以及python程序实现 - Oldpan](https://oldpan.me/archives/iu-iou-intersection-over-union-python)
- [MS COCO数据集目标检测评估（Detection Evaluation）](https://blog.csdn.net/u014734886/article/details/78831884)
- [目标检测中Recall、Precision和IOU](https://blog.csdn.net/yongjiankuang/article/details/78336860)
- [目标检测性能评价指标（mAP、IOU）](https://blog.csdn.net/qq_40196164/article/details/86301784)
- [[Algorithm] 机器学习算法常用指标总结](https://www.cnblogs.com/maybe2030/p/5375175.html)
- [F1 score](https://en.wikipedia.org/wiki/F1_score)
- [目标检测（Object Detection）中性能衡量指标mean Average Precision（mAP）的含义与计算](https://blog.csdn.net/asasasaababab/article/details/79994920)
- [详解对象检测网络性能评价指标mAP计算](https://cloud.tencent.com/developer/article/1370654)
- [Iou 的计算](https://www.cnblogs.com/q735613050/p/10618558.html)
- [目标检测 anchor 理解笔记](https://www.cnblogs.com/zfcode/p/mu-biao-jian-ce-anchor-li-jie-bi-ji.html)
- [【mAP】关于目标检测mAP的一些理解](https://blog.csdn.net/u014636245/article/details/89236073)
- [Omni-benchmarking Object Detection](https://towardsdatascience.com/omni-benchmarking-object-detection-b390cc4114cd)
- [mAP (mean Average Precision) for Object Detection](https://medium.com/@jonathan_hui/map-mean-average-precision-for-object-detection-45c121a31173)
- [The PASCAL Visual Object Classes (VOC) Challenge](http://homepages.inf.ed.ac.uk/ckiw/postscript/ijcv_voc09.pdf)
- [Metrics for object detection](https://github.com/rafaelpadilla/Object-Detection-Metrics)
- [An Introduction to Evaluation Metrics for Object Detection](https://blog.zenggyu.com/en/post/2018-12-16/an-introduction-to-evaluation-metrics-for-object-detection/)

## Metrics
- Accuracy
- Precision
  - AP - `Average Precision`
  - mAP - `Mean Average Precison` 
- Recall
  - AR - `Average Recall`
- IoU - `Intersection over Union`
- By Image/BBox

## Precision
```
Precision = TP / (TP + FP)
```
- 识别为正例的样例中，识别正确的比例
- AP - AP 衡量的是在每个类别上的好坏
- mAP - mAP 衡量的是在所有类别上的好坏。

---
- `mAP@.50IOU` - 当 IoU 大于 0.50 时认为正确识别的 mAP
- `mAP@.75IOU` - 当 IoU 大于 0.75 时认为正确识别时的 mAP
- `mAP@[.5:.95]` - IoU [0.5, 0.95] 范围内以步长 0.05 间隔计算 mAP

## Recall
```
Recall = TP / (TP + FN)
```
- 样本所有正例中，识别正确的比例
- 也被称作`查全率`， 即检测出来的样本/实际应该检测出的样本。
- AR  - 在每个图像中检测到固定数量的最大召回（recall），在类别和IoU上平均


## IoU

- 产生的候选框和 `Label BBox` 的交叠率，即它们交集与并集的比值。
- 最理想情况是完全重叠，即比值为1.
- 一般来说，这个 IoU＞ 0.5 就可以被认为一个不错的结果

![image](https://user-images.githubusercontent.com/2216970/51228980-9f016100-1995-11e9-8acc-3f5c07981a1c.png)



## COCO metrics
- COCO IoU 按照 `AP@[.5:.95]` 来计算, 更严格
  - 早期的 Pascal VOC 按照 `AP@.50IOU` 来计算
- COCO 中按 Area 面积定义 Small/Medium/Large Object, 可以统计不同大小 Object 的 Metrics
  - **Small** --> (< `32 * 32` < ) --> **Medium** --> (< `96 * 96` <) --> **Large**

![image](https://user-images.githubusercontent.com/2216970/51243686-2236ad00-19be-11e9-8fc9-bf0ff1ce6aa7.png)

