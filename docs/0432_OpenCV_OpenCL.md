---
Title | OpenCV OpenCL
-- | --
Created @ | `2023-08-02T14:32:23Z`
Updated @| `2023-08-02T16:12:14Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/432)

---
# OpenCV with OpenCL
- OpenCL Enable
  - Windows GPU Driver 自带 OpenCL Runtime, 不需要再安装依赖
  - Linux 需要下载[安装 OpenCL 依赖](https://github.com/intel/compute-runtime/releases/)才能使用 OpenCL
- OpenCV OpenCL 环境变量 `OPENCV_OPENCL_DEVICE` 
  - 关闭 OpenCL 调用: `export OPENCV_OPENCL_DEVICE=disabled`
  - 使用 Intel iGPU: `export OPENCV_OPENCL_DEVICE=Intel:GPU`
  - Format: `<Platform>:<CPU|GPU|ACCELERATOR|nothing=GPU/CPU>:<DeviceName or ID>`
  - OneAPI Compiler 部分可以将 CPU 视为 `OpenCL Device`, 否则默认只有 GPU
- 查看使用的 OpenCL Device
  - `opencv_version --opencl`


## Reference
- [OpenCL support - OpenCV Docs](https://docs.opencv.org/4.x/db/d05/tutorial_config_reference.html#tutorial_config_reference_func_hetero)
- [OpenCL optimizations - OpenCV Wiki](https://github.com/opencv/opencv/wiki/OpenCL-optimizations)
- [T-API](https://github.com/opencv/opencv/wiki/opencv3#transparent-api)

