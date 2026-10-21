-----

| Title     | Tools Pytorch mGPUs FSDP                              |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-21T07:56:29Z`                                |
| Updated @ | `2026-10-21T07:56:29Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/598) |

-----

# FSDP2 - Fully Sharded Data Parallel

Tools Pytorch mGPUs 一文提到，当模型规模大到单卡放不下完整副本时，需要用 FSDP2 替代 DDP。本文展开 FSDP2
具体是怎么分片、怎么通信的。

## 和 DDP 的根本区别：要不要保留完整模型副本

DDP
要求每个进程都持有**完整的**模型参数、梯度、优化器状态副本，只在反向传播时同步梯度——这意味着单卡显存至少要装得下"一份完整模型+梯度+优化器状态"，大模型训练很容易卡在这一步。FSDP（Fully
Sharded Data
Parallel）反过来：平时每张卡上只保留参数的一个**分片（Shard）**，不持有完整模型，需要用到完整参数时才临时从各卡收集拼出来，用完立刻释放——用通信换显存。

## 通信模式：All-Gather + Reduce-Scatter

FSDP2（`torch.distributed.fsdp.fully_shard`）的典型生命周期：

1.  **平时**：参数以分片形式存在，每张卡只保存自己负责的那一部分；
2.  **前向传播前**：对需要用到的参数做
    **All-Gather**，把各卡上的分片收集拼接成完整参数，计算完当前这部分前向后立刻释放，不长期占用显存；
3.  **反向传播中**：同样先 All-Gather 出完整参数用于计算梯度，算出的是**完整（未分片）的本地梯度**，随后做
    **Reduce-Scatter**——这一步同时完成"跨卡梯度求和平均"和"重新按分片拆分"两件事，结果直接就是分片形式的梯度，不需要像
    DDP 那样额外保留一份完整梯度；
4.  **优化器更新**：用分片梯度更新分片参数，优化器状态天然也是分片存储的。

## FSDP2 相比 FSDP1 的改进：per-parameter 分片

最初版本的 FSDP（已在 PyTorch 2.11 起弃用）把一个模块内的多个参数**展平拼接**成一个大的 `FlatParameter`
再整体分片，工程实现复杂、也不方便精细控制。FSDP2
重写为\*\*逐参数（per-parameter）\*\*分片，每个参数独立表示成一个按
dim-0 切分的 `DTensor`（分布式张量）——不再需要展平拼接，天然支持更简单的 checkpoint 保存（分片状态字典可以直接从
DTensor 表示导出，不需要额外通信）、更简单的 meta-device
初始化流程，和模型并行技术（如下面提到的张量并行）的组合也更自然。代价是
per-parameter 设计会引入一些额外的拷贝开销（all-gather 后拆分、reduce-scatter
前打包），在部分配置下会占用一定比例的迭代时间，是 FSDP2 当前仍在持续优化的方向。

## 什么时候用 FSDP2

官方给出的扩展路径很直接：模型单卡放得下，用 DDP；放不下，用
FSDP2；FSDP2（纯数据并行+参数分片）还不够用（通信开销成为瓶颈，或者模型大到分片后单次
All-Gather 出来的完整参数依然装不下）时，再考虑张量并行/流水线并行这类模型并行技术，具体对比见 Tools Pytorch
mGPUs Parallelism。

## Reference

  - [Getting Started with Fully Sharded Data Parallel (FSDP2) —
    官方教程](https://docs.pytorch.org/tutorials/intermediate/FSDP_tutorial.html)
  - [Rethinking PyTorch Fully Sharded Data Parallel (FSDP) from First
    Principles（PyTorch
    团队设计文档）](https://dev-discuss.pytorch.org/t/rethinking-pytorch-fully-sharded-data-parallel-fsdp-from-first-principles/1019)
  - [Tools Pytorch mGPUs](0338_Tools_Pytorch_mGPUs)
