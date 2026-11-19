-----

| Title     | ML Tasks TimeSeries Deep TimeXer                      |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-19T02:00:04Z`                                |
| Updated @ | `2026-11-19T06:20:39Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/640) |

-----

# TimeXer

TimeXer（Time Series Transformer with eXogenous variables）出自清华大学软件学院 /
BNRist（Yuxuan Wang、Haixu Wu、Mingsheng Long 等），发表于 NeurIPS
2024（arXiv:2402.19072）。它面向一种比"单变量 /
多变量预测"更贴近实际的设定：**带外生变量的预测**（forecasting
with exogenous variables）。要预测的目标叫内生变量，辅助它的外部序列叫外生变量，外生变量只提供信息、不需要被预测。

一句话概括：内生序列切成 patch token 并附加一个可学习的**全局 token**；每条外生序列整体压成一个**变量级
token**；全局 token 作 query 通过 cross-attention 从外生 token 取信息，再通过
self-attention 把外部信息传给各个内生 patch。论文强调整个模型使用标准 Transformer
组件，没有修改任何结构，只是重新设计了嵌入方式和注意力的"分工"。

本文属于 [时间序列深度模型](/0606_ML_Tasks_TimeSeries_Deep) 中 Transformer 路线的一员，总览见
[时间序列总览](/0603_ML_Tasks_TimeSeries)。综述中对它的简述是"把外生变量与内生序列分别处理，用于带外生变量的预测"，与论文一致。需要注意：综述在"协变量"一节把
TimeXer 与能吃已知未来协变量的模型并列；就论文而言，主方法只输入外生变量的历史窗口，未来值只在附录定性案例中出现（见"训练与推理"）。

## 解决什么问题

### 内生变量、外生变量与任务设定

  - **内生变量（endogenous）**：预测目标本身，例如某个电力市场的日前电价。
  - **外生变量（exogenous）**：对目标有影响、但不需要预测的协变量，例如电网负荷预测、风电 /
    光伏发电预测。论文说明任何对内生预测有用的序列都可以作外生变量，不要求回看长度相同。
  - 论文的出发点：现实系统往往只被部分观测，只盯着目标的历史不足以保证准确；论文引言用电价举例，认为电价高度依赖市场供需，仅凭历史价格从本质上无法预测未来价格。

形式化（论文 Eq.1）：内生序列 $x\_{1:T}\\in\\mathbb R^{T\\times 1}$，$C$ 条外生序列
$z\_{1:T\_{ex}}\\in\\mathbb R^{T\_{ex}\\times C}$，目标是预测未来 $S$ 步：

$$ x\_{T+1:T+S}=F\_\\theta\\left(x\_{1:T},,z\_{1:T\_{ex}}\\right) $$

论文强调任何有用序列都可作外生变量，不论回看长度，因此设定取最灵活的 $T\_{ex}\\neq T$（回看窗口长度可以不同）。

### EPF 电价预测数据集

论文的主要实验是短期电价预测（EPF，来自 Lago 等人 2021
年的基准）。五个电力市场各有约六年的小时数据，每个数据集的内生变量是电价，外生变量是两条实际中有影响的序列：

| 数据集 | 市场              | 外生变量（论文附录 A.1）                                 |
| --- | --------------- | ---------------------------------------------- |
| NP  | Nord Pool       | 电网负荷、风电预测                                      |
| PJM | 美国宾夕法尼亚-新泽西-马里兰 | 系统负荷、COMED 区域负荷预测                              |
| BE  | 比利时             | 比利时负荷预测、法国发电预测                                 |
| FR  | 法国              | 负荷与发电预测                                        |
| DE  | 德国              | Amprion 区域负荷，以及风电（附录文字还提到太阳能发电预测，与表 6 的描述略不一致） |

协议沿用 NBEATSx：输入 168 小时（一周）、预测 24 小时（一天），数据为小时频率。

### 现有做法的三个困难（论文引言）

1.  外生变量可能很多，把它们与内生变量一视同仁（如 iTransformer 把所有变量放进同一个
    self-attention）会带来时间和显存开销，并引入"内生到外生"的不必要交互。
2.  外部因素可能对内生序列有因果影响，存在时间滞后，模型要能处理。
3.  现实中的外生序列常常不规整：缺失值、时间错位、采样频率不同、长度不同。以往做法是在每个时间点把外生特征与内生特征拼接再映射到隐空间，必须按时间对齐。

## 核心思想与结构

