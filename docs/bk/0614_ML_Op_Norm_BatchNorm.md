-----

| Title     | ML Op Norm BatchNorm                                  |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-10T09:50:13Z`                                |
| Updated @ | `2026-11-10T09:50:13Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/614) |

-----

# ML Op BatchNorm

BatchNorm（Batch Normalization，BN）对每个通道，利用 mini-batch
内所有样本（及空间位置）的均值和方差对激活做归一化，再通过可学习的
$\\gamma,\\beta$ 恢复表达能力。它是 CNN 时代最重要的 OP 之一，训练时依赖 batch 统计量，推理时使用滑动平均的
running 统计量，因此可以在部署时折叠进前面的
[Convolution](0009_ML_Op_Convolution)，几乎零开销。本文覆盖公式、训练/推理差异、小
batch 与 SyncBN、Conv-BN folding 推导、各框架实现、INT8 量化与常见坑。各类归一化的整体对比见
[Norm](0613_ML_Op_Norm)。

## 目的

  - 稳定每层输入分布，允许更大的学习率，加速收敛；
  - 对初始化不敏感；
  - 带来轻微的正则效果（batch 统计量的噪声）；
  - 推理阶段可被折叠为一个仿射变换并并入前层权重。

BN 为什么有效（ICS vs loss landscape 平滑）的争论见 [Norm](0613_ML_Op_Norm)。

## 数学定义

### 训练阶段

输入 $x\\in\\mathbb{R}^{N\\times C\\times \*}$，对每个通道 $c$，统计集合为该通道在 batch
与所有空间位置上的元素，共 $m=N\\cdot\\prod(\\text{spatial})$ 个：

$$ \\mu\_c=\\frac1m\\sum\_{i=1}^{m}x\_{i,c},\\qquad
\\sigma\_c^2=\\frac1m\\sum\_{i=1}^{m}(x\_{i,c}-\\mu\_c)^2 $$

$$ \\hat
x\_{i,c}=\\frac{x\_{i,c}-\\mu\_c}{\\sqrt{\\sigma\_c^2+\\epsilon}},\\qquad
y\_{i,c}=\\gamma\_c\\hat x\_{i,c}+\\beta\_c $$

这里归一化使用的是 **有偏** 方差（除以 $m$）。更新 running 统计量时，PyTorch 使用 **无偏** 方差（除以
$m-1$）：

$$ \\hat\\mu\\leftarrow(1-\\rho)\\hat\\mu+\\rho,\\mu\_c,\\qquad
\\hat\\sigma^2\\leftarrow(1-\\rho)\\hat\\sigma^2+\\rho,\\frac{m}{m-1}\\sigma\_c^2
$$

### 推理阶段

使用 running 统计量，BN 退化为每通道的固定仿射变换：

$$ y=\\gamma\\frac{x-\\hat\\mu}{\\sqrt{\\hat\\sigma^2+\\epsilon}}+\\beta
=\\underbrace{\\frac{\\gamma}{\\sqrt{\\hat\\sigma^2+\\epsilon}}}*{a},x+\\underbrace{\\Big(\\beta-\\frac{\\gamma\\hat\\mu}{\\sqrt{\\hat\\sigma^2+\\epsilon}}\\Big)}*{b}
$$

### 反向传播

令 $g=\\partial L/\\partial y$，则（对每个通道）

$$ \\frac{\\partial L}{\\partial\\gamma}=\\sum g,\\hat x,\\quad
\\frac{\\partial L}{\\partial\\beta}=\\sum g,\\quad \\frac{\\partial
L}{\\partial
x}=\\frac{\\gamma}{m\\sqrt{\\sigma^2+\\epsilon}}\\Big(m,g-\\sum g-\\hat
x\\sum g\\hat x\\Big) $$

因为 $\\mu,\\sigma$ 依赖于同一 batch 内所有样本，梯度中含有 "减去均值" 和 "减去与 $\\hat x$ 相关的部分"
两项，这也是 BN 的梯度更 "居中、正交" 的原因。

## 输入输出与参数

| 类型            | 输入 shape                | 输出 shape | 参数 shape                                             | 说明           |
| ------------- | ----------------------- | -------- | ---------------------------------------------------- | ------------ |
| `BatchNorm1d` | $\[N,C\]$ 或 $\[N,C,L\]$ | 同输入      | $\\gamma,\\beta,\\hat\\mu,\\hat\\sigma^2$ 均为 $\[C\]$ | 全连接特征或 1D 序列 |
| `BatchNorm2d` | $\[N,C,H,W\]$           | 同输入      | 同上                                                   | 图像           |
| `BatchNorm3d` | $\[N,C,D,H,W\]$         | 同输入      | 同上                                                   | 视频/体数据       |

