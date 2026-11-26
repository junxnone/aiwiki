---
Title | ML AutoML HPO BO SMAC
-- | --
Created @ | `2021-03-30T07:39:41Z`
Updated @| `2026-11-26T09:28:19Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/220)

---
# SMAC

- SMAC - Sequential Model-based Algorithm Configuration
- 代理模型 - 随机森林/Random Forest
- 采集函数 - `Expected Improvement`/`Thompson Sampling`
- 解决高斯回归过程中参数类型不能为离散的问题
- 探索能力强
- ROAR - Randomized Online Aggressive Racing 

SMAC 是一种贝叶斯优化方法，用**随机森林**代替高斯过程做代理模型，因此天然支持离散、类别和条件超参数。基础概念见 [ML AutoML HPO BO](https://github.com/junxnone/aiwiki/issues/22)。

## 流程

```mermaid
flowchart LR
    I[初始配置] --> E[运行并记录性能]
    E --> M[用随机森林拟合 配置 到 性能]
    M --> A[用采集函数选出下一批候选配置]
    A --> R[与当前最优做对比 选出要评估的配置]
    R --> E
```

图中：

- 先评估若干初始配置，得到（配置，性能）数据
- 用随机森林拟合这些数据，预测任意配置的性能均值和不确定性
- 采集函数在「预测好」（利用）和「不确定」（探索）之间权衡，挑选下一批候选
- 新配置与现有最优配置在更多实例上竞赛比较，再把结果加入数据，循环

## 代理模型：随机森林

森林中 $T$ 棵树对配置 $x$ 的预测给出均值与方差：

$$
\mu(x)=\frac{1}{T}\sum_{t=1}^{T}f_t(x),\qquad \sigma^2(x)=\frac{1}{T}\sum_{t=1}^{T}\big(f_t(x)-\mu(x)\big)^2
$$

其中：

- $f_t(x)$：第 $t$ 棵树对配置 $x$ 的预测性能；$T$：树的数量
- $\mu(x)$：预测均值；$\sigma^2(x)$：预测的方差，代表模型对该处的不确定性

## 采集函数：Expected Improvement

$$
\mathrm{EI}(x)=\mathbb{E}\big[\max(f_{min}-f(x),\,0)\big]=(f_{min}-\mu)\,\Phi(Z)+\sigma\,\phi(Z),\qquad Z=\frac{f_{min}-\mu}{\sigma}
$$

其中：

- $f_{min}$：目前观测到的最好（最小）性能值，这里以最小化为例；$f(x)$：配置 $x$ 的真实性能
- $\mu,\sigma$：代理模型在 $x$ 处的预测均值和标准差
- $\Phi$、$\phi$：标准正态分布的累积分布函数和概率密度函数
- EI 大表示「预期比当前最优提升多」：$\mu$ 低（利用）或 $\sigma$ 大（探索）都会使 EI 变大

## 与高斯过程贝叶斯优化对比

| 对比项 | 高斯过程 BO | SMAC（随机森林） |
| --- | --- | --- |
| 超参数类型 | 连续为主，离散需处理 | 连续、离散、类别、条件参数都支持 |
| 维度 | 高维困难 | 较高维也可用 |
| 不确定性估计 | 解析 | 由森林方差估计 |
| 小数据 | 效果好 | 略逊 |

表中：对比结论：搜索空间含离散或条件超参数（如「选 SVM 才有核函数参数」）时，SMAC 更合适。

## ROAR

ROAR（Randomized Online Aggressive Racing）是 SMAC 的随机基线：不使用代理模型，随机采样配置，并与当前最优在线竞赛，用来对比验证模型是否真的有帮助。

## Reference
- 2011 [Sequential Model-Based Optimization for General Algorithm Configuration](https://www.cs.ubc.ca/~hutter/papers/10-TR-SMAC.pdf)
- [SMAC3](https://github.com/automl/SMAC3)

