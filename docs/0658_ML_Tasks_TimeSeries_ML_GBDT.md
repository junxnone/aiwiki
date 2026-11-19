---
Title | ML Tasks TimeSeries ML GBDT
-- | --
Created @ | `2026-11-19T03:24:03Z`
Updated @| `2026-11-19T03:24:03Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/658)

---
# GBDT

GBDT（Gradient Boosted Decision Trees，梯度提升决策树，论文脚注称 gradient tree boosting 也叫 GBM 或 GBRT）是用一棵棵小回归树逐步叠加来拟合目标的方法：每加一棵树，就去修正前面所有树还没拟合好的部分。本文以 XGBoost（Chen & Guestrin，*XGBoost: A Scalable Tree Boosting System*，[arXiv:1603.02754](https://arxiv.org/abs/1603.02754)，论文版权页注明 KDD '16）为依据讲算法原理，再讲它如何用于时序预测。

一句话概括：把时序预测改写成"滞后特征表 + 回归"问题，用加法树模型逐棵拟合（损失的二阶近似），靠正则化与高效的分裂搜索得到一个快、稳、对协变量友好的强基线。

**论文边界（先说清楚）**：XGBoost 论文是通用的树提升**系统**论文，实验只有分类（Allstate、Higgs）、排序（Yahoo LTRC）和点击率预测（Criteo），**没有任何时序预测实验**，也没有讨论滞后特征、多步策略或外推问题。本文"用于时序预测"一章的做法全部来自实践经验，标 [经验]，口径与本站综述 [时间序列：机器学习方法](/0605_ML_Tasks_TimeSeries_ML) §3.1 一致。LightGBM、M5 比赛不在这篇论文里，本文只提名字，标 [待核实]。

时间线上的位置：XGBoost 论文发表于 2016 年；此后 XGBoost、LightGBM 等梯度提升树成为带特征工程的预测基线 [经验]，在 M5 等比赛中的表现 [待核实]。论文自己能支撑的只有：2015 年 Kaggle 博客公布的 29 个获胜方案中 17 个用了 XGBoost（脚注说明来自各比赛前 3 名团队的方案），且论文列举的问题示例里包含 store sales prediction。

## 1. 解决什么问题

### 1.1 论文的动机

论文引言说树提升在许多应用中表现突出，既可单独作预测器，也被用于广告点击率预测的生产管线。论文认为 XGBoost 成功的最重要因素是**可扩展性**：单机上比当时流行的方案快十倍以上，在分布式或内存受限场景可扩展到数十亿样本。论文列出的贡献：

- 一个高度可扩展的端到端树提升系统；
- 有理论保证的加权分位数草图（weighted quantile sketch），用于近似分裂的候选点；
- 稀疏感知（sparsity-aware）的并行树学习算法；
- 面向 out-of-core 学习的 cache-aware 块结构。

此外论文还提出了一个正则化的目标函数（作者称是"为完整起见"附带的改进）。

### 1.2 为什么时序预测会用它 [经验]

- 时序预测一旦写成"一行 = 一个预测时刻的特征向量（滞后值、滚动统计、日历、协变量）"，就是标准的表格回归问题，GBDT 是表格问题上最先该跑的强基线；
- 业务预测常有大量类别/稀疏特征（商品、门店、促销、节假日 one-hot），XGBoost 的稀疏感知与缺失值处理正好对口；
- 全局模型：成千上万条序列合并成一张大表训练一个模型，短序列和冷启动序列可借用跨序列共性，这正是 GBDT 擅长的数据规模。

## 2. 核心算法（均来自论文 §2、§3）

### 2.1 加法树模型与正则化目标

给定 $n$ 个样本、$m$ 个特征的数据集 $\mathcal D=\{(\mathbf x_i,y_i)\}$，用 $K$ 棵回归树（CART）相加预测：

$$\hat y_i=\phi(\mathbf x_i)=\sum_{k=1}^{K}f_k(\mathbf x_i),\qquad f_k\in\mathcal F$$

$\mathcal F=\{f(\mathbf x)=w_{q(\mathbf x)}\}$（$q:\mathbb R^m\to\{1,\dots,T\}$，$w\in\mathbb R^T$）：$q$ 是树结构，把样本映射到叶子编号，$T$ 是叶子数，$w_j$ 是第 $j$ 个叶子上的连续得分。与普通决策树不同，每个叶子带的是连续分数，最终预测是样本所落叶子分数之和。

学习的是下面的正则化目标：

$$\mathcal L(\phi)=\sum_i l(\hat y_i,y_i)+\sum_k\Omega(f_k),\qquad \Omega(f)=\gamma T+\frac12\lambda\lVert w\rVert^2$$

$l$ 是可微的凸损失；$\Omega$ 惩罚叶子数 $T$ 与叶权重的平方范数。论文指出：正则项让最终学到的权重更平滑以避免过拟合；$\lambda$ 取 0 时退化为传统的梯度树提升；该目标比 RGF（regularized greedy forest）更简单、更易并行。

### 2.2 逐棵加树与二阶近似

目标里的"参数"是函数，不能在欧氏空间里直接优化，于是以加法方式训练：记 $\hat y_i^{(t-1)}$ 为前 $t-1$ 轮的预测，第 $t$ 轮贪心地加一棵 $f_t$：

$$\mathcal L^{(t)}=\sum_{i=1}^{n}l\bigl(y_i,\hat y_i^{(t-1)}+f_t(\mathbf x_i)\bigr)+\Omega(f_t)$$

对 $l$ 做二阶泰勒展开：

$$\mathcal L^{(t)}\simeq\sum_{i=1}^{n}\Bigl[l\bigl(y_i,\hat y^{(t-1)}\bigr)+g_if_t(\mathbf x_i)+\frac12h_if_t^2(\mathbf x_i)\Bigr]+\Omega(f_t)$$

其中 $g_i=\partial_{\hat y^{(t-1)}}\,l\bigl(y_i,\hat y^{(t-1)}\bigr)$、$h_i=\partial^2_{\hat y^{(t-1)}}\,l\bigl(y_i,\hat y^{(t-1)}\bigr)$ 是一阶、二阶梯度统计量。去掉常数项，第 $t$ 步的简化目标为：

$$\tilde{\mathcal L}^{(t)}=\sum_{i=1}^{n}\Bigl[g_if_t(\mathbf x_i)+\frac12h_if_t^2(\mathbf x_i)\Bigr]+\Omega(f_t)$$

记叶子 $j$ 上的样本集合 $I_j=\{i\mid q(\mathbf x_i)=j\}$，展开 $\Omega$ 后按叶子重组：

$$\tilde{\mathcal L}^{(t)}=\sum_{j=1}^{T}\Bigl[\Bigl(\sum_{i\in I_j}g_i\Bigr)w_j+\frac12\Bigl(\sum_{i\in I_j}h_i+\lambda\Bigr)w_j^2\Bigr]+\gamma T$$

这是关于每个 $w_j$ 的一元二次函数。固定树结构 $q$，最优叶权重与对应的最优目标值为：

$$w_j^{*}=-\frac{\sum_{i\in I_j}g_i}{\sum_{i\in I_j}h_i+\lambda}$$

$$\tilde{\mathcal L}^{(t)}(q)=-\frac12\sum_{j=1}^{T}\frac{\bigl(\sum_{i\in I_j}g_i\bigr)^2}{\sum_{i\in I_j}h_i+\lambda}+\gamma T$$

后者可当作树结构的打分函数，作用类似决策树的不纯度，但适用于更广的目标函数（得分越小越好）。

### 2.3 分裂增益

不可能枚举所有树结构，实际用贪心：从单个叶子出发迭代地加分支。设某节点样本集 $I=I_L\cup I_R$ 被分成左右两部分，损失下降量（论文 Eq. 7，实践中用来评估候选分裂）为：

$$\mathcal L_{split}=\frac12\left[\frac{\bigl(\sum_{i\in I_L}g_i\bigr)^2}{\sum_{i\in I_L}h_i+\lambda}+\frac{\bigl(\sum_{i\in I_R}g_i\bigr)^2}{\sum_{i\in I_R}h_i+\lambda}-\frac{\bigl(\sum_{i\in I}g_i\bigr)^2}{\sum_{i\in I}h_i+\lambda}\right]-\gamma$$

最后的 $-\gamma$ 是新增一个叶子的复杂度代价：增益不足 $\gamma$ 的分裂不值得做。

**自拟示意算例（非论文数字，已手算）**：取 $l=\frac12(y-\hat y)^2$，则 $g_i=\hat y_i-y_i$、$h_i=1$。初始 $\hat y=0$，四个样本 $y=(2,3,8,9)$，故 $g=(-2,-3,-8,-9)$，$h=(1,1,1,1)$；取 $\lambda=1,\gamma=0$。

- 分裂 A：$\{2,3\}\mid\{8,9\}$：$G_L=-5,H_L=2$；$G_R=-17,H_R=2$；$G=-22,H=4$。增益 $=\frac12\bigl[\frac{25}{3}+\frac{289}{3}-\frac{484}{5}\bigr]=\frac12\times7.8667\approx3.93$。叶权重 $w_L=5/3\approx1.67$，$w_R=17/3\approx5.67$。
- 分裂 B：$\{2\}\mid\{3,8,9\}$：$G_L=-2,H_L=1$；$G_R=-20,H_R=3$。增益 $=\frac12\bigl[\frac{4}{2}+\frac{400}{4}-\frac{484}{5}\bigr]=\frac12\times5.2=2.6$。

A 的增益更大，被选中。注意 $w^*$ 比"叶内均值"（2.5 与 8.5）小，这是 $\lambda$ 把叶权重向 0 收缩的效果。

### 2.4 Shrinkage 与列采样

论文用了两个额外的防过拟合手段：

- **Shrinkage**（Friedman 提出）：每步提升后把新加的权重乘一个因子 $\eta$，类似学习率，降低单棵树的影响，给后续的树留出改进空间。
- **列（特征）子采样**：借自 RandomForest；论文称据用户反馈，列采样比传统的行采样更能防过拟合（行采样也支持），并能加速后文的并行算法。

### 2.5 分裂搜索算法

找最佳分裂是树学习的关键开销。论文给出三层：

**精确贪心（Alg. 1）**：对每个特征，按取值排序后线性扫描，累计 $G_L,H_L$，用 $G_R=G-G_L,\ H_R=H-H_L$ 算每个候选点的得分，取最大。单机支持，但数据放不进内存或分布式时不可行。

**近似算法（Alg. 2）**：按特征分布的百分位提出候选分裂点 $S_k=\{s_{k1},\dots,s_{kl}\}$，把连续特征映射进桶，聚合桶内的 $G,H$，只在候选点中找最优。有两种变体：全局（global，建树之初一次性提出候选，所有层共用，所需候选更多）与局部（local，每次分裂后重新提出，更适合更深的树）。论文在 Higgs 10M 上的 Fig. 3 中报告：局部提案所需候选更少，全局提案在候选足够多时可以和局部一样准；分位数策略在合理的近似程度下能达到与精确贪心相同的精度。

**加权分位数草图（§3.3）**：候选点不是按样本个数取分位，而是按二阶梯度 $h_i$ 加权。理由是把 $\tilde{\mathcal L}^{(t)}$ 改写后得到

$$\sum_{i=1}^{n}\frac12h_i\Bigl(f_t(\mathbf x_i)-\frac{g_i}{h_i}\Bigr)^2+\Omega(f_t)+\text{constant}$$

即标签为 $g_i/h_i$、权重为 $h_i$ 的加权平方损失，所以 $h_i$ 就是样本权重。对第 $k$ 个特征，令多重集 $\mathcal D_k=\{(x_{1k},h_1),\dots,(x_{nk},h_n)\}$，定义秩函数

$$r_k(z)=\frac{1}{\sum_{(x,h)\in\mathcal D_k}h}\sum_{(x,h)\in\mathcal D_k,\ x<z}h$$

它表示特征值小于 $z$ 的样本所占的（加权）比例。候选点 $\{s_{k1},\dots,s_{kl}\}$ 要满足

$$\lvert r_k(s_{k,j})-r_k(s_{k,j+1})\rvert<\epsilon,\qquad s_{k1}=\min_i x_{ik},\quad s_{kl}=\max_i x_{ik}$$

$\epsilon$ 是近似因子，大致对应 $1/\epsilon$ 个候选点。论文称当时没有适用于加权数据的分位数草图，它提出的结构支持 merge 与 prune 操作并给出可证明的精度保证（细节与证明在论文附录，本文不展开）。

**稀疏感知分裂（§3.4, Alg. 3）**：输入稀疏有三类原因：缺失值、统计量里大量零、one-hot 之类特征工程的产物。做法是给每个树节点加一个**默认方向**：特征值缺失时样本走默认方向；对每个分裂，分别枚举"缺失值全走右"和"缺失值全走左"两种情形，取增益最大者，因此最优默认方向是从数据里学出来的。关键是只遍历非缺失项，复杂度与非缺失项个数成线性。论文在 Allstate-10K 上报告稀疏感知算法比朴素实现快 50 倍以上（Fig. 5）。

```
树节点（示意，对应论文 Fig. 4；分裂条件：age < 20）
   ├─ 是 ──→ ...
   ├─ 否 ──→ ...
   └─ 特征缺失 ──→ 走训练中学到的默认方向（左或右）
