-----

| Title     | ML Tasks TimeSeries Deep TSMixer                      |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-19T01:28:55Z`                                |
| Updated @ | `2026-11-19T02:24:22Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/632) |

-----

# TSMixer

TSMixer（Time-Series Mixer）出自 Google Cloud AI Research 的论文 *TSMixer: An
All-MLP Architecture for Time Series Forecasting*（Si-An Chen、Chun-Liang
Li、Nathanael C. Yoder、Sercan Ö. Arik、Tomas Pfister；发表于 TMLR，2023 年 9
月；arXiv:2303.06053）。**一句话概括：只用 MLP，沿"时间维"与"特征（变量）维"交替做混合（time-mixing
/ feature-mixing），在保留线性模型时间建模能力的同时，让参数随 L 与 C 近似相加增长（论文写作 $O(L+C)$，而非
$O(LC)$）来利用跨变量信息；并提供可吃静态特征与未来已知特征的扩展版 TSMixer-Ext。**

> 注意区分：本文只讲上述 Google 论文的 TSMixer。IBM 的 Tiny Time Mixers（TTM）的摘要提到基于"轻量
> TSMixer"，但那是另一篇论文，不在本文范围内。名字相近的 TimeMixer 也是另一种方法，这里只提名字，不展开。

本文约定：未加标注的内容来自论文原文；`[解读]` 为本文的理解，`[经验]` 为一般实践经验（非论文结论），`[待核实]` 为未能确认的信息。

## 解决什么问题 / 动机

论文认为时间序列的可预测性来自三类信息：

  - **持续的时间模式**（persistent temporal patterns）：趋势、季节性，如长期通胀、星期效应；
  - **跨变量信息**（cross-variate information）：变量间的相关性；
  - **辅助特征**（auxiliary features）：静态特征（如商品类别）与未来已知信息（如促销活动）。

论文的出发点是一个"反直觉"的现象：Zeng et al. (2023)（LTSF-Linear，DLinear 一类线性基线，综述见
[Deep
学习路线](/0606_ML_Tasks_TimeSeries_Deep)）发现，在常用长序列预测基准上，简单的单变量线性模型可以显著优于各类多变量
Transformer；Nie et al. (2023)（PatchTST）也主张不建模跨变量信息。由此引出两个问题：

1.  跨变量信息到底有没有用？
2.  当它没用时，多变量模型能否至少和单变量模型一样好？

论文的回答分两层：（a）在 ETT、Weather、Electricity、Traffic
这些常用基准上，跨变量信息确实帮助不大（TSMixer
与只做时间混合的 TMix-Only
表现接近），论文认为此前"不要建模跨变量"的结论主要来自数据集偏差，这些基准不足以评估模型利用协变量的能力；（b）在
M5 零售数据上，跨变量信息和辅助特征带来明显收益，TSMixer 能有效利用。

## 线性模型为何适合做时间建模（论文第 3 节）

**记号**：历史观测 $X\\in\\mathbb R^{L\\times C\_x}$（$L$ 为回看窗口长度，$C\_x$
为变量数），预测目标 $Y\\in\\mathbb R^{T\\times C\_y}$（$T$
为预测步数）。时间线性模型学习 $A\\in\\mathbb R^{T\\times
L}$、$b\\in\\mathbb R^{T\\times 1}$：

$$ \\hat Y = A X \\oplus b \\ \\in \\mathbb R^{T\\times C\_x} $$

（$\\oplus$ 为按列加偏置；$A$ 沿时间维作用，各变量共享）

**理论洞察**：

  - 若序列严格周期 $x(t)=x(t-P)$（$P\<L$），存在取值为 0/1 的 $A$（$A\_{ij}=1$ 当
    $j=L-P+(i \\bmod P)$，否则为 0，$b=0$）可完美预测；仿射周期 $x(t)=a\\cdot x(t-P)+c$
    时把 1 换成 $a$、$b\_i=c$ 同样成立。
  - **Theorem 3.1**：若 $x(t)=g(t)+f(t)$，$g$ 为周期 $P$ 的周期信号，$f$ 为 Lipschitz
    常数 $K$ 的光滑函数，则存在回看窗口 $L\\ge P+1$ 的线性模型，使下式成立（证明见论文附录 A）：

