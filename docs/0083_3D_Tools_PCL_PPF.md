---
Title | 3D Tools PCL PPF
-- | --
Created @ | `2021-05-11T07:29:47Z`
Last Modify @| `2022-12-25T03:52:51Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/83)

---
## Reference
- [Selecting the right scale - **k-neighborhood** ](https://pcl.readthedocs.io/projects/tutorials/en/latest/normal_estimation.html#selecting-the-right-scale)

## Brief
- [PPF Algos](/3D_Algos_PPF)

## Pipeline
- 0 Unit Convert(mm --> m)
- 1 DownSampling
- 2 Compute Normal
  -  `NormalEstimation`
  - OMP 加速 - `NormalEstimationOMP`
- 3 Compute PPF
- 4 Hash Map
- 5 Compute Transformation

## 参数
- 下采样 栅格大小
```
const Eigen::Vector4f subsampling_leaf_size(0.2f, 0.2f, 0.2f, 0.0f);
```
- 法向量计算半径大小 / 或者设置搜索点数
```
normal_estimation.setRadiusSearch(40);
```

```
normal_estimation.setKSearch(10);
```

## UseCase

## Source Code
- **PPF Feature**
  - [pcl/features/include/pcl/features/impl/ppf.hpp](https://github.com/PointCloudLibrary/pcl/blob/master/features/include/pcl/features/impl/ppf.hpp)
  - [pcl/features/src/ppf.cpp](https://github.com/PointCloudLibrary/pcl/blob/master/features/src/ppf.cpp)
  - [pcl/test/features/test_ppf_estimation.cpp](https://github.com/PointCloudLibrary/pcl/blob/master/test/features/test_ppf_estimation.cpp)
- **PPF Registration**
  - [pcl/registration/src/ppf_registration.cpp](https://github.com/PointCloudLibrary/pcl/blob/master/registration/src/ppf_registration.cpp)
  - [pcl/registration/include/pcl/registration/impl/ppf_registration.hpp](https://github.com/PointCloudLibrary/pcl/blob/master/registration/include/pcl/registration/impl/ppf_registration.hpp)
  - [pcl/registration/include/pcl/registration/ppf_registration.h](https://github.com/PointCloudLibrary/pcl/blob/master/registration/include/pcl/registration/ppf_registration.h)
- **App**
  - [pcl/apps/src/ppf_object_recognition.cpp]()
