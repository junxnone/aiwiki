---
Title | Tools Pytorch mGPUs
-- | --
Created @ | `2020-08-20T02:04:02Z`
Updated @| `2026-10-21T08:03:22Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/338)

---
# 多 GPUs 训练

> **现状先说结论**：`nn.DataParallel`（DP）从 PyTorch 1.11 起就被列入弃用计划（维护模式），官方现在明确推荐 **`DistributedDataParallel`（DDP）** 作为多卡训练的标准方案；如果模型大到单卡放不下，进一步推荐 **FSDP2**（Fully Sharded Data Parallel 的重写版本，最初的 FSDP 实现已在 PyTorch 2.11 起被标记弃用）。下文保留 DataParallel 用法作为历史参考，重点展开 DDP/FSDP2。

## 为什么不推荐 DataParallel

- DataParallel 是单进程多线程模型：主 GPU 负责切分 batch、收集梯度、更新参数，其他 GPU 只是"打工"，受 Python GIL 限制，并行效率随卡数增加明显下降；
- 每个 iteration 都要把最新参数从主卡广播到其他卡，通信开销大；
- DDP 是多进程模型，每个 GPU 对应一个独立进程，各自维护完整的模型副本，只在反向传播时做梯度同步（All-Reduce），没有 GIL 瓶颈，扩展性明显更好，这也是官方从 1.11 起就建议迁移的原因。

## DistributedDataParallel（DDP）：当前标准做法

```python
import os
import torch
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP

def main():
    dist.init_process_group(backend="nccl")
    local_rank = int(os.environ["LOCAL_RANK"])
    torch.cuda.set_device(local_rank)

    model = Model().to(local_rank)
    model = DDP(model, device_ids=[local_rank])

    sampler = torch.utils.data.distributed.DistributedSampler(dataset)
    loader = torch.utils.data.DataLoader(dataset, sampler=sampler, batch_size=32)

    for epoch in range(num_epochs):
        sampler.set_epoch(epoch)   # 保证每个 epoch 的 shuffle 在多进程间不同
        for images, target in loader:
            images, target = images.to(local_rank), target.to(local_rank)
            outputs = model(images)
            loss = criterion(outputs, target)
            loss.backward()        # 梯度在这一步自动 All-Reduce 同步
            optimizer.step()
            optimizer.zero_grad()
```

用 `torchrun` 启动（替代老版本的 `torch.distributed.launch`）：
```bash
torchrun --nproc_per_node=4 train.py
```

底层的 Ring All-Reduce 同步算法、梯度分桶（Bucketing）、计算通信重叠这几个决定扩展性的关键机制，见 [DDP 底层机制](0597_Tools_Pytorch_mGPUs_DDP)。

## 模型太大单卡放不下：FSDP2

DDP 要求每张卡都能完整放下一份模型副本+梯度+优化器状态——当模型规模大到单卡装不下时（大模型训练常见场景），需要用 **FSDP（Fully Sharded Data Parallel）** 把参数/梯度/优化器状态分片到各卡上，需要时再临时聚合，用显存换通信。PyTorch 2.11 起官方把最初的 FSDP 实现标记为弃用，统一推荐重写后的 **FSDP2**（`torch.distributed.fsdp.fully_shard`），具体的分片方式和通信模式（All-Gather/Reduce-Scatter）见 [FSDP2](0598_Tools_Pytorch_mGPUs_FSDP)。官方给出的扩展路径是：单卡放得下模型用 DDP；放不下用 FSDP2；FSDP2 还不够时再考虑张量并行（Tensor Parallel）/流水线并行（Pipeline Parallel），详见 [张量并行/流水线并行](0599_Tools_Pytorch_mGPUs_Parallelism)。

## 历史参考：DataParallel 用法（不推荐用于新项目）

Function | Description
-- | --
os.environ['CUDA_VISIBLE_DEVICES'] = '0,3' | Setup gpus
`model = nn.DataParallel(model)` | Create Model and DataParallel
`torch.save(model.module.state_dict(), save_name)` | 多 gpu 模型保存

```python
model = Model(input_size, output_size)
if torch.cuda.device_count() > 1:
  print("Let's use", torch.cuda.device_count(), "GPUs!")
  model = nn.DataParallel(model)

model.to(device)
```

### Tips
- batchsize 有可能影响实际使用的gpu数量
> `batchsize=4` 使用 `gpus = 1,2,3` 导致 只有 `1,2` gpu works
> `batchsize=6` 即可 `1,2,3` gpu works

- tensorboard add_graph()
```
xxxx.add_graph(model.module, images.cuda())
```
- 如果保存时，未使用 `model.module.state_dict()`，而是用 `model.state_dict()`
```
 from collections import OrderedDict
    new_state_dict = OrderedDict()
    for k, v in state_dict.items():
        name = k[7:] # remove `module.`
        new_state_dict[name] = v
```

## Reference
- [DistributedDataParallel — PyTorch 官方文档](https://docs.pytorch.org/docs/stable/generated/torch.nn.parallel.DistributedDataParallel.html)
- [Getting Started with Fully Sharded Data Parallel (FSDP2) — 官方教程](https://docs.pytorch.org/tutorials/intermediate/FSDP_tutorial.html)
- [PyTorch Distributed Overview — 官方教程](https://docs.pytorch.org/tutorials/beginner/dist_overview.html)
- [Optional: Data Parallelism（DataParallel 官方教程，历史参考）](https://pytorch.org/tutorials/beginner/blitz/data_parallel_tutorial.html)
- [第25章 Pytorch 如何高效使用GPU](https://www.cnblogs.com/jfdwd/p/11195988.html)
- [Tools Pytorch Speed](0169_Tools_Pytorch_Speed)
- [DDP 底层机制](0597_Tools_Pytorch_mGPUs_DDP)
- [FSDP2](0598_Tools_Pytorch_mGPUs_FSDP)
- [张量并行/流水线并行](0599_Tools_Pytorch_mGPUs_Parallelism)

