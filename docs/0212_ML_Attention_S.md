---
Title | ML Attention S
-- | --
Created @ | `2020-05-09T02:39:37Z`
Updated @| `2025-02-08T06:26:04Z`
Labels | `index`
Edit @| [here](https://github.com/junxnone/aiwiki/issues/212)

---
# Attention Is All You Need


- 堆叠 Encoders-Decoders(不共享权重)
- 并行计算
- Attention
  - Self-attention
  - Multi-Head Attention
- Feed Forward
- [Position Encoding](/0213_ML_Attention_PE)

## Arch

![image](https://user-images.githubusercontent.com/2216970/106077575-c1b1dd00-614c-11eb-9801-1908bf51aa3b.png) | ![image](https://user-images.githubusercontent.com/2216970/106077653-e27a3280-614c-11eb-9751-0058cbefabd9.png) 
-- | --
~ |  ![image](https://user-images.githubusercontent.com/2216970/81461947-d7a7f800-91e1-11ea-9cf6-d9f6bb408517.png)

### Encoder

- 编码器由多个相同结构的编码器层堆叠而成，每个编码器层包含自注意力层和前馈神经网络层。

Encoder | Self-Attention
-- | --
![image](https://user-images.githubusercontent.com/2216970/105963885-7cde6580-60bc-11eb-8c30-c9dbfbd24197.png) | ![image](https://user-images.githubusercontent.com/2216970/106080333-ce84ff80-6151-11eb-8c99-2dfaf5c057c2.png)

#### Self-Attention
- 自注意力机制是 Transformer 的核心，它允许模型在编码每个单词时关注输入序列中的其他单词，从而提高模型的性能。自注意力机制通过计算查询向量、键向量和值向量之间的点积来确定每个单词的注意力权重，然后对值向量进行加权求和得到输出。


Steps | Description | Figure 
--- | -- | -- 
1 | Queries & Keys & Values |  ![image](https://user-images.githubusercontent.com/2216970/106080866-dabd8c80-6152-11eb-9ee9-303e7aacdbe7.png) 
2 | Calculate score | ![image](https://user-images.githubusercontent.com/2216970/106080912-f0cb4d00-6152-11eb-8b40-34f370a25772.png)
3  | Divide by 8 `= 64^1/2`  <br>more stable gradients |  ![image](https://user-images.githubusercontent.com/2216970/106081170-6505f080-6153-11eb-9cf6-8021b1e84100.png)
4 | Softmax  | 同上
5 |  `Score x Values` |  ![image](https://user-images.githubusercontent.com/2216970/106082015-e8741180-6154-11eb-8b62-13768d27291e.png)
6 |  + weighted value vectors | 同上 

**Matrix Calculation**
![image](https://user-images.githubusercontent.com/2216970/106255109-8bf81b80-6254-11eb-9d1d-70af1ec9c256.png)

![image](https://user-images.githubusercontent.com/2216970/106255072-7da9ff80-6254-11eb-8c7e-1aee3205c716.png) |  ![image](https://user-images.githubusercontent.com/2216970/106083509-9680bb00-6157-11eb-88b0-08d7f202d8cf.png) | ![image](https://user-images.githubusercontent.com/2216970/106083592-b7491080-6157-11eb-8fa2-4f2cb286baa7.png)
-- | -- | --

#### MultiHead-Attention
- N 个 `Self-Attention` 合并
- 多头注意力机制是对自注意力机制的进一步改进，它通过使用多个不同的查询、键和值矩阵，提高了模型的注意力能力和表示能力。多头注意力机制将多个自注意力输出进行拼接，然后通过一个额外的权重矩阵进行线性变换，得到最终的输出。

![image](https://user-images.githubusercontent.com/2216970/106083990-61c13380-6158-11eb-8495-3a5905863bc1.png) | ![image](https://user-images.githubusercontent.com/2216970/106420747-3dd25a80-6496-11eb-84b3-0968b8a0fe0a.png)
-- | --


**Head 1 vs 2 vs 8**

Head-1 | Head-2 | Head-8
-- | -- | --
![image](https://user-images.githubusercontent.com/2216970/106080333-ce84ff80-6151-11eb-8c99-2dfaf5c057c2.png) |  ![image](https://user-images.githubusercontent.com/2216970/106084134-afd63700-6158-11eb-960b-8cc3bc09fe28.png) | ![image](https://user-images.githubusercontent.com/2216970/106084251-f2980f00-6158-11eb-8622-4d1d18d0c351.png)


**Matrix Calculation**

Calculate Q/K/V | ![image](https://user-images.githubusercontent.com/2216970/106083787-0e4ee580-6158-11eb-8d77-0ef7f9ae1888.png) 
-- | --
Calculate Z | ![image](https://user-images.githubusercontent.com/2216970/106083796-1149d600-6158-11eb-8a09-8697ed93661a.png) 
Concatenate Z | ![image](https://user-images.githubusercontent.com/2216970/106083802-160e8a00-6158-11eb-8149-7334befaba04.png)

#### Feed Forward
- `Dense` --> ` RELU` --> `Dense`

#### Positional Encoding
- 使用正弦函数和余弦函数来构造每个位置的值
- 可以在测试阶段接受长度超过训练集实例的情况
![image](https://user-images.githubusercontent.com/2216970/106259242-eba4f580-6259-11eb-937f-2ccfb83c4744.png)


## 存在问题
- 复杂度 O(n^2), 需要计算量大


## Reference
- [paper - 2017 - Attention Is All You Need](https://arxiv.org/pdf/1706.03762.pdf)
- [The Illustrated Transformer](http://jalammar.github.io/illustrated-transformer/)
- [解析Transformer模型](https://mp.weixin.qq.com/s/kjLFPyTb7pal7oorX3ejkw)
- [position_encoding](https://github.com/tensorflow/examples/blob/master/community/en/position_encoding.ipynb)
- [transformer jupyter notebook - tensorflow](https://github.com/tensorflow/docs/blob/master/site/en/tutorials/text/transformer.ipynb)



