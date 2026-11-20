-----

| Title     | ML Tasks TimeSeries Deep iTransformer                 |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-19T02:00:02Z`                                |
| Updated @ | `2026-11-20T08:14:06Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/639) |

-----

# iTransformer

iTransformer（Inverted
Transformer）出自清华大学与蚂蚁集团（Liu、Hu、Zhang、Wu、Wang、Ma、Long），发表于
ICLR 2024（arXiv:2310.06625）。它是一种**多元时间序列预测**模型。一句话概括：**不改 Transformer
的任何基本组件，只把 token 的定义倒过来**——把每个变量（variate）的整条回看序列嵌入成一个 token，让
self-attention 在变量之间建模相关性，让 LayerNorm 与 FFN 沿"整条序列"的维度学习序列表示。

论文的立场很明确：近年线性模型（DLinear 等）在预测上追平甚至超过复杂 Transformer，不是 Transformer
本身不行，而是它在时间序列上被**用错了维度**。iTransformer 因而属于论文划分的第四类
Transformer 预测器：既不改组件，也不只做序列预处理，而是改架构（见下文"与相关方法对比"）。它与
[DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR)、[TCN](/0626_ML_Tasks_TimeSeries_Deep_TCN)
同属深度预测模型，总览见 [深度模型](/0606_ML_Tasks_TimeSeries_Deep) 与
[时间序列总览](/0603_ML_Tasks_TimeSeries)。

## 解决什么问题

常见 Transformer 预测模型（如
Informer、Autoformer、FEDformer）把**同一时间步的所有变量**拼成一个向量，嵌入成一个
temporal token，再对 $T$ 个时间步 token 做 attention。论文指出这种做法的几个问题：

1.  **变量被混在一起**：同一时间步的各变量物理含义、量纲、分布都不同（例如气温与降雨），被投影进同一个嵌入通道，变量之间的区别和独立性被抹掉。
2.  **时间步不对齐**：现实系统里变量之间常有系统性的时间滞后（论文用 Traffic 数据集的传感器相位偏移举例，见其 Figure
    17），同一时间步的数据并不对应同一事件；单个时间步的感受野又过于局部，得到的 attention map 可能"无意义"（论文原话
    meaningless attention maps）。
3.  **对时间维用了 permutation-invariant 的
    attention**：序列顺序对时间序列变化影响很大，却由不带顺序偏置的
    attention 来处理。
4.  **长回看窗口下退化**：摘要指出 Transformer 在较大回看窗口下出现 performance degradation 与
    computation explosion。

论文还讨论了 Channel
Independence（CI，各变量独立、共享同一主干）：它在现有基准上能明显提升性能，原文引用他人工作认为原因之一是基准数据量不够大（样本稀缺）；但
CI 把多元序列当成单变量处理，**无法显式利用变量间相关**，且逐变量训练与推理耗时，成为可扩展性的障碍（论文附录 G.1）。

\[解读\] iTransformer 的设计可以理解为同时保留两者的好处：像 CI
一样让各变量先保持独立、在时间维上共享同一套表示学习（同一个
Embedding 与 FFN 作用于每个变量）；又用 attention 显式建模变量之间的关系。

## 核心思想与结构

### 记号与整体流程

输入回看序列 $X\\in\\mathbb R^{T\\times N}$（$T$ 个时间步、$N$ 个变量），预测未来
$Y\\in\\mathbb R^{S\\times N}$。记 $X\_{t,:}$ 为同一时间步的 $N$ 个值，$X\_{:,n}$ 为第
$n$ 个变量的整条序列。iTransformer 采用 Transformer 的 **encoder-only** 结构，包含
embedding、若干 TrmBlock 与 projection：

$$ \\begin{aligned} h\_n^{0}&=\\mathrm{Embedding}(X\_{:,n}) &&(\\mathbb
R^T\\to\\mathbb R^D,\\ \\text{MLP})\\
H^{l+1}&=\\mathrm{TrmBlock}(H^{l}),\\quad l=0,\\dots,L-1
&&(H\\in\\mathbb R^{N\\times D},\\ N\\text{ 个变量 token})\\ \\hat
Y\_{:,n}&=\\mathrm{Projection}(h\_n^{L}) &&(\\mathbb R^D\\to\\mathbb
R^S,\\ \\text{MLP}) \\end{aligned}

