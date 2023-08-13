-----

| Title     | OpenCV CPUOpt                                         |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-08-10T15:43:52Z`                                |
| Updated @ | `2023-08-13T16:01:39Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/438) |

-----

# OpenCV CPU Optimizations

  - OpenCV 在 `X86_64` 平台上使用 `SSE3` 作为基本指令集，`SSE4.2/AVX/AVX2` 作为自适应调度优化
  - Runtime 中自动根据 `CPU Features` 调用

> Enabled runtime dispatched optimizations for larger set of functions
> in core and imgproc modules. `@OpenCV 4.1`

## 编译优化的 SIMD 实现

  - CMake 中的编译变量
      - `CPU_BASELINE`: 指定编译的 Baseline 实现(x86\_64 中为 SSE3)
      - `CPU_DISPATCH`: 指定哪些其他实现会被编译(x\_86\_64 中为 SSE4.2/AVX/AVX2)
  - 并不是所有的 SIMD 指令集都实现了，只实现了部分最优化的
      - 例如 `arithm.simd.hpp` / `arithm_ipp.hpp`
  - C++ 编译器不支持单个文件使用多个 SIMD 优化？？

<!-- end list -->

    arithm.cpp //dispatcher and general Implementation
    arithm.dispatch.cpp //
    arithm.simd.hpp  // simd 实现, 会被处理多次生成不同的实现 SSE/AVX/AVX2/...
    arithm_ipp.hpp // ipp 实现

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

## 环境变量 OPENCV\_CPU\_DISABLE

  - Linux

<!-- end list -->

    export OPENCV_CPU_DISABLE=AVX2

  - Windows

<!-- end list -->

    set OPENCV_CPU_DISABLE=AVX2,SSE4.1

## Reference

  - [CPU optimizations build
    options](https://github.com/opencv/opencv/wiki/CPU-optimizations-build-options)
