---
Title | ML Tasks TimeSeries Deep NBEATS
-- | --
Created @ | `2026-11-19T01:28:47Z`
Updated @| `2026-11-19T06:17:04Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/628)

---
# N-BEATS

N-BEATS（Neural Basis Expansion Analysis for Interpretable Time Series Forecasting）是 Oreshkin、Carpov、Chapados、Bengio（Element AI / Mila）提出的**纯全连接**时间序列预测架构，发表于 ICLR 2020（arXiv:1905.10437）。一句话概括：用一摞带"回看补偿（backcast）+ 预测（forecast）"双输出的全连接块，通过**双重残差**把输入信号逐块"剥洗"、把各块的局部预测相加成最终预测；块末端的基函数层可以是学出来的（generic），也可以固定为多项式（趋势）与傅里叶（季节）基（interpretable）。

论文的问题设定是**单变量点预测**：给定长度为 $T$ 的历史，预测未来 $H$ 步；模型输入是以最后观测值结尾、长度 $t \le T$ 的回看窗口 $x = [y_{T-t+1}, ..., y_T]$。它不处理多变量、协变量和概率预测（这些是后续扩展，如 NBEATSx，见 [深度学习总览](/0606_ML_Tasks_TimeSeries_Deep)）。本文所有数字、公式来自论文原文；非论文内容均以 `[经验]` / `[解读]` / `[待核实]` 标注。相关背景见 [时间序列总览](/0603_ML_Tasks_TimeSeries)、[经典方法](/0604_ML_Tasks_TimeSeries_Classical)、[深度方法](/0606_ML_Tasks_TimeSeries_Deep)。

## 动机：为什么要做纯深度模型

- 论文引言指出：当时仍有证据表明 ML/DL 难以胜过经典统计方法。M4 竞赛中 6 个"纯 ML"方法的名次是 60 个参赛者中的第 23、37、38、48、54、57 名，靠前的多为经典统计方法的集成。
- M4 冠军（Smyl 的方法）是"带可学习参数的 Holt-Winters + 残差/注意力扩张 LSTM"的混合模型，且按每个 horizon 手工设计结构。Makridakis 等人据此认为"混合与组合才是出路"。N-BEATS 想挑战这个结论：**不用任何时间序列专用组件，纯深度学习能否做到更好**。
- 第二个目标是可解释性：能否通过注入合适的归纳偏置，让模型内部输出像传统 STL（trend / seasonality / level）分解那样可读。
- 设计原则（论文 §3）：基础结构简单、通用但足够深；不依赖时间序列特征工程或输入缩放；可扩展出人类可解释的输出。

## 核心结构

### 基本块（Block）

第 $\ell$ 个块接收输入 $x_\ell$（首块为模型输入窗口，其余为前一块的残差），输出两个向量：$\hat x_\ell$（backcast，对 $x_\ell$ 的最佳重构）与 $\hat y_\ell$（长度 $H$ 的局部 forecast）。块内分两部分：

$$\begin{aligned}
h_{\ell,1} &= \mathrm{FC}_{\ell,1}(x_\ell) && \text{FC = Linear + ReLU}\\
h_{\ell,2} &= \mathrm{FC}_{\ell,2}(h_{\ell,1})\\
h_{\ell,3} &= \mathrm{FC}_{\ell,3}(h_{\ell,2})\\
h_{\ell,4} &= \mathrm{FC}_{\ell,4}(h_{\ell,3})\\
\theta^b_\ell &= \mathrm{LINEAR}_b(h_{\ell,4}),\quad \theta^f_\ell = \mathrm{LINEAR}_f(h_{\ell,4}) && \text{展开系数 (式 1)}
\end{aligned}$$

$$\begin{aligned}
\hat y_\ell &= \sum_i \theta^f_{\ell,i}\cdot v^f_i && \text{前向基层 } g^f\\
\hat x_\ell &= \sum_i \theta^b_{\ell,i}\cdot v^b_i && \text{后向基层 } g^b
\end{aligned}$$

- 第一部分是 4 层 FC 加两个线性投影头，预测前向系数 $\theta^f$ 与后向系数 $\theta^b$。
- 第二部分是基层 $g^b$、$g^f$：把系数投影到一组基向量 $\{v_i\}$ 上得到输出。基向量可以学习，也可以固定为特定函数形式——这是 generic 与 interpretable 的核心区别。
- 窗口长度取预测长度的整数倍：论文中输入长度 $2H \sim 7H$。

### 双重残差堆叠（Doubly Residual Stacking）

$$\begin{aligned}
x_\ell &= x_{\ell-1} - \hat x_{\ell-1} && \text{backcast 分支：逐块扣除"已被解释"的部分}\\
\hat y &= \sum_\ell \hat y_\ell && \text{forecast 分支：各块局部预测求和}
\end{aligned}$$

```
 窗口 x ──► Block1 ──(x - x̂1)──► Block2 ──(...)──► ... ──► BlockK
              │ ŷ1                 │ ŷ2                        │ ŷK
              └──────────── + ─────┴────────────── + ──────────┘
                                   │
                      stack forecast ──► 多个 stack 再求和 ──► 全局预测 ŷ
