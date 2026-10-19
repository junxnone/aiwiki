---
Title | ML Tasks Image SHR
-- | --
Created @ | `2026-04-27T06:37:54Z`
Updated @| `2026-10-19T02:37:04Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/540)

---
# Specular Highlight Removal

- **镜面高光去除**
- **镜面高光**是由光在光滑表面发生镜面反射产生的局部高亮现象，会破坏图像纹理和一致性，进而影响下游视觉任务


## 经典及传统方法

- **局限性**：这些传统方法往往依赖对表面性质、光照或材质先验的严格假设，使得在复杂真实场景下的适用性受限

### 基于色彩空间与反射模型的方法
- HIS 颜色空间方法：通过在 HIS 空间中用同一漫反射色度下的漫反射像素值去匹配高光像素，从而分离高光分量（文中称为"基于 HIS 的经典方法"）
- **二色反射模型（Dichromatic Reflection Model）方法**：几乎所有后续方法（包括深度学习方法里的"检测分支"）在物理建模上都隐含承袭了这个模型。它把非金属表面某点的成像强度建模为漫反射分量和镜面反射分量的线性叠加：

$$
I = w_d \cdot c_d + w_s \cdot c_s
$$

其中 $c_d$ 是该点本身的漫反射颜色（物体固有色），$c_s$ 通常直接取**光源颜色**（因为镜面反射基本不改变入射光的颜色，只是把它"镜面"反射出去），$w_d$、$w_s$ 是随视角/表面法线变化的权重。高光区域的特点就是 $w_s$ 项占主导、像素颜色被拉向光源颜色——这也是为什么很多传统方法会去找"颜色异常偏向光源色"的区域作为高光候选。基于这个模型分离出 $w_s \cdot c_s$ 项、再用周围漫反射信息补全，就是经典方法的核心思路，早期发展出了多种变体。

### 其它传统手段
- 滤波、主成分分析（PCA）等也被应用于高光去除领域
- **偏振成像**：physically 最"干净"的高光分离手段。光滑表面的镜面反射光在特定入射角（布儒斯特角，Brewster's angle）附近会接近完全偏振，而漫反射光基本是非偏振（各个方向振动分量均匀）的。在光源前加线偏振片、相机前加可旋转的圆偏振片，转到特定角度（两偏振片夹角接近 90°）时能大幅滤掉偏振的镜面反射分量，直接拍到接近"无高光"的漫反射图像——[SpecularityNet-PSD](0538_paper_SpecularityNet) 的 PSD-Dataset 正是用这套双偏振系统采集真值图的。缺点是需要额外的偏振硬件、且只对偏振敏感的镜面反射有效（对多次散射产生的漫反射式"亮斑"无效）。


## 深度学习方法
- 多图像（multi-image）方法与单幅图像（single-image）方法

### 多图像方法
利用多视角信息、生成的高光掩码或其他辅助数据来辅助分离和还原；在精度上常有优势，但实际部署受限于需额外数据/采集条件。例如：基于多视角或光场的变分优化、利用掩码引导的两阶段方法等

**局限**：需要多图或额外信息，难以在仅有单张图像的应用场景中广泛使用


### 单幅图像方法
更具实用性和通用性，研究集中于如何从单张图像中准确分离并恢复被高光破坏的漫反射细节。

引入 UNet、GAN、Transformer 等网络架构：

- **SpecularityNet-PSD**：双分支迭代 GAN 架构，检测分支先输出高光概率图、去除分支以此为引导做修复，再迭代精炼，成为有力基线；配套构建了首个大规模真实场景配对数据集 PSD-Dataset（13380 张图像，用双偏振系统采集同场景无高光真值图），详见 [SpecularityNet-PSD](0538_paper_SpecularityNet)；
- **DHAN-SHR**（Dual-Hybrid Attention Network）：基于 Transformer 增强长程依赖建模能力，同时在 PSD/SHIQ/SSHR 三个数据集的混合基准上训练评测；
- **Unet-Transformer 联合检测-去除方法**（2022）：用编码器-解码器网络先检测高光、再用检测出的掩码引导 Unet-Transformer 做去除；该工作还发现一个有意思的反直觉现象——**仅用简单的残差图（不经过任何学习）就能和真值高光区域取得很强的空间对齐**，在 SHIQ 数据集上这种残差掩码甚至超过了当时的一些学习式检测器，说明"高光检测"这一步未必总需要复杂模型；
- **基于大规模合成数据的方法**（ICCV 2023）：用大规模光照真实的合成数据训练，目标是消除以往方法常见的可见伪影，让去除结果在视觉上更干净；
- **基于扩散模型的方法**（2024）：首个专门针对高光去除设计的扩散模型方法，在 SHIQ 基准上把 SSIM 从 0.939 提升到 0.966，是目前这个任务上报告的较高水平之一。

**面临问题：**卷积网络（CNN）在捕获长程依赖上受限，而 Transformer 虽然建模能力强但计算与内存成本高、推理慢，导致精度与实时性之间的权衡问题；扩散模型精度更高但推理速度通常比 GAN/Transformer 方法更慢，同样面临实时性挑战。

## 数据集

| 数据集 | 规模 | 特点 |
|---|---|---|
| **PSD-Dataset** | 13380 张（2210 个真实场景） | 首个大规模真实场景配对数据集，双偏振系统采集同场景无高光真值图，详见 [SpecularityNet-PSD](0538_paper_SpecularityNet) |
| **SHIQ** | 训练 1 万组、测试 1 千组四元组 | 面向自然场景的高质量真实高光数据集，配对的无高光图用 RPCA 方法生成 |
| **SSHR** | 规模可自定义 | 完全合成数据集，用开源渲染软件生成，多样性是优势但存在合成-真实的域差距 |
| **S-LIGHT** | 合成 | 专为单图深度学习模型训练构建，并提出 MS-NCC 指标用于没有真值图场景下的定量评估 |
| **NSH** | - | 常和 SHIQ/PSD 一起用于横向评测不同方法 |

不同数据集的采集方式（真实配对 vs 合成）、场景覆盖面差异较大，论文里经常会混合多个数据集一起训练/评测（如 DHAN-SHR 混合了 PSD+SHIQ+SSHR）以提升泛化性。

## 评估指标

- **PSNR（峰值信噪比）**、**SSIM（结构相似性）**：有配对真值图（真实偏振采集或合成渲染）时最常用的两个指标，分别衡量像素级误差和结构/纹理的相似程度，几乎所有 SHIQ/PSD 上的方法对比都会报这两个数；
- **MS-NCC（多尺度归一化互相关）**：S-LIGHT 数据集提出的指标，用于**没有真值无高光图**的场景（比如真实世界里很难拍到完全没有高光的同一张图作对照）——在多个尺度上计算去高光结果和原图裁剪区域的归一化互相关，间接衡量高光是否被合理地替换掉而不是被简单地涂抹/模糊掉；
- 除了这些定量指标，几乎所有论文也会给**视觉对比图**（尤其是高光区域边缘有没有残留光晕、颜色是否自然过渡），因为 PSNR/SSIM 这类全局指标对"局部高光区域修复得好不好"不够敏感。

## 方法演进时间线

| 年份 | 方法/方向 | 一句话 |
|---|---|---|
| 经典时期 | HIS 色彩空间 / 二色反射模型 | 基于手工先验的颜色空间分离/反射模型分解 |
| 经典时期 | 偏振成像 | 物理层面最干净的分离手段，但需要专门硬件 |
| ~2021 | 多图像方法 | 用多视角/光场辅助信息换精度，但部署受限 |
| 2021 | SpecularityNet-PSD | 首个大规模真实配对数据集 + 双分支迭代 GAN |
| 2022 | Unet-Transformer 联合检测-去除 | 发现简单残差图即可做高质量高光检测 |
| 2023 | 大规模合成数据方法（ICCV） | 用光照真实的合成数据换取更干净的去除结果 |
| 2024 | DHAN-SHR | Transformer 混合注意力，PSD+SHIQ+SSHR 混合基准 |
| 2024 | 扩散模型方法 | 首个专用扩散模型，SHIQ 上 SSIM 达到 0.966 |

可以看出一条清晰的脉络：手工先验（颜色空间/反射模型/偏振）→ 多图像辅助信息 → 单图深度学习（GAN/Transformer）→ 更强的生成式模型（扩散模型），和很多底层视觉任务的发展路径是同构的。

## 应用场景

- **工业视觉检测**：金属、玻璃等高反光表面在拍摄时天然容易产生镜面高光，可能直接遮盖掉表面的真实缺陷、或者被误判为缺陷——这和 [算法落地实践](0521_ML_Tasks_Image_Anomaly_Pipeline) 里"打光方案"章节讨论的问题是同一枚硬币的两面：打光方案是从硬件层面**预防**高光产生（如用同轴光/偏振片），SHR 算法则是在**后处理**层面补救已经拍到的高光，两者可以配合使用；
- **文档/字符扫描**：覆膜文档、反光证件在拍照/扫描时常出现局部高光，影响后续 OCR 识别；
- **医学内窥镜影像**：内窥镜检查中粘膜表面潮湿光滑，高光会遮挡病灶细节，是医学图像处理里的常见预处理步骤；
- **三维重建/多视图立体视觉**：镜面高光会破坏同一点在不同视角下的亮度一致性假设，干扰立体匹配，所以在做三维重建前常需要先做高光检测/去除。

## Reference

- [SpecularityNet-PSD 论文笔记](0538_paper_SpecularityNet)
- [Single-Image Specular Highlight Removal via Real-World Dataset Construction (SpecularityNet/PSD 原始论文)](https://www.researchgate.net/publication/354174929_Single-Image_Specular_Highlight_Removal_via_Real-World_Dataset_Construction)
- [Dual-Hybrid Attention Network for Specular Highlight Removal](https://arxiv.org/pdf/2407.12255)
- [Joint specular highlight detection and removal in single images via Unet-Transformer](https://www.researchgate.net/publication/364457192_Joint_specular_highlight_detection_and_removal_in_single_images_via_Unet-Transformer)
- [Towards High-Quality Specular Highlight Removal by Leveraging Large-Scale Synthetic Data (ICCV 2023)](https://arxiv.org/pdf/2309.06302)
- [Towards Specular Highlight Removal Through Diffusion Model (2024)](https://dl.acm.org/doi/10.1007/978-981-97-8685-5_35)
- [S-LIGHT: Synthetic Dataset for the Separation of Diffuse and Specular Reflection Images](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11014017/)

