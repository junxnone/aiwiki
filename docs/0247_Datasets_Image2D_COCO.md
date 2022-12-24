---
Title | Datasets Image2D COCO
-- | --
Created @ | `2018-12-19T13:02:50Z`
Last Modify @| `2022-12-24T16:11:36Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/247)

---


## Reference

- [COCO dataset](http://cocodataset.org/#home)
- [Microsoft COCO: Common Objects in Context - 2015](https://arxiv.org/pdf/1405.0312.pdf)
- [COCO Annotation Data format](http://cocodataset.org/#format-data)
- [SSD Object Detection with opencv/training_toolbox_tensorflow](https://github.com/opencv/training_toolbox_tensorflow/blob/develop/training_toolbox/ssd_detector/README.md)
- [Detection Evaluation & Metrics](http://cocodataset.org/#detection-eval)
- [MS COCO数据集目标检测评估（Detection Evaluation）](https://blog.csdn.net/u014734886/article/details/78831884)
- [COCO数据库](https://blog.csdn.net/happyhorizion/article/details/77894205)
- [labelme2coco.py - labelme](https://github.com/wkentaro/labelme/blob/master/examples/instance_segmentation/labelme2coco.py)

## Brief

Microsoft COCO Datasets
- Detection
- Keypoints
- Segmentation
  - Stuff - Semantic Segmentation
  - Panoptic
- Captions

## Download

```
curl https://sdk.cloud.google.com | bash
mkdir train2017
gsutil -m rsync gs://images.cocodataset.org/train2017 train2017
wget http://images.cocodataset.org/annotations/annotations_trainval2017.zip
```

## COCO Challenges Tasks


Tasks | Labels
-- | --
Object Detection  | ![image](https://user-images.githubusercontent.com/2216970/50418173-ff085a00-0864-11e9-88a9-5394b99abc6a.png)
Stuff Segmentation | ![image](https://user-images.githubusercontent.com/2216970/75414553-e5303e80-5963-11ea-9baa-3ba469a49b67.png)
Panoptic Segmentation | ![image](https://user-images.githubusercontent.com/2216970/50418177-03347780-0865-11e9-992c-0aa2173a8309.png)
Keypoint Detection | ![image](https://user-images.githubusercontent.com/2216970/50418180-07609500-0865-11e9-8a2e-3d7dc4beeed6.png)
Captioning | ![image](https://user-images.githubusercontent.com/2216970/75739810-dcaf7d80-5d40-11ea-8954-ba9c045107d7.png)



## Annotation format
### Detection

```
annotation{
       "id" : int,
       "image_id" : int,
       "category_id" : int,
       "segmentation" : RLE or [polygon],
       "area" : float,
       "bbox" : [x,y,width,height],
       "iscrowd" : 0 or 1,
}

categories[{
       "id" : int,
       "name" : str, 
       "supercategory" : str,
}]
```
> iscrowd=1  是否是 semantic segmentation