TimeXer 的关键是"不同角色用不同粒度的表示"：内生变量是要预测的，需要细粒度的时间建模，所以用 patch
token；外生变量只提供外部信息，用整条序列的变量级 token
就够了，这样对缺失、错位、不同频率天然更宽容。论文称 patch
级表示对外生变量"过于细粒度，带来计算复杂度和噪声"。

``` 
 内生序列 x (T点) ──切 patch──► [p1 p2 ... pN] + [G]      N+1 个 token
                                    │  self-attention ((N+1)x(N+1))
                                    ▼
 外生序列 z(1..C) ──每条整体线性映射──► [v1 v2 ... vC]    C 个变量 token
                                    │
                    G 作 query，V 作 key/value：cross-attention (1 x C)
                                    ▼
                                  FFN  ──► 重复 L 个 block ──► 线性投影 ──► 预测
```

### 内生嵌入

$$ \\begin{aligned} {s\_1,\\dots,s\_N} &= \\mathrm{Patchify}(x) &&
\\text{非重叠 patch，长度 } P,\\ N=\\lfloor T/P\\rfloor\\ P\_{en} &=
\\mathrm{PatchEmbed}(s\_1,\\dots,s\_N) && \\text{线性投影到 } D \\text{ 维 +
位置嵌入}\\ G\_{en} &= \\mathrm{Learnable}(x) && \\text{1 个可学习全局 token}
\\end{aligned} $$

送入 Transformer 的内生 token 共 $N+1$ 个。论文做了"重叠 patch"消融（PatchTST 风格，patch
24、步长 12），EPF 平均 MSE/MAE 由 0.307/0.265 变为 0.316/0.269，因此采用非重叠 patch。

### 外生嵌入

$$ V\_{ex,i}=\\mathrm{VariateEmbed}\\left(z^{(i)}\\right),\\quad
i=1,\\dots,C $$

其中 $\\mathrm{VariateEmbed}$ 是 $\\mathbb R^{T\_{ex}}\\to\\mathbb R^{D}$
的线性层。每条外生序列整条映射成一个 $D$ 维 token，得到 $C$ 个变量 token，不做 patch。

### 全局 token 的作用

内生 token 是 patch 级（局部时间片段），外生 token 是变量级（整条序列），直接拼在一起会"信息错位"。全局 token
就是内生侧的"变量级代表"：

  - **Patch-to-Global**：全局 token 通过 attention 聚合所有 patch，成为整条内生序列的宏观表示；
  - **Global-to-Patch**：各 patch token 再从全局 token 接收信息；
  - **Variate-to-Global**：全局 token 作 query，对外生变量 token 做
    cross-attention，把外部信息拉进来。

于是外部信息的路径是：外生 token → 全局 token → 各内生 patch。外生 token 不直接与 patch 交互，所以
cross-attention 的注意力矩阵只有 $1\\times C$。论文称该 token 受 Vision Transformer
启发（原文未明说是 class token；与 class token 的类比是 \[解读\]）。

### 一个 block 的计算

内生 self-attention（Eq.4\~5，P、G 在序列维度拼接后做一次 self-attention）：

$$ \\hat P\_l,\\hat
G\_l=\\mathrm{LayerNorm}\\left(\[P\_l,G\_l\]+\\mathrm{SelfAttention}(\[P\_l,G\_l\])\\right)
$$

外生到内生的 cross-attention（Eq.6）：

$$ \\hat G\_l=\\mathrm{LayerNorm}\\left(\\hat
G\_l+\\mathrm{CrossAttention}(\\hat G\_l,V\_{ex})\\right) $$

最后 FFN 同时作用于 $P$ 与 $G$（Eq.7），共 $L$ 个 block。外生 token $V\_{ex}$
在嵌入后保持不变，在所有层共享。论文指出这正是它比 iTransformer 省的地方：不做外生
token 之间的交互。

### 输出与损失

对最终内生输出 $\[P^L,G^L\]$ 做线性投影得到 $S$ 步预测（论文称这是 encoder-only 预测器的常见做法），损失为
L2：

$$ \\mathrm{Loss}=\\sum\_{i=1}^{S}\\left\\lVert x\_i-\\hat
x\_i\\right\\rVert\_2^2 $$

### 自拟示意：EPF 设定下的 token 数（自拟，已重算）

$T=168$，$P=24$ → $N=\\lfloor 168/24\\rfloor=7$ 个 patch，加 1 个全局 token，共 8
个内生 token，self-attention 矩阵 $8\\times 8$；EPF 有 $C=2$
条外生变量，cross-attention 矩阵 $1\\times 2$。长期预测设定 $T=96$，$P=16$ →
$N=6$，$7\\times 7$ 的 self-attention；论文 ECL 效率实验里 $C=320$，cross-attention
是 $1\\times 320$。作为对比，若把 320 个外生 token 与内生 token 放进同一个
self-attention，代价按变量数平方增长；论文附录 E 给出 TimeXer 在变量维度是
$O(C)$、iTransformer 是 $O(C^2)$。

