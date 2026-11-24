-----

| Title     | paper DFM                                             |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:17Z`                                |
| Updated @ | `2026-11-24T08:14:17Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/740) |

-----

# DFM 深度特征建模

  - **DFM**：Probabilistic Modeling of Deep Features for
    Out-of-Distribution and Adversarial Detection，论文
    [arXiv 1909.11786](https://arxiv.org/pdf/1909.11786.pdf)
  - 类型：Classification（图像级异常分类，也可以由特征重构分数生成异常图）
  - 思路：深度特征提取 + **PCA** + **类条件高斯密度估计**，是一种快速、简单的异常分类算法，可作为强基线
  - 属于 [anomalib](/0321_Tools_anomalib) 的特征建模类模型；同类的简单方法还有
    [DFKDE](/0741_paper_DFKDE)、[FRE](/0742_paper_FRE)

## 原理

下图是 DFM 的流程：

``` mermaid
graph LR
    A["正常图像"] --> B["ResNet-18 预训练骨干<br/>倒数第二层 2048 维特征"]
    B --> C["PCA 降维"]
    C --> D["拟合高斯密度"]
    T["测试图像"] --> E["同样提取特征并 PCA"]
    E --> F["两种分数<br/>特征重构误差 与 负对数似然"]
    D --> F
    C --> F
```

图中：

  - 把图像送入在 ImageNet 上预训练的 ResNet，取平均池化后的特征向量（固定长度）作为图像的语义特征
  - 在正常图像的特征上学习 PCA 变换和高斯密度模型
  - 测试时可以计算两种异常分数：**特征重构分数**和**负对数似然**；其中异常图只由特征重构分数生成，图像级分数两种都可以使用

分数的定义：

$$ s\_{recon}(x) = \\big\\lVert x - W W^\\top (x - \\mu) - \\mu
\\big\\rVert\_2, \\qquad s\_{nll}(x) = -\\log \\mathcal{N}\\big(W^\\top
(x-\\mu);, 0, \\Lambda\\big) $$

其中：

  - $x$：测试图像的高维特征向量；$\\mu$：正常特征的均值；$W$：PCA 保留的主成分方向组成的矩阵，$W W^\\top (x -
    \\mu) + \\mu$ 即把 $x$ 投影到低维子空间再还原得到的「原像」
  - $s\_{recon}$：**特征重构分数**，原特征与原像的差的范数；正常特征大部分信息位于主成分子空间内，重构误差小，异常特征偏离这个子空间，误差大
  - $s\_{nll}$：**负对数似然**，$W^\\top(x - \\mu)$ 为 PCA 低维表示，$\\Lambda$
    为各主成分方差构成的对角协方差矩阵；表示在学到的高斯分布下，该样本出现的不可能程度，越大越异常
  - 两个分数都是越大越异常，分别衡量「偏离子空间的程度」和「在子空间内的位置是否合理」

## 特点

| Name       | 说明                                                  |
| ---------- | --------------------------------------------------- |
| 训练极快       | 只需提取特征、PCA 和估计高斯参数，没有反向传播                           |
| 推理快        | 一次前向加线性变换                                           |
| 可解释        | 分数有明确的统计含义                                          |
| 图像级为主      | 主要用于图像级分类；异常图只支持特征重构分数                              |
| 对骨干和池化设置敏感 | anomalib 说明：ResNet-18 使用池化核大小 2，Wide ResNet-50 使用 4 |

表中是 DFM 的特点：它是简单的基线，速度快但只提供图像级的强结果。

## 使用与评估

``` bash
anomalib train --model Dfm --data MVTecAD --data.category <category>
```

anomalib README 中的结果（MVTec AD 15 类平均，seed 42）：

| Backbone       | Image AUROC | Image F1 |
| -------------- | ----------- | -------- |
| ResNet-18      | 0.936       | 0.943    |
| Wide ResNet-50 | 0.943       | 0.950    |

表中只有图像级指标。DFM 的整体表现已经接近 [PaDiM](/0322_paper_PaDiM) 的图像级
AUROC（0.891\~0.950），但速度快得多，所以适合作为对比的基线。

## 优缺点

  - **优点**：训练和推理都很快；简单稳定；图像级分类效果不错
  - **缺点**：单一高斯假设对多模态的正常数据不够；定位能力弱，不及 [PatchCore](/0535_paper_PatchCore)
    等 Patch 级方法；依赖预训练特征

## Reference

  - [Probabilistic Modeling of Deep Features for Out-of-Distribution and
    Adversarial Detection](https://arxiv.org/pdf/1909.11786.pdf)
  - [anomalib -
    Dfm](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/dfm)
