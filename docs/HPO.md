---
Title | HPO
-- | --
Create Date | `2021-09-06T09:24:08Z`
Update Date | `2021-09-06T09:37:11Z`
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

Name | Time Complexity | 
-- | --
GS | O(n<sup>k</sup>)
RS | O(n)
Gradient-based models | O(n<sup>k</sup>)
BO-GP | O(n<sup>3</sup>)
SMAC | O(nlogn)
TPE | O(nlogn)
Hyperband | O(nlogn)
BOHB | O(nlogn)
GA | O(n<sup>2</sup>)
PSO | O(nlogn)
