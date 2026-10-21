---
Title | Tools OV CompileTool
-- | --
Created @ | `2021-01-25T10:07:40Z`
Updated @| `2026-10-21T02:30:13Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/183)

---
# OpenVINO Blob

> **现状先说结论**：独立的 `compile_tool` 命令行工具本身已经在 OpenVINO 2023.0/2023.1 被弃用并移除，**不再维护**；但它做的事情——把模型编译成设备专有的二进制格式（blob）、之后直接加载跳过重新编译——这个能力完全没有消失，而是迁移成了 Core API 的一部分（`compile_model()` + `export_model()`/`import_model()`），并且一路持续增强到 2026 年末（见下文）。下面先保留历史用法作为参考，再给出当前的用法。

## 历史用法（`compile_tool`，已移除，仅作参考）

- Convert xml to blob format
```
compile_tool -m model.xml -d MYRIAD -il NCHW
```
```
Inference Engine:
        API version ............ 2.1
        Build .................. 2021.1.0-1237-bece22ac675-releases/2021/1
        Description ....... API
[Warning][VPU][Config] Deprecated option was used : VPU_MYRIAD_PLATFORM
Done. LoadNetwork time elapsed: 7202 ms
```
```
model.blob
```

> 这里的 `MYRIAD` 是 Intel 早期 VPU（Movidius Myriad）系列的设备名，对应的是 OpenVINO 2021 年前后的 API（`Inference Engine API version 2.1`）——这套 VPU/MYRIAD 命名体系后来被现在的 **NPU**（Neural Processing Unit，见 [OPs NPU Impl](0575_Tools_OV_OPs_NPUImpl)）取代，`compile_tool` 本身也随 Inference Engine 旧 API 一起被移除，当前应统一用下面的 Core API 方式。

## 为什么要把模型编译成 blob

`compile_model()` 本身要做图编译（算子融合、布局选择等优化，见 [算子融合](0563_Tools_OV_MO_Fusion)/[布局重排](0565_Tools_OV_MO_Layout)），这个过程不是瞬间完成的，尤其是在 NPU 这类需要把模型转换成设备专有格式的硬件上耗时更明显（[OPs NPU Impl](0575_Tools_OV_OPs_NPUImpl) 一文里提到的 **FEIL**（含完整编译时间）往往比 **FIL**（只含加载预编译模型）慢得多）。把编译结果导出成一份 blob 文件，之后直接加载这份 blob 跳过编译步骤，是减少这部分启动开销的标准做法——尤其适合"编译环境和部署环境分离"（比如在开发机上编译好，部署到没有完整工具链的嵌入式/边缘设备上）或者"同一个模型反复启动很多次"的场景。

## 当前用法：Core API 直接导出/导入

### Python

```python
import openvino as ov

core = ov.Core()
compiled_model = core.compile_model("model.xml", "NPU")

# 导出成 blob
with open("model.blob", "wb") as f:
    compiled_model.export_model(f)

# 之后直接导入 blob，跳过重新编译
with open("model.blob", "rb") as f:
    compiled_model = core.import_model(f, "NPU")
```

### C++

```cpp
ov::Core core;
ov::CompiledModel model = core.compile_model("model.xml", "NPU");

std::ofstream out("model.blob", std::ios::binary);
model.export_model(out);

