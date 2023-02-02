---
Title | ML OML DecisionTree
-- | --
Created @ | `2021-03-30T07:53:56Z`
Updated @| `2023-02-02T08:56:33Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/113)

---
# Decision Tree 决策树

## Reference
- [决策树 – Decision tree](https://easyai.tech/ai-definition/decision-tree/)

## Brief

- Decision Tree - 决策树
- 决策树组成
  - **根节点**：包含样本的全集
  - **内部节点**：对应特征属性测试
  - **叶节点**：代表决策的结果
- 基于 if-then-else 规则的有监督学习算法
- **Pipeline**
  - 特征选择
  - 决策树生成
  - 决策树剪枝 - 主动去掉部分分支 `对抗过拟合`
- **Algos**
  - ID3 - 利用信息增益来选择特征
  - C4.5 - 引入“信息增益比” 选择特征
  - CART - Classification and Regression Tree - 使用基尼系数取代信息熵模型
- **优点**
  - 易于理解和解释
  - 标称型和数值型数据
- **缺点**
  - 过拟合
  - 忽略数据相关性

## UseCase

![image](https://user-images.githubusercontent.com/2216970/112953384-061f2080-9170-11eb-8b38-4ae0f447c89b.png)


