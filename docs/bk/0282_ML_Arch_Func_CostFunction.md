-----

| Title     | ML Arch Func CostFunction                             |
| --------- | ----------------------------------------------------- |
| Created @ | `2018-12-12T09:57:45Z`                                |
| Updated @ | `2026-11-26T08:33:46Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/282) |

-----

# Cost Function 代价函数

## 代价函数(Cost function)

  - 定义在整个训练集上面的，也就是所有样本的误差的总和的平均，也就是损失函数的总和的平均，有没有这个平均其实不会影响最后的参数的求解结果。
  - Total Loss

$$ J(\\theta)=\\frac{1}{N}\\sum\_{i=1}^{N}\\ell\\big(y\_i,\\
\\hat{y}\_i\\big) $$

其中：

  - $N$：训练样本数；$\\ell(\\cdot,\\cdot)$：单个样本的损失函数
  - $y\_i$：第 $i$ 个样本的真值；$\\hat{y}\_i$：模型对它的预测
  - $J(\\theta)$：代价函数，$\\theta$ 为模型参数
  - 去掉 $\\frac1N$ 只是整体缩放 $N$ 倍，不改变使 $J$ 最小的 $\\theta$，但会影响学习率的合适取值

## Cost Function vs Loss Function

| Name          | 计算数据              | Description |
| ------------- | ----------------- | ----------- |
| Cost Function | 所有数据误差            | Total Loss  |
| Loss Function | 单个数据或者 Batch数据 误差 | Batch Loss  |

表中：

  - **计算数据**：函数覆盖的样本范围；**Description**：对应的叫法
  - 对比结论：Loss 是「一个样本（或一个 batch）的误差」，Cost 是「全体样本误差的平均」；训练中日志里看到的通常是 batch
    loss 的滑动平均

## mini-batch 近似

整个训练集上的代价难以每步都精确计算，实践中用一个 batch 近似：

$$ J(\\theta)\\approx J\_B(\\theta)=\\frac{1}{|B|}\\sum\_{i\\in
B}\\ell\\big(y\_i,\\ \\hat{y}\_i\\big) $$

其中：

  - $B$：随机抽取的一个 mini-batch；$|B|$：其样本数
  - $J\_B$：batch 上的损失，是 $J$ 的无偏估计，用于随机梯度下降（SGD）的每一步更新

更多概念见 [Loss/Cost/Object
Function](https://github.com/junxnone/aiwiki/issues/378)。

## Reference

  - [损失函数(Loss function)和代价函数(成本函数)(Cost
    function)的区别与联系](https://blog.csdn.net/uestc_c2_403/article/details/77387780)
  - [【机器学习】代价函数（cost
    function）](https://www.cnblogs.com/Belter/p/6653773.html)