其中：$X\_{:,n}$ 是第 $n$ 个变量的整条序列；$h^l\_n$ 是第 $l$ 层第 $n$ 个变量
token，$H^l\\in\\mathbb R^{N\\times D}$ 是所有变量
token；$\\mathrm{Embedding}$ 与 $\\mathrm{Projection}$ 是 MLP，分别把 $T$
维映射到 $D$ 维、把 $D$ 维映射到 $S$ 维；$\\mathrm{TrmBlock}$ 是 Transformer
块；$L$ 是层数；$\\hat Y\_{:,n}$ 是第 $n$ 个变量的预测。 $$

论文附录 Algorithm 1 的写法等价：先把 $X$ 转置成 $N\\times T$，用 MLP 作用在最后一维得到
$H^0\\in\\mathbb R^{N\\times D}$；每个 block 内依次做
$H=\\mathrm{LayerNorm}(H+\\mathrm{SelfAttn}(H))$、$H=\\mathrm{LayerNorm}(H+\\mathrm{FFN}(H))$；最后
MLP 投影得到 $N\\times S$ 再转置回 $S\\times N$。

下图概括 iTransformer 的 encoder-only 流程。

``` 
 原始序列 X (T×N)
      │ transpose
      ▼
 N 个变量，每个长度 T          x_1 x_2 ... x_N      每个 x_n ∈ R^T
      │ Embedding (MLP: T→D)
      ▼
 N 个变量 token (N×D)          h_1 h_2 ... h_N
      │ ┌─────────────────────────────────────────┐
      │ │ TrmBlock × L                            │
      │ │  self-attention   (token = 变量，N×N 图) │
      │ │  + Add&LayerNorm                        │
      │ │  FFN              (逐 token，共享权重)   │
      │ │  + Add&LayerNorm                        │
      │ └─────────────────────────────────────────┘
      ▼
 Projection (MLP: D→S)
      ▼
 预测 Ŷ (S×N)
```

图中：

  - 自上而下：原始序列 $X$（$T\\times N$）转置后得到 $N$ 个变量，每个长度
    $T$；Embedding（MLP，$T\\to D$）把每个变量变成一个 token。
  - 中间框是 $L$ 个 TrmBlock：自注意力在变量 token 之间（$N\\times N$ 注意力图），后接 Add &
    LayerNorm；FFN 对每个 token 共享权重，后接 Add & LayerNorm。
  - 最后 Projection（MLP，$D\\to S$）输出预测 $\\hat Y$（$S\\times
    N$）。关键结论：注意力管变量间相关，FFN 管单个变量的序列表示。

### 三个组件各自的"职责"被重新定位

论文的核心论述是：Transformer 的三个组件在倒置后职责更清晰。

**1. Self-attention：负责变量间相关。** 对 $H\\in\\mathbb R^{N\\times D}$ 做线性投影得到
$Q,K,V\\in\\mathbb R^{N\\times d\_k}$，预 softmax 得分
$A=QK^{\\top}/\\sqrt{d\_k}\\in\\mathbb R^{N\\times N}$，其中
$A\_{i,j}\\propto q\_i^{\\top}k\_j$。因为每个 token
在特征维上已被归一化，该得分可以在一定程度上反映变量
$i$ 与 $j$ 的相关；相关度高的变量在后续与 $V$ 的加权中占更大权重。论文在 Solar-Energy
上可视化显示：浅层的得分图与回看窗口内原始序列的相关矩阵相似，越深的层越接近**未来**序列的相关矩阵（论文
Figure 7 与附录 Figure 11，属定性展示）。

**2. LayerNorm：对每个变量 token 单独归一化。**

$$
\\mathrm{LayerNorm}(H)=\\frac{h\_n-\\mathrm{Mean}(h\_n)}{\\sqrt{\\mathrm{Var}(h\_n)}},\\quad
n=1,\\dots,N \\tag{2} $$

其中：$H$ 是变量 token 矩阵；$h\_n$ 是第 $n$ 个变量的 token；$\\mathrm{Mean}(h\_n)$ 与
$\\mathrm{Var}(h\_n)$ 是该 token 在特征维上的均值与方差；$N$
是变量数；该式对每个变量单独归一化，使各变量处于近似相同的分布。

