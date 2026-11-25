---
Title | ML Tasks Image Anomaly MVTec
-- | --
Created @ | `2022-12-05T08:08:10Z`
Updated @| `2026-11-25T16:56:25Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/323)

---
# MVTec

- MVTec AD是MVtec公司提出的一个用于异常检测的数据集
- 模仿了工业实际生产场景
- 主要用于unsupervised anomaly detection
- 为异常区域都提供了像素级标注
- 包含不同领域中的五种纹理以及十种物体
- 训练集中只包含正常样本，测试集中包含正常样本与缺陷样本

![image](https://user-images.githubusercontent.com/2216970/205585319-c7795dcd-891d-4e86-b1f3-d3f3196997f3.png)

## Statistical overview

![image](https://user-images.githubusercontent.com/2216970/205589876-dc4aabd8-8842-42aa-a9b2-f3fbcabe0a16.png)

![image](https://user-images.githubusercontent.com/2216970/205590065-093a52ae-cf60-4486-a5a6-dd410ae5f2a4.png)

## Reference

- [官网](https://www.mvtec.com/company/research/datasets/mvtec-ad/)
- [paper - The MVTec Anomaly Detection Dataset: A Comprehensive Real-World Dataset for Unsupervised Anomaly Detection](https://link.springer.com/content/pdf/10.1007/s11263-020-01400-4.pdf)





## 数据集规模

项目 | 数值
-- | --
类别数 | 15 (5 种纹理 + 10 种物体)
图像总数 | 5354 张高分辨率图像 (约 $700\times700$ 到 $1024\times1024$)
训练集 | 3629 张，仅含正常样本
测试集 | 1725 张，含正常样本和带缺陷样本
缺陷种类 | 73 种 (划痕、凹陷、污渍、缺失零件、错位等)
标注 | 缺陷样本带像素级的真值掩码

表中：数字来自原论文 `[待核实]`；训练集只有正常样本，这决定了它是无监督/单类异常检测基准，算法必须只用正常数据学习「什么是正常」。

类型 | 类别
-- | --
纹理 | carpet、grid、leather、tile、wood
物体 | bottle、cable、capsule、hazelnut、metal nut、pill、screw、toothbrush、transistor、zipper

表中：纹理类的图像重复性强，适合基于局部特征的方法；物体类有固定位置/姿态 (如 bottle) 和可变姿态 (如 screw、hazelnut) 之分，对对齐的要求不同。

## 评价指标

$$
\mathrm{AUROC}=\int_0^1\mathrm{TPR}(\mathrm{FPR})\,d(\mathrm{FPR}),\qquad
\mathrm{PRO}=\frac1{K}\sum_{k=1}^{K}\frac{|P\cap C_k|}{|C_k|}
$$

其中：

- AUROC：ROC 曲线下面积；$\mathrm{TPR}$ 真阳性率 (缺陷被检出的比例)，$\mathrm{FPR}$ 假阳性率 (正常样本被误报的比例)；与阈值无关，$1$ 表示完全可分
- Image AUROC：用图像级的异常分数 (如异常图的最大值) 评估「这张图是否异常」；Pixel AUROC：对每个像素的异常分数评估定位，但缺陷区域面积小，容易被大量正常像素稀释
- $\mathrm{PRO}$ (Per-Region Overlap)：$K$ 个真实缺陷连通区域 $C_k$ 中，被预测的异常区域 $P$ 覆盖的比例的平均值，对每个缺陷区域一视同仁，不受区域大小影响；通常在 FPR $\le 0.3$ 的范围内积分
- 常见报告：Image AUROC、Pixel AUROC、PRO，三者分别说明分类、定位总体精度和对小缺陷的检出能力；主流方法在 MVTec AD 的 Image AUROC 已接近 $99\%$，所以研究重点转向多类统一、少样本等，见 [Anomaly](/0277_ML_Tasks_Image_Anomaly)

## 使用中的注意

- 数据集图像之间的位置和姿态相对稳定，方法在上面表现很好并不代表在复杂产线上也一样好，见 [算法落地实践](/0521_ML_Tasks_Image_Anomaly_Pipeline)
- 少数类别的标注存在噪声，指标接近饱和后，小幅度的差别未必说明方法更好
- 补充数据集 (VisA、MPDD、BTAD、Real-IAD) 见 [Anomaly](/0277_ML_Tasks_Image_Anomaly)