$$ \\lvert y\_i-\\hat y\_i\\rvert \\le K\\big(i+\\min(i,P)\\big),\\quad
i=1,\\dots,T $$

**time-step-dependent vs data-dependent**：线性模型对输入序列各时间步的权重固定（只依赖位置），论文称为
time-step-dependent；RNN 的门控、Transformer 的注意力则是
data-dependent（权重是输入的函数）。论文的观点是后者表达力强但容易过拟合到数据而非位置，这可能解释了线性模型为何能赢。

**论文自述的局限**：该分析针对单变量、周期 + 光滑的假设；真实数据若高波动、非周期非光滑，仅依赖历史时间模式可能不够，Lipschitz
之外的情形留作未来工作。

**一个小例子**（`[解读]`，按论文式 (2) 的构造）：设日度数据周期 $P=7$、回看窗口 $L=28$，预测 $T=3$ 步。令
$A\_{ij}=1$ 当 $j=L-P+(i \\bmod P)$，即第 $i$
个预测步只"抄"回看窗口里恰好一个周期之前的同位置那个点（$i=1$
抄第 22 个点，$i=2$ 抄第 23 个，$i=3$ 抄第 24 个），其余权重为
0，就能完美外推周期序列。要点：这类"按位置取值"的规则只依赖时间步位置，与输入数值无关，线性层正好能直接学到；而注意力要靠数据去算出这种固定位置关系，更容易被噪声带偏。

**为什么 L 越长越要靠线性/MLP**：定理要求 $L\\ge P+1$，且误差界随 $i+\\min(i,P)$ 增长；`[解读]`
周期较长时需要足够长的窗口才能覆盖一整个周期，论文实验里取 $L=512$（沿用 PatchTST），并在 Fig. 5
中验证了线性模型随 $L$ 从 96 增到 336 明显变好、720 附近趋于收敛。时间混合每层只有 $L\\times
L$ 权重，增大 $L$ 的代价是平方而非 $L\\times C$ 的乘积。

`[解读]` 这一节可以理解为：先论证"沿时间维做全连接"是个好的归纳偏置，再在此基础上加非线性、加深、加跨变量混合——TSMixer
的结构是这条思路的自然延伸。

## 核心思想与结构

### 从线性模型到 TSMixer

论文是"逐步加容量"：

1.  线性模型 → 堆叠带非线性的时间线性层（**TMix-Only**，只做时间混合的残差 MLP，各变量共享）；
2.  再引入跨变量的前馈层，得到 **TSMixer**：时间域 MLP 与特征域 MLP **交替**作用。

时间域 MLP 在所有特征间共享，特征域 MLP 在所有时间步间共享。残差设计使模型保有时间线性模型的能力，并可以忽略不必要的混合操作。

### 输入布局与各组件

输入是一个 $L\\times C$ 的矩阵：行是时间步，列是变量。

    输入 X (L×C)
      │
      ├─ [Mixer Layer] × N
      │     ├─ Time-mixing   : 转置后沿时间维 FC(L→L) + 激活 + Dropout，各变量共享，残差 + Norm
      │     └─ Feature-mixing: 沿特征维两层 MLP，各时间步共享，残差 + Norm
      │
      └─ Temporal Projection: 沿时间维 FC(L→T)，各变量共享
            ↓
         预测 Ŷ (T×C)

组件说明（论文第 4.1 节）：

  - **Time-mixing MLP**：一层全连接 + 激活 + dropout，沿时间维、各特征共享。只用单层，因为第 3
    节说明简单线性已足够学时间模式。
  - **Feature-mixing MLP**：两层 MLP（类似 Transformer 的
    FFN），沿特征维、各时间步共享，用来利用协变量信息。
  - **Temporal Projection**：与 LTSF-Linear 相同的时间维全连接，把长度从 L 映射到 T。
  - **Residual Connections**：每个 time-mixing 与 feature-mixing 层都加残差。
  - **Normalization**：不同于通常只沿特征维归一化，TSMixer 做 **2D
    归一化**（同时覆盖时间与特征两个维度）。论文引用
    Nie et al. (2023)，在长序列基准上使用 batch normalization；M5 上用 layer
    normalization（见下）。

