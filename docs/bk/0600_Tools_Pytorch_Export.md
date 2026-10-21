-----

| Title     | Tools Pytorch Export                                  |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-21T07:56:33Z`                                |
| Updated @ | `2026-10-21T07:56:33Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/600) |

-----

# torch.export

Tools Pytorch TorchScript 一文提到，TorchScript 已在 PyTorch 2.10
被官方标记弃用，`torch.export` 是当前推荐的模型导出入口。本文展开它和 TorchScript
的本质区别。

## 和 TorchScript trace/script 的根本区别

`torch.jit.trace` 的核心问题是**悄悄固化**：跟踪模型在样例输入上的执行过程，把遇到的控制流分支（比如 `if`
判断）直接按当次执行路径"焊死"进计算图，模型碰到不同形状/不同分支条件的新输入时，trace
出来的图不会报错，而是静默给出错误结果——这是 TorchScript
时代一个很隐蔽的坑；`torch.jit.script`
虽然能处理控制流，但失败模式复杂，经常在稍微复杂一点的模型上编译失败。

`torch.export` 同样采用"用样例输入跟踪执行"的方式，但引入了**守卫（Guard）机制**：跟踪过程中会记录程序对输入
shape 做出的所有假设（比如某处要求某个维度必须是偶数），这些假设被记录成显式的约束条件，导出产物 `ExportedProgram`
只在这些约束被满足时才保证正确——不满足约束的输入会在使用时直接报错，而不是像 `trace` 那样悄悄给出错误结果。

## 动态 Shape 需要显式声明

`torch.export` 默认导出**静态**图——产物只能用于导出时样例输入对应的那个具体 shape，哪怕某个维度在 eager
模式下本来是可变的。如果需要支持可变维度，必须用 `Dim()` API 显式声明，并通过 `dynamic_shapes`
参数关联到对应输入：

``` python
from torch.export import export, Dim

batch = Dim("batch")  # 声明一个名为 batch 的动态维度
exported_program = export(model, (example_input,), dynamic_shapes={"x": {0: batch}})
```

这个"默认静态、动态要显式声明"的设计，和本仓库 [OpenVINO 静态/动态
Shape](0581_Tools_OV_InputShape)
一文里讨论的思路是同一个工程哲学——不显式声明的维度按静态处理，能让编译器/运行时拿到更多信息做优化，避免"看起来通用、实际处处留一手"的隐性性能代价。

## 严格模式 vs 非严格模式

  - **严格模式（Strict，默认）**：底层用 TorchDynamo 对 Python 字节码做符号执行分析，不是真的跑一遍
    Python 代码，而是静态分析代码结构推导出计算图，能提供比"单纯跟踪"更强的 Python 层面正确性保证，但不是所有 Python
    特性都能被这套符号分析支持；
  - **非严格模式（Non-strict）**：直接用 Python 解释器正常执行模型代码（和 eager
    模式执行路径完全一致），只是把其中的张量换成"假张量"（Fake
    Tensor，只有形状/类型元信息，没有真实数据），记录下这些假张量经历的所有操作构建计算图——这种方式能绕开部分
    TorchDynamo 符号分析不支持的 Python 特性，是 PyTorch 2.3 引入的补充方案。

## 为什么不允许"断图"

`torch.compile` 遇到无法追踪的代码时会"断图"（Graph Break）：把这部分交还给 Python eager
模式执行，不影响整体可用性，只是损失一部分编译收益。`torch.export`
的定位是**导出一个完整、可独立运行的静态产物**用于部署，所以明确**不允许**断图——遇到无法追踪的代码会直接报错，而不是像
`torch.compile` 那样静默降级，这是两者设计目标不同导致的关键差异：`torch.compile`
追求"尽量快、能跑多少编译多少"，`torch.export`
追求"导出的产物必须完整、可预测"。

## Reference

  - [torch.export
    官方文档](https://docs.pytorch.org/docs/stable/export.html)
  - [torch.export
    Tutorial（官方教程）](https://docs.pytorch.org/tutorials/intermediate/torch_export_tutorial.html)
  - [torch.export Programming
    Model（官方文档）](https://docs.pytorch.org/docs/main/user_guide/torch_compiler/export/programming_model.html)
  - [OpenVINO 静态/动态 Shape](0581_Tools_OV_InputShape)
  - [Tools Pytorch TorchScript](0490_Tools_Pytorch_TorchScript)
  - [Tools Pytorch Speed compile](0518_Tools_Pytorch_Speed_compile)
