---
Title | ML AutoML HPO BO AF
-- | --
Created @ | `2021-03-30T02:28:50Z`
Last Modify @| `2022-12-24T13:20:16Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/222)

---
## Reference
- [Exploring Bayesian Optimization](https://distill.pub/2020/bayesian-optimization/)
- [ucb/ei/pi code 实现](https://github.com/fmfn/BayesianOptimization/blob/91441fe4002fb6ebdb4aa5e33826230d8df560d0/bayes_opt/util.py#L74)
- [BayesianOptimization_visualization_af_ucb_ei_poi.ipynb](https://github.com/junxnone/examples/blob/master/BayesianOptimization/BayesianOptimization_visualization_af_ucb_ei_poi.ipynb)
- [exploitation_vs_exploration.ipynb](https://github.com/fmfn/BayesianOptimization/blob/91441fe4002fb6ebdb4aa5e33826230d8df560d0/examples/exploitation_vs_exploration.ipynb)


## Brief
- Acquisition Function - 采集函数
- AF 查询点分为两个方向 `Exploritation/开发` + `Exploration/探索`
- 常用的 AF
  - UCB
  - EI
  - PI
 
## Exploritation/开发 & Exploration/探索 

模式 | 选择策略 | 查询点分布
-- | -- | --
Exploritation/开发 | 选择高均值的点 | 开发查询点集中在 `peaks`
Exploration/探索 | 选择高方差的点 | 探索查询点更分散

Exploritation/开发 | Exploration/探索 
-- | --
![image](https://user-images.githubusercontent.com/2216970/113095514-23aec180-9226-11eb-8103-d5939fc78f45.png)| ![image](https://user-images.githubusercontent.com/2216970/113095483-142f7880-9226-11eb-846c-ae031a7c3461.png)


Acquisition Functions | ![image](https://user-images.githubusercontent.com/2216970/112939674-7a50c880-915e-11eb-93f0-2d37095111c0.png)
-- | --

## 不同的 AF
Acquisition Functions| Description
-- | --
PI - Probability of Improvement | 选择具有最大可能性提高的点作为下一个查询点
EI - Expected Improvement | 选择具有最大期望提高的点作为下一个查询点
Thompson Sampling
UCB - Upper Confidence Bound
GP-UCB - Gaussian Process Upper Confidence Bound
Entropy Search
Predictive Entropy Search

## PI - Probability of Improvement
![image](https://user-images.githubusercontent.com/2216970/112924826-66e43400-9143-11eb-9cc3-c456927f79dc.png)
![image](https://user-images.githubusercontent.com/2216970/112924855-73688c80-9143-11eb-90c4-382f0294b8eb.png)

- f(x) 为 x 的目标函数
- f(x+) 为目前最优 x 的目标函数值
- ϵ 是一个比较小的正数 用来平衡 exploration/exploitation
- μ (x) 是目标函数均值
- σ (x) 是目标函数方差

```
    def _poi(x, gp, y_max, xi):
        mean, std = gp.predict(x, return_std=True)
        z = (mean - y_max - xi)/std
        return norm.cdf(z)
```
ϵ | PI Iterations
-- | -- 
0.075 | ![0075](https://user-images.githubusercontent.com/2216970/112940423-b6d0f400-915f-11eb-9e44-098d4b94d355.gif)
0.3 |  ![03](https://user-images.githubusercontent.com/2216970/112940434-bafd1180-915f-11eb-937b-6e72e7358e7b.gif)
3 | ![3](https://user-images.githubusercontent.com/2216970/112940442-be909880-915f-11eb-9d2a-c5010bd8e2ea.gif)

## EI - Expected Improvement
![image](https://user-images.githubusercontent.com/2216970/112943007-812e0a00-9163-11eb-946d-689927b1384c.png)
![image](https://user-images.githubusercontent.com/2216970/112943055-9014bc80-9163-11eb-9c33-68dd984eb65c.png)
![image](https://user-images.githubusercontent.com/2216970/112943283-df5aed00-9163-11eb-8b3e-57a9ab7e5f99.png)
![image](https://user-images.githubusercontent.com/2216970/112943311-ebdf4580-9163-11eb-87b0-cc0a6dbe0722.png)
```
    def _ei(x, gp, y_max, xi):
        mean, std = gp.predict(x, return_std=True)
        a = (mean - y_max - xi)
        z = a / std
        return a * norm.cdf(z) + std * norm.pdf(z)
```
ϵ | EI Iterations
-- | -- 
0.01 | ![ei001](https://user-images.githubusercontent.com/2216970/112944058-e2a2a880-9164-11eb-8884-9b4fcbc013ef.gif)
0.3 | ![ei03](https://user-images.githubusercontent.com/2216970/112944070-e6cec600-9164-11eb-9d40-526cea16f76a.gif)
3 | ![ei3](https://user-images.githubusercontent.com/2216970/112944078-ea624d00-9164-11eb-8e6e-e2b6d52d51cc.gif)

## Thompson Sampling
![ts](https://user-images.githubusercontent.com/2216970/112948062-29df6800-916a-11eb-9dc1-fb1d1508ec1c.gif)

## Random
![random](https://user-images.githubusercontent.com/2216970/112948076-2cda5880-916a-11eb-9e22-e67f4eb012a3.gif)

## UCB - Upper Confidence Bound
![image](https://user-images.githubusercontent.com/2216970/112947375-4929c580-9169-11eb-921b-5b0c6bed5db6.png)

```
    def _ucb(x, gp, kappa):
        mean, std = gp.predict(x, return_std=True)
        return mean + kappa * std
```
## EI-PI (PI + λ * EI)

## GP-UCB - Gaussian Process Upper Confidence Bound
![image](https://user-images.githubusercontent.com/2216970/112947303-357e5f00-9169-11eb-83c6-2fc4520abdba.png)

## AF 比较 
![image](https://user-images.githubusercontent.com/2216970/112946627-57c3ad00-9168-11eb-8977-f0807fa99008.png)

