---
Title | ML Metrics Detection COCO
-- | --
Created @ | `2023-02-16T15:23:32Z`
Updated @| `2023-02-16T15:47:02Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/384)

---
# COCO Detection Metrics

- COCO IoU 按照 `AP@[.5:.95]` 来计算, 更严格
  - 早期的 Pascal VOC 按照 `AP@.50IOU` 来计算
- COCO 中按 Area 面积定义 Small/Medium/Large Object, 可以统计不同大小 Object 的 Metrics
  - **Small** --> (< `32 * 32` < ) --> **Medium** --> (< `96 * 96` <) --> **Large**
- COCO 中 AP 指 mAP


![image](https://user-images.githubusercontent.com/2216970/51243686-2236ad00-19be-11e9-8fc9-bf0ff1ce6aa7.png)


## Reference

- [COCO Detection Evaluation](https://cocodataset.org/#detection-eval)
