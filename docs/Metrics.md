---
Title | Metrics
-- | --
Create Date | `2021-11-21T06:01:17Z`
Update Date | `2022-01-20T02:52:21Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/138)

---
## Reference

## Brief
- 每种 Task/Challenger 都会定义各自的 Metrics 用来评估模型的性能
- 每种 Metrics 想要衡量的东西不同, 通过不同 Metrics 的比较可以评价一个模型不同方面的特性
- 按 Task 分类
  - [(Image)Classification Metrics](/Image_Classification_Metrics)
  - [Image Detection Metrics](/)
  - [Pairwise Metrics](/Pairwise_Metrics)
  - Regression Metrics
  - Multilabel Ranking Metrics
  - Clustering Metrics 
  - Biclustering Metrics


## Image Task Metrics

Name | Classification | Object Detection | Segmentation | KeyPoint
-- | -- | -- | -- | --
Accuracy | √ | √ | √
Precision | √ | √ | √
Recall | √ | √| √
IoU | | √ | √

## Tools
- scikit-learn metrics
- keras metrics
- torch metrics
