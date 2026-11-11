---
Title | ML Op Dropout
-- | --
Created @ | `2019-03-02T04:21:09Z`
Updated @| `2026-11-11T01:07:20Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/258)

---
# Dropout

Dropout 是在神经网络**训练阶段**随机丢弃（置零）一部分神经元激活的正则化方法，由 Srivastava 等（JMLR 2014）系统提出。每次迭代随机选择一批单元暂时忽略，即不参与该次前向与反向；相当于每步训练一个随机"瘦"子网络，测试时近似对指数个子网络做集成，并抑制神经元间的协同适应（co-adaptation）。总体背景见 [Regularization](0252_ML_Op_Regularization)。

- 通常在过拟合场景使用（网络过深、训练过久或数据不足）。
- 常用丢弃率 $p$ 为 0.1~0.5：**太低**几乎没效果，**太高**导致学习不充分（欠拟合）。
- 扩展：[Dropout MS](0259_ML_Op_Dropout_MS)（Multi-Sample Dropout）。

![image](https://user-images.githubusercontent.com/2216970/53677074-412a9d80-3ce5-11e9-92b1-35ef4559f85f.png) | ![image](https://user-images.githubusercontent.com/2216970/53677075-438cf780-3ce5-11e9-995e-1b1331729120.png)
-- | --
标准的神经网络 | dropout后

## 1. 数学定义与 inverted dropout

设丢弃概率为 $p$，保留概率 $q=1-p$，掩码 $m_i\sim\mathrm{Bernoulli}(q)$。

原始论文做法：训练时 $y=m\odot x$，测试时把权重（或输出）乘 $q$ 以保持期望一致。

**Inverted dropout**（现代框架的统一做法）：训练时就把保留的单元放大，推理时不做任何处理：

$$y_{\text{train}}=\frac{m\odot x}{1-p},\qquad y_{\text{eval}}=x$$

期望 $\mathbb{E}[y_{\text{train}}]=x$，推理端零开销；方差 $\mathrm{Var}[y_i]=\frac{p}{1-p}x_i^2$。反向：$\frac{\partial L}{\partial x}=\frac{m}{1-p}\odot\frac{\partial L}{\partial y}$，必须复用前向的同一个 mask。

## 2. 输入输出与 PyTorch 用法

- 输入：任意 shape 张量，输出 shape 相同。参数仅 $p$（及 `inplace`），无可学习参数。
- 行为取决于 `module.training`：`model.train()` 时随机丢弃，`model.eval()` 时恒等。

```python
import torch, torch.nn as nn, torch.nn.functional as F

drop = nn.Dropout(p=0.5)
x = torch.randn(4, 8)
drop.train(); y = drop(x)    # 约一半为 0，其余乘 2
drop.eval();  y = drop(x)    # y == x

# 函数式：务必传 training 标志
y = F.dropout(x, p=0.1, training=model.training)

# 复现：固定随机种子（同一设备的 RNG 流）
torch.manual_seed(0)
```

## 3. 变体

| 变体 | 丢弃粒度 | 适用 | PyTorch |
|---|---|---|---|
| Dropout | 单个元素 | 全连接、Transformer（attention 权重、FFN、residual 前） | `nn.Dropout` |
| Dropout1d/2d/3d (SpatialDropout) | 整个通道（特征图） | 卷积：相邻像素强相关，逐元素丢弃几乎无效，需整通道丢弃 | `nn.Dropout1d/2d/3d` |
| DropPath (Stochastic Depth) | 整个残差分支（按样本） | ResNet、ViT、Swin、ConvNeXt；丢弃率常随深度线性递增 | `torchvision.ops.StochasticDepth`；timm `DropPath` |
| DropBlock | 特征图上连续的空间块 | CNN（如 ResNet、检测） | 第三方实现 |
| AlphaDropout | 保持 SELU 自归一化的均值/方差 | 配合 SELU 激活 | `nn.AlphaDropout` |
| DropConnect | 丢弃权重而非激活 | 全连接 | 第三方 |
| MC Dropout | 推理时**保持开启**，多次前向取均值/方差 | 不确定性估计 | 手动将 Dropout 模块设为 train |
| [Dropout MS](0259_ML_Op_Dropout_MS) | 同一批次多个 mask 共享前层 | 加速训练、提升泛化 | 手写 |

```python
def drop_path(x, p=0.1, training=True):
    if p == 0. or not training:
        return x
    keep = 1 - p
    shape = (x.shape[0],) + (1,) * (x.ndim - 1)   # 按样本
    mask = x.new_empty(shape).bernoulli_(keep)
    return x * mask / keep
# out = x + drop_path(block(x), p, self.training)

# MC Dropout：推理时仅启用 dropout 层
model.eval()
for m in model.modules():
    if isinstance(m, nn.Dropout):
        m.train()
