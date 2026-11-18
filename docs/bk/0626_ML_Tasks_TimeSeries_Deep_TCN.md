-----

| Title     | ML Tasks TimeSeries Deep TCN                          |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-18T09:50:23Z`                                |
| Updated @ | `2026-11-18T09:50:23Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/626) |

-----

# TCN

TCN（Temporal Convolutional Network，时间卷积网络）出自论文 *An Empirical Evaluation
of Generic Convolutional and Recurrent Networks for Sequence
Modeling*（Shaojie Bai, J. Zico Kolter, Vladlen Koltun，CMU / Intel
Labs，arXiv 2018）。

论文要回答的问题是：**拿到一个新的序列建模任务，是不是还应该默认用 RNN（LSTM/GRU）？**
作者设计了一个刻意保持简单的通用卷积结构——**因果卷积 +
膨胀卷积 + 残差连接**，在一系列原本是 RNN "主场"的任务上与 LSTM / GRU / 普通 RNN 做系统对比，结论是 TCN
在多数任务上更准，并且实际记忆长度更长。

一句话概括：**TCN = 1D 全卷积网络（输出和输入等长）+ 因果卷积（不看未来）+ 指数增长的膨胀 + 残差块。**

> 论文强调 "TCN" 在这里**不是一个全新的结构**，而是对 WaveNet、Gehring
> 等卷积序列模型最佳实践的提炼，作为通用的、简单的起点。它的原型是近
> 30 年前的 TDNN（Waibel et al., 1989），区别主要在于零填充使各层等长。

## 解决什么问题

序列建模的约束是：预测 `y_t` 只能使用 `x_0, …, x_t`，不能看到 `x_{t+1}` 及以后（**因果约束**）。形式化为函数
`f: X^{T+1} → Y^{T+1}`，输出 `ŷ_0..ŷ_T = f(x_0..x_T)`，且 `ŷ_t` 只依赖
`x_0..x_t`。

自回归预测（把目标信号向后平移一步当作输出）、语言模型、音乐生成、时间序列预测都属于这个范式；但机器翻译等 seq2seq
任务需要看到整个输入序列，不直接适用。

RNN 的常见痛点：

| 痛点      | 说明                            | TCN 的情况                   |
| ------- | ----------------------------- | ------------------------- |
| 串行计算    | 后一步要等前一步算完，难以并行               | 卷积核在时间维共享，整条序列可以并行处理      |
| 梯度消失/爆炸 | 沿时间反传，催生了 LSTM/GRU/HF-RNN 等设计 | 反传路径沿网络深度而不是沿时间方向，梯度更稳定   |
| 训练显存    | 门控 RNN 要为每个门保存中间结果            | 论文称门控 RNN 可能比 TCN 多占用数倍显存 |
| 记忆长度难控制 | 理论上无限，实际很快遗忘                  | 感受野由层数、核大小、膨胀系数直接决定，可控    |

## 网络结构

### 因果卷积（Causal Convolution）

  - 用 1D 全卷积网络（FCN）：每个隐藏层与输入层**等长**，通过零填充保证长度不变
  - 为避免信息从未来泄漏到过去，只在序列**左侧**补零（补 `(k-1)·d` 个，`k` 为核大小，`d` 为膨胀系数，不膨胀时
    `d=1`），使位置 `t` 的输出只依赖 `≤ t` 的输入

<!-- end list -->

    TCN = 1D FCN + 因果卷积

问题：纯因果卷积的感受野只随深度**线性**增长，想看很长历史需要极深的网络或极大的卷积核。

### 膨胀卷积（Dilated Convolution）

对 1D 序列 `x` 和卷积核 `f: {0,…,k-1} → R`，在位置 `s` 的膨胀卷积为（论文公式 2）：

    F(s) = (x *_d f)(s) = Σ_{i=0..k-1} f(i) · x_{s - d·i}

  - `d` 为膨胀系数（相邻两个卷积核抽头之间隔 `d` 个位置），`k` 为核大小，`s - d·i` 保证只看过去
  - `d = 1` 时退化为普通卷积
  - 每层的有效历史长度是 `(k-1)·d`
  - **有两种扩大感受野的方式**：增大核大小 `k`，或增大膨胀系数 `d`；通常让 `d` 随层数指数增长：第 `i` 层 `d
    = 2^i`
  - 这样每个输入位置都会被某个卷积核覆盖到，同时感受野随深度**指数**增长

### 膨胀如何扩大感受野（k=2 的精确示意）