（式 2，即论文 Eq.2。）

即在每个变量的序列表示上做归一化。论文的解释：这与处理非平稳性的做法（如 RevIN、Non-stationary Transformer 的
stationarization）思路相近，且把各变量都归一到近似相同的分布，可以削弱不同量纲带来的差异；而在传统结构里，LayerNorm
是在同一时间步的多变量表示上做的，会把变量混在一起、引入噪声（论文原文如此论述）。

**3. FFN：负责单个变量的序列表示。** FFN 对每个变量 token 独立且共享权重地作用。论文给出的解释（属其假设）是：FFN
的神经元学到任意时间序列的内在性质，如幅度、周期、频谱（"neuron as a filter"），因此比作用在时间点上的
attention 更适合做预测表示；多层堆叠后 FFN 同时承担"编码历史、解码未来"的功能。**位置编码不再需要**，因为顺序信息已经隐含在
FFN 神经元的排列里。

### 用张量形状走查：普通 Transformer vs 倒置

下面用一组**自拟的形状数字**走一遍，目的是看清"谁是 token""attention 图多大""哪些权重与 $N$
绑定"。以下数字**不是论文设置**，只是示意：

  - batch $B=32$，回看长度 $T=96$，变量数 $N=321$（与论文 ECL
    数据集的变量数相同，但这里只是借用数字），模型维度
    $D=512$，预测长度 $S=192$；
  - 只比较 embedding 与 attention，忽略 head 数（下面的 attention 图是"每个
    head"的大小），也忽略普通 Transformer 的 decoder（论文基线
    Transformer 带 decoder，这里为简化只看 encoder 部分）\[解读\]。

| 步骤                     | 普通 Transformer（temporal token）                          | iTransformer（variate token）                                      |
| ---------------------- | ------------------------------------------------------- | ---------------------------------------------------------------- |
| 输入                     | `[32, 96, 321]`                                         | `[32, 96, 321]`，先转置为 `[32, 321, 96]`                             |
| token 是什么              | 一个时间步（含 321 个变量值）                                       | 一个变量（含 96 个时间点）                                                  |
| token 数                | 96                                                      | 321                                                              |
| Embedding              | `Linear(321→512)`：`[32,96,321]→[32,96,512]`             | `Linear(96→512)`：`[32,321,96]→[32,321,512]`                      |
| Embedding 权重量          | $321\\times512 = 164{,}352$（与 $N$ 绑定）                   | $96\\times512 = 49{,}152$（与 $N$ 无关，与 $T$ 绑定）                     |
| 位置编码                   | 需要，加到 96 个 token 上                                      | 不需要                                                              |
| Attention 得分图（每个 head） | `[32, 96, 96]`，共 $32\\times96\\times96 = 294{,}912$ 个元素 | `[32, 321, 321]`，共 $32\\times321\\times321 = 3{,}297{,}312$ 个元素  |
| 得分图含义                  | 时间步 i 与时间步 j 的相关（时间步间的相互作用）                             | 变量 i 与变量 j 的相关                                                   |
| FFN 作用对象               | 每个时间步的 512 维向量                                          | 每个变量的 512 维序列表示                                                  |
| LayerNorm 在哪个轴         | 每个时间步的特征向量（混合了各变量）                                      | 每个变量的特征向量                                                        |
| 输出头                    | （需由 decoder 或线性头生成 $S$ 步）                               | `Linear(512→192)`：`[32,321,512]→[32,321,192]`，转置为 `[32,192,321]` |

表中：「步骤」是处理环节，其余两列分别是普通 Transformer 与 iTransformer 在该环节的做法与张量形状（$B$ 为
batch，$T$ 为回看长度，$N$ 为变量数，$D$ 为隐维，$S$ 为预测长度）。结论：倒置后 token 数由 $T$ 变为
$N$，embedding 权重与 $N$ 无关，注意力图在变量多时更大。

