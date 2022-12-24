---
Title | ML Metrics Detection GIoU
-- | --
Created @ | `2019-12-10T07:47:50Z`
Last Modify @| `2022-12-24T12:34:15Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/232)

---

## Reference

- [Github repo](https://github.com/generalized-iou)
- [官网](https://giou.stanford.edu/)
- [paper - Generalized Intersection over Union: A Metric and A Loss for Bounding Box Regression](https://giou.stanford.edu/GIoU.pdf)

## Brief
- GIoU - `Generalized Intersection over Union`

## IOU - Jaccard Index
- 目标检测中用来衡量 Predict 结果和 GT 的距离

<img height="40px" src="https://user-images.githubusercontent.com/2216970/70506275-dad08680-1b64-11ea-9575-25c2d9c404e6.png">

---
问题 - Q?
- IoU 无法优化无重叠的 BBox
> 如下图中 2 和 1 的 IOU 都是 0， 但是理论认为 2 比 1 应该有更好的值
>> 蓝绿色为 GT, 另一个 BBox 为 Predict 

1 | 2 
-- | --
![image](https://user-images.githubusercontent.com/2216970/70511891-a65fc900-1b6a-11ea-9b2c-5e882b4bbc80.png) | ![image](https://user-images.githubusercontent.com/2216970/70512013-aeb80400-1b6a-11ea-8bbe-40a1f661e1d5.png)



## GIOU

<img height="40px" src="https://user-images.githubusercontent.com/2216970/70506317-f340a100-1b64-11ea-9a27-7d28b411a01a.png">


---
区域 `C`
- 包含 A 和 B 的最小 BBox

1 | 2
-- | --
![image](https://user-images.githubusercontent.com/2216970/70512788-44539380-1b6b-11ea-99a0-ab6b3dff4a3b.png) | ![image](https://user-images.githubusercontent.com/2216970/70512798-4d446500-1b6b-11ea-9c3a-ece0bea1cca6.png)

---
- GIOU 取值范围 `[-1, 1]`

![image](https://user-images.githubusercontent.com/2216970/70512982-ac09de80-1b6b-11ea-879e-5d840dd8360c.png)

## GIOU Loss

<img height="20px" src="https://user-images.githubusercontent.com/2216970/70513472-ab257c80-1b6c-11ea-959f-1c614078729e.png">


---
计算方法
- GIOU Loss 范围为 [0, 2]

![image](https://user-images.githubusercontent.com/2216970/70513795-44ed2980-1b6d-11ea-8b71-17ecee768c85.png)

