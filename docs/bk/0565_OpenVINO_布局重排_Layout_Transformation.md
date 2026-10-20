-----

| Title     | OpenVINO 布局重排 Layout Transformation                   |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-10-20T01:42:41Z`                                |
| Updated @ | `2026-10-20T01:42:41Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/565) |

-----

# OpenVINO 布局重排（Layout Transformation）

> 本文是 OpenVINO Model Optimizer / 模型转换总览的深入篇。"布局（Layout）"这个词在 OpenVINO
> 的文档里会在三个完全不同的层级出现，很容易混淆——本文的主要目的是把这三层理清楚，并把分散在各篇里的相关内容串起来，具体的
> API 用法/kernel 实现细节分别在对应文章里，不在本文重复。

## 为什么会有 NHWC 和 NCHW 两种布局

一个图像/特征图张量有 4 个维度：批次（N）、通道（C）、高（H）、宽（W）。不同训练框架对这 4
个维度在内存里的排列顺序约定不同——TensorFlow 默认用
**NHWC**（通道放在最后），PyTorch、OpenVINO 默认用
**NCHW**（通道放在批次之后）。两种排列在数学上描述的是同一个张量，只是内存里数值的物理顺序不同，这个差异是模型从训练框架搬到推理引擎时必须处理的第一个问题——顺序不对，卷积等算子算出来的结果就是错的。

## 三个层级，不要混为一谈

| 层级            | 关心的问题                                 | 谁来设置/决定                                                                                                | 对应文章                                                                                                                      |
| ------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **框架/模型声明层**  | 这个模型的输入张量"逻辑上"是 NHWC 还是 NCHW？         | 训练框架的默认约定，转换时作为模型的 `Layout` 信息记录下来                                                                     | 本文                                                                                                                        |
| **转换/预处理层**   | 用户送进来的实际数据是什么布局？要不要在推理引擎内部转换成模型期望的布局？ | 用户通过 `PrePostProcessor` API 显式设置 `tensor()`/`model()` 的 `Layout`，两者不一致时框架会自动插入 Transpose 节点完成转换        | [OpenVINO 优化（PrePostProcessor 用法）](0509_Tools_OV_Optimizations)                                                           |
| **设备插件内部执行层** | 这个硬件（CPU/GPU）用什么样的**物理内存排布**执行计算最快？   | 完全由设备插件内部决定，用户看不见也不需要关心，是比 NHWC/NCHW 更细的"分块（Blocked）格式"，如 CPU 的 `nChw16c`、GPU 的 `bfyx`/`b_fs_yx_fsv16` | [OpenVINO GPU Reorder 实现](0529_Tools_OV_OPs_GPUImpl_Reorder)、[OpenVINO GPU Permute 实现](0532_Tools_OV_OPs_GPUImpl_Permute) |

### 第二层：转换/预处理层怎么转换

当输入数据的实际布局和模型期望的布局不一致时（比如用户直接喂 NHWC 的图像数据，但模型图是按 NCHW 写的），需要显式声明两边的
Layout，让框架自动在两者之间插入 Transpose：

``` python
from openvino.preprocess import PrePostProcessor
from openvino import Layout

ppp = PrePostProcessor(model)
ppp.input(input_name).tensor().set_layout(Layout('NHWC'))   # 用户实际传入的数据布局
ppp.input(input_name).model().set_layout(Layout('NCHW'))    # 模型计算图期望的布局
model = ppp.build()   # 两者不一致，自动插入转换
```

完整的 `PrePostProcessor` API（包括设置
`ElementType`/`Shape`/`ColorFormat`、resize、mean/scale 等）详见 [OpenVINO
优化](0509_Tools_OV_Optimizations)，本文不重复。历史上旧版 `mo` 工具用的是 CLI 参数
`--layout "input(NCHW->NHWC)"` 或分开的
`--source_layout`/`--target_layout`，效果等价，但旧版 CLI 已经随 Model Optimizer
一起被移除（见 [Model Optimizer 总览](0181_Tools_OV_MO)），当前应该统一用
`PrePostProcessor`。

