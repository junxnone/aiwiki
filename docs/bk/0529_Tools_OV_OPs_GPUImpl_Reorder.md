-----

| Title     | Tools OV OPs GPUImpl Reorder                          |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-03-16T08:00:53Z`                                |
| Updated @ | `2026-03-20T01:55:06Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/529) |

-----

# GPU Impl Reorder

  - 负责张量内存格式 / 数据类型的转换 (从 bfyx 格式转为 b\_fs\_yx\_fsv16 阻塞格式、从 f32 转为 f16 )

## 格式转换

  - 维度缩写：b（batch，批次）、f（feature，通道 / 特征）、y（height，高度）、x（width，宽度）；
  - bfyx：线性格式（也叫通用格式），维度顺序为 \[b, f, y, x\]，内存中按 “批次→通道→高度→宽度” 依次排布；
  - b\_fs\_yx\_fsv16：阻塞格式（Blocked Format），fs=feature
    slice（通道分片），fsv16=feature slice size 16（每个通道分片包含 16
    个通道），核心是把通道维度按 16 个一组拆分并嵌入到空间维度（y/x）的排布中。`[b, f_group, y, x,
    f_slice]`

> Intel GPU 的硬件缓存是按 “缓存行（Cache Line）” 读取数据的（通常 64 字节），b\_fs\_yx\_fsv16
> 格式的设计完全适配这一特性

  - **bfyx 的内存排布（线性）**

<!-- end list -->

    b0 → f0 → y0 → x0 → 
    b0 → f0 → y0 → x1 → 
    b0 → f0 → y1 → x0 → 
    b0 → f0 → y1 → x1 → 
    b0 → f1 → y0 → x0 →
     ... → 
    b0 → f31 → y1 → x1

  - **b\_fs\_yx\_fsv16 的排布逻辑（阻塞）**

<!-- end list -->

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

  - 张量的逻辑 shape（维度大小）不变，但物理内存的排布 shape（存储维度）会变
  - 存储维度 : bfyx `[2, 32, 2, 2]` -\> b\_fs\_yx\_fsv16 `[2,2,2,2,16]`

### 其他格式转换

| 源格式              | 目标格式                     | 适用场景                    |
| ---------------- | ------------------------ | ----------------------- |
| bfyx（线性）         | b\_fs\_yx\_fsv32         | 32 线程子组的 GPU（通道按 32 分组） |
| bfzyx（3D）        | b\_fs\_zyx\_fsv32        | 3D 卷积（如医学影像）            |
| bfyx             | bs\_fs\_yx\_bsv16\_fsv16 | 批次 + 通道双分组（大批次场景）       |
| nhwc（TensorFlow） | bfyx                     | 跨框架模型适配（TF→OpenVINO）    |

## 数据类型转换

| 常见类型转换      | 应用场景                            |
| ----------- | ------------------------------- |
| f32 ↔ f16   | 降低显存占用、提升计算速度（GPU 对 f16 原生支持更好） |
| f32 ↔ u8/i8 | 量化模型推理（INT8 量化后的数据类型适配）         |
| f16 ↔ bf16  | 适配 Arc GPU 的 bf16 计算单元          |
| i32 ↔ i64   | 少数算子的输入类型要求（如索引类算子）             |

## 张量维度对齐 / 补零 / 裁剪

  - 1.  通道数对齐（最常见）

  - 2.  空间维度对齐（如高度 / 宽度）

## 与 pytorch 的对应关系

| OpenVINO reorder 核心能力   | PyTorch 等价算子 / 组合方式                            | 适用场景                      |
| ----------------------- | ---------------------------------------------- | ------------------------- |
| 维度顺序重排（如 bfyx ↔ nhwc）   | torch.permute() + torch.contiguous()           | 任意维度顺序调整（最核心）             |
| 内存格式转换（线性 ↔ 阻塞格式）       | torch.\_convert\_layout()（PyTorch 2.0+）/ 自定义重排 | GPU/CPU 硬件优化格式适配（如 NCHWc） |
| 数据类型转换（如 f32 ↔ f16/u8）  | torch.to(dtype=...)                            | 精度转换（如 FP32→FP16）         |
| 跨设备数据迁移（Host ↔ Device）  | torch.to(device=...) + 格式 / 类型转换               | CPU/GPU 张量迁移 + 格式适配       |
| 维度对齐 / 补零（如通道补零到 16 倍数） | torch.nn.functional.pad() + 维度重排               | 硬件要求的维度对齐（如 GPU 通道分组）     |
