---
Title | OpenCV HAL
-- | --
Created @ | `2023-08-10T14:40:37Z`
Updated @| `2026-11-26T09:13:28Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/435)

---
# HAL - Universal Intrinsics
- Universal Intrinsics `支持不同架构处理器的 SIMD 指令集`
  - X86: SSE/SSE2/SSE4.2/AVX2/AVX512
  - ARM: NEON
  - PowerPC: VSX
  - MIPS: MSA
- 编译时集成？

HAL（Hardware Abstraction Layer）中的 Universal Intrinsics 是 OpenCV 对不同 CPU 的 SIMD（单指令多数据）指令的一层统一封装：用同一份代码，编译到各个平台的专用指令。

## 为什么需要

| 问题 | 说明 |
| --- | --- |
| 指令集分散 | x86 有 SSE/AVX，ARM 有 NEON，各自的函数名和寄存器宽度不同 |
| 手写重复 | 每个架构各写一份内核，维护成本高 |
| 可移植 | 用统一接口写一份，让编译器和宏映射到具体指令 |

表中：对比结论：Universal Intrinsics 让算法作者写一次，OpenCV 在各平台获得向量化加速。

## 示例

```cpp
#include "opencv2/core/hal/intrin.hpp"
using namespace cv;

void add(const float* a, const float* b, float* c, int n) {
    int i = 0;
#if (CV_SIMD || CV_SIMD_SCALABLE)
    const int step = VTraits<v_float32>::vlanes();       // 一个向量寄存器能装几个 float
    for (; i <= n - step; i += step) {
        v_float32 va = vx_load(a + i);
        v_float32 vb = vx_load(b + i);
        v_store(c + i, v_add(va, vb));                    // 一次处理 step 个元素
    }
#endif
    for (; i < n; i++) c[i] = a[i] + b[i];                // 处理剩余元素
}
```

其中：

- `v_float32`：当前平台向量寄存器类型，宽度随平台而定（128 位 / 256 位 / 512 位）
- `vlanes()`：一个向量里的元素个数（lane 数），如 128 位寄存器装 4 个 float
- `vx_load` / `v_store` / `v_add`：向量加载、存储、加法，统一接口，映射到平台指令
- 末尾的标量循环处理不足一个向量的尾部元素

## 寄存器宽度

| 架构 | 指令集 | 向量宽度 |
| --- | --- | --- |
| x86 | SSE / SSE2 / SSE4.2 | 128 位 |
| x86 | AVX2 | 256 位 |
| x86 | AVX512 | 512 位 |
| ARM | NEON | 128 位 |
| PowerPC | VSX | 128 位 |
| MIPS | MSA | 128 位 |

表中：宽度越大一次处理的元素越多，理论加速越高；具体可用的指令集取决于编译选项和运行的 CPU。

## 编译时还是运行时

「编译时集成？」——两者都有：

- **基线（baseline）**：编译时指定一组最低的指令集（如 SSE3），所有代码都按这组编译
- **分发（dispatch）**：对关键函数，额外按更高指令集（如 AVX2）编译多个版本，**运行时**检测 CPU 并选择最合适的版本
- 详见 [OpenCV CPU Optimizations](https://github.com/junxnone/aiwiki/issues/438)

## Reference
- [Universal Intrinsics](https://docs.opencv.org/4.x/df/d91/group__core__hal__intrin.html)
- [hal code](https://github.com/opencv/opencv/tree/master/modules/core/include/opencv2/core/hal)

