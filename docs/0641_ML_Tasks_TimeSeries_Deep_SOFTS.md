---
Title | ML Tasks TimeSeries Deep SOFTS
-- | --
Created @ | `2026-11-19T02:00:06Z`
Updated @| `2026-11-19T06:20:36Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/641)

---
# SOFTS

SOFTS（Series-cOre Fused Time Series forecaster）是南京大学团队提出的多变量时间序列预测模型（论文 *SOFTS: Efficient Multivariate Time Series Forecasting with Series-Core Fusion*，Lu Han, Xu-Yang Chen, Han-Jia Ye, De-Chuan Zhan，NeurIPS 2024，arXiv 2404.14197）。它的核心是 STAR（STar Aggregate-Redistribute）模块：先把所有变量（channel）的表示聚合成一个全局 core，再把 core 分发并融合回每个变量，用"星形"结构代替变量间两两注意力。论文把 SOFTS 称为 MLP-based 模型。

一句话概括：**每个变量的整条回看序列嵌入成一个 token，用 MLP + 池化得到全局 core，再拼回各变量做融合，通道间交互复杂度从 $O(C^2)$ 降到 $O(C)$。**

SOFTS 在 [时间序列总览](/0603_ML_Tasks_TimeSeries) 与 [深度学习方法](/0606_ML_Tasks_TimeSeries_Deep) 中都被简要提及（"序列核心融合、降低变量间交互成本"）。同系列的 DLinear、TSMixer、TimeMixer 等文章只在对比处提到名字。

> 标注约定：未标注的内容来自论文；`[解读]` 是作者对论文的理解；`[经验]` 是一般经验；`[自拟示意]` 是为说明而自己编的数字（已重算）。

## 解决什么问题

多变量预测里"变量之间要不要交互"是个长期矛盾（论文引言与相关工作的叙述）：

路线 | 代表 | 优点 | 论文指出的问题
-- | -- | -- | --
通道混合（channel mixing） | 早期 Informer / Autoformer / FEDformer 类 | 一次性融合所有变量 | 对分布漂移脆弱，常不如简单线性模型
通道独立（CI） | PatchTST、SegRNN 等 | 鲁棒、简单 | 忽略变量间相关性，限制进一步提升
注意力建模变量相关性 | iTransformer、Crossformer | 精度好 | 对变量数 $C$ 二次复杂度；"分布式"结构依赖每个变量的质量，遇到异常变量不稳
MLP / Mixer 建模 | TSMixer 等 | 简单高效 | 变量很多时通常不及 SOTA Transformer 方法

SOFTS 的目标是同时拿到：CI 的鲁棒性、变量间的信息交换、对 $C$ / $L$ / $H$ 的线性复杂度。

## 核心思想与结构

### 中心化 vs 分布式交互

论文借用软件工程里的星形（client-server）系统类比：注意力、GNN、Mixer 是**分布式**交互（变量两两直接比较）；STAR 是**中心化**交互——所有变量先汇总到一个"服务器"（core），再由 core 把全局信息发回每个变量，变量之间只通过 core **间接**交互。

```
分布式（Attention / GNN / Mixer）      中心化（STAR）

   s1 ---- s2                            s1      s2
    | \  /  |                              \    /
    |  \/   |                               core
    |  /\   |                              /    \
   s3 ---- s4                            s3      s4
 C(C-1)/2 条两两连接                      C 条 "变量<->core" 连接
```

论文的论点：中心化既降低复杂度，也降低对单个变量质量的依赖（聚合了所有通道的统计量）。后一点是论文的论证加实验现象（见"实验"一节的噪声/T-SNE 实验），不是严格证明。

### 整体流程

输入 $X\in\mathbb R^{C\times L}$（$C$ 个变量，回看窗口 $L$），输出 $\hat Y\in\mathbb R^{C\times H}$（$H$ 为预测长度）。

```
X --RevIN--> 序列嵌入 Linear(L->d) --> S0 (C×d)
  --> STAR × N 层 (S_i = STAR(S_{i-1})) --> S_N (C×d)
  --> Linear(d->H) --> 反归一化 --> Ŷ (C×H)
