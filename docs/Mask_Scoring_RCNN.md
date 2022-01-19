---
Title | Mask Scoring RCNN
-- | --
Create Date | `2019-06-22T08:30:59Z`
Update Date | `2022-01-19T07:52:03Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/164)

---
## Reference

- [paper - 2019 - Mask Scoring R-CNN](https://arxiv.org/pdf/1903.00241.pdf)
- [Code - Mask Scoring R-CNN](https://github.com/zjhuang22/maskscoring_rcnn)
- [2019CVPR《Mask Scoring R-CNN》](https://www.cnblogs.com/wemo/p/10505970.html)
- [性能超越何恺明Mask R-CNN！华科大开源图像分割新方法](https://www.jiqizhixin.com/articles/2019-05-15-4)
- [CVPR2019 | Mask Scoring R-CNN 论文解读](https://www.cnblogs.com/ManWingloeng/p/10717578.html)

## Brief

### Mask RCNN vs MS RCNN
- Mask R-CNN的MaskIoU与分类置信度没有太强的关联
- MS R-CNN 在 Mask R-CNN 框架上添加一个分支 MaskIoU Head 模块，用来学习MaskIoU

![image](https://user-images.githubusercontent.com/2216970/79094113-040a5900-7d89-11ea-9930-69f6a3fbe81f.png)

### MaskIoU Head

- Input = `Predicted mask`  + `Max Pooling (2,2)` + `ROIAlign layer`
- Training
  - 使用 `threshold=0.5` 处理 mask
- Inference
  - final mask confidence = MaskIoU x `classification score` 

![image](https://user-images.githubusercontent.com/2216970/79094393-f0132700-7d89-11ea-8947-cd0902ef1505.png)

- 不同的 `MaskIoU Head Input`

![image](https://user-images.githubusercontent.com/2216970/79095633-754c0b00-7d8d-11ea-92bc-ab40ac2a12d8.png)
![image](https://user-images.githubusercontent.com/2216970/79095636-7c731900-7d8d-11ea-9c42-0975b4b0799d.png)

- 不同的 `Training Targets`

![image](https://user-images.githubusercontent.com/2216970/79095653-8ac13500-7d8d-11ea-903f-8d1a9f705a91.png)

##  mAP 对比
- 相比 Mask R-CNN
  - AP-S/M/L 上都有所提升
  - AP 0.5 有下降，0.75 有上升，整体 AP 提升一个点多


![image](https://user-images.githubusercontent.com/2216970/79095810-002d0580-7d8e-11ea-9919-ae83c4e66030.png)

