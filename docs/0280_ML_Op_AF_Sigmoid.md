---
Title | ML Op AF Sigmoid
-- | --
Created @ | `2019-11-19T03:01:04Z`
Updated @| `2024-06-18T02:56:03Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/280)

---
# sigmoid

- `Sigmoid Function` == `Logistic Function`
- **二分类时** `sigmoid` 和 `softmax` 等价


Name | 应用 | 输出
-- | -- | --
sigmoid | - 二分类<br>- 多标签分类/Multi-Label | 一个或多个 0∼1 范围内的概率值
softmax | - 多分类 | 在 classes_num 个不同输出类别上的概率分布


## Sigmoid
- 输出: [0, 1]
- 二分类中, 将输入的 `feature` 映射到 [0,1] 
- $sigmoid(x)= \frac{1}{1 + e^{-x}} = \frac{e^{x}}{e^{x} + 1} = 1 - sigmoid(-x)$

Name | 公式 | Figure
-- | -- | --
sigmoid | $sigmoid(x)= \frac{1}{1 + e^{-x}}$ | <img width="500px" src="https://user-images.githubusercontent.com/2216970/150644672-56f10a62-b025-4989-8ca0-05689e12a17f.png">




##  二分类时 `sigmoid` 和 `softmax` 等价

Name | Formula
-- | --
sigmoid | $sigmoid(x)= \frac{1}{1 + e^{-x}}$
softmax | $softmax(\vec{z})_{i}=\frac{e^{z_{i}}}{\sum_{j=1}^{K}e^{z_{i}}}$

- 当 二分类时 Vector = [x, 0]

$softmax(\vec{z})_{1}=\frac{e^{z_{1}}}{e^{z_{1}} + e^{z_{2}}}=\frac{e^{x}}{e^{x} + e^{0}}=\frac{e^{x}}{e^{x} + 1}=\frac{1}{1+e^{-x} }$

## 对比
- Sigmoid 与 Softmax 完全等价
- Sigmoid 与 Softmax 分类器的权值可以相互转换
- Softmax 会比 Sigmoid 浪费 2 倍的权值空间


## Reference
- http://neuralnetworksanddeeplearning.com/chap3.html#softmax 
- [logistic函数和softmax函数](http://www.cnblogs.com/maybe2030/p/5678387.html)
- [详解sigmoid与softmax， 多分类及多标签分类](https://blog.csdn.net/uncle_ll/article/details/82778750)
- [Keras - Softmax 与 Sigmoid 二分类问题分析](https://www.aiuai.cn/aifarm679.html)
- [Keras深度学习笔记(三)：神经网络入门](https://xiaosheng.me/2018/11/24/article154/)
- [sigmoid_and_softmax.ipynb](https://gist.github.com/ypwhs/6905ebbda99d04621f9fc00417657ae2)
- [一文详解Softmax函数](https://zhuanlan.zhihu.com/p/105722023)
- [Softmax Function - deepai.org](https://deepai.org/machine-learning-glossary-and-terms/softmax-layer)

