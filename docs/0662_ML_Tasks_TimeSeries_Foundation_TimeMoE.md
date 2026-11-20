---
Title | ML Tasks TimeSeries Foundation TimeMoE
-- | --
Created @ | `2026-11-19T03:24:20Z`
Updated @| `2026-11-20T08:24:15Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/662)

---
# Time-MoE

Time-MoE 是一个仅解码器（decoder-only）、稀疏混合专家（Mixture of Experts, MoE）的时间序列预测基础模型家族，论文题为 "Time-MoE: Billion-Scale Time Series Foundation Models with Mixture of Experts"（arXiv:2409.16040，发表于 ICLR 2025，作者包括 Xiaoming Shi、Shiyu Wang、Yuqi Nie、Qingsong Wen、Ming Jin 等）。

一句话概括：Time-MoE 把每个时间点当作一个 token，用稀疏 MoE Transformer 做自回归预测，配合多分辨率预测头，在自建的 Time-300B（超过 3000 亿时间点）上预训练；论文称这是首次把时序基础模型扩展到 24 亿参数，而每个时间点只激活其中约 11 亿参数。

同系列相关文章：[时序基础模型总览](/0608_ML_Tasks_TimeSeries_Foundation)、[时间序列总览](/0603_ML_Tasks_TimeSeries)。文中涉及的 Timer、Moirai、TimesFM、Lag-Llama 等只写名字，不展开。

## 解决什么问题

论文的出发点是：语言和视觉领域已经验证"扩大模型和数据带来提升"（scaling law），但时序基础模型仍然规模偏小、推理成本高。论文指出的具体困难有：

- 稠密（dense）模型的每个输入 token 都要与全部参数计算，扩大模型就等比例抬高推理成本；稀疏 MoE 可以在固定推理预算下放大参数量，但大规模稀疏时序模型的稳定性与收敛性尚无人探索；
- 时间序列高度异构，模型设计与路由（routing）的选择需要在性能和计算效率之间权衡；
- 预训练数据存在缺失值、无效观测，且各领域严重不均衡，已有工作对数据处理流水线和混合策略讨论较少；
- 已有模型的灵活性不足：论文称 Timer 对任意输出长度的原生支持有限，可能出现输出被截断；Moment 的输入上下文长度固定；Moirai 虽能做通用预测，但输入输出层依赖硬编码的启发式。

Time-MoE 的回应：用稀疏 MoE 把"总参数量"与"单 token 计算量"解耦；用点级 tokenization 加自回归，让上下文长度和预测长度都可变（论文称上下文最长可到 4096）；自建并清洗 Time-300B。

## 整体结构

问题设定：

$$X_{1:T}=(x_1,\dots,x_T)\in\mathbb R^{T}\ \longrightarrow\ \hat X_{T+1:T+H}=f_\theta(X_{1:T})\in\mathbb R^{H}$$

$T$ 是上下文长度，$H$ 是预测长度，二者在推理时都可以变化。多变量输入按 channel independence 拆成多条单变量序列分别预测，所以模型本身可处理任意变量数。


下图概括 Time-MoE 的整体结构。

```
时间点序列 x_1 ... x_T
   |  (1) 点级 tokenization：每个时间点一个 token
   v
SwiGLU 嵌入  ->  h^0_t
   |  (2)(3) 重复 N 个 MoE Transformer 块
   v
 [RMSNorm -> 因果多头自注意力(RoPE) -> +残差
  -> RMSNorm -> MoE 层(共享专家 + top-K 路由专家) -> +残差]
   |  (4) 训练：同时优化多个输出头
   v
输出头 W_{p_1} ... W_{p_P}，默认 p = {1, 8, 32, 64}
   |  (5) 推理：按贪心调度组合这些头，得到任意长度预测
