---
Title | Bayesian Optimization
-- | --
Create Date | `2021-09-09T02:22:17Z`
Update Date | `2022-01-20T02:06:24Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/22)

---
## Reference
- [2011 Algorithms for Hyper-Parameter Optimization](https://papers.nips.cc/paper/2011/file/86e8f7ab32cfd12577bc2619bc635690-Paper.pdf)
- [Github repo - fmfn/BayesianOptimization](https://github.com/fmfn/BayesianOptimization)
- [贝叶斯优化(Bayesian Optimization)深入理解](https://developer.aliyun.com/article/661786)
- [NNI 中的 BOHB Advisor](https://nni.readthedocs.io/zh/latest/Tuner/BohbAdvisor.html)
- [cse515t - Bayesian Optimization](https://www.cse.wustl.edu/~garnett/cse515t/spring_2015/files/lecture_notes/12.pdf)
- [拟合目标函数后验分布的调参利器：贝叶斯优化](https://www.jiqizhixin.com/articles/2017-08-18-5)
- [AutoML HPO 学习笔记（一）- 贝叶斯优化](https://chengfeng96.com/blog/2019/09/08/%E8%B4%9D%E5%8F%B6%E6%96%AF%E4%BC%98%E5%8C%96%E7%AC%94%E8%AE%B0/)
- [贝叶斯优化/Bayesian Optimization](https://zhuanlan.zhihu.com/p/76269142)
- [贝叶斯优化(BayesianOptimization)](https://blog.csdn.net/Leon_winter/article/details/86604553)
- [贝叶斯优化 (Bayesian Optimization)](https://leovan.me/cn/2020/06/bayesian-optimization/)
- [Auto Machine Learning笔记 - Bayesian Optimization](http://codewithzhangyi.com/2018/07/31/Auto%20Hyperparameter%20Tuning%20-%20Bayesian%20Optimization/)


## 基础知识
- [高斯分布](/Gaussian_distribution)
- [高斯滤波](/Gaussian_Filter)
- [高斯过程](/Gaussian_Process)
- [贝叶斯定理](/贝叶斯定理)

## Brief
- Bayesian Optimization - 贝叶斯优化
- 用于非凸函数(不可求导)优化
- 基于 [Gaussian Processes - 高斯过程]
- 不适用于高维空间
- 基于随机性和概率分布
- [采集函数](/BO_Acquisition_Function)

![image](https://user-images.githubusercontent.com/2216970/111953074-16f0e600-8b21-11eb-80e5-412e41960269.png) | 
-- | 
**X = x1, x2, x3...xn** - 超参数
**f(x)**  - 黑盒函数/目标函数
**Acquisition Function**: 查询函数 选择 超参数
`argmin` - loss / `argmax` - accuracy...


## 分类

---
Name | Description
-- | --
BO | Bayesian Optimization
SMBO | Sequential model-based optimization 
BOHB | Bayesian Optimization Hyperband 
ROAR | Random Online Aggressive Racing
SMAC | Sequential Model-based Algorithm Configuration
TPE | Tree-structured Parzen Estimator Approach


算法 | 代理函数 | 采集函数 | 优缺点 | Details
-- | -- | -- | -- | --
BO | 高斯过程 | Expected Improvement | 应用广泛，在低维空间表现出色
[SMBO](/BO_SMBO) |  | | 只能处理数值型参数
[BOBH](/BO_BOHB) | | | | Hyperband + Byesian Optimization/TPE
ROAR | 
[SMAC](/BO_SMAC) | 回归随机森林 | Upper Confidence Bound | 对离散型变量表现出色 | SMBO + 随机森林
[TPE](/BO_TPE) | 高斯混合模型 | Expected Improvement | 高维空间表现出色，有论文表明最实用

## BO

![image](https://user-images.githubusercontent.com/2216970/87519205-dac4d600-c6b3-11ea-9013-14ffcf2b5c79.png) | ![BO](https://raw.githubusercontent.com/fmfn/BayesianOptimization/master/examples/bayesian_optimization.gif)
-- | --

---
- `t=3` 两个历史值(黑点), 一个新值(红点)
- 目标函数(黑色虚线)
- 代理模型目标函数均值(黑色实线)
- 代理模型目标函数方差(紫色区域)
-  根据 `Acquisition Function`(绿色区域) 获取最大值作为下一个采样点

## PF - Prior Function - 先验函数
Name | Description
-- | --
高斯过程回归 |

