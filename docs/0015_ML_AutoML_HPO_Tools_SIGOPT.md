---
Title | ML AutoML HPO Tools SIGOPT
-- | --
Created @ | `2021-09-01T09:01:43Z`
Last Modify @| `2022-12-24T13:22:23Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/15)

---
## Reference
- [SigOpt docs](https://app.sigopt.com/docs)  [[code](https://github.com/sigopt)]
- 2016 A Stratified Analysis of Bayesian Optimization Methods [[paper](https://arxiv.org/pdf/1603.09441.pdf)]
- [sigopt_experiment_and_optimization_demo.ipynb](https://colab.research.google.com/github/sigopt/sigopt-examples/blob/master/get-started/sigopt_experiment_and_optimization_demo.ipynb)
- [Intro to Multicriteria Optimization](https://sigopt.com/blog/intro-to-multicriteria-optimization/)


## Brief
- Online Tools - 跟踪/分析/微调 `AI Model`
- [sigopt UseCase](/HPO_SIGOPT_Usecase)
- [sigopt Options - parameters/metrics](/HPO_SIGOPT_Options)
- **参数类型支持** `浮点型/整型/Grid/Categorical`
- **Multimetric** (用例: 优化 `accuracy` 的同时, 优化 `inference_time`)
- **Support Optimization**: `Random/Grid/Bayesian/Constraint/Custom`
  - Custom Optimizer
    - [Hyperopt](https://hyperopt.github.io/hyperopt/)
    - [Optuna](https://optuna.org/)
- **Parallel**
  - 多机器训练



## Arch

![image](https://user-images.githubusercontent.com/2216970/132183671-21794822-2014-42f3-be9c-4685a0f422d6.png)

## Workflow

- 1. 获取随机**超参**
- 2. 把跑出来的 **metrics** 提交到 **sigopt**
- 3. 获取新的**超参**
- 4. 重复以上步骤获取最好的参数


## Parallel
- 方式
  - Threads
  - Machines (`+unique tag`)
  - Training clusters
- Pipelines
  - set `parallel_bandwidth`
  - Init workers with `EXPERIMENT_ID`
  - Optimization Loop - `Suggestions/Training/Evaluation/Observations`
