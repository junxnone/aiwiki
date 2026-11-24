-----

| Title     | paper AIVAD                                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:15:10Z`                                |
| Updated @ | `2026-11-24T09:20:54Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/764) |

-----

# AIVAD 基于属性表示的视频异常检测

  - **AI-VAD**：Attribute-based Representations for Accurate and
    Interpretable Video Anomaly Detection，作者 Tal Reiss、Yedid Hoshen，论文
    [arXiv 2212.00789](https://arxiv.org/abs/2212.00789)，官方代码
    [talreiss/Accurate-Interpretable-VAD](https://github.com/talreiss/Accurate-Interpretable-VAD)
  - 类型：视频异常检测（anomalib `models/video/ai_vad`，目录没有 README，anomalib
    用法依据源码文档）
  - 问题：视频异常检测 (VAD)
    是监控的核心目标，常见的是**单类**设置：训练时只见到正常视频，部署时要区分「正常」和「语义上有意义的异常」。难点在于什么是异常带有主观性（两个操作员可能意见不同），而且没有标注的异常，无法直接学习判别模式。因此用户需要理解系统决策的依据，来判断判定是否合理
  - 核心思想：一种简单但很有效的方法，用**基于属性的表示**同时提升 VAD
    的准确率和**可解释性**：每个目标用**速度**和**姿态**两个显式属性表示；用**基于密度**的方法计算异常分数；再结合隐式的\*\*深度特征（CLIP）\*\*补足
  - 论文结果：令人意外的是，仅靠这种简单表示就在最大最复杂的 VAD 数据集 ShanghaiTech 上达到
    SOTA；再结合深度特征后，在 Ped2、Avenue、ShanghaiTech 上的
    AUROC 分别达到
    **99.1%、93.3%、85.9%**；方法准确、可解释、容易实现，且**无需训练或优化**（密度估计只需拟合）
  - 属于 [anomalib](/0321_Tools_anomalib) 的视频模型；与基于时空特征低秩分解的
    [FUVAS](/0765_paper_FUVAS) 不同，AI-VAD 以「目标 + 属性」为中心

## 方法

方法包含三个阶段：**预处理、特征提取、密度估计**。

``` mermaid
graph LR
    V["视频片段"] --> OF["光流估计<br/>FlowNet2.0 每对相邻帧"]
    V --> OD["目标检测<br/>Mask-RCNN ResNet50 每帧的边界框与类别"]
    OF --> C["按边界框裁剪每个目标<br/>的光流图 与 图像块"]
    OD --> C
    C --> VEL["速度特征<br/>按方向分箱的平均光流幅度 类似 HOOF"]
    C --> POSE["姿态特征<br/>AlphaPose 17 个关键点 归一化到边界框"]
    C --> DEEP["深度特征<br/>CLIP ViT-B/16 图像编码器"]
    VEL --> DE1["GMM 密度估计"]
    POSE --> DE2["kNN 距离"]
    DEEP --> DE3["kNN 距离"]
    DE1 --> S["各特征分数标定并相加<br/>帧分数取所有目标中最大值"]
    DE2 --> S
    DE3 --> S
```

图中：

  - **预处理**：视频里的异常目标通常有异常的运动或活动，所以依赖与目标和运动相关的表示。①**光流**：用现成的光流模型，对每个剪辑里每对相邻帧计算光流图
    $o$；②**目标检测**：现成的目标检测器对每帧检出 $m$ 个边界框 $b\_1, \\dots, b\_m$ 及类别 $y\_1,
    \\dots, y\_m$。与近期论文一致，论文发现**按目标逐个表示**比帧级全局表示更有效
  - **速度特征**：假设异常速度是识别视频异常的相关属性。目标可以在 $x$、$y$
    两个方向上运动，速度的大小（速率）和方向都可能异常，所以每帧每个目标用速度特征表示。先用边界框裁剪帧级光流图，再缩放到固定尺寸
    $H\_{flow}\\times W\_{flow}$；然后用类似 HOOF
    的思想，取「**每个方向上的平均运动**」作特征：对每个光流向量用
    $\\theta = \\text{atan2}(y, x)$ 算方向，把方向量化为 $B$
    个等间隔的箱，每个箱里分配到的光流向量的**幅度**取平均，作为最终表示，这种表示能描述径向和切向的运动：

$$ \\phi\_{velocity}: H\_{flow} \\times W\_{flow} \\rightarrow
\\mathbb{R}^{B}, \\qquad \\text{向量 } (x, y) \\text{ 落入第 } b \\text{ 个箱当
} 2\\pi\\frac{b-1}{B} \\le \\theta \\le 2\\pi\\frac{b}{B} $$

其中：$B$ 是方向箱的个数；落入第 $b$ 个箱的光流向量的幅度之和（论文用 $m = \\lVert x\\rVert + \\lVert
y\\rVert$）再按个数平均，得到该箱的特征值。所以速度特征 $\\phi\_{velocity}$ 是一个 $B$ 维向量。

  - **姿态特征**：不规则的人体活动往往是异常。虽然完整理解活动需要时间特征，但论文发现**即使单帧的人体姿态**也能提供足够有区分力的信号。用现成的深度关键点提取器（论文用
    **AlphaPose**）得到每个人的 $d$ 个关键点的像素坐标 $\\hat{\\phi}*{pose}(o) \\in
    \\mathbb{R}^{2\\times d}$（在 MS-COCO 预训练下 $d =
    17$），并做简单的归一化，使特征与人的位置和大小无关：先从每个关键点减去边界框左上角坐标
    $l$，再缩放 $x$、$y$ 轴使边界框尺寸固定为 $H*{pose}\\times W\_{pose}$：

$$ \\phi\_{pose}(o) = \\begin{pmatrix} \\frac{H\_{pose}}{height(o)} & 0
\\ 0 & \\frac{W\_{pose}}{width(o)}
\\end{pmatrix}\\big(\\hat{\\phi}\_{pose}(o) - l\\big) $$

其中 $height(o)$、$width(o)$ 是目标 $o$ 边界框的高和宽，$l$ 是边界框左上角坐标；最后把
$\\phi\_{pose}$ 展平成姿态特征向量。

  - **深度特征**：基于属性的表示已经很强，但有时表达力不足以检测所有异常。强大的深度特征表达力很强，把许多属性捆在一起，所以用**隐式的深度表示**来建模速度和姿态未能描述的**残余属性**。与图像异常检测的做法一致，隐式表示在外部通用数据集上预训练后迁移；论文用预训练的
    \*\*CLIP 图像编码器（ViT B-16）\*\*表示每帧每个目标的边界框，记为 $\\phi\_{deep}(\\cdot)$

**密度估计**：用密度估计给样本打分，估计的密度低表示异常。对**每个特征分别**拟合一个估计器：

  - 速度特征维度低，用**高斯混合模型 (GMM)**
  - 姿态和深度特征维度高，且不假设服从特定的参数分布，用 **kNN**：计算目标特征 $x$ 与训练特征集中 $K$
    个样本（exemplar）的 $L\_2$ 距离；论文 5.4 节比较了不同的 exemplar 选择方法

记三个估计器为 $s\_{velocity}(\\cdot)$、$s\_{pose}(\\cdot)$、$s\_{deep}(\\cdot)$。

**分数标定**：合并三个估计器需要标定。在正常训练集上估计异常分数的分布，再做 min-max 归一化。kNN 有一个细节：对训练集计算
kNN 时，exemplar **不能来自同一个剪辑**，因为同一目标在相邻帧里几乎没有变化，会扭曲 kNN
估计，所以应在训练集内与**其他视频剪辑**里的所有目标计算
kNN。得到每个特征的最大值 $\\mu$ 和最小值 $\\nu$：

$$ \\mu\_{velocity} = \\max\_x
s\_{velocity}\\big(\\phi\_{velocity}(x)\\big), \\quad \\nu\_{velocity} =
\\min\_x s\_{velocity}\\big(\\phi\_{velocity}(x)\\big) $$

姿态和深度特征同理得到 $\\mu\_{pose}, \\nu\_{pose}, \\mu\_{deep},
\\nu\_{deep}$。**推理**：每个测试剪辑逐帧过光流估计器和目标检测器，对每个目标 $o\_i$
提取三个特征；每帧的分数取**所有目标的最大分数**，最终异常分数是各特征分数用上面的标定参数归一化后**相加**，即
$\\frac{s - \\nu}{\\mu - \\nu}$
的和。因为每个特征分开建模，所以可以指出是哪个属性（速度、姿态、外观）异常，这就是**可解释性**的来源。

## 实验设置

| Name | 设置                                                                                                                                                      |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目标检测 | ResNet50 Mask-RCNN（MS-COCO 预训练）；置信度阈值在 Ped2、Avenue、ShanghaiTech 上分别为 0.5、0.8、0.8（训练与测试一致）                                                               |
| 光流   | FlowNet2.0；光流图缩放到 224×224                                                                                                                               |
| 关键点  | AlphaPose（MS-COCO 预训练），$d = 17$                                                                                                                         |
| 深度特征 | 预训练 CLIP ViT B-16 图像编码器                                                                                                                                 |
| 数据集  | **UCSD Ped2**（16 个正常训练视频、12 个测试视频，固定场景俯拍）、**CUHK Avenue**（16 个正常训练视频、21 个测试视频，地面视角）、**ShanghaiTech Campus**（最大，330 个训练视频、107 个测试视频、13 个场景，光照和视角复杂）      |
| 指标   | 帧级 AUROC：**micro 平均**（把所有视频的帧拼起来再算）和 **macro 平均**（对每个视频算帧级 AUROC 再平均）；多数已有工作只报 micro，少数报 macro（见 [Anomaly Detection Metrics](/0711_ML_Metrics_Anomaly)） |

表中是论文设置。

## 实验结果

  - **Ped2**：多数方法超过 94%，是三个数据集里最简单的；AI-VAD 与当前
    SOTA（HF2）相当，并提供可解释的表示，接近完美的结果表明
    Ped2「几乎被解决」
  - **Avenue**：达到新的 SOTA：micro 平均 AUROC **93.3%**；macro 平均 AUROC
    **96.2%**，超过此前 SOTA 2.7 个百分点
  - **ShanghaiTech**：在最难的数据集上明显优于所有已有方法：**85.9%** AUROC，此前最高为
    84.3%（Jigsaw-Puzzle），领先 1.6 个百分点
  - 论文总结：在三个最常用的公开基准上达到 SOTA，不需要任何训练或优化，且表示可以被人解释

**消融**（Avenue 和 ShanghaiTech，所有特征组合）：

| Name        | 结论                                                                                                                                           |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 速度特征单独      | 在两个数据集上帧级 AUROC 最高：Avenue 86.0%、ShanghaiTech 84.4%（micro）；在 ShanghaiTech 上仅用速度特征就已优于所有此前的 VAD 方法。论文推测原因是该数据集里有大量与速度和运动相关的异常（奔跑的人、快速移动的车和自行车） |
| 速度 + 姿态     | ShanghaiTech 上 85.9% AUROC                                                                                                                   |
| 属性 + 深度残差表示 | Avenue 上达到 SOTA（micro 93.3%、macro 96.2%）                                                                                                     |
| 三类特征全用      | 论文观察到使用全部三个特征是达到 SOTA 的关键                                                                                                                    |

表中结论：不同数据集上起主要作用的属性不同（ShanghaiTech 靠速度，Avenue 靠属性加深度），所以按属性分别建模并组合最稳。

## anomalib 实现

anomalib 的 `AiVad` 基于 `MemoryBankMixin`，即对应论文里在正常视频上建立特征库、用密度估计打分的做法；训练用
Avenue 等视频数据集（每个片段 2 帧、取最后一帧为目标帧）。

## 特点与局限

  - **优点**：**可解释**——可以指出是速度、姿态还是外观异常；简单、容易实现；不需要训练复杂网络；密度估计只需拟合；在三个公开基准上达到
    SOTA
  - **局限**：只关注检测到的目标，对场景整体的异常（如突发光照变化）不敏感；依赖多个预训练模型（目标检测、光流、姿态、CLIP），流水线较复杂；论文只在
    Ped2、Avenue、ShanghaiTech 三个数据集上验证；对没有人体的目标，姿态特征不起作用，主要靠速度和深度特征

## Reference

  - [Attribute-based Representations for Accurate and Interpretable
    Video Anomaly Detection](https://arxiv.org/abs/2212.00789)
  - [official
    code](https://github.com/talreiss/Accurate-Interpretable-VAD)
  - [anomalib -
    ai\_vad](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/video/ai_vad)
