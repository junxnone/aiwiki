-----

| Title         | Math GaussianProcess                                  |
| ------------- | ----------------------------------------------------- |
| Created @     | `2020-07-15T01:58:53Z`                                |
| Last Modify @ | `2022-12-27T03:39:01Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/216) |

-----

# Gaussian Process 高斯过程

## Reference

  - [1.7. 高斯过程 -
    apachecn/sklearn-doc-zh](https://github.com/apachecn/sklearn-doc-zh/blob/master/docs/master/8.md)
  - [The Gaussian Processes Web Site](http://www.gaussianprocess.org/)
  - [透彻理解高斯过程Gaussian Process
    (GP)](https://blog.csdn.net/paulfeng20171114/article/details/80276061)
  - [什么是Gaussian process? ——
    说说高斯过程与高斯分布的关系](https://zhuanlan.zhihu.com/p/27555501)
  - [Gaussian
    processes](http://krasserm.github.io/2018/03/19/gaussian-processes/)
  - [GPR =
    sklearn](https://scikit-learn.org/stable/modules/generated/sklearn.gaussian_process.GaussianProcessRegressor.html)
  - [Gaussian Processes for Machine
    Learning](http://www.gaussianprocess.org/gpml/chapters/RW.pdf)
  - [GPR -
    高斯过程回归可视化](https://www.jgoertler.com/visual-exploration-gaussian-processes/)
  - [核函数(Kernel
    function)](https://blog.csdn.net/mengjizhiyou/article/details/103437423)

## 基础知识

  - \[随机过程\]
  - [高斯分布](/Gaussian_distribution)

## Brief

  - 高斯过程 : 符合高斯分布的变量的集合
      - **随机向量** -
        ![image](media/497f64435008e588f5381f261e3d1f07d95771c8.png)
      - **f(x) 服从多元高斯分布** -
        ![image](media/673efe5aa15cfb048ddf143575277351481302ca.png)
      - ![image](media/27d2b112dd6ea4844a77e83fab20da564b6c18b5.png)
      - **均值函数** -
        ![image](media/c43aa1ca2a4fb9b26ca57e9f26bbdfb43e32fe37.png)
      - **核函数(Kernel Function)/协方差函数(Covariance Function)** -
        ![image](media/be2c37f4ee742dc57622ece0f16aaf81b337e774.png)
  - GP 是特殊**随机过程**: **随机变量都是服从高斯分布的**
  - GP 即 服从高斯分布的量的变化

## 核函数/协方差函数

  - 用于生成协方差矩阵, 衡量任意两个点之间的`距离`
  - 平稳核函数 - RBF/周期
  - 非平稳核函数 - 线性

| 核函数                                              | 公式                                                           |
| ------------------------------------------------ | ------------------------------------------------------------ |
| 常量<br>Constant                                   |                                                              |
| 线性<br>Linear                                     |                                                              |
| 高斯噪声<br>Gaussian noise                           |                                                              |
| 平方指数<br>SE-Squared exponential                   |                                                              |
| Ornstein–Uhlenbeck                               |                                                              |
| 马顿核<br>Matérn                                    |                                                              |
| 周期<br>Periodic                                   |                                                              |
| 有理二次方<br>Rational quadratic                      |                                                              |
| 高斯核/径向基函数<br>Gaussian/RBF(Radial Basis Function) | ![image](media/590a6eb9ef9b4661fe0738727a6a30342adc05f0.png) |

> **随机过程** - 确定性过程研究一个量随时间确定的变化，而随机过程描述的是一个量随时间可能的变化

## GPR - Gaussian Process Regression

  - **Regression Analysis/回归分析** - 分析变量之间的相关性/相关方向/强度，建立模型预测变量
  - 用高斯过程作为先验, 学习函数

**Pipeline**

| Steps | Description                                                                                                                                    |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | 高斯过程先验 : 认为给定x，y服从分布 ![image](media/4cc0a6db65462ea6896cd05c95c4e85705b7e1f3.png)，![image](media/3d62a8646872ddd09a9e4fa631eb79537c9af227.png) |
| 2     | 训练数据 (x, y) 学习映射函数 f                                                                                                                           |
| 3     |                                                                                                                                                |

## GPC - Gaussian Process Classification

## Tips

  - 随机过程描述的是一个量随时间可能的变化
