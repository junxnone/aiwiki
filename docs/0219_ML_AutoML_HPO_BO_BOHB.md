---
Title | ML AutoML HPO BO BOHB
-- | --
Created @ | `2021-03-30T07:40:05Z`
Last Modify @| `2022-12-24T13:20:57Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/219)

---
## Reference
- 2015 **SHA - Successive Halving Algorithm** [Non-stochastic Best Arm Identification and Hyperparameter Optimization](https://arxiv.org/abs/1502.07943)
- 2018 **ASHA** [A System for Massively Parallel Hyperparameter Tuning](https://arxiv.org/abs/1810.05934)
- 2016 [Hyperband: Bandit-Based Configuration Evaluation for Hyperparameter Optimization](https://openreview.net/pdf?id=ry18Ww5ee)
- 2018  **BOHB** [BOHB: Robust and Efficient Hyperparameter Optimization at Scale](https://arxiv.org/abs/1807.01774)
- 2018 [Practical Hyperparameter Optimization for Deep Learning](https://openreview.net/pdf?id=HJMudFkDf)
- [VEGA-HPO](https://www.noahlab.com.hk/opensource/vega/page/doc.html?path=algorithms/hpo)
- [Massively Parallel Hyperparameter Optimization](https://blog.ml.cmu.edu/2018/12/12/massively-parallel-hyperparameter-optimization/)
- [NNI - BOHBO](https://github.com/microsoft/nni/blob/master/docs/zh_CN/Tuner/BohbAdvisor.rst)

## Brief
- BOHB - Bayesian Optimization and Hyperband
- 属于 动态资源分配/Dynamic Resource Allocation


## Hyperband 
- Hyperband  是对 Successive Halving 的扩展

Successive Halving | Hyperband 
-- | --
![image](https://user-images.githubusercontent.com/2216970/113124071-ba3faa80-9247-11eb-90f2-df53a5d4247f.png) | ![image](https://user-images.githubusercontent.com/2216970/113125221-f6bfd600-9248-11eb-9c17-fba823d49416.png)

SHA |![sync](https://user-images.githubusercontent.com/2216970/113128493-6daa9e00-924c-11eb-9325-b5cc731ee43a.gif)
-- | :--
ASHA |![async](https://user-images.githubusercontent.com/2216970/113128504-71d6bb80-924c-11eb-8384-ea985a8ea9ee.gif)


## BOHB Algorithm
![image](https://user-images.githubusercontent.com/2216970/113123190-edce0500-9246-11eb-946c-499b18ca9d8b.png)

