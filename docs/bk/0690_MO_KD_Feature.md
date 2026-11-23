-----

| Title     | MO KD Feature                                         |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-23T01:45:00Z`                                |
| Updated @ | `2026-11-23T01:45:00Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/690) |

-----

# Feature

特征蒸馏（Feature-based KD）让 Student 匹配 Teacher
**中间层**的特征，而不只是最终输出。中间特征带来更丰富的监督信号，尤其适合
Student 比 Teacher
更深更瘦、或任务依赖空间信息（检测、分割）的场景。本文覆盖这一类的四个代表：FitNets（*FitNets:
Hints for Thin Deep Nets*，ICLR 2015，arXiv:1412.6550）、Attention
Transfer（*Paying More Attention to Attention*，ICLR
2017，arXiv:1612.03928）、CRD（*Contrastive Representation
Distillation*，ICLR 2020，arXiv:1910.10699）和 ReviewKD（*Distilling
Knowledge via Knowledge Review*，CVPR 2021，arXiv:2104.09044），并简述 FSP。

**一句话概括：FitNets 用回归器把 Student 的中间特征对齐到 Teacher 的"提示层"；AT
只传递由特征算出的空间注意力图；CRD
用对比学习最大化师生表示的互信息；ReviewKD 打破"同层对同层"，让
Teacher 的浅层特征去监督 Student 更深的层。**

> 标注约定：未标注的内容来自上述论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：总览 [知识蒸馏](0207_MO_KD)；发展历史 [KD History](0336_MO_KD_History)；输出层蒸馏
[响应蒸馏](/0689_MO_KD_Response)；关系蒸馏 [关系蒸馏](/XXXX_MO_KD_Relation)；检测与视觉
Transformer 中的特征蒸馏见 [检测/分割/ViT 蒸馏](/XXXX_MO_KD_CV)。

## 1\. 解决什么问题

  - 仅匹配最终输出时，Teacher 中间层学到的表示被浪费；对**很深的 Student**，只有输出端的监督信号还可能让训练很困难；
  - 中间特征蒸馏要解决三个问题：**对齐什么**（原始特征、注意力图、还是表示的统计关系）、**怎么对齐**（Student 与
    Teacher 的通道数、分辨率往往不同）、**拿哪几层对哪几层**（连接路径）。

## 2\. 符号约定

  - $x$：输入；$u(x)$：Teacher 的中间特征，$v(x)$：Student 的中间特征；
  - $A\\in\\mathbb R^{C\\times H\\times W}$：某层的激活张量（$C$ 个通道，空间大小
    $H\\times W$）；
  - 上标/下标 $T$、$S$ 或 $t$、$s$ 分别表示 Teacher、Student；$|\\cdot|\_2$ 为 $L\_2$
    范数。

## 3\. FitNets：提示（hint）训练

Student 比 Teacher 更深更瘦时，只靠输出监督很难训练。FitNets 选取 Teacher
的一个隐藏层作为**提示层（hint）**，Student
的一个隐藏层作为**被引导层（guided
layer）**，让被引导层去"预测"提示层的输出。由于 Teacher
通常更宽，两者输出尺寸不同，需要在被引导层之上加一个**回归器** $r$：

$$ \\mathcal
L\_{HT}(W\_{Guided},W\_r)=\\frac12,\\big|,u\_h(x;W\_{Hint})-r\\big(v\_g(x;W\_{Guided});W\_r\\big)\\big|^2
$$

其中：

  - $u\_h$、$v\_g$：Teacher 到提示层、Student 到被引导层的嵌套函数，参数分别为
    $W\_{Hint}$、$W\_{Guided}$；
  - $r$：回归器（参数 $W\_r$），使其输出与提示层同尺寸；论文要求 $u\_h$ 与 $r$ 的输出使用相同的非线性，以保证可比；
  - 当两层是卷积层时，全连接回归器的参数量会暴增，论文改用**卷积回归器**：核大小 $k\_1\\times k\_2$ 取为使
    $N\_{g,i}-k\_i+1=N\_{h,i}$，参数量为 $k\_1k\_2O\_hO\_g$，远小于全连接形式；
  - 提示/被引导层的选取：论文取 Teacher 与 Student 的中间层；被引导层越深，Student
    的灵活性越小，越容易被过度正则化。