```

- 与 ResNet（输出 = 输入 + 变换）和 DenseNet（所有层互连）不同：N-BEATS 有**两条**残差支路，一条沿 backcast 做"逐块分析"，一条沿 forecast 做"逐块累加"。论文认为 ResNet / DenseNet 的连接方式使网络难以解释，而该拓扑能让局部预测在 stack 层、再到全模型层分级聚合，形成层级分解。
- 论文的直觉：前一块把自己能很好逼近的信号成分从输入里去掉，使下游块的预测任务更容易，同时梯度回传更顺畅。
- `[解读]` 这很像"逐级拟合残差"的提升（boosting）思路：每块只负责当前残差里它擅长的部分。论文本身在 §6 把它类比为元学习中的"内循环逐步更新展开系数"（见下）。

### 两种配置

**Generic（N-BEATS-G）**：$g^b$、$g^f$ 就是对 $\theta$ 的线性投影，$\hat y = V^f \theta^f + b^f$，$\hat x = V^b \theta^b + b^b$，矩阵 $V$ 由网络学习（$V^f$ 形状为 $H \times \dim(\theta^f)$）。论文观察到学出来的"波形"没有可见结构，因此局部预测不可解释。

**Interpretable（N-BEATS-I）**：在 stack 层面固定基函数，整个模型是**趋势 stack + 季节 stack** 两个 stack 串联。

- 趋势基：$t = [0, 1, ..., H-1]^T / H$，$\hat y^{tr}_{s,\ell} = \sum_{i=0}^{p} \theta_{s,\ell,i}\, t^i = T \theta$，$p$ 取小的值（如 2 或 3）使其只能表达缓变/单调的趋势。
- 季节基（傅里叶）：

$$\hat y^{seas}_{s,\ell} = \sum_{i=0}^{\lfloor H/2\rfloor-1} \left[ \theta_{s,\ell,i} \cos(2\pi i t) + \theta_{s,\ell,i+\lfloor H/2\rfloor} \sin(2\pi i t) \right] = S \theta$$

- 因为趋势 stack 在前，趋势成分先从输入窗口被扣除，再进入季节 stack；两个 stack 的输出各自可读。
- 每个 stack 有 3 个块；stack 内各块共享固定的基；论文还发现**stack 内所有权重共享**时验证集表现更好。

### 一个小例子：信息怎么流过去（示意）

`[解读]` 下面的数字是为说明信息流自拟的，不是论文结果。设 $H = 4$，输入窗口 `x` 含"上升趋势 + 周期 2 的锯齿"，interpretable 版本两个 stack：

```
输入 x      = [10, 13, 14, 17, 18, 21, 22, 25]      # 约每步 +2，叠加 ±1 的锯齿
Trend stack : 多项式基 (p=2) 拟合缓变部分 → backcast ≈ [10,12,14,16,18,20,22,24]
              forecast_trend ≈ [26, 28, 30, 32]      # 沿多项式外推 H 步
