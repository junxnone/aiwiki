---
Title | Datasets TS
-- | --
Created @ | `2026-11-11T07:47:25Z`
Updated @| `2026-11-11T07:47:25Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/623)

---
# Datasets TS

时间序列（Time Series，TS）数据集按**任务**划分最清晰：预测、分类、异常检测、填补，以及近两年为基础模型准备的**大规模预训练语料**。本文汇总常用数据集的来源、规模和用法，并指出使用时的常见陷阱。模型与方法见 [时序模型总览](0603_ML_Tasks_TimeSeries)，评估见 [评估指标](0610_ML_Tasks_TimeSeries_Metrics)，异常检测的评估问题见 [异常检测](0609_ML_Tasks_TimeSeries_Anomaly)。同系列的其他模态数据集见 [Datasets Audio](0020_Datasets_Audio)、[Datasets NLP](0021_Datasets_NLP)。

> 规模数字说明：下文标 **\[TN\]** 的数据来自 [TimesNet](0622_paper_TimesNet) 论文附录 Table 6 的统计（即 Time-Series-Library 常用的预处理后版本），原始数据集的官方规模可能不同；标"待核实"的是我没有逐项查证的内容。

## 总览

任务 | 常用数据集 | 典型用法
-- | -- | --
长期预测 | ETT、Electricity、Traffic、Weather、Exchange、ILI、Solar-Energy | 多变量，滑窗，预测 96~720 步
短期预测 / 预测比赛 | M3、M4、M5、Tourism | 单变量大批量序列，或层级销量
多领域预测档案 | Monash Time Series Forecasting Archive | 全局模型、基线对比
时空预测 | PEMS03/04/07/08、METR-LA、PEMS-BAY | 交通流量/速度，带传感器图结构
分类 | UCR（单变量）、UEA（多变量） | 整条序列 → 类别
异常检测 | SMD、MSL、SMAP、SWaT、WADI、PSM、UCR Anomaly Archive、TSB-UAD、NAB | 无监督重构/预测，点级或段级标注
填补 | ETT、Electricity、Weather（人工随机遮蔽） | 遮蔽 12.5%~50% 时间点
基础模型预训练 | LOTSA、Time-300B、UTSD、TimeBench、Chronos 语料 | 零样本预测
综合预测基准 | TFB、GIFT-Eval、Chronos Benchmark | 公平比较、零样本评测

## 一、长期预测（LTSF）套件

这一组数据集由 Informer、Autoformer、LSTNet 等工作确立，几乎所有长期预测论文都用它。多数是**一条很长的多变量序列**，靠滑窗切样本。

数据集 | 变量数 | 频率 | 划分（训练/验证/测试）\[TN\] | 领域 | 说明
-- | -- | -- | -- | -- | --
ETTh1 / ETTh2 | 7 | 小时 | 8545 / 2881 / 2881 | 电力变压器 | Informer 引入，变压器油温及负载特征；体量小
ETTm1 / ETTm2 | 7 | 15 分钟 | 34465 / 11521 / 11521 | 电力变压器 | 与 ETTh 同源，更细粒度
Electricity | 321 | 小时 | 18317 / 2633 / 5261 | 用电量 | 源自 UCI ElectricityLoadDiagrams20112014，经 LSTNet 整理为 321 个客户
Traffic | 862 | 小时 | 12185 / 1757 / 3509 | 交通 | 加州 PeMS 传感器占用率
Weather | 21 | 10 分钟 | 36792 / 5271 / 10540 | 气象 | 气象站多种气象指标
Exchange | 8 | 日 | 5120 / 665 / 1422 | 汇率 | 8 个国家汇率
ILI | 7 | 周 | 617 / 74 / 170 | 流感 | 美国 CDC 流感样病例；序列短，预测长度 24~60
Solar-Energy | 137（待核实） | 10 分钟（待核实） | — | 光伏发电 | LSTNet 引入

使用要点：

- 标准做法是回看窗口 96（ILI 为 36），预测 $\{96,192,336,720\}$（ILI 为 $\{24,36,48,60\}$），报告 MSE、MAE（多在标准化后的数据上计算）。
- 这套数据集**体量小、噪声大**，新模型的差距常落在噪声范围内；TFB 等工作还指出评测实现细节（如 `drop_last`）会影响可比性。结论见 [时序模型总览](0603_ML_Tasks_TimeSeries) 的评测陷阱部分。
- 常见配套工具：[Time-Series-Library](https://github.com/thuml/Time-Series-Library)（统一的数据加载、训练与评估）。

## 二、预测比赛与档案

### M 系列比赛

数据集 | 内容 | 要点
-- | -- | --
M3 | 3003 条单变量序列（待核实） | 早期经典基准，覆盖年、季、月等频率
M4 | 100,000 条单变量序列，分 Yearly/Quarterly/Monthly/Weekly/Daily/Hourly 六个子集 | 论文称序列来自人口、金融、工业、宏观、微观等领域；指标 SMAPE、MASE、OWA
M5 | 沃尔玛零售层级销量（待核实具体规模） | 含价格、日历等协变量，评估层级预测

M4 各子集预测长度（\[TN\]）：Yearly 6、Quarterly 8、Monthly 18、Weekly 13、Daily 14、Hourly 48；Weekly 仅 359 条、Hourly 仅 414 条序列，Monthly 达 48000 条。M4 的特点是**序列数多而每条较短**，与 LTSF"单条长序列"完全不同，适合全局模型和统计方法对比。

### Monash Time Series Forecasting Archive

Godahewa 等人（2021）整理的多领域预测档案，论文摘要称包含 **20 个**公开数据集，覆盖不同频率、序列长度和是否含缺失值，并给出特征分析和一组标准基线在 8 种误差指标上的结果；仓库中的变体更多（待核实具体数量）。适合评估全局预测模型，也是多个基础模型预训练语料的组成部分。

## 三、时空与交通数据

- **PEMS03 / 04 / 07 / 08**：加州高速公路传感器流量，常配合图神经网络使用（待核实各自规模）。
- **METR-LA / PEMS-BAY**：洛杉矶/湾区交通速度，带传感器邻接图，时空预测的主流基准（待核实）。
- PEMS-SF 也出现在 UEA 分类档案中（963 个变量，序列长 144，见下）。

## 四、分类数据集

- **UCR 档案**：2002 年首次发布 16 个数据集，2015 年从 45 个扩到 85 个，2018 年 10 月扩展到 **128 个**，都是单变量分类问题；是 ROCKET 系方法的主要战场。
- **UEA 多变量档案**（Bagnall 等，2018）：多变量分类的第一版档案，通常说包含 30 个数据集（待核实）。

TimesNet 等论文常用其中 10 个子集，规模如下（\[TN\]，训练/测试样本数，括号为变量数与序列长度）：

子集 | 变量数 | 序列长度 | 训练 / 测试 | 领域
-- | -- | -- | -- | --
EthanolConcentration | 3 | 1751 | 261 / 263 | 酒精工业
FaceDetection | 144 | 62 | 5890 / 3524 | 脑电（人脸检测）
Handwriting | 3 | 152 | 150 / 850 | 手写
Heartbeat | 61 | 405 | 204 / 205 | 心音
JapaneseVowels | 12 | 29 | 270 / 370 | 语音
PEMS-SF | 963 | 144 | 267 / 173 | 交通
SelfRegulationSCP1 | 6 | 896 | 268 / 293 | 健康
SelfRegulationSCP2 | 7 | 1152 | 200 / 180 | 健康
SpokenArabicDigits | 13 | 93 | 6599 / 2199 | 语音
UWaveGestureLibrary | 3 | 315 | 120 / 320 | 手势

这些子集训练样本普遍很少（几百条），模型容易过拟合；指标为准确率，通常对各子集取平均并配合统计检验。

## 五、异常检测数据集

数据集 | 变量数 | 来源/领域 | 规模（训练 / 验证 / 测试）\[TN\]
-- | -- | -- | --
SMD | 38 | 服务器机器监控（Su 等，2019） | 566724 / 141681 / 708420
MSL | 55 | NASA 火星科学实验室（Hundman 等，2018） | 44653 / 11664 / 73729
SMAP | 25 | NASA 土壤水分主动被动卫星（Hundman 等，2018） | 108146 / 27037 / 427617
SWaT | 51 | 水处理试验台（Mathur & Tippenhauer，2016） | 396000 / 99000 / 449919
PSM | 25 | 服务器机器（Abdulaal 等，2021，eBay，待核实） | 105984 / 26497 / 87841

此外：

- **WADI**：水分配试验台，常与 SWaT 并列使用（待核实）。
- **UCR Anomaly Archive**：为纠正旧基准的缺陷而构建的单变量异常检测档案（待核实规模）。
- **TSB-UAD**：单变量异常检测基准集合（待核实）。
- **NAB（Numenta）/ Yahoo S5 / KPI**：较早的单变量流式或运维指标基准。
- Lai 等（2021）《Revisiting time series outlier detection: Definitions and benchmarks》讨论了异常的定义与基准问题，TimesNet 论文引用过。

使用要点：

- 常见协议：按 Anomaly Transformer 的预处理，用长度 100 的滑窗切分，以重构误差（或预测误差）为判据，报告 Precision / Recall / F1。
- **评估陷阱**比数据本身更突出：标注质量、点调整（point-adjust）高估指标、阈值选取方式等，会让不同论文的数字不可直接比较，详见 [异常检测](0609_ML_Tasks_TimeSeries_Anomaly) 的"评估与基准"部分。
- SWaT、WADI 等需要向数据提供方申请，不是直接下载。

## 六、填补任务

填补通常**不使用专门的数据集**，而是在 ETT、Electricity、Weather 上按固定比例随机遮蔽时间点：TimesNet 的设置是对长度 96 的序列遮蔽 $\{12.5\%,25\%,37.5\%,50\%\}$ 并取平均。更偏向真实缺失机制的数据（如医疗、传感器故障）需要另行选择。

## 七、基础模型的大规模预训练语料

零样本/少样本的时序基础模型需要大规模、多领域的预训练数据。这些语料的规模数字来自对应论文摘要：

语料 | 来源模型 | 规模 | 说明
-- | -- | -- | --
LOTSA | Moirai | 超过 270 亿观测值，9 个领域 | Large-scale Open Time Series Archive，开源
UTSD | Timer | 最多 10 亿时间点 | 统一为单序列（S3）格式
Time-300B | Time-MoE | 约 3000 亿时间点（待核实，摘要被截断） | 覆盖多个领域
TimeBench | Sundial | 1 万亿时间点 | 以真实数据为主，含合成数据
Chronos 语料 | Chronos | 公开数据集集合 + 高斯过程合成数据 | 另有 42 个数据集的评测基准
GIFT-Eval Pretrain | GIFT-Eval | 约 2300 亿数据点 | 与评测集**不泄漏**的预训练集

使用要点：**评估泄漏**是核心风险——很多公开数据集（ETT、Electricity、Traffic、Weather 等）本身就在预训练语料里，在其上做"零样本"评测并不干净。GIFT-Eval 专门提供非泄漏预训练集，就是针对这个问题。模型细节见 [基础模型](0608_ML_Tasks_TimeSeries_Foundation)。

## 八、综合预测基准

基准 | 规模与特点（来自论文摘要）
-- | --
TFB | 10 个领域（交通、电力、能源、环境、自然、经济、股票、银行、健康、互联网）；强调数据领域覆盖、不对传统方法有"刻板偏见"、统一评测流水线
GIFT-Eval | 23 个数据集、超过 144,000 条序列、1.77 亿数据点；7 个领域、10 种频率、含多变量、预测长度从短期到长期；另提供约 2300 亿数据点的非泄漏预训练集（见上一节）；比较了 17 个基线
Chronos Benchmark | 42 个数据集，分"训练语料内"与"零样本"两类评测

## 选择与使用建议

需求 | 建议
-- | --
复现长期预测论文 | ETT、Electricity、Traffic、Weather、Exchange、ILI，用 Time-Series-Library 的数据加载，注意回看窗口与划分是否对齐论文
想要更稳健的预测对比 | Monash 档案或 TFB，而不是只用 ETT；ETT 体量小，容易过拟合并被饱和
评估基础模型零样本 | GIFT-Eval 或 Chronos Benchmark，并核对评测集是否出现在被评模型的预训练语料中
分类 | UCR/UEA 全量，不要只挑少数子集；配合统计检验
异常检测 | 同时报告点调整前后的指标，并说明阈值策略；优先考虑评估缺陷较少的新档案
第一次上手 | 先在 ETTh1 / ETTm1 上跑通流程，再换其他数据集

通用注意事项：

1. **划分方式**：时序数据必须按时间切分，不能随机打乱，避免未来信息泄漏。
2. **标准化**：长期预测通常用训练集统计量做标准化，指标是标准化尺度下的 MSE/MAE，不同论文口径需对齐。
3. **版权与获取**：部分数据（SWaT、WADI 等）需要申请；Traffic、PeMS 系需注意数据来源与许可。
4. **不要过度解读小差距**：LTSF 基准上的差距常落在噪声范围内，见 [时序模型总览](0603_ML_Tasks_TimeSeries)。

## Reference
- [Monash Time Series Forecasting Archive (arXiv:2105.06643)](https://arxiv.org/abs/2105.06643)
- [The UEA multivariate time series classification archive, 2018 (arXiv:1811.00075)](https://arxiv.org/abs/1811.00075)
- [TimesNet (arXiv:2210.02186)](https://arxiv.org/abs/2210.02186)
- [Moirai / LOTSA (arXiv:2402.02592)](https://arxiv.org/abs/2402.02592)
- [Timer (arXiv:2402.02368)](https://arxiv.org/abs/2402.02368)
- [Time-MoE (arXiv:2409.16040)](https://arxiv.org/abs/2409.16040)
- [Sundial / TimeBench (arXiv:2502.00816)](https://arxiv.org/abs/2502.00816)
- [Chronos (arXiv:2403.07815)](https://arxiv.org/abs/2403.07815)
- [TFB (arXiv:2403.20150)](https://arxiv.org/abs/2403.20150)
- [GIFT-Eval (arXiv:2410.10393)](https://arxiv.org/abs/2410.10393)
- [Time-Series-Library](https://github.com/thuml/Time-Series-Library)
- [UCI ElectricityLoadDiagrams20112014](https://archive.ics.uci.edu/ml/datasets/ElectricityLoadDiagrams20112014)

