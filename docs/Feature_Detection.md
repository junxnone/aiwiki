---
Title | Feature Detection
-- | --
Create Date | `2019-07-20T11:57:13Z`
Update Date | `2021-10-11T07:35:50Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/64)

---
# Reference
- [Feature detection (computer vision) - wikipedia](https://en.wikipedia.org/wiki/Feature_detection_(computer_vision))
- [图像的角点简介](https://www.cnblogs.com/Peit/p/6681365.html)
- [图像处理--角点检测](https://blog.csdn.net/samkieth/article/details/49590995)
- [skimage.feature](https://scikit-image.org/docs/dev/api/skimage.feature.html)

# Brief

-  Feature Detection - 特征检测
- **分类** 
  - [**Edge Detection**](/Feature_Detection_Edge_Operator)
    - Prewitt
    - Sobel
    - Laplacian
    - Canny
  - **Corner Detection** - Interest points
    - [Moravec Corner](/Feature_Detection_Moravec_Corner)
    - [Harris Corner](/Feature_Detection_Harris_Corner)
  - **Blob Detection** - Regions of interest points
  - **Ridge Detection**
  - **Hough Transform** - Line/Circle/Ellipse
  - Structure Tensor
  - Affine Invariant Feature Detection
  - Feature Description
    - SIFT
    - SURF
    - GLOH
    - HOG

---
[**思维脑图**](https://naotu.baidu.com/file/2c983b6342a35dd438241585414495e1)

---
**应用**
  - 运动检测
  - 图像匹配
  - 视频跟踪
  - 三维建模
  - 目标识别


# History

检测算法 | Years |Description
-- | -- | --
Moravec | 1977-1980 | [Obstacle Avoidance and Navigation in the Real World by a Seeing Robot Rover](https://www.ri.cmu.edu/pub_files/pub4/moravec_hans_1980_1/moravec_hans_1980_1.pdf)
Harris |  1988 | [Harris Corner Detector (Harris, Stephens)](https://web.stanford.edu/class/cs231m/references/harris-stephens.pdf)
Shi-Tomasi | 1994 | Good Features to Track (Shi, Tomasi)
SIFT | 1999 | Scale Invariant Feature Transform (Lowe)
SURF | 2006 | Speeded Up Robust Features (Bay, Tuytelaars, Van Gool) 
FAST | 2006 | Features from Accelerated Segment Test (FAST) (Rosten, Drummond)
BRIEF | 2010 | Binary Robust Independent Elementary Features (BRIEF) (Calonder, et al.)
ORB | 2011 | Oriented FAST and Rotated BRIEF (ORB) (Rublee et al.)
BRISK | 2011 | Binary Robust Invariant Scalable Keypoints (BRISK) (Leutenegger, Chli, Siegwart)
FREAK | 2012 | Fast Retina Keypoint (FREAK) (Alahi, Ortiz, Vandergheynst)
KAZE | 2012 | KAZE (Alcantarilla, Bartoli, Davidson)

## Corner Detection - 角点

- 1980 Moravec 
- 1987 Förstner
- 1988 Harris
- 1994 Shi-Tomasi


