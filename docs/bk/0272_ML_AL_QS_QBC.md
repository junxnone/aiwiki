-----

| Title         | ML AL QS QBC                                          |
| ------------- | ----------------------------------------------------- |
| Created @     | `2020-10-20T01:22:42Z`                                |
| Last Modify @ | `2022-12-24T13:12:46Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/272) |

-----

## Brief

  - 多个 `模型` 构成 `委员会`
  - 委员会投票选出样本进行标注

| Algos                                       | 公式                                                           |
| ------------------------------------------- | ------------------------------------------------------------ |
| **vote entropy**                            | ![image](media/5c0226479d5362c7ebbd29f10fc96806635d175a.png) |
| **KL(Kullback-Leibler) divergence**<br>KL散度 | ![image](media/3529db2e642ceebfb5bdae3a7445b80390562a20.png) |
| soft vote entropy                           | ![image](media/a7064e88cecfc1e2d89193ac64ea4612493c90a5.png) |

  - `vote()` - 某 label 获取的票数
  - `C` - 委员会成员个数
  - KL 散度可以衡量两个概率之间的“距离”，因此可以用 KL 散度计算出那些偏差较大的数据样本。

## History

  - 1992 [Query by
    committee](https://dl.acm.org/doi/pdf/10.1145/130385.130417)
  - 1995 [Committee-Based Sample Selection for Probabilistic
    Classifiers](https://arxiv.org/pdf/1106.0220.pdf)
  - 1998 [Employing EM in pool-based active learning for text
    classification](http://www.cs.cmu.edu/~knigam/papers/emactive-icml98.pdf)
  - 1998 [Query learning strategies using boosting and
    bagging](https://www.researchgate.net/profile/Naoki_Abe2/publication/221345332_Query_Learning_Strategies_Using_Boosting_and_Bagging/links/5441464b0cf2e6f0c0f60abf/Query-Learning-Strategies-Using-Boosting-and-Bagging.pdf)
  - 2007 [Active learning for regression based on query by
    committee](http://dl.ifip.org/db/conf/ideal/ideal2007/BurbidgeRK07.pdf)
