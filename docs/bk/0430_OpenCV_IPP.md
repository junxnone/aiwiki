-----

| Title     | OpenCV IPP                                            |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-08-01T14:08:47Z`                                |
| Updated @ | `2026-11-26T10:07:05Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/430) |

-----

# OpenCV With IPP

  - [Intel Integrated Performance
    Primitives](https://junxnone.github.io/xwiki/#/0032_OPT_LIB_IPP?id=ipp-intel-integrated-performance-primitives)
  - OpenCV 中部分函数使用了 `IPP` 的实现, 不属于 `OpenSource`
  - 官方 Release 版本包含 IPP, 直接编译到了 `opencv library` 中
  - 手动编译时可以通过 `WITH_IPP` 指定是否编译 `IPP`
  - Ubuntu Package `libopencv-dev` 默认是
    [DWITH\_IPP=OFF](https://salsa.debian.org/science-team/opencv/-/blob/debian/experimental/debian/rules#L105)
  - `opencv-python` package 和 Windows exe Package 是 编译了 IPP

IPP（Intel Integrated Performance Primitives）是 Intel 针对自家 CPU
高度优化的图像、信号处理函数库。OpenCV 在运行时遇到可用的 IPP 实现，会优先调用
IPP 版本，代替自己的纯 C++ / SIMD 实现。

## 各发行包是否带 IPP

| 发行包                    | 是否包含 IPP                |
| ---------------------- | ----------------------- |
| 官方 Release             | 是（编译进 opencv library）   |
| `opencv-python`（pip）   | 是                       |
| Windows 官方 exe         | 是                       |
| Ubuntu `libopencv-dev` | 否（`WITH_IPP=OFF`）       |
| 自行编译                   | 取决于 `-DWITH_IPP=ON/OFF` |

表中：

  - 原因：IPP 不是开源的，部分 Linux 发行版出于许可原因默认不带
  - 对比结论：同一个函数在不同安装来源下，实际调用的实现可能不同，性能也可能不同

## 编译与运行时控制

    cmake -DWITH_IPP=ON ..                # 编译时启用 IPP
    export OPENCV_IPP=disabled            # 运行时关闭 IPP

其中：`WITH_IPP` 是 CMake 选项；`OPENCV_IPP` 是运行时环境变量，用于限制或关闭 IPP
使用的指令集，常用于对比有无 IPP 的性能或排查问题。运行时分发机制见 [CPU
Optimizations](https://github.com/junxnone/aiwiki/issues/438)。

-----

<script src="https://emgithub.com/embed-v2.js?target=https%3A%2F%2Fgithub.com%2Fopencv%2Fopencv%2Fblob%2F0052d46b8e33c7bfe0e1450e4bff28b88f455570%2FCMakeLists.txt%23L290-L292&style=default&type=code&showBorder=on&showLineNumbers=on&showFileMeta=on&showFullPath=on&showCopy=on"></script>

-----

## OS Environment `OPENCV_IPP`

  - Options
      - avx512
      - avx2
      - sse42
      - disabled

-----

<script src="https://emgithub.com/embed-v2.js?target=https%3A%2F%2Fgithub.com%2Fopencv%2Fopencv%2Fblob%2F6791284994dee30c48ed7e234f4aa5f5caa8ce5e%2Fmodules%2Fcore%2Fsrc%2Fsystem.cpp%23L2583-L2633&style=default&type=code&showBorder=on&showLineNumbers=on&showFileMeta=on&showFullPath=on&showCopy=on"></script>

-----
