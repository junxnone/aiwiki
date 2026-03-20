---
Title | Tools OV OPs
-- | --
Created @ | `2026-03-16T07:51:55Z`
Updated @| `2026-03-20T01:50:43Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/528)

---
# OpenVINO Ops
- OpenVINO 中对**算子（Operation，也常称 Layer，不过官方更推荐 Operation 术语）** 的分类并非单一维度，而是围绕**功能、支持的框架、硬件适配、扩展机制** 等多个角度划分，以下是核心分类方式及相关细节：

### 一、按算子的「来源/前端适配」分类
OpenVINO 通过「Frontends」组件适配不同深度学习框架的算子，将第三方框架算子转换为 OpenVINO 内部统一的算子表示，核心前端对应算子体系：
1. **IR Frontend**：适配 OpenVINO 原生 IR（Intermediate Representation）格式的算子，是 OpenVINO 最基础的算子体系；
2. **ONNX Frontend**：适配 ONNX 框架定义的算子，将 ONNX Operator 映射为 OpenVINO 内部算子；
3. **Paddle Frontend**：适配 PaddlePaddle（飞桨）框架的算子；
4. **TensorFlow/TensorFlow Lite Frontend**：适配 TensorFlow/TFLite 框架的算子（代码中提及 TF1/TF2 模型适配，隐含对其算子的支持）。

> 代码依据：`src/docs/architecture.md` 中定义的 Frontends 组件包含 `ir_fe`/`onnx_fe`/`paddle_fe`，对应不同框架算子的解析与转换。

### 二、按算子的「硬件执行载体」分类
OpenVINO 的 Plugin 体系决定了算子最终在哪些硬件上执行，不同硬件插件对算子的支持/优化策略不同，核心分类：
1. **CPU 算子**：适配 Intel CPU 的算子实现（`src/plugins/intel_cpu`），覆盖通用算子的 x86/Arm 架构优化；
2. **GPU 算子**：适配 Intel GPU 的算子实现（`src/plugins/intel_gpu`），基于 OpenCL 等底层框架优化；
3. **NPU 算子**：适配 Intel NPU（神经处理单元）的算子实现（`src/plugins/intel_npu`），面向低功耗推理场景；
4. **AUTO 算子调度**：由 AUTO Plugin 自动将不同算子分配到最优硬件（CPU/GPU/NPU 等）执行，无需手动指定；
5. **HETERO/PROXY 算子**：HETERO Plugin 支持算子跨硬件拆分执行，PROXY Plugin 适配代理模式下的算子调度。

> 代码依据：`.github/labeler.yml` 中按 `category: GPU/NPU/CPU/HETERO/PROXY` 划分插件代码，隐含算子的硬件适配分类。

### 三、按算子的「功能/语义」分类（逻辑维度）
OpenVINO 内部按算子的功能语义划分（无明确的“官方枚举列表”，但从示例/文档可归纳核心类别）：
1. **基础算术算子**：加减乘除、矩阵运算、激活函数（如 ReLU、Sigmoid）等；
2. **计算机视觉专用算子**：卷积（Conv）、池化（Pooling）、归一化（BN）、形变卷积、视觉特征提取相关算子（如 AlexNet/GoogLeNet 中的分类算子）；
3. **自然语言处理算子**：Transformer 相关（如 Attention、LayerNorm）、BERT 基准测试相关算子（`openvino-samples/bert-benchmark`）、分词相关算子（SentencePiece tokenizer）；
4. **推理流程专用算子**：与推理请求（InferRequest）、模型编译（CompiledModel）强相关的“伪算子”（如输入输出张量映射、预处理算子）；
5. **自定义算子（Custom Layers）**：通过扩展机制支持的非原生算子（文档中「Extensibility mechanism, Custom layers」定义），用户可扩展未被 OpenVINO 原生支持的算子。

### 四、按算子的「扩展/优化维度」分类
1. **低精度转换算子**：用于模型量化优化的算子（`src/common/low_precision_transformations`），如 INT8/FP16 精度的算子变体；
2. **预处理算子**：`src/common/preprocessing` 下的预处理相关算子（如 resize、格式转换、归一化），在推理前对输入张量做处理；
3. **原生支持算子 vs 扩展算子**：
   - 原生算子：OpenVINO 内置、无需额外扩展即可使用的算子；
   - 扩展算子：通过 `ov::frontend::extension` 扩展机制适配的算子（`src/frontends/common/include/openvino/frontend/extension`）。

### 五、补充说明
1. OpenVINO 并未在代码中提供「算子分类的静态枚举表」，而是通过**前端解析、插件实现、扩展机制** 动态管理算子；
2. 算子兼容性可通过 `core.query_model(model, device)` 接口查询（对应 `hello-query-device` 示例），返回指定硬件对模型中各算子的支持情况；
3. 官方术语中，“Layer” 逐步被 “Operation” 替代，二者语义等价（参考 `about-openvino/additional-resources/glossary.rst`）。

若需具体算子的支持列表，可参考 OpenVINO 官方文档的「Supported Operators」章节（代码中未直接枚举，但可通过 `ovc` 工具（Model conversion API）验证算子兼容性）。
