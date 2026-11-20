-----

| Title     | ML Tasks TimeSeries Deep Reformer                     |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-20T09:02:15Z`                                |
| Updated @ | `2026-11-20T09:02:15Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/670) |

-----

# Reformer

Reformer 出自论文 *Reformer: The Efficient Transformer*（Nikita Kitaev、Łukasz
Kaiser、Anselm Levskaya，UC Berkeley / Google Research，ICLR
2020，arXiv:2001.04451）。它是一个**通用的高效
Transformer**，最初面向长文本与图像序列，而不是专为时间序列设计；它在时间序列预测领域出名，主要是因为
Informer、Autoformer 等长序列预测论文把它作为**高效注意力基线**反复对比，Time-Series-Library
中也提供了 `Reformer` 模型实现。

**一句话概括：用局部敏感哈希（LSH）注意力把注意力复杂度从 $O(L^2)$ 降到 $O(L\\log
L)$，再用可逆残差层（Reversible
layers）让激活只需存一份而不是每层各存一份，并对前馈层做分块（chunking），使超长序列训练成为可能。**

> 标注约定：未标注的内容来自论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。本文介绍的是
> Reformer 原论文（NLP / 图像任务）的方法，**论文本身没有做时间序列预测实验**；它在时序领域的表现见
> Informer、Autoformer 等论文对其的比较。

本站相关：把它作为基线的
[Informer](/0635_ML_Tasks_TimeSeries_Deep_Informer)、[Autoformer](/0636_ML_Tasks_TimeSeries_Deep_Autoformer)、[Non-stationary
Transformers](/0669_ML_Tasks_TimeSeries_Deep_NonstationaryTransformer)；总览见
[深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)。

## 1\. 解决什么问题

论文指出标准 Transformer 在长序列上的三个开销来源：

1.  **注意力的二次开销**：注意力矩阵 $QK^\\top$ 的形状是 $\[\\text{batch},L,L\]$。论文举例：在长度
    64K 的序列上，即使 batch 为 1，这也是一个 $64K\\times64K$ 的矩阵，用 32 位浮点需要约 16GB；
2.  **层数带来的激活存储**：$n\_l$ 层网络需要为反向传播存 $n\_l$ 份激活，内存至少 $b\\cdot L\\cdot
    d\_{model}\\cdot n\_l$；
3.  **前馈层的宽度**：前馈层内部维度 $d\_{ff}$（通常 4K 甚至更高）使中间激活更大。

Reformer 对这三点分别给出办法：LSH 注意力、可逆残差层、前馈分块。

## 2\. 核心思想与结构

### 2.1 共享 QK 的 Transformer

LSH 注意力要求查询 $Q$ 与键 $K$ 相同。做法是用同一个线性层从输入 $A$ 同时得到 $Q$ 和 $K$，另一个线性层得到
$V$，称为 **shared-QK Transformer**。论文实验表明共享 QK 不影响性能（即使再对键做长度归一化）。

### 2.2 局部敏感哈希（LSH）注意力

**直觉**：softmax 由最大的几个元素主导，因此对每个查询 $q\_i$ 只需关注与它最接近的少数键（例如 64K 长度时只看最近的
32 或 64 个），问题变成在高维空间里快速找近邻。

**哈希方案**：要得到 $b$ 个桶，先固定一个随机矩阵 $R\\in\\mathbb R^{d\_k\\times b/2}$，定义

$$ h(x)=\\arg\\max\\big(\[xR;,-xR\]\\big) $$

其中：

  - $x\\in\\mathbb R^{d\_k}$：待哈希的向量（查询或键）；$R$：随机投影矩阵，随机旋转向量
  - $\[u;v\]$：把两个向量拼接；$xR$ 与 $-xR$ 各有 $b/2$ 个分量，拼接后共 $b$ 个分量
  - $\\arg\\max$：取最大分量的下标，即向量所属桶号
    $h(x)\\in{0,\\dots,b-1}$；相近向量以高概率落入同一桶，距离远的向量不会

**LSH 注意力**：把注意力限制在同一个哈希桶内。对位置 $i$ 的查询，可以关注的键集合记作 $P\_i$（桶内的位置），输出为

