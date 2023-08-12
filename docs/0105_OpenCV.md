---
Title | OpenCV
-- | --
Created @ | `2021-10-16T04:31:07Z`
Updated @| `2023-08-12T07:15:31Z`
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
- `opencv_contrib`:  包含实验性质的和不稳定的算法，需要和主仓库一起构建
- `opencv_extra`: 包含测试数据和其他文件


### Main Modules

- core. [Core functionality](https://docs.opencv.org/4.6.0/d0/de1/group__core.html)
- imgproc. [Image Processing](https://docs.opencv.org/4.6.0/d7/dbd/group__imgproc.html)
- imgcodecs. [Image file reading and writing](https://docs.opencv.org/4.6.0/d4/da8/group__imgcodecs.html)
- videoio. [Video I/O](https://docs.opencv.org/4.6.0/dd/de7/group__videoio.html)
- highgui. [High-level GUI](https://docs.opencv.org/4.6.0/d7/dfc/group__highgui.html)
- video. [Video Analysis](https://docs.opencv.org/4.6.0/d7/de9/group__video.html)
- calib3d. [Camera Calibration and 3D Reconstruction](https://docs.opencv.org/4.6.0/d9/d0c/group__calib3d.html)
- features2d. [2D Features Framework](https://docs.opencv.org/4.6.0/da/d9b/group__features2d.html)
- objdetect. [Object Detection](https://docs.opencv.org/4.6.0/d5/d54/group__objdetect.html)
- dnn. [Deep Neural Network module](https://docs.opencv.org/4.6.0/d6/d0f/group__dnn.html)
- ml. [Machine Learning](https://docs.opencv.org/4.6.0/dd/ded/group__ml.html)
- flann. [Clustering and Search in Multi-Dimensional Spaces](https://docs.opencv.org/4.6.0/dc/de5/group__flann.html)
- photo. [Computational Photography](https://docs.opencv.org/4.6.0/d1/d0d/group__photo.html)
- stitching. [Images stitching](https://docs.opencv.org/4.6.0/d1/d46/group__stitching.html)
- gapi. [Graph API](https://docs.opencv.org/4.6.0/d0/d1e/gapi.html)

### Extra Modules

- alphamat. [Alpha Matting](https://docs.opencv.org/4.6.0/d4/d40/group__alphamat.html)
- aruco. [ArUco Marker Detection](https://docs.opencv.org/4.6.0/d9/d6a/group__aruco.html)
- barcode. [Barcode detecting and decoding methods](https://docs.opencv.org/4.6.0/d2/dea/group__barcode.html)
- bgsegm. [Improved Background-Foreground Segmentation Methods](https://docs.opencv.org/4.6.0/d2/d55/group__bgsegm.html)
- bioinspired. [Biologically inspired vision models and derivated tools](https://docs.opencv.org/4.6.0/dd/deb/group__bioinspired.html)
- ccalib. [Custom Calibration Pattern for 3D reconstruction](https://docs.opencv.org/4.6.0/d3/ddc/group__ccalib.html)
- cudaarithm. [Operations on Matrices](https://docs.opencv.org/4.6.0/d5/d8e/group__cudaarithm.html)
- cudabgsegm. [Background Segmentation](https://docs.opencv.org/4.6.0/d6/d17/group__cudabgsegm.html)
- cudacodec. [Video Encoding/Decoding](https://docs.opencv.org/4.6.0/d0/d61/group__cudacodec.html)
- cudafeatures2d. [Feature Detection and Description](https://docs.opencv.org/4.6.0/d6/d1d/group__cudafeatures2d.html)
- cudafilters. [Image Filtering](https://docs.opencv.org/4.6.0/dc/d66/group__cudafilters.html)
- cudaimgproc. [Image Processing](https://docs.opencv.org/4.6.0/d0/d05/group__cudaimgproc.html)
- cudalegacy. [Legacy support](https://docs.opencv.org/4.6.0/d5/dc3/group__cudalegacy.html)
- cudaobjdetect. [Object Detection](https://docs.opencv.org/4.6.0/d9/d3f/group__cudaobjdetect.html)
- cudaoptflow. [Optical Flow](https://docs.opencv.org/4.6.0/d7/d3f/group__cudaoptflow.html)
- cudastereo. [Stereo Correspondence](https://docs.opencv.org/4.6.0/dd/d47/group__cudastereo.html)
- cudawarping. [Image Warping](https://docs.opencv.org/4.6.0/db/d29/group__cudawarping.html)
- cudev. [Device layer](https://docs.opencv.org/4.6.0/df/dfc/group__cudev.html)
- cvv. [GUI for Interactive Visual Debugging of Computer Vision Programs](https://docs.opencv.org/4.6.0/df/dff/group__cvv.html)
- datasets. [Framework for working with different datasets](https://docs.opencv.org/4.6.0/d8/d00/group__datasets.html)
- dnn_objdetect. [DNN used for object detection](https://docs.opencv.org/4.6.0/d5/df6/group__dnn__objdetect.html)
- dnn_superres. [DNN used for super resolution](https://docs.opencv.org/4.6.0/d9/de0/group__dnn__superres.html)
- dpm. [Deformable Part-based Models](https://docs.opencv.org/4.6.0/d9/d12/group__dpm.html)
- face. [Face Analysis](https://docs.opencv.org/4.6.0/db/d7c/group__face.html)
- freetype. [Drawing UTF-8 strings with freetype/harfbuzz](https://docs.opencv.org/4.6.0/d4/dfc/group__freetype.html)
- fuzzy. [Image processing based on fuzzy mathematics](https://docs.opencv.org/4.6.0/df/d5b/group__fuzzy.html)
- hdf. [Hierarchical Data Format I/O routines](https://docs.opencv.org/4.6.0/db/d77/group__hdf.html)
- hfs. [Hierarchical Feature Selection for Efficient Image Segmentation](https://docs.opencv.org/4.6.0/dc/d29/group__hfs.html)
- img_hash. [The module brings implementations of different image hashing algorithms.](https://docs.opencv.org/4.6.0/d4/d93/group__img__hash.html)
- intensity_transform. [The module brings implementations of intensity transformation algorithms to adjust image contrast.](https://docs.opencv.org/4.6.0/dc/dfe/group__intensity__transform.html)
- julia. [Julia bindings for OpenCV](https://docs.opencv.org/4.6.0/d7/d44/group__julia.html)
- line_descriptor. [Binary descriptors for lines extracted from an image](https://docs.opencv.org/4.6.0/dc/ddd/group__line__descriptor.html)
- mcc. [Macbeth Chart module](https://docs.opencv.org/4.6.0/dd/d19/group__mcc.html)
- optflow. [Optical Flow Algorithms](https://docs.opencv.org/4.6.0/d2/d84/group__optflow.html)
- ovis. [OGRE 3D Visualiser](https://docs.opencv.org/4.6.0/d2/d17/group__ovis.html)
- phase_unwrapping. [Phase Unwrapping API](https://docs.opencv.org/4.6.0/df/d3a/group__phase__unwrapping.html)
- plot. [Plot function for Mat data](https://docs.opencv.org/4.6.0/db/dfe/group__plot.html)
- quality. [Image Quality Analysis (IQA) API](https://docs.opencv.org/4.6.0/dc/d20/group__quality.html)
- rapid. [silhouette based 3D object tracking](https://docs.opencv.org/4.6.0/d4/dc4/group__rapid.html)
- reg. [Image Registration](https://docs.opencv.org/4.6.0/db/d61/group__reg.html)
- rgbd. [RGB-Depth Processing](https://docs.opencv.org/4.6.0/d2/d3a/group__rgbd.html)
- saliency. [Saliency API](https://docs.opencv.org/4.6.0/d8/d65/group__saliency.html)
- sfm. [Structure From Motion](https://docs.opencv.org/4.6.0/d8/d8c/group__sfm.html)
- shape. [Shape Distance and Matching](https://docs.opencv.org/4.6.0/d1/d85/group__shape.html)
- stereo. [Stereo Correspondance Algorithms](https://docs.opencv.org/4.6.0/dd/d86/group__stereo.html)
- structured_light. [Structured Light API](https://docs.opencv.org/4.6.0/d1/d90/group__structured__light.html)
- superres. [Super Resolution](https://docs.opencv.org/4.6.0/d7/d0a/group__superres.html)
- surface_matching. [Surface Matching](https://docs.opencv.org/4.6.0/d9/d25/group__surface__matching.html)
- text. [Scene Text Detection and Recognition](https://docs.opencv.org/4.6.0/d4/d61/group__text.html)
- tracking. [Tracking API](https://docs.opencv.org/4.6.0/d9/df8/group__tracking.html)
- videostab. [Video Stabilization](https://docs.opencv.org/4.6.0/d5/d50/group__videostab.html)
- viz. [3D Visualizer](https://docs.opencv.org/4.6.0/d1/d19/group__viz.html)
- wechat_qrcode. [WeChat QR code detector for detecting and parsing QR code.](https://docs.opencv.org/4.6.0/dd/d63/group__wechat__qrcode.html)
- xfeatures2d. [Extra 2D Features Framework](https://docs.opencv.org/4.6.0/d1/db4/group__xfeatures2d.html)
- ximgproc. [Extended Image Processing](https://docs.opencv.org/4.6.0/df/d2d/group__ximgproc.html)
- xobjdetect. [Extended object detection](https://docs.opencv.org/4.6.0/d4/d54/group__xobjdetect.html)
- xphoto. [Additional photo processing algorithms](https://docs.opencv.org/4.6.0/de/daa/group__xphoto.html)

### OpenCV-Python


### OpenCV.js


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
