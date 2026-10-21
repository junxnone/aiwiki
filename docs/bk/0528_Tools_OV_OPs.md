-----

| Title     | Tools OV OPs                                          |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-03-16T07:51:55Z`                                |
| Updated @ | `2026-10-21T01:20:40Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/528) |

-----

# OpenVINO Ops

  - OpenVINO 中对**算子（Operation，也常称 Layer，不过官方更推荐 Operation 术语）**
    的分类并非单一维度，而是围绕**功能、支持的框架、硬件适配、扩展机制**
    等多个角度划分，以下是核心分类方式及相关细节：

### 一、按算子的「来源/前端适配」分类

OpenVINO 通过「Frontends」组件适配不同深度学习框架的算子，将第三方框架算子转换为 OpenVINO
内部统一的算子表示，核心前端对应算子体系：

1.  **IR Frontend**：适配 OpenVINO 原生 IR（Intermediate
    Representation）格式的算子，是 OpenVINO 最基础的算子体系；
2.  **ONNX Frontend**：适配 ONNX 框架定义的算子，将 ONNX Operator 映射为 OpenVINO 内部算子；
3.  **Paddle Frontend**：适配 PaddlePaddle（飞桨）框架的算子；
4.  **TensorFlow/TensorFlow Lite Frontend**：适配 TensorFlow/TFLite
    框架的算子（代码中提及 TF1/TF2 模型适配，隐含对其算子的支持）。

> 代码依据：`src/docs/architecture.md` 中定义的 Frontends 组件包含
> `ir_fe`/`onnx_fe`/`paddle_fe`，对应不同框架算子的解析与转换。

这一步对应 [OpenVINO Model Optimizer 总览](0181_Tools_OV_MO) 里讲的"转换阶段"——框架算子到
OpenVINO 算子的翻译。

### 二、按算子的「硬件执行载体」分类

OpenVINO 的 Plugin 体系决定了算子最终在哪些硬件上执行，不同硬件插件对算子的支持/优化策略不同，核心分类：

1.  **CPU 算子**：适配 Intel CPU 的算子实现（`src/plugins/intel_cpu`），覆盖通用算子的
    x86/Arm 架构优化，具体实现机制见 [OPs CPU Impl](0534_Tools_OV_OPs_CPUImpl)；
2.  **GPU 算子**：适配 Intel GPU 的算子实现（`src/plugins/intel_gpu`），基于 OpenCL
    等底层框架优化，具体实现机制见 [OPs GPU Impl](0531_Tools_OV_OPs_GPUImpl)；
3.  **NPU 算子**：适配 Intel
    NPU（神经处理单元）的算子实现（`src/plugins/intel_npu`），面向低功耗推理场景，执行架构和
    CPU/GPU 完全不同（编译成专有二进制格式、用 Level Zero API 执行），详见 [OPs NPU
    Impl](0575_Tools_OV_OPs_NPUImpl)；
4.  **AUTO 算子调度**：由 AUTO Plugin 自动将不同算子分配到最优硬件（CPU/GPU/NPU 等）执行，无需手动指定；
5.  **HETERO/PROXY 算子**：HETERO Plugin 支持算子跨硬件拆分执行，PROXY Plugin
    适配代理模式下的算子调度。AUTO/HETERO/MULTI
    这几个调度类插件具体怎么决定"模型该在哪跑"，详见
    [AUTO/HETERO/MULTI 插件调度](0578_Tools_OV_OPs_PluginScheduling)。

> 代码依据：`.github/labeler.yml` 中按 `category: GPU/NPU/CPU/HETERO/PROXY`
> 划分插件代码，隐含算子的硬件适配分类。

CPU 和 GPU 两套插件在同一个算子上的实现思路差异很大（有没有"真正的 kernel"、怎么并行、怎么优化），详细对比见
[OpenVINO Ops Impl](0533_Tools_OV_OPs_Impl)。

### 三、按算子的「功能/语义」分类（逻辑维度）

OpenVINO 内部按算子的功能语义划分（无明确的"官方枚举列表"，但从示例/文档可归纳核心类别）：

1.  **基础算术算子**：加减乘除、矩阵运算、激活函数（如 ReLU、Sigmoid）等；
2.  **计算机视觉专用算子**：卷积（Conv）、池化（Pooling）、归一化（BN）、形变卷积、视觉特征提取相关算子（如
    AlexNet/GoogLeNet 中的分类算子）；
3.  **自然语言处理算子**：Transformer 相关（如 Attention、LayerNorm）、BERT
    基准测试相关算子（`openvino-samples/bert-benchmark`）、分词相关算子（SentencePiece
    tokenizer）；
4.  **推理流程专用算子**：与推理请求（InferRequest）、模型编译（CompiledModel）强相关的"伪算子"（如输入输出张量映射、预处理算子）；
5.  **自定义算子（Custom Layers）**：通过扩展机制支持的非原生算子（文档中「Extensibility mechanism,
    Custom layers」定义），用户可扩展未被 OpenVINO 原生支持的算子。简化版思路：继承 `ov::op::Op`
    实现自定义算子类，描述清楚输入输出 shape
    推导逻辑（`validate_and_infer_types`），再分别给要跑的设备（如
    CPU）注册一个具体的 kernel 实现：

<!-- end list -->

