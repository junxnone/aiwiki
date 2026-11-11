---
Title | ML Op Dropout MS
-- | --
Created @ | `2020-03-23T01:35:35Z`
Updated @| `2026-11-11T01:07:22Z`
Labels | `index`
Edit @| [here](https://github.com/junxnone/aiwiki/issues/259)

---
# Multi-Sample Dropout

Multi-Sample Dropout 是对标准 [Dropout](0258_ML_Op_Dropout) 的扩展（2019，IBM Research）：在同一个 mini-batch 上，为同一份特征创建多个不同的 dropout 样本（不同 mask），分别经过共享参数的后续层并计算损失，最后**平均所有样本的损失**作为最终损失。它能加快训练收敛并提高泛化能力，属于 [Regularization](0252_ML_Op_Regularization) 的一种。

- 加快训练速度
- 提高泛化能力
- 创建多个 dropout 样本，平均所有样本的损失得到最终的损失
- dropout 样本数大于 8 个时，再增加样本数量不再带来显著收益

---
![image](https://user-images.githubusercontent.com/2216970/77271574-088fa480-6cea-11ea-8ca5-912a082900d5.png)

## 1. 方法与数学定义

设骨干网络输出特征 $h=f_\theta(x)$，其后是 Dropout 与分类头（全连接 + softmax）。标准做法只采样一个 mask；Multi-Sample Dropout 采样 $M$ 个 mask $m^{(1)},\dots,m^{(M)}$，**共享**分类头参数 $W,b$：

$$z^{(k)}=W\left(\frac{m^{(k)}\odot h}{1-p}\right)+b,\qquad L=\frac1M\sum_{k=1}^{M}\mathrm{CE}\left(\mathrm{softmax}(z^{(k)}),y\right)$$

要点：
- 只复制 dropout 之后的层，骨干网络（计算量最大）只前向一次，额外开销仅为分类头的 $M$ 次计算，代价很小。
- 损失为多个 mask 的平均，梯度方差更小，训练更稳定、收敛更快。
- 推理时与普通 Dropout 一致：关闭 dropout，单次前向，无额外开销。
- 与对整个网络做 $M$ 次前向（相当于扩大 batch）不同，此法共享骨干计算。

## 2. PyTorch 示例

```python
import torch, torch.nn as nn, torch.nn.functional as F

class MSDHead(nn.Module):
    def __init__(self, in_dim, num_classes, num_samples=5, p=0.5):
        super().__init__()
        self.fc = nn.Linear(in_dim, num_classes)      # 各 dropout 样本共享
        self.drops = nn.ModuleList([nn.Dropout(p) for _ in range(num_samples)])

    def forward(self, h, y=None):
        if not self.training:                         # 推理：普通前向
            return self.fc(h)
        logits = [self.fc(d(h)) for d in self.drops]  # 每个 Dropout 独立 mask
        mean_logits = torch.stack(logits).mean(0)
        if y is None:
            return mean_logits
        loss = sum(F.cross_entropy(z, y) for z in logits) / len(logits)
        return loss, mean_logits
```

## 3. 实践与注意

- 样本数 $M$ 通常取 4~8，超过 8 收益饱和。
- 放置位置：通常加在最后的全连接层之前，因为共享计算最多、额外代价最小，且 Dropout 在全连接层更有效。
- 训练时为每个样本分别算损失再平均（而非先平均 logits），这是论文的做法；平均 logits 再算损失是不同的目标，效果需自行验证（待核实）。
- 与 BN 并用时仍需注意 Dropout 与 BN 的方差偏移问题，见 [Dropout](0258_ML_Op_Dropout)。
- 推理阶段该结构退化为单个线性层，导出模型后与普通分类头完全相同，无需特殊支持。

## 与其他 OP 的关系

[Dropout](0258_ML_Op_Dropout)（基础）、[Regularization](0252_ML_Op_Regularization)、[Linear](0612_ML_Op_Linear)（共享的分类头）、[Softmax](0335_ML_Op_AF_Softmax) 与 [Loss Function](0281_ML_Arch_Func_LossFunction)（损失平均）、[ML Op 总览](0366_ML_Op)。

## Reference

- [paper - 2019 -Multi-Sample Dropout for Accelerated Training and Better Generalization](https://arxiv.org/pdf/1905.09788.pdf)
- [大幅减少训练迭代次数，提高泛化能力：IBM提出「新版Dropout」](https://www.sohu.com/a/319115531_129720)
- [Dropout: A Simple Way to Prevent Neural Networks from Overfitting - 2014](http://www.jmlr.org/papers/volume15/srivastava14a/srivastava14a.pdf)

