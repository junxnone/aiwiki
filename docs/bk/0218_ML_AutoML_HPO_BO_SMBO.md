-----

| Title         | ML AutoML HPO BO SMBO                                 |
| ------------- | ----------------------------------------------------- |
| Created @     | `2021-03-22T06:58:23Z`                                |
| Last Modify @ | `2022-12-24T13:20:42Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/218) |

-----

## Reference

  - [Sequential Model-Based Optimization for General Algorithm
    Conﬁguration](https://www.cs.ubc.ca/~hutter/papers/10-TR-SMAC.pdf)
  - [Demo - Maximize Target Function
    ](https://nbviewer.jupyter.org/github/junxnone/examples/blob/master/BayesianOptimization/BayesianOptimization_visualization.ipynb)

## Brief

  - SMBO - Sequential model-based optimization
  - 类似于 Active Learning
  - 顺序模型
  - 只能处理数值参数
  - 无早停机制

## Pipeline

![image](media/47f5817ab33cba76c67124ce4adcc6d5df775ade.png)

| Name  | Description                                        |
| ----- | -------------------------------------------------- |
| θ     | 输入(参数集合)                                           |
| f     | loss function(HPO 中为 metrics\[loss/accuracy/iou\]) |
| M0/Mt | 分布模型 - GP                                          |
| S     | 查询函数 EI/PI/GP-UCB/etc.                             |
| H     | Obvervation History/历史观测值                          |

| Steps | Description                |
| ----- | -------------------------- |
| 1     | θ 参数集合加入到 History中         |
| 2     | 迭代 T 次                     |
| 3     | 通过 S 选出点 x\*               |
| 4     | 使用 x\* 训练 f                |
| 5     | 把获取的经验 (x\*, f(x\*)) 加入到 H |
| 6     | 更新 M                       |
| 7     | 获取最终 H (经验list)            |

## Examples

| Target Function          | ![image](media/34ae74b74dc55c65eed0f99eab78e8b80450bcbd.png) |
| ------------------------ | ------------------------------------------------------------ |
| Random 2 points + 1 step | ![image](media/cbabecc3b5e263c2415f029d1f0d2e9966ca51e5.png) |
| Next Step                | ![image](media/17debae34b6d35b5b387c4b0d62fe4076a1ff154.png) |
| Next Step                | ![image](media/eb24164842b9414706a7eaf4e273dca1fb81364b.png) |
| Next Step                | ![image](media/f18710ff741bb705a6d5d785f578b9f9360b5b5a.png) |
| Next Step                | ![image](media/bc91e7532c1a981787e90952e330cc2c6e9b3db2.png) |
| Next Step                | ![image](media/3db6f92b9f7a2b38793a691f7086bbbe7f77762a.png) |
| Next Step                | ![image](media/43c38a6a40c7d8191499ebf7aa92045a0d94795d.png) |
| Next Step                | ![image](media/57b783482916d9a965c7b5c851543bcf7ed1256a.png) |
| Next Step                | ![image](media/dc94f4344dab6a5a310fe8b66542d1594ef35c5b.png) |