下图每层只画一次卷积，`k=2`，膨胀系数 `d=1,2,4`，看输出层最后一个位置 `t=7` 依赖哪些输入：

    位置          0   1   2   3   4   5   6   7
    输入 x        ●   ●   ●   ●   ●   ●   ●   ●
                  └─┬─┘   └─┬─┘   └─┬─┘   └─┬─┘        d=1：位置 7 ← {6,7}，5 ← {4,5}，3 ← {2,3}，1 ← {0,1}
    隐藏层 h1         ●       ●       ●       ●
                      └───┬───┘       └───┬───┘         d=2：位置 7 ← h1{5,7}，3 ← h1{1,3}
    隐藏层 h2                 ●               ●
                              └──────┬────────┘          d=4：位置 7 ← h2{3,7}
    输出 y                                    ●

  - 输出 `y_7` 依赖的输入位置：`7 → {3,7} → {1,3,5,7} → {0,1,…,7}`，**8
    个输入全部覆盖**（感受野 = 8）
  - 3 层、`k=2`、`d=1,2,4` → 感受野 `1 + (k-1)·(1+2+4) = 8`；如果不用膨胀（`d` 恒为
    1），同样 3 层只能看到 `1 + 3 = 4` 个输入
  - 想让不膨胀的网络覆盖 1024 步，需要约 1023 层 `k=2` 的卷积；而指数膨胀只要 10 层

### 感受野公式

每个残差块含 **2 层**膨胀卷积，共 `n` 个块，第 `i` 块 `d = 2^i`，所以

    感受野 = 1 + 2 · (k-1) · (2^n - 1)

例：`k=3, n=8` → `1 + 2·2·255 = 1021`；`k=7, n=8` → `1 + 2·6·255 = 3061`。

**实测验证**：在 PyTorch 里对输出最后一个位置的输入求梯度，统计有梯度的输入位置跨度（见下文"测试"小节），公式与实测一致：

| k | n（块数） | 公式感受野 | 实测跨度 | 同深度不膨胀的感受野 |
| - | ----- | ----- | ---- | ---------- |
| 2 | 3     | 15    | 15   | 7          |
| 3 | 4     | 61    | 61   | 17         |
| 3 | 8     | 1021  | 1021 | 33         |
| 7 | 8     | 3061  | 3061 | 97         |

> 论文中的例子：如果预测可能依赖 2^12 长度的历史，且输入是高维序列，大约需要 12 层的网络。

### 因果卷积的 padding 细节

PyTorch 的 `nn.Conv1d(padding=p)` 会在序列**两侧**各补 `p` 个零，而因果卷积只允许看左边。标准做法：

1.  两侧各补 `p = (k-1)·d` 个零，输出长度变为 `T + p`
2.  用 `Chomp1d` 把**右侧**多出来的 `p` 个输出裁掉，长度回到 `T`

<!-- end list -->

``` python
class Chomp1d(nn.Module):
    def __init__(self, chomp_size):
        super().__init__()
        self.chomp_size = chomp_size
    def forward(self, x):                       # x: (batch, channels, T + p)
        return x[:, :, :-self.chomp_size].contiguous()
```

为什么是对的：两侧补零后，输出第 `j` 个位置依赖的原序列位置是 `j-p, j-p+d, …, j`（最大就是 `j` 自己）；保留前
`T` 个输出（`j = 0…T-1`）即保证只依赖不晚于自己的输入，被裁掉的右侧 `p` 个输出依赖的才是越界/未来位置。也可以直接
`F.pad(x, (p, 0))` 只补左侧，效果相同。

常见错误：

  - 忘记 `Chomp1d`：输出变长，且位置 `t` 的输出会混进未来信息
  - 用 `padding='same'`：两侧对称补零，输出位置 `t` 会看到 `t+1…`，**不是因果的**
  - 多层叠加时每层的 `p` 要用各自的 `d`，不能用同一个值

### 测试：因果性与感受野

下面两个小测试可以直接用来检查自己的实现是否正确（`net` 为不含 dropout 的 `eval()` 模式 TCN）：

``` python
# 1) 因果性：改变 t0 之后的输入，t0 及之前的输出不能变
x = torch.randn(2, 1, 100); t0 = 60
x2 = x.clone(); x2[..., t0 + 1:] += torch.randn_like(x2[..., t0 + 1:])
y, y2 = net(x), net(x2)
assert torch.allclose(y[..., :t0 + 1], y2[..., :t0 + 1], atol=1e-6)      # 过去不受未来影响
assert not torch.allclose(y[..., t0 + 1:], y2[..., t0 + 1:], atol=1e-6)  # 未来输出确实变了

# 2) 感受野：对最后一个输出求梯度，统计有梯度的输入位置跨度
xx = torch.randn(1, 1, net.receptive_field + 50, requires_grad=True)
net(xx)[0, :, -1].sum().backward()
nz = (xx.grad[0, 0].abs() > 0).nonzero().flatten()
print(int(nz.max() - nz.min() + 1), net.receptive_field)                  # 两者应相等
```

### 残差块（Residual Block）

