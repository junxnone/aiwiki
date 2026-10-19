-----

| Title     | OpenCV TAPI                                           |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-08-10T14:58:14Z`                                |
| Updated @ | `2026-10-19T03:26:46Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/436) |

-----

# TAPI - Transparent API

  - 快速简便地使用 OpenCL + 硬件(GPU/DSP/FPGA/...)加速
  - 使用方法: `Mat` --\> `UMat(Unified Matrix)`
  - 适用于一些耗时操作
      - 简单快速的操作会因为 `memory copy` 导致耗时增加
  - `OpenCV 2.4` 时 开发了 `OpenCV OCL module`: 使用 `ocl namespace` 方式调用
      - `OpenCV 3` 时 `OCL module` 被放弃，使用 TAPI 替代

## 背后的执行逻辑

"Transparent"（透明）指的是：业务代码里调用 `cv::blur(umat_in, umat_out, ...)` 这样的
OpenCV 函数时，写法和用 `Mat` 时完全一样，但实际执行路径对用户是透明切换的：

  - 如果这个函数**有对应的 OpenCL kernel 实现**、且当前系统**检测到可用的 OpenCL 设备**，就会把 `UMat`
    背后的数据上传到设备端，调度 OpenCL kernel 在 GPU（或其他加速器）上执行；
  - 如果没有可用的 OpenCL 实现或设备（比如这台机器没有独立/核显，或者某个函数压根没写 OpenCL 版本），会**自动退回 CPU
    上的普通实现**，不需要用户写任何 if/else 分支去判断"这次该用 GPU 还是 CPU"；
  - `UMat` 第一次在某台机器上被某个 kernel 使用时，OpenCL kernel 需要现场编译（JIT
    编译成设备机器码），这次编译结果通常会被缓存起来，所以"第一次调用"往往比后续调用明显慢，做性能测试时要注意预热（warm-up），不要把首次调用的编译耗时也算进正式的计时里。

## 为什么"简单快速的操作"反而可能更慢

GPU 计算本身可能很快，但数据要先从主机内存搬到设备内存、算完再搬回来，这两次 `memory copy`
的耗时是固定开销，不随计算量线性缩放太多。如果单次操作本身计算量很小（比如对一张小图做一次简单的阈值化），"搬数据"的耗时占比就会远超过"真正计算"的耗时，此时切到
GPU 反而比直接在 CPU 上算更慢。经验法则：**操作本身越耗时、链路上连续用 `UMat` 做的操作越多（减少中间来回搬运的次数），用
TAPI 的收益才越明显**；单次、小尺寸、简单的操作通常不值得。

## 怎么确认 OpenCL 实际在起作用

``` cpp
#include <opencv2/core/ocl.hpp>

cv::ocl::haveOpenCL();        // 当前编译/运行环境是否支持 OpenCL
cv::ocl::useOpenCL();         // 当前是否"启用"了 OpenCL（即使支持也可能被手动关掉）
cv::ocl::setUseOpenCL(false); // 代码里手动关闭，强制走 CPU 路径，方便 A/B 对比
```

设备选择（选哪个 GPU/平台）由 `OPENCV_OPENCL_DEVICE` 环境变量控制，具体格式和 Intel iGPU 的用法见
[OpenCV with OpenCL](0432_OpenCV_OpenCL)。也可以结合前面 Tracing 的输出（[Debug
OpenCV](0434_OpenCV_Debug) 文档里示例报表的 `OpenCL %` 列）直接看某次运行里到底有多少耗时真的走了
OpenCL kernel。

## 和 G-API 的关系

[G-API](0439_OpenCV_GAPI) 的 GPU Backend 内部就是基于 T-API/UMat 实现的——G-API
负责在更高层面把多个算子编译成一张图、统一规划执行顺序和内存，底层具体某个节点怎么"透明地"调度到 OpenCL
设备上，用的正是本文说的这套 `Mat`/`UMat` 切换机制。

## Mat \<-\> UMat

### C++

    mat.copyTo(umat);

    UMat umat = mat.getUMat( flag );

> flag: ACCESS\_READ/ACCESS\_WRITE/ACCESS\_RW/ACCESS\_FAST

    mat = umat.getMat( flag )

### Python

    umat = cv2.UMat(mat)

    mat = cv2.UMat.get(umat)

## Reference

  - [OpenCV Transparent
    API](https://learnopencv.com/opencv-transparent-api/)
  - [OpenCV with OpenCL](0432_OpenCV_OpenCL)
  - [G-API - Graph API](0439_OpenCV_GAPI)
  - [cv::ocl
    命名空间参考](https://docs.opencv.org/4.x/d7/d2b/classcv_1_1ocl_1_1Context.html)
