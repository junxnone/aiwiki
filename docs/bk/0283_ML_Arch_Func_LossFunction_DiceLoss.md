-----

| Title     | ML Arch Func LossFunction DiceLoss                    |
| --------- | ----------------------------------------------------- |
| Created @ | `2019-12-09T03:27:35Z`                                |
| Updated @ | `2023-02-06T01:59:11Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/283) |

-----

# Dice Loss

## Reference

  - [paper - V-Net: Fully Convolutional Neural Networks for Volumetric
    Medical Image
    Segmentation](http://campar.in.tum.de/pub/milletari2016Vnet/milletari2016Vnet.pdf)
  - [Dice系数](https://zh.wikipedia.org/wiki/Dice%E7%B3%BB%E6%95%B0)
  - [医学图像分割常用的损失函数](https://blog.csdn.net/Biyoner/article/details/84728417)
  - [医学图像分割之 Dice Loss](https://www.aiuai.cn/aifarm1159.html)
  - [Pytorch Dice
    Loss](https://github.com/pytorch/pytorch/issues/1249#issuecomment-337999895)
  - [Dice-coefficient loss for image
    segmentation](https://blog.masterliu.net/dice-loss/)

## Brief

## Dice 系数

  - 根据 Lee Raymond Dice 命名, 一种集合相似度度量函数，通常用于计算两个样本的相似度
  - 范围为0到1

-----

![image](media/d5b36d9059b681386f5023d5deba8aafec246966.png)

  - **|X∩Y| :** X 和 Y 的交集
  - **|X| :** X 的元素个数
  - **|Y| :** Y 的元素个数
  - 分子中的系数 2 ， 是因为 X , Y 中存在重复元素

-----

### Dice coefficient vs Jaccard Index

![image](media/a448f8137609ab9b9d10ab63f9ca849b59cdfd6f.png)
![image](media/0625903cdddd7fdc3ac12de65ade232533c92eeb.png)

  - J - Jaccard Index
  - S - Dice coefficient

-----

**差异函数，即 `Dice Loss`**

![image](media/6b2d649e5f1248eb89d1dfa1eb177e80075ae485.png)

## `Dice Loss` - 图像分割应用

  - **X:** Ground-Truth
  - **Y:** Predict Result

-----

  - **|X∩Y| :** X 和 Y 的点乘后的元素求和

![image](media/7be17bd0b43fdc1c1bbec72716044412b05387a0.png)
![image](media/fd726042c1188c4a63a38e3cd208667d7ac30cdb.png)

-----

  - **|X| :** X 的元素取和
  - **|Y| :** Y 的元素取和

![image](media/9f7eb25fe599a865956a5231b9b35988b434d6f3.png)

### Dice 系数和 F1-Score 的关系

| Metric   | 公式                                                           |
| -------- | ------------------------------------------------------------ |
| F1-Score | ![image](media/9aa8ecc0e229e906ede6be416a45f5ec9d8de55a.png) |
| Prcision | ![image](media/9908dc7fca98c9e7e14ec3a2c2f0137762da8941.png) |
| Recall   | ![image](media/0378bf471bea30fba66084dedb176abc8b2da3c6.png) |
| F1-Score | ![image](media/ccff9a0b5525db9ad3752be1c282ff86de1c3400.png) |

> TP = Ground-Truth ∩ Predict Result FN = Ground-Truth - TP FP = Predict
> Result - TP F1-Score = 2TP/ True + Pred 即 Dice 系数

即 `Dice Loss = 1 - F1-Score`

## smooth

  - Laplace smoothing
      - 减少 Overfitting 加快收敛
      - 避免分母为 0