深层 TCN 难以稳定训练，所以每个"层"换成一个残差模块（论文 Figure 1(b)）：

    x ───────────────────────────────┐
    │                                │（k_in ≠ k_out 时加 1x1 卷积对齐通道）
    ├─ 膨胀因果卷积 → WeightNorm → ReLU → Dropout
    ├─ 膨胀因果卷积 → WeightNorm → ReLU → Dropout
    │                                │
    └────────────── 相加 ◄───────────┘
                    │
                  （输出，论文公式 3：o = Activation(x + F(x))）

  - 每个块内两层膨胀因果卷积 + ReLU
  - **Weight Normalization** 作用在卷积核上用于稳定训练
  - **Spatial Dropout**：每次训练整个通道一起置零，用于正则
  - 输入和输出通道数不同时，用 **1x1 卷积**让残差相加的张量形状一致
  - 没有门控机制，比 WaveNet 简单（论文原话：没有层间 skip
    连接、条件输入（conditioning）、上下文堆叠（context
    stacking）和门控激活）

## 优缺点

论文总结的优点：

  - **并行**：训练和推理时整条序列可一次处理
  - **感受野灵活**：通过层数、膨胀系数、核大小控制记忆长度
  - **梯度稳定**：反传路径与时间方向不同，避免 RNN 的梯度爆炸/消失
  - **训练显存低**：卷积核共享，反传路径只取决于网络深度
  - **支持变长输入**：滑动卷积核即可处理任意长度

论文总结的缺点：

  - **评估时需要保存原始序列**：RNN 只需维护一个隐状态，TCN 要保留到有效历史长度的原始输入，推理时可能需要更多内存（流式推理没有
    RNN 方便）
  - **迁移到不同领域时可能要改参数**：不同领域需要的历史长度差别很大（小 `k`/`d` vs 大
    `k`/`d`），感受野不够会导致效果变差

## 实验

论文强调要在 **RNN 的"主场"**（RNN 常用的基准任务）上比较，所有实验使用**同一个** TCN 结构，只改网络深度
`n`，必要时改核大小 `k`，使感受野能覆盖足够长的上下文。

### 实验设置

  - TCN：每层膨胀 `d = 2^i`；Adam，学习率 0.002；梯度裁剪（最大范数在 \[0.3, 1\] 中选）
  - RNN（LSTM / GRU / 普通 RNN）：网格搜索优化器、recurrent
    dropout（0.05\~0.5）、学习率、梯度裁剪、遗忘门初始偏置等，参数量与 TCN
    大致相当
  - 两者都没有加额外的结构技巧（门控、skip 连接等）
  - 词级语言模型沿用常规做法：encoder 与 decoder 共享权重，SGD，验证集停滞时学习率减半

### 任务

| 任务                         | 内容                                                   | 考察点      |
| -------------------------- | ---------------------------------------------------- | -------- |
| Adding problem             | 输入长度 n、深度 2 的序列，对被标记为 1 的两个数求和；总是预测 1 的 MSE 约 0.1767 | 长程依赖     |
| Sequential MNIST / P-MNIST | 把 28×28 图像展成 784 长度的序列分类；P-MNIST 再随机打乱像素顺序           | 长期记忆     |
| Copy memory                | 序列开头 10 个随机数字，经过 T 步空白后需要在末尾复述出来                     | 长程信息保留   |
| JSB Chorales / Nottingham  | 复调音乐建模（88 位二值向量），指标 NLL                              | 音乐序列     |
| PennTreebank               | 字符级（bpc）与词级（perplexity）语言模型                          | 小数据集语言模型 |
| Wikitext-103               | 约 1 亿词，词表约 268K                                      | 大词表语言模型  |
| LAMBADA                    | 约 1 万段小说，预测目标句最后一个词，需要较长上下文                          | 长上下文理解   |
| text8                      | 字符级语言模型，约 1 亿字符                                      | 大数据字符级   |

### 主要结果（论文 Table 1，TCN 与 LSTM / GRU / 普通 RNN 对比）

| 任务                      | 指标           | 模型大小 | LSTM      | GRU        | RNN    | TCN        |
| ----------------------- | ------------ | ---- | --------- | ---------- | ------ | ---------- |
| Seq. MNIST              | 准确率 ↑        | 70K  | 87.2      | 96.2       | 21.5   | **99.0**   |
| Permuted MNIST          | 准确率 ↑        | 70K  | 85.7      | 87.3       | 25.3   | **97.2**   |
| Adding problem (T=600)  | loss ↓       | 70K  | 0.164     | **5.3e-5** | 0.177  | 5.8e-5     |
| Copy memory (T=1000)    | loss ↓       | 16K  | 0.0204    | 0.0197     | 0.0202 | **3.5e-5** |
| JSB Chorales            | loss ↓       | 300K | 8.45      | 8.43       | 8.91   | **8.10**   |
| Nottingham              | loss ↓       | 1M   | 3.29      | 3.46       | 4.05   | **3.07**   |
| Word-level PTB          | perplexity ↓ | 13M  | **78.93** | 92.48      | 114.50 | 88.68      |
| Word-level Wikitext-103 | perplexity ↓ | \-   | 48.4      | \-         | \-     | **45.19**  |
| Word-level LAMBADA      | perplexity ↓ | \-   | 4186      | \-         | 14725  | **1279**   |
| Char-level PTB          | bpc ↓        | 3M   | 1.36      | 1.37       | 1.48   | **1.31**   |
| Char-level text8        | bpc ↓        | 5M   | 1.50      | 1.53       | 1.69   | **1.45**   |

