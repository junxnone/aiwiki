---
Title | Tools OV OPs PluginScheduling
-- | --
Created @ | `2026-10-21T01:12:55Z`
Updated @| `2026-10-21T01:31:13Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/578)

---
# AUTO / HETERO / MULTI 插件调度

> 本文展开 [OpenVINO Ops](0528_Tools_OV_OPs) "硬件执行载体"分类里提到的三个调度类插件——它们本身不执行算子计算，而是决定"模型该在哪个设备上跑、怎么跑"，是 CPU/[GPU](0531_Tools_OV_OPs_GPUImpl)/NPU 这些真正执行计算的插件之上的一层调度逻辑。三者解决的是三个不同的问题，容易混淆。

## AUTO：自动选设备

AUTO 是一个"虚拟设备"——`compile_model` 时指定 `"AUTO"`，不需要代码里硬编码具体用 CPU 还是 GPU，由 AUTO 插件自己决定用哪个设备、以及怎么在设备之间切换：

- **启动策略**：AUTO 总是先用 CPU 启动推理（CPU 几乎没有额外的启动延迟），与此同时在后台把模型加载到更适合这个任务的设备（如 GPU）上；一旦那个设备准备就绪，后续推理请求就切换过去——这样能同时兼顾"第一次推理就要快"和"长期跑在更合适的设备上吞吐更高"两个目标；
- **失败自动重试**：如果编译模型在某个设备上失败，AUTO 会自动尝试列表里的下一个设备，直到成功为止；
- **设备优先级**：可以显式指定设备候选列表和优先级（如 `"AUTO:GPU,CPU"`），不指定的话默认把所有可用设备都当作候选；
- **CUMULATIVE_THROUGHPUT 模式**：这个性能提示下，AUTO 会把模型同时加载到候选列表里的所有设备上一起跑，追求整体吞吐量最大化——这时候 AUTO 的行为和下面的 MULTI 很接近，区别只是用的是 AUTO 自己筛选出来的候选设备列表。

## HETERO：把一张图拆到多个设备上

HETERO 解决的是"一张计算图里，不同算子分别在不同设备上执行"——典型场景是模型里大部分算子某个加速器（如 NPU/GPU）支持，但有少数算子它不支持：

- **拆分依据**：按算子对每个设备的支持情况自动拆分计算图，重活交给加速器，加速器不支持的算子自动回退（fallback）到 CPU 执行；
- **配置方式**：`"HETERO:GPU,CPU"` 这样指定设备优先级顺序——GPU 是主执行设备，CPU 是兜底设备；
- **和 NPU 的典型配合**：NPU 支持的算子集合是三者里最窄的（见 [OPs NPU Impl](0575_Tools_OV_OPs_NPUImpl)），遇到 NPU 不支持的算子，常见做法就是用 HETERO 把这部分自动分流给 CPU 或 GPU，而不是整个模型都放弃用 NPU。

## MULTI：同一个模型多设备并行跑

MULTI 和 HETERO 的核心区别是："拆图"还是"复制"——MULTI **不拆分**计算图，而是把**完整的同一份模型**同时部署到多个设备上，让它们并行处理不同的推理请求，目标是提升总吞吐量（单位时间能处理的请求数），而不是加速单次推理的延迟。

## 三者总结对比

| 插件 | 解决的问题 | 一张图会不会被拆开 | 典型目标 |
|---|---|---|---|
| AUTO | 不想在代码里写死用哪个设备 | 不拆（用一个设备，或 CUMULATIVE_THROUGHPUT 模式下复制到多个设备） | 简化设备选择逻辑，兼顾启动延迟和长期性能 |
| HETERO | 模型里有算子目标设备不支持 | **拆**，按算子支持情况分配给不同设备 | 让不支持的算子有地方可去，不必放弃使用加速器 |
| MULTI | 单设备吞吐量不够 | 不拆，整份模型复制到多个设备 | 并行处理更多请求，提升总吞吐量 |

三者可以组合使用（比如 AUTO 内部用 CUMULATIVE_THROUGHPUT 模式时的行为就类似 MULTI；HETERO 拆分出来的子图也可能分别用 AUTO 再去选具体设备），但分别理解清楚各自解决的问题是前提。

## Reference
- [Automatic Device Selection（AUTO）- OpenVINO 官方文档](https://docs.openvino.ai/2025/openvino-workflow/running-inference/inference-devices-and-modes/auto-device-selection.html)
- [Inference Devices and Modes - OpenVINO 官方文档](https://docs.openvino.ai/2025/openvino-workflow/running-inference/inference-devices-and-modes.html)
- [OPs GPU Impl](0531_Tools_OV_OPs_GPUImpl)
- [OpenVINO Ops](0528_Tools_OV_OPs)

