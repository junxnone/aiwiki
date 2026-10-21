---
Title | Tools OV OPs GPUImpl
-- | --
Created @ | `2026-03-17T01:54:12Z`
Updated @| `2026-10-21T01:22:27Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/531)

---
# OPs GPU Impl

- OpenVINO GPU Ops Impl 一般为 OpenCL 实现，可以在 GPU 上大批量并发执行的 kernel

## 架构背景：clDNN → intel_gpu 插件

GPU 插件历史上是一个独立的库，叫 **clDNN**（compute Library for Deep Neural Networks），后来被合并进 OpenVINO 主仓库，成为现在 `src/plugins/intel_gpu` 的一部分——文档和代码里有时还会看到 "clDNN" 这个历史名称，指的就是这套 GPU 算子实现体系。核心流水线是：模型（`ov::Model`）→ 转换成 clDNN 内部的图表示（`cldnn::topology`）→ 编译成可执行的 GPU 图（`cldnn::network`）→ 实际在 GPU 上执行。

**集成/独立显卡的 kernel 来源不同**：编译阶段插件会检测目标硬件有没有"脉动阵列"（Systolic Array，Arc/Flex/Max 系列独立显卡才有）——有的话，计算密集型层（如 Convolution）会优先用 **oneDNN** 提供的 GPU kernel（能利用脉动阵列把算力拉满）；没有脉动阵列的集成显卡，则继续用 OpenVINO 自己写的 OpenCL kernel（也就是传统意义上的 clDNN kernel）。两套 kernel 共用同一个 OpenCL context 和显存 buffer，互相调用不需要额外的拷贝开销。

## 常见 Ops

- **Reorder**：张量内存格式/数据类型转换（如 `bfyx`→`b_fs_yx_fsv16` 阻塞格式、`f32`→`f16`），详见 [GPU Impl Reorder](0529_Tools_OV_OPs_GPUImpl_Reorder)；
- **Convolution**：卷积，计算密集型算子，独立显卡上优先走 oneDNN kernel；
- **Crop**：按起始坐标+尺寸从张量中截取子区域，支持直接在阻塞格式上操作，详见 [GPU Impl Crop](0530_Tools_OV_OPs_GPUImpl_Crop)；
- **Concat**：把多个张量在指定维度上拼接起来；
- **Pooling**：池化（最大/平均池化等），对局部窗口做下采样；
- **Reshape**：改变张量的 shape，不改变底层数据和元素总数（纯逻辑操作，不涉及真正的内存重排）；
- **Eltwise**：逐元素运算（加减乘除等），是 [算子融合](0563_Tools_OV_MO_Fusion) 里最常被融合的一类算子；
- **Gemm**：通用矩阵乘法（General Matrix Multiply），Attention/全连接层的核心计算；
- **Softmax**：归一化指数函数，常见于分类输出层和 Attention 里的权重归一化；
- **Permute**：只调整维度的逻辑顺序（如 `bfyx`→`byxf`），是 Reorder 的一个更"纯粹"的子集，详见 [GPU Impl Permute](0532_Tools_OV_OPs_GPUImpl_Permute)；
- **Activation**：激活函数（ReLU/Sigmoid/Swish 等），通常会作为 post-op 融合进前面的 Convolution/Gemm 里执行，而不是单独起一个 kernel。

GPU 侧和 CPU 侧（oneDNN 封装的算子逻辑 + JIT 代码生成，见 [OPs CPU Impl](0534_Tools_OV_OPs_CPUImpl)）在执行架构上的根本差异，详见 [OpenVINO Ops Impl](0533_Tools_OV_OPs_Impl)。

## Convolution：算法选择不只是"调 kernel"

卷积是 GPU 上最重的计算，同一个卷积在不同条件下可能被编译成完全不同的算法，而不只是简单地"调用一个 kernel"：

- **独显 + oneDNN 路径**：检测到脉动阵列硬件时，走 oneDNN 的 GPU kernel，oneDNN 内部会根据卷积的具体形状（输入通道数、卷积核尺寸、步长）在多种实现之间自动选择；
- **核显 + 自研 OpenCL kernel 路径**：没有脉动阵列的硬件上，用 clDNN 自己的 OpenCL kernel，常见的两类算法：
  - **Winograd 最小滤波算法**：针对小卷积核（最典型是 3×3、步长为 1）做数学变换，用更多的加法换取更少的乘法——乘法在硬件上通常比加法更"贵"，这种变换能明显减少卷积核心计算量，但只对小核、步长 1 的场景收益明显；
  - **im2col + GEMM**：把卷积操作展开（unfold）成一个大矩阵乘法问题——用空间换时间，先把输入特征图按卷积窗口展开成一个大矩阵，再调用高度优化的通用矩阵乘法（GEMM）内核完成计算，适用面更广（不挑卷积核尺寸/步长），但会占用更多临时内存；
  - 直接卷积（Direct Convolution）：不做展开，直接按滑窗方式计算，适合特定形状（如 1×1 卷积，本质上就是逐像素的矩阵乘法，不需要 im2col）。
- 具体选哪种算法由插件在图编译阶段根据卷积的具体参数（形状、步长、硬件能力）自动决定，用户一般不需要手动指定。

## Reference
- Lavin, A. & Gray, S. (2016). Fast Algorithms for Convolutional Neural Networks (Winograd). [arXiv:1509.09308](https://arxiv.org/abs/1509.09308)
- [OpenVINO GPU Plugin 架构说明（GitHub Wiki）](https://github.com/openvinotoolkit/openvino/wiki/GPUPluginStructure)
- [OpenVINO is Powered by oneDNN for the Best Performance on Discrete GPU（官方博客）](https://blog.openvino.ai/blog-posts/openvino-is-powered-by-onednn-for-the-best-performance-on-discrete-gpu)
- [intel_gpu 插件源码 README（GitHub）](https://github.com/openvinotoolkit/openvino/blob/master/src/plugins/intel_gpu/README.md)
- [GPU Impl Reorder](0529_Tools_OV_OPs_GPUImpl_Reorder)
- [GPU Impl Crop](0530_Tools_OV_OPs_GPUImpl_Crop)
- [GPU Impl Permute](0532_Tools_OV_OPs_GPUImpl_Permute)
- [OpenVINO Ops Impl](0533_Tools_OV_OPs_Impl)
- [OpenVINO Ops](0528_Tools_OV_OPs)

