---
Title | Tools Pytorch Speed compile
-- | --
Created @ | `2025-05-29T03:34:22Z`
Updated @| `2026-10-21T08:03:28Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/518)

---
# torch.compile
- torch.compile通过将PyTorch代码即时编译为优化的内核，使PyTorch代码运行得更快，同时所需的代码改动极小。
- `torch >= 2.0`
- 任意Python函数都可以通过将可调用对象传递给torch.compile来进行优化。
- 可以使用修饰器: `@torch.compile` 修饰函数
- 可以使用 `torch.nn.Module` 自带的 `compile()` 方法 : `model.compile()`
- 编译时会嵌套进行：
  - 装饰函数内的嵌套函数调用也将被编译。
  - 模块内的子模块和方法会被编译
- 使用 `@torch.compiler.disable` 来禁用某些函数的编译

## 为什么第一次调用会更慢：编译开销

`torch.compile` 是**即时编译（JIT）**——第一次遇到某个输入 shape/控制流分支时，需要先跑一遍 TorchDynamo 捕获计算图、TorchInductor 生成优化内核，这个编译过程本身有开销，所以**第一次调用通常比 eager 模式更慢**；编译结果会被缓存，后续用相同 shape 反复调用时才能体现出编译带来的加速。如果输入 shape 经常变化、频繁触发重新编译，编译开销可能抵消甚至超过加速带来的收益，这是使用 `torch.compile` 时需要关注的主要代价。

## 底层组成

- **TorchDynamo**：在 Python 字节码层面拦截执行，把能转换成计算图的部分提取出来（遇到无法追踪的动态控制流时会自动"断图"，回退到 eager 模式执行那一小段，不是全有全无）；
- **AOTAutograd**：提前（ahead-of-time）生成反向传播对应的计算图；
- **PrimTorch**：把种类繁多的 PyTorch 算子归约成一小组更基础的"原语"算子，简化后端适配工作；
- **TorchInductor**：默认的编译后端，为 GPU 生成 Triton 内核、为 CPU 生成 C++/OpenMP 代码。

和同样基于 TorchDynamo 的 [torch.export](0600_Tools_Pytorch_Export) 相比：`torch.compile` 面向训练/推理期的即时加速，遇到追踪不了的代码会"断图"回退到 eager 模式，不影响可用性；`torch.export` 面向导出部署，要求产出一个完整静态图，不允许断图，两者定位不同。

## 常用模式（mode 参数）

```python
model = torch.compile(model, mode="default")
```

Mode | 说明
-- | --
default | 兼顾编译时间和运行时性能的默认选项
reduce-overhead | 用 CUDA Graph 等手段降低 Python/框架层面的调度开销，适合小模型/小 batch，有一定额外显存开销
max-autotune | 花更长编译时间穷举搜索更优内核配置，追求极致运行时性能，适合长期运行的训练/推理服务

## Reference
- [torch.compile 官方文档](https://docs.pytorch.org/docs/stable/generated/torch.compile.html)
- [PyTorch 2.x 官方介绍（torch.compile 发布背景）](https://pytorch.org/get-started/pytorch-2-x/)
- [Tools Pytorch TorchScript](0490_Tools_Pytorch_TorchScript)
- [加速](0169_Tools_Pytorch_Speed)
- [Tools Pytorch Export](0600_Tools_Pytorch_Export)

