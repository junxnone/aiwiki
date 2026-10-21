---
Title | Tools Pytorch Pipeline
-- | --
Created @ | `2020-08-19T03:16:38Z`
Updated @| `2026-10-21T08:03:17Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/173)

---
# Pytorch Pipeline

Mode | Function | Description
-- | -- | -- 
**Training** | 
... | outputs = model(images) | 输入图像和标签，通过infer计算得到预测值
... | loss = criterion(outputs, target) | 计算损失函数
...  | optimizer.zero_grad() | 清空过往梯度
...  | loss.backward() | 反向传播，计算当前梯度
...  | optimizer.step() | 根据梯度更新网络参数
...  | scheduler.step() | Learning Rate Scheduler
**Validation** | 
... | `with torch.no_grad()` | Validation Mode
... | outputs = model(images) | 输入测试图像和标签，通过infer计算得到预测值
... | loss = criterion(outputs, target) | 计算损失函数

## 混合精度版本的训练循环

结合 [加速](0169_Tools_Pytorch_Speed) 一文提到的 AMP，标准训练循环会多出 `autocast` 和 `GradScaler` 两处：

```python
from torch.amp import autocast, GradScaler

scaler = GradScaler("cuda")
for images, target in train_loader:
    optimizer.zero_grad()
    with autocast(device_type="cuda", dtype=torch.float16):
        outputs = model(images)
        loss = criterion(outputs, target)
    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
```

## 梯度累积（Gradient Accumulation）

当显存不够支撑想要的 batch size 时，用多个小 batch 累积梯度再统一更新一次：

```python
accumulation_steps = 4
optimizer.zero_grad()
for i, (images, target) in enumerate(dataloader):
    outputs = model(images)
    loss = criterion(outputs, target) / accumulation_steps
    loss.backward()
    if (i + 1) % accumulation_steps == 0:
        optimizer.step()
        optimizer.zero_grad()
```

这个技巧之所以成立，是因为 PyTorch 默认梯度是**累加（accumulate）**而不是覆盖——这也正是为什么反向传播前要手动 `zero_grad()` 清零：不清零的话，多个 batch 的梯度会一直叠加在一起。

## 一个小优化：`zero_grad(set_to_none=True)`

`optimizer.zero_grad(set_to_none=True)` 把梯度设为 `None` 而不是显式写 0，省去一次显存写入，通常比默认行为略快，是目前官方推荐的写法。

## Reference
- [PyTorch中在反向传播前为什么要手动将梯度清零？](https://www.zhihu.com/question/303070254/answer/573037166)
- [Gradient accumulation](https://github.com/pytorch/pytorch/blob/d927aee312fa95b7803cb976fee9525923ca9ad6/docs/source/notes/amp_examples.rst#gradient-accumulation)
- [加速](0169_Tools_Pytorch_Speed)
- [Tools Pytorch Optimizer](0174_Tools_Pytorch_Optimizer)

