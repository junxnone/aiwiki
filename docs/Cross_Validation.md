---
Title | Cross Validation
-- | --
Create Date | `2020-06-11T05:02:59Z`
Update Date | `2022-01-20T07:18:04Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/249)

---


## Reference

- [几种交叉验证（cross validation）方式的比较](https://www.cnblogs.com/ysugyl/p/8707887.html)
- [sklearn - cross validation](https://scikit-learn.org/stable/modules/cross_validation.html#cross-validation)
- [sklearn.model_selection 介绍](https://www.cnblogs.com/XD00/p/12290528.html)

## Brief
- Cross Validation - `交叉验证`


Num | Cross Validation | Description
-- | -- | --
1 | K Fold  | 
2 | Repeated K-Fold | 
3 | Leave One Out (LOO) |
4 | Leave P Out (LPO) |
5 | Shuffle & Split |
6 | Stratified `@12345` |
7 | Group  `@12345` |

## Standard Cross Validation - K Fold Cross Validation
- data split `K` part
- `x` ∈ [1, K] part 作为 Test, 剩下的 `K-1` part 作为 training
> K = 5 / 10

![image](https://user-images.githubusercontent.com/2216970/84346863-93928380-abe3-11ea-9a5e-0b359987b1e3.png)

## Stratified k-fold cross validation - 分层交叉验证
- 每一折中都保持着原始数据中各个类别的比例关系
-
![image](https://user-images.githubusercontent.com/2216970/84346873-97bea100-abe3-11ea-8672-9aa9ede0fc3d.png)


## Leave-one-out Cross-validation 留一法
- 样本容量为n，则k=n，进行n折交叉验证，每次留下一个样本进行验证
- 主要针对小样本数据

## Shuffle-split cross-validation
![image](https://user-images.githubusercontent.com/2216970/84347227-98a40280-abe4-11ea-9793-d5b76e343fc0.png)

