---
Title | ML Tasks Image OCR CTC
-- | --
Created @ | `2020-05-09T06:33:21Z`
Updated @| `2026-11-25T16:19:46Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/189)

---
# CTC

CTC（Connectionist Temporal Classification，联结主义时间分类，Graves 等，2006）解决的是**输入序列和输出标签序列之间没有逐帧对齐标注**时如何训练的问题。OCR 里，CNN 提取出的图像列特征序列长度（如 26 帧）和文字长度（如 5 个字符）并不相等，也没有人标注"第几列对应第几个字符"；语音识别里同样如此。CTC 通过引入"空白符"并对所有合法对齐路径求和，让网络不需要对齐标注就能端到端训练。典型用法见 [CRNN](0196_ML_Tasks_Image_OCR_CRNN)、[Sliding Convolutional](0188_ML_Tasks_Image_OCR_SW)。

## 基本概念

设输入序列 $x$ 经网络后得到 $T$ 帧输出，字符集为 $\mathcal{L}$，扩展字符集 $\mathcal{L}' = \mathcal{L} \cup \{\varepsilon\}$，其中 $\varepsilon$ 是空白符（blank）。网络每一帧输出一个 softmax 分布。

**路径与折叠**：一条路径 $\pi$ 是长度为 $T$ 的 $\mathcal{L}'$ 序列。折叠函数 $\mathcal{B}$ 先合并相邻重复字符、再删除所有空白符，得到最终标签序列：

- $\mathcal{B}(\text{aa}\varepsilon\text{bb}) = \text{ab}$
- $\mathcal{B}(\text{a}\varepsilon\text{ab}) = \text{aab}$（空白符把两个 a 隔开，因此重复字符得以保留）
- $\mathcal{B}(\varepsilon\text{a}\varepsilon\varepsilon\text{b}) = \text{ab}$

所以空白符有两个作用：一是表示"这一帧没有字符"，二是分隔本来就连续重复的字符（如 "hello" 中的 ll）。

## 概率与损失

$$
P(\pi \mid x) = \prod_{t=1}^{T} y^{t}_{\pi_t}
$$

$$
P(\mathbf{l} \mid x) = \sum_{\pi \in \mathcal{B}^{-1}(\mathbf{l})} P(\pi \mid x)
$$

$$
\mathcal{L}_{CTC} = -\ln P(\mathbf{l} \mid x)
$$

其中：

- $y^{t}_{k}$：第 $t$ 帧网络输出的 softmax 概率中，类别 $k$ 的概率，$t \in [1, T]$，$k \in \mathcal{L}'$
- $\pi_t$：路径 $\pi$ 在第 $t$ 帧的字符
- $P(\pi \mid x)$：假设各帧条件独立时，整条路径的概率（逐帧概率连乘）
- $\mathbf{l}$：目标标签序列（如 "cat"），长度 $|\mathbf{l}| \le T$
- $\mathcal{B}^{-1}(\mathbf{l})$：所有能折叠成 $\mathbf{l}$ 的路径集合，数量随 $T$ 指数增长，不能直接枚举
- $\mathcal{L}_{CTC}$：训练损失，最小化它等价于最大化目标序列的似然；直觉上就是"所有正确对齐方式的概率之和越大越好"

## 前向-后向算法

直接枚举 $\mathcal{B}^{-1}(\mathbf{l})$ 不可行，CTC 用动态规划求和。先在 $\mathbf{l}$ 的首尾和每两个字符之间插入空白符，得到扩展序列 $\mathbf{l}'$，长度 $|\mathbf{l}'| = 2|\mathbf{l}|+1$。定义前向变量 $\alpha_t(s)$ 为：前 $t$ 帧输出能折叠成 $\mathbf{l}$ 前缀并停在 $\mathbf{l}'_s$ 的所有路径概率之和。

$$
\alpha_t(s) =
\begin{cases}
\left(\alpha_{t-1}(s) + \alpha_{t-1}(s-1)\right) y^{t}_{\mathbf{l}'_s}, & \mathbf{l}'_s = \varepsilon \ \text{或}\ \mathbf{l}'_s = \mathbf{l}'_{s-2} \\
\left(\alpha_{t-1}(s) + \alpha_{t-1}(s-1) + \alpha_{t-1}(s-2)\right) y^{t}_{\mathbf{l}'_s}, & \text{其他}
\end{cases}
$$

初始化 $\alpha_1(1) = y^1_{\varepsilon}$，$\alpha_1(2) = y^1_{\mathbf{l}_1}$，其余为 0；最终

$$
P(\mathbf{l} \mid x) = \alpha_T(|\mathbf{l}'|) + \alpha_T(|\mathbf{l}'|-1)
$$

其中：

- $s$：扩展序列 $\mathbf{l}'$ 中的位置下标，从 1 开始
- $\alpha_{t-1}(s)$：停留在同一个符号（重复输出当前符号）
- $\alpha_{t-1}(s-1)$：从前一个符号转移过来
- $\alpha_{t-1}(s-2)$：跳过中间的空白符直接转移；仅当 $\mathbf{l}'_s$ 不是空白符且与 $\mathbf{l}'_{s-2}$ 不同时才允许（否则折叠时会把两个相同字符合并掉）
- 最后一项相加表示路径可以结束在最后一个字符或最后一个空白符上

后向变量 $\beta_t(s)$ 对称定义，两者相乘可得到梯度。实际实现都在 log 域做，避免连乘下溢；复杂度为 $O(T \cdot |\mathbf{l}'|)$。

## 解码

推理时没有目标序列，需要从每帧概率分布中解出最可能的标签序列：

- **Greedy Search（贪心）**：每帧取 argmax，再做 $\mathcal{B}$ 折叠。速度最快，但不一定是概率最大的标签序列（因为多条路径可能折叠成同一序列）。
- **Beam Search（束搜索）**：保留 $B$ 个最优前缀，逐帧扩展，并把折叠后相同的前缀概率合并（prefix beam search）。结果更好，是接入 Lexicon 或语言模型的基础，见 [OCR Lexicon](0198_ML_Tasks_Image_OCR_Lexicon)。

## 特点与局限

- 优点：不需要字符级对齐标注，并行解码、速度快。
- 条件独立假设：各帧输出互相独立，没有显式的字符间上下文依赖（BiLSTM 可部分弥补），这是 Attention/Seq2Seq 识别路线的改进动机之一。
- 要求 $T \ge |\mathbf{l}|$（遇到重复字符时需要 $T \ge |\mathbf{l}| + \text{重复次数}$），因此特征图宽度要足够。
- 输出有"尖峰"现象：网络倾向在少数帧高置信输出字符，其余帧输出空白符。

## PyTorch 使用

现代 PyTorch 已内置 `torch.nn.CTCLoss`，不再需要自己编译 warp-ctc：

```python
import torch.nn as nn
ctc = nn.CTCLoss(blank=0, zero_infinity=True)
# log_probs: (T, N, C) 已做 log_softmax; targets: (N, S) 或拼接的一维
# input_lengths: (N,) 每个样本的 T; target_lengths: (N,) 每个样本的标签长度
loss = ctc(log_probs, targets, input_lengths, target_lengths)
```

其中 `blank=0` 指定空白符的类别下标，`zero_infinity=True` 会把无解（$T$ 太短）导致的无穷大损失置零，避免训练发散。

## Install warp-ctc

早期（2020 年前后）PyTorch 没有稳定的 CTC 实现，需要自己编译 warp-ctc：

```
git clone https://github.com/SeanNaren/warp-ctc.git
cd warp-ctc
mkdir build; cd build
cmake ..
make warpctc
../pytorch_binding/
python setup.py install
```

## Reference

- [Sequence Modeling With CTC](https://distill.pub/2017/ctc/)
- [paper - 2006 - Connectionist temporal classification: Labelling unsegmented sequence data with recurrent neural networks.](http://people.idsia.ch/~santiago/papers/icml2006.pdf)
- [paper - 2014 - First-Pass Large Vocabulary Continuous Speech Recognition using Bi-Directional Recurrent DNNs](https://arxiv.org/pdf/1408.2873.pdf)
- [CTC算法详解](https://www.jianshu.com/p/0cca89f64987)
- [论文笔记：Connectionist Temporal Classification: Labelling Unsegmented Sequence](https://blog.csdn.net/w5688414/article/details/77855262)
- [谁给讲讲语音识别中的CTC方法的基本原理？](https://www.zhihu.com/question/47642307)
- [详解CTC](https://zhuanlan.zhihu.com/p/42719047)
- [warp-ctc - pytorch - Github](https://github.com/SeanNaren/warp-ctc)  ---- [Baidu - Warp-CTC](https://github.com/baidu-research/warp-ctc)
- [CCTC](https://github.com/tmbarchive/cctc)
- [深度学习-CTC算法原理](http://xiaofengshi.com/2019/02/14/%E6%B7%B1%E5%BA%A6%E5%AD%A6%E4%B9%A0-CTC%E7%AE%97%E6%B3%95%E5%8E%9F%E7%90%86/)
- [OCR之ctc资源汇总](https://zhuanlan.zhihu.com/p/145427498)
- [How to build e2e recognition system - CTC loss](https://docs.google.com/presentation/d/12gYcPft9_4cxk2AD6Z6ZlJNa3wvZCW1ms31nhq51vMk/pub?start=false&loop=false&delayms=3000&slide=id.g24e9f0de4f_0_332)

