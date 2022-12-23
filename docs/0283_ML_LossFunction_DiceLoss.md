---
Title | ML LossFunction DiceLoss
-- | --
Created @ | `2019-12-09T03:27:35Z`
Last Modify @| `2022-12-23T14:59:50Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/283)

---
## Reference

- [paper - V-Net: Fully Convolutional Neural Networks for Volumetric Medical Image Segmentation](http://campar.in.tum.de/pub/milletari2016Vnet/milletari2016Vnet.pdf)
- [Dice系数](https://zh.wikipedia.org/wiki/Dice%E7%B3%BB%E6%95%B0)
- [医学图像分割常用的损失函数](https://blog.csdn.net/Biyoner/article/details/84728417)
- [医学图像分割之 Dice Loss](https://www.aiuai.cn/aifarm1159.html)
- [Pytorch Dice Loss](https://github.com/pytorch/pytorch/issues/1249#issuecomment-337999895)
- [Dice-coefficient loss for image segmentation](https://blog.masterliu.net/dice-loss/)

## Brief
## Dice 系数
- 根据 Lee Raymond Dice 命名,  一种集合相似度度量函数，通常用于计算两个样本的相似度
- 范围为0到1
---
![image](https://user-images.githubusercontent.com/2216970/70405169-37557800-1a77-11ea-88d2-9f328c4e884f.png)

- **|X∩Y| :** X 和 Y 的交集
- **|X| :**  X 的元素个数 
- **|Y| :**  Y 的元素个数
- 分子中的系数 2 ， 是因为 X , Y 中存在重复元素

---
### Dice coefficient  vs Jaccard Index 

![image](https://user-images.githubusercontent.com/2216970/70427183-3b9d8780-1aaf-11ea-840a-626273dc4919.png)
![image](https://user-images.githubusercontent.com/2216970/70427192-3e987800-1aaf-11ea-9d99-06d028fe7be6.png)
- J - Jaccard Index
- S - Dice coefficient 

---
**差异函数，即 `Dice Loss`**

![image](https://user-images.githubusercontent.com/2216970/70405474-4e489a00-1a78-11ea-9e0f-3c2fd4ee5a2b.png)



##  `Dice Loss` -  图像分割应用
- **X:** Ground-Truth
- **Y:** Predict Result

---
- **|X∩Y| :** X 和 Y 的点乘后的元素求和

![image](https://user-images.githubusercontent.com/2216970/70410734-02532080-1a8b-11ea-8079-91229725e89c.png)
![image](https://user-images.githubusercontent.com/2216970/70410747-1008a600-1a8b-11ea-81b9-b795f6cb42bd.png)

---
- **|X| :**  X 的元素取和 
- **|Y| :**  Y 的元素取和

![image](https://user-images.githubusercontent.com/2216970/70410773-2ca4de00-1a8b-11ea-9dac-9d001c8a1436.png)

### Dice 系数和 F1-Score 的关系
Metric | 公式
-- | --
F1-Score | ![image](https://user-images.githubusercontent.com/2216970/70413978-b658a980-1a93-11ea-8d0f-b59eaf363d8a.png)
Prcision | ![image](https://user-images.githubusercontent.com/2216970/70414007-ccff0080-1a93-11ea-8bc9-eb191c23ca52.png)
Recall | ![image](https://user-images.githubusercontent.com/2216970/70414017-d38d7800-1a93-11ea-9a88-7a501d084256.png)
 F1-Score | ![image](https://user-images.githubusercontent.com/2216970/70414245-7fcf5e80-1a94-11ea-9d61-a9d741b0fb09.png)

> TP = Ground-Truth ∩ Predict Result
> FN = Ground-Truth - TP
> FP = Predict Result - TP
> F1-Score = 2TP/ True + Pred 即 Dice 系数

即 `Dice Loss = 1 - F1-Score`

## smooth
- Laplace smoothing
  - 减少 Overfitting 加快收敛
  - 避免分母为 0



