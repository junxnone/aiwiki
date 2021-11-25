---
Title | HPO SIGOPT Options
-- | --
Create Date | `2021-11-25T08:03:12Z`
Update Date | `2021-11-25T08:03:12Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/142)

---
## Experiment Options

### Parameters

- Double Parameter - `lr/lr_drop/dropout_rate`
- Integer Parameter - `batch_size/epochs_lr_drop/epochs`
- Categorical Parameter - `depths/optimizer`### Optimization


### Metrics

Name | Description
-- | --
`name` |  metrics 名字 
`objective` | 指定优化方向 `maximize(default)/minimize` 
`strategy` | 指定是 `优化/存储/限制` - `optimize(default)/store/constraint` 
`threshold` | `上限/下限` 对应于 `constraint - maximize/minimize` 限制值

- **常用 Metrics**
  - Accuracy
  - Precision
  - Recall
  - Inference Time


### yml define

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



## API

API | Description
-- | --
`sigopt.params.your_params` | 获取 `Suggestion` 的参数
`sigopt.log_model()` | 声明 Model
sigopt.log_dataset() | 声明 Dataset
sigopt.log_metadata() | 声明自定义 metadata
sigopt.log_metric("your_metrics", metrics) | 上传 `Observations` 结果



## Notebook


- 需要注册获取连接 `Token`
- 安装 `sigopt` - `pip install sigopt`
- 使用 `Token` 连接到 `Server`
- `%load_ext sigopt` 加载插件
- `%%experiment` 设置 `experiment`
- `%%optimize My_First_Optimization` run sigopt 优化
- `sigopt.log_****` push log 到 Server


