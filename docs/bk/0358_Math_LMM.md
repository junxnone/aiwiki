-----

| Title         | Math LMM                                              |
| ------------- | ----------------------------------------------------- |
| Created @     | `2021-03-26T06:06:14Z`                                |
| Last Modify @ | `2022-12-27T06:02:31Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/358) |

-----

# Lagrange Multiplier Method 拉格朗日乘数法

## Reference

  - [拉格朗日乘数法 ——
    通俗理解](https://blog.csdn.net/THmen/article/details/87366904)
  - [拉格朗日乘数法](https://blog.csdn.net/acdreamers/article/details/41413445)

## Brief

  - 通过引入`拉格朗日乘子`来将含有n个变量和k个约束条件的约束优化问题转化为含有（n+k）个变量的无约束优化问题
      - `n 个变量` + `k 个约束条件` ==\> `n + k 个变量`

| 函数                                                           | 条件                                                           | 转化函数                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/6c6715d6b697cbe9ae80bc4a27bf2064a8b1b889.png) | ![image](media/67b77dba811080c1d9058840ed37de8cb1907b6f.png) | ![image](media/39f36bf8e7f49c3e160103b6184f75af429c5e62.png) |

## Examples

### Example 1

| Name       | Details                                                      |
| ---------- | ------------------------------------------------------------ |
| 问题描述       | 求双曲线xy=3上离原点最近的点                                             |
| 函数 f(x, y) | `xy = 3`                                                     |
| 约束 g(x, y) | `x^2 + y^2 = C`                                              |
| 曲线         | ![image](media/7472deea199c7644de66d64bcfd770d130c4eba2.png) |
| 转化问题       | 求当f(x,y)和g(x,y)相切时，x,y的值是多少？                                 |
| 推理         | 两个曲线相切 ==\> 切线相同/法向量是相互平行                                    |
| 引入拉格朗日乘子 λ | ▽f//▽g ==\> ▽f=λ\*▽g ==\> `fx=λ*gx`/`fy=λ*gy`/`xy=3`         |

### Example 2

| Name          | Details                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 问题描述          | 椭球的内接长方体的最大体积                                                                                                             |
| 函数 f(x, y, z) | ![image](media/4fccc4966469907a6175b8e21b4897ed307eadbd.png)                                                              |
| 条件            | ![image](media/b89a9c1ba87736da27455dbeb5311f3fc64447e1.png)                                                              |
| 转化问题          | ![image](media/dc5f16b030cd1b703b249b02851a7dec2136e17f.png)                                                              |
| 求偏导           | ![image](media/eeb8e040034d7d68b95f69d8098527069dd6c4ae.png)                                                              |
| 求解            | ![image](media/0de1c7b0b1aeed3edd58e5fbc5cc2d73040cca3a.png) ![image](media/783ebd6eb7360d3e1fc9de7f8555d8b09690313a.png) |