``` cpp
class MyCustomOp : public ov::op::Op {
public:
    OPENVINO_OP("MyCustomOp");
    // 构造函数、clone_with_new_inputs 等省略
    void validate_and_infer_types() override {
        // 描述输出 shape/类型怎么从输入推导出来
        set_output_type(0, get_input_element_type(0), get_input_partial_shape(0));
    }
};
```

### 四、按算子的「扩展/优化维度」分类

1.  **低精度转换算子**：用于模型量化优化的算子（`src/common/low_precision_transformations`），如
    INT8/FP16 精度的算子变体——这套图变换机制怎么把 [NNCF](0451_Tools_OV_NNCF) 产出的
    FakeQuantize 节点落地成真正的低精度执行图，详见 [LPT](0579_Tools_OV_LPT)；
2.  **预处理算子**：`src/common/preprocessing` 下的预处理相关算子（如
    resize、格式转换、归一化），在推理前对输入张量做处理；
3.  **原生支持算子 vs 扩展算子**：
      - 原生算子：OpenVINO 内置、无需额外扩展即可使用的算子；
      - 扩展算子：通过 `ov::frontend::extension`
        扩展机制适配的算子（`src/frontends/common/include/openvino/frontend/extension`）。

### 五、补充说明

1.  OpenVINO 并未在代码中提供「算子分类的静态枚举表」，而是通过**前端解析、插件实现、扩展机制** 动态管理算子；
2.  算子兼容性可通过 `core.query_model(model, device)` 接口查询（对应
    `hello-query-device` 示例），返回指定硬件对模型中各算子的支持情况；
3.  官方术语中，"Layer" 逐步被 "Operation" 替代，二者语义等价（参考
    `about-openvino/additional-resources/glossary.rst`）。

若需具体算子的支持列表，可参考 OpenVINO 官方文档的「Supported Operators」章节（代码中未直接枚举，但可通过
`ovc` 工具（Model conversion API）验证算子兼容性）。

## 从分类到执行：算子具体怎么跑起来

上面四种分类回答的是"算子是什么、属于哪一类"，但没有回答"算子在具体硬件上到底是怎么执行的"——这部分内容分散在几篇实现细节文章里，按阅读顺序建议：

1.  [OpenVINO Ops Impl](0533_Tools_OV_OPs_Impl)：先看 CPU 和 GPU
    两条执行路径最本质的差异——GPU 有独立的 OpenCL/SYCL
    kernel，CPU 没有真正意义上的"kernel"，只是基于 oneDNN 封装的算子逻辑；
2.  [OPs GPU Impl](0531_Tools_OV_OPs_GPUImpl) → [GPU Impl
    Reorder](0529_Tools_OV_OPs_GPUImpl_Reorder) / [GPU Impl
    Crop](0530_Tools_OV_OPs_GPUImpl_Crop) / [GPU Impl
    Permute](0532_Tools_OV_OPs_GPUImpl_Permute)：GPU 侧按具体算子展开的 kernel
    实现细节；
3.  [OPs CPU Impl](0534_Tools_OV_OPs_CPUImpl) →
    [Snippets](0576_Tools_OV_OPs_CPUImpl_Snippets)：CPU 侧的 JIT
    代码生成和子图融合编译机制；
4.  [OPs NPU Impl](0575_Tools_OV_OPs_NPUImpl)：和 CPU/GPU 完全不同的专用硬件执行架构。

这些实现细节最终都会反映到**图优化**阶段的几个核心主题上：[算子融合](0563_Tools_OV_MO_Fusion)（多个算子能不能合并成一次调用，CPU/GPU
分别对应 [Snippets](0576_Tools_OV_OPs_CPUImpl_Snippets) 和 [oneDNN
Post-ops](0577_Tools_OV_OneDNN_PostOps)
两种落地机制）、[布局重排](0565_Tools_OV_MO_Layout)（数据在内存里该用什么排布执行最快）、以及
[LPT](0579_Tools_OV_LPT)（INT8
量化信息在图里具体怎么落地）——这些都是"算子具体怎么执行"这个问题在编译期的直接体现。模型在多个设备间具体怎么调度，见
[AUTO/HETERO/MULTI
插件调度](0578_Tools_OV_OPs_PluginScheduling)；怎么验证上述优化是否真的生效，见
[OpenVINO 性能分析工具合集](0580_Tools_OV_Profiling)。

## Reference

  - [OpenVINO Model Optimizer 总览](0181_Tools_OV_MO)
  - [OpenVINO Ops Impl（CPU/GPU 执行方式对比）](0533_Tools_OV_OPs_Impl)
  - [OPs GPU Impl](0531_Tools_OV_OPs_GPUImpl)
  - [OPs CPU Impl](0534_Tools_OV_OPs_CPUImpl)
  - [算子融合](0563_Tools_OV_MO_Fusion)
  - [布局重排](0565_Tools_OV_MO_Layout)
  - [NNCF 总览](0451_Tools_OV_NNCF)
  - [OPs NPU Impl](0575_Tools_OV_OPs_NPUImpl)
  - [Snippets](0576_Tools_OV_OPs_CPUImpl_Snippets)
  - [oneDNN Post-ops](0577_Tools_OV_OneDNN_PostOps)
  - [AUTO/HETERO/MULTI 插件调度](0578_Tools_OV_OPs_PluginScheduling)
  - [LPT](0579_Tools_OV_LPT)
  - [OpenVINO 性能分析工具合集](0580_Tools_OV_Profiling)
  - [OpenVINO 总览](0185_Tools_OV)
