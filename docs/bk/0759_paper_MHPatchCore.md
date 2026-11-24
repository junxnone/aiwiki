-----

| Title     | paper MHPatchCore                                     |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:59Z`                                |
| Updated @ | `2026-11-24T08:14:59Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/759) |

-----

# MHPatchCore 马氏距离 PatchCore

  - **MH-PatchCore**：Mahalanobis PatchCore: Covariance-Aware and
    Streaming-Compatible Industrial Anomaly Detection，论文
    [arXiv 2605.27748](https://arxiv.org/abs/2605.27748)（Niccolò
    Ferrari、Oligert Osmani、Evelina
    Lamma；预印本），[参考实现](https://github.com/NickF93/MH-PatchCore)（MIT
    许可）
  - 类型：Segmentation，**单类**异常检测
  - 思路：保留 [PatchCore](/0535_paper_PatchCore) 的 Patch
    级最近邻评分，但学习一个**协方差感知**的特征空间：对分层特征做
    **PCA 投影**，用**收缩协方差**估计**白化**，再用确定性的**合并-归约 coreset** 构建有界的记忆库

## 原理

与标准 PatchCore 不同，拟合需要对正常训练集做**三次有序的遍历**：

``` mermaid
graph TD
    A["第 1 遍: 拟合 PCA 投影<br/>达到指定的解释方差比"] --> B["第 2 遍: 在 PCA 空间估计并分解<br/>收缩协方差矩阵"]
    B --> C["第 3 遍: 对投影后的 Patch 做白化<br/>并用合并-归约构建有界记忆库"]
    C --> D["推理: 白化空间中的最近邻距离"]
```

图中：

  - **第 1 遍**：拟合 PCA，使保留的方差达到设定比例
  - **第 2 遍**：在 PCA 空间估计协方差并做收缩（shrinkage）稳定估计，再分解（如 Cholesky 或特征分解）
  - **第 3 遍**：用上一步的分解把投影后的 Patch **白化**，并用**确定性的合并-归约 coreset
    选择**构建有界大小的记忆库
  - 推理时在白化空间里做最近邻，欧氏距离在白化空间等价于原空间的马氏距离

白化与马氏距离：

$$ \\tilde{x} = L^{-1}\\big(P^\\top (x - \\mu)\\big), \\qquad
\\Sigma\_{shr} = (1 - \\lambda),\\hat{\\Sigma} +
\\lambda,\\frac{\\text{tr}(\\hat{\\Sigma})}{d}, I, \\qquad
\\Sigma\_{shr} = L L^\\top $$

其中：

  - $x$：原始 Patch 特征；$\\mu$：均值；$P$：PCA 投影矩阵；$d$：PCA 后的维度
  - $\\hat{\\Sigma}$：PCA 空间中估计的样本协方差；$\\lambda \\in \[0,
    1\]$：收缩系数，用单位矩阵的缩放项
    $\\frac{\\text{tr}(\\hat\\Sigma)}{d} I$
    向各向同性靠拢，样本少或维度高时使协方差可逆、稳定；$\\Sigma\_{shr}$：收缩后的协方差，分解为
    $LL^\\top$
  - $\\tilde{x}$：白化后的特征：此时协方差为单位矩阵，$\\lVert \\tilde{x} - \\tilde{y}
    \\rVert\_2$ 等于原空间中的**马氏距离**
  - 这里的收缩形式是常见的 Ledoit-Wolf 型写法，作为说明；具体的收缩估计器请以论文和实现为准

## 实现细节

  - 默认特征提取器：`timm` 中的 `wide_resnet50_2.tv2_in1k`，使用 `layer2` 和
    `layer3`，权重对应 torchvision 的 `IMAGENET1K_V2`
  - 输入预处理：缩放到 256×256，中心裁剪 224×224，ImageNet 统计量归一化
  - 使用 anomalib 标准的模型、数据、后处理、评估、可视化、checkpoint 和导出接口
  - **流式兼容**：合并-归约 coreset 使记忆库大小有界，数据可以流式处理

## 使用

``` bash
anomalib train --model MHPatchcore --data MVTecAD --data.category bottle
# 也可使用仓库配置
anomalib train --config examples/configs/model/mh_patchcore.yaml --data MVTecAD --data.category bottle
```

``` python
from anomalib.data import MVTecAD
from anomalib.engine import Engine
from anomalib.models import MHPatchcore

datamodule = MVTecAD(root="./datasets/MVTecAD", category="bottle", train_batch_size=32, eval_batch_size=32)
engine = Engine()
engine.fit(model=MHPatchcore(), datamodule=datamodule)
```

README 中没有给出 benchmark 数值。指标见 [Anomaly Detection
Metrics](/0711_ML_Metrics_Anomaly)。

## 优缺点

  - **优点**：考虑特征间相关性的马氏距离，比欧氏距离更合理；记忆库有界；可流式处理
  - **缺点**：需要三遍训练集遍历；需要估计协方差，样本少时依赖收缩；为预印本，没有 anomalib 官方基准

## Reference

  - [Mahalanobis PatchCore](https://arxiv.org/abs/2605.27748)
  - [reference implementation](https://github.com/NickF93/MH-PatchCore)
  - [anomalib -
    MHPatchcore](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/mh_patchcore)
