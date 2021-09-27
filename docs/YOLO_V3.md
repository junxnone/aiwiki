---
Title | YOLO V3
-- | --
Create Date | `2021-09-27T07:36:37Z`
Update Date | `2021-09-27T07:36:37Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/56)

---
# Reference
- 2015 **YOLO V1** You Only Look Once: Unified, Real-Time Object Detection [[paper](https://arxiv.org/pdf/1506.02640.pdf)] [[netscope](http://ethereon.github.io/netscope/#/gist/96209c6940e02b17c34009f6c3fee75e)] [[Code](https://pjreddie.com/darknet/yolo/)] [[Code2 - AlexeyAB](https://github.com/AlexeyAB/darknet)]
- 2016 **YOLO V2** YOLO9000: Better, Faster, Stronger [[paper](https://arxiv.org/pdf/1612.08242.pdf)] [[netscope](http://ethereon.github.io/netscope/#/gist/8826fef24ed0b5086affdb6e65db26b7)]  [[Code](https://pjreddie.com/darknet/yolo/)] 
- 2018 **YOLOv3**  An Incremental Improvement [[paper](https://pjreddie.com/media/files/papers/YOLOv3.pdf)] **[[YOLOv3 netscope](http://ethereon.github.io/netscope/#/gist/a9badc1fd4eefb7463c99e33d046af9e)]** [[Code](https://pjreddie.com/darknet/yolo/)] 
- implements
  - [官方实现 - darknet yolo](https://pjreddie.com/darknet/yolo/)
  - [fork 后 update 较多的code - AlexeyAB](https://github.com/AlexeyAB/darknet)
  - [Minimal PyTorch implementation of YOLOv3](https://github.com/eriklindernoren/PyTorch-YOLOv3)
  - [keras-YOLOv3-mobilenet](https://github.com/Adamdad/keras-YOLOv3-mobilenet)
  - [keras-yolo3](https://github.com/qqwweee/keras-yolo3)
  - [kmeans-anchor-boxes](https://github.com/lars76/kmeans-anchor-boxes) 
  - [keras-yolo3-detection](https://github.com/SpikeKing/keras-yolo3-detection)
- [目标检测（九）--YOLO v1,v2,v3](https://blog.csdn.net/App_12062011/article/details/77554288)
- [YOLO lite](https://reu2018dl.github.io/#myPage)
- [YOLO-LITE项目实现(比SSD和MobileNet更快的算法)](https://blog.csdn.net/ghw15221836342/article/details/84427923)
- [pjreddie Publications](https://pjreddie.com/publications/)
- [YOLO-v3模型参数anchor设置](https://blog.csdn.net/m_buddy/article/details/82926024)
- [YOLOv2 YOLOv3 如何选择先验框（priors anchor）（自用）](https://blog.csdn.net/Pattorio/article/details/80095511)
- [YOLO v3网络结构分析](https://blog.csdn.net/qq_37541097/article/details/81214953) 
- [YOLOV3 基于OpenCV DNN 的目标检测实现](https://www.aiuai.cn/aifarm962.html)
- [目标检测之YOLO V2 V3](http://www.cnblogs.com/wangguchangqing/p/10480995.html)
- [从yolov1到yolov3](https://shartoo.github.io/2019/03/12/yolo-v123/)
- [YOLO V3](https://pjreddie.com/darknet/yolo/)
- [Tiny Darknet](https://pjreddie.com/darknet/tiny-darknet/)

# Brief
- darknet53
  - 引入残差结构
- 引入 FPN - 多尺度检测
  - 52x52
  - 26x26
  - 13x13
- multilabel classification : independent logistic 替换 softmax -> binary cross-entropy loss

---
**其他无效tricks**
- Anchor box x, y offset predictions
- Linear x, y predictions instead of logistic
- Focal Loss
- Dual IOU thresholds and truth assignment

## darknet53

![image](https://user-images.githubusercontent.com/2216970/72497524-af2d7400-3867-11ea-8625-722e70108e24.png)
---
FPN
![image](https://user-images.githubusercontent.com/2216970/72499640-5f51ab80-386d-11ea-89e5-ad40923573d4.png)


## COCO dataset 9 clusters

- (10×13)
- (16×30)
- (33×23)
- (30×61)
- (62×45)
- (59×119)
- (116 × 90)
- (156 × 198)
- (373 × 326)
