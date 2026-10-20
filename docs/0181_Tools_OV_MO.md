---
Title | Tools OV MO
-- | --
Created @ | `2018-11-11T15:06:52Z`
Updated @| `2026-10-20T02:19:23Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/181)

---
# Model Optimizer (Converter)

> `openvino.tools.mo`（legacy Model Optimizer，`mo`/`mo.py`）已在 OpenVINO 2025.0 彻底移除，本章节作为"模型转换与优化"综述继续讲解 OpenVINO 在这部分做的工作，当前权威入口是 `ovc` CLI 和 `openvino.convert_model()`/`openvino.save_model()` Python API（2023.1 引入）。

> | 旧（Model Optimizer） | 新（OVC / `ov.convert_model`） |
> | -- | -- |
> | `mo --input_model xxx.onnx` | `ovc xxx.onnx -o xxx.xml` |
> | `from openvino.tools.mo import convert_model` | `import openvino as ov; ov.convert_model()` |
> | 大量转换参数、model cut、老式 preprocess 参数 | 形状/输入信息放到 `input` 参数；预处理交给 `ov.PrePostProcessor`（见 [OpenVINO 优化](0509_Tools_OV_Optimizations)）；部分高级裁剪能力有差异 |

- **当前支持的框架**：PyTorch、TensorFlow、TensorFlow Lite、ONNX、PaddlePaddle、JAX/Flax（实验性）——不再包含旧版支持的 MXNet/Kaldi；PyTorch/JAX-Flax 模型只能用 Python API（`ov.convert_model()`），`ovc` CLI 不支持这两种；
- `ovc`/`ov.convert_model()` 默认会把权重压缩成 FP16 保存，减小模型体积、不需要额外开关。

## 转换 → 编译：模型优化发生在两个阶段

```
框架模型 --convert_model()/ovc--> IR(.xml/.bin) --compile_model()--> 可执行图（设备插件）
          [和硬件无关的图优化]                      [和硬件相关的图优化]
```

区分这两类优化的核心标准只有一个：**"该不该做、怎么做最优"这个判断，需不需要知道目标硬件的具体架构参数（向量宽度、线程/子组宽度、kernel 库支持的 post-op 种类……）**。不需要就能在转换期一次做完、所有设备共享结果；需要就必须等用户在 `compile_model()` 里指定了 `device_name` 之后，由对应插件现场决定。

### 硬件无关的图优化（转换阶段）

| 优化 | 例子 | 为什么和硬件无关 |
| -- | -- | -- |
| 框架算子语义翻译 | TensorFlow 的 `Conv2D`、PyTorch 的 `nn.Conv2d` 统一映射成 OpenVINO 的 `Convolution` | 纯语义/格式转换，不涉及"在哪种硬件上执行更快"这个问题 |
| BatchNorm 折叠 | `Conv→BN` 合并成一个新的 `Conv'`（见 [OpenVINO BatchNorm 折叠](0564_Tools_OV_MO_BNFolding)） | 这是严格的代数恒等变换——合并前后计算结果在数学上完全相等，在任何硬件上都成立，不存在"对某个硬件不划算"的情况 |
| 通用线性算子融合 | Scale/Shift 合并进相邻 Conv 的权重（见 [OpenVINO 算子融合](0563_Tools_OV_MO_Fusion) 里的"机制 A"） | 原理同 BN 折叠，纯代数合并，不依赖任何硬件特性 |
| 常量折叠（Constant Folding） | `ShapeOf` 衍生出的形状计算子图、只依赖常量输入的运算，直接算出结果存成常量 | 这类计算的结果是确定的数学常数，不管换到哪个硬件上重新跑一遍答案都一样，没必要留到运行时反复计算 |
| 冗余结构消除 | 连续两次 `Transpose` 相互抵消、`Pad→Conv` 合并成一次带 padding 的 Conv | 只是图结构层面的逻辑化简，对所有设备都明确有利、没有副作用，判断过程完全不需要知道硬件是什么 |
| 权重精度压缩为 FP16（默认行为） | `ov.save_model()` 默认把权重从训练精度压成 FP16 | 只是压缩 IR 文件里存储的数值格式，所有设备插件加载时都能正确读取（即便某硬件不原生支持 FP16 计算，也能在加载阶段自行转换），这一步不涉及"选哪种执行方式最快"的硬件相关决策 |

这些优化的共同点是：**结果在数学上是恒等的，或者对任何硬件都毫无疑问地有利**，所以提前在转换期固化进 IR，一次计算、所有设备复用，没必要留给每个插件各自重新判断一遍。

### 硬件相关的图优化（编译阶段）

