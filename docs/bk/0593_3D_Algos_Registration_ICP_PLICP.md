-----

| Title     | 3D Algos Registration ICP PLICP                       |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-21T06:25:42Z`                                |
| Updated @ | `2026-10-21T06:29:16Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/593) |

-----

# PLICP - Point-to-Line ICP

PLICP 把标准 [ICP](0086_3D_Algos_Registration_ICP)
里"点到点"的误差度量换成"点到线"——把目标扫描里相邻两个点连成一条线段，源点云里的对应点不是去匹配某一个具体的目标点，而是匹配到这条线段所在的直线上，用点到直线的距离作为误差。这个改动看似很小，却带来了收敛速度的质变。

## 为什么有闭式解、收敛更快

  - 点到点的距离度量，经过旋转平移变换后是关于旋转角的非线性函数，没有通用闭式解，通常只能线性化后用最小二乘迭代求解；
  - 点到线的距离度量在**平面（2D）情形下存在精确的闭式解**——PLICP 直接给出了这个闭式解的解析形式，不需要线性化近似；
  - 有闭式解带来的直接好处是**收敛阶数的提升**：标准 ICP 通常是线性收敛，PLICP
    在残差为零、初始猜测较好的情况下能达到**二次收敛**，如果目标表面本身是折线（polyline），PLICP
    甚至能保证在有限步内精确收敛，实践中比标准 ICP、MBICP 都需要更少的迭代次数、精度更高。

## 优点

  - 收敛快（二次收敛）、精度高、需要的迭代次数少；
  - 有精确闭式解，不需要迭代线性化近似这个额外环节。

## 缺点

  - **只在 2D/平面场景下有闭式解**，3D 情形没有对应的闭式解，限制了它的直接适用范围；
  - 对**大初始旋转误差的鲁棒性不如 MBICP**——论文本身也指出，PLICP 精度更高、迭代更少，但面对很大的初始位姿偏差时不如
    [MBICP](0592_3D_Algos_Registration_ICP_MBICP) 稳健。

## 使用场景

PLICP 主要用于**2D 激光扫描匹配**（移动机器人里程计/SLAM
中常见的帧间匹配问题），在初始位姿误差不太大、目标环境有一定线性结构（走廊、房间轮廓等）的场景下，是比标准
ICP、MBICP 更精确高效的选择。

## Reference

  - Censi, A. An ICP Variant Using a Point-to-Line Metric, ICRA 2008
  - [3D Algos Registration ICP](0086_3D_Algos_Registration_ICP)
  - [3D Algos Registration](0235_3D_Algos_Registration)
