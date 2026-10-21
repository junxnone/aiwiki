-----

| Title     | 3D Algos Registration RANSAC                          |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-21T06:26:00Z`                                |
| Updated @ | `2026-10-21T06:29:02Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/595) |

-----

# RANSAC - Random Sample Consensus

RANSAC
不是专门为点云配准设计的算法，而是一个通用的"从含大量误匹配/离群点的候选数据里鲁棒估计模型参数"的框架——[4PCS](0589_3D_Algos_Registration_4PCS)、[FGR](0591_3D_Algos_Registration_FGR)
等穷举/特征匹配类粗配准方法，思路上都能看到 RANSAC 的影子，理解 RANSAC 有助于理解这整类方法的共同逻辑。

## 算法原理

1.  从候选对应点对（或候选匹配集合）中**随机采样一个最小子集**（配准问题里通常是 3 对点，刚好能唯一确定一个刚体变换）；
2.  用这个最小子集求解出一个候选的变换模型（旋转平移矩阵）；
3.  把这个候选模型应用到全部候选点对上，统计有多少点对的误差落在容差阈值内，这些点对称为"内点"（Inliers）；
4.  重复 1-3 若干次，记录内点数量最多（一致性最好）的那次候选模型；
5.  可选：用筛选出的全部内点重新做一次最小二乘精细求解，得到最终的变换模型。

## 优点

  - 原理简单，不需要假设误匹配的具体分布规律，只要内点比例不太低就能稳健地找出正确模型；
  - 通用性强，不仅用于点云配准，也是 2D 图像特征匹配、单应矩阵估计等很多计算机视觉任务的标配工具。

## 缺点

  - **采样次数随离群点比例指数增长**：外点比例越高，为了保证以一定概率采到一组全是内点的最小子集，所需的采样次数呈指数上升，外点比例极高（如
    \>80%\~90%）时效率急剧下降；
  - 最小子集随机选取没有利用任何几何/特征约束，效率不如后续专门为点云设计的改进版本（如
    [4PCS](0589_3D_Algos_Registration_4PCS)
    用共面四点的仿射不变比例代替纯随机采样，[FGR](0591_3D_Algos_Registration_FGR)
    干脆绕开采样过程直接做鲁棒优化）；
  - 需要人工设定内点误差阈值，阈值选择对结果影响较大。

## 和点云配准的关系

RANSAC 本身很少被直接拿来做点云粗配准（效率不够），但它的核心思想——**随机假设+一致性验证**——被
[SAC-IA](0300_3D_Algos_Registration_SACIA)（在 FPFH
特征匹配结果上做采样一致性）、[4PCS](0589_3D_Algos_Registration_4PCS)（把最小子集从
3 点扩展到 4 个共面点并利用仿射不变量加速搜索）等方法直接继承和改造，是理解这整个"基于一致性验证的粗配准"家族的共同起点。

## Reference

  - Fischler, M.A., Bolles, R.C. Random Sample Consensus: A Paradigm for
    Model Fitting with Applications to Image Analysis and Automated
    Cartography, Communications of the ACM, 1981
  - [3D Algos Registration SACIA](0300_3D_Algos_Registration_SACIA)
  - [3D Algos Registration](0235_3D_Algos_Registration)
