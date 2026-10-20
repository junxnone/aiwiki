---
Title | Tools OV OPs GPUImpl Reorder
-- | --
Created @ | `2026-03-16T08:00:53Z`
Updated @| `2026-10-20T02:07:51Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/529)

---
# GPU Impl Reorder

- 负责张量内存格式 / 数据类型的转换 (从 bfyx 格式转为 b_fs_yx_fsv16 阻塞格式、从 f32 转为 f16 )
- 属于 OpenVINO 布局体系里"设备插件内部执行层"的具体实现，和框架/预处理层的 Layout 转换是两回事，区分方式见 [OpenVINO 布局重排](0565_Tools_OV_MO_Layout)


## 格式转换

- 维度缩写：b（batch，批次）、f（feature，通道 / 特征）、y（height，高度）、x（width，宽度）；
- bfyx：线性格式（也叫通用格式），维度顺序为 [b, f, y, x]，内存中按 “批次→通道→高度→宽度” 依次排布；
- b_fs_yx_fsv16：阻塞格式（Blocked Format），fs=feature slice（通道分片），fsv16=feature slice size 16（每个通道分片包含 16 个通道），核心是把通道维度按 16 个一组拆分并嵌入到空间维度（y/x）的排布中。`[b, f_group, y, x, f_slice]`

> Intel GPU 的硬件缓存是按 “缓存行（Cache Line）” 读取数据的（通常 64 字节），b_fs_yx_fsv16 格式的设计完全适配这一特性

- **bfyx 的内存排布（线性）**

```
b0 → f0 → y0 → x0 → 
b0 → f0 → y0 → x1 → 
b0 → f0 → y1 → x0 → 
b0 → f0 → y1 → x1 → 
b0 → f1 → y0 → x0 →
 ... → 
