---
Title | ML Tasks TimeSeries Foundation LLMUseful
-- | --
Created @ | `2026-11-19T03:24:18Z`
Updated @| `2026-11-19T03:24:18Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/661)

---
# LLM 对时序预测有用吗

"Are Language Models Actually Useful for Time Series Forecasting?"（Mingtian Tan、Mike A. Merrill、Vinayak Gupta、Tim Althoff、Thomas Hartvigsen，NeurIPS 2024，arXiv:2406.16964）**不是提出新预测模型的论文，而是一项实证研究**：对三种把预训练语言模型（LLM）嵌进时序预测流水线的代表方法——OneFitsAll（即 GPT4TS）、Time-LLM、CALF——做消融，检验"LLM 这一块是否真的带来收益"。

一句话结论（论文自己的表述）：把 LLM 去掉，或换成一个随机初始化的单层注意力 / 单个 Transformer block，预测精度在多数情况下不降反升，而训练和推理开销小得多；预训练权重、对输入顺序的敏感度、少样本场景下都没有看到 LLM 的独特贡献。作者同时强调，目的不是断言"LLM 永远对时序没用"，而是指出现有方法在既定预测任务上几乎没用上 LLM 的能力，LLM 更适合文本推理等多模态场景。

本站已有对应的方法文章：GPT4TS、Time-LLM（此处只写名字）；总览见 [时间序列总览](/0603_ML_Tasks_TimeSeries)、基础模型路线见 [基础模型](/0608_ML_Tasks_TimeSeries_Foundation)、深度模型见 [深度学习时序模型](/0606_ML_Tasks_TimeSeries_Deep)。

## 问题设定：到底在问什么

近年的一批工作把 GPT-2、LLaMA 等预训练语言模型用于时序预测，隐含的假设是：语言模型擅长建模文本里的序列依赖，这种能力可以迁移到时序数据上。但"语言建模"与"时序预测"之间的直接联系并没有被充分检验。

这些方法的共同骨架是：

```
时序 --(instance norm)--> patching/token 化 --> 编码/对齐 --> [ 预训练 LLM ] --> 线性投影 --> 预测
```

问题在于：精度提升究竟来自中间那块 LLM，还是来自它前后的编码（patching、对齐、投影）。所以实验设计的核心是**只动 LLM 这一块、其余原样保留**。

论文围绕六个研究问题（RQ）展开：

RQ | 问题 | 对应实验
-- | -- | --
RQ1 | 预训练 LLM 对预测精度有贡献吗？ | 三种消融，13 个数据集
RQ2 | LLM 方法值得其计算代价吗？ | 参数量、训练时间、推理时间
RQ3 | 语言预训练本身有帮助吗？ | 随机初始化 / 是否微调的四种组合
RQ4 | LLM 能表示时序里的序列依赖吗？ | 打乱输入
RQ5 | LLM 对少样本预测有帮助吗？ | 只用 10% 训练数据
RQ6 | 性能到底来自哪里？ | 对编码器结构的探索（PAttn 等）

## 被检验的三种方法

论文称所选三种方法发表于 2023 年 12 月到 2024 年 5 月之间且较为流行，用 GPT-2 或 LLaMA 作基座，对齐与微调策略各不相同：

方法 | 基座模型 | LLM 中可学习的部分 | 位置编码
-- | -- | -- | --
OneFitsAll（GPT4TS） | GPT-2 | Add&Norm | 微调
Time-LLM | LLaMA | 无（冻结） | 冻结
CALF | GPT-2 | LoRA | 微调

论文对三者的描述（节选）：

- **OneFitsAll**：对输入做 instance norm 和 patching，经线性层得到 LLM 的输入表示；LLM 的多头注意力和前馈层冻结，位置编码和 LayerNorm 参与训练；最后用线性层把 LLM 最终隐状态映射成预测。
- **Time-LLM**：patching 之后，用多头注意力把 patch 表示与低维词嵌入对齐（reprogramming），再与描述统计特征的嵌入一起送入冻结的 LLM；输出表示展平后过线性层得到预测。
- **CALF**：把每个通道当作一个 token；"文本分支"用 cross attention 对齐到词嵌入，经冻结 LLM 得到"文本预测"；"时间分支"为 LLM 学 LoRA 并产出推理时使用的"时间预测"，两分支间有额外的相似性损失。

## 实验设计

### 三种消融

对每个方法，**LLM 之外的部分保持不变且可训练**，只做三种修改（论文 Figure 1）：

消融 | 做法
-- | --
`w/o LLM` | 去掉语言模型，输入 token 直接送入该方法的最后一层（输出投影）
`LLM2Attn` | 把语言模型换成**一个随机初始化的多头注意力层**
`LLM2Trsf` | 把语言模型换成**一个随机初始化的 Transformer block**

示意（OneFitsAll 为例，ASCII 示意图为本文所绘）：

```
w/ LLM    : encode -> [GPT-2 (预训练)] -> projection
w/o LLM   : encode ------------------------------> projection
LLM2Attn  : encode -> [1 层 MHA, 随机初始化] ----> projection
LLM2Trsf  : encode -> [1 个 Transformer block] -> projection
```

消融后参数量大幅下降（论文 Table 3 的 `#Parameters` 行）：

