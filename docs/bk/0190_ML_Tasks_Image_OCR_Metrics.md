-----

| Title     | ML Tasks Image OCR Metrics                            |
| --------- | ----------------------------------------------------- |
| Created @ | `2020-05-18T02:05:31Z`                                |
| Updated @ | `2026-11-25T16:16:37Z`                                |
| Labels    | \`\`                                                  |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/190) |

-----

# Metrics

OCR 的评测分两类：**检测**看框画得准不准（IoU +
Precision/Recall/F-measure），**识别**看文字读得对不对（编辑距离及其衍生的
CER/WER、准确率）。端到端（Text Spotting）则要求框和文字同时正确。

## 编辑距离

编辑距离（Levenshtein Distance）是把序列 $a$ 变成序列 $b$ 所需的最少单字符编辑次数（替换、删除、插入各算 1
次）。用动态规划求解：

$$ d(i,j) = \\min \\begin{cases} d(i-1,,j) + 1   
d(i,,j-1) + 1   
d(i-1,,j-1) + \\mathbb{1}\[a\_i \\ne b\_j\] \\end{cases} $$

其中：

  - $d(i,j)$：$a$ 的前 $i$ 个字符变成 $b$ 的前 $j$ 个字符的最小编辑次数，边界
    $d(i,0)=i$，$d(0,j)=j$
  - 三项依次对应：删除 $a\_i$、插入 $b\_j$、替换（或相等时不花费）
  - $\\mathbb{1}\[a\_i \\ne b\_j\]$：指示函数，两字符不同取 1，相同取 0
  - 最终编辑距离 $\\mathrm{ed}(a,b) = d(|a|,|b|)$

## Character Level

### CER - Character Error Rate

字符错误率，衡量识别结果和参考文本在字符层面的差异。有两种常见写法：

**Calamari 写法**（归一化到 $\[0,1\]$）：

$$ \\mathrm{CER} = \\frac{\\mathrm{ed}(s\_1, s\_2)}{\\max(|s\_1|,
|s\_2|)} $$

**ASR/通用写法**：

$$ \\mathrm{CER} = \\frac{S + D + I}{N} $$

其中：

  - $s\_1, s\_2$：参考序列和识别序列；$|s|$ 为序列长度；分母取两者长度最大值，因此取值落在 $\[0, 1\]$
  - $S$（substitution）：替换的字符数
  - $D$（deletion）：删除（漏识别）的字符数
  - $I$（insertion）：插入（多识别）的字符数
  - $N$：参考序列的字符总数；因为分母只有参考长度，当插入很多时取值可以大于 1，范围为 $\[0, +\\infty)$

例：参考 `kitten`，识别结果 `sitting`：$k \\to s$（替换）、$e \\to i$（替换）、末尾多一个
`g`（插入），即 $S=2, D=0, I=1$，$N=6$，通用写法 $\\mathrm{CER} = 3/6 =
0.5$；Calamari 写法分母为 $\\max(6,7)=7$，$\\mathrm{CER} \\approx
0.43$。可见两种写法数值不同，对比不同论文的结果时必须先确认定义。

### WER - Word Error Rate

词错误率，公式与 CER 相同，只是把"字符"换成"词"作为编辑的基本单位：

$$ \\mathrm{WER} = \\frac{S\_w + D\_w + I\_w}{N\_w} $$

其中 $S\_w, D\_w, I\_w$ 为词级别的替换、删除、插入数，$N\_w$ 为参考文本的词数。

例：参考 `the cat sat on the mat`（6 词），识别 `the cat sit on mat`：`sat→sit` 替换
1 次，漏掉一个 `the` 删除 1 次，$\\mathrm{WER} = 2/6 \\approx 0.33$。

CER/WER 越小越好；中文没有天然的词边界，通常只报告 CER。

## Sequence Level

  - **Word/Sequence Accuracy**：整个词（或整行）完全一致才算对，是场景文本识别（IIIT5K、SVT
    等）论文里最常用的指标，比 CER 严格。
  - **Normalized Edit Distance (NED)**：常以 $1 - \\mathrm{NED}$ 报告，其中
    $\\mathrm{NED} = \\mathrm{ed}(s\_1, s\_2) /
    \\max(|s\_1|,|s\_2|)$，即上面 Calamari 写法的 CER，对长文本更宽容。

## Detection Metrics

检测以预测框与真值框的重叠度判断是否命中：

$$ \\mathrm{IoU} = \\frac{|A \\cap B|}{|A \\cup B|} $$

$$ P = \\frac{TP}{TP + FP}, \\quad R = \\frac{TP}{TP + FN}, \\quad F =
\\frac{2PR}{P + R} $$

其中：

  - $A, B$：预测框和真值框（可以是矩形、旋转框或任意多边形）的区域，$|\\cdot|$ 表示面积；$\\mathrm{IoU}
    \\in \[0,1\]$
  - $TP$：与某个真值 IoU 达到阈值（ICDAR 系列常取
    0.5）的预测框数；$FP$：没有匹配上的预测框（误检）；$FN$：没有被任何预测框命中的真值（漏检）
  - $P$（Precision，精确率）：预测框中有多少是对的；$R$（Recall，召回率）：真值框中有多少被找到；$F$（F-measure/Hmean）：二者的调和平均，是检测榜单的主指标

对弯曲、密集文本，单纯 IoU 阈值不够精细，ICDAR 另外提出了 TIoU 等更严格的指标，见 Reference。

## Reference

  - [文本检测TIoU--metric](https://zhuanlan.zhihu.com/p/63541543)
  - [The ISRI analytic tools for OCR
    evaluation](https://github.com/eddieantonio/ocreval)
  - [International Conference on Document Analysis and Recognition -
    ICDAR](http://icdar2019.org/)
