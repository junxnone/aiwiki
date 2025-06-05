-----

| Title     | ML Tasks Image Anomaly                                |
| --------- | ----------------------------------------------------- |
| Created @ | `2019-04-08T07:06:13Z`                                |
| Updated @ | `2025-06-05T09:16:16Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/277) |

-----

# Image Anomaly Detection

  - 产品缺陷检测/不正常行为检测/医学图像检测

## 存在的问题

  - **泛化性差**：传统异常检测方法通常是 “一对一” 模式，即针对每个类别或产品单独训练模型，这严重限制了模型的泛化能力。
  - 异常数据样本稀缺
      - 异常生成方法的有限多样性
  - **无监督异常检测问题**: 模型存在尾部与噪声的权衡，如果模型对像素噪声具有鲁棒性，那么它在尾部类样本上的性能会下降，反之亦然。

## Algos

### 算法分类

  - 基于重建的，对检测图像重建后计算距离获取异常map
  - Zero-Shot
  - 无监督
  - 

-----

  - 无监督学习
  - AutoEncoder
  - GAN
  - [PaDiM](/0322_paper_PaDiM)
  - [STFPM](/0324_paper_STFPM)
  - DFM
  - DFKDE
  - Draem
  - AnomalyCLIP
  - AnomalyGPT
  - MuSC

## 数据集

  - MVTec

## 应用

  - 缺陷检测
  - 医学图像异常检测
  - 工业危害检测

## Tools

  - [anomalib](https://github.com/openvinotoolkit/anomalib)

## Reference

  - [awesome anomaly
    detection](https://github.com/hoya012/awesome-anomaly-detection)
  - [斯坦福NG机器学习课程：Anomaly
    Detection笔记](https://www.cnblogs.com/mfrbuaa/p/5219885.html)
  - [anomaly-detection-resources](https://github.com/yzhao062/anomaly-detection-resources)
  - [基于异常检测算法的图片异常检测](https://zhuanlan.zhihu.com/p/45266398)
  - [异常检测概览——孤立森林
    效果是最好的](https://www.cnblogs.com/bonelee/p/7776711.html)
  - [iForest （Isolation Forest）孤立森林 异常检测
    入门篇](https://www.jianshu.com/p/5af3c66e0410)
  - [半监督”异常检测方法GANomaly](https://zhuanlan.zhihu.com/p/47832951)
  - [IM-IAD：工业制造中的工业图像异常检测基准](https://blog.csdn.net/m0_63828250/article/details/136891730)
  - [awesome-industrial-anomaly-detection](https://github.com/M-3LAB/awesome-industrial-anomaly-detection)
