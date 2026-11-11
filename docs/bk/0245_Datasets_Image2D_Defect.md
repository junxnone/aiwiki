-----

| Title     | Datasets Image2D Defect                               |
| --------- | ----------------------------------------------------- |
| Created @ | `2019-04-01T05:41:31Z`                                |
| Updated @ | `2026-11-11T09:37:15Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/245) |

-----

# Defect/Anomaly Dataset 缺陷与异常检测数据集

工业缺陷检测与异常检测数据集用于表面划痕、裂纹、污渍等缺陷的分类、定位与分割。异常检测通常是**无监督/单类**设定：训练集只含正常样本，测试集含正常与异常样本，评测图像级
AUROC 和像素级 AUROC / PRO。任务介绍见 [Image
Anomaly](0277_ML_Tasks_Image_Anomaly)，工具见
[anomalib](0321_Tools_anomalib)，总入口见 [Datasets
Image2D](0018_Datasets_Image2D)。

> 规模数字说明：标"（待核实）"的是凭记忆给出、未逐项核对的数字，使用前请以官方页面为准。

## 分类表

| 数据集               | 描述                                                                         | 简单统计                                                              | 链接                                                                                                                                                                                                                                                                                                                                                             |
| ----------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MVTec AD          | 工业异常检测标准基准，物体与纹理两大类，有像素级掩码                                                 | 15 类，约 5,354 张图像（待核实）                                             | [官网](https://www.mvtec.com/company/research/datasets/mvtec-ad)、[paper](https://www.mvtec.com/fileadmin/Redaktion/mvtec.com/company/research/datasets/mvtec_ad.pdf)、[download](https://www.mydrive.ch/shares/38536/3830184030e49fe74747669442f0f282/download/420938113-1629952094/mvtec_anomaly_detection.tar.xz)、站内 [MVTec](0323_ML_Tasks_Image_Anomaly_MVTec) |
| VisA              | PCB、Capsules、Candles、Macaroni、Cashew、Chewing gum、Fryum、Pipe fryum 等 12 个物体 | 10,821 张高分辨率彩色图像（9,621 正常 + 1,200 异常），有图像/像素级标签（arXiv:2207.14315） | [GitHub](https://github.com/amazon-science/spot-diff?tab=readme-ov-file#data-description)、[download](https://amazon-visual-anomaly.s3.us-west-2.amazonaws.com/VisA_20220922.tar)                                                                                                                                                                               |
| MPDD              | 金属零件缺陷，拍摄姿态/光照/背景有变化                                                       | 约 1,346 张图像、6 类（待核实）                                              | [GitHub](https://github.com/stepanje/MPDD)                                                                                                                                                                                                                                                                                                                     |
| BTAD              | beanTech 工业异常数据集（3 种产品）                                                    | 约 2,830 张图像（待核实）                                                  | [download](http://avires.dimi.uniud.it/papers/btad/btad.zip)                                                                                                                                                                                                                                                                                                   |
| SDD / KolektorSDD | 电气换向器表面缺陷（裂纹）                                                              | 399 张图像（待核实）                                                      | [官网](https://www.vicos.si/resources/kolektorsdd/)                                                                                                                                                                                                                                                                                                              |
| NEU 热轧带钢缺陷        | 东北大学热轧带钢表面缺陷（NEU-CLS 分类 / NEU-DET 检测）                                      | 6 类缺陷，每类 300 张、共 1,800 张灰度图，200×200（待核实）                          | [官网](http://faculty.neu.edu.cn/yunhyan/NEU_surface_defect_database.html)                                                                                                                                                                                                                                                                                       |
| DAGM              | DAGM 2007 表面纹理缺陷，合成纹理背景 + 弱监督椭圆标注                                          | 10 类（待核实）                                                         | [Kaggle](https://www.kaggle.com/datasets/mhskjelvareid/dagm-2007-competition-dataset-optical-inspection)、[download](https://zenodo.org/records/8086136)、站内 [DAGM](0095_Datasets_Image2D_Segmentation_DAGM)                                                                                                                                                     |
| DTD-Synthetic     | 基于 DTD 纹理合成的异常数据，用于纹理异常检测                                                  | 12 类纹理，分 3 个类别各 4 种                                               | [Google Drive](https://drive.google.com/drive/folders/10OyPzvI3H6llCZBxKxFlKWt1Pw1tkMK1)、站内 [DTD-Synthetic](0482_Datasets_Image2D_DTDSynthetic)、[DTD](0481_Datasets_Image2D_DTD)                                                                                                                                                                               |

另见 [AnomalyCLIP - Industrial/Medical
Datasets](https://github.com/zqhang/AnomalyCLIP?tab=readme-ov-file#prepare-your-dataset)，该仓库汇总了工业和医疗异常检测数据集的准备方法。

## 选择建议

| 需求          | 建议                                   |
| ----------- | ------------------------------------ |
| 论文对比的标准基准   | MVTec AD（必选）、VisA                    |
| 纹理类异常       | MVTec 的纹理子集、DTD-Synthetic、DAGM       |
| 金属 / 钢材表面   | NEU、MPDD、KolektorSDD                 |
| 需要有监督分割标注   | DAGM、MVTec AD、VisA                   |
| 小样本/零样本异常检测 | VisA、MVTec AD、MPDD（配合 AnomalyCLIP 等） |

注意：

1.  学术基准样本整洁、对齐，真实产线图像的光照、位姿、背景变化更大，需要自建验证集。
2.  MVTec AD 的图像级 AUROC 已接近饱和，只比它区分度不够。
3.  部分数据集为非商业许可（如 MVTec AD，待核实），商用前核对。
4.  下载链接可能失效，以官网为准。

## Reference

  - [几种表面缺陷检测数据集](https://zhuanlan.zhihu.com/p/59836697)
  - [缺陷检测数据集汇总（附下载链接）](https://aijishu.com/a/1060000000087666)
  - [AnomayCLIP - Industrial/Medical
    Datasets](https://github.com/zqhang/AnomalyCLIP?tab=readme-ov-file#prepare-your-dataset)
  - [VisA (arXiv:2207.14315)](https://arxiv.org/abs/2207.14315)
