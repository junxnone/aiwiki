---
Title | ML Tasks TimeSeries Deep Pyraformer
-- | --
Created @ | `2026-11-20T09:22:57Z`
Updated @| `2026-11-20T09:22:57Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/684)

---
# Pyraformer

Pyraformer（Pyramidal Attention based Transformer）出自论文 *Pyraformer: Low-Complexity Pyramidal Attention for Long-Range Time Series Modeling and Forecasting*（Shizhan Liu、Hang Yu、Cong Liao、Jianguo Li、Weiyao Lin、Alex X. Liu、Schahram Dustdar，ICLR 2022，OpenReview id `0EXmFzUn5I`，代码 ant-research/Pyraformer）。它要解决长序列预测里的矛盾：**全连接自注意力能看到任意远的依赖，但复杂度是 $O(L^2)$；稀疏注意力降低了复杂度，却让两点间的信息传递路径变长**。Pyraformer 用一个**多分辨率的金字塔图**描述时间依赖，并据此构造"金字塔注意力"，兼顾低复杂度与短传递路径。

**一句话概括：先用卷积逐级压缩出粗尺度序列（构成 $C$ 叉树），再让每个节点只关注"同尺度的邻居 + 上一级父节点 + 下一级子节点"，实现在金字塔图上的稀疏自注意力，最后把各尺度的特征汇聚起来做预测。**

> 标注约定：未标注的内容来自官方 README 与 Time-Series-Library 的 Pyraformer 实现；`[解读]` 是对实现与论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能对照论文原文确认的内容。本文撰写时无法访问 OpenReview 全文，论文中的实验数字未收录。

本站相关：全连接注意力的 [Informer](/0635_ML_Tasks_TimeSeries_Deep_Informer)（稀疏化 ProbSparse）、[Autoformer](/0636_ML_Tasks_TimeSeries_Deep_Autoformer)、[FEDformer](/0637_ML_Tasks_TimeSeries_Deep_FEDformer)；同样用 LSH 降低注意力开销的 [Reformer](/0670_ML_Tasks_TimeSeries_Deep_Reformer)；同属多尺度思想的 [MSGNet](/0675_ML_Tasks_TimeSeries_Deep_MSGNet)、[TimeMixer](/0633_ML_Tasks_TimeSeries_Deep_TimeMixer)；总览见 [深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)。

## 1. 解决什么问题

- 长程依赖建模需要模型的**信号传递路径尽量短**；全连接注意力路径最短（1 步），但复杂度随序列长度平方增长；
- 一些稀疏/局部注意力能降低复杂度，但会让两个远距离节点之间的传递路径变长，削弱长程依赖；
- README 的核心观察：时间序列天然具有**多分辨率**结构——若把最细一层看作小时数据，更粗的层就相当于天、周、月的特征。长程依赖（如"月度依赖"）在粗尺度上只要连接相邻节点就能表达，图上的连边比只在最细尺度建模要节省得多。

## 2. 金字塔图与金字塔注意力

### 2.1 金字塔图

Pyraformer 用一张金字塔图 $G$ 描述依赖，边分两类：

- **尺度间（inter-scale）连接**：形成一棵 $C$ 叉树，每个父节点有 $C$ 个子节点，子节点是父节点所概括的一段细尺度节点；
- **尺度内（intra-scale）连接**：同一尺度上相邻节点相连，粗尺度上的这类连接用来表达长程相关。

金字塔注意力就是把"可以互相注意"的节点对限制为图上的边，用一个二值掩码实现：

$$
M_{ij}=\begin{cases}1,& \text{节点 } i,j \text{ 同尺度且相距} \le \lfloor A/2\rfloor\\ 1,& \text{一个是另一个的父节点（尺度间）}\\ 0,& \text{否则}\end{cases}
$$

其中：

- $M_{ij}$：注意力掩码，1 表示 $i$ 与 $j$ 之间允许交换信息，0 表示屏蔽；
- $A$：尺度内邻居窗口大小（Time-Series-Library 实现中的 `inner_size`，默认 5，即左右各看 $\lfloor A/2\rfloor=2$ 个邻居）；
- 尺度间的父子关系由下采样窗口大小 $C$（实现中的 `window_size`，如 [4,4]）决定；
- 该式依据 `get_mask` 的实现整理 `[解读]`：实现里尺度间连接是对称的（父看子，子也看父），且最粗一层的最后一个节点会连到该层剩余的所有子节点。

### 2.2 整体流程

下图概括 Pyraformer 的结构（对应 README 的 Figure 1）。

```
输入序列 (长度 L)
   │ 嵌入：值 + 位置 + 时间协变量
   ▼