方法 | 原方法 | w/o LLM | LLM2Attn | LLM2Trsf
-- | -- | -- | -- | --
Time-LLM | 6651.82M | 0.55M | 0.55M | 0.66M
CALF | 180.25M | 8.17M | 10.5M | 13.68M
OneFitsAll | 91.36M | 9.38M | 10.71M | 13.54M

### 复现与公平性

作者尽量复现原论文条件：使用原仓库的超参数、运行环境、代码（模型结构、训练循环、数据加载），并在表里列出原论文的数字以对照。消融版因参数少，在部分情况下**调整了学习率或增大了 batch size**，其余训练细节与参考方法相同。Time-LLM（LLaMA-7B）在 NVIDIA A100 80GB 上跑，另两种（GPT-2）在 RTX A6000 48GB 上跑。

### 数据集与指标

- 参考方法用到的 8 个标准数据集：ETTh1、ETTh2、ETTm1、ETTm2（电力变压器，ETTh 为小时级、ETTm 为 15 分钟级）、Illness（周频）、Weather、Traffic、Electricity。ETT 的 train/val/test 切分为 60%/20%/20%，Illness、Weather、Electricity 为 70%/10%/20%。
- 另加 5 个参考方法没用过的数据集（以检验结论的普适性）：Exchange Rate、Covid Deaths、Taxi（30 分钟）、NN5（日频）、FRED-MD（论文引言称这五个来自 MONASH 等来源，其中 Exchange Rate、Taxi 在数据集说明里分别引用了 Lai 等与 Chronos 论文）。
- 预测长度：标准数据集沿用原论文设置（Illness 为 24/36/48/60，其他为 96/192/336/720）；Exchange Rate 为 96/192/336/720；Covid Deaths、Taxi、NN5、FRED-MD 按论文列举的顺序分别为 30、48、56、12（沿用 Chronos 的设置；附录置信区间表的行与此一一对应）。主表数字是对各预测长度取平均。
- 指标为 MAE 与 MSE，$D$ 为测试集元素，$c_i$、$\hat c_i$ 为真值与预测：

$$\mathrm{MAE}=\frac{1}{\lvert D\rvert}\sum_{i\in D}\lvert c_i-\hat c_i\rvert,\qquad \mathrm{MSE}=\frac{1}{\lvert D\rvert}\sum_{i\in D}(c_i-\hat c_i)^2$$

- 论文还给出各结果的 95% bootstrap 置信区间。

## 发现

### RQ1：LLM 对精度没有可见的贡献

13 个数据集 × 2 个指标共 26 个比较里，论文报告：消融版优于 Time-LLM 26/26 次，优于 CALF 22/26 次，优于 OneFitsAll 19/26 次。若不对预测长度取平均（13 数据集 × 4 个预测长度，按 MAE），消融版优于 Time-LLM、CALF、OneFitsAll 分别为 35/40、31/40、29/40 次。

下表摘自论文 Table 3（MAE，对各预测长度取平均），挑了 4 个数据集：

方法 / 数据集 | 原方法 | w/o LLM | LLM2Attn | LLM2Trsf
-- | -- | -- | -- | --
Time-LLM / ETTh1 | 0.432 | 0.419 | 0.437 | 0.439
Time-LLM / Illness | 0.894 | 0.924 | 0.849 | 0.837
Time-LLM / Electricity | 0.259 | 0.269 | 0.260 | 0.254
Time-LLM / Exchange Rate | 0.448 | 0.413 | 0.432 | 0.442
CALF / ETTh1 | 0.431 | 0.428 | 0.430 | 0.430
CALF / Illness | 0.869 | 0.861 | 0.892 | 0.860
CALF / Electricity | 0.266 | 0.262 | 0.264 | 0.261
CALF / Exchange Rate | 0.417 | 0.409 | 0.417 | 0.409
OneFitsAll / ETTh1 | 0.420 | 0.422 | 0.452 | 0.474
OneFitsAll / Illness | 0.852 | 0.924 | 0.829 | 0.850
OneFitsAll / Electricity | 0.262 | 0.254 | 0.250 | 0.245
OneFitsAll / Exchange Rate | 0.378 | 0.361 | 0.376 | 0.393

