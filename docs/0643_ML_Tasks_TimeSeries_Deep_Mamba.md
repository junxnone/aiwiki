---
Title | ML Tasks TimeSeries Deep Mamba
-- | --
Created @ | `2026-11-19T02:27:24Z`
Updated @| `2026-11-19T06:20:27Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/643)

---
# Mamba

Mamba（Albert Gu 与 Tri Dao，arXiv:2312.00752，论文题为 *Mamba: Linear-Time Sequence Modeling with Selective State Spaces*）是一种**选择性状态空间模型（selective SSM）**。它让 SSM 的参数 $\Delta, B, C$ 成为输入的函数，使模型能够按内容"选择性地记住或忘记"序列信息；这一改动破坏了 S4 一类模型赖以高效计算的卷积形式，作者为此设计了**硬件感知的并行扫描算法**，并把它放进一个不含注意力、甚至不含独立 MLP 块的简化网络（即 Mamba）。训练时计算与显存随序列长度线性增长，自回归推理时每步为常数时间、不需要 KV cache。

一句话概括：**给 SSM 加上输入相关的"门"，再用融合 kernel + 并行扫描把它算得足够快**。

它不是时间序列专用模型：论文的实验覆盖合成任务、语言（Pile）、DNA 与音频，**没有做时间序列预测实验**。在本站的时序综述里，它属于 [深度学习篇](/0606_ML_Tasks_TimeSeries_Deep) 中"状态空间模型"一支，被 S-Mamba、TimeMachine 等工作借用到预测任务（见"在时间序列上的使用"）。

## 要解决的问题

### 序列建模的核心矛盾：压缩上下文

论文把序列建模的权衡概括为**如何把上下文压缩进一个更小的状态**：

- 注意力有效但低效：它显式地**不压缩**上下文，自回归推理要保存整个上下文（KV cache），导致推理每步代价随长度增长、训练二次复杂度。
- 循环模型高效但受限：状态有限，推理常数时间、训练线性时间，但效果取决于状态把上下文压缩得多好。

因此论文提出一个基本原则：**选择性（selectivity）**，即根据内容决定"哪些输入进入状态、哪些被过滤"的能力。

### LTI 模型为什么做不到

S4 一类结构化 SSM 是**线性时间不变（LTI）**的：$(\Delta, A, B, C)$ 对所有时间步相同，因此既能写成线性递推，也能写成全局卷积，训练时用卷积并行。但常数的动力学无法让模型根据输入内容去决定保留或遗忘什么。论文用两个合成任务（Figure 2）说明：

- **Selective Copying**：在标准 Copying 任务上随机化被记忆 token 之间的间隔。标准 Copying 只需要"知道时间"，一个长度恰好合适的卷积核就能解；随机间隔后输入到输出的间距是变化的，静态卷积核无法处理，必须按内容区分要记的 token 与要忽略的 token。
- **Induction Heads**：若序列里出现过 "Harry Potter"，下次出现 "Harry" 时应预测 "Potter"，即联想回忆（associative recall）并复制。论文称它是被假设用来解释 LLM 大部分上下文学习能力的机制，并且对 in-context learning 能力有出人意料的预测性。

论文还指出，**架构层面的乘法门控**（如 H3 的门）并不等于选择机制：门控不沿序列轴交互，无法改变 token 之间的间隔。

## 核心思想

### 连续系统与 ZOH 离散化

结构化 SSM 把一维函数 $x(t)\in\mathbb R$ 经隐状态 $h(t)\in\mathbb R^{N}$ 映射为 $y(t)\in\mathbb R$：

$$h'(t)=A\,h(t)+B\,x(t),\qquad y(t)=C\,h(t)$$

离散化（以步长 $\Delta$）把连续参数 $(\Delta, A, B)$ 变成 $(\bar A,\bar B)$。论文给出的零阶保持（ZOH）规则为：

$$\bar A=\exp(\Delta A),\qquad \bar B=(\Delta A)^{-1}\bigl(\exp(\Delta A)-I\bigr)\cdot\Delta B$$

之后可以用线性递推计算：

$$h_t=\bar A\,h_{t-1}+\bar B\,x_t,\qquad y_t=C\,h_t$$

LTI 情形下，把递推展开等价于对 $x$ 做全局卷积，卷积核为：

$$\bar K=\bigl(C\bar B,\ C\bar A\bar B,\ \dots,\ C\bar A^{k}\bar B,\ \dots\bigr),\qquad y=x*\bar K$$

训练用卷积并行，推理用递推。这是 S4 的基本框架。

结构化的含义：$A$ 取对角，于是 $A\in\mathbb R^{N\times N}$、$B\in\mathbb R^{N\times 1}$、$C\in\mathbb R^{1\times N}$ 都只需 $N$ 个数。SSM 对输入的 $D$ 个通道**各自独立**地运行，所以每个样本的总隐状态是 $D\cdot N$ 维。

### 选择机制：让 $\Delta,B,C$ 依赖输入

论文的 Algorithm 1（S4）与 Algorithm 2（S6，即 SSM + 选择）的区别只在几个参数的形状（形状里的 $\mathsf B,\mathsf L,\mathsf D,\mathsf N$ 分别是批大小、序列长度、通道数、状态维度）：

参数 | S4（Algorithm 1） | S6（Algorithm 2）
-- | -- | --
$A$ | $(\mathsf D,\mathsf N)$，参数 | $(\mathsf D,\mathsf N)$，参数（不变）
$B$ | $(\mathsf D,\mathsf N)$，参数 | $(\mathsf B,\mathsf L,\mathsf N)$，$s_B(x)$
$C$ | $(\mathsf D,\mathsf N)$，参数 | $(\mathsf B,\mathsf L,\mathsf N)$，$s_C(x)$
$\Delta$ | $(\mathsf D)$，$\tau_\Delta(\text{Parameter})$ | $(\mathsf B,\mathsf L,\mathsf D)$，$\tau_\Delta(\text{Parameter}+s_\Delta(x))$
$\bar A,\bar B$ | $(\mathsf D,\mathsf N)$ | $(\mathsf B,\mathsf L,\mathsf D,\mathsf N)$
计算 | 递推或卷积 | 只能递推（scan）

论文的具体选择：

$$s_B(x)=\text{Linear}_{N}(x),\qquad s_C(x)=\text{Linear}_{N}(x)$$

$$s_\Delta(x)=\text{Broadcast}_{D}\bigl(\text{Linear}_{1}(x)\bigr),\qquad \tau_\Delta=\text{softplus}$$

这样，参数多了一个长度维 $L$，模型由时间不变变成**时间可变**，卷积等价性丢失。$\Delta$ 先投影到 1 维再广播到 $D$ 个通道，是因为"一个输入若应被完全忽略，所有通道都应忽略它"。论文还提到可推广为 $s_\Delta(x)=\text{Linear}_D(\text{Linear}_R(x))$（低秩投影，$R$ 取 $D$ 的一小部分）；$\Delta$ 的偏置项初始化为 $\tau_\Delta^{-1}\bigl(\text{Uniform}([0.001,0.1])\bigr)$。

### 与 RNN 门控的联系（Theorem 1）

当 $N=1$，$A=-1$，$B=1$，$s_\Delta=\text{Linear}(x)$，$\tau_\Delta=\text{softplus}$ 时，选择性 SSM 的递推化为：

$$g_t=\sigma\bigl(\text{Linear}(x_t)\bigr),\qquad h_t=(1-g_t)\,h_{t-1}+g_t\,x_t$$

推导（论文附录 C）：连续系统 $h'(t)=-h(t)+x(t)$ 是 leaky integrator；$\Delta_t=\text{softplus}(\text{Linear}(x_t))$；ZOH 给出：

$$\bar A_t=\exp(-\Delta_t)=\frac{1}{1+\exp(\text{Linear}(x_t))}=1-\sigma\bigl(\text{Linear}(x_t)\bigr),\qquad \bar B_t=1-\bar A_t=\sigma\bigl(\text{Linear}(x_t)\bigr)$$

所以 $\Delta$ 起到**广义 RNN 门**的作用：大 $\Delta$ 重置状态并聚焦当前输入，小 $\Delta$ 保留状态并忽略当前输入。论文列出三种机理效果：

- **Variable Spacing**：过滤间隔中的噪声 token（$g_t\to 0$ 即忽略 $x_t$）。
- **Filtering Context**：许多序列模型不能随上下文变长而变好，因为无法忽略无关上下文；选择性模型可随时重置状态，理论上性能随上下文单调改善。
- **Boundary Resetting**：多个独立序列拼接时，选择性 SSM 可在边界重置状态（$\Delta_t\to\infty$ 或 $g_t\to 1$），LTI 模型则会跨序列"串味"。

自拟小例子（示意，非论文数值）：令 $\text{Linear}(x_t)=0$，则 $g_t=\sigma(0)=0.5$，$\Delta_t=\text{softplus}(0)=\ln 2$，$\bar A_t=\exp(-\ln 2)=0.5=1-g_t$。设 $h_{t-1}=2,\ x_t=4$，则 $h_t=0.5\times 2+0.5\times 4=3$。若 $\text{Linear}(x_t)$ 很大，$g_t\to1$，$h_t\to x_t$（重置）；若很负，$g_t\to 0$，$h_t\to h_{t-1}$（保持）。

### $A$、$B$、$C$ 各自的角色

- $A$ 也可以做成选择性的，但它只通过 $\bar A=\exp(\Delta A)$ 与 $\Delta$ 交互，所以 $\Delta$ 的选择性已足以让 $(\bar A,\bar B)$ 具有选择性；论文**假设**再让 $A$ 选择性会有相近效果，为简洁而省略。
- $B$ 控制输入 $x_t$ 是否进入状态，$C$ 控制状态是否进入输出 $y_t$；两者选择性相当于让模型根据内容（输入）和上下文（隐状态）调节递推动力学。

### 其他细节

- **实数 vs 复数**：多数前人 SSM 的状态用复数；Mamba 默认用**实数**，在除一个任务之外的所有任务上都好用；论文**假设**复数对连续模态（音频、视频）有利，对离散模态（文本、DNA）无益。唯一改用复数参数化的是音频预训练实验。
- **初始化**：复数情形默认 S4D-Lin，实数情形 S4D-Real（$A$ 的第 $n$ 个元素分别为 $-1/2+ni$ 与 $-(n+1)$）。

## 硬件感知的选择性扫描

### 为什么难

LTI 的高效来自卷积形式：不需要显式算出潜状态 $h$（形状 $(\mathsf B,\mathsf L,\mathsf D,\mathsf N)$，比输入输出 $(\mathsf B,\mathsf L,\mathsf D)$ 大 $N$ 倍），只需物化一个 $(\mathsf B,\mathsf L,\mathsf D)$ 大小的卷积核。选择机制使卷积失效，若直接物化 $h$，显存和 IO 都扩大 $N$ 倍。论文的目标是"在不付出速度与显存代价的情况下最大化隐状态维度"（前人 LTI SSM 借助对偶形式把有效状态维度扩大 $N\approx 10$ 到 $100$ 倍）。

两个观察：朴素递推 $O(BLDN)$ FLOPs，卷积 $O(BLD\log L)$，前者常数更小，长序列且 $N$ 不太大时反而 FLOPs 更少；真正的两个挑战是递推的**串行性**和**显存占用**。

### 三种经典技术

**1. Kernel fusion。** GPU 上除矩阵乘外的多数操作受**显存带宽**限制。标准做法是在 HBM 中准备大小 $(\mathsf B,\mathsf L,\mathsf D,\mathsf N)$ 的 $(\bar A,\bar B)$，调用并行扫描，再写回同样大小的结果，最后乘 $C$，IO 量为 $O(BLDN)$。融合后的单个 kernel（附录 D）：

```
1. 把 (Δ, A, B, C)（共 O(BLD + DN) 字节）从慢速 HBM 读入快速 SRAM
2. 在 SRAM 中离散化，得到 Ā, B̄（大小 (B,L,D,N)，只存在于 SRAM）
3. 在 SRAM 中做并行关联扫描，得到中间状态 h
4. 乘并求和 C，只把输出 (B,L,D) 写回 HBM
```

这样 IO 降低一个 $O(N)$ 因子，论文称实际带来 20 到 40 倍加速。序列太长放不进 SRAM 时，按块（chunk）分段做融合扫描，并把上一块的中间状态带入下一块。

**2. 并行扫描（parallel scan）。** 递推虽不是线性时间不变，但依然可用 work-efficient 的并行关联扫描并行化（论文引用 Blelloch 1990 等）。[解读] 其关键是把每步 $h_t=a_t h_{t-1}+b_t$ 视为仿射映射 $(a_t,b_t)$，两个映射先后作用的复合为 $(a_1,b_1)\circ(a_2,b_2)=(a_2a_1,\ a_2b_1+b_2)$，满足结合律，因此可用树状归约并行。

**3. 重计算（recomputation）。** 反向传播需要中间状态，但前向不保存它们（避免 $(\mathsf B,\mathsf L,\mathsf D,\mathsf N)$ 的显存），而是在反向时把输入从 HBM 载入 SRAM 后重算；论文指出这比存储再从 HBM 读回更快。整个 block 里"占显存大但重算快"的激活（如激活函数输出、短卷积输出）也不保存。结果是：融合的选择性扫描层显存需求与使用 FlashAttention 的优化 Transformer 相当。

## Mamba block 结构

H3 block 是多数 SSM 架构的基础，通常与 MLP 块交替堆叠。Mamba 把两者合并成**一个**同质堆叠的 block（受 gated attention unit 启发，Figure 3）：

```
x ──┬── Linear(D→ED) ── Conv ── SiLU ── SSM(选择性) ──┐
    │                                                    ×── Linear(ED→D) ── 输出
    └── Linear(D→ED) ── SiLU ──────────────────────────┘
