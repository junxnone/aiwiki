---
Title | ML AutoML NAS PNAS
-- | --
Created @ | `2020-07-23T01:52:54Z`
Updated @| `2023-03-25T14:39:46Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/388)

---
# PNAS

- Progressive Neural Architecture Search
- 将大的搜索空间分解为小的搜索空间的乘积
- Operator -> Block -> Cell -> CNN
- 不区分 `Normal Cell` & `Reduction Cell`
  - `Normal Cell` 功能实现 - stride=1
  - `Reduction Cell` 功能实现 - stride=2


## Arch
- CNN = Cell x M
- Cell = Block x B
- Block = Input x 2 + Operator x 2 + Combination x 1
  - Combination - only `Addition`

Operator |
-- |
3x3 depthwise-separable convolution
5x5 depthwise-separable convolution
7x7 depthwise-separable convolution
1x7 followed by 7x1 convolution
identity
3x3 average pooling
3x3 max pooling
3x3 dilated convolution

## Search Space
 
Name | Formula
-- | --
Possible Block | ![image](https://user-images.githubusercontent.com/2216970/88246647-a95c9380-cccd-11ea-9635-140f1b7c2d81.png)
Block b Input  | ![image](https://user-images.githubusercontent.com/2216970/88247404-2c7ee900-ccd0-11ea-859d-6a5ff96f0b0d.png)
Operation | ![image](https://user-images.githubusercontent.com/2216970/88247434-46203080-ccd0-11ea-952b-ac0e6c093ac6.png)
Combination | ![image](https://user-images.githubusercontent.com/2216970/88247453-520bf280-ccd0-11ea-8091-738be14b5c0e.png)
For b = 1 | ![image](https://user-images.githubusercontent.com/2216970/88247468-5f28e180-ccd0-11ea-84dc-02e0e18a38c0.png)  <br> `B1` = 2x2x8x8x1 = 256
B = 5<br>Cell = Block x 5 |  `B1:5` = `4x64` x `9x64` x `16x64` x `25x64` x `36x64` = 5.6 x10e14<br> 去掉对称 Cells ~10e12


## Algos
- 渐进式搜素 - `B=1` -> `B=2` -> `B=3` ...
- 使用 Bn-1 的模型作为 predictor 评估 Bn Cell 性能, 选出最佳 k Bn-Cell
- Bn-Cell 训练 Bn-Model 作为 Bn+1 Cell 的评估 predictor

![image](https://user-images.githubusercontent.com/2216970/88246427-102d7d00-cccd-11ea-8bdc-a50d867b4d9c.png)

![image](https://user-images.githubusercontent.com/2216970/88247910-09553900-ccd2-11ea-9cac-57e27319f88f.png)

## Surrogate Model
- 可以处理可变输入 - trained with `b` Block , predict with `b+1` Block
- 与实际 performance 相关 - 不需要真实的 `mean squared error`, 但是要给出真实的 performance 排序
- Sample Efficiency - 需要尽可能少的training & evaluate, training data 稀疏

LSTM & MLP
-- | 
![image](https://user-images.githubusercontent.com/2216970/88249899-6653ed80-ccd8-11ea-9960-d5117203bf25.png)


## Search Result
![image](https://user-images.githubusercontent.com/2216970/88245796-0c98f680-cccb-11ea-8a90-d014013bd813.png)



## Reference

- [paper - 2017 - Progressive Neural Architecture Search](https://arxiv.org/pdf/1712.00559.pdf)
- [AutoDL论文解读（六）：基于代理模型的NAS](https://blog.csdn.net/u014157632/article/details/102568194)
- [【PNAS】2018-ECCV-Progressive Neural Architecture Search-论文阅读](https://www.cnblogs.com/chenbong/p/12939380.html)



