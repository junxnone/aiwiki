---
Title | ML Metrics Detection APmAPAR
-- | --
Created @ | `2023-02-16T15:19:37Z`
Updated @| `2026-11-24T00:58:32Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/382)

---
# AP & mAP & AR

- `mAP@[0.5:.05:.95]` - 当前比较流行的衡量标准
- **AP**：单个类别在所有 `confidence 阈值` 下的 Precision-Recall 曲线下面积；**mAP**：所有类别 AP 的平均；**AR**：给定每图最大检测数时的最大召回，在类别和 IoU 上平均

## AP
- PR 曲线下的面积
- AP 一般指单个类别
- 计算 AP 前需先按 [IoU](/0383_ML_Metrics_Detection_IoU) 阈值把预测框判定为 TP/FP，规则见 [Detection Metrics](/0230_ML_Metrics_Detection)

### 计算步骤

下面以「检测 Dog」为例逐步计算 AP：

GT | ![image](https://user-images.githubusercontent.com/2216970/220018804-6eeb8f11-aeba-4fb7-8c35-80a84858b7cb.png)
-- | --
Predict Dog  | ![image](https://user-images.githubusercontent.com/2216970/219999922-5d64b9cf-f1e5-439a-9ae1-346b699051df.png)

图中：上图是标注的 GT 框，下图是模型预测出的 Dog 框及其 confidence。

#### 计算 Precision & Recall
- 根据 `confidence` 从高到低排序
- 依次判定每个预测框是 TP 还是 FP，并累计 `Acc TP` 和 `Acc FP`
- 第 $k$ 行的 $Precision = \frac{Acc\ TP}{k}$，$Recall = \frac{Acc\ TP}{\text{Total Ground Truths}}$，即只保留前 $k$ 个预测时的 P/R

![image](https://user-images.githubusercontent.com/2216970/219999957-82ea09f1-1813-49e8-bdc5-eadc712051c8.png)

图中：表格每一行是一个预测框，按 confidence 降序；`TP/FP` 列是该预测的判定结果，后两列是累计到该行的 Precision 和 Recall。

#### Plot PRCurve

- 每个 `Recall Level` 的 `Precision` 值 使用右侧最大值 使其单调递减（消除锯齿）

![image](https://user-images.githubusercontent.com/2216970/220000067-3e7a8e79-1b1e-49ad-9681-d8b8468c681c.png)
![mean-average-precision-map-calculation-11-point-interpolation-pascal-voc-manual](https://user-images.githubusercontent.com/2216970/220021066-6f256990-3c13-43ad-901a-6fa23139bd67.gif)

图中：横轴为 Recall，纵轴为 Precision；锯齿状曲线是原始的 PR 点，阶梯状曲线是每个 Recall 位置取其右侧最大 Precision 后的结果，AP 就是这条阶梯线下的面积。


##### 11 Point Interpolation Method

- **11 Recall Point: N=11** [0, 0.1, 0.2, ..., 0.9, 1.0]

![image](https://user-images.githubusercontent.com/2216970/220000690-1d169ef1-3857-46b0-996e-3a67070e9e77.png)

$$
AP = \frac{1}{11}\sum_{r \in \{0, 0.1, \dots, 1.0\}} p_{interp}(r), \quad p_{interp}(r) = \max_{\tilde{r} \ge r} p(\tilde{r})
$$

其中：

- $r$：11 个等间隔的 Recall 采样点
- $p(\tilde{r})$：Recall 为 $\tilde{r}$ 时的 Precision；$p_{interp}(r)$：Recall 不小于 $r$ 的所有点中 Precision 的最大值

示例中 11 个采样点的 $p_{interp}$ 依次为：1 个点为 1，4 个点为 0.71，其余 6 个点为 0（Recall 达不到该水平）：

- $AP = \frac{1}{11}\times (1+4\times 0.71+6\times 0)$
- $= 0.349$

> The intention in interpolating the precision/recall curve in this way is to reduce the impact of the “wiggles” in the precision/recall curve, caused by small variations in the ranking of examples.



##### Interpolating all points

- AUC(Area Under Curve) on PR Curve
- PASCAL VOC 2010 之后使用，对 PR 曲线上所有 Recall 变化点积分，不再采样


$$
AP = \sum_{n=0}^{N-1}(r_{n+1} - r_n)\,p_{interp}(r_{n+1}), \quad p_{interp}(r_{n+1})=\max_{\tilde{r}\ge r_{n+1}}p(\tilde{r})
$$

其中：

- $r_n$：PR 曲线上第 $n$ 个点的 Recall（从小到大排列，$r_0=0$）；$N$：PR 点的个数
- $(r_{n+1} - r_n)$：相邻两个 Recall 之间的宽度；$p_{interp}(r_{n+1})$：该区间的高度，取其右侧最大 Precision，所以积分面积就是阶梯线下的面积

##### 101 Point Interpolation AP
- **N=101**: MSCOCO AP `[0:.01:1]`
- 与 11 点插值相同，只是采样点由 11 个变为 101 个，更接近全点积分的结果

$$
AP = \frac{1}{101}\sum_{r \in \{0, 0.01, \dots, 1.0\}} p_{interp}(r)
$$

其中：$r$ 为 101 个等间隔的 Recall 采样点，$p_{interp}(r)$ 定义同上。


Name | Recall 采样 | 使用
-- | -- | --
11 点插值 | 11 个点 | PASCAL VOC 2007
全点插值 | PR 曲线所有变化点 | PASCAL VOC 2010+
101 点插值 | 101 个点 | MS COCO

表中对比了三种 AP 计算方式，采样越密越接近曲线下的真实面积。同一个模型用不同方式算出的 AP 略有差异，比较时要使用同一种。


## mAP

- mAP - mAP 一般指所有类别的平均
- $mAP = \frac{1}{C}\sum_{c=1}^{C} AP_c$

其中：$C$ 为类别总数，$AP_c$ 为第 $c$ 个类别的 AP。

---
- `mAP@.50IOU` - 当 IoU 大于 0.50 时认为正确识别的 mAP
- `mAP@.75IOU` - 当 IoU 大于 0.75 时认为正确识别时的 mAP
- `mAP@[.5:.95]` - IoU [0.5, 0.95] 范围内以步长 0.05 间隔计算 mAP，共 10 个阈值，对每个阈值分别算 mAP 再平均

> COCO 中称 mAP 为 AP
> We make no distinction between AP and mAP (and likewise AR and mAR) and assume the difference is clear from context.

Name | IoU 阈值 | 说明
-- | -- | --
`mAP@.50` (AP50) | 0.5 | 宽松，只要求大致框住目标，PASCAL VOC 指标
`mAP@.75` (AP75) | 0.75 | 严格，要求定位较准
`mAP@[.5:.95]` | 0.5, 0.55, ..., 0.95 | 综合指标，定位越准得分越高，COCO 主指标

表中指标越往下要求越严格，AP50 高但 AP75 低说明模型能找到目标但框不够准。


## AR

- AR  - 在每个图像中检测到固定数量的最大召回（recall），在类别和IoU上平均
- 即：限定每张图最多保留 $N$ 个检测框（按 confidence 取前 $N$），在每个 IoU 阈值下算每个类别的最大 Recall，再对类别和 IoU 阈值平均
- COCO 报告 `AR@1`、`AR@10`、`AR@100`（每图最多 1/10/100 个检测框）；`AR@100` 反映模型召回目标的上限，`AR@1` 反映单目标场景下的能力
- 同时按目标面积分别报告 $AR^{small}$、$AR^{medium}$、$AR^{large}$，见 [COCO Detection Metrics](/0384_ML_Metrics_Detection_COCO)

## Code
```python
import numpy as np

def voc_ap(rec, prec):
    """全点插值 AP, rec 升序, prec 与之对应"""
    mrec = np.concatenate(([0.0], rec, [1.0]))
    mpre = np.concatenate(([0.0], prec, [0.0]))
    for i in range(len(mpre) - 2, -1, -1):          # 使 Precision 单调递减
        mpre[i] = max(mpre[i], mpre[i + 1])
    idx = np.where(mrec[1:] != mrec[:-1])[0]         # Recall 变化的位置
    return np.sum((mrec[idx + 1] - mrec[idx]) * mpre[idx + 1])
```


## Reference

- [COCO Detection Evaluation](https://cocodataset.org/#detection-eval)
- [mAP (mean Average Precision) for Object Detection](https://medium.com/@jonathan_hui/map-mean-average-precision-for-object-detection-45c121a31173)
- [Metrics for object detection](https://github.com/rafaelpadilla/Object-Detection-Metrics)