std::ifstream in("model.blob", std::ios::binary);
ov::CompiledModel imported = core.import_model(in, "NPU");
```

## 和自动模型缓存（`ov::cache_dir`）的区别

除了上面手动 `export_model()`/`import_model()` 这种显式导出/导入 blob 的方式，OpenVINO 还提供一种**自动缓存**机制：设置 `ov::cache_dir` 属性后，`compile_model()` 会自动把编译结果缓存到指定目录（GPU 对应 `.cl_cache`，CPU/NPU 等对应 `.blob`），下次用同样的模型+设备+配置调用 `compile_model()` 时自动命中缓存、跳过重新编译，不需要手动管理 blob 文件：

```python
core = ov.Core()
core.set_property({"CACHE_DIR": "./cache"})
compiled_model = core.compile_model("model.xml", "NPU")  # 第二次调用会自动命中缓存
```

两者的取舍：自动缓存更省心，适合"同一台机器上反复运行"的场景；手动 `export_model()` 导出的 blob 可以**脱离原始 IR 文件**、搬到另一台只有运行时、没有完整工具链的设备上直接 `import_model()`，适合"编译和部署在不同环境"的场景。并不是所有设备都支持导入/导出——不支持的设备上这两种机制都会退化成"正常编译"，不会报错，只是拿不到跳过编译的加速效果。

## 发展历史：从 2021 到现在的完整能力演进

这套"编译结果能不能存下来复用"的能力不是一次性做完的，而是跟着 OpenVINO 的硬件/应用场景一路演进过来的：

| 时间 | 事件 |
|---|---|
| 2021.4 | 正式引入"Model cache feature"——对支持 Import/Export API 的设备（当时是 GNA、MYRIAD）实现自动模型缓存：第一次运行正常编译并把编译结果导出到磁盘，之后的运行直接从缓存加载、不再重新编译；同时 GPU 侧也启用了针对 CLDNN kernel 的缓存。同一版本里，更早期的 `myriad_compile` 工具被标记弃用（计划 2022.1 移除），`compile_tool` 被作为替代方案推荐使用； |
| 2022（年度大版本） | 模型缓存能力正式在 Inference Engine 运行时里落地，用于改善首次推理延迟；OpenVINO Model Server 也获得了对应的服务端缓存能力； |
| 2022.2 | `compile_tool` 被正式写入文档，成为标准组件——一个 C++ 命令行程序，把模型编译成针对特定设备的二进制文件； |
| 2022.3 | 模型缓存以预览特性（Preview）形式覆盖更广的设备/模型范围（GPU 侧需要额外设置 `OV_GPU_CACHE_MODEL=1` 环境变量开启预览）；与此同时 `compile_tool` 自己的弃用进程启动——官方建议改为手动把预处理步骤写进模型、另存一份 IR，计划 2023.0 移除； |
| 2023.0/2023.1 | **`compile_tool` 被正式移除**，和 Model Optimizer 等一批旧版 Inference Engine 时代的独立命令行工具一起退出历史舞台，统一改用 Core API（`compile_model()`/`export_model()`/`import_model()`）； |
| 2023.2 | API 用法细节打磨——`openvino.properties` 子模块让属性设置的写法更简洁（如 `{openvino.properties.cache_dir: "./path"}`）； |
| 2023.3（LTS） | 模型缓存走向成熟，开始适配 LLM 时代的新需求：**支持动态 shape 模型的缓存**（这对 LLM 这类输入长度可变的模型意义重大）；新增"尺寸模式（模型缓存）vs 速度模式（kernel 缓存）"的切换选项；缓存文件名不再和 GPU 驱动版本绑定，驱动升级后不会重新生成一份新缓存，可移植性更好； |
| 2025.1 | 官方明确把 **OpenVINO 通用缓存（`CACHE_DIR`）确立为首选的、设备无关的缓存机制**（取代各设备各自为政的历史做法），后续 NPU 的"预编译导出到指定路径（Ahead-of-Time，AOT）"用法也是建立在这套机制之上； |
| 2025.2 | 新增 **`COMPILED_BLOB` 提示属性**，加速编译过程，支持常规或"无权重"（weightless）模型，配合 `WEIGHT_PATH` 指定权重文件单独存放位置；NPU 插件支持通过 `ov::compiled_blob` 属性直接传入 `ov::Tensor` 格式的预编译模型（不需要经过流读取），底层的 `BlobContainer` 也被替换成标准的 OpenVINO Tensor； |
| 2025.4 | 新增**加密 blob 格式**（配合 OpenVINO GenAI，降低模型权重被窃取的风险，支持用户提供的回调函数做加解密，模型缓存和手动 export/import 都能用）；修复 Windows 上 `import_model()` 处理大模型失败的问题；Python API 补齐了直接从 `ov.Tensor` 对象导入预编译模型的能力（此前只有 C++ API 支持）； |
| 2026.0 | NPU 编译器集成进一步完善，MoE（混合专家）模型编译支持转正（GA）； |
| 2026.2.1 | OpenVINO GenAI 场景下，**GPU 用 blob 缓存显著缩短模型加载时间**，针对多阶段 AI 流水线（含依赖多个模型的 Agent 场景）优化加载瓶颈； |
| 2026.4 | NPU 支持权重分离存储的 ONNX 模型走"无权重编译"流程、支持无权重模式编译出的模型做兼容性字符串校验；新增 `ov::compatibility_check`，只看描述信息就能判断一个编译好的 blob 和当前环境兼不兼容；新增对 NPU 上动态 shape 模型的预览级支持（目前限定在视觉模型，如超分辨率 ESPCN 验证过）；C API 修了一个导入超过 2GB 的大 blob 会失败的 bug； |
| 2026.4.1 | **安全加固**：修复了 blob 导入时元数据解析的整数溢出漏洞，给兼容性字符串解析加了递归深度限制，拒绝加载被篡改/伪造的 blob 文件——提醒了一个容易被忽略的点：blob 文件如果来源不可信（比如从公开渠道下载），本身也是需要考虑安全校验的二进制产物，不是只有原始 IR/权重文件才有供应链风险。 |

这条脉络总结下来是：**2021 年先在小众的 VPU/GNA 硬件上做了个"能用"的自动缓存 → 2022 年扩展到 CPU/GPU 通用场景、`compile_tool` 作为独立工具一度被扶正 → 2022 年底到 2023 年初，独立工具反而被判了死刑，统一收编进 Core API → 2023.3 这个 LTS 版本补上了动态 shape（LLM）支持，技术上真正成熟 → 2025 年起 `CACHE_DIR` 被确立为统一的设备无关缓存入口，同时在 NPU 预编译、安全（加密）、大模型场景持续加码 → 2026 年进一步覆盖 MoE/动态 shape/多阶段 Agent 流水线，并且在 2026.4.1 补上了"blob 本身也要防篡改"这一课**。也就是说能力本身不仅没有被放弃，反而是 OpenVINO 这几年持续投入、一直在扩展边界的方向之一，只是承载它的具体工具/API 形态换了好几轮。

## CACHE_MODE：两种 blob，体积和自包含性的取舍

AOT（Ahead-of-Time，提前编译）场景下导出的 blob 具体长什么样，由 `CACHE_MODE` 决定，两种模式二选一：

- **`OPTIMIZE_SIZE`（默认）**：导出"无权重"（weightless）blob，体积更小，但加载这份 blob 时还需要额外提供原始权重文件或者原始 `ov::Model` 对象才能完整复原模型——blob 本身只存了"怎么编译/怎么摆放"的信息，不含实际权重数值；
- **`OPTIMIZE_SPEED`**：导出含完整权重的 blob，体积更大，但自包含、不需要额外提供任何文件就能直接加载。

怎么选很直接：**权重文件本来就会单独分发/已经在目标机器上**，选 `OPTIMIZE_SIZE` 省传输和存储体积；**希望一份 blob 文件就能完整复现模型、不想额外管理权重文件**，选 `OPTIMIZE_SPEED`。无权重模式下的导入流程针对内存占用做过专门优化，比常规编译或走 `CACHE_DIR` 自动缓存更省内存。

## Reference
- [Model Caching Overview - OpenVINO 官方文档](https://docs.openvino.ai/2025/openvino-workflow/running-inference/optimize-inference/optimizing-latency/model-caching-overview.html)
- [OpenVINO Release Notes 2021.4](https://www.intel.com/content/www/us/en/developer/articles/release-notes/openvino/2021-4.html)
- [OpenVINO Release Notes 2023.3（LTS，动态 shape 缓存支持）](https://www.intel.com/content/www/us/en/developer/articles/release-notes/openvino/2023-3.html)
- [OpenVINO Release Notes 2026.4（NPU 无权重编译、compatibility_check、安全加固）](https://www.intel.com/content/www/us/en/developer/articles/release-notes/openvino-relnotes.html)
- [OpenVINO Release Notes（汇总索引）](https://docs.openvino.ai/2025/about-openvino/release-notes-openvino.html)
- [OPs NPU Impl](0575_Tools_OV_OPs_NPUImpl)
- [算子融合](0563_Tools_OV_MO_Fusion)
- [OpenVINO 总览](0185_Tools_OV)

