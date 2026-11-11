---
Title | ML Op Regularization
-- | --
Created @ | `2019-09-11T01:11:11Z`
Updated @| `2026-11-11T01:07:18Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/252)

---
# Regularization 正则化

正则化（Regularization）是对学习过程引入额外约束或信息、以抑制过拟合并提升泛化能力的一类方法的统称。它既包括显式地在损失函数中加惩罚项（L1/L2），也包括修改优化器（weight decay）、修改网络结构/前向过程（[Dropout](0258_ML_Op_Dropout)、DropPath、[BatchNorm](0614_ML_Op_Norm_BatchNorm)）、修改数据与标签（数据增强、label smoothing）以及修改训练流程（早停）等隐式手段。核心直觉：更小的权值 $w$ 意味着模型函数更平滑、复杂度更低。

![image](https://user-images.githubusercontent.com/2216970/64660983-568f3a00-d475-11e9-8fca-aab3fd6abee6.png)
![image](https://user-images.githubusercontent.com/2216970/64660987-5a22c100-d475-11e9-8c62-6fcd13d1fd20.png)
![image](https://user-images.githubusercontent.com/2216970/64660989-5c851b00-d475-11e9-99b6-587a1666b98d.png)

## 1. 显式正则：L1 / L2

设原始损失为 $L_0(w)$，加入惩罚项后：

$$L(w)=L_0(w)+\lambda\,\Omega(w),\quad \Omega_{L1}(w)=\|w\|_1=\sum_i|w_i|,\quad \Omega_{L2}(w)=\tfrac12\|w\|_2^2=\tfrac12\sum_i w_i^2$$

梯度：

$$\nabla_w L_{L2}=\nabla_w L_0+\lambda w,\qquad \nabla_w L_{L1}=\nabla_w L_0+\lambda\,\mathrm{sign}(w)$$

- **L2（岭回归 / Ridge）**：一步 SGD 更新为 $w\leftarrow (1-\eta\lambda)w-\eta\nabla L_0$。权重每步先按比例缩小，故称**权重衰减（weight decay）**。若损失按样本数写为 $\frac{\lambda}{2n}\|w\|^2$，则系数为 $1-\eta\lambda/n$。L2 使权重整体变小但很少恰好为 0。
- **L1（Lasso）**：每步以恒定幅度把权重向 0 推，容易得到**稀疏解**（很多参数恰为 0），可用于特征选择；L1 在 0 处不可导，需用次梯度或近端算子（soft-thresholding）。
- 稀疏性说明：特征很多（如文本 bigram 上万维）时，稀疏模型只保留少数非零系数的特征，相当于做了特征选择，降低过拟合风险。L2 主要防过拟合，L1 一定程度上也可以。
- 贝叶斯视角：L2 等价于对权重加零均值高斯先验的 MAP；L1 等价于拉普拉斯先验。
- Elastic Net：$\lambda_1\|w\|_1+\lambda_2\|w\|_2^2$，兼顾二者。

## 2. Weight Decay 与 L2 的区别：AdamW 解耦

对 **SGD**，L2 惩罚与 weight decay 等价。但对**自适应优化器**（Adam 等）不等价：L2 项的梯度 $\lambda w$ 会被并入梯度后再除以二阶矩估计 $\sqrt{\hat v}$，梯度历史大的参数衰减反而更弱，正则强度与参数的梯度历史耦合。

AdamW（Loshchilov & Hutter）将衰减**解耦**，直接作用于参数而不进入自适应缩放：

$$\theta_t=\theta_{t-1}-\eta\left(\frac{\hat m_t}{\sqrt{\hat v_t}+\epsilon}+\lambda\,\theta_{t-1}\right)$$

```python
import torch
# 耦合：weight_decay 被加进梯度（等价 L2），会被自适应缩放影响
opt_l2 = torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-2)
# 解耦：AdamW，Transformer / ViT 训练的常用选择
opt_w = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)

# 常见做法：bias 与 Norm 的参数不做 weight decay
decay, no_decay = [], []
for n, p in model.named_parameters():
    if not p.requires_grad:
        continue
    (no_decay if p.ndim <= 1 else decay).append(p)   # 1-D: bias / BN / LN 参数
opt = torch.optim.AdamW([
    {"params": decay, "weight_decay": 0.05},
    {"params": no_decay, "weight_decay": 0.0}], lr=1e-3)

