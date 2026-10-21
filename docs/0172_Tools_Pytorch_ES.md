---
Title | Tools Pytorch ES
-- | --
Created @ | `2020-06-12T07:57:19Z`
Updated @| `2026-10-21T08:03:15Z`
Labels | `index`
Edit @| [here](https://github.com/junxnone/aiwiki/issues/172)

---
# Early Stopping

PyTorch 核心库本身至今仍然没有内置 Early Stopping——这是设计上的取舍，PyTorch 核心保持底层灵活，训练循环控制逻辑交给上层框架或用户自己实现，需要通过高层库或手写实现：

- **[Lightning](https://github.com/Lightning-AI/pytorch-lightning)**（原 PyTorchLightning）内置 `EarlyStopping` callback，是目前最常用的方式：
  ```python
  from lightning.pytorch.callbacks import EarlyStopping
  early_stop = EarlyStopping(monitor="val_loss", patience=5, mode="min")
  trainer = Trainer(callbacks=[early_stop])
  ```
- [pytorch/ignite](https://github.com/pytorch/ignite/) 也提供了对应的 `EarlyStopping` handler；
- 手写实现也很简单：监控验证集指标，连续 N 个 epoch 没有改善就停止训练，参考 [early-stopping-pytorch](https://github.com/Bjarten/early-stopping-pytorch)。

## Reference
- [early-stopping-pytorch](https://github.com/Bjarten/early-stopping-pytorch)
- [pytorch/ignite - High-level library](https://github.com/pytorch/ignite/blob/master/ignite/handlers/early_stopping.py)
  - [EfficientNet_Cifar100_finetuning.ipynb](https://github.com/pytorch/ignite/blob/master/examples/notebooks/EfficientNet_Cifar100_finetuning.ipynb)
- [Lightning EarlyStopping 官方文档](https://lightning.ai/docs/pytorch/stable/common/early_stopping.html)
- [Tools Pytorch Pipeline](0173_Tools_Pytorch_Pipeline)

