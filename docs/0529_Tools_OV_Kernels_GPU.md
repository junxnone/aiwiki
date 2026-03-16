---
Title | Tools OV Kernels GPU
-- | --
Created @ | `2026-03-16T08:00:53Z`
Updated @| `2026-03-16T08:00:53Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/529)

---
# OV GPU Kernels


## Reorder

- 负责张量内存格式 / 数据类型的转换 (从 bfyx 格式转为 b_fs_yx_fsv16 阻塞格式、从 f32 转为 f16 )


### 格式

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
