---
Title | Siamese Network
-- | --
Create Date | `2019-02-20T09:20:21Z`
Update Date | `2022-01-19T07:08:04Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/153)

---


## Reference

- [PySOT](https://github.com/STVIR/pysot)
- [Siamese Network （原理篇）](https://blog.csdn.net/shenziheng1/article/details/81213668)
- [孪生网络Siamese Network发展历程](https://blog.csdn.net/donkey_1993/article/details/82220765)
- [Siamese network 孪生神经网络--一个简单神奇的结构](https://zhuanlan.zhihu.com/p/35040994)
- [精读深度学习论文(25) Siamese Network](https://zhuanlan.zhihu.com/p/39688993)
- [Siamese Network理解（附代码）](https://blog.csdn.net/sxf1061926959/article/details/54836696)
- [Siamese Neural Networks for One-shot Image Recognition](https://www.jianshu.com/p/152dae3a5563)


## Brief

- Siamese网络是一种**相似性度量方法**
  - **用于**当类别数多，但每个类别的样本数量少的情况下可用于类别的识别、分类等。
  - 传统分类方法是需要确切的知道每个样本属于哪个类，需要针对每个样本有确切的标签。而且相对来说标签的数量是不会太多的。当类别数量过多，每个类别的样本数量又相对较少的情况下，这些方法就不那么适用了。
- **主要思想**是通过一个函数将输入映射到目标空间，在目标空间使用简单的距离（欧式距离等）进行对比相似度。在训练阶段去最小化来自相同类别的一对样本的损失函数值，最大化来自不同类别的一堆样本的损失函数值。
- Siamese network就是“连体的神经网络”，神经网络的“连体”是通过共享权值来实现的. 即左右两个神经网络的权重一模一样。

> Siamese也就是“暹罗”人或“泰国”人。Siamese在英语中是“孪生”、“连体”的意思

## Arch
<img src="https://user-images.githubusercontent.com/2216970/150061361-b96fbf41-51e7-4742-b163-0c8a512cfe08.png" alt="alt text" width="50%" height="50%"> | - 孪生神经网络有两个输入 <br>- 两个输入进入两个神经网络 <br>- 输入映射到新空间形成新表示<br>- 计算Loss来评价输入相似度。
-- | :-- 

- **伪孪生神经网络/Pseudo-Siamese Network**
  - 左右两边不共享权值
  - 可以是不同的神经网络(LSTM/CNN), 也可以是相同类型的神经网络。

Network | siamese network | pseudo-siamese network
-- | -- | --
Diff | 处理两个输入"比较类似"的情况 | 处理两个输入"有一定差别"的情况
UseCase | - 比较两张图片  | - 验证标题与正文的描述是否一致<br>- 文字是否描述了一幅图片




- 输入不再是单个样本，而是一对样本，不再给单个的样本确切的标签，而且给定一对样本是否来自同一个类的标签，是就是0，不是就是1 
- 设计了两个一模一样的网络，网络共享权值W，对输出进行了距离度量，可以说l1、l2等。 
- 针对输入的样本对是否来自同一个类别设计了损失函数，损失函数形式有点类似交叉熵损失
- 优点是淡化了标签，使得网络具有很好的扩展性，可以对那些没有训练过的类别进行分类，这点是优于很多算法的。而且这个算法对一些小数据量的数据集也适用，变相的增加了整个数据集的大小，使得数据量相对较小的数据集也能用深度网络训练出不错的效果。


## 应用
- 图像匹配
- 图像块匹配
- 视频跟踪

