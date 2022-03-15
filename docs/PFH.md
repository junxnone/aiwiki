---
Title | PFH
-- | --
Create Date | `2021-05-08T03:11:56Z`
Update Date | `2022-03-15T06:39:52Z`
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

## Algos

### Point Pair(点对)

![image](https://user-images.githubusercontent.com/2216970/117524062-68c8cf00-afee-11eb-81ed-bc3bc5cb60fa.png) 

- 红色点  $P_{q}$ 为 **Query Point**
- 以 $r$ 为半径搜索近邻点 
- **Point Pair** - 以 $P_{q}$  为 中心,  $r$ 为半径的球体内 k 个邻域点两两配对得到  $k(k+1)/2$ 个点对
  - 计算复杂度 $O(k^2)$

### 计算 PFH
- 建立局部坐标系 (u, v, w)
- 计算点对特征

![image](https://user-images.githubusercontent.com/2216970/117524062-68c8cf00-afee-11eb-81ed-bc3bc5cb60fa.png) | ![image](https://user-images.githubusercontent.com/2216970/117524162-f1476f80-afee-11eb-8bef-0e1d7fa87e19.png)
-- | --

PFH Features | ![image](https://user-images.githubusercontent.com/2216970/120412955-09aa7000-c38a-11eb-8eea-bbe08f920745.png)
-- | --

![image](https://user-images.githubusercontent.com/2216970/120412760-b0dad780-c389-11eb-8fce-d837f3e1843b.png) | ![image](https://user-images.githubusercontent.com/2216970/120412790-bafcd600-c389-11eb-800f-e905d9ba8c2e.png)
-- | --

## UseCase

