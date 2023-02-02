---
Title | ML Arch LR OCP
-- | --
Created @ | `2019-09-03T09:39:35Z`
Updated @| `2023-02-02T08:54:51Z`
Labels | `index`
Edit @| [here](https://github.com/junxnone/aiwiki/issues/264)

---
# One Cycle Policy

## Reference

- [The 1cycle policy](https://sgugger.github.io/the-1cycle-policy.html)
- [Cyclic Learning Rates和One Cycle Policy-Keras](https://blog.csdn.net/m0_37477175/article/details/89400436)
- [1cycle策略：实践中的学习率设定应该是先增再降](https://www.jiqizhixin.com/articles/041905)
- [paper - A disciplined approach to neural network hyper-parameters: Part 1 -- learning rate, batch size, momentum, and weight decay](https://arxiv.org/pdf/1803.09820.pdf)
- [callbacks.one_cycle - fastai](https://docs.fast.ai/callbacks.one_cycle.html)

## Brief
- One Cycle Policy 动机是，在学习过程中，当学习速率较高时，学习速率作为正则化方法发挥作用，防止网络过度拟合。

## Steps

- **1 先用 [[LRFinder]] 找到最大的学习速率max_lr**
  - 选择最小loss 之前，loss 在下降的那段值，如图 10<sup>−2</sup> ~ 3×10<sup>−2</sup> 
![image](https://user-images.githubusercontent.com/2216970/64398683-46074a00-d098-11e9-8802-a6461acb242c.png)
>  Plot the losses against the learning rates and pick a value a bit before the minimum, where the loss still improves. Here for instance, anything between 10−2 and 3×10−2 seems like a good idea.
- **2 base_lr 选择 `max_lr/10`** 

![image](https://user-images.githubusercontent.com/2216970/64162226-83d65980-ce71-11e9-862a-387a87275d52.png)


- the batch size should be set to the highest possible value to fit in the available memory
- never forget to re-run the Learning Rate Finder
