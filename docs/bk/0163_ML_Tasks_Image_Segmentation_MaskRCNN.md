-----

| Title         | ML Tasks Image Segmentation MaskRCNN                  |
| ------------- | ----------------------------------------------------- |
| Created @     | `2019-06-22T08:06:11Z`                                |
| Last Modify @ | `2022-12-24T12:51:51Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/163) |

-----

## Reference

  - [paper - Mask R-CNN](https://arxiv.org/abs/1703.06870)
  - [paper - R-CNN](https://arxiv.org/abs/1311.2524)
  - [paper - Fast R-CNN](https://arxiv.org/abs/1504.08083)
  - [paper - Faster R-CNN](https://arxiv.org/abs/1506.01497)
  - [基于 OpenCV 的 Mask RCNN 实现](https://www.aiuai.cn/aifarm1178.html)
  - [基于 Keras 的 Mask R-CNN 实现](https://www.aiuai.cn/aifarm1180.html)
  - [Mask R-CNN for object detection and instance segmentation on Keras
    and TensorFlow](https://github.com/matterport/Mask_RCNN)
  - [~~Detectron - Caffe2 -
    facebookresearch~~](https://github.com/facebookresearch/Detectron)
  - [Detectron2 - pytorch -
    facebookresearch](https://github.com/facebookresearch/detectron2)
  - [some other
    implementation](https://detectron2.readthedocs.io/notes/benchmarks.html)

## Brief

  - 基于 Faster R-CNN 结构构建
  - 使用 ROIAlign 模块替换 ROIPooling 模块
  - 在ROI Align 模块的输出端新增一个分支. 该分支的输入为 ROI Align 的输出，该分支的输出送入到两个 Conv 层.
    Conv 层的输出即为 mask.

| <img src="https://user-images.githubusercontent.com/2216970/70237532-67b0c400-17a2-11ea-9a1c-fe6e5b1d7e8c.png" width="500px"> | ![image](media/5a1fa920a239df6b74b367869ed8efc3581c05d6.png) |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |

Mask R-CNN 可以自动对图片中每个目标的进行分割，并构建像素级的 masks.

![image](media/e12082f17365b20276f624b80546358ed239c7f9.png)

## vs Faster RCNN

![image](media/b8ec60f159f5c8d37c25929d0558fa52db1f1a5d.png)

| Backbones | Head Architecture                                            |
| --------- | ------------------------------------------------------------ |
| ResNet    | ![image](media/d0d55398fffaf28c5fc11289ba79e09e0ccf0f8d.png) |
| FPN       | ![image](media/0dc3d21e2498ac27465cbf3ae918c8e83a37e36e.png) |

## ROIAlign

  - 不四舍五入取整, 减少量化时的损失
  - 使用 `bilinear interpolation` 方法取值

-----

![image](media/93003d55a410d9777a0c24ea3fa5f61d97ce9d1f.png)

-----

### Test Result - ROIPool vs ROIAlign

![image](media/62fe7899ea51b92cf5656b5e6a2e0e1b66fcbf34.png)