```

- **Reversible instance normalization**：每条序列去均值、缩放到单位方差，预测后反向还原。PEMS 数据集按效果选择性地使用（沿用 iTransformer 的做法）。
- **Series embedding**：一个线性层把每个变量的整条回看序列映射为 d 维向量（相当于 patch 长度取整条序列的极端情形），不产生额外的 patch 维度，所以比 patch embedding 更省。
- **Channel interaction**：N 层 STAR。
- **Linear predictor**：$\mathbb R^d\to\mathbb R^H$ 的线性头。

论文算法 1 是把输入转置后做上述计算，最后再转置回 $H\times C$。

### STAR 模块

$$
\begin{aligned}
o_i &= \mathrm{StochPool}\left(\mathrm{MLP}_1(S_{i-1})\right) && \text{聚合得到 core } o_i\in\mathbb R^{d'} && (3)\\
F_i &= \mathrm{RepeatConcat}(S_{i-1},\,o_i) && \text{core 复制 } C \text{ 份拼到每个变量，} F_i\in\mathbb R^{C\times(d+d')} && (4)\\
S_i &= \mathrm{MLP}_2(F_i)+S_{i-1} && \text{融合 + 残差，} S_i\in\mathbb R^{C\times d} && (5)
\end{aligned}
$$

- $\mathrm{MLP}_1:\mathbb R^d\to\mathbb R^{d'}$：两层，隐藏维 $d$，GELU 激活。
- `Stoch_Pool`：沿通道维（$C$）池化，把 $C$ 个 $d'$ 维向量压成 1 个 $d'$ 维 core。
- $\mathrm{MLP}_2:\mathbb R^{d+d'}\to\mathbb R^d$：融合后投影回 $d$ 维。
- $d'$ 是 core 维度，论文搜索时要求不超过 $d$。

`[解读]` 每层 STAR 里，各变量拿到的 core 是同一个向量，不同变量的差别只来自它自己的 $S_{i-1}$（拼接部分与残差）。因此交互的"信息带宽"受 $d'$ 限制，这也对应论文局限里"依赖 core 表示质量"。

### 随机池化（Stochastic Pooling）

设池化输入为 $A\in\mathbb R^{C\times d'}$。对每个特征维 $j$，在通道维上做 softmax：

$$
p_{ij}=\frac{\exp(A_{ij})}{\sum_{k=1}^{C}\exp(A_{kj})}\tag{6}
$$

训练：按 $(p_{1j},\dots,p_{Cj})$ 采样一个通道 $c$，

$$
o_j=A_{cj}\tag{7}
$$

测试（概率加权平均）：

$$
o_j=\sum_{i=1}^{C}p_{ij}\,A_{ij}\tag{8}
$$

训练时随机选一个通道、测试时加权平均，兼具 max（偏向大激活）和 mean（用到所有通道）的特点，训练时还带有随机正则的效果（`[解读]`：后一点是对 Zeiler & Fergus 原思想的转述）。

`[自拟示意]` 取 $C=3$、某一特征维上的激活 $A=[0,1,2]$：$e^0=1$，$e^1\approx 2.718$，$e^2\approx 7.389$，和 $\approx 11.107$，得 $p\approx[0.090,\,0.245,\,0.665]$（和为 1）。测试时输出 $\approx 0\times0.090+1\times0.245+2\times0.665\approx 1.575$；对比 mean $=1.0$、max $=2$。训练时则分别以 9.0% / 24.5% / 66.5% 的概率输出 0 / 1 / 2。

### core 的设计来源

论文把 core 定义为 $o=f(s_1,\dots,s_C)$（Definition 3.1，$f$ 为任意函数），并参考两个定理：Kolmogorov-Arnold 表示定理（内层变换依赖坐标，不具置换不变性）和 DeepSets（$\sum_x \phi(x)$ 的置换不变形式）。论文选择 DeepSets 形式，并做了两点修改：

1. 把对内层变换的求和/均值推广为任意池化；
2. 去掉外层变换 $\rho$，因为它与后面的融合 MLP 冗余。

论文附录称置换不变形式明显优于置换可变形式（原文引用的表号与正文 Table 4 对不上，这里只转述结论，不引数字，`[待核实]` 具体对应哪张表）。

## 复杂度与"STAR vs 注意力"

### 论文给出的分析

记窗口长度 $L$、变量数 $C$、模型维度 $d$、预测长度 $H$。归一化 $O(CL)$，嵌入 $O(CLd)$；STAR 中（设 $d'=d$）$\mathrm{MLP}_1$ 为 $O(Cd^2)$，`Stoch_Pool` 的 softmax 为 $O(Cd)$，$\mathrm{MLP}_2$ 为 $O(Cd^2)$；预测头 $O(CdH)$。整个编码部分 $O(CLd+Cd^2+CdH)$，对 $C$、$L$、$H$ 都是线性。把 $d$ 当常数忽略后，与其他方法对比（论文 Table 1）：

模型 | 复杂度
-- | --
SOFTS | $O(CL+CH)$
iTransformer | $O(C^2+CL+CH)$
PatchTST | $O(CL^2+CH)$
Transformer | $O(CL+L^2+HL+CH)$

### 为什么 STAR 是线性的

- 注意力要算 $C\times C$ 的相关矩阵：每对变量一个分数，$QK^\top$ 和 $AV$ 各约 $C^2d$ 次乘加。
- STAR 没有"变量对变量"的运算：聚合是对 $C$ 行逐特征做一次 softmax 加权求和（$Cd$），分发是把同一个 core 拼到每一行，其余都是对每行独立的 MLP（$Cd^2$）。变量数翻倍，计算量只翻倍。

### 带数字的例子

`[自拟示意]`（以下数字均为本文自拟的粗略乘加计数，只计"变量交互"部分，忽略 QKV 投影、FFN、嵌入与预测头；论文没有给这些数字）：

- 注意力：约 $2C^2d$（$QK^\top$ 与 $AV$ 各 $C^2d$）。
- STAR：取 $d'=d$，$\mathrm{MLP}_1$ 两层约 $2Cd^2$（$\mathrm{MLP}_2$ 层数论文正文未明说，不计入）；池化 $Cd$ 量级更小，忽略。
- 两者之比 $\approx \dfrac{2C^2d}{2Cd^2}=\dfrac{C}{d}$。

取 $d=128$：

$C$ | 注意力 $2C^2d$ | STAR 的 $\mathrm{MLP}_1$：$2Cd^2$ | 比值
-- | -- | -- | --
862（Traffic 的变量数） | $2\times862^2\times128\approx1.90\times10^8$ | $2\times862\times128^2\approx2.82\times10^7$ | $\approx 6.7$
5000 | $2\times5000^2\times128=6.4\times10^9$ | $2\times5000\times128^2\approx1.64\times10^8$ | $\approx 39$

重算检查：$862^2=743{,}044$，$\times256=190{,}219{,}264$；$862\times2\times16{,}384=28{,}246{,}016$；比 6.73。$5000^2\times256=6.4\times10^9$；$5000\times2\times16{,}384=163{,}840{,}000$；比 39.06。

要点：
- 从 $C=862$ 到 5000，变量数增长 5.8 倍，注意力项增长 $5.8^2\approx33.6$ 倍，STAR 项只增长 5.8 倍。
- 两者交叉点在 $C\approx d$ 附近：变量数远小于 $d$ 时（如 ETT 只有 7 个变量），二次项本身并不是瓶颈，STAR 在算力上没有优势，它的收益主要来自精度/鲁棒性（`[解读]`）。例如 $d=512$、$C=862$ 时比值只有 $862/512\approx1.7$。
- 论文的内存实验与此一致：合成数据上变量数增加（横轴到 5000），PatchTST 与 iTransformer 的显存明显增长，SOFTS 近似线性增长（Figure 3a，batch size 16，L = 96，H = 720；这里只引述趋势，不引具体 MB 数）。

## 训练与推理

- 优化：Adam，初始学习率 $3\times10^{-4}$，cosine 学习率调度，MSE 损失；单卡 NVIDIA RTX 3090（24G）。
- 超参搜索：$N\in\{1,2,3,4\}$，$d\in\{128,256,512\}$，$d'\in\{64,128,256,512\}$（$d'\le d$）。batch size、epoch、dropout 等论文正文与附录 B.3 未见说明，`[待核实]`（可查官方代码）。
- 设置：回看窗口 $L=96$；horizon：PEMS 为 $\{12,24,48,96\}$，其余数据集为 $\{96,192,336,720\}$；报告各 horizon 平均的 MSE/MAE。
- 推理：确定性。Stoch_Pool 在训练时采样、推理时用概率加权平均，不需要多次采样。

## 实验与结论

数据集（论文 Appendix A）：ETT（ETTh1/h2/m1/m2，7 变量）、Traffic（862 变量）、Electricity/ECL（321）、Weather（21）、Solar-Energy（137）、PEMS03/04/07/08（358/307/883/170）。基线结果多取自 iTransformer 论文，PatchTST 与 TSMixer 为论文复现。

### 主结果（L = 96，各 horizon 平均，MSE / MAE）

数字取自论文 Table 2（已对照渲染图）：

数据集 | SOFTS | iTransformer | PatchTST
-- | -- | -- | --
ECL | 0.174 / 0.264 | 0.178 / 0.270 | 0.189 / 0.276
Traffic | 0.409 / 0.267 | 0.428 / 0.282 | 0.454 / 0.286
Weather | 0.255 / 0.278 | 0.258 / 0.278 | 0.256 / 0.279
Solar-Energy | 0.229 / 0.256 | 0.233 / 0.262 | 0.236 / 0.266
ETTm1 | 0.393 / 0.403 | 0.407 / 0.410 | 0.396 / 0.406
PEMS04 | 0.102 / 0.208 | 0.111 / 0.221 | 0.145 / 0.249
PEMS07 | 0.087 / 0.184 | 0.101 / 0.204 | 0.144 / 0.233
PEMS08 | 0.138 / 0.219 | 0.150 / 0.226 | 0.200 / 0.275

- 论文称 SOFTS 在 6 类数据集的平均上取得最好或次好。论文自己的例子：Traffic 平均 MSE 0.428 → 0.409（约 4.4%），PEMS07 0.101 → 0.087（约 13.9%）。
- 并非处处第一：同一张表中 PEMS04 的 MSE/MAE 最优是 SCINet（0.092 / 0.202），ETTh1 的 MSE 最优是 FEDformer（0.440，SOFTS 为 0.449）。在 Weather、ETT 上差距很小（小数点后第三位），论文的结论主要体现在变量多的数据集（Traffic、PEMS）上。

### 效率

Figure 3b：Traffic，L = 96，H = 720，batch size 4，横轴推理时间、纵轴 MSE、气泡大小为显存。论文称 SOFTS 在时间与显存上消耗都很小（图中 SOFTS 与 iTransformer 的 MSE 处于最低一档）；DLinear、TSMixer 虽然资源占用低，但变量数很多时表现差。具体数值本文不引（图上读数不精确）。

### 消融：池化方式（Table 3，MSE / MAE）

方式 | ECL | Traffic | Weather | Solar | ETTh2 | PEMS04
-- | -- | -- | -- | -- | -- | --
w/o STAR（CI 的 MLP） | 0.187/0.273 | 0.442/0.281 | 0.261/0.281 | 0.247/0.272 | 0.381/0.406 | 0.143/0.245
Mean | 0.174/0.266 | 0.420/0.277 | 0.261/0.281 | 0.234/0.262 | 0.379/0.404 | 0.106/0.212
Max | 0.180/0.270 | 0.406/0.271 | 0.259/0.280 | 0.246/0.269 | 0.379/0.401 | 0.116/0.223
Weighted | 0.184/0.275 | 0.440/0.292 | 0.263/0.284 | 0.264/0.280 | 0.379/0.403 | 0.109/0.218
Stochastic | 0.174/0.264 | 0.409/0.267 | 0.255/0.278 | 0.229/0.256 | 0.373/0.400 | 0.102/0.208

结论：任何池化方式加上 STAR 总体都比"没有 STAR 的 CI"好（个别格子持平或更差：如 Weighted 在 Weather 上 MSE 0.263 劣于 w/o STAR 的 0.261、在 Solar 上 0.264 劣于 0.247，论文说"consistent enhancement"在这些格子并不严格成立，`[解读]`）；Stochastic 在大多数数据集上最好，但 Traffic 的 MSE 上 Max（0.406）略优于 Stochastic（0.409）。

### STAR 的通用性（Table 4，MSE / MAE）

把别的模型里的注意力换成 STAR（PatchTST 换时间注意力；iTransformer 换通道注意力；Crossformer 为改了解码器的版本，同时换时间与通道注意力）：

模型 | 组件 | ECL | Traffic | PEMS04 | PEMS07
-- | -- | -- | -- | -- | --
PatchTST | Attention | 0.189/0.276 | 0.454/0.286 | 0.145/0.249 | 0.144/0.233
PatchTST | STAR | 0.185/0.272 | 0.448/0.279 | 0.136/0.238 | 0.137/0.225
Crossformer† | Attention | 0.202/0.301 | 0.546/0.297 | 0.090/0.198 | 0.084/0.181
Crossformer† | STAR | 0.198/0.292 | 0.549/0.292 | 0.087/0.194 | 0.080/0.175
iTransformer | Attention | 0.178/0.270 | 0.428/0.282 | 0.111/0.221 | 0.101/0.204
iTransformer | STAR | 0.174/0.264 | 0.409/0.267 | 0.102/0.208 | 0.087/0.184

（† 为论文改版的 Crossformer。Crossformer 在 Traffic 上 MSE 反而略差 0.546→0.549。）iTransformer + STAR 一行与 SOFTS 主结果相同——论文自己也说 SOFTS 可看作把 iTransformer 的通道注意力换成 STAR。论文结论：用更少算力的 STAR 替换注意力，在多个数据集上持平甚至更好。

### 其他实验

- **回看窗口**（Figure 4，ETTm2 / ECL / Traffic，L ∈ {48, 96, 192, 336}）：论文称 SOFTS 随 L 增大持续变好，且各 L 下普遍优于对比方法，短窗口时优势更明显。
- **超参敏感性**（Figure 5）：Traffic、PEMS 这类复杂交通数据集需要更大的 d 和更多层；d' 的变化影响很小。
- **T-SNE 与异常通道**：Traffic（862 变量）测试集里有 2 个通道的嵌入远离其余通道；仅 CI（无 STAR）预测 MSE 为 0.414，经第一个 STAR 之后这两个通道向正常通道靠拢，MSE 变为 0.376（论文说约改善 9%；0.038/0.414 ≈ 9.2%）。
- **通道噪声**（Figure 6c）：在 PEMS03 的一个通道上加不同强度的高斯噪声（L = H = 96）。PatchTST 的 MSE 随噪声急剧上升，SOFTS 与 iTransformer 更稳，SOFTS 又优于 iTransformer。论文据此认为 core 比两两关系对异常通道更鲁棒。注意这是单一数据集、单一通道的实验。

## 优缺点与局限

论文自述的局限（Appendix F）：
- 效果高度依赖 core 表示的质量；若 core 不能反映各序列的关键特征，性能可能下降。
- 对 aggregate-redistribute 的替代策略探索有限。

`[解读]` / `[经验]`：
- 优点：结构简单（线性层 + MLP + 池化）、对变量数线性扩展、可作为"即插即用"的注意力替代。
- 单个 core 向量是信息瓶颈：当变量之间有强烈的"成对/分组"结构（如不同路段组）时，单一全局 core 难以区分不同分组（论文没有做这类专门实验，`[经验]` 推测）。
- 论文主比较（Table 2）只用 L = 96 的固定窗口，基线中没有基础模型/零样本方法；变量少的数据集（ETT、Weather）上与基线差距很小（见主结果表）。
- 随机池化带来训练随机性，复现时结果可能受随机种子影响（`[经验]`）。

## 与相关方法对比

方法 | 变量交互方式 | 变量数复杂度 | 说明
-- | -- | -- | --
SOFTS | STAR：聚合成 core 再分发 | 线性 | 本文
iTransformer | 变量 token 间做自注意力 | 二次 | 论文称 SOFTS 可视为把其通道注意力换成 STAR
PatchTST | 通道独立 + patch 内时间注意力 | 无通道交互 | 论文 Figure 6c 中对单通道噪声最敏感
Crossformer | 跨维度注意力 | 论文未给出复杂度 | 论文用其做 STAR 替换实验
TSMixer | MLP-Mixer 式混合 | 论文未给出 | 论文称变量很多时表现偏弱，资源占用低
DLinear | 线性层 | 论文未给出 | 论文称资源占用低，但变量很多时表现差（Figure 3b）；是否通道独立 `[经验]` 属常识，非本文论据

与 iTransformer 的关键区别（只写名字）：两者都把整条序列嵌入成变量 token，区别只在"变量之间怎么交流"——iTransformer 用 $C\times C$ 注意力矩阵，SOFTS 用单个 core 做中转。TSMixer、DLinear 见同系列文章，这里不链接。

相关背景见 [时间序列总览](/0603_ML_Tasks_TimeSeries)、[深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)、[评估指标](/0610_ML_Tasks_TimeSeries_Metrics)。

## 使用方式

论文声明代码已公开（见 Reference）。下面是 STAR 层的**示意代码，未运行验证**，仅表达结构，细节（归一化、dropout、MLP2 层数等）与官方实现可能不同：

```python
import torch, torch.nn as nn

