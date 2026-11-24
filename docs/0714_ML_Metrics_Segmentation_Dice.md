---
Title | ML Metrics Segmentation Dice
-- | --
Created @ | `2026-11-24T01:03:54Z`
Updated @| `2026-11-24T01:04:52Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/714)

---
# Dice

- **Dice Coefficient**（Sørensen–Dice，也叫 `Dice Score` / `F1 Score`）衡量两个集合（预测掩码和真值掩码）的重合程度
- 医学图像分割中最常用，也常用作损失函数，见 [Dice Loss](/0283_ML_Arch_Func_LossFunction_DiceLoss)；总览见 [Segmentation Metrics](/0231_ML_Metrics_Segmentation)

## 定义

$$
Dice = \frac{2\lvert A \cap B \rvert}{\lvert A \rvert + \lvert B \rvert} = \frac{2TP}{2TP + FP + FN}
$$

其中：

- $A$：预测掩码的像素集合；$B$：真值掩码的像素集合；$\lvert\cdot\rvert$ 为像素（体素）个数
- $\lvert A \cap B \rvert$ 即 $TP$；$\lvert A \rvert = TP + FP$，$\lvert B \rvert = TP + FN$
- 取值 $[0, 1]$，1 表示完全重合，0 表示没有重叠

## Dice 与 IoU

$$
Dice = \frac{2\,IoU}{1 + IoU}, \qquad IoU = \frac{Dice}{2 - Dice}
$$

其中：$IoU = \frac{TP}{TP + FP + FN}$，见 [IoU](/0383_ML_Metrics_Detection_IoU)。

- 两者**单调相关**，对单张图的排序结果一致，但数值不同：Dice 总是不小于 IoU
- 例：$TP=80, FP=20, FN=20$，则 $Dice = \frac{160}{200} = 0.8$，$IoU = \frac{80}{120} \approx 0.667$，验证 $\frac{2 \times 0.667}{1 + 0.667} = 0.8$
- Dice 对 FP、FN 的惩罚比 IoU 轻，所以数值更高；比较论文结果时要注意用的是哪个指标
- 在同一个数据集上取平均后，两者的平均值就不再满足上面的换算关系

## Dice 与 F1

- Dice 与二分类的 $F_1 = \frac{2PR}{P+R}$ 是**同一个量**，只是像素级别叫 Dice，分类/检测里叫 F1
- 用 Precision 和 Recall 表示：$Dice = \frac{2PR}{P + R}$，其中 $P = \frac{TP}{TP+FP}$，$R = \frac{TP}{TP+FN}$
- 更一般的 $F_\beta$ 对应 Tversky 指数，可以对 FP 和 FN 赋予不同权重，缺陷分割中偏重 Recall 时常用

## Soft Dice

- 当预测是概率图（未二值化）时，用概率代替 0/1，使其可导，用作损失函数

$$
Dice_{soft} = \frac{2\sum_i p_i g_i + \epsilon}{\sum_i p_i + \sum_i g_i + \epsilon}
$$

其中：

- $p_i$：第 $i$ 个像素预测为前景的概率；$g_i \in \{0, 1\}$：第 $i$ 个像素的真值
- $\epsilon$：平滑项（如 $10^{-6}$ 或 1），避免分母为 0，也使空掩码时结果为 1
- 损失为 $L_{Dice} = 1 - Dice_{soft}$；作为**评价指标**时应先对概率二值化（通常阈值 0.5）再计算

## 计算方式的差异

Name | 做法 | 特点
-- | -- | --
Per-image Dice | 每张图单独算再平均 | 空掩码的图需要约定（预测也为空记 1），小病灶图权重与大病灶图相同
Dataset-level Dice | 累计所有图的 TP/FP/FN 后一次计算 | 大病灶主导结果
Per-class Dice | 每个类别分别计算 | 多类别分割常用，再取 macro 平均

表中是常见的三种统计口径，同一模型三种口径数值会明显不同，报告时必须注明。

## 注意

- **空掩码**：真值和预测都为空时，$\lvert A \rvert + \lvert B \rvert = 0$，需要约定 Dice = 1（正确地没有预测任何东西）；只有一方为空则 Dice = 0
- **小目标**：目标只有几个像素时 Dice 波动很大，很小的偏移也会让 Dice 大幅下降
- **3D 体数据**：医学 CT/MRI 在体素上计算，常同时配合 [Hausdorff Distance](/0715_ML_Metrics_Segmentation_Hausdorff) 评估边界

## Code
```python
import numpy as np

def dice(pred, gt, eps=1e-7):
    # pred, gt: bool 数组
    inter = np.logical_and(pred, gt).sum()
    s = pred.sum() + gt.sum()
    if s == 0:
        return 1.0                  # 都为空
    return 2.0 * inter / (s + eps)
```

## Reference
- [Dice-Sørensen coefficient - Wikipedia](https://en.wikipedia.org/wiki/Dice-S%C3%B8rensen_coefficient)
- [Metrics reloaded: Recommendations for image analysis validation](https://arxiv.org/abs/2206.01653)

