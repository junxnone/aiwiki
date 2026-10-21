---
Title | Tools Pytorch mGPUs Parallelism
-- | --
Created @ | `2026-10-21T07:56:31Z`
Updated @| `2026-10-21T07:59:54Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/599)

---
# 张量并行 / 流水线并行

当数据并行（DDP）+ 参数分片（FSDP2，见 [FSDP2](0598_Tools_Pytorch_mGPUs_FSDP)）仍然无法满足超大模型的训练需求时（通信开销成为瓶颈，或模型单层本身就大到一张卡放不下），需要引入**模型并行**——把模型本身（而不是数据）切开分布到不同设备上。最常见的两种模型并行策略是张量并行和流水线并行，两者经常和数据并行/FSDP2 组合使用。

## 张量并行（Tensor Parallel）

张量并行把单层内部的矩阵运算**按维度切开**，分布到多张卡上并行计算，Megatron-LM 针对 Transformer 结构提出的做法是业界最常见的实现方式：

- **列并行（Column-wise）**：把权重矩阵按列切分到多张卡，每张卡各自算出完整输出的一部分（按列切分的这部分），输出在各卡上是**分片**的，不需要额外通信；
- **行并行（Row-wise）**：把权重矩阵按行切分，配合上一步"按列切分"的分片输入，各卡直接用本地分片做计算，最后把各卡的结果做一次 **All-Reduce** 求和，得到完整输出（在各卡上是复制的）。

Transformer 的 MLP block 典型组合是"先列并行、再行并行"——第一层列并行的输出正好是分片的，可以直接喂给第二层的行并行输入，中间不需要通信，只在第二层算完后做一次 All-Reduce，一个 MLP block 只需要一次通信。PyTorch 原生提供 `torch.distributed.tensor.parallel` 模块，可以直接用 `ColwiseParallel`/`RowwiseParallel` 给模块打标：

```python
from torch.distributed.tensor.parallel import parallelize_module, ColwiseParallel, RowwiseParallel

model = parallelize_module(model, device_mesh, {"w1": ColwiseParallel(), "w2": RowwiseParallel()})
```

## 流水线并行（Pipeline Parallel）

流水线并行把模型**按层切分**成多个连续的阶段（Stage），每个阶段放到一张卡上，前向/反向过程中，各阶段依次传递激活值/梯度——类似工厂流水线分工。

- **核心性能问题：流水线气泡（Bubble）**：如果一次只处理一个完整 batch，某个阶段算完自己那部分后，必须等前一个阶段把下一批数据传过来才能继续工作，其余阶段会出现空闲等待，这段空闲时间就是"气泡"；
- **用 micro-batch 缓解气泡**：把一个大 batch 切成多个更小的 micro-batch，依次送进流水线，让不同阶段在同一时刻处理不同的 micro-batch，尽量让所有阶段都保持忙碌——GPipe 式调度的气泡比例约为 $(p-1)/m$（$p$ 为流水线深度，$m$ 为 micro-batch 数量），micro-batch 切得越多，气泡占比越小，但也意味着要保留更多中间激活值，显存开销上升；
- 后续调度算法（1F1B、Interleaved 1F1B、Zero-Bubble 等）通过调整各阶段执行前向/反向的顺序，进一步压缩气泡占比。PyTorch 原生提供 `torch.distributed.pipelining` 模块，支持这几种调度算法。

## 组合使用：和 DDP/FSDP2 不是互斥关系

实践中（如 PyTorch 官方大模型训练参考实现 TorchTitan）这几种并行策略是分层组合使用的：张量并行通信开销大，通常放在**同一台机器内**的多张卡之间（节点内带宽高）；流水线并行跨越**多台机器**；数据并行（DDP/FSDP2）包在最外层，复制/分片这整套"张量并行+流水线并行"的模型组合体——是当前超大模型训练"多维并行"的标准做法。

## Reference
- [Tensor Parallelism - torch.distributed.tensor.parallel（官方文档）](https://docs.pytorch.org/docs/stable/distributed.tensor.parallel.html)
- Shoeybi, M. et al. Megatron-LM: Training Multi-Billion Parameter Language Models Using Model Parallelism
- Huang, Y. et al. GPipe: Efficient Training of Giant Neural Networks using Pipeline Parallelism
- [torchtitan（PyTorch 官方大模型训练参考实现）](https://github.com/pytorch/torchtitan)
- [Tools Pytorch mGPUs](0338_Tools_Pytorch_mGPUs)
- [Tools Pytorch mGPUs FSDP](0598_Tools_Pytorch_mGPUs_FSDP)


