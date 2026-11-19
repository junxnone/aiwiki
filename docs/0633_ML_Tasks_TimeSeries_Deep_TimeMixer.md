---
Title | ML Tasks TimeSeries Deep TimeMixer
-- | --
Created @ | `2026-11-19T01:28:57Z`
Updated @| `2026-11-19T02:24:25Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/633)

---
# TimeMixer

TimeMixer 是 ICLR 2024 的时间序列预测模型（Shiyu Wang、Haixu Wu 等，Ant Group 与清华大学），论文标题为 *TimeMixer: Decomposable Multiscale Mixing for Time Series Forecasting*（arXiv:2405.14616）。它属于[深度学习预测](/0606_ML_Tasks_TimeSeries_Deep)中的 MLP 路线，论文称其为 fully MLP-based 架构（可学习部分是线性层；另有平均池化与移动平均分解，不含注意力、卷积或循环结构 `[解读]`）。

**一句话概括**：先用平均池化把输入序列压成多个采样尺度，在"过去"阶段用 PDM 块把每个尺度分解成季节项和趋势项，季节项自细到粗混合、趋势项自粗到细混合；在"未来"阶段用 FMM 块让每个尺度各出一个预测，再求和。

本文在[时间序列总览](/0603_ML_Tasks_TimeSeries)里的位置：总览把它归在"混合 MLP 路线"（与 TSMixer 并列）。需要先区分的一点：本文的 TimeMixer 与 Google 的 TSMixer（arXiv:2303.06053）是两个不同的模型，名字相近但设计出发点不同，论文也把后者作为附加基线（见"与相关方法对比"）。

文中标注约定：未标注的内容来自论文原文；`[解读]` 是对论文的个人理解，`[经验]` 是一般经验判断，`[待核实]` 是未能从论文核对的内容。

## 解决什么问题

论文的出发点是一个观察：**同一条序列在不同采样尺度下呈现不同的模式**。

- 小时级采样的交通流，能看到一天中不同时段的变化；
- 日级采样后，这些细粒度变化消失，但与节假日相关的波动出现；
- 年级平均后，宏观经济趋势占主导。

细尺度反映微观信息，粗尺度反映宏观信息，复杂变化因此可以被"自然拆开"。论文把它和此前两条主流思路对比：

思路 | 代表 | 做法
-- | -- | --
序列分解 | Autoformer、FEDformer、DLinear、MICN | 把序列拆成季节项和趋势项
多周期分析 | N-BEATS、FiLM、TimesNet | 把序列拆成不同周期长度的分量
多尺度混合（本文） | TimeMixer | 在多个采样尺度上分别提取，再混合

论文也提到已有的时间多尺度设计，如 Pyraformer（金字塔注意力）和 SCINet（二叉下采样树），指出它们的未来预测没有同时利用过去观测在不同尺度上提取到的信息。TimeMixer 的两个关键点由此而来：

1. **过去提取**：即使最粗尺度的序列，仍然同时含有季节性和趋势（论文 Figure 1 的观察），所以不能把每个尺度当成一个整体去混合，而要先分解再分别混合。
2. **未来预测**：不同尺度的序列主导变化不同，预测能力也不同（细尺度擅长细节和季节，粗尺度擅长宏观趋势），应当集成多个尺度上的预测器。

## 核心思想与结构

### 整体流程

符号：输入 $x\in\mathbb R^{P\times C}$（过去长度 $P$，$C$ 个变量），输出 $\hat x\in\mathbb R^{F\times C}$（未来长度 $F$）。

```
输入 x (P×C)
  │  平均池化（每级下采样 2 倍）
  ▼
多尺度序列 X = {x_0, x_1, ..., x_M},  x_m ∈ R^{⌊P/2^m⌋ × C}
  │  Embed（嵌入到 d_model 维）
  ▼
X^0 = {x^0_0, ..., x^0_M},  x^0_m ∈ R^{⌊P/2^m⌋ × d_model}
  │  堆叠 L 个 PDM 块： X^l = PDM(X^{l-1})
  ▼
X^L
  │  FMM： x̂ = FMM(X^L)
  ▼
