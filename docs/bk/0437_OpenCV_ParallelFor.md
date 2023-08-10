-----

| Title     | OpenCV ParallelFor                                    |
| --------- | ----------------------------------------------------- |
| Created @ | `2023-08-10T15:21:59Z`                                |
| Updated @ | `2023-08-10T15:21:59Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/437) |

-----

# OpenCV parallel\_for\_

  - `OpenCV 3.2` 中可以使用的并行 framework
      - Intel TBB
      - C= Parallel C/C++ Programming Language Extension
      - OpenMP
      - Apple GCD
      - Windows RT
      - Windows concurrency
      - Pthreads
  - 第三方库需要编译时指定编译(CMake), 系统集成的会自动使用
  - Task 需要适合并行(适合分割成多个无内存依赖的元操作)

| Frameworks             | Description      | Enabled            |
| ---------------------- | ---------------- | ------------------ |
| Intel TBB              | 3rdparty Library | 显式指定               |
| C=                     | 3rdparty Library | 显式指定               |
| OpenMP                 | 编译器集成            | 显式指定               |
| Apple GCD              | 系统集成             | 系统自动               |
| Windows RT concurrency | 系统集成             | 系统自动               |
| Windows concurrency    | 系统集成             | 系统特定 `MSVC++ >=10` |
| Pthreads               |                  |                    |

## Usecase

  - 自定义一个类，继承自
    [cv::ParallelLoopBody](https://docs.opencv.org/4.x/d2/d74/classcv_1_1ParallelLoopBody.html)
  - 重写函数 `virtual void operator ()(const cv::Range& range) const`
  - 例子中说 `4 Cores / 8 Threads` CPU 会有大概 6\~7 倍的提升
  - 不能达到理论 `8X` 提升的原因如下:
      - 创建和管理 Threads 会消耗时间
      - 后台有其他进程在并行运行，占用 CPU 时间
      - `4 Cores / 8 Threads` 与 `8 Cores` 的区别

## Reference

  - [OpenCV Parallel
    for](https://docs.opencv.org/4.x/d7/dff/tutorial_how_to_use_OpenCV_parallel_for_.html)
