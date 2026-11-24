-----

| Title     | ML OML                                                |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-02-02T08:57:10Z`                                |
| Updated @ | `2026-11-24T03:40:00Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/367) |

-----

# Traditional Machine Learning 传统机器学习

  - 2012 年 AlexNet 之前 常用的机器学习方法
  - OML - `Original Machine
    Learning`，指不依赖深度神经网络的经典机器学习算法：决策树、SVM、集成学习、线性模型、聚类、降维等
  - 特点：**依赖人工设计特征 (Feature
    Engineering)**，模型相对简单，训练快、可解释性强、在小数据和表格数据上依然是强基线
  - 与深度学习的关系：深度学习把「特征提取 + 分类器」合并成端到端训练；传统方法是「人工特征 → 分类器」两步走，例如 `HOG +
    SVM` 做行人检测

## 分类

下图按学习方式列出传统机器学习的主要算法：

``` mermaid
graph TD
    ML(传统机器学习) --> S(监督学习)
    ML --> U(无监督学习)
    ML --> SS(半监督 / 强化学习)
    S --> C(分类)
    S --> R(回归)
    C --> C1(决策树 / SVM / KNN / 朴素贝叶斯 / 逻辑回归)
    C --> C2(集成: Random Forest / AdaBoost / GBDT)
    R --> R1(线性回归 / Ridge / Lasso / SVR / 回归树)
    U --> UC(聚类: K-Means / DBSCAN / GMM)
    U --> UD(降维: PCA / t-SNE / LDA)
    U --> UA(异常检测: Isolation Forest / One-Class SVM)
```

图中：

  - 第一层按是否使用标签区分学习方式：监督学习有标签，无监督学习没有标签
  - 监督学习再分为输出离散类别的**分类**和输出连续值的**回归**，同一个算法常有两种版本（如 SVM/SVR，决策树/回归树）
  - 集成学习（Bagging、Boosting）是把多个弱模型组合成强模型的框架，不是单一算法
  - 无监督学习包括聚类、降维和异常检测，聚类评估见 [Clustering
    Metrics](/0719_ML_Metrics_Clustering)，回归评估见 [Regression
    Metrics](/0710_ML_Metrics_Regression)

## 本系列文章

  - 线性模型
      - [Linear Regression 线性回归](/0722_ML_OML_LinearRegression) -
        最小二乘、正则化
      - [Logistic Regression 逻辑回归](/0723_ML_OML_LogisticRegression) -
        sigmoid + 交叉熵
  - 基于实例 / 概率
      - [KNN K 近邻](/0724_ML_OML_KNN) - 实例学习
      - [Naive Bayes 朴素贝叶斯](/0725_ML_OML_NaiveBayes) - 贝叶斯定理 + 条件独立
  - 树模型与集成
      - [Decision Tree 决策树](/0113_ML_OML_DecisionTree) - 基于 if-then
        规则，ID3 / C4.5 / CART
      - [Ensemble Learning 集成学习](/0726_ML_OML_Ensemble) - Bagging /
        Boosting / Stacking
          - [Random Forest 随机森林](/0114_ML_OML_RandomForest) - Bagging
            集成的多棵决策树
          - [GBDT 梯度提升决策树](/0727_ML_OML_Ensemble_GBDT) - 拟合负梯度的 Boosting
          - [XGBoost 极端梯度提升](/0728_ML_OML_Ensemble_XGBoost) - 二阶展开 + 正则
            + 工程优化
  - 核方法
      - [SVM 支持向量机](/0115_ML_OML_SVM) - 最大间隔分类器与核技巧
          - [SVM 原理推导](/0116_ML_OML_SVM_原理) - 从超平面到对偶问题
  - 无监督学习
      - [K-Means K 均值聚类](/0729_ML_OML_KMeans) - 基于中心的聚类
      - [DBSCAN 密度聚类](/0730_ML_OML_DBSCAN) - 任意形状簇 + 噪声识别
      - [PCA 主成分分析](/0731_ML_OML_PCA) - 线性降维
      - [t-SNE 非线性降维](/0732_ML_OML_tSNE) - 可视化
      - [Isolation Forest 孤立森林](/0733_ML_OML_IsolationForest) - 异常检测

