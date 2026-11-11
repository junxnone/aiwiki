---
Title | Datasets Image2D Segmentation TACO
-- | --
Created @ | `2020-04-15T08:05:46Z`
Updated @| `2026-11-11T09:36:37Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/89)

---
# TACO

TACO（Trash Annotations in Context）是野外垃圾图像数据集，包含在树林、马路、海滩等多种环境下拍摄的垃圾，按层级分类体系做了人工分割标注，用于垃圾检测/实例分割，并通过众包持续增长。

## 来源

- 作者：Pedro F. Proença、Pedro Simões，arXiv:2003.06975（2020），*TACO: Trash Annotations in Context for Litter Detection*。
- 论文用 Mask R-CNN 报告了实例分割结果，并指出数据量仍偏小（摘要：1500 张图、4784 个标注）。

![image](https://user-images.githubusercontent.com/2216970/79313522-0b6d6600-7f33-11ea-9bb5-052e3a33defe.png)

## 规模统计

> stats `@2020.04.15`（官方持续增长，最新数字以官网为准）

- 1500 images
- 4784 annotations
- 28 super (top) categories
- 60 categories

Scene proportion | super category | category
-- | -- | --
![image](https://user-images.githubusercontent.com/2216970/79313698-4ec7d480-7f33-11ea-89fc-04736587121e.png) | ![image](https://user-images.githubusercontent.com/2216970/79313678-440d3f80-7f33-11ea-8f16-36eee9e8599c.png) | ![image](https://user-images.githubusercontent.com/2216970/79313681-45d70300-7f33-11ea-87c2-4422fafee3e7.png)

## 标注格式与加载

标注为 COCO 格式 JSON（官方 README 说明），仓库提供下载脚本获取图像（图像托管在外部站点，按 URL 下载）。可直接用 pycocotools / torchvision：

```python
from torchvision.datasets import CocoDetection
ds = CocoDetection("TACO/data", "TACO/data/annotations.json")
img, anns = ds[0]   # anns 含 bbox、segmentation、category_id
```

```python
from pycocotools.coco import COCO
coco = COCO("TACO/data/annotations.json")
cats = coco.loadCats(coco.getCatIds())
print(len(cats), [c["supercategory"] for c in cats][:5])
```

## 下载与许可

- 通过 GitHub 仓库的下载脚本获取；官网 tacodataset.org 提供在线标注工具以贡献数据。
- 许可：见仓库说明（待核实，图像来源不同，版权各异）。

## 评测与基线

- 指标：COCO 风格的 bbox/mask AP。
- 论文基线为 Mask R-CNN；由于类别多、样本少，细分类结果较低，实用中常合并为少数几个大类。

## 常见坑

- 类别长尾严重：许多类只有很少实例，通常合并为 10 类左右使用。
- 目标小、背景杂（落叶、石子、沙滩），小目标召回低。
- 图像通过 URL 下载，部分链接可能失效，需检查下载完整性。

## 相关

- [Segmentation 汇总](0097_Datasets_Image2D_Segmentation)、[COCO](0247_Datasets_Image2D_COCO)、[Datasets Image2D](0018_Datasets_Image2D)

## Reference

- [Github repo](https://github.com/pedropro/TACO)
- [online annootation tools](http://tacodataset.org/annotate)
- [TACO 论文 arXiv:2003.06975](https://arxiv.org/abs/2003.06975)

