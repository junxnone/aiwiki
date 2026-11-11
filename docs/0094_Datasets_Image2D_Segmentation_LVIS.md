---
Title | Datasets Image2D Segmentation LVIS
-- | --
Created @ | `2020-04-22T09:05:35Z`
Updated @| `2026-11-11T09:36:48Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/94)

---
# LVIS

LVIS（Large Vocabulary Instance Segmentation）由 Facebook AI Research（Agrim Gupta, Piotr Dollár, Ross Girshick）发布，ICCV 2019 论文 [*LVIS: A Dataset for Large Vocabulary Instance Segmentation*](https://arxiv.org/abs/1908.03195)。摘要：约 **200 万**高质量实例分割标注，覆盖 **1000+** 个入门级（entry-level）物体类别、**164k** 张图像。重点是**长尾分布**：大量类别样本很少，用于评测长尾/少样本实例分割。

- 图像沿用 COCO 2017 的图片，只是使用了 LVIS 自己的 annotations
- 使用 `WordNet` 定义类别
- annotations 类似 `COCO format`，只使用 `polygons`
- 使用 [LVIS-API](https://github.com/lvis-dataset/lvis-api) 访问数据

![image](https://github.com/user-attachments/assets/695813a7-f0c8-4817-a9db-03b98e0a8ec0)

![image](https://github.com/user-attachments/assets/43560538-447a-4d16-b532-dced514593ba)

## 任务与标注

- 任务：Instance Segmentation（同时有 bbox），也用于 Object Detection 评测。
- 类别按训练集出现图像数分为三个 frequency：**rare**（1-10 张图）、**common**（11-100）、**frequent**（>100）。v1.0 约 1203 类，其中 rare/common/frequent 约 405 / 461 / 337（待核实）。
- 每张图仅对部分类别做"完整标注"：用 `neg_category_ids`（确认不存在）和 `not_exhaustive_category_ids`（可能未标全）表示，评测时对未验证的类别不惩罚。

## 规模统计

项目 | 数值
-- | --
图像数 | 约 164k（COCO 2017 图像）
类别数 | 1000+（v1.0 为 1203，待核实）
实例标注 | 约 200 万 mask
标注形式 | polygon，COCO 风格 json

## 数据划分

- “**Train**” 子集包含 10 万张图像，用于训练对象检测、分割和字幕模型。
- “**Val**” 子集有 2 万张图像，在模型训练期间用于验证目的。
- “**Minival**” 子集与 COCO val2017 集完全相同，其中有 5000 张图像在模型训练期间用于验证目的。
- “**Test**” 子集由 2 万张图像组成，用于测试和对训练后的模型进行基准测试。该子集的真实标注不公开，测试结果提交到 LVIS 评估服务器进行性能评估。

![image](https://github.com/user-attachments/assets/98e70dbe-bf31-41e8-84df-240e4f4b3759)

- Heavier tail - 尾部类别数量比 COCO 和 Open Images 更多
- Long tail - 在 5k 张图像上实例数量呈长尾分布
- Relative segmentation mask size - 更合理地比较不同数据集中对象分割掩码相对于整个图像的大小情况

## 标注格式

```
  {  
         info : info
         images : [images],
         annotations : [annotations],
         licenses  : [licenses],
  }  

  info{  
         year : int
         version : str,
         description : str,
         contributor : str,
         url : str,
         date_created : datetime,
  }  

  license{  
         id : int
         name : str,
         url : str,
  }  
```
```
  image{  
         id  : int
         width  : int,
         height  : int,
         license  : int,
         flickr_url  : str,
         coco_url  : str,
         date_captured  : datetime,
         not_exhaustive_category_ids  : [int],
         neg_category_ids  : [int],
  }  
```
```
  categories{  
         id  : int
         synset  : str,
         synonyms  : [str],
         def  : str,
         instance_count  : int,
         image_count  : int,
         frequency  : str,
  }  
```
```
 annotation{  
         id  : int
         image_id  : int,
         category_id  : int,
         segmentation  : [polygon],
         area  : float,
         bbox  : [x,y,w,h],
  }  
```

## 目录结构与加载示例

LVIS 只提供标注 json，图片需另从 COCO 下载：

```
lvis/   lvis_v1_train.json  lvis_v1_val.json ...
coco/   train2017/  val2017/  test2017/
```

用 lvis-api 读取（`pip install lvis`）：

```python
from lvis import LVIS
lvis = LVIS("lvis_v1_val.json")
img_ids = lvis.get_img_ids()
ann_ids = lvis.get_ann_ids(img_ids=img_ids[:1])
anns = lvis.load_anns(ann_ids)
print(anns[0]["bbox"], lvis.cats[anns[0]["category_id"]]["name"])
```

因为是 COCO 格式，也可用 torchvision 读取（评测仍需 LVISEval）：

```python
from torchvision.datasets import CocoDetection
ds = CocoDetection("coco/", "lvis_v1_train.json")  # 图片路径取决于 coco_url/file_name，需按实际目录调整
```

## 下载与许可

- 标注与说明见 [LVIS Dataset](https://www.lvisdataset.org/dataset)；图像请到 COCO 官网下载 2017 版。
- 许可：标注 CC BY 4.0，图像遵循 COCO/Flickr 许可（待核实）。

## 评测指标

- COCO 风格 AP（IoU 0.5:0.95，segm 与 bbox），并分别报告 **AP_r / AP_c / AP_f**（rare/common/frequent）。AP_r 是长尾方法的核心指标。
- 评测使用 lvis-api 的 `LVISEval`。
- 常见基线：Mask R-CNN + ResNet-50 在 LVIS v1 val 的 mask AP 约 20 左右，AP_r 明显低于 AP_f（待核实）。

## 常见坑

- 图像不在 LVIS 包里，需自行准备 COCO 2017 图片；LVIS v1 的 train/val 划分与 COCO 的不同，注意核对 `coco_url`。
- 版本区分：v0.5（1230 类，旧）与 v1.0（1203 类）类别 id 不兼容（待核实具体类别数）。
- 评测不能直接用 pycocotools，否则会把 neg/not-exhaustive 当成漏检。
- 长尾训练常配合重采样（repeat factor sampling）、equalization loss、seesaw loss 等。

## 相关数据集与站内链接

- [Datasets Image2D](0018_Datasets_Image2D)、[Segmentation 分割数据集](0097_Datasets_Image2D_Segmentation)
- [MS COCO](0247_Datasets_Image2D_COCO)、[COCO 检测指标](0384_ML_Metrics_Detection_COCO)
- [PascalVOC](0092_Datasets_Image2D_PascalVOC)、[Cityscapes](0093_Datasets_Image2D_Segmentation_Cityscapes)

## Reference

- [LVIS Dataset](https://www.lvisdataset.org/dataset)
- [paper - 2019 - LVIS: A Dataset for Large Vocabulary Instance Segmentation](https://arxiv.org/abs/1908.03195)
- [LVIS-API](https://github.com/lvis-dataset/lvis-api)

