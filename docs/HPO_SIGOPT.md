---
Title | HPO SIGOPT
-- | --
Create Date | `2021-09-01T09:01:43Z`
Update Date | `2021-11-25T06:29:13Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/15)

---
## Reference
- [SigOpt docs](https://app.sigopt.com/docs)
- 2016 A Stratified Analysis of Bayesian Optimization Methods [[paper](https://arxiv.org/pdf/1603.09441.pdf)] [[code](https://github.com/sigopt)]
- [sigopt_experiment_and_optimization_demo.ipynb](https://colab.research.google.com/github/sigopt/sigopt-examples/blob/master/get-started/sigopt_experiment_and_optimization_demo.ipynb)
- [Intro to Multicriteria Optimization](https://sigopt.com/blog/intro-to-multicriteria-optimization/)


## Brief
- Online Tools - 跟踪/分析/微调 `AI Model`
- **超参优化步骤**
  - 1. 获取随机**超参**
  - 2. 把跑出来的 **metrics** 提交到 **sigopt**
  - 3. 获取新的**超参**
  - 4. 重复以上步骤获取最好的参数
- **参数类型支持**
  - Double Parameter - `lr/lr_drop/dropout_rate`
  - Integer Parameter - `batch_size/epochs_lr_drop/epochs`
  - Categorical Parameter - `depths/optimizer`
- Multimetric 
  - Accuracy & Inference Time
  - Precision & Recall
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




## UseCase
### Some API

API | Description
-- | --
sigopt.get_parameter() | 获取 `Suggestion` 的参数
sigopt.log_model() | 声明 Model
sigopt.log_dataset() | 声明 Dataset
sigopt.log_metadata() | 声明自定义 metadata
sigopt.log_metric() | 上传 `Observations` 结果




### notebook (colab)
- 需要注册获取连接 `Token`
- 安装 `sigopt` - `pip install sigopt`
- 使用 `Token` 连接到 `Server`
- `%load_ext sigopt` 加载插件
- `%%experiment` 设置 `experiment`
- `%%optimize My_First_Optimization` run sigopt 优化
- `sigopt.log_****` push log 到 Server

### python script code

#### API
- Connection API
- Create Experiment API
- Optimization loop get Suggestions 

#### YML

- `sigopt config` set the token
- Create yml config file `sigopt.yml`
- Get parameters API `sigopt.get_parameter('batch_size', default=xxx)`
- upload metrics `sigopt.log_metric(name='accuracy', value=metrics)`
- **Training**: `sigopt optimize train.py --sigopt-file sigopt.yml`

```yaml
name: MC Test_2
parameters:
- name: batch_size
  type: int
  bounds:
    min: 8
    max: 32
- name: lr
  bounds:
  type: double
    min: 0.00001
    max: 0.1
- name: optimizer
  type: categorical
  categorical_values: ["Adam", "SGD"]
- name: depth
  type: int
  grid: [3,5,7,9]
- name: l2_regularization
  type: double
  grid: [1e-5, 1e-3, 0.33, 0.999]
  transformation: log
metrics:
- name: accuracy
  objective: maximize
budget: 50
```

## Metrics

- 常用 Metrics
  - Accuracy
  - Precision
  - Recall
  - Inference Time


Name | Description
-- | --
name |  metrics 名字 
objective | `maximize(default)/minimize` 指定优化方向 
strategy | `optimize(default)/store/constraint` 指定是 `优化/存储/限制`
threshold | `上限/下限` 对应于 `constraint - maximize/minimize` 限制值

## Parallel
- 方式
  - Threads
  - Machines (`+unique tag`)
  - Training clusters
- Pipelines
  - set `parallel_bandwidth`
  - Init workers with `EXPERIMENT_ID`
  - Optimization Loop - `Suggestions/Training/Evaluation/Observations`
