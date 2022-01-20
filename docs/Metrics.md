---
Title | Metrics
-- | --
Create Date | `2021-11-21T06:01:17Z`
Update Date | `2022-01-20T05:13:16Z`
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

### Accuracy/Precision/Recall/F<sub>β</sub>

Name | Formula | Description
-- | -- | --
Accuracy | Accuracy = N<sub>correct</sub> / N<sub>Total</sub> <br>  $\texttt{accuracy}(y, \hat{y}) = \frac{1}{n_\text{samples}} \sum_{i=0}^{n_\text{samples}-1} 1(\hat{y}_i = y_i)$ | 预测正确的占总数的比例
Precision | $\text{precision} = \frac{tp}{tp + fp}$ | 所有识别为正例的情况中，识别正确的比例
Recall | $\text{recall} = \frac{tp}{tp + fn}$ |  所有实际类别为正例的情况中，识别正确的比例
F<sub>β</sub> | $F_\beta = (1 + \beta^2) \frac{\text{precision} \times \text{recall}}{\beta^2 \text{precision} + \text{recall}}$ <br>F1: 当 β = 1 时的 F<sub>β</sub>

### PR Curve
- 以precision和recall作为纵、横轴坐标的二维曲线，通过选取不同`confidence 阈值` 时对应的精度和召回率画出
- 总体趋势，精度越高，召回越低，当召回达到1时，对应概率分数最低的正样本，这个时候正样本数量除以所有大于等于该阈值的样本数量就是最低的精度值
- P-R曲线围起来的面积就是AP值，通常来说一个越好的分类器，AP值越高。

![fig_1](https://user-images.githubusercontent.com/2216970/74395973-a5d5fe00-4e4b-11ea-852b-5a5427ff3a01.gif)



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