> 数字取自论文 Table 1（已对照论文原图核对；`-`
> 表示论文未给出）。"模型大小"是论文给出的各任务近似参数量；Wikitext-103
> 和 LAMBADA 的 TCN 分别约 148M / 56M（见下文 Table 4）。Adding problem 上 GRU 与 TCN
> 都接近 0，差距不显著。

结论要点：

  - **合成压力测试**：TCN 在 Adding、Copy memory 上几乎完美收敛；Copy memory 中 LSTM/GRU
    只能收敛到"全部预测 0"的损失。EURNN 在 T=500 时表现不错，但在 T=1000 及更长时 TCN 明显更好
  - **Sequential / P-MNIST**：TCN 显著优于 LSTM/GRU；P-MNIST 上超过当时基于 RNN 的
    SOTA（95.9%，Zoneout + Recurrent BatchNorm）
  - **音乐**：TCN 几乎不调参就明显优于 RNN，甚至超过 HF-RNN 等增强 RNN；但 DBN-LSTM
    更好，作者认为是数据集小导致正则/生成建模方式的影响，与 RNN/TCN 区分正交
  - **语言模型**：在小语料 PTB 上，经过充分优化的 LSTM（recurrent dropout、embedding dropout
    等）**优于** TCN（78.93 vs 88.68）；在 Wikitext-103 和 LAMBADA 这类大规模数据集上，TCN
    不做超参搜索也优于 Grave et al. (2017) 的 LSTM
  - **注意**：论文对比的是**通用**的 LSTM/GRU，各任务上都存在更专门、更强的 SOTA（见论文补充材料），TCN 没有享受到
    LSTM 这些年围绕正则化和优化积累的大量改进

### 记忆长度：RNN 的"无限记忆"在实践中不存在

  - **Copy memory 实验**：固定模型大小为 10K，改变序列长度 `T`
      - TCN 在所有序列长度上都保持 100% 准确率
      - LSTM 在 T \< 50 时准确率就降到 20% 以下，GRU 在 T \< 200 时降到 20%
        以下，之后退化为随机猜测
  - **LAMBADA 实验**：TCN 的 perplexity 远低于 LSTM 和普通 RNN，且网络更小、几乎不调参
  - 结论：理论上 RNN 可以保留无限长历史，但实践中同容量的 TCN 记忆更长

### 补充实验（论文 Supplementary）

#### TCN 各任务使用的超参数（Table 2）

| 任务                      | k（核大小） | n（块数） | 每层通道数   | Dropout | 梯度裁剪 | 备注            |
| ----------------------- | ------ | ----- | ------- | ------- | ---- | ------------- |
| Adding problem T=200    | 6      | 7     | 27      | 0.0     | 无    |               |
| Adding problem T=400    | 7      | 7     | 27      | 0.0     | 无    |               |
| Adding problem T=600    | 8      | 8     | 24      | 0.0     | 无    |               |
| Seq. MNIST              | 7 / 6  | 8     | 25 / 20 | 0.0     | 无    | 论文给了两组配置      |
| Permuted MNIST          | 7 / 6  | 8     | 25 / 20 | 0.0     | 无    | 同上            |
| Copy memory T=500       | 6      | 9     | 10      | 0.05    | 1.0  | RMSprop 5e-4  |
| Copy memory T=1000      | 8      | 8     | 10      | 0.05    | 1.0  | RMSprop 5e-4  |
| Copy memory T=2000      | 8      | 9     | 10      | 0.05    | 1.0  | RMSprop 5e-4  |
| JSB Chorales            | 3      | 2     | 150     | 0.5     | 0.4  |               |
| Nottingham              | 6      | 4     | 150     | 0.2     | 0.4  |               |
| Word-level PTB          | 3      | 4     | 600     | 0.5     | 0.4  | embedding 600 |
| Word-level Wikitext-103 | 3      | 5     | 1000    | 0.4     | 0.4  | embedding 400 |
| Word-level LAMBADA      | 4      | 5     | 500     | 0.4     | 0.4  | embedding 500 |
| Char-level PTB          | 3      | 3     | 450     | 0.1     | 0.15 | embedding 100 |
| Char-level text8        | 2      | 5     | 520     | 0.1     | 0.15 | embedding 100 |

