-----

| Title     | ML Tasks TimeSeries Foundation GPT4TS                 |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-19T02:42:07Z`                                |
| Updated @ | `2026-11-19T02:42:07Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/650) |

-----

# GPT4TS

GPT4TS 出自论文 *One Fits All: Power General Time Series Analysis by
Pretrained LM*（Tian Zhou, Peisong Niu, Xue Wang, Liang Sun, Rong
Jin；论文首页标注 NeurIPS 2023；arXiv:2302.11939）。论文自己把模型称为
**FPT（Frozen Pretrained Transformer）**，主要用 GPT-2 作骨干；"GPT4TS" 是后续文献（例如
Time-LLM 论文把它写作
GPT4TS）和本仓库综述（见[基础模型篇](/0608_ML_Tasks_TimeSeries_Foundation)）对它的称呼；本文所读的这篇论文正文没有使用
GPT4TS 这个名字 \[待核实：该别名是否出自作者官方\]。

一句话概括：**取预训练 GPT-2 的前几层，冻结自注意力与 FFN，只训练输入层、输出层、位置嵌入和 LayerNorm，再配上实例归一化和
patching，用同一个骨干做预测、分类、异常检测、填补、少样本和零样本。**

它属于"复用 LLM"路线（同类的还有 Time-LLM 等），不是从头预训练的时序基础模型：GPT-2
的权重来自文本预训练，时序数据只用来训练少量适配参数。更广的背景见[时序总览](/0603_ML_Tasks_TimeSeries)与[深度模型篇](/0606_ML_Tasks_TimeSeries_Deep)。

## 解决什么问题

论文的出发点：

  - NLP/CV 里一个预训练模型可以服务多个任务，而时序分析的每个任务（分类、异常检测、预测、少样本学习）仍由专门设计的方法主导。
  - 阻碍时序预训练模型的主要困难是数据量：论文称最大的时序数据集小于 10GB（引 Monash 存档），远小于 NLP 语料。
  - 因此论文借用在数十亿 token 上预训练过的语言（或视觉）模型，尽量不改动它。

## 核心思想与结构

### 整体流程

    单变量序列 x (长度 L)       # 多变量按通道拆成多条单变量序列（channel independence）
       |  实例归一化（减均值除标准差）
       v
    patching：相邻时间步聚合成 patch token
       |  线性输入嵌入（训练）-> 维度 768（GPT-2 隐藏维）
       |  + 位置嵌入（微调）
       v
    GPT-2 前 K 层（自注意力、FFN 冻结；LayerNorm 微调）
       |
       v
    输出线性层（训练）-> 预测值 / 分类 logits / 重构值
       |  反归一化（加回均值与方差）
       v
    输出

论文对结构的描述（第 3 节）可归纳为下表：

| 模块                      | 做法                                                           | 是否训练          |
| ----------------------- | ------------------------------------------------------------ | ------------- |
| Frozen Pretrained Block | 保留预训练模型的自注意力块和 FFN                                           | 冻结            |
| 位置嵌入                    | 沿用预训练的位置嵌入层                                                  | 微调            |
| LayerNorm               | 沿用预训练的 LayerNorm                                             | 微调            |
| 输入嵌入                    | 重新设计，把时序投影到预训练模型所需维度；论文称用 linear probing，以减少训练参数             | 训练            |
| 输出层                     | 线性输出层                                                        | 训练            |
| 数据归一化                   | reverse instance norm（Kim et al., 2022）：用均值和方差归一化输入，再把它们加回输出 | 论文未说明是否含可学习参数 |
| Patching                | 沿用 PatchTST 的 patching，在实例归一化之后做                             | 无             |

论文给出的理由：自注意力层和 FFN 含有预训练语言模型学到的大部分知识，所以冻结；微调位置嵌入和 LayerNorm 是迁移学习的常规做法（引
Lu et al., 2022；Houlsby et al., 2019）。

### 实例归一化与 patching

