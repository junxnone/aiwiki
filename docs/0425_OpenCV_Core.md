---
Title | OpenCV Core
-- | --
Created @ | `2023-06-17T16:03:05Z`
Updated @| `2026-10-19T05:15:29Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/425)

---
# Core functionality 核心功能函数

`core` 是 OpenCV 最底层、所有其他模块都依赖的基础模块，大致可以分成这几类能力：

## 1. 基础数据结构 — `Mat`

- `Mat` 是 OpenCV 里最核心的数据结构，本质是一个带元信息（尺寸、通道数、数据类型）的多维数组，图像在内存里就是一个 `Mat`；
- 采用引用计数（类似智能指针）管理底层数据，`Mat b = a;` 默认只拷贝头信息（共享同一块数据），要深拷贝需要显式调用 `.clone()`；
- 元素类型按 `深度U/S/F + 位数 + 通道数` 命名（如 `CV_8UC3` 表示 8 位无符号、3 通道），具体编码规则见 [数据结构](0364_OpenCV_data)；
- `Mat` 在异构计算场景下还有一个"透明"版本 `UMat`，可以在 CPU 内存和 GPU/加速器之间按需搬运，详见 [TAPI - Transparent API](0436_OpenCV_TAPI)。

## 2. 基本运算

- 算术/位运算：`add`/`subtract`/`absdiff`（逐像素差值，常用于运动检测，详见 [absdiff](0353_OpenCV_Core_absdiff)）、`bitwise_and/or/xor/not`（详见 [bitwise_xxx](0444_OpenCV_Core_bitwisexxx)）；
- 这些操作底层都会走前面提到的 SIMD/IPP 调度（见下文"性能基础设施"），所以即使是最基础的逐元素运算，不同硬件上的实际执行路径也可能不同。

## 3. 数据持久化（Persistence）

- `cv::FileStorage` 提供统一的 XML/YAML/JSON 读写接口，常用于保存/加载相机标定参数、算法配置、训练好的简单模型参数等结构化数据；
- 写入时按文件扩展名自动决定格式（`.xml`/`.yml`/`.json`），读写接口保持一致，换格式基本不用改代码。

## 4. 工具与调试基础设施

- **日志（Logging）**：分级日志系统，运行时可调节详细程度，具体用法见 [Debug OpenCV](0434_OpenCV_Debug)；
- **错误处理**：`CV_Assert`/`CV_DbgAssert` 断言宏和 `cv::Exception` 异常类型，同样详见 [Debug OpenCV](0434_OpenCV_Debug)；
- **Tracing/ITT**：内置的函数级耗时跟踪和 Intel VTune 集成点，详见 [Debug OpenCV](0434_OpenCV_Debug)。

## 5. 性能基础设施

`core` 模块同时也是 OpenCV 性能优化体系的底座——Universal Intrinsics（HAL）、多线程、OpenCL 调度这些机制都定义在 `core` 里，供其他模块（`imgproc`、`dnn` 等）复用：

| 能力 | 文档 |
|---|---|
| SIMD 跨平台封装与运行时指令集调度 | [HAL - Universal Intrinsics](0435_OpenCV_HAL)、[CPU Optimizations](0438_OpenCV_CPUOpt) |
| Intel IPP 第三方优化库集成 | [OpenCV With IPP](0430_OpenCV_IPP) |
| 多核并行（`parallel_for_`） | [OpenCV parallel_for_](0437_OpenCV_ParallelFor) |
| OpenCL 设备管理与 CPU/GPU 透明切换 | [OpenCV with OpenCL](0432_OpenCV_OpenCL)、[TAPI](0436_OpenCV_TAPI) |

完整的 OpenCV 性能专题导航见 [OpenCV](0105_OpenCV) 总览页。

## Reference
- [Tutorial - The Core Functionality (core module)](https://docs.opencv.org/4.6.0/de/d7a/tutorial_table_of_content_core.html)
- [Core functionality](https://docs.opencv.org/4.6.0/d0/de1/group__core.html)
- [cv::FileStorage](https://docs.opencv.org/4.6.0/da/d56/classcv_1_1FileStorage.html)
- [cv::Mat](https://docs.opencv.org/4.6.0/d3/d63/classcv_1_1Mat.html)