> 已对照论文 Table 2 原图核对。Word-level 三行的梯度裁剪（0.4）在原表中是合并单元格，Dropout 的 0.4 在
> Wikitext-103 / LAMBADA 两行合并；Char-level 两行共用 0.1 / 0.15。

要点：

  - 论文强调选参数时**最重要的是保证感受野足够大**（通过 `k` 和 `d`），隐层通道数则是按与 RNN 参数量相当来定的
  - 论文发现 TCN 对超参数比较不敏感，只要有效历史（感受野）足够
  - 权重用高斯 `N(0, 0.01)` 初始化（论文这样写；官方代码里是
    `weight.data.normal_(0, 0.01)`，即标准差
    0.01）；大任务（如语言模型）使用梯度裁剪能加速收敛
  - RNN 对比方的超参：LSTM 搜索最多 3 层，优化器在 SGD / Adam / RMSprop / Adagrad 中选；GRU
    的隐单元通常更多以保持总体参数量接近

#### 核大小与残差连接的消融（Appendix C）

在 copy memory、P-MNIST、PTB 词级语言模型三个任务上，固定模型大小与深度做对照：

  - **核大小 `k`**：copy memory 和 P-MNIST 上，`k` 越大收敛越快、精度越高；copy memory 中 `k
    ≤ 3` 的 TCN 只能收敛到随机猜测水平。而 PTB 词级语言模型上 `k=3`
    的小核反而最好，论文解释是小核（配合固定膨胀）更关注局部上下文，而语言建模对局部信息更敏感（n-gram
    的成功说明只需要较短的记忆）
  - **残差连接**：三个任务上都让训练更稳定、收敛更快、最终结果更好，在语言模型上收益尤其明显（论文 Figure 6f）
  - 论文认为**膨胀**对建模长程依赖是必需的，所以消融主要看核大小和残差

#### 门控机制（Appendix D，Table 5）

通用 TCN 没有使用门控。论文比较了把 ReLU 换成 GLU（两个卷积的逐元素乘积，其中一个过 sigmoid，卷积层数约为 ReLU
版本的两倍）的结果，参数量接近：

| 任务                            | TCN (ReLU) | TCN + 门控  |
| ----------------------------- | ---------- | --------- |
| Seq. MNIST (acc ↑)            | 99.0       | 99.0      |
| Permuted MNIST (acc ↑)        | 97.2       | 96.9      |
| Adding problem T=600 (loss ↓) | 5.8e-5     | 5.6e-5    |
| Copy memory T=1000 (loss ↓)   | **3.5e-5** | 0.00508   |
| JSB Chorales (loss ↓)         | **8.10**   | 8.13      |
| Nottingham (loss ↓)           | **3.07**   | 3.12      |
| Word-level PTB (ppl ↓)        | 88.68      | **87.94** |
| Char-level PTB (bpc ↓)        | 1.31       | **1.306** |
| Char-level text8 (bpc ↓)      | **1.45**   | 1.485     |

结论：门控在 PTB 这类语言建模上略有帮助，但在音乐建模和需要长记忆的合成任务上没有同等收益；copy memory T=1000 上门控的
TCN 收敛得更差（仍好于 RNN）。所以通用 TCN 选择不加门控。

#### 与各任务 SOTA 的差距（Appendix B，Table 4）

论文明确指出：对比的是**通用**的 LSTM/GRU，在多个任务上存在更专门的 SOTA 结构，TCN 也有差距：

| 任务                        | TCN         | SOTA         | SOTA 模型                     |
| ------------------------- | ----------- | ------------ | --------------------------- |
| Seq. MNIST (acc)          | 99.0（21K）   | 99.0（21K）    | Dilated GRU                 |
| P-MNIST (acc)             | 97.2（42K）   | 95.9（42K）    | Zoneout                     |
| Adding problem 600 (loss) | 5.8e-5（70K） | 5.3e-5（70K）  | Regularized GRU             |
| Copy memory 1000 (loss)   | 3.5e-5（70K） | 0.011（70K）   | EURNN                       |
| JSB Chorales (loss)       | 8.10（300K）  | 3.47         | DBN + LSTM                  |
| Nottingham (loss)         | 3.07（1M）    | 1.32         | DBN + LSTM                  |
| Word PTB (ppl)            | 88.68（13M）  | 47.7（22M）    | AWD-LSTM-MoS + Dynamic Eval |
| Word Wikitext-103 (ppl)   | 45.19（148M） | 40.4（\>300M） | Neural Cache Model (Large)  |
| Word LAMBADA (ppl)        | 1279（56M）   | 138（\>100M）  | Neural Cache Model (Large)  |
| Char PTB (bpc)            | 1.31（3M）    | 1.22（14M）    | 2-Layer Norm HyperLSTM      |
| Char text8 (bpc)          | 1.45（4.6M）  | 1.29（\>12M）  | HM-LSTM                     |

