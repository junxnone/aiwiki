-----

| Title     | paper L2BT                                            |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:44Z`                                |
| Updated @ | `2026-11-24T09:21:22Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/752) |

-----

# L2BT 学着做一个 Transformer

  - **L2BT**：Learning to Be a Transformer to Pinpoint Anomalies，IEEE
    Access 2025，作者 Alex Costanzino、Pierluigi Zama Ramirez、Giuseppe
    Lisanti、Luigi Di Stefano（博洛尼亚大学）。论文
    [arXiv 2407.04092](https://arxiv.org/abs/2407.04092)（该论文早期版本题为
    *Looking for Tiny Defects via Forward–Backward Feature
    Transfer*，方法最初叫 **FBFT**，Forward Backward Feature
    Transfer）；[项目页](https://alex-costanzino.github.io/learning_to_be_a_transformer/)
  - 类型：Segmentation
  - 动机：出于效率，多数异常检测与分割 (AD\&S) 方法处理 224×224
    之类的**低分辨率**图像（原图下采样得到），评估时真值掩码也被下采样。但工业应用既需要识别大缺陷也需要识别**微小缺陷**，这种协议无法反映方法的真实表现；下采样会让微小缺陷变小甚至消失（论文统计：把真值下采样到
    224×224，VisA 和 MVTec AD 分别丢失 21.42% 和 0.37% 的缺陷）
  - 论文有两个贡献：①提出新的评测基准 **Tiny
    Anomalies**：在**原始高分辨率**图像和真值掩码上评估，关注分割性能随缺陷大小的变化；②提出基于新的**师生范式**的方法：**两个浅层
    MLP（学生）学会在冻结的 Vision Transformer（教师）各层之间传递 Patch 特征**
  - 与同样使用冻结 ViT 的
    [Dinomaly](/0753_paper_Dinomaly)、[INP-Former](/0754_paper_INPFormer)
    不同：L2BT 的学生很小，且学的是 ViT **层与层之间**的映射

## 原理

``` mermaid
graph TD
    X["高分辨率图像 I<br/>1036x1036"] --> T["冻结教师 DINOv2 ViT-B/14"]
    T --> FJ["层 j 的 Patch 特征 F_j<br/>较低的上下文化程度"]
    T --> FK["层 k 的 Patch 特征 F_k<br/>较高的上下文化程度"]
    FJ --> SF["前向迁移网络 S_F<br/>由 F_j 预测 F_k"]
    FK --> SB["后向迁移网络 S_B<br/>由 F_k 预测 F_j"]
    SF --> DK["与真实 F_k 的欧氏距离 Delta_k"]
    SB --> DJ["与真实 F_j 的欧氏距离 Delta_j"]
    FK --> DK
    FJ --> DJ
    DK --> M["逐 Patch 相乘融合<br/>得到异常图 再上采样与平滑"]
    DJ --> M
```

图中：

  - **教师** $\\mathcal{T}$ 是冻结的 Transformer 编码器（论文使用 DINO-v2 ViT-B/14，在
    1.42 亿张图像上预训练），每一层都输出每个 Patch 的特征 $f^{(i)} \\in
    \\mathbb{R}^D$（$D=768$）；$N = HW/P^2$ 个 Patch（$P \\times P$ 为 Patch
    大小）。输入 $1036 \\times 1036 \\times 3$ 的图像时，输出 $74 \\times 74 \\times
    768$ 的特征图。从两个层 $j \< k$ 抽取两组特征 $F\_j$ 和 $F\_k$（论文取 $j = 8$、$k = 12$）
  - **两个学生**：**前向迁移网络 $\\mathcal{S}\_F$** 把较浅层 $j$（上下文化程度较低）的特征映射到较深层
    $k$（上下文化程度较高）；**后向迁移网络 $\\mathcal{S}\_B$** 反过来。它们是**在所有 Patch
    之间共享**的浅层 MLP，**逐 Patch 独立**处理，各为 3 个线性层（除最后一层外接 GeLU），每层
    768 个单元
  - **直觉**：Patch
    特征从浅层传到深层的过程中变得越来越**上下文化**（深层特征包含更多全局信息，能根据输入图像的具体上下文把某个
    Patch 区分出来），不同注意力头各司其职。前向/后向网络被训练去「上下文化」和「去上下文化」Patch 特征，对应 ViT
    在这两层之间的函数（假设可逆）。作者推测这类函数很复杂，**没有恒等映射之类的平凡解**，所以只在正常样本上训练的小容量网络**不太可能学出能对分布外数据（异常
    Patch 的特征）给出正确预测的通用函数**

训练与推理：

$$ \\hat{f}\_k^{(i)} = \\mathcal{S}\_F\\big(f\_j^{(i)}\\big), \\quad
\\hat{f}\_j^{(i)} = \\mathcal{S}\_B\\big(f\_k^{(i)}\\big), \\qquad
\\mathcal{L}\_j^{(i)} = 1 - \\frac{f\_j^{(i)} \\cdot
\\hat{f}\_j^{(i)}}{\\lVert f\_j^{(i)} \\rVert\\ \\lVert
\\hat{f}\_j^{(i)} \\rVert}, \\quad \\mathcal{L}\_k^{(i)} = 1 -
\\frac{f\_k^{(i)} \\cdot \\hat{f}\_k^{(i)}}{\\lVert f\_k^{(i)} \\rVert\\
\\lVert \\hat{f}\_k^{(i)} \\rVert} $$

$$ \\Delta\_j^{(i)} = \\big\\lVert f\_j^{(i)} - \\hat{f}\_j^{(i)}
\\big\\rVert\_2, \\quad \\Delta\_k^{(i)} = \\big\\lVert f\_k^{(i)} -
\\hat{f}\_k^{(i)} \\big\\rVert\_2, \\qquad \\Delta^{(i)} =
\\Delta\_j^{(i)} \\cdot \\Delta\_k^{(i)} $$

其中：

  - $f\_j^{(i)}, f\_k^{(i)}$：第 $i$ 个 Patch 在层 $j$、$k$
    的教师特征；$\\hat{f}\_j^{(i)},
    \\hat{f}\_k^{(i)}$：学生预测出的特征；$\\mathcal{S}\_F$、$\\mathcal{S}\_B$
    对所有 Patch 共享参数
  - **训练**：只用某一类的**正常样本**，损失是教师特征与学生预测特征之间的**余弦距离**（$\\mathcal{L}\_j^{(i)}$、$\\mathcal{L}\_k^{(i)}$
    是每个 Patch 的损失，两个网络联合训练）
  - **推理**：用欧氏距离计算教师特征与学生预测特征的差，得到两张「不同上下文化程度」的异常图
    $\\Delta\_j$、$\\Delta\_k$，再对**同一 Patch 的两个差相乘**得到融合差
    $\\Delta^{(i)}$；把这组差 reshape 成 $\\sqrt{N}\\times\\sqrt{N}$
    的异常图，**双线性上采样**到输入大小 $H \\times W$，再按惯例做平滑
  - **图像级异常分数**：最终异常图中**最大的 $M$ 个值的平均**，论文取 $M = 0.001 \\cdot H \\cdot
    W$

## Tiny Anomalies 基准

动机和设计：

  - **数据集**：VisA（10821 张图，12 类，其中 9621 张正常、1200 张异常；缺陷小到 1 个像素、大到 478781
    个像素）和 MVTec AD（5354 张图，15 类，缺陷从 24 到 517163 个像素）。VisA
    的缺陷尺寸范围更宽，含有微小缺陷
  - **指标**：图像级 I-AUROC；分割用 AUPRO，积分阈值为 0.3（AUPRO@30%）和近期工作提出的更严的
    0.05（AUPRO@5%）。为分析**不同大小的缺陷**，对每个物体类别统计缺陷大小分布，按**累积四分位数** $Q\_1,
    Q\_2, Q\_3, Q\_4$ 划分：$Q\_i$ 对应的集合只包含大小不超过该分位数的缺陷，所以 $Q\_1$
    只有最小的缺陷，$Q\_4$ 是全部缺陷；在每个集合上分别计算 AUPRO
  - **鲁棒性指标 $\\rho$**：衡量方法对缺陷大小的鲁棒性，即既能准确分割微小缺陷也能分割大缺陷：

$$ \\rho = w \\cdot (1 - s), \\qquad s = \\frac{\\lvert
\\text{AUPRO}(Q\_4) - \\text{AUPRO}(Q\_1)
\\rvert}{\\max\\big(\\text{AUPRO}(Q\_1), \\text{AUPRO}(Q\_4)\\big)},
\\qquad w = \\frac{1}{4}\\sum\_{i=1}^{4}\\text{AUPRO}(Q\_i) $$

其中：$s$ 是**对缺陷大小的敏感度**，$\\text{AUPRO}(Q\_1)$
是只含最小缺陷的结果，$\\text{AUPRO}(Q\_4)$
是全部缺陷的结果；若方法能分割大缺陷但分割不了小缺陷，$s$
高、$\\rho$ 低；$w$ 是各四分位集合上 AUPRO
的平均，作加权因子，避免把「大小缺陷都做得很差」的方法误判为鲁棒；AUPRO
可取 AUPRO@5% 或 AUPRO@30%，对应 $\\rho@5%$ 和 $\\rho@30%$

  - **Tiny Anomalies 的主指标**：①I-AUROC；②AUPRO@5%（全部缺陷）；③AUPRO@5% 在
    $Q\_1$（微小缺陷）；④$\\rho@5%$；⑤推理时间（ms）
  - **评测协议**：所有方法的输入都用单卡能跑的最高分辨率，尽量避免下采样：EfficientAD、RD++ 和 FBFT 能到
    $1036\\times1036$，PatchCore 和 SimpleNet 最高只能到 $512\\times512$；关闭
    SimpleNet、RD++ 官方实现里「训练过程中反复在测试集上评估并选最佳
    checkpoint」的做法（真实场景测试集不可得），统一训练固定轮数并取最后一个
    checkpoint；关闭 PatchCore
    对中心区域的裁剪（隐含了对异常位置的先验）；真值不下采样，若方法输出的异常图更小就双线性上采样到真值分辨率；去掉因
    padding 带来的额外像素；AUPRO 在**所有**测试样本（正常和异常）上计算（论文指出 PatchCore
    官方代码只在异常样本上算 AUPRO，会得到更高的分数）

## 实现与结果

  - **实现**：DINO-v2 ViT-B/14；两个学生联合训练 50 个 epoch，Adam，学习率 0.001；在单张
    NVIDIA GeForce RTX 4090 上实验
  - **VisA 上速度与指标**（论文 Table 3，推理时间为每个样本的毫秒数，在同一台机器上测，GPU
    预热并同步线程后测量）：论文指出 PatchCore 虽然在 VisA
    上检测性能最好，但分割性能明显落后（AUPRO@30% 0.752，对比 L2BT 的 **0.952**；AUPRO@5%
    0.542，对比 **0.787**），推理速度也慢得多（**227.230 ms** 对 **1.786
    ms**）。SimpleNet 的推理时间约 560.617 ms
  - 结论：L2BT 在 VisA 上取得最好的分割结果（经典基准和 Tiny Anomalies
    基准），对缺陷大小**最鲁棒**，**速度最快**，在 MVTec AD
    上也有 SOTA 水平的结果；在更难的少样本场景（基于 VisA）里分割性能也优于对手
  - 论文的局限（6 节）：输出的异常图空间尺寸**很小**（由骨干决定），需要双线性上采样到输入分辨率

## 特点与局限

  - **优点**：高分辨率下对**微小缺陷**更敏感；学生极小（3 层
    MLP），推理很快；训练只需要正常图像；用余弦损失训练、欧氏距离评分，思路简洁；提出了面向缺陷大小的评估基准和鲁棒性指标
  - **局限**：异常图分辨率低（74×74），需上采样；依赖冻结的 DINO-v2 ViT 教师和较高的输入分辨率；anomalib
    README 里没有 benchmark 数值，请参考论文

## Reference

  - [Learning to Be a Transformer to Pinpoint
    Anomalies](https://arxiv.org/abs/2407.04092)
  - [IEEE Access 版本](https://ieeexplore.ieee.org/document/11048772)
  - [项目页](https://alex-costanzino.github.io/learning_to_be_a_transformer/)
  - [anomalib -
    L2BT](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/l2bt)
