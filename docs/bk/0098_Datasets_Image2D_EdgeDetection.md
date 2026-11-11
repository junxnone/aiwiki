-----

| Title     | Datasets Image2D EdgeDetection                       |
| --------- | ---------------------------------------------------- |
| Created @ | `2020-10-19T05:35:58Z`                               |
| Updated @ | `2026-11-11T09:36:57Z`                               |
| Labels    | \`\`                                                 |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/98) |

-----

# Edge Detection

边缘检测（Edge Detection）任务：预测图像中物体轮廓/语义边界的像素级二值图。常用 ODS / OIS / AP
指标（允许一定像素容差的边缘匹配 F-measure）。本文汇总常用数据集，总入口见 [Datasets
Image2D](0018_Datasets_Image2D)，相关任务见
[Detection](0237_Datasets_Image2D_Detection)、[Segmentation](0097_Datasets_Image2D_Segmentation)。

| Short name                                                                                    | Source Paper                                                                                                                                                                                          | Source               | Introduction                                                                         | 简单统计                                                   |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| [BSDS500](https://www2.eecs.berkeley.edu/Research/Projects/CS/vision/grouping/resources.html) | [Contour Detection and Hierarchical Image Segmentation](https://www2.eecs.berkeley.edu/Research/Projects/CS/vision/grouping/papers/amfm_pami2010.pdf)                                                 | TPAMI 2011           | Classical edge detection dataset. 经典边缘/轮廓检测数据集，每图有多位标注者的人工标注                         | 500 张图像（200 train / 100 val / 200 test），约 481×321（待核实） |
| [NYUDv2](https://github.com/s-gupta/rgbd#notes)                                               | [Perceptual Organization and Recognition of Indoor Scenes from RGB-D Images](https://www.cv-foundation.org/openaccess/content_cvpr_2013/papers/Gupta_Perceptual_Organization_and_2013_CVPR_paper.pdf) | CVPR 2013            | Edges come from the boundary of annotated segmentation mask. RGB-D 室内场景，边缘由分割标注的边界导出 | 1,449 张标注的 RGB-D 图像（待核实）                               |
| [Multi-cue](https://serre-lab.clps.brown.edu/resource/multicue/)                              | [A systematic comparison between visual cues for boundary detection](https://pubmed.ncbi.nlm.nih.gov/26748113/)                                                                                       | Vision research 2016 | With boundary annotations. 含双目视频序列，同时标注边界与轮廓                                         | 100 个场景（待核实）                                           |
| [Wireframe](https://github.com/cherubicxn/hawp#data-preparation)                              | [Holistically-Attracted Wireframe Parsing](https://arxiv.org/pdf/2003.01663)（HAWP，CVPR 2020）                                                                                                          | CVPR 2020            | Edges come from the annotated wireframe. 线框（线段 + 交点）解析数据                             | 待核实                                                    |

## 选择建议

  - 评测边缘检测算法（HED、RCF、BDCN 等）：BSDS500 为必选基准，常配合 NYUDv2 报告。
  - 需要深度/多模态：NYUDv2；需要贴近真实边界与轮廓区分：Multi-cue。
  - 几何结构/线段检测：Wireframe。

## 常见坑

  - BSDS500 有多位标注者，训练时需决定如何合并多标注（常取并集或随机/阈值化）。
  - 评测需非极大值抑制（NMS）与带容差的像素匹配，不同代码实现结果略有差异。
  - NYUDv2 的边缘是由分割标注导出的，不是直接人工画线。
