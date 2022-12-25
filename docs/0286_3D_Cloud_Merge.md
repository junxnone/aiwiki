---
Title | 3D Cloud Merge
-- | --
Created @ | `2022-02-08T02:40:41Z`
Last Modify @| `2022-12-25T03:45:32Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/286)

---
## Reference

- [Smoothing and normal estimation based on polynomial reconstruction](https://pcl.readthedocs.io/projects/tutorials/en/master/resampling.html)


## Brief
- 绝对坐标系点云拼接
- 靶点(定位点)点云拼接
- 三点定位标记拼接
- **点云重叠配准拼接**
- 深度学习
  - PointNet/PointNet++/PointNetLK/DCP(DeepClosest Point)
- 同源配准/跨源配准(不同的采集设备)
- [MLS](/Moving_Least_Squares) Surface reconstruction(smooth and resample noisy data)

## 注册配准拼接
- 对拼接点云重合度的要求？
- Steps
  - 有重叠部分的点云配准计算变换矩阵
  - 根据转换矩阵转换点云
  - 计算重叠点云区域
  - 点云平滑/Smoothing
- 融合(平均融合/去除重叠)
- 去除重叠部分