preds = torch.stack([model(x) for _ in range(30)])
mean, var = preds.mean(0), preds.var(0)
```

## 4. 实现差异与优化

- **mask 生成**：Bernoulli 随机数，每次前向生成与输入同 shape 的 mask；训练时需保存 mask 用于反向（bool/uint8，1 字节/元素），或只保存 RNG 种子/offset 在反向重新生成以省显存。
- **融合进 kernel**：常与相邻算子融合，如 bias+dropout+residual add、softmax+dropout；FlashAttention 在 kernel 内用基于计数器的 RNG（Philox）按位置重生成 mask，不存储 $N\times N$ 的 mask。
- **种子可复现**：GPU 上用 Philox 等计数器 RNG，由 (seed, offset) 决定，同种子同设备可复现；跨设备/跨版本/不同并行切分的结果不保证一致，分布式训练需注意各 rank 的 RNG 状态（张量并行下部分位置的 dropout 需各 rank 一致，数据并行则应不同）。
- **推理时被消除**：eval 下 Dropout 是恒等映射；ONNX 导出（eval 模式）以及 OpenVINO、TensorRT 等推理引擎会直接移除该节点，无运行时开销。若导出时仍处于 train 模式会把随机算子带入图中，属于常见错误。
- **激活重计算**：gradient checkpointing 重算时必须保证 dropout mask 与首次前向一致（`torch.utils.checkpoint` 默认保存/恢复 RNG 状态）。

## 5. 常见坑

- 忘记 `model.eval()`：推理结果随机、精度下降。验证、测试、导出前一定调用。
- `F.dropout` 未传 `training=self.training`，默认 `training=True`，eval 也在丢弃。
- Dropout 与 [BatchNorm](0614_ML_Op_Norm_BatchNorm) 共用：训练时 Dropout 改变方差，推理时不再，而 BN 的 running variance 以训练分布统计，造成 variance shift；经验是 Dropout 放在所有 BN 之后，或只用其一。
- 卷积中逐元素 Dropout 效果有限，应使用 Dropout2d / DropBlock。
- $p$ 过大导致欠拟合；`inplace=True` 与需要保留输入的算子冲突时会出错。
- RNN 中每个时间步使用独立 mask 会破坏记忆，应使用 variational（跨时间共享 mask）dropout，见 [Recurrent](0618_ML_Op_Recurrent)。
- 大模型预训练常设 dropout=0，因数据量大、训练不到多个 epoch，不易过拟合。

## 6. Dropout 正在被抛弃？

> Dropout 在现代卷积架构中，已经逐步被 BN 取代，BN 也同样拥有不亚于 Dropout 的正则化效果。无论是 VGG、ResNet、Inception、MobileNetV2 等模型，都不见了 Dropout 踪影。唯独在 MobileNetV1 模型里，还可以找到 Dropout，但不是在卷积层；而且在 MobileNetV2 后，已经不再有全连接层，而是被全局平均池化层所取代。

Dropout 不再受青睐的原因：
- Dropout 在卷积层的正则效果有限。相比全连接层，卷积层训练参数较少，激活函数也能很好地完成特征的空间转换，因此**正则化效果在卷积层不明显**；
- 能发挥其作用的地方在全连接层，可当代深度网络中，**全连接层也在慢慢被 [GAP](0267_ML_Op_Pooling_GAP) 取代**，不但能减小模型尺寸，还可以提升性能。

注意：Transformer/ViT 中 Dropout 与 DropPath 仍被广泛使用。

## 7. Dropout vs Batch Normalization

![image](https://user-images.githubusercontent.com/2216970/53677173-a763f000-3ce6-11e9-8e4d-4c2b8d52c589.png) | ![image](https://user-images.githubusercontent.com/2216970/53677174-ab900d80-3ce6-11e9-8771-d41cef7d9f31.png)
-- | --
各模型的验证准确率 | 各模型的验证损失

> Dropout 在不同概率下，其表现差异较大，相对来说，Dropout with 0.2 的表现接近于 No bn and dropout（可以理解为 Dropout 的 keep-prob 为 1 的版本）。总体来说，BN 在准确率和损失率上表现要优于 Dropout，比如准确率上 BN 能达到 85%，而 Dropout 接近为 79%。

## 与其他 OP 的关系

[Regularization](0252_ML_Op_Regularization)、[BatchNorm](0614_ML_Op_Norm_BatchNorm)、[Linear](0612_ML_Op_Linear)、[Attention](0210_ML_Attention)、[Elementwise](0620_ML_Op_Elementwise)（mask 乘法与缩放）、[ML Op 总览](0366_ML_Op)。

## Reference

- [Dropout VS Batch Normalization? 是时候放弃Dropout了](http://www.cnblogs.com/hutao722/p/9946047.html)
- [keras - dropout layer](https://keras.io/zh/layers/core/#dropout)
- [Dropout: A Simple Way to Prevent Neural Networks from Overfitting - 2014](http://www.jmlr.org/papers/volume15/srivastava14a/srivastava14a.pdf)
- [Dropout as a Bayesian Approximation (MC Dropout)](https://arxiv.org/abs/1506.02142)
- [DropBlock](https://arxiv.org/abs/1810.12890)
- [Deep Networks with Stochastic Depth](https://arxiv.org/abs/1603.09382)
- [Understanding the Disharmony between Dropout and Batch Normalization by Variance Shift](https://arxiv.org/abs/1801.05134)
- [torch.nn.Dropout](https://pytorch.org/docs/stable/generated/torch.nn.Dropout.html)

