-----

| Title     | ML Tasks TimeSeries Deep TimeFilter                   |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-20T09:15:55Z`                                |
| Updated @ | `2026-11-20T09:16:13Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/678) |

-----

# TimeFilter

TimeFilter 出自论文 *TimeFilter: Patch-Specific Spatial-Temporal Graph
Filtration for Time Series Forecasting*（Yifan Hu、Guibin Zhang、Peiyuan
Liu 等，ICML 2025，arXiv:2501.13041，代码
TROUBADOUR000/TimeFilter）。它是一个基于图神经网络（GNN）的多变量预测框架：**先把"通道
× 时间块"构成时空图，再针对每个时间块过滤掉无关的依赖，只保留最关键的那些**，以此实现自适应、细粒度的依赖建模。论文在 13
个真实数据集上取得 SOTA。

**一句话概括：把序列切成不重叠的块，每个（通道，时间块）作为图节点，用 k-NN
构图；对每个节点的"自我图"用带动态路由的混合专家（时间/空间/时空三种过滤器）筛选边，再用
GNN 聚合并线性投影得到预测。**

> 标注约定：未标注的内容来自论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：同属图方法的
[MSGNet](/0675_ML_Tasks_TimeSeries_Deep_MSGNet)；通道独立与通道依赖路线的代表
[PatchTST](/0638_ML_Tasks_TimeSeries_Deep_PatchTST)、[iTransformer](/0639_ML_Tasks_TimeSeries_Deep_iTransformer)；总览见
[深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)。

## 1\. 解决什么问题

论文先梳理了处理多变量依赖的几种策略：

  - **通道独立（CI）**：各通道单独建模，忽略了协变量之间的关系；
  - **通道依赖（CD）**：不加区分地建模所有依赖，引入噪声、降低泛化能力；
  - **通道聚类（CC）**：把相似通道分组再分别建模，但粗粒度的聚类难以刻画复杂且随时间变化的交互。

TimeFilter
的思路是：不按通道粗分，而是对每个时间块**细粒度、自适应**地决定该用哪种依赖（时间依赖、空间依赖或时空依赖），并过滤掉无关的关系。

## 2\. 问题定义与图的符号

设输入多变量序列与预测目标为：

$$ X={x\_1,\\dots,x\_C}\\in\\mathbb R^{C\\times L},\\qquad Y={\\hat
y\_1,\\dots,\\hat y\_C}\\in\\mathbb R^{C\\times T} $$

其中：

  - $C$：通道数；$L$：回看长度；$T$：预测长度；
  - $x\_i\\in\\mathbb R^{L}$：第 $i$ 个通道的序列。

时空图 $G={V,E}$ 的依赖矩阵 $M\\in\\mathbb R^{n\\times n}$ 即邻接矩阵，其中：

  - $n=C\\times N$：节点数，$N$ 是回看序列的块数；
  - $M\[i,j\]$：边 $e\_{ij}$ 的权重；
  - 把 $G$ 分解为 $n$ 个以每个块为中心的**自我图** $G\_i$，每个自我图再分成三类子图：**空间子图**
    $G\_i^S$（同一时间块、不同通道）、**时间子图** $G\_i^T$（同一通道、不同时间块）、**时空子图**
    $G\_i^{ST}$（不同通道、不同时间块）；各子图的邻接矩阵都是对 $M$ 加掩码得到。

## 3\. 模型结构

### 3.1 整体流程

下图概括 TimeFilter 的三个核心模块。

    输入 X ∈ R^{C×L}
       ▼
    (i) 时空图构建 Spatial-Temporal Construction
        切成不重叠的块 → 嵌入 → 展平成 n=C×N 个节点
        多头点积距离 → k-NN → 邻接矩阵 M
       ▼
    (ii) 分块过滤 Patch-Specific Filtration
        对每个节点的自我图 G_i：
          路由网络（带噪声门控）→ 动态专家分配（Top-p）→ 选出过滤器
          过滤器：Temporal / Spatial / Spa.-tem.   → 稀疏图 G'_i
       ▼
    (iii) 自适应图学习 Adaptive Graph Learning
        还原为全局图 → GNN 聚合邻居 → 残差 + 时间维线性投影
       ▼
    预测 Y ∈ R^{C×T}

图中：

  - (i) 负责从输入构建稠密的时空图；
  - (ii) 是核心，对每个块（节点）单独决定保留哪类依赖边，其余边被滤除；
  - (iii) 在过滤后的稀疏图上做 GNN 消息传递并得到预测；
  - 关键点：过滤是"分块特异"的，不同块可以选用不同类型的依赖。

### 3.2 时空图构建