粗尺度构造模块 CSCM：以步长 C 的卷积逐级下采样
   尺度 0：L 个节点（最细）
   尺度 1：L/C 个节点
   尺度 2：L/C² 个节点 ...
   ▼ 拼成总长为 Σ 各尺度节点数 的序列
金字塔注意力 PAM（多层，每层带前馈网络）：
   每个节点只关注 同尺度邻居 + 父节点 + 子节点
   ▼
特征汇聚：对最细尺度的每个节点，沿"祖先链"取各尺度对应节点并拼接
   ▼
预测模块：取最后一个位置的各尺度特征 → 线性层 → 一次输出整段预测
```

图中：

- **CSCM**（Coarser-Scale Construction Module）用卷积（实现里是带瓶颈结构的下采样卷积）生成各粗尺度节点，使金字塔结构得以形成；
- **PAM** 是编码器主体：把所有尺度的节点拼成一个序列，用上述掩码做自注意力；
- 汇聚步骤中，每个最细节点沿着树上的祖先索引（`refer_points`）把各尺度的特征取出并拼接，因此最终特征维度为 (尺度数 + 1) × $d_{model}$；
- 预测模块没有自回归解码器：取最后一个最细节点的拼接特征，用一个线性层直接映射到 $O\times C$ 的预测输出（长程预测）。

### 2.3 复杂度与路径长度

论文的核心理论性质是：在固定的超参数下，金字塔注意力的时间/空间复杂度随序列长度**线性**增长，同时任意两个节点之间的最大信号传递路径长度为 $O(1)$（$O(1)$ 是相对于序列长度 $L$ 的）；如果把尺度层数取为 $\log_C L$，则路径长度为 $O(\log_C L)$ `[待核实：具体表述与前提以论文定理为准]`。

直观理解 `[解读]`：每个节点参与的注意力对数固定（邻居 $A$ 个 + 1 个父 + $C$ 个子），所以总计算量与节点总数成正比；而远距离的两个细节点可以先上行到粗尺度、在粗尺度上经少数几步相连、再下行，路径不随 $L$ 增长。

## 3. 多任务使用

Time-Series-Library 实现中，同一个编码器可用于：长期预测与短期预测（短期预测先做均值方差归一化，窗口取 [2,2]）、填补与异常检测（对每个位置做线性投影）、分类（展平后接分类层）。

## 4. 实验

README 说明论文使用四个数据集：Electricity、Wind、ETT 与 App Flow，并给出单步预测（single step）与长程预测（long range）两套脚本；论文的具体指标请以原文为准 `[待核实]`。

## 5. 总结 [解读]

- Pyraformer 把"多分辨率"直接编码进注意力的图结构里：粗尺度承担长程、细尺度承担局部，复杂度与路径长度同时得到控制；
- 局限：金字塔的层数、下采样窗口 $C$ 与邻居窗口 $A$ 需要手工设置；原论文提供了 TVM 自定义 CUDA 核（PAM-TVM）以加速，而 Time-Series-Library 采用掩码实现的"朴素版"（PAM-Naive），因此其实现并不体现线性复杂度的速度优势。

## Reference

- Liu S, Yu H, Liao C, Li J, Lin W, Liu A X, Dustdar S. Pyraformer: Low-Complexity Pyramidal Attention for Long-Range Time Series Modeling and Forecasting. ICLR 2022. https://openreview.net/pdf?id=0EXmFzUn5I
- 官方代码：https://github.com/ant-research/Pyraformer
- Time-Series-Library 的 Pyraformer 实现：https://github.com/thuml/Time-Series-Library/blob/main/models/Pyraformer.py

