-----

| Title     | OpenCV CPUOpt                                         |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-08-10T15:43:52Z`                                |
| Updated @ | `2026-10-19T03:25:23Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/438) |

-----

# OpenCV CPU Optimizations

  - OpenCV 在 `X86_64` 平台上使用 `SSE3` 作为基本指令集，`SSE4.2/AVX/AVX2` 作为自适应调度优化
  - Runtime 中自动根据 `CPU Features` 调用
  - 这里说的是"调度哪个实现"，实现本身（具体每条 SIMD 指令怎么写）是 [HAL - Universal
    Intrinsics](0435_OpenCV_HAL) 提供的跨平台封装，两者是同一套机制的两个层面：HAL
    负责"写一遍、能编译到不同指令集"，本文讲的调度机制负责"运行时选哪个编译结果"

> Enabled runtime dispatched optimizations for larger set of functions
> in core and imgproc modules. `@OpenCV 4.1`

## 编译优化的 SIMD 实现

  - CMake 中的编译变量
      - `CPU_BASELINE`: 指定编译的 Baseline 实现(x86\_64 中为 SSE3)
      - `CPU_DISPATCH`: 指定哪些其他实现会被编译(x\_86\_64 中为 SSE4.2/AVX/AVX2)
  - 并不是所有的 SIMD 指令集都实现了，只实现了部分最优化的
      - 例如 `arithm.simd.hpp` / `arithm_ipp.hpp`

<!-- end list -->

    arithm.cpp //dispatcher and general Implementation
    arithm.dispatch.cpp //
    arithm.simd.hpp  // simd 实现, 会被处理多次生成不同的实现 SSE/AVX/AVX2/...
    arithm_ipp.hpp // ipp 实现

### C++ 编译器不支持单个文件使用多个 SIMD 优化？—— 多版本编译 + 运行时调度

答案是：**单个编译单元（translation unit）确实无法用一个全局编译选项同时产出多套 SIMD 指令集的代码**——给编译器传
`-mavx2` 之后，这个 `.cpp` 文件里所有代码都会被当作"目标 CPU 支持 AVX2"来编译，没法在同一次编译里再混入一份"只用
SSE3"的版本。OpenCV（以及 NumPy
等库）解决这个问题的办法不是依赖编译器的某个特殊语法，而是在构建系统层面"同一份源码，编译很多遍"：

1.  **把算法实现单独抽到 `.simd.hpp`**：`arithm.simd.hpp` 这类文件只包含纯算法逻辑，不包含任何运行时的
    CPU 特性判断（因为用哪个指令集这件事在这里已经是编译期确定的）；
2.  **同一个 `.simd.hpp` 被 `#include` 很多次，每次带不同的编译选项**：CMake 根据
    `CPU_DISPATCH` 列表（如 `SSE4_2;AVX;AVX2`），对同一份源码分别用
    `-msse4.2`、`-mavx`、`-mavx2`
    各编译一次，每次产出的目标代码放进不同命名空间/不同符号名，互不冲突地链接进同一个库；
3.  **`dispatch.cpp` 里放一个运行时判断的入口函数**：这个函数本身不含算法逻辑，只是在程序启动/首次调用时检测当前 CPU
    实际支持哪些指令集（`cv::checkHardwareSupport` 一类的 CPU
    特性探测），然后跳转调用上一步里对应那个版本的编译产物；
4.  这种"编译多份 + 运行时跳转"的模式，概念上和 Intel 编译器（ICC）/Clang 支持的
    `cpu_dispatch`/`cpu_specific` 函数多版本化（Function
    Multiversioning）特性做的是同一件事，区别只是 OpenCV
    在构建系统（CMake）层面手动实现了一遍，而不依赖编译器的专属扩展——好处是这套方案在
    GCC/Clang/MSVC 上都能用，不挑编译器。

### IPP（Intel Integrated Performance Primitives）

示例输出里出现的 `IPP` 列指的是 Intel 自家的高度优化函数库（闭源，专门针对 Intel CPU 手工调优，通常比 OpenCV
自带的通用 SIMD 实现更快）。OpenCV 编译时如果启用了
IPP（`WITH_IPP=ON`，多数预编译发行版默认开启），一部分核心函数（如
`copyTo`）会优先尝试调用 IPP 的实现，调用成功的话 Tracing 报表里会在 `IPP`
列显示对应的时间占比和百分比，调用失败（比如某些参数组合
IPP 不支持）才会退回 OpenCV 自己的 SIMD 实现。

### 查看 安装的 opencv lib 编译选项

    $ opencv_version -v
    
    General configuration for OpenCV 4.8.0 =====================================
      Version control:               unknown
    
      Platform:
        Timestamp:                   2023-08-03T06:21:54Z
        Host:                        Linux 5.15.0-72-generic x86_64
        CMake:                       3.22.1
        CMake generator:             Unix Makefiles
        CMake build tool:            /usr/bin/gmake
        Configuration:               Release
    
      CPU/HW features:
        Baseline:                    SSE SSE2 SSE3
          requested:                 SSE3
        Dispatched code generation:  SSE4_1 SSE4_2 FP16 AVX AVX2 AVX512_SKX
          requested:                 SSE4_1 SSE4_2 AVX FP16 AVX2 AVX512_SKX
          SSE4_1 (18 files):         + SSSE3 SSE4_1
          SSE4_2 (2 files):          + SSSE3 SSE4_1 POPCNT SSE4_2
          FP16 (1 files):            + SSSE3 SSE4_1 POPCNT SSE4_2 FP16 AVX
          AVX (8 files):             + SSSE3 SSE4_1 POPCNT SSE4_2 AVX
          AVX2 (37 files):           + SSSE3 SSE4_1 POPCNT SSE4_2 FP16 FMA3 AVX AVX2
          AVX512_SKX (8 files):      + SSSE3 SSE4_1 POPCNT SSE4_2 FP16 FMA3 AVX AVX2 AVX_512F AVX512_COMMON AVX512_SKX
    
    .......
    ....

这里每一行（如 `AVX2 (37 files)`）对应的正是前面说的"同一份 `.simd.hpp` 用这组编译选项又编译了一遍"，37
个文件就是目前支持 AVX2 多版本编译的文件数量，并不是所有 OpenCV 函数都做了这种多版本优化。

## Runtime 环境变量

  - 运行时环境变量可以设置运行时调用的实现
      - OPENCV\_CPU\_DISABLE：禁用某个已编译进库里的指令集分支，强制运行时调度器跳过它（常用于验证某个指令集是否是性能差异的原因、或者规避某个指令集上的
        bug）
      - OPENCV\_IPP：控制 IPP 实现的启用/禁用

-----

  - Linux

<!-- end list -->

    export OPENCV_CPU_DISABLE=AVX2

  - Windows

<!-- end list -->

    set OPENCV_CPU_DISABLE=AVX2,SSE4.1

## Reference

  - [CPU optimizations build
    options](https://github.com/opencv/opencv/wiki/CPU-optimizations-build-options)
  - [HAL - Universal Intrinsics](0435_OpenCV_HAL)
  - [Intel
    IPP](https://www.intel.com/content/www/us/en/developer/tools/oneapi/ipp.html)
