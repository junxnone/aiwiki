---
Title | MO Quantization KVCache
-- | --
Created @ | `2026-11-23T02:22:30Z`
Updated @| `2026-11-23T02:43:43Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/708)

---
# KV Cache 量化

自回归生成时，每一层注意力要缓存此前所有 token 的 Key 和 Value（KV cache），避免重复计算。当上下文变长、批量变大，**KV cache 取代权重成为显存占用的主角**，同时每一步解码都要把整块缓存从显存读入，造成计算核心空闲、推理速度受带宽限制。因此需要对 KV cache 单独做量化。本文覆盖两个代表：KIVI（*KIVI: A Tuning-Free Asymmetric 2bit Quantization for KV Cache*，arXiv:2402.02750）和 KVQuant（*KVQuant: Towards 10 Million Context Length LLM Inference with KV Cache Quantization*，arXiv:2401.18079）。

**一句话概括：KV cache 的元素分布有规律——Key 里有少数固定通道幅值特别大，所以 Key 要按通道量化；Value 没有这种通道特征，适合按 token 量化。KIVI 据此做 2 bit 的免调优量化，并保留最近一小段 token 的全精度；KVQuant 在此基础上加入 RoPE 之前量化 Key、非均匀数据类型、逐向量的稠密-稀疏分解等，做到 3 bit 下困惑度损失小于 0.1。**

> 标注约定：未标注的内容来自上述论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：总览 [量化](0312_MO_Quantization)；基础与粒度 [基础原理](/0699_MO_Quantization_Basics)；权重+激活量化 [LLM WA](/0707_MO_Quantization_LLM_WA)；仅权重量化 [LLM 权重量化](/0706_MO_Quantization_LLM_Weight)；系列中的 [量化历史](/0688_MO_Quantization_History)。

## 1. 解决什么问题

### 1.1 KV cache 有多大

对一个 Transformer，KV cache 的大小为：

$$
\text{KV cache 字节数}=2\times n_{layer}\times n_{head}\times d_{head}\times L_{seq}\times B\times b_{byte}
$$

其中：

- 系数 2 表示 Key 与 Value 各一份；$n_{layer}$ 是层数，$n_{head}$ 是（KV）头数，$d_{head}$ 是每个头的维度，$L_{seq}$ 是序列长度（prompt + 已生成），$B$ 是批大小，$b_{byte}$ 是每个元素的字节数（FP16 为 2）；
- 例如 Llama-2-7B（32 层、32 个头、头维度 128）在 FP16、序列长度 4096、批大小 1 时，约为 $2\times32\times32\times128\times4096\times2=2\,147\,483\,648$ 字节，即 **2 GiB**（该数值是本文按公式计算的 `[解读]`，不是论文给出的数字）；
- 它随序列长度与批大小线性增长，序列达到几十万 token 时会远超权重本身的大小。

### 1.2 为什么要单独量化

- 权重和激活的量化方法（见 [LLM WA](/0707_MO_Quantization_LLM_WA)）主要处理计算；KV cache 的瓶颈是**容量与带宽**；
- KV cache 里的元素分布与一般激活不同，**直接套用逐 token 的量化在 2～3 bit 下精度差**；
- KV cache 是**流式**产生的（每步新增一个 token），量化方式必须能方便地追加新 token。

## 2. 符号约定

- $X\in\mathbb R^{l_{prompt}\times d}$：Key 或 Value cache（$l_{prompt}$ 个 token，$d$ 个通道）；
- **逐 token（per-token）量化**：按行（每个 token）共享缩放与零点；**逐通道（per-channel）量化**：按列（每个通道）共享缩放与零点；
- $G$：组大小（group size）；$R$：残差长度（residual length）；$Q(\cdot)$：量化函数。

## 3. KIVI：Key 按通道、Value 按 token

### 3.1 对 KV cache 分布的观察

论文研究了主流 LLM 里 KV cache 的元素分布，得到两个结论：

- **Key cache**：少数几个**固定的通道**幅值非常大（与权重/激活量化文献里的离群通道现象一致）。因此要按**通道**量化——把同一通道的元素分到一组，大值通道各自有自己的缩放，不会拖累其他通道；
- **Value cache**：没有这样明显的离群通道，按 token 量化更合适，而且逐 token 的量化与流式生成天然匹配（新 token 量化后可以直接追加在已有缓存的 token 维度上）。

论文的模拟实验（Llama-2-13B，CoQA、TruthfulQA，组大小 32，Table 1）得出三条观察（OB）：

- 当 Value cache 按**通道**量化时，无论 Key 怎么量化，精度都明显变差（OB 2）；
- 在 INT2 这样的低精度下，最准确的方案是 **Key 按通道、Value 按 token**（OB 3）。

下图是两种量化方向的定义示意。

```
X ∈ R^{l×d}（行=token，列=通道）
逐 token 量化：每一行一组 (s, z)      →  Value 用这种
逐通道量化：  每一列一组 (s, z)      →  Key 用这种（大幅值通道各用各的缩放）
```

图中：

- 行方向是 token 维度，列方向是通道维度；逐 token 量化让每个 token 共享一对缩放/零点，逐通道量化让每个通道共享；
- Key 的离群发生在固定通道上，所以逐通道可以把离群通道隔离开；Value 则不然。

### 3.2 算法

KIVI 把缓存分成**分组部分**和**残差部分**，只量化分组部分，**最近的 $R$ 个 token 保持全精度**：

$$
X=\big[X_g;\ X_r\big],\qquad \text{存储：}\ Q(X_g)\ (\text{组大小 }G),\ \ X_r\ (\text{全精度，至多 }R\text{ 个 token})
$$

其中：

- $X_g$ 是已经可以被均分成 $(l-r)/G$ 组的较早 token 部分，用分组量化存储；$X_r$ 是最近的 $r\le R$ 个 token，保持全精度；
- **Key**：新生成的 key 先加入 $X_r^K$，当 $X_r^K$ 累积到 $R$ 个 token（残差长度 $R$ 是超参数）时，就把它整体按通道量化并拼接到已量化的 Key 后面，然后清空 $X_r^K$；
- **Value**：维护一个队列，新生成的 value 入队；当队列达到残差长度 $R$ 时，弹出最旧的一个 value，按 token 量化后拼到已量化部分；
- **预填充（prefill）阶段**：传给后续层的仍是精确的 Key/Value 张量，只是内存里只保留量化后的 KV cache；
- 实践中取 $R\le128$，而序列长度通常远大于 $R$，所以保留全精度残差的额外内存开销很小；
- 实现上，把反量化与矩阵乘融合成一个 CUDA 内核（图中的 `Q_Matmul`），组量化内核用 Triton 实现；KIVI 与仅权重量化完全兼容。

论文结果（摘要）：KIVI 无需任何微调，在 Llama、Falcon、Mistral 上保持几乎相同的质量，同时**峰值显存（含模型权重）降低 2.6 倍**；由此批大小可增大到约 4 倍，真实推理负载下吞吐提升 **2.35～3.47 倍**。

## 4. KVQuant：面向超长上下文的 KV cache 量化

KVQuant 的目标是让 3 bit 甚至更低的 KV cache 量化也能保持精度，以支持超长上下文，用四项技术：

1. **逐通道 Key 量化（Per-Channel Key Quantization）**：调整量化 Key 激活所沿的维度，使之匹配其分布（与 KIVI 相同的观察；论文指出另一并发工作也探索了逐通道 Key 量化，但其方法需要额外的在线处理）；
2. **RoPE 之前量化 Key（Pre-RoPE Key Quantization）**：RoPE 把位置相关的旋转作用到 Key 与 Query 上：

$$
\tilde K_n=R^{d}_{n}\,K_n,\qquad K_n=W_kx_n
$$

其中：$K_n$ 是第 $n$ 个位置的 Key，$R^d_n$ 是位置 $n$ 对应的旋转矩阵（RoPE 以与位置索引成倍数的角度旋转成对的通道）。如果缓存的是旋转之后的 $\tilde K_n$，那么不同位置会以不同角度混合成对的通道，破坏"固定通道有离群"的结构，不利于逐通道量化。KVQuant 因此**缓存旋转之前的 $K_n$ 并量化它**，推理时再在线施加 $R^d_n$（在 CUDA 内核里完成）；

3. **非均匀 KV cache 量化（nuqX）**：均匀量化对 Query/Key 激活并不是最优；而 KV cache 加载受内存带宽限制，反量化的额外计算不会增加延迟，所以适合使用非均匀数据类型。论文为每一层的 Key/Value **离线用 k-means** 求出带敏感度加权的量化"路标"（signposts），目标是最小化敏感度加权的量化误差：

$$
Q(A)\approx\arg\min_{Q}\sum_i F_{ii}\,\big(A_i-Q(A_i)\big)^2
$$

其中：$A$ 是（归一化后的）激活，$F_{ii}$ 是 Fisher 信息矩阵的对角元素，表示该元素对任务损失的敏感度（敏感度大的元素对应的量化误差权重大）；非均匀码字由 k-means 在校准集上离线求得，每个 Key 层或 Value 层一套（该式对应论文式 1，论文还在附录 E 对其做了归一化适配）；

4. **逐向量稠密-稀疏量化（Per-Vector Dense-and-Sparse Quantization）**：大部分元素落在动态范围的一小部分内，把少量数值离群值单独（稀疏）存放，剩余元素的量化范围缩小、精度更高；但不同通道/token 的幅值差异大，统一阈值不合适，所以对**每个向量使用不同的离群阈值**（逐通道量化时每通道一个阈值，逐 token 量化时每 token 一个阈值）：逐通道的离群阈值可离线校准得到，逐 token 的阈值在线高效计算。

此外还有**注意力汇聚点感知量化（Attention Sink-Aware Quantization）**：LLM 在前几层之后往往把很大的注意力分给第一个 token（"汇聚点"），因此模型对第一个 token 的量化误差特别敏感；**只把第一个 token 保持 FP16** 就能明显改善困惑度。以及**离线校准与在线计算**的取舍：激活量化要么在线统计（可能代价高），要么用离线校准数据（可能影响精度），论文对 Key 的逐通道阈值用离线校准、对 token 阈值在线计算。

论文结果（摘要）：在 LLaMA、Llama-2、Llama-3、Mistral 上，3 bit 量化在 Wikitext-2 与 C4 上困惑度损失 **< 0.1**，优于已有方法；可使 LLaMA-7B 在单块 A100-80GB 上支持**最长 100 万**上下文，在 8 卡系统上支持最长 **1000 万**；自研 CUDA 内核相对 FP16 的矩阵-向量乘最高约 **1.7 倍**加速（LLaMA-7B）。

## 5. 方法对比

| 方法 | 位宽（论文重点） | Key 的量化方式 | Value 的量化方式 | 额外设计 |
|---|---|---|---|---|
| KIVI | 2 bit | 逐通道（分组） | 逐 token（分组） | 最近 $R$ 个 token 保留全精度；融合 CUDA 内核；免调优 |
| KVQuant | 3 bit（及更低） | 逐通道，**RoPE 之前**量化 | 逐 token | 非均匀数据类型（k-means）、逐向量稠密-稀疏、首 token 保持 FP16、离线校准 |

表中：

- 第一列是方法，第二列是论文重点关注的位宽，第三、四列是 Key、Value 的量化方式，第五列是额外的关键设计；
- 两者都发现 **Key 适合逐通道、Value 适合逐 token**；KIVI 走"简单、免调优、2 bit"路线，靠保留近期 token 的全精度缓解精度损失；KVQuant 走"精细、3 bit、超长上下文"路线，用更多技术把精度推到 < 0.1 PPL 的损失；
- 实际选择：追求实现简单和吞吐、能接受少量精度损失，用 KIVI 一类方案；追求超长上下文和高保真，用 KVQuant 一类方案；二者与权重/激活量化可以叠加 `[解读]`。

## 6. 总结 [解读]

- KV cache 量化与权重量化的区别在于：它是**运行时产生的数据**（流式追加）、对**分布结构**（通道/位置）高度敏感，所以"沿哪个维度量化"比位宽本身更关键；
- 长上下文下，KV cache 往往是比权重更大的显存项，量化 KV cache 的收益常常大于继续压缩权重；
- 与注意力机制本身的改进（如 GQA、多查询注意力减少 KV 头数）是正交的，可以同时使用。

## Reference

- Liu Z, Yuan J, Jin H, Zhong S, Xu Z, Braverman V, Chen B, Hu X. KIVI: A Tuning-Free Asymmetric 2bit Quantization for KV Cache. arXiv:2402.02750
- Hooper C, Kim S, Mohammadzadeh H, Mahoney M W, Shao Y S, Keutzer K, Gholami A. KVQuant: Towards 10 Million Context Length LLM Inference with KV Cache Quantization. arXiv:2401.18079
- Su J 等. RoFormer: Enhanced Transformer with Rotary Position Embedding（RoPE）. 2021. `[未读原文]`


