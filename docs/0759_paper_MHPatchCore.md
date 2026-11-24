---
Title | paper MHPatchCore
-- | --
Created @ | `2026-11-24T08:14:59Z`
Updated @| `2026-11-24T09:21:07Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/759)

---
# MHPatchCore 马氏距离 PatchCore

- **MH-PatchCore**：Mahalanobis PatchCore: Covariance-Aware and Streaming-Compatible Industrial Anomaly Detection，论文 [arXiv 2605.27748](https://arxiv.org/abs/2605.27748)（Niccolò Ferrari、Oligert Osmani、Evelina Lamma；预印本），[参考实现](https://github.com/NickF93/MH-PatchCore)（MIT 许可）
- 类型：Segmentation，**单类**（one-class）异常检测
- 动机：工业异常检测通常是单类设置：正常图像很多，缺陷罕见、形态各异、设计系统时往往拿不到。[PatchCore](/0535_paper_PatchCore) 式的检索适合这种设置，但有**两个局限**：①**几何上**：标准的**欧氏距离**忽略了特征之间的相关性；②**计算上**：离线构建记忆库要先把**完整的 Patch 池**全部物化再子采样，训练期的峰值内存随提取的 Patch 数增长，而不是随最终支撑集大小增长
- 核心思想：MH-PatchCore 是 PatchCore 的**协方差感知、可流式**的扩展：在降维后的特征空间估计一个**正则化的协方差模型**并对嵌入做**白化**，这样变换后的**欧氏最近邻**检索就等价于**马氏检索**；再用一条**有界内存、可重复遍历**的训练流水线，借助增量降维、在线协方差估计和流式聚合，不必一次存下所有正常 Patch 就能建出记忆库
- 论文结果：在公开的 15 类工业基准（MVTec AD）上保留了大部分离线 PatchCore 的图像级性能，同时把**峰值内存从 5.41 GB 降到 2.78 GB**；在选取的三个工业数据集（泡罩封口条安瓿弯月面检测、琥珀玻璃安瓿底部检测、冻干饼小瓶检测）上，平均图像级 AUROC 从 0.981 提高到 **0.986**

## 问题设定与 PatchCore 的形式化

单类设置下，训练集 $\mathcal{D}_{train} = \{x_i\}_{i=1}^{N}$ 只含正常图像；测试时检测器给每张图一个实数分数 $s: \mathcal{X} \to \mathbb{R}$，值越大说明越偏离正常类。冻结的特征提取器加上 Patch 构造算子，把每张图映射为一组 Patch 描述符 $\mathcal{P}(x) = \{u^{(j)}\}_{j=1}^{n_x}$（$u^{(j)} \in \mathbb{R}^{d_0}$），所有正常训练 Patch 构成池 $\mathcal{U} = \bigcup_{x \in \mathcal{D}_{train}}\mathcal{P}(x)$。

PatchCore 用记忆库 $\mathcal{M} \subseteq \mathcal{U}$ 表示正常性，经典形式是保留比例为 $\eta$ 的**贪心 coreset 子采样**，每个查询 Patch 用到记忆库的欧氏最近邻（平方距离）打分：

$$
\mathcal{M} = \text{GreedyCoreset}(\mathcal{U}, \eta),\ \eta \in (0, 1], \qquad a(u) = \min_{m \in \mathcal{M}}\lVert u - m \rVert_2^2
$$

其中 $\eta$ 是保留的比例，$a(u)$ 是 Patch $u$ 的异常分数。论文使用「平方距离」的约定（与未平方只差一个单调变换，不改变最近邻，但固定了下游评分的尺度，并与 FAISS 的 $\ell_2$ 检索返回平方距离一致）。

## 协方差感知检索

MH-PatchCore 沿两个耦合的方向修改 PatchCore：检索使用的**几何**和构建记忆库的**流程**。首先把每个 Patch 描述符映射到降维后的坐标系，实验中用 PCA / 增量 PCA（IPCA）：

$$
\tilde{u} = R(u) = W^\top (u - \bar{u}_R), \qquad R: \mathbb{R}^{d_0} \to \mathbb{R}^{k}
$$

其中 $W \in \mathbb{R}^{d_0 \times k}$ 是学到的投影矩阵，$\bar{u}_R$ 是降维器的均值。在降维空间里工作有两个目的：抑制估计协方差之前的冗余，使全局二阶建模在数值上可行。设降维后正常 Patch 的均值和经验协方差为 $\hat{\mu}$ 和 $\hat{\Sigma}$；流式设置下，这些统计量用**数值稳定的矩更新**从 mini-batch 累积：

$$
\delta = \hat{\mu}_b - \hat{\mu}, \quad \hat{\mu} \leftarrow \hat{\mu} + \frac{n_b}{n + n_b}\delta, \quad M_2 \leftarrow M_2 + M_{2,b} + \frac{n\, n_b}{n + n_b}\delta\delta^\top, \quad n \leftarrow n + n_b, \quad \hat{\Sigma} = \frac{M_2}{n - 1}
$$

其中：$(n, \hat{\mu}, M_2)$ 是当前状态（样本数、均值、中心化二阶矩累积），$(n_b, \hat{\mu}_b, M_{2,b})$ 是当前 mini-batch 的摘要；$\delta$ 是两个均值之差；这是合并均值和二阶矩的标准在线更新，所以不必一次性存下所有 Patch 就能得到精确的均值和协方差。

得到的协方差再被**正则化**成对称正定矩阵 $\Sigma_{reg}$（标准基线用向缩放单位阵的**收缩 (shrinkage)**、可选的特征值下限，以及稳定的 Cholesky 分解；数值细节在论文附录 C）。记 $\delta$ 为自适应 Cholesky 抖动，**白化后的嵌入**为：

$$
\Sigma_L = \Sigma_{reg} + \delta I = L L^\top, \qquad z(u) = L^{-1}\big(R(u) - \hat{\mu}\big), \qquad \lVert z(u) - z(v) \rVert_2^2 = (\tilde{u} - \tilde{v})^\top \Sigma_L^{-1} (\tilde{u} - \tilde{v})
$$

其中：$L$ 是 $\Sigma_L$ 的 Cholesky 下三角因子；$z(u)$ 是白化嵌入，白化后协方差近似单位阵；最后一个等式（论文引理 B.1）说明：**白化空间里的欧氏距离**等于降维坐标里在有效协方差 $\Sigma_L$ 下的**马氏距离**。这是 MH-PatchCore 的核心几何步骤：保留 PatchCore 现成的欧氏最近邻检索结构（如 FAISS），只在检索前做一次线性变换。

## 流式记忆库构建

不是先把整个 Patch 池物化再压缩，而是直接在变换后的空间里找一个**有界**的支撑集。设白化后的正常 Patch 流为 $Z = \{z_n\}_{n=1}^{N_Z}$，目标是大小至多为 $K$、能保持对 $Z$ 覆盖的记忆库 $\mathcal{M}$。**合并-归约 (merge-reduce)** 构造器用确定性的**最远点优先**覆盖步骤，作为经典 $k$-center 目标的贪心近似：

$$
z^\star \in \underset{z \in Z}{\arg\max}\ \min_{c \in C_\ell}\lVert z - c \rVert_2, \qquad C_{\ell+1} = C_\ell \cup \{z^\star\}
$$

其中 $C_\ell$ 是当前已选的 $\ell$ 个中心；每步选出离已选中心最远的点加入，直到达到预算 $K$。训练整体表示为映射 $\mathcal{D}_{train} \mapsto (R, \hat{\mu}, L, \mathcal{M})$。

标准基线中，构造器 $\mathcal{G}$ 的实现是 merge-reduce 的 $k$-center 策略：局部 chunk 用最远点代表来概括，这些摘要被递归地合并再归约，**从不需要在内存里存下完整的 $Z$**；得到的记忆库里是**代表点而不是质心**，这是基于检索的推理所需要的对象。论文强调这是一个**有界内存的训练流程**，不是部署后的在线自适应规则，目的是在完整正常 Patch 集大到不方便放入 RAM 时，仍能构建 PatchCore 式记忆库。

因此拟合需要对正常训练集做**三次有序遍历**（第 1 遍拟合 PCA 投影；第 2 遍估计并分解收缩协方差；第 3 遍白化并构建记忆库），这也是 anomalib 里「三次遍历」的来源。

### GeoReS（双遍消融）

论文还评估一个更强但不再严格流式的消融 **GeoReS（Geometric Residual Selection，几何残差选择）**：给构造器**多一次遍历**。第一遍用 $P = \mathcal{G}_K(Z)$ 建出临时覆盖集，对每个正常 Patch $z$ 计算它相对临时记忆库的残差 $r_P(z) = \min_{p \in P}\lVert z - p \rVert_2$；残差大的 Patch 对应覆盖得不好的正常区域，再据此补充选择。它不改变评分规则或马氏几何，只是问「覆盖集在先估计出临时库留下的几何残差后，能否更好」。

## 推理与评分

测试时对每个 Patch 做降维和白化 $z(u) = L^{-1}(R(u) - \hat{\mu})$，计算到记忆库的平方距离，取最小作为 Patch 分数，再得到图像分数：

$$
\delta(u, m) = \lVert z(u) - m \rVert_2^2,\quad a(u) = \min_{m \in \mathcal{M}}\delta(u, m), \qquad s_{\max}(x) = \max_{u \in \mathcal{P}(x)} a(u)
$$

标准的 MH-PatchCore 在这些平方距离上使用 **PatchCore 式的重加权**（见 [PatchCore](/0535_paper_PatchCore)）：取分数最大的 Patch $u^*$ 及其最近邻 $m^*$，用 $m^*$ 在记忆库里的 $b$ 个最近邻 $\mathcal{N}_b(m^*)$（含 $m^*$ 自己）对分数做重加权，用来降低罕见但正常的 Patch 造成的误报。上式的 $s_{\max}$ 是未重加权的对照版本。

## 实验设置与结果

Name | 设置
-- | --
默认特征提取器 | anomalib 里是 `timm` 的 `wide_resnet50_2.tv2_in1k`，取 `layer2`、`layer3`，权重对应 torchvision 的 `IMAGENET1K_V2`（`wide_resnet50_2-9ba9bcbe.pth`）
输入 | 缩放到 256×256，中心裁剪 224×224，ImageNet 统计量归一化
数据集 | MVTec AD（15 类，公开）；三个工业数据集（泡罩封口条安瓿弯月面 meniscus、琥珀玻璃安瓿底部 bottom、冻干饼小瓶 lyo；因商业非公开协议无法公开）
指标 | 图像级 AUROC；MVTec AD 另有像素级 AUROC；另外统计资源占用（内存、运行时间）

表中是实验设置；论文还设了「工业数据集内存匹配子集」的对照实验，保证比较公平。

- **MVTec AD**（论文 5.1）：离线 PatchCore 在平均分数上仍是最强的图像级检测器，但与 Streaming MH-PatchCore 的差距很小：平均图像 AUROC **0.991 → 0.989**；而**欧氏流式对照**明显更差（平均 0.979，尤其是 screw 类，AUROC 掉到 0.836）。所以马氏白化把流式欧氏对照的 0.979 提高到 0.989，**弥补了与离线 PatchCore 之间大部分图像级差距**；像素级 AUROC 平均从 0.965 提高到 0.978，仍略低于离线参考的 0.980，所以在公开基准上协方差感知检索**主要改善图像级判别**，定位只是「完整性」结果而非核心声明
- **工业数据集**：马氏检索把欧氏流式对照的平均 AUROC 从 **0.981 提高到 0.986**；GeoReS（$K = 2000$）的消融进一步把平均 AUROC 提高到 **0.991**，高预算 $K = 5000$ 配置达到 **0.994**。三个数据集覆盖了不同但同样有挑战的检测场景：meniscus 有因湍流、反光和局部外观变化导致的可变弯月面与液体图案；bottom 是琥珀玻璃安瓿底部区域含粘稠液体、重玻璃颗粒难与正常外观区分；lyo 是冻干饼产品检测，相关异常包括可见异物、缺饼、饼体积不对
- **资源**：论文报告在 MVTec AD 上峰值内存从 **5.41 GB 降到 2.78 GB**

## 何时马氏距离有帮助

马氏白化变换在以下情况最有用：降维空间里的欧氏距离对某些方向**权重过大或过小**，因为正常 Patch 嵌入是**各向异性且相关**的。论文指出这个解释被结果支持，但范围也要界定清楚：在公开 MVTec AD 上，它主要改善图像级判别；在选取的工业任务上，这种效应更强；GeoReS 带来的「残差尾部覆盖」进一步帮助这些困难场景。

## 特点与局限

- **优点**：考虑特征相关性的马氏距离比欧氏更合理；仍使用现成的最近邻检索（白化后欧氏即马氏）；记忆库有界、训练**内存有界**（5.41 GB → 2.78 GB）；在 MVTec AD 上保留了接近离线 PatchCore 的图像级性能，在工业数据上超过欧氏流式对照
- **局限**（论文 6.4 节）：①没有「部署后完全自主的持续学习」协议：部署后若更新降维或 Cholesky 因子，就需要重建记忆库，或对其中保存的参考做一致的变换，使所有参考仍处于同一特征空间；②流式变体**假设训练集至少可以被遍历三次**，严格单遍的场景里不一定可行；③只有 MVTec AD 提供像素级掩码，所以定位评估只能在这个公开基准上做，工业数据集只做图像级评估和资源统计；④由于分阶段降维和 merge-reduce 构建支撑库没有在完整 Patch 池上做一次全局批处理优化，流式变体在**某些类别上的精度可能落后于**原始的批处理 PatchCore（论文 5.4 节讨论这一权衡）

## anomalib 实现

anomalib 的 MH-PatchCore 使用标准的模型、数据、后处理、评估、可视化、checkpoint 和导出接口；上面的「三次遍历」就是其 `fit` 阶段的流程；README 没有给出 benchmark 数值。指标含义见 [Anomaly Detection Metrics](/0711_ML_Metrics_Anomaly)。

## Reference
- [Mahalanobis PatchCore: Covariance-Aware and Streaming-Compatible Industrial Anomaly Detection](https://arxiv.org/abs/2605.27748)
- [reference implementation](https://github.com/NickF93/MH-PatchCore)
- [anomalib - MHPatchcore](https://github.com/openvinotoolkit/anomalib/tree/main/src/anomalib/models/image/mh_patchcore)

