---
Title | Loss Function
-- | --
Create Date | `2019-04-08T06:11:14Z`
Update Date | `2022-01-24T16:57:23Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/281)

---
## Reference

- [常见回归和分类损失函数比较](https://www.cnblogs.com/massquantity/p/8964029.html)
- [L1 vs. L2 Loss function](http://rishy.github.io/ml/2015/07/28/l1-vs-l2-loss/)
- [Hinge loss](https://www.wikiwand.com/en/Hinge_loss)
- [Zero one loss - scikit-learn](https://scikit-learn.org/stable/modules/model_evaluation.html#zero-one-loss)


## Brief
- Loss Function/损失函数 - 用于计算 `Predict Result` 与 `Ground Truth` 误差
- 分类问题
- 回归问题


## 分类损失函数

![image](https://user-images.githubusercontent.com/2216970/67662190-e04f8400-f99d-11e9-9279-f78628ab1ea5.png)

### 0-1 Loss 
- Zero one loss/0-1损失
- 对每个错分类点都施以相同的惩罚，
- 0-1损失不连续、非凸，优化困难

Name | Formula 
-- | --
0-1 Loss | $L_{0-1}(y_i, \hat{y}_i) = 1(\hat{y}_i \not= y_i)$

### Hamming Loss


Name | Formula
-- | --
Hamming Loss | $L_{Hamming}(y, \hat{y}) = \frac{1}{n_\text{labels}} \sum_{j=0}^{n_\text{labels} - 1} 1(\hat{y}_j \not= y_j)$

### Log Loss
- `Logistic Regression Loss`/`Cross-Entropy Loss`

Name | Formula
-- | --
Binary Classification | $L_{\log}(y, p) = -\log \operatorname{Pr}(y\|p) = -(y \log (p) + (1 - y) \log (1 - p))$
Multiclass Classification | $L_{\log}(Y, P) = -\log \operatorname{Pr}(Y\|P) = - \frac{1}{N} \sum_{i=0}^{N-1} \sum_{k=0}^{K-1} y_{i,k} \log p_{i,k}$

### Hinge loss - 合页损失
- 用于 `maximum-margin` 的分类器
- 用于 SVM

Name | Formula
-- | --
Label[-1, +1] | $L_\text{Hinge}(y, w) = \max\left\{1 - wy, 0\right\} = \left\|1 - wy\right\|_+$
Multi-Label |  $L_\text{Hinge}(y_w, y_t) = \max\left\{1 + y_t - y_w, 0\right\}$

![image](https://user-images.githubusercontent.com/2216970/67666992-e3e80880-f9a7-11e9-8189-fb900e2c09ab.png)

### 指数损失(Exponential loss)
![image](https://user-images.githubusercontent.com/2216970/67667051-feba7d00-f9a7-11e9-99fa-9a58a6657fbd.png)

### modified Huber loss
![image](https://user-images.githubusercontent.com/2216970/67667064-067a2180-f9a8-11e9-8380-afcd70b53da8.png)
> 结合了hinge loss和logistic loss的优点，既能在yf(x)>1时产生稀疏解提高训练效率，又能进行概率估计


## 回归损失函数

### MSE
- Mean Squared Error/均方误差
- L2 Loss - `Least Square errors`

Name | Formula
-- | --
MSE | $\text{MSE}(y, \hat{y}) = \frac{1}{n_\text{samples}} \sum_{i=0}^{n_\text{samples} - 1} (y_i - \hat{y}_i)^2$

### MAE
- Mean Absolute Error/平均绝对值误差
- L1 Loss - `Least absolute deviations`
- MAE对异常点有更好的鲁棒性

Name | Formula
-- | --
MAE | $\text{MAE}(y, \hat{y}) = \frac{1}{n_{\text{samples}}} \sum_{i=0}^{n_{\text{samples}}-1} \left\| y_i - \hat{y}_i \right\|$


### MAPE
- Mean Absolute Percentage Error
- MAPD - `Mean Absolute Percentage Deviation`
- 相对误差敏感

Name | Formula
-- | --
MAPE | $\text{MAPE}(y, \hat{y}) = \frac{1}{n_{\text{samples}}} \sum_{i=0}^{n_{\text{samples}}-1} \frac{{}\left\| y_i - \hat{y}_i \right\|}{max(\epsilon, \left\| y_i \right\|)}$


### MSLE
- Mean Squared Logarithmic Error

Name | Formula
-- | --
MSLE | $\text{MSLE}(y, \hat{y}) = \frac{1}{n_\text{samples}} \sum_{i=0}^{n_\text{samples} - 1} (\log_e (1 + y_i) - \log_e (1 + \hat{y}_i) )^2.$



### Huber损失

![image](https://user-images.githubusercontent.com/2216970/67666096-06792200-f9a6-11e9-9fbc-ad414019a67b.png)
> 当Huber损失在[0-δ,0+δ]之间时，等价为MSE，而在[-∞,δ]和[δ,+∞]时为MAE。

![image](https://user-images.githubusercontent.com/2216970/67666131-1abd1f00-f9a6-11e9-9449-01d612c87a05.png)

### Log-Cosh损失

![image](https://user-images.githubusercontent.com/2216970/67666217-4e984480-f9a6-11e9-9a28-48d4bd854e01.png)
> 二阶处处可微

![image](https://user-images.githubusercontent.com/2216970/67666224-535cf880-f9a6-11e9-90e6-744bf2fcc32c.png)

### 分位数损失



