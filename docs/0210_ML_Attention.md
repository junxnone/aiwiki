---
Title | ML Attention
-- | --
Created @ | `2020-05-09T03:15:34Z`
Last Modify @| `2022-12-24T13:27:22Z`
Labels | ``
Edit @| [here](https://github.com/junxnone/aiwiki/issues/210)

---
# Attention 注意力

## Reference

- [paper - 2014 - Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473)
- [paper - 2015 - Effective Approaches to Attention-based Neural Machine Translation](https://arxiv.org/abs/1508.04025)
- [Attention注意力机制介绍](https://www.cnblogs.com/hiyoung/p/9860561.html)
- [论文阅读: 图像分类中的注意力机制(attention)](https://blog.csdn.net/Wayne2019/article/details/78488142)
- [Attention机制 - 图像](https://blog.csdn.net/weixin_41923961/article/details/81516589?utm_source=copy)
- [计算机视觉中的注意力机制](https://zhuanlan.zhihu.com/p/32928645)
- [目前主流的attention方法都有哪些？](https://www.zhihu.com/question/68482809)
- [模型汇总24 - 深度学习中Attention Mechanism详细介绍：原理、分类及应用](https://zhuanlan.zhihu.com/p/31547842)
- [attention模型方法综述](https://zhuanlan.zhihu.com/p/37835894)
- [Attention综述](https://zhuanlan.zhihu.com/p/62136754)
- [BahdanauAttention与LuongAttention注意力机制简介](https://blog.csdn.net/u010960155/article/details/82853632)
- [一文看懂 Bahdanau 和 Luong 两种 Attention 机制的区别](https://zhuanlan.zhihu.com/p/129316415)
- [Attention Model（mechanism） 的 套路](https://blog.csdn.net/bvl10101111/article/details/78470716)
- [Attention注意力机制的前世今身](https://blog.csdn.net/c9Yv2cf9I06K2A9E/article/details/107010733)

## Brief
- Vector/Mask
- [Attention Is All You Need](/Attention_Is_All_You_Need)
- [Bahdanau Attention](/Bahdanau_Attention)
- [Luong Attention](/Luong_Attention)


目的
- 减少计算 - 可以减小处理高维输入数据的计算负担，通过结构化的选取输入的子集，降低数据维度
- 优化算法 - 让任务处理系统更专注于找到输入数据中显著的与当前输出相关的有用信息

## 分类

Name | Description
-- | -- 
Location-wise | Object Position
Item-wise  | Seq2Seq / Vector/ Feature Map

Name | Description
-- | -- 
Soft Attention | `sequence` 中 取概率加权和
Hard Attention | `sequence` 中 只有一个取 `1`, 其他取 `0` <br>不可导，不能反向传播<br> `@RL强化学习`

Name | Description
-- | -- 
Self-attention | 
Context-attention | 



## 计算方式 
![image](https://user-images.githubusercontent.com/2216970/86195142-d6140400-bb82-11ea-9458-c4e733b2716d.png)

## 应用
- NLP
- CV
- OCR
 
## History

Year | Name 
-- | --
2014 | [Bahdanau Attention](https://arxiv.org/abs/1409.0473)
2015 | [Luong Attention](https://arxiv.org/abs/1508.04025)
