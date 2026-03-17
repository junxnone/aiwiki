---
Title | Tools OV Kernels GPU Permute
-- | --
Created @ | `2026-03-17T02:41:07Z`
Updated @| `2026-03-17T02:41:07Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/532)

---
# OV GPU Kernels Permute

- 改变张量的维度顺序（如 bfyx→byxf、nchw→nhwc），且仅调整维度的逻辑顺序 + 内存排布，不改变张量的总元素数或数据本身。它与 reorder 有重叠但侧重点不同：
  - **permute**：仅聚焦维度顺序调整，是更 “纯粹” 的维度重排算子；
  - **reorder**：可同时完成维度顺序 + 内存格式 + 数据类型转换（permute 是 reorder 的子集）。
- OpenVINO permute 完全对应 PyTorch 的 torch.permute() 算子，参数可直接映射


特性 | 说明
-- | --
维度支持 | 支持 2~5 维张量（如 2D：[b,f]、4D：[b,f,y,x]、5D：[b,f,z,y,x]）
格式兼容性 | 适配 GPU 所有存储格式：- 线性格式（bfyx/nhwc）；- 阻塞格式（b_fs_yx_fsv16/b_fs_zyx_fsv32）；无需先转回线性格式，直接在阻塞格式上完成维度置换。
并行执行逻辑 | 按 GPU 线程网格拆分维度：每个线程处理一个 / 一组数据元素，利用 SIMT 架构并行调整维度顺序；例如：4D 张量置换时，线程块负责 [b,f] 维度，线程负责 [y,x] 维度。
性能优化 | 1. 适配 GPU 子组（Subgroup）：按 16/32 线程分组，减少线程调度开销；2. 内存对齐：保证置换后数据符合 GPU 缓存行（64 字节）要求；3. 融合优化：可与 reorder/crop 融合，减少独立 Kernel 调用。


## permute 与 reorder 的核心区别


算子 | 核心能力 | 典型场景
-- | -- | --
permute | 仅调整维度顺序（如 bfyx→byxf） | 纯维度重排（如 NCHW↔NHWC）
reorder | 维度顺序 + 内存格式 + 数据类型转换 | 格式适配（如 bfyx→b_fs_yx_fsv16）+ 类型转换（f32→f16）


  

