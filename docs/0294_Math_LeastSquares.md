---
Title | Math LeastSquares
-- | --
Created @ | `2022-03-07T04:06:49Z`
Last Modify @| `2022-12-25T03:37:51Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/294)

---
# Least Squares 最小二乘法 

## Reference
- [最小二乘法回归 demo](https://phet.colorado.edu/sims/html/least-squares-regression/latest/least-squares-regression_en.html)
- [最小二乘法 - 一元](https://otexts.com/fppcn/least-squares.html)
- [最小二乘法 - 多元](https://otexts.com/fppcn/regression-matrices.html)

## Brief
- Least Squares - 最小二乘法 - 最小平方法
- 最小误差平方和优化获取最佳拟合
- 拟合直线


![image](https://user-images.githubusercontent.com/2216970/156966154-4eabd265-57ec-4b1b-9c2a-1e4f06653a2e.png) | ![image](https://user-images.githubusercontent.com/2216970/156966278-ac6d0421-9694-4265-a602-aebbbe7b963a.png)
-- | --

## 推理

### 一元线性回归

Name | Description
-- | --
数据 | $X = \left\{(x_{1}, y_{1}), (x_{2}, y_{2})..., (x_{m}, y_{m})\right\}$
模型 |  $y = \beta_{0} + \beta_{1}x$
目标函数 | $J(\beta) = \sum_{i=0}^{m}(y_{i}-\beta_{1}x_{i}-\beta_{0})^2$
解 | $\beta_{1} = \frac{\sum_{i=1}^{m}(x_{i}-\bar{x})(y_{i}-\bar{y})}{\sum_{i=1}^{m}(x_{i}-\bar{x})^2}$ <br> $\beta_{0} = \bar{y}-\beta_{1}\bar{x}$


### 多元线性回归

Name | Description
-- | --
模型 | $y_{t} = \beta_{0} + \beta_{1} x_{1,t} + \beta_{2} x_{2,t} + \cdots +  \beta_{k} x_{k,t} + \varepsilon_{t}$
... | $\bm{y} = \bm{X}\bm{\beta} + \bm{\varepsilon}.$
参数 | $\bm{\beta} = (\beta_{0},\dots,\beta_{k})'$
数据 | $\bm{X} = \left[     \begin{matrix}       1 & x_{1,1} & x_{2,1} & \dots & x_{k,1}\\       1 & x_{1,2} & x_{2,2} & \dots & x_{k,2}\\       \vdots& \vdots& \vdots&& \vdots\\       1 & x_{1,T}& x_{2,T}& \dots& x_{k,T}     \end{matrix}\right]$
目标函数 | $\bm{\varepsilon}'\bm{\varepsilon} = (\bm{y} - \bm{X}\bm{\beta})'(\bm{y} - \bm{X}\bm{\beta})$
解 | $\hat{\bm{\beta}} = (\bm{X}'\bm{X})^{-1}\bm{X}'\bm{y}$


