---
Title | Luong Attention
-- | --
Create Date | `2020-07-01T03:51:29Z`
Update Date | `2022-01-19T11:21:24Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/211)

---
## Reference

- [paper - 2014 - Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473)
- [paper - 2015 - Effective Approaches to Attention-based Neural Machine Translation](https://arxiv.org/abs/1508.04025)
- [BahdanauAttention与LuongAttention注意力机制简介](https://blog.csdn.net/u010960155/article/details/82853632)
- [一文看懂 Bahdanau 和 Luong 两种 Attention 机制的区别](https://zhuanlan.zhihu.com/p/129316415)

## Brief

Name | Pipeline | 公式
-- | -- | --
Global Attention | ![image](https://user-images.githubusercontent.com/2216970/86207842-f901e080-bba1-11ea-8828-88888630461c.png) | ![image](https://user-images.githubusercontent.com/2216970/86207946-2cdd0600-bba2-11ea-926d-5310fd96d626.png) <br> ![image](https://user-images.githubusercontent.com/2216970/86207965-36666e00-bba2-11ea-9c13-3df4d9e67216.png)
Local Attention | ![image](https://user-images.githubusercontent.com/2216970/86207867-06b76600-bba2-11ea-97c1-c11f671babd2.png) | ![image](https://user-images.githubusercontent.com/2216970/86208024-5302a600-bba2-11ea-8f6a-42946e2e1f01.png)

## Alignment Model 

# Bahdanau Attention  vs Luong Attention 

Name | Description | score
-- | --  | --
Bahdanau Attention [paper](https://arxiv.org/abs/1409.0473) | h(t-1) -> a(t) | 
Luong Attention [paper](https://arxiv.org/abs/1508.04025) |  h(t) -> a(t) |![image](https://user-images.githubusercontent.com/2216970/86200698-01e9b680-bb90-11ea-96db-1c0842a01d16.png)


![image](https://user-images.githubusercontent.com/2216970/86115857-192c9380-baff-11ea-8b39-233cce449825.png)
