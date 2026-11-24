-----

| Title     | paper AnomalyDINO                                     |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:53Z`                                |
| Updated @ | `2026-11-24T09:21:13Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/756) |

-----

# AnomalyDINO 基于 DINOv2 的少样本异常检测

  - **AnomalyDINO**：Boosting Patch-based Few-shot Anomaly Detection with
    DINOv2，WACV 2025，论文
    [arXiv 2405.14529](https://arxiv.org/abs/2405.14529)
  - 类型：Patch 级最近邻（记忆库）方法，**免训练**；anomalib 中位于
    `models/image/anomaly_dino`（目录没有 README，这里 anomalib 的用法依据源码文档字符串）
  - 问题：多模态基础模型（视觉-语言模型）近来在少样本异常检测里树立了新标准。论文探究：**只用高质量的视觉特征**是否足以与视觉-语言模型一较高下。答案是肯定的：把
    DINOv2 用于单样本和少样本异常检测，不但能与现有技术匹敌，在很多设置下甚至超过它们
  - 核心思想：沿用成熟的 **Patch
    级深度最近邻范式**，同时支持图像级异常预测和像素级异常分割；方法简单、**免训练**、不需要额外数据做微调或元学习。论文针对少样本情形调整了记忆库的构造：**零样本掩码**、**数据增强**，并提出更稳健的**聚合统计量**
  - 论文结果：例如把 MVTec-AD 上的单样本检测 AUROC 从 **93.1%** 提高到
    **96.6%**（论文说这把少样本与全样本之间的差距缩小了一半）
  - 与 [PatchCore](/0535_paper_PatchCore)、[WinCLIP](/0468_paper_WinCLIP)
    相关；类似的记忆库方法还有
    [RAD](/0757_paper_RAD)、[SuperADD](/0758_paper_SuperADD)

## 方法

整体流程：先把**正常** Patch 的表示收集进记忆库 $\\mathcal{M}$；对测试的每个 Patch，计算它到记忆库中最近的正常
Patch 的距离；对 Patch 距离做适当聚合，得到图像级异常分数。

``` mermaid
graph LR
    A["k 张正常参考图"] --> M["可选: 零样本掩码 去除背景<br/>DINOv2 第一主成分阈值化"]
    M --> R["可选: 旋转等增强"]
    R --> F["DINOv2 提取 Patch 特征<br/>Patch 为 14x14 像素"]
    F --> B["记忆库 M<br/>可选: 贪心 coreset 子采样"]
    T["测试图像"] --> E["同样提取 Patch 特征"]
    E --> K["对每个 Patch 找记忆库最近邻<br/>得到到最近正常 Patch 的距离"]
    B --> K
    K --> S["像素级: 双线性上采样 + 高斯平滑<br/>图像级: 最异常的 1% Patch 距离的平均"]
```

图中：

  - 与此前的深度最近邻方法的不同在于：把记忆库的做法**为少样本场景定制**，并利用 DINOv2 强大的 Patch 特征。选
    DINOv2 作骨干，是因为它的 Patch
    级特征和**掩码能力**都很强；同时也简化了特征工程（不需要考虑用哪些层、怎么聚合），并且对输入分辨率更灵活（可取
    14 的任意倍数）
  - 特征提取器 $f: \\mathcal{X} \\to \\mathcal{F}^n$ 把每张图像映射为 $n$ 个 Patch 特征
    $f(x) = (p\_1, \\dots, p\_n)$，$n$ 取决于图像分辨率和 Patch 大小

$$ \\mathcal{M} := \\bigcup\_{x^{(i)} \\in X\_{ref}}\\big{p\_j^{(i)}
\\mid f(x^{(i)}) = (p\_1^{(i)}, \\dots, p\_n^{(i)}),\\ j \\in
\[n\]\\big}, \\quad d\_{NN}(p; \\mathcal{M}) := \\min\_{p\_{ref} \\in
\\mathcal{M}} d(p, p\_{ref}), \\quad d(x, y) := 1 - \\frac{\\langle x,
y\\rangle}{\\lVert x\\rVert\\lVert y\\rVert} $$

其中：$X\_{ref}$ 是 $k \\ge 1$ 张正常参考图；$\\mathcal{M}$ 是这些图所有 Patch
特征的并集；$d\_{NN}(p; \\mathcal{M})$ 是测试 Patch $p$ 到记忆库中最近正常
Patch 的距离；$d$ 取**余弦距离**。

**图像分数**：对所有 Patch 的最近邻距离做聚合：

$$ s(x\_{test}) := q\\big({d\_{NN}(p\_1; \\mathcal{M}), \\dots,
d\_{NN}(p\_n; \\mathcal{M})}\\big), \\quad q(\\mathcal{D}) :=
\\text{mean}\\big(H\_{0.01}(\\mathcal{D})\\big) $$

其中 $H\_{0.01}(\\mathcal{D})$ 是集合 $\\mathcal{D}$ 中**最大的 1% 的值**，所以 $q$
是「最异常的 1% Patch 距离的平均」，可以理解为对 99% 分位数的尾部风险值 (tail value at risk)
的经验估计。选择它是为了平衡两点：①分数要依赖最高的 Patch 距离，因为它们的异常信号最强；②要对**单个异常高的 Patch
距离**有一定鲁棒性（少样本时记忆库很稀疏，这一点很重要）。论文指出对特殊情形可以换统计量：若异常通常覆盖图像较大区域，可用较高的百分位数；若异常只出现在局部、仅影响极少数甚至单个
Patch，则分数应对最大 Patch 距离更敏感。

**像素级**：与 PatchCore 一致，用双线性上采样加高斯平滑（$\\sigma = 4.0$）把 Patch
距离变成像素级异常分数。论文也把 AnomalyDINO 扩展到了**批量零样本**场景。

### 丰富记忆库与过滤相关 Patch

少样本下的主要挑战是用很少的正常样本刻画「正常」的概念，且测试时的变化通常比参考数据大得多。所以：

  - **旋转增强**：对参考样本做旋转等简单增强，增加正常 Patch 特征的多样性（如 MVTec-AD 的 Screw
    需要旋转不变的特征）。但旋转也可能有害：当物体（或其局部）的旋转本身就是异常时。论文考虑两种设置：「**agnostic**」（不知道样本的可能旋转，总是用旋转增强，是论文的主设置）和「**informed**」（知道样本的可能旋转，工业/医学场景里数据采集通常可控，可能降低推理时间）
  - **掩码 (Masking)**：把图像里的主要物体与背景分开，可以减少**误报**，在低数据量时提升鲁棒性。为了减小开销，也用
    DINOv2 来做掩码：对 Patch 特征的**第一主成分做阈值化**。经验上有时会产生错误掩码，常见于特写镜头（物体占 50%
    以上的 Patch）；解决办法是在第一张参考样本上检查 PCA 掩码是否准确地覆盖了物体（「masking
    test」，每个物体只做一次），再决定是否使用；还用膨胀和形态学闭运算去掉小洞和缝隙。一般**不对纹理类**（如
    MVTec-AD 的 Wood、Tile）做掩码
  - 预处理（是否掩码、是否增强）取决于具体物体的特点

anomalib 的默认用法（源码示例）：`AnomalyDINO(num_neighbours=1,
encoder_name="vit_small_patch14_dinov2", masking=...,
coreset_subsampling=False)`；MVTec AD 里示例对
capsule、hazelnut、pill、screw、toothbrush 这几类启用掩码，其余不启用；可选用贪心
coreset 子采样压缩记忆库。

## 实验设置与结果

  - **默认设置**：DINOv2 有从 small（ViT-S，$21\\times10^6$ 参数）到
    giant（ViT-G，$1.1\\times10^9$ 参数）的多种蒸馏大小；为低延迟取最小的模型为默认（记为
    **AnomalyDINO-S**），评估两种输入分辨率：较短边 448 和 672 像素；默认使用「agnostic」预处理
  - **数据集**：MVTec-AD（15 类）和 VisA（12 类，部分类别含多个物体和复杂结构，更难）
  - **指标**：检测用 AUROC、F1-max、AP；分割用
    AUROC、F1-max、PRO。论文强调正常/异常像素极不均衡（MVTec-AD
    有 97.26% 的正常像素，VisA 为 99.45%），所以不建议只看分割 AUROC（见 [Anomaly Detection
    Metrics](/0711_ML_Metrics_Anomaly)）；每个实验重复三次取均值和标准差（随机性来自参考样本的选择，三次分别取训练集的前
    $k$、第二个 $k$、第三个 $k$ 张）
  - **对比基线**：SPADE、PaDiM、PatchCore、WinCLIP+、APRIL-GAN 等；ACR 和 MuSc
    考虑的是批量零样本设置，与 AnomalyDINO 的设置不同；APRIL-GAN 和 AnomalyCLIP
    需要在相关数据集上训练，而 AnomalyDINO 免训练
  - **结果**：达到单样本和少样本 SOTA，例如 MVTec-AD 单样本检测 AUROC 从 93.1% 提升到 96.6%；在
    MVTec-AD
    上的少样本检测优于其他多模态少样本方法，**推理速度也更快**；论文称其「减少的开销加上出色的少样本性能」使它适合快速部署，如工业场景
  - **运行时间**：论文附录 Table 9 在单块 NVIDIA A40 上测了 MVTec-AD 的推理时间和建库时间；GPU
    加速的近邻搜索使记忆库增大时推理时间只略微增加；记忆库很大时建议使用 coreset 子采样；批量零样本推理在
    MVTec-AD 上约 60 ms/样本（附录 D）
  - 论文的消融（4.2 节）与讨论了掩码、旋转等预处理对不同物体的影响，详见论文附录 C

## 特点与局限

  - **优点**：免训练，少样本（1\~几张）即可；DINOv2 特征质量高，不需要选层和多层聚合；对输入分辨率灵活；用 PCA
    掩码和增强减少少样本时的误报；简单、易调试，便于快速部署和适配正常分布的变化
  - **局限**：需要保存记忆库并做近邻搜索，记忆库大时要用 coreset；掩码依赖 DINOv2
    的第一主成分，对特写镜头可能失败，需要先做一次检查；预处理要根据物体特点选择，不能一刀切；anomalib
    里该目录没有 README 和基准数据

## Reference

  - [AnomalyDINO: Boosting Patch-based Few-shot Anomaly Detection with
    DINOv2](https://arxiv.org/abs/2405.14529)
  - [anomalib -
    anomaly\_dino](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/anomaly_dino)