### 关键公式（论文附录 B.3，符号做了转写）

$$ \\begin{aligned} \\text{Temporal Projection:}\\quad &
\\mathrm{TP}*{L\\to T}(X)\[:,i\] = W\_1\\cdot X\[:,i\] + b\_1, \\qquad
W\_1\\in\\mathbb R^{L\\times T}\\ \\text{Time Mixing:}\\quad &
\\mathrm{TM}(X)\[:,i\] = \\mathrm{Norm}\\Big(X\[:,i\] +
\\mathrm{Drop}\\big(\\sigma(\\mathrm{TP}*{L\\to
L}(X)\[:,i\])\\big)\\Big)\\ \\text{Feature Mixing:}\\quad & U\[j,:\] =
\\mathrm{Drop}\\big(\\sigma(W\_2\\cdot X\[j,:\] + b\_2)\\big)\\ &
\\mathrm{FM}(X)\[j,:\] = \\mathrm{Norm}\\Big(X\[j,:\] +
\\mathrm{Drop}\\big(W\_3\\cdot U\[j,:\] + b\_3\\big)\\Big)\\
\\text{Mixer Layer:}\\quad & \\mathrm{Mix}(X) =
\\mathrm{FM}\\big(\\mathrm{TM}(X)\\big)\\ \\text{基础 TSMixer:}\\quad &
O\_1=\\mathrm{Mix}(X);\\quad O\_k=\\mathrm{Mix}(O\_{k-1});\\quad \\hat
Y=\\mathrm{TP}\_{L\\to T}(O\_K) \\end{aligned} $$

附录补充的实现细节：

  - 对长序列预测任务，为提高容量，FM 的隐层加宽（$W\_2\\in\\mathbb R^{H\\times
    C}$、$W\_3\\in\\mathbb R^{C\\times H}$，$H$ 为超参）；
  - 长序列基准用 **pre-normalization**（保持输入尺度）；
  - Norm 作用在整个矩阵上（时间与特征两维），而不是逐行。

### 张量形状走查

以长序列基准的设置为例（`[解读]` 数字为本文自己的演算，用来帮助理解形状，非论文数据）：ETT 取
$L=512$、$C=7$、$T=96$，隐层 $H=64$。

    输入                       X           (B, 512, 7)
    Time-mixing:  转置          (B, 7, 512)   Linear(512→512) 沿最后一维，7 个变量共用同一组权重
                  转置回        (B, 512, 7)   + 残差，Norm（对 512×7 整体）
    Feature-mixing: Linear(7→64)→激活→Dropout→Linear(64→7)，对 512 个时间步各做一次、共用权重
                  + 残差，Norm  (B, 512, 7)
    重复 N 个 Mixer Layer       形状不变
    Temporal Projection: 转置 (B,7,512) → Linear(512→96) → (B,7,96) → 转置 (B,96,7)

  - 一个 time-mixing 的权重约 $512\\times 512+512\\approx$ 26.3 万；一个
    feature-mixing 约 $7\\times 64\\times 2\\approx 900$（不计偏置）。把整个
    $512\\times 7$ 展平后直接映射到 $96\\times 7$ 的全连接需要约 $3584\\times
    672\\approx$ 241 万个权重，且 $L$ 或 $C$ 一变就整体放大。
  - 注意这里 feature-mixing 的两层是 C→H→C，而 time-mixing 保持 L→L；变量之间只在
    feature-mixing 里交互，时间步之间只在 time-mixing 与 Temporal Projection
    里交互。这就是"交替混合"的含义。

### 参数规模

时间混合只有 $L\\times L$ 的权重，特征混合只有 $C\\times C$（或 $C\\times H$）的权重，因此参数随
$L$、$C$ 近似**相加**增长（论文写作 $O(L+C)$）；若把 $L\\times C$ 展平后用全连接 MLP，则是
$O(LC)$。这使 TSMixer 可以使用较长的回看窗口而不至于参数爆炸。