先把每个通道按块长 $P$ 切成 $N=\\lceil L/P\\rceil$ 个不重叠的块，用可训练线性层把每块嵌入到 $D$ 维，得到
$X\_p\\in\\mathbb R^{C\\times N\\times D}$，再展平前两维得到 $n=C\\times N$ 个时空块
$X\_p\\in\\mathbb R^{n\\times D}$。

然后以多头方式计算块与块的相似度（点积投影距离）：把 $X\_p$ 按特征维分成 $H$ 个头 $X\_h\\in\\mathbb
R^{H\\times n\\times \\frac DH}$，每个头内部做点积得到距离/相似度矩阵；再用 k-NN 为每个节点保留 $k$
个邻居：

$$ k=\\lceil \\alpha\\cdot n\\rceil,\\qquad M\[i,j\]\\neq 0 \\
\\text{当且仅当}\\ v\_j\\in \\mathrm{kNN}(v\_i) $$

其中：

  - $H$：头数；$D$：嵌入维度；
  - $\\alpha$：手工调节的缩放系数，决定每个节点保留的邻居比例；论文原文写作 $k=\\alpha\\cdot n$ 形式，取整方式
    `[待核实]`；
  - $M$：由 k-NN 得到的邻接矩阵；多头分别构图的细节以论文为准 `[待核实]`。

### 3.3 分块过滤（Patch-Specific Filtration）

对每个自我图 $G\_i$，设计三个"过滤器"（专家），分别保留一类依赖：

| 过滤器              | 保留的边                               | 适用场景举例（论文）       |
| ---------------- | ---------------------------------- | ---------------- |
| Temporal Filter  | 时间边 $E^T$（同一通道跨块）                  | 通道间相关性低的数据，如用户行为 |
| Spatial Filter   | 空间边 $E^S$（同一时间块跨通道）                | 实时监控中多变量的同步关系    |
| Spa.-tem. Filter | 其余的时空边 $E\\setminus(E^S\\cup E^T)$ | 交通流等随位置与时间演化的场景  |

表中：

  - 第一列是过滤器名称，第二列是它保留的边集合，第三列是论文给出的适用场景；
  - 过滤的数学形式是对邻接矩阵的条件分布 $M'\_i\\sim p(M\_i\\mid
    G\_i^{\\cdot})$：保留所选区域的边，其余置零；
  - 不同领域的数据需要不同类型的依赖，所以由路由网络按块来选择。

**路由网络（带噪声门控）**：沿用稀疏门控 MoE 的思路，对每个自我图计算各过滤器的置信度：

$$
r(G\_i)=\\mathrm{Softmax}\\Big(\\mathrm{Linear}\_g\\big(\\phi(M\_i)\\big)+\\epsilon\\cdot\\mathrm{Softplus}\\big(\\mathrm{Linear}\_n\\big(\\phi(M\_i)\\big)\\big)\\Big)\\in\\mathbb
R^{m} $$

其中：

  - $\\phi(M\_i)$：对该块依赖信息的编码（论文中记为 $(M)$）；
  - $\\mathrm{Linear}\_g$、$\\mathrm{Linear}\_n$：分别生成干净得分与噪声幅度的线性映射；
  - $\\epsilon\\sim\\mathcal N(0,1)$：标准高斯噪声，用于鼓励探索与负载均衡；
  - $m=3$：过滤器个数；$r(G\_i)$：该块对三个过滤器的置信度。
  - 这里 Softmax/Softplus 的具体形式是按"噪声门控"的通用写法补全的 `[解读]`，以论文公式为准。

**动态专家分配（Dynamic Expert Allocation）**：经典 Top-K
路由给每个输入分配固定数量的专家，忽略了不同块所需依赖数量不同——例如股票存在明显"领先-滞后"时需要时间与时空两种依赖，突发事件时则更需要同板块股票的空间依赖。TimeFilter
改用 Top-p：把置信度从大到小排序得到索引 $I$，选取累计概率首次超过阈值 Top-p 的最小过滤器集合：

$$ q(G\_i)=\\min\\Big{q:\\ \\sum\_{j=1}^{q} r(G\_i)*{I\_j}\\ \\ge\\
p\\Big},\\qquad
S\_i={\\mathrm{Filter}*{I\_1},\\dots,\\mathrm{Filter}*{I*{q(G\_i)}}} $$

其中：

  - $p$：Top-p 阈值（实验在 ${0.0,0.5}$ 中选）；
  - $q(G\_i)$：该块选中的过滤器个数，随块而变；
  - $S\_i$：被选中的过滤器集合；输出的路由权重 $g(G\_i)\_j=r(G\_i)\_j$（当
    $\\mathrm{Filter}\_j\\in S\_i$），其余为 0。

