---
Title | Tools Pytorch Speed compile
-- | --
Created @ | `2025-05-29T03:34:22Z`
Updated @| `2025-05-29T03:34:22Z`
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
- 第一次时会比 eager mode 耗时更长？
