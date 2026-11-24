-----

| Title     | ML OML LogisticRegression                             |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T03:39:13Z`                                |
| Updated @ | `2026-11-24T05:37:35Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/723) |

-----

# Logistic Regression 逻辑回归

  - 名字里有「回归」，实际是**分类**模型：用线性模型的输出经过 sigmoid 变成概率，用于二分类，推广后可用于多分类
  - 是最常用的分类基线，也是神经网络中「线性层 + sigmoid/softmax + 交叉熵」的原型
  - 属于 [传统机器学习](/0367_ML_OML)；与 [Linear
    Regression](/0722_ML_OML_LinearRegression) 的区别在于输出和损失函数

下图是逻辑回归的计算流程：

``` mermaid
graph LR
    X("特征 x") --> L("线性组合<br/>z = wᵀx + b")
    L --> S("sigmoid<br/>p = 1 / (1 + e^-z)")
    S --> T{"p 是否大于阈值?"}
    T -->|"是"| P("预测为正类")
    T -->|"否"| N("预测为负类")
```

图中：

  - 先和线性回归一样，对特征做线性组合得到实数 $z$（可以是任意大小，称为 logit）
  - 再通过 sigmoid 函数把 $z$ 压缩到 $(0, 1)$ 作为样本属于正类的概率 $p$
  - 与阈值（默认 0.5）比较得到类别；阈值可以根据 Precision/Recall 的需求调整

## 模型

$$ p = P(y = 1 \\mid x) = \\sigma(z) = \\frac{1}{1 + e^{-z}}, \\qquad z
= w^\\top x + b $$

其中：

  - $x$：特征向量；$w$：权重；$b$：偏置；$z$：线性组合的输出，也叫 logit
  - $\\sigma(\\cdot)$：sigmoid 函数，单调递增，$\\sigma(0) = 0.5$，$z \\to
    +\\infty$ 时趋于 1，$z \\to -\\infty$ 时趋于 0
  - $p$：样本属于正类的概率；负类的概率为 $1 - p$
  - 决策边界是 $z = 0$，即 $w^\\top x + b = 0$，所以逻辑回归是**线性分类器**
  - 等价形式：$\\ln\\frac{p}{1-p} = w^\\top x + b$，即对数几率（log-odds）是特征的线性函数；权重
    $w\_j$ 表示特征 $x\_j$ 增加 1，对数几率增加 $w\_j$，几率变为原来的 $e^{w\_j}$ 倍

## 损失函数

  - 用**极大似然**估计参数。样本 $(x\_i, y\_i)$ 的似然为
    $p\_i^{y\_i}(1-p\_i)^{1-y\_i}$，取负对数得到二元交叉熵（对数损失）：

$$ J(w, b) = -\\frac{1}{N}\\sum\_{i=1}^{N}\\Big\[y\_i \\ln p\_i + (1 -
y\_i)\\ln(1 - p\_i)\\Big\] $$

其中：

  - $N$：样本数；$y\_i \\in {0, 1}$：真实标签；$p\_i = \\sigma(w^\\top x\_i +
    b)$：预测为正类的概率

  - 真实为正类（$y\_i = 1$）时损失为 $-\\ln p\_i$，$p\_i$ 越接近 1
    损失越小；真实为负类时同理；预测得越「自信」且错误，损失越大

  - 如果改用平方损失，配合 sigmoid 会得到非凸函数，所以分类时使用交叉熵；该损失是凸函数，没有局部最优问题，见
    [LossFunction](/0281_ML_Arch_Func_LossFunction)

  - 梯度形式非常简洁，和线性回归的形式相同：

$$ \\nabla\_w J = \\frac{1}{N}\\sum\_{i=1}^{N}(p\_i - y\_i),x\_i $$

其中：$(p\_i - y\_i)$ 为第 $i$
个样本的预测误差，梯度是误差加权的特征平均；没有解析解，用梯度下降、L-BFGS、牛顿法等迭代求解。

## 正则化

  - 在 $J$ 上加 L2 或 L1 正则：$J + \\lambda \\lVert w \\rVert\_2^2$（默认）或 $J +
    \\lambda \\lVert w \\rVert\_1$（稀疏）
  - scikit-learn 中用 $C = 1/\\lambda$ 表示**正则强度的倒数**：$C$ 越小，正则越强
  - 数据线性可分时，不加正则的最优权重会趋于无穷大（概率越极端损失越小），所以正则化在这种情况下是必需的

## 多分类

| Strategy              | 做法                         | 说明                 |
| --------------------- | -------------------------- | ------------------ |
| One-vs-Rest           | 每个类别对其余类别训练一个二分类器，取概率最大的类别 | 简单，各类别概率之和不一定为 1   |
| Softmax (Multinomial) | 直接建模所有类别的概率分布              | 类别互斥时更自然，输出概率之和为 1 |

Softmax 的形式：

$$ P(y = k \\mid x) = \\frac{e^{z\_k}}{\\sum\_{j=1}^{K} e^{z\_j}},
\\qquad z\_k = w\_k^\\top x + b\_k $$

其中：$K$ 为类别数；$w\_k$、$b\_k$ 为第 $k$ 类的权重和偏置；分母对所有类别求和，保证概率之和为 1。$K=2$ 时退化为
sigmoid；神经网络分类头最后一层就是这个形式。

## 阈值与评估

  - 默认阈值 0.5 并不总是最优：漏检代价大（疾病筛查）时降低阈值提高 Recall，误检代价大时提高阈值提高 Precision
  - 评估时需要看 Precision、Recall、F1、ROC/AUC、PR 曲线，不能只看 Accuracy，见 [Metrics
    for Classification](/0137_ML_Metrics_Classification)
  - 输出的概率比较**校准**（接近真实频率），这是逻辑回归相对 SVM、决策树的一个优势

## 优缺点

  - **优点**
      - 简单、训练和预测都很快，适合大规模稀疏特征（如广告点击率预测）
      - 输出概率，权重可解释
      - 凸优化，加正则后很稳定
  - **缺点**
      - 只能得到线性决策边界，非线性关系需要手工构造特征（如多项式、交叉特征）
      - 对多重共线性和离群点敏感，特征需要标准化
      - 类别不均衡时需要 `class_weight` 或调整阈值

## Code

``` python
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

clf = make_pipeline(StandardScaler(),
                    LogisticRegression(C=1.0, penalty='l2', class_weight='balanced', max_iter=1000)).fit(X_train, y_train)
proba = clf.predict_proba(X_test)[:, 1]          # 正类概率
pred = (proba >= 0.3).astype(int)                # 自定义阈值
```

## Reference

  - [scikit-learn - Logistic
    regression](https://scikit-learn.org/stable/modules/linear_model.html#logistic-regression)
  - [The Elements of Statistical
    Learning](https://hastie.su.domains/ElemStatLearn/)
