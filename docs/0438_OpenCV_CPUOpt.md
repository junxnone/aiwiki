---
Title | OpenCV CPUOpt
-- | --
Created @ | `2023-08-10T15:43:52Z`
Updated @| `2023-08-12T08:42:31Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/438)

---
# OpenCV CPU Optimizations
- OpenCV 在 `X86_64` 平台上使用 `SSE3` 作为基本指令集，`SSE4.2/AVX/AVX2` 作为自适应调度优化
- Runtime 中自动根据 `CPU Features` 调用
- 并不是所有的 SIMD 指令集都实现了，只实现了部分最优化的

> Enabled runtime dispatched optimizations for larger set of functions in core and imgproc modules. `@OpenCV 4.1`


## 环境变量 OPENCV_CPU_DISABLE 

- Linux
```
export OPENCV_CPU_DISABLE=AVX2
```

- Windows
```
set OPENCV_CPU_DISABLE=AVX2,SSE4.1
```



## Reference
- [CPU optimizations build options](https://github.com/opencv/opencv/wiki/CPU-optimizations-build-options)
