---
Title | ML DataNorm
-- | --
Created @ | `2018-09-12T04:02:02Z`
Last Modify @| `2022-12-24T12:28:38Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/251)

---
## Reference

- [机器学习中的标准化/归一化](https://blog.csdn.net/index20001/article/details/78044971)
- [ML 入门：归一化、标准化和正则化](https://blog.csdn.net/dengdengma520/article/details/79630146)
- [Normalization(标准化)的原理和实现详解](https://blog.csdn.net/u011092188/article/details/78174804)
- [数据标准化（一） - Z-Score标准化](https://blog.csdn.net/Orange_Spotty_Cat/article/details/80312154)
- [深入理解L1、L2正则化原理与作用](https://www.cnblogs.com/zingp/p/10375691.html)
- [机器学习中正则化项L1和L2的直观理解](https://blog.csdn.net/jinping_shi/article/details/52433975)
- [为什么正则化能够降低过拟合](https://hit-scir.gitbooks.io/neural-networks-and-deep-learning-zh_cn/content/chap3/c3s5ss2.html)
- [正则化](https://hit-scir.gitbooks.io/neural-networks-and-deep-learning-zh_cn/content/chap3/c3s5ss1.html)
- [正则化方法：L1和L2 regularization、数据集扩增、dropout](https://blog.csdn.net/u012162613/article/details/44261657)
- [机器学习中的范数规则化之（一）L0、L1与L2范数](https://blog.csdn.net/zouxy09/article/details/24971995)

## Brief

数据的标准化（normalization）是将数据按比例缩放，使之落入一个小的特定区间。

因为我们得到的样本数据中可能一个特征向量的某几个元素的值非常大，使得特征数据不在一个数量级，因此必须限定在一个合适的范围内。归一化就是为了后面数据处理的方便，其次是保证程序运行时收敛加
快。

- 归一化 Normalization
- 标准化 Normalization
- 正则化 Regularization
> 归一化和标准化的英文翻译是一致的，但是根据其用途（或公式）的不同去理解（或翻译）

## 线性归一化（min-max normalization）

也叫离差标准化，是对原始数据的线性变换，使结果落到[0，1]区间
该方法将某个变量的观察值减去该变量的最小值，然后除以该变量的离差，其标准化的数值落到[0,1]区间

```
x’=(x-min)/(max-min)
```
其中max为样本的最大值，min为样本的最小值。

该方法对原始数据进行线性变换，保持原始数据之间的联系，其缺陷是当有新数据加入时，可能导致max或min的变化，转换函数需要重新定义。


## 标准差标准化/ 零均值标准化/ z-score standardization

将某变量中的观察值减去该变量的平均数，然后除以该变量的标准差，标准化后的数据符合标准正态分布，即均值为0，标准差为1，转化函数为：
```
x’=(x-μ)/σ
```
其中μ为所有样本数据的均值，σ为所有样本数据的标准差。

该方法对离群点不敏感，当原始数据的最大值、最小值未知或离群点左右了Max-Min标准化时非常有用，Z-Score标准化目前使用最为广泛的标准化方法。

## 小数定标（decimal scaling）标准化
该方法通过移动数据的小数点位置来进行标准化。小数点移动多少位取决于变量取值中的最大绝对值。将某变量的原始值x使用小数定标标准化到x’的转换函数为：
```
x’=x/(10^j)
```
其中，j是满足使max(|x’|)<1成立的最小整数。假设变量X的值由-986到917，它的最大绝对值为986，为使用小数定标标准化，我们用1000（即，j=3）除以每个值，这样，-986被标准化为-0.986。


## 非线性归一化


