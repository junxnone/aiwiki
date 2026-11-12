-----

| Title     | ML Tasks TimeSeries Timeline                          |
| --------- | ----------------------------------------------------- |
| Created @ | `2026-11-10T09:17:45Z`                                |
| Updated @ | `2026-11-12T01:28:13Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/611) |

-----

# 时间序列模型发展时间线

> 时间序列模型的发展时间线。正文按
> [timelinemd](https://github.com/junxnone/jstools/tree/main/timelinemd)
> 格式书写，可用 [timelinemd
> 在线工具](https://junxnone.github.io/jstools/timelinemd/?md=https://raw.githubusercontent.com/junxnone/aiwiki/main/docs/0611_ML_Tasks_TimeSeries_Timeline.md)
> 以交互式时间轴形式查看（页面顶部会多出同步脚本自动生成的 Title/Created/Updated
> 表格，不影响下方时间轴正常解析渲染）。各方法详解见
> [总览](0603_ML_Tasks_TimeSeries)、[经典统计模型](0604_ML_Tasks_TimeSeries_Classical)、[机器学习](0605_ML_Tasks_TimeSeries_ML)、[深度学习](0606_ML_Tasks_TimeSeries_Deep)、[生成式](0607_ML_Tasks_TimeSeries_Generative)、[基础模型](0608_ML_Tasks_TimeSeries_Foundation)、[异常检测](0609_ML_Tasks_TimeSeries_Anomaly)、[评估指标](0610_ML_Tasks_TimeSeries_Metrics)。

## 经典统计与机器学习

### 1970 Box–Jenkins：ARIMA 方法论

Box 与 Jenkins 的专著系统化了 ARIMA 的识别、估计、诊断流程。年份凭记忆，待核实。

### 2016 GBDT 成为表格预测主力

XGBoost、LightGBM 等梯度提升树此后成为带特征工程的预测基线，并在 M5 等比赛中表现突出（待核实）。

### 2019-10-29 ROCKET

随机卷积核加线性分类器，时序分类的强基线。[arXiv:1910.13051](https://arxiv.org/abs/1910.13051)，日期为
arXiv 首次提交。

## 深度学习：RNN / CNN / MLP

### 2017-04-13 DeepAR

自回归 RNN 的全局概率预测。[arXiv:1704.04110](https://arxiv.org/abs/1704.04110)

### 2018-03-04 TCN 实证评估

通用因果膨胀卷积架构可与 RNN 相当。[arXiv:1803.01271](https://arxiv.org/abs/1803.01271)

### 2019-05-24 N-BEATS

纯全连接的预测架构，带可解释版本。[arXiv:1905.10437](https://arxiv.org/abs/1905.10437)

### 2022-01-30 N-HiTS

多速率池化与层级插值。[arXiv:2201.12886](https://arxiv.org/abs/2201.12886)

### 2022-05-26 DLinear

极简线性模型对 Transformer
的质疑。[arXiv:2205.13504](https://arxiv.org/abs/2205.13504)

### 2022-10-05 TimesNet

周期折叠成 2D，用 2D
卷积的通用骨干。[arXiv:2210.02186](https://arxiv.org/abs/2210.02186)

### 2023-03-10 TSMixer

全 MLP 的时间与特征混合。[arXiv:2303.06053](https://arxiv.org/abs/2303.06053)

### 2024-05-23 TimeMixer

可分解的多尺度混合。[arXiv:2405.14616](https://arxiv.org/abs/2405.14616)

## Transformer 与状态空间

### 2019-12-19 Temporal Fusion Transformer

面向多
horizon、含多类协变量的预测。[arXiv:1912.09363](https://arxiv.org/abs/1912.09363)

### 2020-12-14 Informer

ProbSparse
注意力，长序列预测。[arXiv:2012.07436](https://arxiv.org/abs/2012.07436)

### 2021-06-24 Autoformer

序列分解加自相关机制。[arXiv:2106.13008](https://arxiv.org/abs/2106.13008)

### 2021-10-31 S4

结构化状态空间层。[arXiv:2111.00396](https://arxiv.org/abs/2111.00396)

### 2022-01-30 FEDformer

频域增强的分解 Transformer。[arXiv:2201.12740](https://arxiv.org/abs/2201.12740)

### 2022-11-27 PatchTST

patch 化与通道独立。[arXiv:2211.14730](https://arxiv.org/abs/2211.14730)

### 2023-10-10 iTransformer

把变量序列作为 token 的倒置设计。[arXiv:2310.06625](https://arxiv.org/abs/2310.06625)

### 2023-12-01 Mamba

选择性状态空间，线性时间。[arXiv:2312.00752](https://arxiv.org/abs/2312.00752)

### 2024-02-29 TimeXer

带外生变量的 Transformer。[arXiv:2402.19072](https://arxiv.org/abs/2402.19072)

### 2024-03-17 Is Mamba Effective for TS Forecasting?

Mamba 用于时序预测的探索。[arXiv:2403.11144](https://arxiv.org/abs/2403.11144)

### 2024-04-22 SOFTS

series-core
融合的多变量预测。[arXiv:2404.14197](https://arxiv.org/abs/2404.14197)

## 生成式、表示学习与异常检测

### 2021-01-28 TimeGrad

自回归去噪扩散的多变量概率预测。[arXiv:2101.12072](https://arxiv.org/abs/2101.12072)

### 2021-06-19 TS2Vec

分层对比学习的通用表示。[arXiv:2106.10466](https://arxiv.org/abs/2106.10466)

### 2021-07-07 CSDI

条件分数扩散的概率填补。[arXiv:2107.03502](https://arxiv.org/abs/2107.03502)

### 2021-10-06 Anomaly Transformer

关联差异的异常检测。[arXiv:2110.02642](https://arxiv.org/abs/2110.02642)

### 2022-01-18 TranAD

Transformer
加对抗训练的多变量异常检测。[arXiv:2201.07284](https://arxiv.org/abs/2201.07284)

## 基础模型与 LLM 路线

### 2023-02-23 One Fits All (GPT4TS)

冻结预训练 GPT-2
的大部分参数用于时序。[arXiv:2302.11939](https://arxiv.org/abs/2302.11939)

### 2023-10-03 Time-LLM

把时序重编程后提示冻结的 LLM。[arXiv:2310.01728](https://arxiv.org/abs/2310.01728)

### 2023-10-05 TimeGPT-1

商业 API 形式的预测基础模型。[arXiv:2310.03589](https://arxiv.org/abs/2310.03589)

### 2023-10-12 Lag-Llama

以滞后特征为 token
的概率预测基础模型。[arXiv:2310.08278](https://arxiv.org/abs/2310.08278)

### 2023-10-14 TimesFM

decoder-only
的预测基础模型。[arXiv:2310.10688](https://arxiv.org/abs/2310.10688)

### 2024-01-08 Tiny Time Mixers

轻量预训练模型。[arXiv:2401.03955](https://arxiv.org/abs/2401.03955)

### 2024-02-04 Timer 与 Moirai

同日提交：Timer（生成式预训练）与 Moirai（通用预测
Transformer）。[2402.02368](https://arxiv.org/abs/2402.02368)，[2402.02592](https://arxiv.org/abs/2402.02592)

### 2024-02-06 MOMENT

开源的通用时序基础模型家族。[arXiv:2402.03885](https://arxiv.org/abs/2402.03885)

### 2024-03-12 Chronos

数值量化为
token，用语言模型架构训练。[arXiv:2403.07815](https://arxiv.org/abs/2403.07815)

### 2024-06-22 LLM 对时序预测有用吗？

消融实验质疑复用 LLM 的收益。[arXiv:2406.16964](https://arxiv.org/abs/2406.16964)

### 2024-09-24 Time-MoE

混合专家扩展到十亿参数。[arXiv:2409.16040](https://arxiv.org/abs/2409.16040)

### 2025-02-02 Sundial

生成式时序基础模型家族。[arXiv:2502.00816](https://arxiv.org/abs/2502.00816)

## 评测与综述

### 2022-02-15 Transformers in Time Series: A Survey

[arXiv:2202.07125](https://arxiv.org/abs/2202.07125)

### 2024-03-21 基础模型教程与综述

[arXiv:2403.14735](https://arxiv.org/abs/2403.14735)

### 2024-03-29 TFB

强调公平比较的预测基准。[arXiv:2403.20150](https://arxiv.org/abs/2403.20150)

### 2024-10-14 GIFT-Eval

面向通用与基础模型的预测基准。[arXiv:2410.10393](https://arxiv.org/abs/2410.10393)

## Reference

  - [timelinemd
    格式说明](https://github.com/junxnone/jstools/blob/main/timelinemd/README.md)