自行重算核对：$96\\times96 = 9216$，$321\\times321 = 103041$，注意力图元素数之比
$103041/9216 \\approx 11.18$；也就是说**变量多时倒置后的注意力图更大**。当 $N$ 很小（如 $N=7$ 的
ETT，自拟比较：$7\\times7 = 49$ 对 $9216$），倒置反而大幅缩小注意力开销；当 $N=862$（Traffic
的变量数，同样只是借数字）时 $862\\times862 = 743044$，约为 $9216$ 的 $80.6$
倍。这与论文附录 D 的结论一致：Weather（21 变量）上 iTransformer 的效率超过其他
Transformer，而在 Traffic（862 变量）上 temporal-token 的 Transformer 因 token 数
$T=96$ 而更省。

对比 Channel Independence（PatchTST 之类的做法，示意）：把 `[32, 96, 321]` 重排为
$\[32\\times321,,96,,1\] = \[10272,,96,,1\]$，每个变量被当作独立样本共享同一个主干，**变量之间没有
attention 交互**；iTransformer 则保留 `[32, 321, ·]` 的结构，在 321 个变量 token 之间做
attention。

### 变量数可变：为什么能泛化到未见变量

仍用上面的自拟数字。训练时只用 20% 的变量：$N' = 64$（$0.2\\times321 = 64.2$，取整示意）。

  - 训练：`[32, 64, 96] → Embedding [32, 64, 512] → attention 图
    [32, 64, 64] → Projection [32, 64, 192]`
  - 推理：`[32, 321, 96] → Embedding [32, 321, 512] → attention 图
    [32, 321, 321] → Projection [32, 321, 192]`

两次用到的**所有权重形状完全相同**：`Linear(96→512)`、$W\_Q/W\_K/W\_V$（$512\\to
d\_k$）、FFN、`Linear(512→192)`，没有一个与 $N$ 绑定，所以变量数可以从训练到推理变化。普通
Transformer 的 `Linear(N→D)` 与 $N$ 绑定，不能这样用。论文称：由于 token 数灵活，且 FFN 对各变量
token 共享权重，模型可以在任意数量的变量上训练、再预测未见变量（论文 §4.2 "Variate generalization"）。

## 训练与推理

  - **训练**：论文用 L2 loss 与 Adam，初始学习率取自 {1e-3, 5e-4, 1e-4}，batch size 统一为
    32，训练 10 个 epoch；block 数 $L$ 取自 ${2,3,4}$，$D$ 取自 ${256,512}$。单卡
    NVIDIA P100 16GB；所有基线基于 TimesNet 的开源基准库按各自原论文/官方代码配置复现。论文报告了 5
    个随机种子下的标准差（Table 5），数值很小，说明稳定。
  - **设置**：回看长度 $T$ 固定为 96；预测长度在 ETT、Weather、ECL、Solar-Energy、Traffic 上取
    {96,192,336,720}；PEMS 在正文 Table 1 的说明和附录 A.1 的文字里写作
    {12,24,36,48}，但附录 Table 4 与 Table 9 的 PEMS 预测长度是
    {12,24,48,96}，论文前后不一致 \[待核实：以附录完整表为准\]。数据集按时间顺序切分训练/验证/测试，沿用
    TimesNet 的协议。
  - **推理**：一次前向直接输出全部 $S$ 步和全部变量（非自回归）。
  - **高维数据的高效训练策略**：每个 batch 随机挑一部分变量训练，推理时对所有变量预测。由于 token
    数可变，这一做法可行；论文 Figure 8
    显示性能与全变量训练相当而显存大幅降低。
  - **可换注意力**：倒置架构对注意力只要求"可用于变量相关"，因此可以插入 Flowformer、FlashAttention
    等高效注意力来处理变量极多的情形。

## 实验与结论

以下数字均来自论文（对着渲染页核对），除非标注。

### 主结果（论文 Table 1）

回看 $T=96$，结果为各预测长度的平均；基线共 10
个：Autoformer、FEDformer、Stationary、Crossformer、PatchTST、DLinear、TiDE、RLinear、SCINet、TimesNet。

