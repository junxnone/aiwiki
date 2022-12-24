---
Title | ML AutoML HPO BO SMBO
-- | --
Created @ | `2021-03-22T06:58:23Z`
Last Modify @| `2022-12-24T13:20:42Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/218)

---
## Reference
- [Sequential Model-Based Optimization for General Algorithm Conﬁguration](https://www.cs.ubc.ca/~hutter/papers/10-TR-SMAC.pdf)
- [Demo - Maximize  Target Function ](https://nbviewer.jupyter.org/github/junxnone/examples/blob/master/BayesianOptimization/BayesianOptimization_visualization.ipynb)

## Brief
- SMBO - Sequential model-based optimization
- 类似于 Active Learning
- 顺序模型
- 只能处理数值参数
- 无早停机制

## Pipeline

![image](https://user-images.githubusercontent.com/2216970/87404302-8dcbfb80-c5f0-11ea-8615-a1186e57fe43.png) 

Name | Description
-- | --
θ | 输入(参数集合)
f | loss function(HPO 中为 metrics[loss/accuracy/iou])
M0/Mt | 分布模型 - GP
S | 查询函数 EI/PI/GP-UCB/etc.
H | Obvervation History/历史观测值


Steps | Description
-- | --
1 | θ 参数集合加入到 History中
2 | 迭代 T 次
3 | 通过 S 选出点 x*
4 | 使用 x* 训练 f
5 | 把获取的经验 (x*, f(x*)) 加入到 H
6 | 更新 M
7 | 获取最终 H (经验list)

## Examples

Target Function | ![image](https://user-images.githubusercontent.com/2216970/113120283-025cce00-9244-11eb-9430-977ff4b643be.png)
-- | --
Random 2 points + 1 step | ![image](https://user-images.githubusercontent.com/2216970/113120412-25877d80-9244-11eb-91a9-ed5899af3037.png)
Next Step | ![image](https://user-images.githubusercontent.com/2216970/113120512-3df79800-9244-11eb-80b2-534ebb8480a7.png)
Next Step | ![image](https://user-images.githubusercontent.com/2216970/113120569-4ea80e00-9244-11eb-806c-6b52973ac23b.png)
Next Step | ![image](https://user-images.githubusercontent.com/2216970/113120588-57004900-9244-11eb-9695-13facb4670f8.png)
Next Step | ![image](https://user-images.githubusercontent.com/2216970/113120634-61bade00-9244-11eb-81e5-1978f7610d2f.png)
Next Step | ![image](https://user-images.githubusercontent.com/2216970/113120692-6e3f3680-9244-11eb-86eb-ca8aa5c74d67.png)
Next Step | ![image](https://user-images.githubusercontent.com/2216970/113120723-76977180-9244-11eb-947c-cd3fa268c83b.png)
Next Step | ![image](https://user-images.githubusercontent.com/2216970/113120753-7eefac80-9244-11eb-9644-bbf58c20d4cd.png)
Next Step | ![image](https://user-images.githubusercontent.com/2216970/113120786-8616ba80-9244-11eb-8222-a3c64c4ec435.png)





