-----

| Title     | paper DFKDE                                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:19Z`                                |
| Updated @ | `2026-11-24T08:14:19Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/741) |

-----

# DFKDE 深度特征核密度估计

  - **DFKDE**：Deep Feature Kernel Density Estimation，深度特征 + **PCA** +
    **高斯核密度估计 (KDE)**
  - 类型：Classification（图像级异常分类）
  - 思路：与 [DFM](/0740_paper_DFM) 类似，都是「预训练特征 → 降维 →
    概率密度」，区别是密度估计用的是**非参数**的核密度估计，不假设单一高斯分布
  - anomalib 中最简单的基线之一；README 没有给出对应的论文链接

## 原理

下图是 DFKDE 的流程：

``` mermaid
graph LR
    A["正常图像"] --> B["ResNet-50 预训练骨干<br/>倒数第二层 2048 维特征"]
    B --> C["PCA 保留前 16 个主成分"]
    C --> D["保存训练特征 作为 KDE 的样本"]
    T["测试图像"] --> E["同样提取特征并 PCA"]
    E --> F["核密度估计<br/>得到概率密度 越低越异常"]
    D --> F
```

图中：

  - 骨干为 ImageNet 预训练的 ResNet-50，取平均池化层输出的 2048 维向量作为语义特征
  - 先把特征降到前 16 个主成分，再用高斯核密度估计得到新样本的概率密度
  - 训练阶段只是保存训练集的降维特征，推理时基于这些特征计算测试样本的密度，密度越低越异常

核密度估计：

$$ \\hat{p}(x) = \\frac{1}{N h^d}\\sum\_{i=1}^{N} K\\Big(\\frac{x -
x\_i}{h}\\Big), \\qquad K(u) =
\\frac{1}{(2\\pi)^{d/2}}\\exp\\Big(-\\frac{\\lVert u \\rVert^2}{2}\\Big)
$$

其中：

  - $x$：测试样本的降维特征；$x\_i$：第 $i$ 个训练样本的降维特征；$N$：训练样本数；$d$：降维后的维度（这里为 16）
  - $K(\\cdot)$：高斯核，$u$ 为归一化后的差向量；每个训练样本在周围贡献一个小「山峰」，所有山峰叠加得到整体的密度估计
  - $h$：带宽，控制山峰的宽度：$h$ 小，密度曲线尖锐、容易过拟合；$h$ 大，曲线平滑、可能丢失细节
  - $\\hat{p}(x)$：估计的概率密度；异常分数可取 $-\\log\\hat{p}(x)$，越大越异常

## 特点

| Name    | 说明                                 |
| ------- | ---------------------------------- |
| 非参数     | 不假设数据服从高斯分布，可以拟合多峰分布               |
| 低维才有效   | KDE 随维度增长效果迅速变差（维数灾难），所以必须先降到 16 维 |
| 需保存训练特征 | 推理时要使用全部训练样本的特征，样本多时变慢             |
| 只能做图像级  | 不提供像素级异常图                          |

表中是 DFKDE 的特点：它是最简单的图像级基线，但因为降维到很低的维度，信息损失较大。

## 使用与评估

``` bash
anomalib train --model Dfkde --data MVTecAD --data.category <category>
```

anomalib README 中的结果（MVTec AD 15 类平均，seed 42）：

| Backbone       | Image AUROC | Image F1 |
| -------------- | ----------- | -------- |
| ResNet-18      | 0.762       | 0.872    |
| Wide ResNet-50 | 0.774       | 0.875    |

表中结果明显低于 [DFM](/0740_paper_DFM)（0.936\~0.943）和
[PatchCore](/0535_paper_PatchCore)。原因主要是降到 16
维后丢失了大量信息，只作为「最小可行基线」来参考；图像级
F1 较高（0.87）是因为 F1 对不均衡数据较宽容，需要结合 AUROC 一起看，见 [Anomaly Detection
Metrics](/0711_ML_Metrics_Anomaly)。

## 优缺点

  - **优点**：思路最简单；非参数；训练只需提特征
  - **缺点**：精度低于其他方法；无定位能力；对维度和带宽敏感；推理需要保存全部训练样本

## Reference

  - [anomalib -
    Dfkde](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/dfkde)
  - [Kernel density estimation -
    Wikipedia](https://en.wikipedia.org/wiki/Kernel_density_estimation)