### 推广到多变量预测

多变量预测可看作：对每个变量，其余变量当作外生变量。论文用通道独立，让每个变量依次作内生，共享 self-attention 与
cross-attention 参数并行计算。因此 TimeXer 既能做带外生变量的预测，也能做常规多变量预测。

## 训练与推理

  - 数据：每个样本含内生回看窗口、外生回看窗口，输出未来 S 步内生序列；外生变量不需要预测。
  - 实现（附录 A.2）：PyTorch，单卡 RTX 4090 24GB；Adam，初始学习率 1e-4，L2 损失；固定训练 10 个
    epoch 并配合 early stopping；block 数 $L\\in{1,2,3}$，`d_model` 在
    ${128,256,512}$ 中搜索；patch 长度长期预测 16、短期预测 24。基线按 TimesNet 的代码库复现。
  - 长期预测设定：回看 96，预测长度 {96,192,336,720}。
  - 推理：\[解读\] 由线性头一次前向直接输出 S 步（直接多步预测），论文没有使用自回归的描述。
  - 论文没有在正文说明归一化（如实例归一化）细节，是否使用 \[待核实\]。
  - 关于未来已知的外生变量：论文方法本身只使用外生变量的历史序列（$z\_{1:T\_{ex}}$）。附录 H.1
    的案例展示了额外输入外生变量未来预测值时结果最好，但这是定性示意，不是主方法设定。

## 实验与结论

### 主结果一：EPF 短期电价预测（论文 Table 2）

输入 168、预测 24，MSE / MAE（越低越好）。下表列 TimeXer 与几个有代表性的基线，其他基线见论文。

| 数据集 | TimeXer       | iTransformer  | PatchTST      | Crossformer   | DLinear       |
| --- | ------------- | ------------- | ------------- | ------------- | ------------- |
| NP  | 0.236 / 0.268 | 0.265 / 0.300 | 0.267 / 0.284 | 0.240 / 0.285 | 0.309 / 0.321 |
| PJM | 0.093 / 0.192 | 0.097 / 0.197 | 0.106 / 0.209 | 0.101 / 0.199 | 0.108 / 0.215 |
| BE  | 0.379 / 0.243 | 0.394 / 0.270 | 0.400 / 0.262 | 0.420 / 0.290 | 0.463 / 0.313 |
| FR  | 0.385 / 0.208 | 0.439 / 0.233 | 0.411 / 0.220 | 0.434 / 0.208 | 0.429 / 0.260 |
| DE  | 0.440 / 0.415 | 0.479 / 0.443 | 0.461 / 0.432 | 0.574 / 0.430 | 0.520 / 0.463 |
| 平均  | 0.307 / 0.265 | 0.335 / 0.289 | 0.330 / 0.282 | 0.354 / 0.284 | 0.366 / 0.314 |

论文自述 TimeXer 在五个数据集上取得一致最优；FR 的 MAE 与 Crossformer 持平（均 0.208）。附录 Table 9
另给出专为外生变量设计的基线：NBEATSx 平均 0.330 / 0.283，TFT 平均 0.402 / 0.335；TimeXer
五次不同随机种子的结果，平均 MSE 为 0.307±0.002、MAE 为 0.265±0.001。

### 主结果二：长期多变量预测（论文 Table 3）

回看 96、四个预测长度取平均，以 iTransformer 的设定为准。

| 数据集     | TimeXer       | iTransformer  | PatchTST      |
| ------- | ------------- | ------------- | ------------- |
| ECL     | 0.171 / 0.270 | 0.178 / 0.270 | 0.205 / 0.290 |
| Weather | 0.241 / 0.271 | 0.258 / 0.278 | 0.259 / 0.281 |
| ETTh1   | 0.437 / 0.437 | 0.454 / 0.447 | 0.469 / 0.454 |
| ETTh2   | 0.367 / 0.396 | 0.383 / 0.407 | 0.387 / 0.407 |
| ETTm1   | 0.382 / 0.397 | 0.407 / 0.410 | 0.387 / 0.400 |
| ETTm2   | 0.274 / 0.322 | 0.288 / 0.332 | 0.281 / 0.326 |
| Traffic | 0.466 / 0.287 | 0.428 / 0.282 | 0.481 / 0.304 |

