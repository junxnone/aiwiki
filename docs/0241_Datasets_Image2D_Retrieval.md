---
Title | Datasets Image2D Retrieval
-- | --
Created @ | `2019-03-10T14:21:50Z`
Updated @| `2026-11-11T09:37:09Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/241)

---
# Image Retrieval 图像检索数据集

图像检索（Image Retrieval）给定查询图像，在图库中找出相同实例（地标、商品、服饰）或相似内容的图像，常用 Recall@K、mAP 评测。本文按子类整理常用数据集、简述和规模，并链接本站已有的专题文章。总入口见 [Datasets Image2D](0018_Datasets_Image2D)。

> 规模数字说明：标"（待核实）"的是凭记忆给出、未逐项核对的数字，使用前请以官方页面为准。

## 分类表

### 实例/地标检索

数据集 | 描述 | 简单统计 | 链接
-- | -- | -- | --
INRIA Holidays | 度假照片，同场景多视角，常带旋转问题 | 约 1,491 张图像、500 组查询（待核实） | 原文未给链接
Oxford Buildings (Oxford5k) | 牛津地标建筑，经典实例检索基准 | 约 5,062 张图像、55 个查询（待核实） | 原文未给链接
Oxford Paris (Paris6k) | 巴黎地标建筑 | 约 6,412 张图像（待核实） | 原文未给链接
201Books and CTurin180 | 书籍封面 / 都灵街景，移动视觉搜索用 | （待核实） | 原文未给链接
Stanford Mobile Visual Search | 手机拍摄的 CD/DVD 封面、书、名片、画作等 | （待核实） | 原文未给链接
[UKBench](https://archive.org/details/ukbench) | 每组 4 张同一物体的不同拍摄 | 约 10,200 张图像、2,550 组（待核实） | [archive.org](https://archive.org/details/ukbench)
MIR-FLICKR | Flickr 图像，用于检索与标注研究 | 25,000（MIRFLICKR-25000）（待核实） | 原文未给链接

### 商品/服饰检索

数据集 | 描述 | 简单统计 | 链接
-- | -- | -- | --
[DeepFashion](http://mmlab.ie.cuhk.edu.hk/projects/DeepFashion.html) | 港中文 MMLab 大规模服饰库，含类别/属性、店内检索、商店-买家检索、关键点、合成 5 个基准 | 约 80 万张图像（待核实） | [专文](0242_Datasets_Image2D_Retrieval_DeepFashion)
[DeepFashion2](https://github.com/switchablenorms/DeepFashion2) | 检测、姿态、分割、检索四任务基准，每图多件服饰 | 80.1 万件服饰、87.3 万个商店-买家图像对（arXiv:1901.07973）；13 类 | [GitHub](https://github.com/switchablenorms/DeepFashion2)
[Stanford Online Products](http://cvgl.stanford.edu/projects/lifted_struct/) | eBay 商品，度量学习标准基准 | 约 12 万张图像、2.2 万类（待核实） | [项目页](http://cvgl.stanford.edu/projects/lifted_struct/)

## 选择建议

需求 | 建议
-- | --
地标/建筑实例检索基准 | Oxford5k / Paris6k（注意常配 Revisited 标注，待核实）；更大规模用 Google Landmarks v2，见 [Datasets Image2D](0018_Datasets_Image2D)
通用度量学习（深度哈希/对比学习） | Stanford Online Products
服饰检索 / 以图搜衣 | DeepFashion（店内、商店-买家）；多件服饰、更真实场景用 DeepFashion2
小规模快速验证 | UKBench、Holidays

注意：

1. 检索数据集的"训练/测试"划分与"查询/图库"划分是两回事，需按官方协议。
2. 老数据集（Oxford5k 等）存在标注错误，后来有修订版，论文对比要看用的是哪个版本。
3. 服饰类数据集多为学术研究用途，商用前核对许可。

## Reference

- [DeepFashion 官网](http://mmlab.ie.cuhk.edu.hk/projects/DeepFashion.html)
- [DeepFashion2](https://github.com/switchablenorms/DeepFashion2)
- [DeepFashion2 (arXiv:1901.07973)](https://arxiv.org/abs/1901.07973)
- [UKBench](https://archive.org/details/ukbench)
- [Stanford Online Products](http://cvgl.stanford.edu/projects/lifted_struct/)

