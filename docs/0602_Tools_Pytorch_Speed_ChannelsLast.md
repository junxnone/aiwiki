---
Title | Tools Pytorch Speed ChannelsLast
-- | --
Created @ | `2026-10-21T07:56:37Z`
Updated @| `2026-10-21T07:56:37Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/602)

---
# channels_last 内存格式

Tools Pytorch Speed 一文提到用 `channels_last` 提升卷积网络性能，本文展开它的内部实现原理和适用边界。

## 本质：不是新属性，是 stride 变了

PyTorch 张量没有单独的"内存格式"属性字段——内存格式完全由张量的 `size`（形状）和 `stride`（步长）组合表达。不管物理内存里数据怎么排布，张量的逻辑形状描述始终是 `NCHW` 这个顺序，变化的只是 `stride`：

- **默认连续格式（NCHW，contiguous）**：对一个 `10×3×16×16` 的张量，stride 是 `(768, 256, 16, 1)`——内存里同一个通道的所有空间位置是连续存放的；
- **channels_last（NHWC 语义）**：同样 `10×3×16×16` 的逻辑形状，stride 变成 `(768, 1, 48, 3)`——内存里同一个空间位置上、不同通道的值变成连续存放。

逻辑形状没变，只是通过修改 stride，让数据在物理内存里的排布方式从"按通道连续"变成"按空间位置连续"。

```python
model = model.to(memory_format=torch.channels_last)
inputs = inputs.to(memory_format=torch.channels_last)
```

## 为什么这对卷积更快

- **匹配硬件原生格式**：NVIDIA GPU 的 Tensor Core 做卷积运算时，底层原生偏好 NHWC 这种通道连续排布；如果张量是默认的 NCHW 格式，cuDNN 在每次卷积调用时都要先做一次内部转置把数据重排成 NHWC，这个转置操作本身就是开销；用 channels_last 让张量提前就是目标排布，省掉这个反复转置的过程；
- **更好的内存/缓存局部性**：按空间位置连续存放通道数据，内存访问模式更符合大块连续读取的规律，能更充分利用 L2 缓存和显存带宽；
- **实测收益**：官方博客报告在配合混合精度（见 Tools Pytorch Speed AMP）训练时，ResNet50 在 V100 上用 channels_last 相比默认格式训练速度提升约 22%，多个视觉模型测试提升区间在 8%~35%。

## 使用边界：不是所有算子都支持

不是每个 PyTorch 算子都原生支持 channels_last 格式——如果模型里混杂了不支持该格式的算子，数据会被这个算子悄悄转换回默认的 contiguous 格式处理，处理完再转换回 channels_last 供后续支持的算子使用，这种反复转换（业界称为 "channel thrashing"）会抵消甚至超过 channels_last 本应带来的收益。实践中建议：先在目标模型上验证主要算子（卷积、BN、激活函数等视觉骨干网络常见算子）都支持该格式，再决定是否全局启用；CPU 侧（Intel 平台）也有对应的 channels_last 优化路径，不只是 GPU 专属。

## Reference
- [Efficient PyTorch: Tensor Memory Format Matters（官方博客）](https://pytorch.org/blog/tensor-memory-format-matters/)
- [Channels Last Memory Format in PyTorch — 官方教程](https://docs.pytorch.org/tutorials/intermediate/memory_format_tutorial.html)
- [Accelerating PyTorch Vision Models with Channels Last on CPU（官方博客）](https://pytorch.org/blog/accelerating-pytorch-vision-models-with-channels-last-on-cpu/)
- [Tools Pytorch Speed](0169_Tools_Pytorch_Speed)
- Tools Pytorch Speed AMP

