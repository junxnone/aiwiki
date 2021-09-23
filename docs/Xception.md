---
Title | Xception
-- | --
Create Date | `2021-09-23T12:47:52Z`
Update Date | `2021-09-23T12:47:52Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/50)

---

# Reference
- 2016 **Xception** Xception: Deep Learning with Depthwise Separable Convolutions [[paper](https://arxiv.org/abs/1610.02357)]
- [Xception 分析](https://blog.csdn.net/lk3030/article/details/84847879)

# Brief

Xception 网络是 Inception v3 的改进, 由 `François Chollet` 于 2016 年发表，后用于MobileNet

- 提出深度可分离卷积 - depthwise separable convolutions

## 网络结构
![image](https://user-images.githubusercontent.com/2216970/70120320-4323f180-16a7-11ea-87ba-feb0e74aafbb.png)

## Module Improve

Name | Module
-- | --
经典 Inception V3 | ![image](https://user-images.githubusercontent.com/2216970/70115838-e8d16380-169b-11ea-96be-430fdd6a7f7c.png)
简化 Inception | ![image](https://user-images.githubusercontent.com/2216970/70115847-f1299e80-169b-11ea-8195-d269ba6633cf.png)
提取 1x1 Conv | ![image](https://user-images.githubusercontent.com/2216970/70115867-fe468d80-169b-11ea-98b4-cc62f7a120d3.png)
Xception - extreme Inception | ![image](https://user-images.githubusercontent.com/2216970/70115874-06063200-169c-11ea-868a-e4e1bdfa0a66.png)

---
**Diff with Depthwise Separable Conv**
- Depthwise Separable Conv
  - 先对通道进行卷积再 1x1 卷积
  - 两个卷积间不带激活函数
- Xception 
  - 先1x1卷积，再对通道卷积
  - ReLU 激活

