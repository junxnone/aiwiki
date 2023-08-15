---
Title | OpenCV Debug
-- | --
Created @ | `2023-08-09T16:25:06Z`
Updated @| `2023-08-15T07:37:35Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/434)

---
# Debug OpenCV
- 一些预设的环境变量 [OpenCV environment variables reference](https://docs.opencv.org/4.x/d6/dea/tutorial_env_reference.html)
- `OpenCV Tracing`: 默认编译到 OpenCV lib 中
  - `export OPENCV_TRACE=1`
- ITT for Vtune
- Vtune 查看 CallStack

## Tracing
- `export OPENCV_TRACE=1`
  - `set OPENCV_TRACE=1` for Windows
- Run your App to generate the `OpenCVTrace.txt`
- Run `trace_profiler.py` to generate the summary


name | type | default | description
-- | -- | -- | --
⭐ OPENCV_TRACE | bool | false | enable trace
OPENCV_TRACE_LOCATION | string | OpenCVTrace | trace file name ("${name}-$03d.txt")
OPENCV_TRACE_DEPTH_OPENCV | num | 1 |  0 不限制跟踪深度，1不跟踪细节，只有 API
OPENCV_TRACE_MAX_CHILDREN_OPENCV | num | 1000 |  限制 OpenCV API 调用的跟踪
OPENCV_TRACE_MAX_CHILDREN | num | 1000 |  跟踪子节点，避免大循环
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

## Reference
- [OpenCV environment variables reference](https://docs.opencv.org/4.x/d6/dea/tutorial_env_reference.html)