训练分**两阶段**（下图）：

    阶段 1（hint 训练）：
      Teacher 输入 x ──► [到 hint 层] ──► u_h(x) ┐
                                                ├─ L_HT 最小化 → 只训练 Student 到 guided 层 + 回归器 r
      Student 输入 x ──► [到 guided 层] ──► r(·) ┘
    阶段 2（KD 训练）：
      用阶段 1 得到的参数初始化 Student，整体用 KD 损失（软目标 + 硬标签）训练

图中：

  - 阶段 1 只更新 Student 从输入到被引导层的参数以及回归器，目标是把 Student 的浅层特征"预热"到接近 Teacher
    的提示层；
  - 阶段 2 在此基础上对整个 Student 做常规的 Hinton KD（见
    [响应蒸馏](/0689_MO_KD_Response)）；
  - 回归器 $r$ 只在训练阶段使用，推理时丢弃。

## 4\. Attention Transfer（AT）

AT 只传递由特征算出的**空间注意力图**，既避免了通道数不同的对齐问题，也更轻量。

### 4.1 注意力图

对激活张量 $A\\in\\mathbb R^{C\\times H\\times W}$，映射函数 $F:\\mathbb
R^{C\\times H\\times W}\\to\\mathbb R^{H\\times W}$
把它沿通道维压成二维图。论文考虑三种，基本假设是"隐层神经元激活的绝对值可以表示该神经元对当前输入的重要程度"：

$$ F\_{sum}(A)=\\sum\_{i=1}^{C}|A\_i|,\\qquad
F^{p}*{sum}(A)=\\sum*{i=1}^{C}|A\_i|^{p},\\qquad
F^{p}*{max}(A)=\\max*{i=1,\\dots,C}|A\_i|^{p} $$

其中：

  - $A\_i=A(i,:,:)$：第 $i$ 个通道的特征平面；绝对值、幂、最大值都按元素进行；
  - $p\>1$：幂次。$p$ 越大，越强调激活最强的位置（最具判别性的部位），细节形状逐渐消失；
  - $F^p\_{sum}$ 会偏好"多个神经元同时高激活"的位置，而 $F^p\_{max}$ 每个位置只看一个神经元；论文实验主要使用
    $F^2\_{sum}$。

### 4.2 AT 损失

$$ \\mathcal L\_{AT}=\\mathcal
L(W\_S,x)+\\frac\\beta2\\sum\_{j\\in\\mathcal
I}\\Big|\\frac{Q\_S^{,j}}{|Q\_S^{,j}|\_2}-\\frac{Q\_T^{,j}}{|Q\_T^{,j}|\_2}\\Big|\_p
$$

其中：

  - $\\mathcal L(W\_S,x)$：Student 自身的任务损失（如交叉熵）；
  - $\\mathcal I$：做注意力迁移的层对集合（如 ResNet 每个残差组之后）；
  - $Q\_S^{,j}=\\mathrm{vec}(F(A\_S^{,j}))$、$Q\_T^{,j}=\\mathrm{vec}(F(A\_T^{,j}))$：第
    $j$ 对 Student、Teacher 的注意力图展平后的向量；
  - 对向量做 $L\_2$ 归一化（也可以用 $L\_1$）——论文强调**归一化对 Student 训练的成功很重要**；$p$
    为范数类型，实验取 2；
  - $\\beta$：注意力迁移项的权重；
  - AT 可以与 Hinton KD 叠加：只需再加一项软目标的交叉熵；Teacher 的注意力图在前向传播中即可得到，几乎不增加计算开销。

论文还提出基于梯度的注意力迁移（匹配输入梯度），此处不展开。

## 5\. FSP（简述）

FSP（Flow of Solution Procedure，CVPR 2017）把两层特征之间的"信息流"定义为它们的 Gram 型矩阵，让
Student 匹配 Teacher 的该矩阵。ReviewKD 的相关工作部分概括为"FSP 从层特征生成 FSP 矩阵并用该矩阵指导
Student"；其具体公式 $G=\\tfrac{1}{hw}\\sum\_{s}F^1\_{s}\\otimes
F^2\_{s}$（对空间位置求平均的通道间内积）为一般形式的转述，未对照原文 `[待核实]`。

## 6\. CRD：对比表示蒸馏

CRD 不直接最小化特征距离，而是用**对比学习**让 Student 的表示与同一输入下的 Teacher 表示靠近，与不同输入的
Teacher 表示远离，等价于最大化师生表示之间互信息的下界。

### 6.1 对比目标

