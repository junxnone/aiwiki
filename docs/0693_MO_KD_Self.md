---
Title | MO KD Self
-- | --
Created @ | `2026-11-23T01:49:16Z`
Updated @| `2026-11-23T01:49:16Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/693)

---
# Self

自蒸馏（Self-distillation）让**模型自己同时充当 Teacher 和 Student**：用自己更早的训练阶段、更深的层、同类的其他样本，或一个人工设计的分布作为"老师"。它去掉了"先训练一个大 Teacher"的前提，也让人重新审视 KD 为什么有效——也许一部分原因是软目标的**正则化作用**。本文覆盖四个代表：BAN（*Born Again Neural Networks*，ICML 2018，arXiv:1805.04770）、BYOT（*Be Your Own Teacher*，ICCV 2019，arXiv:1905.08094）、CS-KD（*Regularizing Class-wise Predictions via Self-knowledge Distillation*，CVPR 2020，arXiv:2003.13964）和 Tf-KD（*Revisiting Knowledge Distillation via Label Smoothing Regularization*，arXiv:1909.11723）。

**一句话概括：BAN 让同样结构的网络一代代向上一代学习；BYOT 让浅层分类器向最深层学习；CS-KD 让同一个网络对"同类的不同样本"给出一致的预测；Tf-KD 用模型自己的预训练版本或人工设计的"虚拟老师"代替真实 Teacher。**

> 标注约定：未标注的内容来自上述论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：总览 [知识蒸馏](0207_MO_KD)；发展历史 [KD History](0336_MO_KD_History)；输出层蒸馏与标签平滑 [响应蒸馏](/0689_MO_KD_Response)；同时训练多个模型的 [在线蒸馏](/0692_MO_KD_Online)；多个浅层分类器共用主干的相关思想 [特征蒸馏](/0690_MO_KD_Feature)。

## 1. 解决什么问题

- 传统蒸馏需要先找到、训练一个更强的 Teacher，并设计合适的架构，**训练流程长**；
- 这个要求是否必要？BAN 的发现是：Student 与 Teacher **结构完全相同**也能超过 Teacher；Tf-KD 进一步指出：一个比 Student 更差的 Teacher、甚至人工设计的分布，也能带来提升——说明**软目标的正则化作用**与类间相似度信息同样重要；
- 因此自蒸馏的核心问题是：不引入外部大模型，如何构造出"有用的软目标"。

## 2. 符号约定

- $y$：硬标签；$K$（或 $C$、$M$）：类别数；$z$：logits；$T$：温度；
- $p(x;T)$：模型在温度 $T$ 下对样本 $x$ 的 softmax 输出；
- $\theta$：当前模型参数；$\bar\theta$：参数的固定副本（不传梯度）。

## 3. BAN：重生网络

BAN 的做法非常简单：Teacher 训练收敛后，**再用相同架构、不同随机种子初始化一个新的 Student**，同时用真实标签和 Teacher 的输出训练它；之后把这个 Student 当作下一代的 Teacher，如此重复：

$$
\theta_k=\arg\min_\theta\ \mathcal L\big(f(x,\theta_{k-1}^{*}),\,f(x,\theta)\big),\qquad k=2,3,\dots
$$

其中：

- $\theta_{k-1}^{*}$：上一代模型训练收敛后的参数，作为固定的 Teacher；$\theta_k$：第 $k$ 代；
- $\mathcal L$：KD 型损失（标签交叉熵 + 与上一代输出的软目标交叉熵）；
- 序列的收益会饱和，但可以把各代模型做**集成**（论文试了 2 代和 3 代）获得额外增益。

论文还拆解了 KD 为什么有效。KD 的梯度可以分解成两项：一项是"暗知识项"（含错误类的信息），另一项是对真实标签梯度的重缩放。后者相当于按**教师对正确类的置信度**给每个样本加权的"重要性加权"。为了区分两者的贡献，论文设计了两个对照实验：

| 处理 | 做法 | 回答的问题 |
|---|---|---|
| CWTM（Confidence Weighted by Teacher Max） | 只保留教师最大输出作为样本权重，不用其他输出 | 仅靠"置信度重要性加权"能走多远 |
| DKPP（Dark Knowledge with Permuted Predictions） | 把教师非 argmax 输出的各维度随机打乱 | 暗知识的类间对应关系是否重要 |

表中：

- 第一列是处理名称，第二列是对教师输出的操作，第三列是它要检验的问题；
- 两种处理分别剥离了"重要性加权"和"类间相似度（暗知识）"，用来量化 KD 收益里各部分的贡献；
- 论文还发现，不同架构之间也可以重生，例如用 DenseNet Teacher 训练参数量相当的 ResNet Student，Student 能超过 DenseNet Teacher。

## 4. BYOT：浅层向深层自蒸馏

BYOT（Be Your Own Teacher）是**一步到位**的自蒸馏框架：不先训练大 Teacher，而是在同一个网络内部，让**最深的分类器当老师、各个浅层分类器当学生**。

```
输入 ─► [Section 1] ─► [Section 2] ─► [Section 3] ─► [Section 4] ─► 分类器 4（最深，"教师"）
            │              │              │
         瓶颈+FC        瓶颈+FC        瓶颈+FC        （仅训练时使用，可在推理时去掉）
            ▼              ▼              ▼
         分类器 1       分类器 2       分类器 3      ← 每个浅层分类器同时受三种监督
