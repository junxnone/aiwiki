---
Title | MO Pruning Tools
-- | --
Created @ | `2026-11-26T14:35:37Z`
Updated @| `2026-11-26T14:36:05Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/815)

---
# 工具

主流框架和工具对剪枝的支持。系列总览见 [剪枝](https://github.com/junxnone/aiwiki/issues/808)。

## 工具一览

| 工具 | 支持的剪枝 | 特点 |
| --- | --- | --- |
| `torch.nn.utils.prune` | 非结构化（L1、随机）、结构化（`ln_structured`）、全局剪枝 | PyTorch 自带，通过掩码实现，不会真的缩小张量 |
| Torch-Pruning | 结构化剪枝，DepGraph 自动处理依赖 | 真正修改张量形状，得到更小的模型 |
| NNCF | 幅度稀疏、滤波器剪枝等 | OpenVINO 生态，见 [NNCF](https://github.com/junxnone/aiwiki/issues/451) |
| NVIDIA ASP / ModelOpt | 2:4 半结构化稀疏 | 配合 Sparse Tensor Core，见 [N:M 稀疏](https://github.com/junxnone/aiwiki/issues/813) |
| TensorFlow Model Optimization | `prune_low_magnitude` 渐进式幅度剪枝 | Keras 层封装 |
| SparseGPT / Wanda 官方仓库 | LLM 一次性剪枝 | 见 [LLM 剪枝](https://github.com/junxnone/aiwiki/issues/814) |

表中：

- **掩码实现**：剪枝只是把权重乘以掩码，张量尺寸不变，只节省存储而不一定加速；**真正删除**需要重新构造更小的层
- 对比结论：做研究和实验用 `torch.nn.utils.prune`；需要真实缩小模型用 Torch-Pruning；需要硬件加速用 2:4 工具

## torch.nn.utils.prune

```python
import torch.nn.utils.prune as prune

# 单层：按 L1 幅度剪掉 30% 的权重
prune.l1_unstructured(model.fc, name="weight", amount=0.3)

# 全局：所有层放在一起，整体剪掉 50%
params = [(m, "weight") for m in model.modules() if isinstance(m, torch.nn.Linear)]
prune.global_unstructured(params, pruning_method=prune.L1Unstructured, amount=0.5)

# 结构化：按 L2 范数剪掉输出维度上的 20%
prune.ln_structured(model.conv1, name="weight", amount=0.2, n=2, dim=0)

prune.remove(model.fc, "weight")      # 固化：把掩码乘进权重，去掉重参数化
```

其中：

- `amount`：剪掉的比例（0 到 1）或绝对个数；`name`：要剪的参数名
- `l1_unstructured`：按绝对值剪；`ln_structured(..., n=2, dim=0)`：按第 0 维（输出通道）整体的 $L_2$ 范数剪
- 剪枝后参数被拆成 `weight_orig` 和 `weight_mask`，前向时相乘；`prune.remove` 把结果固化成普通的 `weight`
- 上面都是掩码方式，张量形状不变

## 检查稀疏度

```python
import torch
w = model.fc.weight
sparsity = (w == 0).sum().item() / w.numel()
```

其中：`sparsity` 即稀疏度 $s$（见 [基础原理](https://github.com/junxnone/aiwiki/issues/809)），`w == 0` 统计为 0 的元素个数，`w.numel()` 是元素总数。

## 选择建议

| 目标 | 推荐 |
| --- | --- |
| 快速实验不同稀疏度对精度的影响 | `torch.nn.utils.prune` |
| 得到真正更小、能在任何硬件加速的 CNN / Transformer | Torch-Pruning（结构化） |
| NVIDIA GPU 上拿真实加速 | 2:4 稀疏 |
| 已有的 LLM 要快速剪枝 | Wanda、SparseGPT |
| OpenVINO 部署 | NNCF |

表中：各工具的 API 会随版本变化，使用前请查看对应版本的官方文档。

