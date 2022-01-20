---
Title | Point Cloud Registration
-- | --
Create Date | `2021-04-29T07:34:54Z`
Update Date | `2022-01-20T06:24:59Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/235)

---
## Reference
- [A method for registration of 3-D shapes.pdf](https://github.com/junxnone/tech-io/files/6397002/A.method.for.registration.of.3-D.shapes.pdf)
- [awesome-image-registration](https://github.com/Awesome-Image-Registration-Organization/awesome-image-registration)
- [awesome-point-cloud-registration](https://github.com/XuyangBai/awesome-point-cloud-registration)
- 2020.03  A comprehensive survey on point cloud registration  [[Paper](https://arxiv.org/abs/2103.02690v2)] [[Code]()]
  - [最新点云配准综述：A comprehensive survey on point cloud registration](https://zhuanlan.zhihu.com/p/355578871)
- [Registration Blogs - xiaoxiong](https://littlebearsama.github.io/categories/Registration/)

## Brief
- `Coarse Global Registeration` ==> `Fine Local Registeration`
- [Metrics](https://github.com/junxnone/tech-io/issues/983)


## Algos
- **Coarse Global Registeration**
  - [PPF](/3D_Algos_PPF)
  - SAC
  - NDT - `Normal Distribution Transform` 
  - **基于穷举搜索**
    - RANSAC
    - 4PCS - `4-Point Congruent Set`
    - Super4PCS
  - **基于特征匹配**
    - SAC-IA - `Sample Consensus Initial Aligment` - FPFH
    - FGR - FPFH
    - AO - SHOT
    - ICL - 线特征
- **Fine Local Registeration**
  - [ICP](3D_Algos_ICP)
  - point to plane ICP
  - Point to line ICP
  - MBICP
  - GICP
  - NICP


## UseCase

