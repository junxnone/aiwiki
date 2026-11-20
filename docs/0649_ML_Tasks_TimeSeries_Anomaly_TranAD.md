---
Title | ML Tasks TimeSeries Anomaly TranAD
-- | --
Created @ | `2026-11-19T02:27:37Z`
Updated @| `2026-11-20T08:18:59Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/649)

---
# TranAD

TranAD（Tuli, Casale, Jennings；arXiv:2201.07284；发表于 VLDB 2022，该会议信息在 arXiv 版 PDF 首页未标注，`[待核实]`）是一个面向多变量时间序列的**异常检测与诊断**模型。一句话概括：用 Transformer 同时读"当前小窗口 $W$"和"到当前时刻的完整序列 $C$"，先做一次重构，把重构偏差作为 focus score 喂回编码器再做第二次重构（self-conditioning），并让两个解码器在第二阶段对抗训练以放大微弱异常；训练里再加一步 MAML 式元学习以适应小数据；异常分数是两阶段重构误差的平均，阈值由 POT（Peak Over Threshold）自动确定。

它属于"重构类"无监督方法（只用训练序列学习正常模式，测试时看重构误差），与 [异常检测综述](/0609_ML_Tasks_TimeSeries_Anomaly) 中"对抗 / 自条件类"一族对应；更宏观的位置见 [深度学习](/0606_ML_Tasks_TimeSeries_Deep) 与 [时间序列总览](/0603_ML_Tasks_TimeSeries)。

## 1. 解决什么问题

论文在引言里列出的挑战：缺少异常标签、数据波动大、需要超低推理时间、训练数据受限、还要给出根因维度（diagnosis）。针对已有方法，论文的判断是：

- 循环模型（LSTM-NDT、OmniAnomaly 等）训练慢，难以建模长期趋势；
- USAD、MTAD-GAT、GDN 等只给模型一个固定大小的小窗口，局部上下文受限；
- 简单的 encoder-decoder 在异常与正常数据"很接近"时容易把异常也重构得很好，从而漏检。

TranAD 的对应思路：用 Transformer 并行处理整段序列（论文的说法：训练/推理时间对序列长度几乎不敏感）；用两阶段自条件把"偏差大的子序列"显式标出来；用对抗式训练放大误差。

## 2. 问题定义与预处理

多变量序列 $\mathcal T=\{x_1,\dots,x_T\}$，$x_t\in\mathbb R^{m}$（$m$ 为维度数，论文称 modality，单变量即 $m=1$）。

- **检测**：对测试序列 $\hat{\mathcal T}$ 预测 $y_t\in\{0,1\}$；
- **诊断**：预测 $y_t\in\{0,1\}^{m}$，指出哪些维度异常。

归一化用**训练集**的逐维最小/最大值（论文式 1）：

$$x_t\leftarrow\frac{x_t-\min(\mathcal T)}{\max(\mathcal T)-\min(\mathcal T)+\epsilon'}$$


其中：$x_t$ 是 $t$ 时刻的观测；$\min(\mathcal T)$ 与 $\max(\mathcal T)$ 是训练集各维度的最小与最大值；$\epsilon'$ 是防止除零的小常数。

其中 $\epsilon'$ 是防止除零的小常向量，归一化后落在 $[0,1)$。再取长度为 $K$ 的局部窗口：

$$W_t=\{x_{t-K+1},\dots,x_t\}\in\mathbb R^{K\times m}$$


其中：$W_t$ 是以 $t$ 时刻结尾、长度为 $K$ 的局部窗口；$x_{t-K+1},\dots,x_t$ 是窗口内各时间点；$m$ 是维度数。

$t<K$ 时用 replication padding 补齐到长度 $K$。训练输入是窗口序列 $\mathcal W=\{W_1,\dots,W_T\}$；$C_t$ 表示到当前时刻 $t$ 为止的序列切片。后文省略下标，写作 $W,C,O,s$。

[解读] 以 $K=10$、SMD 的 $m=38$ 为例，一个窗口 $W$ 是 $10\times 38$ 的矩阵。

## 3. 模型结构

结构见论文 Figure 1，示意如下（ASCII 图为本文自绘，对应论文的框图）：


下图概括 TranAD 的网络结构。

```
                    focus score F  (阶段1: F=0；阶段2: F=L1)
                          |
   C (完整序列) --concat--+--> [+PE] --> Encoder: MHA -> Add&Norm -> FFN -> Add&Norm --> I_1^2
                                                                                          |  (作 key / value)
   W (输入窗口) ---------------> [+PE] --> Window Encoder:                                |
                          Masked MHA -> Add&Norm -> MHA(与 I_1^2 交互，见 3.3 的说明) -> Add&Norm --> I_2^3
                                                                                          |
                                           +----------------------------------------------+
                                           |                                              |
                                  Decoder1: FFN+Sigmoid --> O_1               Decoder2: FFN+Sigmoid --> O_2 (阶段1) / O2hat (阶段2)