$$ o\_i=\\sum\_{j\\in P\_i}\\exp\\big(q\_i\\cdot
k\_j-z(i,P\_i)\\big),v\_j $$

其中：$z(i,P\_i)$ 是 softmax 的归一化项（配分函数），$q\_i\\cdot k\_j$ 是点积（论文为清晰起见省略了
$\\sqrt{d\_k}$ 缩放）；批处理时对更大集合做注意力并把不在 $P\_i$ 内的位置用 $-\\infty$ 屏蔽。

**排序与分块**：各桶大小不均、桶内查询数与键数不等，不便于批处理。论文的处理是：按（桶号，序列位置）对查询/键排序，排序后同桶的对角线附近聚集；然后把排序后的序列切成长度
$m$ 的块，**每个块与自己及前一块做注意力**。

**多轮哈希**：哈希总有小概率把相近向量放进不同桶，因此并行做 $n\_{rounds}$ 轮独立哈希，再合并结果以降低漏掉近邻的概率。

**因果掩码**：对排序后的位置索引做同样的置换并比较大小，得到遮蔽未来的掩码；另外因为共享 QK 时向量与自身的点积几乎总是最大，论文禁止一个
token 关注自己（除非它没有其他可关注的目标，例如序列第一个 token）。

下图概括 LSH 注意力的数据流。

    Q = K, V
       │ 随机旋转哈希：每个向量得到桶号
       ▼
    按（桶号, 位置）排序  →  同桶向量聚集在对角线附近
       │ 切成长度 m 的块
       ▼
    每块与自己 + 前一块做注意力（多轮并行）
       │ 取消排序，合并各轮结果
       ▼
    输出

图中：

  - 第一步：对共享的 $Q=K$ 做随机旋转哈希，相近向量同桶。
  - 第二步：按桶号和位置排序，注意力矩阵中的有效项集中到对角线附近，形成块状稀疏结构。
  - 第三步：分块计算，每块只与自己及前一块交互，把复杂度降到与长度近似线性。
  - 第四步：把排序打乱的结果还原到原顺序，多轮结果合并，缓解哈希遗漏。
  - 关键结论：注意力的显存与时间随长度近似线性（$O(L\\log L)$，包含排序的代价）。

论文 Table 1 给出各注意力的内存与时间复杂度：标准与内存高效注意力的项为 $\\max(b,n\_h,L,d\_k,\\
b,n\_h,L^2)$ 量级；LSH 注意力的项为 $\\max(b,n\_h,L,d\_k,\\
b,n\_h,L,n\_r(4L/n\_c)^2)$。其中 $b$ 为 batch 大小，$n\_h$ 为头数，$n\_c$ 为 LSH
块数，$n\_r$ 为哈希轮数。

### 2.3 可逆残差层（RevNet）

借用 Gomez 等人提出的可逆残差网络：普通残差层把单个输入映射为单个输出；可逆层维护两组激活
$(x\_1,x\_2)$，使任意层的激活都可以由下一层的激活**仅凭模型参数**反推，因此反向传播时无需存储中间激活：

$$ y\_1=x\_1+F(x\_2),\\qquad y\_2=x\_2+G(y\_1) $$

反向时通过减法恢复输入：

$$ x\_2=y\_2-G(y\_1),\\qquad x\_1=y\_1-F(x\_2) $$

其中：

  - $x\_1,x\_2$：层输入的两份激活；$y\_1,y\_2$：层输出的两份激活
  - $F,G$：两个残差函数；在可逆 Transformer 中 $F$ 取**注意力层**，$G$ 取**前馈层**（LayerNorm
    被移到残差块内部）
  - 好处：激活内存与层数 $n\_l$ 无关；论文称在参数量相同时（使 $x\_1,x\_2$ 的大小都为 $d\_{model}$）与标准
    Transformer 效果相当

### 2.4 前馈分块（Chunking）

前馈层在序列位置之间相互独立，因此可以把计算切成 $c$ 块逐块处理，降低 $d\_{ff}$ 引起的峰值内存：

$$
Y\_2=\\big\[Y\_2^{(1)};\\dots;Y\_2^{(c)}\\big\]=\\Big\[X\_2^{(1)}+\\mathrm{FeedForward}\\big(Y\_1^{(1)}\\big);\\dots;X\_2^{(c)}+\\mathrm{FeedForward}\\big(Y\_1^{(c)}\\big)\\Big\]
$$