### TSMixer-Ext：加入辅助信息（论文第 4.2 节）

设静态特征 $S\\in\\mathbb R^{1\\times C\_s}$（如门店位置）、未来已知的时变特征 $Z\\in\\mathbb
R^{T\\times C\_z}$（如未来几周促销）。TSMixer-Ext 分 **align（对齐）** 与 **mixing（混合）**
两阶段：

    align:   历史特征 (L×Cx) --Temporal Projection + 特征混合--> 隐表示（附录公式中为 T×H）
             未来特征 Z (T×Cz) --特征混合--> (T×H)
             静态特征 S (1×Cs) --沿时间重复--> (T×Cs)，在 conditional feature mixing 中与隐状态拼接
    mixing:  拼接后的张量 → 若干个 Conditional Mixer Layer（时间混合 + 以 S 为条件的特征混合）
    output:  全连接 → 每个时间步的输出（实数预测值，或分布参数）

形状走查（按论文附录 B.3.3 的公式整理；M5 设置 L=35、T=28，H 为隐层大小）：

    目标 X (L×C) 与历史特征 X̂ (L×Cx) 沿特征维拼接 → (L×(C+Cx))
      → Temporal Projection (L→T) → (T×(C+Cx)) → CFM → X' (T×H)
    未来特征 Z (T×Cz)                        → CFM → Z' (T×H)
    拼接 X'⊕Z'                                → (T×2H)
    O1 = CMix_{2H→H}(X'⊕Z', S)  →  O_k = CMix_{H→H}(O_{k-1}, S)  (k=2..K)   形状均为 (T×H)
    最后线性层 → (T×Cy) 的预测值，或每个时间步的分布参数
    CFM(X, S): V = FR(Expand(S)) ∈ R^(·×H)；把 X 与 V 拼接后做 Feature Mixing

也就是说静态特征不单独走一条支路，而是每个条件特征混合层里都被重复到每个时间步、投影后与当前隐状态拼接，再交给
feature-mixing；未来特征与历史特征在"对齐"之后同处 T×H 的网格里，所以后续的 time-mixing 与
feature-mixing 可以同时利用两者。`[解读]` 这是它能"自然"吸收协变量的原因：协变量只是多出来的列。

要点：

  - 先把不同形状的特征"对齐"到同一形状，再拼接，之后统一用 feature-mixing 去捕捉不同类型特征之间的交互；
  - 输出可以是预测值（用 MAE/MSE 训练），也可以是目标分布的参数，如零售需求预测里常用的负二项分布（沿用 DeepAR 的做法）；
  - 论文附录 B.2：为适配 M5，TSMixer-Ext 改用 **post-normalization**（pre-norm
    在输入尺度很大时可能出现 NaN）和 **layer normalization**（batch norm
    需要很大的 batch 才能稳定）。

### 与 MLP-Mixer 的区别（论文第 4.3 节）

结构上借鉴视觉里的 MLP-Mixer（Tolstikhin et al., 2021），但：两个维度是"特征 × 时间步"而非"特征 ×
patch"；采用 2D 归一化以在特征与时间两个维度上保持尺度；并提出了处理异构输入的扩展版
TSMixer-Ext。论文称据其所知，MLP-Mixer 类架构此前未被用于时间序列预测。

## 训练与推理

  - **长序列基准**（论文第 5 节与附录 C）：回看窗口 $L=512$（沿用 PatchTST），预测长度
    $T\\in{96,192,336,720}$；Adam 优化，MSE 损失；评估指标 MSE、MAE；使用 reversible
    instance normalization（RevIN）以便与 PatchTST 公平比较；每个变量独立标准化；最多 100
    epoch，验证损失 5 个 epoch 不提升则早停。
  - **M5**：数据处理主要沿用 GluonTS 示例，预测长度 $T=28$（与竞赛一致），回看长度
    $L=35$；优化**负二项分布对数似然**；按竞赛协议在多层级聚合后用 **WRMSSE**
    评估；最多 300 epoch，30 个 epoch 不提升早停；为稳定结果，对所有模型取验证 WRMSSE 最好的 8
    组超参再各多训练 4 次（共 5 次），按平均验证 WRMSSE
    选超参，在测试集报告。论文还注意到优化其他目标函数时
    WRMSSE 可能明显更差。
  - **推理**：Temporal Projection 把 L 直接映射到 T，一次前向输出整个预测区间，不是自回归逐步生成。`[解读]`
    因此推理很快；论文 Table 6 也显示推理速度接近线性模型。
  - **超参搜索空间**（附录 Table 8，长序列基准）：学习率 {0.001, 0.0001}，mixer 块数 {1, 2, 4,
    6, 8}，dropout {0.1, 0.3, 0.5, 0.7, 0.9}，隐层大小 {8, 16, 32,
    64}（Electricity 与 Traffic 为 {64, 128, 256,
    512}）。各数据集与预测长度的最优配置差异较大，详见论文附录。

