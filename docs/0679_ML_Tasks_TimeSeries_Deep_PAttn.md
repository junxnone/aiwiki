---
Title | ML Tasks TimeSeries Deep PAttn
-- | --
Created @ | `2026-11-20T09:16:47Z`
Updated @| `2026-11-20T09:16:47Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/679)

---
# PAttn

PAttn（Patching + one-layer Attention）出自论文 *Are Language Models Actually Useful for Time Series Forecasting?*（Mike A. Merrill、Vinayak Gupta、Tim Althoff、Thomas Hartvigsen，NeurIPS 2024，arXiv:2406.16964，代码 BennyTMT/LLMsForTimeSeries）。严格说它不是一个"新模型"，而是该论文在回答"大语言模型（LLM）对时间序列预测到底有没有用"时，作为**极简对照编码器**提出的结构：**实例归一化 → 分块与投影 → 单层注意力 → 单层线性输出**，没有位置编码、没有前馈网络（FFN），却能达到与基于 LLM 的预测器相当的精度。

**一句话概括：PAttn = 实例归一化 + 分块投影 + 一层多头自注意力（块与块之间学习特征）+ 一个线性层预测头；它说明在现有基准上，LLM 并没有带来实质提升，起作用的主要是分块与注意力。**

> 标注约定：未标注的内容来自论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：分块思想的来源 [PatchTST](/0638_ML_Tasks_TimeSeries_Deep_PatchTST)；线性基线 [DLinear](/0630_ML_Tasks_TimeSeries_Deep_DLinear)；总览见 [深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)。

## 1. 解决什么问题

近期不少工作（OneFitsAll/GPT4TS、Time-LLM、CALF 等）把预训练 LLM（GPT-2、LLaMA）接到时间序列预测上，假设语言模型对文本序列依赖的建模能力可以迁移到时间序列。论文要检验这一假设：

- 去掉 LLM，或把它换成基础的注意力层，预测性能是否下降？
- 预训练是否有用？LLM 是否表示了时间序列的顺序依赖？在少样本下是否有帮助？
- 如果这些都不成立，那么性能到底来自哪里？

结论是：LLM 并没有显著改善预测，却带来数量级的额外算力；性能主要来自分块与注意力这类简单结构。PAttn 就是这个结论的"最小实现"。

## 2. 三种消融方法

论文对三个参考方法（OneFitsAll、Time-LLM、CALF）分别做三种修改，其余部分保持不变、仍可训练：

| 消融 | 做法 |
| --- | --- |
| w/o LLM | 完全去掉语言模型，把输入 token 直接送给参考方法的最后一层 |
| LLM2Attn | 把语言模型替换成一层随机初始化的多头注意力 |
| LLM2Trsf | 把语言模型替换成一个随机初始化的 Transformer 块 |

表中：

- 第一列是消融的名称，第二列是对参考方法的改动；
- 三个参考方法分别是：OneFitsAll（实例归一化 + 分块 + 线性嵌入，冻结 LLM 的注意力与前馈层、训练位置编码与 LayerNorm）、Time-LLM（分块后与词嵌入对齐，冻结 LLM）、CALF（每个通道作为一个 token，文本分支与时间分支双分支，带相似性损失）；
- 下图概括了原方法与三种消融的差别。

```
(a) 原方法 ：输入编码 ─► [ 预训练 LLM ] ─► 输出投影
(b) w/o LLM：输入编码 ───────────────────► 输出投影
(c) LLM2Attn：输入编码 ─► [ 1 层多头注意力 ] ─► 输出投影
(d) LLM2Trsf：输入编码 ─► [ 1 个 Transformer 块 ] ─► 输出投影
```

图中：

- 四行分别对应论文 Figure 1 的 (a)–(d)：(a) 是以 LLM 为基础模型的原方法（LLM 部分有的冻结，有的微调）；(b) 去掉 LLM；(c) 换成单层自注意力；(d) 换成简单 Transformer；
- "输入编码"与"输出投影"在各行中保持不变，只替换中间的 LLM 部分。

## 3. PAttn 结构

PAttn 来自论文第 5 节对常见编码技术（分块、分解、基础 Transformer 块）的比较：

```
输入时间序列
   │ 实例归一化 (instance norm)
   ▼