| 数据集          | iTransformer MSE / MAE | 说明                                                 |
| ------------ | ---------------------- | -------------------------------------------------- |
| ECL          | 0.178 / 0.270          | 两项均最优；PatchTST 为 0.205 / 0.290                     |
| Traffic      | 0.428 / 0.282          | 两项均最优；PatchTST 为 0.481 / 0.304                     |
| Weather      | 0.258 / 0.278          | 两项均最优                                              |
| Solar-Energy | 0.233 / 0.262          | 两项均最优；PatchTST 为 0.270 / 0.307                     |
| PEMS (Avg)   | 0.119 / 0.218          | 两项均最优；SCINet 为 0.121 / 0.222（PEMS 预测长度设置见上文的不一致说明） |
| Exchange     | 0.360 / 0.403          | MAE 最优；MSE 次优（DLinear 0.354）                       |
| ETT (Avg)    | 0.383 / 0.399          | 不是最优：RLinear 0.380 / 0.392，PatchTST 0.381 / 0.397  |

表中：「数据集」是评测集，「iTransformer MSE /
MAE」是各预测长度平均误差（越小越好），「说明」比较其与基线的名次。结论：在变量多的数据集上最优，ETT
上并非最优。

论文自己的描述是：iTransformer 尤其擅长高维时间序列预测；PatchTST 在 PEMS 上多处表现不好，论文推测是 PEMS
序列剧烈波动，patch 可能难以关注局部；Crossformer 显式建模变量相关却仍不及
iTransformer，论文认为是时间未对齐的 patch 之间的交互引入了噪声。此外论文还给出了蚂蚁集团
Alipay 服务器负载的 Market 数据集（6 个子集，变量数 285 到 759，回看 144 点，预测长度
{12,24,72,144}），称 iTransformer 一致优于其他基线；附录 Table 11 中绝大多数项是 iTransformer
最优，个别项不是（具体数值此处不转述）。

### 框架通用性：把"倒置"用到其他 Transformer（论文 §4.2、Table 2）

论文把倒置框架套用到 Transformer、Reformer、Informer、Flowformer 和 Flashformer（带
FlashAttention 的 Transformer）上，报告 MSE 的相对降低（Promotion）。

| 模型          | ECL（原→倒置 MSE） | Traffic       | Weather       | 论文给出的平均提升 |
| ----------- | ------------- | ------------- | ------------- | --------- |
| Transformer | 0.277 → 0.178 | 0.665 → 0.428 | 0.657 → 0.258 | 38.9%     |
| Reformer    | 0.338 → 0.208 | 0.741 → 0.647 | 0.803 → 0.248 | 36.1%     |
| Informer    | 0.311 → 0.216 | 0.764 → 0.662 | 0.634 → 0.271 | 28.5%     |
| Flowformer  | 0.267 → 0.210 | 0.750 → 0.524 | 0.286 → 0.266 | 16.8%     |
| Flashformer | 0.285 → 0.206 | 0.658 → 0.492 | 0.659 → 0.262 | 32.2%     |

表中：「模型」是被套用倒置框架的 Transformer 变体，「ECL / Traffic / Weather」列给出原模型到倒置后的
MSE（越小越好），「论文给出的平均提升」是 MSE 的相对降低。结论：倒置对各类 Transformer 均有显著提升。

论文由此认为，倒置能一致地提升多种 Transformer，并且能搭配各类高效注意力。注意：这里"提升"是相对于**原 Transformer
在其 Table 2 设置下**的结果，不是与 PatchTST 之类的强基线相比。

### 泛化到未见变量（论文 §4.2、Figure 5、附录 F.3）

做法：把每个数据集的变量分成 5 份，每次只用其中一份的 20% 变量训练，不微调，直接预测**全部**变量，5 份结果取平均。对比对象是
CI-Transformers（用 Channel Independence 训练共享主干，推理时逐变量预测）。论文报告
iTransformer 的性能下降总体较小，并且能一次预测所有变量；CI 方式推理要逐变量，耗时更长。论文据此推测 FFN
学到的是可迁移的序列表示，并展望在 iTransformer
上构建能同时训练不同变量数数据的基础模型（这是展望，不是论文已做的实验）。具体数值只有柱状图标注，这里不转述。

### 更长回看窗口（论文 Figure 6）

固定预测长度 $S=96$，回看长度 $T\\in{48, 96, 192, 336, 720}$。论文显示：原 Transformer 与
Informer、Flowformer
的误差并没有随回看变长而明显下降，而倒置后的版本（iTransformer、iFlowformer、iInformer）在
ECL 和 Traffic 上随回看增长误差总体下降（从图上读，ECL 的 iTransformer 在 720
处略有回升；曲线读数不精确，这里不给具体数值）。这与"在时间维用 MLP
可从更长历史获益"的论述一致。

