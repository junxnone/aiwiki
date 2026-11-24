---
Title | ML Metrics Keypoint
-- | --
Created @ | `2026-11-24T01:04:00Z`
Updated @| `2026-11-24T01:04:00Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/717)

---
# Keypoint

- 关键点检测（人体姿态、人脸关键点、手部、物体关键点）预测一组点的坐标，评估的是**每个点离真值有多近**
- 不同于检测的 BBox，关键点没有面积，不能用 [IoU](/0383_ML_Metrics_Detection_IoU)，需要用基于距离的度量
- 常用指标：**OKS / AP**（多人姿态，COCO 标准）、**PCK**（单人姿态、人脸）、**NME**（人脸关键点）、**MPJPE**（3D 姿态）

## OKS

- **OKS** - `Object Keypoint Similarity`，作用相当于检测里的 IoU：衡量一个预测人体与一个真值人体的相似度，取值 $[0, 1]$

$$
OKS = \frac{\sum_i \exp\left(-\frac{d_i^2}{2 s^2 k_i^2}\right)\delta(v_i > 0)}{\sum_i \delta(v_i > 0)}
$$

其中：

- $i$：关键点编号（COCO 人体共 17 个）；$d_i$：预测点与真值点的欧氏距离（像素）
- $s$：目标的尺度，$s^2$ 取目标的面积（分割面积），使远近、大小不同的人具有可比性
- $k_i$：第 $i$ 个关键点的**衰减常数**，对应该点标注的不确定程度，越难标得准的点（髋、膝、踝）$k_i$ 越大，容忍的偏差越大；COCO 中 $k_i = 2\sigma_i$，$\sigma_i$ 取值如鼻子 0.026、眼睛 0.025、肩 0.079、髋 0.107、踝 0.089
- $v_i$：真值的可见性标记，$v_i > 0$ 表示该点有标注，$\delta(v_i > 0)$ 只统计有标注的点
- 分子是每个有标注的点的相似度之和（距离为 0 时为 1，距离越远越趋近于 0），分母是有标注的点数，所以 OKS 是平均相似度

## AP / AR

- 把 OKS 当作 IoU，使用 OKS 阈值（$0.50:0.05:0.95$）判定 TP/FP，再计算 AP 和 AR，流程同 [Detection Metrics](/0230_ML_Metrics_Detection)，AP 的计算见 [AP & mAP & AR](/0382_ML_Metrics_Detection_APmAPAR)

Name | 含义
-- | --
$AP$ | OKS 阈值 0.5:0.05:0.95 的平均，COCO Keypoint 主指标
$AP^{OKS=.50}$ / $AP^{OKS=.75}$ | 宽松/严格阈值
$AP^{M}$ / $AP^{L}$ | 中等/大目标（面积 $32^2 \sim 96^2$ / $> 96^2$），不报告小目标
$AR$ | 不同阈值下的平均召回

表中和 [COCO Detection Metrics](/0384_ML_Metrics_Detection_COCO) 的 12 个指标是同一套思路，只是把 IoU 换成了 OKS，且没有 Small 目标（太小的人无法标注关键点）。

## PCK

- **PCK** - `Percentage of Correct Keypoints`：预测点与真值点的距离小于阈值的比例，单人姿态和人脸常用

$$
PCK@\alpha = \frac{1}{N}\sum_{i=1}^{N}1\Big(\frac{\lVert p_i - g_i \rVert}{L} \le \alpha\Big)
$$

其中：

- $N$：关键点总数（所有样本所有点）；$p_i$：预测点，$g_i$：真值点；$1(\cdot)$ 为指示函数
- $L$：归一化的参考长度；$\alpha$：相对阈值，如 0.05、0.1、0.2
- 参考长度 $L$ 的选择决定了指标名：`PCKh` 用头部框对角线（MPII 数据集，PCKh@0.5），`PCK` 用躯干长度或图像尺寸（LSP）
- 取值 $[0, 1]$，越大越好；阈值越小越严格

## NME

- **NME** - `Normalized Mean Error`：人脸关键点最常用，预测与真值的平均距离除以归一化因子

$$
NME = \frac{1}{N}\sum_{i=1}^{N}\frac{\lVert p_i - g_i \rVert_2}{d}
$$

其中：$N$ 为关键点个数；$d$ 为归一化距离，常用两眼外眼角距离（inter-ocular）或人脸框对角线；NME 越小越好，常以百分数报告；还常配合 `AUC@阈值` 和 `Failure Rate`（NME 超过阈值，如 10% 的样本占比）。

## 3D 姿态：MPJPE

- **MPJPE** - `Mean Per Joint Position Error`：预测的 3D 关节坐标与真值的平均欧氏距离，单位 mm
- **PA-MPJPE**：先用 Procrustes 对齐（去除旋转、平移、缩放）再算 MPJPE，只衡量姿态本身
- 越小越好；常见数据集 Human3.6M 上先以骨盆（root）对齐再计算

## 选择建议

Scenario | 推荐
-- | --
多人 2D 姿态（COCO） | OKS-AP / AR
单人 2D 姿态 | PCK / PCKh@0.5
人脸/手部关键点 | NME（+ AUC、Failure Rate）
3D 姿态 | MPJPE、PA-MPJPE
目标中心/点状目标 | [Center Distance](/0525_ML_Metrics_Detection_CD)

## Code
```python
import numpy as np

def oks(pred, gt, vis, area, kappas):
    # pred, gt: (K, 2); vis: (K,); area: 目标面积 s^2; kappas: (K,) 即 k_i
    d2 = ((pred - gt) ** 2).sum(1)
    e = d2 / (2 * area * kappas ** 2 + np.spacing(1))
    m = vis > 0
    return np.exp(-e[m]).sum() / max(m.sum(), 1)
```

## Reference
- [COCO Keypoint Evaluation](https://cocodataset.org/#keypoints-eval)
- [2D Human Pose Estimation: New Benchmark and State of the Art Analysis](http://human-pose.mpi-inf.mpg.de/) - MPII, PCKh
- [Human3.6M](http://vision.imar.ro/human3.6m/description.php)