PyTorch
主要参数：`num_features`、`eps=1e-5`、`momentum=0.1`、`affine=True`、`track_running_stats=True`。buffer
中还有 `num_batches_tracked`（当 `momentum=None` 时用于累计平均）。

注意：训练时 $m=1$（如 `BatchNorm1d` 输入 $\[1,C\]$）会报错 "Expected more than 1
value per channel"。

## 典型用法

``` python
import torch, torch.nn as nn

class Block(nn.Module):
    def __init__(self, cin, cout):
        super().__init__()
        self.conv = nn.Conv2d(cin, cout, 3, padding=1, bias=False)  # BN 前不需要 bias
        self.bn = nn.BatchNorm2d(cout)
        self.act = nn.ReLU(inplace=True)
    def forward(self, x):
        return self.act(self.bn(self.conv(x)))

m = Block(3, 16)
m.train(); y = m(torch.randn(8, 3, 32, 32))   # 用 batch 统计量，更新 running stats
m.eval();  y = m(torch.randn(1, 3, 32, 32))   # 用 running stats
```

ONNX 对应算子为 `BatchNormalization`（输入 `X, scale, B, input_mean,
input_var`；属性 `epsilon`、`momentum`；训练模式可额外输出更新后的
mean/var）。`torch.onnx.export` 默认在 eval 模式下导出，通常会产生推理形式的
`BatchNormalization`，或被导出器直接折叠进 Conv。

## 训练 vs 推理与 momentum 约定

PyTorch 与 TensorFlow/Keras 的 momentum 含义 **相反**：

| 框架                 | 更新公式                                               | 默认值                            | 对应关系              |
| ------------------ | -------------------------------------------------- | ------------------------------ | ----------------- |
| PyTorch            | $\\hat\\mu\\leftarrow(1-\\rho)\\hat\\mu+\\rho\\mu$ | $\\rho=0.1$                    | $\\rho=1-m\_{tf}$ |
| TensorFlow / Keras | $\\hat\\mu\\leftarrow m,\\hat\\mu+(1-m)\\mu$       | $m=0.99$（Keras 常见默认，具体以版本文档为准） | $m\_{tf}=1-\\rho$ |

所以从 TF 权重或超参迁移到 PyTorch 时，`momentum=0.99` 要改为约 `0.01`。另一个差异是 PyTorch 的
running var 用无偏估计，而归一化本身用有偏估计；导入权重时二者影响很小，但做严格数值对齐时需要注意。

此外，`eps` 默认值在不同框架中也不同（PyTorch 1e-5；Keras 为 1e-3），导入权重时必须对齐，否则输出有可观的偏差。

## 小 batch 问题

BN 的统计量是对真实分布的 batch 估计，估计误差随 $1/\\sqrt m$ 下降：

  - 小 batch 时均值/方差噪声大，训练时的统计量与推理时的 running 统计量不一致（train-test
    discrepancy），精度下降；
  - 目标检测、语义分割、3D 等因显存而 batch 很小的任务尤其明显；
  - batch 内样本相关（如同一视频的多帧、同序列采样）会使统计量有偏。

对策：

1.  **SyncBN**：跨 GPU 同步统计量；
2.  改用 **GroupNorm / LayerNorm** 等不依赖 batch 的方法（见
    [Norm](0613_ML_Op_Norm)、[LayerNorm](0615_ML_Op_Norm_LayerNorm)）；
3.  Batch Renormalization、冻结 BN（用预训练的 running 统计量）等。

## SyncBN

多卡 DDP 训练时，每张卡默认只用本卡的 local batch 计算统计量。SyncBN 通过 all-reduce
汇总各卡的和与平方和（或 Welford 合并），得到全局 batch 的
$\\mu,\\sigma^2$：

$$ \\mu=\\frac{\\sum\_k S\_k}{\\sum\_k m\_k},\\quad
\\sigma^2=\\frac{\\sum\_k Q\_k}{\\sum\_k m\_k}-\\mu^2 $$

其中 $S\_k,Q\_k$ 为第 $k$ 卡的和与平方和（实现中通常用数值更稳定的合并公式）。

``` python
model = nn.SyncBatchNorm.convert_sync_batchnorm(model)  # 递归替换 BatchNorm*d
model = nn.parallel.DistributedDataParallel(model.cuda(), device_ids=[rank])
```

代价是前向和反向各多一次通信（all-gather/all-reduce），需要在 DDP + CUDA 下使用，且各卡 batch
大小不一致时需注意合并方式。如果 local batch 已足够大（例如每卡 32 以上），SyncBN 的收益有限。

## Conv-BN folding 推导

推理时 BN 是固定仿射变换，可吸收进前一层 Conv。设 Conv 为

$$ z=W\*x+b $$

