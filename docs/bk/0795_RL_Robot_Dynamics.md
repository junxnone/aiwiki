-----

| Title     | RL Robot Dynamics                                     |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-25T16:30:13Z`                                |
| Updated @ | `2026-11-25T16:30:13Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/795) |

-----

# Dynamics

机器人动力学：研究关节力矩与运动（位置、速度、加速度）之间的关系。运动学只讨论几何，动力学加入质量、惯量与力。所属总览见 [RL
Robot](https://github.com/junxnone/aiwiki/issues/458)，运动学见 [RL Robot
Kinematics](https://github.com/junxnone/aiwiki/issues/768)。

## 正动力学与逆动力学

``` mermaid
flowchart LR
    T[关节力矩 tau] -- 正动力学 FD --> A[关节加速度 q_ddot]
    A -- 逆动力学 ID --> T
```

图中：

  - 正动力学（Forward Dynamics）：已知力矩求加速度，用于仿真
  - 逆动力学（Inverse Dynamics）：已知期望加速度求所需力矩，用于控制（如计算力矩法）
  - 两者通过同一个动力学方程相互转化

## 动力学方程

$$ M(q),\\ddot{q}+C(q,\\dot{q}),\\dot{q}+g(q)=\\tau $$

其中：

  - $q,\\dot{q},\\ddot{q}\\in\\mathbb{R}^n$：关节位置、速度、加速度，$n$ 为关节数
  - $M(q)\\in\\mathbb{R}^{n\\times n}$：质量（惯性）矩阵，对称正定，依赖位形；描述各关节加速度需要多大力矩
  - $C(q,\\dot{q})\\dot{q}$：科氏力与离心力项，由关节速度的耦合产生
  - $g(q)$：重力项，仅依赖位形
  - $\\tau\\in\\mathbb{R}^n$：关节驱动力矩（力）

带外力与摩擦的完整形式：

$$
M(q)\\ddot{q}+C(q,\\dot{q})\\dot{q}+g(q)+\\tau\_f=\\tau+J^{\\top}F\_{ext}
$$

其中：

  - $\\tau\_f$：关节摩擦力矩，如粘性摩擦 $B\\dot{q}$ 加库仑摩擦
  - $F\_{ext}$：末端受到的外力/外力矩
  - $J$：雅可比矩阵（见 Kinematics）；$J^{\\top}F\_{ext}$ 把末端外力映射成关节力矩

## 性质

  - $M(q)$ 对称正定，所以可逆，由此可由 $\\tau$ 解出 $\\ddot{q}$
  - $\\dot{M}-2C$ 反对称：能量守恒的体现，是自适应控制和稳定性证明的基础
  - 关于惯性参数线性：$M\\ddot{q}+C\\dot{q}+g=Y(q,\\dot{q},\\ddot{q}),\\theta$，其中
    $\\theta$ 是质量、质心、惯量等待辨识参数，$Y$ 是回归矩阵；用于系统辨识

## 推导方法

### 拉格朗日法

$$ L=K-P,\\qquad \\frac{d}{dt}\\frac{\\partial L}{\\partial
\\dot{q}\_i}-\\frac{\\partial L}{\\partial q\_i}=\\tau\_i $$

其中：

  - $K$：系统总动能；$P$：总势能
  - $L$：拉格朗日量
  - $q\_i,\\tau\_i$：第 $i$ 个广义坐标及其广义力
  - 特点：从能量出发，推导系统化，适合解析推导和理论分析，但计算量大

### 牛顿-欧拉法

对每个连杆分别列牛顿方程（力）与欧拉方程（力矩）：

$$ F\_i=m\_i,\\dot{v}\_{c\_i},\\qquad
N\_i=I\_i,\\dot{\\omega}\_i+\\omega\_i\\times(I\_i,\\omega\_i) $$

其中：

  - $m\_i$：连杆 $i$ 的质量；$\\dot{v}\_{c\_i}$：质心加速度
  - $I\_i$：连杆绕质心的惯量张量；$\\omega\_i,\\dot{\\omega}\_i$：角速度、角加速度
  - $F\_i,N\_i$：使连杆产生该运动所需的合力和合力矩
  - 做法：由基座向末端递推速度与加速度（前向），再由末端向基座递推力与力矩（后向）
  - 特点：递推式，复杂度 $O(n)$，是 RNEA 算法，适合在线计算

## 常用算法

| 问题   | 算法            | 复杂度      |
| ---- | ------------- | -------- |
| 逆动力学 | RNEA（递归牛顿-欧拉） | $O(n)$   |
| 正动力学 | ABA（关节体算法）    | $O(n)$   |
| 质量矩阵 | CRBA（复合刚体算法）  | $O(n^2)$ |

表中：

  - 复杂度：关于关节数 $n$；这三个算法在 Pinocchio、RBDL 等库中实现
  - 对比结论：仿真用 ABA，控制用 RNEA，需要 $M(q)$ 时用 CRBA

## 例：单摆

$$ m l^2\\ddot{\\theta}+m g l\\sin\\theta=\\tau $$

其中：

  - $\\theta$：摆角；$m$：摆球质量；$l$：摆长；$g$：重力加速度
  - $\\tau$：驱动力矩；$M=ml^2$，$g(q)=mgl\\sin\\theta$，一个关节没有科氏项

## Reference

  - [入门机器人需要的基础知识](https://zhuanlan.zhihu.com/p/655770237)
