---
Title | 3D Algos PPF
-- | --
Create Date | `2021-04-29T02:09:42Z`
Update Date | `2022-02-10T06:32:46Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/85)

---
## Reference
- 2010 **[xxx]** Model Globally, Match Locally: Efficient and Robust 3D Object Recognition[[Paper](http://campar.in.tum.de/pub/drost2010CVPR/drost2010CVPR.pdf)] [[Code]()]
- [【6D位姿估计】Point Pair Feature (PPF)](https://zhuanlan.zhihu.com/p/94952276)
- [Surface Matching Algorithm Through 3D Features - OpenCV](https://docs.opencv.org/3.0-beta/modules/surface_matching/doc/surface_matching.html)
- [刚性物体6D位姿估计方法简述](https://www.hanchine.com/newInfo_131.html)


## Brief
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
d = m2-m1 | 


F(m1, m2)= (F1, F2, F3, F4)    &   **Global Model Description(`F-PP Hash Table`)** | 
-- | 
![image](https://user-images.githubusercontent.com/2216970/116506313-96778f00-a8ef-11eb-8f18-ccad36ebc7bf.png)

Local Coordinates | (mr, α) `@sr`
-- | --
mr | Model 上一点  和 Scene 上的 sr 对应
α | mr 法向量 到 sr 法向量的角度

Model & Scene Transformation | ![image](https://user-images.githubusercontent.com/2216970/116509056-35eb5080-a8f5-11eb-9a68-81a3c636fd15.png)
-- | --
Tm->g | mr 移动到原点，法向量与x轴对齐 
Ts->g |  sr 移动到原点，法向量与x轴对齐

![image](https://user-images.githubusercontent.com/2216970/116509077-3f74b880-a8f5-11eb-8ea8-64d2c1ceba19.png)
-- |

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

# Evaluation

# Tricks
- Efficient Voting Loop - 减少计算量
- Pose Clustering - 增加算法稳定性
  - 多个  voting 结果一致，先做聚类，取最多的，然后取均值
