-----

| Title     | ML Op Convolution ConvFlops                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2020-05-19T08:19:49Z`                                |
| Updated @ | `2023-03-25T16:03:48Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/396) |

-----

## Convolution Flops

| Name               | Values                                  | Description |
| ------------------ | --------------------------------------- | ----------- |
| Input              | `Channels x W x H`                      |             |
| Conv Kernel        | `K1 x K2`                               |             |
| Padding            | `P1 x P2`                               |             |
| Stride             | `S1 x S2`                               |             |
| filter             | `N`                                     |             |
| Hout               | `Hout = [(H - K1 + 2P1) / S1] + 1`      |             |
| Wout               | `Wout = [(W - K2 + 2P2) / S2] + 1`      |             |
| Output Feature Map | `N x Hout x Wout`                       |             |
| 总计算量               | `2N x Hout x Wout x Channels x K1 x K2` |             |
| 乘法计算量              | `N x Hout x Wout x Channels x K1 x K2`  |             |
| 加法计算量              | `N x Hout x Wout x Channels x K1 x K2`  |             |
| 总参数量               | `N x Channels x K1 x K2 + N`            |             |
| Bias 参数量           | `N`                                     |             |
| 卷积核参数量             | `N x Channels x K1 x K2`                |             |

## Reference

  - [深度学习之（经典）卷积层计算量以及参数量总结
    （考虑有无bias，乘加情况）](https://www.cnblogs.com/qinduanyinghua/p/11302618.html)
  - [cs231n - conv
    demo](https://cs231n.github.io/assets/conv-demo/index.html)