### 消融（论文 Table 3，各预测长度平均）

| Variate 维用 | Temporal 维用                   | ECL MSE | Traffic MSE | Weather MSE | Solar MSE |
| ---------- | ----------------------------- | ------- | ----------- | ----------- | --------- |
| Attention  | FFN（iTransformer）             | 0.178   | 0.428       | 0.258       | 0.233     |
| Attention  | Attention                     | 0.193   | 0.913       | 0.255       | 0.261     |
| FFN        | Attention（即普通 Transformer 排布） | 0.202   | 0.863       | 0.258       | 0.285     |
| FFN        | FFN                           | 0.182   | 0.599       | 0.248       | 0.269     |
| Attention  | 无                             | 0.189   | 0.456       | 0.261       | 0.258     |
| 无          | FFN                           | 0.193   | 0.461       | 0.265       | 0.261     |

表中：「Variate 维用」「Temporal 维用」是在变量维与时间维上使用的模块，后四列是各数据集的
MSE（越小越好）。结论：iTransformer 排布（变量维注意力 + 时间维
FFN）在变量多的数据上最好，Weather 变量少时其他排布略优。

读法：iTransformer 排布在 ECL、Traffic、Solar-Energy 上最好；在变量只有 21 个的 Weather
上，FFN+FFN（0.248）和 Attention+Attention（0.255）的 MSE
都低于它（0.258）。论文的解释是变量少时变量相关的重要性较低，而变量越多越需要显式建模变量相关。把
attention 放在时间维（表中第 2、3 行，Temporal 列为 Attention 的两种设计）在 Traffic
上退化严重，论文归因于有时间滞后的时间点被强行配对（附录 E.3）。

### 表示分析与可解释性

  - **CKA**：论文比较第一个与最后一个 block 输出特征的 CKA 相似度，指出预测这类低层生成任务偏好较高的
    CKA；倒置后的模型整体 CKA 更高，且与更低的 MSE 对应（Figure 7）。
  - **注意力图可解释**：Solar-Energy 案例中浅层得分图类似历史相关，深层类似未来相关；Market
    数据集上得分图呈现与应用分组一致的块状结构（附录 Figure
    12）。均为论文的定性展示。

### 效率（论文附录 D、Figure 10）

输入 96、预测 96 的设置下（读自 Figure 10 的气泡标注），Traffic（862 变量）：iTransformer
7.50GB、265ms/iter；iTransformer（高效训练策略，只训 20%
变量）1.28GB、91ms/iter；Transformer 1.16GB、145ms/iter；PatchTST
8.58GB、635ms/iter；Crossformer 9.74GB、702ms/iter。Weather（21 变量）上
iTransformer 为 0.88GB、30ms/iter，Transformer 为 1.09GB、85ms/iter。

读法：Weather 这类变量少的数据上，iTransformer 比其他 Transformer 更省；Traffic 上
temporal-token 的 Transformer（token 数 96）反而比 iTransformer（token 数
862）更省显存也更快，论文附录 D 也承认这一点；iTransformer 则比 PatchTST、Crossformer
更快、显存略低。论文称用线性复杂度注意力或高效训练策略后，速度与显存可接近线性模型。

## 优缺点与局限

**论文自述：**

  - 优点：不改 Transformer
    组件；显式建模变量相关且注意力图可解释；变量数可变、可泛化到未见变量；回看窗口越长越有用；可插拔高效注意力。
  - 局限/未来工作：注意力对变量数是二次复杂度；单变量场景下"attention 退化"，iTransformer
    实际变成一个可堆叠的线性预测器（附录
    G.2）；论文称还留有改进空间，如针对分布漂移的结构化时间依赖建模、更细粒度的变量
    tokenization、更好的 embedding（如加入 TCN 之类归纳偏置，附录
    G.3）；结论里提到未来要做大规模预训练和更多时间序列任务。