预测 x̂ (F×C)
```

- $x_0=x$ 是原始输入，含最细的变化；$x_M$ 最粗，对应宏观变化。
- 尺度总数是 $M+1$。论文用平均池化得到各尺度；附录比较过用步长为 2 的 1D 卷积替代，效果略好，但综合性能和效率论文仍选平均池化。
- 论文原文把每一级的下采样长度写为 $\lfloor P/2^m\rfloor$，即每一级相对上一级缩短一半。

一个小例子：$P=96,\ M=3$ 时，四个尺度的长度依次是 96、48、24、12。若原始采样间隔为 $\Delta$，则四个尺度的间隔依次是 $\Delta$、$2\Delta$、$4\Delta$、$8\Delta$ `[解读]`。论文 Figure 3 中画出的季节混合权重是 96→48 的矩阵，趋势混合权重是 48→96 方向的矩阵。

`[解读]` 每个尺度上的线性层都作用在时间维，所以各尺度的"时间点数"可以不同，混合层的输入/输出维度正好是相邻两级的长度，这也是论文给出 $\lfloor P/2^{m-1}\rfloor \to \lfloor P/2^m\rfloor$ 与 $\lfloor P/2^{m+1}\rfloor \to \lfloor P/2^m\rfloor$ 的原因。同一个混合层在所有通道上共享权重（线性层作用在最后一维）。

### PDM：过去可分解混合

第 $l$ 个 PDM 块先对每个尺度做序列分解（沿用 Autoformer 的移动平均分解），得到季节部分 $s$ 和趋势部分 $t$，再分别在尺度之间混合，最后用残差连接：

$$
\begin{aligned}
s^l_m,\ t^l_m &= \mathrm{SeriesDecomp}(x^l_m),\quad m\in\{0,\dots,M\}\\
X^l &= X^{l-1} + \mathrm{FeedForward}\big(\mathrm{S\text{-}Mix}(\{s^l_m\}) + \mathrm{T\text{-}Mix}(\{t^l_m\})\big)
\end{aligned}
\tag{3}
$$

其中 FeedForward 是两层线性层加中间 GELU，沿通道维做信息交互；S-Mix、T-Mix 分别是季节混合和趋势混合，沿时间维做线性映射。

**季节混合：自底向上（fine → coarse）**

论文的理由：较大的周期可以看作较小周期的聚合，例如交通流的周周期由七个日变化构成，所以预测粗尺度的季节性需要细尺度的细节信息。

$$
s_m = s_m + \mathrm{Bottom\text{-}Up\text{-}Mixing}(s_{m-1}),\quad m=1,\dots,M
\tag{4}
$$

Bottom-Up-Mixing 是两层线性层加中间 GELU，沿时间维，输入维度 $\lfloor P/2^{m-1}\rfloor$，输出维度 $\lfloor P/2^m\rfloor$。

**趋势混合：自顶向下（coarse → fine）**

论文的理由：细尺度的细节变化会给宏观趋势的捕捉引入噪声，而粗尺度能更清晰地给出宏观信息，用它来指导细尺度的趋势建模。

$$
t_m = t_m + \mathrm{Top\text{-}Down\text{-}Mixing}(t_{m+1}),\quad m=M-1,\dots,0
\tag{5}
$$

Top-Down-Mixing 同样是两层线性加 GELU，输入维度 $\lfloor P/2^{m+1}\rfloor$，输出维度 $\lfloor P/2^m\rfloor$。

`[解读]` 式 (4)(5) 用 `for` 循环原地更新，意味着更新后的 $s_{m-1}$（或 $t_{m+1}$）会继续传给下一级，信息因此可以逐级传播多跳。论文文字对这一点没有额外展开。

ASCII 示意（$M=3$，箭头为混合方向）：

```
            季节项 (S-Mix)            趋势项 (T-Mix)
尺度 0 (96)   s_0  ──┐                 t_0  ◄──┐
尺度 1 (48)   s_1  ◄─┘ ──┐             t_1  ◄──┤ ◄─┐
尺度 2 (24)   s_2     ◄──┘ ──┐         t_2  ◄──┘    │
尺度 3 (12)   s_3        ◄───┘         t_3  ───────┘
              细 ──────► 粗             粗 ──────► 细