### 第三层：设备插件内部的"分块格式"是另一回事

NCHW/NHWC 描述的是 4 个维度**逻辑上**的排列顺序，但 CPU/GPU 实际执行计算时，为了让向量化指令（CPU 的
AVX512）或并行线程组（GPU 的子组）能连续访问内存，往往会把通道维度**再拆分成更细的分块**——比如 CPU 常用的
`nChw16c` 是把通道维度按 16 个一组分块重排，让一条 AVX512 指令刚好处理一组；GPU 常用的 `b_fs_yx_fsv16`
同理是面向 GPU 线程子组宽度的分块格式。这一层转换由 [Reorder
kernel](0529_Tools_OV_OPs_GPUImpl_Reorder) 负责，和 `Permute`（单纯做维度顺序交换，如
`nchw→nhwc`，见 [OpenVINO GPU Permute
实现](0532_Tools_OV_OPs_GPUImpl_Permute)）是两种不同的操作——Reorder
转换的是"内存分块方式"，Permute
转换的是"维度逻辑顺序"，两者有时会一起出现、也可能被设备插件融合掉（参考算子融合深入篇，及
[Model Optimizer 总览](0181_Tools_OV_MO)
里的链接）。这一层完全是插件内部实现细节，用户不能也不需要手动指定。

## 常见分块格式一览：怎么排布、什么时候用、怎么优化性能

第三层提到的"分块格式"不是只有一种，CPU 和 GPU
各自有一组格式，分别面向各自的向量化/并行宽度设计。核心思路都一样：**把通道维度拆成"组外顺序
× 组内连续"两段，让一条向量指令/一组并行线程刚好吃掉组内这一段**，但具体分多大的组、按什么规则分组，取决于硬件的向量宽度或线程子组宽度。

| 格式                          | 排布方式                                                                                                        | 使用场景                                                                                  | 怎么优化性能                                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `nChw8c`（CPU）               | 通道维度按 8 个一组分块，组内连续存放，偏移量公式 `offset(n,c,h,w) = n*CHW + (c/8)*HW*8 + h*W*8 + w*8 + (c%8)`——同一组的 8 个通道在内存里挨在一起 | CPU 只支持到 **AVX2**（256-bit 向量寄存器，一条指令处理 8 个 fp32）时选用                                   | 向量化加载/计算一次刚好吃满 8 个连续通道的数据，不用额外的数据重排（gather/shuffle）就能喂满寄存器                                                   |
| `nChw16c`（CPU）              | 和 `nChw8c` 同样的分块逻辑，只是组大小变成 16                                                                               | CPU 支持 **AVX512**（512-bit 向量寄存器，一条指令处理 16 个 fp32）时选用，是目前 oneDNN 在现代 Intel CPU 上最常用的格式 | 原理同上，只是向量宽度翻倍，单条指令吞吐更高；如果模型硬性要求用线性 `nchw` 格式（比如自定义算子不支持分块格式），oneDNN 会退化成不带分块优化的实现（如基于 GEMM 的卷积），性能明显低于分块格式路径 |
| `bfyx`（GPU，线性格式）            | 维度顺序为 `[b,f,y,x]`，不分块，详见 [OpenVINO GPU Reorder 实现](0529_Tools_OV_OPs_GPUImpl_Reorder)                       | 通道数很少（如 RGB 3 通道的第一层输入）、或者作为模型输入输出层与外部数据交换的格式                                         | 本身不追求向量化效率，优点是通用、不需要额外转换，常作为"起点"和"终点"格式                                                                      |
| `b_fs_yx_fsv16`（GPU）        | 通道按 16 个一组分块，嵌入到空间维度排布里，详细的内存排布示例见 [OpenVINO GPU Reorder 实现](0529_Tools_OV_OPs_GPUImpl_Reorder)             | 面向 16 线程子组（Sub-group）宽度的 GPU，是目前最常用的 GPU 分块格式                                         | 让一个 GPU 线程子组内的 16 个线程连续访问内存，同时契合 Intel GPU 以 64 字节缓存行为单位的读取特性                                                |
| `b_fs_yx_fsv32`（GPU）        | 和 `fsv16` 同样的分块逻辑，组大小变成 32                                                                                  | 面向 32 线程子组宽度的 GPU                                                                     | 原理同 `fsv16`，子组越宽、单次能并行处理的通道越多，但通道数不是 32 倍数时补零浪费也更大（见上一节的补零开销）                                                |
| `bs_fs_yx_bsv16_fsv16`（GPU） | 批次（b）和通道（f）两个维度同时分块                                                                                         | 大批次（Batch）推理场景                                                                        | 在通道分块的基础上，批次维度也做类似的分组连续排布，让大批次场景下的并行度进一步提升                                                                   |
| `b_fs_zyx_fsv32`（GPU）       | 在 3D 张量（多一个深度维度 z）基础上做和 `fsv32` 一样的通道分块                                                                     | 3D 卷积场景（如医学影像的体数据）                                                                    | 原理同 `fsv32`，只是把分块机制从 2D 扩展到 3D 空间维度                                                                          |

