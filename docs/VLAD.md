---
Title | VLAD
-- | --
Create Date | `2019-02-19T15:23:32Z`
Update Date | `2022-01-19T07:08:10Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/154)

---

## Reference 

- [VLAD算法简介](https://blog.csdn.net/o3279/article/details/81221881)
- [论文笔记 - NetVLAD: CNN architecture for weakly supervised place recognition](https://blog.csdn.net/qq_32417287/article/details/80102466#netvlad-a-generalized-vlad-layer-fvlad)
- [NetVLAD: CNN architecture for weakly supervised place recognition](https://arxiv.org/abs/1511.07247)
- [图像检索与降维（一）：VLAD](https://blog.csdn.net/LiGuang923/article/details/85416407)
- [图像检索与降维（二）：NetVLAD](https://blog.csdn.net/LiGuang923/article/details/85470289)
- [图像检索——VLAD](http://www.cnblogs.com/mafuqiang/p/6909556.html)
- [BoW用于图像检索的一般化流程](https://blog.csdn.net/polly_yang/article/details/8241471)
- [Bow模型](https://www.cnblogs.com/scnucs/p/3161961.html)
- [视觉词典BOW小结](https://blog.csdn.net/darlingqiang/article/details/81358531)
- [Fisher Vector（FV）原理](https://blog.csdn.net/u011501388/article/details/78410705)
- [Fisher Vector](https://zhuanlan.zhihu.com/p/23002901)

## Brief
> Vector of Locally Aggregated Descriptors , 由Jegou et al.在2010年提出，其核心思想是aggregated(积聚)，主要应用于图像检索领域 

在深度学习时代之前，图像检索领域以及分类主要使用的常规算法有BoW、Fisher Vector及VLAD等。
- **BoW**: 核心思想是提取出关键点描述子后利用聚类的方法训练一个码本，随后每幅图片中各描述子向量在码本中各中心向量出现的次数来表示该图片，该方法的缺点是需要码本较大
- **FV**: 核心思想是利用高斯混合模型(GMM)，通过计算高斯混合模型中的均值、协方差等参数来表示每张图像。该方法的优点是准确度高，但缺点是计算量较大
- **VLAD**: 可以看做是一种简化的FV，其主要方法是通过聚类方法训练一个小的码本，对于每幅图像中的特征找到最近的码本聚类中心，随后所有特征与聚类中心的差值做累加，得到一个k*d的vlad矩阵，其中k是聚类中心个数，d是特征维数(如sift是128维),随后将该矩阵扩展为一个(k*d)维的向量，并对其L2归一化，所得到的向量即为VLAD。
- **NetVLAD**: 在VLAD算法的基础上Arandjelovic et al.在 All about VLAD 一文中提出了一种改进方法。随后，其又结合深度卷积神经网络的相关内容，提出了NetVLAD。



## VLAD
VLAD的优点：
- 提出一种图像表示方法，在拥有合理的向量维度下，具有很好的搜索准确率。
- 联合优化降维和索引效率。

### Steps
1. 读取图片文件路径及特征提取
2. 使用聚类方法训练码本
3. 将每张图片的特征与最近的聚类中心进行累加
4. 对累加后的VLAD进行PCA降维并对其归一化
5. 得到VLAD后，使用ADC方法继续降低储存空间和提高搜索速度
> 其中步骤4、5可选，在步骤3得到残差累加向量后进行L2归一化即可用欧氏距离等计算两张图片的相似性从而实现图片检索
**VLAD 实现**
- [C++](https://github.com/Lithogenous/VLAD-ORB-Cpp)
- [Python](https://github.com/Lithogenous/VLAD-SIFT-python)

## NetVLAD
> 带有VLAD层的卷积神经网络结构
- NetVLAD层，是一种受VLAD灵感激发的可泛化的VLAD层。
- 基于弱监督排序损失，提出了一种可训练的方法用于学习这种端到端框架的参数。

## NetRVLAD

## NetFV

## Soft-DBoW

## BOW

1. 特征提取。在训练阶段，将图像用很多“块”（patch）表示，以SIFT特征为例，图像中每个关键点就是一个patch，每一个patch特征向量的维数128。
2. 字典构建。假设共有M幅训练图像，字典的大小为100，即有100个词，用K-均值算法对所有的patch进行聚类，等k-均值收敛时，将得到每一个聚类最后的质心，这100个质心（维数128）就是词典里的100个词，词典构建完毕。
3. 字典表示。在测试阶段，对每幅图像初始化一个维数100、值全为0的直方图，计算测试图像每个patch与字典中单词的距离，距离patch最近的单词对应的直方图计数加1，将所有patch计算完毕后的直方图即为图像的字典表示。
4. 图像检索。训练图与测试图都以100维向量表示，对每个待检索图像，只需在字典中计算所有训练图与其距离，并返回最近的若干幅即可。

![image](https://user-images.githubusercontent.com/2216970/53412040-2e714980-3a03-11e9-97d7-0d7d5ee4ea06.png)

## FV - Fisher Vector
> 一种类似于BOVW词袋模型的一种编码方式，如提取图像的SIFT特征，通过矢量量化（KMeans聚类），构建视觉词典（码本），FV采用混合高斯模型（GMM）构建码本，但是FV不只是存储视觉词典的在一幅图像中出现的频率，并且FV还统计视觉词典与局部特征（如SIFT）的差异。


