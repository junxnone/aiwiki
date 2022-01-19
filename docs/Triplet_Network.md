---
Title | Triplet Network
-- | --
Create Date | `2019-02-20T09:43:34Z`
Update Date | `2022-01-19T07:08:20Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/156)

---
## Reference

- [论文笔记：Triplet Network](https://blog.csdn.net/hongbin_xu/article/details/83064290)
- [Triplet-Loss原理及其实现、应用](https://blog.csdn.net/u013082989/article/details/83537370)
- [How to Train Triplet Networks with 100K Identities?](https://arxiv.org/abs/1709.02940)
- [论文水记|How to Train Triplet Networks with 100K Identities?](https://blog.csdn.net/bea_tree/article/details/78106497)

## Brief

- Triplet Network是Siamese Network的一种延伸，要解决的问题与Siamese Network的基本一致。
- 将图像映射到某个特征空间中，其中两幅图像输入CNN得到的特征向量之间的欧式距离即为相似度。
- 与Siamese Network不同的是，Triplet Network采用三个样本为一组：一个参考样本，一个同类样本，一个异类样本。
- 在contrastive loss的基础之上构建了一个新的loss函数，就是保持类内和类间距离有一个距离限制（margin）。


![image](https://user-images.githubusercontent.com/2216970/53081395-bf44b280-3535-11e9-99ef-b2a910fec8b5.png) | - Tripelet Network由3个相同的前馈神经网络（彼此共享参数）组成<br>- 每次输入三个样本, 网络会输出两个值: 候选样本与同类样本，候选样本与异类样本，在embedding层的特征向量的L2距离 <br>- 假设输入为: x, 候选样本: x− 异类样本: x+<br>- 这个网络对x− 和x+ 相对于x 的距离进行了编码
-- | :--

## Triplet loss
> Triplet Loss，即三元组损失，用于训练差异性较小的数据集，数据集中标签较多，标签的样本较少。输入数据包括锚（Anchor）示例⚓️、正（Positive）示例和负（Negative）示例，通过优化模型，使得锚示例与正示例的距离小于锚示例与负示例的距离，实现样本的相似性计算。其中锚示例是样本集中随机选取的一个样本，正示例与锚示例属于同一类的样本，而负示例与锚示例属于不同类的样本。

![image](https://user-images.githubusercontent.com/2216970/53114261-57668a00-357e-11e9-8852-99bcef1cc929.png)

triplet loss的优势在于细节区分，即当两个输入相似时，triplet loss能够更好地对细节进行建模，相当于加入了两个输入差异性差异的度量，学习到输入的更好表示，从而在上述两个任务中有出色的表现。当然，triplet loss的缺点在于其收敛速度慢，有时不收敛。

- an anchor(基准正例)
- a positive of the same class as the anchor （正例）
- a negative of a different class （负例）
- 两个具有同样标签的样本，他们在新的编码空间里距离很近。
- 两个具有不同标签的样本，他们在新的编码空间里距离很远。

<img src="https://user-images.githubusercontent.com/2216970/53111569-4155cb00-3578-11e9-8f62-0901eb3188da.png" alt="alt text" width="50%" height="50%">


`L=max(d(a,p)−d(a,n)+margin,0)`

- 最终的优化目标是拉近 a, p 的距离， 拉远 a, n 的距离
- easy triplets: L=0 即 d(a,p)+margin<d(a,n)，这种情况不需要优化，天然a, p的距离很近， a, n的距离远
- hard triplets: d(a,n)<d(a,p), 即a, p的距离远
- semi-hard triplets: d(a,p)<d(a,n)<d(a,p)+margin, 即a, n的距离靠的很近，但是有一个margin
<img src="https://user-images.githubusercontent.com/2216970/53113186-f473f380-357b-11e9-8903-9691177e642a.png" alt="alt text" width="50%" height="50%">