b0 → f31 → y1 → x1
```

- **b_fs_yx_fsv16 的排布逻辑（阻塞）**

```
b0 → fg0 → y0 → x0 → fs0 →
b0 → fg0 → y0 → x0 → fs1 →
b0 → fg0 → y0 → x0 → fs2 →
b0 → fg0 → y0 → x0 → fs3 →
b0 → fg0 → y0 → x0 → fs4 →
... →
b0 → fg0 → y0 → x0 → fs14 →
b0 → fg0 → y0 → x0 → fs15 →
b0 → fg0 → y0 → x1 → fs0 →
...  →
```

- 张量的逻辑 shape（维度大小）不变，但物理内存的排布 shape（存储维度）会变
- 存储维度 : bfyx `[2, 32, 2, 2]` -> b_fs_yx_fsv16 `[2,2,2,2,16]`

### 其他格式转换


源格式 | 目标格式 | 适用场景
-- | -- | --
bfyx（线性） | b_fs_yx_fsv32 | 32 线程子组的 GPU（通道按 32 分组）
bfzyx（3D） | b_fs_zyx_fsv32 | 3D 卷积（如医学影像）
bfyx | bs_fs_yx_bsv16_fsv16 | 批次 + 通道双分组（大批次场景）
nhwc（TensorFlow） | bfyx | 跨框架模型适配（TF→OpenVINO）


## 数据类型转换 

常见类型转换 | 应用场景
-- | --
f32 ↔ f16 | 降低显存占用、提升计算速度（GPU 对 f16 原生支持更好）
f32 ↔ u8/i8 | 量化模型推理（INT8 量化后的数据类型适配）
f16 ↔ bf16 | 适配 Arc GPU 的 bf16 计算单元
i32 ↔ i64 | 少数算子的输入类型要求（如索引类算子）


## 张量维度对齐 / 补零 / 裁剪

阻塞格式要求通道维度能被分片大小整除（`b_fs_yx_fsv16` 要求通道数是 16 的倍数），如果原始通道数不是整除的，Reorder 会把通道数**向上对齐到最近的整数倍**，多出来的部分用 0 填充：

- **1. 通道数对齐（最常见）**：例如通道数为 20 的张量转成 `b_fs_yx_fsv16`，20 不是 16 的倍数，会被对齐到 32（`2×16`），多出来的 12 个通道全部补零——这意味着后续卷积计算里，这 12 个通道上的乘加全部是"陪跑"的无效计算，通道数越接近分片大小的整数倍，补零造成的算力浪费比例越小；
- **2. 空间维度对齐（如高度/宽度）**：部分分块格式（尤其是面向特定 kernel 实现的格式）也会要求 y/x 维度对齐到某个粒度，原理和通道对齐一致，不再展开。

补零不是免费的——补零部分仍然要占用显存、仍然会被卷积 kernel 当作正常数据参与乘加（只是结果恒为 0，不影响正确性，但浪费了算力和带宽），这也是为什么通道数是 8/16/32 这类 2 的幂次在 Intel GPU 上往往比奇怪的通道数（比如 20、50）效率更高的原因之一。

## 分块格式的代价：为什么会插入 Reorder 节点，开销有多大

阻塞格式对卷积这类计算密集算子更高效，但**数据从线性格式（bfyx）转换到阻塞格式（b_fs_yx_fsv16 等）这个转换动作本身不是免费的**——它是一次完整的"读全部数据 + 按新排布写全部数据"的内存搬运，官方文档里直接称之为"an extra global memory pass"（一次额外的全局内存读写），实打实地增加延迟和带宽占用，不是单纯的格式标签切换。

GPU 插件在图优化阶段有专门一个 pass 叫 `09_reorder_inputs`，负责给每个 primitive 决定"最优格式"，再在相邻节点格式不一致的地方插入 Reorder 节点来做转换——这和 [OpenVINO 算子融合](0563_Tools_OV_MO_Fusion) 里讲的 `MatcherPass` 模式匹配是同一类图优化基础设施，只是这里匹配的是"相邻节点格式是否一致"，而不是"能不能合并计算"。

一个典型的高发场景是**模型的第一层卷积**：外部送进来的图像数据天然是 bfyx（或 RGB 这种只有 3~4 个通道的简单排布），但卷积 kernel 为了效率通常希望输入已经是阻塞格式，图优化阶段会在它们之间插入一个 Reorder：

```
data(bfyx) → reorder(b_fs_yx_fsv16) → convolution(b_fs_yx_fsv16)
```

针对这种输入通道数很少（≤4）的第一层卷积，OpenVINO 还专门实现了能直接从 bfyx 读入、同时产出 `b_fs_yx_fsv16` 的融合卷积 kernel，把 Reorder 直接消除掉：

```
data(bfyx) → convolution(b_fs_yx_fsv16)     # Reorder 被吸收进卷积 kernel 本身
```

这其实就是 [OpenVINO 算子融合](0563_Tools_OV_MO_Fusion) 里"机制 B（post-op）"思路的另一种体现——只不过融合掉的不是下游的激活函数，而是上游本该发生的一次格式转换，让卷积 kernel 自己承担"顺手把输入重新排布"这件事，省掉一次独立的内存读写。不是所有 Reorder 都能被这样消除：当相邻节点中有一方的格式支持范围有限（比如某些算子只接受特定几种格式），或者是动态 shape 模型（早期版本的这类融合 kernel 不支持动态维度），Reorder 节点就会老老实实地出现在最终执行图里。

## 怎么观察 Reorder 是否存在、开销多大

- 用 `OV_GPU_DUMP_SOURCES_PATH` 导出编译后的 OpenCL 源码/图信息（见 [OpenVINO Debug](0527_Tools_OV_Debug)），检查最终执行图里是否还存在独立的 reorder 节点；
- 如果某个模型推理延迟明显高于预期，排查第一层卷积的输入通道数——很小的输入通道数（如 RGB 3 通道）如果没有命中上面提到的融合 kernel，就会老实插入一次 Reorder，这是常见的"隐藏开销"来源。

## 与 pytorch 的对应关系


OpenVINO reorder 核心能力 | PyTorch 等价算子 / 组合方式 | 适用场景
-- | -- | --
维度顺序重排（如 bfyx ↔ nhwc） | torch.permute() + torch.contiguous() | 任意维度顺序调整（最核心）
内存格式转换（线性 ↔ 阻塞格式） | torch._convert_layout()（PyTorch 2.0+）/ 自定义重排 | GPU/CPU 硬件优化格式适配（如 NCHWc）
数据类型转换（如 f32 ↔ f16/u8） | torch.to(dtype=...) | 精度转换（如 FP32→FP16）
跨设备数据迁移（Host ↔ Device） | torch.to(device=...) + 格式 / 类型转换 | CPU/GPU 张量迁移 + 格式适配
维度对齐 / 补零（如通道补零到 16 倍数） | torch.nn.functional.pad() + 维度重排 | 硬件要求的维度对齐（如 GPU 通道分组）

## Reference
- [OpenVINO GPU Memory Formats 官方文档](https://github.com/openvinotoolkit/openvino/blob/master/src/plugins/intel_gpu/docs/gpu_memory_formats.md)
- [OpenVINO GPU Plugin Graph Optimization Passes（09_reorder_inputs）](https://github.com/openvinotoolkit/openvino/wiki/Graph-Optimization-Passes)
- [OpenVINO Debug（OV_GPU_DUMP_SOURCES_PATH）](0527_Tools_OV_Debug)
- [OpenVINO 算子融合](0563_Tools_OV_MO_Fusion)
- [OpenVINO 布局重排](0565_Tools_OV_MO_Layout)
- [OpenVINO Model Optimizer 总览](0181_Tools_OV_MO)
- [OpenVINO GPU Permute 实现（和 Reorder 的区别：维度逻辑顺序 vs 内存分块方式）](0532_Tools_OV_OPs_GPUImpl_Permute)

