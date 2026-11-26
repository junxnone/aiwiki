-----

| Title     | Tools Eigen                                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2021-05-25T07:11:11Z`                                |
| Updated @ | `2026-11-26T09:54:48Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/303) |

-----

# Eigen

  - C++ 开源库, 支持线性代数运算 矩阵 矢量 运算 数值分析...
  - 纯头文件（header-only）库，包含头文件即可使用，无需编译链接
  - 使用表达式模板，把链式的矩阵运算合并后一次计算，减少临时变量

| Modules     | Description         |
| ----------- | ------------------- |
| Core        | 基础线性运算和数组操作         |
| Geometry    | 2D3D旋转/平移/缩放/变换     |
| LU          | 求逆/行列式/LU分解         |
| Cholesky    | LLT/LDLTCholesky 分解 |
| Householder | Householder 变换      |
| SVD         | SVD 分解              |
| QR          | QR 分解               |
| Eigenvalues | 特征值 特征向量分解          |
| Sparse      | 稀疏矩阵                |

表中：

  - **Modules**：Eigen 的模块；**Description**：对应功能
  - 对比结论：日常使用 Core 和 Geometry；解线性方程组或最小二乘时用分解模块

## 示例

``` cpp
#include <Eigen/Dense>
using namespace Eigen;

Matrix3d A = Matrix3d::Random();
Vector3d b(1, 2, 3);
Vector3d x = A.colPivHouseholderQr().solve(b);     // 解 A x = b

Matrix3d R = AngleAxisd(M_PI / 4, Vector3d::UnitZ()).toRotationMatrix();  // 绕 z 轴转 45 度
```

其中：

  - `Matrix3d`：$3\\times3$ 的 double 矩阵；`Vector3d`：3 维向量
  - `colPivHouseholderQr().solve(b)`：用带列主元的 QR 分解求解线性方程组 $Ax=b$
  - `AngleAxisd`：轴角表示的旋转，可转成旋转矩阵（见 [RL Robot
    Rotation](https://github.com/junxnone/aiwiki/issues/777)）

## 分解方法选择

| 分解                   | 适用        | 速度 / 精度 |
| -------------------- | --------- | ------- |
| LU                   | 一般方阵      | 快       |
| Cholesky（LLT / LDLT） | 对称正定矩阵    | 最快      |
| QR                   | 一般矩阵、最小二乘 | 较稳定     |
| SVD                  | 病态、秩亏矩阵   | 最稳定，最慢  |

表中：对比结论：速度从快到慢是 Cholesky、LU、QR、SVD，稳定性相反。

## UseCase

  - PCL 点云处理库中有使用

## Reference

  - [Code](https://gitlab.com/libeigen/eigen)
  - [Docs](https://eigen.tuxfamily.org/index.php?title=Main_Page)
