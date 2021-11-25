---
Title | HPO SIGOPT
-- | --
Create Date | `2021-09-01T09:01:43Z`
Update Date | `2021-11-25T08:09:27Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/15)

---
## Reference
- [SigOpt docs](https://app.sigopt.com/docs)  [[code](https://github.com/sigopt)]
- 2016 A Stratified Analysis of Bayesian Optimization Methods [[paper](https://arxiv.org/pdf/1603.09441.pdf)]
- [sigopt_experiment_and_optimization_demo.ipynb](https://colab.research.google.com/github/sigopt/sigopt-examples/blob/master/get-started/sigopt_experiment_and_optimization_demo.ipynb)
- [Intro to Multicriteria Optimization](https://sigopt.com/blog/intro-to-multicriteria-optimization/)


## Brief
- Online Tools - 跟踪/分析/微调 `AI Model`
- **超参优化步骤**
  - 1. 获取随机**超参**
  - 2. 把跑出来的 **metrics** 提交到 **sigopt**
  - 3. 获取新的**超参**
  - 4. 重复以上步骤获取最好的参数
- [sigopt UseCase](/HPO_SIGOPT_Usecase)
- [sigopt Options - parameters/metrics](/HPO_SIGOPT_Options)
- **参数类型支持** `浮点型/整型/Grid/Categorical`
- **Multimetric**: 优化 `accuracy` 的同时, 优化 `inference_time`
- **Support Optimization**
  - Random Search
  - Grid Search
  - **SigOpt Search**: Bayesian Optimizer
  - All Constraint Search: sigopt Bayesian Optimizer & Metrics Constraints
  - Custom Optimizer
    - [Hyperopt](https://hyperopt.github.io/hyperopt/)
    - [Optuna](https://optuna.org/)
- **Parallel**
  - 多机器训练


![image](https://user-images.githubusercontent.com/2216970/132183671-21794822-2014-42f3-be9c-4685a0f422d6.png)


## Parallel
- 方式
  - Threads
  - Machines (`+unique tag`)
  - Training clusters
- Pipelines
  - set `parallel_bandwidth`
  - Init workers with `EXPERIMENT_ID`
  - Optimization Loop - `Suggestions/Training/Evaluation/Observations`
