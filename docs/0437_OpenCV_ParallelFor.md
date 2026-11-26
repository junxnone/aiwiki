---
Title | OpenCV ParallelFor
-- | --
Created @ | `2023-08-10T15:21:59Z`
Updated @| `2026-11-26T10:07:07Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/437)

---
# OpenCV parallel_for_

`parallel_for_` 是 OpenCV 提供的统一并行接口：把一个循环切分成多段，交给多个线程同时执行，底层使用系统可用的并行后端。

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

Frameworks | Description | Enabled
-- | -- | --
Intel TBB | 3rdparty Library | 显式指定
C= | 3rdparty Library | 显式指定
OpenMP | 编译器集成 | 显式指定
Apple GCD | 系统集成 | 系统自动
Windows RT concurrency | 系统集成 | 系统自动
Windows concurrency | 系统集成 | 系统特定 `MSVC++ >=10`
Pthreads | Linux/Unix 系统线程库 | 系统自动

表中：

- **Description**：该后端的来源：第三方库、编译器自带或操作系统自带；**Enabled**：是否需要编译时显式开启
- 对比结论：不同平台由不同后端承担并行，调用者只写一份 `parallel_for_` 代码即可

## Usecase
- 自定义一个类，继承自 [cv::ParallelLoopBody](https://docs.opencv.org/4.x/d2/d74/classcv_1_1ParallelLoopBody.html)
- 重写函数 `virtual void operator ()(const cv::Range& range) const`
- 例子中说 `4 Cores / 8 Threads` CPU 会有大概 6~7 倍的提升
- 不能达到理论 `8X` 提升的原因如下:
  - 创建和管理 Threads 会消耗时间
  - 后台有其他进程在并行运行，占用 CPU 时间
  - `4 Cores / 8 Threads` 与 `8 Cores` 的区别

```cpp
class Invert : public cv::ParallelLoopBody {
public:
    Invert(cv::Mat& m) : img(m) {}
    void operator()(const cv::Range& r) const override {
        for (int row = r.start; row < r.end; ++row) {       // 每个线程处理一段行
            uchar* p = img.ptr<uchar>(row);
            for (int i = 0; i < img.cols * img.channels(); ++i) p[i] = 255 - p[i];
        }
    }
private:
    cv::Mat& img;
};

cv::parallel_for_(cv::Range(0, img.rows), Invert(img));      // 把行区间分给多个线程
```

其中：

- `cv::Range(0, img.rows)`：要并行处理的整个范围，OpenCV 自动切成多个子区间，每个线程调用一次 `operator()`
- 每个线程处理不同的行，互不写同一块内存，所以无需加锁

## 加速比

$$
S=\frac{T_1}{T_p}\le p,\qquad E=\frac{S}{p}
$$

其中：

- $T_1$：单线程耗时；$T_p$：用 $p$ 个线程的耗时；$S$：加速比，理论上限为线程数 $p$
- $E$：并行效率，$E<1$ 说明存在线程创建、同步和资源竞争等开销
- 例：8 线程 CPU 实测约 6~7 倍，即 $S\approx6\sim7$，$E\approx0.75\sim0.9$

## Reference

- [OpenCV Parallel for](https://docs.opencv.org/4.x/d7/dff/tutorial_how_to_use_OpenCV_parallel_for_.html)

