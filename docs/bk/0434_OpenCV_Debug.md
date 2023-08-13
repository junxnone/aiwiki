-----

| Title     | OpenCV Debug                                          |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-08-09T16:25:06Z`                                |
| Updated @ | `2023-08-13T16:20:44Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/434) |

-----

# Debug OpenCV

  - 一些预设的环境变量 [OpenCV environment variables
    reference](https://docs.opencv.org/4.x/d6/dea/tutorial_env_reference.html)
  - `OpenCV Tracing`: 默认编译到 OpenCV lib 中
      - `export OPENCV_TRACE=1`
  - ITT for Vtune
  - Vtune 查看 CallStack

## Tracing

  - `export OPENCV_TRACE=1`
      - `set OPENCV_TRACE=1` for Windows
  - Run your App to generate the `OpenCVTrace.txt`
  - Run `trace_profiler.py` to generate the summary

| name                                 | type   | default     | description                          |
| ------------------------------------ | ------ | ----------- | ------------------------------------ |
| ⭐ OPENCV\_TRACE                      | bool   | false       | enable trace                         |
| OPENCV\_TRACE\_LOCATION              | string | OpenCVTrace | trace file name ("${name}-$03d.txt") |
| OPENCV\_TRACE\_DEPTH\_OPENCV         | num    | 1           | 0 不限制跟踪深度，1不跟踪细节，只有 API              |
| OPENCV\_TRACE\_MAX\_CHILDREN\_OPENCV | num    | 1000        | 限制 OpenCV API 调用的跟踪                  |
| OPENCV\_TRACE\_MAX\_CHILDREN         | num    | 1000        | 跟踪子节点，避免大循环                          |
| OPENCV\_TRACE\_SYNC\_OPENCL          | bool   | false       | wait for OpenCL kernels to finish    |

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

## ITT

| name                                  | type | default | description                                       |
| ------------------------------------- | ---- | ------- | ------------------------------------------------- |
| OPENCV\_TRACE\_ITT\_ENABLE            | bool | true    |                                                   |
| OPENCV\_TRACE\_ITT\_PARENT            | bool | false   | set parentID for ITT task                         |
| OPENCV\_TRACE\_ITT\_SET\_THREAD\_NAME | bool | false   | set name for OpenCV's threads "OpenCVThread-%03d" |

## Reference

  - [OpenCV environment variables
    reference](https://docs.opencv.org/4.x/d6/dea/tutorial_env_reference.html)
