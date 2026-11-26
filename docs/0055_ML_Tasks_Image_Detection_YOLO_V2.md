---
Title | ML Tasks Image Detection YOLO V2
-- | --
Created @ | `2020-01-14T06:37:42Z`
Updated @| `2026-11-26T01:26:49Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/55)

---

# YOLO V2

- YOLO v2 Better Faster - 各种 `Tricks` 集合
- YOLO 9000 Stronger - 联合训练 
- 分类和检测的联合训练策略

Trick  | Details | Improve
-- | -- | --
3x3 Conv Layers | 
BN Layers | 每层卷积加入 BN Layer 去掉 Dropout | +2% mAP
高分辨率分类器 | 先在 ImageNet 上 使用 448x448 分辨率 fine tune 10 epochs , 再 fine tune detection on COCO | + 4% mAP
Anchor Box | 使用 Anchor Boxes 替换 FC Layers predict BBox | + 7% Recall
Dimension Clusters | k-mean 聚类 BBox 获取先验值 | 
Direct location prediction | sigmoid 约束偏移值在当前 cell 中
Fine-Grained Features |  不同特征图融合 concat - 26x26x512 -> 13x13x2048 | +1%mAP
Multi-Scale Training | 每 10 batches 更换 输入大小 [320, 352...608]

> Anchor Box 使用了手动选择候选框, 后续的tricks 使用 Dimension Cluster 选择候选框

![image](https://user-images.githubusercontent.com/2216970/72323092-d73f9a80-36e2-11ea-99ed-8d778073426e.png)

![image](https://user-images.githubusercontent.com/2216970/72496863-d6834180-3865-11ea-890f-865f7b76d765.png)

## Preprocessing
- augmentation
  - random crop
  - color shifting
- K-mean distance metric
![image](https://user-images.githubusercontent.com/2216970/72326883-05c17380-36eb-11ea-881d-ecaea88aa940.png)


## Model

### Darknet-19 - Classification
![image](https://user-images.githubusercontent.com/2216970/72320493-c7bd5300-36dc-11ea-8414-4769f4be8b22.png)
- 移除最后一层卷积
- 添加 3 个 3x3 的 Conv Layers - 1024 filters
- 添加一个 1x1 的卷积 - filters = 5x(5+20) => (VOC)

## Training

### Training for Classification
- initial traning
  - 160 epoch 
  - input 224x224
  - 初始学习率 0.1
  - 权重衰减 0.0005
  - 动量 0.9
  - augmentation : random/crops/rotations/hue,/saturation/exposure shifts
- fine tune 
  - input 448x448 
  - 20 epoch
  - lr 0.003

### Training for Detection

##  Joint classification and detection - YOLO 9000
- 同时使用 COCO 和 ImageNet 训练
  - ImageNet 中学习 Classification
  - COCO 中学习 Detection
- 使用 WordTree 的方式组织 Labels
- Oversampling 采样 COCO 数据集 达到和 ImageNet 平衡 - 比例 4:1
- 对 COCO 中已有的类别有较好的的泛化能力，一些比较新的类别则比较差
- anchor box 5 --> 3
- 反向传播
  - COCO 检测数据样本 - 正常传播
  - ImageNet 分类数据样本 - 只反向传播类别损失

### WordTree - multi-label model
- COCO数据集的所有类别之间是互不包含的
- ImageNet 包含从属关系的 Labels
- ImageNet 类别来源于 WordNet


小类别概率的计算：
![image](https://user-images.githubusercontent.com/2216970/72492840-a46be280-3859-11ea-9831-942f3c000c6f.png)


- 蓝色的是COCO数据集的类别
- 红色的是imageNet的类别

![image](https://user-images.githubusercontent.com/2216970/72408912-3cf15c80-379f-11ea-9bb5-5d78a1a89b36.png)

![image](https://user-images.githubusercontent.com/2216970/57967666-4918e600-7994-11e9-8f36-c68037237453.png)



## 公式

### Anchor 聚类

$$
d(\text{box},\text{centroid})=1-\mathrm{IoU}(\text{box},\text{centroid})
$$

其中：

- 对训练集所有真实框的宽高 $(w,h)$ 做 k-means 聚类 ($k=5$)，框都先对齐到同一中心，只比较形状
- 用 $1-\mathrm{IoU}$ 作为距离，而不是欧氏距离：欧氏距离会让大框产生比小框更大的误差，IoU 与框的绝对大小无关
- $k=5$ 是召回率与模型复杂度的折中；得到的 $5$ 个聚类中心就是 anchor 的宽高 $(p_w,p_h)$，比手工选取的 anchor 更贴近数据

### 直接位置预测

$$
\begin{aligned}
b_x&=\sigma(t_x)+c_x, & b_y&=\sigma(t_y)+c_y\\
b_w&=p_we^{t_w}, & b_h&=p_he^{t_h}\\
\Pr(\text{obj})\cdot\mathrm{IoU}(b,\text{object})&=\sigma(t_o)
\end{aligned}
$$

其中：

- $(t_x,t_y,t_w,t_h,t_o)$：网络对每个 anchor 预测的 $5$ 个值
- $(c_x,c_y)$：当前网格左上角在特征图上的坐标；$\sigma$：sigmoid，把中心偏移限制在 $(0,1)$，即中心必然落在当前格子内
- $(p_w,p_h)$：anchor 的宽高；$b_w,b_h$ 为最终预测框的宽高，用指数保证为正
- $(b_x,b_y,b_w,b_h)$：最终框，以特征图格子为单位；乘以步长 $32$ 还原到输入图像像素
- 这样训练更稳定：不使用 Faster R-CNN 那种没有约束的偏移，早期训练时不会让中心跑到别的格子

### 输出通道

$$
\text{filters}=B\,(5+C)=5\times(5+20)=125
$$

其中：$B=5$ 个 anchor，每个有 $5$ 个框参数加 $C=20$ 个类别概率 (VOC)；最后的 $1\times1$ 卷积输出 $13\times13\times125$。与 [V1](/0054_ML_Tasks_Image_Detection_YOLO_V1) 不同，类别概率不再是每个格子一组，而是每个 anchor 一组。

### WordTree 条件概率

$$
\Pr(\text{Norfolk terrier})=\Pr(\text{Norfolk terrier}\mid\text{terrier})\cdot\Pr(\text{terrier}\mid\text{hunting dog})\cdots\Pr(\text{animal}\mid\text{physical object})\cdot\Pr(\text{physical object})
$$

其中：

- 每个节点预测的是「在其父节点成立的条件下」的概率，一个子类的最终概率等于从根到该节点路径上条件概率的连乘
- 在每个同级节点集合内部做 softmax，而不是在所有类别上做一个全局 softmax，这样 COCO 的粗类别 (如 `dog`) 和 ImageNet 的细类别 (如 `Norfolk terrier`) 可以放在同一棵树中
- 预测时从根开始，沿概率最高的路径向下走，直到累计概率低于阈值

## 速度与精度

输入尺寸 | VOC2007 mAP | FPS
-- | -- | --
$288\times288$ | 69.0 | 91
$416\times416$ | 76.8 | 67
$544\times544$ | 78.6 | 40

表中：同一个 YOLOv2 模型，输入分辨率越大精度越高、速度越低；全卷积结构使它可以在测试时直接改变输入分辨率，不用重新训练，这正是多尺度训练 (每 10 个 batch 随机选 $320,352,\dots,608$ 之一，均为 $32$ 的倍数) 的好处。数据来自论文 `[待核实]`。

## Darknet-19

- 19 个卷积层 + 5 个最大池化，主要使用 $3\times3$ 卷积，池化后通道数翻倍，并在 $3\times3$ 之间插入 $1\times1$ 压缩通道，思路来自 [VGG](/0146_ML_Tasks_Image_Classification_VGGNet) 和 NIN
- 用全局平均池化代替全连接层，约 $5.58$ GFLOPs，ImageNet 上 top-1 $72.9\%$、top-5 $91.2\%$，计算量比 VGG-16 小得多
- 检测时去掉最后的分类卷积，加 3 个 $3\times3\times1024$ 卷积和 $1\times1$ 输出层，并把 $26\times26\times512$ 的特征通过 passthrough (重排成 $13\times13\times2048$) 与深层特征拼接，即表中的 Fine-Grained Features

## Reference
- 2015 **YOLO V1** You Only Look Once: Unified, Real-Time Object Detection [[paper](https://arxiv.org/pdf/1506.02640.pdf)] [[netscope](http://ethereon.github.io/netscope/#/gist/96209c6940e02b17c34009f6c3fee75e)] [[Code](https://pjreddie.com/darknet/yolo/)] [[Code2 - AlexeyAB](https://github.com/AlexeyAB/darknet)]
- 2016 **YOLO V2** YOLO9000: Better, Faster, Stronger [[paper](https://arxiv.org/pdf/1612.08242.pdf)] [[netscope](http://ethereon.github.io/netscope/#/gist/8826fef24ed0b5086affdb6e65db26b7)]  [[Code](https://pjreddie.com/darknet/yolo/)]  [[Code2 - AlexeyAB](https://github.com/AlexeyAB/darknet)]
- [kmeans-anchor-boxes](https://github.com/lars76/kmeans-anchor-boxes) 
- [Yolo9000](https://pjreddie.com/publications/yolo9000/)
-  [Yolo V2](https://pjreddie.com/darknet/yolov2/)
- [目标检测（九）--YOLO v1,v2,v3](https://blog.csdn.net/App_12062011/article/details/77554288)
- [Yolo9000算法分析](https://blog.csdn.net/small_munich/article/details/79548149)
- [pjreddie Publications](https://pjreddie.com/publications/)
- [YOLO v2算法详解+YOLO9000介绍](https://blog.csdn.net/Chunfengyanyulove/article/details/80860870)
- [YOLOv2 YOLOv3 如何选择先验框（priors anchor）（自用）](https://blog.csdn.net/Pattorio/article/details/80095511)
- [yoloV1，看过好多篇，这篇感觉讲的最通俗易懂](https://blog.csdn.net/m0_37192554/article/details/81092514)
- [目标检测之YOLO V2 V3](http://www.cnblogs.com/wangguchangqing/p/10480995.html)
- [从yolov1到yolov3](https://shartoo.github.io/2019/03/12/yolo-v123/)
- [YOLOv1，YOLOv2，YOLOv3解读](https://blog.csdn.net/hancoder/article/details/87994678)
- [YOLO900 Slides](https://docs.google.com/presentation/d/14qBAiyhMOFl_wZW4dA1CkixgXwf0zKGbpw_0oHK8yEM/edit#slide=id.p)

