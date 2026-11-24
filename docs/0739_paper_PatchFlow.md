---
Title | paper PatchFlow
-- | --
Created @ | `2026-11-24T08:14:15Z`
Updated @| `2026-11-24T08:14:15Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/739)

---
# PatchFlow 基于补丁特征的归一化流

- **PatchFlow**：Leveraging a Flow-Based Model with Patch Features，论文 [arXiv 2602.05238](https://arxiv.org/abs/2602.05238)
- 类型：Segmentation
- 思路：把 [PatchCore](/0535_paper_PatchCore) 式的**局部邻域感知的 Patch 特征**与**归一化流**结合，并引入一个**适配器模块**缩小通用预训练特征与工业图像之间的差距
- 归一化流基础见 [CFlow](/0735_paper_CFlow)；anomalib 中的较新模型

## 原理

下图是 PatchFlow 的流程（依据 anomalib README 描述绘制）：

```mermaid
graph LR
    X["输入图像"] --> B["冻结骨干<br/>EfficientNet 或 DINOv2<br/>多分辨率特征"]
    B --> P["局部平均池化 + 上采样<br/>融合为邻域感知 Patch 特征"]
    P --> A["适配器<br/>1x1 卷积调整通道"]
    A --> F["单个归一化流<br/>密度估计"]
    F --> M["Anomaly Map"]
```

图中：

- 骨干网络冻结，提取多个分辨率的特征；骨干可选 EfficientNet 或 DINOv2
- 多分辨率特征经局部平均池化和上采样融合，每个位置的特征包含局部邻域上下文，这与 [PatchCore](/0535_paper_PatchCore) 的邻域聚合思想一致
- 适配器用 $1 \times 1$ 卷积调整通道维度，使预训练特征更适合工业图像分布，改善流的稳定性
- 融合后的特征送入**单个**归一化流估计密度，似然越低越异常，得到异常图

anomalib README 列出的三个要点：

Name | 说明
-- | --
Patch 级框架 | 局部邻域感知特征 + 基于流的似然建模
轻量适配模块 | 把预训练表示对齐到工业图像分布，提升流的稳定性和检测精度
瓶颈耦合结构 | 高效的瓶颈式耦合层，在保持表达能力的同时降低计算复杂度

表中三项是论文的主要贡献，分别针对特征质量、稳定性和计算量。

## 使用

```bash
# DINOv2 骨干
anomalib train --config examples/configs/model/patchflow/dino.yaml --data MVTecAD --data.category bottle
# EfficientNet 骨干
anomalib train --config examples/configs/model/patchflow/efficientnet.yaml --data MVTecAD --data.category bottle
```

也可以通过 Python API 使用：

```python
from anomalib.data import MVTecAD
from anomalib.models import Patchflow
from anomalib.engine import Engine

datamodule = MVTecAD(category="bottle")
model = Patchflow()
engine = Engine()
engine.fit(model=model, datamodule=datamodule)
```

README 中没有给出基准数值，请参考论文。

## 优缺点

- **优点**：把邻域特征与流模型结合；适配器改善预训练特征的领域偏差；单个流结构更简洁
- **缺点**：为 2026 年的新工作，我没有看到 anomalib README 之外的独立评测；依赖骨干（DINOv2 等较大）时推理开销更高

## Reference
- [PatchFlow: Leveraging a Flow-Based Model with Patch Features](https://arxiv.org/abs/2602.05238)
- [anomalib - Patchflow](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/patchflow)