```

## 3. 系统设计（论文 §4）

论文把算法和系统一起优化。要点：

**列块（column block）**：排序是树学习中最耗时的部分，所以数据以块为单位按 CSC 格式存放，每列按特征值预排序，只在训练前算一次、后续迭代复用。精确贪心把整个数据集放进一个块，对块做一次线性扫描就能同时收集所有叶子上的候选分裂统计量；近似算法可使用多个块（每块对应一部分行），块可分布到不同机器或放在磁盘上。块结构也便于列采样。复杂度分析（$d$ 为树的最大深度，$K$ 为树数，$\lVert\mathbf x\rVert_0$ 为训练数据中非缺失项个数）：

$$O\bigl(Kd\lVert\mathbf x\rVert_0\log n\bigr)\ \longrightarrow\ O\bigl(Kd\lVert\mathbf x\rVert_0+\lVert\mathbf x\rVert_0\log n\bigr)$$

即精确贪心中省掉每棵树内的 $\log n$ 因子（预处理一次性摊销）；近似算法从 $O(Kd\lVert\mathbf x\rVert_0\log q)$ 降到 $O(Kd\lVert\mathbf x\rVert_0+\lVert\mathbf x\rVert_0\log B)$，$q$ 为候选点数（通常 32 到 100），$B$ 为每块最大行数。

**Cache-aware 访问**：按特征顺序扫描时，需要按行索引间接读取梯度统计量，是非连续内存访问，统计量放不进 CPU cache 时会因 cache miss 变慢。精确贪心用预取（每线程一个内部缓冲，先取后累加）缓解，论文称数据集大时快一倍（Fig. 7，10M 规模）；近似算法通过选合适的块大小解决，论文实验得出每块 $2^{16}$ 个样本较均衡：块太小并行效率低，块太大会 cache miss（Fig. 9）。

**Out-of-core**：数据分块存盘，用独立线程预取到内存缓冲。两项技术：块压缩（按列压缩、读入时由独立线程解压，行索引用 16 位偏移存储，因此每块 $2^{16}$ 个样本，多数数据集上压缩率约 26% 到 29%）与块分片（把数据交替分到多块磁盘，每块盘一个预取线程）。

## 4. 实验与结论（论文自己的数字）

通用设置：最大深度 8、shrinkage 0.1、除非另说不做列采样。单机实验在 Dell PowerEdge R420（两颗八核 Xeon E5-2470、64GB 内存）上。

数据集（论文 Table 2）：

数据集 | $n$ | $m$ | 任务
-- | -- | -- | --
Allstate | 10 M | 4227 | 保险理赔分类
Higgs Boson | 10 M | 28 | 事件分类
Yahoo LTRC | 473K | 700 | 排序
Criteo | 1.7 B | 67 | 点击率预测

**分类（Higgs-1M，500 棵树，精确贪心，论文 Table 3）**：

方法 | 每棵树耗时（秒） | Test AUC
-- | -- | --
XGBoost | 0.6841 | 0.8304
XGBoost（colsample=0.5） | 0.6401 | 0.8245
scikit-learn | 28.51 | 0.8302
R.gbm | 1.032 | 0.6224

论文的解读：XGBoost 与 scikit-learn 精度都好于 R 的 gbm（它只扩展树的一个分支，更快但可能精度更低），XGBoost 比 scikit-learn 快 10 倍以上；此数据集上列采样略差，论文猜测因为重要特征少。

**排序（Yahoo LTRC，500 棵树，论文 Table 4）**：

方法 | 每棵树耗时（秒） | NDCG@10
-- | -- | --
XGBoost | 0.826 | 0.7892
XGBoost（colsample=0.5） | 0.506 | 0.7913
pGBRT | 2.576 | 0.7915

论文称 XGBoost 更快，此任务上列采样不仅更快还略提升了指标。

**Out-of-core（Criteo，AWS c3.8xlarge）与分布式（32 台 EC2 m3.2xlarge）**：压缩带来 3 倍加速，再分片到两块盘又快 2 倍；最终方法在单机上处理 1.7 billion 样本；分布式下每轮迭代比 Spark MLLib 快 10 倍以上、是 H2O 的 2.2 倍（图注，H2O 数据加载慢导致端到端更差），只用 4 台机器就能处理全部 1.7 billion 样本，机器数增加时论文称性能线性扩展（图注称因文件缓存增多而略超线性）。

## 5. 优缺点与局限

论文自述的取舍：

- 近似算法需要在候选点数与精度间折中；
- 精确贪心不适合放不进内存的数据；
- 论文的结论是系统性的（可扩展、省资源），不是对某类数据的精度保证。

[经验] 用于时序预测时：

优点 | 缺点
-- | --
快、CPU 即可；对异构协变量、类别特征友好；能处理缺失值；特征重要性便于诊断；业务预测里长期是强基线 | 不外推趋势；特征工程依赖人；多步预测要选策略且各步长不保证一致；默认只给点预测；对结构突变与长历史依赖不如专门的序列模型

## 6. 用于时序预测 [经验]

本章内容论文里**没有**，全部标 [经验]，与[综述 §3.1](/0605_ML_Tasks_TimeSeries_ML)口径一致。

### 6.1 把序列变成特征表

对每个预测时刻 $t$ 构造一行：目标 $y_{t}$（或 $y_{t+h}$）；特征包括滞后值 $y_{t-1},y_{t-7},\dots$、滚动窗口统计（均值、标准差、最近 28 天均值等，必须只用 $t$ 之前的数据）、日历特征（星期、月、节假日）、协变量（价格、促销，未来已知的可用未来值）、静态特征（序列 ID、类别）。常见错误是特征窗口包含了目标时刻或之后的信息（数据泄漏）。

### 6.2 多步预测策略

策略 | 做法 | 说明
-- | -- | --
递归 | 一个单步模型，把预测值作为下一步的滞后输入 | 只训一个模型；$H$ 长时误差累积明显
直接 | 每个步长 $h$ 一个模型，或把 $h$ 当特征 | 业务预测常用做法，模型数多或表变大
MIMO | 一个模型同时输出多步 | GBDT 不原生支持，需要包装

### 6.3 外推问题与目标变换

决策树把特征空间分成若干区域，每个区域输出一个常数，集成后仍是分段常数函数，因此一般不能像线性模型那样外推趋势 [经验]（综述 §1.6 的说法；严格的取值范围取决于具体设置）。训练期水平在 $[80,120]$、测试期升到 $[130,170]$ 时，直接对水平值回归会系统性低估。做法：预测相对比值 $y_t/\bar y_{t-28:t-1}$ 再乘回近期均值；对序列做差分；或用线性项抓趋势、树抓非线性残差。

### 6.4 时序交叉验证

不能随机打乱划分。用按时间向前滚动的划分：训练窗只在验证窗之前，且在训练与验证之间留出至少等于预测步长的间隔以避免泄漏 [经验]。

### 6.5 概率预测

把损失换成分位数（pinball）损失，每个分位数水平训练一个模型，可能出现分位数交叉，需要排序修正；或"点预测 + 共形校准"。Poisson / Tweedie 目标用于非负、大量零值的需求。具体见综述 §3.3。

## 7. 与相关方法对比

方法 | 定位 | 与 GBDT 的关系
-- | -- | --
LightGBM | 另一个梯度提升树实现，不在本论文中 [待核实] | 同类方法，本文不展开、不比较
随机森林 | 论文借用其列采样 | 平均而非逐棵修正，同样不外推 [经验]
[ARIMA](/0624_ML_Tasks_TimeSeries_Classical_ARIMA) | 局部、线性、可外推 | GBDT 是全局、非线性、需特征工程 [经验]
[DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR)、[TCN](/0626_ML_Tasks_TimeSeries_Deep_TCN) | 深度序列模型 | 自动学表示，需要更多数据与调参；对比需同等调参预算 [经验]

## 8. 使用方式

示意代码，未运行验证（xgboost + 滞后特征 + 时序划分，直接策略 $h=7$）：

```python
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import TimeSeriesSplit

