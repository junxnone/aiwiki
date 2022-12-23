---
Title | ML Regularization
-- | --
Created @ | `2019-09-11T01:11:11Z`
Last Modify @| `2022-12-23T15:01:26Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/252)

---

# Regularization  正则化

## Reference
- [权重衰减（weight decay）与学习率衰减（learning rate decay）](https://blog.csdn.net/program_developer/article/details/80867468)
- [正则化方法：L1和L2 regularization、数据集扩增、dropout](https://blog.csdn.net/u012162613/article/details/44261657)

## Brief
- [norm](/norm)
- 更小的权值w，从某种意义上说，表示网络的复杂度更低


![image](https://user-images.githubusercontent.com/2216970/64660983-568f3a00-d475-11e9-8fca-aab3fd6abee6.png)
![image](https://user-images.githubusercontent.com/2216970/64660987-5a22c100-d475-11e9-8c62-6fcd13d1fd20.png)
![image](https://user-images.githubusercontent.com/2216970/64660989-5c851b00-d475-11e9-99b6-587a1666b98d.png)

> 使用L2正则化时, w前面系数由 `1` 变为 `1−ηλ/n`, 效果是减小w, 即权重衰减（weight decay）


正则化(Regularization) 是机器学习中对原始损失函数引入额外信息，以便防止过拟合和提高模型泛化性能的一类方法的统称。
- L1正则化可以使得参数稀疏化，即得到的参数是一个稀疏矩阵，可以用于特征选择。
  - 稀疏性，说白了就是模型的很多参数是0。通常机器学习中特征数量很多，例如文本处理时，如果将一个词组（term）作为一个特征，那么特征数量会达到上万个（bigram）。在预测或分类时，那么多特征显然难以选择，但是如果代入这些特征得到的模型是一个稀疏模型，很多参数是0，表示只有少数特征对这个模型有贡献，绝大部分特征是没有贡献的，即使去掉对模型也没有什么影响，此时我们就可以只关注系数是非零值的特征。这相当于对模型进行了一次特征选择，只留下一些比较重要的特征，提高模型的泛化能力，降低过拟合的可能。
- L2正则化可以防止模型过拟合（overfitting）；一定程度上，L1也可以防止过拟合。
