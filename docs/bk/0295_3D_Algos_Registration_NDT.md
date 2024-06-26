-----

| Title         | 3D Algos Registration NDT                             |
| ------------- | ----------------------------------------------------- |
| Created @     | `2022-03-09T07:44:46Z`                                |
| Last Modify @ | `2022-12-25T04:52:21Z`                                |
| Labels        | `index`                                               |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/295) |

-----

# NDT Normal Distributions Transform

## Reference

  - [The Normal Distributions Transform: A New Approach to Laser Scan
    Matching](https://www.researchgate.net/publication/4045903_The_Normal_Distributions_Transform_A_New_Approach_to_Laser_Scan_Matching)
  - [3D-NDT-匹配算法](http://epsilonjohn.club/2020/03/06/Autoware.ai/3D-NDT-%E5%8C%B9%E9%85%8D%E7%AE%97%E6%B3%95/)
  - [The Three-Dimensional Normal-Distributions Transform --- an
    Efficient Representation for Registration, Surface Analysis, and
    Loop
    Detection](https://www.researchgate.net/publication/229213868_The_Three-Dimensional_Normal-Distributions_Transform_---_an_Efficient_Representation_for_Registration_Surface_Analysis_and_Loop_Detection)
  - [NDT（Normal Distributions Transform）算法原理与公式推导
    ](https://www.cnblogs.com/21207-iHome/p/8039741.html)
  - [NDT方法在SLAM中的应用 ](https://www.cnblogs.com/yhlx125/p/5749770.html)

## Brief

  - NDT - `Normal Distributions Transform` 正态分布变换
  - PDF - `Probility Density Functions` 概率分布函数

### Pipeline

  - 划分空间网格，并计算每个网格的多维正态分布参数(均值/协方差矩阵)
  - 根据参考数据构建多维变量正态分布
  - 

| 2D                                                           | 3D                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/8969d3da122f04a052d53242a042ea37e4a42cd4.png) | ![image](media/f8e46fecd6808de4872435ffc8f693e3d2b5cff4.png) |
