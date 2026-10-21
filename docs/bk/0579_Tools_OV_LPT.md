-----

| Title     | Tools OV LPT                                          |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-21T01:14:41Z`                                |
| Updated @ | `2026-10-21T01:14:41Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/579) |

-----

# LPT（Low Precision Transformations，低精度转换）

> 本文讲的是"INT8 量化信息在 OpenVINO
> 计算图里具体怎么被插入、传播、最终落地成真正的低精度计算"——这是**运行时/图优化侧**的机制，和
> [NNCF](0451_Tools_OV_NNCF) 的训练/校准侧量化是完全不同的两个阶段：NNCF 决定"量化到多少 bit、scale
> 是多少"，LPT 决定"图里这些量化信息该怎么在算子之间搬运、最终怎么融合进实际执行"。

## FakeQuantize：量化信息在图里的载体

无论模型是用 [NNCF 训练后量化](0561_Tools_OV_NNCF_PTQ) 还是其他框架的量化流程产出的，OpenVINO IR
里表示"这里需要量化"的方式都是同一个算子：**FakeQuantize**。它同时表达两件事——先把浮点值映射到一个整数区间（Quantize），再把这个整数值映射回浮点数值范围（Dequantize）——训练/校准阶段，FakeQuantize
的作用是让网络在浮点精度下"模拟"量化误差；到了部署阶段，LPT 要做的就是把这个"模拟"落地成真正的低精度计算。

IR 文件层面，**低精度 IR 和普通 FP16/FP32 IR 唯一的区别就是图里存在 FakeQuantize
节点**。这个设计是故意做成"设备无关"的：如果目标设备支持低精度推理，插件会识别这些
FakeQuantize 子图并按低精度方式执行；如果不支持，就忽略这个提示，按浮点精度照常执行——同一份 IR 可以在支持和不支持 INT8
的设备上都能跑，只是能不能吃到 INT8 加速的区别。

## LPT 的流水线：怎么把 FakeQuantize 变成真正的低精度图

LPT 是一套图变换的集合（nGraph/OpenVINO transformation
的一种），只在检测到模型确实被量化过时才会启用（跳过未量化模型，节省加载时间）。核心流程分几步：

1.  **FakeQuantize 分解**：把一个 FakeQuantize 节点拆成两部分——一个新的、输出精度已经是低精度（INT8）的
    Quantize 节点，加上一个独立的 Dequantize 节点（反量化回浮点）；
2.  **Markup（标记）阶段**：
      - **PropagatePrecisions**：标记哪些算子是"精度保持"的（比如 Reshape
        不改变数值，可以让低精度一直传播下去），决定
        FakeQuantize 输出端口最终该用什么精度；
      - **AlignQuantizationIntervals**：多个 FakeQuantize 节点的量化区间可能不一致（比如
        Concat 之前的多路输入），需要先对齐量化区间，才能正确合并量化信息；
      - **AlignQuantizationParameters**：类似地，对齐量化参数（scale/zero-point），服务于
        Concat 这类需要先对齐输入才能正确执行的算子；
3.  **Dequantize 传播**：把 Dequantize 操作尽量往后"挪"，让 Convolution、MatMul
    这些计算密集型算子能直接吃到低精度输入进行计算，而不是"反量化→计算→再量化"这种低效的来回转换；
4.  **Cleanup（清理）**：把能合并的 Convert/Dequantize 操作融合进相邻节点（比如把 Dequantize
    的乘法直接并入下一个 FakeQuantize，或者用常量折叠直接算掉），清理掉不再需要的中间节点。

这套"分解 → 标记对齐 → 传播 → 清理融合"的流程，本质上和 [算子融合](0563_Tools_OV_MO_Fusion) 一文里"机制
A（代数合并）"是同一类思想——Dequantize 的乘法本身就是一个线性变换，能合并进相邻算子的权重里。

## 权重侧的优化

权重（Weight）和激活值的量化处理方式不完全一样：权重在图里通常表示为"浮点常量 + 后面接一个 FakeQuantize"，LPT
会把这部分直接在**图编译期**优化掉——权重本身在内存里就只保留低精度的常量值，推理时再用一个 Convert
算子把它解包回浮点参与计算，不需要像激活值那样在运行时反复做量化/反量化。

## 和 NNCF 的分工

|      | NNCF                                                 | LPT                                     |
| ---- | ---------------------------------------------------- | --------------------------------------- |
| 发生阶段 | 训练后/训练时，模型转换之前                                       | 模型转换成 IR 之后，设备编译阶段                      |
| 决定什么 | 量化到多少 bit、用什么算法（PTQ/QAT/AWQ...）、scale/zero-point 怎么算 | 图里的 FakeQuantize 节点怎么被解析、传播、最终融合进实际执行路径 |
| 产出物  | 带 FakeQuantize 节点的 IR                                | 真正按低精度执行的可执行图                           |

两者是流水线上的前后两道工序：没有 NNCF 产出的 FakeQuantize 信息，LPT 无事可做；没有 LPT
把这些信息落地成真正的低精度执行路径，NNCF
量化出来的模型也只是"看起来量化了"，实际推理时不会有任何速度提升。

## Reference

  - [OpenVINO Low Precision Transformations -
    官方文档](https://docs.openvino.ai/2023.3/openvino_docs_OV_UG_lpt.html)
  - [Step 2. Markup Transformations -
    官方文档](https://docs.openvino.ai/2024/documentation/openvino-extensibility/openvino-plugin-library/advanced-guides/low-precision-transformations/step2-markup.html)
  - [Low Precision IR (INT8 Inference) -
    官方文档](https://docs.openvino.ai/2026/documentation/openvino-ir-format/intermediate-representation-int8-inference.html)
  - [NNCF 总览](0451_Tools_OV_NNCF)
  - [NNCF Post-training Quantization](0561_Tools_OV_NNCF_PTQ)
  - [算子融合](0563_Tools_OV_MO_Fusion)