设输入序列为 $x\\in\\mathbb R^{L}$，均值与标准差为 $\\mu,\\sigma$，则归一化与反归一化为

$$\\tilde x=\\frac{x-\\mu}{\\sigma},\\qquad \\hat y=\\sigma,\\tilde
y+\\mu$$

\[解读\] 这是 RevIN 的通常写法（不含可学习仿射参数的简化形式）；论文只说"用均值和方差归一化输入，再加回到输出"。

patching 把 $\\tilde x$ 切成长度 $P$、步长 $S$ 的片段，每个 patch 作为一个 token，token 数约为
$\\lfloor (L-P)/S\\rfloor+1$ \[解读\]。论文说 patching 能在保持 token
长度不变的情况下大幅增加可看的历史长度并减少冗余。论文正文没有给出 $P$、$S$
的具体数值 \[待核实\]。

自拟示意（非论文数字）：$L=96$、$P=16$、$S=8$ 时，token 数为 $\\lfloor
(96-16)/8\\rfloor+1=11$。

### 只用前几层

论文用 GPT2(K) 表示"GPT-2 的前 K 层"。默认用 6 层（GPT2(6)），填补任务用 3
层（GPT2(3)）。论文给出的理由（第 5 节与附录 H.1）：多数时序
Transformer 只用不超过 3 层，12 层及以上的预训练模型可能在时序预测上过拟合；在 ETTh2
上，预训练模型在层数很少时表现不好，在 3 到 9
层之间表现更好，因此选 6 层作为默认。

### 多变量处理

论文附录 D 说明：把多变量数据转成单变量，把每个特征当作一条独立的时间序列，主要为了 patching 之后的显存效率，并引 DLinear
与 PatchTST 证明 channel independence 有效。

## 训练与推理

  - 每个下游任务各自微调一份适配参数（输入层、输出层、位置嵌入、LayerNorm），骨干的自注意力与 FFN 不变。"One fits
    all" 指同一个骨干可用于所有任务，不是指一份权重通吃 \[解读\]。
  - 论文实验用 PyTorch，在 NVIDIA V100 32GB 上训练，预训练模型取自 Hugging Face（Wolf et
    al., 2020）。
  - 少样本学习：只用训练集中 5% 或 10% 的时间步，验证集与测试集不变；用早停（验证损失连续三个 epoch 无下降则停）。
  - 零样本：在源数据集上训练，目标数据集不做任何微调直接预测。
  - 学习率、优化器、patch 大小、输入长度等超参数在正文与附录文字中未找到明确数值 \[待核实\]；附录 H.10
    说明长期预测的输入长度不固定，而是与各基线论文的最佳报告值比较。

## 实验设置与结果

论文遵循 TimesNet 的实验设置，基线结果引自 TimesNet（Wu et al., 2023）。以下数字均为论文表格。

### 各任务设置

| 任务   | 数据                                     | 论文设置                                             | 使用层数    |
| ---- | -------------------------------------- | ------------------------------------------------ | ------- |
| 填补   | ETTh1/h2/m1/m2、Electricity、Weather     | 长度 96 的序列，随机掩码 12.5%/25%/37.5%/50% 时间点，四种比例取平均   | GPT2(3) |
| 分类   | 10 个 UEA 多变量数据集                        | 序列级分类                                            | GPT2(6) |
| 异常检测 | SMD、MSL、SMAP、SWaT、PSM                  | 只用重构误差（所有基线统一）                                   | GPT2(6) |
| 长期预测 | Weather、Traffic、Electricity、ILI、ETT 四个 | 预测长度 ILI 为 {24,36,48,60}，其余 {96,192,336,720}，取平均 | GPT2(6) |
| 短期预测 | M4                                     | 预测长度 6 到 48                                      | GPT2(6) |
| 少样本  | 同长期预测                                  | 训练集只用 5% 或 10%                                   | GPT2(6) |
| 零样本  | M4、M3、Tourism、Electricity              | 源数据集训练、目标集直接预测                                   | GPT2(6) |

### 主要数字

