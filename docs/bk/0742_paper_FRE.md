-----

| Title     | paper FRE                                             |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:22Z`                                |
| Updated @ | `2026-11-24T09:21:47Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/742) |

-----

# FRE 特征重构误差

  - **FRE**：A Fast Method For Anomaly Detection And Segmentation，论文
    [arXiv 2211.12650](https://arxiv.org/abs/2211.12650)（BMVC 2023，Intel
    Labs；anomalib 实现的是 BMVC 版本，用浅层线性自编码器）
  - 类型：Segmentation
  - 动机：已有的 SOTA 方法训练或推理代价都不小：GAN、归一化流需要昂贵的训练；PaDiM
    等需要对多层特征金字塔建模；PatchCore 用贪心 coreset
    子采样（NP 难问题）。FRE 希望**不训练任何新模型**，只用特征的**线性降维**，在 CPU 上就能以高帧率运行
  - 核心思想：正常训练数据的特征并不会张满整个高维空间，只位于一个**低维子空间**；异常特征会落在这个子空间之外，所以「原特征与其降维再还原的差」（**特征重构误差**）就是很好的异常信号
  - 与 [DFM](/0740_paper_DFM) 的 PCA 重构分数思想相近，但 FRE
    把它作为**唯一**的方法，并扩展到中间卷积层来生成像素级的异常图

## 原理

``` mermaid
graph LR
    A["正常训练图像"] --> B["预训练 DNN<br/>取某个中间层特征 u"]
    B --> C["学习线性变换 T 及其逆 T 伪逆<br/>PCA 或线性自编码器"]
    X["测试图像"] --> D["同一层特征 u"]
    D --> E["降维 T 再还原<br/>得到 重构特征"]
    C --> E
    E --> F["重构误差 e = u 减 重构<br/>FRE 分数 = e 的 L2 范数"]
    F --> G["通道维平均 + 缩放到输入大小<br/>得到 FRE 异常图"]
```

图中：

  - 在 $N$ 类分类网络上取第 $k$ 个中间层的特征 $u = f\_k(x) \\in \\mathbb{R}^{C\_k
    \\times H\_k \\times W\_k}$
  - 正常训练特征组成数据矩阵 $D = \[f\_k(x\_1) \\mid \\cdots \\mid
    f\_k(x\_M)\]$。论文指出：对大小为 $M$ 的训练集，$D$ 是**秩亏的**，在高维内层尤其严重（论文
    Table 1：ResNet18 在 CIFAR10 上，Layer 0 维度 512，秩只有 85，保留 99.5% 方差的 PCA
    只需要 29 维）
  - 因此学习一个映射 $\\mathcal{T}: \\mathcal{H} \\to \\mathcal{L}$（$\\dim
    \\mathcal{L} \\ll \\dim \\mathcal{H}$），同时学习其逆
    $\\mathcal{T}^\\dagger$。论文采用 **PCA**，$\\mathcal{T}$ 是由数据矩阵 SVD
    得到的正交线性变换，逆用 **Moore-Penrose
    伪逆**；论文指出也可以换成任何提供显式映射函数的降维或流形学习方法（BMVC
    版和 anomalib 使用**浅层线性自编码器**）

**FRE 的定义**：

$$ \\text{FRE}(u, \\mathcal{T}) = e \\triangleq u -
(\\mathcal{T}^\\dagger \\circ \\mathcal{T}),u, \\qquad
\\text{FRE}\_{score}(u, \\mathcal{T}) = \\lVert e \\rVert\_2 $$

其中：

  - $u$：被向量化的某层特征；$\\mathcal{T}$：降维变换；$\\mathcal{T}^\\dagger$：逆变换（把低维嵌入还原回高维空间的「原像」）；$\\circ$
    表示函数复合
  - $e$：重构误差，与 $u$ 同形状 $\\mathbb{R}^{C\_k \\times H\_k \\times
    W\_k}$；$\\lVert e\\rVert\_2$ 是图像级**检测分数**
  - 直观：分布外（OOD）样本落在分布内样本的子空间之外，所以重构误差更大

**像素级异常图**：把 $e$ 变形成 $C\_k$ 个 $H\_k \\times W\_k$
的通道，对每个位置沿通道平均，再缩放到输入大小 $H
\\times W$：

$$ M\_k(i, j) = \\frac{1}{C\_k}\\sum\_{c=1}^{C\_k} e(c, i, j) $$

其中 $(i,j)$ 是特征图上的位置，$c$ 是通道。得到的是与输入同分辨率的热力图，颜色越亮的区域越异常。

**层的选择**：论文研究了不同层对定位的影响，发现各种骨干上**定位效果最好的是网络中间附近的层**，兼顾空间分辨率与语义；还可以融合多层。取中间层
$m$ 以及前后各一层，用**几何平均**融合：

$$ M\_{3L} = \\big(M\_{m-1} \\cdot M\_{m} \\cdot M\_{m+1}\\big)^{1/3} $$

其中 $m$ 是中间层的编号；三层融合比单层略有提升，更多层的收益会越来越小。

## 复杂度

  - 不训练任何新模型（判别式或生成式都没有）；只使用**单个层**的特征，不是特征金字塔；没有复杂的概率建模
  - 除了 DNN 前向外，只有前向和逆向的 PCA 变换，即**矩阵乘法**，开销很低，不需要独立显卡

## 实验结果

  - **数据集**：MVTec AD、Magnetic Tile
    (MTD)；骨干：VGG16、ResNet18、ResNet50、EfficientNet-B5
  - **图像级检测**（AUROC）：MVTec AD 平均 **98.4%**（使用 EfficientNet-B5，论文 Table 2
    的 FRE 一列）；MTD 上 **99.2%**，高于
    GANomaly（76.6）、I-NN（80.0）、DifferNet（97.7）、PatchCore（97.9）
  - **不同骨干**（MVTec，检测 AUROC，Table 4）：

| Backbone  | ResNet18 | ResNet50 | VGG16 | EfficientNet-B5 |
| --------- | -------- | -------- | ----- | --------------- |
| AUROC (%) | 94.1     | 94.2     | 91.1  | **98.4**        |

表中说明 FRE 在各种骨干上效果都很好，对骨干架构并不敏感；EfficientNet-B5 最高。

  - **定位**：单层的结果已经**远超大多数方法，与当前 SOTA 持平**；三层融合后进一步提升，可以超过其他方法。论文同时报告了像素级
    AUROC 和 PRO（见 [Anomaly Detection Metrics](/0711_ML_Metrics_Anomaly)）
  - **速度（仅用 Intel Xeon Platinum 8280 CPU，无独立显卡）**：训练只需学习 PCA（不是网络权重），每个
    MVTec 类别的平均训练时间只要**几秒**；推理的完整流水线（读图、缩放、DNN 前向、算 FRE
    分数）的帧率如下，都超过普通工业相机的 30 fps：

| Backbone        | 推理帧率 (fps) | 平均训练时间 (s) |
| --------------- | ---------- | ---------- |
| ResNet18        | 251.5      | 5.77       |
| ResNet50        | 89.2       | 11.25      |
| EfficientNet-B5 | 61.5       | 7.35       |
| VGG16           | 133.1      | 8.75       |

表中是论文 Table 10：同一台 CPU 机器上，ResNet18 的速度最快（251.5 fps），EfficientNet-B5
精度最高但速度最慢（61.5 fps）；所以一个 CPU 就能同时服务多路相机，非常适合工业部署。

**anomalib 复现的结果**（README，MVTec AD 15 类平均，seed 42；ResNet-50 池化核大小 2，Wide
ResNet-50 池化核 4）：

| Backbone       | Image AUROC | Image F1 |
| -------------- | ----------- | -------- |
| ResNet-50      | 0.933       | 0.935    |
| Wide ResNet-50 | 0.947       | 0.941    |

表中是 anomalib 里（layer3 特征，浅层线性自编码器）的图像级结果，略低于论文使用 EfficientNet-B5
的结果（98.4%），与论文里 ResNet 系列骨干的 94% 左右相符；README 注明 layer3 特征的向量长度为
65536。

## 特点与局限

  - **优点**：不训练任何新网络；训练只需几秒；CPU 上就能以上百 fps
    运行；有明确的几何含义；同时给出图像级分数和像素级异常图；对骨干不敏感
  - **局限**：线性降维只能刻画线性子空间，对复杂的正常模式表达有限；精度取决于骨干（ResNet 系列图像级 AUROC 约
    94%，低于
    [PatchCore](/0535_paper_PatchCore)）；特征维度很高（65536）时占用内存较大

## Reference

  - [FRE: A Fast Method For Anomaly Detection And
    Segmentation](https://arxiv.org/abs/2211.12650)
  - [BMVC 2023 版本](https://papers.bmvc2023.org/0614.pdf)
  - [anomalib -
    Fre](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/fre)
