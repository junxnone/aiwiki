---
Title | Metrics
-- | --
Create Date | `2021-11-21T06:01:17Z`
Update Date | `2022-01-20T03:01:43Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/138)

---
## Reference

## Brief
- 每种 Task/Challenger 都会定义各自的 Metrics 用来评估模型的性能
- 每种 Metrics 想要衡量的东西不同, 通过不同 Metrics 的比较可以评价一个模型不同方面的特性
- 按 Task 分类
  - [(Image)Classification Metrics](/Image_Classification_Metrics)
  - [Image Object Detection Metrics](/)
  - [Pairwise Metrics](/Pairwise_Metrics)
  - Regression Metrics
  - Multilabel Ranking Metrics
  - Clustering Metrics 
  - Biclustering Metrics

## 基本概念

### TP/TN/FP/FN

Name | Description
-- | --
**T**(True) | 模型识别正确
**F**(False) | 模型识别错误
**P**(Positive) | 对象本来为正例
**N**(Negative) | 对象本来为负例
**TP**(True Positive) | 对象本来为正例，网络识别为正例
**TN**(True Negative) | 对象本来为负例，网络识别为负例
**FP**(False Positive) | 对象本来为负例，网络识别为正例
**FN**(False Negative) | 对象本来为正例，网络识别为负例

![image](https://user-images.githubusercontent.com/2216970/51228367-3dd88e00-1993-11e9-8d28-7ab43b834354.png)



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
