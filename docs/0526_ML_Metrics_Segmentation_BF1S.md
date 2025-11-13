---
Title | ML Metrics Segmentation BF1S
-- | --
Created @ | `2025-11-13T08:09:31Z`
Updated @| `2025-11-13T08:09:31Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/526)

---
# Boundary F1-Score
- 分割边界 F1 分数（Segmentation Boundary F1-score）是评估图像分割边界精度的核心指标，综合了边界检测的精确率（Precision）和召回率（Recall）。


## 核心计算逻辑

1. 先定义 “真实边界”（来自标注数据）和 “预测边界”（模型输出结果）。
2. 计算精确率（Precision）：预测边界中与真实边界匹配的比例。
3. 计算召回率（Recall）：真实边界中被模型成功预测的比例。
4. 按 F1 公式计算：F1 = 2 × (Precision × Recall) / (Precision + Recall)，取值范围 0-1，越接近 1 表示边界分割越精准。
