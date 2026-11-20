---
Title | ML Tasks TimeSeries Deep Crossformer
-- | --
Created @ | `2026-11-20T09:23:52Z`
Updated @| `2026-11-20T09:23:52Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/685)

---
# Crossformer

Crossformer 出自论文 *Crossformer: Transformer Utilizing Cross-Dimension Dependency for Multivariate Time Series Forecasting*（Yunhao Zhang、Junchi Yan，ICLR 2023，OpenReview id `vSVLM2j9eie`，代码 Thinklab-SJTU/Crossformer）。此前的 Transformer 预测模型（Informer、Autoformer 等）大多把同一时刻所有变量的值**嵌入成一个向量**，注意力只发生在时间维上，**变量之间的依赖没有被显式建模**。Crossformer 的思路是：**把每个变量的序列切成片段（segment），每个片段嵌入成一个向量，排成 "变量 × 片段" 的二维阵列；再用"两阶段注意力"先沿时间、再沿变量建模依赖；并用分层的编码器-解码器，把多尺度信息一起用于预测。**

**一句话概括：维度-片段嵌入（DSW）+ 两阶段注意力（TSA：跨时间阶段 + 带路由器的跨维度阶段）+ 逐层合并片段的分层编码器 + 每层各出一份预测并相加的分层解码器。**

> 标注约定：未标注的内容来自 Time-Series-Library 的 Crossformer 实现与论文公开的核心设计；`[解读]` 是对实现与论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能对照论文原文确认的内容。本文撰写时无法访问 OpenReview 全文，论文中的实验数字未收录。

本站相关：同样"分块 + 注意力"的 [PatchTST](/0638_ML_Tasks_TimeSeries_Deep_PatchTST)（通道独立）、通道维做注意力的 [iTransformer](/0639_ML_Tasks_TimeSeries_Deep_iTransformer)；基线对比的 [Informer](/0635_ML_Tasks_TimeSeries_Deep_Informer)、[Autoformer](/0636_ML_Tasks_TimeSeries_Deep_Autoformer)；多变量依赖的图方法 [TimeFilter](/0678_ML_Tasks_TimeSeries_Deep_TimeFilter)；总览见 [深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)。

## 1. 解决什么问题

- 多变量预测中，**时间依赖**（单个变量随时间的变化）与**跨维度依赖**（不同变量之间的关联）同样重要；
- 以往 Transformer 把多变量在每个时间点嵌入成一个 token，只在时间轴上做注意力，等于把跨维度依赖交给嵌入层"一次性混合"，没有显式建模；
- 直接在"变量 × 时间"全部 token 上做全连接注意力，代价过高；因此需要一种能兼顾两种依赖又节省开销的注意力。

## 2. 模型结构

### 2.1 整体流程

下图概括 Crossformer 的结构。

```
输入 X ∈ R^{L×D}（L 个时间步，D 个变量）
   │ 维度-片段嵌入 DSW：每个变量按长度 L_seg 切段，各段线性嵌入 + 位置嵌入 + LayerNorm
   ▼
二维阵列 H^0 ∈ R^{D × (L/L_seg) × d_model}
   ▼
分层编码器：第 l 层 = [片段合并 SegMerging（相邻 win 个片段合并，l>0 时）→ 两阶段注意力 TSA]
   → 得到各层表示 H^0, H^1, ..., H^N （片段数逐层减少）
   ▼
分层解码器：可学习的解码位置嵌入作输入
   第 l 层 = [TSA → 对第 l 层编码输出做交叉注意力 → MLP] → 线性层给出该层的预测片段
   ▼
