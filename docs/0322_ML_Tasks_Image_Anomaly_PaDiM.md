---
Title | ML Tasks Image Anomaly PaDiM
-- | --
Created @ | `2022-12-05T01:58:43Z`
Updated @| `2024-05-20T08:53:13Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/322)

---


# PaDiM

- **嵌入提取**
  - 使用预训练的 CNN 网络生成 Image Embedding
  - 提取中间层feature 组成嵌入向量
  - 使用随机选择来降低维数，去除冗余信息
- 正常类的学习 - 构建正常类特征
  - 对训练集中正常图片相应的 `patch` 建模高斯分布, 作为正常特征
- 计算 `Anomaly Map` - 待测试图片与正常类特征计算相似度
  - 对待测试图片计算特征向量，根据 `Mahalanobis Distance` 马氏距离计算`相应patch`的异常分数



## Arch

![image](https://user-images.githubusercontent.com/2216970/205532590-251f42c2-ebaf-44ad-a5a4-ff6a5655bf47.png)


## Reference

- [PaDiM: a Patch Distribution Modeling Framework for Anomaly Detection and Localization](https://arxiv.org/pdf/2011.08785.pdf) 