BN 的推理形式为 $y=a,z+b\_{bn}$，其中对每个输出通道 $c$：

$$ a\_c=\\frac{\\gamma\_c}{\\sqrt{\\hat\\sigma\_c^2+\\epsilon}},\\qquad
b\_{bn,c}=\\beta\_c-a\_c\\hat\\mu\_c $$

代入得

$$ y\_c=a\_c(W\_c\*x+b\_c)+\\beta\_c-a\_c\\hat\\mu\_c
=\\underbrace{(a\_cW\_c)}\_{W'*c}\*x+\\underbrace{a\_c(b\_c-\\hat\\mu\_c)+\\beta\_c}*{b'\_c}
$$

即

$$
W'\_c=\\frac{\\gamma\_c}{\\sqrt{\\hat\\sigma\_c^2+\\epsilon}}W\_c,\\qquad
b'\_c=\\frac{\\gamma\_c(b\_c-\\hat\\mu\_c)}{\\sqrt{\\hat\\sigma\_c^2+\\epsilon}}+\\beta\_c
$$

若 Conv 无 bias，取 $b\_c=0$。折叠后 BN 消失，推理少一次逐元素访存，且数学上严格等价（浮点误差除外）。

``` python
import torch
from torch.nn.utils.fusion import fuse_conv_bn_eval

conv, bn = m.conv.eval(), m.bn.eval()
fused = fuse_conv_bn_eval(conv, bn)    # 返回带 bias 的新 Conv2d

# 手写等价实现
a = bn.weight / torch.sqrt(bn.running_var + bn.eps)
W = conv.weight * a.view(-1, 1, 1, 1)
b = a * ((conv.bias if conv.bias is not None else 0) - bn.running_mean) + bn.bias
```

同理适用于 [Linear](0612_ML_Op_Linear)（BatchNorm1d
跟在全连接后）、ConvTranspose（注意输出通道维度在权重的第 1 维）。BN
在 Conv 之前（pre-activation 结构，BN-ReLU-Conv）时，由于中间可能有非线性或
padding，不能严格折叠，padding 处的值会与不折叠的结果不同。

## 各框架与推理引擎实现

  - **cuDNN**：`cudnnBatchNormalizationForwardTraining/Inference` 及 Ex
    版本，支持 per-activation 与 spatial 两种模式，并可在 Ex 版本中与 add/activation
    融合（如 BN+Add+ReLU，具体支持以 cuDNN 版本文档为准）；NHWC 布局配合 Tensor Core 性能更好。
  - **PyTorch**：CUDA 上调用 cuDNN 或自带 native kernel；CPU 上有 native 实现并可走
    oneDNN；`torch.fx` 的 `fuse_fx` / `torch.ao.quantization.fuse_modules`
    可在 eval 模式下做 Conv-BN(-ReLU) 融合。
  - **oneDNN**：BN 为 `batch_normalization` primitive，支持
    `use_global_stats`（推理）、`fuse_norm_relu`、`fuse_norm_add_relu` 标志；在
    graph API 中 BN 可与前面的 Conv 融合（推理时折叠为 Conv + bias）。
  - **OpenVINO**：IR 中有 `BatchNormInference` op，常规转换流程中 Model
    Optimizer/`ov.convert_model` 与 CPU/GPU 插件的 transformation pass 会把
    `Convolution -> BatchNormInference` 融合进 Convolution 的权重与 bias（具体
    pass 名称以所用版本源码为准），之后再融合激活，最终看不到单独的 BN 节点。
  - **TensorRT / ONNX Runtime**：同样在 build/graph optimization 阶段做 Conv-BN
    融合（ORT 有 `ConvBNFusion` 一类 graph optimizer）。

训练模式下的 BN 不能折叠，且在 kernel 层面通常是两遍：先归约出 $\\mu,\\sigma^2$，再逐元素归一化，因此是
memory-bound OP；融合 BN+ReLU(+Add) 可显著减少访存。

## INT8 量化与 BN 折叠

  - **PTQ**：先折叠 BN 再校准/量化。折叠后 $W'=aW$，各输出通道的权重幅值被 $a\_c$
    重新缩放，**通道间权重范围可能相差很大**（$a\_c$
    范围跨度大时），per-tensor 量化会使小范围通道精度严重下降。建议使用 per-channel
    权重量化。
  - **QAT**：训练中模拟折叠（"fake-fold"）：前向用 batch 统计量算出的 $a$ 去缩放权重再做 fake
    quant，使训练行为与折叠部署一致；常见做法是训练前期用 BN 的 batch 统计量，后期冻结 BN 统计量（freeze BN
    stats）以稳定量化范围。PyTorch 中有 `torch.ao.nn.intrinsic.qat` 下的
    `ConvBn2d`、`ConvBnReLU2d` 等模块。
  - 方差很小的通道使 $a\_c$ 很大，可能放大量化误差或溢出；部分工具使用 clip 或 cross-layer
    equalization（CLE）等方法缓解。
  - 折叠后，激活值的量化 scale 应在折叠后的 Conv 输出上校准，而不是 BN 原输出。