论文自述在大多数数据集上最优。Traffic 上 iTransformer 更好，ETTh1 的 MAE 上 RLinear（0.434）略优于
TimeXer（0.437）。

### 带外生变量的长期预测（附录 Table 11）

把多变量数据集的最后一维当内生变量，其余当外生变量（如 ECL 用最后一个用户的用电量作内生，ETT 用油温作内生、6 个负荷特征作外生）。表中
ECL 平均 TimeXer 为 0.327 / 0.408，iTransformer 为 0.365 / 0.442。

### 消融（Table 4，EPF）

| 设计                                          | 内生 / 外生 | 平均 MSE / MAE  |
| ------------------------------------------- | ------- | ------------- |
| TimeXer（完整）                                 | P+G / V | 0.307 / 0.265 |
| 外生也用 patch token                            | P+G / P | 0.312 / 0.268 |
| 去掉全局 token                                  | P / V   | 0.316 / 0.273 |
| 外生 token 与内生全局 token 相加（不用 cross-attention） | P+G / V | 0.329 / 0.273 |
| 外生 token 与内生 token 拼接后一起 self-attention     | P+G / V | 0.312 / 0.270 |

论文结论：完整设计整体最好（个别格子如 BE 的 MSE，外生用 patch 的 0.376 优于完整设计的 0.379）。附录 Table 8
在长期预测上做了同样的消融，其中 Traffic 上"拼接后 self-attention"（平均 0.149 / 0.228）优于
TimeXer（0.156 / 0.234），在 ETTh1、ETTm1 上拼接方案反而变差（ETTh1 平均 0.080 /
0.220，TimeXer 为 0.073 / 0.209）。论文据此认为外生变量之间的交互有时也有用，但并非在所有情况下有效。

### 泛化与鲁棒性

  - **回看长度不一致**（Figure 3）：增加内生或外生的回看长度都能带来提升，增加内生的收益更大，二者都增加最好。
  - **缺失值**（Table 5，EPF）：把外生序列整条替换为 0 或随机数后，平均 MSE / MAE 分别为 0.330 /
    0.277 与 0.333 / 0.280（完整为 0.307 / 0.265），退化不大；把内生序列替换为 0 或随机数则平均 MSE
    / MAE 为 1.125 / 0.688 与 1.150 /
    0.701，大幅变差。论文解释为内生时序表示主导预测，所以模型对无信息的外生序列比较稳，但很依赖内生历史的质量。附录
    C 用随机 mask 外生序列（0% 到 99%）与 iTransformer、PatchTST 对比，结果在 Figure
    7，文中仅作定性描述。
  - **大规模天气数据**（Figure 4）：内生为全球 3,850 个站点的小时气温（2019-01-01 至
    2020-12-31），外生为来自 ERA5 的周边 3×3 格点、每格 4 个气象变量共 36 条，采样间隔 3
    小时，频率与内生不一致；回看 7 天、预测 3
    天。基线无法处理不对齐序列，论文用最近邻插值把外生插成小时数据。论文自述
    TimeXer 优于对比的多变量预测器，具体数值见图。
  - **可解释性**（Figure 5 左）：Weather 数据集案例中，全局 token
    对外生变量的注意力图有区分度，形状与内生相似的外生序列得到更高注意力。这是单例可视化。
  - **效率**（Figure 5 右，ECL，320 个外生变量，相同隐维度与 batch size）：图中标注 TimeXer 为
    0.95GB、33 ms/iter，iTransformer 为 1.23GB、25 ms/iter，PatchTST 为
    5.92GB、163 ms/iter，Crossformer 为 7.41GB、128
    ms/iter（图内字号很小，数字以文字层提取为准，仅作量级参考）。即显存低于
    iTransformer，但单步训练时间略长；论文正文只强调了显存优势。

## 优缺点与局限

论文自述：

  - 优点：不改动标准 Transformer 组件；对缺失、错位、频率和长度不一致的外生序列适应性好；变量维度复杂度
    $O(C)$；同时覆盖带外生变量与多变量两种设定。
  - 局限（附录 G）：Traffic 上 MSE 明显落后于 iTransformer，而 MAE
    接近。论文分析是模型能预测趋势但难以准确预测尖峰数值，推测原因是多个
    patch token 与仅一个全局 token 之间不平衡，提出增大 patch 长度或增加可学习 token
    作为缓解思路（未实验验证）。
  - 内生自注意力对 patch 数是二次复杂度
    $O\\left((T/P+1)^2\\right)$，论文提到可换成线性注意力等降低复杂度（未实验）。
  - 当内生序列本身信息不足时（置零 / 随机），模型会大幅变差。