填补（Table 1，四种掩码比例平均，MSE / MAE）：

| 方法       | 平均 MSE | 平均 MAE |
| -------- | ------ | ------ |
| GPT2(3)  | 0.047  | 0.127  |
| TimesNet | 0.049  | 0.132  |
| PatchTST | 0.060  | 0.144  |
| DLinear  | 0.119  | 0.224  |

论文称在 ETTh1 上相对 TimesNet 的 MSE 降低 11.5%，六个数据集平均降低 4.1%。不是处处最优：例如 ECL 上
PatchTST 的 MSE 为 0.072，低于 GPT2(3) 的 0.090。

分类（Figure 3，10 个 UEA 数据集平均准确率）：GPT2(6) 为 74.00%，TimesNet 为
73.60%，PatchTST 为 67.90%，DLinear 为 67.50%。

异常检测（Table 2，F1 %）：

| 方法             | SMD   | MSL   | SMAP  | SWaT  | PSM   | 平均    |
| -------------- | ----- | ----- | ----- | ----- | ----- | ----- |
| GPT2(6)        | 86.89 | 82.45 | 72.88 | 94.23 | 97.13 | 86.72 |
| TimesNet（作者复现） | 84.61 | 81.84 | 69.39 | 93.02 | 97.34 | 85.24 |

长期预测（Table 3，平均，MSE / MAE）：

| 方法       | MSE   | MAE   |
| -------- | ----- | ----- |
| GPT2(6)  | 0.516 | 0.407 |
| PatchTST | 0.446 | 0.386 |
| TimesNet | 0.596 | 0.433 |
| DLinear  | 0.562 | 0.436 |

论文称 GPT2(6) 与 PatchTST "comparable"，并称相对 TimesNet 平均 MSE 降低 9.3%。表中平均值
PatchTST 更好；自拟重算：用 Table 3 的平均 MSE，GPT2(6) 相对 TimesNet 为
$(0.596-0.516)/0.596\\approx13.4%$；对 8 个数据集逐个算相对降幅再取平均，约
13.6%（同样自拟重算）；两种算法都与正文的 9.3% 对不上，论文未说明 9.3%
的口径（可能来自与表格不同的统计口径或旧版本）\[待核实\]；ILI 数据集上两者差距最大（GPT2(6) 的
MSE 为 1.925，PatchTST 为 1.443）。

短期预测（Table 4，M4）：GPT2(6) 的 sMAPE 为 11.991，MASE 为 1.600，OWA 为
0.861；TimesNet 为 11.829 / 1.585 / 0.851，N-BEATS 为 11.851 / 1.599 /
0.855。论文称"优于 Transformer 和 MLP 类模型，与 TimesNet 和 N-BEATS 相当"，并非最优。

少样本（Table 5，10% 训练数据，七个数据集平均，MSE / MAE）：GPT2(6) 为 0.371 / 0.367，PatchTST
为 0.385 / 0.376，DLinear 为 0.429 / 0.409，TimesNet 为 0.556 / 0.458。论文称相对
TimesNet 和 DLinear 的平均 MSE 降低 33.3% 和 13.5%。

零样本（Table 6）：

| 方法       | M4 sMAPE | M3 sMAPE | Tourism MAPE | Electr ND×100 | 平均    |
| -------- | -------- | -------- | ------------ | ------------- | ----- |
| N-BEATS  | 11.70    | 12.44    | 18.82        | 17.8          | 15.19 |
| GPT2(6)  | 13.12    | 13.06    | 22.14        | 17.2          | 16.38 |
| PatchTST | 13.22    | 13.06    | 27.10        | 17.3          | 17.67 |
| DLinear  | 15.33    | 14.03    | 28.51        | 17.6          | 18.86 |
| TimesNet | 13.55    | 14.17    | 28.84        | 19.3          | 18.96 |

源数据：Tourism、Electricity、M3 以 M4 为源；M4 以 M3 为源（N-BEATS 用
FRED）。论文承认零样本在若干数据集上仍落后于 N-BEATS，只在
Electricity 上超过它。