## 实验与结论

数据集（论文 Table 2）：ETTh1/h2、ETTm1/m2（变量数
7）、Weather（21）、Electricity（321）、Traffic（862）七个长序列基准，均无辅助特征；M5
含 30,490 条时间序列，14 个历史特征、13 个未来特征、6 个静态特征。

### 长序列预测基准（Table 3）

对比：多变量模型 TFT、FEDformer、Autoformer、Informer；单变量模型 LTSF-Linear、PatchTST，以及
TMix-Only。FEDformer/Autoformer/Informer/PatchTST 的数字取自 Nie et al.
(2023)。下面摘取论文 Table 3 的部分数字（MSE，$L=512$）：

| 数据集         | TSMixer $T=96$ | PatchTST $T=96$ | Linear $T=96$ | TSMixer $T=720$ | PatchTST $T=720$ | Linear $T=720$ |
| ----------- | -------------- | --------------- | ------------- | --------------- | ---------------- | -------------- |
| ETTh1       | 0.361          | 0.370           | 0.368         | 0.463           | 0.447            | 0.481          |
| ETTm2       | 0.163          | 0.166           | 0.170         | 0.420           | 0.362            | 0.435          |
| Weather     | 0.145          | 0.149           | 0.170         | 0.320           | 0.314            | 0.318          |
| Electricity | 0.131          | 0.129           | 0.135         | 0.197           | 0.197            | 0.199          |
| Traffic     | 0.376          | 0.360           | 0.395         | 0.444           | 0.432            | 0.454          |

论文表末一行给出 TSMixer 相对其他方法的平均 MSE
改进：51.94%、16.69%、24.51%、62.40%、-0.66%、6.77%、-1.53%。按渲染页面核对，它们依次对应
TFT、FEDformer、Autoformer、Informer、TMix-Only、Linear、PatchTST（TMix-Only 与
PatchTST 为负值，表示 TSMixer 略差）。

论文的结论：

  - TMix-Only 优于线性模型，说明"堆叠 + 非线性"本身有益，且与 PatchTST 相当，说明简单时间混合可以与复杂注意力打平；
  - TSMixer 显著优于其他多变量模型，与单变量的 PatchTST 相当（上表可见互有胜负，如 ETTm2 的 T=720 上
    PatchTST 明显更好）；论文称 TSMixer 是唯一能与单变量模型持平的多变量模型；
  - TSMixer 与 TMix-Only 表现相近，说明在这些基准上 feature-mixing 并无帮助；
  - **回看窗口**（$L\\in{96,336,512,720}$，Fig. 5）：线性模型在 96→336 提升明显，720
    附近趋于收敛；TSMixer 在 336 或 512 最好，增到 720 保持相近水平；论文引用 Nie et
    al. 指出多种多变量 Transformer 在窗口超过 192 后不再受益且易过拟合。

### M5：不含辅助信息（Table 4，WRMSSE，5 个随机种子均值±标准差，越低越好）

| 模型         | 多变量 | Test WRMSSE     | Val WRMSSE  |
| ---------- | --- | --------------- | ----------- |
| Linear     | 否   | 0.983±0.016     | 1.045±0.018 |
| PatchTST   | 否   | 0.976±0.014     | 0.992±0.011 |
| TMix-Only  | 否   | 0.960±0.041     | 1.000±0.027 |
| Autoformer | 是   | 0.742±0.029     | 0.640±0.023 |
| FEDformer  | 是   | 0.804±0.039     | 0.674±0.014 |
| TSMixer    | 是   | **0.737±0.033** | 0.605±0.027 |

