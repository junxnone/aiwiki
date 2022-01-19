---
Title | HPO
-- | --
Create Date | `2021-09-06T09:24:08Z`
Update Date | `2022-01-19T10:51:18Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/13)

---
## Reference
- 2020 [On Hyperparameter Optimization of Machine Learning Algorithms: Theory and Practice](https://arxiv.org/pdf/2007.15745.pdf) 
- [vega - HPO Alogs](http://www.noahlab.com.hk/opensource/vega/docs/algorithms/hpo.html)

## Brief
- HPO - `Hyperparameter Optimization`
- 用于评估超参对 `metrics` 的影响, 选取出一组合适超参
- 超参类型
  - 连续超参 - `[0, 1]`
  - 离散超参 - `[0, 10, 1]`
  - 类别超参- `["SGD", "Adam"]`
  - 条件超参
- 单目标超参数优化算法
- 多目标超参数优化算法 


### 按方式分类

分类 | 举例
-- | --
`Exhaustive search` -  穷举 | `Random Search`/`Grid Search`/`Batch`
`Heuristic search` - 启发式 | `Naïve Evolution`/`Anneal `/`Hyperband `/`PBT`/
`Bayesian Optimization` - 贝叶斯优化 | `BO`/`SMBO`/`BOHB`/`BOSS`/`TPE`/`SMAC`/`Metis Tuner`/`GP Tuner`
`RL Based` - 强化学习 | `PPO Tuner`
`Dynamic Resource Allocation` - 动态资源分配 |

### 常用方法

Name | Time Complexity | 局限 | 优点
-- | -- | -- | --
[Grid Search](/Grid_Search) | O(n<sup>k</sup>) | 时间消耗多 | 简单
[Random Search](/Random_Search) | O(n) | 相比 GS 有效
Gradient-based models | O(n<sup>k</sup>) | 只支持连续超参
BO-GP | O(n<sup>3</sup>)
SMAC | O(nlogn) | 并行化能力较差 | 对所有类型超参有效
TPE | O(nlogn) | 并行化能力较差 | 对所有类型超参有效
Hyperband | O(nlogn)
BOHB | O(nlogn) | 对所有类型超参有效
GA | O(n<sup>2</sup>) | 并行化能力较差 | 对所有类型超参有效
PSO | O(nlogn) | 对所有类型超参有效


## Tools
- [SIGOPT](/HPO_SIGOPT)
- [AutoML NNI](/AutoML_NNI)


