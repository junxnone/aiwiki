-----

| Title     | ML OML Ensemble XGBoost                               |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T03:39:33Z`                                |
| Updated @ | `2026-11-24T03:39:33Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/728) |

-----

# XGBoost 极端梯度提升

  - **XGBoost** - `eXtreme Gradient Boosting`：对
    [GBDT](/0727_ML_OML_Ensemble_GBDT) 的高效工程实现和算法改进，2016 年提出，长期统治表格数据竞赛
  - 相比传统 GBDT 的改进：
      - 目标函数加入**正则项**，控制树的复杂度
      - 使用损失函数的**二阶泰勒展开**（梯度 + Hessian），收敛更快、更准
      - **稀疏感知**的划分查找，自动处理缺失值
      - 列采样、直方图近似、并行与缓存优化，大数据集上训练快
  - 属于 [Ensemble Learning](/0726_ML_OML_Ensemble) 中的 Boosting；同类实现还有
    LightGBM、CatBoost

## 目标函数

$$ Obj = \\sum\_{i=1}^{N} L\\big(y\_i, \\hat{y}*i\\big) +
\\sum*{k=1}^{K}\\Omega(f\_k), \\qquad \\Omega(f) = \\gamma T +
\\frac{1}{2}\\lambda\\sum\_{j=1}^{T}w\_j^2 $$

其中：

  - $N$：样本数；$K$：树的总数；$f\_k$：第 $k$ 棵树；$\\hat{y}\_i = \\sum\_k
    f\_k(x\_i)$：集成的预测值
  - $L$：可导的损失函数（平方损失、对数损失等）
  - $\\Omega(f)$：对一棵树的复杂度惩罚；$T$：该树的叶节点数；$w\_j$：第 $j$ 个叶节点的输出值（叶权重）
  - $\\gamma \\ge 0$：每多一个叶节点的代价，越大树越小（起到剪枝作用）；$\\lambda \\ge 0$：对叶权重的 L2
    正则，越大叶权重越小、模型越保守

## 二阶展开与最优叶权重

  - 第 $t$ 轮加入一棵树 $f\_t$，对损失在 $\\hat{y}\_i^{(t-1)}$ 处做二阶泰勒展开，去掉常数项：

$$ Obj^{(t)} \\approx \\sum\_{i=1}^{N}\\Big\[g\_i f\_t(x\_i) +
\\frac{1}{2}h\_i f\_t^2(x\_i)\\Big\] + \\gamma T +
\\frac{1}{2}\\lambda\\sum\_{j=1}^{T}w\_j^2 $$

$$ g\_i = \\partial\_{\\hat{y}^{(t-1)}} L\\big(y\_i,
\\hat{y}^{(t-1)}*i\\big), \\qquad h\_i = \\partial^2*{\\hat{y}^{(t-1)}}
L\\big(y\_i, \\hat{y}^{(t-1)}\_i\\big) $$

其中：

  - $g\_i$：损失对当前预测值的一阶导数（梯度）；$h\_i$：二阶导数（Hessian），描述损失的曲率；二者在每轮对每个样本计算一次
  - 一阶信息给出下降方向，二阶信息给出步长的修正，所以比只用一阶的 GBDT 更快更准（相当于牛顿法）
  - 样本落入叶节点 $j$ 时 $f\_t(x\_i) = w\_j$。把样本按叶节点分组，记 $G\_j = \\sum\_{i \\in
    I\_j} g\_i$，$H\_j = \\sum\_{i \\in I\_j} h\_i$（$I\_j$ 为落入叶 $j$
    的样本集合），目标函数变为关于 $w\_j$ 的二次函数，直接求最小值得：

$$ w\_j^\* = -\\frac{G\_j}{H\_j + \\lambda}, \\qquad Obj^\* =
-\\frac{1}{2}\\sum\_{j=1}^{T}\\frac{G\_j^2}{H\_j + \\lambda} + \\gamma T
$$

其中：$w\_j^*$ 是叶节点 $j$ 的最优输出，是梯度和与 Hessian 和之比的负值（再用 $\\lambda$
平滑）；$Obj^*$ 是这棵树结构固定时的最优目标值，**值越小，这棵树的结构越好**，可以直接用来评价树的结构。

## 划分增益

  - 生长树时，对一个节点尝试把它划分为左右两个子节点，增益等于划分前后目标值的下降：

$$ Gain = \\frac{1}{2}\\Big\[\\frac{G\_L^2}{H\_L + \\lambda} +
\\frac{G\_R^2}{H\_R + \\lambda} - \\frac{(G\_L + G\_R)^2}{H\_L + H\_R +
\\lambda}\\Big\] - \\gamma $$

其中：

  - $G\_L, H\_L$、$G\_R, H\_R$：划分后左、右子节点的梯度和与 Hessian
    和；方括号里是「划分后两个叶的得分之和」减去「划分前一个叶的得分」
  - $\\gamma$：新增一个叶节点的惩罚；**$Gain \< 0$ 时不划分**，所以 $\\gamma$ 同时起到预剪枝的作用
  - 对每个特征的所有候选划分点遍历计算 Gain，选最大的；有序特征先排序后一次扫描即可算出所有候选点的 $G\_L$、$G\_R$

