-----

| Title         | 3D Algos Registration                                 |
| ------------- | ----------------------------------------------------- |
| Created @     | `2021-04-29T07:34:54Z`                                |
| Last Modify @ | `2022-12-25T03:41:59Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/235) |

-----

# Registration 配准

## Reference

  - [A method for registration of 3-D
    shapes.pdf](https://github.com/junxnone/tech-io/files/6397002/A.method.for.registration.of.3-D.shapes.pdf)
  - [awesome-image-registration](https://github.com/Awesome-Image-Registration-Organization/awesome-image-registration)
  - [awesome-point-cloud-registration](https://github.com/XuyangBai/awesome-point-cloud-registration)
  - 2020.03 A comprehensive survey on point cloud registration
    \[[Paper](https://arxiv.org/abs/2103.02690v2)\] \[[Code]()\]
      - [最新点云配准综述：A comprehensive survey on point cloud
        registration](https://zhuanlan.zhihu.com/p/355578871)
  - [Registration Blogs -
    xiaoxiong](https://littlebearsama.github.io/categories/Registration/)
  - [《GAMES203：三维重建和理解》2
    配准（Registration）](https://zhuanlan.zhihu.com/p/462813029)
  - [点云配准各种方法总结\[不定时更新\]](https://blog.csdn.net/Ha_ku/article/details/79755623)

## Brief

  - [Metrics](https://github.com/junxnone/tech-io/issues/983)
  - 配准问题分类
      - 不同重叠度 (Full Overlap & Partial Overlap)
          - 完全重叠: 仿品与原品对比/建造件与模型对比
          - 部分重叠: 不同视角扫描对象进行三维重建
      - 全局 & 局部 (Global & Local)
          - 全局: 位姿差别较大 (`Coarse Global Registeration`) - 粗配准
          - 局部: 位姿相近 (`Fine Local Registeration`) - 精配准
      - 成对 & 多对 (Pairwise & Multiple)
          - 配准两片点云
          - 配准多片点云 (三维重建)

## Algos

### Coarse Global Registeration

  - [PPF](/3D_Algos_PPF)
  - [SAC]()
  - [NDT](/Normal_Distributions_Transform) - `Normal Distribution
    Transform`
  - **基于穷举搜索**
      - RANSAC
      - 4PCS - `4-Point Congruent Set`
      - Super4PCS
  - **基于特征匹配**
      - [SAC-IA](/SAC_IA) - `Sample Consensus Initial Aligment` - FPFH
      - FGR - FPFH
      - AO - SHOT
      - ICL - 线特征

### Fine Local Registeration

  - [ICP](3D_Algos_ICP)
  - point to plane ICP
  - Point to line ICP
  - MBICP
  - [GICP](/GICP)
  - NICP

## History

![image](media/deb38a1343cf4ad330693d0fe0f01ce09c44ac65.png)
