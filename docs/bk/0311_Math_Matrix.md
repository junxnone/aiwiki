-----

| Title         | Math Matrix                                           |
| ------------- | ----------------------------------------------------- |
| Created @     | `2022-04-19T11:36:53Z`                                |
| Last Modify @ | `2022-12-25T03:35:28Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/311) |

-----

# 矩阵

## Reference

  - [矩阵的运算及其运算规则](http://www2.edu-edu.com.cn/lesson_crs78/self/j_0022/soft/ch0605.html)

## Brief

  - 行列变换
  - 加减
  - 乘法
  - 哈达玛乘积 - `Hadamard product`
  - 转置
  - 逆
  - 秩
  - 迹
  - 雅可比行列式 - Jacobi

## 矩阵转置

  - **矩阵转置**: 矩阵 A 元素行列交换得到的转置矩阵 $A^{T}$

$A = \\begin{vmatrix} a\_{11} & a\_{12} & ... & a\_{1n} \\ a\_{21} &
a\_{22} & ... & a\_{2n} \\ ... & ... & ... & ... \\ a\_{m1} & a\_{m2} &
... & a\_{mn} \\ \\end{vmatrix}$

$A^T = \\begin{vmatrix} a\_{11} & a\_{21} & ... & a\_{m1} \\ a\_{12} &
a\_{22} & ... & a\_{m2} \\ ... & ... & ... & ... \\ a\_{1n} & a\_{2n} &
... & a\_{mn} \\ \\end{vmatrix}$

### 转置性质

  - $(A^T)^T=A$
  - $(A+B)^T=A^T+B^T$
  - $(\\lambda A)^T=\\lambda A^T$
  - $(AB)^T=B^TA^T$

## 矩阵的逆

  - **矩阵逆**: $AA^{-1}=A^{-1}A=E$
      - 对于一个 n 阶方阵 A, 如果存在另一个 n 阶方阵 B 满足 $AB=BA=E$, E 为单位矩阵
      - 即 $B=A^{-1}$
      - A B 互为逆矩阵

## 正交矩阵

  - **正交矩阵**: $A^TA=E$
  - $A=\\begin{bmatrix} a\_1 & a\_2 & ... & a\_n \\ \\end{bmatrix}$
  - $A^T=\\begin{bmatrix} a\_1^T \\ a\_2^T \\ ... \\ a\_n^T \\
    \\end{bmatrix} $

$A^TA = \\begin{bmatrix} 1 & 0 & 0 & 0 \\ 0 & 1 & 0 & 0 \\ 0 & 0 & 1 & 0
\\ 0 & 0 & 0 & 1 \\ \\end{bmatrix}$

## 运算定义

#### Hadamard Product

  - $A \\circ B = B \\circ A$
  - $A \\circ (B \\circ C) = (A \\circ B) \\circ C$
  - $A \\circ (B + C) = A \\circ B + A \\circ C$

$\\left\[ \\begin{array}{ccc} a\_{11} & a\_{12} & a\_{13}\\ a\_{21} &
a\_{22} & a\_{23}\\ a\_{31} & a\_{32} & a\_{33} \\end{array} \\right\]
\\circ \\left\[ \\begin{array}{ccc} b\_{11} & b\_{12} & b\_{13}\\
b\_{21} & b\_{22} & b\_{23}\\ b\_{31} & b\_{32} & b\_{33} \\end{array}
\\right\] = \\left\[ \\begin{array}{ccc} a\_{11}\\times b\_{11} &
a\_{12}\\times b\_{12} & a\_{13}\\times b\_{13}\\ a\_{21}\\times b\_{21}
& a\_{22}\\times b\_{22} & a\_{23}\\times b\_{23}\\ a\_{31}\\times
b\_{31} & a\_{32}\\times b\_{32} & a\_{33}\\times b\_{33} \\end{array}
\\right\]$