**共同规律**：分块越细（组越小，如 CPU 的 8 对
16），对硬件向量宽度的适配越保守，兼容性越好但峰值性能稍低；分块越粗（组越大），需要硬件向量/并行宽度足够宽才能吃满，否则多余的部分会被补零浪费掉（对应前面"张量维度对齐/补零"小节提到的开销）。设备插件在编译阶段会根据当前硬件的实际能力（CPU
支持到哪一级指令集、GPU
子组宽度是多少）自动选择最合适的分块格式，这个选择过程用户看不到也不需要手动干预，只有在排查性能问题时才需要了解这些格式分别对应什么。

## 怎么判断该关心哪一层

| 场景                         | 该看哪一层                                                                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 不知道为什么推理结果不对，怀疑输入数据通道顺序搞错了 | 第二层：检查 `PrePostProcessor` 的 `tensor()`/`model()` Layout 设置是否匹配实际数据                                                                     |
| 想知道模型文件（IR）里声明的输入布局是什么     | 第一层：看模型转换时记录的 `Layout` 信息，或者看训练框架的默认约定                                                                                                 |
| 做性能调优，关心不同硬件为什么选了不同的内存格式   | 第三层：按设备分别看 [GPU Reorder](0529_Tools_OV_OPs_GPUImpl_Reorder)/[GPU Permute](0532_Tools_OV_OPs_GPUImpl_Permute) 实现，这一层不需要用户手动干预，仅用于理解性能表现 |

## Reference

  - [Understanding Memory Formats - oneDNN 官方文档（nChw8c/nChw16c 排布与
    AVX2/AVX512
    对应关系）](https://uxlfoundation.github.io/oneDNN/dev_guide_understanding_memory_formats.html)
  - [OpenVINO GPU Memory Formats
    官方文档](https://github.com/openvinotoolkit/openvino/blob/master/src/plugins/intel_gpu/docs/gpu_memory_formats.md)
  - [OpenVINO 优化（PrePostProcessor/Layout
    API）](0509_Tools_OV_Optimizations)
  - [OpenVINO GPU Reorder 实现](0529_Tools_OV_OPs_GPUImpl_Reorder)
  - [OpenVINO GPU Permute 实现](0532_Tools_OV_OPs_GPUImpl_Permute)
  - [OpenVINO GPU Crop 实现](0530_Tools_OV_OPs_GPUImpl_Crop)
  - [Batch, Shape and Layout - OpenVINO
    官方文档](https://docs.openvino.ai/2025/model-server/ovms_docs_shape_batch_layout.html)
  - [OpenVINO Model Optimizer 总览](0181_Tools_OV_MO)