设 $f^T(x)$、$f^S(x)$ 为 Teacher、Student 倒数第二层（logits 之前）的表示，记随机变量
$T=f^T(x)$、$S=f^S(x)$。引入潜变量 $C$
表示配对是否来自联合分布（$C=1$：同一输入的一对；$C=0$：来自边缘分布乘积，即不同输入的一对）；设每
1 个正样本对应 $N$ 个负样本，则 $q(C=1)=\\frac{1}{N+1}$。推导得到互信息下界：

$$ I(T;S)\\ \\ge\\ \\log N+\\mathbb E\_{q(T,S|C=1)}\\big\[\\log
h(T,S)\\big\] $$

其中：

  - $I(T;S)$：师生表示之间的互信息；$h:\\mathcal T\\times\\mathcal
    S\\to\[0,1\]$：**critic**，用来估计 $q(C=1|T,S)$；
  - 在 $h$ 足够表达的假设下，最优 critic 恰好等于 $q(C=1|T,S)$。

因为最优 critic 依赖当前 Student，论文把下界放宽，得到联合优化 Student 与 critic 的目标：

$$ \\mathcal L\_{critic}(h)=\\mathbb E\_{q(T,S|C=1)}\[\\log
h(T,S)\]+N,\\mathbb E\_{q(T,S|C=0)}\[\\log(1-h(T,S))\],\\qquad
f^S=\\arg\\max\_{f^S}\\max\_{h}\\mathcal L\_{critic}(h) $$

其中：$\\mathcal L\_{critic}$ 是二分类对数似然（正样本对 vs. $N$ 个负样本对）；由于
$\\max\_h\\mathcal L\_{critic}\\ge\\mathcal L\_{critic}(h)$ 对任意
$h$，该式对任意 $h$ 仍是互信息的（更弱的）下界，因此不要求 critic 被优化到最优。

critic 的具体形式为：

$$
h(T,S)=\\frac{e^{g^T(T)'g^S(S)/\\tau}}{e^{g^T(T)'g^S(S)/\\tau}+\\dfrac{N}{M}}
$$

其中：

  - $g^T$、$g^S$：把 Teacher、Student 表示线性映射到同一维度并做 $L\_2$ 归一化的投影头；
  - $\\tau$：温度，控制分布的集中程度；$M$：数据集大小；
  - 分母中常数项的具体形式（$N/M$）以原文为准 `[待核实]`；
  - 论文把它写成 NCE 风格（与 InfoNCE 的区别是目标与下界不同，论文实验中更有效）；
  - 为避免使用过大的 batch，实现中借鉴 Wu 等（2018）用**记忆库**存放此前 batch 的特征，从中取大量负样本。

CRD 最终与经典 KD 目标叠加使用（论文 3.2 节给出 KD 目标 $\\mathcal L\_{KD}$，具体加权方式以原文为准
`[待核实]`）。论文还把对比目标用于跨模态迁移与集成蒸馏。

## 7\. ReviewKD：知识回顾

此前方法（含上面三种）都只用**相同层级**的信息监督 Student：监督 Student 第 4 阶段的输出就只用 Teacher 的第 4
阶段。ReviewKD 指出这是瓶颈，提出"**回顾机制**"：用 Teacher 的**浅层**特征去监督 Student
**更深**的层，类比学生复习旧知识。

### 7.1 连接路径

把 Student 按下采样分成 $n$ 个阶段，第 $i$ 阶段特征为 $F^s\_i$，Teacher 第 $j$ 阶段特征为
$F^t\_j$。直接把 Student 第 $i$ 阶段与 Teacher 所有阶段 $j\\le i$ 配对，需要计算 $n(n+1)/2$
对距离，过于繁琐：

$$ \\mathcal
L\_{MKD\\text{-}R}=\\sum\_{j=1}^{n}\\sum\_{i=j}^{n}\\mathcal
D\\big(F^s\_i,,F^t\_j\\big)\\ \\approx\\ \\sum\_{j=1}^{n}\\mathcal
D\\Big(\\mathcal U\\big(F^s\_j,\\dots,F^s\_n\\big),,F^t\_j\\Big) $$

其中：

  - $\\mathcal D$：距离函数（含必要的特征变换，如最近邻插值使 Student 特征与 Teacher 尺寸一致，论文只变换
    Student 特征）；
  - 交换求和次序后：固定 $j$ 时，求和实际上累加了 Teacher 的 $F^t\_j$ 与 Student 的
    $F^s\_j,\\dots,F^s\_n$ 的距离；
  - $\\mathcal U$：特征融合模块，用融合后的特征近似距离之和（最右端的近似），把代价从 $O(n^2)$ 降到 $O(n)$。

