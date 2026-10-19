---
Title | OpenCV
-- | --
Created @ | `2021-10-16T04:31:07Z`
Updated @| `2026-10-19T05:13:26Z`
Labels | `index`
Edit @| [here](https://github.com/junxnone/aiwiki/issues/105)

---
# OpenCV
- **OpenCV**  - `Open Source Computer Vision Library`
- **支持语言** - `python/C/C++/js`
- **License** - `Apache License 2.0`


## OpenCV 架构

### repos
- `opencv`: 主仓库，包含 主要的函数，稳定的算法，构建脚本和工具
- `opencv_contrib`:  包含实验性质的和不稳定的算法，需要和主仓库一起构建——之所以单独拆仓库，主要是因为这里的算法可能涉及专利限制（如 SIFT 在旧版本专利到期前）、API 还不稳定会频繁变动、或者依赖额外的第三方库，不满足主仓库对稳定性/许可证的要求
- `opencv_extra`: 包含测试数据和其他文件

### Main Modules

| 模块 | 官方文档 | 简介 |
|---|---|---|
| core | [Core functionality](https://docs.opencv.org/4.6.0/d0/de1/group__core.html) | 基础数据结构（`Mat`）、基本运算、持久化、并行/硬件加速基础设施，详见 [Core functionality](0425_OpenCV_Core) |
| imgproc | [Image Processing](https://docs.opencv.org/4.6.0/d7/dbd/group__imgproc.html) | 图像处理：滤波、几何变换、形态学操作、色彩空间转换等 |
| imgcodecs | [Image file reading and writing](https://docs.opencv.org/4.6.0/d4/da8/group__imgcodecs.html) | 图像文件的编解码读写（JPEG/PNG/BMP/...） |
| videoio | [Video I/O](https://docs.opencv.org/4.6.0/dd/de7/group__videoio.html) | 视频文件/摄像头的读写接口 |
| highgui | [High-level GUI](https://docs.opencv.org/4.6.0/d7/dfc/group__highgui.html) | 简易窗口显示、滑动条等交互式 GUI 组件 |
| video | [Video Analysis](https://docs.opencv.org/4.6.0/d7/de9/group__video.html) | 视频分析：光流、背景建模、目标跟踪 |
| calib3d | [Camera Calibration and 3D Reconstruction](https://docs.opencv.org/4.6.0/d9/d0c/group__calib3d.html) | 相机标定与三维重建 |
| features2d | [2D Features Framework](https://docs.opencv.org/4.6.0/da/d9b/group__features2d.html) | 特征点检测、描述与匹配框架 |
| objdetect | [Object Detection](https://docs.opencv.org/4.6.0/d5/d54/group__objdetect.html) | 目标检测（Haar/HOG 级联检测器、二维码等） |
| dnn | [Deep Neural Network module](https://docs.opencv.org/4.6.0/d6/d0f/group__dnn.html) | 深度学习推理引擎，可直接加载主流框架导出的模型做推理 |
| ml | [Machine Learning](https://docs.opencv.org/4.6.0/dd/ded/group__ml.html) | 传统机器学习算法：SVM、决策树、KNN 等 |
| flann | [Clustering and Search in Multi-Dimensional Spaces](https://docs.opencv.org/4.6.0/dc/de5/group__flann.html) | 高维空间的快速近邻搜索与聚类 |
| photo | [Computational Photography](https://docs.opencv.org/4.6.0/d1/d0d/group__photo.html) | 计算摄影：图像修复、去噪、HDR 合成等 |
| stitching | [Images stitching](https://docs.opencv.org/4.6.0/d1/d46/group__stitching.html) | 多张图像拼接成全景图 |
| gapi | [Graph API](https://docs.opencv.org/4.6.0/d0/d1e/gapi.html) | 基于图的执行模型，详见 [G-API](0439_OpenCV_GAPI) |

### Extra Modules

| 模块 | 官方文档 | 简介 |
|---|---|---|
| alphamat | [Alpha Matting](https://docs.opencv.org/4.6.0/d4/d40/group__alphamat.html) | 抠图/透明度估计 |
| aruco | [ArUco Marker Detection](https://docs.opencv.org/4.6.0/d9/d6a/group__aruco.html) | ArUco 标记码检测与定位 |
| barcode | [Barcode detecting and decoding methods](https://docs.opencv.org/4.6.0/d2/dea/group__barcode.html) | 条形码检测与解码 |
| bgsegm | [Improved Background-Foreground Segmentation Methods](https://docs.opencv.org/4.6.0/d2/d55/group__bgsegm.html) | 背景/前景分割，提取运动目标 |
| bioinspired | [Biologically inspired vision models and derivated tools](https://docs.opencv.org/4.6.0/dd/deb/group__bioinspired.html) | 仿生视觉模型 |
| ccalib | [Custom Calibration Pattern for 3D reconstruction](https://docs.opencv.org/4.6.0/d3/ddc/group__ccalib.html) | 自定义标定图案的三维重建标定 |
| cudaarithm | [Operations on Matrices](https://docs.opencv.org/4.6.0/d5/d8e/group__cudaarithm.html) | GPU(CUDA) 矩阵运算 |
| cudabgsegm | [Background Segmentation](https://docs.opencv.org/4.6.0/d6/d17/group__cudabgsegm.html) | GPU 背景分割 |
| cudacodec | [Video Encoding/Decoding](https://docs.opencv.org/4.6.0/d0/d61/group__cudacodec.html) | GPU 视频编解码 |
| cudafeatures2d | [Feature Detection and Description](https://docs.opencv.org/4.6.0/d6/d1d/group__cudafeatures2d.html) | GPU 特征检测与描述 |
| cudafilters | [Image Filtering](https://docs.opencv.org/4.6.0/dc/d66/group__cudafilters.html) | GPU 图像滤波 |
| cudaimgproc | [Image Processing](https://docs.opencv.org/4.6.0/d0/d05/group__cudaimgproc.html) | GPU 图像处理 |
| cudalegacy | [Legacy support](https://docs.opencv.org/4.6.0/d5/dc3/group__cudalegacy.html) | CUDA 旧接口兼容支持 |
| cudaobjdetect | [Object Detection](https://docs.opencv.org/4.6.0/d9/d3f/group__cudaobjdetect.html) | GPU 目标检测 |
| cudaoptflow | [Optical Flow](https://docs.opencv.org/4.6.0/d7/d3f/group__cudaoptflow.html) | GPU 光流计算 |
| cudastereo | [Stereo Correspondence](https://docs.opencv.org/4.6.0/dd/d47/group__cudastereo.html) | GPU 立体匹配 |
| cudawarping | [Image Warping](https://docs.opencv.org/4.6.0/db/d29/group__cudawarping.html) | GPU 图像几何变换 |
| cudev | [Device layer](https://docs.opencv.org/4.6.0/df/dfc/group__cudev.html) | CUDA 底层设备开发接口 |
| cvv | [GUI for Interactive Visual Debugging of Computer Vision Programs](https://docs.opencv.org/4.6.0/df/dff/group__cvv.html) | 可视化交互调试 GUI 工具 |
| datasets | [Framework for working with different datasets](https://docs.opencv.org/4.6.0/d8/d00/group__datasets.html) | 常见公开数据集的加载框架 |
| dnn_objdetect | [DNN used for object detection](https://docs.opencv.org/4.6.0/d5/df6/group__dnn__objdetect.html) | 基于深度学习的目标检测 |
| dnn_superres | [DNN used for super resolution](https://docs.opencv.org/4.6.0/d9/de0/group__dnn__superres.html) | 基于深度学习的超分辨率 |
| dpm | [Deformable Part-based Models](https://docs.opencv.org/4.6.0/d9/d12/group__dpm.html) | 可变形部件模型（传统目标检测方法） |
| face | [Face Analysis](https://docs.opencv.org/4.6.0/db/d7c/group__face.html) | 人脸识别/人脸分析 |
| freetype | [Drawing UTF-8 strings with freetype/harfbuzz](https://docs.opencv.org/4.6.0/d4/dfc/group__freetype.html) | 用 FreeType 绘制 UTF-8 文字（含中文等非拉丁字符） |
| fuzzy | [Image processing based on fuzzy mathematics](https://docs.opencv.org/4.6.0/df/d5b/group__fuzzy.html) | 基于模糊数学的图像处理 |
| hdf | [Hierarchical Data Format I/O routines](https://docs.opencv.org/4.6.0/db/d77/group__hdf.html) | HDF5 格式数据读写 |
| hfs | [Hierarchical Feature Selection for Efficient Image Segmentation](https://docs.opencv.org/4.6.0/dc/d29/group__hfs.html) | 层次化特征选择的高效图像分割 |
| img_hash | [Image hashing algorithms](https://docs.opencv.org/4.6.0/d4/d93/group__img__hash.html) | 图像哈希算法（以图搜图/判重） |
| intensity_transform | [Intensity transformation algorithms](https://docs.opencv.org/4.6.0/dc/dfe/group__intensity__transform.html) | 图像强度/对比度变换 |
| julia | [Julia bindings for OpenCV](https://docs.opencv.org/4.6.0/d7/d44/group__julia.html) | Julia 语言绑定 |
| line_descriptor | [Binary descriptors for lines extracted from an image](https://docs.opencv.org/4.6.0/dc/ddd/group__line__descriptor.html) | 直线特征的二进制描述子 |
| mcc | [Macbeth Chart module](https://docs.opencv.org/4.6.0/dd/d19/group__mcc.html) | 色卡（Macbeth Chart）检测，用于色彩校正 |
| optflow | [Optical Flow Algorithms](https://docs.opencv.org/4.6.0/d2/d84/group__optflow.html) | 光流算法集合 |
| ovis | [OGRE 3D Visualiser](https://docs.opencv.org/4.6.0/d2/d17/group__ovis.html) | 基于 OGRE 引擎的三维可视化 |
| phase_unwrapping | [Phase Unwrapping API](https://docs.opencv.org/4.6.0/df/d3a/group__phase__unwrapping.html) | 相位解包裹，常用于结构光三维重建 |
| plot | [Plot function for Mat data](https://docs.opencv.org/4.6.0/db/dfe/group__plot.html) | 简单的数据绘图功能 |
| quality | [Image Quality Analysis (IQA) API](https://docs.opencv.org/4.6.0/dc/d20/group__quality.html) | 图像质量评价 |
| rapid | [silhouette based 3D object tracking](https://docs.opencv.org/4.6.0/d4/dc4/group__rapid.html) | 基于轮廓剪影的三维目标跟踪 |
| reg | [Image Registration](https://docs.opencv.org/4.6.0/db/d61/group__reg.html) | 图像配准 |
| rgbd | [RGB-Depth Processing](https://docs.opencv.org/4.6.0/d2/d3a/group__rgbd.html) | RGB-D（彩色+深度）数据处理 |
| saliency | [Saliency API](https://docs.opencv.org/4.6.0/d8/d65/group__saliency.html) | 视觉显著性检测 |
| sfm | [Structure From Motion](https://docs.opencv.org/4.6.0/d8/d8c/group__sfm.html) | 运动恢复结构，多视角重建三维场景 |
| shape | [Shape Distance and Matching](https://docs.opencv.org/4.6.0/d1/d85/group__shape.html) | 形状距离度量与匹配 |
| stereo | [Stereo Correspondance Algorithms](https://docs.opencv.org/4.6.0/dd/d86/group__stereo.html) | 立体匹配算法 |
| structured_light | [Structured Light API](https://docs.opencv.org/4.6.0/d1/d90/group__structured__light.html) | 结构光三维重建 |
| superres | [Super Resolution](https://docs.opencv.org/4.6.0/d7/d0a/group__superres.html) | 超分辨率重建 |
| surface_matching | [Surface Matching](https://docs.opencv.org/4.6.0/d9/d25/group__surface__matching.html) | 三维表面匹配 |
| text | [Scene Text Detection and Recognition](https://docs.opencv.org/4.6.0/d4/d61/group__text.html) | 自然场景文字检测与识别（传统方法，如 ER 连通域检测 + Tesseract），和深度学习时代的 OCR 方法是两条不同路线，后者详见 [OCR](0200_ML_Tasks_Image_OCR) |
| tracking | [Tracking API](https://docs.opencv.org/4.6.0/d9/df8/group__tracking.html) | 目标跟踪算法集合 |
| videostab | [Video Stabilization](https://docs.opencv.org/4.6.0/d5/d50/group__videostab.html) | 视频防抖 |
| viz | [3D Visualizer](https://docs.opencv.org/4.6.0/d1/d19/group__viz.html) | 三维可视化 |
| wechat_qrcode | [WeChat QR code detector for detecting and parsing QR code.](https://docs.opencv.org/4.6.0/dd/d63/group__wechat__qrcode.html) | 微信开源的二维码检测器 |
| xfeatures2d | [Extra 2D Features Framework](https://docs.opencv.org/4.6.0/d1/db4/group__xfeatures2d.html) | 额外的二维特征算法（如 SIFT/SURF 等专利算法） |
| ximgproc | [Extended Image Processing](https://docs.opencv.org/4.6.0/df/d2d/group__ximgproc.html) | 扩展图像处理算法 |
| xobjdetect | [Extended object detection](https://docs.opencv.org/4.6.0/d4/d54/group__xobjdetect.html) | 扩展目标检测算法 |
| xphoto | [Additional photo processing algorithms](https://docs.opencv.org/4.6.0/de/daa/group__xphoto.html) | 额外的计算摄影算法 |

### OpenCV-Python

- Python 绑定层是对 C++ 实现的一层封装（基于 CPython 的扩展模块，`import cv2`），核心计算仍然跑在编译好的 C++/SIMD 代码里，Python 这一层本身不是性能瓶颈——只要避免在 Python 层写大量逐像素的循环（那种循环才是真正慢的地方），直接用 `cv2.xxx` 的向量化调用性能和 C++ 接近；
- `numpy.ndarray` 和 `cv2.Mat` 在内存布局上兼容，图像在 Python 里天然就是 `ndarray`，可以直接和 NumPy/PyTorch 等库的数组互操作，不需要额外转换；
- 官方的 `opencv-python` / `opencv-contrib-python` / `opencv-python-headless`（不含 GUI 依赖，适合服务器/容器环境）是最常用的发行方式，通过 pip 安装。

### OpenCV.js

- 通过 [Emscripten](https://emscripten.org/) 把 OpenCV 的 C++ 代码编译成 WebAssembly（WASM），让浏览器/Node.js 环境也能直接跑 OpenCV，不需要服务端处理；
- API 设计上尽量贴近 OpenCV-Python 的调用风格，但受限于 WASM 本身的能力，GUI 相关（`highgui`）、多线程等特性支持有限；
- 典型用途是纯前端的实时图像处理（如浏览器里直接做人脸检测、二维码识别），省去图像来回传输到后端的网络延迟。

## 性能相关专题

OpenCV 本身是一套分层的性能优化体系——从最底层的单指令多数据（SIMD）到最上层的图编译执行，各层对应的具体机制拆在下面这些文档里：

| 层级 | 关注点 | 文档 |
|---|---|---|
| 指令集 | CPU 向量化（SSE/AVX/NEON）的跨平台封装与运行时调度 | [HAL - Universal Intrinsics](0435_OpenCV_HAL)、[CPU Optimizations](0438_OpenCV_CPUOpt) |
| 第三方加速库 | Intel 闭源优化库，部分函数优先调用 | [OpenCV With IPP](0430_OpenCV_IPP) |
| 多线程 | 单机多核并行（不涉及指令集/设备切换） | [parallel_for_](0437_OpenCV_ParallelFor) |
| 异构计算（单算子） | CPU/GPU 透明切换 | [TAPI - Transparent API](0436_OpenCV_TAPI)、[OpenCV with OpenCL](0432_OpenCV_OpenCL) |
| 异构计算（多算子图） | 把多个操作编译成一张图统一调度，还能把 DL 推理也编进图里 | [G-API - Graph API](0439_OpenCV_GAPI) |
| 诊断与测试 | 定位性能瓶颈、回归测试 | [Debug OpenCV](0434_OpenCV_Debug)、[Performance Test](0431_OpenCV_PerfTest) |

这条线大致也对应着 OpenCV 自身的版本演进：3.0 引入 T-API（统一 CPU/OpenCL 调用），4.0 引入 G-API（图级别的统一调度），是"从单个函数怎么加速"逐步走向"整条处理流程怎么统一编译优化"的过程。

## Reference
- [[repo](https://github.com/opencv)] [[Docs](https://docs.opencv.org/4.x/)]
- [OpenCV Wiki](https://github.com/opencv/opencv/wiki) `包含了许多开发调试信息`
- [中文文档 - apachecn](https://opencv.apachecn.org/#/)
- [ComputerVision - opencv](http://zhaoxuhui.top/tags/#ComputerVision)
- [OpenCV with Python By Example](https://www.jianshu.com/c/ff20dc22c1bb)
- [OpenCV技术文章汇总](https://mp.weixin.qq.com/s?__biz=MzA4MDExMDEyMw==&mid=2247485470&idx=1&sn=5c7781a089f1bbdc36d85fe38256c69f&chksm=9fa87f5aa8dff64c5260e3577b3abd60b368768f991aaa024e3a20f8780e5db4228e93ad662f&mpshare=1&scene=1&srcid=#rd)
- [教程](http://codec.wang/docs/opencv/)
- [OpenCV-Python](https://www.cnblogs.com/Undo-self-blog/category/1160700.html)
- [OpenCV-Python](https://www.cnblogs.com/FHC1994/category/1210553.html)
- [Emscripten](https://emscripten.org/)