```

上图只为表示方向：季节信息由细向粗流动，趋势信息由粗向细流动。

论文 Figure 3 还画出了训练后的混合权重（ETTh1，输入 96 预测 96）：季节混合层的权重呈周期性（图中重复的条纹），趋势混合层以局部聚合为主（图中的对角线）。论文据此说明季节和趋势确实需要不同的混合方式。

### FMM：未来多预测器混合

PDM 输出 $X^L$ 后，每个尺度各配一个预测器，各自预测未来，再求和：

$$
\hat x_m = \mathrm{Predictor}_m(x^L_m),\quad m\in\{0,\dots,M\},\qquad \hat x = \sum_{m=0}^{M} \hat x_m
\tag{6}
$$

Predictor_m 先用**一层线性层**把长度 $\lfloor P/2^m\rfloor$ 的时间维直接回归到长度 $F$，再把 d_model 维的深层表示投影回 $C$ 个变量。

- 论文强调的是"集成互补的预测能力"：细尺度的预测更关注细节和季节，粗尺度的预测更关注宏观趋势（Figure 4 的可视化）。
- 附录 F.4 试过把求和换成平均。论文的说法是：这只差一个常数倍，深度模型很容易拟合这种常数倍，所以两者没有本质差别。训练损失是对集成后的结果算的，而不是对每个预测器单独算。

### 与"可分解"相关的两个设计事实

- 分解沿用 Autoformer 的移动平均季节-趋势分解；附录 F.2 试过 DFT 的高低频分解和 DFT 的季节-趋势分解，结果见"消融"一节。
- 论文只做了时间维的混合，没有做变量维混合（作者在局限里自述，见下文）。注意 FeedForward 在通道（d_model）维做交互，所以变量之间并非完全没有信息交换，但论文自己把它定位为"只做时间维混合"。`[解读]`
- 分解本身没有可学习参数（移动平均），可学习的部分是 Embed、各混合层、FeedForward 和预测器。`[解读]`
- `[待核实]` 官方代码里是否另有通道独立或归一化处理，论文正文没有交代，未核对。

## 训练与推理

训练设置（论文附录 A）：

- 损失：长期预测和 PEMS 用 L2（MSE）损失；M4 用 SMAPE（论文 Table 7）。
- 优化器：Adam（$\beta_1=0.9,\ \beta_2=0.999$）；初始学习率 $10^{-2}$ 或 $10^{-3}$（Table 7 中除 PEMS 为 $10^{-3}$ 外，其余为 $10^{-2}$）；batch size 在 8 到 128 之间。
- 实现：PyTorch，单卡 NVIDIA A100 80GB；所有实验重复三次取平均。
- 默认 2 个 PDM 块（$L=2$）；尺度数 $M$：长期预测取 3，短期预测取 1（序列短，多下采样意义不大）。
- 论文 Table 7 的部分配置（逐数据集 `M / 层数 / d_model`）：

数据集 | $M$ | $L$ | d_model
-- | -- | -- | --
ETTh1、ETTh2、ETTm1、Weather、Electricity | 3 | 2 | 16
ETTm2、Traffic | 3 | 2 | 32
Solar-Energy | 3 | 2 | 128
PEMS | 1 | 5 | 128
M4 | 1 | 4 | 32

上表已对照论文 Table 7 的渲染图核对。表中其余训练配置：batch size 在 ETT 和 Weather 上为 128，Electricity 和 Solar-Energy 为 32，Traffic 为 8，PEMS 为 32，M4 为 128；epoch 数在 ETT 和 PEMS 上为 10，Weather、Electricity、Solar-Energy、Traffic 为 20，M4 为 50。

推理：给定过去 $P$ 个点，按上面的流程前向一次，直接一次性输出未来 $F$ 个点（direct multi-step，非自回归）。`[解读]` 这是由 FMM 中每个预测器直接线性回归到长度 F 决定的。

## 实验与结论

以下数字均来自论文。

### 数据集与基线

- 长期预测 8 个数据集：ETT（ETTh1、ETTh2、ETTm1、ETTm2）、Weather、Solar-Energy、Electricity、Traffic，预测长度 {96, 192, 336, 720}。
- 短期预测：PEMS（PEMS03/04/07/08，预测长度 12）和 M4（6 个频率子集，预测长度在 6 到 48 之间）。
- 论文称共 18 个基准、15 个基线，包括 PatchTST、TimesNet、SCINet、Crossformer、MICN、FiLM、DLinear、LightTS、FEDformer、Stationary、Pyraformer、Autoformer、Informer、N-HiTS、N-BEATS。
- 公平性设置：主文把所有基线的输入长度对齐（长期预测输入固定为 96），结果为三次重复的平均；附录另做超参搜索，比较各模型的上界（搜索范围：输入长度 {96, 192, 336, 512}，学习率 $10^{-5}$ 到 0.05，层数 1 到 5，d_model 16 到 512，epoch 10 到 100）。
- N-BEATS 在论文里去掉了原始的集成，只比较纯预测模型。

### 长期预测（输入 96，四个预测长度平均）

数据集 | TimeMixer MSE / MAE | PatchTST MSE / MAE | TimesNet MSE / MAE
-- | -- | -- | --
Weather | 0.240 / 0.271 | 0.265 / 0.285 | 0.251 / 0.294
Solar-Energy | 0.216 / 0.280 | 0.287 / 0.333 | 0.403 / 0.374
Electricity | 0.182 / 0.272 | 0.216 / 0.318 | 0.193 / 0.304
Traffic | 0.484 / 0.297 | 0.529 / 0.341 | 0.620 / 0.336
ETTh1 | 0.447 / 0.440 | 0.516 / 0.484 | 0.495 / 0.450
ETTh2 | 0.364 / 0.395 | 0.391 / 0.411 | 0.414 / 0.427
ETTm1 | 0.381 / 0.395 | 0.406 / 0.407 | 0.400 / 0.406
ETTm2 | 0.275 / 0.323 | 0.290 / 0.334 | 0.291 / 0.333

论文的结论：TimeMixer 在所有长期预测基准上取得最优（Table 2），相对 PatchTST，Weather 的 MSE 降低 9.4%，Solar-Energy 降低 24.7%。

超参搜索设置下（附录 Table 14），相对 PatchTST 的优势变小：例如 Weather 平均 MSE 0.222 对 0.241，Solar-Energy 0.192 对 0.256，Electricity 0.156 对 0.159，Traffic 0.387 对 0.391，ETTh1 0.411 对 0.413，ETTm2 两者 MSE 都是 0.256（MAE 0.315 对 0.317）。论文自己也说，搜索设置下 TimeMixer 相对 PatchTST 的提升比统一设置下小，同时强调 TimeMixer 运行比 PatchTST 快得多。

### 短期预测

- **PEMS**（输入 96，预测 12）：TimeMixer 在四个子集上都最优。例如 PEMS04 的 MAE/MAPE/RMSE 为 19.21 / 12.53 / 30.92，次优 SCINet 的 MAE 为 20.35；PEMS03 的 MAE 为 14.63（SCINet 15.97，Crossformer 15.64）。论文认为 PEMS 变量间有复杂的时空相关，采用通道独立设计的 PatchTST、DLinear 在这里明显退化。
- **M4**（单变量）：加权平均 SMAPE / MASE / OWA 为 13.206 / 2.916 / 0.776，对比 TimesNet 13.387 / 2.996 / 0.786、N-HiTS 13.418 / 3.045 / 0.793、N-BEATS 13.436 / 3.043 / 0.794。论文称各频率子集上都是最优。

### 消融（论文 Table 5，M4 / PEMS04 / ETTm1 预测 336）

官方设计为表中 case ①。几个关键对照（数值取自渲染后的表格）：

设置 | M4 SMAPE / MASE / OWA | PEMS04 MAE / MAPE / RMSE | ETTm1 MSE / MAE
-- | -- | -- | --
① 官方设计 | 11.723 / 1.559 / 0.840 | 19.21 / 12.53 / 30.92 | 0.390 / 0.404
② 去掉 FMM，只用最细尺度单个预测器 | 12.503 / 1.634 / 0.925 | 21.67 / 13.45 / 34.89 | 0.402 / 0.415
③ 去掉季节混合 | 13.051 / 1.676 / 0.962 | 24.49 / 16.28 / 38.79 | 0.411 / 0.427
④ 去掉趋势混合 | 12.911 / 1.655 / 0.941 | 22.91 / 15.02 / 37.04 | 0.405 / 0.414
⑦ 两个混合方向都反过来 | 13.012 / 1.657 / 0.954 | 22.27 / 15.14 / 34.67 | 0.412 / 0.429
⑩ 不分解且不混合 | 12.468 / 1.671 / 0.916 | 24.87 / 16.66 / 39.48 | 0.405 / 0.412

论文的归纳：
- 去掉 FMM 明显变差，说明混合多尺度的未来预测有用。
- 季节混合和趋势混合缺一不可；季节和趋势用同一个方向（case ⑤ 全自顶向下、⑥ 全自底向上）不如官方的"季节自底向上、趋势自顶向下"，完全反向（⑦）下降尤其明显。
- 不做分解直接混合（⑧ 自底向上、⑨ 自顶向下）也都不如官方设计，说明需要分别处理季节和趋势。
- 附录 Table 22 的补充分析（论文文字）：尺度数更大、输入更长时，季节/趋势混合和 FMM 带来的相对提升更显著；季节混合方向的贡献在 ETTm1 输入 336 时比输入 96 时更明显，论文的解释是 15 分钟采样的 ETTm1 输入 96 只对应一天，输入 336 则有约 3.5 天（约 3.5 个周期），自底向上混合能获得更充足的细尺度季节信息。
- 论文还检验了替代的分解方式：DFT 的高低频分解不如官方的移动平均分解（Table 18：M4、PEMS04 更差，ETTm1 MSE 0.392 对 0.390、MAE 同为 0.404）；DFT 的季节-趋势分解在表里（Table 18）数值上略好于官方设计（如 M4 OWA 0.824 对 0.840，PEMS04 MAE 18.91 对 19.21），但论文最终仍使用移动平均分解，理由是移动平均足够简单、易用 PyTorch 实现，并能在性能和效率之间取得较好的平衡（附录 F.2）。

### 尺度数、层数与效率

- 尺度数 $M$（Figure 6，ETTm1）：预测长度越长，$M$ 增大带来的收益越大；短预测长度下收益递减。因此长期预测取 $M=3$，短期取 $M=1$。
- 层数 $L$（附录 Table 12）：整体上层数增加带来改善，论文取 $L=2$ 以兼顾效率和性能。
- 效率（附录 Table 8，ETTh1，batch size 16，训练阶段）：输入长度 3072 时，TimeMixer 占用 1411 MiB、每迭代 0.016 s，PatchTST 为 16119 MiB、0.094 s。输入长度 192 时，TimeMixer 为 1003 MiB、0.007 s，PatchTST 为 1919 MiB、0.018 s。DLinear 更轻（192 时 1001 MiB、0.002 s；3072 时 1239 MiB、0.015 s）。

## 优缺点与局限

论文自述（附录 J）：

- 输入变长时，线性混合层的参数量会增长（`[解读]` 时间维线性层的参数量与长度的乘积成正比，粗略为 $P^2$ 量级；例如最底层 96→48 的单层线性就有约 $96\times 48$ 个权重），对移动端等场景不够高效，计划探索基于注意力或 CNN 的替代混合设计；
- 只做了时间维混合，没有做变量维混合，计划后续加入；
- 只做了应用向的实验与消融，缺乏对设计最优性、完备性的理论分析。

`[经验]` 补充几点判断，非论文结论：

- 优点方面，结构简单（线性层加 GELU）、训练快，PDM 的"季节自底向上、趋势自顶向下"有可解释的先验，消融也支持它。
- 论文的主表固定输入长度为 96，和很多论文各自搜索输入长度的口径不同；在搜索设置下优势变小，所以在自己的数据上不要期待固定输入 96 时的优势幅度。
- 分解和池化都假设序列有一定的平滑和周期结构；对强噪声、非周期事件主导的序列，该先验未必有效。论文没有专门测试这类数据。`[待核实]`
- 论文只做点预测，没有概率预测。

## 与相关方法对比

方法 | 多尺度 | 分解 | 骨干 | 未来预测
-- | -- | -- | -- | --
TimeMixer | 平均池化的多尺度，PDM 混合 | 每个尺度做季节-趋势分解，季节和趋势方向相反地混合 | MLP | FMM：各尺度一个线性预测器，求和
DLinear | 无 | 输入先做季节-趋势分解 | 线性 | 线性层直接回归（论文在相关工作中的描述：分解作为线性回归的预处理）
N-HiTS | `[待核实]`（论文只把它作为基线） | 无 | MLP | `[待核实]`
PatchTST | 无（patch 化） | 无 | Transformer | 论文将它作为长期预测的 SOTA 基线
TimesNet | 无，按 FFT 周期折成 2D | 周期分量 | CNN | 论文把它当作多周期分析代表
Pyraformer / SCINet | 有（金字塔注意力 / 二叉下采样树） | 无 | 注意力 / 卷积 | 论文称其未来预测未同时利用多尺度信息

与 TSMixer（Google，arXiv:2303.06053）的区别：论文将它作为同期的 MLP 基线放在附录（Table 23 等，用其公开代码复现），并称 TimeMixer 仍优于它。`[解读]` `[待核实]` 两者都是 MLP；TSMixer 据我所知在时间维和特征维上交替混合（未对照其论文核实），而 TimeMixer 的混合发生在不同下采样尺度之间，并分别处理季节项和趋势项；论文自己说 TimeMixer 只做时间维混合。

与 N-BEATS 的关系：论文在相关工作中把 N-BEATS 放在"多周期分析"一类（用多个三角基函数拟合序列），并在 M4 上作为基线。

## 使用方式

论文声明源码在 GitHub：`https://github.com/kwuking/TimeMixer`（论文第 7 节 Reproducibility Statement）。`[待核实]` 其他库中是否有现成实现，未核对。

