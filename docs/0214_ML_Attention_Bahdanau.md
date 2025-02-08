---
Title | ML Attention Bahdanau
-- | --
Created @ | `2020-07-01T03:51:29Z`
Updated @| `2025-02-08T01:44:23Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/214)

---
# Bahdanau Attention

- 更好地捕捉长序列依赖 
- 提高模型的可解释性
- 增强模型的泛化能力

## 背景
- 2014 年由 Dzmitry Bahdanau 等人在论文《Neural Machine Translation by Jointly Learning to Align and Translate》中提出，旨在解决机器翻译等序列到序列（seq2seq）模型中存在的长序列信息丢失问题。

?> 传统的 seq2seq 模型中，编码器将输入序列编码成一个固定长度的向量表示，然后解码器根据这个向量生成输出序列。然而，当输入序列较长时，这种固定长度的向量难以捕捉到所有信息，导致翻译等任务的性能下降。




## Arch

Pipeline | 公式
-- | --
![image](https://user-images.githubusercontent.com/2216970/86207477-34e87600-bba1-11ea-8f17-147b2b46cbf7.png) | ![image](https://user-images.githubusercontent.com/2216970/86207539-5b0e1600-bba1-11ea-9943-905966f97cd9.png) <br>![image](https://user-images.githubusercontent.com/2216970/86207556-63fee780-bba1-11ea-9968-192b6de49707.png) <br> ![image](https://user-images.githubusercontent.com/2216970/86207588-711bd680-bba1-11ea-9b23-2e25961d1142.png) <br> ![image](https://user-images.githubusercontent.com/2216970/86207600-77aa4e00-bba1-11ea-8d96-b7080478fdee.png)



## Reference

- [paper - 2014 - Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473)
- [paper - 2015 - Effective Approaches to Attention-based Neural Machine Translation](https://arxiv.org/abs/1508.04025)
- [BahdanauAttention与LuongAttention注意力机制简介](https://blog.csdn.net/u010960155/article/details/82853632)
- [一文看懂 Bahdanau 和 Luong 两种 Attention 机制的区别](https://zhuanlan.zhihu.com/p/129316415)


