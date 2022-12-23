---
Title | CV Feature Harris
-- | --
Created @ | `2020-11-06T10:24:21Z`
Last Modify @| `2022-12-23T14:41:26Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/67)

---
# Reference
- 1988 [A COMBINED CORNER AND EDGE DETECTOR](https://web.stanford.edu/class/cs231m/references/harris-stephens.pdf)
- [Harris Corner Detector - wikipedia](https://en.wikipedia.org/wiki/Harris_Corner_Detector)
- [图像处理特征不变算子系列之Harris算子](https://blog.csdn.net/kezunhai/article/details/11265167)
- [Harris Corner Detection - OpenCV](https://www.docs.opencv.org/4.0.0/dc/d0d/tutorial_py_features_harris.html)
- [An Analysis and Implementation of the Harris Corner Detector](https://ipolcore.ipol.im/demo/clientApp/demo.html?id=229)
- [slides - Harris Corner Detector](https://www.slideshare.net/shihweihuang39/harris-corner-detector-and-face-recognition)
- [A Comparative Study between Moravec and Harris Corner Detection of Noisy Images Using Adaptive Wavelet Thresholding Technique](https://arxiv.org/ftp/arxiv/papers/1209/1209.1558.pdf)
- [feature - ppt](https://www.csie.ntu.edu.tw/~cyy/courses/vfx/07spring/lectures/handouts/lec04_feature_4up.pdf)
- [Harris 角点 - 计算机视觉 北京邮电大学 鲁鹏](https://www.bilibili.com/video/BV1nz4y197Qv?p=6)
- [The Shi-Tomasi Corner Detector](https://aishack.in/tutorials/shitomasi-corner-detector/)
- [Subpixel Corners: Increasing accuracy](https://aishack.in/tutorials/subpixel-corners-increasing-accuracy/)
- [亚像素角点的求法](https://xueyayang.github.io/pdf_posts/%E4%BA%9A%E5%83%8F%E7%B4%A0%E8%A7%92%E7%82%B9%E7%9A%84%E6%B1%82%E6%B3%95.pdf)


# Brief
- 1988 Harris Corner Detector Harris&Stephens

检测原理 |
-- | 
![image](https://user-images.githubusercontent.com/2216970/99036769-3c8f4100-25bd-11eb-8107-780e5839189d.png)

---
**公式推导**

响应公式 | ![image](https://user-images.githubusercontent.com/2216970/98491792-eb0b4d00-2270-11eb-8673-37097003dd47.png)
-- | --
窗口函数 | ![image](https://user-images.githubusercontent.com/2216970/99036826-5fb9f080-25bd-11eb-9364-b605963b6c47.png)

窗口图解 | ![image](https://user-images.githubusercontent.com/2216970/99044723-2daf8b00-25cb-11eb-90d0-fd7b1ae2a8c0.png) | ![image](https://user-images.githubusercontent.com/2216970/99045335-2341c100-25cc-11eb-900c-4b50fab1b607.png)
-- | -- | --

**通过 `泰勒展开式` 简化 为 u,v 相关的函数**
![image](https://user-images.githubusercontent.com/2216970/99203205-c113d680-27ec-11eb-9c3f-136d49306bc1.png) |  ![image](https://user-images.githubusercontent.com/2216970/99203111-6aa69800-27ec-11eb-8b91-e17598470d40.png) | ![image](https://user-images.githubusercontent.com/2216970/99203249-eb659400-27ec-11eb-82ec-6bccb207f50b.png)
-- | -- | --

![image](https://user-images.githubusercontent.com/2216970/99203313-1819ab80-27ed-11eb-993a-a6971ec3b341.png) | ![image](https://user-images.githubusercontent.com/2216970/98494670-82c06980-2278-11eb-8ecc-31ba6b5f8520.png)
-- | --
![image](https://user-images.githubusercontent.com/2216970/99203514-c9b8dc80-27ed-11eb-952f-199cbdfcb8eb.png) | ![image](https://user-images.githubusercontent.com/2216970/99203462-99713e00-27ed-11eb-92a7-7861e0b50f34.png) <br> ![image](https://user-images.githubusercontent.com/2216970/99203477-a55d0000-27ed-11eb-9be0-a6cf9e6e1b2d.png) <br>![image](https://user-images.githubusercontent.com/2216970/98491897-36bdf680-2271-11eb-89f4-96d8955a1f1a.png)
![image](https://user-images.githubusercontent.com/2216970/99205412-70ec4280-27f3-11eb-9e80-25055b8c9902.png) | ![image](https://user-images.githubusercontent.com/2216970/98491835-0a09df00-2271-11eb-90ff-84f2f9196014.png)



## Pipelines

1. Compute Gaussian derivatives at each pixel
2. Compute second moment matrix M in a Gaussian
window around each pixel
3. Compute corner response function R
4. Threshold R
5. Find local maxima of response function(NMS)


# 扩展 
## Shi-Tomasi
- 减少计算量
- ![image](https://user-images.githubusercontent.com/2216970/99205042-5e253e00-27f2-11eb-8a0a-940c924e355f.png)  ==> ![image](https://user-images.githubusercontent.com/2216970/99205032-59f92080-27f2-11eb-842e-4481529fc2b0.png)

![image](https://user-images.githubusercontent.com/2216970/98494993-2f025000-2279-11eb-8232-6fb441822a99.png)
-- |
![image](https://user-images.githubusercontent.com/2216970/99205115-8614a180-27f2-11eb-8a22-e3301234d582.png)

---
**Harris vs Shi-Tomasi**
![1_wvTlz05svCeCPu3MvJgeBQ](https://user-images.githubusercontent.com/2216970/99205532-c32d6380-27f3-11eb-9310-bdd5b58f12c3.gif)

## Subpixel Corners
- 增加精确度
- Pixel - (56, 120)
  - Subpixel - (56.768, 120.1432)

