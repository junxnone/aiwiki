-----

| Title     | ML OML KNN                                            |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T03:39:16Z`                                |
| Updated @ | `2026-11-24T05:37:38Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/724) |

-----

# KNN K 近邻

  - **KNN** - `K-Nearest Neighbors`：对一个新样本，在训练集中找到离它最近的 $K$ 个样本，由这 $K$
    个邻居**投票**（分类）或**平均**（回归）得到预测
  - 属于**实例学习（懒惰学习）**：没有显式的训练过程，只是把训练数据存起来，预测时才计算
  - 属于 [传统机器学习](/0367_ML_OML)；距离/相似度的选择见 [Pairwise
    Metrics](/0139_ML_Metrics_Pairwise)，检索场景见 [Retrieval
    Metrics](/0712_ML_Metrics_Retrieval)

## 算法

下图是 KNN 的预测过程：

``` mermaid
graph LR
    Q("待预测样本 x") --> D("计算 x 与所有训练样本的距离")
    D --> S("取距离最小的 K 个邻居")
    S --> V{"任务"}
    V -->|"分类"| C("多数投票")
    V -->|"回归"| R("取平均值")
```

图中：

  - 先用选定的距离度量，计算待预测样本与每个训练样本的距离，没有任何参数需要学习
  - 取距离最近的 $K$ 个样本作为邻居；分类时让邻居中出现次数最多的类别胜出，回归时取邻居标签的平均值
  - 可以给更近的邻居更大的权重（如权重 $1/d$），称为距离加权 KNN

$$ \\hat{y} = \\underset{c}{\\arg\\max}\\sum\_{x\_i \\in N\_K(x)} 1(y\_i
= c), \\qquad \\hat{y}*{reg} = \\frac{1}{K}\\sum*{x\_i \\in N\_K(x)}
y\_i $$

其中：

  - $N\_K(x)$：训练集中距离 $x$ 最近的 $K$ 个样本的集合；$y\_i$：邻居 $x\_i$ 的标签
  - $c$：类别；$1(\\cdot)$：指示函数，条件成立为 1，否则为 0
  - 距离加权时，投票或平均时第 $i$ 个邻居的权重为 $w\_i = 1/d(x, x\_i)$

## 三个要素

### 距离度量

| Name      | Formula                                                                | 说明                  |
| --------- | ---------------------------------------------------------------------- | ------------------- |
| Euclidean | $d(x, z) = \\sqrt{\\sum\_j (x\_j - z\_j)^2}$                           | 最常用，对尺度敏感           |
| Manhattan | $d(x, z) = \\sum\_j \\lvert x\_j - z\_j \\rvert$                       | 高维稀疏时比欧氏距离更稳健       |
| Cosine    | $d(x, z) = 1 - \\frac{x^\\top z}{\\lVert x \\rVert \\lVert z \\rVert}$ | 只看方向，适合文本、embedding |

其中：$x, z$ 为两个样本的特征向量，$x\_j$、$z\_j$ 为第 $j$ 维分量。更多度量见 [Pairwise
Metrics](/0139_ML_Metrics_Pairwise)。**特征必须先标准化**，否则取值范围大的特征会主导距离。

### K 值的选择

  - $K$ 小：决策边界复杂，对噪声敏感，**过拟合**（$K=1$ 时训练误差为 0）
  - $K$ 大：决策边界平滑，**欠拟合**，$K=N$ 时永远预测多数类
  - 常用做法：$K$ 取奇数（二分类避免平票），通过 [Cross
    Validation](/0249_ML_Metrics_CrossValidation) 在 $\[1, \\sqrt{N}\]$
    范围内选择

### 决策规则

  - 分类用多数投票，回归用平均；可以使用距离加权来减小远处邻居的影响

## 加速与维度灾难

  - 暴力搜索每次预测的复杂度为 $O(N d)$（$N$ 样本数，$d$ 维度），训练集大时很慢
  - **KD-Tree / Ball Tree**：用树结构剪枝，低维（$d \\lesssim 20$）时有效，复杂度接近
    $O(\\log N)$
  - **近似最近邻 (ANN)**：HNSW、IVF、LSH、Faiss 等，牺牲少量精度换取速度，是向量检索的基础
  - **维度灾难**：维度很高时，样本间距离趋于相等，「最近」的邻居失去意义，树结构也退化为暴力搜索；需要先降维（见
    [PCA](/0731_ML_OML_PCA)）或做特征选择

## 优缺点

  - **优点**
      - 原理简单，无需训练，新数据可以随时加入
      - 天然支持多分类，决策边界可以任意复杂
      - 理论上当 $N \\to \\infty$ 时错误率不超过贝叶斯最优错误率的 2 倍（$K=1$）
  - **缺点**
      - 预测慢、占内存（要保存全部训练数据）
      - 对特征缩放、无关特征和维度灾难敏感
      - 类别不均衡时多数类占优，需要距离加权

## Code

``` python
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import GridSearchCV

pipe = make_pipeline(StandardScaler(), KNeighborsClassifier(weights='distance'))
search = GridSearchCV(pipe, {'kneighborsclassifier__n_neighbors': [1, 3, 5, 7, 9, 15]}, cv=5).fit(X_train, y_train)
print(search.best_params_)
```

## Reference

  - [scikit-learn - Nearest
    Neighbors](https://scikit-learn.org/stable/modules/neighbors.html)
  - [Nearest neighbor pattern classification - Cover &
    Hart 1967](https://ieeexplore.ieee.org/document/1053964)