## 算法对比

| Algorithm                 | 类型       | 优点              | 缺点             | 典型场景          |
| ------------------------- | -------- | --------------- | -------------- | ------------- |
| 线性回归 / 逻辑回归               | 线性模型     | 简单、可解释、训练快      | 只能拟合线性关系       | 基线模型、风控评分     |
| KNN                       | 实例学习     | 无需训练，思想简单       | 预测慢，对维度和尺度敏感   | 小数据、推荐        |
| 朴素贝叶斯                     | 概率模型     | 训练快，小样本也有效      | 特征独立假设过强       | 文本分类、垃圾邮件     |
| 决策树                       | 树模型      | 可解释，无需特征缩放      | 容易过拟合          | 规则提取、特征分析     |
| 随机森林                      | Bagging  | 稳健，不易过拟合，可并行    | 模型大，预测慢        | 表格数据通用基线      |
| GBDT / XGBoost / LightGBM | Boosting | 表格数据精度最高的一类     | 对噪声敏感，调参多      | 表格数据竞赛与工业     |
| SVM                       | 核方法      | 小样本高维效果好，有全局最优解 | 大数据集训练慢，核与参数难选 | 文本、生物信息、小样本图像 |
| K-Means                   | 聚类       | 简单、快            | 需指定 $k$，只适合凸簇  | 客户分群、向量量化     |
| PCA                       | 降维       | 去相关、去噪、可视化      | 只捕捉线性结构        | 特征预处理、可视化     |

表中列出常见算法的对比：类型一列表示算法属于哪一族，后几列从优缺点和适用场景给出选择参考。表格数据上树模型（尤其是
Boosting）通常优于深度学习，图像、语音、文本等非结构化数据则相反。

## 基本流程

下图是一次传统机器学习项目的典型流程：

``` mermaid
graph LR
    D(数据采集) --> P(数据清洗<br/>缺失值 / 异常值)
    P --> F(特征工程<br/>构造 / 选择 / 缩放)
    F --> M(模型训练)
    M --> E(评估)
    E -->|调参| M
    E --> O(部署)
```

图中：

  - 数据清洗处理缺失值、异常值、重复样本；特征工程做特征构造、特征选择和标准化，特征质量往往比算法选择更影响最终效果，见 [Feature
    Engineering](/0206_ML_AutoML_FE)
  - 模型训练与评估构成循环：根据评估结果调整超参数，见 [HPO](/0013_ML_AutoML_HPO)；划分数据和稳健评估见
    [Cross Validation](/0249_ML_Metrics_CrossValidation)，指标选择见
    [Metrics](/0138_ML_Metrics)
  - 评估通过后才部署；整个循环中，特征缩放、特征选择等都只能用训练集拟合，避免数据泄漏

## 核心概念

### 过拟合与欠拟合

  - **欠拟合 (Underfitting)**：模型太简单，训练集和测试集上误差都很大
  - **过拟合 (Overfitting)**：模型太复杂，训练集上误差很小但测试集上误差大，把噪声也「记住」了
  - 对抗过拟合：更多数据、简化模型、正则化（见
    [Regularization](/0252_ML_Op_Regularization)）、剪枝（决策树）、集成、交叉验证、早停

### 偏差-方差分解

$$ \\mathbb{E}\\big\[(y - \\hat{f}(x))^2\\big\] =
\\underbrace{\\big(\\mathbb{E}\[\\hat{f}(x)\] -
f(x)\\big)^2}*{\\text{Bias}^2} +
\\underbrace{\\mathbb{E}\\big\[(\\hat{f}(x) -
\\mathbb{E}\[\\hat{f}(x)\])^2\\big\]}*{\\text{Variance}} +
\\underbrace{\\sigma^2}\_{\\text{Noise}} $$

