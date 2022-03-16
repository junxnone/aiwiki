---
Title | SAC IA
-- | --
Create Date | `2022-03-16T10:15:58Z`
Update Date | `2022-03-16T10:15:58Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/300)

---
## Reference
- [RANSAC & MLESAC & SAC-IA](https://littlebearsama.github.io/2020/04/11/Registration/0.SAC-IA/)

## Brief
- SAC-IA - `Sample Consensus Initial Aligment` - 采样一致性初始配准
- 粗配准
-

## Pipeline
- 计算源点云 $P_s$ & 目标点云 $Q_t$ 的 [[FPFH]]
  - 使用采样点距离用来保证采样点之间 FPFH 的差异
- 搜索 $FPFH_t$   $FPFH_s$ 相似的点对, 并随机选择一个点对
- 点对