## 常见坑

  - **eval 模式**：推理忘记 `model.eval()`，BN 使用 batch 统计量并继续更新 running
    stats，结果依赖 batch 且被污染。

  - **冻结 BN**：微调（尤其是检测/分割小 batch）时只设置 `requires_grad=False` 并不能冻结 BN，因为
    running stats 在 `train()` 模式下仍会更新。正确做法是对 BN 模块调用 `.eval()`，并在每次
    `model.train()` 之后重新设置：
    
    ``` python
    def freeze_bn(m):
        for mod in m.modules():
            if isinstance(mod, nn.modules.batchnorm._BatchNorm):
                mod.eval()
                for p in mod.parameters():
                    p.requires_grad_(False)
    ```

  - **epsilon**：不同框架默认值不同（PyTorch 1e-5，Keras 1e-3 等），迁移权重时务必对齐；FP16 下
    $\\epsilon$ 过小（如 1e-8）会下溢为 0，导致除零。

  - **momentum 方向**：见上表，PyTorch 与 TF 相反。

  - **统计量不一致**：训练集与测试集分布不同（domain shift）时，running stats 失配；可对新域做 BN
    统计量重估（AdaBN）。

  - **训练中途 batch 变化**：最后一个不满的 batch 或 batch=1 会导致统计量噪声，推荐
    `drop_last=True`。

  - **与 Dropout 共用**：Dropout 在训练/推理时方差不同，后接 BN 会出现 variance shift，通常把
    Dropout 放在 BN 之后或不同时使用（见 [Dropout](0258_ML_Op_Dropout)）。

  - **bias 冗余**：Conv 后接 BN 时 `bias=False`。

  - **多次 forward 同一 BN**（如共享层）会多次更新 running stats。

  - **混合精度**：running stats 应保持 FP32；`torch.autocast` 下 BN 默认以 FP32 统计。

  - **导出 ONNX 时**：若模型处于 train 模式导出，会生成训练形式的 BN，部分引擎不支持。

## 与其他 OP 的关系

  - 紧随 [Convolution](0009_ML_Op_Convolution) /
    [Linear](0612_ML_Op_Linear)，推理时与之融合；再往后常接 [ReLU
    系](0616_ML_Op_AF_ReLU) 或其他 [激活函数](0279_ML_Op_AF)，常见融合模式为
    Conv+BN+ReLU。
  - 与 [LayerNorm](0615_ML_Op_Norm_LayerNorm) 的区别：BN 沿 batch 轴统计，LN
    沿特征轴统计；BN 有 train/eval 差异，LN 无。Transformer 中 BN
    效果较差，因为序列长度变化与 padding 使 batch 统计量不稳定。
  - 与 [Pooling](0268_ML_Op_Pooling) 搭配出现在经典 CNN 中，二者都不改变通道数，但 BN
    不改变空间尺寸。
  - 与 [Regularization](0252_ML_Op_Regularization) 的关系：BN 带来隐式正则，使用 BN
    时可减小 weight decay 或 Dropout 的强度，但 weight decay 仍影响有效学习率（BN
    使权重尺度不变）。
  - 输入数据层面的归一化见 [数据归一化](0251_ML_PreP_DataNorm)。

## Reference

  - Ioffe & Szegedy, *Batch Normalization: Accelerating Deep Network
    Training by Reducing Internal Covariate Shift*:
    <https://arxiv.org/abs/1502.03167>
  - Santurkar et al., *How Does Batch Normalization Help Optimization?*:
    <https://arxiv.org/abs/1805.11604>
  - Ioffe, *Batch Renormalization*: <https://arxiv.org/abs/1702.03275>
  - Wu & He, *Group Normalization*: <https://arxiv.org/abs/1803.08494>
  - Li et al., *Revisiting Batch Normalization For Practical Domain
    Adaptation* (AdaBN): <https://arxiv.org/abs/1603.04779>
  - Jacob et al., *Quantization and Training of Neural Networks for
    Efficient Integer-Arithmetic-Only Inference*:
    <https://arxiv.org/abs/1712.05877>
  - PyTorch `BatchNorm2d`:
    <https://pytorch.org/docs/stable/generated/torch.nn.BatchNorm2d.html>
  - PyTorch `SyncBatchNorm`:
    <https://pytorch.org/docs/stable/generated/torch.nn.SyncBatchNorm.html>
  - ONNX `BatchNormalization`:
    <https://onnx.ai/onnx/operators/onnx__BatchNormalization.html>
