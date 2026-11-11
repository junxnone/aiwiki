---
Title | Datasets Image2D Segmentation Cityscapes
-- | --
Created @ | `2020-04-17T04:43:37Z`
Updated @| `2026-11-11T09:36:46Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/93)

---
# Cityscapes

Cityscapes 是面向**城市街景语义理解**的大规模数据集，由 Daimler AG、MPI Informatics、TU Darmstadt 等发布，CVPR 2016 论文 *The Cityscapes Dataset for Semantic Urban Scene Understanding*（[arXiv:1604.01685](https://arxiv.org/abs/1604.01685)）。数据在德国及邻近国家 50 个城市的街道上用车载双目相机采集，涵盖春夏秋季、白天、良好/中等天气，提供像素级语义/实例标注，是自动驾驶场景分割的标准基准。

![image](https://user-images.githubusercontent.com/2216970/79532912-2bbf3100-80a9-11ea-895c-ce2efd6c8089.png)

## 任务与标注

- Semantic Segmentation（像素级）：共 30 类，其中 **19 类**参与评测（`trainId` 0-18），其余标为 ignore（255）。8 个大组：flat, human, vehicle, construction, object, nature, sky, void。
- Instance Segmentation：8 个可数类（person, rider, car, truck, bus, train, motorcycle, bicycle）。
- Panoptic Segmentation：19 类（11 stuff + 8 thing）。
- 另外提供：右目图像、视差/深度、GPS 与车辆里程、粗标注（coarse）等。

## 规模统计

项目 | 数值
-- | --
精细标注（gtFine） | 5,000 张：train 2,975 / val 500 / test 1,525（test 标注不公开）
粗标注（gtCoarse） | 20,000 张（train_extra 19,998 张 + 少量其他，待核实）
城市 | 50 个
分辨率 | 2048 x 1024
评测类别 | 19 类（共 30 类定义）
下载包大小 | `gtFine_trainvaltest.zip` 约 241 MB；`leftImg8bit_trainvaltest.zip` 约 11 GB（待核实其余大包体积）

## 目录结构与标注格式

```
cityscapes/
  leftImg8bit/{train,val,test}/<city>/<city>_<seq>_<frame>_leftImg8bit.png
  gtFine/{train,val,test}/<city>/
      <city>_<seq>_<frame>_gtFine_labelIds.png      # 原始 id (0-33)
      <city>_<seq>_<frame>_gtFine_instanceIds.png   # 实例 id (类id*1000+实例序号)
      <city>_<seq>_<frame>_gtFine_color.png         # 可视化
      <city>_<seq>_<frame>_gtFine_polygons.json     # 多边形
```

注意：`labelIds` 是 0-33 的原始 id，训练要映射到 `trainIds`（19 类 + 255）。官方工具 [cityscapesScripts](https://github.com/mcordts/cityscapesScripts) 的 `createTrainIdLabelImgs.py` 可生成 `*_labelTrainIds.png`。

torchvision 加载（需手动下载，不能自动下载）：

```python
import numpy as np
from torchvision.datasets import Cityscapes
from cityscapesscripts.helpers.labels import labels

ds = Cityscapes("data/cityscapes", split="train", mode="fine",
                target_type="semantic")
img, mask = ds[0]          # mask 为原始 labelIds，需自行映射到 trainId

id2train = np.full(256, 255, np.uint8)
for l in labels:
    if 0 <= l.trainId < 255:
        id2train[l.id] = l.trainId
mask_train = id2train[np.array(mask)]
```

## 下载与许可

- 到 [官网](https://www.cityscapes-dataset.com/) 注册账号（需机构邮箱，人工审核），登录后在 Downloads 页面下载。
- 许可：仅限非商业研究/教育用途，禁止再分发，使用需引用论文；详见官网 license 页面。

## 评测指标与常见基线

- 语义分割：mIoU（19 类）；另有 iIoU（实例敏感）、类别和类别组的 IoU。
- 实例分割：AP、AP50（官方）。
- 常见结果：主流 DeepLabv3+、HRNet-OCR、SegFormer 等在 val 上 mIoU 大致 80-85%，具体数值依骨干与训练设置而异（待核实）。

## 常见坑

- 标注 id 与 trainId 不同，直接用 labelIds 训练会得到 34 类、结果错误。
- 图像 2048x1024，显存占用大，训练常用随机裁剪和缩放。
- test 标注不公开，需提交到官方评测服务器；本地用 val 报结果。
- 需注册审核，不能直接 wget；`train_extra` 粗标注体积很大。

## 相关数据集与站内链接

- [Datasets Image2D](0018_Datasets_Image2D)、[Segmentation 分割数据集](0097_Datasets_Image2D_Segmentation)
- [PascalVOC](0092_Datasets_Image2D_PascalVOC)、[LVIS](0094_Datasets_Image2D_Segmentation_LVIS)、[MS COCO](0247_Datasets_Image2D_COCO)
- 相似场景数据集（外部）：CamVid、BDD100K、Mapillary Vistas、KITTI。

## Reference

- [官网](https://www.cityscapes-dataset.com/dataset-overview/)
- [paper - 2016 - The Cityscapes Dataset for Semantic Urban Scene Understanding](https://arxiv.org/abs/1604.01685)
- [cityscapesScripts](https://github.com/mcordts/cityscapesScripts)