按 Table 3 的 `# Wins`（每个数据集每个指标在四个模型中取最优）：

方法 | 原方法 | w/o LLM | LLM2Attn | LLM2Trsf
-- | -- | -- | -- | --
Time-LLM | 0 | 12 | 2 | 12
CALF | 4 | 7 | 4 | 11
OneFitsAll | 7 | 11 | 3 | 5

[解读] 从上表也能看到并非"消融处处更好"：OneFitsAll 在 ETTh1 上原方法最优（论文 Figure 2 也指出这点，但与 `w/o LLM` 的 bootstrap 置信区间仍有大量重叠）；Illness 上 `w/o LLM` 在 Time-LLM、OneFitsAll 下反而更差。论文的论点是"LLM 没有**令人信服**的优势"，而不是"消融在每个格子都赢"。

### RQ2：计算代价

论文 Table 4（预测长度 96，总训练时间，单位分钟）：

数据集 | 方法 | 原方法 | w/o LLM | LLM2Attn | LLM2Trsf
-- | -- | -- | -- | -- | --
ETTh1 | Time-LLM | 181 | 0.99 | 1.41 | 0.84
ETTh1 | OneFitsAll | 7.36 | 0.27 | 0.70 | 0.64
ETTh1 | CALF | 3.28 | 0.35 | 0.37 | 0.40
Weather | Time-LLM | 3003 | 1.91 | 2.22 | 2.38
Weather | OneFitsAll | 152 | 16 | 21 | 24
Weather | CALF | 12 | 2.32 | 2.14 | 1.89

自拟算术：Weather 上 Time-LLM 对 `w/o LLM` 的训练时间比为 $3003/1.91\approx 1572$ 倍，约三个数量级，与论文摘要所说"最多约三个数量级"相符；ETTh1 上 $181/0.99\approx 183$ 倍。

推理时间（除以最大 batch size 估算每个样本的耗时）：论文称 Time-LLM、OneFitsAll、CALF 平均分别比修改后的模型慢 28.2、2.3、1.2 倍。论文 Figure 3 把推理时间与 MAE 画在一起，消融版（绿色）通常在左下方，即更快且误差更低。

### RQ3：语言预训练有帮助吗

以 CALF 为对象，比较四种组合（论文 Table 5，8 个数据集 × 2 指标）：

组合 | 含义 | 最优次数
-- | -- | --
Pre+FT | 预训练 + 微调（原方法，LoRA） | 3
woPre+FT | 随机初始化 + 训练 | 8
Pre+woFT | 预训练 + 冻结（不学 LoRA） | 5
woPre+woFT | 随机初始化 + 冻结，等价于一个随机投影 | 0

论文的解读：随机初始化并从头训练的 LLM 比预训练版更常最优，说明语言知识对预测帮助"非常有限"；而 Pre+woFT 赢 5 次、随机初始化+冻结赢 0 次，论文据此认为语言知识在微调过程中没有发挥有意义的作用。[解读] 这一推论较弱：冻结的预训练 LLM 优于冻结的随机 LLM，说明预训练权重作为固定变换并非全无作用；论文的重点是，一旦允许训练，随机初始化并不吃亏。

### RQ4：LLM 是否表示了序列依赖

思路：若模型真的学到了时间顺序，打乱输入应当显著伤害精度。论文做了三种打乱：`sf-all`（整段随机打乱）、`sf-half`（只打乱前半段）、`ex-half`（交换前后两半）；Table 6 里还有一列 `Masking`（表题称该表为 shuffling/masking 实验），主文未给出其定义 [待核实]。

结果（论文 Table 6，ETTh1 预测长度 96、Illness 预测长度 24，数值为性能下降比例，具体计算口径主文未写明 [待核实]）：LLM 方法并不比它们的消融版更怕打乱。例如 ETTh1 上 `sf-all`，Time-LLM 为 51.8%，`w/o LLM` 为 56.0%，LLM2Attn 为 53.8%，LLM2Trsf 为 50.3%。论文据此认为，LLM 并没有表现出独特的序列依赖表示能力。

### RQ5：少样本场景

