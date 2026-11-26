-----

| Title     | ML AutoML Tools                                       |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-06-17T16:50:45Z`                                |
| Updated @ | `2026-11-26T10:15:15Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/427) |

-----

# AutoML Tools

  - AutoML
  - HPO
  - ...

AutoML 工具把「特征工程、模型选择、超参数优化、结构搜索」自动化。

## 常用工具

| 工具     | 功能                | 文章                                                       |
| ------ | ----------------- | -------------------------------------------------------- |
| NNI    | 特征工程、HPO、NAS、模型压缩 | [NNI](https://github.com/junxnone/aiwiki/issues/16)      |
| SigOpt | 贝叶斯优化类的超参数服务      | [UseCase](https://github.com/junxnone/aiwiki/issues/141) |
| Optuna | 超参数优化库            | [Optuna](https://github.com/junxnone/aiwiki/issues/486)  |

## 超参数优化方法

| 方法    | 文章                                                                                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 网格搜索  | [Grid Search](https://github.com/junxnone/aiwiki/issues/205)                                                                                                  |
| 随机搜索  | [Random Search](https://github.com/junxnone/aiwiki/issues/204)                                                                                                |
| 贝叶斯优化 | [BO](https://github.com/junxnone/aiwiki/issues/22)、[SMAC](https://github.com/junxnone/aiwiki/issues/220)、[TPE](https://github.com/junxnone/aiwiki/issues/221) |
| 结构搜索  | [Search Space](https://github.com/junxnone/aiwiki/issues/392)、[NAS Metrics](https://github.com/junxnone/aiwiki/issues/394)                                    |

表中：对比结论：先用随机搜索得到基线，训练代价高时再用贝叶斯优化类工具；概念见
[Hyperparameter](https://github.com/junxnone/aiwiki/issues/368)。
