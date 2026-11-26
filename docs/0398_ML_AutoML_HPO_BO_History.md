---
Title | ML AutoML HPO BO History
-- | --
Created @ | `2021-03-22T06:02:13Z`
Updated @| `2026-11-26T10:21:02Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/398)

---
# Bayesian Optimization History

贝叶斯优化相关论文的时间线。基础原理见 [ML AutoML HPO BO](https://github.com/junxnone/aiwiki/issues/22)，SMAC 详见 [SMAC](https://github.com/junxnone/aiwiki/issues/220)。

**Pattern**
```
- 2020-05 **[Name]** paper_full_name [[Paper](paperlink)] [[Code](codelink)] [[Note](notelink)] #tags
```

- 2011 **[SMAC]** Sequential Model-Based Optimization for General Algorithm Configuration[[Paper](https://www.cs.ubc.ca/~hutter/papers/10-TR-SMAC.pdf)] [[Code](codelink)] [[Note](notelink)] #tags
- 2015 **[Name]** Taking the Human Out of the Loop: A Review of Bayesian Optimization[[Paper](http://www.cs.ox.ac.uk/people/nando.defreitas/publications/BayesOptLoop.pdf)] [[Code](codelink)] [[Note](notelink)] #tags
- 2018 **[BOHB]** BOHB: Robust and Efficient Hyperparameter Optimization at Scale[[Paper](https://arxiv.org/abs/1807.01774)] [[Code](codelink)] [[Note](notelink)] #tags

## Survey

- 2018 **[Name]** A Tutorial on Bayesian Optimization[[Paper](https://arxiv.org/abs/1807.02811)] [[Code](codelink)] [[Note](notelink)] #tags

## 简介

| 论文 | 贡献 |
| --- | --- |
| SMAC（2011） | 用随机森林作代理模型，支持离散和条件参数 |
| Taking the Human Out of the Loop（2015） | 贝叶斯优化的综述 |
| BOHB（2018） | 结合贝叶斯优化与 Hyperband 的多保真度方法，在大规模场景下更高效 |
| A Tutorial on Bayesian Optimization（2018） | 教程性综述 |

表中：

- **多保真度**：先用便宜的低精度评估（如少量 epoch）筛掉差配置，再对好配置做完整评估
- 对比结论：从 SMAC 到 BOHB，趋势是让贝叶斯优化更适应大规模、昂贵的训练

