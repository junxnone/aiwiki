-----

| Title     | paper FUVAS                                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:15:13Z`                                |
| Updated @ | `2026-11-24T08:15:13Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/765) |

-----

# FUVAS 少样本无监督视频异常分割

  - **FUVAS**：Few-shot Unsupervised Video Anomaly Segmentation via
    Low-Rank Factorization of Spatio-Temporal Features，ICASSP
    2025（作者：Jiang Jiaxiang、Ndiour Ibrahima J.、Subedar
    Mahesh、Tickoo Omesh）
  - 类型：视频异常**分割**（anomalib `models/video/fuvas`）
  - 思路：对视频的**时空特征做低秩分解**，用少量正常视频建立正常的低秩子空间，异常是偏离该子空间的部分；支持**基于
    Transformer** 的骨干，也支持**基于 CNN** 的骨干（anomalib README 说明）
  - 与基于属性的 [AI-VAD](/0764_paper_AIVAD) 不同，FUVAS 直接对时空特征建模，输出像素级的异常分割

## 原理

依据 README 的描述和论文标题，大致流程如下：

``` mermaid
graph LR
    V["少量正常视频"] --> F["骨干提取时空特征<br/>Transformer 或 CNN"]
    F --> L["低秩分解<br/>得到正常特征的低秩子空间"]
    T["测试视频"] --> E["同样提取时空特征"]
    E --> R["投影到低秩子空间<br/>计算残差"]
    L --> R
    R --> S["残差大的时空位置<br/>即异常分割结果"]
```

图中：

  - 用冻结的骨干（Transformer 或 CNN）从正常视频中提取时空特征，**只需要少量**样本
  - 对这些特征做**低秩分解**，得到能表示正常模式的低维子空间
  - 测试时把特征投影到该子空间，残差（偏离子空间的部分）大的时空位置被判为异常，并得到像素级的分割

低秩子空间残差的一般形式：

$$ r(x) = \\big\\lVert (I - U U^\\top)(x - \\mu) \\big\\rVert\_2 $$

其中：$x$ 为测试特征；$\\mu$ 为正常特征均值；$U$ 为低秩分解（如 PCA/SVD）得到的正常子空间的正交基；$UU^\\top$
是到该子空间的投影；$r(x)$ 是残差范数，越大越异常。这里是「低秩子空间 +
残差」思想的一般写法，论文中具体采用的分解方式和异常分数请参考原文。

## 使用

``` python
from anomalib.data import UCSDped
from anomalib.models import Fuvas
from anomalib.engine import Engine

datamodule = UCSDped()
model = Fuvas()
engine = Engine()
engine.train(model, datamodule)      # 在 UCSD Ped 视频数据集上训练
```

README 没有给出 benchmark 数值，评估指标见 [Anomaly Detection
Metrics](/0711_ML_Metrics_Anomaly)。

## 特点

| Name | 说明                        |
| ---- | ------------------------- |
| 少样本  | 少量正常视频即可                  |
| 无监督  | 不需要异常标注                   |
| 低秩分解 | 用线性代数方法建模正常模式，计算简单        |
| 骨干灵活 | 同时支持 Transformer 和 CNN 骨干 |
| 像素级  | 输出时空分割结果                  |

表中是 FUVAS 的特点：用经典的低秩思想配合现代的特征提取器，简单高效，适合快速部署。

## 优缺点

  - **优点**：少样本；计算简单；既可用 Transformer 也可用 CNN 骨干
  - **缺点**：线性子空间对复杂的正常模式表达有限；依赖骨干质量；anomalib 目录中没有 benchmark 数据

## Reference

  - FUVAS: Few-shot Unsupervised Video Anomaly Segmentation via Low-Rank
    Factorization of Spatio-Temporal Features (ICASSP 2025)
  - [anomalib -
    fuvas](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/video/fuvas)
