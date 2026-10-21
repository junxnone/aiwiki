---
Title | Tools Pytorch TorchScript
-- | --
Created @ | `2024-12-23T08:43:03Z`
Updated @| `2026-10-21T08:03:26Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/490)

---
# TorchScript

> **⚠️ 重要更新**：TorchScript 已于 PyTorch 2.10 被官方正式标记为**弃用（Deprecated）**——新项目的模型导出/部署路径请优先使用 **`torch.export`**（替代 `torch.jit.trace`/`torch.jit.script`）+ **ExecuTorch**（替代 TorchScript 的嵌入式运行时），`torch.compile` 继续作为推理期加速手段。本文内容保留作为理解 TorchScript 历史机制、以及维护存量项目的参考，详见文末"现状"一节。

- Intermediate Representation of a PyTorch model
- 用于部署时，将 pytorch model 转换为 TorchScript IR
- Debug
  - 可以对定义的 model 中的部分模块进行处理，来查看哪部分code 定义存在问题(例如 `torch.jit.script(model.DecoderA)`)
- **Tips:** Pytorch 转 OpenVINO 和 ONNX 等模型，也是使用此中间表示
  - 所以构建模型时最好能使用`是否能转换TorchScript` 作为参考标准

## 两种转换方式

### `torch.jit.trace()`

- 使用 `torch.jit.trace()` 对数据进行跟踪，记录计算过程，生成相应的 torchscript 模型

### script compiler

- **使用 script compiler:** `torch.jit.script()` 直接编译模型的代码，将其转换为 TorchScript，能够更好地处理包含控制流的情况


## 保存和加载  script IR

-  保存的文件中包含代码，参数，属性和debuginfo，可以加载到非 python code 中执行
  - {}.save("xxx.pt")
  - torch.jit.load('xxx.pt')



## `@torch.jit.script` 装饰器
- 用于将 Python 函数或类转换为可被 PyTorch JIT（Just - In - Time）编译器理解和优化的形式。
- **优点**
  - 性能提升
  - 跨平台部署方便
  - 可序列化和保存


### 工作原理

#### 编译过程
当使用@torch.jit.script装饰一个函数或类时，PyTorch JIT 编译器会对被装饰的对象进行静态分析。检查代码的语法和语义，尝试理解代码的结构和操作，然后将其转换为一种中间表示形式（IR）。这个 IR 是一种更接近机器语言的表示，它可以被更高效地执行。

#### 类型推断
JIT 编译器会进行类型推断。例如，对于函数的参数和返回值的类型，它会根据代码中的操作和赋值情况进行推断。如果可能的话，它会确定每个变量的确切类型，这有助于优化代码的执行。比如，在一个函数中，如果某个变量总是被当作整数处理，JIT 编译器就可以利用这个信息进行优化，如选择更适合整数运算的指令。

#### 优化操作
基于对代码的分析和类型推断，JIT 编译器会执行一系列的优化操作。这些操作包括但不限于常量折叠（将可以在编译时计算的常量表达式提前计算）、循环展开（对于确定次数的小循环，将循环体展开以减少循环开销）、函数内联（将被频繁调用的小函数的代码直接插入到调用处，减少函数调用开销）等。

## 现状：TorchScript 之后——torch.export

- `torch.export` 是 PyTorch 2.1+ 引入、面向"导出用于部署"场景的新一代 IR，设计上比 TorchScript 的 trace/script 更严格、更可预测（追踪过程中会显式暴露动态控制流等无法静态导出的部分，而不是像 `torch.jit.trace` 那样悄悄把它们"固化"成常量，这是 TorchScript 时代一个常见的隐蔽坑），和 trace/script 的具体差异（守卫机制、严格/非严格模式）见 [torch.export](0600_Tools_Pytorch_Export)；
- 导出流程：`exported_program = torch.export.export(model, example_inputs)`，产出一个 `ExportedProgram`，可以进一步交给 AOTInductor 编译成独立可执行产物，或交给 [ExecuTorch](0601_Tools_Pytorch_ExecuTorch) 跑在移动端/嵌入式设备上；
- 配套的服务化方案也在迁移：TorchServe 已于 2025 年 8 月被标记为有限维护并归档，不再是新项目的默认推荐；
- 对于新项目：模型设计阶段优先考虑"能不能被 `torch.export` 导出"，而不是本文开头提到的"能不能转 TorchScript"这条旧标准。

## Reference
- [TorchScript](https://pytorch.org/docs/stable/jit.html)
- [export 🤗 Transformers models to TorchScript](https://huggingface.co/docs/transformers/en/torchscript)
- [torch.export 官方文档](https://docs.pytorch.org/docs/stable/export.html)
- [ExecuTorch 官方文档](https://pytorch.org/executorch/stable/index.html)
- [Tools Pytorch Speed compile](0518_Tools_Pytorch_Speed_compile)
- [Tools Pytorch Export](0600_Tools_Pytorch_Export)
- [Tools Pytorch ExecuTorch](0601_Tools_Pytorch_ExecuTorch)