| 优化 | 例子 | 为什么必须按硬件决定 |
| -- | -- | -- |
| Conv + Activation 的 post-op 融合 | ReLU 融合进 Convolution 的 kernel 调用（见 [OpenVINO 算子融合](0563_Tools_OV_MO_Fusion) 里的"机制 B"） | 能不能融合、融合成什么样，取决于目标硬件的 kernel 库具体支持哪些 post-op 组合——[OpenVINO Ops Impl](0533_Tools_OV_OPs_Impl) 提到 CPU（oneDNN）能做到"Conv+BN+激活+裁剪"这种更深的融合，GPU（clDNN/oneDNN）受 kernel 编译机制限制，融合范围相对保守，同一个图在两种硬件上的融合结果不一样 |
| 内存分块格式选择 | CPU 选 `nChw8c`（AVX2）还是 `nChw16c`（AVX512），GPU 选 `bfyx` 还是 `b_fs_yx_fsv16`/`b_fs_yx_fsv32`（见 [OpenVINO 布局重排](0565_Tools_OV_MO_Layout)） | 最优分块粒度直接由硬件的向量寄存器宽度/GPU 线程子组宽度决定，转换期根本不知道这份 IR 最终会跑在哪款具体 CPU/GPU 上，这个信息只有编译期指定 `device_name` 之后才能拿到 |
| Reorder 节点的插入/消除 | 第一层卷积前是否需要 `bfyx→b_fs_yx_fsv16` 的格式转换，能不能用专门的融合 kernel 直接消掉（见 [OpenVINO GPU Reorder 实现](0529_Tools_OV_OPs_GPUImpl_Reorder) 的 `09_reorder_inputs` pass） | 相邻节点"偏好的格式"是否一致，以及该硬件是否存在能直接吃 `bfyx` 输入的特殊融合 kernel，都是特定设备插件的实现细节，必须在编译期按插件实际能力现场判断 |
| 量化后的 INT8 执行路径选择 | 同一个量化模型，哪些层能真正跑 INT8 kernel、哪些层退回 FP16/FP32 计算 | 取决于目标硬件对 INT8 kernel 的支持范围，是设备插件编译期才能确定的信息，不属于模型转换阶段 |

这些优化的共同点是：**"怎么做最优"这个问题的答案本身就是硬件架构参数的函数**，同一份 IR 在不同设备插件编译后，实际执行的算子数量、内存格式都可能不同——这也是为什么同一个 `.xml` 文件被认为是"设备无关"的，但它在 CPU 和 GPU 上编译出来的可执行图并不是同一张图。算子融合、布局重排在编译阶段具体落地到哪个 kernel，实现细节分别在 [OpenVINO Ops Impl（CPU/GPU 融合能力对比）](0533_Tools_OV_OPs_Impl)、[OpenVINO GPU Reorder 实现](0529_Tools_OV_OPs_GPUImpl_Reorder)、[OpenVINO GPU Permute 实现](0532_Tools_OV_OPs_GPUImpl_Permute)、[OpenVINO GPU Crop 实现](0530_Tools_OV_OPs_GPUImpl_Crop) 里按算子展开，本篇只做总览和导航；进一步的 INT8/INT4 权重压缩、训练后量化属于 NNCF 的范畴，见 [NNCF 总览](0451_Tools_OV_NNCF)。

## 代码示例

```bash
# CLI：ONNX/TensorFlow/TFLite/PaddlePaddle 模型转换
ovc model.onnx -o model.xml
```

```python
# Python API：PyTorch/JAX-Flax 模型必须用这种方式
import openvino as ov

ov_model = ov.convert_model(pytorch_model, example_input=example_input)
ov.save_model(ov_model, "model.xml")   # 默认权重压缩为 FP16
```

## Reference
- [Model Preparation - OpenVINO 官方文档](https://docs.openvino.ai/2025/openvino-workflow/model-preparation.html)
- [Transition from Legacy Conversion API - OpenVINO 官方文档](https://docs.openvino.ai/2023.3/openvino_docs_OV_Converter_UG_prepare_model_convert_model_MO_OVC_transition.html)
- [OpenVINO 算子融合](0563_Tools_OV_MO_Fusion)
- [OpenVINO BatchNorm 折叠](0564_Tools_OV_MO_BNFolding)
- [OpenVINO 布局重排](0565_Tools_OV_MO_Layout)
- [OpenVINO 优化（PrePostProcessor）](0509_Tools_OV_Optimizations)
- [NNCF 总览（权重/训练后压缩）](0451_Tools_OV_NNCF)
- [POT（已弃用，功能并入 NNCF）](0177_Tools_OV_POT)
- [OpenVINO 总览](0185_Tools_OV)