### 7.2 残差学习、ABF 与 HCL

  - **残差学习框架**：融合从最深阶段开始、逐阶段向浅层累积，每一步把更深一层的融合结果作为残差传下去，使训练稳定；
  - **ABF（Attention Based Fusion）**：用注意力图聚合 Student 不同层级的特征；
  - **HCL（Hierarchical Context Loss）**：把 Student 与 Teacher
    的特征做**金字塔池化**，在多个空间尺度上提取上下文信息并分别计算距离，即对多个尺度的池化结果求和。

下图概括 ReviewKD 与以往"同层对同层"的差异。

    以往：   T1 ─→ S1     T2 ─→ S2     T3 ─→ S3     T4 ─→ S4    （同层一一对应）
    ReviewKD：T1 ←─ U(S1,S2,S3,S4)
              T2 ←─ U(S2,S3,S4)
              T3 ←─ U(S3,S4)
              T4 ←─ S4        （Teacher 浅层特征监督 Student 更深层的融合特征）

图中：

  - $T\_j$、$S\_i$ 是 Teacher 第 $j$ 阶段、Student 第 $i$ 阶段的特征；
  - 右侧每一行对应上式中的一项：Teacher 第 $j$ 阶段特征与 Student 第 $j$ 到第 $n$ 阶段融合后的特征
    $\\mathcal U$ 对齐；
  - 每行的融合依次累积，最后一行 $T\_4\\leftarrow S\_4$ 退化为普通的同层对齐。

论文在分类、目标检测与实例分割上都验证了有效性，且额外计算开销可以忽略（摘要）。

## 8\. 对比汇总

| 方法       | 对齐对象         | 是否需要适配层                 | 层间连接              | 关键设计                  |
| -------- | ------------ | ----------------------- | ----------------- | --------------------- |
| FitNets  | 提示层/被引导层原始特征 | 需要回归器（卷积回归器降参数）         | 单个（hint → guided） | 两阶段训练：先 hint 预训练，再 KD |
| AT       | 空间注意力图       | 不需要（注意力图是 $H\\times W$） | 每个残差组一对           | 归一化的注意力图 + $L\_p$ 距离  |
| CRD      | 倒数第二层表示      | 线性投影头 + 记忆库             | 单层（表示层）           | 互信息下界的对比目标            |
| ReviewKD | 多层级融合特征      | 需要融合模块 ABF              | 跨层（浅 → 深）         | 残差融合 + 金字塔池化的 HCL     |

表中：

  - 第一列是方法，第二列是匹配的对象，第三列说明通道数/分辨率不一致时如何处理，第四列是师生之间的层连接方式，第五列是该方法的关键设计；
  - 对齐对象从"原始特征"逐步抽象到"注意力图"、"表示的互信息"；ReviewKD
    则从连接路径入手，是与前三者正交的改进，原则上可以和不同的距离函数组合
    `[解读]`。

## 9\. 总结 \[解读\]

  - 特征蒸馏比响应蒸馏提供更密的监督信号，但需要处理师生结构对齐问题，选层与适配模块是主要的工程成本；
  - 之后的 DKD（见 [响应蒸馏](/0689_MO_KD_Response)）表明，只要 logit
    蒸馏的损失设计得当，也能达到接近特征蒸馏的效果，两类方法并不互斥，常常叠加使用；
  - 在检测、分割里，通道/空间信息更关键，特征蒸馏通常是首选（详见 [检测/分割/ViT 蒸馏](/XXXX_MO_KD_CV)）。

## Reference

  - Romero A, Ballas N, Kahou S E, Chassang A, Gatta C, Bengio Y.
    FitNets: Hints for Thin Deep Nets. ICLR 2015. arXiv:1412.6550
  - Zagoruyko S, Komodakis N. Paying More Attention to Attention:
    Improving the Performance of Convolutional Neural Networks via
    Attention Transfer. ICLR 2017. arXiv:1612.03928
  - Yim J, Joo D, Bae J, Kim J. A Gift from Knowledge Distillation: Fast
    Optimization, Network Minimization and Transfer Learning (FSP). CVPR
    2017. `[无 arXiv，未读原文]`
  - Tian Y, Krishnan D, Isola P. Contrastive Representation
    Distillation. ICLR 2020. arXiv:1910.10699
  - Chen P, Liu S, Zhao H, Jia J. Distilling Knowledge via Knowledge
    Review. CVPR 2021. arXiv:2104.09044
