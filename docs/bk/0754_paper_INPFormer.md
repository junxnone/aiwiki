-----

| Title     | paper INPFormer                                       |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-24T08:14:49Z`                                |
| Updated @ | `2026-11-24T09:21:18Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/754) |

-----

# INPFormer 单图内固有正常原型

  - **INP-Former**：Exploring Intrinsic Normal Prototypes within a Single
    Image for Universal Anomaly Detection，CVPR 2025，论文
    [arXiv 2503.02424](https://arxiv.org/abs/2503.02424)，官方代码
    [luow23/INP-Former](https://github.com/luow23/INP-Former)
  - 类型：Segmentation
  - 动机：现有方法通常依赖把测试图像与训练集里的**正常参考**做「比较」，但外观和位置的变化会使这些参考与测试图像**难以对齐**，限制检测精度。论文观察到：多数异常表现为**局部变化**，所以即使在异常图像里仍有大量有价值的**正常信息**；而且这些信息与异常**来自同一张图**，对齐程度可能更好
  - 核心思想：不再依赖训练集的外部正常性，而是从**测试图像自身**提取**固有正常原型 (Intrinsic Normal
    Prototypes, INPs)**：用 **INP 提取器**把正常 token 线性组合成 INP；用 **INP
    一致性损失**保证 INP 忠实代表测试图像的正常性；用 INP 引导的解码器**只重构正常
    token**，重构误差作为异常分数；再加**软挖掘损失**，让训练更关注难优化的样本
  - 论文结果：在 MVTec-AD、VisA、Real-IAD 上，单类、多类、少样本三种设置都达到 SOTA
    或相当的水平，还表现出一定的**零样本**能力
  - 与同样使用冻结 ViT 的
    [Dinomaly](/0753_paper_Dinomaly)、[L2BT](/0752_paper_L2BT) 相关

## 框架

模型包含四个模块：固定的预训练编码器 $\\mathcal{Q}$、INP 提取器 $\\mathcal{E}$、瓶颈
$\\mathcal{B}$、INP 引导的解码器 $\\mathcal{D}$。

``` mermaid
graph LR
    X["输入图像 I"] --> E["冻结编码器 Q<br/>多尺度特征 f_Q 共 N 个 token"]
    E --> I["INP 提取器<br/>M 个可学习查询 token 与特征做交叉注意力<br/>得到 M 个 INP"]
    E --> B["瓶颈 B<br/>融合多尺度特征"]
    B --> D["INP 引导解码器<br/>INP 作为注意力的 key 与 value"]
    I --> D
    E --> S["编码器与解码器特征的差<br/>作为异常分数"]
    D --> S
```

图中：

  - 输入图像 $I \\in \\mathbb{R}^{H\\times W\\times 3}$ 先经编码器得到多尺度潜在特征
    $f\_\\mathcal{Q} = {f^1\_\\mathcal{Q}, \\dots,
    f^L\_\\mathcal{Q}}$，每个 $f^l\_\\mathcal{Q} \\in \\mathbb{R}^{N
    \\times C}$，$N = HW/k^2$ 是 token 数（$k$ 为下采样因子）
  - **INP 提取器**从这些特征中提取 $M$ 个 INP：$P = {p\_1, \\dots, p\_M}$，$p\_m \\in
    \\mathbb{R}^C$；测试时由 INP 一致性损失保证它们一致地代表正常特征
  - **瓶颈**融合多尺度特征，送入解码器
  - **INP 引导解码器**把 INP 作为 key-value，使解码器重构出的特征**只含正常模式**，所以编码器特征
    $f\_\\mathcal{Q}$ 与解码器特征 $f\_\\mathcal{D}$ 之间的重构误差就是异常分数

## INP 提取器

已有的原型方法（PatchCore
等）把训练集的局部正常特征存起来与测试图像比较，但预存原型与测试图像的**正常性不对齐**，且**缺乏全局信息**。INP
提取器**从测试图像自身动态提取带全局信息的 INP**：用**交叉注意力**把预训练特征 $F\_\\mathcal{Q}$
的全局语义，聚合到 $M$ 个可学习 token $T$ 里；$F\_\\mathcal{Q}$ 作
key-value，$T$ 作 query，让 $T$ 把 $F\_\\mathcal{Q}$ **线性聚合**成 INP：

$$ F\_\\mathcal{Q} = \\text{sum}\\big({f^1\_\\mathcal{Q}, \\dots,
f^L\_\\mathcal{Q}}\\big), \\quad Q = T W^Q,\\ K = F\_\\mathcal{Q}W^K,\\
V = F\_\\mathcal{Q}W^V $$

$$ T' = \\text{Attention}(Q, K, V) + T, \\qquad P = \\text{FFN}(T') + T'
$$

其中：

  - $F\_\\mathcal{Q} \\in \\mathbb{R}^{N\\times C}$：各层特征逐元素求和得到的预训练特征；$T
    \\in \\mathbb{R}^{M \\times C}$：$M$ 个可学习查询 token；$W^Q, W^K, W^V \\in
    \\mathbb{R}^{C \\times C}$：可学习的投影矩阵；$Q \\in \\mathbb{R}^{M\\times
    C}$，$K, V \\in \\mathbb{R}^{N \\times C}$
  - Attention 即 $\\text{Softmax}(QK^\\top/\\sqrt{C})V$：每个 query 对所有
    token 做加权求和，权重由相似度给出，所以 INP 是正常 token 的**线性组合**；$\\text{FFN}$
    是前馈网络，两处残差连接；$P \\in \\mathbb{R}^{M \\times C}$ 即得到的
    $M$ 个 INP
  - 所以每张图得到的是**该图自己的**少量原型，而不是训练集中保存的全局原型库

**INP 一致性损失** $\\mathcal{L}\_c$：为让 INP
能一致地代表正常特征、同时尽量不捕获异常特征，最小化每个正常特征与其最近
INP 的距离：

$$ d\_i = \\min\_{m \\in {1, \\dots, M}}
\\mathcal{S}\\big(F\_\\mathcal{Q}(i),\\ p\_m\\big), \\qquad
\\mathcal{L}*c = \\frac{1}{N}\\sum*{i=1}^{N} d\_i $$

其中 $\\mathcal{S}(\\cdot,\\cdot)$ 是余弦距离，$d\_i$ 是第 $i$ 个 token 特征到最近 INP
的距离。论文的可视化（图 4）表明有 $\\mathcal{L}\_c$ 时，输入特征到最近 INP 的距离图能清晰地突出异常。

## INP 引导解码器

如果直接用测试特征到最近 INP 的距离检测异常，由于有限的离散 INP 很难建模一些**代表性低的正常区域**，距离图会有噪声。INP
引导解码器用**多个离散 INP 的组合**去重构这些区域，同时**抑制异常区域的重构**，并提供逐 token
的差异可直接用于检测异常：

  - 把提取出的 INP 作为**注意力的 key-value**，使输出是正常 INP 的线性组合，从而有效抑制异常 query
    的重构，即避免「恒等映射」问题
  - 论文还发现解码器里的**第一个残差连接会把异常特征直接引入后续重构**，所以**去掉了这个连接**
  - 计算量：INP 引导的注意力里 key/value 只有 $M$ 个 token，而普通自注意力有 $N$
    个，所以计算量和显存大幅下降（论文 Table 1：$A\_l = Q\_l
    K\_l^\\top$ 的乘加数从 943,496,960 降到 7,220,640，$K\_l$、$V\_l$、$A\_l$
    的显存从约 2.30 / 2.30 / 2.34 MB 降到 0.018 MB）

## 软挖掘损失

受 Focal Loss 启发，不同区域应按优化难度赋予不同权重：用「单个正常区域的重构误差与所有正常区域平均重构误差之比」衡量优化难度。给定第
$l$ 层的编码器特征 $f^l\_\\mathcal{Q}$ 和解码器特征 $f^l\_\\mathcal{D}$，记 $M^l$
为逐区域余弦距离：

$$ w^l(h, w) = \\Big\[\\frac{M^l(h, w)}{u(M^l)}\\Big\]^\\gamma, \\qquad
\\mathcal{L}*{sm} = \\frac{1}{L}\\sum*{l=1}^{L}\\Big(1 -
\\frac{\\text{vec}(f^l\_\\mathcal{Q})^\\top \\cdot
\\text{vec}(\\hat{f}^l\_\\mathcal{D})}{\\lVert
\\text{vec}(f^l\_\\mathcal{Q}) \\rVert\\ \\lVert
\\text{vec}(\\hat{f}^l\_\\mathcal{D}) \\rVert}\\Big), \\qquad
\\mathcal{L}*{total} = \\mathcal{L}*{sm} + \\lambda \\mathcal{L}\_c $$

其中：

  - $M^l(h,w)$：第 $l$ 层位置 $(h,w)$ 的编码器与解码器特征的余弦距离；$u(M^l)$：该 batch
    内逐区域余弦距离的平均；$w^l(h,w)$：动态权重，难优化的区域（距离大于平均）权重大于 1
  - $\\gamma \\ge 0$：温度超参数；$\\hat{f}^l\_\\mathcal{D}(h,w) =
    \\text{cg}\\big(f^l\_\\mathcal{D}(h,w)\\big)\_{w^l(h,w)}$：$\\text{cg}(\\cdot)\_w$
    是按动态权重 $w$ 调整梯度；$\\text{vec}(\\cdot)$：展平操作
  - $\\mathcal{L}\_{total}$：总损失 = 软挖掘损失 + $\\lambda$ 倍的 INP 一致性损失；这个软挖掘与
    [Dinomaly](/0753_paper_Dinomaly)
    里的「宽松损失」都是对「重构得好的点降低梯度」的不同实现：Dinomaly
    对低距离点缩小梯度到 1/10，INP-Former 按难度比值给连续权重

## 实现细节

| Name       | 设置                                                      |
| ---------- | ------------------------------------------------------- |
| 编码器        | ViT-Base/14，DINOv2-Register 权重（冻结）                      |
| INP 个数 $M$ | 默认 6（消融：$M$ 超过 4 后性能稳定；过大则 INP 可能混入异常 token，性能略降）       |
| INP 提取器    | 一个标准 Vision Transformer 块；INP 引导解码器 8 层                 |
| 输入         | 缩放到 448×448 再中心裁剪到 392×392                              |
| 超参数        | $\\gamma = 3.0$，$\\lambda = 0.2$                        |
| 优化         | StableAdamW，学习率 $10^{-3}$，权重衰减 $10^{-4}$，训练 200 个 epoch |
| 指标         | 图像级 AUROC / AP / F1-max；像素级 AUROC / AP / F1-max / AUPRO |

表中是论文的实验设置；论文说明这些超参数在不同数据集上不需要额外调整。

## 实验结果

  - **多类异常检测**（论文 Table 2，图像级 I-AUROC/I-AP/I-F1max，像素级
    P-AUROC/P-AP/P-F1max/AUPRO）：

| Dataset  | 图像级                       | 像素级                       |
| -------- | ------------------------- | ------------------------- |
| MVTec-AD | 99.7 / 99.9 / 99.2        | 98.5 / 71.0 / 69.7 / 94.9 |
| VisA     | 98.9 / 99.0 / 96.6（图像级最好） | 98.8 / 51.2 / 54.7 / 94.4 |
| Real-IAD | 90.5 / 88.1 / 81.5        | 99.0 / 47.5 / 50.3 / 95.0 |

表中每行是一个数据集；论文说明 MVTec-AD 达到 SOTA，VisA 图像级最好、像素级最好或次好，Real-IAD 取得新的
SOTA：相比第二名，图像级分别提升 1.2 / 1.3 / 1.3，像素级分别提升 0.2 / 4.7 / 3.2 /
1.1。对比方法有 RD4AD、UniAD、DiAD、MambaAD、Dinomaly 以及
SimpleNet、DeSTSeg。

  - **少样本（4-shot）**：显著优于 SPADE、PaDiM、PatchCore 以及基于 VLM 的
    WinCLIP、PromptAD；MVTec-AD 上图像级提升 1.0 / 1.3 / 2.3，VisA 上提升 7.3 /
    7.2 / 8.7，Real-IAD 上提升 3.7 / 10.1 / 6.5（相对第二名）
  - **单类**：在 MVTec-AD 和 Real-IAD 上取得新的 SOTA，VisA 上有竞争力
  - **消融**（Table 5，以类似 RD4AD 的框架为基线）：「INP」（INP 提取器 + INP
    引导解码器）显著提升整体性能，因为 INP
    引入了信息瓶颈，有助于保留正常特征并过滤异常特征；$\\mathcal{L}*c$
    和 $\\mathcal{L}*{sm}$ 又各自带来提升
  - **INP 的可视化**（图 7）：6 个 INP 的注意力图分别关注物体区域、物体边缘和背景区域，说明 INP
    捕获了不同的语义信息，INP 一致性损失使它们只关注正常区域而忽略异常
  - **零样本能力**：在 Real-IAD 上训练的 INP 提取器能在没见过的 MVTec-AD 上提取 INP，到 INP
    的距离图可以用于零样本检测；无需专门针对零样本训练，像素级 AUROC 在 MVTec-AD 和 VisA
    上分别达到 88.0 和 88.7，甚至超过专门的 WinCLIP

## 特点与局限

  - **优点**：原型来自**测试图像自身**，与图像对齐，并带有全局信息；INP
    引导注意力显著降低计算和显存；一个方法同时覆盖单类、多类、少样本，还有零样本能力；依赖强大的预训练
    ViT
  - **局限**（论文结论）：对与背景分布非常相似的**逻辑异常**（如 MVTec-AD 的 Transistor
    类里错位的异常）表现有限，因为这类异常与背景相似，INP 提取器会误把它提取成
    INP；作者计划把 INP 与预存的原型结合。另外依赖大型 ViT；anomalib README 里没有 benchmark
    数值

## Reference

  - [Exploring Intrinsic Normal Prototypes within a Single Image for
    Universal Anomaly Detection](https://arxiv.org/abs/2503.02424)
  - [official code](https://github.com/luow23/INP-Former)
  - [anomalib -
    InpFormer](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/inp_former)
