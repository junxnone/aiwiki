---
Title | ML OML Ensemble GBDT
-- | --
Created @ | `2026-11-24T03:39:22Z`
Updated @| `2026-11-24T03:39:22Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/727)

---
# GBDT 梯度提升决策树

- **GBDT** - `Gradient Boosting Decision Tree`：串行地训练一系列**浅层回归树**，每棵新树拟合当前模型的**损失函数负梯度**，最终预测是所有树输出的累加
- 属于 [Ensemble Learning](/0726_ML_OML_Ensemble) 中的 Boosting，基学习器是 [Decision Tree](/0113_ML_OML_DecisionTree) 里的 CART 回归树
- 在表格数据上精度通常最高，工业界的点击率预估、风控、排序广泛使用；高效实现见 [XGBoost](/0728_ML_OML_Ensemble_XGBoost)

下图是 GBDT 的训练过程：

```mermaid
graph LR
    F0(初始模型 F0<br/>常数) --> R1(计算负梯度<br/>伪残差)
    R1 --> T1(拟合一棵回归树 h1)
    T1 --> U1(F1 = F0 + η·h1)
    U1 --> R2(计算新的负梯度)
    R2 --> T2(拟合回归树 h2)
    T2 --> U2(F2 = F1 + η·h2)
    U2 --> E(...重复 M 轮)
```

图中：

- 从一个简单的常数模型 $F_0$ 开始，每一轮先计算当前模型在每个训练样本上的**伪残差**（损失的负梯度）
- 然后训练一棵回归树去拟合这些伪残差，并以学习率 $\eta$ 把它加到模型上，更新模型
- 重复 $M$ 轮；每棵树都在纠正前面所有树的剩余误差，所以树是**串行**的，不能并行训练

## 算法

- 目标是在函数空间里用梯度下降最小化损失：$F(x)$ 就是「参数」，每次沿负梯度方向走一步，这一步由一棵树近似

$$
F_m(x) = F_{m-1}(x) + \eta\, h_m(x), \qquad r_{im} = -\left.\frac{\partial L\big(y_i, F(x_i)\big)}{\partial F(x_i)}\right|_{F = F_{m-1}}
$$

其中：

- $F_m(x)$：第 $m$ 轮之后的模型，$F_0$ 一般取使损失最小的常数（平方损失下为标签均值）
- $h_m(x)$：第 $m$ 棵回归树，拟合目标是 $\{(x_i, r_{im})\}$；$M$：树的总数
- $L(y, F)$：损失函数；$r_{im}$：第 $i$ 个样本在第 $m$ 轮的**伪残差**，即损失关于当前预测值的负梯度
- $\eta \in (0, 1]$：学习率（收缩系数 Shrinkage），每棵树只走一小步，$\eta$ 越小需要的树越多，但泛化越好

最终预测是所有树的累加：

$$
F_M(x) = F_0 + \eta\sum_{m=1}^{M} h_m(x)
$$

### 不同损失下的伪残差

Task | 损失 $L$ | 伪残差 $r_{im}$
-- | -- | --
回归（平方损失） | $\frac{1}{2}(y - F)^2$ | $y_i - F_{m-1}(x_i)$，即真正的残差
回归（绝对值损失） | $\lvert y - F \rvert$ | $\operatorname{sign}\big(y_i - F_{m-1}(x_i)\big)$，对离群点稳健
二分类（对数损失） | $-\big[y\ln p + (1-y)\ln(1-p)\big]$，$p = \sigma(F)$ | $y_i - p_i$，即真实标签与预测概率之差

其中：$\sigma(\cdot)$ 为 sigmoid 函数，$p_i = \sigma(F_{m-1}(x_i))$ 是当前模型预测的概率；$y \in \{0, 1\}$。表中可以看到只要换损失函数，算法框架完全不变，这是 Gradient Boosting 的灵活之处：任何可导的损失都可以使用，分类时树拟合的仍然是回归问题。

## 为什么拟合负梯度

- 平方损失下负梯度就是残差：每棵新树专门预测「前面所有树还没解释的部分」
- 一般损失下，负梯度是函数空间中损失下降最快的方向；树对它的拟合就是这个方向的近似，所以沿着它走一步（乘以 $\eta$）一定能使训练损失下降
- 与普通梯度下降的区别：普通梯度下降更新的是参数向量，Gradient Boosting 更新的是函数，每一步加入一棵新树

## 主要超参数

Parameter | 含义 | 建议
-- | -- | --
`n_estimators` ($M$) | 树的数量 | 与学习率配合，用早停确定
`learning_rate` ($\eta$) | 每棵树的收缩系数 | 0.01~0.1，越小越好但需要更多树
`max_depth` | 每棵树的深度 | 3~8，Boosting 用浅树（弱学习器）
`subsample` | 每棵树使用的样本比例 | 0.5~1，小于 1 称随机梯度提升，降低方差
`max_features` | 每次划分考虑的特征比例 | 小于 1 引入随机性
`min_samples_leaf` | 叶节点最少样本数 | 增大可抑制过拟合

表中参数共同控制模型复杂度。经验做法：先固定较大的学习率（如 0.1）通过**早停**（验证集损失不再下降）确定树的数量，再调树的结构，最后降低学习率并增加树数提升最终精度，调参方法见 [HPO](/0013_ML_AutoML_HPO)。

## 与随机森林对比

Name | Random Forest | GBDT
-- | -- | --
集成方式 | Bagging，并行 | Boosting，串行
树的深度 | 深、完全生长 | 浅（3~8 层）
目标 | 降低方差 | 降低偏差
对过拟合 | 加树不会过拟合 | 树太多会过拟合，需要早停
调参 | 简单 | 较多，精度上限更高

表中对比说明：随机森林的树彼此独立，加多少棵都稳定；GBDT 的树依赖前面所有树，增加树数会持续拟合训练集，必须用验证集控制。见 [Random Forest](/0114_ML_OML_RandomForest)。

## 优缺点

- **优点**
  - 表格数据上精度高，无需特征缩放，能处理混合类型特征
  - 自动做特征选择，输出特征重要性；损失函数灵活
  - 对异常值较稳健（选用 Huber / 绝对值损失时）
- **缺点**
  - 串行训练，难以并行（实现上可在树内部并行）
  - 对超参数较敏感，容易过拟合噪声
  - 对图像、文本等非结构化数据不如深度学习；回归时不能外推

## Code
```python
from sklearn.ensemble import GradientBoostingClassifier, HistGradientBoostingClassifier

gbdt = GradientBoostingClassifier(n_estimators=500, learning_rate=0.05, max_depth=3, subsample=0.8,
                                  validation_fraction=0.1, n_iter_no_change=20, random_state=0).fit(X_train, y_train)
print(gbdt.n_estimators_)             # 早停之后实际使用的树数

# 大数据集用基于直方图的版本, 速度快得多
hgb = HistGradientBoostingClassifier(learning_rate=0.1, max_iter=300, early_stopping=True).fit(X_train, y_train)
```

## Reference
- [Greedy Function Approximation: A Gradient Boosting Machine - Friedman 2001](https://projecteuclid.org/journals/annals-of-statistics/volume-29/issue-5/Greedy-function-approximation-A-gradient-boosting-machine/10.1214/aos/1013203451.full)
- [scikit-learn - Gradient Boosting](https://scikit-learn.org/stable/modules/ensemble.html#gradient-boosting)

