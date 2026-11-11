-----

| Title     | Datasets Image2D Segmentation MCC                    |
| --------- | ---------------------------------------------------- |
| Created @ | `2020-04-15T08:56:58Z`                               |
| Updated @ | `2026-11-11T09:36:42Z`                               |
| Labels    | `index`                                              |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/91) |

-----

# Mapping Challenge crowdAI

CrowdAI Mapping Challenge 是航拍/卫星影像的建筑物分割比赛数据集，目标是从遥感图像中分割出建筑物，用于
"Building Missing Maps with Machine Learning"（辅助地图绘制）。比赛平台 crowdAI
已关闭，迁移为 AIcrowd。

## 来源

  - 平台：crowdAI（现 AIcrowd），Mapping Challenge。
  - 比赛后有开源方案，例如 neptune-ai 的 open-solution-mapping-challenge。

## 任务与标注

  - 建筑物实例分割（单类 building），也常作为二值语义分割使用。
  - 标注为 COCO 格式 JSON，建筑物以多边形表示。

## 规模统计

| 划分    | 图像数     |
| ----- | ------- |
| Train | 280,741 |
| Val   | 60,317  |
| Test  | 60,697  |

  - 图像为 RGB 小切片，约 300×300 像素（待核实）。
  - 类别数：1。

## 目录结构与加载

    data/
    ├── train/images/*.jpg   train/annotation.json   (annotation-small.json 为小子集，待核实)
    ├── val/images/*.jpg     val/annotation.json
    └── test_images/*.jpg

使用 pycocotools / torchvision 读取：

``` python
from torchvision.datasets import CocoDetection
ds = CocoDetection("data/train/images", "data/train/annotation.json")
img, anns = ds[0]

from pycocotools.coco import COCO
coco = COCO("data/train/annotation.json")
m = coco.annToMask(anns[0])  # 单个建筑物 mask
```

## 下载与许可

  - crowdAI 已关闭，从 AIcrowd 的数据页下载（需注册账号）：见 Reference。
  - 许可：以 AIcrowd 比赛页面条款为准（待核实）。

## 评测与基线

  - 官方指标：COCO 风格 AP / AR（待核实具体设置）。榜单数值待核实。
  - 常见方案：Mask R-CNN；或 U-Net 做二值分割再后处理分离实例。

## 常见坑

  - 建筑物密集相连，二值分割后需要分水岭等后处理才能得到实例。
  - 训练集 28 万张，体量大，建议先抽取小子集调试。
  - 测试集无公开标注，本地评测请用 val。
  - 部分切片中建筑物被边界截断。

## 相关

  - [Segmentation
    汇总](0097_Datasets_Image2D_Segmentation)、[COCO](0247_Datasets_Image2D_COCO)、[Datasets
    Image2D](0018_Datasets_Image2D)

## Reference

  - [Mapping
    Challenge](https://www.crowdai.org/challenges/mapping-challenge)
  - [download from
    aicrowd](https://www.aicrowd.com/challenges/mapping-challenge/dataset_files)
  - [mapping-challenge-round2-starter-kit](https://github.com/crowdAI/mapping-challenge-round2-starter-kit)
  - [open-solution-mapping-challenge -
    neptune-ai](https://github.com/neptune-ai/open-solution-mapping-challenge)