残差 x'     = x - backcast ≈ [0,+1,0,+1,0,+1,0,+1]    # 趋势被扣掉，只剩锯齿
Seasonal stack: 傅里叶基拟合 x' → forecast_seas ≈ [0,+1,0,+1]
最终 ŷ      = forecast_trend + forecast_seas ≈ [26, 29, 30, 33]
```

关键点：每个 stack 只"看得到"前面剩下的信号，趋势基无法解释锯齿，锯齿只能交给季节基；两个 stack 的 forecast 各自就是一条可画出来的曲线。generic 版本没有基函数约束，每个块的 `V` 是任意矩阵，块输出不再对应"趋势"或"季节"。

### 为什么要 backcast：与去掉它的变体对比

变体（论文附录 B.3、Fig. 4） | 输入信息流 | 输出信息流
-- | -- | --
N-BEATS（DRESS，默认） | 逐块扣除 backcast | 所有块 forecast 相加
PARALLEL | 每个块都看原始输入 | forecast 相加
NO-RESIDUAL | 去掉 backcast 残差，上一块的 backcast 直接作下一块输入 | forecast 相加
LAST-FORWARD | 逐块扣除 backcast | 只取最后一个块的 forecast（最接近经典 ResNet）
NO-RESIDUAL-LAST-FORWARD | 无残差 | 只取最后块（纯超深前馈网络）

OWA 结果见后文消融表：默认方案最好，纯前馈最差。

### 评估指标（论文 §2）

$$\begin{aligned}
\mathrm{sMAPE} &= \frac{200}{H}\sum \frac{\lvert y - \hat y\rvert}{\lvert y\rvert + \lvert\hat y\rvert}\\
\mathrm{MASE} &= \frac{1}{H}\sum \frac{\lvert y - \hat y\rvert}{\frac{1}{T+H-m}\sum_{j=m+1}^{T+H}\lvert y_j - y_{j-m}\rvert} && m \text{ 为季节周期}\\
\mathrm{MAPE} &= \frac{100}{H}\sum \frac{\lvert y - \hat y\rvert}{\lvert y\rvert}\\
\mathrm{OWA} &= \frac{1}{2}\left(\frac{\mathrm{sMAPE}}{\mathrm{sMAPE}_{\text{Naive2}}} + \frac{\mathrm{MASE}}{\mathrm{MASE}_{\text{Naive2}}}\right) && \text{M4 专用，Naive2 的 OWA = 1}
\end{aligned}$$

`[解读]` 这三个指标都是尺度无关的，这是 N-BEATS 能"不做输入缩放"、并把三种指标当作集成多样性来源的前提。

## 训练与推理

- **数据采样**：每次更新取 batch=1024，在该 horizon 子集中均匀有放回地抽 1024 条序列；对每条序列，在其训练部分末尾前长度 $L_H \cdot H$ 的历史范围内随机选一个预测起点；起点之后的 $H$ 个点作目标，之前 $2H \sim 7H$ 之一长度的历史作输入。越界的点补 0 并在训练时 mask。
- $L_H$ 是交叉验证出的超参：序列很多的子集小（M4 Yearly / Monthly / Quarterly 为 1.5），序列较少的子集大（M4 Weekly / Daily / Hourly 为 10）。
- **优化**：Adam（默认设置），初始学习率 0.001；基于验证集早停并确定 batch 数。用 sMAPE 作损失时，对分母**停止梯度**以保证数值稳定。
- **每个 horizon 单独训一个模型**（模型内部跨序列共享参数），但架构与超参数在不同 horizon、不同数据集间保持一致。论文把"每条序列是一个任务"联系到多任务学习 / 元学习。
- **无缩放、无特征工程**：论文设计原则之一是不依赖输入缩放。`[解读]` 损失（sMAPE/MAPE/MASE）本身是尺度无关的，这样可行；若换成 MSE 等有量纲损失，是否需要归一化，论文未讨论。
- **训练耗时**：论文称 GPU 上训练 M4 全集的一个集成成员需要 30 分钟到 2 小时，取决于网络设置和硬件。
- **集成（Ensembling）**：论文发现集成是比 dropout、L2 更强的正则手段（dropout/L2 能改善单模型，却会伤害集成）。多样性来源三个：
  1. 三种损失：sMAPE、MASE、MAPE（只用真值作分母的 sMAPE 变体）；
  2. 六种输入窗口长度：$2H$、$3H$、...、$7H$；
  3. 不同随机初始化的 bagging。

  报告测试集结果时共用 **180 个模型**，聚合函数取**中位数**。`[解读]` 180 = 3 种损失 × 6 种窗口 × 10 个随机种子：论文只写了三项多样性来源和总数 180，"10 个种子"是反推；佐证是消融里集成规模取 18 / 36 / 90 / 180（均为 18 的倍数），而 18 个模型的消融集成正好对应"3 × 6 各一个"。TOURISM 只用 MAPE 一种损失（验证集上最佳）。
- **推理**：给定最后 $t$ 个观测值，所有块前向一次，直接输出长度 $H$ 的整段预测（**直接多步**，不递归）。

### 超参（论文附录 Table 18，M4/M3/TOURISM 通用设置）

项目 | N-BEATS-I | N-BEATS-G
-- | -- | --
结构 | trend stack + seasonality stack | 30 个 stack，每个 stack 1 个块
块内层数 | 4 | 4
宽度 | 季节 stack 2048，趋势 stack 256 | 512
块数 | 趋势 3、季节 3 | 每 stack 1（共 30 个块）
趋势多项式次数 | 2 | -
权重共享 | stack 内共享 | 不共享
batch / 窗口 | 1024；$2H \sim 7H$ | 同左

以上数字已对照 Table 18 渲染图核实。各子集上变化的只有 $L_H$、训练 batch 数（Iterations）和损失：

配置 | 项目 | M4 Yly / Qly / Mly | M4 Wly / Dly / Hly | M3 Yly / Qly / Mly / Other | TOURISM Yly / Qly / Mly
-- | -- | -- | -- | -- | --
N-BEATS-I | $L_H$ | 1.5 / 1.5 / 1.5 | 10 / 10 / 10 | 20 / 5 / 5 / 20 | 20 / 10 / 20
N-BEATS-I | Iterations | 15K / 15K / 15K | 5K / 5K / 5K | 50 / 6K / 6K / 250 | 30 / 500 / 300
N-BEATS-G | $L_H$ | 1.5 / 1.5 / 1.5 | 10 / 10 / 10 | 20 / 20 / 20 / 10 | 5 / 10 / 20
N-BEATS-G | Iterations | 15K / 15K / 15K | 5K / 5K / 5K | 20 / 250 / 10K / 250 | 30 / 100 / 100

- 损失：M4、M3 为 sMAPE/MAPE/MASE 三种混合；TOURISM 仅 MAPE。
- M3 Yearly（I 仅 50 个 batch）、TOURISM Yearly（30 个 batch）等训练步数极少，`[解读]` 应是这些小数据子集上由验证集早停确定的，论文未逐项解释。
- 论文自身有一处出入：附录 B 消融文字写"每个块 5 个 FC 层"，与 §3.1 / 式 (1) / Table 18 的 4 层不一致；本文按 4 层记录。

## 实验与结论

### 主结果（论文 Table 1，测试集，越小越好）

**M4**（100,000 条序列，指标 sMAPE / OWA）：

方法 | sMAPE | OWA
-- | -- | --
Pure ML（最佳纯 ML 参赛） | 12.894 | 0.915
Statistical（最佳纯统计参赛） | 11.986 | 0.861
ProLogistica（M4 第 3 名） | 11.845 | 0.841
ML/TS combination（M4 第 2 名，统计模型输出 + 梯度提升树） | 11.720 | 0.838
DL/TS hybrid（M4 冠军，Smyl） | 11.374 | 0.821
N-BEATS-G | 11.168 | 0.797
N-BEATS-I | 11.174 | 0.798
N-BEATS-I+G（两类模型集成） | 11.135 | 0.795

**M3**（3,003 条，平均 sMAPE）：Comb S-H-D 13.52、ForecastPro 13.19、Theta 13.01、DOTM 12.90、EXP 12.71；N-BEATS-G 12.47、N-BEATS-I 12.43、N-BEATS-I+G 12.37。

**TOURISM**（1,311 条，平均 MAPE）：ETS 20.88、Theta 20.88、ForePro 19.84、Stratometrics 19.52、LeeCBaker 19.35；N-BEATS-G 18.47、N-BEATS-I 18.97、N-BEATS-I+G 18.52。

- 论文摘要的说法：在 M4 上比统计基准提升 11%，比 M4 冠军提升 3%；引言还提到比最佳统计参赛提升 7%。论文强调 OWA 上 N-BEATS 与冠军的差距（0.821 - 0.795 = 0.026）大于冠军与第二名的差距（0.838 - 0.821 = 0.017）。
- 各数据集的指标不同（M4 用 OWA / sMAPE，M3 用 sMAPE，TOURISM 用 MAPE）。`[解读]` TOURISM 上 N-BEATS-I 的 MAPE（18.97）比 G（18.47）差一些，说明可解释版本并非在所有数据集上都无精度损失；论文的结论是"没有显著精度损失"，M4/M3 上差距很小。

### 与 DeepAR / Deep State 的对比（附录 Table 17，ND 指标）

数据集 | DeepAR | DeepState | N-BEATS-G | N-BEATS-I | N-BEATS-I+G
-- | -- | -- | -- | -- | --
M4 Hourly | 0.09 | 0.044 | 0.023 | 0.027 | 0.025
TOURISM Monthly | 0.107 | 0.138 | 0.097 | 0.103 | 0.099
TOURISM Quarterly | 0.11 | 0.098 | 0.080 | 0.079 | 0.077

附录 C.4 还在 ELECTRICITY、TRAFFIC 上与 MatFact、DeepAR、Deep State、Deep Factors 比较（ND 指标）；具体数值本文未逐项核对，不引用。

### 消融（附录 B）

- **堆叠深度**（验证集 sMAPE，generic，每个 stack 1 个块）：1 / 3 / 9 / 18 / 30 个 stack 分别为 11.154 / 11.061 / 10.998 / 10.950 / 10.937，持续下降后趋于饱和；论文称 30 个 stack 的总深度约 150 层。
- **基函数协同**：可解释版本中"趋势 + 季节"两类 stack 链接，优于只用同一类 stack；论文认为趋势与季节所能表达的函数类重叠小，因此有协同效应。
- **集成规模**（Figure 3）：N-BEATS-G 的 M4 OWA 随集成增大而改善；规模缩小 10 倍（18 个模型），OWA 损失不到 0.5%，仍然是 SOTA。
- **双重残差拓扑（DRESS）**：在 M4 上用 18 个模型的集成，比较 PARALLEL、NO-RESIDUAL、LAST-FORWARD、NO-RESIDUAL-LAST-FORWARD 等变体（Table 9/10，平均 OWA）：

变体 | generic OWA | interpretable OWA
-- | -- | --
PARALLEL | 0.822 | 0.821
NO-RESIDUAL | 0.819 | 0.833
LAST-FORWARD | 0.811 | 0.808
NO-RESIDUAL-LAST-FORWARD（纯前馈深网） | 1.030 | 0.922
N-BEATS-DRESS（默认） | 0.803 | 0.800

  结论：同时保留 backcast 残差与分块预测求和最好；把两者都去掉的纯深前馈网络明显更差（generic 上差异最大）。论文表中还有 RESIDUAL-INPUT 变体，此处略。
- **可解释性定性结果**（Figure 2 / 附录 Figure 5）：generic 的两个 stack 输出里趋势、季节混杂、无规律；interpretable 的趋势 stack 输出单调缓变，季节 stack 输出规律周期，且当序列季节性强时季节分量幅度远大于趋势。这是对 M4 各频率各取一条序列的**定性展示**，论文没有给可解释性的定量指标。

## 元学习视角（论文 §6，推测性讨论）

论文把 N-BEATS 类比为元学习：外循环是用梯度下降学习整个网络参数；内循环是各块依次修改展开系数 $\theta^f$，每个块像一次"更新步"，把一段历史看作训练集。消融中"块数 / stack 数越多泛化越好"被解释为"内循环迭代更多"。结论部分明确写的是"我们**推测**（speculate）"性能部分来自元学习，留作未来研究，**不是已验证的结论**。

## 优缺点与局限

论文自述的优点：

- 通用：不用时间序列专用组件即在 M4/M3/TOURISM 达到论文所报告的最优；同一架构与超参跨 horizon、跨数据集复用。
- 可解释版本在 M4、M3 上无明显精度损失，并能得到趋势 / 季节分解。
- 训练快、可扩展；集成规模可按算力折中。

`[经验]` / `[解读]` 局限：

- **仅单变量**：原模型不支持多变量依赖、协变量（未来已知变量如促销、节假日）与概率输出；仓库综述也将其归为协变量支持有限（NBEATSx 是外生变量扩展）。
- **固定输入窗口与固定 horizon**：每个 horizon 要单独训练一个模型，窗口长度必须是 $H$ 的倍数且训练时固定；`[解读]` $H$ 很长时，输出向量和 FC 参数量随 $H$ 增长（后续 N-HiTS 针对长 horizon 的计算量做了改进，另文介绍）。
- **集成成本**：论文最佳结果依赖 180 个模型的中位数集成；Figure 3 显示缩到 18 个模型 OWA 仅损失不到 0.5%，但单个模型的精度论文正文未单独给出。
- **解释性的边界**：趋势 / 季节是被"结构约束"出来的分解，不是从数据里发现的因果因素；`[解读]` 季节基按 $H$ 的整数倍频率展开，对周期与 $H$ 不对齐的序列表达是否理想，论文没有专门讨论。
- **实验范围**：论文主要在竞赛类（M4/M3/TOURISM）数据集上验证，序列较短、频率较低；长序列、多变量长期预测的基准（如 ETT、Weather 等）不在论文范围内，不能由此推断。

## 与相关方法对比

方法 | 结构 | 多变量 / 协变量 | 概率输出 | 解释性 | 备注
-- | -- | -- | -- | -- | --
N-BEATS | 残差 FC 块堆叠，双重残差 | 否（原版） | 否（点预测） | 可选（趋势 / 季节基） | 直接多步
[ARIMA](/0624_ML_Tasks_TimeSeries_Classical_ARIMA) / ETS / Theta | 统计模型，逐序列拟合 | 弱 / 否 | 有（区间） | 强 | 论文中的基线类别
[DeepAR](/0625_ML_Tasks_TimeSeries_Deep_DeepAR) | 自回归 RNN，全局模型 | 支持协变量 | 是 | 弱 | 论文 Table 17 中 N-BEATS 的 ND 更低
[TCN](/0626_ML_Tasks_TimeSeries_Deep_TCN) | 因果扩张卷积 | 支持 | 视实现 | 弱 | 论文未比较
Smyl ES-RNN（M4 冠军） | Holt-Winters + 扩张 LSTM 混合 | 否 | 否 | 部分 | 需按 horizon 手工设计
N-HiTS | 在 N-BEATS 上加多速率池化与层级插值 | 否 | 否 | 有限 | 同系列后续工作，另文介绍
DLinear / TSMixer / TimeMixer | MLP / 线性路线 | 视模型而定 | 否 | 视模型而定 | 同批其他文章另述

`[解读]` 与 N-HiTS 的区别（N-HiTS 的细节来自仓库综述，不是本文这篇论文）：N-BEATS 每个块都吃完整输入窗口并输出完整长度 $H$ 的预测；N-HiTS 让不同块对输入做不同强度的池化、输出缩短的预测再插值到 $H$，使块分工于不同频率并降低长 horizon 计算量。与 DeepAR 的区别：DeepAR 是自回归的概率模型（输出分布参数，靠采样生成多步），N-BEATS 直接输出整段点预测、没有分布假设；二者都是跨序列共享参数的"全局模型"。

`[解读]` N-BEATS 可视为"把经典的分解思想（STL 的趋势 + 季节）装进可学习的基函数展开，再用深度网络预测系数"。上表中"多变量 / 协变量""解释性"两列除 N-BEATS 外均为 `[经验]` 性概括，非论文结论。

## 使用方式

论文提到实现基于 TensorFlow；`[待核实]` 官方代码仓库（据记忆为 Element AI / ServiceNow 名下的 N-BEATS 仓库），论文正文未给出链接，本文不列链接。社区实现（如 Nixtla NeuralForecast、Darts、PyTorch Forecasting 中的 N-BEATS）`[待核实]` 具体接口与版本。下面是不依赖任何库的**示意代码，未运行验证**，只演示 generic 块和双重残差的核心逻辑：

```python
import torch, torch.nn as nn

