-----

| Title     | OpenCV OpenCL                                         |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-08-02T14:32:23Z`                                |
| Updated @ | `2026-11-26T10:07:03Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/432) |

-----

# OpenCV with OpenCL

OpenCL 是跨平台的异构计算接口。OpenCV 通过 T-API（见
[TAPI](https://github.com/junxnone/aiwiki/issues/436)）自动把部分函数交给 OpenCL
设备（如 GPU）执行。

  - OpenCL Enable
      - Windows GPU Driver 自带 OpenCL Runtime, 不需要再安装依赖
      - Linux 需要下载[安装 OpenCL
        依赖](https://github.com/intel/compute-runtime/releases/)才能使用
        OpenCL
  - OpenCV OpenCL 环境变量 `OPENCV_OPENCL_DEVICE`
      - 关闭 OpenCL 调用: `export OPENCV_OPENCL_DEVICE=disabled`
      - 使用 Intel iGPU: `export OPENCV_OPENCL_DEVICE=Intel:GPU`
      - Format:
        `<Platform>:<CPU|GPU|ACCELERATOR|nothing=GPU/CPU>:<DeviceName or
        ID>`
      - OneAPI Compiler 部分可以将 CPU 视为 `OpenCL Device`, 否则默认只有 GPU `export
        OPENCV_OPENCL_DEVICE=Intel:CPU`
  - 查看使用的 OpenCL Device
      - `opencv_version --opencl`

## 环境变量取值

| 取值          | 效果                              |
| ----------- | ------------------------------- |
| `disabled`  | 不使用 OpenCL，全部走 CPU 路径           |
| `Intel:GPU` | 平台 Intel，设备类型 GPU               |
| `Intel:CPU` | 平台 Intel，设备类型 CPU（需要对应 runtime） |
| 空           | 使用默认设备，优先 GPU                   |

表中：格式为 `<Platform>:<设备类型>:<设备名或序号>`，用于在多个 OpenCL 设备之间选择。

## 在代码中使用

``` cpp
cv::UMat src, dst;                       // 使用 UMat 才会走 OpenCL
cv::imread("a.jpg").copyTo(src);
cv::GaussianBlur(src, dst, cv::Size(5, 5), 1.5);   // 自动在 OpenCL 设备上执行
bool ok = cv::ocl::haveOpenCL();         // 检查 OpenCL 是否可用
```

其中：

  - `UMat`：透明 API 容器，数据可在 CPU 与 OpenCL 设备之间自动搬运；使用 `Mat` 则不会走 OpenCL
  - `cv::ocl::haveOpenCL()`：运行时检查 OpenCL 是否可用
  - 小图像上，数据拷贝开销可能超过加速收益，因此不一定比 CPU 快

## Reference

  - [OpenCL support - OpenCV
    Docs](https://docs.opencv.org/4.x/db/d05/tutorial_config_reference.html#tutorial_config_reference_func_hetero)
  - [OpenCL optimizations - OpenCV
    Wiki](https://github.com/opencv/opencv/wiki/OpenCL-optimizations)
  - [T-API](https://github.com/opencv/opencv/wiki/opencv3#transparent-api)
