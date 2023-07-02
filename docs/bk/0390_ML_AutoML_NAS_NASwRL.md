-----

| Title     | ML AutoML NAS NASwRL                                  |
| --------- | ----------------------------------------------------- |
| Created @ | `2020-07-20T06:36:15Z`                                |
| Updated @ | `2023-03-25T14:45:11Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/390) |

-----

## Neural Architecture Search with Reinforcement Learning

  - 第一篇比较正式的 RL-Based NAS paper
  - RL
      - Agent - RNN - Controller - `A variable-length String`
      - Reward - Accuracy
      - Policy Gradient
  - REINFORCE rule - Williams - 1992
  - Attention - `set-selection`

## Pipeline

![image](media/1b43b8143092c46c38d313589a5b413c91059d9a.png)

| without skip-connections                                     | \+ skip-connections                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/c27da0f3cc7e6f7cd6fdcc16c796e76c671392b3.png) | ![image](media/d5cbe8b82e300289c615b24f3f626664a0779328.png) |

## Training

  - Reward - Accuracy - 不可微 --\> Policy Gradient --\> REINFORCE --\>
    Update `θc`

| Name                    | Formula                                                      |
| ----------------------- | ------------------------------------------------------------ |
| Reward                  | ![image](media/71d10891da08c2fa1c54489ffa55d74dac6fbb5d.png) |
| REINFORCE               | ![image](media/732b046f4994e5fa77bba51d0e0a3a36953e820f.png) |
| empirical approximation | ![image](media/aaaf0f77e89a551a4386aa2158ff41b0ae205dd8.png) |
| with Baseline Function  | ![image](media/b052953192fafed9b12b5875864f3822f845d4ca.png) |

  - m - 子网络数量/batch
  - T - 超参数数量/子网络
  - Rk - 第 `k` 个子网络 Accuracy
  - b - 之前子网络准确率的指数移动平均值

| Parallelism and Asynchronous Updates                         |
| ------------------------------------------------------------ |
| ![image](media/b53d0faac8453f2f3fce3fc044c07a9aef11b82b.png) |

### Skip-Connections

  - 第 N Layer `+Anchor Point` = `N-1 sigmoids` - 指定之前 `N-1 Layer` 的连接关系
  - `Compilation Failures` - 当 Layer 与其他 Layer 不兼容, 或者 Layer 没有输入或者输出时
      - 如果没有输入, 则使用 `Input Layer`
      - 最后一个 Layer 和所有没被连接的 Layer concat 送入分类器
      - concat 不同大小的输入, `0-padding` 比较小的 Layer

| 当前RNN 状态和前 `N-1` Anchor Point 函数 | ![image](media/4d8d8e743f6596155718b1d340d1cc8cc7cebc5f.png) |
| -------------------------------- | ------------------------------------------------------------ |
| hj                               | RNN 第 `j` 层 Anchor Point 隐藏状态                                |
| j                                | `0 ~ N-1`                                                    |

### RNN Cell

| RNN Cell 1 - Base Cell | ![image](media/49c0b8fe538065240994fc083a906b1efa6cd45f.png) |
| ---------------------- | ------------------------------------------------------------ |
| RNN Cell 2 - LSTM      | ![image](media/75424c791fd5a0633e3e261005b25c1f10972a71.png) |
| Input                  | Base Cell - xt/ht-1<br> LSTM - xt/ht-1/ct-1                  |
| Output                 | Base Cell - ht<br> LSTM - ht/ct                              |
| Combination method     | Addition/Elementwise/Multiplication                          |
| Activation Function    | tanh/sigmoid                                                 |

## Reference

  - [paper - 2016 - Neural Architecture Search with Reinforcement
    Learning](https://arxiv.org/pdf/1611.01578.pdf)
  - [AutoDL论文解读（一）：基于强化学习的开创性工作](https://blog.csdn.net/u014157632/article/details/101721343)
  - [论文笔记《Neural Architecture Search With Reinforcement
    Learning》](https://blog.csdn.net/Sugar_girl/article/details/89516578)
  - [NAS详解](https://zhuanlan.zhihu.com/p/52471966)