**过滤（Filtration）**：根据 $g(G\_i)$ 对 $M\_i$ 做过滤，得到稀疏邻接矩阵 $M'\_i$ 与边集
$E'\_i$；例如 $S\_i={\\text{Temporal},\\text{Spa.-tem.}}$ 时，保留时间边与时空边。论文指出
$n$ 个自我图的过滤可并行进行，不增加额外复杂度。

### 3.4 自适应图学习

过滤后把 $n$ 个自我图的稀疏邻接 $M'\_i$ 还原回全局图。GNN 在其上逐层聚合：

$$ h\_i^{(l)}=\\mathrm{COMB}\\Big(h\_i^{(l-1)},\\
\\mathrm{AGGR}\\big{h\_j^{(l-1)}:v\_j\\in\\mathcal
N(v\_i)\\big}\\Big),\\qquad h\_i^{(0)}=X\_h $$

其中：

  - $l=1,\\dots,O$：GNN 层，$O$ 为总层数；
  - $h\_i^{(l)}$：节点 $v\_i$ 在第 $l$ 层的嵌入，初始 $h\_i^{(0)}=X\_h$；
  - $\\mathcal N(v\_i)$：节点 $v\_i$ 在过滤后图中的邻居集合；
  - $\\mathrm{AGGR}$：聚合邻域信息，TimeFilter
    中是**加和**（把邻居特征求和）；$\\mathrm{COMB}$：把自身表示与邻居聚合结果合并。

最后通过一个残差模块和时间维上的线性投影得到预测 $Y$。

### 3.5 损失函数

总损失由三部分组成：

  - **预测损失**：预测值与真值之间的均方误差 MSE；
  - **动态损失 $\\mathcal L\_{dyn}$**：沿用动态路由（Huang 等
    2024），避免对所有专家都给出低置信度，从而保证会激活足够多的专家；
  - **专家重要性损失 $\\mathcal L\_{imp}$**（Shazeer 等
    2017）：用重要性的变异程度（标准差/均值，加小常数
    $\\epsilon$ 防止数值不稳）约束，避免模型退化到总是只选同一组专家的平凡解。

三者加权相加得到最终损失，具体权重与公式见论文 `[待核实]`。

## 4\. 实验与结论

  - **数据集**：长期预测 9
    个（ETTh1/h2/m1/m2、Traffic、Electricity、Weather、Solar-Energy、Climate，其中
    Climate 有 1763 个通道），短期预测 4 个（PEMS03/04/07/08）；
  - **基线**：GNN 类（MSGNet、CrossGNN）、Transformer
    类（CATS、iTransformer、PatchTST、Crossformer、FEDformer）、线性类（Leddam、SOFTS、DUET、DLinear、TiDE）、CNN
    类（ModernTCN、TimesNet、SCINet）以及通道聚类插件 CCM；
  - **长期预测**（回看 96，预测 96/192/336/720）：相对第二名 Leddam，MSE 降低 4.48%、MAE 降低
    2.23%，Wilcoxon 检验 $p=4.66\\times10^{-10}$；
  - **搜索最优回看长度**（4 个较大数据集）：相比通道聚类方法 DUET 与 CCM，MSE/MAE 分别再降 5.34%/1.40%
    与 6.89%/3.69%；
  - **短期预测**（PEMS，预测 12/24/48）：四个数据集上均优于其他方法；在 PEMS08 上相对第二名
    DUET，MSE/MAE 降低 13.54%/3.13%；
  - **消融（Table 4 / Table 11）**：
      - 另设计了六种过滤方式对比（Top-K、Random-K、RegionTop-K、RegionThre、C-Filter、不过滤），TimeFilter
        均更优；论文据此认为"权重大的关系"可能只是伪回归，而不是有效依赖，且不同领域需要不同类型的依赖；
      - MoE 消融：把动态路由换成静态路由（只选最显著的一个过滤器），或去掉 $\\mathcal L\_{imp}$ 与
        $\\mathcal L\_{dyn}$，性能都会下降。

## 5\. 总结 \[解读\]

  - TimeFilter 把"通道依赖是否有用"的问题细化为"每个时间块应该用哪种依赖"，用 MoE 路由 + 图过滤去噪；
  - 局限：需要构建 $n=C\\times N$ 个节点的图，通道数很大时开销较高（Climate 数据集有 1763
    个通道）`[解读]`；数值与超参请以论文与代码为准。

## Reference

  - Hu Y, Zhang G, Liu P, Lan D, Li N, Cheng D, Dai T, Xia S-T, Pan S.
    TimeFilter: Patch-Specific Spatial-Temporal Graph Filtration for
    Time Series Forecasting. ICML 2025. arXiv:2501.13041
  - Shazeer N 等. Outrageously Large Neural Networks: The Sparsely-Gated
    Mixture-of-Experts Layer. ICLR 2017.
  - Huang Q 等. Harder Tasks Need More Experts: Dynamic Routing in MoE
    Models. 2024.
