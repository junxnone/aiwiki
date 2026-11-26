-----

| Title     | Tools Pytorch ES                                      |
| --------- | ----------------------------------------------------- |
| Created @ | `2020-06-12T07:57:19Z`                                |
| Updated @ | `2026-11-26T10:09:38Z`                                |
| Labels    | `index`                                               |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/172) |

-----

# Early Stopping

早停（Early Stopping）：监控验证集上的指标，当它在连续若干个 epoch 内不再改善时提前结束训练，防止过拟合并节省时间。

``` mermaid
flowchart LR
    A[每个 epoch 结束 计算验证集指标] --> B{比历史最好值更好?}
    B -- 是 --> C[保存最佳模型 计数器清零]
    B -- 否 --> D[计数器加 1]
    D --> E{计数器大于等于 patience?}
    E -- 是 --> F[停止训练 恢复最佳模型]
    E -- 否 --> A
    C --> A
```

图中：每个 epoch 结束后比较验证指标，有改善就保存模型并重置计数器，没有就累加；累计到 `patience` 次就停止，并恢复到最佳模型。

停止条件：

$$ \\text{stop}\\iff t-t^{*}\\ge P,\\qquad t^{*}=\\arg\\min\_{s\\le t}\\
\\mathcal{L}\_{val}(s) $$

其中：

  - $t$：当前 epoch；$t^{\*}$：验证损失最低的那个 epoch
  - $\\mathcal{L}\_{val}(s)$：第 $s$ 个 epoch 的验证损失（指标越高越好时改为取
    $\\arg\\max$）
  - $P$：`patience`，允许连续多少个 epoch 没有改善；$t-t^{\*}\\ge P$ 时停止
  - 通常还设一个最小改善量 `min_delta`，改善幅度小于它不算改善

PyTorch 核心库本身至今仍然没有内置 Early Stopping——这是设计上的取舍，PyTorch
核心保持底层灵活，训练循环控制逻辑交给上层框架或用户自己实现，需要通过高层库或手写实现：

  - **[Lightning](https://github.com/Lightning-AI/pytorch-lightning)**（原
    PyTorchLightning）内置 `EarlyStopping` callback，是目前最常用的方式：
    ``` python
    from lightning.pytorch.callbacks import EarlyStopping
    early_stop = EarlyStopping(monitor="val_loss", patience=5, mode="min")
    trainer = Trainer(callbacks=[early_stop])
    ```
  - [pytorch/ignite](https://github.com/pytorch/ignite/) 也提供了对应的
    `EarlyStopping` handler；
  - 手写实现也很简单：监控验证集指标，连续 N 个 epoch 没有改善就停止训练，参考
    [early-stopping-pytorch](https://github.com/Bjarten/early-stopping-pytorch)。

手写示例：

``` python
best, bad = float("inf"), 0
patience = 5
for epoch in range(max_epochs):
    train_one_epoch()
    val = validate()
    if val < best - 1e-4:            # 有改善（min_delta = 1e-4）
        best, bad = val, 0
        torch.save(model.state_dict(), "best.pt")
    else:
        bad += 1
        if bad >= patience:
            break                    # 提前停止
model.load_state_dict(torch.load("best.pt"))
```

其中：`best` 记录最好的验证损失；`bad` 是连续没有改善的 epoch 数；`patience`
是容忍次数；结束后加载保存的最佳权重。

## 超参数

| 参数          | 含义                  | 影响                   |
| ----------- | ------------------- | -------------------- |
| `monitor`   | 监控的指标（如 `val_loss`） | 通常用验证集，不要用训练集        |
| `patience`  | 容忍的 epoch 数         | 太小会过早停止，太大起不到节省作用    |
| `min_delta` | 最小改善量               | 过滤噪声造成的微小波动          |
| `mode`      | `min` 或 `max`       | 指标越小越好（损失）或越大越好（准确率） |

表中：对比结论：配合学习率衰减（见
[AnnealingLR](https://github.com/junxnone/aiwiki/issues/372)）使用时，`patience`
应设得更大，以免在学习率下降前就停止。超参数概念见
[Hyperparameter](https://github.com/junxnone/aiwiki/issues/368)。

## Reference

  - [early-stopping-pytorch](https://github.com/Bjarten/early-stopping-pytorch)
  - [pytorch/ignite - High-level
    library](https://github.com/pytorch/ignite/blob/master/ignite/handlers/early_stopping.py)
      - [EfficientNet\_Cifar100\_finetuning.ipynb](https://github.com/pytorch/ignite/blob/master/examples/notebooks/EfficientNet_Cifar100_finetuning.ipynb)
  - [Lightning EarlyStopping
    官方文档](https://lightning.ai/docs/pytorch/stable/common/early_stopping.html)
  - [Tools Pytorch Pipeline](0173_Tools_Pytorch_Pipeline)
