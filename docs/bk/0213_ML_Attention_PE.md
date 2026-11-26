-----

| Title     | ML Attention PE                                       |
| --------- | ----------------------------------------------------- |
| Created @ | `2021-01-29T09:56:40Z`                                |
| Updated @ | `2026-11-26T09:28:28Z`                                |
| Labels    | `index`                                               |
| Edit @    | [here](https://github.com/junxnone/aiwiki/issues/213) |

-----

# Position Encoding

Transformer 的自注意力对词序**不敏感**（打乱输入顺序，输出也只是相应打乱），所以需要把位置信息显式地加到输入里，这就是位置编码。

  - 相近的位置拥有相近的位置编码向量
  - 相对位置的 位置编码向量可以通过线性变换获取

| Positional Encoding                                          |
| :----------------------------------------------------------- |
| ![image](media/644531895f6c8724a60111083eb831ae03ce9f08.png) |
| ![image](media/095f93058dc9532f30cd1ef2e86330a8286e5ac9.png) |

表中：以上两图为原文档附带的位置编码示意图，对应下面的正弦位置编码。

-----

  - 方式1 - Pos = `0,1,2,3....T-1`
      - 大数值 `T-1` 对模型干扰
  - 方式2 - Pos = `pos/(T-1)` = `[0,1]`
      - 不同长度的文本步长不同
  - 方式3 - Pos = `sin(pos/α)`
      - 仅关注一定范围内的相对次序关系

## 正弦位置编码

方式 3 的改进版：对每个位置使用多个不同频率的正弦、余弦：

$$
PE\_{(pos,,2i)}=\\sin\!\\left(\\frac{pos}{10000^{2i/d}}\\right),\\qquad
PE\_{(pos,,2i+1)}=\\cos\!\\left(\\frac{pos}{10000^{2i/d}}\\right) $$

其中：

  - $pos$：词在序列中的位置（从 0 开始）；$d$：嵌入维度
  - $i$：维度对的下标，$0\\le i\<d/2$；偶数维用 $\\sin$，奇数维用 $\\cos$
  - $10000^{2i/d}$：该维度对的波长因子，$i$ 越大频率越低（波长越长），形成从高频到低频的一组「刻度」
  - 效果：不同位置得到不同向量；同时因为包含多种频率，既能区分近处位置，又不会因序列变长而重复

相对位置的线性性质（对应上面的「相对位置的编码可由线性变换获取」）：

$$ \\begin{bmatrix}\\sin\\omega(pos+k)\\
\\cos\\omega(pos+k)\\end{bmatrix}=\\begin{bmatrix}\\cos\\omega
k&\\sin\\omega k-\\sin\\omega k&\\cos\\omega
k\\end{bmatrix}\\begin{bmatrix}\\sin\\omega pos\\ \\cos\\omega
pos\\end{bmatrix} $$

其中：

  - $\\omega=1/10000^{2i/d}$：该维度对的角频率；$k$：位置偏移量
  - 右侧矩阵是只依赖 $k$ 的旋转矩阵，所以 $pos+k$ 处的编码是 $pos$ 处编码的线性变换，模型因此容易学到相对位置关系

## 其他位置编码

| 方式     | 做法                    | 特点                                                                  |
| ------ | --------------------- | ------------------------------------------------------------------- |
| 正弦（固定） | 上面的公式                 | 无需学习，可外推到更长序列的一部分                                                   |
| 可学习    | 每个位置一个可训练向量           | 灵活，但长度受训练最大长度限制（BERT、GPT-2 用）                                       |
| 相对位置   | 在注意力里加入相对距离偏置         | 直接建模相对位置                                                            |
| RoPE   | 对 query/key 做与位置相关的旋转 | 注意力只依赖相对位置，见 [LLaMA](https://github.com/junxnone/aiwiki/issues/504) |

表中：对比结论：固定编码简单，可学习编码灵活，RoPE 等相对位置方法在大语言模型中成为主流。

## Reference

  - [教你直观理解 Position-Encoding](https://www.jianshu.com/p/d4ae714bd363)
  - [transformer的Position
    encoding的总结](https://zhuanlan.zhihu.com/p/95079337)
  - [如何理解Transformer论文中的positional
    encoding，和三角函数有什么关系？](https://www.zhihu.com/question/347678607/answer/864217252)
