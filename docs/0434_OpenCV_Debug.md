---
Title | OpenCV Debug
-- | --
Created @ | `2023-08-09T16:25:06Z`
Updated @| `2026-10-19T03:24:10Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/434)

---
# Debug OpenCV
- 一些预设的环境变量 [OpenCV environment variables reference](https://docs.opencv.org/4.x/d6/dea/tutorial_env_reference.html)
- `OpenCV Tracing`: 默认编译到 OpenCV lib 中
  - `export OPENCV_TRACE=1`
- ITT for Vtune：OpenCV 内部关键函数已经打好了 [ITT API](https://github.com/intel/ittapi) 标记点（见下文"ITT"一节的参数），配合 Intel VTune 就能在时间线上直接看到 `cv::xxx` 这些具体 OpenCV 函数的执行区间和调用关系，而不只是一堆不认识的汇编地址
- Vtune 查看 CallStack：VTune 的 Hotspots/Microarchitecture Exploration 等分析类型本身就能抓调用栈，ITT 标记点只是让栈里多了一层"业务语义"（能直接看到是哪个 OpenCV API 耗时，而不用自己去猜汇编对应哪个源码函数）

## Tracing
- `export OPENCV_TRACE=1`
  - `set OPENCV_TRACE=1` for Windows
- Run your App to generate the `OpenCVTrace.txt`
- Run `trace_profiler.py` to generate the summary
- `export OPENCV_TRACE_DEPTH_OPENCV=0` 可以不限制跟踪深度

> 使用 `OPENCV_TRACE/OPENCV_TRACE_DEPTH_OPENCV` 跟踪会增加执行时间，performance 测试时不要使用

name | type | default | description
-- | -- | -- | --
⭐ OPENCV_TRACE | bool | false | enable trace
OPENCV_TRACE_LOCATION | string | OpenCVTrace | trace file name ("${name}-$03d.txt")
OPENCV_TRACE_DEPTH_OPENCV | num | 1 |  0 不限制跟踪深度，1不跟踪细节，只有 API
OPENCV_TRACE_MAX_CHILDREN_OPENCV | num | 1000 |  限制 OpenCV API 调用的跟踪
OPENCV_TRACE_MAX_CHILDREN | num | 1000 |  跟踪子节点，避免大循环
OPENCV_TRACE_SYNC_OPENCL | bool | false | wait for OpenCL kernels to finish




<details>
<summary>Example</summary>

```
export OPENCV_TRACE=1
```

```
 ID name                                                                      count thr          min          max       median          avg       *self*          IPP   %       OpenCL   %
                                                                                               t-min        t-max     t-median        t-avg        total        t-IPP   %     t-OpenCL   %
  1 cv::imwrite#loadsave.cpp:785                                                 10   1      128.516      444.347      281.262      288.623     2886.230        0.000   0        0.000   0
                                                                                             128.516      444.347      281.262      288.623     2886.230        0.000   0        0.000   0

  2 cv::absdiff#arithm.cpp:931                                                  200   1        3.988       30.363       13.851       10.810     2161.989        0.000   0        0.000   0
                                                                                               3.988       30.363       13.851       10.810     2161.989        0.000   0        0.000   0

  3 cv::imread#loadsave.cpp:630                                                   4   1       50.158      229.217      123.496      131.592      526.367        0.000   0        0.000   0
                                                                                              50.158      229.217      123.496      131.592      526.367        0.000   0        0.000   0

  4 cv::Mat::copyTo#copy.cpp:307                                                  4   1       11.238       33.255       22.259       22.253       89.010       88.708  99        0.000   0
                                                                                              11.238       33.255       22.259       22.253       89.010       88.708  99        0.000   0

  5 cv::utils::logging::LogTagManager::assign#logtagmanager.cpp:72                1   1        0.049        0.049        0.049        0.049        0.049        0.000   0        0.000   0
                                                                                               0.049        0.049        0.049        0.049        0.049        0.000   0        0.000   0

  6 cv::ocl::setUseOpenCL#ocl.cpp:1234                                            1   1        0.014        0.014        0.014        0.014        0.014        0.000   0        0.000   0
                                                                                               0.014        0.014        0.014        0.014        0.014        0.000   0        0.000   0

  7 cv::utils::logging::LogTagManager::get#logtagmanager.cpp:104                  1   1        0.003        0.003        0.003        0.003        0.003        0.000   0        0.000   0
                                                                                               0.003        0.003        0.003        0.003        0.003        0.000   0        0.000   0

