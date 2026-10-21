---
Title | 3D Algos Registration PPF
-- | --
Created @ | `2021-04-29T02:09:42Z`
Updated @| `2026-10-21T06:31:01Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/85)

---
# PPF 粗配准

- PPF - `Point Pair Feature`
- Global Model Description (F-PP Hash Table)

## Motivation
- 背景/存在的问题
- 做了什么尝试/分别有什么效果
- 应用领域

## PPF

PPF | $F(m_{1},m_{2})=(F_{1}, F_{2}, F_{3}, F_{4})=(\left\|\left\| d \right\| \right\|_{2}, \angle (n_{1},d), \angle (n_{2},d), \angle (n_{1},n_{2}))$
-- | --
m1/m2 | 两个点
n1/n2 | 法向量
d = m2-m1 | m1 到 m2 的距离
$\angle (n_{x},d/n_{y})$ | `法向量` 和 `两点连线`的夹角/ 法向量的夹角


图解 (F1, F2, F3, F4)  | <img width=700px src="https://user-images.githubusercontent.com/2216970/116506313-96778f00-a8ef-11eb-8f18-ccad36ebc7bf.png">
-- | --

### 通过 PPF 计算转换矩阵

- Sence 中存在点 $(s_{i}, s_{r})$ 与 Model 中点 $(m_{i}, m_{r})$ 存在相似的 PPF
- 将 $m_{r}$ 经过矩阵 $T_{m \to g}$ 平移到原点, 并旋转法向量 $n_{r}^{m}$ 到 x 轴
- 将 $s_{r}$ 经过矩阵 $T_{s \to g}$ 平移到原点, 并旋转法向量 $n_{r}^{s}$ 到 x 轴 
- 令 $\alpha$ 为 $s_{i}$ 围绕  x 轴旋转到 $m_{i}$ 的角度
- $s_{i} = T_{s \to g}^{-1}R_{x}(\alpha)T_{m \to g}m_{i}$


图解 | ![image](https://user-images.githubusercontent.com/2216970/116509077-3f74b880-a8f5-11eb-8ea8-64d2c1ceba19.png)
-- | --

## Pipeline
- 选取 3D 模型中的参考点
  - 设定搜索半径, 搜索参考点周围区域内的点对
  - `选择离参考点最近的几个点`
- 构建 PPF 特征
  - 计算 点对 (mi, mj) 的 PPF
- 构建 **Global Model Description** `Hash Table` - `key = F` / `Value = Point Pair`
- **Voting** 对于 (sr, si) 查找对应的 (mr, mi) 计算出 α, 取最大投票的 (mr, α)


![image](https://user-images.githubusercontent.com/2216970/116495688-fa8d5980-a8d5-11eb-8bf9-52409dda0db5.png)

## Voting
- 定义一个 （Nm, Nα）的矩阵用来记录投票
![image](https://user-images.githubusercontent.com/2216970/116511829-9ed4c780-a8f9-11eb-93b0-6fadb38045ac.png)

## Evaluation

## Tricks
- Efficient Voting Loop - 减少计算量
- Pose Clustering - 增加算法稳定性
  - 多个  voting 结果一致，先做聚类，取最多的，然后取均值

## 和其他粗配准方法的区别

PPF 的核心优势是**不需要法向量以外的其他特征描述子**（不像 [SAC-IA](0300_3D_Algos_Registration_SACIA) 依赖 FPFH 高维直方图），只用点对之间的距离+法向量夹角这四个简单数值就能建立 Hash Table 做全局匹配，对**遮挡和噪声的鲁棒性较好**，是工业 6D 位姿估计场景（如 [3D Pin Picking 应用](0550_应用_3DPinPicking) 这类无序抓取场景）的常用算法。代价是离线建 Hash Table 阶段需要遍历模型上所有点对，点对数量是模型点数的平方级，模型点数较多时建表开销不小，实践中通常会先对模型做降采样（见[降采样](0285_3D_Cloud_Sampling)）控制点数规模。

## Reference
- 2010 **[xxx]** Model Globally, Match Locally: Efficient and Robust 3D Object Recognition[[Paper](http://campar.in.tum.de/pub/drost2010CVPR/drost2010CVPR.pdf)] [[Code]()]
- [【6D位姿估计】Point Pair Feature (PPF)](https://zhuanlan.zhihu.com/p/94952276)
- [Surface Matching Algorithm Through 3D Features - OpenCV](https://docs.opencv.org/3.0-beta/modules/surface_matching/doc/surface_matching.html)
- [刚性物体6D位姿估计方法简述](https://www.hanchine.com/newInfo_131.html)
- [3D Algos Registration SACIA](0300_3D_Algos_Registration_SACIA)
- [3D Cloud Sampling](0285_3D_Cloud_Sampling)
- [3D Pin Picking 应用](0550_应用_3DPinPicking)
- [3D Algos Registration](0235_3D_Algos_Registration)

