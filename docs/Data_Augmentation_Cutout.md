---
Title | Data Augmentation Cutout
-- | --
Create Date | `2020-07-21T11:52:15Z`
Update Date | `2022-01-20T07:38:53Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/257)

---
## Reference
- [paper - 2017 - Improved Regularization of Convolutional Neural Networks with Cutout](https://arxiv.org/abs/1708.04552)

## Brief

- 正则化手段，减少过拟合，提高网络的泛化能力
- 相当于连续的dropout
  - dropout - 神经元 - 离散
  - cutout - 像素 - 连续
- 在图像上进行随机位置和一定大小的patch进行0-mask裁剪
- 复杂轮廓 patch --> 简单固定像素(正方形patch)
- 在分类数据集CIFAR-10/100上测试的

