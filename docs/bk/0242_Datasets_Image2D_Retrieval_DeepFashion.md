-----

| Title     | Datasets Image2D Retrieval DeepFashion                |
| --------- | ----------------------------------------------------- |
| Created @ | `2019-02-26T08:15:17Z`                                |
| Updated @ | `2026-11-11T09:37:11Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/242) |

-----

# DeepFashion

DeepFashion 是香港中文大学 MMLab（刘子纬等）发布的大规模服饰数据库，论文为 CVPR 2016 "DeepFashion:
Powering Robust Clothes Recognition and Retrieval with Rich
Annotations"（论文题目与 CVPR 年份为记忆，arXiv
编号待核实）。特点是标注丰富：服饰类别、属性、关键点（landmarks）、商店-买家图像对。属于
[Retrieval 检索](0241_Datasets_Image2D_Retrieval) 类数据集，总入口见 [Datasets
Image2D](0018_Datasets_Image2D)。

> a large-scale clothes database, which has several appealing properties

## 五个基准

| 编号 | 基准                                 | 任务          | 说明                                      |
| -- | ---------------------------------- | ----------- | --------------------------------------- |
| 1  | Category and Attribute Prediction  | 服饰类别 + 属性分类 | 50 个类别、1,000 个属性（待核实）                   |
| 2  | In-shop Clothes Retrieval          | 店内检索        | 给定店内服饰图，在同一商店库中找同款不同角度                  |
| 3  | Consumer-to-shop Clothes Retrieval | 买家秀到商店检索    | 跨域（用户随手拍 vs 商店图）                        |
| 4  | Fashion Landmark Detection         | 服饰关键点检测     | 每件服饰 4~~8 个关键点（DeepFashion2 论文称 4~~8 个） |
| 5  | Fashion Synthesis                  | 服饰合成        | 基于属性/姿态生成图像                             |

规模：整个数据库约 80 万张图像（待核实）；各基准的子集规模不同，以官网为准。

## DeepFashion2

后续版本
[DeepFashion2](https://github.com/switchablenorms/DeepFashion2)（arXiv:1901.07973，*DeepFashion2:
A Versatile Benchmark for Detection, Pose Estimation, Segmentation and
Re-Identification of Clothing Images*）补足 DeepFashion
的缺点（每图只有一件服饰、关键点稀疏、无像素级掩码）：

  - 80.1 万件服饰，每件带风格、尺度、视角、遮挡程度、框、稠密关键点和掩码
  - 87.3 万个商店-买家服饰对
  - 四个任务：检测、姿态估计、分割、检索；基线为基于 Mask R-CNN 的 Match R-CNN
  - 类别 13 个，图像 49.1 万张（待核实）
  - 2019 年有 [DeepFashion2
    Challenge](https://codalab.lri.fr/competitions/565)

## 下载与格式

  - 官网：[DeepFashion](http://mmlab.ie.cuhk.edu.hk/projects/DeepFashion.html)；图像放在
    [Google
    Drive](https://drive.google.com/drive/folders/0B7EVK8r0v71pQ2FuZ0k0QnhBQnc)。
  - 部分压缩包有密码，需按官网说明填写申请表获取（待核实）。
  - 许可：仅限非商业研究用途（待核实，以官网声明为准）。
  - 标注多为文本文件：每行一条记录，字段用空格分隔。以 In-shop 检索的划分文件 `list_eval_partition.txt`
    为例（格式为记忆，待核实）：`image_name item_id evaluation_status`，status 取
    `train` / `query` / `gallery`。下面是解析示例：

<!-- end list -->

``` python
import collections

parts = collections.defaultdict(list)
with open("Eval/list_eval_partition.txt") as f:
    next(f); next(f)               # 前两行为条数和表头
    for line in f:
        name, item_id, status = line.split()
        parts[status].append((name, item_id))
print({k: len(v) for k, v in parts.items()})
```

关键点标注文件（Landmark benchmark）格式大致为 `image_name clothes_type variation_type
landmark_visibility_1 x_1 y_1 ...`（待核实）。

## 评测

  - 类别/属性预测：top-k 准确率、top-k 召回
  - 检索：top-k 检索准确率（Recall@K），店内检索中 query 和 gallery 为同一 item\_id 即算命中
  - 关键点：归一化误差

## 常见坑

1.  检索评测中 query / gallery / train 三个划分不能混用；同一 item 的图像不能同时出现在训练和测试。
2.  买家图和店内图域差异大，直接用 ImageNet 预训练特征效果较差，通常需要度量学习（triplet / ArcFace 等）。
3.  数据集的链接和密码常变化，下载前先看官网当前说明。
4.  DeepFashion 与 DeepFashion2 是两套不同的数据，类别和标注格式都不同。

## 相关

  - [Retrieval 检索汇总](0241_Datasets_Image2D_Retrieval)
  - [Datasets Image2D](0018_Datasets_Image2D)
  - [KeyPoint 关键点](0248_Datasets_Image2D_KeyPoint)

## Reference

  - [Google
    Drive](https://drive.google.com/drive/folders/0B7EVK8r0v71pQ2FuZ0k0QnhBQnc)
  - [Large-scale Fashion (DeepFashion)
    Database](http://mmlab.ie.cuhk.edu.hk/projects/DeepFashion.html)
  - [DeepFashion︱衣物时尚元素关键点定位+时尚元素对齐技术](https://blog.csdn.net/sinat_26917383/article/details/63682987)
  - [fashion-landmarks](https://github.com/liuziwei7/fashion-landmarks)
  - [fashion-detection](https://github.com/liuziwei7/fashion-detection)
  - [Dataset - DeepFashion
    服装数据集](https://blog.csdn.net/zziahgf/article/details/79387396)
  - [Dataset - DeepFashion2
    数据集](https://www.aiuai.cn/aifarm1192.html#1.DeepFashion2%E6%95%B0%E6%8D%AE%E9%9B%86)
  - [DeepFashion2
    Challenge 2019](https://codalab.lri.fr/competitions/565)
  - [DeepFashion2 (arXiv:1901.07973)](https://arxiv.org/abs/1901.07973)
