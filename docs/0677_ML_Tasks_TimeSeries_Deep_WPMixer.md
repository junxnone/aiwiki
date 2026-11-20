---
Title | ML Tasks TimeSeries Deep WPMixer
-- | --
Created @ | `2026-11-20T09:15:03Z`
Updated @| `2026-11-20T09:15:03Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/677)

---
# WPMixer

WPMixer（Wavelet Patch Mixer）出自论文 *WPMixer: Efficient Multi-Resolution Mixing for Long-Term Time Series Forecasting*（Md Mahmuddun Nabi Murad、Mehmet Aktukmak、Yasin Yilmaz，AAAI 2025，arXiv:2412.17176）。它是一个基于 MLP-Mixer 的长期预测模型，结合三个要素：**多级小波分解**（同时利用时域与频域信息）、**分块与嵌入**（捕获局部信息、降低计算量）、**MLP 混合**（捕获全局信息）。

**一句话概括：先用多级离散小波变换把序列拆成 1 条近似系数序列和 $m$ 条细节系数序列，每条系数序列走各自独立的"分辨率分支"（RevIN → 分块嵌入 → Patch Mixer + Embedding Mixer → 预测头 → 反归一化），最后用小波逆变换重构出预测序列。**

> 标注约定：未标注的内容来自论文原文；`[解读]` 是对论文的理解，`[经验]` 是一般经验，`[待核实]` 是未能确认的内容。

本站相关：同属 MLP-Mixer 路线的 [TSMixer](/0632_ML_Tasks_TimeSeries_Deep_TSMixer)、[TimeMixer](/0633_ML_Tasks_TimeSeries_Deep_TimeMixer)；分块思想来自 [PatchTST](/0638_ML_Tasks_TimeSeries_Deep_PatchTST)；同样用频域/小波思想的 [FEDformer](/0637_ML_Tasks_TimeSeries_Deep_FEDformer)、[FiLM](/0676_ML_Tasks_TimeSeries_Deep_FiLM)；总览见 [深度学习方法](/0606_ML_Tasks_TimeSeries_Deep)。

## 1. 解决什么问题

论文对 MLP-Mixer 类前作的不足做了如下判断：

- **TSMixer** 在时间维和通道维直接混合，回看窗口变长后计算量很大；
- **TimeMixer** 用移动平均把多尺度序列分解成季节项与趋势项再混合，但复杂季节性下这种分解不够用，跨尺度混合可能丢失信息，且难以解释真实数据里的突刺与骤降；
- 只在时域提取信息不足以刻画复杂的时间序列；
- **SWformer** 用小波变换提取时频信息，但需要多级小波才能发挥全部能力。

WPMixer 的对策：用多级小波分解同时获得时频信息，每条系数序列用**独立的分支**处理，避免不同分辨率的信息互相混合造成损失；分块降低计算量；并在每个 Patch Mixer 之后接一个 Embedding Mixer 增强效果。

## 2. 问题定义

给定回看窗口内的多变量序列，预测未来一段：

$$
X_L=\{x_{t-L+1},\dots,x_{t}\}\in\mathbb R^{C\times L},\qquad X_T=\{x_{t+1},\dots,x_{t+T}\}
$$

其中：

- $x_t\in\mathbb R^{1\times C}$：时刻 $t$ 的多变量数据点；
- $C$：变量（通道）数；
- $L$：回看窗口长度；$T$：预测长度（实验取 96、192、336、720）；
- 模型学习从 $X_L$ 到预测 $\hat X_T$ 的映射。

## 3. 模型结构

### 3.1 整体流程

下图概括 WPMixer 的 $m$ 级小波分解及其分支结构。

```
输入 X_L ∈ R^{C×L}
   │ RevIN 归一化
   ▼
多级离散小波分解（m 级，小波类型 ω）
   ├── X_A_m   （最后一级近似系数）
   ├── X_D_m   （第 m 级细节系数）
   ├── ...
   └── X_D_1   （第 1 级细节系数）
   │  共 m+1 条系数序列，各走一条独立分支：
   ▼
 ┌─ 分辨率分支 i ───────────────────────────────┐
 │ RevIN 归一化 → 分块 + 嵌入 → [Patch Mixer →   │
 │ Embedding Mixer] × 若干个 → 展平 + 线性预测头 │
 │ → RevIN 反归一化                              │
 └──────────────────────────────────────────────┘
   ▼  得到预测系数 Y_A_m, Y_D_m, ..., Y_D_1
多级小波重构
   │ RevIN 反归一化
   ▼
