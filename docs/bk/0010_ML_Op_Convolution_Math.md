-----

| Title     | ML Op Convolution Math                               |
| --------- | ---------------------------------------------------- |
| Created @ | `2019-06-09T07:26:18Z`                               |
| Updated @ | `2023-02-02T09:00:38Z`                               |
| Labels    | \`\`                                                 |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/10) |

-----

# 卷积 数学定义

## Reference

  - [Convolution - Wikipedia](https://en.wikipedia.org/wiki/Convolution)
  - [Spatial
    convolution](https://graphics.stanford.edu/courses/cs178/applets/convolution.html)
  - [如何通俗易懂地解释卷积？](https://www.zhihu.com/question/22298352)

## Brief

  - 两个函数 `f(x)` & `g(x)` 之间的数学操作产生一个新的函数: `f(x)*g(x)`
  - f & g 翻转平移后重叠部分乘积的积分

## 单变量 & 双变量的数学公式定义

| 函数       | 定义                                                           |
| -------- | ------------------------------------------------------------ |
| 单变量连续域函数 | ![image](media/50d460ec9dad1675e4d6c41a10f7e9a7e0072400.png) |
| 单变量离散域函数 | ![image](media/365ac20677cd7d99145daee4a67b2b486c2ebe50.png) |
| 双变量连续函数  | ![image](media/555cdb4b778a224ed13e9fba011c31107dc99543.png) |
| 双变量离散函数  | ![image](media/8af8d568c49bb796a7c4b93c12419de710385528.png) |

## 一维卷积过程

  - 输入 f & g (1\~2)
  - g 翻转平移 (3\~4)
  - 求每个t点的值 (5\~7)
  - 得到新的函数 (8)

![image](media/af89d324e67d17e7bfc4e2db2e0d2d82cd16b557.png)

## 系统理解

  - f 为输入随时间 t 的变化
  - g 为输入随时间 t 的衰减
  - 输出 O 为 f & g 的综合结果

| Steps | f & g                                                        |
| ----- | ------------------------------------------------------------ |
| 1     | ![image](media/3345eecd4473224382de50464ad654a19ef348d0.png) |
| 2     | ![image](media/d69d021fba1cb6b15035dfee86427ed84bc67b80.png) |
| 3     | ![image](media/a7041c293dcee3f5fb23bb20027b900463e82cc9.png) |
| 4     | ![image](media/b97e917be4e2ffbd57c50c23b1b576931170b562.png) |

## Convolution & Cross-correlation & Autocorrelation

  - Cross-correlation 互相关 - 两个变量的相似性度量
  - Autocorrelation 自相关 - 变量不同时间的相关性

![image](media/977a957a768c7ea9f2a2dde07baea203ffe2d823.png)
