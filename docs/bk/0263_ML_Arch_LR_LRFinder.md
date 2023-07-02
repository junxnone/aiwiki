-----

| Title     | ML Arch LR LRFinder                                   |
| --------- | ----------------------------------------------------- |
| Created @ | `2019-09-03T09:29:52Z`                                |
| Updated @ | `2023-02-02T08:54:44Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/263) |

-----

# 学习率选择

## Reference

  - [调参如何为神经网络选择最合适的学习率lr-LRFinder-for-Keras](https://blog.csdn.net/m0_37477175/article/details/89395050)
  - [Github -
    keras\_lr\_finder](https://github.com/surmenok/keras_lr_finder)

## Brief

  - 最佳 learning rate 选择

## Steps

  - 从一个较低的学习率开始训练一个网络，并以指数级增长每一批的学习率, 记录每个批次的学习率和训练损失。
  - 绘制损失和学习率
  - 在低学习率的情况下，损失会缓慢地改善，然后训练会加速，直到学习率过大，损失上升:训练过程会出现分歧。
  - 在图上选择一个损失下降最快的点作为学习率初始值。

![image](media/d975d3ff4e6acc9c013d662faab4a0e39fa7dc09.png)
