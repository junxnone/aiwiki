---
Title | Point Cloud Registration Metrics
-- | --
Create Date | `2021-05-13T03:05:30Z`
Update Date | `2022-01-20T06:25:30Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/236)

---
## Reference
- 2020.03  A Benchmark for Point Clouds Registration Algorithms [[Paper](https://arxiv.org/abs/2003.12841)] [[Code](https://github.com/iralabdisco/point_clouds_registration_benchmark)]
- [点云配准中常用的评价指标](https://blog.csdn.net/cfan927/article/details/113929241)

## Brief

## LCP - Largetst Common Pointset
- 重叠度 - 重合点占所有点数量的比例就
  - 重合点 - 在变换后的P内任意一点，如果在容差范围内有另外一个Q的点

## R & T - 旋转平移矩阵

- RMSE - ICP
- MSE
- MAE
  - anisotropic mse, mae euler angle error
  - anisotropic translation mse and mae error
  - isotropic rotation degree error
  - isotropic translation error

