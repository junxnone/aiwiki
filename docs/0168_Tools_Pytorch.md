---
Title | Tools Pytorch
-- | --
Created @ | `2019-01-25T23:32:24Z`
Updated @| `2026-10-21T08:03:42Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/168)

---
# Pytorch

PyTorch 是目前主流的深度学习框架之一，2017 年由 Facebook（现 Meta）发布，早期经历了和 Caffe2 的合并，2022 年起治理模式转为中立的 **PyTorch Foundation**（隶属 Linux Foundation），2023 年发布的 **PyTorch 2.0** 引入 `torch.compile` 编译加速，是近几年最重要的一次架构升级；2026 年前后 TorchScript/FSDP1 等老组件陆续被标记弃用，新项目的技术选型也随之发生了变化，详见下文各分支文章。

## 本仓库相关文章

- [加速 Training/Inference](0169_Tools_Pytorch_Speed)
  - [AMP 混合精度](0596_Tools_Pytorch_Speed_AMP)
  - [channels_last 内存格式](0602_Tools_Pytorch_Speed_ChannelsLast)
  - [torch.compile](0518_Tools_Pytorch_Speed_compile)
- [常用 Tips](0170_Tools_Pytorch_Tips)
- [可视化](0171_Tools_Pytorch_VIS)
- [Early Stopping](0172_Tools_Pytorch_ES)
- [训练 Pipeline](0173_Tools_Pytorch_Pipeline)
- [Optimizer / LR Scheduler](0174_Tools_Pytorch_Optimizer)
- [多 GPU 训练](0338_Tools_Pytorch_mGPUs)（DDP/FSDP2）
  - [DDP 底层机制](0597_Tools_Pytorch_mGPUs_DDP)
  - [FSDP2](0598_Tools_Pytorch_mGPUs_FSDP)
  - [张量并行/流水线并行](0599_Tools_Pytorch_mGPUs_Parallelism)
- [数据读取 Data](0359_Tools_Pytorch_Data)
- [TorchScript](0490_Tools_Pytorch_TorchScript)（⚠️ 已于 PyTorch 2.10 被标记弃用，新项目请优先看 `torch.export`，详见该文）
  - [torch.export](0600_Tools_Pytorch_Export)
  - [ExecuTorch](0601_Tools_Pytorch_ExecuTorch)

## 生态

- [Lightning](https://github.com/Lightning-AI/pytorch-lightning)（原 PyTorchLightning，已更名，不再局限于 PyTorch 单一框架）
- [TorchMetrics](https://torchmetrics.readthedocs.io/en/latest/)
- [Pytorch ignite](https://github.com/pytorch/ignite/)
- [Examples Analysis](https://github.com/junxnone/examples-1/issues/1)

## History

| 时间 | 事件 |
|---|---|
| ~2002 | 前身 Torch（Lua）诞生 |
| 2017 | PyTorch（Python 版）由 Facebook 发布 |
| 2018 | 与 Caffe2 合并，统一到同一套代码库 |
| 2022-09 | 治理权移交 **Linux Foundation**，成立中立的 **PyTorch Foundation**（创始成员含 AMD/AWS/Google/Meta/Microsoft/NVIDIA） |
| 2023-03 | **PyTorch 2.0** 正式发布，引入 `torch.compile`/TorchDynamo/TorchInductor 编译加速栈，163 个开源模型基准测试训练速度提升 38%~76%，详见 [torch.compile](0518_Tools_Pytorch_Speed_compile) |
| 2025-08 | TorchServe 被标记为有限维护并归档，不再是官方推荐的默认部署服务方案 |
| 2026（2.10/2.11） | TorchScript 被正式标记为**弃用**（推荐改用 `torch.export`，见 [TorchScript](0490_Tools_Pytorch_TorchScript)）；最初版本的 FSDP 被标记弃用（推荐改用 FSDP2，见 [多 GPU 训练](0338_Tools_Pytorch_mGPUs)） |

## Reference 
- **PyTorch 官方** [[Docs](https://pytorch.org/)] [[Github](https://github.com/pytorch/pytorch)]
- [Awesome-PyTorch-Chinese](https://github.com/INTERMT/Awesome-PyTorch-Chinese)
- [Awesome-Pytorch-list](https://github.com/bharathgs/Awesome-pytorch-list)
- [pytorch-handbook](https://github.com/zergtant/pytorch-handbook)
- [PyTorch学习资源汇总](https://blog.csdn.net/fendouaini/article/details/89944199)
- [the-incredible-pytorch](https://github.com/ritchieng/the-incredible-pytorch)
- [Neural Network Programming - Deep Learning with PyTorch - deeplizard.com](https://deeplizard.com/learn/playlist/PLZbbT5o_s2xrfNyHZsM6ufI0iZENK9xgG)
- **Docs CN**
  - [Apachecn](https://pytorch.apachecn.org/)
  - [pytorch1.0-cn - fendouai](https://github.com/fendouai/pytorch1.0-cn)
- **Videos**
  - [PyTorch深度学习(系列)教程 - bilibili Videos](https://www.bilibili.com/video/av31914351/)
  - [深度学习与PyTorch入门实战 - bilibili Videos](https://www.bilibili.com/video/av49008640/)
- [深入浅出PyTorc](https://datawhalechina.github.io/thorough-pytorch/index.html)
- [PyTorch Foundation: The First Six Months（Linux Foundation 官方博客）](https://www.linuxfoundation.org/blog/pytorch-foundation-the-first-six-months)
- [PyTorch 2.x 官方介绍](https://pytorch.org/get-started/pytorch-2-x/)

