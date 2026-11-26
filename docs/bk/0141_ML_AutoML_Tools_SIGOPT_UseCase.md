-----

| Title     | ML AutoML Tools SIGOPT UseCase                        |
| --------- | ----------------------------------------------------- |
| Created @ | `2021-11-25T08:00:46Z`                                |
| Updated @ | `2026-11-26T10:11:33Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/141) |

-----

# UseCase

SigOpt 是一个超参数优化服务（后被 Intel 收购）：把训练脚本交给它，它根据每次的结果自动建议下一组超参数，属于贝叶斯优化类方法（见
[ML AutoML HPO BO](https://github.com/junxnone/aiwiki/issues/22)）。

``` mermaid
flowchart LR
    A[SigOpt 建议一组超参数] --> B[运行训练脚本]
    B --> C[上报指标]
    C --> A
```

图中：SigOpt 与训练脚本交互：建议超参数、运行训练、上报指标，循环到观测次数用完。

## Python Script

    sigopt config your_API_token

    sigopt optimize -e your_experiments.yml python your_train.py

其中：

  - `sigopt config`：保存你的 API token，用于访问服务
  - `sigopt optimize -e 实验配置 命令`：按实验配置反复运行给定的训练命令，每次由 SigOpt 注入超参数
  - `your_experiments.yml`：实验配置，典型内容（示例，具体字段以官方文档为准）：

<!-- end list -->

``` yaml
name: mnist
parameters:
  - name: learning_rate
    type: double
    bounds: {min: 0.0001, max: 0.1}
metrics:
  - name: accuracy
budget: 30
```

其中：`parameters` 是要优化的超参数及范围；`metrics` 是要优化的指标；`budget` 是总共尝试的次数。

## Jupyter Notebook

  - [mnist](https://github.com/junxnone/examples/blob/master/sigopt/mnist.ipynb)
