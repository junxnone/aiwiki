---
Title | ML Tasks TimeSeries ML
-- | --
Created @ | `2026-11-10T09:17:22Z`
Updated @| `2026-11-10T09:17:22Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/605)

---
# 机器学习时间序列模型：方法详解、原理与发展脉络

> 读者：想弄清"把时序变成监督学习"这条路线怎么做、为什么有效、什么时候不行、与统计模型和深度模型怎么分工的工程师和研究者。
>
> 配套文档：[总览](0603_ML_Tasks_TimeSeries)｜[经典统计模型](0604_ML_Tasks_TimeSeries_Classical)｜[评估指标](0610_ML_Tasks_TimeSeries_Metrics)｜[深度学习](0606_ML_Tasks_TimeSeries_Deep)｜[生成式](0607_ML_Tasks_TimeSeries_Generative)｜[基础模型](0608_ML_Tasks_TimeSeries_Foundation)｜[时间线](0611_ML_Tasks_TimeSeries_Timeline)。
>
> 公式用 LaTeX 书写，需要支持数学渲染的 Markdown 查看器。
>
> 标注：**[V]** 书目信息经 Crossref 或 arXiv API 核对（标题、作者、年份、期刊与 DOI 或编号；其中 arXiv 条目另读过摘要页，论述与摘要一致，不含全文核对）；**[经验]** 编者判断，需用自己的数据验证；**待核实** 凭记忆写出或书目核对不完全。方法的数学形式是标准内容，由编者归纳整理。本文不引用任何模型在具体基准上的得分，例子中的数字是为说明概念构造的。核对日期：2026-11-10。

## 0. 先看全景

机器学习路线的共同做法是：**把"预测下一段序列"改写成一个监督学习问题**，然后用通用的表格学习器去解。它与经典统计模型的区别不在"用不用似然"，而在**不假设序列由某个特定随机过程生成**，把结构交给特征和学习器。

| 任务 | 机器学习的做法 | 代表方法 | 本文章节 |
|---|---|---|---|
| 预测（点） | 滞后值、滚动统计、日历、协变量作特征，回归到未来值 | GBDT（XGBoost、LightGBM）、随机森林、岭回归、SVR、kNN | §3.1–§3.2 |
| 预测（概率） | 分位数损失、参数化分布的提升、共形校准 | 分位数 GBDT、NGBoost、Tweedie 目标 | §3.3 |
| 分类 | 距离、区间、字典、卷积核等多种"变换"后接简单分类器 | kNN-DTW、ROCKET 系、HIVE-COTE 2.0 | §3.4 |
| 特征提取 | 大规模计算统计特征，再筛选 | tsfresh、catch22 | §3.5 |
| 异常检测 | 滑窗后用通用异常检测器；或基于子序列相似度 | Isolation Forest、One-Class SVM、LOF、Matrix Profile | §3.6 |

一句话定位：**机器学习路线是"带协变量的、跨序列共享参数的、不需要手工建模型结构"的预测方式**。它在序列条数多、协变量丰富的业务场景里（零售销量、需求预测）长期是主力；在分类上，以随机卷积核为代表的方法给出了很强且极快的基线。

读完本文你应能回答：滑窗怎么构造、多步预测有哪几种策略；为什么树模型不会外推趋势；全局模型为什么能借用其他序列的信息；分类里 ROCKET 为什么既快又准；异常检测里"简单方法不输深度模型"的证据是什么。

---

## 1. 基石概念

### 1.1 把时序变成监督学习：滑窗

设回看长度 $L$、协变量 $\mathbf z_t$。在每个预测起点 $t$ 构造一个训练样本：

$$\mathbf x_t=\bigl[\,y_t,\,y_{t-1},\dots,y_{t-L+1},\ \mathbf z_{t+1},\dots,\mathbf z_{t+H},\ \mathbf s\,\bigr],\qquad \text{标签 } y_{t+h}\ (h=1,\dots,H)$$

其中 $\mathbf s$ 是静态特征（序列 ID 编码、品类、地点），$\mathbf z_{t+1:t+H}$ 是**已知未来协变量**（节假日、计划促销、价格），这是机器学习路线相对经典模型的主要优势之一（经典模型的协变量支持见[经典篇 §3.4](0604_ML_Tasks_TimeSeries_Classical)）。

**训练样本数**：一条长为 $T$ 的序列可产生约 $T-L-H+1$ 个样本，$N$ 条序列合在一起训练，就是**全局模型**（§1.5）。

### 1.2 多步预测的四种策略

策略比较见 Ben Taieb et al. 2012, *Expert Systems with Applications* [V]。

| 策略 | 做法 | 公式 |
|---|---|---|
| **递归（recursive）** | 训练一个一步预测模型，把预测值喂回去滚动 | $\hat y_{t+h}=f\bigl(\hat y_{t+h-1},\dots,\hat y_{t+h-L},\mathbf z\bigr)$ |
| **直接（direct）** | 每个步长 $h$ 单独训练一个模型 | $\hat y_{t+h}=f_h\bigl(y_t,\dots,y_{t-L+1},\mathbf z\bigr)$ |
| **多输出（MIMO）** | 一个模型一次输出整个向量 | $[\hat y_{t+1},\dots,\hat y_{t+H}]=F(\mathbf x_t)$ |
| **混合（DirRec 等）** | 每个 $h$ 一个模型，且把前面步长的预测作为输入 | 见原文 |

| 策略 | 优点 | 缺点 |
|---|---|---|
| 递归 | 只训一个模型；对任意 $H$ 通用 | 误差随步长**累积**；一步最优不等于多步最优 |
| 直接 | 无误差累积，每个步长直接优化 | 要训 $H$ 个模型；各步长之间预测不保证一致 |
| MIMO | 保留步长间的依赖，一个模型 | 需要支持多输出的学习器；GBDT 不原生支持，需包装 |

[经验] 用 GBDT 做业务预测，**直接策略**（每个 $h$ 一个模型，或把 $h$ 作为一个特征）是常见做法；递归策略在 $H$ 很长时误差累积明显。深度模型天然是 MIMO。

### 1.3 特征工程：把"时间结构"写成列

| 特征类型 | 例子 | 作用 |
|---|---|---|
| 滞后值 | $y_{t-1},y_{t-7},y_{t-364}$ | 捕捉自相关与季节 |
| 滚动统计 | 过去 7/28 天均值、标准差、最小/最大、分位数 | 水平与波动 |
| 差分与比率 | $y_t-y_{t-1}$、$y_t/\bar y_{t-28:t}$ | 去趋势、尺度归一 |
| 日历 | 星期、月、节假日、距节假日天数 | 周期与事件 |
| 傅里叶项 | $\sin\frac{2\pi kt}{P},\cos\frac{2\pi kt}{P}$ | 平滑的周期表示（与[经典篇 §3.11](0604_ML_Tasks_TimeSeries_Classical)同源） |
| 协变量 | 价格、促销、天气、库存 | 外生驱动 |
| 静态 / 编码 | 门店、SKU、品类（类别编码） | 区分个体，借用同类信息 |

**为什么要把目标做变换**：树模型的预测是叶子上训练目标的平均，**不会超出训练集目标的取值范围**（§1.6），所以直接对水平值回归的树模型无法外推趋势。常见处理有三种：对目标做差分 $\Delta y_t$、除以近期均值得到相对量 $y_t/\bar y_{t-L:t-1}$、或先用统计模型去趋势再让树拟合残差 [经验]。

### 1.4 时序交叉验证与泄漏

按时间顺序切分，不可随机打乱。**滚动起点评估**（rolling origin）：多次移动切分点，每次用起点之前的数据训练，对后面的窗口预测，再平均。时序交叉验证的有效性讨论见 Bergmeir & Benítez 2012, *Information Sciences* [V] 与 Bergmeir et al. 2018, *CSDA* [V]；评估指标与陷阱见 [metrics 文档](0610_ML_Tasks_TimeSeries_Metrics)。

机器学习路线特有的泄漏风险：

- **未来信息混入特征**：滚动统计窗口包含了预测起点之后的值；
- **目标编码泄漏**：用全量数据计算的类别均值；
- **标准化/归一化统计量用了测试期**；
- **滞后特征与步长不匹配**：预测 $h=7$ 时若特征使用了 $y_{t+3}$，等于偷看未来。

### 1.5 局部模型与全局模型

- **局部模型**：一条序列一套参数（经典方法）。
- **全局模型**：$N$ 条序列合在一起，用一套参数拟合，用静态特征与协变量区分个体。

全局模型能借用跨序列的共性（同类商品的季节形状、新品的爬坡规律），对**短序列与冷启动序列**友好；代价是需要对尺度差异做处理（日销 5 件与 5000 件的序列放在同一个损失里，大序列会主导），常用做法是按序列的近期均值归一化目标 [经验]。

### 1.6 为什么树模型不会外推

决策树把特征空间切成若干区域，每个区域预测一个常数（训练目标的平均）：

$$\hat y(\mathbf x)=\sum_{j=1}^{J}w_j\,\mathbf 1\{\mathbf x\in R_j\}$$

集成（随机森林、GBDT）是这些分段常数函数的平均或加权和，仍是分段常数函数，其取值**不超过训练目标的范围**（对 GBDT 严格而言，在步长 $\eta$ 与损失下取值有界性取决于具体设置，常见经验结论是它不能像线性模型那样外推趋势 [经验]）。含义：

- 序列有持续上升的趋势、测试期水平高于训练期时，**直接回归水平值会系统性低估**；
- 解决办法见 §1.3 的目标变换，或与线性项、统计模型结合。

这也是"表格数据上树模型常优于神经网络"一类结论的背景之一：Grinsztajn et al. 2022（*Why do tree-based models still outperform deep learning on tabular data?*，[arXiv:2207.08815](https://arxiv.org/abs/2207.08815)）[V] 在 45 个表格数据集上报告，树模型在中等规模（约 1 万样本）数据上仍是最强，并分析了其归纳偏置（对无信息特征稳健、保持数据朝向、易学习不规则函数）。该文针对一般表格数据，不是时序专用结论，但对滑窗后的特征表同样有参考意义 [经验]。

### 1.7 损失函数

| 目标 | 损失 | 说明 |
|---|---|---|
| 条件均值 | MSE | 对大误差敏感 |
| 条件中位数 | MAE / Huber | 对离群点稳健 |
| 分位数 | pinball（见 [metrics §2.1](0610_ML_Tasks_TimeSeries_Metrics)） | 概率预测的基础 |
| 计数、间歇需求 | Poisson / Tweedie / 负二项 | 非负、有大量零值；M5 的不确定性赛道分析指出，直接用平方损失的 GBM 难以处理数据的过度离散与零需求（arXiv:2107.06675 [V]） |
| 业务指标 | 自定义（如 WRMSSE 的加权形式） | 训练目标尽量对齐评估指标 |

---

## 2. 发展脉络

年份与出处凡标 [V] 者书目信息已核对；其余待核实。

| 时代 | 事件 | 要点 |
|---|---|---|
| 1990 年代–2000 年代 | 早期神经网络、SVR、kNN 等用于时序预测（具体文献待核实） | 在统计方法主导的年代，机器学习方法多处于探索阶段 |
| 2001 | Friedman 的梯度提升机 [V]；Breiman 的随机森林 [V] | 现代表格学习器的基础 |
| 2008 | Isolation Forest（Liu et al., ICDM）[V] | 树结构用于异常检测 |
| 2012 | Ben Taieb et al. 多步预测策略的系统比较 [V] | 递归、直接、MIMO 等策略的实证框架 |
| 2016 | XGBoost（arXiv:1603.02754）[V]；Matrix Profile（Yeh et al., ICDM）[V] | 可扩展的提升树；子序列相似度的统一工具 |
| 2017 | LightGBM（NIPS 2017，Crossref 命中为 CRAN 包条目，原论文待核实）；The Great Time Series Classification Bake Off（arXiv:1602.01711）[V] | 更快的 GBDT；分类算法大规模对比与分类体系 |
| 2018 | tsfresh（Christ et al., *Neurocomputing*）[V]；Makridakis et al., *PLOS ONE*（统计与 ML 方法的问题）[V] | 假设检验筛选的特征提取；早期实证中机器学习方法相对统计方法并无优势（结论细节待核实） |
| 2019 | ROCKET（arXiv:1910.13051，*DMKD* 2020）[V]；catch22（arXiv:1901.10200）[V]；NGBoost（arXiv:1910.03225）[V] | 随机卷积核分类；22 个典型特征；概率提升 |
| 2020–2021 | MiniRocket（arXiv:2012.08791）[V]；M5 竞赛 [V]；HIVE-COTE 2.0（arXiv:2104.07551）[V]；InceptionTime（arXiv:1909.04939）[V] | 分类上"快且准"的组合；M5 中提升树类方法表现突出（具体名次待核实） |
| 2022 | HYDRA（arXiv:2203.13652）[V]；Januschowski et al., *Forecasting with trees*（*IJF*）[V]；Audibert et al.（arXiv:2204.01637）[V] | 字典与卷积方法的融合；树模型预测的系统总结；异常检测中传统/ML/深度方法的对比 |
| 2023–2025 | Bake off redux（arXiv:2304.13029）[V]；TabPFN-TS（arXiv:2501.02945）[V] | 分类算法再评估；**表格基础模型**用于时序，连接到[基础模型篇](0608_ML_Tasks_TimeSeries_Foundation) |

---

## 3. 各类方法详解

### 3.1 梯度提升树（GBDT）预测

#### 原理

**梯度提升**（Friedman 2001 [V]）以函数空间的梯度下降逐步加树：

$$F_m(\mathbf x)=F_{m-1}(\mathbf x)+\eta\,h_m(\mathbf x),\qquad h_m\ \text{拟合伪残差}\ r_{im}=-\left.\frac{\partial L\bigl(y_i,F(\mathbf x_i)\bigr)}{\partial F(\mathbf x_i)}\right|_{F=F_{m-1}}$$

$\eta$ 为学习率，$h_m$ 是一棵小树。MSE 损失下伪残差就是普通残差，所以直觉上是"每棵新树去修正前面所有树还没拟合好的部分"。

**XGBoost**（arXiv:1603.02754 [V]）用二阶泰勒展开并加正则项：

$$\mathcal L=\sum_i l\bigl(y_i,\hat y_i\bigr)+\sum_k\Omega(f_k),\qquad \Omega(f)=\gamma\,T+\tfrac12\lambda\lVert w\rVert^2$$

给定树结构，叶子 $j$ 的最优权重与划分增益为（标准结果，$G,H$ 分别是该叶子内一阶、二阶梯度之和）：

$$w_j^{*}=-\frac{G_j}{H_j+\lambda},\qquad \text{Gain}=\frac12\Bigl[\frac{G_L^2}{H_L+\lambda}+\frac{G_R^2}{H_R+\lambda}-\frac{(G_L+G_R)^2}{H_L+H_R+\lambda}\Bigr]-\gamma$$

该文摘要强调稀疏感知算法与加权分位数草图，使系统"scales beyond billions of examples using far fewer resources than existing systems" [V]。**LightGBM** 以基于直方图的算法与 leaf-wise 生长、GOSS（单侧梯度采样）、EFB（互斥特征捆绑）等技术提速，细节待核实（本次未核对原文）。

#### 用于时序

1. 构造滑窗特征（§1.1、§1.3）；
2. 选择多步策略（§1.2）；
3. 目标变换以解决外推问题（§1.3、§1.6）；
4. 时序交叉验证调参（§1.4）；
5. 可选：分位数目标得概率预测（§3.3）。

**算例（外推失败）**：训练期销量水平在 $[80,120]$，测试期上升到 $[130,170]$。直接对水平值回归的树模型，预测被"卡"在不超过约 120 的范围内，系统性低估；改为预测 $y_t/\bar y_{t-28:t-1}$（相对近期均值的比率）后，比率始终在 1 附近，再乘回近期均值即可跟随水平上升。

#### 优缺点

| | |
|---|---|
| **优点** | 快、对异构协变量与类别特征友好；可处理缺失值；特征重要性便于诊断；CPU 即可；业务预测中长期是强基线（Januschowski et al. 2022 [V] 对树模型预测做了系统讨论） |
| **缺点** | 不外推趋势（需目标变换）；特征工程依赖人；多步预测需策略选择且各步长间不保证一致；输出默认为点预测；对结构突变与长历史依赖不如专门的序列模型 |
| **适用** | 序列条数多、协变量丰富的业务预测（零售、需求、能源节点）；需要快速上线、可解释的场景 |

### 3.2 其他通用学习器

| 方法 | 做法 | 说明 |
|---|---|---|
| **随机森林 / ExtraTrees** | 多棵树平均（Breiman 2001 [V]） | 方差小、调参少；同样不外推；多输出可原生支持（MIMO） |
| **岭回归 / LASSO** | $\min_w\lVert y-Xw\rVert^2+\lambda\lVert w\rVert^2$ | 在滞后特征上的线性回归就是**带正则的自回归**，可外推趋势；是[经典 AR 模型](0604_ML_Tasks_TimeSeries_Classical)与深度线性模型（DLinear）之间的桥梁 |
| **SVR** | $\varepsilon$-不敏感损失加核函数 | 小样本非线性回归；核与超参选择较敏感；大规模序列不友好 |
| **kNN 类比预测** | 在历史中找与当前窗口最相似的 $k$ 个窗口，用它们的后续值平均 | 直观；距离度量与窗口长度敏感；可结合 DTW |

**岭回归的作用**：线性模型的外推能力使它常被拿来与树模型**组合或做残差建模**（线性项抓趋势，树抓非线性与协变量交互）[经验]。

### 3.3 概率预测：分位数、分布参数与校准

**分位数 GBDT**：把损失换成 pinball loss（定义见 [metrics §2.1](0610_ML_Tasks_TimeSeries_Metrics)），为每个分位数水平 $\tau$ 单独训练一个模型（或把 $\tau$ 作为输入）。风险：不同分位数分别训练可能出现**分位数交叉**（$\hat q^{0.9}<\hat q^{0.5}$），需排序修正 [经验]。

**NGBoost**（arXiv:1910.03225 [V]）：把条件分布的**参数**当作目标做多参数提升，并用**自然梯度**校正训练动态；可搭配任意基学习器、连续参数的分布族与评分规则。

**Tweedie / Poisson / 负二项目标**：用于非负、有大量零值的需求数据；比对平方损失更符合数据的生成机制（M5 不确定性分析见 arXiv:2107.06675 [V]）。

**共形校准**：给任意点预测器的残差套共形外壳，得到有覆盖保证的区间，方法见[经典篇 §3.15](0604_ML_Tasks_TimeSeries_Classical)。[经验] 对 GBDT 这类不自带分布的模型，"点预测 + 共形"往往是最省事的概率化方式。

### 3.4 时间序列分类

分类是机器学习路线最成熟的子领域，公开基准为 UCR/UEA 档案（Dau et al. 2019, *IEEE/CAA J. Autom. Sinica* [V]）。算法按"从序列中提取什么特征"分类（Bake off 体系，arXiv:1602.01711 [V]；扩展见 arXiv:2304.13029 [V]）：

| 类别 | 提取的特征 | 代表 |
|---|---|---|
| 距离 | 序列间整体相似度 | kNN + DTW |
| 区间 | 若干区间上的统计量 | 区间森林 |
| 形状子（shapelet） | 能区分类别的局部子序列 | shapelet 变换 |
| 字典 | 符号化后的"词"频率 | BOSS、TDE |
| 卷积 | 卷积核响应的汇总 | ROCKET、MiniRocket、MultiRocket、HYDRA |
| 深度 | 学到的表示 | InceptionTime 等 |
| 集成 | 多类别组合 | HIVE-COTE 2.0 |

#### 动态时间规整（DTW）

对两条序列 $x_{1:n},y_{1:m}$，累积代价递推：

$$D(i,j)=d(x_i,y_j)+\min\{D(i-1,j),\ D(i,j-1),\ D(i-1,j-1)\},\qquad \mathrm{DTW}(x,y)=D(n,m)$$

允许在时间轴上弹性对齐，因此对相位偏移和速度变化稳健。朴素实现是 $O(nm)$。**kNN-DTW** 长期是分类的基准线，也是 Bake off 中的参照（待核实具体设置）。

#### ROCKET 系

**ROCKET**（arXiv:1910.13051 [V]；Dempster et al. 2020, *DMKD* [V]）用**大量随机卷积核**变换序列，对每个核的输出取两个汇总特征，再接线性分类器。设核 $w$（随机长度、权重、偏置、膨胀、填充），卷积输出 $z=x*w+b$：

$$\mathrm{PPV}=\frac1n\sum_{i=1}^{n}\mathbf 1\{z_i>0\},\qquad \max(z)$$

PPV 是"正值比例"。每个核贡献这两个特征，默认核数为 10,000 量级（待核实），特征拼接后用岭回归分类器。

- **MiniRocket**（arXiv:2012.08791 [V]）：把 ROCKET 重构为近乎确定性、更快的版本；摘要给出"在较大数据集上最多快 75 倍""在 UCR 全部 109 个数据集上训练加测试不到 10 分钟，达到最先进精度"，并建议把它作为 ROCKET 的默认变体 [V]。
- **MultiRocket**（arXiv:2102.00457 [V]）：多种池化与变换；**HYDRA**（arXiv:2203.13652 [V]）：把字典方法与随机卷积核方法联系起来，用"竞争卷积核"组合两者。

#### HIVE-COTE 2.0

HIVE-COTE 是分层投票的**异构集成**，成员来自不同的表示域。HIVE-COTE 2.0（arXiv:2104.07551 [V]）引入时间字典集成（TDE）、DrCIF（多样表示的区间森林）与 Arsenal（ROCKET 集成），摘要报告其在 112 个数据集上显著优于此前的最先进。**InceptionTime**（arXiv:1909.04939 [V]）是深度学习路线的代表，摘要称其精度与 HIVE-COTE 相当而可扩展性强得多（HIVE-COTE 的训练复杂度为 $O(N^2T^4)$）。

#### 优缺点

| | |
|---|---|
| **优点** | ROCKET 系训练极快、精度强、几乎不需调参，是分类的首选基线；对多种序列形态通用；可在边缘设备部署 [经验] |
| **缺点** | 随机特征可解释性弱；对**极长序列、变长序列、多变量依赖**的处理需要看具体变体；基准（UCR）上的排名不等于你的工业数据上的排名 |
| **适用** | 振动、心电、传感器波形等定长窗口的分类；样本数较小而不想训练深度模型的场合 |

**数据泄漏提醒**：同一设备或同一病人的窗口同时出现在训练与测试集，会让分类指标虚高；应按**个体**划分（见 [metrics §4.1](0610_ML_Tasks_TimeSeries_Metrics)）。

### 3.5 特征式方法：tsfresh 与 catch22

- **tsfresh**（Christ et al. 2018, *Neurocomputing* [V]；arXiv:1610.07717 [V]）：大规模计算序列特征（统计量、频域、自相关等），再用**基于假设检验的筛选**，并控制"被选中但无关"特征的期望比例。适合有大量序列且领域知识有限的预测性维护与质量预测场景。
- **catch22**（arXiv:1901.10200 [V]）：在 93 个分类数据集（超过 14.7 万条序列）上，从含 4791 个特征的 hctsa 过滤库里选出 **22 个**最具通用价值且冗余最小的特征，计算量大幅降低。

**用法**：特征向量接 GBDT/逻辑回归等任意学习器，得到可解释、快速的基线。[经验] 在小样本、需要向领域专家解释"哪类特征起作用"的场合，特征式方法的可沟通性比 ROCKET 更好。

### 3.6 异常检测

#### 基本流程

对序列做滑窗得到窗口向量，再套用通用异常检测器；或者基于子序列相似度直接定义异常。

| 方法 | 原理 | 公式 / 要点 |
|---|---|---|
| **Isolation Forest**（Liu et al. 2008 [V]） | 随机划分特征空间，异常点更容易被"孤立"（路径更短） | $s(\mathbf x,n)=2^{-E[h(\mathbf x)]/c(n)}$，$c(n)=2H(n-1)-\frac{2(n-1)}{n}$（$H$ 为调和数）；$s$ 接近 1 为异常 |
| **One-Class SVM**（Schölkopf et al. 2001 [V]） | 估计一个包住大部分正常数据的区域 | $\min\frac12\lVert w\rVert^2+\frac{1}{\nu n}\sum_i\xi_i-\rho$，约束 $w\cdot\Phi(\mathbf x_i)\ge\rho-\xi_i$ |
| **LOF**（Breunig et al. 2000 [V]） | 局部密度相对其邻居更低则为异常 | $\mathrm{LOF}_k(\mathbf x)=\frac{1}{\lvert N_k\rvert}\sum_{o\in N_k}\frac{\mathrm{lrd}(o)}{\mathrm{lrd}(\mathbf x)}$ |
| **Matrix Profile**（Yeh et al. 2016 [V]） | 每个子序列与其最近的非平凡邻居的距离；该距离大的子序列是"discord"（异常） | $P_i=\min_{j\notin\mathrm{excl}(i)}d\bigl(\mathbf T_{i,m},\mathbf T_{j,m}\bigr)$，$d$ 为 z-归一化欧氏距离，$\mathrm{excl}(i)$ 是 $i$ 附近的"平凡匹配"排除区 |

#### 重要的实证结论

Audibert et al.（*Do Deep Neural Networks Contribute to Multivariate Time Series Anomaly Detection?*，arXiv:2204.01637）[V]：在 5 个真实开放数据集上比较 16 种传统、机器学习和深度神经网络方法，结论是"**no family of methods outperforms the others**"，作者呼吁在多变量异常检测基准中重新纳入三类方法。这条证据说明：**深度异常检测模型并没有稳定胜过传统与机器学习方法**，部署前先跑 Isolation Forest、Matrix Profile 一类基线是合理的 [经验]。

#### 优缺点

| | |
|---|---|
| **优点** | 无需标签；计算便宜；多数能 CPU 运行；结果相对易解释（如 Matrix Profile 直接指出"哪一段与历史任何位置都不相似"） |
| **缺点** | 窗口长度敏感；无法利用长程依赖与协变量；阈值难定；评估协议（尤其 point-adjust）问题多，见 [metrics §3](0610_ML_Tasks_TimeSeries_Metrics) |
| **适用** | 无标签的初筛；作为深度异常检测的强基线 |

---

## 4. 方法总览对比

| 方法 | 任务 | 协变量 | 多变量 | 概率输出 | 外推趋势 | 数据量要求 | 典型局限 |
|---|---|---|---|---|---|---|---|
| GBDT（XGBoost/LightGBM） | 预测 | 强 | 可（特征化） | 需分位数/分布目标 | 否（需变换） | 中到大 | 特征工程、多步策略 |
| 随机森林 / ExtraTrees | 预测 | 强 | 可 | 经分位数森林等 | 否 | 中 | 同上 |
| 岭回归 / LASSO | 预测 | 可 | 可 | 否（需另配） | 是（线性） | 小到中 | 线性 |
| SVR / kNN | 预测 | 弱 | 弱 | 否 | 否 | 小 | 规模与距离选择 |
| NGBoost / 分位数提升 | 概率预测 | 强 | 可 | 是 | 否 | 中到大 | 分布族选择、分位数交叉 |
| kNN-DTW | 分类 | 否 | 可 | 否 | — | 小 | 计算量 $O(nm)$ |
| ROCKET 系 | 分类 | 否 | 可 | 否 | — | 小到中 | 可解释性弱 |
| HIVE-COTE 2.0 | 分类 | 否 | 可 | 否 | — | 小到中 | 训练成本高 |
| tsfresh / catch22 | 特征提取 | — | 可 | — | — | 小到中 | 特征冗余/选择 |
| Isolation Forest / OCSVM / LOF | 异常检测 | 否 | 可（窗口化） | 分数 | — | 中 | 窗口长度、阈值 |
| Matrix Profile | 异常检测 / 模式发现 | 否 | 有多维变体 | 分数 | — | 中 | 子序列长度 $m$ 敏感 |

---

## 5. 发展趋势

下面各条分"事实"（基于上述已核对文献）与"判断"（编者 [经验]，需持续观察）。

### 5.1 在协变量丰富的业务预测里，树模型仍是强基线

- **事实**：Januschowski et al. 2022（*Forecasting with trees*）[V] 系统讨论了树模型在预测中的应用；M5 竞赛（Makridakis et al. 2022 [V]）中提升树类方法表现突出（具体名次与结论待核实）；Grinsztajn et al. 2022 [V] 在一般表格数据上给出树模型的优势证据。
- **判断**：只要问题能写成"特征表 + 全局模型"，GBDT 仍是最先该跑的机器学习基线；深度模型需要在**同等调参预算**下证明增益 [经验]。

### 5.2 分类：随机卷积核成为默认基线

- **事实**：ROCKET → MiniRocket → MultiRocket → HYDRA 沿着"更快、更准、与字典方法融合"演进 [V]；HIVE-COTE 2.0 在精度上保持领先 [V]；Bake off redux（2023）[V] 重新评估了新算法。
- **判断**：分类任务应先跑 MiniRocket 一类，再考虑深度模型；深度模型的价值更多体现在**大数据、多变量、需要表示迁移**的场景 [经验]。

### 5.3 概率化：从点预测到分布

- **事实**：NGBoost [V]、分位数目标、共形预测（见[经典篇 §3.15](0604_ML_Tasks_TimeSeries_Classical)）都在给树模型加不确定性。
- **判断**："点预测器 + 共形校准"会成为机器学习路线概率预测的默认方式 [经验]。

### 5.4 机器学习路线与基础模型的交汇

- **事实**：TabPFN-TS（arXiv:2501.02945）[V] 把预测当作**表格回归**，把轻量的时间特征化与预训练的表格基础模型 TabPFN-v2 结合，摘要称它无需时序专用预训练，参数量约 11M，并在带协变量的预测上取得 GIFT-Eval 与 fev-bench 上的最先进表现、在单变量预测上有竞争力。
- **判断**：这表明"特征化 + 预训练的通用学习器"是与"专门的时序基础模型"并行的另一条路线；它尤其适合**协变量重要**的场景。详见[基础模型篇](0608_ML_Tasks_TimeSeries_Foundation) [经验]。

### 5.5 异常检测：基线要充分

- **事实**：Audibert et al. [V] 的结论；深度异常检测的综述见 arXiv:2211.05244（*Deep Learning for Time Series Anomaly Detection: A Survey*）[V]；评估协议的问题见 [metrics §3.3](0610_ML_Tasks_TimeSeries_Metrics)。
- **判断**：异常检测里**评估协议常比模型本身更能决定结论**，使用统一协议、报告不依赖 point-adjust 的结果 [经验]。

---

## 6. 实践建议 [经验]

**推荐流程（预测）**

1. 先做朴素与季节朴素、ETS/ARIMA 基线（见[经典篇 §6](0604_ML_Tasks_TimeSeries_Classical)）；
2. 构造滑窗与特征：滞后、滚动统计、日历、已知未来协变量、静态编码；
3. 对目标做变换（差分或相对近期均值），避免树模型外推失败；
4. 先用 LightGBM/XGBoost 的直接策略（每个 $h$ 一个模型或把 $h$ 作特征）；
5. 用**滚动起点**评估，指标按需选 MASE / WAPE / 分位数损失；
6. 需要区间时：分位数目标或"点预测 + 共形"；
7. 只有上述在滚动评估下仍有明显差距，才投入深度模型或基础模型。

**推荐流程（分类）**：MiniRocket + 岭回归 → 若不够再试 HIVE-COTE 2.0 或 InceptionTime；按**个体**划分训练/测试。

**推荐流程（异常检测）**：滑窗 + Isolation Forest，Matrix Profile 找模式级异常；同时报告点级与事件级结果。

**常见错误**

- 滚动统计窗口包含未来；
- 用随机划分做交叉验证；
- 直接回归水平值，测试期水平超出训练范围；
- 不同尺度的序列放在同一 MSE 损失里不归一化；
- 对间歇需求用 MAPE 或平方损失；
- 把分位数模型的各分位数当作彼此一致（忽略交叉）。

**工具**（版本与接口以官方文档为准，待核实）

| 用途 | 库 |
|---|---|
| 提升树 | xgboost、lightgbm |
| 预测的特征化与全局模型封装 | sktime、darts、mlforecast |
| 分类 | aeon、sktime（含 ROCKET 系、HIVE-COTE） |
| 特征提取 | tsfresh、catch22（pycatch22） |
| 异常检测 | scikit-learn（IsolationForest、OneClassSVM、LocalOutlierFactor）、stumpy（Matrix Profile） |

---

## 7. 机器学习路线的局限

- **特征工程依赖人**：特征质量决定上限，且换场景要重做；
- **外推能力弱**（树）：需目标变换或与线性项结合；
- **多步预测需要策略取舍**，各步长间不保证一致；
- **点预测为主**：概率化需要额外目标或外壳；
- **长历史与复杂依赖**：滑窗长度有限，对超长依赖不如专门的序列模型；
- **异常检测与分类的基准不等于你的数据**：UCR、公开异常数据集的排名需在自己数据上验证。

这些局限正是深度学习、生成式与基础模型出场的空间，但并不改变"先跑机器学习基线"的建议。

---

## 来源与核对状态

**[V]：书目信息经 Crossref API 与 arXiv API 核对（2026-11-10）**。核对仅指标题、作者、年份、期刊或编号一致；arXiv 条目另读过摘要页。没有重读全文。

**Crossref 核对（标题、年份、期刊、DOI）**

| 文献 | DOI |
|---|---|
| Friedman 2001, *Annals of Statistics*（梯度提升机） | 10.1214/aos/1013203451 |
| Breiman 2001, *Machine Learning*（随机森林） | 10.1023/a:1010933404324 |
| Liu, Ting, Zhou 2008, ICDM（Isolation Forest） | 10.1109/icdm.2008.17 |
| Breunig, Kriegel, Ng, Sander 2000, *SIGMOD Record*（LOF） | 10.1145/335191.335388 |
| Schölkopf et al. 2001, *Neural Computation*（One-Class SVM） | 10.1162/089976601750264965 |
| Ben Taieb, Bontempi, Atiya, Sorjamaa 2012, *Expert Syst. Appl.*（多步策略） | 10.1016/j.eswa.2012.01.039 |
| Januschowski et al. 2022, *IJF*（Forecasting with trees） | 10.1016/j.ijforecast.2021.10.004 |
| Yeh et al. 2016, ICDM（Matrix Profile I） | 10.1109/icdm.2016.0179 |
| Dau et al. 2019, *IEEE/CAA J. Autom. Sinica*（UCR 档案） | 10.1109/jas.2019.1911747 |
| Dempster, Petitjean, Webb 2020, *DMKD*（ROCKET） | 10.1007/s10618-020-00701-z |
| Christ et al. 2018, *Neurocomputing*（tsfresh） | 10.1016/j.neucom.2018.03.067 |
| Makridakis, Spiliotis, Assimakopoulos 2018, *PLOS ONE* | 10.1371/journal.pone.0194889 |
| Makridakis, Spiliotis, Assimakopoulos 2022, *IJF*（M5） | 10.1016/j.ijforecast.2021.11.013 |
| Bergmeir & Benítez 2012, *Information Sciences* | 10.1016/j.ins.2011.12.028 |
| Bergmeir, Hyndman, Benítez 2018, *CSDA* | 10.1016/j.csda.2017.11.003 |

**arXiv 编号经 API 核对**：[1603.02754](https://arxiv.org/abs/1603.02754)（XGBoost）、[1901.10200](https://arxiv.org/abs/1901.10200)（catch22）、[1610.07717](https://arxiv.org/abs/1610.07717)（tsfresh 的 arXiv 版）、[1910.13051](https://arxiv.org/abs/1910.13051)（ROCKET）、[2012.08791](https://arxiv.org/abs/2012.08791)（MiniRocket）、[2102.00457](https://arxiv.org/abs/2102.00457)（MultiRocket）、[2203.13652](https://arxiv.org/abs/2203.13652)（HYDRA）、[2104.07551](https://arxiv.org/abs/2104.07551)（HIVE-COTE 2.0）、[1909.04939](https://arxiv.org/abs/1909.04939)（InceptionTime）、[1602.01711](https://arxiv.org/abs/1602.01711)（Bake off）、[2304.13029](https://arxiv.org/abs/2304.13029)（Bake off redux）、[1910.03225](https://arxiv.org/abs/1910.03225)（NGBoost）、[2204.01637](https://arxiv.org/abs/2204.01637)（Audibert 等）、[2211.05244](https://arxiv.org/abs/2211.05244)（深度时序异常检测综述）、[2207.08815](https://arxiv.org/abs/2207.08815)（树模型与表格深度学习）、[2501.02945](https://arxiv.org/abs/2501.02945)（TabPFN-TS）、[2107.06675](https://arxiv.org/abs/2107.06675)（M5 不确定性赛道的数据特征分析）。

**待核实**：LightGBM 原论文（NIPS 2017）及其 GOSS/EFB 的具体表述（Crossref 命中为 CRAN 包条目）；ROCKET 的默认核数；kNN-DTW 在 Bake off 中的具体设置；Makridakis et al. 2018 的结论细节；M5 中各方法的具体名次；早期（1990–2000 年代）机器学习预测文献；各工具库的当前版本与接口；mlforecast、aeon、stumpy 等库的功能细节。

**构造的例子**：§3.1 的外推失败算例（水平范围 80–120 与 130–170）是为说明概念构造的，不是实测结果。

