-----

| Title     | x Optuna                                              |
| --------- | ----------------------------------------------------- |
| Created @ | `2024-10-16T08:36:29Z`                                |
| Updated @ | `2024-10-17T02:35:21Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/486) |

-----

# Optuna

  - 超参数优化
  - optuna-dashboard 可以读取存储的数据用来显示
      - 支持 web/vscode/jupyter
  - 优化停止机制
  - Trail 早停机制
  - 超参采样器

## Samplers

  - 用于在超参数搜索空间中生成参数值的建议。

| 采样器名称                                                                 | 工作原理                           | 优势                            | 劣势                      | 适用场景                     |
| --------------------------------------------------------------------- | ------------------------------ | ----------------------------- | ----------------------- | ------------------------ |
| RandomSampler（随机采样器）                                                  | 完全随机生成参数值                      | 简单直接，可用于快速探索大搜索空间，无先验知识时可作为基准 | 缺乏引导性，找到较优解可能需要大量试验     | 对搜索空间毫无头绪时进行初步探索，或作为简单对照 |
| GridSampler（网格采样器）                                                    | 按照预设的网格遍历所有可能的参数组合             | 确保全面覆盖搜索空间，对于小参数空间能进行彻底探索     | 在高维度或大规模搜索空间中效率极低，计算成本高 | 参数空间小且能明确划分的情况           |
| TPESampler（Tree-structured Parzen Estimator Sampler）                  | 基于历史试验构建概率模型，划分搜索空间并在有希望区域密集采样 | 对复杂搜索空间适应性强，高维度情况表现良好，有一定引导性  | 对于简单搜索空间可能相对复杂          | 复杂搜索空间，尤其是高维度问题          |
| CmaEsSampler（Covariance Matrix Adaptation Evolution Strategy Sampler） | 利用协方差矩阵调整搜索方向和步长，基于进化策略算法      | 在连续参数空间且复杂非线性关系问题中可能有较好表现     | 计算资源需求大，时间复杂度高          | 连续参数空间的复杂优化问题            |
| NSGAIISampler（多目标优化的带精英策略非支配排序遗传算法采样器）                                | 基于遗传算法进行多目标优化                  | 适用于多目标优化场景，能找到一组非支配解          | 单目标优化时可能不如专门的单目标采样器高效   | 多目标优化问题                  |
| QMCSampler（Quasi-Monte Carlo Sampler）                                 | 使用准蒙特卡罗方法进行采样                  | 能更均匀地覆盖搜索空间，适合需要均匀采样的场景       | 可能在某些情况下不如其他采样器快速找到最优解  | 对搜索空间均匀性要求高的场景           |
| GPSampler                                                             | 具体原理因实现而异，可能有特定优化策略            | 在特定场景下可能有较好表现                 | 适用范围相对较窄                | 特定优化问题                   |
| BoTorchSampler                                                        | 可能结合了 BoTorch 库的特定优化策略         | 对于特定问题可能提供更高效的采样              | 适用场景较为局限                | 与 BoTorch 库相关的特定优化场景     |
| BruteForceSampler（暴力搜索采样器）                                            | 通过暴力搜索遍历所有可能的参数组合              | 理论上能确保找到全局最优解（如果计算资源允许）       | 计算资源消耗巨大，仅适用于极小的参数空间    | 参数空间非常小且必须确保完全覆盖的情况      |

| 特性          | RandomSampler | GridSampler | TPESampler    | CmaEsSampler    | NSGAIISampler  | QMCSampler | GPSampler | BoTorchSampler | BruteForceSampler |
| ----------- | ------------- | ----------- | ------------- | --------------- | -------------- | ---------- | --------- | -------------- | ----------------- |
| 浮点数参数       | ✓             | ✓           | ✓             | ✓               | ▴              | ✓          | ✓         | ✓              | ✓                 |
| 整数参数        | ✓             | ✓           | ✓             | ✓               | ▴              | ✓          | ✓         | ▴              | ✓                 |
| 分类参数        | ✓             | ✓           | ✓             | ▴               | ✓              | ▴          | ✓         | ▴              | ✓                 |
| 剪枝          | ✓             | ✓           | ✓             | ▴               | ×              | ✓          | ▴         | ▴              | ✓                 |
| 多变量优化       | ▴             | ▴           | ✓             | ✓               | ▴              | ▴          | ✓         | ✓              | ▴                 |
| 条件搜索空间      | ✓             | ▴           | ✓             | ▴               | ▴              | ▴          | ▴         | ▴              | ✓                 |
| 多目标优化       | ✓             | ✓           | ✓             | ×               | ✓（单目标为▴）       | ✓          | ×         | ✓              | ✓                 |
| 批量优化        | ✓             | ✓           | ✓             | ✓               | ✓              | ✓          | ▴         | ✓              | ✓                 |
| 分布式优化       | ✓             | ✓           | ✓             | ✓               | ✓              | ✓          | ▴         | ✓              | ✓                 |
| 约束优化        | ×             | ×           | ✓             | ×               | ✓              | ×          | ×         | ×              | ×                 |
| 时间复杂度（每次试验） | 𝑂(𝑑)          | 𝑂(𝑑𝑛)       | 𝑂(𝑑𝑛 log⁡𝑛)   | 𝑂(𝑑³)           | 𝑂(𝑚𝑝²)         | 𝑂(𝑑𝑛)      | 𝑂(𝑛³)     | 𝑂(𝑛³)          | 𝑂(𝑑)              |
| 推荐试验次数      | 按需灵活设置        | 取决于参数组合数    | 100 - 1000 左右 | 1000 - 10000 左右 | 100 - 10000 左右 | 按需灵活设置     | \-500     | 10 - 100 左右    | 取决于参数组合数          |

> ✓ : Supports this feature. ▴: Works, but inefficiently. × : Causes an
> error, or has no interface.

## Pruner

  - 用于提前停止没有希望的试验，以节省计算资源和时间。

| 剪枝器名称                   | 工作原理                                                   | 适用场景                              |
| ----------------------- | ------------------------------------------------------ | --------------------------------- |
| MedianPruner            | 通过比较试验的中间结果与已完成试验的中间结果的中位数来决定是否提前停止试验。                 | 适用于大多数优化问题，目标函数波动不大，希望较快找到较好解决方案。 |
| NopPruner               | 不进行任何剪枝操作，所有试验都会一直运行到完成。                               | 不确定是否需要剪枝或想对所有试验进行完整运行以进行分析。      |
| SuccessiveHalvingPruner | 基于 Successive Halving 算法逐步减少正在运行的试验数量，将资源集中在表现较好的试验上。  | 大规模超参数搜索问题，计算资源有限需快速找到较好解决方案。     |
| HyperbandPruner         | 结合 Successive Halving 算法和随机搜索思想，在不同资源级别上进行试验并动态调整资源分配。 | 复杂优化问题和大规模超参数搜索，能在较短时间内找到高质量解决方案。 |
| ThresholdPruner         | 根据用户设定的阈值来进行剪枝，若试验中间结果超过阈值则停止试验。                       | 对目标函数有先验知识，知道合理阈值时使用。             |

## Terminator

  - 自动终止优化过程模块, 当估计的潜在改进小于统计误差时，终止优化过程。
  - 包括终止回调类和用于评估优化改进空间及目标函数统计误差的评估器。

| 类名                                | 描述                  | 初始化参数                                                                                                                    | 方法                                                    |
| --------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| BaseTerminator                    | 终止器的基类              | 无                                                                                                                        | should\_terminate(study)                              |
| Terminator                        | Optuna研究的自动停止机制     | improvement\_evaluator（默认为RegretBoundEvaluator）、error\_evaluator（默认为CrossValidationErrorEvaluator）、min\_n\_trials（默认为20） | should\_terminate(study)                              |
| BaseImprovementEvaluator          | 改进评估器的基类            | 无                                                                                                                        | evaluate(trials, study\_direction)                    |
| RegretBoundEvaluator              | 对遗憾上界进行评估的误差评估器     | top\_trials\_ratio（默认为0.5）、min\_n\_trials（默认为20）等                                                                        | evaluate(trials, study\_direction)                    |
| BestValueStagnationEvaluator      | 评估优化过程中最佳值的停滞期      | max\_stagnation\_trials（默认为30）                                                                                           | evaluate(trials, study\_direction)                    |
| EMMREvaluator                     | 评估预期最小模型遗憾（EMMR）    | deterministic\_objective（默认为False）、delta（默为0.1）等                                                                         | evaluate(trials, study\_direction)                    |
| BaseErrorEvaluator                | 误差评估器的基类            | 无                                                                                                                        | evaluate(trials, study\_direction)                    |
| CrossValidationErrorEvaluator     | 基于交叉验证评估目标函数的统计误差   | 无                                                                                                                        | evaluate(trials, study\_direction)，返回一个浮点数表示目标函数的统计误差 |
| StaticErrorEvaluator              | 总是返回一个常量值的误差评估器     | constant（用户指定的常量值）                                                                                                       | evaluate(trials, study\_direction)                    |
| MedianErrorEvaluator              | 返回与初始中位数之比的误差评估器    | paired\_improvement\_evaluator、warm\_up\_trials（默认为10）、n\_initial\_trials（默为20）、threshold\_ratio（默为0.01）                 | evaluate(trials, study\_direction)                    |
| TerminatorCallback                | 使用Terminator终止优化的回调 | terminator（默认为带有默认improvement\_evaluator和error\_evaluator的Terminator对象）                                                  | 无（用于与optimize()方法配合）                                  |
| report\_cross\_validation\_scores | 报告试验交叉验证分数的函数       | trial、scores                                                                                                             | 无（在目标函数内调用，用于提供数据给评估器判断是否终止）                          |

## Reference

  - [optuna](https://optuna.org/)
  - [optuna docs](https://optuna.readthedocs.io/)
