---
Title | MO KD Relation
-- | --
Created @ | `2026-11-23T01:46:17Z`
Updated @| `2026-11-23T02:42:37Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/691)

---
# 关系蒸馏（Relation-based KD）

关系蒸馏（Relation-based KD）让 Student 匹配的不是 Teacher 对**单个样本**的输出或特征，而是**样本之间（或层与层之间）的相对关系**——距离、夹角、相似度矩阵、概率分布。因为只匹配"关系"，师生的特征维度不必一致，也不必逐个样本复现 Teacher 的绝对数值。本文覆盖这一类的四个代表：RKD（*Relational Knowledge Distillation*，CVPR 2019，arXiv:1904.05068）、SP（*Similarity-Preserving Knowledge Distillation*，ICCV 2019，arXiv:1907.09682）、PKT（*Learning Deep Representations with Probabilistic Knowledge Transfer*，ECCV 2018，arXiv:1803.10837）和 CC（*Correlation Congruence for Knowledge Distillation*，ICCV 2019，arXiv:1904.01802）。

**一句话概括：RKD 匹配样本对的距离和样本三元组的夹角；SP 匹配批内样本两两激活相似度矩阵；PKT 把特征空间里的相似度变成条件概率分布并做 KL；CC 用核函数（泰勒展开近似）刻画批内实例相关性并要求师生一致。**

> 标注约定：未标注的内容来自上述论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：总览 [知识蒸馏](0207_MO_KD)；发展历史 [KD History](0336_MO_KD_History)；同样不依赖输出绝对值的 [特征蒸馏](/0690_MO_KD_Feature)（CRD 也在其中）；输出层蒸馏 [响应蒸馏](/0689_MO_KD_Response)。

## 1. 解决什么问题

- 传统蒸馏（无论 Hinton KD 还是 FitNets）本质上都是**个体蒸馏（Individual KD，IKD）**：对每个样本 $x_i$，让 $f^S(x_i)$ 去逼近 $f^T(x_i)$；RKD 论文把它们统一写成 $\mathcal L_{IKD}=\sum_{x_i}l\big(f^T(x_i),f^S(x_i)\big)$；
- 个体蒸馏要求学生的输出空间与教师逐点对应，小 Student 的容量有限，未必装得下 Teacher 的全部绝对输出；
- 关系蒸馏转而传递**结构知识**：同类样本在表示空间里靠得多近、不同类样本隔得多远。这种高阶性质对低阶性质（如表示的整体尺度、维度）是不变的。

## 2. 符号约定

- $f^T$、$f^S$：Teacher、Student 的表示函数（可取任意层输出）；$t_i=f^T(x_i)$、$s_i=f^S(x_i)$；
- $\mathcal X^N$：由 $N$ 个互不相同样本组成的 $N$ 元组集合，例如 $\mathcal X^2=\{(x_i,x_j)\,|\,i\ne j\}$，$\mathcal X^3=\{(x_i,x_j,x_k)\,|\,i\ne j\ne k\}$；
- $b$：mini-batch 大小；$l$：差异度量损失函数。

## 3. RKD：距离与角度

### 3.1 一般形式

RKD 为每个 $n$ 元组计算一个**关系势函数** $\psi$，并让 Student 的势与 Teacher 的势一致：

$$
\mathcal L_{RKD}=\sum_{(x_1,\dots,x_n)\in\mathcal X^N}l\big(\psi(t_1,\dots,t_n),\ \psi(s_1,\dots,s_n)\big)
$$

其中：$\psi$ 衡量给定 $n$ 元组的"关系能量"；$l$ 是惩罚师生差异的损失。势函数越高阶越能刻画高层结构，但计算也越贵。论文给出两个简单有效的势函数：成对关系的**距离势**与三元组关系的**角度势**。

### 3.2 距离势与距离损失

$$
\psi_D(t_i,t_j)=\frac1\mu\,\|t_i-t_j\|_2,\qquad
\mu=\frac{1}{|\mathcal X^2|}\sum_{(x_i,x_j)\in\mathcal X^2}\|t_i-t_j\|_2,\qquad
\mathcal L_{RKD\text{-}D}=\sum_{(x_i,x_j)\in\mathcal X^2}l_\delta\big(\psi_D(t_i,t_j),\psi_D(s_i,s_j)\big)
$$

其中：

- $\psi_D$：两个样本在表示空间里的欧氏距离；$\mu$：mini-batch 内所有样本对的**平均距离**，用来归一化，使关注点落在"相对距离"上——当师生输出维度不同导致距离尺度差异很大时，这个归一化让训练更稳定、收敛更快；
- 学生的 $\psi_D(s_i,s_j)$ 用学生自己的平均距离归一化；
- $l_\delta$：Huber 损失，$l_\delta(x,y)=\tfrac12(x-y)^2$（$|x-y|\le1$），否则 $|x-y|-\tfrac12$。

### 3.3 角度势与角度损失

$$
\psi_A(t_i,t_j,t_k)=\cos\angle t_it_jt_k=\langle e^{ij},e^{kj}\rangle,\quad
e^{ij}=\frac{t_i-t_j}{\|t_i-t_j\|_2},\ e^{kj}=\frac{t_k-t_j}{\|t_k-t_j\|_2},\quad
\mathcal L_{RKD\text{-}A}=\sum_{(x_i,x_j,x_k)\in\mathcal X^3}l_\delta\big(\psi_A(t_i,t_j,t_k),\psi_A(s_i,s_j,s_k)\big)
$$

其中：$e^{ij}$、$e^{kj}$ 是以 $t_j$ 为顶点的两条单位方向向量，$\psi_A$ 是它们夹角的余弦；角度是比距离更高阶的性质，给了 Student 更大的自由度，论文观察到角度损失常带来更快的收敛与更好的性能。

### 3.4 训练与使用

总目标为 $\mathcal L_{task}+\lambda_{KD}\,\mathcal L_{KD}$，其中 $\mathcal L_{task}$ 是任务损失（如分类交叉熵），$\lambda_{KD}$ 是平衡系数；多个蒸馏损失时各自带系数。采样上直接用 mini-batch 内**所有**可能的对/三元组。由于 RKD 不传递单个输出的绝对值，**不适合单独用于输出值本身至关重要的层**（如分类 softmax 层），需要与个体蒸馏损失或任务损失一起使用。论文在度量学习、分类与少样本学习上验证（RKD-D、RKD-A、两者同用称 RKD-DA）。

## 4. SP：相似性保持

SP 的出发点：语义相似的输入在训练好的网络里会引出相似的激活模式。对 mini-batch 的 $b$ 个样本，取某层激活 $A\in\mathbb R^{b\times c\times h\times w}$，展平为 $Q\in\mathbb R^{b\times chw}$，构造 $b\times b$ 的相似度矩阵并逐行 $L_2$ 归一化：

$$
\tilde G=Q\,Q^{\top},\qquad G[i,:]=\frac{\tilde G[i,:]}{\|\tilde G[i,:]\|_2},\qquad
\mathcal L_{SP}=\frac1{b^2}\sum_{(l,l')\in\mathcal I}\big\|G_T^{(l)}-G_S^{(l')}\big\|_F^2
$$

其中：

- $\tilde G_{ij}$：该层第 $i$ 个与第 $j$ 个样本的激活相似度；$G$：逐行归一化之后的矩阵；$G_T^{(l)}$、$G_S^{(l')}$ 分别是 Teacher 第 $l$ 层、Student 第 $l'$ 层的 $G$；
- $\mathcal I$：参与蒸馏的层对（例如同一 block 末尾的层）；$\|\cdot\|_F$：Frobenius 范数。该式是对各层对 $G$ 矩阵逐元素均方差的求和；
- 总损失 $\mathcal L=\mathcal L_{CE}(y,\sigma(z_S))+\gamma\,\mathcal L_{SP}$，$\gamma$ 为权重；
- 因为 $G$ 是 $b\times b$ 的，与通道数 $c$ 无关，师生通道不同也不需要适配层。

## 5. PKT：概率知识迁移

PKT 不匹配特征本身，而是匹配**数据在特征空间里的概率分布**。用核函数把样本间相似度变成条件概率（类似 t-SNE）：

$$
p_{i|j}=\frac{K(x_i,x_j;2\sigma_t^2)}{\sum_{k\ne j}K(x_k,x_j;2\sigma_t^2)},\qquad
q_{i|j}=\frac{K(y_i,y_j;2\sigma_s^2)}{\sum_{k\ne j}K(y_k,y_j;2\sigma_s^2)},\qquad
\mathcal L_{PKT}=\sum_{i=1}^{N}\sum_{j\ne i}p_{j|i}\log\frac{p_{j|i}}{q_{j|i}}
$$

其中：

- $x_i$、$y_i$：Teacher、Student 对第 $i$ 个样本的特征；$K$：核函数；$p_{i|j}$、$q_{i|j}$：Teacher、Student 的条件概率，满足取值在 $[0,1]$ 且对 $i$ 求和为 1；
- 论文没有用高斯核（带宽 $\sigma$ 难调），而是采用**余弦相似度核**：$K_{cos}(a,b)=\tfrac12\big(\tfrac{a^\top b}{\|a\|_2\|b\|_2}+1\big)\in[0,1]$，几乎不需要领域相关的调参；
- 损失用 KL 散度。KL 不对称，会更重视邻近点对的匹配，即**保持局部邻域几何比重建整个特征空间的全局几何更重要**，给小 Student 更大的灵活性；若需兼顾全局，可改用对称的二次散度；
- 由于是匹配分布而非表示，PKT 能用于更广泛的表示学习任务，论文还展示了从手工特征提取器、以及从文本模态到视觉模态的跨模态迁移。

## 6. CC：相关一致性

CC（CCKD）指出多数蒸馏只要求**实例级一致**，忽略了实例之间的相关性。它同时要求实例一致和**相关一致**：

$$
\mathcal L=\mathcal L_{CE}+\alpha\,\mathcal L_{KD}+\beta\,\mathcal L_{CC},\qquad
\mathcal L_{CC}=\frac{1}{b^2}\big\|\,\Psi(F_T)-\Psi(F_S)\,\big\|_2^2
$$

其中：

- $F_T$、$F_S$：mini-batch 内 Teacher、Student 的嵌入（共享的嵌入维度）；$\Psi(F)\in\mathbb R^{b\times b}$：批内实例相关矩阵，元素 $[\Psi(F)]_{ij}$ 是第 $i$、$j$ 个嵌入的相关性；
- $\alpha$、$\beta$：权重（论文主实验中 $\beta=0.003$）。上式的归一化与具体系数写法为一般形式 `[待核实]`；
- 相关性用核函数衡量，论文比较了 MMD、双线性池化 $k(x,y)=x\cdot y$ 和 **高斯 RBF 核**；高斯 RBF 能表达更复杂的非线性关系，并用 $P$ 阶**泰勒级数**展开近似（主实验 $P=2$），单个 batch 的计算量为 $O(Pbd^2)$、额外空间 $O(b^2+d^2)$，相对训练整个网络可以忽略；
- **小批量采样策略**：随机采样会让 batch 内样本几乎全来自不同类别，对类内相关的梯度估计有偏。论文提出类均匀随机采样（CUR-sampler，如每批 6 类、每类 $k$ 个样本）与超类均匀采样（SUR-sampler，用 Teacher 特征的 K-means 聚类得到超类），主实验用 CUR 且 $k=4$；
- 要求师生嵌入维度相同；分类任务上给师生各加一个同维度的全连接层（实验中为 128 维）形成共享嵌入空间；
- 论文在 CIFAR-100、ImageNet-1K 以及度量学习（ReID、人脸识别）上超过原始 KD。

## 7. 对比汇总

| 方法 | 关系的阶数 | 度量 | 对维度不匹配的处理 |
|---|---|---|---|
| RKD | 2 阶（距离）+ 3 阶（角度） | 平均距离归一化的欧氏距离；夹角余弦；Huber 损失 | 无需对齐，关系势与维度无关 |
| SP | 2 阶（批内两两相似度） | 逐行归一化 Gram 矩阵的 Frobenius 距离 | $b\times b$ 矩阵，与通道数无关 |
| PKT | 2 阶（条件概率） | 余弦核概率 + KL | 与维度无关，只要求相似度可算 |
| CC | 2 阶（核相关矩阵） | 高斯 RBF（泰勒展开）+ 均方差 | 要求嵌入维度相同，需加全连接层 |

表中：

- 第一列是方法，第二列是它刻画的关系阶数（2 阶指样本对，3 阶指样本三元组），第三列是用来度量关系及其差异的方式，第四列是师生维度不一致时的处理；
- 它们的共同点是：关系都在 mini-batch 内计算，代价随 batch 大小平方增长，因而 batch 不宜过大 `[解读]`；
- 差别主要在"关系怎么定义"：RKD 用几何量，SP 用激活相似度，PKT 用概率，CC 用核相关。

## 8. 总结 [解读]

- 关系蒸馏对 Teacher/Student 的结构差异最宽容，特别适合度量学习、检索、表示学习等"输出不是类别概率"的任务；
- 它通常不单独使用，而是与响应蒸馏或任务损失叠加（RKD 论文就明确指出了这一点）；
- 另一个"表示间关系"的方向是 CRD 的对比目标，见 [特征蒸馏](/0690_MO_KD_Feature)。

## Reference

- Park W, Kim D, Lu Y, Cho M `[后两位作者待核实]`. Relational Knowledge Distillation. CVPR 2019. arXiv:1904.05068
- Tung F, Mori G. Similarity-Preserving Knowledge Distillation. ICCV 2019. arXiv:1907.09682
- Passalis N, Tefas A. Learning Deep Representations with Probabilistic Knowledge Transfer. ECCV 2018. arXiv:1803.10837
- Peng B, Jin X, Liu J, Zhou S, Wu Y 等. Correlation Congruence for Knowledge Distillation. ICCV 2019. arXiv:1904.01802


