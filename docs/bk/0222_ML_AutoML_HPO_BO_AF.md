-----

| Title         | ML AutoML HPO BO AF                                   |
| ------------- | ----------------------------------------------------- |
| Created @     | `2021-03-30T02:28:50Z`                                |
| Last Modify @ | `2022-12-26T14:51:34Z`                                |
| Labels        | `index`                                               |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/222) |

-----

# Acquisition Function

## Reference

  - [Exploring Bayesian
    Optimization](https://distill.pub/2020/bayesian-optimization/)
  - [ucb/ei/pi code
    实现](https://github.com/fmfn/BayesianOptimization/blob/91441fe4002fb6ebdb4aa5e33826230d8df560d0/bayes_opt/util.py#L74)
  - [BayesianOptimization\_visualization\_af\_ucb\_ei\_poi.ipynb](https://github.com/junxnone/examples/blob/master/BayesianOptimization/BayesianOptimization_visualization_af_ucb_ei_poi.ipynb)
  - [exploitation\_vs\_exploration.ipynb](https://github.com/fmfn/BayesianOptimization/blob/91441fe4002fb6ebdb4aa5e33826230d8df560d0/examples/exploitation_vs_exploration.ipynb)

## Brief

  - Acquisition Function - 采集函数
  - AF 查询点分为两个方向 `Exploritation/开发` + `Exploration/探索`
  - 常用的 AF
      - UCB
      - EI
      - PI

## Exploritation/开发 & Exploration/探索

| 模式               | 选择策略    | 查询点分布            |
| ---------------- | ------- | ---------------- |
| Exploritation/开发 | 选择高均值的点 | 开发查询点集中在 `peaks` |
| Exploration/探索   | 选择高方差的点 | 探索查询点更分散         |

| Exploritation/开发                                             | Exploration/探索                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/a79133f01d09e64860cfb4d305522128856dec5d.png) | ![image](media/5bcafe5d8ab0d606b906aaf3bb78d321e32c62ca.png) |

| Acquisition Functions | ![image](media/59aeede61e547887f39956481333d17aae4351a5.png) |
| --------------------- | ------------------------------------------------------------ |

## 不同的 AF

| Acquisition Functions                            | Description           |
| ------------------------------------------------ | --------------------- |
| PI - Probability of Improvement                  | 选择具有最大可能性提高的点作为下一个查询点 |
| EI - Expected Improvement                        | 选择具有最大期望提高的点作为下一个查询点  |
| Thompson Sampling                                |                       |
| UCB - Upper Confidence Bound                     |                       |
| GP-UCB - Gaussian Process Upper Confidence Bound |                       |
| Entropy Search                                   |                       |
| Predictive Entropy Search                        |                       |

## PI - Probability of Improvement

![image](media/10a4a2ff9c98a32e255d0bacb5afc0ecd70f9805.png)
![image](media/84598dfe0540336079984a0a0fadc6c9af72241a.png)

  - f(x) 为 x 的目标函数
  - f(x+) 为目前最优 x 的目标函数值
  - ϵ 是一个比较小的正数 用来平衡 exploration/exploitation
  - μ (x) 是目标函数均值
  - σ (x) 是目标函数方差

<!-- end list -->

``` 
    def _poi(x, gp, y_max, xi):
        mean, std = gp.predict(x, return_std=True)
        z = (mean - y_max - xi)/std
        return norm.cdf(z)
```

| ϵ     | PI Iterations                                               |
| ----- | ----------------------------------------------------------- |
| 0.075 | ![0075](media/b7ccb56301654a5b900e873a2e966afdc6ff5a65.gif) |
| 0.3   | ![03](media/17dfa3ece948eaf9b79520528d51797e34c33284.gif)   |
| 3     | ![3](media/b808c3edb76bcad69ae72e217798f56bf599d3f6.gif)    |

## EI - Expected Improvement

![image](media/8dd395fca30a8c47b627f39f3bb9b440d615131a.png)
![image](media/00dfe7b294feb65bad46f4fd755e0ed7b039897f.png)
![image](media/1daf60847142ada395c1439fb4b58b4a0572aa98.png)
![image](media/28ede539e12fb785177f294daa8e108b1bc45583.png)

``` 
    def _ei(x, gp, y_max, xi):
        mean, std = gp.predict(x, return_std=True)
        a = (mean - y_max - xi)
        z = a / std
        return a * norm.cdf(z) + std * norm.pdf(z)
```

| ϵ    | EI Iterations                                                |
| ---- | ------------------------------------------------------------ |
| 0.01 | ![ei001](media/7f34e5cd8aaff57124844696f0ada8eb5faa0cb4.gif) |
| 0.3  | ![ei03](media/752d579dff4caa08bd2ebadcfd2ea218bc2d1926.gif)  |
| 3    | ![ei3](media/c24a9eac36080d6f1b000cfb8d415ad4f36c2af8.gif)   |

## Thompson Sampling

![ts](media/b56ae5344940ef04242dd3bbbdbdeb07541ebed2.gif)

## Random

![random](media/f14670de66e8b6f3d6b190064e96b47dd245cc2f.gif)

## UCB - Upper Confidence Bound

![image](media/6f303b0aabb1fde4f3516ef986b6cbbbc5e6b48d.png)

``` 
    def _ucb(x, gp, kappa):
        mean, std = gp.predict(x, return_std=True)
        return mean + kappa * std
```

## EI-PI (PI + λ \* EI)

## GP-UCB - Gaussian Process Upper Confidence Bound

![image](media/fac8c56680638b972b19c9bdebcc099cdf8952fc.png)

## AF 比较

![image](media/af36a20c59304d5e16188e8c48d3675aca210f64.png)
