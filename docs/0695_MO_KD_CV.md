---
Title | MO KD CV
-- | --
Created @ | `2026-11-23T01:52:29Z`
Updated @| `2026-11-23T01:52:50Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/695)

---
# CV

把蒸馏用到**检测、分割**和**视觉 Transformer**上，会遇到与分类蒸馏不同的问题：检测里前景背景极度不均衡，且除了"是什么"还要蒸馏"在哪里"；分割是逐像素的稠密预测，空间位置之间的关系远比单个 logits 向量复杂；视觉 Transformer 则有 token 化的结构可以利用。本文覆盖四个代表：FGD（*Focal and Global Knowledge Distillation for Detectors*，CVPR 2022，arXiv:2111.11837）、LD（*Localization Distillation for Dense Object Detection*，CVPR 2022，arXiv:2102.12252）、CWD（*Channel-wise Knowledge Distillation for Dense Prediction*，ICCV 2021，arXiv:2011.13256）和 DeiT 的蒸馏 token（*Training data-efficient image transformers & distillation through attention*，ICML 2021，arXiv:2012.12877）。

**一句话概括：FGD 把前景背景分开蒸馏并加全局关系；LD 把边框边缘表示成概率分布后对定位 logits 做 KL 蒸馏；CWD 对每个通道的空间激活分布做 softmax 后做 KL；DeiT 为 Transformer 增加一个专门学习 Teacher 标签的 distillation token。**

> 标注约定：未标注的内容来自上述论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：总览 [知识蒸馏](0207_MO_KD)；发展历史 [KD History](0336_MO_KD_History)；基础损失 [响应蒸馏](/0689_MO_KD_Response)；特征对齐类方法 [特征蒸馏](/0690_MO_KD_Feature)；DeiT 笔记 [DeiT](0253_ML_Transformer_DeiT)。

## 1. 解决什么问题

- **多数蒸馏方法为分类设计**，直接搬到检测上收益很小（FGD 论文）；
- 检测蒸馏的三个难点：
  - **前景背景不均衡**：Teacher 与 Student 的特征差异在前景远大于背景，若一视同仁，不均匀的差异会拖累蒸馏；
  - **语义与定位知识混在特征图里**：不分开就难以知道哪部分有用（LD 论文）；
  - **缺乏全局信息**：只蒸馏聚焦区域会切断前景与背景的关系；
- 分割等稠密预测中，逐像素对齐每个位置的贡献相同，带来冗余信息，且对各位置做归一化只关注局部。

## 2. 符号约定

- $F^T$、$F^S\in\mathbb R^{C\times H\times W}$：Teacher、Student（neck 或某一层）的特征图；$f(\cdot)$：把 $F^S$ 调整到与 $F^T$ 相同维度的适配层；
- $T$ 或 $\tau$：温度；$\mathrm{KL}(\cdot\|\cdot)$：KL 散度。

## 3. FGD：前景/背景分离 + 全局关系

FGD（Focal and Global Distillation）有两部分：聚焦蒸馏（Focal）区分前景背景并抓住关键像素/通道，全局蒸馏（Global）用关系模块恢复被切断的全局关系。蒸馏只在 neck 输出的特征图上计算，因此能用于各类检测器。

### 3.1 聚焦蒸馏

先用真值框 $r$ 构造二值掩码 $M$，再构造尺度掩码 $S$ 来平衡大小目标和前景背景比例：

$$
M_{i,j}=\begin{cases}1,&(i,j)\in r\\0,&\text{否则}\end{cases},\qquad
S_{i,j}=\begin{cases}\dfrac{1}{H_rW_r},&(i,j)\in r\\[4pt]\dfrac{1}{N_{bg}},&\text{否则}\end{cases},\qquad N_{bg}=\sum_{i,j}(1-M_{i,j})
$$

其中：

- $(i,j)$：特征图上的位置；$r$：真值框，$H_r$、$W_r$ 是其高和宽；一个像素属于多个框时取最小的那个框计算 $S$；
- $M$：前景（1）/背景（0）掩码；$S$：让每个目标、背景整体的总权重大致相同，避免大目标占据过多损失、小目标被淹没；$N_{bg}$：背景像素个数。

再按 AT 的思路，得到空间/通道注意力掩码（用 Teacher 的特征计算）：

$$
G^S(F)=\frac1C\sum_{c=1}^{C}|F_c|,\quad G^C(F)=\frac1{HW}\sum_{i,j}|F_{i,j}|,\quad
A^S(F)=HW\cdot\mathrm{softmax}\!\Big(\frac{G^S(F)}{T}\Big),\quad
A^C(F)=C\cdot\mathrm{softmax}\!\Big(\frac{G^C(F)}{T}\Big)
$$

其中：$G^S\in\mathbb R^{H\times W}$ 与 $G^C\in\mathbb R^{C}$ 是特征绝对值在通道维、空间维上的平均，即空间注意力与通道注意力；$T$ 是温度；乘以 $HW$ 或 $C$ 是为了让注意力权重的均值为 1。

聚焦特征损失与注意力损失为：

$$
\mathcal L_{fea}=\alpha\sum_{k,i,j}M_{i,j}S_{i,j}A^S_{i,j}A^C_k\big(F^T_{k,i,j}-f(F^S_{k,i,j})\big)^2+\beta\sum_{k,i,j}(1-M_{i,j})S_{i,j}A^S_{i,j}A^C_k\big(F^T_{k,i,j}-f(F^S_{k,i,j})\big)^2
$$

$$
\mathcal L_{at}=\gamma\cdot\big(\ell(A^S_t,A^S_s)+\ell(A^C_t,A^C_s)\big),\qquad \mathcal L_{focal}=\mathcal L_{fea}+\mathcal L_{at}
$$

其中：

- $\alpha$、$\beta$：平衡前景、背景损失的超参数；注意力掩码 $A^S$、$A^C$ 用 **Teacher** 的特征计算，用来指导 Student；
- $\mathcal L_{at}$：让 Student 模仿 Teacher 的空间/通道注意力掩码，$\ell$ 是 $L_1$ 损失，$\gamma$ 是权重；下标 $t$、$s$ 表示 Teacher、Student。

### 3.2 全局蒸馏与总损失

聚焦蒸馏分开了前景和背景，同时也切断了它们之间的关系。全局蒸馏用 GcBlock（全局上下文模块）提取同一张图内像素间的全局关系，并让 Student 学习 Teacher 的关系表示：

$$
\mathcal L_{global}=\lambda\sum\big(\mathcal R(F^T)-\mathcal R(F^S)\big)^2,\qquad
\mathcal R(F)=F+W_{v2}\Big(\mathrm{ReLU}\big(\mathrm{LN}\big(W_{v1}\big(\textstyle\sum_{j=1}^{N_p}\frac{e^{W_kF_j}}{\sum_{m=1}^{N_p}e^{W_kF_m}}F_j\big)\big)\big)\Big)
$$

其中：$W_k$、$W_{v1}$、$W_{v2}$ 是卷积层，LN 是 LayerNorm，$N_p$ 是特征图的像素数，$\lambda$ 是平衡系数；括号里的 softmax 加权和就是对所有像素做的全局上下文汇聚。总损失为：

$$
\mathcal L=\mathcal L_{original}+\mathcal L_{focal}+\mathcal L_{global}
$$

其中 $\mathcal L_{original}$ 是检测器本身的损失。论文的发现：把前景与背景分开蒸馏（Table 1 的对比实验）显著优于一视同仁，FGD 在多种检测器与 backbone 组合上带来稳定提升。

## 4. LD：定位蒸馏

LD 的核心观察：特征图里语义知识和定位知识混在一起，难以区分哪部分有用。它采取**分而治之**：语义知识用原始的分类 KD，定位知识则把边框表示成概率分布后用 logit 蒸馏。

### 4.1 边框的概率分布表示

传统的边框表示（中心加宽高，或到四条边的距离 $\{t,b,l,r\}$）本质是狄拉克 delta 分布，只关注真值位置，无法刻画边框的**模糊性**（例如物体边缘不清晰时）。LD 使用边缘的概率分布表示：设边缘 $e$ 的取值范围 $[e_{min},e_{max}]$，离散成 $n$ 个子区间，则：

$$
\hat e=\int_{e_{min}}^{e_{max}}x\,\Pr(x)\,dx\ \approx\ \sum_{i=1}^{n}\Pr(e_i)\,e_i
$$

其中：$x$ 是回归坐标，$\Pr(x)$ 是其概率；当 $\Pr(x)$ 仅在真值 $e_{gt}$ 处为 1 时，退化为 delta 分布。分布的**平坦程度**反映边缘的模糊程度，**尖锐程度**反映边缘清晰。

### 4.2 定位蒸馏损失

令 $z^T$、$z^S$ 是 Teacher、Student 定位分支对某条边在 $n$ 个位置上预测的 logits，用广义 softmax $\mathcal S(z,\tau)=\mathrm{softmax}(z/\tau)$ 转成分布后做 KL：

$$
\mathcal L^{e}_{LD}=\mathcal L_{KL}\big(\mathcal S(z_S,\tau),\,\mathcal S(z_T,\tau)\big),\qquad
\mathcal L_{LD}(\mathcal B_S,\mathcal B_T)=\sum_{e\in\mathcal B}\mathcal L^{e}_{LD}
$$

其中：$\tau$ 是温度（$\tau=1$ 即普通 softmax，$\tau\to0$ 趋于 delta 分布，$\tau\to\infty$ 趋于均匀分布），论文默认取 $\tau=10$；$\mathcal B=\{t,b,l,r\}$ 为边框的四条边，对四条边求和。论文称 LD 是首次用 logit 模仿来蒸馏检测中的定位知识；与把 Teacher 预测框当作额外回归目标的"伪框回归"相比，LD 能传递更丰富的定位信息。

### 4.3 有价值定位区域（VLR）

特征模仿类方法对整块区域一视同仁，而分类与定位的知识分布并不相同。LD 把蒸馏区域分为两部分：**主蒸馏区域**（由标签分配决定的检测头正样本位置）与**有价值定位区域（VLR）**，后者是主蒸馏区域的向外扩展。对第 $l$ 个 FPN 层，计算所有锚框与真值框的 DIoU 矩阵 $X_l$，取 DIoU 介于较低阈值与正样本阈值之间的位置作为 VLR，即虽未被标签分配为正样本、但与真值框有一定重叠的位置（具体阈值设定见论文 Algorithm 1）；对 VLR 的蒸馏损失用权重 $\lambda$ 缩放，论文默认 $\lambda=0.25$。

论文的消融（COCO val2017，Teacher 为 ResNet-101、Student 为 ResNet-50）：基线 40.1 AP；加 LD 后 41.1 AP；再加 VLR（$\lambda=0.25$）后 41.8 AP。

## 5. CWD：通道维的蒸馏

稠密预测中常见做法是在**空间域**对每个位置的激活做归一化，再逐点或两两对齐。CWD 改为**对每个通道**的激活图做 softmax 归一化，得到该通道上的空间分布，再用 KL 对齐：

$$
\phi(y_c)=\frac{\exp(y_{c,i}/T)}{\sum_{i=1}^{W\times H}\exp(y_{c,i}/T)},\qquad
\phi\big(y^T,y^S\big)=\frac{T^2}{C}\sum_{c=1}^{C}\sum_{i=1}^{W\times H}\phi(y^T_{c,i})\log\frac{\phi(y^T_{c,i})}{\phi(y^S_{c,i})}
$$

其中：

- $c=1,\dots,C$：通道下标；$i$：该通道中的空间位置；$y_{c,i}$：通道 $c$ 位置 $i$ 的激活值；$T$：温度，$T$ 越大则每个通道关注更宽的空间区域；
- $\phi(y_c)$：把通道 $c$ 的激活图归一化为一个空间概率分布；softmax 去掉了大网络与小网络之间激活幅度的差异；
- 损失是各通道上 Teacher 分布与 Student 分布的 KL 散度之和，再乘以 $T^2/C$；
- **不对称性**：KL 不对称，当 Teacher 在某位置的概率 $\phi(y^T_{c,i})$ 很大时，Student 也要同样大才能使损失小；当 Teacher 概率很小时，则基本不关心 Student 在该位置的取值——于是 Student 会更关注**前景显著区域**（各通道的激活往往编码了场景类别的显著性），而不是冗余背景。

论文报告：在 COCO 上把 RetinaNet（ResNet-50）提升 3.4% mAP，在 Cityscapes 上把 PSPNet（ResNet-18）提升 5.81% mIoU，并且训练时的计算量比一些空间蒸馏方法更低。在其消融中，CWD 也优于最好的空间蒸馏方法（AT）。

## 6. DeiT：视觉 Transformer 的 distillation token

DeiT 展示了用卷积网络做 Teacher 训练视觉 Transformer 的方法（详见 [DeiT](0253_ML_Transformer_DeiT)）。两种蒸馏目标：

- **soft 蒸馏**：Student 与 Teacher 的 softmax 之间的 KL，$\mathcal L=(1-\lambda)\mathcal L_{CE}(\psi(Z_s),y)+\lambda\tau^2\mathrm{KL}\big(\psi(Z_s/\tau),\psi(Z_t/\tau)\big)$；
- **hard 蒸馏**：取 Teacher 的硬决策 $y_t=\arg\max_cZ_t(c)$ 当真实标签，$\mathcal L=\tfrac12\mathcal L_{CE}(\psi(Z_s),y)+\tfrac12\mathcal L_{CE}(\psi(Z_s),y_t)$。

其中：$Z_s$、$Z_t$ 是 Student、Teacher 的 logits，$\psi$ 是 softmax，$\lambda$ 是权重，$\tau$ 是温度，$y$ 是真实标签。

**Distillation token**：DeiT 在初始嵌入（patch token 与 class token）之外再加一个 **distillation token**，它与 class token 的用法相同，通过自注意力与其他 token 交互；区别是输出端 class token 的目标是真实标签，而 distillation token 的目标是复现 Teacher 估计的标签。这是 Transformer 特有的蒸馏方式，论文报告其优于普通蒸馏；推理时两者的输出融合使用。论文还发现：用卷积网络当 Teacher 效果更好，因为它能把卷积的归纳偏置传给 Transformer。

## 7. 对比汇总

| 方法 | 任务 | 蒸馏的位置 | 关键设计 |
|---|---|---|---|
| FGD | 检测 | neck 特征图 | 前景/背景分离 + 注意力掩码 + GcBlock 全局关系 |
| LD | 检测（稠密） | 定位头 logits | 边框概率分布 + KL；VLR 蒸馏区域 |
| CWD | 检测、分割 | 特征图 / logits 图 | 逐通道空间 softmax + KL（不对称性聚焦显著区域） |
| DeiT 蒸馏 | 分类（ViT） | 输出层（专用 token） | distillation token；hard 标签蒸馏 |

表中：

- 第一列是方法，第二列是它面向的任务，第三列是蒸馏作用的位置，第四列是关键设计；
- 检测里最核心的一点是"不要一视同仁"：FGD 通过区域、LD 通过语义/定位分开、CWD 通过通道分布来选择关键信息；
- 与 [特征蒸馏](/0690_MO_KD_Feature) 的关系：FGD、CWD 可以看作特征蒸馏在检测、分割上的专门化。

## 8. 总结 [解读]

- 检测/分割蒸馏的关键是**选对要蒸馏的信息**：前景与背景、语义与定位、空间与通道；
- 这些方法一般只改损失，不改网络结构，能够直接叠加在多种检测器上；
- 具体数值（各检测器 mAP 提升）请以论文为准；本文没有收录完整结果表。

## Reference

- Yang Z, Li Z, Jiang X, Gong Y, Yuan Z, Zhao D, Yuan C. Focal and Global Knowledge Distillation for Detectors. CVPR 2022. arXiv:2111.11837
- Zheng Z, Ye R, Wang P, Ren D, Zuo W, Hou Q, Cheng M-M. Localization Distillation for Dense Object Detection. CVPR 2022. arXiv:2102.12252
- Shu C, Liu Y, Gao J, Yan Z, Shen C. Channel-wise Knowledge Distillation for Dense Prediction. ICCV 2021. arXiv:2011.13256
- Touvron H, Cord M, Douze M, Massa F, Sablayrolles A, Jégou H. Training data-efficient image transformers & distillation through attention. ICML 2021. arXiv:2012.12877

