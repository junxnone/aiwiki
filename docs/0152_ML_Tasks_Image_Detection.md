---
Title | ML Tasks Image Detection
-- | --
Created @ | `2018-12-09T09:27:47Z`
Last Modify @| `2022-12-24T12:44:14Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/152)

---
## Reference

- [目标检测综述](http://www.cnblogs.com/fydeblog/p/10447875.html)
- [A paper list of object detection using deep learning.](https://github.com/hoya012/deep_learning_object_detection)
- [awesome articles about object detection.](https://github.com/amusi/awesome-object-detection)
- [opencv openvino model zoo - object detection - yolov3](https://github.com/opencv/open_model_zoo/blob/2018/demos/python_demos/object_detection_demo_yolov3.py)
- [yoloV1，看过好多篇，这篇感觉讲的最通俗易懂](https://blog.csdn.net/m0_37192554/article/details/81092514)
- [deep_learning_object_detection](https://github.com/hoya012/deep_learning_object_detection)
- [深入理解one-stage目标检测算法（上篇）](https://blog.csdn.net/Enjoy_endless/article/details/88724416)
- [深入理解one-stage目标检测算法（下篇）](https://blog.csdn.net/Enjoy_endless/article/details/88728201)
- [HistoryOfObjectRecognition](https://drive.google.com/file/d/1VLvaj2VWO2XVGeMRgbexWyjZ61i3Dojc/view?usp=sharing)
- [论文学习-深度学习目标检测2014至201901综述-Deep Learning for Generic Object Detection A Survey](https://www.cnblogs.com/shine-lee/p/10376324.html)
- [第二十八节、基于深度学习的目标检测算法的综述](https://www.cnblogs.com/zyly/p/9250195.html)
- [CVPR2019目标检测方法进展综述](https://zhuanlan.zhihu.com/p/59376548)
- 基于深度学习的目标检测算法综述 [一](https://zhuanlan.zhihu.com/p/40047760)  [二](https://zhuanlan.zhihu.com/p/40020809)  [三](https://zhuanlan.zhihu.com/p/40102001)
- [深度学习目标检测方法综述](https://blog.csdn.net/zong596568821xp/article/details/80091784)
- [Diagnosing Error in Object Detectors](http://dhoiem.cs.illinois.edu/projects/detectionAnalysis/)
- Object Detection for Dummies 
  - [Object Detection for Dummies Part 1: Gradient Vector, HOG, and SS](https://lilianweng.github.io/lil-log/2017/10/29/object-recognition-for-dummies-part-1.html)
  - [Object Detection for Dummies Part 2: CNN, DPM and Overfeat](https://lilianweng.github.io/lil-log/2017/12/15/object-recognition-for-dummies-part-2.html)
  - [Object Detection for Dummies Part 3: R-CNN Family](https://lilianweng.github.io/lil-log/2017/12/31/object-recognition-for-dummies-part-3.html)
  - [Object Detection Part 4: Fast Detection Models](https://lilianweng.github.io/lil-log/2018/12/27/object-detection-part-4.html)

## Brief
- 通过算法获取待检测物体的 BBox


## Algos

- **传统方法**
  - Cascade + Haar
  - SIFT
  - SVM + HOG
  - DPM
- **Two Stage**
  - [R-CNN](/RCNN)
  - [Fast R-CNN](Fast_RCNN)
  - [Faster R-CNN](Faster_RCNN)
  - SPP-net
  - R-FCN
- **One Stage**
  - [YOLO](/YOLO_Summary)
    - [YOLO V1](/YOLO_V1)
    - [YOLO V2](/YOLO_V2)
    - [YOLO V3](/YOLO_V3)
    - [YOLO tiny](/YOLO_tiny)
    - [YOLO SPP](https://github.com/junxnone/tech-io/issues/664)
    - [YOLOv4](https://github.com/junxnone/ml/issues/99)
    - [YOLOv5]()
  - [SSD](https://github.com/junxnone/tech-io/issues/154)
  - DenseBox
- **+RNN**
  - RRC
  - Deformable CNN

## 优化方向
- backbone - 特征提取
- Loss
- NMS
- Anchor


## History

![image](https://user-images.githubusercontent.com/2216970/57966763-dc4c1e80-7988-11e9-861e-c090c35c310b.png)
![image](https://user-images.githubusercontent.com/2216970/55704618-28fa1c80-5a0f-11e9-8b92-fd67f2d4803c.png)

