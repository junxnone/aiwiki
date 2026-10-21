---
Title | Tools OV InputShape
-- | --
Created @ | `2026-10-21T02:41:35Z`
Updated @| `2026-10-21T02:41:35Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/581)

---
# 静态 Shape vs 动态 Shape

## 概念：为什么要区分静态/动态

**静态 shape**：模型里每一个输入/中间张量的所有维度，在编译期（`compile_model()`）就是确定的常量——比如 `[1, 3, 224, 224]`。**动态 shape**：至少有一个维度在编译期是"未知/可变"的，要等到真正推理时送进具体数据才能确定——比如 batch 维度可变，或者 NLP 场景里序列长度每次推理都不一样。

这个区分之所以重要，是因为 OpenVINO 的很多图优化和内存规划都依赖"提前知道确切尺寸"：算子融合要不要生成某种专用 kernel、要不要把卷积走 Winograd/im2col、中间张量的显存要预留多大、要不要走某种设备专有的分块内存格式（见 [算子融合](0563_Tools_OV_MO_Fusion)、[布局重排](0565_Tools_OV_MO_Layout)）——这些决策在静态 shape 下可以在编译期一次性做完，在动态 shape 下只能推迟到运行时，或者退化成更保守、更通用但更慢的实现路径。所以动态 shape 不是"免费的灵活性"，而是**用运行时开销和优化空间换取了输入形状的自由度**，具体代价见下面"性能隐性影响"一节。

## 怎么设置：转换阶段

模型从原始框架转换成 OpenVINO IR 时（`ovc`/`ov.convert_model()`，见 [Model Optimizer 总览](0181_Tools_OV_MO)），可以显式指定每个输入的 shape 是静态还是动态：

```bash
# 静态：全部维度固定
ovc model.onnx --input "[1,3,224,224]"

# 动态：用 ? 表示该维度完全不受约束（无上下界）
ovc model.onnx --input "[?,3,224,224]"
```

Python API 里等价写法是用 `-1` 表示动态维度：

```python
import openvino as ov
ov_model = ov.convert_model("model.onnx", input=[-1, 3, 224, 224])
```

原始框架模型本身的 shape 是静态还是动态，和转换后 IR 的 shape 不是必须一致的——静态输入的原始模型可以转换成带动态维度的 IR，反过来动态输入的原始模型也可以在转换时固定成静态 shape（如果已知部署场景只需要一种尺寸）。

## 怎么设置：运行时 reshape 与范围约束

拿到 IR 之后，还可以在加载前用 `reshape()` 重新指定 shape，既可以把动态维度收紧成静态，也可以把静态维度放开成动态：

```python
core = ov.Core()
model = core.read_model("model.xml")

# 全部维度固定为静态
model.reshape([1, 3, 224, 224])

# batch 维度动态、其余固定（字符串写法用 ? 表示无约束动态维度）
model.reshape("?, 3, 224, 224")

# 给动态维度加上界/下界（比完全不设界更推荐，见下文）
model.reshape([ov.Dimension(1, 8), 3, 224, 224])      # batch 限定在 1~8
model.reshape("1..10, 8..512")                          # 字符串写法，逗号分隔每个维度的范围

compiled_model = core.compile_model(model, "CPU")
```

批量维度（batch）是最常见的动态维度，有专门的便捷方法 `set_batch()` 而不需要手写完整 `reshape()`。

> 这套 `ov.PartialShape`/`ov.Dimension` API 是现在的标准做法；更早期 Inference Engine 时代的 `CNNNetwork::reshape`/`setBatchSize`（以及"`setBatchSize` 之后不能再 `reshape`"这个历史坑）已经是旧版 API，仅作历史参考，见 [OpenVINO Tips](0184_Tools_OV_Tips)。

## Inference 阶段的实际区别

除了编译/转换阶段的设置方式不同，静态/动态 shape 在真正调用 `infer()` 时，API 行为也有几个实打实的差异：

- **输出 shape 什么时候可知**：静态模型 `compile_model()` 完成后立刻就能查到输出 shape（`compiled_model.output(0).get_shape()`），推理前就能提前分配好输出内存；动态模型的输出 shape 通常依赖输入 shape，**只有在某一次 `infer()` 跑完之后才能确定**，必须每次推理后重新查询 `get_output_tensor().get_shape()`，不能提前预判，也不能假设和上一次调用一样。
- **内存/tensor 复用模式不同**：静态模型的输入输出 tensor 可以在多次 `infer()` 之间复用同一块内存（指针稳定，典型的零拷贝写法），因为 shape 永远不变；动态模型只要这次调用的输入 shape 和上次不一样，底层就可能需要重新分配内部缓冲区，之前缓存的 tensor 指针不安全，每次都要重新 `set_input_tensor()`/`get_output_tensor()`。
- **单次调用的额外开销**：静态模型的 shape 传播、kernel 选择这些决策在编译期一次性做完，每次 `infer()` 是纯粹的计算执行，延迟稳定；动态模型每次 `infer()` 可能需要在运行时重新做一遍 shape 传播、决定走哪个 kernel 实现，这是动态模型单次调用耗时不稳定（随输入 shape 波动）的根本原因。

```python
# 静态模型：编译后立即可查输出 shape，可以提前分配好内存
compiled_model = core.compile_model(static_model, "CPU")
output_shape = compiled_model.output(0).get_shape()   # 不需要先跑一次推理