（外部：标准归一化 + 残差连接；block 同质重复）
```

要点（论文 Figure 3 与 3.4 节）：

- [解读] 图中的 Conv 是沿序列维度的短卷积；论文正文未在此展开其核大小，本文不给具体数值。
- 相对 H3 block：把第一个乘法门换成了激活函数。
- 相对 MLP block：在主分支里加了 SSM。
- 模型维度 $D$ 按扩展因子 $E$ 放大；论文所有实验取 $E=2$。每个 block 约 $3ED^2$ 参数（输入投影 $2ED^2$，输出投影 $ED^2$），SSM 本身的参数（$\Delta,B,C$ 投影与 $A$）小得多。两个 block 叠在一起约 $12D^2$，与 Transformer 中 MHA+MLP 的参数量相匹配。
- 激活用 SiLU/Swish，使 gated MLP 成为常见的 SwiGLU 变体；另有一个可选的归一化层（论文选 LayerNorm，受 RetNet 启发）。

整个网络就是这个 block 加归一化与残差的重复，没有注意力，也没有单独的 MLP block。

## 训练与推理

- **训练**：整个序列已知，因为 $\bar A_t,\bar B_t$ 随时间变化，必须用上述融合并行扫描而不是卷积；计算和显存线性于 $L$。
- **推理（自回归）**：当作 RNN 逐步更新状态 $h_t$，每步常数时间，不需要保存过去元素的 cache。论文报告其推理吞吐比相近大小的 Transformer 高（见下文），部分原因是没有 KV cache 因而可用更大的批大小。
- 训练设置（论文附录 E.3 DNA 预训练部分，称与 E.2 语言建模协议大体一致，节选）：AdamW，$(\beta_1,\beta_2)=(0.9,0.95)$，无 dropout，weight decay 0.1，cosine 学习率调度配 10% 步数的线性 warmup。

## 实验与结论

以下数字均来自论文的表格/图。

### 合成任务

**Selective Copying（Table 1）**，准确率（%）：

Model | Arch. | Layer | Acc.
-- | -- | -- | --
S4 | No gate | S4 | 18.3
- | No gate | S6 | 97.0
H3 | H3 | S4 | 57.0
Hyena | H3 | Hyena | 30.1
- | H3 | S6 | 99.7
- | Mamba | S4 | 56.4
- | Mamba | Hyena | 28.4
Mamba | Mamba | S6 | 99.8

结论：门控架构（H3、Mamba block）只部分改善；把 S4 换成 S6（选择机制）才基本解决，与更强架构结合时最好。

**Induction Heads（Table 2、Table 11）**：训练序列长度 $2^8=256$，词表大小 16，2 层模型；测试长度从 $2^6=64$ 到 $2^{20}=1048576$。Mamba（更准确地说是其选择性 SSM 层）可完美解决，并**完美泛化到百万长度，即训练长度的约 4000 倍**；论文称其他方法都不超过 2 倍。比较对象含 MHA（绝对位置编码、RoPE、xPos）、H3、Hyena。

### 语言模型（Pile）

- **Scaling laws（Figure 4）**：模型从约 125M 到约 1.3B，按 Chinchilla 协议在 Pile 上训练；基线包括标准 Transformer（GPT-3 架构）、Transformer++（基于 PaLM/LLaMA 的强配方）、Hyena、RWKV、RetNet、H3++。论文结论：Mamba 是**第一个与强 Transformer++ 配方持平的无注意力模型**，序列越长越明显。注：RWKV 与 RetNet 在上下文长度 8k 的完整结果缺失（缺乏高效实现导致 OOM 或不现实的计算量）；注意力模型只测到长度 $2^{14}=16384$。
- **零样本下游评估（Table 3，节选）**。对比的是用相同 tokenizer、相同数据集、300B tokens 训练的 Pythia 和 RWKV（Mamba 与 Pythia 上下文长度 2048，RWKV 为 1024）：

Model | Pile ppl | LAMBADA ppl | LAMBADA acc | 平均 acc（论文 Average acc 列）
-- | -- | -- | -- | --
Pythia-160M | 29.64 | 38.10 | 33.0 | 40.6
Mamba-130M | 10.56 | 16.07 | 44.3 | 44.7
Pythia-1.4B | 7.51 | 6.08 | 61.7 | 55.2
RWKV-1.5B | 7.70 | 7.04 | 56.4 | 54.3
Mamba-1.4B | 6.80 | 5.04 | 64.9 | 59.7
Pythia-2.8B | 6.73 | 5.04 | 64.7 | 59.1
RWKV-3B | 7.00 | 5.24 | 63.9 | 59.6
Mamba-2.8B | 6.22 | 4.23 | 69.2 | 63.3
Pythia-6.9B | 6.51 | 4.45 | 67.1 | 61.7
RWKV-7.4B | 6.31 | 4.38 | 67.2 | 62.5

Mamba-2.8B 的平均准确率 63.3 高于两倍以上规模的 Pythia-6.9B（61.7）；论文总结为"每个规模下 Mamba 在每项评估上都是同级最佳，且通常与两倍大小的基线持平"。

### DNA 与音频

- **DNA（HG38 人类基因组，训练集约 45 亿 token）**：固定上下文 $2^{10}=1024$ 时，Mamba 随模型规模的 scaling 优于 HyenaDNA 与 Transformer++，论文称在最大模型规模（约 40M 参数）下可用约 3 到 4 倍更少的参数匹配后两者。固定模型大小（6 层、宽 128，约 1.3M 到 1.4M 参数）、把上下文从 $2^{10}$ 拉到 $2^{20}$ 时，Mamba 的预训练困惑度持续改善，而 HyenaDNA 随长度变差。论文还有一个五种大型类人猿（great apes：人、黑猩猩、大猩猩、猩猩、倭黑猩猩）物种分类的下游任务（Figure 6、Table 13），本文不引用具体数字。
- **音频（YouTubeMix，4 小时钢琴曲，16 kHz；主指标 BPB）**：以 SaShiMi（S4+MLP）为主要对比；上下文长度从 $2^{13}=8192$ 到约 $10^6$，在固定计算量下，二者都随上下文变长而改善，Mamba 全程更好且差距随长度扩大。这是论文中唯一改用复数参数化的实验。
- **SC09 语音生成（Table 4，节选，FID 越低越好）**：

Model | Params | NLL | FID
-- | -- | -- | --
SaShiMi | 5.8M | 1.873 | 1.99
WaveGAN | 19.1M | - | 2.03
DiffWave | 24.1M | - | 1.92
DiffWave + SaShiMi | 23.0M | - | 1.42
Mamba | 6.1M | 1.852 | 0.94
Mamba | 24.3M | 1.860 | 0.67

小 Mamba（6.1M）的 FID 为 0.94，低于表中所有基线；摘要称"把一个有挑战的语音生成数据集上的 FID 降低一半以上"（1.99 到 0.94）。Table 5 的消融显示 outer 与 center 都换成 Mamba 时 FID 最好（0.94）。

### 效率（Section 4.5）

- 选择性扫描（状态扩展 $N=16$）在序列长度超过 2K 后快于已知最好的注意力实现 FlashAttention-2，并比 PyTorch 的标准 scan 实现快 20 到 40 倍；附录 E.5 的 Table 15（125M 模型、序列长度 2048、训练显存）显示 Mamba 与用 FlashAttention-2 的优化 Transformer 同量级（batch 1 为 4.8GB 对 4.6GB，batch 32 为 38.2GB 对 34.5GB）。
- 推理吞吐比相近大小的 Transformer 高 4 到 5 倍，因为没有 KV cache 可以用更大批。论文举例：未训练的 Mamba-6.9B 推理吞吐会高于小 5 倍的 Transformer-1.3B。

### 消融（约 350M 模型，Chinchilla token 数，语言建模困惑度，越低越好）

**架构与内层 SSM（Table 6）**：

Arch. | SSM Layer | Perplexity
-- | -- | --
H3 | Hyena | 10.24
H3 | S4（complex） | 10.30
H3 | S4（real） | 10.34
H3 | S6 | 8.95
Mamba | Hyena | 10.75
Mamba | S4（complex） | 10.54
Mamba | S4（real） | 10.56
Mamba | S6 | 8.69

LTI 的各种参数化彼此差异很小，换成选择性 S6 提升显著；Mamba block 与 H3 相当（用选择层时略好）但更简单。

**哪些参数选择性（Table 7）**：

Selective $\Delta$ | Selective $B$ | Selective $C$ | Perplexity
-- | -- | -- | --
否 | 否 | 否 | 10.93
否 | 是 | 否 | 10.15
否 | 否 | 是 | 9.98
是 | 否 | 否 | 9.81
是 | 是 | 是 | 8.71

$\Delta$ 最重要，三者同时选择性有协同。

**状态维度 $N$（Table 10）**：

$N$ | $B,C$ 为常数时的困惑度 | $B,C$ 选择性时的困惑度
-- | -- | --
1 | 9.88 | 9.73
2 | 9.86 | 9.40
4 | 9.82 | 9.09
8 | 9.82 | 8.84
16 | 9.81 | 8.71

增大 $N$ 只有在 $B,C$ 也选择性时才显著有益：论文称此时仅增加约 1% 参数就带来超过 1.0 的困惑度改善，这验证了"更大状态 + 选择性"的动机。

**$A$ 的初始化（Table 8）**：$A_n=-(n+1)$（实数）与随机 $\exp(\mathcal N(0,1))$（实数）均为 8.71，$A_n=-1/2$（实数）为 8.85，S4D-Lin 的复数形式 $-\tfrac12+ni$ 为 9.16；即选择性 SSM 下更简单的实数对角初始化更好。

## 优缺点与局限

论文自述的局限与讨论：

- **连续-离散谱系上没有免费午餐**：选择机制克服了 SSM 在文本、DNA 等离散模态上的弱点，但可能损害 LTI SSM 擅长的数据（如连续信号）上的表现；音频消融探讨了这一权衡。
- **下游能力待验证**：Transformer 基础模型有丰富的下游生态（微调、适配、提示、in-context learning、指令微调、RLHF、量化等），SSM 是否具备类似性质尚待研究。
- **规模有限**：实验只到较小的规模（语言模型最大 2.8B），低于多数强开源 LLM（如 Llama）以及已评估到 7B 以上的 RWKV、RetNet；是否在更大规模仍占优未知，扩展 SSM 还可能有额外工程挑战。

[经验] 补充（非论文结论）：

- 状态是固定大小的压缩，在需要精确回忆很久之前某个具体内容的任务上，理论上不如保留全部历史的注意力 [待核实：具体实证结论]。
- 选择性扫描依赖定制 CUDA kernel，不在 GPU 上或用朴素 PyTorch 实现时速度优势不成立。
- 论文的 block 是因果（单向）的；对离线预测、不需要因果的场景，后续工作常做双向扩展（如 S-Mamba 的双向 Mamba，口径见时序综述）。

## 与相关方法对比

方法 | 状态/递推 | 是否随内容变化 | 训练并行方式 | 推理每步 | 备注
-- | -- | -- | -- | -- | --
Transformer | 无固定状态，KV cache | 注意力按内容 | 全并行（$O(L^2)$） | 随长度增长 | 不压缩上下文
S4 等 LTI SSM | 线性递推 | 否（LTI） | 全局卷积（FFT） | 常数 | 对离散/信息密集数据较弱
H3 / Hyena | S4 / 隐式长卷积 + 门控 | 否（门控不沿序列交互） | 卷积 | 常数 | 论文认为门控不是选择机制
RWKV / RetNet | 线性注意力类循环 | RWKV 的 WKV 为 LTI 递推 | 并行形式 | 常数 | 论文用作 LM 基线
Mamba（S6） | 选择性递推 | 是 | 融合并行扫描 | 常数 | 无注意力

**与 S4 的区别**（核心）：

1. **参数是否依赖输入**：S4 的 $(\Delta,A,B,C)$ 固定（LTI）；Mamba 令 $\Delta,B,C$ 随输入变化，$A$ 仍是参数。论文把它称作 S6：S4 + 选择机制 + 用 scan 计算。
2. **计算路径**：S4 用卷积训练、递推推理；Mamba 失去卷积形式，只能用硬件感知的并行扫描。
3. **离散化**：二者都用 ZOH 这类规则，但 Mamba 中 $\Delta_t$ 逐时间步变化，$\bar A_t,\bar B_t$ 也逐步变化。
4. **默认参数化**：Mamba 默认实数对角状态；S4 系常用复数。
5. **架构**：Mamba 用单一同质 block，取代 S4 系常见的 SSM 与 MLP 交替堆叠。

## 在时间序列上的使用

论文**没有**做时间序列预测实验，下面全部为 [经验]/[待核实]：

- 时序综述中提到的 S-Mamba（*Is Mamba Effective for Time Series Forecasting?*，arXiv:2403.11144）与 TimeMachine（arXiv:2403.09898）是把 Mamba 用于预测的代表；它们的结论并不统一：在部分基准上有竞争力，相对强 MLP/Transformer 基线的稳定优势仍需更多独立验证 [经验]。
- [经验] 选择性对时序可能的意义：让模型在长历史中忽略噪声段、在状态切换处（如制度变化）重置记忆。这是类比自论文对 Filtering Context / Boundary Resetting 的论述，**论文并未在时序数据上验证**。
- [经验] 论文自己指出选择机制可能损害 LTI SSM 擅长的连续信号；许多时序数据是连续、低信息密度的，选择性是否有益需要实证 [待核实]。
- [经验] 常见做法是把变量或 patch 当作 token，再喂给若干 Mamba 层；DLinear、PatchTST 等强基线仍是对比的参照，参见 [时序深度学习篇](/0606_ML_Tasks_TimeSeries_Deep)。

## 使用方式

官方代码与预训练 checkpoint 在 `state-spaces/mamba`（论文给出）。下面是用官方 `mamba_ssm` 包的**示意代码，未运行验证**。论文本身不涉及 API；参数名（`d_model`、`d_state`、`d_conv`、`expand`）与默认值已对照官方仓库 README 的 Mamba 用法示例，但仓库接口可能随版本变化，以仓库为准：

```python
# 示意代码，未运行验证
import torch
from mamba_ssm import Mamba