分块 (patching) + 线性投影 → 每块一个 token
   ▼
单层多头自注意力（块与块之间学习特征，无位置编码、无 FFN）
   ▼
展平 + 单个线性层 → 预测
```

图中：

- 实例归一化先对每条序列去均值/方差，缓解分布漂移；
- 分块把序列切成若干段并线性投影成 token，给注意力提供"局部信息"；
- 一层注意力在块与块之间建立依赖；
- 最后一个线性层把嵌入投影成预测长度的输出；
- 对于更大的数据集（如 Traffic、Electricity），论文改用 "LTrsf"（采用 CALF 的编码器）效果更好。

PAttn 的核心运算就是标准的缩放点积注意力：

$$
\mathrm{Attn}(Q,K,V)=\mathrm{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}}\right)V
$$

其中：

- $Q,K,V$：由分块后的 token 序列经线性映射得到的查询、键、值矩阵，每行对应一个块；
- $d_k$：键向量的维度，除以 $\sqrt{d_k}$ 避免点积过大使 softmax 饱和；
- softmax 按行归一化，得到每个块对其他块的注意力权重，输出是各块值向量的加权和。

具体的块长、步长、头数等超参数请以论文与代码为准 `[待核实]`。

## 4. 实验结论（RQ1–RQ6）

- **RQ1：预训练 LLM 有用吗？** 在 13 个数据集（8 个标准基准 + 5 个 Monash 数据集）、两个指标上，消融方法在 26 个设置中优于 Time-LLM 的 26/26、CALF 的 22/26、OneFitsAll 的 19/26；对所有预测长度，消融在 MAE 上分别优于 Time-LLM、CALF、OneFitsAll 的 35/40、31/40、29/40 种情形；LLM 占优的地方（如 OneFitsAll 的 ETTh1）其置信区间与 w/o LLM 也大量重叠；
- **RQ2：值得付出算力吗？** 简单消融把训练与推理时间最多降低三个数量级，性能相当；
- **RQ3：预训练有帮助吗？** 以 CALF 为例比较"预训练+微调""随机初始化+微调""预训练+不微调"：预训练语言知识对预测不是必要的；
- **RQ4：LLM 能表示时间序列的顺序依赖吗？** 对输入做三种打乱（全部打乱 sf-all、前半打乱 sf-half、前后半交换 ex-half），LLM 方法并不比其消融更脆弱，说明 LLM 没有独特的顺序建模能力；
- **RQ5：少样本有帮助吗？** 只用 10% 训练数据时，LLaMA 与去掉 LLM 的版本各胜 8 次；CALF 的消融甚至在少样本下表现更好；
- **RQ6：性能来自哪里？** 一个"分块 + 注意力"编码器配线性层即可达到与 LLM 相近的精度；在时间戳少于 100 万的小数据集上，PAttn 优于大多数其他编码方式，甚至与 LLM 方法相当；分块起关键作用，基础注意力与 Transformer 块也有助于编码。

## 5. 总结 [解读]

- 作者的态度并不是否定 LLM 在时间序列领域的价值，而是指出现有"把时间序列直接喂给 LLM 做预测"的方法在传统预测任务上没有发挥语言模型的推理能力；更值得探索的是时间序列推理、社会理解、金融推理等需要文本的多模态场景；
- 实用上，PAttn 可以作为轻量基线：参数少、速度快，评估新的 LLM 预测方法时应与之对比；
- 注意：PAttn 的结论建立在论文使用的基准与设置上，不同数据规模下最佳编码器会变化（如大数据集用 LTrsf）。

## Reference

- Merrill M A, Gupta V, Althoff T, Hartvigsen T. Are Language Models Actually Useful for Time Series Forecasting? NeurIPS 2024. arXiv:2406.16964
- Zhou T 等. One Fits All: Power General Time Series Analysis by Pretrained LM (OneFitsAll/GPT4TS). NeurIPS 2023.
- Jin M 等. Time-LLM: Time Series Forecasting by Reprogramming Large Language Models. ICLR 2024.
- Liu P 等. Taming Pre-trained LLMs for Generalised Time Series Forecasting via Cross-modal Knowledge Distillation (CALF). 2024.

