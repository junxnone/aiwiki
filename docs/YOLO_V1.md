---
Title | YOLO V1
-- | --
Create Date | `2021-09-27T07:35:49Z`
Update Date | `2021-09-27T07:35:49Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/54)

---
# Reference
- 2015 **YOLO V1** You Only Look Once: Unified, Real-Time Object Detection [[paper](https://arxiv.org/pdf/1506.02640.pdf)] [[netscope](http://ethereon.github.io/netscope/#/gist/96209c6940e02b17c34009f6c3fee75e)] [[Code](https://pjreddie.com/darknet/yolo/)] [[Code2 - AlexeyAB](https://github.com/AlexeyAB/darknet)]
- [目标检测（九）--YOLO v1,v2,v3](https://blog.csdn.net/App_12062011/article/details/77554288)
- [pjreddie Publications](https://pjreddie.com/publications/)
- [yoloV1，看过好多篇，这篇感觉讲的最通俗易懂](https://blog.csdn.net/m0_37192554/article/details/81092514)
- [目标检测之YOLO V2 V3](http://www.cnblogs.com/wangguchangqing/p/10480995.html)
- [Yolo V1 - darknet - pjreddie ](https://pjreddie.com/darknet/yolov1/)
- [【目标检测】YOLO](https://zhuanlan.zhihu.com/p/63507794)
- [【目标检测】基础知识：IoU、NMS、Bounding box regression](https://zhuanlan.zhihu.com/p/60794316)
- [YOLO - PPT - deepsystems.io](https://docs.google.com/presentation/d/14H2c8UuUN0L5l9cDeG-M96UPE6U0CrZN0ChAUr-gN7o/edit#slide=id.p)
- [图解YOLO](https://zhuanlan.zhihu.com/p/24916786)

# Brief
- One-Stage / Single-Stage
  - 转化为回归问题 - 拟合函数，从特征映射到(x,y,w,h)
- **Pipeline**
  - Preprocessing(Image Augmentation) 
  - Resize 448x448
  - 24 Conv Layers + 4 Max Pooling Layers + 2 FC Layers => 98 BBox confidence - 7x7x30 
  - 阈值去掉置信度较低值
  - NMS 去重复

## Preprocessing
- **Augmentation**
  - scale
  - translation
  - exposure 
  - saturation
- **Resize**

## Arch
![image](https://user-images.githubusercontent.com/2216970/72236235-f53cca80-3610-11ea-89c8-669d5faced06.png)

![image](https://user-images.githubusercontent.com/2216970/72319308-cf2f2d00-36d9-11ea-8d59-82afcb8acf28.png)


- 激活函数: 最后一层使用线性激活函数,其他使用  `leaky rectified linear activation`
![image](https://user-images.githubusercontent.com/2216970/72238004-6d0df380-3617-11ea-908f-6ad749092d4f.png)
> ReLU - Rectified Linear Unit

---
## Output(BBox)
- 每张图片分为 S x S 个格子
- 每个格子Predict B 个 BBox
- 获取Tensor : S x S x ( B x 5 + C ) 
- 5 : 每个 BBox 包含 5 个预测值 - `x, y, w, h, confidence`
  - 此处 confidence 指 BBox confidence
- C 指每个格子 Predict C Class probabilities

Confidence | ![image](https://user-images.githubusercontent.com/2216970/72305940-61224000-36b0-11ea-80aa-8d46493cfc06.png)
-- | --
Probabilities | ![image](https://user-images.githubusercontent.com/2216970/72306039-c0805000-36b0-11ea-83e8-d3aeb19685c0.png)

> YOLO - Pascal VOC : S=7 , B=2, C=20 ==> tensor=7x7x30

![image](https://user-images.githubusercontent.com/2216970/72236604-9a0bd780-3612-11ea-90a3-53af70196237.png)

## NMS 去重复过程
- 1 将 score 低于阈值 `T-score` 的置 0 剔除
- 2 将每一类 BBox 按 score 排序, 选出每类最大值 `C-M-score-BBox`
- 3 遍历 BBox, 去掉和 `C-M-score-BBox` 重叠 IoU 超过阈值 `T-IoU` 的 BBox
- 4 从剩余的 BBox 中再次选出 `C-M-score-BBox`, 重复 3
- 5 重复剔除 BBox 后剩余的即为 NMS 结果
> 以上过程中每类 BBox 单独处理

## Loss - 损失函数
- 使用均方差损失函数

**从上到下损失:**
- 1 中心坐标损失
- 2 BBox 宽高损失
> 位置损失只计算和 GTBBox IoU 最大的 Predict BBox
- 3-1 BBox 置信度损失(含Object)
- 3-2 BBox 置信度损失(不含Object)
- 4 每个格子的类别损失

![image](https://user-images.githubusercontent.com/2216970/72309266-7a7bba00-36b9-11ea-8686-10351715713f.png)

Name | Weight | Comment
-- | -- | --
λ coord | 5 | Localization 比分类更重要
λ noobj | 0.5 | 减少不含 Object 的权重

---
![image](https://user-images.githubusercontent.com/2216970/72317998-fedc3600-36d5-11ea-9b84-0fd0402468ee.png)


**Cell 误差**
- 含 Object : 位置误差 + 置信度误差 + 分类误差
- 不含 Object : 置信度误差

# Limitations
- 对重叠物体或相邻物体检测能力较差
  - 每个格子只能 Predict 2 个 BBox 和一个类别

