---
Title | MO KD DataFree
-- | --
Created @ | `2026-11-23T01:50:51Z`
Updated @| `2026-11-23T02:42:49Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/694)

---
# 无数据蒸馏（Data-Free KD）

无数据蒸馏（Data-free KD）解决的是这样的场景：Teacher 已经训练好并发布，**但训练数据拿不到**（隐私、版权、数据太大或被删除）。普通蒸馏需要用原始数据（或同分布数据）让 Student 去匹配 Teacher 的输出，没有数据就无从下手。无数据蒸馏的思路是**自己合成训练样本**：要么训练一个生成器，要么直接对输入做优化。本文覆盖三个代表：DAFL（*Data-Free Learning of Student Networks*，ICCV 2019，arXiv:1904.01186）、DeepInversion / Adaptive DeepInversion（*Dreaming to Distill: Data-free Knowledge Transfer via DeepInversion*，CVPR 2020，arXiv:1912.08795）和 ZSKT（*Zero-shot Knowledge Transfer via Adversarial Belief Matching*，NeurIPS 2019，arXiv:1905.09768），并区分一个容易混淆的概念——数据集蒸馏（Dataset Distillation）。

**一句话概括：DAFL 把 Teacher 当判别器训练生成器，让合成样本像"真样本"（Teacher 分类很自信、特征激活强、类别均衡）；DeepInversion 直接优化噪声图像，并用 BN 层里存的均值方差约束它；ZSKT 让生成器与 Student 对抗，专门找 Student 学不像 Teacher 的样本。**

> 标注约定：未标注的内容来自上述论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：总览 [知识蒸馏](0207_MO_KD)；发展历史 [KD History](0336_MO_KD_History)；蒸馏损失基础 [响应蒸馏](/0689_MO_KD_Response)；ZSKT 中使用的注意力迁移见 [特征蒸馏](/0690_MO_KD_Feature)；量化中同样存在"无数据"流派，见 [量化 PTQ](/0702_MO_Quantization_PTQ)（DFQ 等）。

## 1. 解决什么问题

- 传统 KD（包括 Hinton KD、FitNets）都需要用训练数据把样本送过 Teacher 和 Student；
- 现实中常常只能拿到预训练模型：数据可能涉及隐私或商业机密，也可能体积庞大（如 JFT）；论文还指出用分布外的数据做蒸馏可能显著降低 Student 的表现；
- 无数据蒸馏要回答：能否仅凭 Teacher 本身，造出足够好的"替身样本"，让 Student 学到 Teacher 的行为？

## 2. 符号约定

- $N_T$（或 $T$）：预训练好的 Teacher；$N_S$（或 $S$）：Student；
- $G(z)$：生成器，输入噪声 $z\sim\mathcal N(0,I)$，输出合成图像 $\hat x$；
- $y^T=N_T(\hat x)$：Teacher 对合成样本的输出；$\mathrm{KL}(\cdot\|\cdot)$：KL 散度；$H_{cross}$：交叉熵。

## 3. DAFL：把 Teacher 当判别器

DAFL 借用 GAN 的思路：生成器 $G$ 产生图像，**预训练的 Teacher 直接充当判别器**，不再另外训练判别器。如果合成图像服从 Teacher 的训练数据分布，它们在 Teacher 上也应表现得像真样本。论文据此设计三项生成器损失。

### 3.1 三项损失

**① one-hot 损失**：真实训练图像在 Teacher 上的输出通常接近 one-hot，因此鼓励合成图像也被 Teacher 以较高置信度归为某一类，取 Teacher 的预测类别 $t_i=\arg\max y^T_i$ 作为伪标签：

$$
\mathcal L_{oh}=\frac1n\sum_{i=1}^{n}H_{cross}\big(y_i^T,\,t_i\big)
$$

其中：$n$ 是合成样本数，$y^T_i=N_T(\hat x_i)$ 是 Teacher 的输出，$t_i$ 是伪标签（预测类别）；它让生成的是"Teacher 认得出"的图像。

**② 特征激活损失**：Teacher 卷积层提取的特征携带输入的有效信息，真实图像会引起较强的激活，因此鼓励合成图像在 Teacher 的特征图上有高激活：

$$
\mathcal L_{a}=-\frac1n\sum_{i=1}^{n}\big\|f^T_i\big\|_1
$$

其中：$f^T_i$ 是 Teacher 对第 $i$ 个合成样本在（全连接层之前的）特征图，$\|\cdot\|_1$ 是 $L_1$ 范数；负号表示最大化激活幅度。

**③ 信息熵损失**：只用前两项，生成器可能只生成少数几类。为使各类别生成的概率大致相同，最小化合成样本类别频率分布的"负信息熵"：

$$
\mathcal L_{ie}=-H_{info}\Big(\frac1n\sum_{i=1}^{n}y_i^T\Big),\qquad H_{info}(p)=-\frac1k\sum_{j=1}^{k}p_j\log p_j
$$

其中：$k$ 为类别数，$\frac1n\sum_i y_i^T$ 是这批合成样本的类别频率分布；$H_{info}$ 在各类概率都等于 $1/k$ 时取最大，因此最小化 $\mathcal L_{ie}$ 会使生成样本类别均衡（论文中 $H_{info}$ 的归一化系数写法按原文 `[待核实]`）。

### 3.2 总目标与流程

$$
\mathcal L_{Total}=\mathcal L_{oh}+\alpha\,\mathcal L_{a}+\beta\,\mathcal L_{ie}
$$

其中：$\alpha$、$\beta$ 是平衡三项的超参数。训练分两步交替进行：用上式更新生成器 $G$；再用 $G$ 生成的样本，让 Student 用普通 KD 损失 $\mathcal L_{KD}=\frac1n\sum_i H_{cross}(y^T_i,y^S_i)$ 去匹配 Teacher。论文在 MNIST 上用 LeNet-5（Teacher）→ LeNet-5-HALF（Student）验证：用未经训练的随机生成器样本时 Student 仅 88.01%，三项损失逐项加入后，生成样本从"类别不均衡"变为均衡，Student 精度逐步提升；最终 MNIST 的 DAFL 结果为 98.20%（Teacher 98.91%）。

## 4. DeepInversion：直接"反演"输入

DAFL 需要额外训练一个生成器。DeepInversion 不引入生成器，而是**固定 Teacher，对输入图像本身做梯度优化**，使其变成类别条件的、逼真的图像。

### 4.1 基础：DeepDream 式的输入优化

给定随机初始化的输入 $\hat x$ 与目标类别 $y$，优化：

$$
\min_{\hat x}\ \mathcal L(\hat x,y)+\mathcal R(\hat x),\qquad \mathcal R_{prior}(\hat x)=\alpha_{tv}\,\mathcal R_{TV}(\hat x)+\alpha_{\ell_2}\,\mathcal R_{\ell_2}(\hat x)
$$

其中：$\mathcal L$ 是分类损失（如交叉熵）；$\mathcal R_{prior}$ 是图像先验，$\mathcal R_{TV}$ 惩罚总变差（让图像平滑），$\mathcal R_{\ell_2}$ 惩罚 $\hat x$ 的 $L_2$ 范数，二者的系数分别是 $\alpha_{tv}$、$\alpha_{\ell_2}$。先验让优化更稳定地得到有视觉意义的图像，但生成的分布与自然图像仍相差很远。

### 4.2 特征分布正则：BN 统计量

DeepInversion 的核心：假设各层特征在 batch 上服从高斯分布，让合成图像的**特征统计量**与真实训练数据对齐：

$$
\mathcal R_{feature}(\hat x)=\sum_{l}\big\|\mu_l(\hat x)-\mathbb E[\mu_l(x)\,|\,\mathcal X]\big\|_2+\sum_{l}\big\|\sigma_l^2(\hat x)-\mathbb E[\sigma_l^2(x)\,|\,\mathcal X]\big\|_2
$$

其中：

- $\mu_l(\hat x)$、$\sigma_l^2(\hat x)$：合成图像在第 $l$ 个卷积层特征图上的批内均值与方差估计；
- $\mathbb E[\mu_l(x)|\mathcal X]$、$\mathbb E[\sigma_l^2(x)|\mathcal X]$：真实训练集 $\mathcal X$ 上的相应期望。看似需要训练数据，但**BN 层的滑动平均均值/方差**正好存了这些量：$\mathbb E[\mu_l]\approx\mathrm{BN}_l(\text{running mean})$，$\mathbb E[\sigma^2_l]\approx\mathrm{BN}_l(\text{running var})$，因此无需任何图像；
- 总正则项 $\mathcal R_{DI}(\hat x)=\mathcal R_{prior}(\hat x)+\alpha_f\,\mathcal R_{feature}(\hat x)$，$\alpha_f$ 为系数。

论文消融（CIFAR-10）显示：仅优化噪声无法支持蒸馏；加入先验略有改善；**加入 $\mathcal R_{feature}$ 后 Student 精度大幅提升 40%~69%**，生成图像的真实感也明显优于 DeepDream 与 DAFL（DAFL 的图像"难以辨认"，类似 fooling images）。在没有 BN 的网络上，可以改为用少量真实图像（论文表明 100 张就足够 Adaptive DeepInversion 几乎达到使用 BN 统计量的精度）估计这些统计量。

### 4.3 Adaptive DeepInversion：加入多样性

生成的图像若重复冗余，就帮不了 Student。Adaptive DeepInversion（ADI）让图像生成过程与 Student **竞争**：鼓励合成出 Teacher 能认出而 Student 认不准的图像，用 Jensen-Shannon 散度衡量二者的分歧：

$$
\mathcal R_{compete}(\hat x)=1-\mathrm{JS}\big(p_T(\hat x),p_S(\hat x)\big),\qquad
\mathrm{JS}(p_T,p_S)=\tfrac12\big[\mathrm{KL}(p_T\|M)+\mathrm{KL}(p_S\|M)\big],\quad M=\tfrac12(p_T+p_S)
$$

其中：$p_T(\hat x)$、$p_S(\hat x)$ 是 Teacher、Student 对合成图像的输出分布；$M$ 是二者的平均；最小化 $1-\mathrm{JS}$ 等价于**最大化二者分歧**。总正则项为 $\mathcal R_{ADI}(\hat x)=\mathcal R_{DI}(\hat x)+c\,\mathcal R_{compete}(\hat x)$，$c$ 为系数。

论文的使用方式：DeepInversion 可以对任意训练好的 CNN **一次性**合成大量图像用于启动知识迁移；ADI 则需要 Student 在环，适合随 Student 不断演化、逐轮补充"更难"的新图像。实验中 ADI 在 DeepInversion 之上又提升 1%~10%，使 CIFAR-10 的 Student 精度与用真实图像训练的 Teacher 相差在 2% 之内。除蒸馏外，论文还展示了无数据剪枝（用反演图像估计滤波器重要性）和无数据持续学习（为旧类别生成图像防遗忘）。

## 5. ZSKT：对抗式信念匹配

ZSKT（Zero-shot Knowledge Transfer）同样训练生成器，但思路是**对抗**的：生成器找出 Student 与 Teacher **分歧最大**的伪样本，Student 再去缩小这些分歧，两者交替博弈。

$$
\min_{\theta}\ \mathrm{KL}\big(T(x_p)\,\|\,S(x_p;\theta)\big)\ \ \text{(Student)},\qquad
\max_{\phi}\ \mathrm{KL}\big(T(G(z;\phi))\,\|\,S(G(z;\phi);\theta)\big)\ \ \text{(Generator)}
$$

其中：

- $x_p=G(z;\phi)$：生成器 $G$（参数 $\phi$）由噪声 $z\sim\mathcal N(0,I)$ 产生的伪样本；$S$ 的参数为 $\theta$；
- 主损失用**前向 KL** $\mathrm{KL}(T\|S)$：论文指出它会促使 Student 在输入空间里分散密度、对所有图像都给出非零的类别概率，这种高熵让生成器不容易轻易"骗过" Student；换成反向 KL 或 JS 散度时 Student 精度明显下降；
- Student 的损失还会加上一项在若干层上的**注意力迁移**（AT）损失，权重为超参数 $\beta$（论文取 $\beta=250$），用来对齐 Teacher/Student 对应块的空间注意力图；生成器的损失里**不**使用注意力项，因为那样太容易骗过 Student；
- 论文试过多种额外损失（样本多样性、一致性、师生熵等），均未带来提升，说明基础模型已经包含了这些性质；
- 实验：WRN-40-2（Teacher）→ WRN-16-1（Student），CIFAR-10 上零数据达到 83.69%±0.58%，若再用每类 100 张真实图像微调可到 85.91%±0.24%；在 SVHN 上沿用同一套超参数，得到 94.06%±0.27%，而用 7.3 万张全量图像 KD+AT 为 95.88%±0.15%。注意不同师生组合的效果差异较大。

## 6. 数据集蒸馏与无数据蒸馏的区别

*Dataset Distillation*（Wang 等，arXiv:1811.10959）**压缩的是数据集**：把一个大训练集浓缩成很少几张"合成图像"，使模型在这些图像上训练达到接近全量数据的效果；而无数据蒸馏**压缩的是模型**：数据已经拿不到，从 Teacher 的行为里还原训练信号，把大模型蒸馏成小模型。两者都会"合成数据"，但目标、输入和输出都不同，容易混淆。

## 7. 对比汇总

| 方法 | 合成样本的方式 | 是否额外训练生成器 | 是否需要 Student 在环 | 样本质量的关键约束 |
|---|---|---|---|---|
| DAFL | 生成器 $G$ | 是 | 否（先训生成器，再蒸馏；两者交替） | one-hot、特征激活、类别均衡三项损失 |
| DeepInversion | 直接优化输入图像 | 否 | 否（一次性合成） | 图像先验 + BN 特征统计匹配 |
| Adaptive DeepInversion | 同上 | 否 | 是 | 额外的师生 JS 分歧竞争项 |
| ZSKT | 生成器 $G$ | 是 | 是（对抗博弈） | 最大化师生 KL 分歧，Student 的 AT 损失 |

表中：

- 第一列是方法，第二列是样本的产生方式，第三列是否要另外训练生成网络，第四列样本合成时是否需要用到 Student，第五列是让样本"有用"的关键约束；
- 共同点是都不使用原始数据，仅依赖 Teacher（有时包括 Student）；DeepInversion 一类方法不需要生成器，但每张图都要做数千次梯度更新，合成成本高（论文中 ImageNet 每个 batch 约 2 小时、2 万次更新）`[解读]`。

## 8. 总结 [解读]

- 无数据蒸馏的核心是"从模型里反推出数据"：DAFL/ZSKT 靠生成器学习，DeepInversion 靠 BN 统计量加图像先验；
- 效果上，DeepInversion 一类基于 BN 统计的方法在带 BN 的 CNN 上很强，但依赖于 BN 层中存储的训练统计量；
- 局限：合成数据的多样性和真实度仍不及真实数据；在没有 BN 的架构（如很多 Transformer）上需要其他方式估计统计量。

## Reference

- Chen H, Wang Y, Xu C, Yang Z, Liu C, Shi B, Xu C, Xu C, Tian Q. Data-Free Learning of Student Networks. ICCV 2019. arXiv:1904.01186
- Yin H, Molchanov P, Li Z, Alvarez J M, Mallya A, Hoiem D, Jha N K, Kautz J. Dreaming to Distill: Data-free Knowledge Transfer via DeepInversion. CVPR 2020. arXiv:1912.08795
- Micaelli P, Storkey A `[第二作者待核实]`. Zero-shot Knowledge Transfer via Adversarial Belief Matching. NeurIPS 2019. arXiv:1905.09768
- Wang T, Zhu J-Y, Torralba A, Efros A A. Dataset Distillation. arXiv:1811.10959


