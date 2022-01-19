---
Title | Image Segmentation
-- | --
Create Date | `2019-03-28T03:26:31Z`
Update Date | `2022-01-19T07:51:38Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/159)

---
## Reference

- [paper - Panoptic Segmentation](https://arxiv.org/pdf/1801.00868.pdf)
- [论文阅读理解 - Panoptic Segmentation 全景分割](https://blog.csdn.net/zziahgf/article/details/79063398)
- [语义分割和实例分割概念](https://blog.csdn.net/yql_617540298/article/details/83143182)
- [Image Segmentation](https://blog.csdn.net/weixin_38208741/article/details/80474813)
- [深度学习---之全卷积神经网络取代全连接层--用于图像分割](https://blog.csdn.net/zxyhhjs2017/article/details/78603332)
- [SemanticSegmentation_DL](https://github.com/tangzhenyu/SemanticSegmentation_DL)
- [A Beginner's guide to Deep Learning based Semantic Segmentation using Keras](https://divamgupta.com/image-segmentation/2019/06/06/deep-learning-semantic-segmentation-keras.html)
- [从loss处理图像分割中类别极度不均衡的状况---keras](https://blog.csdn.net/m0_37477175/article/details/83004746)
- [图像语义分割准确率度量方法总结](https://zhuanlan.zhihu.com/p/38236530)
- [Segmentation综述](https://www.cnblogs.com/kk17/p/10017224.html)
- [语义分割 | 发展综述](https://zhuanlan.zhihu.com/p/37618829)
- [图像语义分割入门+FCN/U-Net网络解析](https://zhuanlan.zhihu.com/p/31428783)
- [第九章 图像分割 - DeepLearning-500-questions](https://github.com/scutan90/DeepLearning-500-questions/blob/master/ch09_%E5%9B%BE%E5%83%8F%E5%88%86%E5%89%B2/%E7%AC%AC%E4%B9%9D%E7%AB%A0_%E5%9B%BE%E5%83%8F%E5%88%86%E5%89%B2.md)
- [awesome-semantic-segmentation](https://github.com/mrgloom/awesome-semantic-segmentation)
- [A Review on Deep Learning Techniques Applied to Semantic Segmentation](https://arxiv.org/pdf/1704.06857.pdf)
- [Evaluating image segmentation models. - Jeremy Jordan](https://www.jeremyjordan.me/evaluating-image-segmentation-models/)
- [深度学习语义分割理论与实战指南](https://github.com/luwill/Semantic-Segmentation-Guide)


## Brief
- [Traditional Segmentation](/Traditional_Image_Segmentation)

## Algos

- [FCN](/FCN)
- [UNet](/UNet)
- [Deeplab](/Deeplab)
- [Mask RCNN](/Mask_RCNN)
- [Mask Scoring R-CNN](/Mask_Scoring_RCNN)
- [DETR](/DETR)

## Tasks

Name | Description | Sample
-- | -- | --
语义分割 <br>Semantic Segmentation <br>全像素语义分割 <br>Full-Pixel Semantic Segmentation | 将每个像素分类为属于对象类的过程<br>常用来识别天空、草地、道路等没有固定形状的不可数事物 | ![image](https://user-images.githubusercontent.com/2216970/87275997-f7290d00-c511-11ea-98ac-b0e1430ca2e7.png)
实例分割 <br>Instance Segmentation | 将每个像素分类为属于对象类以及该类的实体ID <br>人、动物或工具等可数的、独立的明显物体 | ![image](https://user-images.githubusercontent.com/2216970/87276014-014b0b80-c512-11ea-82d0-cde2a920697c.png)
全景分割 <br>Panoptic Segmentation | 前景使用 `instance segmentation`<br>背景使用 `semantic segmentation` <br> 分类为 `Semantic Label` 和 `Instance ID` | ![image](https://user-images.githubusercontent.com/2216970/87276019-090ab000-c512-11ea-888e-3703756e7ee4.png)



## DL Net History

时间 |Net | Improve
-- | -- | --
CVPR  2015.06 | FCN  | FC2CONV / FCN-8S-16S-32S
2015 | DeconvNet | 使用了 UnPooling 
MICCAI 2015.09 | UNet | Concat 替换 Add
CVPR 2015 - PAMI 2017 | SegNet | 增加了BN, 去掉了FC
ICLR 2015 | Deeplab V1 |
CVPR 2017 | PSPNet | 金字塔池化模块收集全局 feature
2017 | Mask-RCNN
CVPR 2017 | RefineNet
CVPR 2017 |G-FRNet
TPAMI 2017 | Deeplab V2 | 
-- | Deeplab V3 | 
-- | Deeplab V3+ | 

> 按论文发表时间顺序排列，研究时间及内容等我觉得都是 `long story`