```

```
export OPENCV_TRACE=1
export OPENCV_TRACE_DEPTH_OPENCV=0
```

```
 ID name                                                                      count thr          min          max       median          avg       *self*          IPP   %       OpenCL   %
                                                                                               t-min        t-max     t-median        t-avg        total        t-IPP   %     t-OpenCL   %
  1 cv::imwrite#loadsave.cpp:785                                                 10   1      128.875      445.248      281.637      287.970     2879.696        0.000   0        0.000   0
                                                                                             128.875      445.248      281.637      287.970     2879.696        0.000   0        0.000   0

  2 cv::hal::absdiff8u#arithm.simd.hpp:547|cv::absdiff                          200   1        3.996       42.662       13.642       10.894     2178.898        0.000   0        0.000   0
                                                                                               3.996       42.662       13.642       10.894     2178.898        0.000   0        0.000   0

  3 cv::imread#loadsave.cpp:630                                                   4   1       50.247      230.819      124.025      132.279      529.117        0.000   0        0.000   0
                                                                                              50.247      230.819      124.025      132.279      529.117        0.000   0        0.000   0

  4 IPP:ippicviCopy_8u_C1R_L#copy.cpp:364|cv::Mat::copyTo                         4   1       10.751       33.440       22.274       22.185       88.740       88.740 100        0.000   0
                                                                                              10.751       33.440       22.274       22.185       88.740       88.740 100        0.000   0

  5 cv::absdiff#arithm.cpp:931                                                  200   1        0.003        0.228        0.005        0.007        1.434        0.000   0        0.000   0
                                                                                               4.001       42.764       13.758       10.902     2180.332        0.000   0        0.000   0

  6 cv::Mat::copyTo#copy.cpp:307                                                  4   1        0.052        0.124        0.069        0.079        0.315        0.000   0        0.000   0
                                                                                              10.875       33.510       22.335       22.264       89.054       88.740  99        0.000   0

  7 cv::utils::logging::LogTagManager::assign#logtagmanager.cpp:72                1   1        0.057        0.057        0.057        0.057        0.057        0.000   0        0.000   0
                                                                                               0.057        0.057        0.057        0.057        0.057        0.000   0        0.000   0

  8 cv::ocl::setUseOpenCL#ocl.cpp:1234                                            1   1        0.013        0.013        0.013        0.013        0.013        0.000   0        0.000   0
                                                                                               0.016        0.016        0.016        0.016        0.016        0.000   0        0.000   0

  9 cv::utils::logging::LogTagManager::get#logtagmanager.cpp:104                  1   1        0.003        0.003        0.003        0.003        0.003        0.000   0        0.000   0
                                                                                               0.003        0.003        0.003        0.003        0.003        0.000   0        0.000   0

 10 cv::ocl::OpenCLExecutionContext::getCurrentRef#ocl.cpp:1086|cv::ocl...        1   1        0.002        0.002        0.002        0.002        0.002        0.000   0        0.000   0
                                                                                               0.002        0.002        0.002        0.002        0.002        0.000   0        0.000   0


