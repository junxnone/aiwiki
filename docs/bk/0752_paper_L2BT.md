-----

| Title     | paper L2BT                                            |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:44Z`                                |
| Updated @ | `2026-11-24T08:14:44Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/752) |

-----

# L2BT 学着做一个 Transformer

  - **L2BT**：Learning to Be a Transformer to Pinpoint Anomalies，IEEE
    Access，作者来自博洛尼亚大学（Costanzino、Zama Ramirez、Lisanti、Di
    Stefano）；[项目页](https://alex-costanzino.github.io/learning_to_be_a_transformer/)
    | [论文](https://ieeexplore.ieee.org/document/11048772)
  - 类型：Segmentation
  - 动机：很多工业异常检测方法为了使用强大的预训练特征提取器，把图像下采样到 224×224；但这会让**微小缺陷**无法被检测。L2BT
    的目标是**在高分辨率图像上快速检测**
  - 思路：**师生**范式：两个浅层 MLP（学生）在正常图像上学习去**模仿冻结 ViT（教师）自注意力层所诱导的 Patch
    嵌入之间的映射**

## 原理

下图是 L2BT 的思路（依据 anomalib README 描述绘制）：

``` mermaid
graph LR
    X["高分辨率图像"] --> V["冻结 ViT 教师<br/>自注意力层前后的 Patch 嵌入"]
    V --> M["映射任务<br/>自注意力层把输入嵌入变换为输出嵌入"]
    M --> S1["学生 MLP 1"]
    M --> S2["学生 MLP 2"]
    S1 --> E["学生预测与教师真实输出的差异"]
    S2 --> E
    E --> A["异常分数 与 异常图"]
```

图中：

  - 教师是**冻结的 Vision Transformer**，它的自注意力层把输入的 Patch
    嵌入变换成输出嵌入，这个「嵌入到嵌入」的映射就是学生要模仿的对象
  - 两个**浅层 MLP**（容量很小）作为学生，只在**正常图像**上训练，去拟合这些映射；这是一个有挑战性的代理任务
  - 容量小的学生在**异常图像**（分布外数据）上很难完成这个任务，预测与教师真实输出的差异变大，据此得到异常分数和异常图
  - 因为学生只是浅层 MLP，所以可以高效处理高分辨率输入

代理任务的形式：

$$ \\mathcal{L} = \\frac{1}{N}\\sum\_{i=1}^{N}\\big\\lVert
g\_\\theta(x\_i) - \\text{SA}(x\_i) \\big\\rVert\_2^2 $$

其中：

  - $x\_i$：第 $i$ 个 Patch 的输入嵌入；$\\text{SA}(\\cdot)$：冻结 ViT
    教师中自注意力层对该嵌入的输出（学习目标）；$g\_\\theta$：带参数
    $\\theta$ 的学生 MLP；$N$：Patch 总数
  - 这里的公式只表达「学生拟合教师映射」的一般思想；论文中使用两个学生，具体的目标和异常分数的定义请参考原文

## 评估

论文还提出了**新的评估指标**，用来衡量方法对**缺陷大小的鲁棒性**，即从大缺陷到微小缺陷都能保持良好定位的能力。按 README，L2BT
在 MVTec AD 上达到当前最优，在 VisA 上取得最好的分割结果，并且比竞争方法运行快得多。通用的异常评估指标见 [Anomaly
Detection Metrics](/0711_ML_Metrics_Anomaly)。

## 优缺点

  - **优点**：高分辨率下对小缺陷更敏感；学生很小，推理快；训练只需要正常图像
  - **缺点**：依赖冻结 ViT 教师；anomalib README 中没有给出 benchmark 数值；需要较强的 ViT
    特征与高分辨率输入的显存

## Reference

  - [Learning to Be a Transformer to Pinpoint Anomalies (IEEE
    Access)](https://ieeexplore.ieee.org/document/11048772)
  - [项目页](https://alex-costanzino.github.io/learning_to_be_a_transformer/)
  - [anomalib -
    L2BT](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/l2bt)