### 消融（Table 7，10% 数据，三个数据集 MSE）

| 变体                 | Weather | ETTh1 | ETTh2 |
| ------------------ | ------- | ----- | ----- |
| GPT2(6)            | 0.237   | 0.427 | 0.346 |
| GPT2(0)（零层）        | 0.263   | 0.874 | 0.666 |
| No Freeze（全部微调）    | 0.273   | 0.753 | 0.447 |
| No Pretrain（随机初始化） | 0.277   | 1.326 | 0.502 |

附录文字：冻结相对全部微调带来 5% 数据 12.7%、10% 数据 11.5% 的相对 MSE 降低；预训练相对随机初始化分别为 21.2%
和 14.3%；随机初始化再冻结的结果很差（附录 H.2），说明预训练知识起作用。附录 H.3 称微调 LayerNorm
和位置嵌入有一定收益，长预测长度尤其明显。

### 换骨干（Table 8，5% 数据，MSE）

ETTh2 上 GPT2(6) 为 0.400，BERT(6) 为 0.452，BEiT(6) 为 0.459，PatchTST 为
0.439；ETTm2 上依次为 0.308、0.318、0.315、0.314。论文据此说，迁移不局限于 GPT-2，图像预训练模型
BEiT 也有效。

### 训练开销（Table 9，ETTh2 一个 batch，batch size 128，V100）

GPT-2(6)-768 可训练参数 4M，占总参数 4.6%，训练一步 0.104 s，推理一个 batch 0.054 s；同为 768
维的 PatchTST 为 20M、0.457 s、0.123 s，TimesNet 为 42M、5.723 s、2.162
s。论文对"大模型反而更快"感到意外，推测主要得益于 Hugging Face GPT 实现的优化。

## 论文的理论分析：自注意力与 PCA

论文第 8 节试图解释为什么文本预训练的模型能直接用于时序。

观察：对每层输出的 token 计算两两余弦相似度。在随机初始化的 GPT2(6) 中，各层 token 相似度很低（0.1 到
0.2）；换成预训练参数后，深层相似度显著上升，最后一层超过 0.9。把自注意力替换成 PCA 后，token
相似度的模式基本不变（Figure 4b）。论文据此推测：token
被投影到输入模式的低维主特征向量空间。附录另给了
t-SNE 对比：GPT2-FPT 最后一层的特征图比端到端训练的 PatchTST 更分散，论文认为这有利于最后一层输出层的学习。

理论：记输入 $X=(x\_1,\\dots,x\_N)^\\top\\in\\mathbb R^{N\\times
D}$，$A=W\_QW\_K^\\top$，注意力权重

$$P\_{i,j}=\\frac{\\exp(x\_i^\\top A
x\_j)}{\\sum\_{k=1}^N\\exp(x\_i^\\top A x\_k)}$$

Lemma 8.1 给出雅可比矩阵范数的上界，其中含有项 $\\sum\_i\\lVert x\_i-\\sum\_j
P\_{i,j}x\_j\\rVert^2$。要让梯度范数小，就要让这一项小。在 $A$ 较小且输入中心化（$\\sum\_i
x\_i=0$）时，论文近似为

$$\\sum\_{i=1}^N\\lVert x\_i-X^\\top
P\_{i,:}\\rVert^2\\approx\\sum\_{i=1}^N\\lVert x\_i-X^\\top
XAx\_i\\rVert^2$$

Theorem 1：设 $W\_Q,W\_K$ 为 $D\\times m$
矩阵，$\\lambda\_1\\ge\\dots\\ge\\lambda\_D$ 为 $X^\\top X$
的特征值，$v\_i$ 为对应特征向量，则使上式最小的最优 $A$ 为

$$A^\*=\\sum\_{i=1}^m\\frac{1}{\\lambda\_i}v\_iv\_i^\\top$$