```

图中：

- 网络按深度分成若干段（如 ResNet 按残差阶段分成 4 段），在每个浅层段后接一个"瓶颈层 + 全连接层"构成辅助分类器；
- 辅助分类器（图中虚线部分）只在训练时使用，不影响推理；也可以保留它们，得到一个可在不同深度退出的单一网络，在边缘设备上折中精度与延迟；
- 每个浅层分类器同时接受三种监督（见下式）。

对第 $i$ 个浅层分类器（共 $C$ 个分类器，第 $C$ 个最深），损失为：

$$
\mathcal L_i=(1-\alpha)\,\mathrm{CE}(q_i,\,y)+\alpha\,\mathrm{KL}(q_i\,\|\,q_C)+\lambda\,\big\|F_i-F_C\big\|_2^2
$$

其中：

- $q_i$：第 $i$ 个分类器的 softmax 输出；$q_C$：最深分类器的输出（"教师"）；
- 第一项：标签的交叉熵，对所有分类器（含最深者）都有；
- 第二项：浅层分类器向最深分类器逼近的 KL 散度（蒸馏项，来自 softmax 层）；
- 第三项：来自"提示（hint）"的 $L_2$ 损失，要求浅层瓶颈层的特征图 $F_i$ 去拟合最深分类器的特征图 $F_C$（特征蒸馏）；
- $\alpha$、$\lambda$：平衡三项的超参数；论文承认这两个超参数对性能有影响，但受限于算力没有做彻底的搜索（可以后续做自动调节）。

论文的主要结论：

- 在 CIFAR-100 与 ImageNet 上，五类卷积网络平均提升约 2.65%（从 ResNeXt 的 0.61% 到 VGG19 的 4.07%）；例如 CIFAR-100 上，ResNet-18 的基线 77.09%，其最深分类器为 78.64%；ResNet-50 的基线 77.68%，最深分类器为 80.56%、各分类器集成为 81.04%（论文 Table 1）；
- 训练时间显著少于"先训大 Teacher 再蒸馏"的传统做法（论文报告 CIFAR-100 上从 26.98 小时降到 5.87 小时，约 4.6 倍）；
- 与深度监督网络（deeply supervised net）的区别：BYOT 的浅层分类器是通过蒸馏训练的，而不只是用标签；
- 论文还从"平坦极小值"、梯度幅度（自蒸馏后浅层梯度更大）与判别性特征的角度解释其有效性。

## 5. CS-KD：类内一致的自知识蒸馏

CS-KD 是一种正则化方法：不引入 Teacher，而是让**同一网络对同一类别的不同样本**给出一致的预测分布，等价于蒸馏模型自己的"暗知识"。

$$
\mathcal L_{CS\text{-}KD}(x,x',y;\theta,T)=\mathcal L_{CE}(x,y;\theta)+\lambda_{cls}\,T^{2}\,\mathcal L_{cls}(x,x';\theta,T),\qquad
\mathcal L_{cls}=\mathrm{KL}\big(p(y\,|\,x';\bar\theta,T)\,\big\|\,p(y\,|\,x;\theta,T)\big)
$$

其中：

- $x'$：从训练集中再随机抽取的、**与 $x$ 标签相同**的另一个样本；
- $p(y|x;\theta,T)$：温度 $T$ 下的预测分布；$\bar\theta$：参数的固定副本，**不传梯度**（借鉴 Miyato 等的做法以避免模型坍缩）；
- $\lambda_{cls}>0$：类内一致性项的权重；$T^2$：沿用原始 KD 的温度补偿；
- 与原始 KD 的区别：KD 是同一个样本、两个网络的预测相匹配，CS-KD 是不同样本、同一个网络的预测相匹配；
- 论文认为这一个机制同时起到两个作用：①避免过度自信的预测（用模型对其他样本的预测当软标签，比标签平滑那种"人工"软标签更"真实"）；②减小类内方差（直接拉近同类样本的 logits）；
- 论文在 CIFAR-100、TinyImageNet、CUB-200-2011、Stanford Dogs、MIT67、ImageNet 上验证，top-1 错误率一致低于角度间隔类与熵正则类等输出正则方法；还观察到错分样本上真实类别的得分被提高。

## 6. Tf-KD：无老师蒸馏

Tf-KD 建立在论文对 KD 与标签平滑（LSR）关系的分析上（见 [响应蒸馏](/0689_MO_KD_Response)）：KD 是**学出来的** LSR，LSR 是**手工设计的** KD，因此软目标的价值不只是类间相似度，更是正则化。据此提出两种不需要真实 Teacher 的实现。

**① Tf-KD$_{self}$：自我训练。** 先正常训练模型得到预训练版本 $S_p$，再让模型 $S$ 向 $S_p$ 的软输出蒸馏：

$$
\mathcal L_{self}=(1-\alpha)\,H(q,p)+\alpha\,T^{2}\,\mathrm{KL}\big(p^{S_p}_{\tau},\,p_{\tau}\big)
$$

其中：$H(q,p)$ 是标签交叉熵，$p^{S_p}_{\tau}$ 与 $p_\tau$ 是预训练版本与当前模型在温度 $\tau$ 下的输出，$\alpha$ 为权重；其形式与 BAN 相近，区别在于动机（自我正则化）以及只用自己的软目标，而不是集成多代学生（上式的具体记号与系数写法为整理 `[待核实]`）。

**② Tf-KD$_{reg}$：人工虚拟老师。** 手工构造一个对任何数据集都 100% 准确的"教师"分布：

$$
p^{d}(k)=\begin{cases}a,&k=c\\[2pt]\dfrac{1-a}{K-1},&k\ne c\end{cases},\qquad
\mathcal L_{reg}=(1-\alpha)\,H(q,p)+\alpha\,D_{KL}\big(p^{d}_{\tau},\,p_{\tau}\big)
$$

其中：

- $c$：正确类别，$K$：类别总数，$a$：正确类的概率，论文始终取 $a\ge0.9$；
- $p^d_\tau$：用高温（论文取 $\tau\ge20$）软化后的虚拟分布，使它拥有类似标签平滑的平滑性，同时精度为 100%；
- 这个"老师"没有任何类间相似度信息，但 Tf-KD 仍可与普通 KD 相当，直接支持了"正则化作用同样重要"的结论。

论文报告：不增加额外计算，ImageNet 上最高提升 0.65%，优于标签平滑；一个强学生（如 ResNeXt29-8×64d，CIFAR-100 上 81.03% → 82.08%）也能受益，适用于找不到更强老师或训练老师太贵的场景。

## 7. 对比汇总

| 方法 | "老师"来自哪里 | 额外训练阶段 | 额外推理开销 | 关键设计 |
|---|---|---|---|---|
| BAN | 上一代同结构模型 | 需要，一代接一代 | 无（可选集成多代） | 序列式重生 + 可集成 |
| BYOT | 同一网络的最深分类器 | 不需要（一步训练） | 无（辅助分支可去掉） | 多出口 + 三种监督（CE/KL/特征 $L_2$） |
| CS-KD | 同类其他样本上的自身预测 | 不需要 | 无 | 类内一致性正则，固定参数副本 |
| Tf-KD | 自身预训练版本 / 人工虚拟分布 | self 版需要预训练一次；reg 版不需要 | 无 | 软目标当作正则化，而非类间相似度 |

表中：

- 第一列是方法，第二列说明"软目标"的来源，第三列是否要多一个训练阶段，第四列是部署时是否有额外开销，第五列是关键设计；
- 所有方法部署时都没有额外模型，BYOT 的辅助分支在推理时可以去掉，也可以保留以支持多深度退出；
- 它们共同表明：KD 的收益并不依赖于存在一个更强的外部老师。

## 8. 总结 [解读]

- 自蒸馏的实际价值：**免费的正则化**。不需要额外模型就能改进泛化，适合当作训练 recipe 的一部分；
- 理解 KD 的视角被扩展了：类间相似度（暗知识）与软目标的正则化是两条不同的作用路径，具体哪条占主导取决于数据与模型；
- 上述方法的收益主要在分类任务与卷积网络上被验证，对更大模型与其他任务是否同样有效需要另行验证。

## Reference

- Furlanello T, Lipton Z C, Tschannen M, Itti L, Anandkumar A. Born Again Neural Networks. ICML 2018. arXiv:1805.04770
- Zhang L 等. Be Your Own Teacher: Improve the Performance of Convolutional Neural Networks via Self Distillation. ICCV 2019. arXiv:1905.08094 `[作者列表待核实]`
- Yun S, Park J, Lee K, Shin J. Regularizing Class-wise Predictions via Self-knowledge Distillation. CVPR 2020. arXiv:2003.13964
- Yuan L, Tay F E H, Li G, Wang T, Feng J. Revisiting Knowledge Distillation via Label Smoothing Regularization. arXiv:1909.11723

