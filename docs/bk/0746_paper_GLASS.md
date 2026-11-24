-----

| Title     | paper GLASS                                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:31Z`                                |
| Updated @ | `2026-11-24T08:14:31Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/746) |

-----

# GLASS 梯度上升异常合成

  - **GLASS**：A Unified Anomaly Synthesis Strategy with Gradient Ascent
    for Industrial Anomaly Detection and Localization，论文
    [arXiv 2407.09359](https://arxiv.org/pdf/2407.09359)
  - 类型：Segmentation
  - 思路：一个统一框架，同时合成**全局异常**（特征级）和**局部异常**（图像级），解决现有异常合成方法覆盖度和可控性不足的问题，尤其是与正常区域很相近的**弱缺陷**
  - 与
    [DRAEM](/0744_paper_DRAEM)（图像级合成）、[DSR](/0745_paper_DSR)（特征级合成）相关；合成方法的综述见
    [Anomaly Synthesis](/0517_ML_Tasks_Image_Anomaly_Synthesis)

## 原理

训练时有三条分支，推理时只用其中的正常分支：

``` mermaid
graph TD
    X["正常图像"] --> N["正常分支<br/>冻结特征提取器 + 可训练特征适配器"]
    N --> GAS["全局异常合成 GAS<br/>在特征上加高斯噪声 梯度上升 截断投影"]
    X --> LAS["局部异常合成 LAS<br/>Perlin 掩码叠加纹理 图像级"]
    LAS --> N2["提取并适配特征"]
    N --> D["共享判别器"]
    GAS --> D
    N2 --> D
    D --> OUT["训练: 区分正常特征和异常特征<br/>推理: 判别器输出异常分数"]
```

图中：

  - **正常分支**：冻结的特征提取器加上可训练的特征适配器，得到适配后的正常特征；推理时只有这一支处理测试图像
  - **全局异常合成
    (GAS)**：在特征层面，用高斯噪声作初始扰动，再通过**梯度上升**（沿使判别器的「正常」得分下降的方向调整噪声）并配合**截断投影**，约束在流形或超球面分布内，得到「近分布」的异常特征
  - **局部异常合成 (LAS)**：在图像层面，用 Perlin 噪声掩码把增强后的纹理叠加到图像上，得到「远分布」的局部异常
  - 三个分支的特征送入同一个**共享判别器**训练，推理时由判别器输出异常分数

特征级异常的梯度上升：

$$ \\epsilon^{(t+1)} = \\Pi\\Big(\\epsilon^{(t)} + \\eta,
\\nabla\_{\\epsilon}, \\mathcal{L}\_{d}\\big(D(z + \\epsilon^{(t)}),\\
\\text{normal}\\big)\\Big) $$

其中：

  - $z$：适配后的正常特征；$\\epsilon^{(t)}$：第 $t$ 次迭代的扰动，初值为高斯噪声；$z + \\epsilon$
    即合成的异常特征
  - $D$：判别器；$\\mathcal{L}\_d(\\cdot,\\text{normal})$：判别器把该特征判为「正常」的损失，沿其梯度上升，使扰动后的特征更像「判别器难以识别的异常」，即**弱缺陷**
  - $\\eta$：步长；$\\Pi(\\cdot)$：截断投影，把扰动限制在预设的流形或超球面约束范围内，避免离正常分布过远（成为容易的异常）
  - 这里的公式是对 GAS 思想的概括，具体的约束形式以论文为准

## 特点

| Name  | 说明                                                                                        |
| ----- | ----------------------------------------------------------------------------------------- |
| 全局+局部 | 特征级的近分布异常和图像级的远分布异常互补                                                                     |
| 梯度上升  | 让合成的异常对判别器「更难」，覆盖弱缺陷                                                                      |
| 分布假设  | anomalib 说明 GLASS 对不同类别使用不同的分布假设：`svd=0`（流形）和 `svd=1`（超球面），默认 `svd=0`，每类最优设置在 README 表中列出 |
| 训练复杂  | 三分支加共享判别器，训练比纯特征类方法复杂                                                                     |

表中是 GLASS 的特点：它的核心是更可控地合成难异常，付出的代价是更多的超参数（分布假设）。

## 使用与评估

``` bash
anomalib train --model Glass --data MVTecAD --data.category <category>
```

anomalib README 中的结果（Wide ResNet-50，MVTec AD 平均）：Image AUROC
**0.972**，Pixel AUROC **0.965**。论文报告 I-AUROC 99.9% 和 P-AUROC
99.3%。README 说明差距可能来自增强流程（Perlin 噪声填充、DTD 加载）的细微差异；复现论文数字需要 288×288
的输入、按类别设置 `svd`、batch size 8、学习率 1e-4、100 个 epoch。指标含义见 [Anomaly
Detection Metrics](/0711_ML_Metrics_Anomaly)。

## 优缺点

  - **优点**：合成异常覆盖更全面，尤其是弱缺陷；推理时只用正常分支，速度较快；论文结果很强
  - **缺点**：训练复杂，需要按类别设置分布假设；复现对增强细节敏感；依赖外部纹理（DTD）

## Reference

  - [GLASS: A Unified Anomaly Synthesis Strategy with Gradient Ascent
    for Industrial Anomaly Detection and
    Localization](https://arxiv.org/pdf/2407.09359)
  - [anomalib -
    Glass](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/glass)