结论：在 M5 上多变量模型远好于单变量模型；论文据此认为 PatchTST 这类忽略跨变量信息的设计在此任务上受限，与 Nie et al.
的主张相反。论文总结：TSMixer 在跨变量信息无用时能与单变量模型持平，在有用时又是利用得最好的。

### M5：含辅助信息（Table 5）

| 模型          | 静态特征 | 未来特征 | Test WRMSSE     | Val WRMSSE  |
| ----------- | ---- | ---- | --------------- | ----------- |
| DeepAR      | 是    | 是    | 0.789±0.025     | 0.611±0.007 |
| TFT         | 是    | 是    | 0.670±0.020     | 0.579±0.011 |
| TSMixer-Ext | 否    | 否    | 0.737±0.033     | 0.000±0.000 |
| TSMixer-Ext | 是    | 否    | 0.657±0.046     | 0.000±0.000 |
| TSMixer-Ext | 否    | 是    | 0.697±0.028     | 0.000±0.000 |
| TSMixer-Ext | 是    | 是    | **0.640±0.013** | 0.568±0.009 |

（前三行 TSMixer-Ext 的 Val 列在论文 PDF 渲染页中确为 0.000±0.000，论文正文未对此作说明。`[解读]`
作者没有报告这三种消融设置的验证集结果，0.000 看起来不像真实的验证 WRMSSE，建议只引用 Test
列；原因无法从论文确认。）

论文结论：带全部辅助特征时 TSMixer-Ext 超过 TFT 和 DeepAR；消融显示静态特征的影响更显著，静态与未来时变特征都有贡献。

### 计算开销（Table 6，M5，单张 V100，除 TFT 用 MXNet 外均为 PyTorch）

| 模型          | 参数量   | 训练时间 (s)  | 推理 (step/s) |
| ----------- | ----- | --------- | ----------- |
| Linear      | 1K    | 2958.18   | 110         |
| PatchTST    | 26.7K | 886.101   | 120         |
| TMix-Only   | 6.3K  | 4073.72   | 110         |
| Autoformer  | 471K  | 119087.64 | 42          |
| FEDformer   | 1.7M  | 11084.43  | 56          |
| TSMixer     | 189K  | 11077.95  | 96          |
| DeepAR      | 1M    | 8743.55   | 105         |
| TFT         | 2.9M  | 14426.79  | 22          |
| TSMixer-Ext | 244K  | 11615.87  | 108         |

论文的解读：TSMixer 比 RNN/Transformer 类模型小得多，训练时间与多变量模型相近，推理速度接近线性模型；PatchTST
推理更快，是因为它把特征维并入 batch 维，并行度更高但丢失了多变量信息。

### 与 MLP 类替代结构对比（附录 F，Table 10）

在 ETTm2 与 Weather 上，论文比较了 TSMixer、"展平后的全连接 MLP"和"1-D 卷积 + 线性层"。结论：全连接
MLP 计算开销最高且比 TSMixer 和 CNN 都差；CNN 在 Weather 上与 TSMixer 接近，在更非平稳的 ETTm2
上明显更差。论文解释：全连接 MLP 与 CNN 在每个线性操作里同时混合时间与特征信息，参数随窗口 L
增长更快，更易过拟合；TSMixer 交替做时间/特征混合，能在大窗口下保持参数量合理。

### 消融与对照一览

论文中的"消融式"对照共有以下几组，可以对应到它想回答的问题：

