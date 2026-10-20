---
Title | Tools OV OPs NPUImpl
-- | --
Created @ | `2026-10-20T08:59:16Z`
Updated @| `2026-10-20T08:59:16Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/575)

---
# OPs NPU Impl

> 本文和 [OPs CPU Impl](0534_Tools_OV_OPs_CPUImpl)、[OPs GPU Impl](0531_Tools_OV_OPs_GPUImpl) 并列，是 [OpenVINO Ops](0528_Tools_OV_OPs) 里"硬件执行载体"分类下第三条路线——NPU（Neural Processing Unit）的执行架构。和 CPU/GPU 复用通用计算单元不同，NPU 是专门为神经网络推理设计的固定功能/可配置硬件，执行方式和前两者有本质区别。

## 两阶段：编译 + 执行

`intel_npu` 插件实现了和 CPU/GPU 插件相同的 OpenVINO `IPlugin` 接口，但内部分两个完全独立的阶段：

1. **编译阶段**：插件调用驱动暴露的"图扩展 API"，或者包里自带的 **NPU Compiler**，把 `ov::Model` 转换成 NPU 专有的二进制格式——这个编译器会做针对 NPU 硬件子模块的调度优化（怎么安排各层的执行顺序和内存搬运），这一步发生在用户态驱动（UMD）里，和 CPU/GPU 插件直接解释执行计算图完全不同；
2. **执行阶段**：用 Intel 的 **Level Zero（L0）API** 把编译好的模型提交给 NPU 硬件执行——把要做的任务描述写进一个命令列表（command list），提交到命令队列（command queue）去执行。**NPU 插件不会用 CPU 来执行任何一部分推理负载**，要么整个子图在 NPU 上跑，要么（遇到不支持的算子）交给其他插件处理。

## 和 CPU/GPU 的关键差异

| 维度 | NPU | CPU/GPU |
|---|---|---|
| 执行单元 | 专用神经网络加速硬件，编译期生成的是设备专有二进制格式 | 通用计算单元（向量指令/OpenCL kernel），运行时直接执行 IR 或编译后的 kernel |
| 算子支持范围 | **三者中最窄**，很多算子不支持 | CPU/GPU 支持范围广得多 |
| 动态 shape | 支持有限，很多场景需要用 padding 等变通手段把动态输入"伪装"成静态 shape，官方也提供预编译好的定长模型作为替代方案 | CPU/GPU 原生支持动态 shape |
| 显存/内存限制 | 容量受限，大模型可能需要做模型切分/子图分流到其他设备 | 相对宽松 |
| 首次推理延迟 | 区分 **FEIL**（First Ever Inference Latency，含完整编译时间）和 **FIL**（First Inference Latency，只含加载预编译模型+首次推理），两者差异很大 | 通常只需要关心一次性的模型编译/加载时间 |

## 模型缓存

OpenVINO 的模型缓存机制（设置 `ov::cache_dir`）对所有插件通用，但在 NPU 上有特殊处理：设置了 `cache_dir` 之后，会自动绕过 UMD（用户态驱动）自带的模型缓存，避免两层缓存重复生效。合理利用缓存能把 FEIL 降到接近 FIL 的水平，这对 NPU 场景意义更大——因为 NPU 编译器本身的编译耗时通常比 CPU/GPU 插件的图编译要长。

## 怎么应对算子/动态 shape 限制

- 查询某个模型在 NPU 上的算子兼容情况：用 [OpenVINO Ops](0528_Tools_OV_OPs) 里提到的 `core.query_model(model, "NPU")` 接口，提前看哪些层不被支持；
- 遇到不支持的算子：可以用 **HETERO** 插件把这部分算子自动 fallback 到 CPU/GPU 执行，具体机制见独立的"AUTO/HETERO/MULTI 插件调度"一文；
- 遇到动态 shape：优先看模型是否有官方提供的预编译定长版本，或者用固定的输入 shape（必要时做 padding）重新导出模型。

## Reference
- [intel_npu 插件 README（GitHub）](https://github.com/openvinotoolkit/openvino/blob/master/src/plugins/intel_npu/README.md)
- [NPU Device - OpenVINO 官方文档](https://docs.openvino.ai/2025/openvino-workflow/running-inference/inference-devices-and-modes/npu-device.html)
- [OPs CPU Impl](0534_Tools_OV_OPs_CPUImpl)
- [OPs GPU Impl](0531_Tools_OV_OPs_GPUImpl)
- [OpenVINO Ops](0528_Tools_OV_OPs)