下面是按论文公式写的最小示意代码，只为说明结构，未运行验证，与官方实现的细节（归一化、嵌入方式、尺度间维度对齐等）不保证一致：

```python
# 示意代码，未运行验证
import torch, torch.nn as nn

class MLP(nn.Module):            # 两层线性 + GELU，作用在最后一维
    def __init__(self, i, o):
        super().__init__()
        self.net = nn.Sequential(nn.Linear(i, o), nn.GELU(), nn.Linear(o, o))
    def forward(self, x): return self.net(x)

class PDM(nn.Module):
    def __init__(self, P, M, d, decomp):
        super().__init__()
        n = [P // 2**m for m in range(M + 1)]
        self.decomp = decomp                                   # 移动平均分解
        self.up   = nn.ModuleList([MLP(n[m-1], n[m]) for m in range(1, M+1)])
        self.down = nn.ModuleList([MLP(n[m+1], n[m]) for m in range(M)])
        self.ff   = nn.Sequential(nn.Linear(d, d), nn.GELU(), nn.Linear(d, d))
    def forward(self, xs):                                     # xs[m]: (B, d, n_m)
        s, t = zip(*[self.decomp(x) for x in xs]); s, t = list(s), list(t)
        for m in range(1, len(xs)):                            # 季节：自底向上
            s[m] = s[m] + self.up[m-1](s[m-1])
        for m in range(len(xs) - 2, -1, -1):                   # 趋势：自顶向下
            t[m] = t[m] + self.down[m](t[m+1])
        return [x + self.ff((a + b).transpose(1, 2)).transpose(1, 2)
                for x, a, b in zip(xs, s, t)]

# FMM：每个尺度一个 Linear(n_m -> F)，再把 d 维投影回 C，最后各尺度相加
```

调参建议（`[经验]`，参考论文的敏感性分析）：长预测长度、长输入时可尝试 $M=3$；短序列用 $M=1$；$L$ 从 2 起；d_model 在 16 到 128 之间随数据集调。

## Reference

- 论文：[TimeMixer: Decomposable Multiscale Mixing for Time Series Forecasting](https://arxiv.org/abs/2405.14616)（ICLR 2024）
- 官方代码：[kwuking/TimeMixer](https://github.com/kwuking/TimeMixer)（论文第 7 节给出的地址，未另行访问核验）
- 相关：[TSMixer: An All-MLP Architecture for Time Series Forecasting](https://arxiv.org/abs/2303.06053)（论文参考文献中给出的编号）
- 站内：[时间序列总览](/0603_ML_Tasks_TimeSeries)、[深度学习预测](/0606_ML_Tasks_TimeSeries_Deep)