只用 10% 的训练数据。Time-LLM 一组（论文 Table 7，其中 Time-LLM 的数字取自原论文，不是作者复现的）：表中 `# Wins` 为 LLaMA 8 次、`w/o LLM` 7 次、LLM2Attn 0 次、LLM2Trsf 1 次（正文与图注写的是 LLaMA 与 `w/o LLM` 各赢 8 次，与表中 7 不一致），论文称"没有差别"。CALF 一组（Table 8）：`w/o LLM` 赢 10 次，GPT-2 为 2 次，LLM2Attn 0 次，LLM2Trsf 2 次；论文称 14 个比较里有 12 个是去掉 LLM 的版本更好。

### RQ6：性能来自哪里

作者进一步探查编码器，提出一个极简结构 **PAttn**（Figure 4）：

```
输入 -> instance norm -> patching（通道独立）-> 线性投影 -> 单层 self-attention -> 线性投影 -> 预测
```

PAttn 与 PatchTST 的区别：**没有位置编码和前馈层**，Transformer encoder 被替换为单层注意力。此外还有 `LTrsf`（CALF 的编码器去掉跨模态注意力）以及它们加上分解（把序列分解成三条子序列分别预测再线性组合）的 `D-LTrsf`、`D-PAttn`。

论文结论：PAttn 在小数据集（时间戳数不到 100 万）上优于大多数其他编码方式，并与 LLM 方法相当；在 Traffic、Electricity 这类较大数据集上，`LTrsf` 更好。附录称：所有 LLM 方法加起来在"最优或次优"中出现 33 次，而 PAttn 单独出现 34 次。总体看，patching 起关键作用，基础的 Attention 和 Transformer block 也能有效编码。

## 局限

论文自述：

- 只在**预测**任务上评估；分类、问答等下游任务也应评估。
- 只覆盖**等间隔**时间序列，没有覆盖支付记录、线上购买这类不等间隔序列。
- 附录"社会影响"一节承认，大部分结果是实验性的，且限于所选数据集。

[经验] 读这篇论文时需要注意的边界：

- 只检验了三种"把 LLM 当骨干"的方法（GPT-2、LLaMA-7B 两种基座）。它不能直接推出"所有使用语言模型的时序方法都无用"，也没有评估零样本提示式方法或在时序数据上专门预训练的基础模型。
- 结果是"消融不比原方法差"，不是"消融显著更好"；若干格子里原方法仍然最优。
- 消融版在部分情况下调了学习率或 batch size，原方法用原超参；这种差别是否影响比较，需要读者自行评估。

## 与 GPT4TS、Time-LLM 原论文结论的关系

论文自己的叙述：先用原仓库代码复现了三种方法的结果（Table 3 中并列了"From Original Paper"一列供对照），再在此基础上做消融。因此其结论针对的是这些方法在**标准预测基准**上的表现；论文并没有否认 LLM 与时序在其他方向（时序推理、社会理解、金融推理等多模态应用）上的潜力，并建议未来把重点放在这些需要文本推理的任务上。

[经验] 综述 [时间序列总览](/0603_ML_Tasks_TimeSeries) 对本文的归纳是"借 LLM 做时序的骨干收益需要谨慎看待"，与论文口径一致。

## 使用方式：如何对自己的 LLM 时序方法做同样检验

示意代码，未运行验证。思路是在自己的模型里把 LLM 模块换成可配置的 backbone，保持其余部分不变：

```python
import torch.nn as nn

def make_backbone(kind, d_model, llm=None):
    if kind == "llm":        # 原方法
        return llm
    if kind == "none":       # w/o LLM
        return nn.Identity()
    if kind == "attn":       # LLM2Attn
        return AttnOnly(nn.MultiheadAttention(d_model, 8, batch_first=True))
    if kind == "trsf":       # LLM2Trsf
        return nn.TransformerEncoderLayer(d_model, 8, batch_first=True)
```

（`AttnOnly` 为需自行包装的小模块，使其接口与 Transformer block 一致。）实践建议 [经验]：每种消融都跑多个随机种子并报告置信区间；同时记录参数量、训练时间和每样本推理时间，并加一个 PAttn 式的小基线。

## Reference

- Mingtian Tan, Mike A. Merrill, Vinayak Gupta, Tim Althoff, Thomas Hartvigsen. *Are Language Models Actually Useful for Time Series Forecasting?* NeurIPS 2024. [arXiv:2406.16964](https://arxiv.org/abs/2406.16964)
- 论文附带的复现资源：[BennyTMT/LLMsForTimeSeries](https://github.com/BennyTMT/LLMsForTimeSeries)（论文脚注给出；论文称贡献以 MIT License 发布）

