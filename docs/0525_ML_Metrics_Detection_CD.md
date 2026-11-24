---
Title | ML Metrics Detection CD
-- | --
Created @ | `2025-11-13T07:38:06Z`
Updated @| `2026-11-24T02:50:04Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/525)

---
# Center Distance 中心点距离
- Center error（目标检测中心误差）是衡量检测框定位精度的核心指标，指预测检测框中心坐标与真实框中心坐标的偏差。
- 中心误差偏大时，通常指向模型对目标位置特征学习不足，需调整锚框设计、优化回归头损失函数。
- 与 [IoU](/0383_ML_Metrics_Detection_IoU) 的区别：IoU 看重叠面积，两个框不相交时恒为 0；Center Distance 在不相交时仍然有意义，且与框的大小、长宽比无关

## 常见计算方式

- **欧氏距离**：直接计算两点间直线距离，公式为 $\sqrt{(p_x - g_x)^2 + (p_y - g_y)^2}$ ，直观反映绝对偏差。
- **归一化误差**：将欧氏距离除以图像对角线长度或目标尺寸，消除图像大小、目标尺度对误差的影响，便于跨场景对比。
- **L1 距离**：计算坐标偏差绝对值之和 $(|px-gx| + |py-gy|)$ ，对异常值敏感度低于欧氏距离。

其中：

- $(p_x, p_y)$：预测框的中心坐标 $\left(\frac{x_1+x_2}{2}, \frac{y_1+y_2}{2}\right)$；$(g_x, g_y)$：真值框的中心坐标
- 欧氏距离的单位与坐标一致（像素，3D 检测中为米）
- 归一化形式：$CD_{norm} = \frac{\sqrt{(p_x - g_x)^2 + (p_y - g_y)^2}}{s}$，$s$ 为图像对角线长度或目标的尺度（如 $\sqrt{w_g h_g}$、真值框对角线）

## 作为匹配/评估指标

- **作为匹配标准**：用 Center Distance 代替 IoU 来判定 TP。例如 nuScenes 3D 检测用 BEV 平面上中心距离 $d$ 与阈值（0.5, 1, 2, 4 米）比较，在多个阈值上分别计算 AP 再平均。原因是小目标（行人）和远处目标 IoU 对位置偏差过于敏感
- **作为误差统计**：对所有 TP 统计平均中心误差（如 nuScenes 的 `mATE`, mean Translation Error），反映定位精度，与 AP（有没有检测到）互补
- **作为损失项**：DIoU/CIoU 在 IoU 基础上加入归一化的中心距离惩罚，见 [GIoU](/0232_ML_Metrics_Detection_GIoU)
- 小目标、点状目标（如关键点、缺陷中心）检测中，只要求中心落在目标内或在容差内即可，Center Distance 比 IoU 更合适

## 注意

- 只考虑中心，不反映框的大小和长宽比误差，需要和 IoU 或宽高误差一起看
- 统计时先确定匹配关系（哪个预测对应哪个 GT），再计算 TP 的平均误差；漏检和误检不进入平均，要结合 Recall/Precision 解读

## Code
```python
import numpy as np

def center_distance(pred, gt, norm=None):
    # pred, gt: (x1, y1, x2, y2)
    pc = np.array([(pred[0] + pred[2]) / 2, (pred[1] + pred[3]) / 2])
    gc = np.array([(gt[0] + gt[2]) / 2, (gt[1] + gt[3]) / 2])
    d = np.linalg.norm(pc - gc)
    return d / norm if norm else d
```


## Reference

- [nuScenes detection task](https://www.nuscenes.org/object-detection) - Center Distance 匹配与 mATE


