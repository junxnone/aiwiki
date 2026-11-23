---
Title | MO KD LLM WhiteBox
-- | --
Created @ | `2026-11-23T01:55:41Z`
Updated @| `2026-11-23T01:58:56Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/696)

---
# LLM WhiteBox

"白盒"指蒸馏时**能访问 Teacher 的完整输出分布（logits）甚至中间层**，与只能拿到 Teacher 生成文本的"黑盒"蒸馏相对（见 [LLM 黑盒蒸馏](/0697_MO_KD_LLM_BlackBox)）。语言模型的白盒蒸馏经历了三个阶段：先是机器翻译里把蒸馏从词级推到序列级（Seq-KD），然后是 BERT 时代的编码器压缩（DistilBERT、TinyBERT、MiniLM），再到生成式大模型的蒸馏（MiniLLM、GKD、DistiLLM），后者的核心问题是**自回归解码中训练与推理的分布不一致**。本文覆盖：Seq-KD（*Sequence-Level Knowledge Distillation*，EMNLP 2016，arXiv:1606.07947）、DistilBERT（arXiv:1910.01108）、TinyBERT（*TinyBERT: Distilling BERT for Natural Language Understanding*，arXiv:1909.10351）、MiniLM（arXiv:2002.10957）、MiniLLM（*MiniLLM: On-Policy Distillation of Large Language Models*，ICLR 2024，arXiv:2306.08543）、GKD（*On-Policy Distillation of Language Models: Learning from Self-Generated Mistakes*，ICLR 2024，arXiv:2306.13649）和 DistiLLM（*DistiLLM: Towards Streamlined Distillation for Large Language Models*，arXiv:2402.03898）。

**一句话概括：从"在固定数据上匹配 Teacher 的词分布"出发，BERT 类方法增加了对注意力、隐状态的逐层蒸馏；生成式 LLM 蒸馏则把重点放在让 Student 在自己生成的序列上接受 Teacher 的反馈（on-policy），并围绕用哪种散度（前向 KL、反向 KL、JSD、skew KL）做了大量工作。**

> 标注约定：未标注的内容来自上述论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：总览 [知识蒸馏](0207_MO_KD)；发展历史 [KD History](0336_MO_KD_History)；基础损失与温度 [响应蒸馏](/0689_MO_KD_Response)；特征、注意力对齐的思想 [特征蒸馏](/0690_MO_KD_Feature)；黑盒蒸馏与推理蒸馏 [LLM 黑盒蒸馏](/0697_MO_KD_LLM_BlackBox)；视觉 Transformer 中的蒸馏见 [检测/分割/ViT 蒸馏](/0695_MO_KD_CV)。

## 1. 解决什么问题

- **压缩模型**：BERT、GPT 一类模型参数多、推理慢，需要把能力转移到更小的模型；
- **自回归模型的训练-推理分布不一致**：用 Teacher 的标注或固定数据训练 Student 时，Student 训练时看到的前缀来自固定数据，而推理时前缀来自它**自己的生成**，一旦出现偏离就会累积错误；
- **散度选择**：Student 容量远小于 Teacher 时，用前向 KL 要求覆盖 Teacher 分布的所有区域，会让 Student 把概率分给低质量输出。

## 2. 符号约定

- $x$：输入（提示）；$y=(y_1,\dots,y_T)$：输出序列；$y_{<t}$：前缀；
- $p(\cdot|x)$：Teacher 的分布；$q_\theta(\cdot|x)$：Student 的分布（参数 $\theta$）；
- $\mathrm{KL}(p\|q)$：前向 KL；$\mathrm{KL}(q\|p)$：反向 KL；
- 词级（token-level）分布：$p(y_t|y_{<t},x)$，词表为 $V$。

## 3. Seq-KD：从词级到序列级

Seq-KD 以神经机器翻译为对象，提出三种蒸馏方式。

**词级蒸馏（Word-level KD）**：在每个位置上匹配 Teacher 的词分布，即标准 KD：

$$
\mathcal L_{WORD\text{-}KD}=-\sum_{j=1}^{J}\sum_{k\in V}q(t_j=k\,|\,s,t_{<j})\,\log p(t_j=k\,|\,s,t_{<j})
$$

其中：$s$ 是源句，$t_{<j}$ 是目标句前缀，$q$ 是 Teacher 的词分布，$p$ 是 Student 的词分布，$V$ 是目标词表，$J$ 是目标句长度；该式可以与词级交叉熵 $\mathcal L_{WORD\text{-}NLL}$ 做加权混合。

**序列级蒸馏（Sequence-level KD）**：希望 Student 在整句层面模仿 Teacher，因为错误预测会在推理时向前传播。把数据分布换成 Teacher 的整句分布 $q(t|s)$：

$$
\mathcal L_{SEQ\text{-}KD}=-\sum_{t\in\mathcal T}q(t|s)\log p(t|s)\ \approx\ -\mathbb 1\{t=\hat y\}\log p(t|s)
$$

其中：$\mathcal T$ 是所有可能的序列集合（指数级，不可直接求和）；论文用 Teacher 分布的**众数**近似 $q$：用 beam search 找到 Teacher 的最优序列 $\hat y$，把它当伪标签。实践流程是三步：①训练 Teacher；②对训练集的每个源句用 Teacher 做 beam search，生成伪目标；③用交叉熵在这个新数据集上训练 Student——第③步与普通的词级 NLL 训练完全相同，只是数据换成了 Teacher 的生成结果。

**序列级插值（Sequence-level interpolation）**：把真实数据重新引入，在 $\mathcal L_{SEQ\text{-}NLL}$ 与 $\mathcal L_{SEQ\text{-}KD}$ 之间插值 $\mathcal L=(1-\alpha)\mathcal L_{SEQ\text{-}NLL}+\alpha\mathcal L_{SEQ\text{-}KD}$。直接训练真实序列 $y$ 与教师序列 $\hat y$ 会让数据翻倍，论文提出单序列近似：选择 beam 搜索 K-best 里与 $y$ 最相近的序列 $\tilde y=\arg\max_{t\in\mathcal T_K}\mathrm{sim}(t,y)$（相似度用平滑的句级 BLEU），再用 $\tilde y$ 训练。

## 4. BERT 时代的压缩

### 4.1 DistilBERT

DistilBERT 在**预训练阶段**蒸馏，得到可以像 BERT 一样微调的通用小模型。训练目标是三项损失的线性组合：

$$
\mathcal L=\alpha\,\mathcal L_{ce}+\beta\,\mathcal L_{mlm}+\gamma\,\mathcal L_{cos},\qquad \mathcal L_{ce}=-\sum_it_i\log s_i
$$

其中：

- $\mathcal L_{ce}$：Student 对 Teacher 软目标的交叉熵，$t_i$、$s_i$ 分别是 Teacher、Student 在温度 $T$ 下的概率（$p_i=\frac{\exp(z_i/T)}{\sum_j\exp(z_j/T)}$；训练时师生用同一温度，推理时 $T=1$）；
- $\mathcal L_{mlm}$：BERT 原本的掩码语言建模损失（监督损失）；
- $\mathcal L_{cos}$：余弦嵌入损失，让 Student 与 Teacher 隐状态向量的方向一致（论文发现加上它有益）；
- $\alpha,\beta,\gamma$：各项权重。

学生结构与 BERT 相同，去掉 token-type 嵌入与 pooler，层数减半（6 层）；**初始化**取 Teacher 每两层中的一层。论文报告：参数少 40%，推理快 60%，在 GLUE 上保持了 BERT 约 97% 的性能；在 iPhone 7 Plus 上问答推理比 BERT 快 71%，模型 207 MB；消融表明去掉蒸馏项损失性能下降明显，而去掉 MLM 损失影响较小。

### 4.2 TinyBERT

TinyBERT 不只蒸馏输出，而是对 Transformer 的各层做逐层蒸馏，并采用**两阶段**学习：通用蒸馏（在大规模语料上，用没有微调的 BERT 当 Teacher）和任务特定蒸馏（用微调后的 BERT，并配合数据增强）。假设 Student 有 $M$ 层、Teacher 有 $N$ 层，用映射函数 $g(m)$ 选出 Teacher 的 $M$ 层与 Student 对应：

$$
\mathcal L_{model}=\sum_{m=0}^{M+1}\lambda_m\,\mathcal L_{layer}\big(f^S_m(x),\,f^T_{g(m)}(x)\big),\quad
\mathcal L_{layer}=\begin{cases}\mathcal L_{embd},&m=0\\\mathcal L_{hidn}+\mathcal L_{attn},&0<m\le M\\\mathcal L_{pred},&m=M+1\end{cases}
$$

$$
\mathcal L_{attn}=\frac1h\sum_{i=1}^{h}\mathrm{MSE}(A^S_i,A^T_i),\quad
\mathcal L_{hidn}=\mathrm{MSE}(H^SW_h,H^T),\quad
\mathcal L_{embd}=\mathrm{MSE}(E^SW_e,E^T),\quad
\mathcal L_{pred}=\mathrm{CE}(z^T/t,\,z^S/t)
$$

其中：

- $f^S_m$、$f^T_{g(m)}$：Student 第 $m$ 层、Teacher 对应层的行为函数；$\lambda_m$：第 $m$ 层蒸馏的重要性权重；$m=0$ 是嵌入层，$m=M+1$ 是预测层；
- $A_i\in\mathbb R^{l\times l}$：第 $i$ 个注意力头的（未归一化的）注意力矩阵，$l$ 是序列长度，$h$ 是头数；论文发现拟合未经 softmax 的矩阵收敛更快；
- $H^S\in\mathbb R^{l\times d'}$、$H^T\in\mathbb R^{l\times d}$：师生的隐状态，$d'<d$；$W_h\in\mathbb R^{d'\times d}$ 是可学习的线性变换，把 Student 隐状态映射到 Teacher 维度；$E$、$W_e$ 对嵌入层同理；
- $z^S$、$z^T$：师生 logits，$t$ 为温度（论文发现 $t=1$ 效果好）；通用蒸馏阶段不做预测层蒸馏；
- 论文报告：4 层的 TinyBERT$_4$ 在 GLUE 上达到教师 BERT$_{BASE}$ 96.8% 以上的性能，同时参数少 7.5 倍、推理快 9.4 倍。

### 4.3 MiniLM

MiniLM 只蒸馏**Teacher 最后一层**的自注意力，避免逐层映射带来的麻烦，并允许 Student 的隐层维度不同于 Teacher：

$$
\mathcal L=\mathcal L_{AT}+\mathcal L_{VR},\quad
\mathcal L_{AT}=\frac{1}{A_h|x|}\sum_{a=1}^{A_h}\sum_{t=1}^{|x|}D_{KL}\big(A^T_{L,a,t}\,\|\,A^S_{M,a,t}\big),\quad
\mathcal L_{VR}=\frac{1}{A_h|x|}\sum_{a=1}^{A_h}\sum_{t=1}^{|x|}D_{KL}\big(VR^T_{L,a,t}\,\|\,VR^S_{M,a,t}\big)
$$

其中：

- $A_h$：注意力头数，$|x|$：序列长度；$L$、$M$：Teacher、Student 的层数；
- $A^T_{L,a}$、$A^S_{M,a}$：师生最后一层第 $a$ 个头的注意力分布（由查询与键的缩放点积得到）；
- $VR=\mathrm{softmax}\big(\frac{VV^\top}{\sqrt{d_k}}\big)$：**值关系（value relation）**，即各位置 value 向量之间的缩放点积，用 softmax 归一化后的分布；它把不同隐层维度的 value 转成同样大小的 $|x|\times|x|$ 关系矩阵，因此 Student 不需要额外的线性映射层；
- 论文还引入**助教（teacher assistant）**：对更小的 Student，先把 Teacher 蒸馏成中间规模的助教，再用助教教最终 Student。

## 5. 生成式 LLM 的蒸馏

### 5.1 前向 KL 与反向 KL

标准 KD 最小化前向 KL，即 $\mathrm{KL}(p\|q_\theta)$。MiniLLM 指出：对生成任务，若 Student 容量不足，前向 KL 会"高估 $p$ 的空白区域"，让 $q$ 在 Teacher 概率为零的区域上放大量概率，对应实际生成中的低质量文本；**反向 KL** 则具有"寻模式（mode-seeking）"的性质，使 $q$ 集中在 $p$ 的主要模式上，更适合保证生成的正确性与忠实度。

| 散度 | 形式 | 行为 | 倾向 |
|---|---|---|---|
| 前向 KL | $\mathrm{KL}(p\|q_\theta)$ | 覆盖模式（mode-covering） | $q$ 需覆盖 $p$ 的全部支撑，容量不足时易产生低质量文本 |
| 反向 KL | $\mathrm{KL}(q_\theta\|p)$ | 寻找模式（mode-seeking） | $q$ 集中在 $p$ 的大模式上，忽略小模式 |
| JSD$(\beta)$ | 前向、反向的插值 | 介于二者之间 | $\beta$ 控制偏向，GKD 常用 0.1/0.5/0.9 |

表中：

- 第一列是散度，第二列是形式，第三列是对分布的行为，第四列是在 LLM 蒸馏里的倾向；
- 论文（GKD）还发现：用温度采样评估时寻模式的散度表现更好，而贪心解码时散度的选择影响不大。

### 5.2 MiniLLM：反向 KL + 策略梯度

MiniLLM 的目标是最小化反向 KL：

$$
\theta=\arg\min_\theta\ \mathrm{KL}[q_\theta\|p]=-\mathbb E_{x\sim p_x,\,y\sim q_\theta}\log\frac{p(y|x)}{q_\theta(y|x)}
$$

其中：$p_x$ 是提示分布；期望中的 $y$ 由 **Student 自己**采样，所以这是**on-policy** 的。用策略梯度定理可以推出梯度：

$$
\nabla\mathcal L=-\mathbb E_{x,\,y\sim q_\theta}\sum_{t=1}^{T}\big(R_t-1\big)\nabla\log q_\theta(y_t|y_{<t},x),\qquad R_t=\sum_{t'=t}^{T}\log\frac{p(y_{t'}|y_{<t'},x)}{q_\theta(y_{t'}|y_{<t'},x)}
$$

其中：$R_t$ 是从第 $t$ 步起的累计"逐步质量" $r_t=\log\frac{p(y_t|\cdot)}{q_\theta(y_t|\cdot)}$；直觉是：让生成文本在 Teacher 下概率高（增大 $p$），同时保持多样性（降低 $q$）。策略梯度方差大、容易奖励投机，而且 $R_t$ 偏爱短句（可能输出空回复），因此论文提出三个策略：

- **单步分解（Single-step decomposition）**：把 $r_t$ 从 $R_t$ 里分离，$\mathbb E_{y_t\sim q}[r_t]$ 可以直接对词表求和而不用蒙特卡洛采样，降低方差、加速收敛；
- **教师混合采样（Teacher-mixed sampling）**：采样用 $\tilde p(y_t|\cdot)=\alpha\,p(y_t|\cdot)+(1-\alpha)\,q_\theta(y_t|\cdot)$，借助 Teacher 抑制重复短语等退化文本；用重要性采样修正偏差，并把权重近似为逐步比值以降低方差；
- **长度归一化（Length normalization）**：对 $R_{t+1}$ 做长度归一化，避免偏向短回复。

最终梯度由单步项、归一化的长程项以及保持通用能力的语言建模损失 $\mathcal L_{PT}=-\mathbb E_{d\sim D_{PT}}\log q_\theta(d)$ 组成，整体流程类似 RLHF：先在数据集上监督微调 Student 并选最优检查点，再按上式训练。

### 5.3 GKD：广义的 on-policy 蒸馏

GKD 把问题表述成统一的算法：Student 的训练数据可以来自**固定数据**（监督）或 **Student 自己生成的序列**（on-policy），散度也可以自选。每一步以概率 $\lambda$ 取 Student 生成的序列、否则取固定数据，对该批数据最小化师生分布的散度：

$$
\mathcal L_{GKD}(\theta)=(1-\lambda)\,\mathbb E_{(x,y)\sim(X,Y)}\big[\mathcal D(p_T\|p_S^\theta)(y|x)\big]+\lambda\,\mathbb E_{x\sim X}\Big[\mathbb E_{y\sim p_S(\cdot|x)}\big[\mathcal D(p_T\|p_S^\theta)(y|x)\big]\Big]
$$

其中：

- $\lambda\in[0,1]$：Student 数据比例，$\lambda=1$ 纯 on-policy，$\lambda=0.5$ 混合，$\lambda=0$ 监督；
- $\mathcal D(p_T\|p_S)(y|x)=\frac1{|y|}\sum_n\mathcal D\big(p_T(\cdot|y_{<n},x)\|p_S(\cdot|y_{<n},x)\big)$：逐 token 散度的平均；$\mathcal D$ 可取前向 KL、反向 KL 或广义 $\mathrm{JSD}(\beta)$；
- 其中广义 JSD 定义为 $\mathrm{JSD}(\beta)(P\|Q)=\beta\,\mathrm{KL}\big(P\|\beta P+(1-\beta)Q\big)+(1-\beta)\,\mathrm{KL}\big(Q\|\beta P+(1-\beta)Q\big)$，$\beta$ 在 0 与 1 之间插值（形式为一般写法，以论文为准 `[待核实]`）；
- **on-policy 采样时不对采样过程求梯度**（只对损失求梯度），所以实现起来与普通的蒸馏训练几乎一样；
- GKD 要求有一个起点不错的 Student（论文中先做监督微调），类似两阶段 RLHF；
- GKD 还可以与 RLHF/RLAIF 结合：on-policy GKD 只需要 Student 的输出样本，可与强化学习微调联合优化；与 RL 结合时建议用反向 KL 或 JSD(0.9)。

论文在摘要、机器翻译与算术推理上用 T5 做实验：on-policy 的 GKD 变体普遍优于 SeqKD、监督 KD、ImitKD、f-distill 等；在 XSum 摘要上，用 5% 数据、不用真实摘要的 on-policy GKD 就超过了用全量数据的监督 KD；论文还指出，借助 GKD 蒸馏出的 T5 比 PaLM（540B）的少样本表现还好，而参数小 7000 倍。

### 5.4 DistiLLM：skew KL + 自适应离策略

DistiLLM 针对两个问题：缺少统一的目标函数，以及 on-policy 方法因生成学生样本而成本很高。

**skew KL（SKL）**：用 Teacher 与 Student 的**混合分布**代替 Student 分布来算 KL：

$$
D_{SKL}^{(\alpha)}(p,q)=D_{KL}\big(p,\ \alpha p+(1-\alpha)q\big),\qquad
D_{SRKL}^{(\alpha)}(p,q)=D_{KL}\big(q,\ (1-\alpha)p+\alpha q\big)
$$

其中：$\alpha\in[0,1]$ 是混合系数；SKL 是 skew 前向 KL，SRKL 是 skew 反向 KL。论文的分析：

- **更稳定的梯度**：KL 对参数的梯度 $\nabla D_{KL}(p,q)=-r_{p,q}\nabla q(y|x)$，当 $q(y|x)\to0$ 时系数 $r_{p,q}$ 变大，梯度范数很大、更新噪声大；SKL 的混合使分母不会趋于零，梯度范数更小：$\nabla D_{SKL}^{(\alpha)}=-(1-\alpha)\,r_{p,\tilde q}\,\nabla q(y|x)$，其中 $\tilde q=\alpha p+(1-\alpha)q$；
- **更小的近似误差**：论文的 Theorem 1 给出 mini-batch 估计的 SKL 与真实 SKL 之差的 $L_2$ 范数上界；$\alpha$ 的选择是在梯度大小与 $L_2$ 范数之间权衡，$\alpha$ 取适中值最好；
- 论文还把 S(R)KL 与 JSD 做了比较：S(R)KL 在适中的 $\alpha$ 下能得到合适的范数（见论文 Fig. 3(c)(d)）。

**自适应离策略（adaptive off-policy）**：on-policy 每步都要让 Student 生成文本，成本高。DistiLLM 引入**回放缓冲区（replay buffer）**，把 Student 生成的序列存起来重复使用，并根据验证损失自适应地调度"使用 Student 生成输出（SGO）的概率"，随训练进行逐渐降低回放比例。论文报告在指令遵循等任务上同时取得更高的效果和更高的训练效率（相对 on-policy 方法）。

## 6. 对比汇总

| 方法 | 蒸馏对象 | 数据来源 | 使用的散度 / 损失 | 是否需要 Teacher logits |
|---|---|---|---|---|
| Seq-KD | 输出序列 | Teacher 的 beam search 序列（固定数据） | 序列级交叉熵 | 不需要（只要生成序列），可视为黑盒 |
| DistilBERT | 输出 + 隐状态方向 | 预训练语料（固定） | $\mathcal L_{ce}+\mathcal L_{mlm}+\mathcal L_{cos}$ | 需要 |
| TinyBERT | 嵌入、各层注意力与隐状态、预测 | 通用语料 + 增强的任务数据 | 逐层 MSE + 预测层 CE | 需要（含中间层） |
| MiniLM | 最后一层注意力分布与 value 关系 | 通用语料 | 两项 KL | 需要（含最后一层内部） |
| MiniLLM | 输出序列 | Student 自己生成（teacher-mixed） | 反向 KL（策略梯度） | 需要 |
| GKD | 输出序列 | 固定数据 / Student 生成，比例 $\lambda$ | 前向 KL、反向 KL、JSD$(\beta)$ | 需要 |
| DistiLLM | 输出序列 | 固定数据 + 回放缓冲区中的 Student 样本 | skew KL / skew 反向 KL | 需要 |

表中：

- 第一列是方法，第二列说明蒸馏匹配的信息，第三列是训练样本的来源，第四列是用的散度/损失，第五列是否需要 Teacher 的 logits（白盒信息）；
- 关键的演进主线：数据来源从"固定数据"走向"Student 自己生成"（解决训练-推理不一致），而散度从前向 KL 走向反向 KL、JSD、skew KL（解决容量不足的 Student 在生成里的行为）；
- Seq-KD 只需要 Teacher 生成文本，因此与下一篇的黑盒蒸馏思路相通 `[解读]`。

## 7. 总结 [解读]

- 白盒 LLM 蒸馏的两个旋钮：**样本从哪来**（固定数据 / on-policy / 回放缓冲）和**用什么散度**（前向 KL / 反向 KL / JSD / skew KL）；
- GKD 提供了统一框架，MiniLLM 把它写成 RL 视角并给出稳定训练的技巧，DistiLLM 关注效率与稳定性；
- 实用建议：先从监督微调的 Student 起步；容量差距大时优先尝试寻模式的散度，评估时注意温度与解码策略。

## Reference

- Kim Y, Rush A M. Sequence-Level Knowledge Distillation. EMNLP 2016. arXiv:1606.07947 `[作者与会议待核实]`
- Sanh V, Debut L, Chaumond J, Wolf T. DistilBERT, a distilled version of BERT: smaller, faster, cheaper and lighter. arXiv:1910.01108
- Jiao X, Yin Y, Shang L 等. TinyBERT: Distilling BERT for Natural Language Understanding. Findings of EMNLP 2020. arXiv:1909.10351 `[作者列表待核实]`
- Wang W, Wei F, Dong L, Bao H, Yang N, Zhou M. MiniLM: Deep Self-Attention Distillation for Task-Agnostic Compression of Pre-Trained Transformers. NeurIPS 2020. arXiv:2002.10957
- Gu Y, Dong L, Wei F, Huang M. MiniLLM: On-Policy Distillation of Large Language Models. ICLR 2024. arXiv:2306.08543
- Agarwal R, Vieillard N, Zhou Y 等. On-Policy Distillation of Language Models: Learning from Self-Generated Mistakes. ICLR 2024. arXiv:2306.13649 `[作者列表待核实]`
- Ko J, Kim S, Chen T, Yun S-Y. DistiLLM: Towards Streamlined Distillation for Large Language Models. ICML 2024 `[会议待核实]`. arXiv:2402.03898