x = torch.randn(2, 64, 16).cuda()      # (batch, length, dim)
block = Mamba(d_model=16, d_state=16, d_conv=4, expand=2).cuda()
y = block(x)                            # (2, 64, 16)，形状不变，可堆叠 + 残差 + 归一化
```

为理解算法，下面给出选择性扫描的朴素参考实现思路（示意，未运行验证）：

```python
# 示意代码，未运行验证；真实实现把离散化、扫描、乘 C 融合在一个 CUDA kernel 里
def selective_scan_ref(x, delta, A, B, C):
    # x, delta: (b, l, d)；A: (d, n)；B, C: (b, l, n)
    b, l, d = x.shape
    h = x.new_zeros(b, d, A.shape[1])
    ys = []
    for t in range(l):
        dA = torch.exp(delta[:, t, :, None] * A)               # A_bar_t，(b, d, n)
        dB = delta[:, t, :, None] * B[:, t, None, :]           # B_bar_t 的简化形式 delta * B
        h = dA * h + dB * x[:, t, :, None]
        ys.append((h * C[:, t, None, :]).sum(-1))              # (b, d)
    return torch.stack(ys, dim=1)
```

[经验] 其中 $\bar B\approx\Delta B$ 的简化（Euler 型）为常见实现写法，与论文给出的 ZOH 公式在 $\Delta A$ 较小时近似 [待核实]。

## Reference

- 论文：Albert Gu, Tri Dao. *Mamba: Linear-Time Sequence Modeling with Selective State Spaces*. [arXiv:2312.00752](https://arxiv.org/abs/2312.00752)
- 官方代码与预训练模型（论文给出）：[github.com/state-spaces/mamba](https://github.com/state-spaces/mamba)
- 站内：[时间序列总览](/0603_ML_Tasks_TimeSeries)、[时序深度学习篇](/0606_ML_Tasks_TimeSeries_Deep)

