---
Title | Datasets Image2D COCO
-- | --
Created @ | `2018-12-19T13:02:50Z`
Updated @| `2026-11-11T09:37:20Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/247)

---
# COCO

MS COCO（Microsoft Common Objects in Context）由微软等机构发布（论文 2014 年，ECCV 2014），收集日常复杂场景中处于自然上下文的常见物体，所有物体做逐实例分割标注。论文摘要称：数据集含 91 类易被 4 岁小孩识别的物体，共 32.8 万张图像、250 万个标注实例。它是目前最通用的检测/分割/关键点基准。

## 任务与标注

- Detection 目标检测（框 + 实例分割）
- Keypoints 人体关键点（17 点）
- Segmentation：Stuff 语义分割、Panoptic 全景分割
- Captions 图像描述

## 规模统计

项目 | 数值
-- | --
检测类别 | 80 类物体（原始 id 为 1–90，其中 10 个 id 未使用，故 id 不连续）
2017 划分 | train2017 约 118k / val2017 5k / test2017 约 41k 张（待核实）
Stuff / Panoptic | Stuff 91 类；Panoptic 133 类（80 thing + 53 stuff）（待核实）
图像 | JPEG，最长边通常约 640 像素，多为 640×480 左右
文件大小 | train2017 约 18GB、val2017 约 1GB、annotations 约 241MB（待核实）

## 挑战赛任务与标注示例

Tasks | Labels
-- | --
Object Detection  | ![image](https://user-images.githubusercontent.com/2216970/50418173-ff085a00-0864-11e9-88a9-5394b99abc6a.png)
Stuff Segmentation | ![image](https://user-images.githubusercontent.com/2216970/75414553-e5303e80-5963-11ea-9baa-3ba469a49b67.png)
Panoptic Segmentation | ![image](https://user-images.githubusercontent.com/2216970/50418177-03347780-0865-11e9-992c-0aa2173a8309.png)
Keypoint Detection | ![image](https://user-images.githubusercontent.com/2216970/50418180-07609500-0865-11e9-8a2e-3d7dc4beeed6.png)
Captioning | ![image](https://user-images.githubusercontent.com/2216970/75739810-dcaf7d80-5d40-11ea-8954-ba9c045107d7.png)

## 目录结构

```
coco/
├── train2017/            # 图像
├── val2017/
├── test2017/
└── annotations/
    ├── instances_train2017.json
    ├── instances_val2017.json
    ├── person_keypoints_train2017.json
    ├── captions_train2017.json
    └── image_info_test2017.json
```

## 标注格式

### Detection 标注

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
> iscrowd=1 表示一群同类物体（如人群），此时 segmentation 用 RLE 而非 polygon，评测时被忽略；并非"是否 semantic segmentation"。

bbox 为左上角 + 宽高的像素坐标，转换其他格式见 [BBox Format](0488_Datasets_Image2D_Detection_BBox)。

## 加载示例

```python
# pycocotools
from pycocotools.coco import COCO
coco = COCO("annotations/instances_val2017.json")
img_ids = coco.getImgIds()
anns = coco.loadAnns(coco.getAnnIds(imgIds=img_ids[0]))

# torchvision
from torchvision.datasets import CocoDetection
ds = CocoDetection("val2017", "annotations/instances_val2017.json")
img, targets = ds[0]   # targets 为 annotation 字典列表
```

## 下载与许可

```
curl https://sdk.cloud.google.com | bash
mkdir train2017
gsutil -m rsync gs://images.cocodataset.org/train2017 train2017
wget http://images.cocodataset.org/annotations/annotations_trainval2017.zip
```

也可直接 wget `http://images.cocodataset.org/zips/train2017.zip`、`val2017.zip`。许可：标注为 CC BY 4.0；图像来自 Flickr，各自有版权许可（请以官网为准，待核实）。

## 评测指标

主指标 AP（IoU 0.50:0.95 步长 0.05 平均），另有 AP50、AP75、APs/APm/APl（按面积分小/中/大）、AR。评测用 pycocotools 的 COCOeval。详见 [Detection Evaluation](http://cocodataset.org/#detection-eval)。基线结果随模型迭代变化大，请查各模型论文（此处不列，避免过时）。

## 常见坑

- category_id 不连续（1–90），训练时需映射到 0–79。
- bbox 是 xywh 而非 xyxy。
- iscrowd=1 的框通常需过滤或特殊处理。
- 部分图像无标注，部分框面积极小。
- val2014 / minival / val2017 的划分不同，对比结果需注意。

## 相关

[Detection 汇总](0237_Datasets_Image2D_Detection)、[Segmentation](0097_Datasets_Image2D_Segmentation)、[KeyPoint](0248_Datasets_Image2D_KeyPoint)、[LVIS](0094_Datasets_Image2D_Segmentation_LVIS)、[Pascal VOC](0092_Datasets_Image2D_PascalVOC)、[总入口](0018_Datasets_Image2D)。

## Reference

- [COCO dataset](http://cocodataset.org/#home)
- [Microsoft COCO: Common Objects in Context - 2014](https://arxiv.org/pdf/1405.0312.pdf)
- [COCO Annotation Data format](http://cocodataset.org/#format-data)
- [SSD Object Detection with opencv/training_toolbox_tensorflow](https://github.com/opencv/training_toolbox_tensorflow/blob/develop/training_toolbox/ssd_detector/README.md)
- [Detection Evaluation & Metrics](http://cocodataset.org/#detection-eval)
- [MS COCO数据集目标检测评估（Detection Evaluation）](https://blog.csdn.net/u014734886/article/details/78831884)
- [COCO数据库](https://blog.csdn.net/happyhorizion/article/details/77894205)
- [labelme2coco.py - labelme](https://github.com/wkentaro/labelme/blob/master/examples/instance_segmentation/labelme2coco.py)