```

图中：

- 左上：完整序列 $C$ 与 focus score $F$（阶段 1 为 0，阶段 2 为 $L_1$）拼接，加位置编码后进入完整序列编码器，输出 $I_1^2$。
- 左下：窗口 $W$ 加位置编码，进入窗口编码器（带掩码的多头注意力，再与 $I_1^2$ 交互），输出 $I_2^3$。
- 右侧：两个解码器（FFN + Sigmoid）分别输出 $O_1$ 与 $O_2$（阶段 2 为 $\hat O_2$）。关键结论：阶段 1 的重构偏差作为 focus score 回馈给阶段 2。

### 3.1 注意力

缩放点积注意力与多头注意力（论文式 2、3）：

$$\mathrm{Attention}(Q,K,V)=\mathrm{softmax}\!\left(\frac{QK^{\top}}{\sqrt{m}}\right)V$$

$$\mathrm{MultiHeadAtt}(Q,K,V)=\mathrm{Concat}(H_1,\dots,H_h),\quad H_i=\mathrm{Attention}(Q_i,K_i,V_i)$$


其中：$Q,K,V$ 是查询、键、值；$\sqrt m$ 是缩放因子（$m$ 是维度数）；$H_i$ 是第 $i$ 个注意力头的输出；$h$ 是头数；$\mathrm{Concat}$ 把各头输出拼接。

注意论文把缩放因子写成 $\sqrt m$（$m$ 为维度数），而不是标准 Transformer 的 $\sqrt{d_k}$。[解读] 这里按论文记号照录，$m$ 大概应理解为注意力的特征维度；与实现是否一致 `[待核实]`。

### 3.2 完整序列编码器

输入 $I_1$ 是 $C$ 与 focus score $F$ 的拼接（$F$ 先广播并零填充到与 $C$ 同维度），再加位置编码（论文式 4）：

$$I_{1}^{1}=\mathrm{LayerNorm}\big(I_1+\mathrm{MultiHeadAtt}(I_1,I_1,I_1)\big)$$

$$I_{1}^{2}=\mathrm{LayerNorm}\big(I_{1}^{1}+\mathrm{FeedForward}(I_{1}^{1})\big)$$


其中：$I_1$ 是完整序列 $C$ 与 focus score $F$ 拼接后加位置编码的输入；$\mathrm{MultiHeadAtt}$ 是多头自注意力；$\mathrm{FeedForward}$ 是前馈网络；$\mathrm{LayerNorm}$ 是层归一化；$I_1^1,I_1^2$ 是各子层输出（带残差）。

### 3.3 窗口编码器

窗口 $W$ 加位置编码得到 $I_2$。窗口内的自注意力带 **mask**（不让位置看到后面的数据点；论文给出的理由是训练时整批数据一次性给出，要防止解码器偷看未来）。随后与完整序列的编码 $I_{1}^{2}$ 做交叉注意力（论文正文：$I_{1}^{2}$ 作 key 和 value、窗口表示作 query；论文式 5）：

$$I_{2}^{1}=\mathrm{Mask}\big(\mathrm{MultiHeadAtt}(I_2,I_2,I_2)\big)$$

$$I_{2}^{2}=\mathrm{LayerNorm}\big(I_2+I_{2}^{1}\big)$$

$$I_{2}^{3}=\mathrm{LayerNorm}\big(I_{2}^{2}+\mathrm{MultiHeadAtt}(I_{1}^{2},I_{1}^{2},I_{2}^{2})\big)$$


其中：$I_2$ 是窗口加位置编码；$\mathrm{Mask}$ 是屏蔽后续位置的掩码；$I_2^1,I_2^2$ 是自注意力与残差归一化后的中间量；$I_1^2$ 是完整序列编码；$I_2^3$ 是与完整序列做交叉注意力后的窗口表示；$\mathrm{LayerNorm}$ 是层归一化。

[解读] 式 5 最后一行的参数顺序（按 $(Q,K,V)$ 读，$I_{1}^{2}$ 在 query、key 位置，$I_{2}^{2}$ 在 value 位置）与正文文字（完整序列编码作 key 和 value，窗口表示作 query）并不一致，可能是论文的笔误；本文公式按论文原样照录，文字描述按正文，具体实现 `[待核实]`（官方代码）。

### 3.4 两个解码器

两个结构相同的解码器（论文式 6）：

$$O_i=\mathrm{Sigmoid}\big(\mathrm{FeedForward}(I_{2}^{3})\big),\quad i\in\{1,2\}$$


其中：$I_2^3$ 是窗口编码器的输出；$\mathrm{FeedForward}$ 是前馈网络；$\mathrm{Sigmoid}$ 把输出限制在 $[0,1]$；$O_i$ 是第 $i$ 个解码器的重构，两个解码器结构相同。

Sigmoid 把输出限制在 $[0,1]$，与归一化后的输入匹配。因此模型输入 $(C,W)$，输出 $O_1,O_2$。

## 4. 两阶段推理与训练目标

### 4.1 Focus score 与 self-conditioning

- **阶段 1（输入重构）**：$F=\vec 0$，得到粗略重构 $O_1,O_2$；
- **阶段 2（聚焦重构）**：取第一个解码器的重构误差作为 focus score，$F=L_1=\lVert O_1-W\rVert_2$，重新跑一遍模型，得到第二个解码器的输出 $\hat O_2$。

论文的解释：阶段 1 的偏差作为先验去调制阶段 2 编码器里的注意力权重，让网络对偏差大的子序列产生更高的激活。论文称此为 self-conditioning，并列出三点好处：放大偏差（便于打分）、通过窗口编码器捕捉短期趋势以减少误报、对抗式训练提升泛化。

[解读] 论文用 $\lVert\cdot\rVert_2$ 的记号写 $F$，但 $F$ 要与 $W$ 同形（$K\times m$，论文称 $F$ 初始是与 $W$ 同维度的零矩阵），所以按逐元素的误差理解较自然；是否取平方等细节 `[待核实]`（官方代码）。

### 4.2 损失函数

阶段 1 的重构损失（式 7）：

$$L_1=\lVert O_1-W\rVert_2,\quad L_2=\lVert O_2-W\rVert_2$$


其中：$O_1,O_2$ 是第一阶段两个解码器的重构；$W$ 是输入窗口；$L_1,L_2$ 是各解码器的重构损失（L2 范数）。

阶段 2 的对抗目标：$D_2$ 试图**最大化** $\lVert\hat O_2-W\rVert_2$（把"带 focus 的重构"与真实输入区分开），$D_1$ 试图通过完美重构（使 focus score 退化为零向量）来"骗过" $D_2$，即最小化它（式 8、9）：

$$\min_{D_1}\ \max_{D_2}\ \lVert\hat O_2-W\rVert_2$$

$$L_1=+\lVert\hat O_2-W\rVert_2,\quad L_2=-\lVert\hat O_2-W\rVert_2$$


其中：$D_1,D_2$ 是两个解码器；$\hat O_2$ 是第二阶段第二解码器的重构；$W$ 是输入窗口；$D_2$ 要最大化重构误差（区分带 focus 的重构与真实输入），$D_1$ 要最小化它，二者对抗；两个损失符号相反。

两部分合成"演化"损失（式 10，Algorithm 1 第 7-8 行）：

$$L_1=\epsilon^{-n}\lVert O_1-W\rVert_2+(1-\epsilon^{-n})\lVert\hat O_2-W\rVert_2$$

$$L_2=\epsilon^{-n}\lVert O_2-W\rVert_2-(1-\epsilon^{-n})\lVert\hat O_2-W\rVert_2$$


其中：$\epsilon^{-n}$ 是随 epoch $n$ 指数衰减的权重（$\epsilon$ 为大于 1 的常数）；$O_1,O_2$ 是第一阶段输出，$\hat O_2$ 是第二阶段输出；$W$ 是输入窗口；训练前期重构项权重大，后期对抗项权重大。

$n$ 是训练 epoch。训练初期重构损失权重大（此时重构质量差，focus score 不可靠，对抗项不能一开始就压上去以免训练不稳定）；随着 $n$ 增大，权重 $\epsilon^{-n}$ 指数衰减，对抗项逐渐占主导。论文文字里把 $\epsilon$ 描述为"接近 1 的训练参数"，又在后面称其为"small positive constant"，具体取值论文正文未给出 `[待核实]`。

自拟示意算例（非论文数据）：若取 $\epsilon=1.1$（仅为演示，非论文取值），则 $n=0$ 时 $\epsilon^{-n}=1$，对抗项权重为 $0$；$n=10$ 时 $1.1^{-10}\approx0.386$，对抗项权重约 $0.614$；$n=30$ 时 $1.1^{-30}\approx0.057$，对抗项权重约 $0.943$。

### 4.3 元学习（MAML）

论文在每个 epoch 末尾加一步元学习（Algorithm 1 第 11 行，"用一个随机 batch"）。记普通梯度更新（式 11）和元更新（式 12）：

$$\theta'\leftarrow\theta-\alpha\nabla_\theta L\big(f(\theta)\big)$$

$$\theta\leftarrow\theta-\beta\nabla_\theta L\big(f(\theta')\big)$$


其中：$\theta$ 是模型参数；$\theta'$ 是一步梯度更新后的参数；$\alpha$ 是学习率；$\beta$ 是 meta 步长；$L(f(\theta))$ 是模型损失；先求更新后参数处的梯度，再回到原参数 $\theta$ 上更新。

其中 $\alpha$ 为学习率，$\beta$ 为 meta step-size。论文的用意是让模型在训练数据有限时仍能学到趋势。[解读] 从公式看这是形式上的一阶 MAML 更新：在更新后的权重 $\theta'$ 处求梯度再回到 $\theta$ 上更新；论文没有描述任务（task）如何划分，所以与经典 few-shot 元学习设置并不完全相同。

### 4.4 训练整体流程

Algorithm 1 的要点：对每个窗口 $W_t$ 跑阶段 1 得到 $O_1,O_2$，用 $\lVert O_1-W_t\rVert_2$ 作 focus 跑阶段 2 得到 $\hat O_2$，按式 10 更新 $E,D_1,D_2$；每个 epoch 末做一次元学习。训练不要求数据按时间顺序送入，因此可以把整段序列拆成 $(W,C)$ 对并行训练（窗口编码器里的 mask 保证不泄露未来）。训练用 80% 数据训练、20% 验证，验证精度开始下降时早停。

## 5. 推理：异常分数与 POT 阈值

测试时同样跑两阶段（Algorithm 2），异常分数为两部分重构误差的平均（式 13）：

$$s=\frac12\lVert O_1-\hat W\rVert_2+\frac12\lVert\hat O_2-\hat W\rVert_2$$


其中：$s$ 是异常分数；$O_1$ 是第一阶段第一解码器的重构，$\hat O_2$ 是第二阶段第二解码器的重构；$\hat W$ 是测试窗口；$\lVert\cdot\rVert_2$ 是 L2 范数；分数是两阶段重构误差的平均。

逐维度的分数 $s_i$ 与 POT 阈值比较，任一维度超阈即判整个时间戳异常（式 14）：

$$y_i=\mathbb 1\big(s_i\ge \mathrm{POT}(s_i)\big),\qquad y=\bigvee_i y_i$$


其中：$y_i$ 是第 $i$ 个维度的异常判定；$s_i$ 是该维度的异常分数；$\mathrm{POT}(s_i)$ 是用极值理论确定的阈值；$\mathbb 1(\cdot)$ 是指示函数；$y$ 是对所有维度取"或"的整体判定（任一维度异常则该时间戳异常）。

$y_i$ 直接给出**诊断**结果（哪些维度异常），$y$ 是**检测**结果。POT 是基于极值理论（EVT）的方法：用广义帕累托分布拟合分数分布的尾部，据此动态选阈值。论文还试过另一种 EVT 方法 annual maximum（AM），称使用 POT 的 F1 平均高 7.2%。POT 参数：coefficient $=10^{-4}$（所有数据集），low quantile 为 SMAP 0.07、MSL 0.01、其余 0.001，沿用 OmniAnomaly 的实现。

论文 Figure 3 在 SMD 上可视化了注意力权重与 focus score：focus score 与数据中的尖峰/噪声高度相关，突变处更高。

[解读] 阶段 2 在测试时仍需先跑阶段 1，所以推理成本是约两次前向。Algorithm 2 第 3 行的写法同时列出了 $D_1$ 与 $D_2$ 的阶段 2 输出，而式 13 只用 $\hat O_2$，本文按式 13 理解 `[待核实]`。

## 6. 实验设置

**超参**（论文 4 节开头）：窗口 $K=10$；Transformer 编码器 1 层；编码器中 feed-forward 2 层；隐层 64 单元；dropout 0.1；AdamW，初始学习率 0.01，meta 学习率 0.02，step scheduler（step size 0.5）；多头数等于数据集维度数（论文说唯一与数据集相关的超参），其余超参用网格搜索。PyTorch 1.7.1。

**数据集**（论文 Table 1，共 9 个；正文写"seven"、摘要写"six"，但实际列出 9 个）：

数据集 | 训练长度 | 测试长度 | 维度（序列数） | 异常 %
-- | -- | -- | -- | --
NAB | 4033 | 4033 | 1 (6) | 0.92
UCR | 1600 | 5900 | 1 (4) | 1.88
MBA | 100000 | 100000 | 2 (8) | 0.14
SMAP | 135183 | 427617 | 25 (55) | 13.13
MSL | 58317 | 73729 | 55 (3) | 10.72
SWaT | 496800 | 449919 | 51 (1) | 11.98
WADI | 1048571 | 172801 | 123 (1) | 5.99
SMD | 708405 | 708420 | 38 (4) | 4.16
MSDS | 146430 | 146430 | 10 (1) | 5.37

表中：「数据集」是评测集；「训练长度」「测试长度」是时间步数；「维度（序列数）」是变量数与序列条数；「异常 %」是测试集异常占比。

括号内是序列数，多序列数据集报告各序列的平均分。论文对数据集做了筛选：NAB 排除 nyc-taxi（标签有误）；UCR 只用 InternalBleeding 和 ECG 等自然来源序列；MSL 只用 A4、C2、T1 三条非平凡序列；SMD 只用 machine-1-1、2-1、3-2、3-7；不用 Yahoo。论文自己也承认对基准数据集质量有同样的担忧。

**基线**：MERLIN、LSTM-NDT、DAGMM、OmniAnomaly、MSCRED、MAD-GAN、USAD、MTAD-GAT、CAE-M、GDN。

**指标**：检测用 precision、recall、AUC（ROC）、F1；另把基线和 TranAD 都只用 20% 训练数据重新训练（五组 20% 数据取平均），得到 AUC* 与 F1*，衡量小数据表现。诊断用 HitRate@P% 与 NDCG@P%（P=100、150）。

## 7. 实验结果

以下数字均取自论文 Table 2、3、4、5、6（对着渲染页核对）。

### 7.1 检测

论文称 TranAD 在平均 F1 上为 0.8802、F1* 为 0.8012；除 MSL（GDN 的 F1 最高，0.9591）外，完整训练数据下各数据集 F1 最高；20% 数据下除 WADI 外最高（论文正文说 WADI 上 F1* 最高的是 OmniAnomaly 的 0.1017，但对着 Table 3 渲染页，WADI 的 F1* 加粗的是 MERLIN 的 0.1174，高于 OmniAnomaly 的 0.1017，论文正文与表格不一致）；AUC 最高的数据集除 MSDS（GDN 0.9105）外均为 TranAD。论文称相对最强基线 F1 最多提高 17.06%、F1* 最多提高 14.64%、AUC 最多提高 11.69%、AUC* 最多提高 11.06%。

下表摘取 TranAD 与 USAD、GDN、OmniAnomaly 的 F1（完整数据，Table 2）与 F1*（20% 数据，Table 3）：

数据集 | TranAD F1 | USAD F1 | GDN F1 | Omni F1 | TranAD F1* | USAD F1* | GDN F1* | Omni F1*
-- | -- | -- | -- | -- | -- | -- | -- | --
NAB | 0.9364 | 0.7442 | 0.7998 | 0.7442 | 0.8421 | 0.6781 | 0.7013 | 0.6713
UCR | 0.9694 | 0.9447 | 0.8158 | 0.9098 | 0.9399 | 0.8538 | 0.8029 | 0.7918
MBA | 0.9780 | 0.9443 | 0.9332 | 0.9225 | 0.9617 | 0.9425 | 0.9316 | 0.9217
SMAP | 0.8915 | 0.8419 | 0.8518 | 0.8728 | 0.8889 | 0.8379 | 0.8411 | 0.8131
MSL | 0.9494 | 0.8822 | 0.9591 | 0.8765 | 0.9172 | 0.8190 | 0.8959 | 0.8424
SWaT | 0.8151 | 0.8143 | 0.8101 | 0.8131 | 0.8094 | 0.8087 | 0.8072 | 0.7433
WADI | 0.4951 | 0.3056 | 0.4260 | 0.4260 | 0.0649 | 0.0733 | 0.0412 | 0.1017
SMD | 0.9605 | 0.9495 | 0.8342 | 0.9401 | 0.9478 | 0.9213 | 0.7107 | 0.9352
MSDS | 0.9262 | 0.8829 | 0.8900 | 0.8867 | 0.8391 | 0.8389 | 0.8389 | 0.8389

表中：「数据集」是评测集，前四列是完整训练数据下 TranAD、USAD、GDN、OmniAnomaly 的 F1，后四列是 20% 训练数据下的 F1*（越大越好）。结论：TranAD 在多数数据集上最优，WADI 对所有方法都难，MSL 上 GDN 更好。

读表的两点 [解读]：SWaT、MSDS 上差距很小（小数点后第三位），WADI 上所有方法的 F1 都低，F1* 更是接近零（0.04-0.10），论文自己也说 WADI 对所有模型都难。另一点见 §9：这些 F1 取决于评估协议。

论文还做了 Friedman 检验后的 Wilcoxon 成对符号秩检验（$\alpha=0.05$）的 critical difference 图（Figure 4），称 TranAD 排名最佳且差异显著。

### 7.2 诊断

Table 4 仅给出 SMD 与 MSDS（论文说 TranAD 在其余数据集上也更好，但未列出）：

数据集 | H@100% | H@150% | N@100% | N@150%
-- | -- | -- | -- | --
SMD（TranAD） | 0.4981 | 0.6401 | 0.4941 | 0.6178
MSDS（TranAD） | 0.4630 | 0.7533 | 0.5981 | 0.6963

表中：「数据集」是 SMD 与 MSDS，H@100% / H@150% 是 HitRate@P%，N@100% / N@150% 是 NDCG@P%（P 为取前几个维度的比例，越大越好），衡量定位异常根因维度的能力。

在 SMD 上 MERLIN 的 H@100% 为 0.5907、CAE-M 的 N@100% 为 0.5474，均高于 TranAD；MSDS 上 MTAD-GAT 的 H@100% 为 0.5812 同样更高。论文的总结是 TranAD 平均提升诊断分数 4.25%，能定位 46.3%-75.3% 的根因。

### 7.3 训练时间

Table 5 是每 epoch 秒数。论文称 TranAD 比基线低 75%-99%。与 USAD 的对比（秒/epoch）：

数据集 | NAB | UCR | MBA | SMAP | MSL | SWaT | WADI | SMD | MSDS
-- | -- | -- | -- | -- | -- | -- | -- | -- | --
TranAD | 1.25 | 0.84 | 4.08 | 3.55 | 5.27 | 0.87 | 115.91 | 43.56 | 17.15
USAD | 31.21 | 21.10 | 120.86 | 23.63 | 21.22 | 22.72 | 242.86 | 250.97 | 232.82

表中：各列是数据集，两行分别是 TranAD 与 USAD 的每个 epoch 训练时间（秒，越小越快）。结论：TranAD 在所有数据集上都更快，但相对幅度因数据集而异。

注意 MERLIN 在 MSL 上为 5.12 秒，比 TranAD 的 5.27 更低（MERLIN 的"训练时间"是发现 discord 的时间，无需训练）。

[解读] 自行用上表数字核算：WADI 上 TranAD 相对 USAD 只低约 52%（$1-115.91/242.86\approx0.52$），低于论文概括的"75%-99%"区间；这个区间应理解为各数据集上相对多数基线的幅度，不是每个格子都成立（再如 WADI 上 MERLIN 为 132.69，TranAD 只低约 12.6%）。

### 7.4 消融（Table 6）

论文分别去掉：Transformer（换成前馈网络）、self-conditioning（阶段 2 固定 $F=\vec 0$）、对抗训练（单阶段推理，仅重构损失）、MAML。论文的总结：

- 去掉 Transformer：F1 平均降约 11%，WADI 降 56%；
- 去掉 self-conditioning：F1 平均降 6%；
- 去掉对抗训练：F1 平均降 5%，主要影响 SMD、WADI（论文解释这两个数据集含较多温和异常）；
- 去掉 MAML：F1 变化约 1%，F1* 降近 12%。

几个具体格子：WADI F1 从 0.4951 降到 0.2181（去 Transformer）；MSL 的 F1* 从 0.9172 降到 0.6732（去 MAML）；SMD 的 F1* 从 0.9478 降到 0.8164（去 MAML）。

### 7.5 敏感性

Figure 6：训练数据比例从 20% 到 100%，TranAD 在每个比例上 F1 更高、训练时间更低。Figure 7：窗口大小 5/10/50/100/500；窗口太小上下文不足，太大则短异常被稀释；论文选 10 作为 F1 与训练时间的折中。

## 8. 与相关方法的对比

方法 | 结构 | 与 TranAD 的区别（来源）
-- | -- | --
USAD | 自编码器 + 两个解码器 + 对抗式训练 | 论文：简单的自编码器、以降低开销为目标；仅用局部窗口。TranAD 在其基础上换成 Transformer 并加 focus score 两阶段
OmniAnomaly | 随机 RNN（类 LSTM-VAE）+ 归一化流 | 论文：训练时间长；TranAD 沿用其 POT 阈值方案
GDN | 图结构学习 + 注意力预测 | 论文：MSL、MSDS 上略优于 TranAD，认为得益于可扩展的跨维度图推理
MTAD-GAT | 图注意力 + GRU | 论文：只用局部窗口
Anomaly Transformer | Transformer + 关联差异（association discrepancy） | [解读] 同属 Transformer 异常检测，但打分依据不同（关联差异 vs 两阶段重构误差）；综述见 [异常检测](/0609_ML_Tasks_TimeSeries_Anomaly)

表中：「方法」是对比对象，「结构」概述其网络，「与 TranAD 的区别（来源）」说明区别及依据。结论：TranAD 在 USAD 基础上换成 Transformer 并引入 focus score 两阶段，打分依据与 Anomaly Transformer 不同。

## 9. 评估协议与陷阱

**论文的评估协议**：窗口重构 → 逐维异常分数 → POT 阈值 → 二值标签 → 与真值比较，计算 P/R/F1 和 AUC；多序列数据集取各序列平均；TranAD 的 F1 是在 POT 阈值（参数沿用 OmniAnomaly）下得到的。论文正文**没有**说明是否对预测做 point-adjust（PA）。

[解读] 值得注意的现象：Table 2 里多数数据集上 TranAD 乃至多个基线的 recall 都接近 1（TranAD 在 UCR、MBA 为 1.0000，NAB 为 0.9892，SMAP、MSL 为 0.9999，SMD 为 0.9974），此时 F1 主要由 precision 决定（例如 SMAP 的 precision 为 0.8043、WADI 为 0.3529）；SWaT 上 TranAD 之外的多个基线 recall 还完全相同（0.6957）。这类"召回近乎满分、多方法同值"的模式与在异常区间内做 PA 后的结果相符，但论文没有写，**是否使用 PA 需对着官方代码确认 `[待核实]`**。

综述（[异常检测 §5.1](/0609_ML_Tasks_TimeSeries_Anomaly)）引用 Kim et al.（arXiv:2109.05257）指出：PA 有很大可能高估性能，随机异常分数也可能被 PA 变成"最先进"，PA 下的排名会误导。因此 [经验] 阅读 TranAD 这类论文里的 F1 时：

1. 不要把其绝对数值与"不做 PA"的结果（如 Audibert 等的评测，综述中记作 arXiv:2204.01637）直接比较；
2. 论文与基线都用同一协议、同一阈值方案，**相对排序**有参考价值，但仍受协议影响；
3. 论文自述的数据集问题（NAB 标签错误、MSL 平凡序列、Yahoo 的标注问题）说明基准本身有缺陷；
4. 复现时建议同时报告不做 PA 的点级 $F_1$、事件级指标、AUC-PR 以及检出延迟（综述 5.4 的检查清单）。

## 10. 优缺点与局限

**论文自述的优势**：训练/推理快（并行 Transformer）、小数据表现好（MAML）、能放大温和异常（对抗 + focus score）、同时给出诊断结果。

**论文自述的局限或承认的现象**：WADI 上各方法都弱；GDN 在 MSL、MSDS 上更好；OmniAnomaly 在 WADI 20% 数据下更好；窗口过大会稀释短异常；未来工作提出尝试双向 Transformer 以及按部署场景做组件的成本收益分析。

**[经验] 使用上的注意**（以下不是论文结论）：

- 异常分数依赖重构误差，对"趋势/周期缓慢偏移"类异常是否敏感，论文没有专门实验；
- POT 的 low quantile 在论文里按数据集设定（SMAP 0.07、MSL 0.01），迁移到新数据集需要重新选，且不应用测试标签调参；
- 阶段 2 依赖阶段 1，推理约两次前向；
- 论文消融显示 MAML 对 F1* 贡献很大，但元学习的细节（任务划分）论文没有展开，复现时要看代码。

## 11. 使用方式

官方代码：论文 Software Availability 给出 https://github.com/imperialqore/TranAD（BSD-3 许可证，论文自述）。命令行用法请以仓库 README 为准 `[待核实]`。下面是训练一步的逻辑示意（示意代码，未运行验证；`model` 假设返回给定 focus 的 $(O_1,O_2)$ 或 $\hat O_2$）：

```python
# 示意代码，未运行验证
for n in range(num_epochs):                          # n: epoch
    w = eps ** (-n)                                  # eps 取值论文正文未给出
    for W, C in loader:
        O1, O2 = model(C, W, focus=zeros_like(W))    # 阶段1
        focus = (O1 - W) ** 2                        # focus score（逐元素，具体形式待核实）
        _, O2_hat = model(C, W, focus=focus)         # 阶段2，只取第二个解码器输出
        loss1 = w * mse(O1, W) + (1 - w) * mse(O2_hat, W)
        loss2 = w * mse(O2, W) - (1 - w) * mse(O2_hat, W)
        update(encoder_and_decoders, loss1, loss2)   # 论文用 L1、L2 分别更新 D1、D2，编码器如何同时更新以论文为准
    meta_step(model, random_batch)                   # 每个 epoch 末的元学习一步
# 推理: s = 0.5*mse(O1, W) + 0.5*mse(O2_hat, W)，逐维与 POT 阈值比较
```

## Reference

- Tuli, Casale, Jennings. TranAD: Deep Transformer Networks for Anomaly Detection in Multivariate Time Series Data. arXiv:2201.07284, https://arxiv.org/abs/2201.07284
- 官方代码（论文 Software Availability）：https://github.com/imperialqore/TranAD
- Kim et al. 对 point-adjust 的批评：https://arxiv.org/abs/2109.05257


