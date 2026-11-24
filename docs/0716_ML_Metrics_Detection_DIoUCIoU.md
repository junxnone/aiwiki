---
Title | ML Metrics Detection DIoUCIoU
-- | --
Created @ | `2026-11-24T01:03:58Z`
Updated @| `2026-11-24T02:49:21Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/716)

---
# IoU Loss Family 边界框回归损失

- 目标检测的 BBox 回归损失从 L1/L2 逐步演进到 **IoU 系列损失**：IoU → GIoU → DIoU → CIoU → EIoU
- 它们都是在 [IoU](/0383_ML_Metrics_Detection_IoU) 的基础上，补上 IoU 没有考虑的几何因素（不相交距离、中心点距离、长宽比）
- 它们是**训练用的回归损失**；评估检测效果时仍使用 IoU 阈值下的 [AP](/0382_ML_Metrics_Detection_APmAPAR)。GIoU 的基础见 [GIoU](/0232_ML_Metrics_Detection_GIoU)

下图是这一系列损失的演进：

```mermaid
graph LR
    L(L1 / L2<br/>坐标回归) --> I(IoU Loss<br/>不相交时无梯度)
    I --> G(GIoU<br/>加最小外接框)
    G --> D(DIoU<br/>加中心点距离)
    D --> C(CIoU<br/>加长宽比)
    C --> E(EIoU<br/>分别约束宽和高)
```

图中：

- 每一步箭头表示在上一个损失的基础上解决一个具体问题：IoU 在不相交时梯度为 0，GIoU 用外接框解决；GIoU 在包含关系时退化且收敛慢，DIoU 直接约束中心点距离；CIoU 再加入长宽比；EIoU 把长宽比拆成宽、高的差值
- 从左到右定位约束越来越完整，收敛更快，但每个损失的额外计算也在增加

## 对比

Name | Formula | 解决的问题
-- | -- | --
IoU | $IoU = \frac{\lvert A \cap B \rvert}{\lvert A \cup B \rvert}$ | 与尺度无关，但不相交时无梯度
GIoU | $IoU - \frac{\lvert C \setminus (A \cup B) \rvert}{\lvert C \rvert}$ | 不相交时有梯度
DIoU | $IoU - \frac{\rho^2(\mathbf{b}, \mathbf{b}^{gt})}{c^2}$ | 直接缩小中心点距离，收敛快；包含关系下也有效
CIoU | $IoU - \frac{\rho^2(\mathbf{b}, \mathbf{b}^{gt})}{c^2} - \alpha v$ | 额外考虑长宽比一致
EIoU | $IoU - \frac{\rho^2(\mathbf{b}, \mathbf{b}^{gt})}{c^2} - \frac{\rho^2(w, w^{gt})}{c_w^2} - \frac{\rho^2(h, h^{gt})}{c_h^2}$ | 直接最小化宽高差，比 CIoU 的 $v$ 项更直接

其中：

- $A$：预测框，$B$：真值框；$C$：能同时包含 $A$、$B$ 的最小外接矩形，$c_w$、$c_h$ 为 $C$ 的宽和高，$c$ 为 $C$ 的对角线长度
- $\mathbf{b}$、$\mathbf{b}^{gt}$：预测框和真值框的中心点；$\rho(\cdot)$：欧氏距离，见 [Center Distance](/0525_ML_Metrics_Detection_CD)
- $w, h$：预测框的宽和高，$w^{gt}, h^{gt}$：真值框的宽和高
- $v = \frac{4}{\pi^2}\left(\arctan\frac{w^{gt}}{h^{gt}} - \arctan\frac{w}{h}\right)^2$：长宽比差异；$\alpha = \frac{v}{(1 - IoU) + v}$：权重，IoU 越大越重视长宽比
- 对应损失：$L = 1 - (\text{对应的 IoU 变体})$

## 选择建议

- 现代检测器中常见：YOLOv5 默认使用 CIoU，YOLOv8 之后常见 CIoU + DFL，RT-DETR 等使用 L1 + GIoU
- 训练初期框与目标距离较远，DIoU/CIoU 的中心距离项收敛更快；训练后期框已对齐时，长宽比项才起作用
- CIoU 的 $v$ 项对宽高的梯度符号相反（一个增大另一个必然减小），有时会拖慢收敛，EIoU 为此改进
- 小目标场景：IoU 类损失对小目标的偏移很敏感，可以考虑 Wasserstein Distance / NWD 等基于高斯分布的度量（可选）
- 也可以用「Focal」加权（如 Focal-EIoU）降低大量低质量框的影响

## Code
```python
import math
import torch

def ciou_loss(a, b, eps=1e-7):
    # a, b: (N, 4) xyxy, a 为预测, b 为真值
    iw = (torch.min(a[:, 2], b[:, 2]) - torch.max(a[:, 0], b[:, 0])).clamp(min=0)
    ih = (torch.min(a[:, 3], b[:, 3]) - torch.max(a[:, 1], b[:, 1])).clamp(min=0)
    inter = iw * ih
    wa, ha = a[:, 2] - a[:, 0], a[:, 3] - a[:, 1]
    wb, hb = b[:, 2] - b[:, 0], b[:, 3] - b[:, 1]
    union = wa * ha + wb * hb - inter
    iou = inter / (union + eps)

    cw = torch.max(a[:, 2], b[:, 2]) - torch.min(a[:, 0], b[:, 0])      # 最小外接框的宽高
    ch = torch.max(a[:, 3], b[:, 3]) - torch.min(a[:, 1], b[:, 1])
    c2 = cw ** 2 + ch ** 2 + eps                                          # 对角线平方
    rho2 = ((a[:, 0] + a[:, 2] - b[:, 0] - b[:, 2]) ** 2 +
            (a[:, 1] + a[:, 3] - b[:, 1] - b[:, 3]) ** 2) / 4             # 中心距离平方

    v = (4 / math.pi ** 2) * (torch.atan(wb / (hb + eps)) - torch.atan(wa / (ha + eps))) ** 2
    with torch.no_grad():
        alpha = v / (1 - iou + v + eps)
    return 1 - (iou - rho2 / c2 - alpha * v)

# torchvision.ops 提供 generalized_box_iou_loss / distance_box_iou_loss / complete_box_iou_loss
```

## Reference
- [Generalized Intersection over Union](https://giou.stanford.edu/GIoU.pdf)
- [Distance-IoU Loss: Faster and Better Learning for Bounding Box Regression](https://arxiv.org/abs/1911.08287)
- [Focal and Efficient IOU Loss for Accurate Bounding Box Regression](https://arxiv.org/abs/2101.08158)
- [torchvision.ops.complete_box_iou_loss](https://pytorch.org/vision/stable/generated/torchvision.ops.complete_box_iou_loss.html)


