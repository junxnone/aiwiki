---
Title | Image Classification Metrics
-- | --
Create Date | `2021-11-21T04:55:43Z`
Update Date | `2021-11-22T02:32:55Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/137)

---
## Reference
- [Metrics and scoring - scikit-learn](https://scikit-learn.org/stable/modules/model_evaluation.html#metrics-and-scoring-quantifying-the-quality-of-predictions)
- [sklearn.metrics.confusion_matrix](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.confusion_matrix.html)
- [The Relationship Between Precision-Recall and ROC Curves](https://www.biostat.wisc.edu/~page/rocpr.pdf)

## Brief
- Accuracy
  - 当样本不均衡时，Accuracy 不能很好的区分模型
- Precision
- Recall
- F1 score
- ROC
- PR
- AUC
- Confusion Matrix
- Error Rate


## Binary Classification Metrics
- True/False - 代表识别正确与否
- Positive/Negative - 代表正负例(Binary Classification)
- `Tx`:  表示分类正确：
  - TP - true positive：输入实际类别正例，模型识别为正例
  - TN - true negative：输入实际类别为负例，模型识别为负例
- `Fx`: 表示分类错误：
  - FP - false positive：输入实际类别为负例，模型识别为正例，通常叫误报
  - FN - false negative：输入实际类别为正例，模型识别为负例，通常叫漏报

`Predict Label ↓` `Actual Label →` | 1 | 0
-- | -- | --
1 | TP | FP
0 | FN | TN


![image](https://user-images.githubusercontent.com/2216970/51228367-3dd88e00-1993-11e9-8d28-7ab43b834354.png)


Name | Formula | Description
-- | -- | --
Accuracy | Accuracy = N<sub>correct</sub> / N<sub>Total</sub> <br>  $\texttt{accuracy}(y, \hat{y}) = \frac{1}{n_\text{samples}} \sum_{i=0}^{n_\text{samples}-1} 1(\hat{y}_i = y_i)$ | 预测正确的占总数的比例
Precision | $\text{precision} = \frac{tp}{tp + fp}$ | 所有识别为正例的情况中，识别正确的比例
Recall | $\text{recall} = \frac{tp}{tp + fn}$ |  所有实际类别为正例的情况中，识别正确的比例
F<sub>β</sub> | $F_\beta = (1 + \beta^2) \frac{\text{precision} \times \text{recall}}{\beta^2 \text{precision} + \text{recall}}$ <br>F1: 当 β = 1 时的 F<sub>β</sub>


## Multiclass and Multilabel Classification
- **micro**: 取全部样例
- **macro**:  按类别取均值
- **weighted**: 对类别按比例给予权重计算
- **samples**: 应用于 multilabel 问题


average | Precision | Recall |F<sub>β</sub>
-- | -- | -- | --
**micro** | $P(y, \hat{y})$ | $R(y, \hat{y})$ | $F_\beta(y, \hat{y})$
**samples** | $\frac{1}{\left\|S\right\|} \sum_{s \in S} P(y_s, \hat{y}_s)$ | $\frac{1}{\left\|S\right\|} \sum_{s \in S} R(y_s, \hat{y}_s)$ | $\frac{1}{\left\|S\right\|} \sum_{s \in S} F_\beta(y_s, \hat{y}_s)$
**macro** | $\frac{1}{\left\|L\right\|} \sum_{l \in L} P(y_l, \hat{y}_l)$ | $\frac{1}{\left\|L\right\|} \sum_{l \in L} R(y_l, \hat{y}_l)$ | $\frac{1}{\left\|L\right\|} \sum_{l \in L} F_\beta(y_l, \hat{y}_l)$
**weighted** | $\frac{1}{\sum_{l \in L} \left\|\hat{y}_l\right\|} \sum_{l \in L} \left\|\hat{y}_l\right\| P(y_l, \hat{y}_l)$ | $\frac{1}{\sum_{l \in L} \left\|\hat{y}_l\right\|} \sum_{l \in L} \left\|\hat{y}_l\right\| R(y_l, \hat{y}_l)$ | $\frac{1}{\sum_{l \in L} \left\|\hat{y}_l\right\|} \sum_{l \in L} \left\|\hat{y}_l\right\| F_\beta(y_l, \hat{y}_l)$

- $P(A, B) := \frac{\left| A \cap B \right|}{\left|A\right|}$
- $R(A, B) := \frac{\left| A \cap B \right|}{\left|B\right|}$
- $F_\beta(A, B) := \left(1 + \beta^2\right) \frac{P(A, B) \times R(A, B)}{\beta^2 P(A, B) + R(A, B)}$

Accuracy | Math Formula
-- | --
Accuracy |  $\texttt{accuracy}(y, \hat{y}) = \frac{1}{n_\text{samples}} \sum_{i=0}^{n_\text{samples}-1} 1(\hat{y}_i = y_i)$
Top-k Accuracy | $\texttt{top-k accuracy}(y, \hat{f}) = \frac{1}{n_\text{samples}} \sum_{i=0}^{n_\text{samples}-1} \sum_{j=1}^{k} 1(\hat{f}_{i,j} = y_i)$ 
Balanced Accuracy |$\texttt{balanced-accuracy} = \frac{1}{2}\left( \frac{TP}{TP + FN} + \frac{TN}{TN + FP}\right )$ <br> $\texttt{balanced-accuracy}(y, \hat{y}, w) = \frac{1}{\sum{\hat{w}_i}} \sum_i 1(\hat{y}_i = y_i) \hat{w}_i$




## Confusion Matrix
- **Confusion Matrix** - 混淆矩阵 - 误差矩阵
- nxn 矩阵 n 为 类别


Confusion matrix without normalization| Confusion matrix with normalization
-- | --
![image](https://user-images.githubusercontent.com/2216970/54807154-49a83f80-4cb7-11e9-9704-696ad5a13047.png) | ![image](https://user-images.githubusercontent.com/2216970/54807161-4f9e2080-4cb7-11e9-9501-7f464858fb79.png)

```
Confusion matrix, without normalization
[[13  0  0]
 [ 0 10  6]
 [ 0  0  9]]
Normalized confusion matrix
[[1.   0.   0.  ]
 [0.   0.62 0.38]
 [0.   0.   1.  ]]
```

### AUC - Area Under the Curve

- AUC常常用来评估二分类模型的性能。
- 曲线下的面积通常指的是ROC曲线。
- 相比于准确率、召回率、F1值等依赖于判决阈值的评估指标，AUC则没有这个问题。

#### ROC-AUC
- ROC - `Receiver Operating Characteristic Curve` - 受试者工作特征曲线
- 横坐标为假阳性率(FPR)
![image](https://user-images.githubusercontent.com/2216970/60111139-f9ea8000-979f-11e9-9832-ec36e1592a74.png)
- 纵坐标为真阳性率(TPR)
![image](https://user-images.githubusercontent.com/2216970/60111167-07076f00-97a0-11e9-91e2-45a834874a2b.png)

#### PR-AUC
