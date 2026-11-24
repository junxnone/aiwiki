---
Title | ML Metrics Detection GIoU
-- | --
Created @ | `2019-12-10T07:47:50Z`
Updated @| `2026-11-24T00:58:28Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/232)

---
# GIoU

- GIoU - `Generalized Intersection over Union`
- 在 IoU 基础上引入「最小外接框」，解决预测框与真值框**不相交时** IoU 恒为 0 的问题，既可以做评价指标，也可以做回归损失
- 论文：[Generalized Intersection over Union: A Metric and A Loss for Bounding Box Regression](https://giou.stanford.edu/GIoU.pdf)

## IOU - Jaccard Index
- 目标检测中用来衡量 Predict 结果和 GT 的距离，详见 [IoU](/0383_ML_Metrics_Detection_IoU)

$$
IoU = \frac{|A \cap B|}{|A \cup B|}
$$

其中：

- $A$：预测框 (Predict BBox) 的面积区域；$B$：真值框 (GT BBox) 的面积区域
- $|A \cap B|$：两个框的交集面积；$|A \cup B|$：并集面积
- 取值 $[0, 1]$，1 表示完全重合，0 表示不相交

---
问题 - Q?
- IoU 无法优化无重叠的 BBox
> 如下图中 2 和 1 的 IOU 都是 0， 但是理论认为 2 比 1 应该有更好的值
>> 蓝绿色为 GT, 另一个 BBox 为 Predict 

1 | 2 
-- | --
![image](https://user-images.githubusercontent.com/2216970/70511891-a65fc900-1b6a-11ea-9b2c-5e882b4bbc80.png) | ![image](https://user-images.githubusercontent.com/2216970/70512013-aeb80400-1b6a-11ea-8bbe-40a1f661e1d5.png)

图中：

- 两张图中蓝绿色框是 GT，另一个框是预测框，两种情况下预测框与 GT 都没有重叠，IoU 都为 0
- 图 2 的预测框离 GT 更近，理论上应该比图 1 更好，但 IoU 无法区分
- 作为损失函数时 IoU = 0 的梯度为 0，网络无法从这类样本学习，也就无法把框「拉」向目标


## GIOU

$$
GIoU = IoU - \frac{|C \setminus (A \cup B)|}{|C|}
$$

其中：

- $C$：能同时包含 $A$ 和 $B$ 的**最小外接矩形**（最小闭包区域）
- $|C \setminus (A \cup B)|$：$C$ 中不属于 $A$ 与 $B$ 并集的部分的面积（图中 C 的「空白」部分）
- $|C|$：最小外接框 $C$ 的面积；第二项反映两个框「离得有多远」，两个框越远，$C$ 越大，惩罚项越大

---
区域 `C`
- 包含 A 和 B 的最小 BBox

1 | 2
-- | --
![image](https://user-images.githubusercontent.com/2216970/70512788-44539380-1b6b-11ea-99a0-ab6b3dff4a3b.png) | ![image](https://user-images.githubusercontent.com/2216970/70512798-4d446500-1b6b-11ea-9c3a-ece0bea1cca6.png)

图中：与上一组相同的两种情况，外层的大框是最小外接框 $C$。图 1 中两个框相距更远，$C$ 更大、空白部分占比更高，GIoU 更低；图 2 的 GIoU 更高，这样 GIoU 就能区分两种不相交的情况。

---
- GIOU 取值范围 `[-1, 1]`
  - 两个框完全重合时 $GIoU = IoU = 1$
  - 两个框相距无限远时，$IoU = 0$ 且 $\frac{|C \setminus (A \cup B)|}{|C|} \to 1$，$GIoU \to -1$
  - 相交时 GIoU ≤ IoU，GIoU 始终是 IoU 的下界

![image](https://user-images.githubusercontent.com/2216970/70512982-ac09de80-1b6b-11ea-879e-5d840dd8360c.png)

上图对应 GIoU 的取值范围 `[-1, 1]`。GIoU 在两个框不相交时依然随距离连续变化，所以可以提供有效的梯度。

## GIOU Loss

$$
L_{GIoU} = 1 - GIoU
$$

其中：$L_{GIoU}$ 为回归损失，越小越好；$GIoU \in [-1, 1]$，因此 $L_{GIoU} \in [0, 2]$。

---
计算方法
- GIOU Loss 范围为 [0, 2]

![image](https://user-images.githubusercontent.com/2216970/70513795-44ed2980-1b6d-11ea-8b71-17ecee768c85.png)

上图是 GIoU Loss 的计算算法。步骤上：先求预测框和 GT 的面积与交集，得到并集和 IoU；再求最小外接框 $C$；最后得到 GIoU 及 Loss。

## 后续改进：DIoU / CIoU

GIoU 在两个框是包含关系时退化为 IoU（$C$ 等于外框），收敛也较慢。后续工作直接约束**中心点距离**和**长宽比**：

Name | Formula | Description
-- | -- | --
DIoU | $DIoU = IoU - \frac{\rho^2(\mathbf{b}, \mathbf{b}^{gt})}{c^2}$ | 增加中心点距离惩罚，收敛更快
CIoU | $CIoU = IoU - \frac{\rho^2(\mathbf{b}, \mathbf{b}^{gt})}{c^2} - \alpha v$ | 在 DIoU 基础上增加长宽比一致性

其中：

- $\mathbf{b}$、$\mathbf{b}^{gt}$：预测框、真值框的中心点坐标；$\rho(\cdot)$：欧氏距离，见 [Center Distance](/0525_ML_Metrics_Detection_CD)
- $c$：最小外接框 $C$ 的对角线长度，用来对中心距离做归一化
- $v = \frac{4}{\pi^2}\left(\arctan\frac{w^{gt}}{h^{gt}} - \arctan\frac{w}{h}\right)^2$：衡量预测框和真值框的长宽比差异；$w, h$ 为框的宽和高
- $\alpha = \frac{v}{(1 - IoU) + v}$：权重系数，IoU 越大时越重视长宽比
- 对应的损失为 $L_{DIoU} = 1 - DIoU$，$L_{CIoU} = 1 - CIoU$

## Code
```python
import torch

def giou(a, b, eps=1e-7):
    # a, b: (N, 4) xyxy
    iw = (torch.min(a[:, 2], b[:, 2]) - torch.max(a[:, 0], b[:, 0])).clamp(min=0)
    ih = (torch.min(a[:, 3], b[:, 3]) - torch.max(a[:, 1], b[:, 1])).clamp(min=0)
    inter = iw * ih
    area_a = (a[:, 2] - a[:, 0]) * (a[:, 3] - a[:, 1])
    area_b = (b[:, 2] - b[:, 0]) * (b[:, 3] - b[:, 1])
    union = area_a + area_b - inter
    iou = inter / (union + eps)
    # 最小外接框 C
    cw = torch.max(a[:, 2], b[:, 2]) - torch.min(a[:, 0], b[:, 0])
    ch = torch.max(a[:, 3], b[:, 3]) - torch.min(a[:, 1], b[:, 1])
    c = cw * ch
    return iou - (c - union) / (c + eps)

# torchvision.ops.generalized_box_iou 也提供了现成实现
```


## Reference

- [Github repo](https://github.com/generalized-iou)
- [官网](https://giou.stanford.edu/)
- [paper - Generalized Intersection over Union: A Metric and A Loss for Bounding Box Regression](https://giou.stanford.edu/GIoU.pdf)
- [paper - Distance-IoU Loss: Faster and Better Learning for Bounding Box Regression](https://arxiv.org/abs/1911.08287)

