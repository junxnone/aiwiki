-----

| Title         | Math Determinant                                      |
| ------------- | ----------------------------------------------------- |
| Created @     | `2022-03-19T09:29:27Z`                                |
| Last Modify @ | `2022-12-25T03:38:39Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/301) |

-----

# Determinant 行列式

## Reference

## Brief

  - 行列式 - `determinant` - `det(A)` - `|A|`

$D = \\begin{vmatrix} a\_{11} & a\_{12} & ... & a\_{1n} \\ a\_{21} &
a\_{22} & ... & a\_{2n} \\ ... & ... & ... & ... \\ a\_{n1} & a\_{n2} &
... & a\_{nn} \\ \\end{vmatrix}$

## 行列式计算

### 对角线法

  - 适用于 二三阶行列式(更高阶行列式不符合规律)

#### 二阶行列式

$D\_2 = \\begin{vmatrix} a\_{11} & a\_{12} \\ a\_{21} & a\_{22} \\
\\end{vmatrix}$

$D\_2 = a\_{11}a\_{22} - a\_{12}a\_{21}$

#### 三阶行列式

$D\_3 = \\begin{vmatrix} a\_{11} & a\_{12} & a\_{13} \\ a\_{21} &
a\_{22} & a\_{23} \\ a\_{31} & a\_{32} & a\_{33} \\ \\end{vmatrix}$

  - 红色对角线 相乘 **取正**
  - 蓝色对角线 相乘 **取负**

$\\begin{vmatrix} {\\color{Red} a\_{11}} & {\\color{Red} a\_{12}} &
{\\color{Red} a\_{13}} \\ a\_{21} & {\\color{Red} a\_{22}} &
{\\color{Red} a\_{23}} \\ a\_{31} & a\_{32} & {\\color{Red} a\_{33}} \\
\\end{vmatrix}\\begin{vmatrix} a\_{11} & a\_{12} \\ {\\color{Red}
a\_{21}} & a\_{22} \\ {\\color{Red} a\_{31}} & {\\color{Red} a\_{32}} \\
\\end{vmatrix}$

$\\begin{vmatrix} a\_{11} & a\_{12} & {\\color{Blue} a\_{13}} \\ a\_{21}
& {\\color{Blue} a\_{22}} & {\\color{Blue} a\_{23}} \\ {\\color{Blue}
a\_{31}} & {\\color{Blue} a\_{32}} & {\\color{Blue} a\_{33}} \\
\\end{vmatrix}\\begin{vmatrix} {\\color{Blue} a\_{11}{\\color{Blue} }} &
{\\color{Blue} a\_{12}} \\ {\\color{Blue} a\_{21}} & a\_{22} \\ a\_{31}
& a\_{32} \\ \\end{vmatrix}$

$D\_3 = {\\color{Red} a\_{11}a\_{22}a\_{33} + a\_{12}a\_{23}a\_{31} +
a\_{13}a\_{21}a\_{32}}{\\color{Blue}
-a\_{13}a\_{22}a\_{31}-a\_{11}a\_{23}a\_{32}-a\_{12}a\_{21}a\_{33}}$

### 代数余子式法

$D\_{nn} = \\begin{vmatrix} a\_{11} & a\_{12} & \\cdots & a\_{1n} \\
a\_{21} & a\_{22} & \\cdots & a\_{2n} \\ \\vdots & \\vdots & \\vdots &
\\vdots \\ a\_{n1} & a\_{n2} & \\cdots & a\_{nn} \\ \\end{vmatrix}$

$D\_{nn} = (-1)^{1+1}a\_{11}M\_{11} + (-1)^{1+2}a\_{12}M\_{12} + ... +
(-1)^{i+j}a\_{ij}M\_{ij} + ... + (-1)^{n+n}a\_{nn}M\_{nn}$

$M\_{12} = \\begin{vmatrix} a\_{11} & a\_{12} & \\cdots & a\_{1n} \\
{\\color{Red} a\_{21}} & a\_{22} & {\\color{Red} \\cdots} &
{\\color{Red} a\_{2n}} \\ {\\color{Red} \\vdots} & \\vdots &
{\\color{Red} \\vdots} & {\\color{Red} \\vdots} \\ {\\color{Red}
a\_{n1}} & a\_{n2} & {\\color{Red} \\cdots} & {\\color{Red} a\_{nn}} \\
\\end{vmatrix} = \\begin{vmatrix} a\_{21} & a\_{23} & \\cdots & a\_{2n}
\\ a\_{31} & a\_{33} & \\cdots & a\_{3n} \\ \\vdots & \\vdots & \\vdots
& \\vdots \\ a\_{n1} & a\_{n3} & \\cdots & a\_{nn} \\ \\end{vmatrix}$

> $M\_{ij}$ 为 矩阵 删除 $a\_{ij} 所在行列后剩余的部分组成的矩阵$

#### D3 Examples

$D\_3 = \\begin{vmatrix} a\_{11} & a\_{12} & a\_{13} \\ a\_{21} &
a\_{22} & a\_{23} \\ a\_{31} & a\_{32} & a\_{33} \\ \\end{vmatrix}$

$D\_3 = (-1)^{1+1}a\_{11}M\_{11} + (-1)^{1+2}a\_{12}M\_{12} + ... +
(-1)^{3+1}a\_{31}M\_{31}$

$M\_{11} = \\begin{vmatrix} a\_{22} & a\_{23} \\ a\_{32} & a\_{33} \\
\\end{vmatrix}$

### 等价转换法

  - 行列式性质
      - 行列式的某一行（列）的各元素乘同一数然后加到另一行（列）对应的元素上去, **行列式不变**
      - 行列式中某一行（列）的所有元素的公因子可以提到行列式记号的外面
  - **核心思想: 将行列式转化成上三角行列式**

#### D4 Examples

$D\_4 = \\begin{vmatrix} 3 & 1 & 1 & 1 \\ 1 & 3 & 1 & 1 \\ 1 & 1 & 3 & 1
\\ 1 & 1 & 3 & 3 \\ \\end{vmatrix}$

$\\overrightarrow{r1=r1+r2+r3+r4} = \\begin{vmatrix} 6 & 6 & 6 & 6 \\ 1
& 3 & 1 & 1 \\ 1 & 1 & 3 & 1 \\ 1 & 1 & 3 & 3 \\ \\end{vmatrix}$

$\\overrightarrow{r1=r1\\div 6} = 6\\begin{vmatrix} 1 & 1 & 1 & 1 \\ 1 &
3 & 1 & 1 \\ 1 & 1 & 3 & 1 \\ 1 & 1 & 3 & 3 \\ \\end{vmatrix}$

$\\overrightarrow{r2=r2-r1,r3=r3-r1,r4=r4-r1} = 6\\begin{vmatrix} 1 & 1
& 1 & 1 \\ 0 & 2 & 0 & 0 \\ 0 & 0 & 2 & 0 \\ 0 & 0 & 0 & 2 \\
\\end{vmatrix} $

$= 6 \\times (1 \\times 2 \\times 2 \\times 2) = 48$

### 逆序数法
