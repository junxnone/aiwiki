-----

| Title     | Math norm                                             |
| --------- | ----------------------------------------------------- |
| Created @ | `2019-08-05T06:44:26Z`                                |
| Updated @ | `2024-05-22T02:55:12Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/254) |

-----

# norm 范数

  - 数学中的基本概念，用于度量向量长度或矩阵大小

## L-p范数

  - **L-p范数不是一个范数，而是一组范数**
  - **L-p** 范数公式如下

$$\\huge L\_p = \\Vert x \\Vert\_p = \\sqrt\[p\]{\\sum\_{1}^{n}
x\_{i}^{p}} $$

$$\\large x = (x\_1, x\_2,...,x\_n)$$

![image](media/2b6ea6caef2b658f74b236a806257e1889491e93.png)

### L0 范数

  - L0范数指向量中非零元素的个数

### L1范数

  - 向量各个元素绝对值之和，Manhattan distance。

$$\\huge L\_1 = \\Vert x \\Vert\_1 = \\sum\_{1}^{n} \\vert
x\_{i}\\vert$$

### L-2 范数 - (Euclid范数)

  - **欧几里得范数**，常用**计算向量长度**
  - 即 `p = 2` , 向量元素绝对值的平方和再开方，matlab调用函数norm(x, 2)。

$$\\huge L\_2 = \\Vert x \\Vert\_2 = \\sqrt{\\sum\_{1}^{n} x\_{i}^{2}}
$$

## Reference

  - [范数](https://blog.csdn.net/NCHFGFB/article/details/78498401)
  - [范数（norm）
    几种范数的简单介绍](https://blog.csdn.net/a493823882/article/details/80569888)
  - [np.linalg.norm(求范数)](https://blog.csdn.net/hqh131360239/article/details/79061535)
  - [L0、L1、L2范数在机器学习中的应用](https://www.jianshu.com/p/4bad38fe07e6)
