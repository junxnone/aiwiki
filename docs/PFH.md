---
Title | PFH
-- | --
Create Date | `2021-05-08T03:11:56Z`
Update Date | `2022-03-15T07:12:37Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/298)

---
## Reference
- [几何特征系列：Point Feature Histogram（点特征直方图）](http://lemonc.me/point-feature-histogram.html)
- [PCL计算PFH源码computePairFeatures](https://blog.csdn.net/m0_49291417/article/details/110198763)
- [【点云局部特征描述子】PFH & FPFH](https://zhuanlan.zhihu.com/p/192343758)
- [Aligning point cloud views using persistent feature histograms](https://ias.in.tum.de/_media/spezial/bib/rusu08iros-1.pdf)


## Brief
- PFH - `Point Feature Histogram` - 点特征直方图
- 通过数理统计的方法获得一个用于描述中心点邻域几何信息的直方图


<img width="600px" src="https://user-images.githubusercontent.com/2216970/158321656-336f6bf0-457d-443e-adcf-2fd5711d25e2.png">


## Algos

### Point Pair(点对)

- 红色点  $P_{q}$ 为 **Query Point**
- 以 $r$ 为半径搜索 $P_{q}$ 近邻点, 所有点两两相连组成网络
- **Point Pair** - 网络内的点两两配对得到  $k(k+1)/2$ 个点对
- 计算每个点的 PFH 复杂度: $O(k^2)$


<img width="400px" src="https://user-images.githubusercontent.com/2216970/117524062-68c8cf00-afee-11eb-81ed-bc3bc5cb60fa.png">


### 计算两点间相对差异
- 点 $p_1$ $p_2$ 各自法向量 $n_1$ $n_2$
- 在 $p_2$ 上定义局部坐标系:
  -  $u=n_1$
  - $v = u \times \frac{{p_2} - {p_1}}{{\parallel}{p_2} - {p_1}{\parallel}}_2$
  - $w = u \times v$
- $n_1$ $n_2$ 差异表示: $(\alpha, \phi, \theta)$
  - $a = v \cdot {n_2}$
  - $u \cdot \frac{{p_2} - {p_1}}{{\parallel}{{p_2} - {p_1}}{\parallel}_2}$
  - ${\theta} = {\arctan (w \cdot {n_2},u \cdot {n_2})}$

 ![image](https://user-images.githubusercontent.com/2216970/117524162-f1476f80-afee-11eb-8bef-0e1d7fa87e19.png)

### 计算 PFH


PFH Features | ![image](https://user-images.githubusercontent.com/2216970/120412955-09aa7000-c38a-11eb-8eea-bbe08f920745.png)
-- | --

![image](https://user-images.githubusercontent.com/2216970/120412760-b0dad780-c389-11eb-8fce-d837f3e1843b.png) | ![image](https://user-images.githubusercontent.com/2216970/120412790-bafcd600-c389-11eb-800f-e905d9ba8c2e.png)
-- | --

## UseCase

