---
Title | NNCF Training-time Optimization
-- | --
Created @ | `2026-10-19T08:28:44Z`
Updated @| `2026-10-19T08:28:44Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/562)

---
# NNCF Training-time Optimization

> 本文是 [NNCF](0451_Tools_OV_NNCF) 总览的深入篇，专门展开 Training-time Optimization（训练时压缩）——目前**仅 PyTorch 后端支持**，核心是 QAT（量化感知训练）和 `nncf.prune()`（剪枝）。

## 重要前提：旧版 API 已被移除

早期 NNCF 的训练时压缩是配置式的：写一个 `NNCFConfig`（JSON/字典），调用 `create_compressed_model()` 包装模型（内部基于 `NNCFNetwork`），再用专门的训练循环微调。这套旧架构、以及挂在它上面的一批算法——**NAS、Structural Pruning、AutoML、Knowledge Distillation、Mixed-Precision Quantization、Movement Sparsity**——在较新版本的 NNCF 里都已经被移除。如果你在网上搜到的教程或代码示例里出现 `NNCFConfig.from_dict()` + `create_compressed_model()`，那是旧版工作流，**现在不要再照抄**，当前版本的替代方案如下。

## QAT（Quantization Aware Training）：现在怎么做

当前的 QAT 流程大幅简化成了两步，和训练后量化共用同一个入口函数：

```python
import nncf

model = TorchModel()  # 预训练好的 torch.nn.Module

# 第一步：直接调用 nncf.quantize()，得到的仍是一个可训练的 PyTorch 模型
# （内部插入了伪量化节点，前向/反向传播都会模拟量化误差，但计算本身仍是浮点）
quantized_model = nncf.quantize(model, calibration_dataset)

# 第二步：用完全标准的训练循环微调，不需要任何 NNCF 专用的训练 API
optimizer = torch.optim.Adam(quantized_model.parameters(), lr=1e-5)  # 建议用较小学习率
for epoch in range(5):
    for data in train_loader:
        ...  # 和普通微调完全一样的训练循环
```

几个容易忽略的点：

- 微调阶段模型的计算仍然是**浮点**的——伪量化节点只是在前向传播里模拟"如果这里被量化成 INT8，误差会是什么样"，让梯度下降的方向把这部分误差也考虑进去；真正的 INT8 计算要等转换成 OpenVINO IR 之后才会发生，这也是为什么 QAT 精度通常比直接 PTQ 更好——模型在训练阶段就已经"看到"并适应了量化误差；
- 学习率要调小（经验值 `1e-5` 量级），因为模型已经收敛过一次，这里是在做误差补偿式的精调，不是从头训练；
- **LLM 场景的变体**：NNCF 还支持结合 **LoRA / NLS（Neural Low-rank Adapter Search）**做权重量化感知训练，相当于 Weight Compression（见 [NNCF](0451_Tools_OV_NNCF) 总览及其深入篇）里 INT4 压缩的"进阶版"——不满足于 AWQ/Scale Estimation/LoRA Correction 这类训练后精度恢复，而是直接引入训练开销换取更好的 INT4 精度，适合对精度要求最高、又不想掉到 INT8 体积的场景。

## 剪枝：`nncf.prune()`

剪枝的目标和量化不同——量化是降低每个数值的表示精度，剪枝是直接**减少参数数量**（把不重要的权重置零甚至物理移除）。当前统一通过 `nncf.prune()` 调用：

```python
import nncf

pruned_model = nncf.prune(
    model,
    mode=nncf.PruneMode.UNSTRUCTURED_MAGNITUDE_LOCAL,
    ratio=0.5,   # 剪掉 50% 的权重
)
```

支持的模式：

| 模式 | 说明 |
|---|---|
| `UNSTRUCTURED_MAGNITUDE_LOCAL` | 非结构化剪枝，按权重绝对值大小（magnitude）剪，重要性在**每个张量内部独立**计算 |
| `UNSTRUCTURED_MAGNITUDE_GLOBAL` | 同上，但重要性是在**全部参与剪枝的张量之间全局比较**，剪枝分配更均衡 |
| `STRUCTURED_MAGNITUDE_2_4` | 结构化剪枝，按固定的 2:4 稀疏模式剪（每 4 个权重里剪掉 2 个），部分 Intel/NVIDIA 硬件对这种规则化的稀疏模式有专门的计算加速支持，非结构化剪枝通常拿不到这个加速 |

剪枝之后同样建议做一轮微调来恢复精度——`nncf.prune()` 只是插入了二进制掩码（mask）并根据 `ratio` 计算初始掩码，真正把精度找回来还是要靠训练。

## QAT vs 剪枝 vs 训练后方法，怎么选

| 场景 | 推荐 |
|---|---|
| 训练后方法（PTQ/Weight Compression）精度已经不够，还能接受训练成本 | QAT：`nncf.quantize()` + 微调 |
| LLM 场景，INT4 Weight Compression 精度不够，且不想退回 INT8 体积 | LoRA/NLS 权重量化感知训练 |
| 想减少参数数量而不是精度（比如结合量化一起压），且目标硬件对结构化稀疏有加速支持 | `nncf.prune()` + `STRUCTURED_MAGNITUDE_2_4` |
| 没有专门稀疏计算支持的常规硬件 | 非结构化剪枝实际推理加速有限，优先考虑量化类方法 |
| 只能用训练后方法（没有训练数据/训练资源） | 回到 Post-training Quantization 或 Weight Compression（见 [NNCF](0451_Tools_OV_NNCF) 总览及其深入篇） |

## Reference
- [Quantization-aware Training (QAT) - OpenVINO 官方文档](https://docs.openvino.ai/2025/openvino-workflow/model-optimization-guide/compressing-models-during-training/quantization-aware-training.html)
- [NNCF GitHub](https://github.com/openvinotoolkit/nncf)
- [NNCF Releases（legacy API 移除记录）](https://github.com/openvinotoolkit/nncf/releases)
- [NNCF 总览](0451_Tools_OV_NNCF)

