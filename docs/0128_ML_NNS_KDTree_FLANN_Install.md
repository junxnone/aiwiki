---
Title | ML NNS KDTree FLANN Install
-- | --
Created @ | `2021-10-27T08:23:55Z`
Updated @| `2026-11-26T09:28:30Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/128)

---
# Flann Install

FLANN（Fast Library for Approximate Nearest Neighbors，见 [FLANN](https://github.com/junxnone/aiwiki/issues/122)）的安装方法：包管理器安装，或从源码编译。

## Install on Ubuntu

```
sudo apt install libflann-dev
```

## Build from source

```
git clone https://github.com/flann-lib/flann
cd flann
mkdir build
cd build
cmake ..
make
```

- **build issue**

```
CMake Error at src/cpp/CMakeLists.txt:32 (add_library):
  No SOURCES given to target: flann_cpp


CMake Error at src/cpp/CMakeLists.txt:86 (add_library):
  No SOURCES given to target: flann
```

原因：新版 CMake 不允许 `add_library(... SHARED "")` 这种没有源文件的写法。解决：创建一个空源文件，并让这两个库使用它。

```
touch src/cpp/empty.cpp
```

- `src/cpp/CMakeLists.txt`

```
-    add_library(flann_cpp SHARED "")
+    add_library(flann_cpp SHARED empty.cpp)
-        add_library(flann SHARED "")
+        add_library(flann SHARED empty.cpp)
```

其中 `-` 开头表示删除的行，`+` 开头表示新增的行。

## 验证与使用

```
sudo make install              # 在 build 目录下安装
```

在 CMake 项目里使用：

```
find_package(flann REQUIRED)
target_link_libraries(my_app flann::flann)
```

其中：`find_package(flann)` 查找已安装的 FLANN；`flann::flann` 是导出的链接目标。PCL 和 OpenCV 内部也使用 FLANN（见 [FLANN UseCase](https://github.com/junxnone/aiwiki/issues/130)）。

## 方式对比

| 方式 | 优点 | 缺点 |
| --- | --- | --- |
| apt 安装 | 一行命令，依赖自动处理 | 版本可能较旧 |
| 源码编译 | 版本可控，可定制 | 需处理编译问题（如上面的 CMake 错误） |

表中：对比结论：一般用 apt 即可，需要新版本或调试时再从源码编译。

