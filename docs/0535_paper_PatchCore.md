---
Title | paper PatchCore
-- | --
Created @ | `2026-03-24T08:34:11Z`
Updated @| `2026-03-24T08:34:11Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/535)

---
# PatchCore
- 只需要给正常产品的图片


## 原理
- 给正常产品 “建特征库”
  - 把所有正常产品的图片，拆成一个个小补丁（比如像拼图的小块），然后提取每个补丁的 “特征”
  - 选取图片的 “中层特征”，既不会太抽象（避免受训练数据的干扰），又能保留足够细节（比如小划痕这种细微缺陷）
- 给特征库 “瘦身” 提效率
  -  “精选抽样” ，从庞大的特征库中挑出最有代表性的一小部分（比如只留 1%），既不丢关键信息，又能让后续检测速度
- 检测时 “对比找茬”
  - 检测的产品图片时，也拆成小补丁，然后逐个对比 “记忆库” 里的正常补丁：如果某个补丁和记忆库里的正常补丁差别特别大，就判定这个地方是瑕疵

<img width="1416" height="390" alt="Image" src="https://github.com/user-attachments/assets/2dd0c5e0-face-4643-89b7-bd1e39d63a1d" />

## 特征提取
- 使用基于ImageNet 预训练的卷积骨干网络，围绕局部补丁（Patch） 做精细化设计，既规避了预训练模型的领域偏差，又保留了工业缺陷所需的细节与空间信息
- 摒弃网络最后一层的高层抽象特征（易受 ImageNet 自然图像分类偏差影响，丢失局部细节），也不单独用底层特征（噪声多、语义信息弱），而是选择中层特征层（默认 ResNet-like 的 layer2+layer3）。

## Reference
- [paper 2022 Towards Total Recall in Industrial Anomaly Detection](https://arxiv.org/pdf/2106.08265)
