-----

| Title     | ML Arch Func                                          |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-02-06T01:58:21Z`                                |
| Updated @ | `2023-02-06T01:58:21Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/378) |

-----

# Loss/Cost/ Object Function - 损失代价目标函数

  - 损失函数（Loss Function ）是定义在单个样本上的，算的是一个样本的误差。
  - 代价函数（Cost Function ）是定义在整个训练集上的，是所有样本误差的平均，也就是损失函数的平均。
  - 目标函数（Object Function）定义为：最终需要优化的函数。等于经验风险+结构风险（也就是代价函数 +
    正则化项）。代价函数最小化，降低经验风险，正则化项最小化降低结构风险
