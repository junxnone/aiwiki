---
Title | 3D Tools PCL Install
-- | --
Created @ | `2021-05-11T03:31:05Z`
Last Modify @| `2022-12-25T03:56:05Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/337)

---
# Install PCL

## Reference
- [VS2019配置PCL（windows）](https://blog.csdn.net/y18771025420/article/details/110517524)
- [Ubuntu install from source](https://pcl.readthedocs.io/projects/tutorials/en/latest/compiling_pcl_posix.html#compiling-pcl-posix)
- [Ubuntu18.04安装PCL（详细教程）](https://blog.csdn.net/RNG_uzi_/article/details/106599317)

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

#### Windows

- Install `AllinOne` package
  - Boost - C++ 标准库 扩展
  - [Eigen](junxnone/aiwiki#303) - 线性代数/矩阵矢量运算/数值分析 C++库
  - [FLANN](https://github.com/junxnone/tech-io/issues/991) - 快速最近邻逼近搜索函数库
  - Ohull - 计算几何库/凸包
  - VTK - 三维图形学/图形处理/可视化
  - OpenNI2 - 音视频传感器抽象层
- Install VS 20xx(2019)

### Source Build Install
- [PCL - Building with Windows](https://github.com/junxnone/tech-io/issues/984)
- [PCL - Building with Linux](https://github.com/junxnone/tech-io/issues/994)
