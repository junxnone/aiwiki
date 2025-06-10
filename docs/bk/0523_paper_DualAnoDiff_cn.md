-----

| Title     | paper DualAnoDiff cn                                  |
| --------- | ----------------------------------------------------- |
| Created @ | `2025-06-10T02:42:05Z`                                |
| Updated @ | `2025-06-10T02:42:05Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/523) |

-----

# DualAnoDiff CN

**Dual-Interrelated Diffusion Model for Few-Shot Anomaly Image
Generation**

    Ying Jin1∗, Jinlong Peng2*, Qingdong He2∗, Teng Hu3, Jiafu Wu2, Hao Chen1
    Haoxuan Wang1, Wenbing Zhu1, Mingmin Chi1†
    , Jun Liu2, Yabiao Wang2,4†
    1Fudan University, 2Youtu Lab, Tencent, 3Shanghai Jiao Tong University, 4Zhejiang University
    {yjin22, haochen22, hxwang23, wbzhu23}@m.fudan.edu.cn, mmchi@fudan.edu.cn
    {jeromepeng, yingcaihe, jiafwu, juliusliu}@tencent.com, hu-teng@sjtu.edu.cn, yabiaowang@zju.edu.cn

**<https://github.com/yinyjin/DualAnoDiff>**

## 摘要

工业制造中的异常检测性能受到异常数据稀缺的限制。为了克服这一挑战，研究人员已开始采用异常生成方法来扩充异常数据集。然而，现有异常生成方法存在生成异常的多样性有限、难以实现异常与原始图像的无缝融合等问题。此外，生成的掩码通常与生成的异常区域不匹配。在本文中，我们从新的视角克服了这些挑战，同时生成了一对整体图像和相应的异常部分。我们提出了DualAnoDiff，这是一种新型的基于扩散模型的小样本异常图像生成模型，该模型通过使用两个相互关联的扩散模型来生成多样化且逼真的异常图像，其中一个模型用于生成整体图像，另一个用于生成异常部分。此外，我们提取背景和形状信息，以缓解小样本图像生成中的扭曲和模糊现象。大量实验表明，我们提出的模型在多样性、真实性和掩码准确性方面优于最先进的方法。总体而言，我们的方法显著提高了下游异常检测任务的性能，包括异常检测、异常定位和异常分类任务。代码将公开提供。
