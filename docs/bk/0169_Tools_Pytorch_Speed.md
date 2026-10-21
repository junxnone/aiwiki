-----

| Title     | Tools Pytorch Speed                                   |
| --------- | ----------------------------------------------------- |
| Created @ | `2021-04-28T06:46:11Z`                                |
| Updated @ | `2026-10-21T08:03:10Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/169) |

-----

# 加速 Training/Inference

PyTorch
训练/推理加速可以从几个不同层面入手：编译优化、混合精度、数据读取、内存格式、分布式扩展。本文梳理各层面的常见手段，具体编译加速见
[torch.compile](0518_Tools_Pytorch_Speed_compile)，数据读取加速见
[Data](0359_Tools_Pytorch_Data)，多卡扩展见 [多 GPU
训练](0338_Tools_Pytorch_mGPUs)。

## 编译优化：torch.compile

PyTorch 2.0 起官方推荐的默认加速手段，一行代码（`model = torch.compile(model)`）通过
TorchDynamo 捕获计算图、TorchInductor 生成优化内核，官方基准测试显示能带来 38%\~76% 的训练速度提升，详见
[torch.compile](0518_Tools_Pytorch_Speed_compile)。

## 混合精度训练（AMP）

用 `torch.amp.autocast`（当前统一 API，`torch.cuda.amp.autocast`
已标记弃用）把部分算子自动转换成 float16/bfloat16
计算，减少显存占用、提升吞吐，尤其在支持 Tensor Core 的 NVIDIA GPU 上效果明显：

``` python
from torch.amp import autocast, GradScaler

scaler = GradScaler("cuda")
for inputs, target in data:
    optimizer.zero_grad()
    with autocast(device_type="cuda", dtype=torch.float16):
        output = model(inputs)
        loss = loss_fn(output, target)
    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
```

  - float16 数值范围较窄，小梯度容易下溢，需要配合 `GradScaler` 做损失缩放；
  - bfloat16 数值范围和 float32 一致，通常不需要 `GradScaler`；CPU 上的自动混合精度目前只支持
    bfloat16；
  - 更详细的原理（autocast 算子取舍规则、GradScaler 动态损失缩放算法）见
    [AMP](0596_Tools_Pytorch_Speed_AMP)。

## Data 读取加速

  - `num_workers` 选择合适的大小（经验上设为 CPU 核心数或略小）；
  - `pin_memory=True` + `.to(device, non_blocking=True)`，让 CPU→GPU
    的数据拷贝和计算重叠；
  - `persistent_workers=True`，避免每个 epoch 重新创建 worker 进程的开销；
  - 预加载到内存 / 处理成单个大文件（LMDB/TFRecord/HDF5），减少小文件 IO 开销；
  - 详细方法见 [Data](0359_Tools_Pytorch_Data)。

## 内存格式：channels\_last

对卷积网络，把张量内存格式从默认的 `NCHW`（contiguous）改成 `channels_last`（`NHWC` 语义），能更好匹配
cuDNN/oneDNN 等底层库对卷积的优化路径：

``` python
model = model.to(memory_format=torch.channels_last)
inputs = inputs.to(memory_format=torch.channels_last)
```

内部实现原理（stride 层面怎么变化、为什么匹配 Tensor Core 更快）见
[channels\_last](0602_Tools_Pytorch_Speed_ChannelsLast)。

## 其他常用手段

  - `torch.backends.cudnn.benchmark = True`：输入尺寸固定时，让 cuDNN 自动搜索最优卷积算法；
  - 梯度检查点（`torch.utils.checkpoint`）：用重新计算换显存，训练更大模型/更大 batch；
  - 多卡/多机扩展：见 [多 GPU 训练](0338_Tools_Pytorch_mGPUs)（DDP/FSDP2）。

## Reference

  - [PyTorch
    加速数据读取](https://tianws.github.io/skill/2019/08/27/gpu-volatile/)
  - [Automatic Mixed Precision package -
    torch.amp（官方文档）](https://docs.pytorch.org/docs/stable/amp.html)
  - [What Every User Should Know About Mixed Precision Training in
    PyTorch（官方博客）](https://pytorch.org/blog/what-every-user-should-know-about-mixed-precision-training-in-pytorch/)
  - [torch.compile](0518_Tools_Pytorch_Speed_compile)
  - [Data](0359_Tools_Pytorch_Data)
  - [多 GPU 训练](0338_Tools_Pytorch_mGPUs)
  - [AMP](0596_Tools_Pytorch_Speed_AMP)
  - [channels\_last](0602_Tools_Pytorch_Speed_ChannelsLast)