# 显式 L1：手动加到 loss
l1 = sum(p.abs().sum() for p in model.parameters())
loss = criterion(out, y) + 1e-5 * l1
```

## 3. 隐式正则与结构化正则对比

| 方法 | 作用机制 | 典型用法 / 位置 | 备注 |
|---|---|---|---|
| L1 | 惩罚 \|w\|，诱导稀疏 | loss 项 | 剪枝 / 特征选择 |
| L2 / weight decay | 收缩权重 | 优化器参数 | Adam 系建议用 AdamW |
| [Dropout](0258_ML_Op_Dropout) | 训练时随机丢弃神经元，类似子网络集成 | 全连接、Transformer 的 attention/FFN | 推理时关闭 |
| DropPath (Stochastic Depth) | 随机丢弃整个残差分支 | ResNet/ViT/ConvNeXt 深层 | 丢弃率常随深度线性增大 |
| 数据增强 | 扩充数据分布，注入不变性先验 | 翻转/裁剪/Mixup/CutMix/RandAugment | CNN/ViT 常收益最大 |
| 早停 Early Stopping | 验证集指标不再提升时停止，限制有效容量 | 训练循环 | 小数据集有效；与 L2 有近似关系 |
| Label Smoothing | 软化 one-hot 标签，防止 logits 过度自信 | `CrossEntropyLoss(label_smoothing=0.1)` | 利于校准；可能影响蒸馏教师质量 |
| [BatchNorm](0614_ML_Op_Norm_BatchNorm) | batch 统计量引入噪声，带来轻微正则 | 卷积网络 | 因而现代 CNN 常去掉 Dropout |
| 结构约束 | 减少自由度 | 卷积的权值共享、[GAP](0267_ML_Op_Pooling_GAP) 取代全连接 | 结构层面的正则 |
| 小 batch / 大学习率 | SGD 噪声偏向平坦极小值 | 优化超参 | 隐式正则 |

```python
import torch.nn as nn
crit = nn.CrossEntropyLoss(label_smoothing=0.1)
```

## 4. 实践建议与常见坑

- 正则强度 $\lambda$ 需与学习率联合调；AdamW 中每步实际衰减为 $\eta\lambda$ 量级，使用学习率调度时衰减也随之变化。
- **不要对 bias 和 [Norm](0613_ML_Op_Norm) 的 $\gamma,\beta$ 做 weight decay**，否则易伤害性能（Embedding 视情况）。
- BN 之前的权重具有尺度不变性，此时 L2 并不真正约束函数复杂度，而是改变有效学习率。
- 欠拟合时加正则只会更差；先确认确实过拟合（训练/验证曲线差距大）。
- 同时叠加过多正则（强增强 + 大 Dropout + 大 label smoothing）会导致欠拟合，需要配合更长训练。
- Dropout 与 BN 同用存在方差偏移问题，见 [Dropout](0258_ML_Op_Dropout)。
- 推理阶段：weight decay/L1/L2、label smoothing、数据增强、早停都只影响训练，不产生推理算子；Dropout/DropPath 在推理时是恒等映射，可被图优化消除。

## 与其他 OP 的关系

- [Dropout](0258_ML_Op_Dropout)、[Dropout MS](0259_ML_Op_Dropout_MS)：算子级的随机正则。
- [BatchNorm](0614_ML_Op_Norm_BatchNorm)、[LayerNorm](0615_ML_Op_Norm_LayerNorm)：归一化带来隐式正则与优化加速。
- [Loss Function](0281_ML_Arch_Func_LossFunction)：L1/L2 惩罚项、label smoothing 都是对损失的修改。
- [ML Op 总览](0366_ML_Op)

## Reference
- [权重衰减（weight decay）与学习率衰减（learning rate decay）](https://blog.csdn.net/program_developer/article/details/80867468)
- [正则化方法：L1和L2 regularization、数据集扩增、dropout](https://blog.csdn.net/u012162613/article/details/44261657)
- [Decoupled Weight Decay Regularization (AdamW)](https://arxiv.org/abs/1711.05101)
- [Rethinking the Inception Architecture (label smoothing)](https://arxiv.org/abs/1512.00567)
- [Deep Networks with Stochastic Depth](https://arxiv.org/abs/1603.09382)
- [torch.optim.AdamW](https://pytorch.org/docs/stable/generated/torch.optim.AdamW.html)