```

</details>

## ITT


name | type | default | description
-- | -- | -- | --
OPENCV_TRACE_ITT_ENABLE | bool | true |  
OPENCV_TRACE_ITT_PARENT | bool | false | set parentID for ITT task
OPENCV_TRACE_ITT_SET_THREAD_NAME | bool | false | set name for OpenCV's threads "OpenCVThread-%03d"

### 配合 VTune 查看调用栈的实际流程

1. 正常编译/安装带 ITT 支持的 OpenCV（默认就带，不需要额外开关，对应上面 `OPENCV_TRACE_ITT_ENABLE` 默认 `true`）；
2. 用 VTune 的 **Hotspots** 或 **Microarchitecture Exploration** 分析类型采集你的应用（具体分析类型怎么选见 [Vtune Pipeline](https://junxnone.github.io/opt/#/0071_Tools_Vtune_Pipeline) 决策流程图）；
3. 打开结果后切到 **Platform** / **Bottom-up** 视图，这时候调用栈里会出现 `cv::xxx` 这样带命名空间的 OpenCV 函数名（而不是一堆看不懂的内部符号），因为 ITT 标记点把"任务名"直接写成了 OpenCV 的函数/文件/行号（参照上面 Tracing 小节示例输出里 `cv::imwrite#loadsave.cpp:785` 这种格式，ITT 任务名用的是同一套命名）；
4. `OPENCV_TRACE_ITT_SET_THREAD_NAME=1` 可以让 VTune 时间线上的线程行直接显示成 `OpenCVThread-NNN`，方便在多线程场景下区分是哪个 OpenCV 内部线程池线程在跑。

这条路径的价值在于：Tracing（`OPENCV_TRACE`）生成的是脱离工具的纯文本报表，方便快速查看一次运行里哪个函数最耗时；而走 ITT+VTune 这条路径，能把 OpenCV 的函数级信息和 VTune 本身的硬件微架构指标（CPI、Cache Miss、向量化率等）关联在同一个时间线上看，适合"已经知道哪个函数慢，还要搞清楚这个函数具体是哪类硬件瓶颈"的场景。

## 其他调试手段

- **日志级别**：OpenCV 自带分级日志，比环境变量 Tracing 更轻量、不需要额外工具解析：
  ```cpp
  #include <opencv2/core/utils/logger.hpp>
  cv::utils::logging::setLogLevel(cv::utils::logging::LOG_LEVEL_DEBUG);
  ```
  也可以不改代码、直接用环境变量 `OPENCV_LOG_LEVEL=DEBUG` 控制；
- **断言（CV_Assert / CV_DbgAssert）**：`CV_Assert(cond)` 在 Release/Debug 构建下都生效，用于检查前置条件（如图像非空、尺寸匹配），条件不满足时抛 `cv::Exception` 并带上文件名/行号；`CV_DbgAssert` 只在 Debug 构建下生效，用于不想影响 Release 性能的调试期检查；
- **异常处理**：OpenCV 函数的参数/状态错误通常以抛出 `cv::Exception`（继承自 `std::exception`）的形式出现，`try { ... } catch (const cv::Exception& e) { ... }` 能拿到详细的错误信息（哪个函数、哪个断言失败）；
- **Debug 构建**：用源码编译时加 `-D CMAKE_BUILD_TYPE=Debug` 能保留调试符号、关闭优化，配合 gdb/Visual Studio 调试器单步跟踪 OpenCV 内部实现，定位到具体是哪一行代码的问题（而不只是哪个 API）；发行版的预编译 OpenCV 库通常是 Release 构建，单步进不去内部实现，想看源码级细节一般需要自己从源码编译 Debug 版本。

## Reference
- [OpenCV environment variables reference](https://docs.opencv.org/4.x/d6/dea/tutorial_env_reference.html)
- [OpenCV Logging](https://docs.opencv.org/4.x/d6/db6/classcv_1_1utils_1_1logging_1_1LogTag.html)
- [Intel ITT API](https://github.com/intel/ittapi)
- [cv::Exception](https://docs.opencv.org/4.x/db/de0/group__core__utils.html)

