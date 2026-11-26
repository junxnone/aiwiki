---
Title | 3D Tools PCL Install
-- | --
Created @ | `2021-05-11T03:31:05Z`
Updated @| `2026-11-26T10:23:59Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/337)

---
# Install PCL

PCL（Point Cloud Library，见 [PCL](https://github.com/junxnone/aiwiki/issues/77)）的安装方式：包管理器、源码编译。

##  Install
### Package Install
#### Ubuntu
```
$ sudo apt install libpcl-dev
```
- **Install from source**
```
wget https://github.com/PointCloudLibrary/pcl/releases/download/pcl-1.11.1/source.tar.gz
tar zvxf source.tar.gz
cd pcl
mkdir build
cd build
cmake ..  //cmake -DCMAKE_BUILD_TYPE=Release ..
make -j 8
sudo make install
```

其中：`-DCMAKE_BUILD_TYPE=Release` 开启优化，运行速度比默认配置快得多；`make -j 8` 用 8 个并行任务编译；`sudo make install` 安装到系统目录。更详细的 Linux 编译见 [Build PCL with Linux](https://github.com/junxnone/aiwiki/issues/79)。

#### Windows

- Install `AllinOne` package
  - Boost - C++ 标准库 扩展
  - [Eigen](https://github.com/junxnone/aiwiki/issues/303) - 线性代数/矩阵矢量运算/数值分析 C++库
  - [FLANN](https://github.com/junxnone/aiwiki/issues/122) - 快速最近邻逼近搜索函数库
  - Ohull - 计算几何库/凸包（Qhull）
  - VTK - 三维图形学/图形处理/可视化
  - OpenNI2 - 音视频传感器抽象层
- Install VS 20xx(2019)

### Source Build Install
- [PCL - Building with Windows](https://github.com/junxnone/tech-io/issues/984)
- [PCL - Building with Linux](https://github.com/junxnone/tech-io/issues/994)

## 方式对比

| 方式 | 优点 | 缺点 |
| --- | --- | --- |
| apt（Ubuntu） | 最快，依赖自动安装 | 版本取决于系统源 |
| 源码编译 | 版本与选项可控 | 编译耗时，依赖需自行准备 |
| Windows AllInOne | 一次装好常用依赖 | 需要配合 Visual Studio |

表中：对比结论：Ubuntu 上先用 apt；需要新版本或自定义选项时才从源码编译。

## Reference
- [VS2019配置PCL（windows）](https://blog.csdn.net/y18771025420/article/details/110517524)
- [Ubuntu install from source](https://pcl.readthedocs.io/projects/tutorials/en/latest/compiling_pcl_posix.html#compiling-pcl-posix)
- [Ubuntu18.04安装PCL（详细教程）](https://blog.csdn.net/RNG_uzi_/article/details/106599317)