| 对照                                 | 在比什么                | 论文观察                                                                      |
| ---------------------------------- | ------------------- | ------------------------------------------------------------------------- |
| Linear vs TMix-Only                | 是否堆叠 + 非线性          | 论文称堆叠有益、TMix-Only 更好（长序列基准，Table 3）；M5 上 0.960 对 0.983，差距在标准差范围内（Table 4） |
| TMix-Only vs TSMixer（长序列基准）        | feature-mixing 是否有用 | 两者相近，feature-mixing 在这些基准上无明显帮助                                           |
| TMix-Only vs TSMixer（M5）           | 同上                  | 0.960 对 0.737 WRMSSE，跨变量混合带来大幅提升                                          |
| TSMixer-Ext 去掉静态 / 未来特征（Table 5）   | 辅助特征的贡献             | 静态特征影响更显著，两者都有贡献                                                          |
| 改变回看窗口 L（Fig. 5、Fig. 7）            | 能否利用长序列             | 线性与 TSMixer 均随 L 增大而改善，TSMixer 在 336/512 最好                               |
| 全连接 MLP / CNN vs TSMixer（Table 10） | 交替混合 vs 同时混合        | TSMixer 更好或相当，参数增长更慢                                                      |

## 优缺点与局限

**论文自述 / 论文结论**

  - 优点：结构简单、易实现；参数少、推理快；在常用长序列基准上，是论文所称唯一能与单变量模型持平的多变量模型；在 M5
    上取得论文报告的最优结果；可通过 TSMixer-Ext 利用静态与未来特征。
  - 自述的局限与后续方向：理论分析仅覆盖单变量的周期 +
    光滑情形；高波动、非周期非光滑序列可能不适用；未来工作包括可解释性，以及在更大数据集上的可扩展性。
  - 论文还指出：常用长序列基准可能不足以评估模型利用协变量的能力。

**`[经验]` / `[解读]`**

  - `[解读]` 时间混合的权重按位置固定，回看长度 L 在训练时固定，对变长输入不如注意力结构灵活。
  - `[解读]` Feature-mixing 的 $C\\times C$ 权重让参数随变量数 $C$ 平方增长，C
    很大（如数千个变量）时仍可能成为负担。
  - `[经验]` 全 MLP 结构的效果依赖归一化（RevIN、2D
    norm）与回看窗口的选择；不同数据集的最优超参差异明显（见论文超参表），需要调参。
  - `[待核实]` 本文未核对该论文发表后的后续独立复现或对比结果；若要引用"优于某新模型"之类说法，应查对应论文。

## 与相关方法对比

| 方法                                              | 时间建模                | 跨变量     | 辅助特征  | 与 TSMixer 的关系                                              |
| ----------------------------------------------- | ------------------- | ------- | ----- | ---------------------------------------------------------- |
| LTSF-Linear（DLinear 等）                          | 单层时间线性              | 否（通道独立） | 否     | TSMixer 的出发点；Temporal Projection 与之相同                      |
| PatchTST                                        | patch + Transformer | 否（通道独立） | 否     | 长序列基准上的单变量对手；与 TSMixer 持平                                  |
| Informer / Autoformer / FEDformer               | 注意力变体               | 是       | 否     | 论文中显著差于 TSMixer 的多变量基线                                     |
| [DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR) | RNN（自回归，概率输出）       | 是       | 是     | M5 辅助信息场景的基线；TSMixer-Ext 沿用其负二项分布做法                        |
| TFT                                             | LSTM + 注意力          | 是       | 是     | M5 上最强基线；TSMixer-Ext 略优，参数量 244K 对 2.9M                    |
| MLP-Mixer（视觉）                                   | patch 与通道的混合        | \-      | \-    | 结构灵感来源，归一化与输入布局不同                                          |
| [TCN](/0626_ML_Tasks_TimeSeries_Deep_TCN)       | 因果膨胀卷积              | 取决于实现   | 取决于实现 | `[解读]` 同属"非 RNN/非注意力"路线；论文未与之直接对比（仅在附录 F 比较了 1-D 卷积 + 线性层） |

按"权重如何依赖输入"与"是否混合变量"再拆一次（`[解读]`，综合论文第 3 节与 Table 1 的分类）：