读法：TCN 只是**没有任何专用技巧的通用基线**，作者的主张是"通用 TCN 比通用 RNN
更好，应作为序列建模的自然起点"，而不是"TCN 在所有任务上都达到
SOTA"。

## 在时间序列预测中使用

TCN 论文本身研究的是通用序列建模，在时间序列预测里一般这样使用：

  - **点预测**：输入历史窗口，TCN 在每个位置输出下一步的值，用 MSE/MAE
    训练；多步预测用自回归滚动（把预测值接到输入末尾再预测）或直接多输出头
  - **概率预测**：TCN 当"编码器"，输出层接分布参数（高斯/负二项等），训练和采样方式与
    [DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR) 相同，只是把其中的 LSTM 换成
    TCN（见下文）
  - **多变量**：输入通道数 = 变量数，卷积天然支持多通道
  - 感受野应**覆盖业务上的季节周期**（如日数据覆盖一周/一年的周期，小时数据覆盖 24 小时和 7 天）

### PyTorch 实现

按论文结构（因果卷积 + 膨胀 + 残差块 + Weight Norm + Dropout）写的最小实现，结构参考作者的开源实现
[locuslab/TCN](https://github.com/locuslab/TCN)：

``` python
import torch
import torch.nn as nn
from torch.nn.utils import weight_norm   # 新版 PyTorch 推荐 torch.nn.utils.parametrizations.weight_norm


class Chomp1d(nn.Module):
    """裁掉卷积右侧多出的 padding，保证因果性且输出长度不变"""
    def __init__(self, chomp_size):
        super().__init__()
        self.chomp_size = chomp_size

    def forward(self, x):
        return x[:, :, :-self.chomp_size].contiguous()


class TemporalBlock(nn.Module):
    def __init__(self, n_in, n_out, kernel_size, dilation, dropout=0.2):
        super().__init__()
        pad = (kernel_size - 1) * dilation        # 两侧补 pad，再裁掉右侧
        self.conv1 = weight_norm(nn.Conv1d(n_in, n_out, kernel_size, padding=pad, dilation=dilation))
        self.conv2 = weight_norm(nn.Conv1d(n_out, n_out, kernel_size, padding=pad, dilation=dilation))
        self.net = nn.Sequential(
            self.conv1, Chomp1d(pad), nn.ReLU(), nn.Dropout(dropout),
            self.conv2, Chomp1d(pad), nn.ReLU(), nn.Dropout(dropout),
        )
        self.downsample = nn.Conv1d(n_in, n_out, 1) if n_in != n_out else None  # 1x1 卷积对齐通道
        self.relu = nn.ReLU()

    def forward(self, x):                         # x: (batch, channels, time)
        res = x if self.downsample is None else self.downsample(x)
        return self.relu(self.net(x) + res)


class TCN(nn.Module):
    def __init__(self, n_inputs, channels, kernel_size=3, dropout=0.2):
        super().__init__()
        layers = []
        for i, c_out in enumerate(channels):      # 第 i 个块的膨胀系数 2**i
            c_in = n_inputs if i == 0 else channels[i - 1]
            layers.append(TemporalBlock(c_in, c_out, kernel_size, dilation=2 ** i, dropout=dropout))
        self.network = nn.Sequential(*layers)
        self.receptive_field = 1 + 2 * (kernel_size - 1) * (2 ** len(channels) - 1)

    def forward(self, x):
        return self.network(x)
```

> 论文描述的是 Spatial Dropout（整通道置零），官方仓库使用的是 `nn.Dropout`，可按需换成
> `nn.Dropout1d`。上面的代码以及下文的所有示例已在本机用 PyTorch 运行验证（见各小节的输出）。

### 端到端示例：合成序列的 24 步预测，对比 LSTM

数据：`sin(2πt/24) + 0.5·sin(2πt/168) + 0.1·噪声`（日周期 + 周周期），长度 3000，前 2600
训练、后 400 测试。训练目标是"每个位置预测下一个值"（输入是序列，目标是向后平移一步），推理时用自回归滚动预测 24
步，在测试集上滑动取多个起点求平均 MAE。

``` python
class TCNForecaster(nn.Module):
    def __init__(self, channels, k):
        super().__init__()
        self.tcn = TCN(1, channels, k, dropout=0.05)
        self.head = nn.Conv1d(channels[-1], 1, 1)      # 每个时间步输出一个值

    def forward(self, x):                              # x: (B, 1, T)
        return self.head(self.tcn(x))


class LSTMForecaster(nn.Module):
    def __init__(self, hidden):
        super().__init__()
        self.rnn = nn.LSTM(1, hidden, 2, batch_first=True)
        self.head = nn.Linear(hidden, 1)

    def forward(self, x):
        o, _ = self.rnn(x.transpose(1, 2))
        return self.head(o).transpose(1, 2)


def batch(series, bs=32, L=256):                       # 随机截取长度 L 的窗口
    idx = torch.randint(0, len(series) - L - 1, (bs,))
    x = torch.stack([series[i:i + L] for i in idx]).unsqueeze(1)
    y = torch.stack([series[i + 1:i + L + 1] for i in idx]).unsqueeze(1)   # 目标 = 输入后移一步
    return x, y


def fit(model, train, steps=400):
    opt = torch.optim.Adam(model.parameters(), 2e-3)
    for _ in range(steps):
        x, y = batch(train)
        loss = ((model(x) - y) ** 2).mean()
        opt.zero_grad(); loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(), 1.0)       # 论文也使用梯度裁剪
        opt.step()
    return model.eval()


@torch.no_grad()
def rollout(model, hist, H, L=256):                    # 自回归滚动：把预测值接回输入
    x = hist.clone().view(1, 1, -1)
    out = []
    for _ in range(H):
        nxt = model(x)[0, 0, -1]
        out.append(nxt)
        x = torch.cat([x, nxt.view(1, 1, 1)], -1)[..., -L:]
    return torch.stack(out)


tcn_m  = fit(TCNForecaster([24] * 6, 3), train)        # 感受野 = 1 + 2*2*63 = 253
lstm_m = fit(LSTMForecaster(40), train)
```

在本机（CPU，固定随机种子，单次运行）的结果：

| 模型                           | 参数量    | 24 步滚动预测 MAE |
| ---------------------------- | ------ | ------------ |
| TCN（6 块 × 24 通道，k=3，感受野 253） | 19,729 | **0.0803**   |
| LSTM（2 层 × 40 隐单元）           | 20,041 | 0.2124       |
| 季节性朴素（直接取 24 步前的值）           | \-     | 0.3420       |

> 这是一个**玩具数据集 + 单次运行**的结果，只用来说明用法和量级；信号本身是强周期的，且 LSTM 没有仔细调参，不能据此认为 TCN
> 在任何数据上都更好。

### 流式推理：只需要缓存最近"感受野"长度的输入

论文指出 TCN 的一个缺点是评估时要保存原始输入而不是一个隐状态。因为输出 `y_t` **只依赖最近 `receptive_field`
个输入**，在线预测时只需维护一个长度为 `receptive_field` 的滑动窗口即可，更早的输入可以丢弃：

``` python
rf = tcn_m.tcn.receptive_field                          # 253
with torch.no_grad():
    full   = tcn_m(test.view(1, 1, -1))[0, 0, -1]       # 用整条序列
    window = tcn_m(test[-rf:].view(1, 1, -1))[0, 0, -1] # 只用最近 rf 个点
print(torch.allclose(full, window, atol=1e-5))          # True
```

实测两者输出相同（-0.406418）。要点：

  - 在线服务缓存 `receptive_field` 个最近输入即可；感受野越大缓存越大（k=7, n=8 时为 3061）
  - 这个办法每步仍然要重新计算整个窗口。要进一步省计算，可以为每个卷积层缓存其最近 `(k-1)·d` 个输入（类似 WaveNet 的
    fast generation / 队列缓存），每步只算新位置，代价是实现更复杂
  - 对比 RNN：RNN 每步只更新隐状态，计算量小得多，这是 TCN 在极低延迟流式场景下的劣势

### 概率预测：把 DeepAR 里的 LSTM 换成 TCN

[DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR) 的核心是"自回归网络输出分布参数 +
最大似然训练 + 祖先采样"，RNN 只是其中一个可替换的序列模块。换成 TCN 时需要改的地方：

| 项目                 | DeepAR（LSTM）             | TCN 版本                            |
| ------------------ | ------------------------ | --------------------------------- |
| 状态                 | 隐状态 `h_{t-1}` 逐步传递       | 没有隐状态，信息来自输入窗口                    |
| 训练                 | teacher forcing，一次展开整个窗口 | 相同；输入窗口整体送入，所有位置并行算损失             |
| conditioning range | 用 LSTM 跑一遍得到初始状态         | 直接取最近 `receptive_field` 个真实值作为上下文 |
| 祖先采样               | 每步只需前向 1 个时间步            | 每步把新采样值接到窗口末尾，**重新跑一遍窗口**         |
| 计算量                | 每步 O(1)                  | 每步 O(窗口长度)（可用逐层缓存优化）              |
| 并行训练               | 否（按时间展开）                 | 是                                 |

最小实现（高斯输出 + DeepAR 同款尺度处理 `ν = 1 + 上下文均值`）：

``` python
class ProbTCN(nn.Module):
    def __init__(self, channels, k):
        super().__init__()
        self.tcn = TCN(1, channels, k, dropout=0.05)
        self.mu = nn.Conv1d(channels[-1], 1, 1)
        self.sigma = nn.Conv1d(channels[-1], 1, 1)

    def forward(self, x):                               # x 已除以 scale
        h = self.tcn(x)
        return self.mu(h), nn.functional.softplus(self.sigma(h)) + 1e-3   # σ > 0


# 训练：窗口内每个位置都算负对数似然
scale = 1 + w[:, :64].abs().mean(1, keepdim=True)       # ν_i = 1 + 上下文均值
zs = w / scale                                           # w: (B, 129) 的窗口
mu, sg = pm(zs[:, :-1].unsqueeze(1))                     # 输入 z_{t-1}
nll = -torch.distributions.Normal(mu[:, 0], sg[:, 0]).log_prob(zs[:, 1:]).mean()


# 预测：祖先采样，同时生成 n 条样本路径
@torch.no_grad()
def sample_paths(hist, H, n=200):
    scale = 1 + hist.abs().mean()
    x = (hist / scale).view(1, 1, -1).repeat(n, 1, 1)    # (n, 1, T)
    outs = []
    for _ in range(H):
        mu, sg = pm(x)
        z = torch.distributions.Normal(mu[:, 0, -1], sg[:, 0, -1]).sample()   # 每条路径独立采样
        outs.append(z)
        x = torch.cat([x, z.view(n, 1, 1)], -1)          # 采样值接回窗口
    return torch.stack(outs, 1) * scale                  # (n, H)，乘回尺度
```

在 40 条合成序列（振幅相差约一个数量级以上、相位和噪声各不相同）上训练、对**留出的时间段**滚动预测 24 步，取每条路径的
P10/P90 作为 80% 区间：经验覆盖率 **0.848**（目标
0.80），说明区间基本校准，略偏保守。同样只是玩具数据的单次运行结果。

注意：

  - 上面是最简版本，没有 DeepAR 的类别 embedding、age 特征、滞后特征、加权采样和负二项输出，只演示"TCN 替换
    LSTM"的结构
  - 计数数据应把高斯换成负二项，并使用论文里的 `μ = ν·softplus(·)`、`α = softplus(·)/√ν` 缩放

### 已有实现

  - 作者官方实现：[locuslab/TCN](https://github.com/locuslab/TCN)（PyTorch）
  - [Darts](https://unit8co.github.io/darts/) 的 `TCNModel`（时序预测库）
  - 论文提到 TCN 与 WaveNet 同属膨胀因果卷积一族，可对比参考

## 调参建议

  - **先定感受野**：按上面公式使感受野 ≥ 业务需要的历史长度，再调通道数
  - **核大小**：长程记忆任务（copy memory、MNIST）用较大的 `k`（6\~8），语言模型这类偏局部上下文的任务
    `k=3` 更合适（论文消融）
  - **Dropout**：数据少时加大（论文在 JSB Chorales 上用 0.5，合成任务用 0\~0.05）；论文用
    spatial dropout
  - **梯度裁剪**：大任务（语言模型）用 0.15\~0.4 的裁剪阈值有助收敛；合成任务可以不用
  - **残差连接**必须保留，论文消融显示它稳定训练、加速收敛
  - **先不要加门控**：通用 TCN 不用 GLU，除非是语言建模这类任务再尝试，收益也有限（论文 Table 5）
  - **验证实现**：先跑上面的因果性和感受野测试，再训练，能排除绝大多数 padding 错误
  - **流式/在线推理**：需要缓存最近"感受野"长度的输入，或使用带缓存的因果卷积实现
  - **与 RNN 对比**：推理时 RNN 只存隐状态，TCN 需要保存足够长的输入窗口

## 与其他序列模型对比

| 模型               | 结构             | 并行    | 记忆长度      | 说明              |
| ---------------- | -------------- | ----- | --------- | --------------- |
| RNN / LSTM / GRU | 循环             | 否（逐步） | 理论无限，实际较短 | 流式推理方便          |
| **TCN**          | 因果+膨胀卷积+残差     | 是     | 由感受野决定，可控 | 本文              |
| WaveNet          | 膨胀因果卷积+门控+skip | 是     | 很长        | 音频生成，结构比 TCN 复杂 |
| Transformer      | 自注意力           | 是     | 全局        | 计算量随序列长度平方增长    |

## Reference

  - [An Empirical Evaluation of Generic Convolutional and Recurrent
    Networks for Sequence Modeling
    (arXiv 1803.01271)](https://arxiv.org/abs/1803.01271)
  - [locuslab/TCN - 官方实现](https://github.com/locuslab/TCN)
  - [WaveNet: A Generative Model for Raw
    Audio](https://arxiv.org/abs/1609.03499)
  - [Darts -
    TCNModel](https://unit8co.github.io/darts/generated_api/darts.models.forecasting.tcn_model.html)