其中：$Y\_1$ 是可逆层中第一份激活经注意力更新后的结果；$X\_2$ 是第二份输入激活；上标 $(k)$ 表示第 $k$ 块；$c$
是分块数；反向计算也同样分块。对词表很大的模型，输出层的对数概率与损失也分块计算。

此外，由于激活内存不再随层数增长，论文还提到可以把暂时不用的层参数换出到 CPU 内存，因为 Reformer 的 batch
乘长度很大，计算量足以掩盖传输时间。

### 2.5 复杂度对比

论文 Table 3 给出几种变体的量级对比（$b$ 为 batch，$L$ 为长度，$n\_l$ 为层数，$d\_{ff}$ 为前馈宽度）：

| 模型               | 内存项（量级）                                       | 说明               |
| ---------------- | --------------------------------------------- | ---------------- |
| Transformer      | $\\max(b,L,d\_{ff},\\ b,n\_h,L^2)\\cdot n\_l$ | 层数与长度平方都出现       |
| 可逆 Transformer   | $\\max(b,L,d\_{ff},\\ b,n\_h,L^2)$            | 去掉对层数 $n\_l$ 的依赖 |
| 分块可逆 Transformer | $\\max(b,L,d\_{model},\\ b,n\_h,L^2)$         | 前馈宽度被分块消去        |
| LSH Transformer  | 注意力项由 $L^2$ 降为近似线性                            | 仍与 $n\_l$ 相关     |
| Reformer         | LSH + 可逆 + 分块                                 | 内存与层数无关、注意力项近似线性 |

表中：「模型」是几种变体，「内存项（量级）」是主要内存项的量级，「说明」概括区别。结论是三项技术分别消去层数、前馈宽度与长度平方的影响，组合后得到
Reformer。

## 3\. 实验与结论

论文在三类任务上验证：合成的复制任务、enwik8（长度 64K 的字符序列）与 imagenet64（长度 12K 的图像生成），另在 WMT
2014 英德翻译上验证可逆层。结论是在这些任务上 Reformer 与全注意力 Transformer 效果相当，但长序列上更快、内存省得多。

### 3.1 合成复制任务

任务：复制一个符号序列，样本形如 $0w0w$，$w$ 的符号取自 ${1,\\dots,N}$（$N=127$），$w$ 长 511（总长
1024），只在后半部分计损失与准确率。该任务需要非局部的注意力查找，因此无法用局部有限窗口的稀疏注意力解决。用 1 层
Transformer（$d\_{model}=d\_{ff}=256$，4 个头）训练 150K 步。

表格列出论文 Table 2 的准确率（行为评估时使用的注意力，列为训练时使用的注意力）：

| 评估设置 \\ 训练设置 | 全注意力  | LSH-4 | LSH-2 | LSH-1 |
| ------------ | ----- | ----- | ----- | ----- |
| 全注意力         | 100%  | 0.8%  | 0.8%  | 0.8%  |
| LSH-8        | 94.8% | 100%  | 100%  | 99.9% |
| LSH-4        | 92.5% | 99.9% | 99.9% | 99.6% |
| LSH-2        | 76.9% | 99.4% | 98.1% | 94.8% |
| LSH-1        | 52.5% | 91.9% | 86.8% | 77.9% |

表中：行是评估时使用的注意力（全注意力，或 8/4/2/1 轮哈希的 LSH），列是训练时使用的注意力（全注意力，或 4/2/1
轮哈希）。读法：全注意力训练出的模型可直接换成 LSH 注意力评估，但精度会下降（轮数越少下降越多）；用 4
轮哈希训练的模型几乎完美；评估时增加哈希轮数（如 8 轮）可把精度补到接近 100%；用 LSH
训练的模型不能直接换成全注意力评估（0.8%）。行列对应关系依据论文表头与正文的描述整理
`[解读]`。