```

图中：自上而下：时间点序列经点级 tokenization 和 SwiGLU 嵌入得到 $h^0_t$；经 $N$ 个 MoE Transformer 块（RMSNorm、带 RoPE 的因果多头自注意力、残差，再 RMSNorm、MoE 层、残差）；训练时同时优化多个输出头（默认步长 1、8、32、64）；推理时按贪心调度组合这些头得到任意长度预测。

### 输入嵌入：点级 tokenization

与 patch 方式不同，Time-MoE 对每个时间点单独嵌入，论文称这样能保持时间信息的完整性，也让变长序列的处理更灵活。嵌入用 SwiGLU：

$$\mathbf h_t^0=\mathrm{SwiGLU}(x_t)=\mathrm{Swish}(\mathbf W x_t)\otimes(\mathbf V x_t)$$

其中 $\mathbf W,\mathbf V\in\mathbb R^{D\times 1}$ 是可学习参数，$D$ 是隐藏维度。即一个标量被映射为 $D$ 维向量。

### MoE Transformer 块

骨干是借鉴大语言模型的 decoder-only Transformer：RMSNorm 做每个子层输入归一化；用旋转位置编码 RoPE 代替绝对位置编码（论文称序列长度更灵活、外推更好）；遵循 PaLM 的做法去掉大部分偏置，但在自注意力的 QKV 层保留偏置。第 $l$ 层：

$$\mathbf u_t^l=\mathrm{SA}\big(\mathrm{RMSNorm}(\mathbf h_t^{l-1})\big)+\mathbf h_t^{l-1}$$

$$\bar{\mathbf u}_t^l=\mathrm{RMSNorm}(\mathbf u_t^l)$$

$$\mathbf h_t^l=\mathrm{Mixture}(\bar{\mathbf u}_t^l)+\mathbf u_t^l$$


其中：$\mathbf h_t^{l-1}$ 是第 $l-1$ 层在时间点 $t$ 的隐状态；$\mathrm{SA}$ 是因果自注意力；$\mathrm{RMSNorm}$ 是归一化；$\mathbf u_t^l$ 与 $\bar{\mathbf u}_t^l$ 是中间量；$\mathrm{Mixture}$ 是 MoE 层，替代标准 FFN；加上原输入是残差连接。

$\mathrm{SA}$ 是带因果掩码的自注意力，$\mathrm{Mixture}$ 是 MoE 层，它替换了标准 FFN。每个专家的结构都与一个（更小的）FFN 相同。

### MoE 层：路由、top-K 与共享专家

$$\mathrm{Mixture}(\bar{\mathbf u}_t^l)=g_{N+1,t}\,\mathrm{FFN}_{N+1}(\bar{\mathbf u}_t^l)+\sum_{i=1}^{N}g_{i,t}\,\mathrm{FFN}_i(\bar{\mathbf u}_t^l)$$

$$g_{i,t}=\begin{cases}s_{i,t}, & s_{i,t}\in\mathrm{Topk}(\{s_{j,t}\mid 1\le j\le N\},K)\\ 0, & \text{otherwise}\end{cases}$$

$$g_{N+1,t}=\mathrm{Sigmoid}(\mathbf W_{N+1}^l\bar{\mathbf u}_t^l)$$

$$s_{i,t}=\mathrm{Softmax}_i(\mathbf W_i^l\bar{\mathbf u}_t^l)$$


其中：$\mathrm{Mixture}$ 是 MoE 层输出；$\mathrm{FFN}_i$ 是第 $i$ 个专家，$\mathrm{FFN}_{N+1}$ 是共享专家；$g_{i,t}$ 是时间点 $t$ 对专家 $i$ 的权重，只保留得分最大的 $K$ 个路由专家，其余为 0；$s_{i,t}$ 是对全部路由专家做 Softmax 得到的路由分数；共享专家的权重由 Sigmoid 给出，对每个 token 都参与。

符号：$N$ 是非共享（路由）专家数，$K$ 是每个 token 激活的非共享专家数，$\mathbf W_i^l\in\mathbb R^{1\times D}$ 是第 $i$ 个专家的路由参数。

要点：

- $\mathrm{FFN}_1,\dots,\mathrm{FFN}_N$ 是路由专家，$\mathrm{FFN}_{N+1}$ 是共享专家（shared expert），论文称它用来捕获并整合不同上下文中的共性知识；
- 路由专家的权重由 Softmax 得到，只保留最大的 $K$ 个，其余置零；共享专家的权重用 Sigmoid，对每个 token 都参与；
- 每个时间点可以路由到单个专家（Fedus et al., 2022 的做法）或多个专家（Lepikhin et al., 2020 的做法）；Time-MoE 默认 $K=2$。
- [解读] 按公式字面，$s_{i,t}$ 是对全部 $N$ 个专家做 Softmax 的结果，top-$K$ 之后没有再次归一化，因此被选中专家的权重之和通常小于 1；论文没有就此展开说明。
- [解读] 因此每个 token 实际经过 $K+1=3$ 个 FFN（2 个路由专家加 1 个共享专家），这就是"激活参数远小于总参数"的来源。

### 多分辨率预测头

Time-MoE 设置 $P$ 个输出投影，各自对应一个预测步长 $p_1,\dots,p_P$（论文称每个投影来自单层 FFN，公式 12 写成线性投影）：

$$\hat X_{t+1:t+p_j}=\mathbf W_{p_j}\mathbf h_t^L,\qquad \mathbf W_{p_j}\in\mathbb R^{p_j\times D}$$

$\mathbf h_t^L$ 是最后一个 MoE Transformer 块的输出隐状态。默认 $\{p_j\}=\{1,8,32,64\}$。也就是说在位置 $t$ 处，模型一次性可以输出未来 1、8、32、64 步的预测。训练时所有头同时优化（multi-task）；推理时调度不同的头来覆盖任意预测长度，并且论文称这种多分辨率设计还带来集成式的稳健性。

## 训练

### Time-300B 数据集

Time-300B 由公开数据集构成，覆盖能源、零售、医疗、天气、金融、交通、Web 等领域，并加入合成数据以增加数量与多样性；采样频率从秒到年。论文称这是最大的开放时序数据集合。Table 1 的统计如下（# Seqs 为序列数，# Obs 为观测数）：

领域 | 序列数 | 观测数 | 占比
-- | -- | -- | --
Energy | 2,875,335 | 15.981 B | 5.17%
Finance | 1,715 | 413.696 K | 0.0001%
Healthcare | 1,752 | 471.040 K | 0.0001%
Nature | 31,621,183 | 279.724 B | 90.50%
Sales | 110,210 | 26.382 M | 0.008%
Synthetic | 11,968,625 | 9.222 B | 2.98%
Transport | 622,414 | 2.130 B | 0.69%
Web | 972,158 | 1.804 B | 0.58%
Other | 40,265 | 20.32 M | 0.006%
Total | 48,220,929 | 309.09 B | 100%

表中：「领域」是数据领域，「序列数」「观测数」是规模（K、M、B 分别为千、百万、十亿），「占比」是占总观测的比例。结论：Nature 占约 90.5%，数据在领域上很不均衡，训练时按固定领域比例采样。

可以看出 Nature 占了 90.5%（[解读] 论文附录提到 Weatherbench、CMIP6、ERA5 等特别大的数据集，推测它们主要落在这一类，论文未逐一说明归属）。论文称对这几个数据集做了降采样以缓解不均衡与同质化，实际训练时用了 Time-300B 中约 1170 亿个时间点，每个 batch 按固定的领域比例和观测值分布采样。

数据清洗流水线（附录 C）用两个指标衡量质量：缺失值比例（`nan`、`inf` 所占比例）和无效观测比例（一阶或二阶差分中零的最大占比）。处理方式：

- 缺失值：不做均值填充（可能扭曲原有模式），而是在缺失处把序列切成多个子序列，丢弃缺失片段；
- 无效观测：很多系统用 0 或常数填充缺失，产生常值段。用固定长度窗口扫描序列，窗口内一阶/二阶差分的相应比例超过阈值（论文设为 0.2）就丢弃该窗口，把剩下的连续窗口拼接。

### 损失函数

自回归项用 Huber 损失，论文称它对离群点更稳健、有助于训练稳定：

$$\mathcal L_{\text{ar}}(x_t,\hat x_t)=\begin{cases}\tfrac12(x_t-\hat x_t)^2, & \lvert x_t-\hat x_t\rvert\le\delta\\\ \delta\times\big(\lvert x_t-\hat x_t\rvert-\tfrac12\times\delta\big), & \text{otherwise}\end{cases}$$

$\delta$ 是平衡 L1 与 L2 的超参数（论文正文未给出具体取值，[待核实]）。

MoE 训练容易出现路由坍缩（routing collapse）：路由器总选少数几个专家，其他专家得不到训练。论文参照 Fedus et al. 与 Dai et al. 加入专家级负载均衡辅助损失：

$$\mathcal L_{\text{aux}}=N\sum_{i=1}^{N}f_i r_i,\qquad f_i=\frac{1}{KT}\sum_{t=1}^{T}\mathbb I(\text{Time point }t\text{ selects Expert }i),\qquad r_i=\frac1T\sum_{t=1}^{T}s_{i,t}$$


其中：$N$ 是路由专家个数；$K$ 是每个时间点激活的专家数；$T$ 是序列长度；$f_i$ 是被分配给专家 $i$ 的 token 比例（$\mathbb I(\cdot)$ 为指示函数）；$r_i$ 是路由概率分给专家 $i$ 的平均值；$\mathcal L_{\text{aux}}$ 惩罚负载不均衡。

$f_i$ 是分配给专家 $i$ 的 token 比例，$r_i$ 是路由概率分给专家 $i$ 的比例。被分配 token 多、路由分数又高的专家会产生更高的损失，从而惩罚"强者越强"。最终损失把所有多分辨率投影的自回归损失取平均，再加辅助损失：

$$\mathcal L=\frac1P\sum_{j=1}^{P}\mathcal L_{\text{ar}}\big(X_{t+1:t+p_j},\hat X_{t+1:t+p_j}\big)+\alpha\,\mathcal L_{\text{aux}}$$

$P$ 是投影个数，$p_j$ 是第 $j$ 个投影的步长，默认 $\alpha=0.02$。

### 模型规格与训练细节

模型 | 层数 | 头数 | 专家数 | $K$ | $d_{\text{model}}$ | $d_{\text{ff}}$ | $d_{\text{expert}}$ | 激活参数 | 总参数
-- | -- | -- | -- | -- | -- | -- | -- | -- | --
Time-MoE-base | 12 | 12 | 8 | 2 | 384 | 1536 | 192 | 50M | 113M
Time-MoE-large | 12 | 12 | 8 | 2 | 768 | 3072 | 384 | 200M | 453M
Time-MoE-ultra | 36 | 16 | 8 | 2 | 1024 | 4096 | 512 | 1.1B | 2.4B

表中：「模型」是三种规格，其余列是层数、头数、专家数、每 token 激活的专家数 $K$、模型维度 $d_{\text{model}}$、前馈维度 $d_{\text{ff}}$、单专家维度 $d_{\text{expert}}$、激活参数与总参数（M 为百万，B 为十亿）。

论文称 ultra 版本可在不足 8GB 显存的消费级 GPU 上推理；base 与 large 面向 CPU 上的快速推理。

训练设置：每个模型训练 100,000 步，batch size 1024，最大序列长度 4096（每步约 400 万个时间点）；输出投影步长 $\{1,8,32,64\}$，$\alpha=0.02$；AdamW（学习率 1e-3，weight decay 0.1，$\beta_1=0.9$，$\beta_2=0.95$），前 10,000 步线性 warmup 后余弦退火；128 张 A100-80G，BF16 精度；用 sequence packing 减少 padding。

## 推理：贪心调度

要预测 $H$ 步时，模型自回归地进行：每一轮从已有的头里选"不超过剩余步数的最大步长"，用它一次输出这么多步，把输出接回去继续，直到凑够 $H$。算法 1 的伪代码：

```
输入: 目标长度 H, 各头步长 p_1<...<p_P (p_1 = 1)
H_hat <- 0; J <- {}
while H_hat < H:
    for j = P down to 1:
        if H_hat + p_j <= H:
            H_hat += p_j; J.add(p_j); break
