-----

| Title         | ML AutoML HPO BO TPE                                  |
| ------------- | ----------------------------------------------------- |
| Created @     | `2021-03-30T07:38:38Z`                                |
| Last Modify @ | `2022-12-24T13:21:15Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/221) |

-----

## Reference

  - 2011 [Algorithms for Hyper-Parameter
    Optimization](https://papers.nips.cc/paper/2011/file/86e8f7ab32cfd12577bc2619bc635690-Paper.pdf)
  - 2013 [Making a Science of Model Search: Hyperparameter Optimization
    in Hundreds of Dimensions for Vision
    Architectures](http://proceedings.mlr.press/v28/bergstra13.pdf)
  - [Tree-structured Parzen
    Estimator（TPE）](https://zhuanlan.zhihu.com/p/55606172)
  - [Towards automating machine learning: benchmarking tools for
    hyperparameter tuning, Thorben
    Jensen](https://github.com/ThorbenJensen/pydata2018berlin-hyperparameter-optimization/blob/master/pydata_hyperparameter.pdf)

## Brief

  - TPE - Tree-structured Parzen Estimator
      - 参数空间是树形的, 存在依赖关系 - `Configuration spaces are tree-structured`
  - 可异步并行
  - TPE 是根据 p(x|y) 和 p(y) 进行建模

| Steps          | 推导                                                           |
| -------------- | ------------------------------------------------------------ |
| 选取 loss 阈值 y\* | ![image](media/e6c08ffe7aaad3bfca73978cf4e78cf7d6024766.png) |
| \*\*           | ![image](media/7fe6afb5ab5f4fb4dd61159d8c4e130444212de4.png) |
| 构造参数           | ![image](media/48ae5b022d1c7a1ff998beb269e14f5b457ee4ed.png) |
| 构造函数           | ![image](media/da3d8e02add12aecba07c95c4a45419059e67052.png) |
| \*\*           | ![image](media/2c6fc90609605e7a888685fbbcb90983c1b336fe.png) |
| \*\*           | ![image](media/db7fb412abbb1aa8e0976e457719dd8e1abca9f8.png) |

| y\*                                                          | l(x) & g(x)                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| ![image](media/8ff63f2d3332127772ede14ed99d63974d19b4ca.png) | ![image](media/ba40b0a5e7be8fa2000598af6ebcff973dc6a61b.png) |

## Pipeline

| Steps                                       | Diagram                                                      |
| ------------------------------------------- | ------------------------------------------------------------ |
| 1 测试超参数<br>选择Loss 阈值<br> - Best<br> - Worse | ![image](media/170da7110a843c03bb31ed127e2c354fb2335651.png) |
| 2 构建Best/Worse分布<br>对候选参数求分布值               | ![image](media/978e7b20f5d67dd6535ef94765d596cb2893333a.png) |
| 3 `EI = p(good)/p(bad)`                     | ![image](media/fbd2e1675af2d33da974187950db15f19dae1ea2.png) |
