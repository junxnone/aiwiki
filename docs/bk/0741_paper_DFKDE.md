-----

| Title     | paper DFKDE                                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:19Z`                                |
| Updated @ | `2026-11-24T09:21:49Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/741) |

-----

# DFKDE 深度特征核密度估计

  - **DFKDE**：Deep Feature Kernel Density Estimation，深度特征 + **PCA** +
    **高斯核密度估计 (KDE)**
  - 类型：Classification（图像级异常分类）
  - 这是 anomalib 自己的实现，**没有对应的原始论文**，所以下面的内容依据 anomalib 的 README
    和源码（`DfkdeModel`、`KDEClassifier`）而不是论文
  - 思路：与 [DFM](/0740_paper_DFM) 类似，都是「预训练特征 → 降维 →
    概率密度」，区别是密度估计用的是**非参数**的核密度估计，不假设单一高斯分布
  - 是 anomalib 中最简单的基线之一；与 [DFM](/0740_paper_DFM)、[FRE](/0742_paper_FRE)
    同属「深度特征 + 线性降维」的快速方法

## 原理

``` mermaid
graph LR
    A["正常图像"] --> B["预训练 CNN 骨干 冻结<br/>取指定层特征 展平为向量"]
    B --> C["PCA 降到 16 个主成分<br/>训练点超过 40000 时随机取 40000 个"]
    C --> D["特征缩放<br/>SCALE 除以训练时最大长度 或 NORM 单位化"]
    D --> E["拟合高斯 KDE"]
    T["测试图像"] --> F["同样提取 PCA 缩放"]
    F --> G["KDE 得到密度 取对数<br/>转成异常概率"]
    E --> G
```

图中：

  - **骨干**：从 timm 取预训练的 CNN，**不做任何梯度更新**；`layers`
    指定取哪些层，特征展平并拼接。**anomalib 代码里的默认是
    `resnet18` 和 `layer4`**；README 的描述写的是 ResNet50 倒数第二层（平均池化后的 2048
    维），与代码默认值不一致，以代码为准
  - **PCA**：先把特征降到前 **16** 个主成分（`n_pca_components` 默认 16）。拟合时如果特征样本数小于
    16，就不拟合（返回失败）；如果样本数超过 `max_training_points`（默认
    **40000**），则**随机**选取这么多点来拟合，控制 KDE 的计算量
  - **特征缩放**：降维后的特征要缩放后再进 KDE，有两种方式：`NORM`（缩放成**单位向量长度**，即 L2 归一化）和
    `SCALE`（除以**训练时观察到的最大长度**，保持相对大小，**默认**）
  - **KDE**：用高斯核密度估计模型拟合缩放后的训练特征；测试时对特征做同样的 PCA 和缩放，计算密度，取对数

核密度估计：

$$ \\hat{p}(x) = \\frac{1}{N h^d}\\sum\_{i=1}^{N} K\\Big(\\frac{x -
x\_i}{h}\\Big), \\qquad K(u) =
\\frac{1}{(2\\pi)^{d/2}}\\exp\\Big(-\\frac{\\lVert u \\rVert^2}{2}\\Big)
$$

其中：

  - $x$：测试样本降维并缩放后的特征；$x\_i$：第 $i$ 个训练样本的降维缩放特征；$N$：参与拟合的训练点数（至多
    40000）；$d$：降维后的维度（16）
  - $K(\\cdot)$：高斯核；每个训练样本在周围贡献一个小「山峰」，所有山峰叠加得到整体的密度估计
  - $h$：带宽，控制山峰的宽度：$h$ 小，密度曲线尖锐、容易过拟合；$h$ 大，曲线平滑、可能丢失细节；$\\hat{p}(x)$
    是估计的概率密度

**从密度到异常概率**：代码里先给密度加一个很小的常数 $10^{-300}$ 以避免对数的零除，然后取**对数似然** $s =
\\log\\hat{p}(x)$，再用 sigmoid 把分数映射成 $\[0, 1\]$ 的异常概率：

$$ P\_{anom}(x) = \\frac{1}{1 + \\exp\\big(0.05,(s - 12)\\big)} $$

其中 $s$ 是对数密度；密度越高（越正常）$s$ 越大，$P\_{anom}$ 越小；常数 12 和斜率 0.05
是代码里写死的经验值，使得对数密度约在 12 附近时概率为 0.5，$s$
越低概率越趋近于 1。

## anomalib 参数

| Parameter                | 默认值           | 说明                    |
| ------------------------ | ------------- | --------------------- |
| `backbone`               | `resnet18`    | timm 骨干名称             |
| `layers`                 | `("layer4",)` | 提取特征的层                |
| `pre_trained`            | `True`        | 是否使用预训练权重             |
| `n_pca_components`       | 16            | PCA 保留的主成分数           |
| `feature_scaling_method` | `SCALE`       | `NORM` 或 `SCALE`      |
| `max_training_points`    | 40000         | 拟合 KDE 的最大点数，超过时随机取子集 |

表中是 `Dfkde` 的主要参数。评估指标默认包含 AUROC 和 F1（见 [Anomaly Detection
Metrics](/0711_ML_Metrics_Anomaly)）。

## 评估结果

anomalib README 中的结果（MVTec AD 15 类平均，seed 42）：

| Backbone       | Image AUROC | Image F1 |
| -------------- | ----------- | -------- |
| ResNet-18      | 0.762       | 0.872    |
| Wide ResNet-50 | 0.774       | 0.875    |

表中结果明显低于 [DFM](/0740_paper_DFM)（0.936\~0.943）和
[PatchCore](/0535_paper_PatchCore)。原因主要是降到 16
维后丢失了大量信息，只作为「最小可行基线」来参考；图像级
F1 较高（0.87）是因为 F1 对不均衡数据较宽容，需要结合 AUROC 一起看。

## 特点与局限

  - **优点**：思路最简单；非参数，不假设单一高斯；训练只需提特征、做 PCA、拟合
    KDE，不需要反向传播；代码中有对大数据集的子采样保护
  - **局限**：精度低于其他方法；只有图像级输出，没有像素级异常图；KDE
    在高维度下效果急剧变差，所以必须降到很低的维度，信息损失大；推理需要保存拟合用的训练特征；概率映射用的是写死的经验常数

## Reference

  - [anomalib -
    Dfkde](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/dfkde)
  - [Kernel density estimation -
    Wikipedia](https://en.wikipedia.org/wiki/Kernel_density_estimation)
