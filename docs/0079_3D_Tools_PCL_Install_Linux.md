---
Title | 3D Tools PCL Install Linux
-- | --
Created @ | `2021-06-18T07:48:19Z`
Updated @| `2026-11-26T10:18:12Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/79)

---
# Build PCL with Linux

在 Linux 上从源码编译 PCL（Point Cloud Library）。包管理器安装与其他方式见 [Install PCL](https://github.com/junxnone/aiwiki/issues/337)。

## 依赖

| 依赖 | 作用 |
| --- | --- |
| Boost | 基础库 |
| Eigen | 线性代数（见 [Eigen](https://github.com/junxnone/aiwiki/issues/303)） |
| FLANN | 近邻搜索（见 [FLANN](https://github.com/junxnone/aiwiki/issues/122)） |
| VTK（可选） | 可视化 |
| Qt（可选） | 图形界面 |

表中：对比结论：核心功能需要 Boost、Eigen、FLANN；只有需要可视化时才需要 VTK 和 Qt。

## Build Steps
```
mkdir build
cd build
cmake ..
make -j n
```

其中：

- `mkdir build` / `cd build`：在源码目录外建立编译目录，保持源码干净
- `cmake ..`：读取上一级目录的 CMakeLists.txt，生成 Makefile；可加 `-DCMAKE_BUILD_TYPE=Release` 开启优化
- `make -j n`：并行编译，`n` 是并行任务数，一般取 CPU 核心数

## Build with Intel Compiler
```
set(CMAKE_C_COMPILER "icx")
set(CMAKE_CXX_COMPILER "icpx")
```

其中：`icx` 与 `icpx` 分别是 Intel oneAPI 的 C 与 C++ 编译器；以上两行写在 CMakeLists.txt 中（需在 `project()` 之前），或用命令行 `-DCMAKE_C_COMPILER=icx -DCMAKE_CXX_COMPILER=icpx` 指定。

