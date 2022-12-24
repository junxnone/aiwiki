---
Title | ML AL Query Strategy
-- | --
Created @ | `2020-07-06T08:44:35Z`
Last Modify @| `2022-12-24T13:09:17Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/276)

---
# Query Strategy 查询/抽样 策略

## Reference
- [Human-in-the-Loop Machine Learning - Robert Munro](https://www.manning.com/books/human-in-the-loop-machine-learning#ref)
  - [uncertainty_sampling_example](http://robertmunro.com/uncertainty_sampling_example.html)
  - [Uncertainty_Sampling_Cheatsheet](http://robertmunro.com/Uncertainty_Sampling_Cheatsheet.pdf)
  - [Diversity_Sampling_Cheatsheet](http://robertmunro.com/Diversity_Sampling_Cheatsheet.pdf)
- [主动学习在风控中的应用（理论篇）](https://zhuanlan.zhihu.com/p/97974495)

## Brief
- 抽样策略一般是针对目标任务进行设计，不具备普适性
- [Pool-Based Sampling](/AL_Pool_Based_Sampling)
- [Stream-based Selective Sampling](/AL_Stream_based_Selective_Sampling)

---
Query Strategy | Description
-- | --
Random Sampling |  随机采样 - 随机选择样本
[Uncertainty Sampling](/AL_Uncertainty_Sampling)  | 不确定性策略  - 根据不确定性(Confidence/Margin/Entropy)选择模型中难以区分的样本
[QBC - Query by Committee](/AL_QBC) | 委员会投票 - 通过多个模型投票来选择较难区分的样本
Expected Model Change <br> EGL - Expected Gradient Length| 选择那些使得梯度变化最大的样本
Expected Error Reduction | 选择那些通过增加一个样本就使得 loss 函数减少最多的样本
Variance Reduction | 方差最小 - 选择那些方差减少最多的样本 - `closed-form`
Density-Weighted Methods | 考虑样本分布 - 将选择样本和所有输入样本的平均相似度作为权重


