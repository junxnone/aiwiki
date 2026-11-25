---
Title | ML Tasks Image OCR Calamari Voting
-- | --
Created @ | `2020-06-09T06:29:36Z`
Updated @| `2026-11-25T16:38:29Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/202)

---
# Calamari Voting

Voting（投票）是 [Calamari](0201_ML_Tasks_Image_OCR_Calamari) 里把**多个识别模型的输出融合**成一个结果的方法。动机很直接：用交叉折叠训练（Cross Fold Training）会得到 N 个在不同数据子集上训练出的模型，它们各自会犯不同的错误，对同一行文字让它们"投票"，一般比任何单个模型都准。投票发生在**字符级别、按文本行**进行：先把各模型输出的字符串对齐，再对每个对齐位置选出最合适的字符。总览见 [OCR](0200_ML_Tasks_Image_OCR)；对齐与评价所用的工具见 ISRI 的 [ocreval](https://github.com/eddieantonio/ocreval)。

## Confidence Voter

Confidence Voter 利用每个模型对每个字符给出的置信度来投票。先看输入、步骤和输出：

Num | Steps
-- | --
Input | 1 - 每个模型输出的字符序列（Char List）<br/>2 - 每个位置的候选字符 `Alternatives` 及其概率
1 | [synchronize](https://github.com/Calamari-OCR/calamari/blob/715ebcdd8672c72c39a533a49f01d4eb1b36a760/calamari_ocr/ocr/text_processing/text_synchronizer.py#L50)：对各模型输出的字符串做对齐（alignment），找出彼此匹配的相同子串 `substr`
2 | 统计各匹配子串的**长度频率**，返回出现频率最大的那个长度对应的 voters
3 | 对每个对齐位置，累加各候选字符（`alternatives`）的置信度，取总置信度最大的字符
Output | Voting Sequence（投票后的字符序列）

表中第一列是编号，第二列是该步骤的内容。整个流程是先对齐、再逐位置投票：第 1 步解决"不同模型输出长度不同，哪个字符对应哪个字符"的问题；第 2 步用长度频率剔除少数对不齐的异常输出；第 3 步对每个位置给出最终字符。

## 两种投票规则

下面用同一个例子说明区别：设有 3 个模型（voter）读同一个字符 $x$，各自给出候选 `l`、`I`、`L` 的置信度（每行是一个模型的输出，每列是一个候选字符）：

模型 | `l` | `I` | `L`
-- | -- | -- | --
voter 1 | 0.45 | 0.50 | 0.05
voter 2 | 0.40 | 0.55 | 0.05
voter 3 | 0.60 | 0.30 | 0.10

表中数字是示意值，用来说明规则差异（不是实验数据）。

- **Single（单个最大值 + 频率）**：每个模型先各自取置信度最大的候选，然后看哪个字符被选的次数多。voter 1、voter 2 选 `I`，voter 3 选 `l`，`I` 得 2 票，结果是 `I`。
- **Adding（置信度相加）**：把每个候选在各模型上的置信度相加，取总和最大的。`l`：$0.45+0.40+0.60 = 1.45$；`I`：$0.50+0.55+0.30 = 1.35$；`L`：$0.20$。结果是 `l`。

设第 $k$ 个模型对候选字符 $c$ 的置信度为 $p_k(c)$，Adding 规则可写为：

$$
\hat{c} = \arg\max_{c} \sum_{k=1}^{N} p_k(c)
$$

其中：

- $N$：参与投票的模型数（交叉折叠训练里常取 5）
- $c$：该位置的候选字符；$p_k(c)$：第 $k$ 个模型认为该位置是 $c$ 的置信度
- $\hat{c}$：投票结果；直觉上，Adding 让"每个模型都有点倾向"的字符胜过"少数模型很自信、其他模型不认同"的字符，对单个模型的过度自信更稳健

两种规则在上面的例子里给出了不同的结果，这说明规则选择会影响最终文本；在实践中应在验证集上比较。

## Sequence Voter

Sequence Voter 是 Calamari 里的另一种投票实现，对应序列（整行文本）层面的投票；原笔记没有展开它的细节，具体行为以 Calamari 源码为准（待补充）。

## 代码对应

Calamari 的 voting 目录里有三种实现：

- `sequence_voter`：序列级投票
- `confidence_voter_default_ctc`：基于 CTC 输出置信度的投票（默认）
- `confidence_voter_fuzzy_ctc`：模糊版本的置信度投票，原作者笔记里标注"没用到"，细节待查

## Reference

- [ISRI analytic tools for alignment and voting - ocreval](https://github.com/eddieantonio/ocreval)
- [Calamari-OCR Voting](https://github.com/Calamari-OCR/calamari/tree/master/calamari_ocr/ocr/voting)
- [paper - 2017 - Improving OCR Accuracy on Early Printed Books by utilizing Cross Fold Training and Voting](https://arxiv.org/pdf/1711.09670.pdf)

