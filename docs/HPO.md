---
Title | HPO
-- | --
Create Date | `2021-09-06T09:24:08Z`
Update Date | `2021-09-06T09:41:35Z`
---
# Reference
- 2020 [On Hyperparameter Optimization of Machine Learning Algorithms: Theory and Practice](https://arxiv.org/pdf/2007.15745.pdf) 
- [vega - HPO Alogs](http://www.noahlab.com.hk/opensource/vega/docs/algorithms/hpo.html)

# Brief

分类 | 举例
-- | --
`Exhaustive search` -  穷举 | `Random Search`/`Grid Search`/`Batch`
`Heuristic search` - 启发式 | `Naïve Evolution`/`Anneal `/`Hyperband `/`PBT`/
`Bayesian Optimization` - 贝叶斯优化 | `BO`/`SMBO`/`BOHB`/`BOSS`/`TPE`/`SMAC`/`Metis Tuner`/`GP Tuner`
`RL Based` - 强化学习 | `PPO Tuner`
`Dynamic Resource Allocation` - 动态资源分配 |

## 常用方法

Name | Time Complexity | Description
-- | -- | --
GS | O(n<sup>k</sup>) | 时间消耗多
RS | O(n) | 
Gradient-based models | O(n<sup>k</sup>) | 只支持连续超参
BO-GP | O(n<sup>3</sup>)
SMAC | O(nlogn) | 并行化能力较差
TPE | O(nlogn) | 并行化能力较差
Hyperband | O(nlogn)
BOHB | O(nlogn)
GA | O(n<sup>2</sup>) | 并行化能力较差
PSO | O(nlogn)
