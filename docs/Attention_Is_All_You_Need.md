---
Title | Attention Is All You Need
-- | --
Create Date | `2020-05-09T02:39:37Z`
Update Date | `2022-01-19T11:21:34Z`
Edit link | [here](https://github.com/junxnone/aiwiki/issues/212)

---
## Reference
- [paper - 2017 - Attention Is All You Need](https://arxiv.org/pdf/1706.03762.pdf)
- [The Illustrated Transformer](http://jalammar.github.io/illustrated-transformer/)
- [解析Transformer模型](https://mp.weixin.qq.com/s/kjLFPyTb7pal7oorX3ejkw)
- [position_encoding](https://github.com/tensorflow/examples/blob/master/community/en/position_encoding.ipynb)
- [transformer jupyter notebook - tensorflow](https://github.com/tensorflow/docs/blob/master/site/en/tutorials/text/transformer.ipynb)


## Brief
- 堆叠 Encoders-Decoders
  -  do not share weight
- 并行计算
- Attention
  - Self-attention
  - Multi-Head Attention
- Feed Forward
- [Position Encoding](/Position_Encoding)

## Arch

![image](https://user-images.githubusercontent.com/2216970/106077575-c1b1dd00-614c-11eb-9801-1908bf51aa3b.png) | ![image](https://user-images.githubusercontent.com/2216970/106077653-e27a3280-614c-11eb-9751-0058cbefabd9.png) 
-- | --
~ |  ![image](https://user-images.githubusercontent.com/2216970/81461947-d7a7f800-91e1-11ea-9cf6-d9f6bb408517.png)

### Encoder

Encoder | Self-Attention
-- | --
![image](https://user-images.githubusercontent.com/2216970/105963885-7cde6580-60bc-11eb-8c30-c9dbfbd24197.png) | ![image](https://user-images.githubusercontent.com/2216970/106080333-ce84ff80-6151-11eb-8c99-2dfaf5c057c2.png)

#### Self-Attention

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

