---
Title | BO TPE
-- | --
Create Date | `2021-03-30T07:38:38Z`
Update Date | `2022-01-20T02:05:31Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/221)

---
## Reference
- 2011 [Algorithms for Hyper-Parameter Optimization](https://papers.nips.cc/paper/2011/file/86e8f7ab32cfd12577bc2619bc635690-Paper.pdf)
- 2013 [Making a Science of Model Search: Hyperparameter Optimization in Hundreds of Dimensions for Vision Architectures](http://proceedings.mlr.press/v28/bergstra13.pdf)
- [Tree-structured Parzen Estimator（TPE）](https://zhuanlan.zhihu.com/p/55606172)
- [Towards automating machine learning: benchmarking tools for hyperparameter tuning, Thorben Jensen](https://github.com/ThorbenJensen/pydata2018berlin-hyperparameter-optimization/blob/master/pydata_hyperparameter.pdf)

## Brief
- TPE - Tree-structured Parzen Estimator
  - 参数空间是树形的, 存在依赖关系 - `Configuration spaces are tree-structured`
- 可异步并行
- TPE 是根据 p(x|y) 和 p(y) 进行建模

Steps | 推导
-- | --
选取 loss 阈值 y* | ![image](https://user-images.githubusercontent.com/2216970/113107028-fe29b400-9235-11eb-8070-345428e97c54.png)
** | ![image](https://user-images.githubusercontent.com/2216970/113107171-303b1600-9236-11eb-9b55-d8da4f4ec54c.png)
构造参数 | ![image](https://user-images.githubusercontent.com/2216970/113107332-5fea1e00-9236-11eb-91af-ab2b173ca008.png)
构造函数 | ![image](https://user-images.githubusercontent.com/2216970/113107351-67a9c280-9236-11eb-8640-76956ad9fe51.png)
** | ![image](https://user-images.githubusercontent.com/2216970/113107390-72fcee00-9236-11eb-80c5-cef5cfc2a72d.png)
** | ![image](https://user-images.githubusercontent.com/2216970/113107241-4648d680-9236-11eb-9b36-e030ffc93ce3.png)

y* | l(x) & g(x)
--  | --
![image](https://user-images.githubusercontent.com/2216970/113115929-85c7f080-923f-11eb-8f56-6e6dfd68e302.png) | ![image](https://user-images.githubusercontent.com/2216970/113115941-895b7780-923f-11eb-889d-c92b0f9087b1.png)

## Pipeline

Steps  |  Diagram
-- | -- 
1  测试超参数<br>选择Loss 阈值<br> - Best<br> - Worse |  ![image](https://user-images.githubusercontent.com/2216970/113118901-77c79f00-9242-11eb-9356-d55a2a656920.png)
2  构建Best/Worse分布<br>对候选参数求分布值 | ![image](https://user-images.githubusercontent.com/2216970/113118969-8615bb00-9242-11eb-96fb-084c51194f4d.png)
3  `EI = p(good)/p(bad)` | ![image](https://user-images.githubusercontent.com/2216970/113119097-a47bb680-9242-11eb-8c60-19eed2e5b6e0.png)

