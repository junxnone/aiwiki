-----

| Title     | Tools Pytorch Speed AMP                               |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-21T07:56:25Z`                                |
| Updated @ | `2026-10-21T07:56:25Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/596) |

-----

# AMP - Automatic Mixed Precision

自动混合精度（AMP）让模型训练时部分算子用低精度（float16/bfloat16）计算、部分算子保持
float32，在基本不损失精度的前提下减少显存占用、提升吞吐，是 Tools
Pytorch Speed 一文提到的核心加速手段之一。

## autocast：哪些算子走低精度，哪些强制 float32

`torch.autocast` 不是简单粗暴地把整个模型转成 float16，而是按算子类型分别处理：

  - **数值安全、计算密集的算子**（矩阵乘法 `mm`、卷积等）自动转成 float16/bfloat16
    执行——这类运算对精度不敏感，却是 Tensor Core
    发挥算力优势最明显的地方；
  - **数值敏感的归约类算子**（softmax、batch norm 的均值方差计算、损失函数如 `mse_loss`）强制保留在
    float32——这类运算对精度损失敏感，用低精度容易引入明显误差。

这个选择规则是 PyTorch 内置的，不需要用户手动管理，但有两条使用约束：`autocast` 只应该包裹前向传播（含 loss
计算），不要对模型/输入手动调用 `.half()`；反向传播不建议包在 `autocast`
里——反向算子会自动沿用对应前向算子当时选择的精度。

## GradScaler：为什么需要动态损失缩放

float16 的数值范围比 float32 窄得多——绝对值小于约 $6\\times10^{-5}$ 的数会直接下溢变成
0。深度网络里有大量梯度数值很小，如果直接用 float16
计算梯度，大量有效梯度会在下溢时直接丢失。`GradScaler`
用动态损失缩放解决这个问题：

1.  反向传播前，把 loss 乘以一个较大的缩放系数（默认初始值 65536），让对应的梯度也等比例放大，避免小梯度被下溢吃掉；
2.  优化器更新参数前，先把梯度按同样的系数缩小回原始大小，并检查是否出现 NaN/Inf；
3.  如果梯度正常，照常执行参数更新；如果出现
    NaN/Inf（说明缩放系数太大导致溢出），跳过这一步参数更新，并把缩放系数乘以一个退避系数（默认
    0.5）调小；
4.  如果连续多步都没有出现异常，缩放系数会按增长系数（默认 2.0）逐渐调大，尝试用更大的缩放争取更好的小梯度保留效果。

这套"溢出就退避、稳定就增长"的动态调整逻辑，不需要用户手动调参，是 `GradScaler` 名字里"自动"的由来。

## float16 vs bfloat16：要不要用 GradScaler

  - **bfloat16** 的数值范围和 float32 一致（只是尾数精度更低），不存在下溢问题，通常**不需要**
    `GradScaler`（即使传了也只是空操作）；
  - **float16** 数值范围窄，必须配合 `GradScaler` 使用；
  - 实践建议：Ampere 架构及更新的 GPU（RTX 30 系列、A100 及之后）优先用
    bfloat16，省去损失缩放这一层复杂度；更老的 Turing/Volta
    架构 GPU 不支持 bfloat16 加速，只能退回 float16 + `GradScaler`。

<!-- end list -->

``` python
amp_dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
scaler = torch.amp.GradScaler("cuda", enabled=(amp_dtype == torch.float16))

for inputs, target in data:
    optimizer.zero_grad()
    with torch.autocast(device_type="cuda", dtype=amp_dtype):
        output = model(inputs)
        loss = loss_fn(output, target)
    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
```

## Reference

  - [Automatic Mixed Precision package -
    torch.amp（官方文档）](https://docs.pytorch.org/docs/stable/amp.html)
  - [Automatic Mixed Precision —
    官方教程](https://docs.pytorch.org/tutorials/recipes/recipes/amp_recipe.html)
  - [What Every User Should Know About Mixed Precision Training in
    PyTorch（官方博客）](https://pytorch.org/blog/what-every-user-should-know-about-mixed-precision-training-in-pytorch/)
  - [Tools Pytorch Speed](0169_Tools_Pytorch_Speed)