H = 7
df["lag1"] = df["y"].shift(1)
df["lag7"] = df["y"].shift(7)
df["roll28"] = df["y"].shift(1).rolling(28).mean()
df["dow"] = df.index.dayofweek  # 假设索引是日期
df["target"] = df["y"].shift(-H)
data = df.dropna()
X, y = data[["lag1", "lag7", "roll28", "dow"]], data["target"]

model = xgb.XGBRegressor(n_estimators=500, learning_rate=0.1,
                         max_depth=6, subsample=0.8, colsample_bytree=0.8)
for tr, va in TimeSeriesSplit(n_splits=5).split(X):
    model.fit(X.iloc[tr], y.iloc[tr])
    pred = model.predict(X.iloc[va])
```

上面只训练了 $h=7$ 一个步长；直接策略要对每个 $h$ 重复，或把 $h$ 作为特征。实际使用中特征、滚动统计和划分必须保证不泄漏未来信息 [经验]。

## Reference

- Tianqi Chen, Carlos Guestrin. *XGBoost: A Scalable Tree Boosting System*. [arXiv:1603.02754](https://arxiv.org/abs/1603.02754)
- 论文给出的开源实现：[github.com/dmlc/xgboost](https://github.com/dmlc/xgboost)
- 本站综述：[时间序列：机器学习方法](/0605_ML_Tasks_TimeSeries_ML)

