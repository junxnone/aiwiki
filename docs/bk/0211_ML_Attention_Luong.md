-----

| Title         | ML Attention Luong                                    |
| ------------- | ----------------------------------------------------- |
| Created @     | `2020-07-01T03:51:29Z`                                |
| Last Modify @ | `2022-12-24T13:30:58Z`                                |
| Labels        | \`\`                                                  |
| Edit @        | [here](https://github.com/junxnone/aiwiki/issues/211) |

-----

# Luong Attention

## Reference

  - [paper - 2014 - Neural Machine Translation by Jointly Learning to
    Align and Translate](https://arxiv.org/abs/1409.0473)
  - [paper - 2015 - Effective Approaches to Attention-based Neural
    Machine Translation](https://arxiv.org/abs/1508.04025)
  - [BahdanauAttention与LuongAttention注意力机制简介](https://blog.csdn.net/u010960155/article/details/82853632)
  - [一文看懂 Bahdanau 和 Luong 两种 Attention
    机制的区别](https://zhuanlan.zhihu.com/p/129316415)

## Brief

| Name             | Pipeline                                                     | 公式                                                                                                                             |
| ---------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Global Attention | ![image](media/b0fc8135a6721543ad3027292b3c7edb71309392.png) | ![image](media/b3aa63a35c51ee85f94304c29283addc3435e264.png) <br> ![image](media/3ca7577ca0af1124c85ca13e110d8414bc331bd7.png) |
| Local Attention  | ![image](media/ae360458c318db8201055e7fbc10a988d04553af.png) | ![image](media/614c59fa2064f2bdb7d938208f9077958e6df6dc.png)                                                                   |

## Alignment Model

## Bahdanau Attention vs Luong Attention

| Name                                                        | Description     | score                                                        |
| ----------------------------------------------------------- | --------------- | ------------------------------------------------------------ |
| Bahdanau Attention [paper](https://arxiv.org/abs/1409.0473) | h(t-1) -\> a(t) |                                                              |
| Luong Attention [paper](https://arxiv.org/abs/1508.04025)   | h(t) -\> a(t)   | ![image](media/24e1b8272e0b0bda0448b4d9f8e4ab3cdd486245.png) |

![image](media/40579fb4c968afc57b0ee3b72303ee3c8ee58716.png)