## 工程优化

| Name                  | 说明                                                   |
| --------------------- | ---------------------------------------------------- |
| 稀疏感知 (Sparsity-aware) | 对缺失值/零值，学习一个**默认方向**：分别尝试把缺失样本分到左或右，选增益大的            |
| 近似算法 / 直方图            | 把连续特征按分位数分桶，只在桶边界上找划分点，大幅减少候选点（`tree_method='hist'`） |
| 列采样                   | 每棵树/每层/每个节点随机使用部分特征（借鉴随机森林），防过拟合并加速                  |
| 并行                    | 在**特征维度**并行搜索最佳划分点（树本身仍串行）；数据预排序成块（Column Block）存储   |
| 缓存与外存                 | 缓存感知访问，支持核外计算，数据放不进内存时可用                             |
| GPU                   | `device='cuda'` 在 GPU 上训练，对大数据集提速明显                  |

表中是 XGBoost 在算法之外的工程设计：这些优化使它既能处理缺失值又能扩展到大规模数据，这是它相比 scikit-learn 的 GBDT
更常用的主要原因。

## 主要超参数

| Parameter                               | 含义                | 建议                 |
| --------------------------------------- | ----------------- | ------------------ |
| `n_estimators`                          | 树的数量              | 设较大值，配合早停          |
| `learning_rate` ($\\eta$)               | 收缩系数              | 0.01\~0.3          |
| `max_depth`                             | 树的最大深度            | 3\~10，越大越复杂        |
| `min_child_weight`                      | 子节点 Hessian 和的最小值 | 越大越保守，抑制过拟合        |
| `subsample`                             | 每棵树的样本采样比例        | 0.5\~1             |
| `colsample_bytree`                      | 每棵树的特征采样比例        | 0.5\~1             |
| `gamma` ($\\gamma$)                     | 划分所需的最小增益         | 越大越保守              |
| `reg_lambda` ($\\lambda$) / `reg_alpha` | L2 / L1 正则        | 防过拟合               |
| `scale_pos_weight`                      | 正负样本权重比           | 类别不均衡时设为 负样本数/正样本数 |

表中参数大致分为三类：控制树的复杂度（`max_depth`、`min_child_weight`、`gamma`）、控制随机性（`subsample`、`colsample_*`）、控制正则（`reg_*`）。调参顺序通常是：先定学习率和早停，再调树结构，再调采样和正则，参考
[HPO](/0013_ML_AutoML_HPO)。

## 与 LightGBM、CatBoost 对比

| Name | XGBoost           | LightGBM                 | CatBoost                           |
| ---- | ----------------- | ------------------------ | ---------------------------------- |
| 树的生长 | 按层生长 (level-wise) | 按叶生长 (leaf-wise)，选增益最大的叶 | 对称树 (oblivious tree)               |
| 划分查找 | 精确 / 直方图          | 直方图 + GOSS 采样 + EFB 特征捆绑 | 直方图                                |
| 类别特征 | 需要自己编码            | 支持（最优划分）                 | **原生支持**，Ordered Target Statistics |
| 训练速度 | 较快                | 通常最快、内存小                 | GPU 上很快，CPU 稍慢                     |
| 特点   | 生态成熟，稳定           | 大数据首选，小数据易过拟合            | 默认参数就很好，对类别特征强                     |

表中是三个主流 GBDT 实现的区别。LightGBM 的 leaf-wise
生长可以用更少的叶节点达到更低的损失，但数据量小时容易过深过拟合，需要限制
`num_leaves`；CatBoost 用「有序提升」减少目标泄漏，对含大量类别特征的数据通常效果更好。

## Code

``` python
import xgboost as xgb
from sklearn.model_selection import train_test_split

X_tr, X_val, y_tr, y_val = train_test_split(X, y, test_size=0.2, stratify=y, random_state=0)
clf = xgb.XGBClassifier(n_estimators=2000, learning_rate=0.05, max_depth=6,
                        subsample=0.8, colsample_bytree=0.8, reg_lambda=1.0,
                        tree_method='hist', eval_metric='auc',
                        early_stopping_rounds=50)
clf.fit(X_tr, y_tr, eval_set=[(X_val, y_val)], verbose=False)
print(clf.best_iteration, clf.best_score)
proba = clf.predict_proba(X_val)[:, 1]
```

## Reference

  - [XGBoost: A Scalable Tree Boosting
    System](https://arxiv.org/abs/1603.02754)
  - [XGBoost Documentation](https://xgboost.readthedocs.io/)
  - [LightGBM: A Highly Efficient Gradient Boosting Decision
    Tree](https://papers.nips.cc/paper/2017/hash/6449f44a102fde848669bdd9eb6b76fa-Abstract.html)
  - [CatBoost: unbiased boosting with categorical
    features](https://arxiv.org/abs/1706.09516)