infer_request = compiled_model.create_infer_request()
infer_request.infer({0: input_data})
result = infer_request.get_output_tensor(0)             # shape 和上面查到的一致，可复用同一块内存

# 动态模型：输出 shape 只有在这一次 infer() 跑完之后才确定
compiled_model = core.compile_model(dynamic_model, "CPU")
infer_request = compiled_model.create_infer_request()

infer_request.infer({0: input_data})                     # 必须先推理
result_tensor = infer_request.get_output_tensor(0)        # 推理完才能拿到这次的实际 shape
print(result_tensor.get_shape())                           # 每次调用都可能不一样，不能复用上一次的结果
```

官方的判断标准很直接：如果实际场景里输入 shape 根本不怎么变，就该用静态——用 `reshape()` + `compile_model()` 去"模拟"动态反而是最差的做法，每次换 shape 都要重新编译，开销远超真正的动态 shape 机制；动态 shape 存在的意义正是解决"输入 shape 频繁变化、但又不想每次都重新编译"这个问题（典型场景是 NLP 变长序列）。

## 性能隐性影响

这是动态 shape 真正容易被低估的部分——同一个模型，"能跑"和"跑得快"之间的差距在动态 shape 下会明显放大：

- **CPU**：官方建议很直接——如果实际推理时输入 shape 根本不怎么变，就该用静态 shape 或者把模型 reshape 成静态，而不是图省事留成动态。CPU 插件的 Snippets JIT 子图编译器（见 [Snippets](0576_Tools_OV_OPs_CPUImpl_Snippets)）在早期版本要求子图 shape 编译期固定，shape 一变就要重新走一遍 JIT 编译流程，这也是官方博客专门强调"动态 shape 支持改进让 JIT 编译器推理性能提升 40%"的背景——这个提升本身就说明了动态 shape 在编译/调度上天然比静态多付出一截开销。
- **GPU**：动态 shape 支持主要面向 NLP 这类变长序列模型，并不是所有算子和图优化 pass 都支持动态维度，碰到不支持的场景可能直接崩溃或者性能显著下降；由于独立显卡上 host 端调度开销占主导，动态 shape 在独显上有时反而比静态 shape 更慢。有一种例外——**batch 维度动态但给定了明确上界**时，GPU 插件会反过来提前构建出 `log2(N)` 个按 2 的幂次划分的静态子图（N 是 batch 上界），实际请求来了之后用这几个子图组合执行（比如 batch=33 会拆成 32+1 两个子图跑），本质是用更多显存换执行效率，这也是为什么**上界比下界更重要**——下界基本不影响优化空间，上界才是决定能预留多少内存、能不能提前生成专用 kernel 的关键信息，不该图省事把动态维度留成完全无约束。
- **NPU**：对动态 shape 的原生支持在三类主力设备（CPU/GPU/NPU）里最弱，很多场景官方建议的变通方案是用 padding 把动态输入"伪装"成静态 shape，或者直接用预编译好的定长模型（见 [OPs NPU Impl](0575_Tools_OV_OPs_NPUImpl)）；NPU 上动态 batch 的做法是把模型 reshape 成 batch=1，再由插件并发管理多个推理请求来模拟批处理效果；[OpenVINO Blob](0183_Tools_OV_CompileTool) 时间线里提到的"NPU 动态 shape 预览级支持"直到 2026.4 才落地，且目前只在超分辨率这类视觉模型上验证过。
- **吞吐优化：用 streams 而不是 batching**：动态 shape 场景下，官方明确建议只用 streams（多个推理请求并行执行，互不要求步调一致）而不是传统的静态 batching（要求所有请求凑成同一个 batch 锁步执行）——streams 天然能容忍每个请求 shape 不一样，代价是每个 stream 都要各自拷贝一份中间 buffer，更吃内存。
- **折中方案：分桶（bucketing）**：如果实际场景的输入 shape 虽然会变，但变化范围是几个有限的典型值（比如图像常见的几种分辨率），比起留一个完全动态的维度，更推荐**为每种典型 shape 单独编译一份静态模型**，推理时按输入尺寸路由到对应的那份——用多次静态编译的确定性换掉一次动态编译的不确定开销，这也是 OpenVINO Model Server 里"按 batch size 自动重新加载模型"机制背后的同一个权衡逻辑：高频复用的几个固定尺寸之间切换，比支持无限可能的尺寸要划算得多。
- **近期的针对性优化**（2025.4）：GPU 插件降低了动态 shape 模型的运行时内存占用，并且取消了显存单次分配不能超过 4.2GB 的历史限制（新增 `GPU_ENABLE_LARGE_ALLOCATIONS` 属性控制）；LLM 连续批处理（ContinuousBatching）场景下，内存预分配策略从"指数增长"改成"固定数量额外 token"，进一步降低了动态 shape 带来的内存抖动。

## 实践建议

1. **默认用静态 shape**：如果部署场景的输入尺寸是固定的（或者只有极少几种），静态 shape 几乎总是更快、优化空间更大，不要为了"看起来通用"而默认选动态。
2. **真的需要动态时，一定给上界**：哪怕只是一个粗略的上界估计，也比完全不设界（`?`/`-1`）要好——这是插件做内存规划、挑选专用 kernel 的关键依据。
3. **变长输入优先考虑分桶而不是真·动态**：如果典型 shape 只有几种，分桶编译通常比支持任意 shape 的动态模型更划算。
4. **吞吐优先用 streams，不要勉强凑 batch**：动态输入场景下 batching 要求锁步执行，和"每个请求 shape 不同"天然冲突，streams 才是官方推荐路径。
5. **NPU 上优先走静态/定长模型**：动态 shape 在 NPU 上是三类设备里支持最弱、最晚才有预览能力的，能避免就避免。

## Reference
- [Applying Dynamic Shapes - OpenVINO 官方文档](https://docs.openvino.ai/2024/openvino-workflow/running-inference/dynamic-shapes.html)
- [Changing Input Shapes - OpenVINO 官方文档](https://docs.openvino.ai/2024/openvino-workflow/running-inference/changing-input-shape.html)
- [GPU Device - OpenVINO 官方文档（动态 batch 的 log2(N) 子图机制）](https://docs.openvino.ai/2025/openvino-workflow/running-inference/inference-devices-and-modes/gpu-device.html)
- [CPU Device - OpenVINO 官方文档](https://docs.openvino.ai/2024/openvino-workflow/running-inference/inference-devices-and-modes/cpu-device.html)
- [Advanced Throughput Options: Streams and Batching - OpenVINO 官方文档](https://docs.openvino.ai/2025/openvino-workflow/running-inference/optimize-inference/optimizing-throughput/advanced_throughput_options.html)
- [Dynamic shapes support in OpenVINO JIT compiler boosts inference performance by 40%（官方博客）](https://blog.openvino.ai/blog-posts/dynamic-shapes-support-in-openvino-jit-compiler-boosts-inference-performance-by-40)
- [OpenVINO Model Optimizer 总览](0181_Tools_OV_MO)
- [OpenVINO Tips（历史 CNNNetwork::reshape/setBatchSize 用法）](0184_Tools_OV_Tips)
- [算子融合](0563_Tools_OV_MO_Fusion)
- [布局重排](0565_Tools_OV_MO_Layout)
- [Snippets](0576_Tools_OV_OPs_CPUImpl_Snippets)
- [OPs NPU Impl](0575_Tools_OV_OPs_NPUImpl)
- [OpenVINO Blob](0183_Tools_OV_CompileTool)

