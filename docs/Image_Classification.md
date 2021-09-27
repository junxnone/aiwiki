---
Title | Image Classification
-- | --
Create Date | `2021-09-27T10:40:07Z`
Update Date | `2021-09-27T10:40:07Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/61)

---
#  Reference
- [Multitask-Learning](https://github.com/mbs0221/Multitask-Learning)

# Brief
- 图像分类任务
  - **二分类**
  - **多分类**
  - **多标签分类**: 一张图像多个标签(标签为二分类)
  - **Multi-Ouput&Multi-Task**: 一张图片多个标签(标签为多分类)
- [经典分类方法](https://junxnone.github.io/aiwiki/#/Classic_Algos?id=classification)


Labels per Image / Label Value | K = 2 | K > 2
-- | -- | --
Labels = 1 | Binary/sigmoid | Multi-Class/softmax
Labels > 1 | Multi-Label/sigmoid | Multi-Output/task



# 常见的挑战

- viewpoint variation 图一个物体,只是拍摄的角度不同,对不同图片,要能够正确识别.
- scale variation 同一个物品,只是形状不同,对不同图片,要能够正确识别.
- deformation 姿态不同
- occlusion 有遮挡
- illumination 光线明暗差别
- background clutter 背景有很多噪音图片
- intra-class variration 属于同一种类,类内差别 比如图片中6个物体均应该分类为椅子

![image](https://user-images.githubusercontent.com/2216970/57583786-a29d9280-7506-11e9-9369-16a55f68e678.png)

