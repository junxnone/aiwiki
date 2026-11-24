-----

| Title     | paper AnomalyDINO                                     |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:53Z`                                |
| Updated @ | `2026-11-24T08:14:53Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/756) |

-----

# AnomalyDINO 基于 DINOv2 的少样本异常检测

  - **AnomalyDINO**：Boosting Patch-based Few-shot Anomaly Detection with
    DINOv2
  - 类型：基于记忆库的 Patch 级方法（anomalib 中位于 `models/image/anomaly_dino`；该目录没有
    README，下面的内容依据源码文档字符串）
  - 思路：与 [PatchCore](/0535_paper_PatchCore) 类似，用 **DINOv2-Small** 作骨干提取
    Patch 特征，建立正常特征的记忆库，**推理时用 kNN 搜索**异常 Patch；**图像异常分数**取 Patch
    异常分数中**最差的 99% 分位**
  - 面向**少样本**场景，只需很少的正常图像即可

## 原理

``` mermaid
graph LR
    A["少量正常图像"] --> B["DINOv2-Small<br/>提取 Patch 特征"]
    B --> M["可选: 掩码去除背景噪声"]
    M --> C["记忆库<br/>可选: 贪心 coreset 子采样"]
    T["测试图像"] --> E["同样提取 Patch 特征"]
    E --> K["kNN 搜索<br/>与记忆库最近邻距离"]
    C --> K
    K --> S["像素异常分数<br/>图像分数取 99 分位"]
```

图中：

  - 用 DINOv2-Small（`vit_small_patch14_dinov2`）把图像转成 Patch 特征，存入记忆库
  - **可选的掩码**用于去除背景等噪声成分（例如 MVTec AD 中
    capsule、hazelnut、pill、screw、toothbrush 这几类使用掩码）
  - **可选的贪心 coreset 子采样**用于压缩记忆库
  - 测试时对每个 Patch 做 kNN，最近邻距离即该位置的异常分数；整图的分数不是最大值，而是像素异常分数的 **99%
    分位**，对孤立的噪声更稳健

图像分数：

$$ s\_{img} = \\text{Percentile}*{99}\\big{, s(h, w) ,\\big}*{(h,w)},
\\qquad s(h, w) = \\min\_{m \\in \\mathcal{M}}\\ \\lVert f(h, w) - m
\\rVert\_2 $$

其中：

  - $f(h, w)$：测试图像在位置 $(h, w)$ 的 Patch
    特征；$\\mathcal{M}$：记忆库中的正常特征集合；$s(h,
    w)$：到记忆库的最近邻距离，即该位置的异常分数
  - $\\text{Percentile}\_{99}$：取所有位置分数的 99% 分位数，相比取最大值更不易受单个异常点影响
  - 距离的度量以及 kNN 的 $k$ 值（`num_neighbours`）以实现为准，anomalib 示例中使用
    `num_neighbours=1`

## 使用

``` python
from anomalib.data import MVTecAD
from anomalib.models.image.anomaly_dino.lightning_model import AnomalyDINO
from anomalib.engine import Engine

model = AnomalyDINO(num_neighbours=1, encoder_name="vit_small_patch14_dinov2",
                    masking=False, coreset_subsampling=False)   # 部分类别可设 masking=True
engine = Engine()
engine.fit(model=model, datamodule=MVTecAD(category="bottle"))
engine.test(datamodule=MVTecAD(category="bottle"))
```

源码中没有给出 benchmark 数值，请参考论文。评估指标见 [Anomaly Detection
Metrics](/0711_ML_Metrics_Anomaly)。

## 特点

| Name       | 说明                                              |
| ---------- | ----------------------------------------------- |
| 少样本        | 少量正常图像即可，适合新产品冷启动                               |
| 基础模型特征     | DINOv2 提供强大的通用 Patch 特征                         |
| 可选掩码       | 对背景复杂的类别减少误报                                    |
| 可选 coreset | 控制记忆库大小                                         |
| 无训练        | 只建库、不训练，与 [PatchCore](/0535_paper_PatchCore) 类似 |

表中是 AnomalyDINO 的特点：思路上是「PatchCore + DINOv2 + 少样本」，用更强的特征换更少的样本。

## 优缺点

  - **优点**：少样本；无训练；DINOv2 特征质量高；实现简单
  - **缺点**：需要保存记忆库和做近邻搜索；背景复杂时要使用掩码；anomalib 目录中缺少 README 与基准数据

## Reference

  - AnomalyDINO: Boosting Patch-based Few-shot Anomaly Detection with
    DINOv2
  - [anomalib -
    anomaly\_dino](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/anomaly_dino)
