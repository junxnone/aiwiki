---
Title | MO KD s
-- | --
Created @ | `2021-04-25T05:42:37Z`
Updated @| `2026-11-23T02:01:02Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/208)

---
# Distilling the Knowledge in a Neural Network

本文是 Hinton、Vinyals、Dean 的 *Distilling the Knowledge in a Neural Network*（arXiv:1503.02531，2015）的读书笔记：把大模型（或多个模型的集成）的"知识"迁移到一个小模型里，核心是用带温度的 softmax 产生"软目标"（Soft Target）去训练小模型。系列文章里的完整展开见 [响应蒸馏](/0689_MO_KD_Response)。

- `Soft Target` 比 `Hard Target` 包含更多的信息
  - 不同类之间的关系(相似性)

## Motivation
- 背景/存在的问题
  - 粗暴地使用one-hot编码丢失了类间和类内关于相似性的额外信息
- 做了什么尝试/分别有什么效果
  - 使用带温度的softmax函数
- 应用领域

## 原理
- Pipeline
  - Hard Traget ==> Teacher Model
  - Teacher Model ==> Soft Target(softmax output)
  - Soft Target ==> Student Model

下图是蒸馏的训练与推理流程：左边是训练好的大模型产生软目标，中间是小模型同时拟合软目标与硬标签，右边是蒸馏完成后小模型单独推理。

![image](https://user-images.githubusercontent.com/2216970/115983830-3bcff180-a5d6-11eb-9c70-c65eaa238853.png)

图中：

- 左侧"Big Model(s)"：训练好的大模型（可以是多个模型的集成），其 softmax 之前先**除以温度 $T$**，输出软目标 $s_i$（图中示例 $[0.1,0.6,\dots,0.1]$）；
- 中间"Small Model"：小模型，同一个输入 $x_i$ 走两条分支：一条同样"除以 $T$ 后做 softmax"，与软目标算交叉熵（权重 $\lambda$）；另一条用普通 softmax（$T=1$），与硬目标 $y_i$（one-hot，如 $[0,1,\dots,0]$）算交叉熵（权重 $1-\lambda$）；两项相加得到总损失（total loss）；
- 右侧：训练完成后，小模型在推理时只保留普通 softmax（$T=1$），输入 $x$ 直接得到预测；
- 要点：温度 $T$ 只在**训练**时使用；两条分支共享小模型的同一组 logits。

### 蒸馏温度 `T` 的影响

带温度的 softmax：

$$
q_i=\frac{\exp(z_i/T)}{\sum_{j}\exp(z_j/T)}
$$

其中：

- $z_i$：模型对第 $i$ 类输出的 logit（softmax 之前的值）；$q_i$：第 $i$ 类的概率；
- $T$：温度。$T=1$ 就是标准 softmax；$T>1$ 时概率分布更平缓；$T$ 越大，各类概率越接近。

原文中的公式图片（保留如下）：

公式 | ![image](https://user-images.githubusercontent.com/2216970/115982436-93b62a80-a5cd-11eb-9e43-b4144ae6ce14.png)
-- | --
T = 1 | 标准 Softmax 函数
T > 1 | T 越大概率趋向平缓 

表中：第一列是温度取值，第二列是它对应的效果；$T=1$ 对应标准 softmax，$T>1$ 时分布被"拉平"，小概率类别的相对大小更容易显现。

总损失（来自原论文第 2 节，笔记补充）是两个目标的加权平均：

$$
\mathcal L=\lambda\,T^{2}\,\mathrm{CE}\big(p^{t}(T),\,p^{s}(T)\big)+(1-\lambda)\,\mathrm{CE}\big(y,\,p^{s}(1)\big)
$$

其中：

- $p^t(T)$、$p^s(T)$：大模型（Teacher）和小模型（Student）在温度 $T$ 下的 softmax 输出，前者即软目标；$p^s(1)$ 是小模型在 $T=1$ 下的输出；
- $y$：真实的 one-hot 硬标签；$\mathrm{CE}$：交叉熵；
- $\lambda$：软目标项的权重（图中用 $\lambda$ 与 $1-\lambda$ 分配）；原论文发现给硬标签项**明显更低的权重**通常效果更好；
- $T^2$：由于软目标产生的梯度幅度按 $1/T^2$ 缩放，乘上 $T^2$ 后，改变温度时软、硬两项的相对贡献大致保持不变。

在高温下，蒸馏等价于让 Student 的 logits 逼近 Teacher 的 logits（logit 匹配），论文第 2.1 节有推导，详见 [响应蒸馏](/0689_MO_KD_Response)。

一个具体数值例子：输入 logits $x=[2,7,10]$ 时，不同温度下的输出如下。

T/Input  `x = [2,7,10]` | Output
-- | --
T=1 | [3.19450938e-04 4.74107229e-02 9.52269826e-01]
T=2 | [0.01475347 0.17973411 0.80551241]
T=3 | [0.04834092 0.25594054 0.69571853]
T=4 | [0.08417934 0.29381477 0.62200588]

表中：

- 第一列是温度，第二列是三个类别经过温度 softmax 之后的概率（三个数字之和为 1）；
- $T=1$ 时第一类只有约 0.0003，几乎为零；$T=4$ 时升到约 0.084，且与第二类（约 0.294）的相对关系变得可见；这就是"软目标"携带更多类间信息的原因。

下图用两组曲线对比温度的影响：左图 $T=1,2,3,4$，右图 $T=1,5,10,20$。

![image](https://user-images.githubusercontent.com/2216970/115983577-9f591f80-a5d4-11eb-8a0d-77bf289265b3.png) | ![image](https://user-images.githubusercontent.com/2216970/115983367-41780800-a5d3-11eb-901e-7a4920ab5b7e.png)
-- | --

图中：

- 每个小图对应一个温度 $T$（左图 $T=1,2,3,4$，右图 $T=1,5,10,20$），横轴是 logit 取值（约 −10 到 9），纵轴是经过 softmax 之后的概率 `[解读]`；
- $T=1$ 时曲线在 logit 较大处急剧上升，大部分位置接近 0；
- 随着 $T$ 增大，曲线越来越平缓，纵轴范围收窄（$T=20$ 时仅在约 0.03–0.08 之间），说明各类别概率趋于接近；
- 结论：温度越高，分布越"软"，输出之间的差异越小。

## Evaluation
- **Evaluation 1** 蒸馏网络可以达到和多模型预测类似的结果
- **Evaluation 2** 蒸馏网络可以用更少的数据集在测试数据集上达到更好的效果

两个评测均为论文在语音识别声学模型上的实验（帧分类准确率与词错误率 WER）。

Num | Evaluation
-- | --
1 | ![image](https://user-images.githubusercontent.com/2216970/115985082-bbf95580-a5dc-11eb-842e-bd8901b80bfd.png)
2 | ![image](https://user-images.githubusercontent.com/2216970/115985100-cf0c2580-a5dc-11eb-83fd-19c7a5e51452.png)

表中：

- 第 1 行（论文 Table 1）比较三个系统的测试帧准确率与词错误率 WER：Baseline 为 58.9% / 10.9%；10 个模型集成（10xEnsemble）为 61.1% / 10.7%；**蒸馏出的单个模型**为 60.8% / 10.7%——单个蒸馏模型的表现与 10 个模型平均预测的效果相当，而推理成本只有一个模型；
- 第 2 行（论文 Table 5）比较只用 3% 训练数据时的表现：Baseline（100% 数据）训练帧准确率 63.4%、测试帧准确率 58.9%；Baseline（3% 数据）为 67.3% / 44.5%（严重过拟合）；用软目标训练的模型（3% 数据）为 65.4% / 57.0%，其中软目标由全量数据训练的模型得到——说明软目标让模型能仅用 3% 的数据就泛化得很好；
- 两个表共同说明：软目标既能把集成的收益压进单个模型，也有很强的正则化作用。

## Tricks

- 温度 $T$ 与 $\lambda$ 都需要调；常见的 $T$ 取值为 2–4，但与任务和模型大小有关 `[经验]`；
- 软目标项记得乘 $T^2$（见上面的损失公式）；
- 更多的改进（匹配中间层、匹配关系、解耦 TCKD/NCKD 等）见 [特征蒸馏](/0690_MO_KD_Feature)、[关系蒸馏](/0691_MO_KD_Relation)、[响应蒸馏](/0689_MO_KD_Response)。

## Reference
- 2015-03  Distilling the Knowledge in a Neural Network [[Paper](https://arxiv.org/abs/1503.02531)] [[Code](codelink)]