| 方法类型                        | 对时间步的权重                 | 变量处理                                   | 参数随 L、C 的增长                               |
| --------------------------- | ----------------------- | -------------------------------------- | ----------------------------------------- |
| 线性（LTSF-Linear）             | 固定（time-step-dependent） | 各变量独立，共享时间权重                           | 约 $L\\times T$                            |
| PatchTST                    | 注意力（data-dependent）     | 变量并入 batch 维，独立处理                      | 取决于 patch 与模型宽度                           |
| 多变量 Transformer（Informer 等） | 注意力（data-dependent）     | 各时间步的变量向量一起嵌入，联合建模                     | 嵌入层与注意力宽度相关                               |
| TSMixer                     | 固定（time-step-dependent） | time-mixing 变量共享；feature-mixing 显式混合变量 | 近似 $L\\times L+C\\times C$（论文写作 $O(L+C)$） |

在综述里的位置见 [Deep 学习路线](/0606_ML_Tasks_TimeSeries_Deep)（MLP /
线性一类）与[总览](/0603_ML_Tasks_TimeSeries)；基础模型方向中基于"轻量
TSMixer"的 TTM
见[基础模型](/0608_ML_Tasks_TimeSeries_Foundation)（那是另一篇论文）。TimeMixer
为另一种方法，此处不展开。

## 使用方式

  - 论文摘要给出实现位置：`https://github.com/google-research/google-research/tree/master/tsmixer`。具体接口、依赖与训练脚本请以仓库为准，`[待核实]`
    本文未逐项核对仓库内容。
  - 若自己实现，核心就是"沿时间维的残差线性层 + 沿特征维的残差两层 MLP"。下面是极简示意（示意代码，未运行验证；省略 RevIN
    与论文的归一化细节）：

<!-- end list -->

``` python
import torch, torch.nn as nn

class MixerLayer(nn.Module):
    def __init__(self, L, C, H, drop=0.1):
        super().__init__()
        self.norm1 = nn.LayerNorm([L, C])           # 示意：对 (L, C) 整体归一化
        self.time = nn.Sequential(nn.Linear(L, L), nn.ReLU(), nn.Dropout(drop))
        self.norm2 = nn.LayerNorm([L, C])
        self.feat = nn.Sequential(nn.Linear(C, H), nn.ReLU(), nn.Dropout(drop),
                                  nn.Linear(H, C), nn.Dropout(drop))
    def forward(self, x):                           # x: (B, L, C)
        x = x + self.time(self.norm1(x).transpose(1, 2)).transpose(1, 2)  # time-mixing
        x = x + self.feat(self.norm2(x))                                  # feature-mixing
        return x

class TSMixerSketch(nn.Module):
    def __init__(self, L, T, C, H=64, n_blocks=4):
        super().__init__()
        self.blocks = nn.Sequential(*[MixerLayer(L, C, H) for _ in range(n_blocks)])
        self.proj = nn.Linear(L, T)                 # Temporal Projection: L -> T
    def forward(self, x):                           # (B, L, C) -> (B, T, C)
        return self.proj(self.blocks(x).transpose(1, 2)).transpose(1, 2)
```

  - `[经验]` 论文设置里回看窗口较长（长序列基准 $L=512$）、变量独立标准化并配合可逆实例归一化；带协变量的 M5 类任务需用
    TSMixer-Ext，并选择合适的输出分布与损失。

## Reference

  - 论文：Si-An Chen, Chun-Liang Li, Nathanael C. Yoder, Sercan Ö. Arik,
    Tomas Pfister. *TSMixer: An All-MLP Architecture for Time Series
    Forecasting*. TMLR, 2023.
    [arXiv:2303.06053](https://arxiv.org/abs/2303.06053)；OpenReview：<https://openreview.net/forum?id=wbpxTuXgm0>
  - 官方实现（论文摘要所给）：<https://github.com/google-research/google-research/tree/master/tsmixer>
  - 相关论文（均见 TSMixer 参考文献）：Zeng et al. 2023, *Are Transformers Effective
    for Time Series Forecasting?*（LTSF-Linear）；Nie et al. 2023, *A Time
    Series is Worth 64 Words*（PatchTST）；Tolstikhin et al. 2021,
    *MLP-Mixer*；Salinas et al. 2020, *DeepAR*；Lim et al. 2021, *Temporal
    Fusion Transformers*；Makridakis et al. 2022, *M5 accuracy
    competition*。
