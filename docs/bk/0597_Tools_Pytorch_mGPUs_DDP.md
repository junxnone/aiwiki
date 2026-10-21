-----

| Title     | Tools Pytorch mGPUs DDP                               |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-21T07:56:27Z`                                |
| Updated @ | `2026-10-21T07:56:27Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/597) |

-----

# DDP - DistributedDataParallel 底层机制

Tools Pytorch mGPUs 一文讲了 DDP
的用法；本文展开它内部的两个关键设计——梯度分桶（Bucketing）和计算通信重叠（Overlap）——这两点是
DDP 相比 DataParallel 扩展性好得多的根本原因。

## Ring All-Reduce：不依赖中心节点的梯度同步

DDP 每个进程各自维护一份完整模型副本，反向传播后需要把所有进程上的梯度**同步成一致的平均值**，这一步用的通信原语是
All-Reduce。朴素实现（比如所有进程把梯度发给一个中心节点求平均再广播回去）会让中心节点变成带宽瓶颈；**Ring
All-Reduce** 把所有进程排成一个逻辑环，每个进程只和左右相邻的两个进程通信，分两个阶段（Scatter-Reduce +
All-Gather）各走 N-1 步完成全局同步——每个节点的通信量和进程数 N 无关（约为 $2(N-1)/N$
倍数据量），不会随着卡数增多而出现带宽瓶颈，这是它被广泛采用的原因。

## 梯度分桶（Bucketing）：减少通信次数

如果每算完一个参数的梯度就立刻发起一次 All-Reduce，大量小尺寸通信会带来很高的调度开销（每次通信都有固定的启动延迟）。DDP
的做法是把参数的梯度划分成若干个**桶（Bucket，默认大小
25MiB）**，等一个桶里的全部梯度都算完了，才对这个桶整体发起一次
All-Reduce——用更大的单次通信量摊薄固定的调度开销。

## 计算通信重叠（Overlap）：反向传播没结束，同步已经在路上

DDP 真正的性能关键，是**不等整个反向传播跑完再统一做梯度同步**：框架给每个参数的梯度计算挂了一个 autograd
钩子（hook），某个桶内的全部梯度一旦就绪，就立刻异步发起这个桶的
All-Reduce，同时反向传播继续往前面的层计算——梯度同步的通信时间和反向传播剩余部分的计算时间重叠在一起，而不是严格的"先算完、再同步"两段式串行。

反向传播是从输出层往输入层方向算梯度的，所以 DDP 按**反向顺序**组织分桶（最先完成梯度计算的靠后层参数，分到编号靠前、最先触发
All-Reduce 的桶），尽量让分桶就绪的顺序和梯度实际算出来的顺序对齐，最大化重叠窗口。

## 为什么这些设计重要

反向传播中的 All-Reduce 通信，是 DDP
训练里最耗时的环节之一——如果没有分桶和重叠这两个优化，梯度同步会变成一段纯粹串行叠加在计算之后的开销，训练吞吐会随着模型变大、参数变多而显著下降。这也是为什么
DDP 的扩展性明显优于单进程多线程的 DataParallel（DataParallel 不仅有 GIL 限制，也没有这套分桶+重叠机制）。

## Reference

  - [PyTorch Distributed: Experiences on Accelerating Data Parallel
    Training（PyTorch
    团队论文，VLDB 2020）](https://www.vldb.org/pvldb/vol13/p3005-li.pdf)
  - [DistributedDataParallel — PyTorch
    官方文档](https://docs.pytorch.org/docs/stable/generated/torch.nn.parallel.DistributedDataParallel.html)
  - [Tools Pytorch mGPUs](0338_Tools_Pytorch_mGPUs)
