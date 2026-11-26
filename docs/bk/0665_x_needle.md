-----

| Title     | x needle                                              |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-19T09:35:22Z`                                |
| Updated @ | `2026-11-26T08:19:54Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/665) |

-----

# Needle

Needle 是 [Cactus Compute](https://cactuscompute.com/) 开源的端侧小模型家族，专做
**Tool Calling（函数调用）**、结构化抽取和文本 Embedding，不是聊天模型。核心观点是：Tool Calling
本质是「检索 + 组装」（把用户请求匹配到工具名、抽取参数值、输出 JSON），而不是推理，所以在小规模下 FFN
参数是浪费的，整个模型只用 **Attention + Gating**，称为 **Simple Attention
Network**。

> 以下数字（参数量、速度、基准）均来自官方博客与产品页，属厂商自报，未经独立复现。

## 版本

下表按时间列出 Needle 的三代：「规模」列在 v1、Needle 3 里是参数量，Needle 2
只有体积数据；「特点」列是各代相对上一代的主要变化。三代之间的主线是：先验证「无
FFN 的 Attention 网络能做函数调用」（v1），再压到十几 MB（Needle 2），最后做成一套权重可伸缩深度、并扩展到抽取与
Embedding 的基础模型（Needle 3）。

| 版本         | 时间         | 规模                            | 特点                                                              |
| ---------- | ---------- | ----------------------------- | --------------------------------------------------------------- |
| Needle（v1） | 2026-05-12 | 26M 参数                        | 单次函数调用，无 MLP，6000 tok/s prefill、1200 tok/s decode               |
| Needle 2   | 2026-08-11 | 45M 参数，14MB 二进制，完整会话约 28MB 内存 | 可在 Raspberry Pi 5 纯 CPU 离线运行；仍在 `legacy` 分支（`cactus-compute<4`） |
| Needle 3   | 2026-09-17 | 29–121M 参数，8–29MB             | 一套权重多种深度（Laddered），2-bit 量化，加入抽取与 Embedding                     |

## Needle v1：Simple Attention Network

  - **架构**：全模型只有 Attention 和 Gating，没有任何
    MLP。结论是：只要任务所需的事实能从输入里拿到（工具定义、RAG
    检索结果），模型就不必把知识记在 FFN 权重里。作者认为这个「无 FFN」结论可推广到任何「外部有结构化知识」的任务。
  - **预训练**：200B tokens，16 张 TPU v6e，约 27 小时。
  - **后训练**：2B tokens 合成的函数调用数据，约 45 分钟；数据由 Gemini 合成，覆盖 15
    类工具（定时器、消息、导航、智能家居等）。
  - **效果**：在单次函数调用上优于
    FunctionGemma-270M、Qwen-0.6B、Granite-350M、LFM2.5-350M；官方也说明这些模型在多轮对话上能力更强，Needle
    只针对单次调用。

## Needle 3：Laddered Simple Attention Networks

### 梯度式容量（Intelligence Laddering）

同一套权重里，每一层都是一个容量单调增加的子网络，部署时可以选 2 层到 20 层的任意深度（保留第 0 层和最后一层），对应 29M–121M
参数、约 8–29MB 的 2-bit（CQ2）二进制。每个子网络都可以单独微调：官方称 4 层子网络在下游任务上微调一个 epoch 后可追平
DeepSeek V4 Flash。

### 结构（20 层、121M 参数、$`d=768`$）

下表是 20 层完整模型（121M）的组件清单，左列是组件名，右列是官方给出的配置。层号从 0 开始计数，即第 0 到第 19 层。

| 组件        | 说明                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------ |
| Embedding | 词表 8,192（SentencePiece BPE），Embedding 与输出层共享                                                           |
| mHC 残差    | 4 条残差 lane，读取时按输入门控加权混合，写回时用 Sinkhorn 归一化的矩阵 $`P`$ 混合 lane                                             |
| Engram 记忆 | 2-gram / 3-gram 哈希记忆表，在第 3、7、11、15、19 层通过 gather 读取，共 18,432 个 slot                                    |
| Attention | GQA（12 个 q head、2 个 kv head），RoPE + QK-norm，Q/K/V 后接 3-tap 因果深度卷积；滑动窗口 1024，第 4、9、14、19 层为全局 attention |
| FFN 替代    | Monarch Hadamard 结构化线性层（$`32\times32`$ 的 Monarch 因子），而不是稠密 FFN                                         |
| 输出        | 字节级语法约束解码，保证输出能解析为合法的函数调用                                                                              |
| 训练辅助      | MTP（预测 $`t+2`$）辅助头，只在训练时使用                                                                             |

读表要点：

  - **GQA 的 12 : 2**：12 个 query head 共用 2 组 key/value head，即每 6 个 query
    head 共享一组 KV。这样 KV 缓存只有普通多头注意力的 1/6，对内存很小的设备很重要。
  - **滑动窗口与全局层**：大多数层的 Attention 只看最近 1024 个 token；只有第 4、9、14、19 层（每隔 5
    层一次）能看到整个序列，负责跨远距离的信息汇总。
  - **Engram 站点**：第 3、7、11、15、19 层（每隔 4 层一次）各有一次查表融合。第 19 层同时有 Engram
    和全局 Attention。
  - **「说明」列里的 $`P`$、$`t+2`$** 分别是 mHC 的混合矩阵和多 token
    预测的目标位置，含义见下文「公式详解」；MTP
    辅助头只用于训练，部署时不带。

这个结构里有四组核心公式（门控 Attention、mHC 读写、Engram 融合、Monarch FFN），逐项解释见下文「公式详解」。

按官方说法，121M 参数中有 70.8M 位于 Engram 表里，这部分只做 gather、不做矩阵乘，所以每 token 的 FLOPs
比同配置 [Transformer](0229_ML_Transformer) 少 2 倍以上；官方称 121M 模型的效果相当于 50M
的常规模型。

下面的示意图画出一个 token 序列从输入到输出的完整路径，自上而下是前向计算的顺序：

    token ids
       │
    Embedding (8192 × 768) ──► 4 条残差 lane
       │
       ▼  × 20 层（可裁成 2..20 层，始终保留第 0 层和第 19 层）
    ┌──────────────────────────────────────────────┐
    │ mHC 读：lane 加权混合 → x                    │
    │ [Engram 融合]  仅第 3,7,11,15,19 层          │
    │ Q/K/V 投影 → 3-tap 因果卷积 → GQA Attention  │
    │   （窗口 1024；第 4,9,14,19 层为全局）       │
    │ Monarch Hadamard FFN                         │
    │ mHC 写：P=Sinkhorn(A) 混合 lane + 新输出     │
    └──────────────────────────────────────────────┘
       │
    mean(lanes) → ZCRMSNorm → 共享 unembed
       │
    字节级语法约束解码 → 合法的 JSON 函数调用

图例：

  - **Embedding → 4 条残差 lane**：token 查表得到 768 维向量后，复制成 4
    条并行的残差通道（lane），后面每层都在这 4 条 lane 上读写。
  - **方框内是一层的内部**，按从上到下的顺序执行，整个方框重复 20 次：先从 lane 读出输入，再依次经过
    Engram（仅部分层）、Attention、FFN，最后把结果写回 lane。
  - **方括号 `[Engram 融合]`** 表示只有第 3、7、11、15、19 层才有这一步，其余层跳过。
  - **「裁成 2..20 层」**：由于是梯度式（Laddered）训练，可以只部署其中一部分层得到更小的模型，但第 0 层和第 19
    层始终保留。
  - **方框之后**：把 4 条 lane 取平均、做归一化（ZCRMSNorm），与 Embedding
    共享权重的输出层映射回词表，再由字节级语法约束解码得到合法的函数调用
    JSON。
  - 训练专用的 MTP 辅助头未画出。

### 几个关键部件的来源与作用

这些部件在 Needle 3 里都是组合使用的现成思路，官方页面只给了结构图，下面的原理说明来自各自的原论文。

  - **mHC（Manifold-Constrained Hyper-Connections）**：Hyper-Connections
    把残差流加宽成多条 lane，并让各 lane 之间的连接可学习，效果更好但容易让信号发散。mHC 把 lane
    间的残差混合矩阵约束为**双随机矩阵**（Birkhoff 多面体），用 Sinkhorn-Knopp
    迭代做近似投影，这样多层相乘后仍是双随机矩阵，信号传播是特征的凸组合，保持恒等映射的稳定性（论文
    [arXiv:2512.24880](https://arxiv.org/abs/2512.24880)，DeepSeek-AI）。Needle
    图中的 $`P = \mathrm{Sinkhorn}(A)`$ 对应这一约束。
  - **Engram（Conditional Memory via Scalable Lookup）**：给 Transformer
    增加一种与 MoE 互补的稀疏性。每个位置把前面若干 token
    的后缀（2-gram、3-gram）哈希成键，去查可学习的 n-gram
    Embedding 表，再用上下文门控融合进隐状态。查表是 $`O(1)`$ 的确定性寻址，增加存储但**不增加每 token 的
    FLOPs**（论文
    [arXiv:2601.07372](https://arxiv.org/abs/2601.07372)，DeepSeek-AI
    与北京大学）。Needle 把「知识放进查表、而不是 FFN」这个思路压到了几十 MB 的规模。
  - **Monarch
    矩阵**：用两个分块对角矩阵相乘（外加置换）来参数化大矩阵，比稠密矩阵省参数、省算力，同时能表达卷积、Hadamard
    变换等常见变换（论文 [arXiv:2204.00595](https://arxiv.org/abs/2204.00595)，ICML
    2022）。Needle 里的 Monarch Hadamard FFN 用它替代稠密 FFN，式中 $`M_i = A_i
    \otimes B_i`$。
  - **字节级语法约束解码**：解码时只允许生成符合函数调用 JSON 语法的字节，因此输出一定能解析，不会出现格式错误。

### 参数构成（推导）

下面是我根据官方给出的维度做的算术核对，不是官方给出的分项数字。表中「计算」列是推导用的算式，「参数量」列是结果；前两行直接由维度相乘得到，第三行是用总参数量减去前两行得到的余量：

| 部分                                    | 计算                                           | 参数量              |
| ------------------------------------- | -------------------------------------------- | ---------------- |
| Engram 表                              | $`18432 \times 768 \times 5`$（5 个融合站点）       | 约 70.8M，与官方一致    |
| Embedding                             | $`8192 \times 768`$（与输出层共享）                  | 约 6.3M           |
| 其余（20 层的 Attention、Monarch FFN、mHC 等） | $`121\text{M} - 70.8\text{M} - 6.3\text{M}`$ | 约 44M，平均每层约 2.2M |

也就是说，约 58% 的参数只参与查表；真正要做矩阵乘的参数大约只有 50M，这和官方「相当于 50M 常规模型」的说法大致吻合。

### 公式详解

官方页面只给出了结构图里的公式，没有逐项定义符号。下面的解释分两类：来自原论文或标准定义的，直接陈述；根据公式形状和上下文做的推断，会明确标注「推断」。

**符号约定**：隐层维度 $`d=768`$；每个 token 在 4 条残差 lane 上各有一个 $`d`$ 维向量，第 $`n`$ 条
lane 记为 $`X_n \in \mathbb{R}^{d}`$，把 4 条 lane 堆叠起来得到 $`X \in
\mathbb{R}^{4 \times d}`$；$`\sigma`$ 是 sigmoid，值域 $`(0,1)`$；$`\odot`$
是逐元素相乘；帽子 $`\hat{\cdot}`$ 表示做过 RMSNorm 的向量。

#### 1\. 带门控的 Attention

先看标准 Attention：当前 token 的 query 和所有可见 token 的 key 做点积，除以 $`\sqrt{d}`$
缩放后过 softmax 得到权重，再对 value 加权求和。Needle 在此基础上做了两处改动：

$$ o = \\sigma(g) \\odot \\mathrm{softmax}\\left(\\frac{\\hat q \\hat
K^\\top}{\\sqrt{d}}\\right) V $$

  - $`\hat q, \hat K`$：**QK-norm**，query 和 key 在点积前先做
    RMSNorm，使它们的模长固定，点积的幅度可控，softmax 的输入不会因某些极端
    token 而爆炸。
  - $`d`$：这里指每个 head 内 query/key 的维度。按结构图写的「48 qk / 64 v」，应为 48，而不是
    768（推断）。
  - $`\mathrm{softmax}(\cdot)V`$：标准 Attention 输出，即按相关度对 value 加权平均。
  - $`\sigma(g)`$：**输出门控**。$`g`$ 与 Attention 输出同形状，由当前 token
    的隐状态线性投影得到（推断，页面未写明）；$`\sigma(g)`$ 逐元素落在
    $`(0,1)`$，相当于给每个通道配一个「音量旋钮」。当没有相关内容可取时，门可以压到接近 0，让这个 head
    的输出静默，而不是被迫输出一个加权平均值。
  - 这一类「softmax 后再乘 sigmoid 门」的设计也出现在其他近期模型中，例如前文 Qwen3.5 的 Gated
    Attention 层。

另外，Q/K/V 投影之后各接一个 **3-tap 因果深度卷积**：

$$ q\_t = \\sum\_{j=0}^{2} w\_j \\odot q\_{t-j} $$

  - $`q_t`$ 是第 $`t`$ 个 token 的 query，$`w_0, w_1, w_2`$ 是每个通道各自的 3
    个可学习权重（深度卷积，即通道之间不混合）。
  - 含义：每个 token 的 query 混入自己和前两个 token 的信息，用极少的参数（每通道 3
    个）提供局部上下文和位置感。它是因果的，只看过去，不看未来。K、V
    同理。

#### 2\. mHC：多 lane 残差的读与写

标准 Transformer 只有一条残差流 $`x \leftarrow x + \mathrm{Sublayer}(x)`$。mHC
把残差流扩成 4 条 lane，每层「读」一次、「写」一次。

**读**：把 4 条 lane 合成该层子层的输入 $`u \in \mathbb{R}^d`$。

$$ u = \\sum\_{n=1}^{4} \\sigma\\left(a, \\phi\_n^\\top \\hat x +
b\\right) X\_n,\\qquad \\hat x = \\mathrm{rms}(\\text{lanes}) $$

  - $`\hat x`$：对 lane 做 RMSNorm 后得到的归一化状态，作为「当前内容」的摘要（具体怎么聚合 4 条
    lane，页面未写明）。
  - $`\phi_n`$：第 $`n`$ 条 lane 的可学习向量；$`a, b`$ 是可学习的标量（缩放和偏置）。
  - $`\sigma(a\,\phi_n^\top \hat x + b)`$：第 $`n`$ 条 lane 在本次读取中的权重，取值
    $`(0,1)`$。它依赖当前内容，所以每个 token 会按需要从不同 lane 读取，而不是固定求和。

**写**：子层输出 $`y \in \mathbb{R}^d`$ 回写进 lane，并让 lane 之间互相混合。

$$ X' = P,X + 2,\\sigma(h) \\otimes y,\\qquad P = \\mathrm{Sinkhorn}(A)
$$

  - $`PX`$：$`P`$ 是 $`4 \times 4`$ 的矩阵，把 4 条 lane 重新线性混合。
  - $`2\sigma(h) \otimes y`$：$`h \in \mathbb{R}^4`$ 给每条 lane 一个写入强度
    $`2\sigma(h_n) \in (0,2)`$，$`\otimes`$ 是外积，得到 $`4 \times d`$
    的矩阵，即把同一个 $`y`$ 按不同强度写入各 lane。系数 2 使 $`h=0`$ 时强度恰为
    1，即初始时等价于普通残差相加（推断）。
  - $`P = \mathrm{Sinkhorn}(A)`$：**Sinkhorn-Knopp** 把任意实矩阵 $`A`$
    变成**双随机矩阵**，即所有元素非负，且每行、每列之和都为
    1。做法是先取指数保证为正，再反复交替做「行归一化、列归一化」：

$$ P^{(0)}*{ij} = e^{A*{ij}},\\qquad P \\leftarrow \\mathrm{RowNorm}(P)
;\\to; P \\leftarrow \\mathrm{ColNorm}(P);\\to; \\cdots $$

mHC 论文用 20 次迭代；Needle 的迭代次数页面未说明。

**为什么要约束成双随机矩阵**：一个 2 条 lane 的例子。取 $`A = \begin{pmatrix} 0 & -1 \\ -1
& 0 \end{pmatrix}`$，则 $`e^{A} \approx \begin{pmatrix} 1 & 0.368 \\ 0.368
& 1 \end{pmatrix}`$，归一化后

$$ P \\approx \\begin{pmatrix} 0.731 & 0.269 \\ 0.269 & 0.731
\\end{pmatrix} $$

  - 行和为 1：每条新 lane 都是旧 lane 的**凸组合**（$`X_1' = 0.731X_1
    + 0.269X_2`$），不会把信号放大。
  - 列和为 1：每条旧 lane 的内容被完整地分配出去，**总量守恒**，不会凭空消失。
  - 双随机矩阵的乘积仍是双随机矩阵，所以 20 层的 $`P`$ 连乘之后仍然稳定。这正是 mHC 想解决的问题：不加约束的
    Hyper-Connections 在 27B 模型上，多层复合映射的幅度可达近 3000，而 mHC 只有约 1.6（论文报告）。

#### 3\. Engram：用查表代替记忆

$$ x \\leftarrow x + \\sigma\\left(\\frac{\\langle \\hat x, \\hat k
\\rangle}{\\sqrt{d}}\\right) v $$

分三步理解（前两步描述的是 Engram 论文的做法，Needle 沿用；具体细节以论文为准）：

1.  **哈希寻址**：取当前位置前面 2 个或 3 个 token（2-gram、3-gram），哈希后对表大小取模，得到表中的 slot
    编号：

$$ \\mathrm{idx} = \\mathrm{hash}(t\_{i-m+1}, \\ldots, t\_i) \\bmod
18432,\\qquad m \\in {2,3} $$

2.  **取出 key 和 value**：从表里取出该 slot 的可学习向量 $`e`$，再投影成 key $`k`$ 和 value
    $`v`$。这一步只是 gather（按下标取行），没有矩阵乘，所以不增加每个 token 的 FLOPs。
3.  **门控融合**：用当前隐状态 $`\hat x`$（作 query）和 $`\hat k`$ 做点积，除以 $`\sqrt{d}`$
    后过 sigmoid，得到一个 $`(0,1)`$ 的标量门，再用它决定 $`v`$ 写进隐状态 $`x`$ 的比例。

门的作用有两个：当取出的记忆和当前上下文无关时（例如不同 n-gram 哈希到同一个 slot 的冲突），点积很小，门接近
0，噪声记忆被压掉；相关时门接近 1，记忆被完整写入。

直观上，「把灯关掉」这类常见短语在训练里会稳定地映射到同一个 slot，表里就可以记住它们常伴随的工具名和参数模式，而不必占用 FFN
的矩阵乘算力（这是示意，不是官方给出的例子）。

#### 4\. Monarch Hadamard FFN

官方图中的 FFN 替代形式为：

$$ y = D\_4 M\_3 D\_3 M\_2, \\mathrm{silu}\\left(D\_2, c(x), M\_1 D\_1 x
+ b\\right),\\qquad M\_i = A\_i \\otimes B\_i $$

  - $`D_1, \ldots, D_4`$：对角矩阵，即对每个通道做一个可学习的缩放（Hadamard 乘积）。
  - $`M_i = A_i \otimes B_i`$：$`A_i`$ 与 $`B_i`$ 是两个 $`32 \times 32`$
    的小矩阵，$`\otimes`$ 是 Kronecker 积，得到一个 $`1024 \times 1024`$
    的结构化矩阵（把「$`32 \times 32`$」理解为因子大小，是推断）。
  - $`\mathrm{silu}(z) = z\,\sigma(z)`$：激活函数，整个结构的位置相当于普通 FFN 中间的非线性。
  - $`b`$：偏置。
  - $`c(x)`$：页面没有定义，这里不展开解释。

**为什么省**：稠密的 $`1024 \times 1024`$ 矩阵有约 $`10^6`$ 个参数，一次矩阵向量乘需要约 $`10^6`$
次乘法。而 Kronecker 积有恒等式 $`(A \otimes B)\,\mathrm{vec}(X) =
\mathrm{vec}(B X A^\top)`$，把向量重排成 $`32 \times 32`$ 的矩阵后，只需要两次 $`32
\times 32`$ 的矩阵乘，约 $`2 \times 32^3 = 65{,}536`$ 次乘法，参数也只需 $`2
\times 32^2`$ 个，大约少 16 倍的计算量，同时参数极少，适合几十 MB 的体积预算。

#### 小结

  - **门控**（Attention 的 $`\sigma(g)`$、mHC 的读写权重、Engram
    的融合门）：都是「按需写入、按需读取」。
  - **约束**（QK-norm、Sinkhorn 双随机矩阵）：保证小模型和低比特量化下训练与推理依然稳定。
  - **结构化稀疏**（Engram 查表、Monarch / Kronecker FFN）：把参数和计算分开，用 gather
    和小矩阵乘代替稠密矩阵乘。

### 能力与训练

  - **输入 / 输出**：文本 + 工具定义或抽取 schema → 带工具调用或抽取结果的 JSON。
  - **三类任务**：Tool Calling（按工具描述选工具、填参数，支持多调用、无匹配时返回空列表）、结构化抽取（schema
    约束解码保证输出可解析）、文本 Embedding（本地检索、路由、去重）。
  - **训练数据**：360B tokens 的专有结构化数据。
  - **速度**：Raspberry Pi 5 上 decode 400–4k tok/s，prefill 1–10k tok/s。
  - **许可**：Apache 2.0。

### 评测基准

下表列出官方使用的六个基准，分两类任务：Tool Calling 考「选对工具并填对参数」，抽取考「从文本里按 schema
抽出字段」。「基准」列括号里的数字是测试集条数，「指标」列是打分方式。

| 类别           | 基准                                       | 指标               |
| ------------ | ---------------------------------------- | ---------------- |
| Tool Calling | Mobile Actions（961 条）                    | 精确匹配             |
| Tool Calling | DroidCall（200 条，部分需两次调用）                 | 按顺序精确匹配          |
| Tool Calling | BFCL v4 单轮（3,641 条）                      | AST 匹配，无关请求要求不调用 |
| 抽取           | DSTC8（1,813 轮）、SNIPS 给定 schema、SNIPS 七选一 | 字段 F1            |

基准与指标的含义：

  - **Mobile Actions**：把手机上的自然语言指令映射到 Android
    Intent；**DroidCall**：同样是手机请求，其中一部分需要依次调用两个函数。
  - **BFCL v4**（Berkeley Function Calling
    Leaderboard）：单轮函数调用，包含「请求与任何工具都无关，应当不调用」的负例。
  - **DSTC8**：对话轮次里的槽位抽取；**SNIPS 给定 schema**：已知该用哪个
    schema，只做槽位填充；**SNIPS 七选一**：先在七个 schema
    里选对，再填槽位，比前者多一步分类。
  - **精确匹配**：函数名和全部参数都与标准答案完全一致才算对，只要有一个参数错就记为错。
  - **按顺序精确匹配**：在精确匹配基础上，多个调用的先后顺序也必须一致。
  - **AST 匹配**：把调用解析成语法树再比较，允许参数顺序、等价写法不同；对「应当不调用」的样本，输出空列表才算对。
  - **字段 F1**：对抽取出的字段计算精确率 $`P`$ 和召回率 $`R`$，取调和平均 $`F_1 =
    \frac{2PR}{P+R}`$，兼顾「抽错」和「漏抽」。

官方结论：在移动端 Tool Calling 上优于 10 倍大小的模型，在抽取上持平 2–3 倍大小的模型；在 DroidCall
上微调能让各子网络提升 18–36 个点。

## 使用

``` bash
pip install -U cactus-compute
```

``` python
import cactus

@cactus.tool
def get_weather(city: str):
    "Get the current weather for a city."
    return {"city": city, "temp_c": 27, "sky": "clear"}

agent = cactus.Cactus(tools=[get_weather])
agent.complete("What's the weather in Paris?")
```

  - **工具描述**：函数签名给出参数类型，docstring
    就是工具描述。官方建议每个动作一个窄工具、枚举值用用户的说法命名、每轮保持工具集合很小。
  - **triggers**：给工具配置正则 `triggers`，匹配后会限制只在匹配的工具中解码并要求必须调用。
  - **置信度**：每次返回都带校准过的 `confidence`；低于下限（0.1）的调用会被放进
    `suppressed_calls`，应用可据此决定「直接执行 / 让用户确认 / 拒绝」。
  - **微调**：在冻结的 20 层基座上做 LoRA，再导出任意子网络的 4-bit `.cact`。
  - **部署**：每个目标平台自带不到 1MB 的预编译引擎，加载 `needle3.cact` 权重；支持
    macOS、Linux（x86\_64 / arm64 / armv7 / riscv64 /
    mipsel）、Windows、Android、iOS、tvOS、watchOS、浏览器 WASM 和 WASI。

<!-- end list -->

``` bash
# 为 Pi 生成 8 层子网络
cactus build --platform linux-arm64 --layers 8 --out ./pi
```

## 应用场景

Needle 的价值不在于「比大模型聪明」，而在于**把「听懂一句话并调用对应功能」这件事放到本地、几十
MB、毫秒级**完成。下表汇总了官方列出的场景，以及目前能查到的落地与演示情况。「状态」列区分三种来源：**已落地**是有具名产品在用；**第三方演示**是外部作者的实测；**官方示例**只是厂商给出的设想，不代表已有产品采用。

| 场景                 | 典型指令 / 输入                           | 为什么适合                                                   | 状态                       |
| ------------------ | ----------------------------------- | ------------------------------------------------------- | ------------------------ |
| 智能家居               | 「把卧室灯调暗并锁门」，拆成两次调用                  | 离线执行，不必经过 hub 或云端往返                                     | 官方示例；第三方演示               |
| 手机助手               | 打开网站、调暗屏幕、在文件里找租约                   | 助手直接操作设备，而不是只回答问题；官方基准 Mobile Actions、DroidCall 就针对这类指令 | 官方示例                     |
| 可穿戴设备              | 把通知转成结构化数据（商户、金额、日期）；语音设提醒、笔记、闹钟、计时 | 设备算力和电量小，常常没有屏幕，必须在端上完成                                 | **已落地**（Pebble Index 戒指） |
| AR 眼镜              | 短请求触发导航、附近搜索                        | 不依赖手机和网络                                                | 官方示例                     |
| 车机                 | 空调、媒体、导航、通话                         | 工具集可以固定，长时间对话下也不会漂移                                     | 官方示例                     |
| 机器人 / 扫地机          | 「清理厨房但别进卧室」，拆成一串动作                  | 小设备上需要细致指令，又没有算力跑大模型                                    | 官方示例                     |
| 电脑控制               | 起草邮件、启动计时、复制地址、打开标签页                | 用自然语言驱动本机已有的功能                                          | 官方示例                     |
| 本地搜索与路由（Embedding） | 在笔记、消息里语义搜索；把请求匹配到最接近的工具；合并重复通知     | 数据不出设备，隐私友好                                             | 官方示例                     |

读表要点：前七行用的是 Tool Calling 与抽取能力，最后一行用的是同一个模型的 Embedding
输出。每行的「典型指令」都是官方文案里的例子，不是评测数据。

### 已知的落地与演示

  - **Pebble Index 戒指**：目前查到的唯一具名的生产使用方。Index
    戒指没有屏幕，动作必须在有无网络的情况下都能完成，所以
    Pebble 在 App 里本地运行 Needle，把语音请求转成提醒、笔记、闹钟、计时等动作。据报道，Cactus 官网还列出
    2026-08-30 与 Pebble 的合作，称 Cactus 为 Pebble 的手表和戒指提供端侧智能。
  - **Raspberry Pi 5 + Home Assistant**：XDA Developers 的作者在 Pi 5 上运行
    Needle 3，并通过自定义 Python 文件接入 Home Assistant 控制智能家居。同一篇文章还提到它在第一代 Pi
    Zero 上无法构建，原因是该板是 ARMv6 架构，引擎不支持。这是第三方实测，不是产品。
  - **Raspberry Pi 官方博客**：报道了 Needle 2 作为 14MB 的函数调用模型，可以把文本输入转成设备动作。

### 选型建议

  - **适合**：工具集固定且较小、指令短、一轮就要给出结果的场景，同时对离线、低延迟、低功耗、隐私有要求，设备算力有限。
  - **需要在自己的工具上微调**：官方的 Cactus Platform 本身就强调
    Needle「为定制而设计」，小的子网络在特定产品的工具上微调后效果最好。第三方评测也提到，开箱准确率没有标题数字那么好，进入生产基本要微调。后一点来自单个第三方评测，没有独立验证。
  - **不适合**：开放式聊天、多轮推理，以及要覆盖大量通用或企业 API 的场景。据报道，Needle 在 BFCL v4
    上落后，官方的解释是它的训练语料偏向消费设备动作，而不是通用或企业
    API。这一点来自转述，没有在官方页面上核实。
  - **用置信度兜底**：每次返回都带
    `confidence`，在车机、家居这类有风险的动作上，应在中等置信度时让用户确认，而不是直接执行。

## 局限与适用场景

  - **只做单次调用**：Needle 不是聊天模型，不擅长多轮对话；官方明确说是用对话能力换端侧的体积与速度。
  - **必填参数不猜**：必填参数没有默认值、又没有证据时，会被保留不填，而不是编一个值；参数格式（如 `City, ST`）要写进描述里。
  - **工具集要小**：每多一个工具就多一次误路由的机会，官方建议每轮保持小而窄的工具集，每个动作一个工具。
  - **有置信度可路由**：配合 `confidence` 决定直接执行、确认或拒绝，比盲目信任输出更稳妥。
  - **开放式推理或长对话不适用**：这类场景应使用大模型，应用场景和选型建议见上一节。

## Reference

  - [mHC: Manifold-Constrained
    Hyper-Connections](https://arxiv.org/abs/2512.24880)
  - [Conditional Memory via Scalable Lookup: A New Axis of Sparsity for
    Large Language Models (Engram)](https://arxiv.org/abs/2601.07372)
  - [Monarch: Expressive Structured Matrices for Efficient and Accurate
    Training](https://arxiv.org/abs/2204.00595)
  - [Cactus Needle 3](https://cactuscompute.com/needle)
  - [We Distilled Gemini Tool Calling into a 26M
    Model](https://cactuscompute.com/blog/needle)
  - [Needle Python
    Docs](https://cactuscompute.com/blog/needle-python-docs)
  - [cactus-compute/cactus](https://github.com/cactus-compute/cactus)
  - [Cactus-Compute/needle (Hugging
    Face)](https://huggingface.co/Cactus-Compute/needle)
  - [Needle 2: The 14 MB Agentic LLM for Tiny
    Devices](https://cactuscompute.com/blog/needle-2)
  - [Meet Needle 2 -
    MarkTechPost](https://www.marktechpost.com/2026/08/13/cactus-compute-needle-2-45m-parameter-tool-calling-model/)
  - [Turn text input into actions with Needle, a 14MB function-calling
    LLM - Raspberry
    Pi](https://www.raspberrypi.com/news/turn-text-input-into-actions-with-needle-a-14mb-function-calling-llm/)
  - [A 29MB AI model is the most useful thing I've run on my Raspberry
    Pi 5 - XDA
    Developers](https://www.xda-developers.com/a-29mb-ai-model-is-the-most-useful-thing-ive-run-on-my-raspberry-pi-5/)