**\[经验\] / \[解读\]：**

  - \[解读\] 一个变量只用一个 token，意味着整个回看窗口被一次性压成 $D$ 维向量，**时间内部的局部结构全靠 MLP
    学**；在 ETT 这类变量少、相关性弱的数据上收益不明显，与 Table 1 中 ETT 不是最优一致。
  - \[解读\] 论文里的 PEMS、Traffic
    提升很大，但它们变量数多且相互关联强，是该方法最有利的场景；变量数少且相关弱时，更简单的线性模型（如
    DLinear、RLinear）可能已足够。
  - \[解读\] 由效率数据看，变量数极大时必须配合高效注意力或变量采样训练，否则 $N\\times N$ 注意力图会成为瓶颈。

## 与相关方法对比

| 方法                                           | token 是什么       | attention / 混合发生在哪 | 变量间交互          | 说明               |
| -------------------------------------------- | --------------- | ------------------ | -------------- | ---------------- |
| Transformer 类（Informer、Autoformer、FEDformer） | 一个时间步（含全部变量）    | 时间步之间              | 在嵌入时被混合        | 论文称之为改组件的第一类     |
| PatchTST                                     | 单变量序列的一个 patch  | patch 之间；变量独立（CI）  | 无              | 论文归为"改序列处理"的第二类  |
| Crossformer                                  | patch，显式跨时间/跨变量 | 两个方向的注意力           | 有              | 论文归为同时改组件与架构的第三类 |
| iTransformer                                 | 一个变量的整条序列       | 变量之间               | 有（attention 图） | 论文归为第四类，只改架构     |
| DLinear                                      | 无（线性层）          | 时间维线性映射            | 无              | 线性基线             |

表中：「方法」是对比对象，「token 是什么」「attention /
混合发生在哪」「变量间交互」说明各方法的输入单元、混合位置与是否有变量间交互，「说明」给出论文的分类。结论：iTransformer
的 token 是整条变量序列，注意力作用于变量之间。

论文认为 iTransformer 是 patching 的极端情形（把 patch 长度拉到整条序列，见其 Figure 19）。

\[解读\] 与同系列其他文章的关系：DLinear、N-BEATS 等用线性层/MLP 在时间维上做表示，思路上接近 iTransformer
里"FFN 管时间"的那一半，但没有变量间 attention；TSMixer 同样是 MLP 架构，需对照其文章；后续的
TimeXer、SOFTS 等是继续沿用变量 token 思路的方法（此处只写名字，细节请见各自文章）。

## 使用方式

官方代码仓库在论文摘要中给出：`https://github.com/thuml/iTransformer`（本文未逐文件核对其内容与配置）。下面是一个**示意代码，未运行验证**，只表达结构，不对应官方实现细节：

``` python
# 示意代码，未运行验证
import torch, torch.nn as nn

class ITransformerSketch(nn.Module):
    def __init__(self, T, S, D=512, L=3, heads=8):
        super().__init__()
        self.embed = nn.Linear(T, D)                  # 每个变量: R^T -> R^D
        layer = nn.TransformerEncoderLayer(D, heads, dim_feedforward=4*D,
                                           batch_first=True)
        self.enc = nn.TransformerEncoder(layer, L)    # token = 变量，无位置编码
        self.proj = nn.Linear(D, S)                   # R^D -> R^S

    def forward(self, x):                             # x: [B, T, N]
        h = self.embed(x.transpose(1, 2))             # [B, N, D]
        h = self.enc(h)                               # 变量间 attention
        return self.proj(h).transpose(1, 2)           # [B, S, N]
```

注意：论文写 Embedding 与 Projection 都是 MLP，示意代码各用了一个
`nn.Linear`；`heads=8`、`dim_feedforward=4*D`、无 dropout 等均为示意取值，论文只给出
$L$ 取自 ${2,3,4}$、$D$ 取自 ${256,512}$。

要点：训练时把输入沿变量维切子集即可使用论文的高效训练策略；推理时可输入更多变量。实际使用请参考官方仓库的配置与数据处理。

## Reference

  - Yong Liu, Tengge Hu, Haoran Zhang, Haixu Wu, Shiyu Wang, Lintao Ma,
    Mingsheng Long. *iTransformer: Inverted Transformers Are Effective
    for Time Series Forecasting*. ICLR 2024.
    [arXiv:2310.06625](https://arxiv.org/abs/2310.06625)
  - 官方代码：[thuml/iTransformer](https://github.com/thuml/iTransformer)