### 3.2 enwik8 / imagenet64 与 WMT

  - 3 层模型消融：$d\_{model}=1024$，$d\_{ff}=4096$，$n\_{heads}=8$，总 batch 8
    条序列，Adafactor 优化器；共享 QK 与可逆层都不影响性能（论文 Figure 3）；
  - WMT 2014 英德翻译：可逆 Transformer 在相同训练步数下与原版 Transformer base 相当（论文
    Table 4，BLEU 例如 base 100K 步约 27.6，对比 Vaswani 等人的 base 为
    27.3；更大模型与更多步数时更高）。

## 4\. 优缺点与局限

论文自述的优点：长序列上注意力与激活内存近似线性、与全注意力效果相当；LSH 轮数可在训练与推理时调节精度与速度。

`[解读]` / `[经验]`：

  - LSH 是近似算法，哈希漏掉近邻会损失精度，需要多轮哈希；排序与分块使实现比标准注意力复杂；
  - 它依赖"查询与键相同"的共享 QK 假设，这对时间序列预测的编码器-解码器（交叉注意力）场景不直接适用；
  - **在时间序列预测中的表现**：Informer、Autoformer 等论文把 Reformer
    作为基线，结果通常明显差于专为长序列预测设计的方法（如
    Informer 论文中的 Reformer 误差较高），因为通用高效注意力没有针对时间序列的先验。Informer 的论文还指出
    Reformer 保持动态解码，在 LSTF 上表现很差；这些说法来自
    [Informer](/0635_ML_Tasks_TimeSeries_Deep_Informer) 文章中对基线的描述；
  - 在时序基准上的具体数字请参考各时序论文（如
    [Autoformer](/0636_ML_Tasks_TimeSeries_Deep_Autoformer)、[Non-stationary
    Transformers](/0669_ML_Tasks_TimeSeries_Deep_NonstationaryTransformer)），本文不转引。

## 5\. 与相关方法对比

| 方法             | 降低注意力开销的方式              | 复杂度（论文口径）     | 备注                     |
| -------------- | ----------------------- | ------------- | ---------------------- |
| Reformer       | LSH 桶内注意力 + 可逆层 + 前馈分块  | $O(L\\log L)$ | 通用高效 Transformer，非时序专用 |
| Informer       | ProbSparse 注意力（只保留活跃查询） | $O(L\\log L)$ | 针对长序列预测，同时设计蒸馏与生成式解码   |
| Autoformer     | 自相关机制                   | $O(L\\log L)$ | 内置序列分解                 |
| 标准 Transformer | 全注意力                    | $O(L^2)$      | 基线                     |

表中：「降低注意力开销的方式」说明各方法的核心做法，「复杂度」是对序列长度 $L$ 的量级，「备注」给出定位。Reformer
的特点是同时处理注意力、层数、前馈三类内存开销。

## 6\. 使用方式

官方实现包括 Trax 与 Google 的相关代码；Hugging Face Transformers 也提供了
`ReformerModel`。Time-Series-Library 中的 `Reformer` 是其时序封装。下面是 LSH
哈希桶分配的示意代码（未运行验证，仅演示 $h(x)=\\arg\\max(\[xR;-xR\])$）：

``` python
import torch

def lsh_buckets(x, n_buckets, seed=0):          # x: [L, d]
    g = torch.Generator().manual_seed(seed)
    R = torch.randn(x.shape[-1], n_buckets // 2, generator=g)
    proj = x @ R                                  # [L, b/2]
    return torch.cat([proj, -proj], dim=-1).argmax(dim=-1)   # 桶号 [L]

def sort_by_bucket(x, buckets):                   # 按（桶号, 位置）排序
    L = x.shape[0]
    key = buckets * L + torch.arange(L)
    order = key.argsort()
    return x[order], order
```

使用要点 `[经验]`：做长序列预测基线对比时，应同时使用统一的归一化与评估协议，并报告 Reformer 的哈希轮数与块大小。

## Reference

  - Nikita Kitaev, Łukasz Kaiser, Anselm Levskaya. *Reformer: The
    Efficient Transformer*. ICLR 2020.
    [arXiv:2001.04451](https://arxiv.org/abs/2001.04451)
  - 站内：[深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)、[Informer](/0635_ML_Tasks_TimeSeries_Deep_Informer)、[Autoformer](/0636_ML_Tasks_TimeSeries_Deep_Autoformer)