class Block(nn.Module):
    def __init__(self, lookback, horizon, width=512, layers=4, theta_dim=None):
        super().__init__()
        d = theta_dim or (lookback + horizon)
        mods, in_dim = [], lookback
        for _ in range(layers):
            mods += [nn.Linear(in_dim, width), nn.ReLU()]
            in_dim = width
        self.fc = nn.Sequential(*mods)
        self.theta_b = nn.Linear(width, d, bias=False)
        self.theta_f = nn.Linear(width, d, bias=False)
        self.basis_b = nn.Linear(d, lookback)   # generic: 可学习基 V^b
        self.basis_f = nn.Linear(d, horizon)    # generic: 可学习基 V^f

    def forward(self, x):
        h = self.fc(x)
        return self.basis_b(self.theta_b(h)), self.basis_f(self.theta_f(h))

class NBeatsG(nn.Module):
    def __init__(self, lookback, horizon, n_blocks=30):
        super().__init__()
        self.blocks = nn.ModuleList(Block(lookback, horizon) for _ in range(n_blocks))

    def forward(self, x):
        forecast = 0
        for blk in self.blocks:
            backcast, f = blk(x)
            x = x - backcast          # backcast 残差分支
            forecast = forecast + f   # forecast 求和分支
        return forecast
```

`[经验]` 实践要点（非论文结论）：窗口长度取 $H$ 的 2 到 7 倍并多取几个做集成；损失用 sMAPE / MASE 一类尺度无关指标时可不做归一化，用其他损失时建议自行做归一化并评估；需要未来协变量或多变量时优先考虑 NBEATSx 或其他模型。

## Reference

- Oreshkin, Carpov, Chapados, Bengio. *N-BEATS: Neural basis expansion analysis for interpretable time series forecasting*. ICLR 2020. [arXiv:1905.10437](https://arxiv.org/abs/1905.10437)
- 仓库相关综述：[时间序列总览](/0603_ML_Tasks_TimeSeries)、[深度学习](/0606_ML_Tasks_TimeSeries_Deep)


