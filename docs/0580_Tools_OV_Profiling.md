---
Title | Tools OV Profiling
-- | --
Created @ | `2026-10-21T01:16:31Z`
Updated @| `2026-10-21T01:16:31Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/580)

---
# OpenVINO 性能分析工具合集

> OpenVINO 的性能分析能力散落在好几篇文章里各提一句（[算子融合](0563_Tools_OV_MO_Fusion)、[GPU Impl Reorder](0529_Tools_OV_OPs_GPUImpl_Reorder)、[OpenVINO Ops Impl](0533_Tools_OV_OPs_Impl)、[OpenVINO Debug](0527_Tools_OV_Debug)），本文把它们按"CPU/GPU/通用"汇总成一张速查表，并说明分别该在什么场景用哪个。

## 汇总表

| 工具/环境变量 | 适用平台 | 能看到什么 | 典型使用场景 |
|---|---|---|---|
| `OV_CPU_VERBOSE=11` | CPU | 每个实际执行节点的信息，融合后的节点会把原本几个算子的名字拼在一起显示，能看到哪些节点被 Snippets 编译成了 `Subgraph` | 验证 CPU 侧算子融合/Snippets 是否生效 |
| `dnnl_verbose=1` | CPU | oneDNN 层面的详细执行日志——用了哪个具体 kernel 实现、选用的指令集（AVX2/AVX512/VNNI）、内存格式 | 排查 CPU 推理为什么没吃到预期的指令集加速 |
| `OV_GPU_DUMP_SOURCES_PATH` | GPU | 导出编译后的 OpenCL 源码，检查最终执行图里生成的 kernel 数量是否比计算图里的算子数量少 | 验证 GPU 侧算子融合是否生效，排查 Reorder 节点是否被消除 |
| `OV_GPU_DUMP_TENSORS_PATH` / `OV_GPU_DUMP_TENSORS` | GPU | 导出中间层的张量数据 | 排查某一层输出结果是否符合预期（精度调试） |
| `OV_VERBOSE` | 通用 | 更底层的 OpenVINO Core 执行日志 | 排查设备选择、插件加载等框架层问题 |
| Benchmark Tool（`benchmark_app`） | 通用 | 端到端的吞吐量/延迟基准测试，支持 CPU/GPU/NPU 等所有设备 | 衡量模型在目标硬件上的实际推理性能，对比不同优化手段（量化前后、不同 batch size）的效果 |
| **Intel VTune** | CPU | CPU 核心利用率、缓存命中率、指令集使用情况的系统级性能剖析 | 排查 CPU 推理的瓶颈到底在计算、内存带宽还是调度开销 |
| **Intel GPA**（Graphics Performance Analyzers） | GPU | 具体到每个 GPU kernel 的执行时间、占用率 | 排查 GPU 推理里哪个 kernel 是性能瓶颈 |

## 怎么选

- **先用 Benchmark Tool 建立整体基线**：不管用什么优化手段，先跑一遍 `benchmark_app` 记录优化前的吞吐量/延迟，后续每次改动都用它验证是否真的变快了；
- **怀疑融合/布局优化没生效**：CPU 用 `OV_CPU_VERBOSE`，GPU 用 `OV_GPU_DUMP_SOURCES_PATH`，分别能看到图优化之后"实际跑起来的样子"；
- **已经确认瓶颈在某个具体设备，想深挖原因**：CPU 上进一步用 VTune 看是计算/内存/调度哪里卡住，或者 `dnnl_verbose` 看有没有命中预期的向量指令集；GPU 上用 Intel GPA 精确到 kernel 级别定位；
- **怀疑是精度问题而不是性能问题**：用 `OV_GPU_DUMP_TENSORS` 或 [OpenVINO Debug](0527_Tools_OV_Debug) 里提到的 `add_outputs()` 把中间层结果导出来对比。

## Reference
- [OpenVINO Debug](0527_Tools_OV_Debug)
- [算子融合](0563_Tools_OV_MO_Fusion)
- [GPU Impl Reorder](0529_Tools_OV_OPs_GPUImpl_Reorder)
- [OpenVINO Ops Impl](0533_Tools_OV_OPs_Impl)
- [Intel VTune Profiler](https://www.intel.com/content/www/us/en/developer/tools/oneapi/vtune-profiler.html)
- [Intel Graphics Performance Analyzers (GPA)](https://www.intel.com/content/www/us/en/developer/tools/graphics-performance-analyzers/overview.html)