以下为 \[经验\] / \[解读\]（非论文结论）：

  - 只用历史外生值，未来已知的协变量（促销日历、节假日、日前计划等）没有进入主方法设定；有这类强先验时需要自己扩展输入，或改用显式支持未来协变量的模型。\[解读\]
  - 外生变量压成一个变量 token 后，其内部的时间细节丢失；对短时事件敏感的外生信号可能被抹平，是否影响需看数据。\[解读\]
  - 论文的基线都在作者复现的统一代码库下运行，且 EPF 的数值差距有限，实际选型仍建议自测。\[经验\]

## 与相关方法对比

| 方法                   | 内生表示                    | 外生变量                                      | 注意力范围                                                        |
| -------------------- | ----------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| TimeXer              | patch token + 全局 token  | 变量 token，仅通过 cross-attention 与全局 token 交互 | 内生 patch 间 self-attention；全局 token 对外生 token cross-attention |
| PatchTST             | patch token，通道独立        | 无专门设计                                     | 只在单变量 patch 间                                                |
| iTransformer         | 整条序列一个变量 token          | 与内生变量一视同仁，全部变量 token 一起 self-attention    | 变量之间，时间依赖只靠线性映射                                              |
| Crossformer          | 所有变量的 patch 段           | 一视同仁                                      | 两阶段（跨时间、跨变量）                                                 |
| TFT / NBEATSx / TiDE | 逐时间点拼接外生特征（论文 2.2 节的概括） | 论文称 NBEATSx、TiDE 可访问外生变量的未来值；需时间对齐        | 各异                                                           |

要点：PatchTST 擅长时间依赖但不建模变量间关系；iTransformer 擅长变量关系但丢掉内部时间结构；TimeXer 在内生侧保留
patch 的时间结构，在外生侧用变量级 token，并用全局 token 连接两个粒度。论文还指出直接把多变量模型（如
iTransformer）套在外生变量任务上，内生变量的表示学得不好（附录 F 的 CKA 分析）。

## 使用方式

官方实现为 thuml/TimeXer 仓库（论文摘要给出，具体脚本和接口未核对
\[待核实\]）。下面是仅表达张量流程的示意代码，未运行验证，不是官方
API。

``` python
# 示意代码，未运行验证
class TimeXerSketch(nn.Module):
    def __init__(self, T, S, T_ex, D=256, P=24, L=2, heads=8):
        super().__init__()
        self.P, self.N = P, T // P                      # patch 长度与数量
        self.patch_embed = nn.Linear(P, D)
        self.pos = nn.Parameter(torch.zeros(1, self.N, D))
        self.glb = nn.Parameter(torch.randn(1, 1, D))   # 全局 token
        self.var_embed = nn.Linear(T_ex, D)             # 每条外生序列 -> 1 个 token
        self.blocks = nn.ModuleList([Block(D, heads) for _ in range(L)])
        self.head = nn.Linear((self.N + 1) * D, S)

    def forward(self, x, z):          # x: [B, T]，z: [B, T_ex, C]
        p = self.patch_embed(x.unfold(-1, self.P, self.P)) + self.pos   # [B, N, D]
        g = self.glb.expand(x.size(0), -1, -1)                          # [B, 1, D]
        h = torch.cat([p, g], dim=1)                                    # [B, N+1, D]
        v = self.var_embed(z.transpose(1, 2))                           # [B, C, D]
        for blk in self.blocks:       # blk: self-attn(h) -> g 对 v cross-attn -> FFN
            h = blk(h, v)
        return self.head(h.flatten(1))                                  # [B, S]
```

实践要点 \[经验\]：

  - 先把"哪些是目标、哪些是外部信号"划清；外生变量不要求与目标同频率或同长度。
  - 外生变量很多时，TimeXer 的 cross-attention 是线性增长，比把所有变量塞进 self-attention 更省。
  - 超参参考论文：EPF 用 patch 24、回看 168；长期预测用 patch 16、回看 96。

## Reference

  - Yuxuan Wang, Haixu Wu, Jiaxiang Dong, Guo Qin, Haoran Zhang, Yong
    Liu, Yunzhong Qiu, Jianmin Wang, Mingsheng Long. TimeXer: Empowering
    Transformers for Time Series Forecasting with Exogenous Variables.
    NeurIPS 2024. [arXiv:2402.19072](https://arxiv.org/abs/2402.19072)
  - 官方代码（论文摘要给出）：[thuml/TimeXer](https://github.com/thuml/TimeXer)