class StarPool(nn.Module):           # 随机池化：沿通道维 C
    def forward(self, a):            # a: [B, C, d']
        p = torch.softmax(a, dim=1)
        if self.training:            # 每个特征维独立采样一个通道
            B, C, D = a.shape
            idx = torch.multinomial(p.permute(0, 2, 1).reshape(-1, C), 1)
            idx = idx.view(B, 1, D)
            return a.gather(1, idx).squeeze(1)       # [B, d']
        return (p * a).sum(dim=1)                    # [B, d']

class STAR(nn.Module):
    def __init__(self, d, d_core):
        super().__init__()
        self.mlp1 = nn.Sequential(nn.Linear(d, d), nn.GELU(), nn.Linear(d, d_core))
        self.pool = StarPool()
        self.mlp2 = nn.Sequential(nn.Linear(d + d_core, d), nn.GELU(), nn.Linear(d, d))
    def forward(self, s):            # s: [B, C, d]
        o = self.pool(self.mlp1(s))                       # [B, d']
        o = o.unsqueeze(1).expand(-1, s.size(1), -1)      # Repeat
        return self.mlp2(torch.cat([s, o], dim=-1)) + s   # Concat + 融合 + 残差
```

整体：`x [B,L,C]` 转置为 `[B,C,L]` → RevIN → `Linear(L,d)` → N 个 STAR → `Linear(d,H)` → 转置并反归一化。

## Reference

- 论文：[SOFTS: Efficient Multivariate Time Series Forecasting with Series-Core Fusion (arXiv:2404.14197)](https://arxiv.org/abs/2404.14197)，NeurIPS 2024
- 官方代码（论文摘要给出）：[Secilia-Cxy/SOFTS](https://github.com/Secilia-Cxy/SOFTS)