即 $A$ 由 $X^\\top X$ 的前 $m$ 个特征向量构成，这是 PCA
的形式。论文的结论是：通过把梯度推向零的训练，自注意力学到的函数与
PCA 密切相关。

论文还用此解释"为什么只微调嵌入和 LayerNorm"：假设预训练 LM 整体在做某种通用运算，微调其中任何其他部分都可能破坏这一通用功能。

附录还有两处补充：Theorem E.1（非正式）称，在适当假设下自注意力输出的 value token 以 $O(n^{-1/2})$
的量级收敛到均值，论文解释为去噪能力；附录 F 从 n-gram 角度给出非正式论证。论文自己承认理论分析"仍处于早期"。

## 优缺点与局限

论文自述的局限（结论部分）：

  - 零样本性能在若干数据集上仍落后于 N-BEATS。
  - 对 Transformer 通用性的分析还处于早期阶段。
  - 未来计划使用 parameter-efficient fine-tuning，在预训练模型中加入额外结构。

\[经验\] 对论文表格的解读：

  - 在 Table 3 的长期预测上，平均指标 PatchTST 优于 GPT2(6)；短期预测 M4 上 TimesNet 与
    N-BEATS 不弱于它。"全面最优"的说法需要对照具体表格。
  - 理论部分是"相关性证据加近似推导"，Theorem 1 依赖 $A$ 较小和输入中心化的近似，不是对完整 GPT-2 的严格证明。

关于"LLM 是否真的有用"：本仓库[基础模型篇](/0608_ML_Tasks_TimeSeries_Foundation)引用
arXiv:2406.16964（*Are Language Models Actually Useful for Time Series
Forecasting?*）的摘要结论：对几种基于 LLM 的预测方法做消融，移除 LLM
或用基本注意力层替换，预测性能不下降，多数情况下甚至更好。该质疑属论文之外的内容，这里只按综述口径转述，并标注
\[待核实：该工作是否涵盖本文方法的具体实现\]。

## 与相关方法对比

| 方法          | 骨干                | 训练什么                  | 说明                                  |
| ----------- | ----------------- | --------------------- | ----------------------------------- |
| GPT4TS（FPT） | 预训练 GPT-2 前 6 层   | 输入/输出层、位置嵌入、LayerNorm | 冻结自注意力与 FFN                         |
| PatchTST    | 从头训练的 Transformer | 全部                    | 同样用 patching 与 channel independence |
| TimesNet    | CNN（从头）           | 全部                    | 论文的主要对比对象                           |
| DLinear     | 线性层               | 全部                    | 少样本对比对象                             |
| N-BEATS     | MLP 堆叠            | 全部                    | 零样本最强对比                             |

Time-LLM 等其他复用 LLM 的方法只写名字，不展开。

## 使用方式

示意代码，未运行验证（仅演示预测任务的冻结与 patching 思路；超参数为占位值，论文未给出 patch 大小等数值）：

``` python
import torch, torch.nn as nn
from transformers import GPT2Model

class FPT(nn.Module):
    def __init__(self, patch_len, stride, pred_len, n_layers=6):
        super().__init__()
        self.gpt = GPT2Model.from_pretrained("gpt2")
        self.gpt.h = self.gpt.h[:n_layers]
        for name, p in self.gpt.named_parameters():
            p.requires_grad = ("ln" in name) or ("wpe" in name)
        self.inp = nn.Linear(patch_len, 768)
        self.out = nn.LazyLinear(pred_len)
        self.patch_len, self.stride = patch_len, stride

    def forward(self, x):                     # x: [B, L]
        mu, sd = x.mean(1, keepdim=True), x.std(1, keepdim=True) + 1e-5
        z = ((x - mu) / sd).unfold(1, self.patch_len, self.stride)
        h = self.gpt(inputs_embeds=self.inp(z)).last_hidden_state
        return self.out(h.flatten(1)) * sd + mu
```

## Reference

  - 论文：<https://arxiv.org/abs/2302.11939>
  - 论文摘要中给出的代码：<https://github.com/DAMO-DI-ML/One_Fits_All>
