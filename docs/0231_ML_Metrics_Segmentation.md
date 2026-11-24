---
Title | ML Metrics Segmentation
-- | --
Created @ | `2020-03-03T02:31:43Z`
Updated @| `2026-11-24T01:04:58Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/231)

---
# Segmentation Metrics

- 分割是**像素级**的分类任务，评估的是预测掩码 (mask) 与真值掩码的重合程度
- 分割分为三类，使用的指标不同：
  - **Semantic Segmentation**：每个像素一个类别，不区分同类实例
  - **Instance Segmentation**：区分同类的不同实例，通常按实例掩码的 IoU 计算 AP（同 [Detection](/0230_ML_Metrics_Detection)）
  - **Panoptic Segmentation**：语义 + 实例统一，使用 PQ/SQ/RQ

## Metrics 概览

Name | MIoU | Pixel Accuracy | FWIoU | Dice | Precision | Recall | AP | PQ | SQ | RQ | Boundary F1
-- | --  | -- | -- | -- | -- | -- | -- | -- | -- | -- | --
Semantic Segmentation | √ | √ | √ | √ | √ | √ | | | | | √
Instance Segmentation | √ | | | √ | √ | √ | √ | | | | √
Panoptic Segmentation | √ | | | | | | | √ | √ | √ |

表中行为分割类型，列为指标，`√` 表示该类型常用此指标。语义分割以像素统计为主；实例分割以实例掩码 IoU 计算 AP；全景分割综合考虑语义和实例，使用 PQ 及其分解 SQ/RQ。


## Accuracy

Accuracy | Formula
-- | --
PA<br>Pixel Accuracy<br>像素准确率 | $PA = \frac{\sum_{i=0}^{k} p_{ii}}{\sum_{i=0}^{k}\sum_{j=0}^{k} p_{ij}}$
MPA<br>Mean Pixel Accuracy<br>平均像素准确率 | $MPA = \frac{1}{k+1}\sum_{i=0}^{k}\frac{p_{ii}}{\sum_{j=0}^{k} p_{ij}}$

其中：

- `pij` 表示本属于类 `i` 但被预测为类 `j` 的像素数量，即混淆矩阵第 $i$ 行第 $j$ 列；$p_{ii}$ 为类 $i$ 预测正确的像素数
- $k+1$：类别总数（含背景，类别编号 $0 \dots k$）
- $PA$：所有预测正确的像素占总像素的比例，会被大面积的背景类主导
- $MPA$：先对每个类别算出像素准确率（等于该类 Recall），再对类别取平均

## IoU
- IoU - `Intersection over Union`
- MIoU - `Mean IoU`
  - 基于类进行计算 IOU , 将每一类的 IOU计算之后累加, 再进行平均
- FWIoU - `Frequency Weighted IoU`
  - 根据每个类出现的频率设置权重

IoU | Formula
-- | --
IoU (类别 $i$) | $IoU_i = \frac{p_{ii}}{\sum_{j=0}^{k} p_{ij} + \sum_{j=0}^{k} p_{ji} - p_{ii}} = \frac{TP}{TP + FP + FN}$
MIoU | $MIoU = \frac{1}{k+1}\sum_{i=0}^{k}\frac{p_{ii}}{\sum_{j=0}^{k} p_{ij} + \sum_{j=0}^{k} p_{ji} - p_{ii}}$
FWIoU | $FWIoU = \frac{1}{\sum_{i=0}^{k}\sum_{j=0}^{k} p_{ij}}\sum_{i=0}^{k}\frac{\left(\sum_{j=0}^{k} p_{ij}\right) p_{ii}}{\sum_{j=0}^{k} p_{ij} + \sum_{j=0}^{k} p_{ji} - p_{ii}}$

其中：

- $\sum_j p_{ij}$：类别 $i$ 的真值像素总数（$TP+FN$）；$\sum_j p_{ji}$：被预测为类别 $i$ 的像素总数（$TP+FP$）
- 分母为真值与预测的**并集**像素数（两者相加再减去交集 $p_{ii}$），分子为**交集**
- $\sum_j p_{ij} \big/ \sum_i\sum_j p_{ij}$ 是类别 $i$ 的出现频率，FWIoU 用它作权重，大类对结果的影响更大
- MIoU 对每个类别一视同仁，小目标类别 IoU 低时会明显拉低 MIoU，更能暴露小类别的问题


## Dice
- **Dice Coefficient / F1-Score**：与 IoU 类似的重合度指标，医学图像分割中最常用
- 对小目标比 IoU 更宽容；与 IoU 单调相关，$Dice = \frac{2\,IoU}{1 + IoU}$
- 详见 [Dice](/0714_ML_Metrics_Segmentation_Dice)；作为损失函数时见 [Dice Loss](/0283_ML_Arch_Func_LossFunction_DiceLoss)

$\large Dice = \frac{2\left|A \cap B\right|}{\left|A\right| + \left|B\right|} = \frac{2TP}{2TP + FP + FN}$

其中：

- $A$：预测掩码的像素集合；$B$：真值掩码的像素集合；$\left|\cdot\right|$ 为像素个数；$\left|A \cap B\right|$ 即 $TP$
- 取值 $[0, 1]$，1 为完全重合，两个掩码都为空时通常约定为 1


## Precision & Recall

- 像素级的 Precision = $\frac{TP}{TP+FP}$，Recall = $\frac{TP}{TP+FN}$，对每个类别分别计算再按 `macro/micro` 平均，详见 [Metrics for Classification](/0137_ML_Metrics_Classification)
- 缺陷分割、医学分割中 Recall（不漏检）通常比 Precision 更重要


## PQ - SQ - RQ

- **PQ** - `Panoptic Quality`，全景分割的统一指标，同时衡量**分割质量**和**识别质量**，详见 [PQ](/0713_ML_Metrics_Segmentation_PQ)
- 先对每个类别，用 IoU > 0.5 把预测 segment 与真值 segment 匹配（该阈值下匹配是唯一的）：匹配上的为 TP，未匹配的预测为 FP，未匹配的真值为 FN，之后各类别分别计算再取平均

$\large PQ = \underbrace{\frac{\sum_{(p, g) \in TP} IoU(p, g)}{|TP|}}_{SQ} \times \underbrace{\frac{|TP|}{|TP| + \frac{1}{2}|FP| + \frac{1}{2}|FN|}}_{RQ}$

其中：

- $p$：一个预测 segment；$g$：一个真值 segment；$(p, g) \in TP$ 表示已成功匹配的配对
- $IoU(p, g)$：两个 segment 的 IoU；$|TP|$、$|FP|$、$|FN|$：对应的 segment 个数
- **SQ** (Segmentation Quality)：匹配上的 segment 的平均 IoU，只衡量分割得「准不准」
- **RQ** (Recognition Quality)：形式上等同于 F1，衡量是否识别出来了，「有没有漏/多检」
- $PQ = SQ \times RQ$，三者取值 $[0, 1]$，越大越好；"Things" (可数目标) 和 "Stuff" (背景类) 通常分别报告 $PQ^{Th}$ 和 $PQ^{St}$


## Boundary

- 区域重合指标（IoU/Dice）对边界不敏感，大目标边界偏几个像素 IoU 几乎不变
- 评估边界精度使用 [Boundary F1-Score](/0526_ML_Metrics_Segmentation_BF1S)，也有 Boundary IoU、[Hausdorff Distance](/0715_ML_Metrics_Segmentation_Hausdorff) 等

## Code
```python
import numpy as np

def confusion(pred, gt, num_classes):
    # pred/gt: (H, W) 的类别索引
    idx = num_classes * gt.reshape(-1) + pred.reshape(-1)
    return np.bincount(idx, minlength=num_classes**2).reshape(num_classes, num_classes)  # 行: 真值, 列: 预测

cm = confusion(pred, gt, k + 1)
tp = np.diag(cm)
iou = tp / (cm.sum(0) + cm.sum(1) - tp)    # 每类 IoU
miou = np.nanmean(iou)
```


## Reference
- [图像语义分割准确率度量方法总结](https://zhuanlan.zhihu.com/p/38236530)
- [Evaluating image segmentation models. - Jeremy Jordan](https://www.jeremyjordan.me/evaluating-image-segmentation-models/)
- [Panoptic Segmentation](https://arxiv.org/abs/1801.00868)

