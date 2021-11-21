---
Title | Metrics
-- | --
Create Date | `2021-11-21T06:01:17Z`
Update Date | `2021-11-21T16:21:33Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/138)

---
## Reference

## Brief
- 每种 Task 有各自特定的 Metrics
- 每种 Metrics 想要衡量的东西不同, 通过不同 Metrics 的比较可以评价一个模型不同方面的特性
- Metrics
  - Classification Metrics
  - Regression Metrics
  - Multilabel Ranking Metrics
  - Clustering Metrics 
  - Biclustering Metrics
  - Pairwise Metrics

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