其中：

  - $y$：真实观测值；$f(x)$：真实函数；$\\hat{f}(x)$：模型在不同训练集上学到的预测函数；$\\mathbb{E}$
    表示对训练集随机性（及噪声）取期望
  - $\\text{Bias}^2$：偏差，模型平均预测与真实值的差距，反映**拟合能力不足**（欠拟合）
  - $\\text{Variance}$：方差，模型预测随训练集变化的波动，反映**对训练数据过于敏感**（过拟合）
  - $\\sigma^2$：数据本身的噪声，任何模型都无法消除
  - 模型越复杂，偏差越小、方差越大；二者此消彼长，最佳复杂度使总误差最小。Bagging 主要降低方差，Boosting 主要降低偏差

### 损失函数与正则化

$$ \\min\_{\\theta}\\ \\frac{1}{N}\\sum\_{i=1}^{N} L\\big(y\_i,
f(x\_i;\\theta)\\big) + \\lambda,\\Omega(\\theta) $$

其中：

  - $\\theta$：模型参数；$f(x\_i;\\theta)$：模型对第 $i$ 个样本的预测；$L$：损失函数，见
    [LossFunction](/0281_ML_Arch_Func_LossFunction)
  - $N$：训练样本数；$\\Omega(\\theta)$：正则项，如 L2 范数
    $\\lVert\\theta\\rVert\_2^2$（Ridge）或 L1 范数
    $\\lVert\\theta\\rVert\_1$（Lasso，产生稀疏解）
  - $\\lambda \\ge 0$：正则强度，越大模型越简单；$\\lambda$ 是超参数，通过交叉验证选择
  - 大多数传统算法都可以写成这个「经验损失 + 正则」的形式：SVM 是 hinge 损失 + L2，逻辑回归是交叉熵 + L2

## 传统方法 vs 深度学习

| Name | 传统机器学习   | 深度学习            |
| ---- | -------- | --------------- |
| 特征   | 人工设计     | 自动学习            |
| 数据量  | 小数据即可    | 需要大量数据          |
| 算力   | CPU 即可   | 通常需要 GPU        |
| 可解释性 | 较强       | 较弱              |
| 擅长   | 表格数据、小样本 | 图像、语音、文本等非结构化数据 |
| 调参   | 超参数少     | 结构和超参数复杂        |

表中对比了两类方法：不是谁取代谁，而是适用场景不同。数据少、要可解释、算力受限时仍然优先选传统方法，并且传统方法常作为深度学习的基线或与之结合（如用
CNN 提特征后接 SVM）。

## 发展时间线

| Year        | Event                                     |
| ----------- | ----------------------------------------- |
| 1957        | Perceptron 感知机                            |
| 1986        | ID3 决策树                                   |
| 1995        | SVM 支持向量机                                 |
| 1996        | Bagging                                   |
| 1997        | AdaBoost                                  |
| 2001        | Random Forest、Gradient Boosting           |
| 2012        | AlexNet，深度学习兴起                            |
| 2014 - 2017 | XGBoost / LightGBM / CatBoost，在表格数据上仍保持领先 |

表中给出传统机器学习关键算法的出现年份，可以看到集成学习在深度学习兴起之后仍在持续发展。

## Tools

  - [scikit-learn](https://scikit-learn.org/) - 传统机器学习的标准库
  - [XGBoost](https://xgboost.readthedocs.io/) /
    [LightGBM](https://lightgbm.readthedocs.io/) /
    [CatBoost](https://catboost.ai/) - Boosting 实现
  - [libsvm](https://www.csie.ntu.edu.tw/~cjlin/libsvm/) - SVM 实现

## Reference

  - [scikit-learn User
    Guide](https://scikit-learn.org/stable/user_guide.html)
  - [The Elements of Statistical
    Learning](https://hastie.su.domains/ElemStatLearn/)
  - [机器学习 - 周志华](https://book.douban.com/subject/26708119/)
