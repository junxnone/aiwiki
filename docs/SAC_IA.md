---
Title | SAC IA
-- | --
Create Date | `2022-03-16T10:15:58Z`
Update Date | `2022-03-22T01:41:51Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/300)

---
## Reference
- [RANSAC & MLESAC & SAC-IA](https://littlebearsama.github.io/2020/04/11/Registration/0.SAC-IA/)

## Brief
- SAC-IA - `Sample Consensus Initial Aligment` - 采样一致性初始配准
- 使用 **采样一致性** 算法**剔除错误点对(错误的对应估计)** 
- 粗配准
- 使用 FPFH 

## Pipeline
- 1 计算**源点云** $P_s$ & **目标点云** $Q_t$ 的 [[FPFH]]
  - 使用采样点距离用来保证采样点之间 FPFH 的差异
- 2 搜索 $FPFH_t$  和 $FPFH_s$  中相似的点对
- 3 随机选择 n (n>=3) 个点对
- 4 通过 [[SVD]] 求解点对对应的**转换矩阵**
- 5 计算此时误差
- 6 重复 3-5 直到满足收敛条件，最小误差对应的转换矩阵则为最终结果

