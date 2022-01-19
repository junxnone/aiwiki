---
Title | Instance Segmentation
-- | --
Create Date | `2019-01-24T22:01:24Z`
Update Date | `2022-01-19T08:07:19Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/167)

---
## Reference
- [Instance Segmentation入门总结](https://www.cnblogs.com/Xiaoyan-Li/p/10156463.html)
- [进展综述 - 单阶段实例分割（Single Shot Instance Segmentation）](https://zhuanlan.zhihu.com/p/102231853)
- Training Oxford-IIIT Pets Dataset with tensorflow/models junxnone/tech-io#253
- [Tensorflow/models - Run an Instance Segmentation Model](https://github.com/tensorflow/models/blob/master/research/object_detection/g3doc/instance_segmentation.md)
- [instance_segmentation - opencv/openvino_training_extensions](https://github.com/opencv/openvino_training_extensions/tree/develop/pytorch_toolkit/instance_segmentation)
- [PaddleDetection](https://github.com/PaddlePaddle/PaddleDetection)
- [detectron2 - facebookresearch](https://github.com/facebookresearch/detectron2) 
  - [Tutorial.ipynb - colab](https://colab.research.google.com/drive/16jcaJoc6bCFAQ96jDe2HwtXj7BMD_-m5#scrollTo=hBXeH8UXFcqU)


## Brief

## 分类

Name | Description | example
-- | -- | --
Top-Down |  `目标检测` -> `BBox` -> `语义分割` -> `Instance Seg` | Mask R-CNN
Bottom-Up | `语义分割` -> `聚类&度量学习` -> `Instance Seg` |  [Discriminative Loss Function](https://arxiv.org/abs/1708.02551)
Single Shot  | |YOLACT<br>SOLO<br>PolarMask<br>AdaptIS<br>BlendMask<br>  


## History

Date | Name /paper
-- | -- 
2016.3 | InstanceFCN  - Instance-sensitive Fully Convolutional Networks
2016.11 | FCIS - Fully Convolutional Instance-aware Semantic Segmentation
2019.4 | YOLACT/YOLACT++ - You Only Look At CoefficienTs
2019.11 | CenterMask : Real-Time Anchor-Free Instance Segmentation
2019.12 | SOLO: Segmenting Objects by Locations
2020 | BlendMask - Top-Down Meets Bottom-Up for Instance Segmentation

## Metrics

