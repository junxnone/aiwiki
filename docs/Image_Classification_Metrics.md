---
Title | Image Classification Metrics
-- | --
Create Date | `2021-11-21T04:55:43Z`
Update Date | `2021-11-21T11:04:30Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/137)

---
## Reference

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


## Binary Classification

Name | Formula | Description
-- | -- | --
Accuracy | Accuracy = N<sub>correct</sub> / N<sub>Total</sub> <br> $\texttt{accuracy}(y, \hat{y}) = \frac{1} | 预测正确的占总数的比例
Precision | $\text{precision} = \frac{tp}{tp + fp}$
Recall | $\text{recall} = \frac{tp}{tp + fn}$
F<sub>β</sub> | $F_\beta = (1 + \beta^2) \frac{\text{precision} \times \text{recall}}{\beta^2 \text{precision} + \text{recall}}$




Name | Definition
-- | --
Accuracy | Accuracy = N<sub>correct</sub> / N<sub>Total</sub> <br> $\texttt{accuracy}(y, \hat{y}) = \frac{1}{n_\text{samples}} \sum_{i=0}^{n_\text{samples}-1} 1(\hat{y}_i = y_i)$
Precision | 正确分类的正样本个数占分类器判定为正样本的样本个数的比例
Recall | 正确分类的正样本个数占真正的正样本数的比例
F1-Score | ![image](https://user-images.githubusercontent.com/2216970/60110790-3ff31400-979f-11e9-9349-15c9b84d7099.png)



## Confusion matrix

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

### ROC - Receiver Operating Characteristic Curve
受试者工作特征曲线
- 横坐标为假阳性率(FPR)
![image](https://user-images.githubusercontent.com/2216970/60111139-f9ea8000-979f-11e9-9832-ec36e1592a74.png)
- 纵坐标为真阳性率(TPR)
![image](https://user-images.githubusercontent.com/2216970/60111167-07076f00-97a0-11e9-91e2-45a834874a2b.png)

### AUC - Area Under the Curve

- AUC常常用来评估二分类模型的性能。
- 曲线下的面积通常指的是ROC曲线。
- 相比于准确率、召回率、F1值等依赖于判决阈值的评估指标，AUC则没有这个问题。