把各层的预测相加 = 最终预测 ∈ R^{H×D}
```

图中：

- $L$ 是输入长度，$D$ 是变量数，$L_{seg}$ 是片段长度（Time-Series-Library 实现取 12），$d_{model}$ 是隐层维度；
- DSW 之后每个"变量—片段"位置是一个 token，整个输入变成 $D\times\frac{L}{L_{seg}}$ 的二维阵列；
- 编码器逐层把相邻片段合并（实现里 `win_size=2`），因此越往上片段越少、时间尺度越粗，形成多尺度表示；
- 解码器每一层都"看"对应尺度的编码输出，并各自输出一份预测，最后相加。

### 2.2 维度-片段嵌入（DSW）

对每个变量 $d$ 的序列，把它切成长度为 $L_{seg}$ 的互不重叠的片段，每个片段经线性层得到一个嵌入，再加上可学习的位置嵌入：

$$
h_{i,d}=E\,x^{(d)}_{(i-1)L_{seg}+1:\,iL_{seg}}+E^{pos}_{i,d}
$$

其中：

- $x^{(d)}_{a:b}$：变量 $d$ 在第 $a$ 到第 $b$ 个时间步的取值，这里取第 $i$ 段（长度 $L_{seg}$）；
- $E\in\mathbb R^{d_{model}\times L_{seg}}$：所有片段共享的线性嵌入矩阵；
- $E^{pos}_{i,d}$：位置嵌入，对每个（变量、片段）位置各有一个可学习向量（实现中形状为 $D\times\frac{L}{L_{seg}}\times d_{model}$）；
- $h_{i,d}\in\mathbb R^{d_{model}}$：第 $d$ 个变量、第 $i$ 个片段的 token；输入长度不能被 $L_{seg}$ 整除时先在前面补零。

### 2.3 两阶段注意力（TSA）

TSA 的输入与输出形状都是 $[B,\ D,\ \text{seg\_num},\ d_{model}]$，分两个阶段：

**阶段一：跨时间（Cross-Time）。** 把每个变量看成独立序列，对其片段做标准多头自注意力，再接残差、LayerNorm 与前馈网络：

$$
\hat Z^{time}_{:,d}=\mathrm{LN}\big(Z_{:,d}+\mathrm{MSA}(Z_{:,d},Z_{:,d},Z_{:,d})\big),\qquad Z^{time}_{:,d}=\mathrm{LN}\big(\hat Z^{time}_{:,d}+\mathrm{MLP}(\hat Z^{time}_{:,d})\big)
$$

其中：

- $Z_{:,d}$：变量 $d$ 的所有片段 token；$\mathrm{MSA}$：多头自注意力；$\mathrm{LN}$：LayerNorm；$\mathrm{MLP}$：两层前馈（GELU）；
- 该阶段只在同一变量内部的不同时间片段间交换信息，对应 $D$ 个独立序列的时间依赖建模。

**阶段二：跨维度（Cross-Dimension）。** 在每个片段位置上，让 $D$ 个变量互相交流。若直接做 $D$ 个 token 的全连接注意力，代价为 $O(D^2)$。Crossformer 引入一小组**可学习的路由器向量（router）**作为中介，分两步完成"收集—分发"：

$$
B_i=\mathrm{MSA}_1\big(R_i,\ Z^{time}_{i,:},\ Z^{time}_{i,:}\big),\qquad \bar Z_{i,:}=\mathrm{MSA}_2\big(Z^{time}_{i,:},\ B_i,\ B_i\big)
$$

其中：

- $i$：片段位置；$Z^{time}_{i,:}\in\mathbb R^{D\times d_{model}}$：该位置上全部 $D$ 个变量的 token；
- $R_i\in\mathbb R^{c\times d_{model}}$：位置 $i$ 的路由器，$c$ 是路由器个数（实现里的 `factor`，远小于 $D$）；每个片段位置有各自的一组路由器；
- 第一步 $\mathrm{MSA}_1$（"sender"）：路由器作 query，$D$ 个变量作 key/value，**把全部变量的信息聚合进 $c$ 个缓冲向量 $B_i$**；
- 第二步 $\mathrm{MSA}_2$（"receiver"）：变量作 query，缓冲向量 $B_i$ 作 key/value，**把聚合后的信息分发回每个变量**；
- 之后同样接残差、LayerNorm、前馈网络，得到 TSA 的输出。

复杂度 `[解读]`：全连接跨维注意力每个片段位置是 $O(D^2)$；用 $c$ 个路由器后变为 $O(cD)$，当 $c$ 为常数时随 $D$ 线性增长。跨时间阶段每个变量是 $O(L_{seg\text{-}num}^2)$（片段数的平方，而不是时间步数的平方）。

### 2.4 分层编码器与解码器

**编码器**由多个 scale block 组成：除第一层外，每个 block 先做**片段合并（SegMerging）**——把相邻 $win$ 个片段的 token 沿特征维拼接，经 LayerNorm 与线性层压回 $d_{model}$：

$$
H^{l}=\mathrm{TSA}\Big(\mathrm{Linear}\big(\mathrm{LN}([\,h_{2j-1}\,\|\,h_{2j}\,])\big)\Big)\quad(win=2)
$$

其中：

- $h_{2j-1},h_{2j}$：上一层相邻的两个片段 token，$\|$ 表示在特征维拼接（拼接后维度 $win\times d_{model}$）；
- $\mathrm{Linear}$：把拼接结果映射回 $d_{model}$；片段数不是 $win$ 的倍数时，复制末尾片段补齐；
- 每层片段数约减半，所以高层看到的是更粗时间尺度上的依赖。

**解码器**的输入是可学习的"解码位置嵌入"（片段数对应预测长度除以 $L_{seg}$）。每一层依次做：TSA（建模解码位置间的依赖）→ 对**对应层**编码输出的交叉注意力 → 残差、LayerNorm 与 MLP，然后用线性层把每个 token 还原成一个长度 $L_{seg}$ 的预测片段。**所有层的预测片段逐元素相加**得到最终预测：

$$
\hat Y=\sum_{l=0}^{N}\hat Y^{(l)}
$$

其中：$\hat Y^{(l)}$ 是第 $l$ 个解码层输出的预测（实现里解码层数为编码器层数 + 1，与编码阶段的 $N+1$ 份表示一一对应）；不同层对应不同时间尺度，相加即融合多尺度信息。

## 3. 组件汇总

| 组件 | 作用 | 解决的问题 |
| --- | --- | --- |
| DSW 嵌入 | 以（变量、片段）为 token | 保留变量的独立性，缩短序列 |
| TSA 跨时间阶段 | 每个变量内的片段间注意力 | 时间依赖 |
| TSA 跨维度阶段（router） | 用 $c$ 个路由器收集再分发 | 跨变量依赖，同时节省 $O(D^2)$ 开销 |
| SegMerging | 逐层合并相邻片段 | 多尺度表示 |
| 分层解码器 | 每层出预测并相加 | 融合多尺度信息 |

表中：

- 第一列是组件，第二列是其操作，第三列是它针对的问题；
- 与 PatchTST 对比 `[解读]`：二者都"分块"，但 PatchTST 是通道独立（不同变量互不通信），Crossformer 通过跨维度阶段显式建模变量间依赖。

## 4. 实验与结论

论文在多个多变量基准（如 ETT、Weather、Electricity、Traffic 等）上与 LSTMa、LSTnet、MTGNN、Informer、Autoformer、Pyraformer、FEDformer 等对比，并报告了超过基线的效果；具体数字、消融与超参数敏感性请以原文为准 `[待核实]`。

## 5. 总结 [解读]

- Crossformer 是较早明确同时建模"时间依赖 + 变量间依赖"的 Transformer 预测模型，router 机制把跨维注意力的代价压到线性；
- 局限：嵌入的位置参数随变量数 $D$ 与片段数增长；之后的研究（如 PatchTST）表明在不少基准上通道独立的简单模型也很强，是否需要跨维度建模取决于数据，Crossformer 的优势主要体现在变量相关性强的数据上。

## Reference

- Zhang Y, Yan J. Crossformer: Transformer Utilizing Cross-Dimension Dependency for Multivariate Time Series Forecasting. ICLR 2023. https://openreview.net/pdf?id=vSVLM2j9eie
- 官方代码：https://github.com/Thinklab-SJTU/Crossformer
- Time-Series-Library 的 Crossformer 实现：https://github.com/thuml/Time-Series-Library/blob/main/models/Crossformer.py

