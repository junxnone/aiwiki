---
Title | ML Tasks Image Detection YOLO
-- | --
Created @ | `2018-12-09T09:33:49Z`
Last Modify @| `2022-12-24T12:47:04Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/53)

---
## Reference
- 2015 **YOLO V1** You Only Look Once: Unified, Real-Time Object Detection [[paper](https://arxiv.org/pdf/1506.02640.pdf)] [[netscope](http://ethereon.github.io/netscope/#/gist/96209c6940e02b17c34009f6c3fee75e)] [[Code](https://pjreddie.com/darknet/yolo/)] [[Code2 - AlexeyAB](https://github.com/AlexeyAB/darknet)] [[docs](https://pjreddie.com/darknet/yolov1/)]
- 2016 **YOLO V2** YOLO9000: Better, Faster, Stronger [[paper](https://arxiv.org/pdf/1612.08242.pdf)] [[netscope](http://ethereon.github.io/netscope/#/gist/8826fef24ed0b5086affdb6e65db26b7)]  [[Code](https://pjreddie.com/darknet/yolo/)] [[docs](https://pjreddie.com/darknet/yolov2/)]  [[YOLO 9000](https://pjreddie.com/publications/yolo9000/)]
- 2018 **YOLOv3**  An Incremental Improvement [[paper](https://pjreddie.com/media/files/papers/YOLOv3.pdf)] **[[YOLOv3 netscope](http://ethereon.github.io/netscope/#/gist/a9badc1fd4eefb7463c99e33d046af9e)]** [[Code](https://pjreddie.com/darknet/yolo/)] [docs](https://pjreddie.com/darknet/yolo/) [[docs](https://pjreddie.com/darknet/yolo/)]
- YOLO tiny - 基于 [Darknet Reference Model](https://pjreddie.com/darknet/imagenet/#reference)
- [目标检测（九）--YOLO v1,v2,v3](https://blog.csdn.net/App_12062011/article/details/77554288)
- [YOLO lite](https://reu2018dl.github.io/#myPage)
- [YOLO-LITE项目实现(比SSD和MobileNet更快的算法)](https://blog.csdn.net/ghw15221836342/article/details/84427923)
- [Yolo9000算法分析](https://blog.csdn.net/small_munich/article/details/79548149)
- [pjreddie Publications](https://pjreddie.com/publications/)
- [YOLO v2算法详解+YOLO9000介绍](https://blog.csdn.net/Chunfengyanyulove/article/details/80860870)
- [YOLO-v3模型参数anchor设置](https://blog.csdn.net/m_buddy/article/details/82926024)
- [YOLOv2 YOLOv3 如何选择先验框（priors anchor）（自用）](https://blog.csdn.net/Pattorio/article/details/80095511)
- [YOLO v3网络结构分析](https://blog.csdn.net/qq_37541097/article/details/81214953) 
- [yoloV1，看过好多篇，这篇感觉讲的最通俗易懂](https://blog.csdn.net/m0_37192554/article/details/81092514)
- [YOLOV3 基于OpenCV DNN 的目标检测实现](https://www.aiuai.cn/aifarm962.html)
- [目标检测之YOLO V2 V3](http://www.cnblogs.com/wangguchangqing/p/10480995.html)
- [从yolov1到yolov3](https://shartoo.github.io/2019/03/12/yolo-v123/)

## Brief

**YOLO**  - `You Only Look Once`



## History

Date | Name | Tech + Improvement | Comment
-- | -- | -- | --
2015 | YOLO v1 | <li>定位问题 -> 回归问题</li>
2016 | YOLO v2 - 9000 | <li>Darknet19</li><li>使用 BN Layers</li><li>高分辨率分类器</li><li>使用聚类获取 Anchor Box</li><li>特征融合</li><li>多尺度训练</li><li>分类检测数据集联合训练</li>
2018 | YOLO v3 |<li>Darknet53</li><li>引入 FPN</li>
2019 | YOLO SPP | <li>Dense Connection Block</li><li>Spatial Pyramid Pooling Block</li>