预测 X̂_T
```

图中：

- 外层 RevIN 在分解前归一化、重构后反归一化；每条系数序列的分支内部还有各自的 RevIN；
- $X_{A_i}$、$X_{D_i}$ 分别是第 $i$ 级的近似系数与细节系数序列；$Y_{A_i}$、$Y_{D_i}$ 是对应的预测系数序列；
- 分支总数为 $m+1$：$m$ 条细节序列加 1 条（最后一级的）近似序列；
- 每个分支只处理自己的系数序列，**不同分辨率之间不做混合**，这是与 TimeMixer 的关键差别；
- 最后用预测出的各条系数序列做小波逆变换，得到时域预测。

### 3.2 实例归一化

时间序列的均值与方差随时间变化，论文采用带可学习仿射参数的可逆实例归一化 RevIN（Kim 等 2021）：在分解前归一化、重构后反归一化，同时在每条小波系数序列上也做一次归一化与反归一化。

### 3.3 多级小波分解

用多级离散小波变换（Mallat 1989）迭代地用高通与低通滤波器提取系数：高通输出是**细节系数**（高频信息），低通输出是**近似系数**（低频信息）；每一级把上一级的近似系数再拆成新的近似与细节系数。形式上：

$$
\{X_{A_m},X_{D_m},X_{D_{m-1}},\dots,X_{D_1}\}=\mathrm{DWT}(X_L;\,m,\,\omega)
$$

其中：

- $m$：分解级数；$\omega$：小波类型（实验在 Daubechies、Symlets、Coiflets、Biorthogonal 族中搜索）；
- $X_{A_i}\in\mathbb R^{C\times L_i}$、$X_{D_i}\in\mathbb R^{C\times L_i}$：第 $i$ 级的近似/细节系数序列；
- $L_i$：第 $i$ 级系数序列的长度，随级数增加而变短；
- 为避免冗余，只保留**最后一级**的近似系数，丢弃 1 到 $m-1$ 级的近似系数（它们已被进一步分解），但所有级的细节系数都保留；
- 级数越高，近似系数覆盖的频率范围越窄，但高级别系数不一定对预测有用，且不同小波在时频局部化上各有取舍，所以 $m$ 与小波类型都是需要搜索的超参数。

### 3.4 分块与嵌入

记任一系数序列为 $X_{W_i}$（近似或细节）。对每个变量的单变量序列 $X^{(j)}_{W_i}\in\mathbb R^{1\times L_i}$，仿照 PatchTST 切成有重叠的块：块长 $P$，步长 $S$。切块前在序列末尾重复填充 $S$ 个最后一个值。得到块序列：

$$
X^{(j)}_{P_i}\in\mathbb R^{1\times N_i\times P},\qquad N_i=\left\lfloor\frac{L_i-P}{S}\right\rfloor+2
$$

其中：

- $P$：块长度；$S$：步长（相邻块不重叠的部分）；
- $N_i$：第 $i$ 条系数序列的块数，末尾的"+2"包含了填充带来的额外块 `[解读]`；
- $j=1,\dots,C$：变量编号。

然后用在所有变量间共享的线性层把每个块嵌入到 $d$ 维，得到 $X_{d_i}\in\mathbb R^{C\times N_i\times d}$。

### 3.5 Mixer 模块：Patch Mixer 与 Embedding Mixer

每个 Mixer 模块由 Patch Mixer 加一个紧随其后的 Embedding Mixer 构成。

**Patch Mixer**（类似 MLP-Mixer 的 token mixing，沿块维度混合）：先做 2D 批归一化并置换维度，再过两个线性层夹 GELU，第一层把维度放大 $t_f$ 倍，第二层还原：

$$
X'_{d_i}=\mathcal P\!\left(L_2\!\left(\mathcal G\!\left(L_1\!\left(\mathcal P\!\left(\mathrm{BN}(X_{d_i})\right)\right)\right)\right)\right)
$$

其中：

- $\mathrm{BN}(\cdot)$：2D 批归一化；$\mathcal P(\cdot)$：维度置换（把块维度换到最后以便线性层作用其上，混合后再换回）；$\mathcal G(\cdot)$：GELU 激活；
- $L_1:\mathbb R^{d\times C\times N_i}\to\mathbb R^{d\times C\times N_i t_f}$、$L_2:\mathbb R^{d\times C\times N_i t_f}\to\mathbb R^{d\times C\times N_i}$：先放大再还原的两层线性层；
- $t_f$：Patch Mixer 的扩张因子；
- 该式是对论文文字描述的整理，残差连接等细节以论文为准 `[待核实]`。

**Embedding Mixer**（沿嵌入维度混合）：先置换维度并做 2D 批归一化，再过两个夹 GELU 的线性层，第一层把嵌入维度 $d$ 放大 $d_f$ 倍，第二层还原；与 Patch Mixer 不同的是它带有**残差连接**：

$$
Y_{d_i}=X'_{d_i}+L_4\!\left(\mathcal G\!\left(L_3\!\left(\mathrm{BN}(X'_{d_i})\right)\right)\right)
$$

其中：

- $L_3:\mathbb R^{d}\to\mathbb R^{d\cdot d_f}$、$L_4:\mathbb R^{d\cdot d_f}\to\mathbb R^{d}$：嵌入维度上的两层线性层；
- $d_f$：Embedding Mixer 的扩张因子；
- 论文指出：Patch Mixer 把局部信息聚合成全局上下文，Embedding Mixer 则在更高维空间里进一步捕获全局信息。

### 3.6 预测头与重构

预测头把 $Y_{d_i}\in\mathbb R^{C\times N_i\times d}$ 的后两维展平，再用线性层映射到该系数序列的预测长度 $T_i$：

$$
Y_{W_i}=\mathrm{Linear}\big(\mathrm{Flatten}(Y_{d_i})\big)\in\mathbb R^{C\times T_i}
$$

其中：

- $T_i$：第 $i$ 条预测系数序列的长度；初始化模型时，把一条与预测序列同样长度的辅助序列送入分解模块，其各系数序列的长度就是 $T_i$；
- $Y_{W_i}$：即 $Y_{A_m}$ 或 $Y_{D_i}$。

重构模块用小波逆变换把预测系数合成时域序列：

$$
Y=\mathrm{IDWT}\big(Y_{A_m},Y_{D_m},\dots,Y_{D_1};\,\omega\big)\in\mathbb R^{C\times T}
$$

其中：$Y_{A_m}$、$Y_{D_i}\in\mathbb R^{C\times T_i}$ 是各分支预测出的近似/细节系数；$Y$ 经 RevIN 反归一化并转置后即最终预测 $\hat X_T\in\mathbb R^{T\times C}$。

### 3.7 训练

- 损失函数使用 SmoothL1（默认阈值），评测用 MSE 与 MAE；论文的消融表明 SmoothL1 优于 MSE；
- Embedding 与 Mixer 模块使用各自独立的 dropout；
- 用 Optuna（默认 TPE）搜索超参数，包括回看窗口、小波类型与级数等。

## 4. 与相关模型的对比

| 对比项 | WPMixer | TimeMixer | TSMixer |
| --- | --- | --- | --- |
| 分解方式 | 多级小波分解 | 移动平均的季节/趋势分解 | 无 |
| 信息域 | 时域 + 频域 | 仅时域 | 仅时域 |
| 混合方式 | 各分辨率分支独立，分支内 Patch Mixer + Embedding Mixer | 多尺度之间混合 | 时间混合 + 通道混合 |

表中：

- 第一列为对比维度，后三列为三个模型在该维度上的做法（依据论文第 3 节的比较段落整理）；
- 关键差别：WPMixer 的分解与重构只在模型首尾各做一次，避免了 FEDformer 那样在时域与频域之间反复转换，同时多级小波比单级小波（SWformer）更有效、比多小波（multi-wavelet）计算更省。

## 5. 实验与结论

- **数据集**：ETTh1、ETTh2、ETTm1、ETTm2、Weather、Electricity、Traffic 七个；基线包括 TimeMixer、TSMixer、TimesNet、FiLM、DLinear、PatchTST、Crossformer；
- **设置一**（各数据集分别调回看窗口，在 96/192/336/512/1024/1200 中选）：论文报告相对 TimeMixer，ETTh1/ETTh2/ETTm1/ETTm2 的平均 MSE 分别降低 7.8%、2.2%、3.4%、3.9%，MAE 分别降低 3.3%、6.4%、0.5%、2.5%；Weather 与 Traffic 的平均 MSE/MAE 也更低；Electricity 上仅次于 TimeMixer；
- **设置二**（沿用 TimeMixer 的统一设置）：在 ETT 与 Electricity 上平均 MSE/MAE 低于 TimeMixer；
- **计算量**：在 ETTh1、$d=16$ 的统一设置下，WPMixer 的 GFLOPs 在所有预测长度上都不到 TimeMixer 的十分之一；
- **鲁棒性**：三个随机种子下，各数据集的标准差都低于 TimeMixer；
- **模块消融**（十四种组合，Table 5）：分解、分块、嵌入、Patch Mixer、Embedding Mixer、预测头各模块都对结果有贡献；
- **分解级数**：最佳 $m$ 随预测长度与数据集而变，因此作为超参数搜索（固定其他参数下比较了 $m=1\sim5$）。

## 6. 总结 [解读]

- WPMixer 的亮点是用"小波分解 + 独立分辨率分支"替代 TimeMixer 的移动平均分解与跨尺度混合，从而在保留各频带信息的同时降低计算量；
- 局限：小波类型与分解级数需要逐数据集搜索；具体数值与实验设置请以论文为准。

## Reference

- Murad M M N, Aktukmak M, Yilmaz Y. WPMixer: Efficient Multi-Resolution Mixing for Long-Term Time Series Forecasting. AAAI 2025. arXiv:2412.17176
- Wang S 等. TimeMixer: Decomposable Multiscale Mixing for Time Series Forecasting. ICLR 2024.
- Chen S-A 等. TSMixer: An All-MLP Architecture for Time Series Forecasting. 2023.
- Nie Y 等. A Time Series is Worth 64 Words: Long-term Forecasting with Transformers (PatchTST). ICLR 2023.
- Tolstikhin I 等. MLP-Mixer: An all-MLP Architecture for Vision. NeurIPS 2021.