return J
```

自拟示意（非论文数字，已手算）：$H=100$，头为 $\{1,8,32,64\}$：先选 64（累计 64），剩 36 选 32（累计 96），剩 4 只能选 1，连选 4 次，最终 $J=\{64,32,1,1,1,1\}$，共 6 轮，合计 $64+32+4\times1=100$。而 $H=96$ 只需 $64+32$ 两轮。

这也解释了为什么必须有 $p_1=1$ 的头（保证任何 $H$ 都能凑齐），也解释了消融里只保留步长 1 的头时推理极慢（见下）。

## 实验与结论

### 零样本预测

设置（论文）：在预训练中未出现的 6 个长序列预测基准上评测——ETTh1、ETTh2、ETTm1、ETTm2、Weather、Global Temp；预测步长 $\{96,192,336,720\}$，对应输入长度 $\{512,1024,2048,3072\}$；指标 MSE、MAE。基线包括 Moirai、TimesFM、Moment、Chronos 的各规格模型。

Table 3 最后一行（Average，6 个数据集在各步长上的平均，已对照渲染图核对）：

模型 | MSE | MAE
-- | -- | --
Time-MoE-base | 0.336 | 0.384
Time-MoE-large | 0.336 | 0.380
Time-MoE-ultra | 0.322 | 0.372
Moirai-base | 0.347 | 0.370
Moirai-large | 0.359 | 0.373
TimesFM | 0.396 | 0.413
Moment | 0.461 | 0.454
Chronos-large | 0.416 | 0.405

表中：「模型」是对比方法，两列是零样本预测在 6 个数据集上的平均 MSE 与 MAE（越小越好）；TimesFM 的数据集覆盖与其他模型不同。结论：Time-MoE-ultra 的 MSE 最低，规模越大越好。

TimesFM 因预训练用到 Weather 数据，论文未在该数据集评测（表中为破折号），所以它的平均值与其他模型的数据集覆盖不同。另外 base 与 large 的平均 MSE 同为 0.336（论文如此，未解释）。论文结论：Time-MoE 的平均 MSE 相对最有竞争力的基线下降超过 20%；与最大的 Chronos-large、Moment、Moirai-large 相比，平均 MSE 分别降低 23%、30%、11%（[解读] 用上表 Average 行的 ultra 数字自行重算，约为 22.6%、30.2%、10.3%，与论文百分比略有出入，推测论文是按其他口径平均，未核实）；随模型规模从 base 增大到 ultra，各数据集上性能持续提升。

### 全样本（in-distribution）预测

设置：在上述 6 个数据集的训练集上对预训练模型微调，仅 1 个 epoch；对照 iTransformer、TimeMixer、TimesNet、PatchTST、Crossformer、TiDE、DLinear、FEDformer 等（除 Global Temp 外，基线结果取自 Liu et al., 2024b）。

Table 4 Average 行：

模型 | MSE | MAE
-- | -- | --
Time-MoE-base | 0.306 | 0.362
Time-MoE-large | 0.304 | 0.359
Time-MoE-ultra | 0.301 | 0.358
iTransformer | 0.349 | 0.382
TimeMixer | 0.337 | 0.375
TimesNet | 0.356 | 0.400
PatchTST | 0.349 | 0.382
DLinear | 0.387 | 0.416

表中：「模型」是对比方法，两列是全样本（微调后）预测的平均 MSE 与 MAE（越小越好）。结论：Time-MoE 各规格均优于对照模型，平均 MSE 降低约 24%。

论文称平均 MSE 降低 24%。

### 消融

以下均为 Time-MoE-base 在 6 个基准上 horizon-96 预测的平均 MSE（Table 5）：

配置 | 平均 MSE
-- | --
完整模型 | 0.262
去掉 Huber 损失（改 MSE） | 0.267
去掉多分辨率层（只保留 horizon-32 头） | 0.269
去掉 MoE（换成标准 FFN） | 0.272
去掉辅助损失 | 0.275

表中：「配置」是消融设置，「平均 MSE」是 6 个基准上预测长度 96 的平均误差（越小越好）。结论：每个组件都有贡献，去掉辅助损失的影响最大。

多分辨率头的配置：

配置 | 平均 MSE | 推理速度
-- | -- | --
{1,8,32,64} | 0.262 | 0.095 s/iter
{1,8,32} | 0.273 | 0.130 s/iter
{1,8} | 0.320 | 0.411 s/iter
{1} | 1.382 | 2.834 s/iter

表中：「配置」是启用的输出头步长，「平均 MSE」是误差（越小越好），「推理速度」是每次迭代耗时（越小越快）。结论：保留更多步长的头既提高精度又加速推理；只保留步长 1 的头最差最慢。

论文称去掉辅助损失后专家层会塌缩成一个较小的 FFN，因为最强专家的激活分数变得过强。

### 稠密 vs 稀疏、规模与数据

论文把 MoE 层换成与"激活参数"同等大小的稠密层，用同样的数据和设置训练三个稠密模型对照：稀疏模型平均降低训练成本 78%、推理成本 39%，同时零样本性能更好。检查点按每 20B 时间点保存，结果显示更多数据训练的模型一致更好，且稀疏模型在同等规模下优于稠密模型；论文据此称验证了训练 token 数与模型规模上的 scaling law。

### 其他分析

- top-$K$ 敏感性（Time-MoE-base，平均 MSE / 推理速度）：Top1 0.264 / 0.082 s；Top2 0.262 / 0.095 s；Top4 0.262 / 0.109 s；Top6 0.265 / 0.120 s；Top8 0.269 / 0.129 s。$K$ 增大性能变化很小而推理变慢，论文据此认为更稀疏不损害性能。
- 精度：BF16 与 FP32 的平均 MSE 分别为 0.262、0.261，BF16 训练速度快约 12%、显存少约 20%；BF16 再配合 flash-attention，训练和推理分别再提速约 23%、19%。
- 专家激活：不同数据集上各层的门控分数模式不同，论文据此认为专家学到了不同的知识。
- 附录还报告了 TaxiBJ 短期零样本预测，以及与 Timer、TFT、N-BEATS 的补充对比，论文称 Time-MoE 表现更好（具体数字此处不引用）。

## 优缺点与局限

论文自述的优点：稀疏激活带来更高计算效率；任意上下文/预测长度；开源模型与 Time-300B；在零样本和微调设定下优于所比较的基线。

论文没有单独的局限性章节。以下为 [经验] / [解读]：

- [解读] 总参数 24 亿意味着加载时要把全部专家放进内存，稀疏只节省计算而不节省权重存储；论文对 ultra 版"8GB 显存以下推理"的说法来自论文，未在此核实细节。
- [解读] 点级 tokenization 使序列长度等于时间点数，长上下文下注意力成本高于 patch 方式；论文将上下文上限定为 4096。
- [解读] 论文的零样本评测集中在 ETT、Weather、Global Temp，且输出为点预测，没有给出概率预测；是否覆盖更多场景需另行验证。
- [解读] 自回归多步预测会累积误差；论文用多分辨率头减少迭代轮数。

## 与相关方法对比

论文附录 Table 8 把已有大模型分为三类，以下摘自论文文字描述：

类别 | 代表 | 论文描述
-- | -- | --
encoder-only | Moirai、Moment | 掩码重建；预训练数据 27B / 1B 时间点；最大约 385M 参数
encoder-decoder | Chronos | 四种规模，最大 710M 参数
decoder-only | TimesFM、Lag-Llama、Timer | 最大模型约 200M 参数
decoder-only + MoE | Time-MoE | 最大 2.4B 参数（1.1B 激活），稀疏 MoE

表中：「类别」是已有大模型的架构类型，「代表」是典型模型，「论文描述」给出预训练数据与参数规模。结论：Time-MoE 是 decoder-only + MoE，总参数最大（2.4B），但每个 token 只激活 1.1B。

论文把 Moirai-MoE 称为同期工作，最大 935M 参数，专家与路由设计不同。关于 Timer，论文只在动机里提到其对任意输出长度原生支持有限，并在附录中把它作为零样本基线对比（Timer 的预训练数据规模分为 1B、16B、28B 三档）。

## 使用方式

论文声明 Time-MoE 模型与 Time-300B 数据集均开源，摘要给出的资源页为 https://github.com/Time-MoE/Time-MoE。以下为示意代码，未运行验证，模型名与接口以官方仓库为准 [待核实]：

```python
# 示意代码，未运行验证
import torch
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained(
    "Maple728/TimeMoE-50M", trust_remote_code=True)  # [待核实] 模型名

x = torch.randn(2, 512)                  # 2 条序列，上下文 512 个点
mean, std = x.mean(-1, keepdim=True), x.std(-1, keepdim=True)
x_norm = (x - mean) / std                # 归一化方式 [待核实]
out = model.generate(x_norm, max_new_tokens=96)
pred = out[:, -96:] * std + mean
```

## Reference

- Time-MoE: Billion-Scale Time Series Foundation Models with Mixture of Experts：https://arxiv.org/abs/2409.16040
- 官方代码与资源：https://github.com/Time-MoE/Time-MoE


